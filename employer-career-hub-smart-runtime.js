(() => {
  "use strict";

  const page=String(location.pathname.split("/").pop() || "").toLowerCase();
  if(page !== "employer.html") return;

  if(!document.getElementById("empSmartCareerRuntimeStyle")){
    const style=document.createElement("style");
    style.id="empSmartCareerRuntimeStyle";
    style.textContent=`
      #empSmartCareerOverlay .esc-modal{
        width:min(1080px,calc(100vw - 32px));
        height:min(940px,calc(100dvh - 24px));
        max-height:calc(100dvh - 24px);
      }
      #empSmartCareerOverlay .esc-head{
        padding:21px 24px 17px;
      }
      #empSmartCareerOverlay .esc-head p{
        max-width:760px;
      }
      #empSmartCareerOverlay .esc-body{
        padding:22px 24px 34px;
      }
      #empSmartCareerOverlay .esc-foot{
        padding-left:24px;
        padding-right:24px;
      }
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
      @media(max-width:760px){
        #empSmartCareerOverlay .esc-modal{
          width:100%;
          height:94dvh;
          max-height:94dvh;
        }
        #empSmartCareerOverlay .esc-head{
          padding:15px 16px 12px;
        }
        #empSmartCareerOverlay .esc-body{
          padding:15px 16px 25px;
        }
        #empSmartCareerOverlay .esc-foot{
          padding-left:16px;
          padding-right:16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function normalizedText(node){
    return String(node?.textContent || "").replace(/\s+/g," ").trim();
  }

  function replaceExactText(root,from,to){
    if(!root) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    let current;
    while((current=walker.nextNode())) nodes.push(current);

    nodes.forEach(node=>{
      if(String(node.nodeValue || "").trim().toLowerCase() === from.toLowerCase()){
        const leading=String(node.nodeValue || "").match(/^\s*/)?.[0] || "";
        const trailing=String(node.nodeValue || "").match(/\s*$/)?.[0] || "";
        node.nodeValue=`${leading}${to}${trailing}`;
      }
    });
  }

  function clarifyCareerHubCopy(root=document){
    replaceExactText(root,"New School Proposal","Create Proposal");
    replaceExactText(root,"New school proposal","Create Proposal");

    root.querySelectorAll?.(".esc-section-head strong").forEach(title=>{
      if(normalizedText(title).toLowerCase() !== "connect existing opportunities") return;

      title.textContent="Attach an existing job, internship or project (optional)";

      const help=title.parentElement?.querySelector("span");
      if(help){
        help.textContent="Use this only when you already created the job, internship or project in Programs. Linking it lets Campus participants apply to that same opportunity, so you do not create the same listing twice. You can leave this empty.";
      }
    });
  }

  let copyTimer=null;
  function scheduleCopyRefresh(){
    clearTimeout(copyTimer);
    copyTimer=setTimeout(()=>clarifyCareerHubCopy(document),0);
  }

  const observer=new MutationObserver(mutations=>{
    if(!mutations.some(item=>item.addedNodes?.length || item.type === "characterData")) return;
    scheduleCopyRefresh();
  });

  if(document.documentElement){
    observer.observe(document.documentElement,{
      childList:true,
      subtree:true,
      characterData:true
    });
  }

  clarifyCareerHubCopy(document);

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

        scheduleCopyRefresh();
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
