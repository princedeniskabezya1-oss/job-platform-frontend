const fs=require('fs'),path=require('path');const root=path.join(__dirname,'..');
function patch(file,fn){const p=path.join(root,file);const a=fs.readFileSync(p,'utf8'),b=fn(a);if(a===b)throw new Error(file+' not changed');fs.writeFileSync(p,b);}
patch('family-production.js',s=>{const old=/async function viewVenture\(id\)\{[\s\S]*?\n  \}\n\n  async function saveVenture/;const m=s.match(old);if(!m)throw new Error('viewVenture block missing');return s.replace(old,`async function viewVenture(id){
    if(!id) return;
    await api(\`/api/ventures/\${encodeURIComponent(id)}/view\`,{ method:"PATCH" }).catch(() => null);
    window.location.href = \`venture.html?id=\${encodeURIComponent(id)}&from=family-investor\`;
  }

  async function saveVenture`);});
patch('aift-review-center-admin.js',s=>{const start=s.indexOf('  function actionButtons(item){');const end=s.indexOf('  function openCase(id){',start);if(start<0||end<0)throw new Error('action block missing');const block=`  function workflowCopy(item){
    if(item.type==="investment_interest") return { approved:"Approve investor interest", matched:"Confirm both parties matched", negotiation:"Open negotiation stage", completed:"Complete investment case" };
    return { approved:"Approve request", matched:"Mark matched", negotiation:"Open negotiation", completed:"Complete case" };
  }
  function actionButtons(item){
    if(terminal.has(item.status))return '<div class="aift-review-muted">This review case is closed.</div>';
    const id=esc(item._id),copy=workflowCopy(item),button=(status,label,cls="")=>\`<button type="button" class="\${cls}" data-review-action="\${status}" data-id="\${id}">\${label}</button>\`;
    const actions={
      submitted:[button("under_review","Start review","primary"),button("rejected","Reject","danger")],
      under_review:[button("information_requested","Request information"),button("approved",copy.approved,"primary"),button("rejected","Reject","danger")],
      information_requested:[button("under_review","Resume review","primary"),button("rejected","Reject","danger")],
      approved:[button("matched",copy.matched,"primary"),button("rejected","Reject","danger")],
      matched:[button("negotiation",copy.negotiation,"primary")],
      negotiation:[button("completed",copy.completed,"primary")]
    };
    return \`<div class="aift-review-actions">\${(actions[item.status]||[]).join("")}</div>\`;
  }

`;s=s.slice(0,start)+block+s.slice(end);
s=s.replace('Approval can release the linked resource to the next real workflow stage. Review the requester, receiving party, amounts, documents and case history before approving.','AIFT approval only authorizes this request to move to its next controlled stage. It does not release personal contact information. Investment interests must still be matched before negotiation can begin.');
s=s.replace('status==="approved"?"This can release the linked resource to the receiving party. Continue?":`This will mark the AIFT review as ${titleCase(status)}. Continue?`','status==="approved"?(item.type==="investment_interest"?"Approve this investor interest for the next controlled AIFT stage? The venture owner may receive the approved interest, but personal contact information is not released.":"Approve this request for its next controlled AIFT stage? Personal contact information is not released."):`This will mark the AIFT review as ${titleCase(status)}. Continue?`');return s;});
