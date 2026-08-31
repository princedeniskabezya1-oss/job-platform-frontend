(()=>{
  "use strict";

  const API_BASE =
    typeof API !== "undefined"
      ? API
      : "https://backend-1-9b6f.onrender.com";

  const ORDER = [
    "internship",
    "jobs",
    "scholarships",
    "partnerships",
    "ventures",
    "events"
  ];

  const CONFIG = {
    internship:{label:"Internships",icon:"fa-solid fa-briefcase",description:"Build experience with real companies.",search:"Search internships..."},
    jobs:{label:"Jobs",icon:"fa-solid fa-building",description:"Find graduate and entry-level roles.",search:"Search jobs..."},
    scholarships:{label:"Scholarships",icon:"fa-solid fa-graduation-cap",description:"Find education funding published by AIFT schools.",search:"Search scholarships..."},
    partnerships:{label:"Partnerships",icon:"fa-solid fa-handshake",description:"Explore school and industry opportunities.",search:"Search partnerships..."},
    ventures:{label:"AIFT Ventures",icon:"fa-solid fa-rocket",description:"Explore live AIFT Ventures and funding opportunities.",search:"Search ventures..."},
    events:{label:"Events",icon:"fa-solid fa-calendar-days",description:"Explore career fairs, workshops and recruitment events.",search:"Search events..."}
  };

  const state = {
    active:null,
    items:[],
    filtered:[],
    requestId:0
  };

  let delegatedBound = false;
  let observerBound = false;

  function ensureStyles(){
    if(document.querySelector("link[data-career-production]")){
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "student-career-production.css?v=20260831-0815";
    link.dataset.careerProduction = "true";
    document.head.appendChild(link);
  }

  function token(){
    return (
      localStorage.getItem("studentToken") ||
      localStorage.getItem("talentToken") ||
      localStorage.getItem("token") ||
      ""
    );
  }

  async function api(path){
    const response = await fetch(
      API_BASE + path,
      {
        headers:{
          ...(token()
            ? {Authorization:`Bearer ${token()}`}
            : {})
        }
      }
    );

    const text = await response.text();
    let data = {};

    try{
      data = text ? JSON.parse(text) : {};
    }catch{
      data = {message:text};
    }

    if(!response.ok){
      throw new Error(
        data?.message ||
        `Request failed (${response.status})`
      );
    }

    return data;
  }

  function arr(data,keys=[]){
    if(Array.isArray(data)) return data;

    for(const key of keys){
      if(Array.isArray(data?.[key])){
        return data[key];
      }
    }

    return Array.isArray(data?.items)
      ? data.items
      : [];
  }

  function esc(value=""){
    return String(value ?? "")
      .replace(
        /[&<>"']/g,
        character => ({
          "&":"&amp;",
          "<":"&lt;",
          ">":"&gt;",
          '"':"&quot;",
          "'":"&#039;"
        }[character])
      );
  }

  function id(item){
    return String(item?._id || item?.id || "");
  }

  function title(item){
    return item?.title || item?.name || item?.position || item?.eventName || "AIFT Opportunity";
  }

  function org(item){
    const source = item?.employerId || item?.companyId || item?.schoolId || item?.ownerId || item?.organization || {};
    return source?.companyName || source?.schoolName || source?.name || item?.companyName || item?.schoolName || item?.organizationName || "AIFT";
  }

  function desc(item){
    return item?.summary || item?.description || item?.tagline || item?.problem || "Details are available from the publisher.";
  }

  function location(item){
    return item?.location || item?.workLocation || item?.venue || item?.address || "";
  }

  function type(item){
    return item?.type || item?.opportunityType || item?.ventureType || item?.employmentType || "";
  }

  function date(item){
    const value = item?.deadline || item?.eventDate || item?.startDate || item?.date || item?.createdAt;
    if(!value) return "";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? ""
      : parsed.toLocaleDateString([],{
          month:"short",
          day:"numeric",
          year:"numeric"
        });
  }

  function category(card){
    if(!card) return "";

    const classes = [...card.classList];

    for(const key of ORDER){
      if(classes.includes(key)) return key;
    }

    const text = String(card.textContent || "").toLowerCase();

    if(text.includes("internship")) return "internship";
    if(text.includes("scholarship")) return "scholarships";
    if(text.includes("partnership")) return "partnerships";
    if(text.includes("venture")) return "ventures";
    if(text.includes("event")) return "events";
    if(text.includes("job")) return "jobs";

    return "";
  }

  async function load(categoryName){
    if(categoryName === "internship"){
      return arr(
        await api("/api/opportunities?type=internship"),
        ["opportunities"]
      );
    }

    if(categoryName === "jobs"){
      return arr(
        await api("/api/jobs"),
        ["jobs"]
      );
    }

    if(categoryName === "scholarships"){
      return arr(
        await api("/api/scholarships"),
        ["scholarships"]
      );
    }

    if(categoryName === "ventures"){
      return arr(
        await api("/api/ventures"),
        ["ventures"]
      );
    }

    if(categoryName === "events"){
      return arr(
        await api("/api/career-events"),
        ["events"]
      );
    }

    if(categoryName === "partnerships"){
      const settled = await Promise.allSettled([
        api("/api/opportunities?type=collaboration"),
        api("/api/opportunities?type=placement"),
        api("/api/school-company-partnerships")
      ]);

      const combined = [];

      for(const result of settled){
        if(result.status === "fulfilled"){
          combined.push(
            ...arr(
              result.value,
              ["opportunities","partnerships"]
            )
          );
        }
      }

      const seen = new Set();

      return combined.filter(item => {
        const key = id(item) || `${title(item)}-${org(item)}`;
        if(seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return [];
  }

  function href(categoryName,item){
    const recordId = encodeURIComponent(id(item));

    if(categoryName === "jobs"){
      return recordId
        ? `job-details.html?id=${recordId}`
        : "jobs.html";
    }

    if(categoryName === "ventures"){
      return recordId
        ? `create-venture.html?id=${recordId}`
        : "create-venture.html";
    }

    return "";
  }

  function section(){
    return document.getElementById("section-career");
  }

  function grid(){
    return section()?.querySelector(".student-career-category-grid") || null;
  }

  function mainColumn(){
    const root = section();
    return root?.querySelector(".student-career-layout > .student-career-main") || root?.querySelector(".student-career-main") || null;
  }

  function discovery(){
    const categoryGrid = grid();
    return categoryGrid?.closest(".student-career-discovery") || categoryGrid?.closest("section") || null;
  }

  function buildWorkspace(){
    const root = section();
    const discoverySection = discovery();

    if(!root || !discoverySection){
      return null;
    }

    let workspace = root.querySelector("#studentCareerFocusWorkspace");

    if(
      workspace &&
      workspace.previousElementSibling !== discoverySection
    ){
      workspace.remove();
      workspace = null;
    }

    if(workspace){
      return workspace;
    }

    workspace = document.createElement("section");
    workspace.id = "studentCareerFocusWorkspace";
    workspace.className = "student-career-focus-workspace";

    workspace.innerHTML = `
      <div class="student-career-focus-tabs" role="tablist" aria-label="Career opportunity categories">
        ${ORDER.map(key => `
          <button
            type="button"
            class="student-career-focus-tab"
            data-career-focus-tab="${key}"
            role="tab"
            aria-selected="false"
          >
            <i class="${CONFIG[key].icon}" aria-hidden="true"></i>
            <span>${esc(CONFIG[key].label)}</span>
          </button>
        `).join("")}
      </div>

      <div class="student-career-focus-head">
        <div class="student-career-focus-heading">
          <div class="student-career-focus-copy">
            <span>Career Hub</span>
            <h3 id="studentCareerFocusTitle">Choose an opportunity</h3>
            <p id="studentCareerFocusDescription">Select one of the six categories above.</p>
          </div>
        </div>

        <div class="student-career-focus-tools">
          <label class="student-career-focus-search">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <input
              id="studentCareerFocusSearch"
              type="search"
              placeholder="Search opportunities..."
              autocomplete="off"
            >
          </label>

          <button
            class="student-career-focus-filter"
            id="studentCareerRefreshButton"
            type="button"
          >
            <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div class="student-career-focus-summary">
        <span class="student-career-focus-count" id="studentCareerFocusCount">Select a category</span>
      </div>

      <div class="student-career-focus-body" id="studentCareerFocusBody" aria-live="polite">
        <div class="student-career-focus-state">
          <div>
            <i class="fa-solid fa-arrow-up" aria-hidden="true"></i>
            <strong>Choose a category above to explore opportunities.</strong>
          </div>
        </div>
      </div>

      <div class="student-career-result-detail" id="studentCareerResultDetail" hidden></div>
    `;

    discoverySection.insertAdjacentElement("afterend",workspace);

    workspace.querySelectorAll("[data-career-focus-tab]").forEach(button => {
      button.addEventListener("click",event => {
        event.preventDefault();
        event.stopPropagation();
        openCategory(button.dataset.careerFocusTab,{scroll:false});
      });
    });

    workspace.querySelector("#studentCareerRefreshButton")?.addEventListener("click",() => {
      if(state.active){
        openCategory(state.active,{scroll:false});
      }
    });

    workspace.querySelector("#studentCareerFocusSearch")?.addEventListener("input",event => {
      filterResults(event.target.value);
    });

    workspace.querySelector("#studentCareerFocusBody")?.addEventListener("click",event => {
      const button = event.target.closest("[data-career-detail]");
      if(button){
        showDetail(button.dataset.careerDetail);
      }
    });

    return workspace;
  }

  function restoreNative(){
    section()?.querySelectorAll(".career-native-hidden").forEach(element => {
      element.classList.remove("career-native-hidden");
    });
  }

  function hideBelowWorkspace(){
    const workspace = buildWorkspace();
    const main = mainColumn();

    if(!workspace || !main){
      return;
    }

    restoreNative();

    let afterWorkspace = false;

    [...main.children].forEach(child => {
      if(child === workspace){
        afterWorkspace = true;
        return;
      }

      if(afterWorkspace){
        child.classList.add("career-native-hidden");
      }
    });
  }

  function updateTabs(categoryName){
    const root = section();

    root?.querySelectorAll(".student-career-category-card").forEach(card => {
      card.classList.toggle("career-selected",category(card) === categoryName);
    });

    root?.querySelectorAll("[data-career-focus-tab]").forEach(button => {
      const active = button.dataset.careerFocusTab === categoryName;
      button.classList.toggle("active",active);
      button.setAttribute("aria-selected",active ? "true" : "false");
    });
  }

  function setLoading(){
    const body = document.getElementById("studentCareerFocusBody");

    if(body){
      body.innerHTML = `
        <div class="student-career-focus-state">
          <div>
            <i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i>
            <strong>Loading live AIFT data…</strong>
          </div>
        </div>
      `;
    }
  }

  function setCount(categoryName,countValue){
    section()?.querySelectorAll(".student-career-category-card").forEach(card => {
      if(category(card) !== categoryName) return;
      const target = card.querySelector(".student-career-category-meta b");
      if(target){
        target.textContent = String(countValue);
      }
    });
  }

  function render(items){
    const body = document.getElementById("studentCareerFocusBody");
    const count = document.getElementById("studentCareerFocusCount");

    if(count){
      count.textContent = `${items.length} result${items.length === 1 ? "" : "s"}`;
    }

    if(!body) return;

    if(!items.length){
      body.innerHTML = `
        <div class="student-career-focus-state">
          <div>
            <i class="fa-regular fa-folder-open" aria-hidden="true"></i>
            <strong>No live results are available right now.</strong>
            <span>New AIFT records will appear here automatically.</span>
          </div>
        </div>
      `;
      return;
    }

    const config = CONFIG[state.active];

    body.innerHTML = `
      <div class="student-career-focus-list">
        ${items.map(item => {
          const openHref = href(state.active,item);
          const recordType = type(item);
          const recordLocation = location(item);
          const recordDate = date(item);

          return `
            <article class="student-career-result">
              <div class="student-career-result-icon">
                <i class="${config.icon}" aria-hidden="true"></i>
              </div>

              <div class="student-career-result-main">
                <strong>${esc(title(item))}</strong>
                <span>${esc(org(item))}</span>

                <div class="student-career-result-meta">
                  ${recordType ? `<b>${esc(String(recordType).replaceAll("_"," "))}</b>` : ""}
                  ${recordLocation ? `<b>${esc(recordLocation)}</b>` : ""}
                  ${recordDate ? `<b>${esc(recordDate)}</b>` : ""}
                </div>
              </div>

              <div class="student-career-result-actions">
                <button type="button" data-career-detail="${esc(id(item))}">View details</button>
                ${openHref ? `<a class="primary" href="${esc(openHref)}">Open</a>` : ""}
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  function filterResults(value=""){
    const query = String(value || "").trim().toLowerCase();

    state.filtered = !query
      ? [...state.items]
      : state.items.filter(item =>
          `${title(item)} ${org(item)} ${desc(item)} ${location(item)} ${type(item)}`
            .toLowerCase()
            .includes(query)
        );

    render(state.filtered);
  }

  function showDetail(recordId){
    const item = state.items.find(row => id(row) === String(recordId));
    if(!item) return;

    const detail = document.getElementById("studentCareerResultDetail");
    if(!detail) return;

    const openHref = href(state.active,item);

    detail.innerHTML = `
      <article>
        <h4>${esc(title(item))}</h4>
        <p>
          <strong>${esc(org(item))}</strong>
          ${location(item) ? ` · ${esc(location(item))}` : ""}
        </p>
        <p>${esc(desc(item))}</p>

        <div class="student-career-result-actions">
          ${openHref ? `<a class="primary" href="${esc(openHref)}">Open in AIFT</a>` : ""}
          <button type="button" data-close-career-detail>Close</button>
        </div>
      </article>
    `;

    detail.hidden = false;

    detail.querySelector("[data-close-career-detail]")?.addEventListener("click",() => {
      detail.hidden = true;
    });
  }

  async function openCategory(categoryName,{scroll=true}={}){
    const config = CONFIG[categoryName];
    const workspace = buildWorkspace();

    if(!config || !workspace){
      return;
    }

    state.active = categoryName;
    const currentRequest = ++state.requestId;

    hideBelowWorkspace();
    updateTabs(categoryName);

    const heading = document.getElementById("studentCareerFocusTitle");
    const description = document.getElementById("studentCareerFocusDescription");
    const search = document.getElementById("studentCareerFocusSearch");
    const detail = document.getElementById("studentCareerResultDetail");

    if(heading) heading.textContent = config.label;
    if(description) description.textContent = config.description;
    if(search){
      search.value = "";
      search.placeholder = config.search;
    }
    if(detail) detail.hidden = true;

    setLoading();

    if(scroll){
      window.requestAnimationFrame(() => {
        workspace.scrollIntoView({behavior:"smooth",block:"start"});
      });
    }

    try{
      const items = await load(categoryName);

      if(currentRequest !== state.requestId){
        return;
      }

      state.items = items;
      state.filtered = [...items];

      render(state.filtered);
      setCount(categoryName,items.length);
    }catch(error){
      if(currentRequest !== state.requestId){
        return;
      }

      const body = document.getElementById("studentCareerFocusBody");
      const count = document.getElementById("studentCareerFocusCount");

      if(body){
        body.innerHTML = `
          <div class="student-career-focus-state">
            <div>
              <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
              <strong>${esc(error?.message || "Unable to load this category.")}</strong>
              <span>Use Refresh to try again.</span>
            </div>
          </div>
        `;
      }

      if(count){
        count.textContent = "Unable to load";
      }
    }
  }

  async function hydrateCounts(){
    if(!section() || !grid()){
      return;
    }

    await Promise.all(
      ORDER.map(async key => {
        try{
          const items = await load(key);
          setCount(key,items.length);
        }catch{
          // One unavailable source should not break the Career Hub.
        }
      })
    );
  }

  function bindDelegated(){
    if(delegatedBound) return;
    delegatedBound = true;

    document.addEventListener(
      "click",
      event => {
        const card = event.target.closest("#section-career .student-career-category-card");
        if(!card) return;

        const categoryName = category(card);
        if(!categoryName) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        openCategory(categoryName);
      },
      true
    );
  }

  function synchronize(){
    ensureStyles();

    if(!section() || !grid()){
      return;
    }

    const workspace = buildWorkspace();
    if(!workspace) return;

    if(state.active){
      hideBelowWorkspace();
      updateTabs(state.active);
    }
  }

  function observeRenders(){
    if(observerBound) return;
    observerBound = true;

    const observer = new MutationObserver(mutations => {
      if(
        !mutations.some(
          mutation =>
            mutation.type === "childList" &&
            mutation.addedNodes.length
        )
      ){
        return;
      }

      window.requestAnimationFrame(synchronize);
    });

    observer.observe(
      document.documentElement,
      {
        childList:true,
        subtree:true
      }
    );
  }

  function initialize(){
    ensureStyles();
    bindDelegated();
    observeRenders();
    synchronize();

    window.setTimeout(synchronize,250);
    window.setTimeout(synchronize,800);
    window.setTimeout(hydrateCounts,1200);
  }

  window.AIFTStudentCareerFocus = {
    open(categoryName){
      return openCategory(categoryName);
    },
    refresh(){
      synchronize();
      return state.active
        ? openCategory(state.active,{scroll:false})
        : hydrateCounts();
    }
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded",initialize,{once:true});
  }else{
    initialize();
  }
})();
