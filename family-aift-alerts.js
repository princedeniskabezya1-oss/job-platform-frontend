(() => {
  "use strict";

  const page=String(location.pathname.split("/").pop()||"").toLowerCase();
  if(page!=="family.html") return;

  const ACTIONS=[
    {
      selector:"[data-cancel-family-link]",
      title:"Cancel Student Connection Request?",
      message:"This will cancel the pending connection request. The Student will no longer be able to approve this request unless you send a new one.",
      confirmLabel:"Cancel Request",
      tone:"warning"
    },
    {
      selector:"[data-unlink-child]",
      title:"Unlink AIFT Student?",
      message:"This removes the Family connection to this verified AIFT Student account. The Student profile itself will not be deleted.",
      confirmLabel:"Unlink Student",
      tone:"danger"
    },
    {
      selector:"[data-archive-child]",
      title:"Archive Student Profile?",
      message:"The Student profile will be archived from this Family workspace. Historical requests and review records will remain available where required.",
      confirmLabel:"Archive Profile",
      tone:"danger"
    },
    {
      selector:"[data-delete-scholarship-application]",
      title:"Delete Scholarship Draft?",
      message:"This draft will be permanently removed. This action cannot be undone.",
      confirmLabel:"Delete Draft",
      tone:"danger"
    },
    {
      selector:"[data-withdraw-scholarship-application]",
      title:"Withdraw Scholarship Application?",
      message:"The application will be withdrawn and will no longer continue through the scholarship process.",
      confirmLabel:"Withdraw Application",
      tone:"danger"
    },
    {
      selector:"[data-delete-submitted-request]",
      title:"Delete Submitted Request?",
      message:"This request will be removed from My Requests and its AIFT review will be marked Cancelled. You can only do this while the review is still Submitted.",
      confirmLabel:"Delete Request",
      tone:"danger"
    },
    {
      selector:"[data-delete-investor-interest]",
      title:"Delete Investment Interest?",
      message:"This submitted investment interest will be removed from Investor Mode and its AIFT review will be marked Cancelled. This cannot be undone.",
      confirmLabel:"Delete Interest",
      tone:"danger"
    },
    {
      selector:'[data-venture-interest-action="accepted"]',
      title:"Accept Investor Introduction?",
      message:"This confirms that you want to continue with this AIFT-approved investor introduction. If the required review stage is complete, the workflow can move toward matching and a controlled Deal Room.",
      confirmLabel:"Accept Introduction",
      tone:"warning"
    },
    {
      selector:'[data-venture-interest-action="declined"]',
      title:"Decline Investor Introduction?",
      message:"This will decline the investor introduction and close this path for the current request. The decision will remain in AIFT Activity history.",
      confirmLabel:"Decline Introduction",
      tone:"danger"
    }
  ];

  const state={
    open:false,
    resolver:null,
    previousFocus:null,
    bypassElement:null
  };

  function ensureStyle(){
    if(document.getElementById("aiftFamilyDialogStyle")) return;
    const style=document.createElement("style");
    style.id="aiftFamilyDialogStyle";
    style.textContent=`
      .aift-family-dialog-backdrop{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:20px;background:rgba(8,23,47,.46);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
      .aift-family-dialog-backdrop[hidden]{display:none!important}
      .aift-family-dialog{width:min(430px,100%);overflow:hidden;border:1px solid #dfe6ee;border-radius:18px;background:#fff;box-shadow:0 28px 80px rgba(15,23,42,.26);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;animation:aiftFamilyDialogIn .16s ease-out}
      @keyframes aiftFamilyDialogIn{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      .aift-family-dialog-head{display:flex;gap:12px;align-items:flex-start;padding:20px 20px 8px}
      .aift-family-dialog-icon{width:40px;height:40px;flex:0 0 auto;display:grid;place-items:center;border-radius:12px;background:#fff4e5;color:#a15c00;font-size:20px;font-weight:900}
      .aift-family-dialog.danger .aift-family-dialog-icon{background:#fff0ef;color:#b42318}
      .aift-family-dialog.info .aift-family-dialog-icon{background:#eaf3ff;color:#0a66c2}
      .aift-family-dialog-copy{min-width:0;flex:1}
      .aift-family-dialog-title{margin:1px 0 0;color:#172033;font-size:16px;font-weight:850;line-height:1.35}
      .aift-family-dialog-kicker{margin-top:3px;color:#0a66c2;font-size:9px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}
      .aift-family-dialog-message{padding:4px 20px 18px;color:#667085;font-size:11px;line-height:1.65}
      .aift-family-dialog-actions{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px 18px;border-top:1px solid #edf1f5;background:#fbfcfe}
      .aift-family-dialog-button{min-height:38px;padding:0 14px;border:1px solid #d7e0ea;border-radius:9px;background:#fff;color:#344054;font-size:11px;font-weight:800;cursor:pointer}
      .aift-family-dialog-button:hover{background:#f7f9fc}
      .aift-family-dialog-button.primary{border-color:#0a66c2;background:#0a66c2;color:#fff}
      .aift-family-dialog-button.danger{border-color:#b42318;background:#b42318;color:#fff}
      .aift-family-dialog-button.warning{border-color:#c97812;background:#c97812;color:#fff}
      .aift-family-dialog-button:focus-visible{outline:3px solid rgba(10,102,194,.2);outline-offset:2px}
      @media(max-width:640px){.aift-family-dialog-backdrop{align-items:end;padding:0}.aift-family-dialog{width:100%;border-radius:18px 18px 0 0}.aift-family-dialog-head{padding:18px 16px 8px}.aift-family-dialog-message{padding:4px 16px 16px}.aift-family-dialog-actions{padding:12px 16px calc(16px + env(safe-area-inset-bottom));display:grid;grid-template-columns:1fr 1fr}.aift-family-dialog-button{width:100%;min-height:44px}}
    `;
    document.head.appendChild(style);
  }

  function ensureDialog(){
    let backdrop=document.getElementById("aiftFamilyDialogBackdrop");
    if(backdrop) return backdrop;

    backdrop=document.createElement("div");
    backdrop.id="aiftFamilyDialogBackdrop";
    backdrop.className="aift-family-dialog-backdrop";
    backdrop.hidden=true;
    backdrop.innerHTML=`
      <section class="aift-family-dialog" id="aiftFamilyDialog" role="alertdialog" aria-modal="true" aria-labelledby="aiftFamilyDialogTitle" aria-describedby="aiftFamilyDialogMessage">
        <div class="aift-family-dialog-head">
          <div class="aift-family-dialog-icon" id="aiftFamilyDialogIcon" aria-hidden="true">!</div>
          <div class="aift-family-dialog-copy">
            <div class="aift-family-dialog-kicker">AIFT Confirmation</div>
            <h2 class="aift-family-dialog-title" id="aiftFamilyDialogTitle">Confirm action</h2>
          </div>
        </div>
        <div class="aift-family-dialog-message" id="aiftFamilyDialogMessage"></div>
        <div class="aift-family-dialog-actions">
          <button class="aift-family-dialog-button" id="aiftFamilyDialogCancel" type="button">Cancel</button>
          <button class="aift-family-dialog-button primary" id="aiftFamilyDialogConfirm" type="button">Continue</button>
        </div>
      </section>`;
    document.body.appendChild(backdrop);

    backdrop.addEventListener("click",event=>{
      if(event.target===backdrop) close(false);
    });
    document.getElementById("aiftFamilyDialogCancel")?.addEventListener("click",()=>close(false));
    document.getElementById("aiftFamilyDialogConfirm")?.addEventListener("click",()=>close(true));
    return backdrop;
  }

  function close(result){
    const backdrop=document.getElementById("aiftFamilyDialogBackdrop");
    if(!state.open||!backdrop) return;
    state.open=false;
    backdrop.hidden=true;
    document.body.style.removeProperty("overflow");
    const resolve=state.resolver;
    state.resolver=null;
    if(state.previousFocus instanceof HTMLElement) state.previousFocus.focus({preventScroll:true});
    state.previousFocus=null;
    resolve?.(Boolean(result));
  }

  function confirmAift({title="Confirm action",message="Are you sure you want to continue?",confirmLabel="Continue",cancelLabel="Cancel",tone="warning"}={}){
    ensureStyle();
    const backdrop=ensureDialog();
    if(state.open) close(false);
    state.open=true;
    state.previousFocus=document.activeElement;
    document.getElementById("aiftFamilyDialogTitle").textContent=String(title);
    document.getElementById("aiftFamilyDialogMessage").textContent=String(message);
    const dialog=document.getElementById("aiftFamilyDialog");
    dialog.className=`aift-family-dialog ${tone}`.trim();
    const icon=document.getElementById("aiftFamilyDialogIcon");
    if(icon) icon.textContent=tone==="info"?"i":"!";
    const cancel=document.getElementById("aiftFamilyDialogCancel");
    const confirm=document.getElementById("aiftFamilyDialogConfirm");
    cancel.textContent=String(cancelLabel);
    confirm.textContent=String(confirmLabel);
    confirm.className=`aift-family-dialog-button ${tone==="danger"?"danger":tone==="warning"?"warning":"primary"}`;
    backdrop.hidden=false;
    document.body.style.overflow="hidden";
    requestAnimationFrame(()=>cancel.focus({preventScroll:true}));
    return new Promise(resolve=>{state.resolver=resolve;});
  }

  function alertAift(message,{title="AIFT",buttonLabel="OK",tone="info"}={}){
    return confirmAift({title,message,confirmLabel:buttonLabel,cancelLabel:"Close",tone}).then(()=>undefined);
  }

  async function continueOriginalAction(element,action){
    const approved=await confirmAift(action);
    if(!approved||!element?.isConnected) return;

    const nativeConfirm=window.confirm;
    state.bypassElement=element;
    window.confirm=()=>true;
    try{
      element.click();
    }finally{
      window.confirm=nativeConfirm;
      state.bypassElement=null;
    }
  }

  function matchAction(target){
    for(const action of ACTIONS){
      const element=target.closest?.(action.selector);
      if(element) return {element,action};
    }
    return null;
  }

  document.addEventListener("click",event=>{
    const match=matchAction(event.target);
    if(!match) return;
    if(state.bypassElement===match.element) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    continueOriginalAction(match.element,match.action);
  },true);

  document.addEventListener("keydown",event=>{
    if(!state.open) return;
    if(event.key==="Escape"){
      event.preventDefault();
      close(false);
      return;
    }
    if(event.key!=="Tab") return;
    const backdrop=document.getElementById("aiftFamilyDialogBackdrop");
    const focusable=Array.from(backdrop?.querySelectorAll("button:not([disabled])")||[]);
    if(!focusable.length) return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });

  ensureStyle();
  ensureDialog();

  window.aiftFamilyConfirm=confirmAift;
  window.aiftFamilyAlert=alertAift;
  window.alert=(message)=>{alertAift(String(message||""));};
})();
