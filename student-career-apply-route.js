(() => {
  "use strict";

  const page=String(location.pathname.split("/").pop()||"").toLowerCase();
  if(page!=="student.html") return;

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
      copy:"Student, freelance and volunteer work"
    },
    {
      action:"graduate-programs",
      icon:"fa-user-graduate",
      label:"Graduate Programs",
      copy:"Graduate, apprenticeship and placement paths"
    }
  ];

  let categoryFrame=0;

  function categoryCard({action,icon,label,copy}){
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
        <b>Explore</b>
        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
      </span>
    `;
    return button;
  }

  function ensureCareerCategories(){
    const grid=document.querySelector("#section-career .student-career-category-grid");
    if(!grid) return;

    for(const category of EXTRA_CATEGORIES){
      const selector=`[data-career-action="${category.action}"]`;
      if(!grid.querySelector(selector)){
        grid.appendChild(categoryCard(category));
      }
    }
  }

  function scheduleCareerCategories(){
    if(categoryFrame) cancelAnimationFrame(categoryFrame);
    categoryFrame=requestAnimationFrame(()=>{
      categoryFrame=0;
      ensureCareerCategories();
    });
  }

  function installCareerCategoryGuard(){
    scheduleCareerCategories();

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
      }
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
