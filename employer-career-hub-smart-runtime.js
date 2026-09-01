(() => {
  "use strict";

  const page=String(location.pathname.split("/").pop() || "").toLowerCase();
  if(page !== "employer.html") return;

  if(!document.getElementById("empSmartCareerRuntimeStyle")){
    const style=document.createElement("style");
    style.id="empSmartCareerRuntimeStyle";
    style.textContent=`
      #empSmartCareerOverlay .esc-modal>#empSmartCareerMount{
        flex:1 1 auto;
        min-height:0;
        height:100%;
        display:flex;
        flex-direction:column;
        overflow:hidden;
      }
      #empSmartCareerOverlay #empSmartCareerMount>form{
        flex:1 1 auto;
        min-height:0;
        height:100%;
      }
      #empSmartCareerOverlay #empSmartCareerMount>.esc-success{
        flex:1 1 auto;
        min-height:0;
      }
    `;
    document.head.appendChild(style);
  }

  let refreshTimer=null;

  function refreshEmployerCareerHub(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(async()=>{
      if(typeof window.loadEmployerCareerHub !== "function") return;

      try{
        await window.loadEmployerCareerHub({force:true});

        const current=String(
          window.state?.careerHub?.currentView ||
          window.state?.careerHub?.activeView ||
          ""
        ).toLowerCase();

        if(current === "programs" && typeof window.renderEmployerCareerPrograms === "function"){
          window.renderEmployerCareerPrograms();
        }
        if(current === "campus" && typeof window.renderEmployerCareerCampus === "function"){
          window.renderEmployerCareerCampus();
        }
        if(current === "partnerships" && typeof window.renderEmployerCareerPartnerships === "function"){
          window.renderEmployerCareerPartnerships();
        }
      }catch(error){
        console.warn("Employer Career Hub refresh skipped:",error?.message || error);
      }
    },250);
  }

  window.addEventListener("aift:activity-updated",event=>{
    const source=String(event?.detail?.source || "");
    if(
      source.startsWith("employer-smart-") ||
      source === "employer-campus-program" ||
      source === "company-partnership-workspace"
    ){
      refreshEmployerCareerHub();
    }
  });
})();
