(() => {
  "use strict";

  const API = "https://backend-1-9b6f.onrender.com";
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));

  const state = {
    mode:"family",
    page:"overview",
    profile:null,
    overview:null,
    children:[],
    schools:[],
    scholarships:[],
    scholarshipApplications:[],
    opportunities:[],
    saved:[],
    ventures:[],
    currentFundingId:null,
    investor:{
      discover:[],
      saved:[],
      interested:[]
    },
    conversations:[],
    activeConversation:null,
    activeMessages:[],
    notifications:[]
  };

  function token(){
    return localStorage.getItem("token") || "";
  }

  function authHeaders(extra = {}){
    const value = token();
    return {
      ...(value ? { Authorization:`Bearer ${value}` } : {}),
      ...extra
    };
  }

  async function api(path,options = {}){
    const method = options.method || "GET";
    const headers = authHeaders(options.headers || {});
    let body = options.body;

    if(body !== undefined && !(body instanceof FormData) && typeof body !== "string"){
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }

    const response = await fetch(`${API}${path}`,{
      ...options,
      method,
      headers,
      body
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => "");

    if(!response.ok){
      const message =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : "") ||
        `Request failed (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  function escapeHtml(value){
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function text(value,fallback = "Not specified"){
    const normalized = String(value ?? "").trim();
    return normalized || fallback;
  }

  function firstName(value){
    return text(value,"Family").split(/\s+/)[0] || "Family";
  }

  function initials(value){
    return text(value,"A")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0,2)
      .map(part => part[0]?.toUpperCase() || "")
      .join("") || "A";
  }

  function formatDate(value){
    if(!value) return "";
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-PH",{
      year:"numeric",
      month:"short",
      day:"numeric"
    }).format(date);
  }

  function formatDateTime(value){
    if(!value) return "";
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-PH",{
      month:"short",
      day:"numeric",
      hour:"numeric",
      minute:"2-digit"
    }).format(date);
  }

  function formatMoney(value,currency = "PHP"){
    const number = Number(value);
    if(!Number.isFinite(number) || number <= 0) return "Amount not specified";
    return new Intl.NumberFormat("en-PH",{
      style:"currency",
      currency:currency || "PHP",
      maximumFractionDigits:0
    }).format(number);
  }

  function titleCase(value){
    return String(value || "")
      .replaceAll("_"," ")
      .replaceAll("-"," ")
      .replace(/\b\w/g,letter => letter.toUpperCase());
  }

  function toast(message,type = ""){
    const wrap = $("#familyToastWrap");
    if(!wrap) return;
    const item = document.createElement("div");
    item.className = `family-toast ${type}`.trim();
    item.textContent = message;
    wrap.appendChild(item);
    window.setTimeout(() => item.remove(),4500);
  }

  function setHtml(selector,html){
    const element = $(selector);
    if(element) element.innerHTML = html;
  }

  function setText(selector,value){
    const element = $(selector);
    if(element) element.textContent = String(value ?? "");
  }

  function openModal(id){
    const modal = document.getElementById(id);
    if(!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden","false");
  }

  function closeModal(id){
    const modal = document.getElementById(id);
    if(!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden","true");
  }

  function renderAvatar(container,name,image){
    if(!container) return;
    container.innerHTML = "";
    if(image){
      const img = document.createElement("img");
      img.src = image;
      img.alt = name || "Profile";
      img.className = container.className.includes("family-avatar") ? "family-avatar" : "";
      container.appendChild(img);
    }else{
      container.textContent = initials(name);
    }
  }

  function schoolName(school){
    return school?.schoolName || school?.name || "AIFT School";
  }

  function organizationName(record){
    if(record?.schoolId) return schoolName(record.schoolId);
    if(record?.employerId) return record.employerId.companyName || record.employerId.name || "AIFT Employer";
    return record?.companyName || "AIFT";
  }

  function organizationImage(record){
    const owner = record?.schoolId || record?.employerId || {};
    return owner.schoolLogo || owner.profileImage || owner.profilePicture || "";
  }

  function logoHtml(name,image){
    return image
      ? `<div class="family-logo"><img src="${escapeHtml(image)}" alt="${escapeHtml(name)}"></div>`
      : `<div class="family-logo">${escapeHtml(initials(name))}</div>`;
  }

  function statusChip(status){
    const normalized = String(status || "").toLowerCase();
    return `<span class="family-chip ${escapeHtml(normalized)}">${escapeHtml(titleCase(normalized || "status"))}</span>`;
  }

  async function loadProfile(){
    const data = await api("/api/family/profile");
    state.profile = data;
    const user = data?.user || {};
    setText("#familyAccountName",user.name || "Family Account");
    setText("#familyWelcomeName",firstName(user.name));
    const avatar = $("#familyAccountAvatar");
    renderAvatar(avatar,user.name,user.profileImage);
    updateInvestorAccessUi();
    return data;
  }

  function updateInvestorAccessUi(){
    const enabled = state.profile?.familyProfile?.investorEnabled === true;
    const copy = $("#familyInvestorAccessText");
    if(copy){
      copy.innerHTML = enabled
        ? "Investor Mode is enabled for this Family account."
        : `Investor Mode is currently disabled. <button class="family-small-button primary" id="familyEnableInvestor" type="button">Enable Investor Mode</button>`;
    }
    $("#familyModeInvestor")?.classList.toggle("active",state.mode === "investor");
    $("#familyModeFamily")?.classList.toggle("active",state.mode === "family");
  }

  async function enableInvestorMode(){
    try{
      const data = await api("/api/family/investor",{
        method:"PATCH",
        body:{ enabled:true }
      });
      state.profile = data;
      updateInvestorAccessUi();
      toast("Investor Mode enabled.","success");
      await loadInvestorDiscover(true);
    }catch(error){
      toast(error.message,"error");
    }
  }

  function switchMode(mode){
    if(mode === "investor"){
      state.mode = "investor";
      updateInvestorAccessUi();
      openPage("investor-discover");
      return;
    }
    state.mode = "family";
    updateInvestorAccessUi();
    openPage("overview");
  }

  function openPage(page){
    state.page = page;
    $$(".family-page").forEach(section => section.classList.remove("active"));
    document.getElementById(`familyPage-${page}`)?.classList.add("active");
    $$(".family-nav-button").forEach(button => {
      button.classList.toggle("active",button.dataset.page === page);
    });
    document.body.classList.remove("family-menu-open");

    if(page === "overview") loadOverview();
    if(page === "schools") loadSchools();
    if(page === "scholarships") loadScholarships();
    if(page === "opportunities") loadOpportunities();
    if(page === "requests") loadRequests(true);
    if(page === "children") loadChildren(true);
    if(page === "investor-discover") loadInvestorDiscover();
    if(page === "investor-saved") loadInvestorSaved();
    if(page === "investor-interested") loadInvestorInterested();
    if(page === "messages") loadMessages(true);
    if(page === "notifications") loadNotifications(true);
  }

  async function loadOverview(force = false){
    if(state.overview && !force){
      renderOverview();
      return;
    }

    setText("#familyMetricRequests","…");
    try{
      const [overview,investorInterests] = await Promise.all([
        api("/api/family/overview"),
        state.profile?.familyProfile?.investorEnabled
          ? api("/api/ventures/investor/interested").catch(() => ({ ventures:[] }))
          : Promise.resolve({ ventures:[] })
      ]);

      overview.metrics = overview.metrics || {};
      overview.metrics.interestedProjects = Array.isArray(investorInterests?.ventures)
        ? investorInterests.ventures.length
        : 0;
      state.overview = overview;
      state.children = Array.isArray(overview.children) ? overview.children : state.children;
      renderOverview();
    }catch(error){
      console.error("Family overview load failed",error);
      setHtml("#familyOverviewChildren",`<div class="family-error">${escapeHtml(error.message)}</div>`);
      setHtml("#familyOverviewRequests",`<div class="family-error">${escapeHtml(error.message)}</div>`);
      setHtml("#familyOverviewRecommendations",`<div class="family-error">Could not load recommendations.</div>`);
    }
  }

  function renderOverview(){
    const data = state.overview || {};
    const metrics = data.metrics || {};
    const network = data.network || {};

    setText("#familyMetricRequests",metrics.totalRequests ?? 0);
    setText("#familyMetricOpportunities",metrics.activeOpportunities ?? 0);
    setText("#familyMetricSaved",metrics.savedPrograms ?? 0);
    setText("#familyMetricInterested",metrics.interestedProjects ?? 0);
    setText("#familyRequestNavCount",metrics.totalRequests ?? 0);
    setText("#familyChildNavCount",metrics.children ?? 0);
    setText("#familyNetworkSchools",network.schools ?? 0);
    setText("#familyNetworkEmployers",network.employers ?? 0);
    setText("#familyNetworkOpportunities",network.opportunities ?? 0);
    setText("#familyNetworkVentures",network.ventures ?? 0);

    const children = Array.isArray(data.children) ? data.children : [];
    if(!children.length){
      setHtml("#familyOverviewChildren",`<div class="family-empty">No child profiles yet.<br><button class="family-small-button primary" type="button" data-add-child>+ Add Child</button></div>`);
    }else{
      setHtml("#familyOverviewChildren",children.slice(0,3).map(child => {
        const name = [child.firstName,child.lastName].filter(Boolean).join(" ");
        const linked = child.linkStatus === "linked";
        return `<div class="family-list-row">
          <div class="family-child-avatar">${child.profileImage ? `<img src="${escapeHtml(child.profileImage)}" alt="${escapeHtml(name)}">` : escapeHtml(initials(name))}</div>
          <div class="family-row-main"><div class="family-row-title">${escapeHtml(name)}</div><div class="family-row-subtitle">${escapeHtml(child.grade || child.educationLevel || "Education profile")} · ${linked ? "Linked AIFT Student" : "Not linked"}</div></div>
        </div>`;
      }).join(""));
    }

    const requests = Array.isArray(data.requests) ? data.requests : [];
    if(!requests.length){
      setHtml("#familyOverviewRequests",`<div class="family-empty">No requests yet. Your real funding and scholarship requests will appear here.</div>`);
    }else{
      setHtml("#familyOverviewRequests",requests.map(request => `<div class="family-list-row">
        <div class="family-row-main"><div class="family-row-title">${escapeHtml(request.title)}</div><div class="family-row-subtitle">${escapeHtml(request.kind === "venture" ? "Project Funding" : "Scholarship")} · ${escapeHtml(formatDate(request.updatedAt || request.createdAt))}</div></div>
        ${statusChip(request.status)}
      </div>`).join(""));
    }

    const recommendations = [
      ...(data.recommendations?.scholarships || []).map(item => ({ kind:"scholarship",item })),
      ...(data.recommendations?.opportunities || []).map(item => ({ kind:"opportunity",item }))
    ].slice(0,6);

    if(!recommendations.length){
      setHtml("#familyOverviewRecommendations",`<div class="family-empty">No live recommendations are available right now.</div>`);
    }else{
      setHtml("#familyOverviewRecommendations",recommendations.map(entry => discoveryCard(entry.kind,entry.item,true)).join(""));
    }
  }

  function discoveryCard(kind,item,compact = false){
    if(kind === "school"){
      const name = schoolName(item);
      const image = item.schoolLogo || item.profileImage || "";
      const programs = Array.isArray(item.programs) ? item.programs.slice(0,3) : [];
      return `<article class="family-discovery-card" data-school-id="${escapeHtml(item._id)}">
        <div class="family-discovery-top">${logoHtml(name,image)}<div><h3 class="family-discovery-title">${escapeHtml(name)}</h3><div class="family-discovery-source">${escapeHtml(item.location || item.address || "Location not specified")}</div></div></div>
        <p class="family-discovery-description">${escapeHtml(item.schoolDescription || "Public AIFT school profile")}</p>
        <div class="family-discovery-meta">${programs.map(program => `<span class="family-chip">${escapeHtml(program)}</span>`).join("")}${item.aiftVerified ? `<span class="family-chip approved">AIFT Verified</span>` : ""}</div>
        <div class="family-discovery-footer"><span></span><div class="family-row-actions"><button class="family-small-button" data-view-school="${escapeHtml(item._id)}" type="button">View</button><button class="family-small-button primary" data-message-user="${escapeHtml(item._id)}" type="button">Message</button></div></div>
      </article>`;
    }

    if(kind === "scholarship"){
      const name = organizationName(item);
      const image = organizationImage(item);
      const saved = isSaved("scholarship",item._id);
      return `<article class="family-discovery-card" data-scholarship-id="${escapeHtml(item._id)}">
        <div class="family-discovery-top">${logoHtml(name,image)}<div><h3 class="family-discovery-title">${escapeHtml(item.title || "Scholarship")}</h3><div class="family-discovery-source">${escapeHtml(name)}</div></div></div>
        <p class="family-discovery-description">${escapeHtml(item.summary || item.description || "Scholarship details are available from the sponsoring school.")}</p>
        <div class="family-discovery-meta"><span class="family-chip">${escapeHtml(titleCase(item.type || "scholarship"))}</span>${item.deadline ? `<span class="family-chip">Deadline ${escapeHtml(formatDate(item.deadline))}</span>` : ""}</div>
        <div class="family-discovery-footer"><span class="family-money">${escapeHtml(formatMoney(item.funding?.amount,item.funding?.currency))}</span><div class="family-row-actions"><button class="family-small-button ${saved ? "saved" : ""}" data-save-item="scholarship" data-item-id="${escapeHtml(item._id)}" type="button">${saved ? "Saved" : "Save"}</button><button class="family-small-button primary" data-apply-scholarship="${escapeHtml(item._id)}" type="button">Apply</button></div></div>
      </article>`;
    }

    if(kind === "opportunity"){
      const name = organizationName(item);
      const image = organizationImage(item);
      const saved = isSaved("opportunity",item._id);
      return `<article class="family-discovery-card" data-opportunity-id="${escapeHtml(item._id)}">
        <div class="family-discovery-top">${logoHtml(name,image)}<div><h3 class="family-discovery-title">${escapeHtml(item.title || "Opportunity")}</h3><div class="family-discovery-source">${escapeHtml(name)}</div></div></div>
        <p class="family-discovery-description">${escapeHtml(item.summary || item.description || "Live AIFT opportunity")}</p>
        <div class="family-discovery-meta"><span class="family-chip">${escapeHtml(titleCase(item.type))}</span>${item.location ? `<span class="family-chip">${escapeHtml(item.location)}</span>` : ""}${item.workSetup && item.workSetup !== "unspecified" ? `<span class="family-chip">${escapeHtml(titleCase(item.workSetup))}</span>` : ""}</div>
        <div class="family-discovery-footer"><span>${item.deadline ? `Deadline ${escapeHtml(formatDate(item.deadline))}` : "Open"}</span><div class="family-row-actions"><button class="family-small-button ${saved ? "saved" : ""}" data-save-item="opportunity" data-item-id="${escapeHtml(item._id)}" type="button">${saved ? "Saved" : "Save"}</button><button class="family-small-button primary" data-view-opportunity="${escapeHtml(item._id)}" type="button">View</button></div></div>
      </article>`;
    }

    return "";
  }

  async function loadSaved(){
    try{
      const data = await api("/api/family/saved");
      state.saved = Array.isArray(data?.saved) ? data.saved : [];
    }catch(error){
      console.warn("Family saved items could not load",error);
      state.saved = [];
    }
  }

  function isSaved(itemType,itemId){
    return state.saved.some(row =>
      row.itemType === itemType && String(row.itemId) === String(itemId)
    );
  }

  async function toggleSaved(itemType,itemId){
    try{
      if(isSaved(itemType,itemId)){
        await api(`/api/family/saved/${encodeURIComponent(itemType)}/${encodeURIComponent(itemId)}`,{ method:"DELETE" });
      }else{
        await api("/api/family/saved",{
          method:"POST",
          body:{ itemType,itemId }
        });
      }
      await loadSaved();
      state.overview = null;
      if(state.page === "scholarships") renderScholarships();
      if(state.page === "opportunities") renderOpportunities();
      if(state.page === "overview") loadOverview(true);
      toast("Saved items updated.","success");
    }catch(error){
      toast(error.message,"error");
    }
  }

  async function loadSchools(){
    setHtml("#familySchoolList",`<div class="family-loading">Loading schools…</div>`);
    try{
      const params = new URLSearchParams();
      const search = $("#familySchoolSearch")?.value.trim();
      const location = $("#familySchoolLocation")?.value.trim();
      const program = $("#familySchoolProgram")?.value.trim();
      if(search) params.set("search",search);
      if(location) params.set("location",location);
      if(program) params.set("program",program);
      params.set("limit","60");
      const data = await api(`/api/family/schools?${params}`);
      state.schools = Array.isArray(data?.schools) ? data.schools : [];
      renderSchools();
    }catch(error){
      setHtml("#familySchoolList",`<div class="family-error">${escapeHtml(error.message)}</div>`);
    }
  }

  function renderSchools(){
    if(!state.schools.length){
      setHtml("#familySchoolList",`<div class="family-empty">No public AIFT schools matched your search.</div>`);
      return;
    }
    setHtml("#familySchoolList",state.schools.map(item => discoveryCard("school",item)).join(""));
  }

  async function loadScholarships(){
    setHtml("#familyScholarshipList",`<div class="family-loading">Loading scholarships…</div>`);
    try{
      await Promise.all([loadSaved(),loadChildren()]);
      const params = new URLSearchParams({ limit:"60" });
      const search = $("#familyScholarshipSearch")?.value.trim();
      const type = $("#familyScholarshipType")?.value;
      if(search) params.set("search",search);
      if(type) params.set("type",type);
      const data = await api(`/api/family/scholarships?${params}`);
      state.scholarships = Array.isArray(data?.scholarships) ? data.scholarships : [];
      renderScholarships();
    }catch(error){
      setHtml("#familyScholarshipList",`<div class="family-error">${escapeHtml(error.message)}</div>`);
    }
  }

  function renderScholarships(){
    if(!state.scholarships.length){
      setHtml("#familyScholarshipList",`<div class="family-empty">No open public scholarships are available right now.</div>`);
      return;
    }
    setHtml("#familyScholarshipList",state.scholarships.map(item => discoveryCard("scholarship",item)).join(""));
  }

  async function loadOpportunities(){
    setHtml("#familyOpportunityList",`<div class="family-loading">Loading opportunities…</div>`);
    try{
      await loadSaved();
      const params = new URLSearchParams({ limit:"60" });
      const search = $("#familyOpportunitySearch")?.value.trim();
      const type = $("#familyOpportunityType")?.value;
      const location = $("#familyOpportunityLocation")?.value.trim();
      const workSetup = $("#familyOpportunitySetup")?.value;
      if(search) params.set("search",search);
      if(type) params.set("type",type);
      if(location) params.set("location",location);
      if(workSetup) params.set("workSetup",workSetup);
      const data = await api(`/api/family/opportunities?${params}`);
      state.opportunities = Array.isArray(data?.opportunities) ? data.opportunities : [];
      renderOpportunities();
    }catch(error){
      setHtml("#familyOpportunityList",`<div class="family-error">${escapeHtml(error.message)}</div>`);
    }
  }

  function renderOpportunities(){
    if(!state.opportunities.length){
      setHtml("#familyOpportunityList",`<div class="family-empty">No live public opportunities matched your filters.</div>`);
      return;
    }
    setHtml("#familyOpportunityList",state.opportunities.map(item => discoveryCard("opportunity",item)).join(""));
  }

  async function loadChildren(force = false){
    if(state.children.length && !force) return state.children;
    try{
      const data = await api("/api/family/children");
      state.children = Array.isArray(data?.children) ? data.children : [];
      renderChildren();
      setText("#familyChildNavCount",state.children.length);
      return state.children;
    }catch(error){
      if(state.page === "children"){
        setHtml("#familyChildList",`<div class="family-error">${escapeHtml(error.message)}</div>`);
      }
      return [];
    }
  }

  function renderChildren(){
    const list = $("#familyChildList");
    if(!list) return;
    if(!state.children.length){
      list.innerHTML = `<div class="family-empty">No child profiles yet. Add your first child to personalize education and scholarship activity.</div>`;
      return;
    }

    list.innerHTML = state.children.map(child => {
      const name = [child.firstName,child.lastName].filter(Boolean).join(" ");
      const linked = child.linkStatus === "linked" && child.linkedStudentId;
      return `<article class="family-child-card" data-child-id="${escapeHtml(child._id)}">
        <div class="family-child-avatar">${child.profileImage ? `<img src="${escapeHtml(child.profileImage)}" alt="${escapeHtml(name)}">` : escapeHtml(initials(name))}</div>
        <div class="family-child-main"><h3>${escapeHtml(name)}</h3><p>${escapeHtml(child.grade || titleCase(child.educationLevel) || "Education profile")} ${child.currentSchool ? `· ${escapeHtml(child.currentSchool)}` : ""}</p><p>${linked ? `Linked to ${escapeHtml(child.linkedStudentId.name || child.linkedStudentId.email || "AIFT Student")}` : "Not linked to an AIFT Student account"}</p><div class="family-row-actions" style="margin-top:10px"><button class="family-small-button" type="button" data-edit-child="${escapeHtml(child._id)}">Edit</button>${linked ? `<button class="family-small-button" type="button" data-unlink-child="${escapeHtml(child._id)}">Unlink Student</button>` : `<button class="family-small-button primary" type="button" data-link-child="${escapeHtml(child._id)}">Link Student</button>`}<button class="family-small-button" type="button" data-archive-child="${escapeHtml(child._id)}">Archive</button></div></div>
      </article>`;
    }).join("");
  }

  function resetChildForm(){
    $("#familyChildForm")?.reset();
    setText("#familyChildModalTitle","Add Child");
    if($("#familyChildId")) $("#familyChildId").value = "";
  }

  function editChild(id){
    const child = state.children.find(item => String(item._id) === String(id));
    if(!child) return;
    setText("#familyChildModalTitle","Edit Child");
    $("#familyChildId").value = child._id || "";
    $("#familyChildFirstName").value = child.firstName || "";
    $("#familyChildLastName").value = child.lastName || "";
    $("#familyChildBirthDate").value = child.birthDate ? new Date(child.birthDate).toISOString().slice(0,10) : "";
    $("#familyChildLocation").value = child.location || "";
    $("#familyChildEducationLevel").value = child.educationLevel || "";
    $("#familyChildGrade").value = child.grade || "";
    $("#familyChildSchool").value = child.currentSchool || "";
    $("#familyChildTrack").value = child.track || "";
    $("#familyChildGoal").value = child.goal || "";
    $("#familyChildInterests").value = Array.isArray(child.interests) ? child.interests.join(", ") : "";
    $("#familyChildNotes").value = child.notes || "";
    $("#familyChildProfileImage").value = child.profileImage || "";
    $("#familyChildConsent").checked = child.consentConfirmed === true;
    openModal("familyChildModal");
  }

  async function saveChild(event){
    event.preventDefault();
    const id = $("#familyChildId").value;
    const payload = {
      firstName:$("#familyChildFirstName").value.trim(),
      lastName:$("#familyChildLastName").value.trim(),
      birthDate:$("#familyChildBirthDate").value || null,
      location:$("#familyChildLocation").value.trim(),
      educationLevel:$("#familyChildEducationLevel").value,
      grade:$("#familyChildGrade").value.trim(),
      currentSchool:$("#familyChildSchool").value.trim(),
      track:$("#familyChildTrack").value.trim(),
      goal:$("#familyChildGoal").value.trim(),
      interests:$("#familyChildInterests").value.split(",").map(value => value.trim()).filter(Boolean),
      notes:$("#familyChildNotes").value.trim(),
      profileImage:$("#familyChildProfileImage").value.trim(),
      consentConfirmed:$("#familyChildConsent").checked
    };

    if(!payload.consentConfirmed){
      toast("Confirm family consent before saving this child profile.","error");
      return;
    }

    try{
      await api(id ? `/api/family/children/${encodeURIComponent(id)}` : "/api/family/children",{
        method:id ? "PATCH" : "POST",
        body:payload
      });
      closeModal("familyChildModal");
      state.children = [];
      state.overview = null;
      await loadChildren(true);
      if(state.page === "overview") loadOverview(true);
      toast(id ? "Child profile updated." : "Child profile created.","success");
    }catch(error){
      toast(error.message,"error");
    }
  }

  async function linkChild(event){
    event.preventDefault();
    const childId = $("#familyLinkChildId").value;
    const studentId = $("#familyLinkStudentId").value.trim();
    try{
      await api(`/api/family/children/${encodeURIComponent(childId)}/link-student`,{
        method:"PATCH",
        body:{ studentId }
      });
      closeModal("familyLinkModal");
      state.children = [];
      state.overview = null;
      await loadChildren(true);
      toast("AIFT Student account linked.","success");
    }catch(error){
      toast(error.message,"error");
    }
  }

  async function unlinkChild(id){
    if(!window.confirm("Unlink this AIFT Student account from the child profile?")) return;
    try{
      await api(`/api/family/children/${encodeURIComponent(id)}/unlink-student`,{ method:"PATCH" });
      state.children = [];
      state.overview = null;
      await loadChildren(true);
      toast("Student account unlinked.","success");
    }catch(error){ toast(error.message,"error"); }
  }

  async function archiveChild(id){
    if(!window.confirm("Archive this child profile? Historical requests will remain available.")) return;
    try{
      await api(`/api/family/children/${encodeURIComponent(id)}`,{ method:"DELETE" });
      state.children = [];
      state.overview = null;
      await loadChildren(true);
      toast("Child profile archived.","success");
    }catch(error){ toast(error.message,"error"); }
  }

  function scholarshipById(id){
    return state.scholarships.find(item => String(item._id) === String(id)) ||
      state.overview?.recommendations?.scholarships?.find(item => String(item._id) === String(id));
  }

  function parseDocumentLinks(value){
    return String(value || "")
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [namePart,...urlParts] = line.split("|");
        const url = urlParts.join("|").trim();
        return {
          name:(url ? namePart : "Document").trim() || "Document",
          url:(url || namePart).trim()
        };
      })
      .filter(document => /^https?:\/\//i.test(document.url));
  }

  function documentLinksValue(documents){
    return (Array.isArray(documents) ? documents : [])
      .map(document => `${document.name || "Document"} | ${document.url || ""}`)
      .filter(line => !line.endsWith("| "))
      .join("\n");
  }

  async function openScholarshipApplication(scholarshipId,applicationId = ""){
    await loadChildren();
    const scholarship = scholarshipById(scholarshipId) ||
      state.scholarshipApplications.find(app => String(app.scholarshipId?._id) === String(scholarshipId))?.scholarshipId;
    let application = null;

    if(applicationId){
      try{
        const data = await api(`/api/scholarship-applications/${encodeURIComponent(applicationId)}`);
        application = data?.application || data?.item || null;
      }catch(error){
        toast(error.message,"error");
        return;
      }
    }

    $("#familyScholarshipApplicationForm")?.reset();
    $("#familyScholarshipId").value = scholarshipId || "";
    $("#familyScholarshipApplicationId").value = application?._id || "";
    setText("#familyScholarshipModalTitle",application ? "Manage Scholarship Application" : (scholarship?.title || "Scholarship Application"));
    setText("#familyScholarshipModalSubtitle",scholarship ? `${schoolName(scholarship.schoolId)} · ${titleCase(scholarship.type)}` : "Apply using a linked AIFT Student child profile.");

    const childSelect = $("#familyScholarshipChild");
    if(childSelect){
      childSelect.innerHTML = `<option value="">Select child</option>` + state.children.map(child => {
        const linked = child.linkStatus === "linked" && child.linkedStudentId;
        const name = [child.firstName,child.lastName].filter(Boolean).join(" ");
        return `<option value="${escapeHtml(child._id)}" ${linked ? "" : "disabled"}>${escapeHtml(name)}${linked ? "" : " — link AIFT Student first"}</option>`;
      }).join("");
      childSelect.value = application?.familyChildId?._id || application?.familyChildId || "";
      if(application) childSelect.disabled = true;
    }

    $("#familyScholarshipPersonalStatement").value = application?.personalStatement || "";
    $("#familyScholarshipFinancialNeed").value = application?.financialNeedStatement || "";
    $("#familyScholarshipAchievements").value = Array.isArray(application?.achievements) ? application.achievements.join(", ") : "";
    $("#familyScholarshipProgram").value = application?.academicSnapshot?.program || "";
    $("#familyScholarshipYear").value = application?.academicSnapshot?.yearLevel || "";
    $("#familyScholarshipGpa").value = application?.academicSnapshot?.gpa ?? "";
    $("#familyScholarshipAverage").value = application?.academicSnapshot?.gradeAverage ?? "";
    $("#familyScholarshipDocuments").value = documentLinksValue(application?.documents);

    const required = scholarship?.requiredDocuments || application?.scholarshipId?.requiredDocuments || [];
    setText("#familyScholarshipRequiredDocuments",required.length
      ? `Required by the school: ${required.join(", ")}. Add secure document links using “Document name | URL”.`
      : "This scholarship does not list required documents in AIFT.");

    const draftButton = $("#familyScholarshipSaveDraft");
    const editable = !application || application.status === "draft";
    if(draftButton) draftButton.disabled = !editable;
    $$("#familyScholarshipApplicationForm input, #familyScholarshipApplicationForm textarea").forEach(field => {
      if(field.type !== "hidden") field.disabled = !editable;
    });
    if(childSelect) childSelect.disabled = Boolean(application) || !editable;
    const submit = $("#familyScholarshipApplicationForm [type='submit']");
    if(submit){
      submit.disabled = !editable;
      submit.textContent = application ? "Submit Application" : "Submit Application";
    }

    openModal("familyScholarshipModal");
  }

  function scholarshipPayload(status){
    const body = {
      scholarshipId:$("#familyScholarshipId").value,
      childId:$("#familyScholarshipChild").value,
      status,
      personalStatement:$("#familyScholarshipPersonalStatement").value.trim(),
      financialNeedStatement:$("#familyScholarshipFinancialNeed").value.trim(),
      achievements:$("#familyScholarshipAchievements").value.split(",").map(value => value.trim()).filter(Boolean),
      documents:parseDocumentLinks($("#familyScholarshipDocuments").value),
      academicSnapshot:{
        program:$("#familyScholarshipProgram").value.trim(),
        yearLevel:$("#familyScholarshipYear").value.trim(),
        gpa:$("#familyScholarshipGpa").value === "" ? null : Number($("#familyScholarshipGpa").value),
        gradeAverage:$("#familyScholarshipAverage").value === "" ? null : Number($("#familyScholarshipAverage").value)
      }
    };
    return body;
  }

  async function persistScholarshipApplication(status){
    const applicationId = $("#familyScholarshipApplicationId").value;
    const payload = scholarshipPayload(status);
    if(!applicationId && !payload.childId){
      toast("Select a child linked to an AIFT Student account.","error");
      return;
    }

    try{
      if(applicationId){
        const update = { ...payload };
        delete update.scholarshipId;
        delete update.childId;
        await api(`/api/scholarship-applications/${encodeURIComponent(applicationId)}`,{
          method:"PATCH",
          body:update
        });
      }else{
        await api("/api/scholarship-applications",{
          method:"POST",
          body:payload
        });
      }

      closeModal("familyScholarshipModal");
      state.overview = null;
      await loadRequests(true);
      toast(status === "draft" ? "Scholarship draft saved." : "Scholarship application submitted.","success");
    }catch(error){
      let message = error.message;
      if(Array.isArray(error.data?.missingDocuments)){
        message += ` Missing: ${error.data.missingDocuments.join(", ")}`;
      }
      toast(message,"error");
    }
  }

  function fundingPayload(){
    const support = $("#familyFundingSupport").value;
    const goal = Math.max(0,Number($("#familyFundingGoal").value || 0));
    const investment = support === "investment-interest";
    return {
      title:$("#familyFundingTitle").value.trim(),
      tagline:$("#familyFundingSummary").value.trim().slice(0,220),
      description:$("#familyFundingSummary").value.trim(),
      ventureType:$("#familyFundingType").value,
      stage:$("#familyFundingStage").value,
      industry:$("#familyFundingIndustry").value.trim(),
      location:$("#familyFundingLocation").value.trim(),
      problem:$("#familyFundingProblem").value.trim(),
      solution:$("#familyFundingSolution").value.trim(),
      targetMarket:$("#familyFundingTargetMarket").value.trim(),
      fundingGoal:goal,
      currency:"PHP",
      fundingPurpose:$("#familyFundingPurpose").value.trim(),
      fundingTypes:[support],
      seekingInvestment:investment,
      investmentRangeMin:investment ? goal : 0,
      investmentRangeMax:investment ? goal : 0,
      investmentNotes:investment ? $("#familyFundingPurpose").value.trim() : "",
      fundingStage:investment
        ? ($("#familyFundingStage").value === "growth" ? "growth" : $("#familyFundingType").value === "startup" ? "pre_seed" : "project_funding")
        : (support === "grant" ? "grant" : "project_funding"),
      tags:["family","family-funding"],
      visibility:"aift-only"
    };
  }

  function resetFunding(){
    state.currentFundingId = null;
    $("#familyFundingForm")?.reset();
    if($("#familyFundingType")) $("#familyFundingType").value = "student-project";
    if($("#familyFundingStage")) $("#familyFundingStage").value = "idea";
    if($("#familyFundingSupport")) $("#familyFundingSupport").value = "investment-interest";
    setText("#familyFundingHeading","Project Funding");
  }

  async function saveFundingDraft(){
    const payload = fundingPayload();
    if(!payload.title){
      toast("Project title is required before saving a draft.","error");
      return null;
    }
    try{
      const venture = state.currentFundingId
        ? await api(`/api/ventures/${encodeURIComponent(state.currentFundingId)}`,{ method:"PATCH",body:payload })
        : await api("/api/ventures",{ method:"POST",body:payload });
      state.currentFundingId = String(venture?._id || state.currentFundingId || "");
      state.overview = null;
      toast("Project funding draft saved.","success");
      return venture;
    }catch(error){
      toast(error.message,"error");
      return null;
    }
  }

  async function publishFunding(event){
    event.preventDefault();
    const payload = fundingPayload();
    if(!payload.title || !payload.description || !payload.problem || !payload.solution){
      toast("Title, summary, problem and solution are required before publishing.","error");
      return;
    }

    try{
      let venture;
      if(state.currentFundingId){
        venture = await api(`/api/ventures/${encodeURIComponent(state.currentFundingId)}`,{ method:"PATCH",body:payload });
      }else{
        venture = await api("/api/ventures",{ method:"POST",body:payload });
      }
      const id = String(venture?._id || state.currentFundingId || "");
      if(!id) throw new Error("AIFT did not return the Venture ID.");
      await api(`/api/ventures/${encodeURIComponent(id)}/publish`,{ method:"PATCH" });
      state.currentFundingId = id;
      state.overview = null;
      state.investor.discover = [];
      toast("Project funding request published.","success");
      openPage("requests");
    }catch(error){ toast(error.message,"error"); }
  }

  async function editVenture(id){
    try{
      const venture = await api(`/api/ventures/${encodeURIComponent(id)}/manage`);
      state.currentFundingId = String(venture._id || id);
      $("#familyFundingTitle").value = venture.title || "";
      $("#familyFundingType").value = venture.ventureType || "student-project";
      $("#familyFundingStage").value = venture.stage || "idea";
      $("#familyFundingIndustry").value = venture.industry || "";
      $("#familyFundingLocation").value = venture.location || "";
      $("#familyFundingSummary").value = venture.description || venture.tagline || "";
      $("#familyFundingProblem").value = venture.problem || "";
      $("#familyFundingSolution").value = venture.solution || "";
      $("#familyFundingGoal").value = venture.fundingGoal || "";
      $("#familyFundingPurpose").value = venture.fundingPurpose || "";
      $("#familyFundingTargetMarket").value = venture.targetMarket || "";
      const types = Array.isArray(venture.fundingTypes) ? venture.fundingTypes : [];
      $("#familyFundingSupport").value = types[0] || (venture.seekingInvestment ? "investment-interest" : "grant");
      setText("#familyFundingHeading",venture.status === "draft" ? "Continue Funding Draft" : "Manage Funding Request");
      openPage("funding");
    }catch(error){ toast(error.message,"error"); }
  }

  async function loadRequests(force = false){
    if(!force && state.ventures.length && state.scholarshipApplications.length){
      renderRequests();
      return;
    }
    setHtml("#familyRequestList",`<div class="family-loading">Loading requests…</div>`);
    try{
      const [venturesData,applicationsData] = await Promise.all([
        api("/api/ventures/mine"),
        api("/api/scholarship-applications")
      ]);
      state.ventures = Array.isArray(venturesData) ? venturesData : [];
      state.scholarshipApplications = Array.isArray(applicationsData?.applications)
        ? applicationsData.applications
        : Array.isArray(applicationsData) ? applicationsData : [];
      renderRequests();
      setText("#familyRequestNavCount",state.ventures.length + state.scholarshipApplications.length);
    }catch(error){
      setHtml("#familyRequestList",`<div class="family-error">${escapeHtml(error.message)}</div>`);
    }
  }

  function renderRequests(){
    const search = $("#familyRequestSearch")?.value.trim().toLowerCase() || "";
    const kind = $("#familyRequestKind")?.value || "";
    const status = $("#familyRequestStatus")?.value || "";

    const rows = [
      ...state.ventures.map(item => ({
        kind:"venture",
        id:item._id,
        title:item.title || "Untitled Project",
        status:item.status || "draft",
        date:item.updatedAt || item.createdAt,
        subtitle:`${titleCase(item.ventureType || "project")} · ${formatMoney(item.fundingGoal,item.currency)}`,
        raw:item
      })),
      ...state.scholarshipApplications.map(item => ({
        kind:"scholarship",
        id:item._id,
        title:item.scholarshipId?.title || "Scholarship Application",
        status:item.status || "draft",
        date:item.updatedAt || item.createdAt,
        subtitle:`${schoolName(item.schoolId)}${item.familyChildId ? ` · ${[item.familyChildId.firstName,item.familyChildId.lastName].filter(Boolean).join(" ")}` : ""}`,
        raw:item
      }))
    ]
      .filter(row => !kind || row.kind === kind)
      .filter(row => !status || row.status === status)
      .filter(row => !search || `${row.title} ${row.subtitle}`.toLowerCase().includes(search))
      .sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));

    if(!rows.length){
      setHtml("#familyRequestList",`<div class="family-empty">No requests match your filters.</div>`);
      return;
    }

    setHtml("#familyRequestList",rows.map(row => {
      let actions = "";
      if(row.kind === "venture"){
        actions = `<button class="family-small-button primary" type="button" data-edit-venture="${escapeHtml(row.id)}">${row.status === "draft" ? "Continue" : "Manage"}</button>`;
      }else if(row.status === "draft"){
        actions = `<button class="family-small-button primary" type="button" data-edit-scholarship-application="${escapeHtml(row.id)}" data-scholarship-id="${escapeHtml(row.raw.scholarshipId?._id || row.raw.scholarshipId || "")}">Continue</button><button class="family-small-button" type="button" data-delete-scholarship-application="${escapeHtml(row.id)}">Delete Draft</button>`;
      }else if(["submitted","review","shortlisted","approved"].includes(row.status)){
        actions = `<button class="family-small-button" type="button" data-view-scholarship-application="${escapeHtml(row.id)}">View</button><button class="family-small-button" type="button" data-withdraw-scholarship-application="${escapeHtml(row.id)}">Withdraw</button>`;
      }else{
        actions = `<button class="family-small-button" type="button" data-view-scholarship-application="${escapeHtml(row.id)}">View</button>`;
      }

      return `<article class="family-request-card"><div><h3 class="family-request-title">${escapeHtml(row.title)}</h3><div class="family-request-meta"><span>${escapeHtml(row.kind === "venture" ? "Project Funding" : "Scholarship")}</span><span>${escapeHtml(row.subtitle)}</span><span>${escapeHtml(formatDate(row.date))}</span>${statusChip(row.status)}</div></div><div class="family-row-actions">${actions}</div></article>`;
    }).join(""));
  }

  async function deleteScholarshipDraft(id){
    if(!window.confirm("Delete this scholarship draft?")) return;
    try{
      await api(`/api/scholarship-applications/${encodeURIComponent(id)}`,{ method:"DELETE" });
      state.overview = null;
      await loadRequests(true);
      toast("Scholarship draft deleted.","success");
    }catch(error){ toast(error.message,"error"); }
  }

  async function withdrawScholarship(id){
    if(!window.confirm("Withdraw this scholarship application?")) return;
    try{
      await api(`/api/scholarship-applications/${encodeURIComponent(id)}`,{
        method:"PATCH",
        body:{ status:"withdrawn" }
      });
      state.overview = null;
      await loadRequests(true);
      toast("Scholarship application withdrawn.","success");
    }catch(error){ toast(error.message,"error"); }
  }

  async function viewScholarshipApplication(id){
    try{
      const data = await api(`/api/scholarship-applications/${encodeURIComponent(id)}`);
      const app = data?.application || data?.item;
      if(!app) return;
      const title = app.scholarshipId?.title || "Scholarship Application";
      setText("#familyDetailTitle",title);
      setText("#familyDetailSubtitle",`${schoolName(app.schoolId)} · ${titleCase(app.status)}`);
      setHtml("#familyDetailBody",`
        <div class="family-stack">
          <div><strong>Status</strong><p>${statusChip(app.status)}</p></div>
          <div><strong>Applicant</strong><p>${escapeHtml(app.studentId?.name || "Linked AIFT Student")}</p></div>
          <div><strong>Personal statement</strong><p>${escapeHtml(app.personalStatement || "Not provided")}</p></div>
          <div><strong>Financial need</strong><p>${escapeHtml(app.financialNeedStatement || "Not provided")}</p></div>
          ${app.reviewerNotes ? `<div><strong>School notes</strong><p>${escapeHtml(app.reviewerNotes)}</p></div>` : ""}
          ${app.awardAmount ? `<div><strong>Award</strong><p>${escapeHtml(formatMoney(app.awardAmount,app.awardCurrency))}</p></div>` : ""}
        </div>`);
      openModal("familyDetailModal");
    }catch(error){ toast(error.message,"error"); }
  }

  function investorVentureCard(venture,mode = "discover"){
    const owner = venture.ownerId || {};
    const name = owner.schoolName || owner.companyName || owner.name || "AIFT Venture";
    const image = owner.schoolLogo || owner.profileImage || venture.coverImage || "";
    const stateData = venture.investorState || {};
    const saved = stateData.saved === true || mode === "saved";
    const interested = stateData.interested === true || mode === "interested";
    const amount = venture.investmentRangeMax || venture.fundingGoal || 0;
    return `<article class="family-discovery-card" data-venture-id="${escapeHtml(venture._id)}">
      <div class="family-discovery-top">${logoHtml(name,image)}<div><h3 class="family-discovery-title">${escapeHtml(venture.title || "Untitled Venture")}</h3><div class="family-discovery-source">${escapeHtml(name)}</div></div></div>
      <p class="family-discovery-description">${escapeHtml(venture.description || venture.tagline || "No description provided.")}</p>
      <div class="family-discovery-meta"><span class="family-chip">${escapeHtml(titleCase(venture.ventureType))}</span><span class="family-chip">${escapeHtml(titleCase(venture.stage))}</span>${venture.industry ? `<span class="family-chip">${escapeHtml(venture.industry)}</span>` : ""}${interested && stateData.interestStatus ? statusChip(stateData.interestStatus) : ""}</div>
      <div class="family-discovery-footer"><span class="family-money">${escapeHtml(formatMoney(amount,venture.currency))}</span><div class="family-row-actions"><button class="family-small-button" type="button" data-view-venture="${escapeHtml(venture._id)}">View</button>${mode !== "interested" ? `<button class="family-small-button ${saved ? "saved" : ""}" type="button" data-save-venture="${escapeHtml(venture._id)}">${saved ? "Saved" : "Save"}</button>` : ""}${mode === "discover" && !interested ? `<button class="family-small-button primary" type="button" data-interest-venture="${escapeHtml(venture._id)}">I'm Interested</button>` : ""}</div></div>
    </article>`;
  }

  async function ensureInvestorEnabled(){
    if(state.profile?.familyProfile?.investorEnabled === true) return true;
    updateInvestorAccessUi();
    return false;
  }

  async function loadInvestorDiscover(force = false){
    if(!(await ensureInvestorEnabled())){
      setHtml("#familyInvestorDiscoverList",`<div class="family-empty">Enable Investor Mode to access investment discovery.</div>`);
      return;
    }
    if(state.investor.discover.length && !force){ renderInvestorDiscover(); return; }
    setHtml("#familyInvestorDiscoverList",`<div class="family-loading">Loading ventures…</div>`);
    try{
      const data = await api("/api/ventures/investor/discover?limit=50&sort=newest");
      state.investor.discover = Array.isArray(data?.ventures) ? data.ventures : [];
      renderInvestorDiscover();
    }catch(error){ setHtml("#familyInvestorDiscoverList",`<div class="family-error">${escapeHtml(error.message)}</div>`); }
  }

  function renderInvestorDiscover(){
    const search = $("#familyInvestorSearch")?.value.trim().toLowerCase() || "";
    const rows = state.investor.discover.filter(item =>
      !search || `${item.title || ""} ${item.description || ""} ${item.industry || ""}`.toLowerCase().includes(search)
    );
    setHtml("#familyInvestorDiscoverList",rows.length
      ? rows.map(item => investorVentureCard(item,"discover")).join("")
      : `<div class="family-empty">No investment opportunities matched your search.</div>`);
  }

  async function loadInvestorSaved(force = false){
    if(!(await ensureInvestorEnabled())){
      setHtml("#familyInvestorSavedList",`<div class="family-empty">Enable Investor Mode first.</div>`);
      return;
    }
    if(state.investor.saved.length && !force){ renderInvestorSaved(); return; }
    try{
      const data = await api("/api/ventures/investor/saved");
      state.investor.saved = Array.isArray(data?.ventures) ? data.ventures : [];
      renderInvestorSaved();
    }catch(error){ setHtml("#familyInvestorSavedList",`<div class="family-error">${escapeHtml(error.message)}</div>`); }
  }

  function renderInvestorSaved(){
    setHtml("#familyInvestorSavedList",state.investor.saved.length
      ? state.investor.saved.map(item => investorVentureCard(item,"saved")).join("")
      : `<div class="family-empty">No saved Ventures yet.</div>`);
  }

  async function loadInvestorInterested(force = false){
    if(!(await ensureInvestorEnabled())){
      setHtml("#familyInvestorInterestedList",`<div class="family-empty">Enable Investor Mode first.</div>`);
      return;
    }
    if(state.investor.interested.length && !force){ renderInvestorInterested(); return; }
    try{
      const data = await api("/api/ventures/investor/interested");
      state.investor.interested = Array.isArray(data?.ventures) ? data.ventures : [];
      renderInvestorInterested();
    }catch(error){ setHtml("#familyInvestorInterestedList",`<div class="family-error">${escapeHtml(error.message)}</div>`); }
  }

  function renderInvestorInterested(){
    setHtml("#familyInvestorInterestedList",state.investor.interested.length
      ? state.investor.interested.map(item => investorVentureCard(item,"interested")).join("")
      : `<div class="family-empty">You have not expressed investment interest in a Venture yet.</div>`);
  }

  async function saveVenture(id){
    try{
      await api(`/api/ventures/${encodeURIComponent(id)}/save`,{ method:"PATCH" });
      state.investor.discover = [];
      state.investor.saved = [];
      await Promise.all([loadInvestorDiscover(true),loadInvestorSaved(true)]);
      toast("Saved Ventures updated.","success");
    }catch(error){ toast(error.message,"error"); }
  }

  async function interestVenture(id){
    try{
      await api(`/api/ventures/${encodeURIComponent(id)}/interests`,{
        method:"POST",
        body:{ type:"investment",message:"I am interested in learning more about this Venture through AIFT." }
      });
      state.investor.discover = [];
      state.investor.interested = [];
      state.overview = null;
      await Promise.all([loadInvestorDiscover(true),loadInvestorInterested(true)]);
      toast("Investment interest submitted.","success");
    }catch(error){ toast(error.message,"error"); }
  }

  async function viewVenture(id){
    try{
      await api(`/api/ventures/${encodeURIComponent(id)}/view`,{ method:"PATCH" }).catch(() => null);
      const venture = await api(`/api/ventures/${encodeURIComponent(id)}`);
      setText("#familyDetailTitle",venture.title || "Venture");
      setText("#familyDetailSubtitle",`${titleCase(venture.ventureType)} · ${titleCase(venture.stage)}`);
      setHtml("#familyDetailBody",`<div class="family-stack"><div><strong>Description</strong><p>${escapeHtml(venture.description || venture.tagline || "Not provided")}</p></div><div><strong>Problem</strong><p>${escapeHtml(venture.problem || "Not provided")}</p></div><div><strong>Solution</strong><p>${escapeHtml(venture.solution || "Not provided")}</p></div><div><strong>Funding goal</strong><p>${escapeHtml(formatMoney(venture.fundingGoal,venture.currency))}</p></div></div>`);
      openModal("familyDetailModal");
    }catch(error){ toast(error.message,"error"); }
  }

  async function viewSchool(id){
    const school = state.schools.find(item => String(item._id) === String(id));
    if(!school) return;
    setText("#familyDetailTitle",schoolName(school));
    setText("#familyDetailSubtitle",school.location || school.address || "AIFT School");
    setHtml("#familyDetailBody",`<div class="family-stack"><div><strong>About</strong><p>${escapeHtml(school.schoolDescription || "No public description provided.")}</p></div><div><strong>Programs</strong><p>${escapeHtml((school.programs || []).join(", ") || "No programs listed.")}</p></div>${school.website ? `<div><strong>Website</strong><p><a href="${escapeHtml(school.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(school.website)}</a></p></div>` : ""}</div>`);
    openModal("familyDetailModal");
  }

  async function viewOpportunity(id){
    const item = state.opportunities.find(row => String(row._id) === String(id)) || state.overview?.recommendations?.opportunities?.find(row => String(row._id) === String(id));
    if(!item) return;
    setText("#familyDetailTitle",item.title || "Opportunity");
    setText("#familyDetailSubtitle",organizationName(item));
    setHtml("#familyDetailBody",`<div class="family-stack"><div><strong>Description</strong><p>${escapeHtml(item.description || item.summary || "Not provided")}</p></div><div><strong>Location</strong><p>${escapeHtml(item.location || "Not specified")}</p></div><div><strong>Deadline</strong><p>${escapeHtml(formatDate(item.deadline) || "Not specified")}</p></div>${item.applicationInstructions ? `<div><strong>Application instructions</strong><p>${escapeHtml(item.applicationInstructions)}</p></div>` : ""}${item.externalApplicationUrl ? `<div><a class="family-button primary" href="${escapeHtml(item.externalApplicationUrl)}" target="_blank" rel="noopener noreferrer">Open Application</a></div>` : ""}</div>`);
    openModal("familyDetailModal");
  }

  async function messageUser(userId){
    try{
      const conversation = await api("/api/conversations/direct",{
        method:"POST",
        body:{ userId }
      });
      openPage("messages");
      await loadMessages(true);
      const id = conversation?._id || conversation?.conversationId;
      if(id) await openConversation(id);
    }catch(error){ toast(error.message,"error"); }
  }

  async function loadMessages(force = false){
    if(state.conversations.length && !force){ renderConversations(); return; }
    setHtml("#familyConversationList",`<div class="family-loading">Loading conversations…</div>`);
    try{
      const data = await api("/api/conversations?limit=100");
      state.conversations = Array.isArray(data) ? data : [];
      renderConversations();
      updateMessageCounts();
    }catch(error){ setHtml("#familyConversationList",`<div class="family-error">${escapeHtml(error.message)}</div>`); }
  }

  function updateMessageCounts(){
    const count = state.conversations.reduce((sum,item) => sum + Number(item.unreadCount || item.unread || 0),0);
    setText("#familyMessageNavCount",count);
    setText("#familyMessageBadge",count);
    $("#familyMessageBadge")?.classList.toggle("hidden",count === 0);
  }

  function renderConversations(){
    if(!state.conversations.length){
      setHtml("#familyConversationList",`<div class="family-empty">No conversations yet. Use Message on a school or other AIFT profile to start one.</div>`);
      return;
    }
    setHtml("#familyConversationList",state.conversations.map(conversation => {
      const name = conversation.displayName || conversation.title || conversation.user?.companyName || conversation.user?.schoolName || conversation.user?.name || "Conversation";
      const image = conversation.displayImage || conversation.user?.profileImage || conversation.user?.logo || "";
      const active = String(state.activeConversation?._id || "") === String(conversation._id);
      return `<button class="family-conversation-item ${active ? "active" : ""}" type="button" data-conversation-id="${escapeHtml(conversation._id)}">${image ? `<div class="family-avatar"><img src="${escapeHtml(image)}" alt="${escapeHtml(name)}"></div>` : `<div class="family-avatar">${escapeHtml(initials(name))}</div>`}<div class="family-conversation-copy"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(conversation.lastMessage?.text || conversation.lastMessage || "No messages yet")}</span></div>${Number(conversation.unreadCount || 0) > 0 ? `<span class="family-chip active">${escapeHtml(conversation.unreadCount)}</span>` : ""}</button>`;
    }).join(""));
  }

  async function openConversation(id){
    const conversation = state.conversations.find(item => String(item._id) === String(id));
    if(!conversation) return;
    state.activeConversation = conversation;
    renderConversations();
    const name = conversation.displayName || conversation.title || conversation.user?.companyName || conversation.user?.schoolName || conversation.user?.name || "Conversation";
    setText("#familyChatHead",name);
    $("#familyChatInput").disabled = false;
    $("#familyChatSend").disabled = false;
    setHtml("#familyChatMessages",`<div class="family-loading">Loading messages…</div>`);
    try{
      const messages = await api(`/api/conversations/${encodeURIComponent(id)}/messages?limit=100`);
      state.activeMessages = Array.isArray(messages) ? messages : [];
      await api(`/api/conversations/${encodeURIComponent(id)}/read`,{ method:"PATCH" }).catch(() => null);
      conversation.unreadCount = 0;
      renderActiveMessages();
      updateMessageCounts();
    }catch(error){ setHtml("#familyChatMessages",`<div class="family-error">${escapeHtml(error.message)}</div>`); }
  }

  function renderActiveMessages(){
    const currentId = String(state.profile?.user?.id || "");
    if(!state.activeMessages.length){
      setHtml("#familyChatMessages",`<div class="family-empty">No messages in this conversation yet.</div>`);
      return;
    }
    setHtml("#familyChatMessages",state.activeMessages.map(message => {
      const senderId = String(message.sender?._id || message.sender || "");
      return `<div class="family-message-bubble ${senderId === currentId ? "mine" : ""}">${escapeHtml(message.text || (message.fileUrl ? "Attachment" : ""))}<div class="family-help">${escapeHtml(formatDateTime(message.createdAt))}</div></div>`;
    }).join(""));
    const box = $("#familyChatMessages");
    if(box) box.scrollTop = box.scrollHeight;
  }

  async function sendMessage(event){
    event.preventDefault();
    const input = $("#familyChatInput");
    const value = input.value.trim();
    if(!value || !state.activeConversation) return;
    const participants = state.activeConversation.participants || [];
    const currentId = String(state.profile?.user?.id || "");
    const otherParticipant = participants.find(participant => String(participant.user?._id || participant.user || "") !== currentId);
    const receiverId = state.activeConversation.user?._id || otherParticipant?.user?._id || otherParticipant?.user;
    if(!receiverId){ toast("Could not identify the message recipient.","error"); return; }
    input.disabled = true;
    try{
      const message = await api("/api/messages",{
        method:"POST",
        body:{ receiverId,text:value }
      });
      input.value = "";
      state.activeMessages.push(message);
      renderActiveMessages();
      state.conversations = [];
      await loadMessages(true);
    }catch(error){ toast(error.message,"error"); }
    finally{ input.disabled = false; input.focus(); }
  }

  async function loadNotifications(force = false){
    if(state.notifications.length && !force){ renderNotifications(); return; }
    setHtml("#familyNotificationList",`<div class="family-loading">Loading notifications…</div>`);
    try{
      const data = await api("/api/notifications");
      state.notifications = Array.isArray(data) ? data : [];
      renderNotifications();
      updateNotificationCounts();
    }catch(error){ setHtml("#familyNotificationList",`<div class="family-error">${escapeHtml(error.message)}</div>`); }
  }

  function updateNotificationCounts(){
    const count = state.notifications.filter(item => item.read !== true).length;
    setText("#familyNotificationNavCount",count);
    setText("#familyNotificationBadge",count);
    $("#familyNotificationBadge")?.classList.toggle("hidden",count === 0);
  }

  function renderNotifications(){
    if(!state.notifications.length){
      setHtml("#familyNotificationList",`<div class="family-empty">No notifications.</div>`);
      return;
    }
    setHtml("#familyNotificationList",state.notifications.map(notification => {
      const sender = notification.sender?.name || "AIFT";
      const title = notification.title || notification.type || "Notification";
      const message = notification.message || notification.text || "";
      return `<button class="family-notification-row ${notification.read ? "" : "unread"}" type="button" data-notification-id="${escapeHtml(notification._id)}" style="width:100%;border-left:0;border-right:0;border-top:0;background-color:transparent;text-align:left"><div class="family-avatar">${escapeHtml(initials(sender))}</div><div class="family-notification-main"><strong>${escapeHtml(titleCase(title))}</strong><p>${escapeHtml(message)}</p></div><div class="family-notification-time">${escapeHtml(formatDateTime(notification.createdAt))}</div></button>`;
    }).join(""));
  }

  async function markNotificationRead(id){
    const item = state.notifications.find(row => String(row._id) === String(id));
    if(!item || item.read === true) return;
    try{
      await api(`/api/notifications/${encodeURIComponent(id)}/read`,{ method:"PATCH" });
      item.read = true;
      renderNotifications();
      updateNotificationCounts();
    }catch(error){ console.warn("Could not mark notification read",error); }
  }

  async function globalSearch(event){
    if(event.key !== "Enter") return;
    event.preventDefault();
    const value = event.target.value.trim();
    if(!value) return;
    openPage("schools");
    $("#familySchoolSearch").value = value;
    await loadSchools();
  }

  function bindEvents(){
    document.addEventListener("click",async event => {
      const pageButton = event.target.closest("[data-page], [data-page-link]");
      if(pageButton){
        const page = pageButton.dataset.page || pageButton.dataset.pageLink;
        if(page){
          if(pageButton.hasAttribute("data-new-funding")) resetFunding();
          openPage(page);
          return;
        }
      }

      const mode = event.target.closest("[data-mode]")?.dataset.mode;
      if(mode){ switchMode(mode); return; }

      if(event.target.closest("#familyMenuButton")){
        document.body.classList.toggle("family-menu-open");
        return;
      }

      if(event.target.closest("#familyMessagesButton")){ openPage("messages"); return; }
      if(event.target.closest("#familyNotificationsButton")){ openPage("notifications"); return; }
      if(event.target.closest("#familyEnableInvestor")){ await enableInvestorMode(); return; }

      const close = event.target.closest("[data-close-modal]");
      if(close){ closeModal(close.dataset.closeModal); return; }

      if(event.target.classList.contains("family-modal-backdrop")){
        closeModal(event.target.id);
        return;
      }

      if(event.target.closest("[data-add-child]") || event.target.closest("#familyAddChild")){
        resetChildForm();
        openModal("familyChildModal");
        return;
      }

      const editChildButton = event.target.closest("[data-edit-child]");
      if(editChildButton){ editChild(editChildButton.dataset.editChild); return; }

      const linkChildButton = event.target.closest("[data-link-child]");
      if(linkChildButton){
        $("#familyLinkForm")?.reset();
        $("#familyLinkChildId").value = linkChildButton.dataset.linkChild;
        openModal("familyLinkModal");
        return;
      }

      const unlink = event.target.closest("[data-unlink-child]");
      if(unlink){ await unlinkChild(unlink.dataset.unlinkChild); return; }

      const archive = event.target.closest("[data-archive-child]");
      if(archive){ await archiveChild(archive.dataset.archiveChild); return; }

      const save = event.target.closest("[data-save-item]");
      if(save){ await toggleSaved(save.dataset.saveItem,save.dataset.itemId); return; }

      const apply = event.target.closest("[data-apply-scholarship]");
      if(apply){ await openScholarshipApplication(apply.dataset.applyScholarship); return; }

      const viewSchoolButton = event.target.closest("[data-view-school]");
      if(viewSchoolButton){ await viewSchool(viewSchoolButton.dataset.viewSchool); return; }

      const viewOpportunityButton = event.target.closest("[data-view-opportunity]");
      if(viewOpportunityButton){ await viewOpportunity(viewOpportunityButton.dataset.viewOpportunity); return; }

      const message = event.target.closest("[data-message-user]");
      if(message){ await messageUser(message.dataset.messageUser); return; }

      const editVentureButton = event.target.closest("[data-edit-venture]");
      if(editVentureButton){ await editVenture(editVentureButton.dataset.editVenture); return; }

      const editScholarship = event.target.closest("[data-edit-scholarship-application]");
      if(editScholarship){ await openScholarshipApplication(editScholarship.dataset.scholarshipId,editScholarship.dataset.editScholarshipApplication); return; }

      const viewScholarship = event.target.closest("[data-view-scholarship-application]");
      if(viewScholarship){ await viewScholarshipApplication(viewScholarship.dataset.viewScholarshipApplication); return; }

      const deleteScholarship = event.target.closest("[data-delete-scholarship-application]");
      if(deleteScholarship){ await deleteScholarshipDraft(deleteScholarship.dataset.deleteScholarshipApplication); return; }

      const withdraw = event.target.closest("[data-withdraw-scholarship-application]");
      if(withdraw){ await withdrawScholarship(withdraw.dataset.withdrawScholarshipApplication); return; }

      const viewVentureButton = event.target.closest("[data-view-venture]");
      if(viewVentureButton){ await viewVenture(viewVentureButton.dataset.viewVenture); return; }

      const saveVentureButton = event.target.closest("[data-save-venture]");
      if(saveVentureButton){ await saveVenture(saveVentureButton.dataset.saveVenture); return; }

      const interest = event.target.closest("[data-interest-venture]");
      if(interest){ await interestVenture(interest.dataset.interestVenture); return; }

      const conversation = event.target.closest("[data-conversation-id]");
      if(conversation){ await openConversation(conversation.dataset.conversationId); return; }

      const notification = event.target.closest("[data-notification-id]");
      if(notification){ await markNotificationRead(notification.dataset.notificationId); }
    });

    $("#familySchoolFilters")?.addEventListener("submit",event => { event.preventDefault(); loadSchools(); });
    $("#familyScholarshipFilters")?.addEventListener("submit",event => { event.preventDefault(); loadScholarships(); });
    $("#familyOpportunityFilters")?.addEventListener("submit",event => { event.preventDefault(); loadOpportunities(); });
    $("#familyChildForm")?.addEventListener("submit",saveChild);
    $("#familyLinkForm")?.addEventListener("submit",linkChild);
    $("#familyScholarshipApplicationForm")?.addEventListener("submit",event => { event.preventDefault(); persistScholarshipApplication("submitted"); });
    $("#familyScholarshipSaveDraft")?.addEventListener("click",() => persistScholarshipApplication("draft"));
    $("#familyFundingForm")?.addEventListener("submit",publishFunding);
    $("#familyFundingSave")?.addEventListener("click",saveFundingDraft);
    $("#familyFundingReset")?.addEventListener("click",resetFunding);
    $("#familyRequestRefresh")?.addEventListener("click",() => loadRequests(true));
    $("#familyRequestSearch")?.addEventListener("input",renderRequests);
    $("#familyRequestKind")?.addEventListener("change",renderRequests);
    $("#familyRequestStatus")?.addEventListener("change",renderRequests);
    $("#familyInvestorSearch")?.addEventListener("input",renderInvestorDiscover);
    $("#familyInvestorRefresh")?.addEventListener("click",() => loadInvestorDiscover(true));
    $("#familyMessagesRefresh")?.addEventListener("click",() => loadMessages(true));
    $("#familyNotificationsRefresh")?.addEventListener("click",() => loadNotifications(true));
    $("#familyChatForm")?.addEventListener("submit",sendMessage);
    $("#familyGlobalSearch")?.addEventListener("keydown",globalSearch);
    $("#familyRefreshRecommendations")?.addEventListener("click",() => loadOverview(true));
  }

  async function initialize(){
    bindEvents();

    if(!token()){
      setHtml("#familyOverviewChildren",`<div class="family-error">Please sign in to your AIFT Family account to continue.</div>`);
      setHtml("#familyOverviewRequests",`<div class="family-error">Authentication is required.</div>`);
      return;
    }

    try{
      await loadProfile();
      await Promise.all([
        loadSaved(),
        loadChildren(),
        loadNotifications(true),
        loadMessages(true)
      ]);
      await loadOverview(true);
    }catch(error){
      console.error("Family application initialization failed",error);
      toast(error.message,"error");
      setHtml("#familyOverviewChildren",`<div class="family-error">${escapeHtml(error.message)}</div>`);
    }
  }

  initialize();
})();
