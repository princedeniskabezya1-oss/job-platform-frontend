(() => {
  "use strict";

  const API="https://backend-1-9b6f.onrender.com";
  const state={reviews:[],loading:false,observer:null};

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

  function toast(message,type="success"){
    const wrap=document.getElementById("familyToastWrap");
    if(!wrap){
      if(type==="error") console.error(message); else console.log(message);
      return;
    }
    const item=document.createElement("div");
    item.className=`family-toast ${type}`.trim();
    item.textContent=message;
    wrap.appendChild(item);
    window.setTimeout(()=>item.remove(),4500);
  }

  function resourceFromCard(card){
    const ventureButton=card.querySelector("[data-edit-venture]");
    if(ventureButton?.dataset.editVenture){
      return {type:"venture",id:String(ventureButton.dataset.editVenture)};
    }

    const scholarshipButton=card.querySelector("[data-view-scholarship-application],[data-edit-scholarship-application]");
    const scholarshipId=scholarshipButton?.dataset.viewScholarshipApplication||scholarshipButton?.dataset.editScholarshipApplication;
    if(scholarshipId){
      return {type:"scholarship_application",id:String(scholarshipId)};
    }

    return null;
  }

  function matchingReview(resource){
    if(!resource)return null;
    return state.reviews.find(review=>
      review.status==="submitted" &&
      String(review.type||"")===resource.type &&
      String(review.resourceId?._id||review.resourceId||"")===resource.id
    )||null;
  }

  function decorateRequests(){
    document.querySelectorAll("#familyRequestList .family-request-card").forEach(card=>{
      const statusChip=card.querySelector(".family-chip.submitted");
      const actions=card.querySelector(".family-row-actions");
      const resource=resourceFromCard(card);
      const review=statusChip&&resource?matchingReview(resource):null;
      const existing=card.querySelector("[data-delete-submitted-request]");

      if(!review){
        existing?.remove();
        return;
      }

      if(existing){
        existing.dataset.deleteSubmittedRequest=String(review._id);
        return;
      }

      if(!actions)return;
      const button=document.createElement("button");
      button.type="button";
      button.className="family-small-button";
      button.dataset.deleteSubmittedRequest=String(review._id);
      button.textContent="Delete Request";
      button.title="Delete this request while it is still submitted";
      actions.appendChild(button);
    });
  }

  async function loadReviews(){
    if(state.loading||!token())return;
    state.loading=true;
    try{
      const data=await api("/api/review-cases/mine");
      state.reviews=Array.isArray(data?.cases)?data.cases:[];
      decorateRequests();
    }catch(error){
      console.warn("Could not load submitted request deletion state",error);
    }finally{
      state.loading=false;
    }
  }

  async function deleteSubmittedRequest(button){
    const reviewId=String(button.dataset.deleteSubmittedRequest||"");
    if(!reviewId)return;

    const review=state.reviews.find(item=>String(item._id)===reviewId);
    if(!review||review.status!=="submitted"){
      toast("This request can no longer be deleted because it is no longer submitted.","error");
      await loadReviews();
      return;
    }

    const confirmed=window.confirm("Delete this submitted request? The request will be removed from My Requests and its AIFT Activity review will be marked Cancelled. This cannot be undone.");
    if(!confirmed)return;

    button.disabled=true;
    const originalText=button.textContent;
    button.textContent="Deleting…";

    try{
      await api(`/api/review-cases/${encodeURIComponent(reviewId)}/request`,{method:"DELETE"});
      toast("Submitted request deleted. AIFT Activity has been updated.","success");

      state.reviews=state.reviews.map(item=>String(item._id)===reviewId?{...item,status:"cancelled",updatedAt:new Date().toISOString()}:item);
      button.closest(".family-request-card")?.remove();

      const requestCount=document.getElementById("familyRequestNavCount");
      if(requestCount){
        const current=Number(requestCount.textContent||0);
        if(Number.isFinite(current)&&current>0)requestCount.textContent=String(current-1);
      }

      document.getElementById("familyRequestRefresh")?.click();
      document.getElementById("aiftMyReviewRefresh")?.click();
      window.dispatchEvent(new CustomEvent("aift:request-deleted",{detail:{reviewId}}));
      window.dispatchEvent(new CustomEvent("aift:activity-updated",{detail:{changed:true,source:"request-delete"}}));
      await loadReviews();
    }catch(error){
      button.disabled=false;
      button.textContent=originalText;
      toast(error.message,"error");
      await loadReviews();
    }
  }

  function bind(){
    document.addEventListener("click",event=>{
      const button=event.target.closest("[data-delete-submitted-request]");
      if(!button)return;
      event.preventDefault();
      event.stopPropagation();
      deleteSubmittedRequest(button);
    });

    window.addEventListener("aift:activity-updated",()=>loadReviews());
    window.addEventListener("focus",()=>loadReviews(),{passive:true});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)loadReviews();});
  }

  function observe(){
    const list=document.getElementById("familyRequestList");
    if(!list)return;
    state.observer=new MutationObserver(()=>decorateRequests());
    state.observer.observe(list,{childList:true,subtree:true});
  }

  function loadInvestorWorkflow(){
    if(document.getElementById("familyInvestorInterestWorkflowScript"))return;
    const script=document.createElement("script");
    script.id="familyInvestorInterestWorkflowScript";
    script.src="family-investor-interest-workflow.js";
    script.defer=true;
    document.head.appendChild(script);
  }

  function init(){
    if(page()!=="family.html"||!token())return;
    bind();
    observe();
    loadInvestorWorkflow();
    loadReviews();
    window.setInterval(()=>{if(!document.hidden)loadReviews();},10000);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();