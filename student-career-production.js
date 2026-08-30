(()=>{
  "use strict";

  const API_BASE =
    typeof API !== "undefined"
      ? API
      : "https://backend-1-9b6f.onrender.com";

  const CATEGORY_ORDER = [
    "internship",
    "jobs",
    "scholarships",
    "partnerships",
    "ventures",
    "events"
  ];

  const CATEGORY_CONFIG = {
    internship:{
      label:"Internships",
      eyebrow:"Internships",
      icon:"fa-solid fa-briefcase",
      description:"Build experience and start your career journey.",
      search:"Search internships..."
    },
    jobs:{
      label:"Jobs",
      eyebrow:"Jobs",
      icon:"fa-solid fa-building",
      description:"Explore graduate and entry-level roles from AIFT employers.",
      search:"Search jobs..."
    },
    scholarships:{
      label:"Scholarships",
      eyebrow:"Scholarships",
      icon:"fa-solid fa-graduation-cap",
      description:"Find education funding published by AIFT schools.",
      search:"Search scholarships..."
    },
    partnerships:{
      label:"Partnerships",
      eyebrow:"Partnerships",
      icon:"fa-solid fa-handshake",
      description:"Discover school and industry collaboration opportunities.",
      search:"Search partnerships..."
    },
    ventures:{
      label:"AIFT Ventures",
      eyebrow:"AIFT Ventures",
      icon:"fa-solid fa-rocket",
      description:"Build, fund and manage your real AIFT Venture activity.",
      search:"Search ventures..."
    },
    events:{
      label:"Events",
      eyebrow:"Events",
      icon:"fa-solid fa-calendar-days",
      description:"Explore career fairs, workshops, talks and recruitment events.",
      search:"Search events..."
    }
  };

  const careerState = {
    active:null,
    items:[],
    filtered:[],
    loading:false
  };

  function token(){
    return (
      localStorage.getItem("studentToken") ||
      localStorage.getItem("talentToken") ||
      localStorage.getItem("token") ||
      ""
    );
  }

  async function apiCareer(path,options={}){
    const response = await fetch(API_BASE + path,{
      ...options,
      headers:{
        ...(token()
          ? {Authorization:`Bearer ${token()}`}
          : {}),
        ...(options.body && !(options.body instanceof FormData)
          ? {"Content-Type":"application/json"}
          : {}),
        ...(options.headers || {})
      }
    });

    const text = await response.text();
    let data = {};

    try{
      data = text ? JSON.parse(text) : {};
    }catch{
      data = {message:text};
    }

    if(!response.ok){
      throw new Error(
        data.message ||
        `Request failed (${response.status})`
      );
    }

    return data;
  }

  function arrayFrom(data,keys=[]){
    if(Array.isArray(data)) return data;

    for(const key of keys){
      if(Array.isArray(data?.[key])){
        return data[key];
      }
    }

    if(Array.isArray(data?.items)){
      return data.items;
    }

    return [];
  }

  function normalizeCategory(card){
    const classes = [...card.classList];

    if(classes.includes("internship")) return "internship";
    if(classes.includes("jobs")) return "jobs";
    if(classes.includes("scholarships")) return "scholarships";
    if(classes.includes("partnerships")) return "partnerships";
    if(classes.includes("ventures")) return "ventures";
    if(classes.includes("events")) return "events";

    const text = (card.textContent || "").toLowerCase();

    if(text.includes("internship")) return "internship";
    if(text.includes("scholarship")) return "scholarships";
    if(text.includes("partnership")) return "partnerships";
    if(text.includes("venture")) return "ventures";
    if(text.includes("event")) return "events";
    if(text.includes("job")) return "jobs";

    return "";
  }

  function esc(value=""){
    return String(value ?? "")
      .replace(
        /[&<>"']/g,
        ch => ({
          "&":"&amp;",
          "<":"&lt;",
          ">":"&gt;",
          '"':"&quot;",
          "'":"&#039;"
        }[ch])
      );
  }

  function pickId(item){
    return String(item?._id || item?.id || "");
  }

  function titleFor(item){
    return (
      item?.title ||
      item?.name ||
      item?.position ||
      item?.eventName ||
      "AIFT Opportunity"
    );
  }

  function orgFor(item){
    const source =
      item?.employerId ||
      item?.companyId ||
      item?.schoolId ||
      item?.ownerId ||
      item?.organization ||
      {};

    return (
      source.companyName ||
      source.schoolName ||
      source.name ||
      item?.companyName ||
      item?.schoolName ||
      item?.organizationName ||
      "AIFT"
    );
  }

  function descriptionFor(item){
    return (
      item?.summary ||
      item?.description ||
      item?.tagline ||
      item?.problem ||
      "Details are available from the publisher."
    );
  }

  function dateFor(item){
    const value =
      item?.deadline ||
      item?.eventDate ||
      item?.startDate ||
      item?.date ||
      item?.createdAt;

    if(!value) return "";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString([],{
          month:"short",
          day:"numeric",
          year:"numeric"
        });
  }

  function locationFor(item){
    return (
      item?.location ||
      item?.workLocation ||
      item?.venue ||
      item?.address ||
      ""
    );
  }

  function typeFor(item){
    return (
      item?.type ||
      item?.opportunityType ||
      item?.ventureType ||
      item?.employmentType ||
      ""
    );
  }

  function sourceUrl(category,item){
    const id = encodeURIComponent(pickId(item));

    if(category === "jobs"){
      return `jobs.html?job=${id}`;
    }

    if(category === "ventures"){
      return `create-venture.html?id=${id}`;
    }

    return "";
  }

  async function fetchCategory(category){
    if(category === "internship"){
      const data = await apiCareer(
        "/api/opportunities?type=internship"
      );

      return arrayFrom(data,["opportunities"]);
    }

    if(category === "jobs"){
      const data = await apiCareer("/api/jobs");
      return arrayFrom(data,["jobs"]);
    }

    if(category === "scholarships"){
      const data = await apiCareer("/api/scholarships");
      return arrayFrom(data,["scholarships"]);
    }

    if(category === "ventures"){
      const mine = await apiCareer("/api/ventures/mine");
      return arrayFrom(mine,["ventures"]);
    }

    if(category === "events"){
      const data = await apiCareer("/api/career-events");
      return arrayFrom(data,["events"]);
    }

    if(category === "partnerships"){
      const settled = await Promise.allSettled([
        apiCareer("/api/opportunities?type=collaboration"),
        apiCareer("/api/opportunities?type=placement"),
        apiCareer("/api/school-company-partnerships")
      ]);

      const combined = [];

      for(const result of settled){
        if(result.status === "fulfilled"){
          combined.push(
            ...arrayFrom(
              result.value,
              ["opportunities","partnerships"]
            )
          );
        }
      }

      const seen = new Set();

      return combined.filter(item => {
        const id =
          pickId(item) ||
          `${titleFor(item)}-${orgFor(item)}`;

        if(seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    return [];
  }

  function categoryGrid(section){
    return section.querySelector(
      ".student-career-category-grid"
    );
  }

  function tabMarkup(category){
    const config = CATEGORY_CONFIG[category];

    return `
      <button
        type="button"
        class="student-career-focus-tab"
        data-career-focus-tab="${category}"
      >
        <i class="${config.icon}"></i>
        <span>${esc(config.label)}</span>
      </button>
    `;
  }

  function buildWorkspace(section){
    let workspace = section.querySelector(
      "#studentCareerFocusWorkspace"
    );

    if(workspace){
      return workspace;
    }

    workspace = document.createElement("section");
    workspace.id = "studentCareerFocusWorkspace";
    workspace.className = "student-career-focus-workspace";

    workspace.innerHTML = `
      <div class="student-career-focus-tabs" role="tablist" aria-label="Career opportunity categories">
        ${CATEGORY_ORDER.map(tabMarkup).join("")}
      </div>

      <div class="student-career-focus-head">
        <div class="student-career-focus-heading">
          <div class="student-career-focus-copy">
            <span id="studentCareerFocusEyebrow">Career Hub</span>
            <h3 id="studentCareerFocusTitle">Opportunities</h3>
            <p id="studentCareerFocusDescription">Choose a category above to view live AIFT results.</p>
          </div>
        </div>

        <div class="student-career-focus-tools">
          <label class="student-career-focus-search" aria-label="Search selected career category">
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
            type="button"
            id="studentCareerFilterButton"
            title="Filter the current results"
          >
            <i class="fa-solid fa-filter" aria-hidden="true"></i>
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div class="student-career-focus-summary">
        <span class="student-career-focus-count" id="studentCareerFocusCount">0 results</span>
        <button class="student-career-focus-refresh" id="studentCareerRefreshButton" type="button">
          Refresh
        </button>
      </div>

      <div class="student-career-focus-body" id="studentCareerFocusBody"></div>
      <div class="student-career-result-detail" id="studentCareerResultDetail" hidden></div>
    `;

    const layout = section.querySelector(
      ".student-career-layout"
    );

    const main =
      layout?.querySelector(
        ":scope > .student-career-main"
      ) ||
      section.querySelector(
        ".student-career-main"
      );

    if(main){
      main.prepend(workspace);
    }else{
      (
        categoryGrid(section)?.parentElement ||
        section
      ).appendChild(workspace);
    }

    workspace
      .querySelectorAll("[data-career-focus-tab]")
      .forEach(button => {
        button.addEventListener("click",() => {
          openCategory(
            section,
            button.dataset.careerFocusTab,
            true
          );
        });
      });

    workspace
      .querySelector("#studentCareerRefreshButton")
      ?.addEventListener("click",() => {
        if(careerState.active){
          openCategory(
            section,
            careerState.active,
            true
          );
        }
      });

    workspace
      .querySelector("#studentCareerFocusSearch")
      ?.addEventListener("input",event => {
        filterAndRender(
          section,
          event.target.value
        );
      });

    workspace
      .querySelector("#studentCareerFilterButton")
      ?.addEventListener("click",() => {
        const search = workspace.querySelector(
          "#studentCareerFocusSearch"
        );

        search?.focus();
      });

    workspace
      .querySelector("#studentCareerFocusBody")
      ?.addEventListener("click",event => {
        const detailButton = event.target.closest(
          "[data-career-detail]"
        );

        if(detailButton){
          showDetail(
            section,
            detailButton.dataset.careerDetail
          );
        }
      });

    return workspace;
  }

  function hideNativeMain(section,workspace){
    const main =
      section.querySelector(
        ".student-career-layout > .student-career-main"
      ) ||
      section.querySelector(
        ".student-career-main"
      );

    if(!main) return;

    [...main.children].forEach(child => {
      if(child !== workspace){
        child.classList.add("career-native-hidden");
      }
    });
  }

  function setLoading(section){
    const body = section.querySelector(
      "#studentCareerFocusBody"
    );

    if(body){
      body.innerHTML = `
        <div class="student-career-focus-state">
          <div>
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <strong>Loading live AIFT data…</strong>
          </div>
        </div>
      `;
    }
  }

  function updateTabs(section,activeCategory){
    section
      .querySelectorAll("[data-career-focus-tab]")
      .forEach(button => {
        const active =
          button.dataset.careerFocusTab ===
          activeCategory;

        button.classList.toggle("active",active);
        button.setAttribute(
          "aria-selected",
          active ? "true" : "false"
        );
      });
  }

  function renderRows(section,items){
    const body = section.querySelector(
      "#studentCareerFocusBody"
    );

    const count = section.querySelector(
      "#studentCareerFocusCount"
    );

    if(count){
      count.textContent =
        `${items.length} result${items.length === 1 ? "" : "s"}`;
    }

    if(!body) return;

    if(!items.length){
      body.innerHTML = `
        <div class="student-career-focus-state">
          <div>
            <i class="fa-regular fa-folder-open"></i>
            <strong>No live results are available in this category right now.</strong>
            <span>New AIFT records will appear here automatically.</span>
          </div>
        </div>
      `;
      return;
    }

    const config = CATEGORY_CONFIG[careerState.active];

    body.innerHTML = `
      <div class="student-career-focus-list">
        ${items.map(item => {
          const id = pickId(item);
          const href = sourceUrl(
            careerState.active,
            item
          );
          const date = dateFor(item);
          const location = locationFor(item);
          const type = typeFor(item);

          return `
            <article class="student-career-result">
              <div class="student-career-result-icon">
                <i class="${config.icon}"></i>
              </div>

              <div class="student-career-result-main">
                <strong>${esc(titleFor(item))}</strong>
                <span>${esc(orgFor(item))}</span>

                <div class="student-career-result-meta">
                  ${type
                    ? `<b>${esc(String(type).replaceAll("_"," "))}</b>`
                    : ""}
                  ${location
                    ? `<b>${esc(location)}</b>`
                    : ""}
                  ${date
                    ? `<b>${esc(date)}</b>`
                    : ""}
                </div>
              </div>

              <div class="student-career-result-actions">
                <button
                  type="button"
                  data-career-detail="${esc(id)}"
                >
                  View details
                </button>

                ${href
                  ? `<a class="primary" href="${esc(href)}">Open</a>`
                  : ""}
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  function filterAndRender(section,value=""){
    const query = String(value || "")
      .trim()
      .toLowerCase();

    careerState.filtered = !query
      ? [...careerState.items]
      : careerState.items.filter(item =>
          `${
            titleFor(item)
          } ${
            orgFor(item)
          } ${
            descriptionFor(item)
          } ${
            locationFor(item)
          } ${
            typeFor(item)
          }`
            .toLowerCase()
            .includes(query)
        );

    renderRows(
      section,
      careerState.filtered
    );
  }

  function showDetail(section,id){
    const item = careerState.items.find(
      row => pickId(row) === String(id)
    );

    if(!item) return;

    const detail = section.querySelector(
      "#studentCareerResultDetail"
    );

    if(!detail) return;

    const href = sourceUrl(
      careerState.active,
      item
    );

    detail.innerHTML = `
      <article>
        <h4>${esc(titleFor(item))}</h4>
        <p>
          <strong>${esc(orgFor(item))}</strong>
          ${locationFor(item)
            ? ` · ${esc(locationFor(item))}`
            : ""}
        </p>
        <p>${esc(descriptionFor(item))}</p>

        <div class="student-career-result-actions">
          ${href
            ? `<a class="primary" href="${esc(href)}">Open in AIFT</a>`
            : ""}
          <button type="button" data-close-career-detail>Close</button>
        </div>
      </article>
    `;

    detail.hidden = false;

    detail
      .querySelector("[data-close-career-detail]")
      ?.addEventListener("click",() => {
        detail.hidden = true;
      });

    detail.scrollIntoView({
      behavior:"smooth",
      block:"nearest"
    });
  }

  async function openCategory(
    section,
    category,
    force=false
  ){
    const config = CATEGORY_CONFIG[category];

    if(!config) return;

    const workspace = buildWorkspace(section);

    careerState.active = category;
    section.classList.add("career-focus-mode");

    hideNativeMain(section,workspace);
    updateTabs(section,category);

    section
      .querySelectorAll(
        ".student-career-category-card"
      )
      .forEach(card => {
        card.classList.toggle(
          "career-selected",
          normalizeCategory(card) === category
        );
      });

    const eyebrow = section.querySelector(
      "#studentCareerFocusEyebrow"
    );
    const title = section.querySelector(
      "#studentCareerFocusTitle"
    );
    const description = section.querySelector(
      "#studentCareerFocusDescription"
    );
    const search = section.querySelector(
      "#studentCareerFocusSearch"
    );
    const detail = section.querySelector(
      "#studentCareerResultDetail"
    );

    if(eyebrow){
      eyebrow.textContent = config.eyebrow;
    }

    if(title){
      title.textContent = config.label;
    }

    if(description){
      description.textContent = config.description;
    }

    if(search){
      search.value = "";
      search.placeholder = config.search;
    }

    if(detail){
      detail.hidden = true;
    }

    setLoading(section);

    try{
      careerState.items =
        await fetchCategory(category);

      careerState.filtered =
        [...careerState.items];

      renderRows(
        section,
        careerState.filtered
      );

      updateCategoryCount(
        section,
        category,
        careerState.items.length
      );
    }catch(error){
      const body = section.querySelector(
        "#studentCareerFocusBody"
      );

      if(body){
        body.innerHTML = `
          <div class="student-career-focus-state">
            <div>
              <i class="fa-solid fa-triangle-exclamation"></i>
              <strong>${esc(error.message)}</strong>
              <span>Use Refresh to try again.</span>
            </div>
          </div>
        `;
      }

      const count = section.querySelector(
        "#studentCareerFocusCount"
      );

      if(count){
        count.textContent = "Unable to load";
      }
    }
  }

  function updateCategoryCount(
    section,
    category,
    count
  ){
    section
      .querySelectorAll(
        ".student-career-category-card"
      )
      .forEach(card => {
        if(normalizeCategory(card) !== category){
          return;
        }

        const target = card.querySelector(
          ".student-career-category-meta b"
        );

        if(target){
          target.textContent = String(count);
        }
      });
  }

  async function hydrateCounts(section){
    await Promise.all(
      CATEGORY_ORDER.map(async category => {
        try{
          const items = await fetchCategory(category);
          updateCategoryCount(
            section,
            category,
            items.length
          );
        }catch{
          // Keep the current count if one service is unavailable.
        }
      })
    );
  }

  function bindCareer(){
    const section = document.querySelector(
      "#section-career"
    );

    if(!section) return;

    buildWorkspace(section);

    section
      .querySelectorAll(
        ".student-career-category-card"
      )
      .forEach(card => {
        const category = normalizeCategory(card);

        if(!category) return;

        card.addEventListener(
          "click",
          event => {
            event.preventDefault();
            event.stopImmediatePropagation();

            openCategory(
              section,
              category,
              true
            );
          },
          true
        );
      });

    hydrateCounts(section);
  }

  if(document.readyState === "loading"){
    document.addEventListener(
      "DOMContentLoaded",
      bindCareer,
      {once:true}
    );
  }else{
    bindCareer();
  }
})();
