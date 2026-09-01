(() => {
  "use strict";

  const API="https://backend-1-9b6f.onrender.com";
  const TERMINAL_REVIEWS=new Set(["rejected","cancelled","completed","expired"]);
  const TERMINAL_INTERESTS=new Set(["declined","withdrawn","closed"]);
  const state={ventures:[],reviews:[],filter:"active",loading:false,observer:null,lastLoadedAt:0};

  function page(){return String(location.pathname.split("/").pop()||"").toLowerCase();}
  function role(){return String(localStorage.getItem("role")||"").trim().toLowerCase();}
  function token(){
    const map={student:"studentToken",talent:"talentToken",school:"schoolToken",employer:"employerToken",admin:"adminToken"};
    for(const key of [map[role()],"token","studentToken","talentToken","schoolToken","employerToken","adminToken"].filter(Boolean)){
      const value=localStorage.getItem(key)||sessionStorage.getItem(key);
      if(value)return value;
    }
    return "";
  }

  function esc(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
  function title(value){return String(value||"").replaceAll("_"," ").replaceAll("-"," ").replace(/\b\w/g,c=>c.toUpperCase());}

  async function api(path,options={}){
    const response=await fetch(`${API}${path}`,{
      ...options,
      headers:{Authorization:`Bearer ${token()}`,...(options.headers||{})}
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      const error=new Error(data.message||`Request failed (${response.status})`);
      error.status=response.status;
      error.data=data;
      throw error;
    }
    return data;
  }

  function ensureStyle(){
    if(document.getElementById("familyInvestorWorkflowStyle"))return;
    const style=document.createElement("style");
    style.id="familyInvestorWorkflowStyle";
    style.textContent=`
      .family-investor-workflow-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 14px;padding:12px 14px;border:1px solid #e1e8f0;border-radius:13px;background:#fbfcfe}
      .family-investor-workflow-copy{min-width:0;flex:1 1 260px}.family-investor-workflow-copy strong{display:block;color:#172033;font-size:10px}.family-investor-workflow-copy span{display:block;margin-top:3px;color:#667085;font-size:8px;line-height:1.5}
      .family-investor-workflow-tabs{display:flex;gap:6px;flex-wrap:wrap}.family-investor-workflow-tab{min-height:31px;padding:0 10px;border:1px solid #d6dee8;border-radius:8px;background:#fff;color:#475467;font-size:8px;font-weight:800;cursor:pointer}.family-investor-workflow-tab.active{border-color:#b9d5f4;background:#eaf3ff;color:#0a66c2}
      .family-investor-review-chip{display:inline-flex;padding:4px 7px;border-radius:999px;background:#fff4dc;color:#8a5a00;font-size:7px;font-weight:800}.family-investor-review-chip.approved,.family-investor-review-chip.matched,.family-investor-review-chip.negotiation{background:#eaf8f0;color:#157348}.family-investor-review-chip.rejected,.family-investor-review-chip.cancelled,.family-investor-review-chip.expired{background:#fdeceb;color:#b42318}
      .family-investor-history-note{margin:0 0 12px;padding:10px 12px;border:1px solid #e5e9ef;border-radius:10px;background:#fff;color:#667085;font-size:8px;line-height:1.55}.family-investor-history-note strong{color:#344054}
      .family-investor-filter-empty{padding:24px 16px;text-align:center;border:1px dashed #d9e0e8;border-radius:12px;color:#667085;font-size:9px;line-height:1.55}
      .family-investor-delete{color:#b42318!important;border-color:#efc7c3!important;background:#fff7f6!important}
      @media(max-width:680px){
        .family-investor-workflow-bar{align-items:stretch;padding:11px}.family-investor-workflow-tabs{width:100%}.family-investor-workflow-tab{flex:1 1 0}
        .family-discovery-footer{align-items:flex-start;flex-direction:column}.family-discovery-footer .family-row-actions{width:100%;display:flex;flex-wrap:wrap}.family-discovery-footer .family-row-actions .family-small-button{flex:1 1 auto}
      }
      @media(max-width:480px){
        .family-process-steps,.family-live-strip,.family-student-summary{grid-template-columns:1fr!important}
        .family-student-hero{padding:16px!important}.family-student-panel-head{align-items:flex-start!important;flex-direction:column!important}
        .family-student-actions{width:100%!important}.family-student-actions .family-small-button{flex:1 1 100%!important}
        .family-role-guide{gap:10px!important}.family-access-card,.family-process-card{border-radius:12px!important}
        .family-toast-wrap{left:10px!important;right:10px!important}.family-toast{min-width:0!important;max-width:none!important;width:100%!important}
      }
    `;
    document.head.appendChild(style);
  }

  function interestForVenture(id){
    return state.ventures.find(item=>String(item._id||"")===String(id||""))||null;
  }

  function reviewForInterest(venture){
    const interestId=venture?.investorState?.investmentInterest?.id;
    if(!interestId)return null;
    return state.reviews.find(review=>
      review.type==="investment_interest" &&
      String(review.resourceId?._id||review.resourceId||"")===String(interestId)
    )||null;
  }

  function bucketFor(venture,review){
    const interestStatus=String(venture?.investorState?.interestStatus||venture?.investorState?.investmentInterest?.status||"").toLowerCase();
    const reviewStatus=String(review?.status||"").toLowerCase();
    if(TERMINAL_REVIEWS.has(reviewStatus)||TERMINAL_INTERESTS.has(interestStatus))return "history";
    return "active";
  }

  function workflowLabel(venture,review){
    const reviewStatus=String(review?.status||"").toLowerCase();
    const interestStatus=String(venture?.investorState?.interestStatus||"").toLowerCase();
    if(reviewStatus==="submitted")return "AIFT Submitted";
    if(reviewStatus==="under_review")return "AIFT Reviewing";
    if(reviewStatus==="information_requested")return "Information Requested";
    if(reviewStatus==="approved"&&interestStatus==="pending")return "AIFT Approved · Awaiting Venture";
    if(reviewStatus==="matched")return "Matched";
    if(reviewStatus==="negotiation")return "Deal Room Active";
    if(reviewStatus==="completed")return "Completed";
    if(reviewStatus)return title(reviewStatus);
    return interestStatus?title(interestStatus):"Interest";
  }

  function ensureControls(){
    const list=document.getElementById("familyInvestorInterestedList");
    if(!list)return;
    let bar=document.getElementById("familyInvestorWorkflowBar");
    if(!bar){
      bar=document.createElement("div");
      bar.id="familyInvestorWorkflowBar";
      bar.className="family-investor-workflow-bar";
      list.insertAdjacentElement("beforebegin",bar);
    }
    const active=state.ventures.filter(venture=>bucketFor(venture,reviewForInterest(venture))==="active").length;
    const history=state.ventures.length-active;
    bar.innerHTML=`<div class="family-investor-workflow-copy"><strong>Investment Interests</strong><span>Approved introductions stay active until the Venture responds or the process reaches a final outcome.</span></div><div class="family-investor-workflow-tabs"><button type="button" class="family-investor-workflow-tab ${state.filter==="active"?"active":""}" data-investor-interest-filter="active">Active ${active}</button><button type="button" class="family-investor-workflow-tab ${state.filter==="history"?"active":""}" data-investor-interest-filter="history">History ${history}</button></div>`;

    let note=document.getElementById("familyInvestorHistoryNote");
    if(!note){
      note=document.createElement("div");
      note.id="familyInvestorHistoryNote";
      note.className="family-investor-history-note";
      bar.insertAdjacentElement("afterend",note);
    }
    note.innerHTML=state.filter==="active"
      ? `<strong>Active does not mean invested.</strong> AIFT approval only approves the introduction. The Venture can still consider other investors until fundraising is paused, funded or closed.`
      : `<strong>History</strong> keeps declined, withdrawn, cancelled, rejected, expired and completed interests out of your working list without deleting the audit trail.`;
  }

  function decorate(){
    const list=document.getElementById("familyInvestorInterestedList");
    if(!list)return;
    ensureControls();

    let visible=0;
    list.querySelectorAll(".family-discovery-card[data-venture-id]").forEach(card=>{
      const venture=interestForVenture(card.dataset.ventureId);
      if(!venture){card.hidden=true;return;}
      const review=reviewForInterest(venture);
      const bucket=bucketFor(venture,review);
      card.dataset.investorInterestBucket=bucket;
      card.hidden=bucket!==state.filter;
      if(!card.hidden)visible+=1;

      const meta=card.querySelector(".family-discovery-meta");
      let chip=card.querySelector(".family-investor-review-chip");
      if(meta&&!chip){
        chip=document.createElement("span");
        chip.className="family-investor-review-chip";
        meta.appendChild(chip);
      }
      if(chip){
        chip.className=`family-investor-review-chip ${esc(review?.status||"")}`;
        chip.textContent=workflowLabel(venture,review);
      }

      const actions=card.querySelector(".family-row-actions");
      const existing=card.querySelector("[data-delete-investor-interest]");
      const canDelete=review?.status==="submitted" && String(venture?.investorState?.investmentInterest?.status||"")==="pending";
      if(canDelete&&actions){
        const button=existing||document.createElement("button");
        button.type="button";
        button.className="family-small-button family-investor-delete";
        button.dataset.deleteInvestorInterest=String(review._id);
        button.textContent="Delete Interest";
        button.title="Delete this investment interest while it is still submitted";
        if(!existing)actions.appendChild(button);
      }else existing?.remove();
    });

    let empty=list.querySelector(".family-investor-filter-empty");
    if(!visible&&state.ventures.length){
      if(!empty){
        empty=document.createElement("div");
        empty.className="family-investor-filter-empty";
        list.appendChild(empty);
      }
      empty.textContent=state.filter==="active"?"No active investment interests right now.":"No investment-interest history yet.";
    }else empty?.remove();
  }

  function interestedPageActive(){
    return document.getElementById("familyPage-investor-interested")?.classList.contains("active")===true;
  }

  async function loadState(force=false){
    if(state.loading||!token())return;
    if(!force && Date.now()-state.lastLoadedAt<5000){decorate();return;}
    state.loading=true;
    try{
      const [interestData,reviewData]=await Promise.all([
        api("/api/ventures/investor/interested").catch(()=>({ventures:[]})),
        api("/api/review-cases/mine").catch(()=>({cases:[]}))
      ]);
      state.ventures=Array.isArray(interestData?.ventures)?interestData.ventures:[];
      state.reviews=Array.isArray(reviewData?.cases)?reviewData.cases:[];
      state.lastLoadedAt=Date.now();
      decorate();
    }finally{
      state.loading=false;
    }
  }

  function toast(message,type="success"){
    const wrap=document.getElementById("familyToastWrap");
    if(!wrap){console[type==="error"?"error":"log"](message);return;}
    const item=document.createElement("div");
    item.className=`family-toast ${type}`.trim();
    item.textContent=message;
    wrap.appendChild(item);
    setTimeout(()=>item.remove(),4500);
  }

  async function deleteInterest(button){
    const reviewId=String(button.dataset.deleteInvestorInterest||"");
    const review=state.reviews.find(item=>String(item._id)===reviewId);
    if(!review||review.status!=="submitted"){
      toast("This interest can no longer be deleted because AIFT has already started processing it.","error");
      await loadState(true);
      return;
    }
    if(!window.confirm("Delete this submitted investment interest? It will be removed from your Investor list and the AIFT review will be marked Cancelled. This cannot be undone."))return;

    button.disabled=true;
    const old=button.textContent;
    button.textContent="Deleting…";
    try{
      await api(`/api/review-cases/${encodeURIComponent(reviewId)}/request`,{method:"DELETE"});
      button.closest(".family-discovery-card")?.remove();
      toast("Submitted investment interest deleted.","success");
      await loadState(true);
      document.getElementById("aiftMyReviewRefresh")?.click();
      window.dispatchEvent(new CustomEvent("aift:activity-updated",{detail:{changed:true,source:"investor-interest-delete"}}));
    }catch(error){
      button.disabled=false;
      button.textContent=old;
      toast(error.message,"error");
      await loadState(true);
    }
  }

  function bind(){
    document.addEventListener("click",event=>{
      const filter=event.target.closest("[data-investor-interest-filter]");
      if(filter){
        state.filter=filter.dataset.investorInterestFilter==="history"?"history":"active";
        decorate();
        return;
      }

      const nav=event.target.closest('[data-page="investor-interested"],[data-page-link="investor-interested"]');
      if(nav){
        window.setTimeout(()=>loadState(true),80);
        return;
      }

      const button=event.target.closest("[data-delete-investor-interest]");
      if(button){
        event.preventDefault();
        event.stopPropagation();
        deleteInterest(button);
      }
    });

    window.addEventListener("aift:activity-updated",event=>{
      if(event.detail?.changed===true && interestedPageActive()) loadState(true);
    });

    window.addEventListener("focus",()=>{
      if(interestedPageActive()) loadState(true);
    },{passive:true});
  }

  function observe(){
    const list=document.getElementById("familyInvestorInterestedList");
    if(!list)return;
    let queued=false;
    state.observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;decorate();});
    });
    state.observer.observe(list,{childList:true,subtree:true});
  }

  function init(){
    if(page()!=="family.html"||!token())return;
    ensureStyle();
    bind();
    observe();
    if(interestedPageActive()) loadState(true);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();