(() => {
  "use strict";

  const page=String(location.pathname.split("/").pop()||"").toLowerCase();
  if(page!=="student.html") return;

  const API=window.API_BASE||"https://backend-1-9b6f.onrender.com";

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
  let passportTimer=0;
  let countsLoading=false;
  let countsQueued=false;
  let passportLoading=false;
  let passportSnapshot=null;

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

  function esc(value){
    return String(value??"")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  async function api(path){
    const response=await fetch(API+path,{
      cache:"no-store",
      headers:{Authorization:`Bearer ${token()}`}
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

      #section-career .student-career-category-card:focus,
      #section-career .student-career-category-card:focus-visible,
      #section-career .student-career-category-card.career-focus-selected{
        outline:none!important;
        box-shadow:none!important;
      }

      #section-career .student-career-category-card.career-focus-selected::before,
      #section-career .student-career-category-card.career-focus-selected::after,
      #section-career .student-career-category-card.career-focus-selected .student-career-category-icon{
        outline:none!important;
        box-shadow:none!important;
      }

      #section-career .student-career-category-copy{
        min-width:0;
      }

      #section-career .student-career-category-copy strong,
      #section-career .student-career-category-copy small{
        overflow-wrap:anywhere;
      }

      #section-career #studentCareerPassportQuick.aift-career-passport-stable{
        margin-top:10px;
        padding:10px 11px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        border:1px solid #d9e6f6;
        border-radius:10px;
        background:#f7fbff;
      }

      #section-career #studentCareerPassportQuick.aift-career-passport-stable div{
        min-width:0;
      }

      #section-career #studentCareerPassportQuick.aift-career-passport-stable span{
        display:block;
        color:#1a73e8;
        font-size:7px;
        font-weight:850;
        letter-spacing:.04em;
      }

      #section-career #studentCareerPassportQuick.aift-career-passport-stable strong{
        display:block;
        margin-top:2px;
        color:#344054;
        font-size:9px;
      }

      #section-career #studentCareerPassportQuick.aift-career-passport-stable button{
        min-height:34px;
        padding:0 11px;
        flex:0 0 auto;
        border:1px solid #bfd7f5;
        border-radius:9px;
        background:#eef6ff;
        color:#1765cc;
        font-size:8px;
        font-weight:800;
        cursor:pointer;
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

  function clearCategorySelectionRing(){
    document
      .querySelectorAll("#section-career .student-career-category-card.career-focus-selected")
      .forEach(card=>card.classList.remove("career-focus-selected"));
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

  async function getPassportSnapshot(){
    const passportApi=window.AIFTStudentPassport;

    if(passportApi?.get){
      const current=passportApi.get();
      if(current) return current;
    }

    if(passportApi?.load){
      try{
        return await passportApi.load();
      }catch{}
    }

    if(passportSnapshot) return passportSnapshot;

    const [meResult,identityResult]=await Promise.allSettled([
      api("/api/users/me"),
      api("/api/student-identity/me")
    ]);

    const meData=meResult.status==="fulfilled"?meResult.value||{}:{};
    const user=meData.user||meData.data||meData||{};
    const identityData=identityResult.status==="fulfilled"?identityResult.value||{}:{};
    const identity=identityData?.verified===true?identityData.identity:null;

    passportSnapshot={
      user,
      identity,
      verified:Boolean(identity),
      identityMessage:identityData?.message||""
    };

    return passportSnapshot;
  }

  async function ensureCareerPassportQuick(){
    const readiness=document.querySelector("#section-career .student-career-readiness-card");
    if(!readiness) return false;

    const existing=document.getElementById("studentCareerPassportQuick");
    if(existing) return true;

    if(passportLoading) return false;
    passportLoading=true;

    try{
      const passport=await getPassportSnapshot();

      if(document.getElementById("studentCareerPassportQuick")) return true;

      const currentReadiness=document.querySelector("#section-career .student-career-readiness-card");
      if(!currentReadiness) return false;

      const verified=passport?.verified===true&&Boolean(passport?.identity?.aiftStudentId);
      const passportStudentId=passport?.identity?.aiftStudentId||"";

      const block=document.createElement("div");
      block.id="studentCareerPassportQuick";
      block.className="scv2-quick-passport aift-career-passport-stable";
      block.innerHTML=`
        <div>
          <span>AIFT OPPORTUNITY PASSPORT</span>
          <strong>${
            verified
              ? `${esc(passportStudentId)} · Ready for applications`
              : "Set up your verified career identity"
          }</strong>
        </div>
        <button type="button" data-aift-career-passport-open>
          ${verified?"View":"Set up"}
        </button>
      `;

      currentReadiness.appendChild(block);
      return true;
    }catch(error){
      console.warn("Career Hub Passport could not be restored:",error);
      return false;
    }finally{
      passportLoading=false;
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

  function scheduleCareerPassport(delay=80){
    clearTimeout(passportTimer);
    passportTimer=setTimeout(()=>{
      ensureCareerPassportQuick().catch(()=>{});
    },delay);
  }

  function scheduleCareerCategories(){
    if(categoryFrame) cancelAnimationFrame(categoryFrame);
    categoryFrame=requestAnimationFrame(()=>{
      categoryFrame=0;
      const added=ensureCareerCategories();
      clearCategorySelectionRing();
      if(added){
        scheduleCareerCounts(80);
      }
      scheduleCareerPassport(80);
    });
  }

  function installCareerCategoryGuard(){
    ensureCareerLayoutStyle();
    scheduleCareerCategories();
    scheduleCareerCounts(120);
    scheduleCareerPassport(160);

    const careerSection=document.getElementById("section-career");
    if(!careerSection) return;

    const observer=new MutationObserver(()=>{
      scheduleCareerCategories();
      scheduleCareerPassport(80);
    });

    observer.observe(careerSection,{
      childList:true,
      subtree:true
    });

    document.addEventListener("studentstudio:pagechange",event=>{
      if(String(event?.detail?.page||"")==="career"){
        scheduleCareerCategories();
        scheduleCareerCounts(120);
        scheduleCareerPassport(120);
      }
    });

    window.addEventListener("aift:activity-updated",()=>{
      scheduleCareerCounts(180);
      scheduleCareerPassport(120);
    });
  }

  document.addEventListener("click",event=>{
    const categoryButton=event.target.closest("#section-career .student-career-category-card");
    if(categoryButton){
      requestAnimationFrame(()=>{
        clearCategorySelectionRing();
        categoryButton.blur?.();
      });
    }

    const passportButton=event.target.closest("[data-aift-career-passport-open]");
    if(passportButton){
      event.preventDefault();
      if(window.AIFTStudentPassport?.open){
        window.AIFTStudentPassport.open().catch(()=>{});
      }else if(window.openStudentStudioPage){
        window.openStudentStudioPage("portfolio");
      }
      return;
    }

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
