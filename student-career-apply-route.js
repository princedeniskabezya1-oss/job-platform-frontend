(() => {
  "use strict";

  const page=String(location.pathname.split("/").pop()||"").toLowerCase();
  if(page!=="student.html") return;

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
})();
