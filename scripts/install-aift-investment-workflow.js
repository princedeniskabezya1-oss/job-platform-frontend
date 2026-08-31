const fs=require('fs'),path=require('path');const root=path.join(__dirname,'..');
function patch(file,fn){const p=path.join(root,file);const a=fs.readFileSync(p,'utf8'),b=fn(a);if(a===b)throw new Error(file+' not changed');fs.writeFileSync(p,b);}
patch('family-production.js',s=>{
  const old='      if(viewVentureButton){ await viewVenture(viewVentureButton.dataset.viewVenture); return; }';
  if(!s.includes(old))throw new Error('view venture click anchor missing');
  return s.replace(old,'      if(viewVentureButton){ const id=viewVentureButton.dataset.viewVenture; if(id) window.location.href=`venture.html?id=${encodeURIComponent(id)}&from=family-investor`; return; }');
});
patch('aift-review-center-admin.js',s=>{
  const start=s.indexOf('  function actionButtons(item){');
  const end=s.indexOf('  function openCase(id){',start);
  if(start<0||end<0)throw new Error('action block missing');
  const block=`  function workflowCopy(item){\n    if(item.type==="investment_interest") return { approved:"Approve investor interest", matched:"Confirm both parties matched", negotiation:"Open negotiation stage", completed:"Complete investment case" };\n    return { approved:"Approve request", matched:"Mark matched", negotiation:"Open negotiation", completed:"Complete case" };\n  }\n  function actionButtons(item){\n    if(terminal.has(item.status))return '<div class="aift-review-muted">This review case is closed.</div>';\n    const id=esc(item._id),copy=workflowCopy(item),button=(status,label,cls="")=>\`<button type="button" class="\${cls}" data-review-action="\${status}" data-id="\${id}">\${label}</button>\`;\n    const actions={\n      submitted:[button("under_review","Start review","primary"),button("rejected","Reject","danger")],\n      under_review:[button("information_requested","Request information"),button("approved",copy.approved,"primary"),button("rejected","Reject","danger")],\n      information_requested:[button("under_review","Resume review","primary"),button("rejected","Reject","danger")],\n      approved:[button("matched",copy.matched,"primary"),button("rejected","Reject","danger")],\n      matched:[button("negotiation",copy.negotiation,"primary")],\n      negotiation:[button("completed",copy.completed,"primary")]\n    };\n    return \`<div class="aift-review-actions">\${(actions[item.status]||[]).join("")}</div>\`;\n  }\n\n`;
  s=s.slice(0,start)+block+s.slice(end);
  const oldWarning='Approval can release the linked resource to the next real workflow stage. Review the requester, receiving party, amounts, documents and case history before approving.';
  if(!s.includes(oldWarning))throw new Error('review warning anchor missing');
  s=s.replace(oldWarning,'AIFT approval only authorizes this request to move to its next controlled stage. It does not release personal contact information. Investment interests must still be matched before negotiation can begin.');
  const oldConfirm='status==="approved"?"This can release the linked resource to the receiving party. Continue?":`This will mark the AIFT review as ${titleCase(status)}. Continue?`';
  if(!s.includes(oldConfirm))throw new Error('review confirm anchor missing');
  s=s.replace(oldConfirm,'status==="approved"?(item.type==="investment_interest"?"Approve this investor interest for the next controlled AIFT stage? The venture owner may receive the approved interest, but personal contact information is not released.":"Approve this request for its next controlled AIFT stage? Personal contact information is not released."):`This will mark the AIFT review as ${titleCase(status)}. Continue?`');
  return s;
});
console.log('AIFT investment workflow frontend updated');
