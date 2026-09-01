from pathlib import Path

path = Path('student-career-hub-v2.js')
text = path.read_text(encoding='utf-8')
old = '''  async function init(){
    ensureStyles();
    bind();
    const install=()=>{injectCategoryCards();injectPassportQuick();renderApplicationsPanel();};
    await loadApplications();
    install();
    const observer=new MutationObserver(()=>install());
    const career=document.getElementById("section-career")||document.body;
    observer.observe(career,{childList:true,subtree:true});
    window.addEventListener("aift:activity-updated",event=>{
      const source=String(event?.detail?.source||"");
      if(source==="student-career-application" || source==="review-status") refresh().catch(()=>{});
    });
    window.AIFTStudentCareerHub={refresh,openMarketplace,openApplication,openPassport};
  }'''
new = '''  let installFrame=0;

  function installCareerEnhancements(){
    injectCategoryCards();
    renderApplicationsPanel();
    injectPassportQuick().catch(()=>{});
  }

  function scheduleCareerEnhancements(){
    if(installFrame) cancelAnimationFrame(installFrame);
    installFrame=requestAnimationFrame(()=>{
      installFrame=0;
      installCareerEnhancements();
    });
  }

  async function init(){
    ensureStyles();
    bind();
    await loadApplications().catch(()=>{});
    scheduleCareerEnhancements();
    document.addEventListener("studentstudio:pagechange",event=>{
      if(String(event?.detail?.page||"") === "career") scheduleCareerEnhancements();
    });
    window.addEventListener("aift:activity-updated",event=>{
      const source=String(event?.detail?.source||"");
      if(source==="student-career-application" || source==="review-status") refresh().catch(()=>{});
    });
    window.AIFTStudentCareerHub={refresh,openMarketplace,openApplication,openPassport};
  }'''
if old not in text:
    raise SystemExit('Career observer block not found')
path.write_text(text.replace(old,new,1),encoding='utf-8')

path = Path('student.js')
text = path.read_text(encoding='utf-8')
old = '''  /* =======================================================
     LIVE BACKEND DATA
  ======================================================== */

await loadStudentCareerHubData();


renderStudentCareerOpportunities();


renderStudentCareerVentures();


renderStudentCareerApplications();


updateStudentCareerSavedCount();

}'''
new = '''  /* =======================================================
     LIVE BACKEND DATA
     Render immediately; hydrate network data after first paint.
  ======================================================== */

  renderStudentCareerOpportunities();
  renderStudentCareerVentures();
  renderStudentCareerApplications();
  updateStudentCareerSavedCount();

  const hydrateCareerHub = async () => {
    try{
      await loadStudentCareerHubData();
      if(document.body.dataset.studentSection !== "career") return;
      renderStudentCareerOpportunities();
      renderStudentCareerVentures();
      renderStudentCareerApplications();
      updateStudentCareerSavedCount();
    }catch(error){
      console.error("Career Hub background hydration failed:",error);
    }
  };

  if(typeof requestAnimationFrame === "function") requestAnimationFrame(()=>setTimeout(hydrateCareerHub,0));
  else setTimeout(hydrateCareerHub,0);

}'''
if old not in text:
    raise SystemExit('Career hydration block not found')
text = text.replace(old,new,1)
old = '''function openStudentStudioPage(
  requestedPage,
  options = {}
){
  const page =
    normalizeStudentStudioPage(
      requestedPage
    );

  activeStudentStudioPage = page;'''
new = '''function openStudentStudioPage(
  requestedPage,
  options = {}
){
  const page =
    normalizeStudentStudioPage(
      requestedPage
    );

  if(
    page === "career" &&
    activeStudentStudioPage === "career" &&
    document.body.dataset.studentSection === "career" &&
    document.getElementById("studentCareerWorkspace")?.children?.length
  ){
    setStudentStudioActiveNavigation(page);
    setStudentStudioActiveMobileNavigation(page);
    return;
  }

  activeStudentStudioPage = page;'''
if old not in text:
    raise SystemExit('Career repeat-open block not found')
path.write_text(text.replace(old,new,1),encoding='utf-8')
