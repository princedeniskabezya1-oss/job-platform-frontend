(() => {
  "use strict";

  const API = window.API_BASE || "https://backend-1-9b6f.onrender.com";
  const POLL_MS = 20000;

  const state = {
    tickets: [],
    summary: { new:0, in_progress:0, waiting:0, resolved:0, dismissed:0 },
    tab: "new",
    category: "all",
    search: "",
    selectedTicketId: "",
    loadingPromise: null,
    refreshQueued: false,
    refreshQueuedSync: false,
    busyTickets: new Set(),
    timer: null,
    initialized: false
  };

  function token(){
    return localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
  }

  function isAdmin(){
    return String(localStorage.getItem("role") || "").toLowerCase() === "admin";
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
      .replace(/\b\w/g,letter=>letter.toUpperCase());
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

  function age(value){
    const date = new Date(value || 0);
    if(Number.isNaN(date.getTime())) return "";
    const minutes = Math.max(0,Math.floor((Date.now()-date.getTime())/60000));
    if(minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes/60);
    if(hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours/24)}d ago`;
  }

  function toast(message){
    if(typeof window.adminToast === "function") window.adminToast(message);
    else console.log(message);
  }

  async function api(path,options={}){
    if(typeof window.adminRequest === "function"){
      return window.adminRequest(path,options);
    }

    const response = await fetch(API + path,{
      ...options,
      cache:"no-store",
      headers:{
        Authorization:`Bearer ${token()}`,
        "Cache-Control":"no-cache",
        Pragma:"no-cache",
        ...(options.body?{"Content-Type":"application/json"}:{}),
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  }

  function ensureStyle(){
    if(document.getElementById("aiftAdminWorkQueueStyle")) return;

    const style = document.createElement("style");
    style.id = "aiftAdminWorkQueueStyle";
    style.textContent = `
      .awq-shell{display:flex;flex-direction:column;gap:14px}
      .awq-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px;border:1px solid #e3e8ef;border-radius:14px;background:#fff}
      .awq-hero h2{margin:0;color:#101828;font-size:18px}.awq-hero p{max-width:760px;margin:5px 0 0;color:#667085;font-size:11px;line-height:1.55}
      .awq-refresh{min-height:38px;padding:0 14px;border:1px solid #cfd8e3;border-radius:9px;background:#fff;color:#344054;font-weight:800;cursor:pointer}.awq-refresh:disabled{opacity:.65;cursor:wait}
      .awq-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
      .awq-metric{padding:14px;border:1px solid #e3e8ef;border-radius:13px;background:#fff;cursor:pointer;text-align:left}.awq-metric span{display:block;color:#667085;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.awq-metric strong{display:block;margin-top:5px;color:#101828;font-size:23px}.awq-metric small{display:block;margin-top:4px;color:#98a2b3;font-size:9px}.awq-metric.attention{border-color:#fecaca;background:#fffafa}.awq-metric.attention strong{color:#b42318}
      .awq-toolbar{display:grid;grid-template-columns:minmax(180px,1fr) 190px auto;gap:9px;padding:12px;border:1px solid #e3e8ef;border-radius:13px;background:#fff}.awq-toolbar input,.awq-toolbar select{height:40px;min-width:0;padding:0 11px;border:1px solid #d7dee8;border-radius:9px;background:#fff;color:#344054;font:inherit}
      .awq-tabs{display:flex;align-items:center;gap:6px;overflow:auto}.awq-tab{height:40px;padding:0 12px;border:1px solid #d7dee8;border-radius:9px;background:#fff;color:#475467;font-size:10px;font-weight:850;white-space:nowrap;cursor:pointer}.awq-tab.active{border-color:#9bc4eb;background:#eef6ff;color:#0a66c2}
      .awq-board{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}.awq-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;padding:15px;border:1px solid #e3e8ef;border-radius:13px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.03);transition:.15s ease}.awq-card:hover{border-color:#cbd8e7}.awq-card.selected{border-color:#80b6e9;background:#fbfdff;box-shadow:0 0 0 3px rgba(10,102,194,.07)}.awq-card.busy{opacity:.72}.awq-card.overdue{border-color:#f4b4b4;background:#fffdfd}
      .awq-card-main{min-width:0;cursor:pointer}.awq-card-head{display:flex;align-items:flex-start;gap:9px;flex-wrap:wrap}.awq-priority,.awq-status,.awq-category{display:inline-flex;align-items:center;min-height:22px;padding:0 7px;border-radius:999px;font-size:8px;font-weight:850;text-transform:uppercase;letter-spacing:.03em}.awq-priority{background:#eef2f7;color:#475467}.awq-priority.urgent{background:#fee4e2;color:#b42318}.awq-priority.high{background:#fff1d6;color:#8a5a00}.awq-status{background:#eaf3ff;color:#0a66c2}.awq-status.in_progress{background:#eef2ff;color:#4338ca}.awq-status.waiting{background:#f2f4f7;color:#667085}.awq-status.resolved{background:#e8f7ee;color:#16713c}.awq-category{background:#f8fafc;color:#64748b}
      .awq-title{margin-top:8px;color:#101828;font-size:13px;font-weight:850}.awq-description{margin-top:4px;color:#667085;font-size:10px;line-height:1.5}.awq-next{margin-top:10px;padding:9px 10px;border-radius:9px;background:#f7f9fc;color:#344054;font-size:10px;line-height:1.5}.awq-next strong{color:#101828}.awq-meta{display:flex;gap:12px;flex-wrap:wrap;margin-top:9px;color:#98a2b3;font-size:9px}.awq-meta .due{color:#b42318;font-weight:800}
      .awq-actions{min-width:170px;display:flex;flex-direction:column;justify-content:center;gap:7px}.awq-action{min-height:34px;padding:0 10px;border:1px solid #d7dee8;border-radius:8px;background:#fff;color:#344054;font-size:9px;font-weight:850;cursor:pointer}.awq-action.primary{border-color:#0a66c2;background:#0a66c2;color:#fff}.awq-action.success{border-color:#b7dfc5;background:#effaf3;color:#16713c}.awq-action:disabled{opacity:.5;cursor:wait}
      .awq-empty{padding:42px 20px;border:1px dashed #d7dee8;border-radius:13px;background:#fff;text-align:center;color:#667085;font-size:11px;line-height:1.6}.awq-live{display:inline-flex;align-items:center;gap:6px;color:#16713c;font-size:9px;font-weight:800}.awq-live:before{content:"";width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.12)}
      .awq-ticket-detail{display:grid;gap:12px}.awq-detail-box{padding:12px;border:1px solid #e4e9f0;border-radius:10px;background:#fff}.awq-detail-box span{display:block;color:#667085;font-size:10px;margin-bottom:4px}.awq-detail-box strong{color:#101828;font-size:12px}.awq-history{display:grid;gap:7px}.awq-history-item{padding:9px 10px;border-left:3px solid #dbe3ec;background:#f8fafc;border-radius:0 8px 8px 0}.awq-history-item strong{display:block;font-size:10px;color:#344054}.awq-history-item small{display:block;margin-top:2px;color:#98a2b3;font-size:9px}
      @media(max-width:980px){.awq-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.awq-toolbar{grid-template-columns:1fr}.awq-card{grid-template-columns:1fr}.awq-actions{min-width:0;flex-direction:row;flex-wrap:wrap}.awq-action{flex:1 1 140px}}
      @media(max-width:600px){.awq-hero{flex-direction:column}.awq-metrics{grid-template-columns:1fr 1fr}.awq-card{padding:12px}.awq-actions{display:grid;grid-template-columns:1fr 1fr}.awq-action{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function ensureSection(){
    const host = document.getElementById("adminContent") || document.querySelector("#overviewSection")?.parentElement || document.querySelector(".admin-content");
    if(!host) return;

    if(!document.getElementById("adminWorkQueueSection")){
      const section = document.createElement("section");
      section.id = "adminWorkQueueSection";
      section.className = "admin-section hidden";
      section.innerHTML = `
        <div class="awq-shell">
          <div class="awq-hero">
            <div>
              <div class="awq-live">Live AIFT operations</div>
              <h2>Admin Work Queue</h2>
              <p>Every item here represents someone waiting on AIFT, a submitted document, meeting, evaluation, review, or negotiation follow-up. Actions move tickets immediately, then AIFT confirms the change with the server.</p>
            </div>
            <button id="awqRefresh" class="awq-refresh" type="button">Refresh tickets</button>
          </div>
          <div id="awqMetrics" class="awq-metrics"></div>
          <div class="awq-toolbar">
            <input id="awqSearch" type="search" placeholder="Search ticket, Deal Room, document or next action">
            <select id="awqCategory">
              <option value="all">All work types</option>
              <option value="document">Submitted documents</option>
              <option value="meeting">Meetings</option>
              <option value="evaluation">Evaluations</option>
              <option value="decision">Decisions</option>
              <option value="negotiation">Negotiations</option>
              <option value="review">AIFT reviews</option>
              <option value="partnership">Partnerships</option>
            </select>
            <div class="awq-tabs">
              <button type="button" class="awq-tab active" data-awq-tab="new">New</button>
              <button type="button" class="awq-tab" data-awq-tab="in_progress">In Progress</button>
              <button type="button" class="awq-tab" data-awq-tab="waiting">Waiting</button>
              <button type="button" class="awq-tab" data-awq-tab="resolved">Resolved</button>
            </div>
          </div>
          <div id="awqBoard" class="awq-board"><div class="awq-empty">Loading AIFT work tickets…</div></div>
        </div>`;
      host.appendChild(section);
    }

    if(sectionBound()) return;
    const section = document.getElementById("adminWorkQueueSection");
    section.dataset.awqBound = "1";
    section.addEventListener("click",handleAction);
    section.addEventListener("keydown",event=>{
      if((event.key === "Enter" || event.key === " ") && event.target.closest("[data-ticket-select]")){
        event.preventDefault();
        const id = event.target.closest("[data-ticket-select]").dataset.ticketSelect;
        const ticket = ticketById(id);
        if(ticket) showTicketDetails(ticket);
      }
    });
    section.querySelector("#awqSearch")?.addEventListener("input",event=>{
      state.search = event.target.value;
      render();
    });
    section.querySelector("#awqCategory")?.addEventListener("change",event=>{
      state.category = event.target.value;
      render();
    });
    section.querySelectorAll("[data-awq-tab]").forEach(button=>button.addEventListener("click",()=>{
      state.tab = button.dataset.awqTab;
      state.selectedTicketId = "";
      render();
    }));
  }

  function sectionBound(){
    return document.getElementById("adminWorkQueueSection")?.dataset.awqBound === "1";
  }

  function navIcon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"></path><path d="M8 8h8M8 12h5M8 16h7"></path></svg>';
  }

  function ensureNav(){
    const nav = document.querySelector(".admin-nav");
    if(!nav || document.getElementById("aiftWorkQueueNav")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.id = "aiftWorkQueueNav";
    button.innerHTML = `${navIcon()}<span>Work Queue</span><span id="aiftWorkQueueBadge" class="acc-nav-badge">0</span>`;
    button.addEventListener("click",openSection);

    const review = document.getElementById("aiftReviewCenterNav");
    if(review?.parentElement) review.insertAdjacentElement("afterend",button);
    else nav.prepend(button);
  }

  function openSection(){
    ensureSection();
    document.querySelectorAll(".admin-section").forEach(section=>section.classList.add("hidden"));
    document.getElementById("adminWorkQueueSection")?.classList.remove("hidden");
    document.querySelectorAll(".admin-nav button").forEach(button=>button.classList.toggle("active",button.id === "aiftWorkQueueNav"));

    const pageTitle = document.getElementById("adminPageTitle");
    const subtitle = document.getElementById("adminPageSubtitle");
    const badge = document.getElementById("adminSectionBadge");
    if(pageTitle) pageTitle.textContent = "AIFT Admin Work Queue";
    if(subtitle) subtitle.textContent = "Documents, meetings, evaluations and negotiation follow-ups that people are waiting on AIFT to handle.";
    if(badge) badge.textContent = "Operations";

    refreshNow(true).catch(error=>toast(error.message));
  }

  function priorityRank(value){
    return ({urgent:0,high:1,normal:2,low:3})[value] ?? 2;
  }

  function isOverdue(ticket){
    const due = new Date(ticket.reminderAt || ticket.dueAt || 0);
    return !Number.isNaN(due.getTime()) && due.getTime() > 0 && due.getTime() <= Date.now() && !["resolved","dismissed"].includes(ticket.status);
  }

  function recalculateSummary(){
    const next = {new:0,in_progress:0,waiting:0,resolved:0,dismissed:0};
    state.tickets.forEach(ticket=>{
      if(Object.prototype.hasOwnProperty.call(next,ticket.status)) next[ticket.status] += 1;
    });
    state.summary = next;
  }

  function filtered(){
    const q = state.search.trim().toLowerCase();
    return state.tickets
      .filter(ticket=>ticket.status === state.tab)
      .filter(ticket=>state.category === "all" || ticket.category === state.category)
      .filter(ticket=>!q || [
        ticket.title,
        ticket.description,
        ticket.nextAction,
        ticket.metadata?.roomTitle,
        ticket.metadata?.partnershipName,
        ticket.metadata?.requestTitle,
        ticket.reviewCaseId?.caseNumber
      ].filter(Boolean).join(" ").toLowerCase().includes(q))
      .sort((a,b)=>{
        const overdue = Number(isOverdue(b)) - Number(isOverdue(a));
        if(overdue) return overdue;
        const priority = priorityRank(a.priority) - priorityRank(b.priority);
        if(priority) return priority;
        return new Date(b.lastSourceActivityAt || b.updatedAt || 0) - new Date(a.lastSourceActivityAt || a.updatedAt || 0);
      });
  }

  function renderMetrics(){
    const host = document.getElementById("awqMetrics");
    if(!host) return;

    const active = state.tickets.filter(ticket=>["new","in_progress","waiting"].includes(ticket.status));
    const documents = active.filter(ticket=>ticket.category === "document" && ticket.status !== "waiting").length;
    const dueNow = active.filter(isOverdue).length;

    host.innerHTML = `
      <button class="awq-metric ${state.summary.new?"attention":""}" type="button" data-awq-jump="new"><span>New</span><strong>${state.summary.new || 0}</strong><small>Needs AIFT attention</small></button>
      <button class="awq-metric" type="button" data-awq-jump="in_progress"><span>In Progress</span><strong>${state.summary.in_progress || 0}</strong><small>Already opened / being worked</small></button>
      <button class="awq-metric" type="button" data-awq-jump="waiting"><span>Waiting</span><strong>${state.summary.waiting || 0}</strong><small>Deferred / waiting on another step</small></button>
      <button class="awq-metric ${documents?"attention":""}" type="button" data-awq-documents><span>Documents Ready</span><strong>${documents}</strong><small>Submitted files to review</small></button>
      <button class="awq-metric ${dueNow?"attention":""}" type="button" data-awq-due><span>Due / Reminder</span><strong>${dueNow}</strong><small>Needs attention now</small></button>`;
  }

  function actionButton(ticket,attribute,label,cls=""){
    const busy = state.busyTickets.has(String(ticket._id));
    return `<button class="awq-action ${cls}" type="button" ${attribute} data-ticket-ref="${esc(ticket._id)}" ${busy?"disabled":""}>${esc(busy?"Updating…":label)}</button>`;
  }

  function card(ticket){
    const overdue = isOverdue(ticket);
    const due = ticket.reminderAt || ticket.dueAt;
    const selected = String(state.selectedTicketId) === String(ticket._id);
    const busy = state.busyTickets.has(String(ticket._id));
    const canOpenSource = ticket.sourceType === "deal_room" || ticket.sourceType === "review_case";
    const openLabel = ticket.status === "new" ? "Start / Open" : "Open source";

    return `
      <article class="awq-card ${overdue?"overdue":""} ${selected?"selected":""} ${busy?"busy":""}" data-ticket-id="${esc(ticket._id)}">
        <div class="awq-card-main" data-ticket-select="${esc(ticket._id)}" tabindex="0" role="button" aria-label="View ${esc(ticket.title)}">
          <div class="awq-card-head">
            <span class="awq-priority ${esc(ticket.priority)}">${esc(ticket.priority || "normal")}</span>
            <span class="awq-status ${esc(ticket.status)}">${esc(title(ticket.status))}</span>
            <span class="awq-category">${esc(title(ticket.category))}</span>
          </div>
          <div class="awq-title">${esc(ticket.title)}</div>
          <div class="awq-description">${esc(ticket.description || "")}</div>
          ${ticket.nextAction?`<div class="awq-next"><strong>Next AIFT action:</strong> ${esc(ticket.nextAction)}</div>`:""}
          <div class="awq-meta">
            <span>Updated ${esc(age(ticket.lastSourceActivityAt || ticket.updatedAt))}</span>
            ${ticket.waitingOn?`<span>Waiting on: ${esc(title(ticket.waitingOn))}</span>`:""}
            ${due?`<span class="${overdue?"due":""}">${overdue?"Due now":"Reminder"}: ${esc(fmt(due))}</span>`:""}
            ${ticket.reviewCaseId?.caseNumber?`<span>${esc(ticket.reviewCaseId.caseNumber)}</span>`:""}
          </div>
        </div>
        <div class="awq-actions">
          ${ticket.status!=="resolved"&&ticket.status!=="dismissed"?actionButton(ticket,"data-ticket-open",canOpenSource?openLabel:(ticket.status==="new"?"Start ticket":"Ticket details"),"primary"):""}
          ${ticket.status!=="waiting"&&ticket.status!=="resolved"?actionButton(ticket,"data-ticket-wait","Mark waiting"):""}
          ${ticket.status!=="resolved"?actionButton(ticket,"data-ticket-remind","Remind in 1 hour"):""}
          ${ticket.status!=="resolved"?actionButton(ticket,"data-ticket-resolve","Resolve ticket","success"):actionButton(ticket,"data-ticket-reopen","Reopen")}
        </div>
      </article>`;
  }

  function updateBadge(){
    const badge = document.getElementById("aiftWorkQueueBadge");
    if(badge) badge.textContent = String((state.summary.new || 0) + state.tickets.filter(ticket=>isOverdue(ticket)).length);
  }

  function render(){
    document.querySelectorAll("[data-awq-tab]").forEach(button=>{
      button.classList.toggle("active",button.dataset.awqTab === state.tab);
    });

    renderMetrics();
    updateBadge();

    const board = document.getElementById("awqBoard");
    if(!board) return;

    const rows = filtered();
    if(!rows.length){
      board.innerHTML = `<div class="awq-empty">No ${esc(title(state.tab))} tickets${state.category!=="all"?` for ${esc(title(state.category))}`:""}.<br>AIFT will automatically place new workflow activity here.</div>`;
      return;
    }

    board.innerHTML = rows.map(card).join("");
  }

  function ticketById(ticketId){
    return state.tickets.find(ticket=>String(ticket._id) === String(ticketId));
  }

  function setRefreshButton(loading){
    const button = document.getElementById("awqRefresh");
    if(!button) return;
    button.disabled = Boolean(loading);
    button.textContent = loading ? "Refreshing…" : "Refresh tickets";
  }

  async function performRefresh(sync){
    const stamp = Date.now();
    const data = await api(`/api/admin/work-tickets?sync=${sync?"true":"false"}&limit=400&_=${stamp}`,{
      method:"GET",
      headers:{"Cache-Control":"no-cache",Pragma:"no-cache"}
    });

    state.tickets = Array.isArray(data?.tickets) ? data.tickets : [];
    state.summary = data?.summary || state.summary;
    recalculateSummary();

    if(state.selectedTicketId && !state.tickets.some(ticket=>String(ticket._id)===String(state.selectedTicketId))){
      state.selectedTicketId = "";
    }

    render();
    return data;
  }

  async function refreshNow(sync=true){
    if(state.loadingPromise){
      state.refreshQueued = true;
      state.refreshQueuedSync = state.refreshQueuedSync || Boolean(sync);
      await state.loadingPromise;
      return;
    }

    setRefreshButton(true);
    state.loadingPromise = performRefresh(sync);

    try{
      await state.loadingPromise;
    }finally{
      state.loadingPromise = null;
      setRefreshButton(false);
    }

    if(state.refreshQueued){
      const nextSync = state.refreshQueuedSync;
      state.refreshQueued = false;
      state.refreshQueuedSync = false;
      await refreshNow(nextSync);
    }
  }

  function applyLocalPatch(ticketId,payload){
    const index = state.tickets.findIndex(ticket=>String(ticket._id)===String(ticketId));
    if(index < 0) return null;

    const before = JSON.parse(JSON.stringify(state.tickets[index]));
    const current = {...state.tickets[index]};

    if(payload.status) current.status = payload.status;
    if(Object.prototype.hasOwnProperty.call(payload,"waitingOn")) current.waitingOn = payload.waitingOn || "";
    if(Object.prototype.hasOwnProperty.call(payload,"reminderAt")) current.reminderAt = payload.reminderAt || null;
    if(payload.priority) current.priority = payload.priority;
    current.updatedAt = new Date().toISOString();

    state.tickets[index] = current;
    recalculateSummary();
    render();
    return before;
  }

  function restoreTicket(snapshot){
    if(!snapshot) return;
    const index = state.tickets.findIndex(ticket=>String(ticket._id)===String(snapshot._id));
    if(index >= 0) state.tickets[index] = snapshot;
    else state.tickets.push(snapshot);
    recalculateSummary();
    render();
  }

  async function saveTicket(ticketId,payload,{destinationTab="",successMessage="",confirmOnly=true}={}){
    const id = String(ticketId);
    if(state.busyTickets.has(id)) return null;

    const snapshot = applyLocalPatch(id,payload);
    state.busyTickets.add(id);
    state.selectedTicketId = id;

    if(destinationTab){
      state.tab = destinationTab;
      state.category = "all";
      const select = document.getElementById("awqCategory");
      if(select) select.value = "all";
    }
    render();

    try{
      const data = await api(`/api/admin/work-tickets/${encodeURIComponent(id)}`,{
        method:"PATCH",
        body:JSON.stringify(payload)
      });

      const index = state.tickets.findIndex(ticket=>String(ticket._id)===id);
      if(index >= 0 && data?.ticket){
        state.tickets[index] = {...state.tickets[index],...data.ticket};
      }

      recalculateSummary();
      render();
      if(successMessage) toast(successMessage);

      /*
        Confirm the exact persisted ticket state without immediately
        re-running source synchronization. The regular live refresh
        will perform a full sync afterwards.
      */
      await refreshNow(!confirmOnly);
      return ticketById(id) || data?.ticket || null;
    }catch(error){
      restoreTicket(snapshot);
      if(snapshot?.status) state.tab = snapshot.status === "dismissed" ? "resolved" : snapshot.status;
      toast(error.message);
      throw error;
    }finally{
      state.busyTickets.delete(id);
      render();
    }
  }

  function openReviewTicket(ticket){
    const reviewId = ticket.reviewCaseId?._id || ticket.reviewCaseId || ticket.sourceId;
    const nav = document.getElementById("aiftReviewCenterNav");
    if(nav) nav.click();

    let tries = 0;
    const timer = setInterval(()=>{
      tries += 1;
      const selector = `[data-review-case-id="${CSS.escape(String(reviewId))}"]`;
      const row = document.querySelector(selector);
      if(row){
        clearInterval(timer);
        row.click();
      }else if(tries > 24){
        clearInterval(timer);
        toast("The review case is in Review Center. Use its case number to locate it.");
      }
    },250);
  }

  function showTicketDetails(ticket){
    if(!ticket) return;
    state.selectedTicketId = String(ticket._id || "");
    render();

    const history = Array.isArray(ticket.history) ? ticket.history.slice().reverse() : [];
    const metadata = ticket.metadata && typeof ticket.metadata === "object" ? Object.entries(ticket.metadata) : [];
    const shortId = String(ticket._id || "").slice(-8).toUpperCase();

    const html = `
      <div class="awq-ticket-detail" data-open-ticket-id="${esc(ticket._id)}">
        <div class="awq-detail-box"><span>Selected ticket</span><strong>${esc(shortId?`#${shortId}`:"AIFT ticket")}</strong></div>
        <div class="awq-detail-box"><span>Ticket</span><strong>${esc(ticket.title)}</strong><div class="awq-description">${esc(ticket.description||"")}</div></div>
        <div class="awq-detail-box"><span>Next AIFT action</span><strong>${esc(ticket.nextAction||"Review this item and determine the next controlled action.")}</strong></div>
        <div class="awq-detail-box"><span>Status</span><strong>${esc(title(ticket.status))} · ${esc(title(ticket.priority))} priority</strong></div>
        ${ticket.reminderAt?`<div class="awq-detail-box"><span>Reminder</span><strong>${esc(fmt(ticket.reminderAt))}</strong></div>`:""}
        ${metadata.length?`<div class="awq-detail-box"><span>Workflow context</span>${metadata.map(([key,value])=>`<div class="awq-description"><strong>${esc(title(key))}:</strong> ${esc(typeof value==="object"?JSON.stringify(value):value)}</div>`).join("")}</div>`:""}
        <div class="awq-detail-box"><span>Ticket history</span><div class="awq-history">${history.length?history.map(item=>`<div class="awq-history-item"><strong>${esc(title(item.status))}</strong><small>${esc(item.note||"")} · ${esc(fmt(item.at||item.createdAt))}</small></div>`).join(""):'<div class="awq-description">No ticket history yet.</div>'}</div></div>
      </div>`;

    if(typeof window.openAdminReviewModal === "function"){
      window.openAdminReviewModal(`AIFT Work Ticket ${shortId?`#${shortId}`:""}`,ticket.title,html,"");
    }else{
      toast(ticket.nextAction || ticket.title);
    }
  }

  async function startTicket(ticket){
    const originalTab = state.tab;
    try{
      const current = await saveTicket(ticket._id,{
        status:"in_progress",
        waitingOn:"aift",
        note:"Admin opened this work ticket."
      },{
        destinationTab:"in_progress",
        successMessage:"Ticket moved to In Progress.",
        confirmOnly:true
      });

      const resolved = current || ticket;
      if(resolved.sourceType === "deal_room" && resolved.targetUrl){
        window.location.href = resolved.targetUrl.replace(/^\//,"");
        return;
      }
      if(resolved.sourceType === "review_case"){
        openReviewTicket(resolved);
        return;
      }
      showTicketDetails(resolved);
    }catch{
      state.tab = originalTab;
      render();
    }
  }

  async function handleAction(event){
    const refresh = event.target.closest("#awqRefresh");
    if(refresh){
      event.preventDefault();
      try{
        await refreshNow(true);
        toast("Work Queue refreshed.");
      }catch(error){
        toast(error.message);
      }
      return;
    }

    const jump = event.target.closest("[data-awq-jump]");
    if(jump){
      state.tab = jump.dataset.awqJump;
      state.category = "all";
      state.selectedTicketId = "";
      const select = document.getElementById("awqCategory");
      if(select) select.value = "all";
      render();
      return;
    }

    if(event.target.closest("[data-awq-documents]")){
      state.tab = "new";
      state.category = "document";
      state.selectedTicketId = "";
      const select = document.getElementById("awqCategory");
      if(select) select.value = "document";
      render();
      return;
    }

    if(event.target.closest("[data-awq-due]")){
      state.tab = "waiting";
      state.category = "all";
      state.selectedTicketId = "";
      const select = document.getElementById("awqCategory");
      if(select) select.value = "all";
      render();
      return;
    }

    const action = event.target.closest("[data-ticket-ref]");
    const selectTarget = event.target.closest("[data-ticket-select]");
    const card = event.target.closest("[data-ticket-id]");
    const explicitId = action?.dataset.ticketRef || selectTarget?.dataset.ticketSelect || card?.dataset.ticketId;
    if(!explicitId) return;

    const ticket = ticketById(explicitId);
    if(!ticket) return;
    state.selectedTicketId = String(ticket._id);

    if(action?.matches("[data-ticket-open]")){
      await startTicket(ticket);
      return;
    }

    if(action?.matches("[data-ticket-wait]")){
      try{
        await saveTicket(ticket._id,{
          status:"waiting",
          waitingOn:"user",
          reminderAt:null,
          note:"Admin moved this ticket to Waiting."
        },{
          destinationTab:"waiting",
          successMessage:"Ticket moved to Waiting.",
          confirmOnly:true
        });
      }catch{}
      return;
    }

    if(action?.matches("[data-ticket-remind]")){
      const reminderAt = new Date(Date.now()+60*60*1000).toISOString();
      try{
        await saveTicket(ticket._id,{
          status:"waiting",
          waitingOn:"aift",
          reminderAt,
          note:"Admin deferred this ticket and set a one-hour reminder."
        },{
          destinationTab:"waiting",
          successMessage:"Ticket moved to Waiting. Reminder set for one hour.",
          confirmOnly:true
        });
      }catch{}
      return;
    }

    if(action?.matches("[data-ticket-resolve]")){
      const id = String(ticket._id);
      const run = async()=>{
        try{
          await saveTicket(id,{
            status:"resolved",
            waitingOn:"",
            reminderAt:null,
            note:"Admin marked this ticket resolved."
          },{
            destinationTab:"resolved",
            successMessage:"Ticket resolved.",
            confirmOnly:true
          });
        }catch{}
      };

      if(typeof window.openAdminConfirm === "function"){
        window.openAdminConfirm(
          "Resolve work ticket",
          "Mark this AIFT work ticket resolved? New linked workflow activity can reopen it later.",
          run
        );
      }else{
        await run();
      }
      return;
    }

    if(action?.matches("[data-ticket-reopen]")){
      try{
        await saveTicket(ticket._id,{
          status:"new",
          waitingOn:"aift",
          reminderAt:null,
          note:"Admin reopened this ticket."
        },{
          destinationTab:"new",
          successMessage:"Ticket reopened in New.",
          confirmOnly:true
        });
      }catch{}
      return;
    }

    if(selectTarget){
      showTicketDetails(ticket);
    }
  }

  function workQueueVisible(){
    const section = document.getElementById("adminWorkQueueSection");
    return Boolean(section && !section.classList.contains("hidden"));
  }

  function startPolling(){
    clearInterval(state.timer);
    state.timer = setInterval(()=>{
      if(document.hidden || !workQueueVisible()) return;
      refreshNow(true).catch(()=>{});
    },POLL_MS);
  }

  function init(){
    if(state.initialized || !isAdmin() || !token()) return;
    state.initialized = true;

    ensureStyle();
    ensureSection();
    setTimeout(ensureNav,450);
    setTimeout(()=>refreshNow(true).catch(()=>{}),900);
    startPolling();

    window.addEventListener("focus",()=>{
      if(workQueueVisible()) refreshNow(true).catch(()=>{});
    },{passive:true});

    document.addEventListener("visibilitychange",()=>{
      if(!document.hidden && workQueueVisible()) refreshNow(true).catch(()=>{});
    });

    window.addEventListener("aift:admin-work-updated",()=>{
      refreshNow(true).catch(()=>{});
    });

    window.openAiftAdminWorkQueue = openSection;
    window.refreshAiftAdminWorkQueue = ()=>refreshNow(true);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded",init,{once:true});
  }else{
    init();
  }
})();
