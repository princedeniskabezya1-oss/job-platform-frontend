(() => {
  "use strict";

  const API = window.API_BASE || "https://backend-1-9b6f.onrender.com";
  const ops = {
    users:[],
    reviews:[],
    rooms:[],
    ventures:[],
    loadedAt:0,
    loading:false,
    roomSearch:"",
    roomFilter:"all"
  };

  const OPEN_REVIEW = new Set([
    "submitted",
    "under_review",
    "information_requested",
    "matched",
    "negotiation"
  ]);

  function token(){
    return localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
  }

  function esc(value){
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function title(value){
    return String(value || "")
      .replaceAll("_"," ")
      .replaceAll("-"," ")
      .replace(/\b\w/g,letter => letter.toUpperCase());
  }

  function id(value){
    return String(value?._id || value?.id || value || "");
  }

  function displayName(user){
    return user?.companyName || user?.schoolName || user?.name || user?.email || "AIFT member";
  }

  function fmt(value){
    if(!value) return "—";
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString([],{
      year:"numeric",
      month:"short",
      day:"numeric",
      hour:"2-digit",
      minute:"2-digit"
    });
  }

  function compactDate(value){
    if(!value) return "—";
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString([],{
      year:"numeric",
      month:"short",
      day:"numeric"
    });
  }

  function svg(path){
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  }

  const ICONS = {
    career:svg('<path d="M4 20V10"></path><path d="M10 20V4"></path><path d="M16 20v-7"></path><path d="M22 20H2"></path>'),
    rooms:svg('<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M7 8h10M7 12h6M7 16h4"></path>'),
    family:svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>'),
    review:svg('<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>')
  };

  async function request(path,options={}){
    if(typeof window.adminRequest === "function"){
      return window.adminRequest(path,options);
    }

    const response = await fetch(API + path,{
      ...options,
      headers:{
        Authorization:`Bearer ${token()}`,
        ...(options.body?{"Content-Type":"application/json"}:{}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  }

  function extractArray(data,key){
    if(Array.isArray(data)) return data;
    if(Array.isArray(data?.[key])) return data[key];
    if(Array.isArray(data?.data)) return data.data;
    return [];
  }

  function hasFamilyProfile(user){
    const profile = user?.familyProfile;
    if(!profile || typeof profile !== "object") return false;
    return Boolean(
      profile.investorEnabled ||
      profile.onboardingCompleted ||
      profile.investorProfileCompleted ||
      profile.relationshipType ||
      profile.preferredLocation ||
      (Array.isArray(profile.educationPriorities) && profile.educationPriorities.length) ||
      (Array.isArray(profile.investmentInterests) && profile.investmentInterests.length)
    );
  }

  async function loadOps(force=false){
    if(ops.loading) return ops;
    if(!force && ops.loadedAt && Date.now() - ops.loadedAt < 15000) return ops;
    ops.loading = true;

    try{
      const [usersData,reviewsData,roomsData,venturesData] = await Promise.all([
        request("/api/users").catch(()=>[]),
        request("/api/review-cases/admin").catch(()=>({cases:[]})),
        request("/api/deal-rooms/mine").catch(()=>({rooms:[]})),
        request("/api/ventures?limit=50").catch(()=>({ventures:[]}))
      ]);

      ops.users = extractArray(usersData,"users");
      ops.reviews = extractArray(reviewsData,"cases");
      ops.rooms = extractArray(roomsData,"rooms");
      ops.ventures = extractArray(venturesData,"ventures");
      ops.loadedAt = Date.now();
      updateBadges();
      renderOperationsStrip();
      renderOverviewQueue();
      return ops;
    }finally{
      ops.loading = false;
    }
  }

  function familyUsers(){
    return ops.users.filter(hasFamilyProfile);
  }

  function investorUsers(){
    return ops.users.filter(user => user?.familyProfile?.investorEnabled === true);
  }

  function reviewOpenCases(){
    return ops.reviews.filter(item => OPEN_REVIEW.has(String(item.status || "")));
  }

  function roomAction(room){
    if(room.status === "completed"){
      return {key:"complete",priority:"normal",label:"Completed",detail:"This Deal Room has a published completed outcome."};
    }
    if(room.status === "closed"){
      return {key:"closed",priority:"normal",label:"Closed",detail:"This Deal Room is closed."};
    }

    const documentRequests = Array.isArray(room.documentRequests) ? room.documentRequests : [];
    const meetings = Array.isArray(room.meetings) ? room.meetings : [];
    const decisions = Array.isArray(room.decisions) ? room.decisions : [];
    const finalStatus = String(room.finalOutcome?.status || "pending");

    const submittedDocuments = documentRequests.filter(item => item.status === "submitted");
    if(submittedDocuments.length){
      return {
        key:"document_review",
        priority:"urgent",
        label:`Review ${submittedDocuments.length} submitted document${submittedDocuments.length===1?"":"s"}`,
        detail:"Requested files are private to AIFT until you review them and grant counterparty access."
      };
    }

    const replacement = documentRequests.filter(item => item.status === "needs_replacement");
    if(replacement.length){
      return {
        key:"replacement",
        priority:"high",
        label:"Waiting for replacement files",
        detail:`${replacement.length} document request${replacement.length===1?" needs":"s need"} replacement.`
      };
    }

    const acceptedRequest = meetings.find(item => item.status === "counterparty_accepted" || item.status === "accepted");
    if(acceptedRequest){
      return {
        key:"schedule_meeting",
        priority:"urgent",
        label:"Approve & schedule meeting",
        detail:"Both parties agreed to meet. AIFT must choose the official time and provide the join link."
      };
    }

    const scheduled = meetings.find(item => item.status === "scheduled");
    if(scheduled){
      const start = new Date(scheduled.startAt || 0);
      const isPast = !Number.isNaN(start.getTime()) && start.getTime() <= Date.now();
      return {
        key:"scheduled_meeting",
        priority:isPast?"urgent":"high",
        label:isPast?"Confirm meeting outcome":"Meeting scheduled",
        detail:isPast?"The scheduled meeting time has passed. Only AIFT can mark it completed.":`Scheduled for ${fmt(scheduled.startAt)}.`
      };
    }

    const completedMeeting = meetings.find(item => item.status === "completed");
    if(completedMeeting && !room.decisionUnlocked){
      return {
        key:"unlock_decision",
        priority:"urgent",
        label:"Review & unlock decision",
        detail:"Meeting is complete. Review the room before allowing both parties to submit final decisions."
      };
    }

    if(room.decisionUnlocked && finalStatus === "pending"){
      if(decisions.length >= 2){
        return {
          key:"publish_outcome",
          priority:"urgent",
          label:"Publish final AIFT result",
          detail:"Both parties submitted decisions. AIFT should review them and publish the official result."
        };
      }
      return {
        key:"waiting_decisions",
        priority:"high",
        label:"Decision stage open",
        detail:`${decisions.length}/2 participant decisions submitted.`
      };
    }

    const requested = documentRequests.filter(item => item.status === "requested");
    if(requested.length){
      return {
        key:"waiting_documents",
        priority:"normal",
        label:"Waiting for requested documents",
        detail:`${requested.length} document request${requested.length===1?" is":"s are"} still awaiting submission.`
      };
    }

    return {
      key:"review",
      priority:"normal",
      label:"Participant review",
      detail:"Review who the parties are, update internal review items, and request only the evidence AIFT needs."
    };
  }

  function roomCounts(){
    const counts = {
      active:0,
      documentReview:0,
      meetingApproval:0,
      finalDecision:0
    };
    ops.rooms.forEach(room => {
      if(room.status === "negotiation") counts.active += 1;
      const action = roomAction(room);
      if(action.key === "document_review") counts.documentReview += 1;
      if(action.key === "schedule_meeting" || action.key === "scheduled_meeting") counts.meetingApproval += 1;
      if(action.key === "unlock_decision" || action.key === "publish_outcome") counts.finalDecision += 1;
    });
    return counts;
  }

  function actionQueue(){
    const actions = [];

    reviewOpenCases().forEach(item => {
      if(item.status === "negotiation") return;
      actions.push({
        type:"review",
        id:item._id,
        priority:["urgent","high"].includes(item.priority) ? "urgent" : (item.status === "information_requested" ? "high" : "normal"),
        label:item.status === "matched" && item.type === "investment_interest" ? "Open matched investment Deal Room" : `Review ${title(item.type)}`,
        detail:`${item.caseNumber || "AIFT case"} · ${item.title || "Review case"} · ${title(item.status)}`,
        meta:`Submitted ${fmt(item.createdAt)}`
      });
    });

    ops.rooms.forEach(room => {
      const action = roomAction(room);
      if(["complete","closed","waiting_documents","waiting_decisions","review"].includes(action.key)) return;
      actions.push({
        type:"room",
        id:room._id,
        priority:action.priority,
        label:action.label,
        detail:`${room.ventureId?.title || "Venture Deal Room"} · ${action.detail}`,
        meta:room.reviewCaseId?.caseNumber || `Deal Room ${String(room._id || "").slice(-6)}`
      });
    });

    const rank = {urgent:0,high:1,normal:2};
    return actions.sort((a,b)=>(rank[a.priority]??2)-(rank[b.priority]??2)).slice(0,14);
  }

  function navButton(section,label,icon,badgeId=""){
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.section = section;
    button.innerHTML = `${icon}<span>${label}</span>${badgeId?`<span id="${badgeId}" class="acc-nav-badge">0</span>`:""}`;
    button.addEventListener("click",()=>window.switchAdminSection?.(section,button));
    return button;
  }

  function ensureSections(){
    const host = document.getElementById("adminContent");
    if(!host) return;

    const definitions = [
      ["careerHubSection","Career Hub Management"],
      ["dealRoomsSection","AIFT Deal Rooms"],
      ["familySection","Family & Investor Management"]
    ];

    definitions.forEach(([sectionId,label]) => {
      if(document.getElementById(sectionId)) return;
      const section = document.createElement("section");
      section.id = sectionId;
      section.className = "admin-section hidden";
      section.setAttribute("aria-label",label);
      host.appendChild(section);
    });

    try{
      if(typeof ADMIN_SECTIONS !== "undefined"){
        ADMIN_SECTIONS.careerHub = {
          title:"Career Hub",
          subtitle:"Manage Ventures, sensitive reviews, investment introductions, and Career Hub activity.",
          loader:"loadCareerHubAdmin"
        };
        ADMIN_SECTIONS.dealRooms = {
          title:"Deal Rooms",
          subtitle:"Review documents, control meetings, unlock decisions, and publish official AIFT outcomes.",
          loader:"loadDealRoomAdmin"
        };
        ADMIN_SECTIONS.family = {
          title:"Family & Investors",
          subtitle:"Monitor Family Advantage onboarding and Investor Mode accounts without mixing them into general users.",
          loader:"loadFamilyAdmin"
        };
      }
    }catch(error){
      console.warn("Could not extend admin section map",error);
    }
  }

  function ensureCustomNav(){
    const nav = document.querySelector(".admin-nav");
    if(!nav) return;

    if(!nav.querySelector('[data-section="careerHub"]')){
      nav.appendChild(navButton("careerHub","Career Hub",ICONS.career,"accCareerBadge"));
    }
    if(!nav.querySelector('[data-section="dealRooms"]')){
      nav.appendChild(navButton("dealRooms","Deal Rooms",ICONS.rooms,"accDealRoomBadge"));
    }
    if(!nav.querySelector('[data-section="family"]')){
      nav.appendChild(navButton("family","Family & Investors",ICONS.family,"accFamilyBadge"));
    }
  }

  function organizeSidebar(){
    const nav = document.querySelector(".admin-nav");
    if(!nav || nav.dataset.accOrganized === "1") return;

    ensureCustomNav();

    const reviewButton = document.getElementById("aiftReviewCenterNav");
    const find = section => nav.querySelector(`[data-section="${section}"]`);

    const groups = [
      {
        title:"Command Center",
        items:[find("overview"),reviewButton,find("careerHub"),find("dealRooms")]
      },
      {
        title:"People & Access",
        items:[find("users"),find("verification"),find("family")]
      },
      {
        title:"Marketplace & Learning",
        items:[find("jobs"),find("applications"),find("schools"),find("content")]
      },
      {
        title:"Operations",
        items:[find("meetings"),find("reports"),find("payments")]
      },
      {
        title:"System",
        items:[find("settings"),find("audit")]
      }
    ];

    nav.innerHTML = "";
    groups.forEach(group => {
      const items = group.items.filter(Boolean);
      if(!items.length) return;
      const wrapper = document.createElement("section");
      wrapper.className = "admin-nav-group";
      const heading = document.createElement("div");
      heading.className = "admin-nav-group-title";
      heading.textContent = group.title;
      const body = document.createElement("div");
      body.className = "admin-nav-group-body";
      items.forEach(item => body.appendChild(item));
      wrapper.append(heading,body);
      nav.appendChild(wrapper);
    });
    nav.dataset.accOrganized = "1";
  }

  function ensureOperationsStrip(){
    if(document.getElementById("accOperationsStrip")) return;
    const topbar = document.querySelector(".admin-topbar");
    if(!topbar) return;
    const strip = document.createElement("section");
    strip.id = "accOperationsStrip";
    strip.className = "acc-operations-strip";
    strip.setAttribute("aria-label","Admin operations status");
    topbar.insertAdjacentElement("afterend",strip);
    strip.addEventListener("click",event => {
      if(event.target.closest("[data-acc-refresh]")) refreshCommandCenter();
    });
  }

  function renderOperationsStrip(){
    const strip = document.getElementById("accOperationsStrip");
    if(!strip) return;
    const rooms = roomCounts();
    const openReviews = reviewOpenCases().filter(item => item.status !== "negotiation").length;
    const familyInvestors = investorUsers().length;
    strip.innerHTML = `
      <div class="acc-strip-item"><span>Admin attention</span><strong>${actionQueue().filter(item=>item.priority==="urgent").length}</strong></div>
      <div class="acc-strip-item"><span>Open reviews</span><strong>${openReviews}</strong></div>
      <div class="acc-strip-item"><span>Active Deal Rooms</span><strong>${rooms.active}</strong></div>
      <div class="acc-strip-item"><span>Documents to review</span><strong>${rooms.documentReview}</strong></div>
      <div class="acc-strip-item"><span>Investor Mode</span><strong>${familyInvestors}</strong></div>
      <button type="button" class="acc-strip-refresh" data-acc-refresh title="Refresh command center">↻</button>
    `;
  }

  function updateBadges(){
    const rooms = roomCounts();
    const dealBadge = document.getElementById("accDealRoomBadge");
    const familyBadge = document.getElementById("accFamilyBadge");
    const careerBadge = document.getElementById("accCareerBadge");

    const roomAttention = rooms.documentReview + rooms.meetingApproval + rooms.finalDecision;
    if(dealBadge){dealBadge.textContent=String(roomAttention);dealBadge.classList.toggle("attention",roomAttention>0);}
    if(familyBadge){familyBadge.textContent=String(investorUsers().length);familyBadge.classList.toggle("attention",false);}
    const careerAttention = reviewOpenCases().filter(item => item.status !== "negotiation").length;
    if(careerBadge){careerBadge.textContent=String(careerAttention);careerBadge.classList.toggle("attention",careerAttention>0);}
  }

  function ensureOverviewQueue(){
    if(document.getElementById("accOverviewQueue")) return;
    const overview = document.getElementById("overviewSection");
    const stats = document.getElementById("overviewStatsGrid");
    if(!overview || !stats) return;
    const panel = document.createElement("article");
    panel.id = "accOverviewQueue";
    panel.className = "acc-panel acc-overview-queue";
    stats.insertAdjacentElement("afterend",panel);
  }

  function queueHtml(items,limit=8){
    if(!items.length){
      return `<div class="acc-empty"><strong>No urgent controlled actions</strong>AIFT has no pending sensitive workflow action in the current queue.</div>`;
    }
    return `<div class="acc-action-list">${items.slice(0,limit).map(item => `
      <div class="acc-action ${esc(item.priority)}">
        <div class="acc-action-icon">${item.type === "room" ? "DR" : "R"}</div>
        <div class="acc-action-copy">
          <strong>${esc(item.label)}</strong>
          <span>${esc(item.detail)}</span>
          <div class="acc-action-meta">${esc(item.meta || "")}</div>
        </div>
        <button type="button" class="acc-btn ${item.priority==="urgent"?"primary":""}" data-acc-action-type="${esc(item.type)}" data-acc-action-id="${esc(item.id)}">Review</button>
      </div>`).join("")}</div>`;
  }

  function renderOverviewQueue(){
    ensureOverviewQueue();
    const box = document.getElementById("accOverviewQueue");
    if(!box) return;
    const items = actionQueue();
    box.innerHTML = `
      <div class="acc-panel-head">
        <div><h3>AIFT Action Queue</h3><p>Sensitive work is ordered by what needs an admin decision first.</p></div>
        <button type="button" class="acc-btn" data-acc-open="dealRooms">Deal Rooms</button>
      </div>
      <div class="acc-panel-body">${queueHtml(items,8)}</div>`;
  }

  function statusClass(value){
    const text = String(value || "");
    if(["completed","active","accepted","satisfied","approved_to_proceed"].includes(text)) return "good";
    if(["submitted","counterparty_accepted","requested","in_review","information_requested"].includes(text)) return "warn";
    if(["needs_attention","needs_replacement","declined","rejected"].includes(text)) return "bad";
    if(["scheduled","decision"].includes(text)) return "purple";
    return "";
  }

  function renderCareerHub(){
    const section = document.getElementById("careerHubSection");
    if(!section) return;

    const openReviews = reviewOpenCases().filter(item => item.status !== "negotiation");
    const activeVentures = ops.ventures.filter(item => item.status === "active");
    const rooms = roomCounts();
    const actions = actionQueue();

    section.innerHTML = `
      <div class="acc-section-hero">
        <div class="acc-eyebrow">Career Hub Operations</div>
        <h2>One place for trust, opportunities and investment workflows</h2>
        <p>Review Ventures and sensitive introductions before they progress. Deal Room controls stay separate so AIFT can review documents, meetings and final outcomes without mixing them into general user administration.</p>
      </div>

      <div class="acc-kpis">
        <div class="acc-kpi"><div class="acc-kpi-icon">V</div><strong>${activeVentures.length}</strong><span>Visible Ventures</span><small>Current public Career Hub Ventures loaded</small></div>
        <div class="acc-kpi warn"><div class="acc-kpi-icon">R</div><strong>${openReviews.length}</strong><span>Review cases</span><small>Cases needing a controlled admin stage</small></div>
        <div class="acc-kpi purple"><div class="acc-kpi-icon">DR</div><strong>${rooms.active}</strong><span>Active Deal Rooms</span><small>${rooms.documentReview + rooms.meetingApproval + rooms.finalDecision} need AIFT attention</small></div>
        <div class="acc-kpi good"><div class="acc-kpi-icon">I</div><strong>${investorUsers().length}</strong><span>Investor Mode accounts</span><small>Family profiles with Investor Mode enabled</small></div>
      </div>

      <div class="acc-grid-2">
        <article class="acc-panel">
          <div class="acc-panel-head"><div><h3>Priority Career Hub actions</h3><p>Review these before routine administration.</p></div><button class="acc-btn" type="button" data-acc-review-center>Open Review Center</button></div>
          <div class="acc-panel-body">${queueHtml(actions,10)}</div>
        </article>

        <article class="acc-panel">
          <div class="acc-panel-head"><div><h3>Career Hub areas</h3><p>Keep related work grouped by purpose.</p></div></div>
          <div class="acc-panel-body">
            <div class="acc-quick-grid">
              <button class="acc-quick-card" type="button" data-acc-review-center><strong>Trust & Review</strong><span>Venture publishing, investment interests, verification and sensitive approvals.</span></button>
              <button class="acc-quick-card" type="button" data-acc-open="dealRooms"><strong>Deal Rooms</strong><span>Documents, controlled meetings, decisions and official outcomes.</span></button>
              <button class="acc-quick-card" type="button" data-acc-open="family"><strong>Family & Investors</strong><span>Investor Mode accounts and Family Advantage readiness.</span></button>
              <button class="acc-quick-card" type="button" data-acc-open="applications"><strong>Applications</strong><span>Job and internship application management.</span></button>
              <button class="acc-quick-card" type="button" data-acc-open="schools"><strong>Education</strong><span>Schools, students, classes and scholarship-related operations.</span></button>
              <button class="acc-quick-card" type="button" data-acc-open="reports"><strong>Trust & Safety</strong><span>Reports, support issues and moderation escalations.</span></button>
            </div>
          </div>
        </article>
      </div>

      <article class="acc-panel">
        <div class="acc-panel-head"><div><h3>Recent active Ventures</h3><p>Public Ventures are shown here for operational visibility. Publishing approval remains in Review Center.</p></div><button class="acc-btn" type="button" onclick="window.open('venture.html','_blank')">Open Career Hub</button></div>
        <div class="acc-table-wrap">
          ${activeVentures.length ? `<table class="acc-table"><thead><tr><th>Venture</th><th>Owner</th><th>Stage</th><th>Industry</th><th>Investment</th><th>Created</th></tr></thead><tbody>${activeVentures.slice(0,20).map(venture=>`<tr><td><strong>${esc(venture.title||"Venture")}</strong><small>${esc(venture.ventureType||"")}</small></td><td>${esc(displayName(venture.ownerId))}</td><td><span class="acc-status">${esc(title(venture.stage||"—"))}</span></td><td>${esc(venture.industry||"—")}</td><td><span class="acc-status ${venture.seekingInvestment?"good":""}">${venture.seekingInvestment?"Seeking":"Not seeking"}</span></td><td>${esc(compactDate(venture.createdAt))}</td></tr>`).join("")}</tbody></table>` : `<div class="acc-empty"><strong>No active Ventures loaded</strong>Career Hub Ventures will appear here when they are active and visible.</div>`}
        </div>
      </article>`;
  }

  function filteredRooms(){
    const search = ops.roomSearch.trim().toLowerCase();
    return ops.rooms.filter(room => {
      const action = roomAction(room);
      if(ops.roomFilter !== "all" && action.key !== ops.roomFilter) return false;
      if(!search) return true;
      const text = [
        room.ventureId?.title,
        displayName(room.ownerId),
        displayName(room.investorId),
        room.reviewCaseId?.caseNumber,
        room.status,
        room.workflowStage,
        action.label
      ].join(" ").toLowerCase();
      return text.includes(search);
    });
  }

  function renderDealRooms(){
    const section = document.getElementById("dealRoomsSection");
    if(!section) return;
    const counts = roomCounts();
    const rooms = filteredRooms();

    section.innerHTML = `
      <div class="acc-section-hero">
        <div class="acc-eyebrow">AIFT Controlled Deal Rooms</div>
        <h2>Admin control should always show the next safe action</h2>
        <p>Participants can request and respond. AIFT reviews private documents, approves and schedules meetings, marks meetings complete, unlocks the decision stage and publishes the official result.</p>
      </div>

      <div class="acc-kpis">
        <div class="acc-kpi"><div class="acc-kpi-icon">DR</div><strong>${counts.active}</strong><span>Active rooms</span><small>Open controlled workspaces</small></div>
        <div class="acc-kpi warn"><div class="acc-kpi-icon">F</div><strong>${counts.documentReview}</strong><span>Files to review</span><small>Private submissions waiting for AIFT</small></div>
        <div class="acc-kpi purple"><div class="acc-kpi-icon">M</div><strong>${counts.meetingApproval}</strong><span>Meeting actions</span><small>Scheduling or completion attention</small></div>
        <div class="acc-kpi good"><div class="acc-kpi-icon">D</div><strong>${counts.finalDecision}</strong><span>Decision actions</span><small>Unlock or publish final result</small></div>
      </div>

      <div class="admin-filter-bar">
        <input id="accRoomSearch" type="search" placeholder="Search Venture, investor, owner or case number" value="${esc(ops.roomSearch)}">
        <select id="accRoomFilter">
          <option value="all" ${ops.roomFilter==="all"?"selected":""}>All Deal Rooms</option>
          <option value="document_review" ${ops.roomFilter==="document_review"?"selected":""}>Documents to review</option>
          <option value="schedule_meeting" ${ops.roomFilter==="schedule_meeting"?"selected":""}>Meeting approval</option>
          <option value="scheduled_meeting" ${ops.roomFilter==="scheduled_meeting"?"selected":""}>Scheduled meeting</option>
          <option value="unlock_decision" ${ops.roomFilter==="unlock_decision"?"selected":""}>Unlock decision</option>
          <option value="publish_outcome" ${ops.roomFilter==="publish_outcome"?"selected":""}>Publish outcome</option>
          <option value="waiting_documents" ${ops.roomFilter==="waiting_documents"?"selected":""}>Waiting documents</option>
          <option value="review" ${ops.roomFilter==="review"?"selected":""}>Participant review</option>
        </select>
        <button type="button" class="admin-btn" data-acc-refresh>Refresh</button>
      </div>

      <article class="acc-panel">
        <div class="acc-panel-head"><div><h3>Deal Room review queue</h3><p>${rooms.length} room${rooms.length===1?"":"s"} match the current view.</p></div></div>
        <div class="acc-panel-body">
          <div class="acc-card-list">
            ${rooms.length ? rooms.map(room => {
              const action = roomAction(room);
              const docs = Array.isArray(room.documentRequests)?room.documentRequests:[];
              const meetings = Array.isArray(room.meetings)?room.meetings:[];
              const decisions = Array.isArray(room.decisions)?room.decisions:[];
              return `<div class="acc-room-card">
                <div class="acc-room-top">
                  <div class="acc-room-title"><strong>${esc(room.ventureId?.title || "Venture Deal Room")}</strong><span>${esc(room.reviewCaseId?.caseNumber || "AIFT Deal Room")} · ${esc(displayName(room.ownerId))} ↔ ${esc(displayName(room.investorId))}</span></div>
                  <span class="acc-status ${statusClass(room.workflowStage)}">${esc(title(room.workflowStage||room.status))}</span>
                </div>
                <div class="acc-room-meta">
                  <div><span>Requested files</span><strong>${docs.length} total · ${docs.filter(x=>x.status==="submitted").length} to review</strong></div>
                  <div><span>Meetings</span><strong>${meetings.length} · ${meetings.filter(x=>x.status==="scheduled").length} scheduled</strong></div>
                  <div><span>Decisions</span><strong>${decisions.length}/2 · ${room.decisionUnlocked?"Unlocked":"Locked"}</strong></div>
                </div>
                <div class="acc-action ${esc(action.priority)}" style="margin-top:9px">
                  <div class="acc-action-icon">→</div>
                  <div class="acc-action-copy"><strong>${esc(action.label)}</strong><span>${esc(action.detail)}</span></div>
                  <button class="acc-btn ${action.priority==="urgent"?"primary":""}" type="button" data-acc-room="${esc(room._id)}">Open Control Room</button>
                </div>
              </div>`;
            }).join("") : `<div class="acc-empty"><strong>No Deal Rooms matched</strong>Change the filter or wait for a matched investment introduction to enter a Deal Room.</div>`}
          </div>
        </div>
      </article>`;

    section.querySelector("#accRoomSearch")?.addEventListener("input",event=>{
      ops.roomSearch = event.target.value;
      renderDealRooms();
      const input = document.getElementById("accRoomSearch");
      if(input){input.focus();input.setSelectionRange(input.value.length,input.value.length);}
    });
    section.querySelector("#accRoomFilter")?.addEventListener("change",event=>{
      ops.roomFilter = event.target.value;
      renderDealRooms();
    });
  }

  function renderFamily(){
    const section = document.getElementById("familySection");
    if(!section) return;
    const families = familyUsers();
    const investors = investorUsers();
    const onboardingPending = families.filter(user => user.familyProfile?.onboardingCompleted !== true).length;
    const investorIncomplete = investors.filter(user => user.familyProfile?.investorProfileCompleted !== true).length;

    section.innerHTML = `
      <div class="acc-section-hero">
        <div class="acc-eyebrow">Family Advantage & Investor Mode</div>
        <h2>Keep Family and Investor operations separate from the general user list</h2>
        <p>This view is for operational readiness: Family Advantage onboarding, Investor Mode activation and investor profile completion. Verification and sensitive approvals still belong in AIFT Review Center.</p>
      </div>

      <div class="acc-kpis">
        <div class="acc-kpi"><div class="acc-kpi-icon">F</div><strong>${families.length}</strong><span>Family profiles</span><small>Accounts with Family Advantage profile activity</small></div>
        <div class="acc-kpi good"><div class="acc-kpi-icon">I</div><strong>${investors.length}</strong><span>Investor Mode</span><small>Accounts currently enabled for investor discovery</small></div>
        <div class="acc-kpi warn"><div class="acc-kpi-icon">O</div><strong>${onboardingPending}</strong><span>Onboarding incomplete</span><small>Family profiles still being set up</small></div>
        <div class="acc-kpi purple"><div class="acc-kpi-icon">P</div><strong>${investorIncomplete}</strong><span>Investor profiles incomplete</span><small>Investor Mode accounts needing profile completion</small></div>
      </div>

      <div class="acc-grid-2">
        <article class="acc-panel">
          <div class="acc-panel-head"><div><h3>Family & Investor accounts</h3><p>Use View User for account-level controls. Do not approve investment activity from here.</p></div></div>
          <div class="acc-table-wrap">
            ${families.length ? `<table class="acc-table"><thead><tr><th>Account</th><th>Primary role</th><th>Relationship</th><th>Investor Mode</th><th>Profile</th><th></th></tr></thead><tbody>${families.map(user=>`<tr><td><strong>${esc(displayName(user))}</strong><small>${esc(user.email||"")}</small></td><td>${esc(title(user.role||"member"))}</td><td>${esc(title(user.familyProfile?.relationshipType||"Not set"))}</td><td><span class="acc-status ${user.familyProfile?.investorEnabled?"good":""}">${user.familyProfile?.investorEnabled?"Enabled":"Off"}</span></td><td><span class="acc-status ${user.familyProfile?.investorProfileCompleted?"good":"warn"}">${user.familyProfile?.investorProfileCompleted?"Complete":"Incomplete"}</span></td><td><button class="acc-btn" type="button" data-acc-user="${esc(id(user))}">View User</button></td></tr>`).join("")}</tbody></table>` : `<div class="acc-empty"><strong>No Family profiles loaded</strong>Family Advantage activity will appear here after users complete Family onboarding or enable Investor Mode.</div>`}
          </div>
        </article>

        <article class="acc-panel">
          <div class="acc-panel-head"><div><h3>Safe admin boundaries</h3><p>Keep approvals in the right place.</p></div></div>
          <div class="acc-panel-body">
            <div class="acc-card-list">
              <div class="acc-room-card"><strong>Investor access</strong><div class="acc-action-meta">Users enable Investor Mode from Family Advantage. AIFT reviews sensitive investment interests before founders receive them.</div></div>
              <div class="acc-room-card"><strong>Family verification</strong><div class="acc-action-meta">Use Review Center for family verification cases and any sensitive trust decision.</div><div class="actions"><button class="acc-btn" type="button" data-acc-review-center>Open Review Center</button></div></div>
              <div class="acc-room-card"><strong>Investment introductions</strong><div class="acc-action-meta">After AIFT approval and founder acceptance, matched introductions move into a controlled Deal Room.</div><div class="actions"><button class="acc-btn" type="button" data-acc-open="dealRooms">Open Deal Rooms</button></div></div>
            </div>
          </div>
        </article>
      </div>`;
  }

  function injectSettingsMap(){
    const section = document.getElementById("settingsSection");
    if(!section || section.querySelector("#accSettingsMap")) return;
    const panel = document.createElement("article");
    panel.id = "accSettingsMap";
    panel.className = "acc-panel";
    panel.innerHTML = `
      <div class="acc-panel-head"><div><h3>Platform control map</h3><p>Operational settings and sensitive workflows should be managed in their dedicated areas instead of one overloaded settings page.</p></div></div>
      <div class="acc-panel-body"><div class="acc-settings-map">
        <div class="acc-setting-card"><strong>Career Hub</strong><p>Ventures, opportunities and Career Hub operational visibility.</p><button class="acc-btn" type="button" data-acc-open="careerHub">Manage</button></div>
        <div class="acc-setting-card"><strong>Trust & Review</strong><p>Approvals, verification, information requests and controlled introductions.</p><button class="acc-btn" type="button" data-acc-review-center>Open Review Center</button></div>
        <div class="acc-setting-card"><strong>Deal Rooms</strong><p>Private evidence, meeting approval, decisions and official outcomes.</p><button class="acc-btn" type="button" data-acc-open="dealRooms">Manage</button></div>
        <div class="acc-setting-card"><strong>Family & Investors</strong><p>Family Advantage onboarding and Investor Mode readiness.</p><button class="acc-btn" type="button" data-acc-open="family">Manage</button></div>
        <div class="acc-setting-card"><strong>Marketplace</strong><p>Jobs, applications and employer-facing workflows.</p><button class="acc-btn" type="button" data-acc-open="jobs">Manage Jobs</button></div>
        <div class="acc-setting-card"><strong>Education</strong><p>Schools, teachers, students and LMS administration.</p><button class="acc-btn" type="button" data-acc-open="schools">Manage</button></div>
        <div class="acc-setting-card"><strong>Trust & Safety</strong><p>Reports, moderation and messaging safety escalations.</p><button class="acc-btn" type="button" data-acc-open="reports">Manage</button></div>
        <div class="acc-setting-card"><strong>Platform Health</strong><p>Run health checks before changing production operations.</p><button class="acc-btn" type="button" onclick="runHealthCheck()">System Check</button></div>
        <div class="acc-setting-card"><strong>Audit</strong><p>Review admin activity before and after sensitive changes.</p><button class="acc-btn" type="button" data-acc-open="audit">Open Logs</button></div>
      </div></div>`;
    section.prepend(panel);
  }

  async function loadCareerHubAdmin(){
    const section = document.getElementById("careerHubSection");
    if(section) section.innerHTML = '<div class="admin-panel"><div class="admin-empty"><strong>Loading Career Hub operations…</strong><span>Reviewing Ventures, approvals and Deal Rooms.</span></div></div>';
    try{await loadOps(true);renderCareerHub();}catch(error){if(section)section.innerHTML=`<div class="admin-panel"><div class="admin-empty"><strong>Unable to load Career Hub</strong><span>${esc(error.message)}</span></div></div>`;}
  }

  async function loadDealRoomAdmin(){
    const section = document.getElementById("dealRoomsSection");
    if(section) section.innerHTML = '<div class="admin-panel"><div class="admin-empty"><strong>Loading Deal Rooms…</strong><span>Building the AIFT action queue.</span></div></div>';
    try{await loadOps(true);renderDealRooms();}catch(error){if(section)section.innerHTML=`<div class="admin-panel"><div class="admin-empty"><strong>Unable to load Deal Rooms</strong><span>${esc(error.message)}</span></div></div>`;}
  }

  async function loadFamilyAdmin(){
    const section = document.getElementById("familySection");
    if(section) section.innerHTML = '<div class="admin-panel"><div class="admin-empty"><strong>Loading Family & Investor accounts…</strong></div></div>';
    try{await loadOps(true);renderFamily();}catch(error){if(section)section.innerHTML=`<div class="admin-panel"><div class="admin-empty"><strong>Unable to load Family accounts</strong><span>${esc(error.message)}</span></div></div>`;}
  }

  async function refreshCommandCenter(){
    try{
      await loadOps(true);
      if(document.getElementById("careerHubSection") && !document.getElementById("careerHubSection").classList.contains("hidden")) renderCareerHub();
      if(document.getElementById("dealRoomsSection") && !document.getElementById("dealRoomsSection").classList.contains("hidden")) renderDealRooms();
      if(document.getElementById("familySection") && !document.getElementById("familySection").classList.contains("hidden")) renderFamily();
      window.adminToast?.("Admin command center refreshed.");
    }catch(error){window.adminToast?.(error.message || "Could not refresh command center.");}
  }

  function openReviewCenter(){
    const button = document.getElementById("aiftReviewCenterNav");
    if(button){button.click();return;}
    window.adminToast?.("Review Center is still loading. Try again in a moment.");
  }

  function handleClick(event){
    const room = event.target.closest("[data-acc-room]");
    if(room){
      window.location.href = `deal-room.html?id=${encodeURIComponent(room.dataset.accRoom)}`;
      return;
    }

    const action = event.target.closest("[data-acc-action-type]");
    if(action){
      if(action.dataset.accActionType === "room"){
        window.location.href = `deal-room.html?id=${encodeURIComponent(action.dataset.accActionId)}`;
      }else{
        openReviewCenter();
      }
      return;
    }

    const user = event.target.closest("[data-acc-user]");
    if(user){
      if(typeof window.openAdminUserDrawer === "function") window.openAdminUserDrawer(user.dataset.accUser);
      else window.switchAdminSection?.("users");
      return;
    }

    if(event.target.closest("[data-acc-review-center]")){
      openReviewCenter();
      return;
    }

    const section = event.target.closest("[data-acc-open]");
    if(section){
      window.switchAdminSection?.(section.dataset.accOpen);
      return;
    }

    if(event.target.closest("[data-acc-refresh]")){
      refreshCommandCenter();
    }
  }

  function wrapSettingsLoader(){
    const original = window.loadPlatformSettings;
    if(typeof original !== "function" || original.__accWrapped) return;
    const wrapped = async function(...args){
      const result = await original.apply(this,args);
      injectSettingsMap();
      return result;
    };
    wrapped.__accWrapped = true;
    window.loadPlatformSettings = wrapped;
  }

  function init(){
    if(String(localStorage.getItem("role") || "").toLowerCase() !== "admin" || !token()) return;
    ensureSections();
    ensureCustomNav();
    organizeSidebar();
    ensureOperationsStrip();
    ensureOverviewQueue();
    wrapSettingsLoader();
    document.addEventListener("click",handleClick);

    setTimeout(async()=>{
      try{await loadOps(true);}catch(error){console.warn("Admin command center data unavailable",error);}
    },900);

    window.addEventListener("focus",()=>loadOps(true).catch(()=>{}),{passive:true});
  }

  window.loadCareerHubAdmin = loadCareerHubAdmin;
  window.loadDealRoomAdmin = loadDealRoomAdmin;
  window.loadFamilyAdmin = loadFamilyAdmin;
  window.refreshCommandCenter = refreshCommandCenter;

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
