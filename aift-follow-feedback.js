(function(){
  "use strict";

  const STYLE_ID="aift-follow-feedback-style";

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;

    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      @keyframes aiftFollowConfirm{
        0%{transform:scale(.92);}
        45%{transform:scale(1.06);}
        100%{transform:scale(1);}
      }
      @keyframes aiftFollowSpin{
        to{transform:rotate(360deg);}
      }
      .aift-follow-feedback-pop{
        animation:aiftFollowConfirm .52s ease both!important;
      }
      .aift-follow-feedback-followed{
        background:#eafaf1!important;
        border-color:#16a34a!important;
        color:#15803d!important;
      }
      .aift-follow-feedback-requested{
        background:#0095f6!important;
        border-color:#0095f6!important;
        color:#fff!important;
      }
      .aift-follow-feedback-check{
        display:inline-grid;
        place-items:center;
        width:16px;
        height:16px;
        margin-right:5px;
        border-radius:50%;
        background:#fff;
        color:#0095f6;
        font-size:11px;
        font-weight:900;
        line-height:1;
        flex:0 0 auto;
      }
      .aift-follow-feedback-loader{
        display:inline-block;
        width:13px;
        height:13px;
        margin-right:6px;
        border:2px solid #cbd5e1;
        border-top-color:#0a66c2;
        border-radius:50%;
        animation:aiftFollowSpin .7s linear infinite;
        flex:0 0 auto;
      }
    `;
    document.head.appendChild(style);
  }

  function list(buttons){
    return Array.from(buttons || []).filter(Boolean);
  }

  function clearFeedbackClass(button){
    button.classList.remove(
      "aift-follow-feedback-pop",
      "aift-follow-feedback-followed",
      "aift-follow-feedback-requested"
    );
  }

  function labelFor({following=false,requested=false}={}){
    if(requested) return "Requested";
    return following ? "Following" : "Follow";
  }

  function setButtonLabel(button,label){
    button.textContent=label;
  }

  function setLoading(buttons,label="Updating"){
    ensureStyle();
    list(buttons).forEach(button=>{
      if(!button.dataset.aiftFollowOriginalLabel){
        button.dataset.aiftFollowOriginalLabel=button.textContent.trim() || "Follow";
      }
      clearFeedbackClass(button);
      button.disabled=true;
      button.innerHTML='<span class="aift-follow-feedback-loader" aria-hidden="true"></span><span>'+label+'</span>';
    });
  }

  async function confirm(buttons,state={}){
    ensureStyle();

    const following=state.following===true;
    const requested=state.requested===true;

    if(!following && !requested){
      reset(buttons,{following:false,requested:false});
      return {following:false,requested:false};
    }

    const transientLabel=requested ? "Requested" : "Following";
    const tone=requested
      ? "aift-follow-feedback-requested"
      : "aift-follow-feedback-followed";

    list(buttons).forEach(button=>{
      button.disabled=false;
      clearFeedbackClass(button);
      button.classList.add("aift-follow-feedback-pop",tone);
      button.innerHTML='<span class="aift-follow-feedback-check" aria-hidden="true">✓</span><span>'+transientLabel+'</span>';
    });

    await new Promise(resolve=>setTimeout(resolve,520));

    list(buttons).forEach(button=>{
      clearFeedbackClass(button);
      button.disabled=false;
      setButtonLabel(button,labelFor({following,requested}));
      button.dataset.aiftFollowOriginalLabel=labelFor({following,requested});
    });

    return {following,requested};
  }

  function relationId(item){
    return String(
      item?._id ||
      item?.id ||
      item?.userId ||
      item ||
      ""
    );
  }

  function hasRelation(items,userId){
    const target=String(userId||"");
    if(!target) return false;
    return Array.isArray(items) && items.some(item=>relationId(item)===target);
  }

  function syncViewer(viewer,userId,state={}){
    if(!viewer || !userId) return;

    const target=String(userId);
    const following=state.following===true;
    const requested=state.requested===true;

    const nextFollowing=Array.isArray(viewer.following) ? [...viewer.following] : [];
    const nextRequests=Array.isArray(viewer.followRequestsSent) ? [...viewer.followRequestsSent] : [];

    viewer.following=following
      ? hasRelation(nextFollowing,target)
        ? nextFollowing
        : [...nextFollowing,target]
      : nextFollowing.filter(item=>relationId(item)!==target);

    viewer.followRequestsSent=requested
      ? hasRelation(nextRequests,target)
        ? nextRequests
        : [...nextRequests,target]
      : nextRequests.filter(item=>relationId(item)!==target);
  }

  function reset(buttons,state={}){
    ensureStyle();
    const label=labelFor(state);
    list(buttons).forEach(button=>{
      clearFeedbackClass(button);
      button.disabled=false;
      setButtonLabel(button,label);
      button.dataset.aiftFollowOriginalLabel=label;
    });
  }

  window.AIFTFollowFeedback={
    setLoading,
    confirm,
    reset,
    labelFor,
    relationId,
    hasRelation,
    syncViewer
  };
})();