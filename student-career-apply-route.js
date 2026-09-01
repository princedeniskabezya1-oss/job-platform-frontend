(() => {
  "use strict";

  const page=String(location.pathname.split("/").pop()||"").toLowerCase();
  if(page!=="student.html") return;

  const API=window.API_BASE||"https://backend-1-9b6f.onrender.com";

  /*
    Career Hub V2 adds Projects and Graduate Programs on top of the
    six legacy Career Hub categories. The legacy Student Career Hub
    can re-render its category grid after its async data load, which
    replaces those two V2 cards. Keep the V2 categories present after
    any such re-render without changing the legacy six-card renderer.
  */
  const EXTRA_CATEGORIES=[
    {
      action:"projects",
      icon:"fa-diagram-project",
      label:"Projects",
      copy:"Student, freelance and volunteer work",
      countId:"studentCareerProjectCount"
    },
    {
      action:"graduate-programs",
      icon:"fa-user-graduate",
      label:"Graduate Programs",
      copy:"Graduate, apprenticeship and placement paths",
      countId:"studentCareerGraduateProgramCount"
    }
  ];

  const COUNT_NODE_IDS={
    internships:"studentCareerInternshipCount",
    jobs:"studentCareerJobCount",
    scholarships:"studentCareerScholarshipCount",
    partnerships:"studentCareerPartnershipCount",
    ventures:"studentCareerVentureCount",
    events:"studentCareerEventCount",
    projects:"studentCareerProjectCount",
    "graduate-programs":"studentCareerGraduateProgramCount"
  };

  let categoryFrame=0;
  let countTimer=0;
  let countsLoading=false;
  let countsQueued=false;

  function token(){
    for(const key of ["studentToken","talentToken","token"]){
      const value=localStorage.getItem(key)||sessionStorage.getItem(key);
      if(value) return value;
    }
    return "";
  }

  function id(value){
    if(value&&typeof value==="object"){
      return String(value._id||value.id||"");
    }
    return String(value||"");
  }

  function array(value,keys=[]){
    if(Array.isArray(value)) return value;
    for(const key of keys){
      if(Array.isArray(value?.[key])) return value[key];
    }
    if(Array.isArray(value?.items)) return value.items;
    if(Array.isArray(value?.data)) return value.data;
    return [];
  }

  async function api(path){
    const response=await fetch(API+path,{
      cache:"no-store",
      headers:{
        Authorization:`Bearer ${token()}`
      }
    });

    const data=await response.json().catch(()=>({}));

    if(!response.ok){
      const error=new Error(data.message||`Request failed (${response.status})`);
      error.status=response.status;
      throw error;
    }

    return data;
  }

  function opportunityTotal(data){
    const serverTotal=Number(data?.pagination?.total);
    if(Number.isFinite(serverTotal)) return serverTotal;
    return array(data,["opportunities","items"]).length;
  }

  function ensureCareerLayoutStyle(){
    if(document.getElementById("aiftCareerCategoryLayoutV3")) return;

    const style=document.createElement("style");
    style.id="aiftCareerCategoryLayoutV3";
    style.textContent=`
      #section-career .student-career-category-grid{
        align-items:stretch!important;
        grid-auto-rows:1fr;
      }

      #section-career .student-career-category-card{
        width:100%;
        height:100%;
        min-width:0;
        min-height:138px;
      }

      #section-career .student-career-category-copy{
        min-width:0;
      }

      #section-career .student-career-category-copy strong,
      #section-career .student-career-category-copy small{
        overflow-wrap:anywhere;
      }

      @media(min-width:1201px){
        #section-career .student-career-category-grid{
          grid-template-columns:repeat(4,minmax(0,1fr))!important;
        }
      }

      @media(max-width:1200px) and (min-width:641px){
        #section-career .student-career-category-grid{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
        }
      }

      @media(max-width:640px){
        #section-career .student-career-category-grid{
          grid-template-columns:1fr!important;
        }

        #section-career .student-career-category-card{
          min-height:128px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function categoryCard({action,icon,label,copy,countId}){
    const button=document.createElement("button");
    button.type="button";
    button.className="student-career-category-card jobs";
    button.dataset.careerAction=action;
    button.innerHTML=`
      <span class="student-career-category-icon">
        <i class="fa-solid ${icon}" aria-hidden="true"></i>
      </span>
      <span class="student-career-category-copy">
        <strong>${label}</strong>
        <small>${copy}</small>
      </span>
      <span class="student-career-category-meta">
        <b id="${countId}">—</b>
        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
      </span>
    `;
    return button;
  }

  function ensureCareerCategories(){
    const grid=document.querySelector("#section-career .student-career-category-grid");
    if(!grid) return false;

    let added=false;

    for(const category of EXTRA_CATEGORIES){
      const selector=`[data-career-action="${category.action}"]`;
      if(!grid.querySelector(selector)){
        grid.appendChild(categoryCard(category));
        added=true;
      }
    }

    return added;
  }

  function setCategoryCount(action,value){
    const numeric=Math.max(0,Number(value)||0);
    const nodeId=COUNT_NODE_IDS[action];
    let node=nodeId?document.getElementById(nodeId):null;

    if(!node){
      node=document.querySelector(
        `#section-career [data-career-action="${action}"] .student-career-category-meta b`
      );
    }

    if(node){
      node.textContent=String(numeric);
    }
  }

  async function loadCareerCounts(){
    if(countsLoading){
      countsQueued=true;
      return;
    }

    if(!token()) return;

    countsLoading=true;
    countsQueued=false;

    try{
      const [
        internshipsResult,
        jobsResult,
        projectsResult,
        graduateResult,
        scholarshipsResult,
        eventsResult,
        venturesResult,
        meResult
      ]=await Promise.allSettled([
        api("/api/opportunities?type=internship&limit=1"),
        api("/api/opportunities?type=job&limit=1"),
        api("/api/opportunities?type=project&limit=1"),
        api("/api/opportunities?type=placement&limit=1"),
        api("/api/scholarships"),
        api("/api/career-events"),
        api("/api/ventures"),
        api("/api/users/me")
      ]);

      if(internshipsResult.status==="fulfilled"){
        setCategoryCount("internships",opportunityTotal(internshipsResult.value));
      }

      if(jobsResult.status==="fulfilled"){
        setCategoryCount("jobs",opportunityTotal(jobsResult.value));
      }

      if(projectsResult.status==="fulfilled"){
        setCategoryCount("projects",opportunityTotal(projectsResult.value));
      }

      if(graduateResult.status==="fulfilled"){
        setCategoryCount("graduate-programs",opportunityTotal(graduateResult.value));
      }

      if(scholarshipsResult.status==="fulfilled"){
        const scholarships=array(
          scholarshipsResult.value,
          ["scholarships","items"]
        ).filter(item=>
          ["published","open"].includes(
            String(item?.status||"").trim().toLowerCase()
          )
        );
        setCategoryCount("scholarships",scholarships.length);
      }

      if(eventsResult.status==="fulfilled"){
        const events=array(
          eventsResult.value,
          ["events","items"]
        ).filter(item=>
          !["draft","cancelled","archived","completed"].includes(
            String(item?.status||"").trim().toLowerCase()
          )
        );
        setCategoryCount("events",events.length);
      }

      if(venturesResult.status==="fulfilled"){
        const ventures=array(
          venturesResult.value,
          ["ventures","items"]
        );
        setCategoryCount("ventures",ventures.length);
      }

      if(meResult.status==="fulfilled"){
        const meData=meResult.value||{};
        const me=meData.user||meData.data||meData||{};
        const schoolId=id(
          me.linkedSchoolId||
          me.schoolId||
          me.createdBySchool
        );

        if(schoolId){
          try{
            const partnershipData=await api(
              `/api/opportunities/verified-partnerships?schoolId=${encodeURIComponent(schoolId)}`
            );
            setCategoryCount(
              "partnerships",
              array(partnershipData,["partnerships","items"]).length
            );
          }catch(error){
            console.warn("Career Hub partnership count failed:",error);
          }
        }else{
          setCategoryCount("partnerships",0);
        }
      }
    }finally{
      countsLoading=false;
      if(countsQueued){
        countsQueued=false;
        scheduleCareerCounts(100);
      }
    }
  }

  function scheduleCareerCounts(delay=250){
    clearTimeout(countTimer);
    countTimer=setTimeout(()=>{
      loadCareerCounts().catch(error=>{
        console.warn("Career Hub live counts failed:",error);
      });
    },delay);
  }

  function scheduleCareerCategories(){
    if(categoryFrame) cancelAnimationFrame(categoryFrame);
    categoryFrame=requestAnimationFrame(()=>{
      categoryFrame=0;
      const added=ensureCareerCategories();
      if(added){
        scheduleCareerCounts(80);
      }
    });
  }

  function installCareerCategoryGuard(){
    ensureCareerLayoutStyle();
    scheduleCareerCategories();
    scheduleCareerCounts(120);

    const careerSection=document.getElementById("section-career");
    if(!careerSection) return;

    const observer=new MutationObserver(()=>{
      scheduleCareerCategories();
    });

    observer.observe(careerSection,{
      childList:true,
      subtree:true
    });

    document.addEventListener("studentstudio:pagechange",event=>{
      if(String(event?.detail?.page||"")==="career"){
        scheduleCareerCategories();
        scheduleCareerCounts(120);
      }
    });

    window.addEventListener("aift:activity-updated",()=>{
      scheduleCareerCounts(180);
    });
  }

  document.addEventListener("click",event=>{
    const button=event.target.closest("[data-scv2-apply]");
    if(!button) return;

    const opportunityId=String(button.dataset.scv2Apply||"").trim();
    if(!opportunityId) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    localStorage.setItem("selectedCareerOpportunityId",opportunityId);
    location.href=`job-apply.html?opportunityId=${encodeURIComponent(opportunityId)}&source=career-hub`;
  },true);

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",installCareerCategoryGuard,{once:true});
  }else{
    installCareerCategoryGuard();
  }
})();
