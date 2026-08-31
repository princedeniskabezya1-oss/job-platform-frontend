(() => {
  "use strict";

  const API = "https://backend-1-9b6f.onrender.com";
  const state = { cases:[], status:"", type:"", search:"" };
  const terminal = new Set(["rejected","completed","cancelled","expired"]);

  const esc = value => String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  function token(){ return localStorage.getItem("adminToken") || localStorage.getItem("token") || ""; }
  function titleCase(value){ return String(value||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase()); }
  function fmt(value){ if(!value)return "—";const d=new Date(value);return Number.isNaN(d.getTime())?"—":d.toLocaleString(); }
  function displayName(user){ return user?.companyName || user?.schoolName || user?.name || "AIFT member"; }

  async function api(path,options={}){
    const headers={Authorization:`Bearer ${token()}`,...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers||{})};
    const response=await fetch(API+path,{...options,headers});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.message||`Request failed (${response.status})`);
    return data;
  }

  function ensureStyle(){
    if(document.getElementById("aiftReviewCenterStyle")) return;
    const style=document.createElement("style");
    style.id="aiftReviewCenterStyle";
    style.textContent=`
      .aift-review-shell{padding:0}.aift-review-toolbar{display:grid;grid-template-columns:1.4fr .8fr .8fr auto;gap:10px;margin-bottom:16px}.aift-review-toolbar input,.aift-review-toolbar select{min-width:0;border:1px solid #d7dee8;border-radius:10px;padding:10px 12px;background:#fff;font:inherit}.aift-review-toolbar button{border:0;border-radius:10px;background:#0a66c2;color:#fff;padding:10px 14px;font-weight:800;cursor:pointer}
      .aift-review-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:16px}.aift-review-metric{background:#fff;border:1px solid #e3e8ef;border-radius:14px;padding:14px}.aift-review-metric span{display:block;color:#64748b;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.aift-review-metric strong{display:block;margin-top:6px;font-size:22px;color:#0f172a}
      .aift-review-table-wrap{background:#fff;border:1px solid #e3e8ef;border-radius:14px;overflow:auto}.aift-review-table{width:100%;border-collapse:collapse;min-width:1050px}.aift-review-table th,.aift-review-table td{text-align:left;padding:12px 14px;border-bottom:1px solid #edf1f5;font-size:12px;vertical-align:middle}.aift-review-table th{background:#f8fafc;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.04em}.aift-review-row{cursor:pointer}.aift-review-row:hover{background:#f8fbff}.aift-review-case{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#0a66c2;font-weight:800}.aift-review-title{font-weight:800;color:#0f172a}.aift-review-muted{color:#64748b}.aift-review-pill{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:10px;font-weight:800;text-transform:capitalize}.aift-review-pill.priority-urgent,.aift-review-pill.priority-high{background:#fee2e2;color:#b91c1c}.aift-review-pill.status-approved,.aift-review-pill.status-completed{background:#dcfce7;color:#166534}.aift-review-pill.status-rejected{background:#fee2e2;color:#b91c1c}.aift-review-pill.status-information_requested{background:#fef3c7;color:#92400e}.aift-review-empty{padding:34px;text-align:center;color:#64748b}.aift-review-actions{display:flex;gap:8px;flex-wrap:wrap}.aift-review-actions button{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:8px 10px;font-weight:700;cursor:pointer}.aift-review-actions button.primary{background:#0a66c2;color:#fff;border-color:#0a66c2}.aift-review-actions button.danger{background:#fff1f2;color:#be123c;border-color:#fecdd3}.aift-review-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:16px}.aift-review-detail{border:1px solid #e5e7eb;border-radius:10px;padding:12px}.aift-review-detail span{display:block;color:#64748b;font-size:11px;margin-bottom:4px}.aift-review-history{margin-top:16px}.aift-review-history-item{padding:10px 0;border-bottom:1px solid #eef2f7}.aift-review-history-item strong{display:block;font-size:12px}.aift-review-history-item span{font-size:11px;color:#64748b}.aift-review-note{width:100%;min-height:90px;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font:inherit;margin-top:12px}.aift-review-warning{margin:12px 0;padding:11px 12px;border:1px solid #fde68a;background:#fffbeb;color:#92400e;border-radius:10px;font-size:12px;line-height:1.5}.aift-review-sync{margin:12px 0;padding:11px 12px;border:1px solid #bbf7d0;background:#f0fdf4;color:#166534;border-radius:10px;font-size:12px;font-weight:700}
      @media(max-width:900px){.aift-review-toolbar{grid-template-columns:1fr 1fr}.aift-review-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.aift-review-detail-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureUI(){
    const nav=document.querySelector(".admin-nav");
    if(nav && !document.getElementById("aiftReviewCenterNav")){
      const button=document.createElement("button");
      button.type="button";button.id="aiftReviewCenterNav";
      button.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"></path><path d="M8 9h8M8 13h8M8 17h5"></path></svg><span>Review Center</span><span id="aiftReviewPendingBadge" style="margin-left:auto;min-width:20px;text-align:center;border-radius:999px;background:#fee2e2;color:#b91c1c;font-size:10px;padding:2px 6px">0</span>';
      const verification=nav.querySelector('[data-section="verification"]');nav.insertBefore(button,verification||nav.children[1]||null);button.addEventListener("click",openReviewCenter);
    }
    const main=document.querySelector(".admin-content,.admin-main-content,.admin-sections") || document.querySelector(".admin-main");
    if(main && !document.getElementById("aiftReviewCenterSection")){
      const section=document.createElement("section");section.id="aiftReviewCenterSection";section.className="admin-section hidden";
      section.innerHTML='<div class="aift-review-shell"><div class="aift-review-toolbar"><input id="aiftReviewSearch" type="search" placeholder="Search case, title or requester"><select id="aiftReviewStatus"><option value="">All statuses</option><option value="submitted">Submitted</option><option value="under_review">Under review</option><option value="information_requested">Information requested</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="matched">Matched</option><option value="negotiation">Negotiation</option><option value="completed">Completed</option></select><select id="aiftReviewType"><option value="">All types</option><option value="venture">Venture</option><option value="investment_interest">Investment interest</option><option value="scholarship">Scholarship</option><option value="scholarship_application">Scholarship application</option><option value="internship">Internship</option><option value="partnership">Partnership</option><option value="opportunity">Opportunity</option><option value="family_verification">Family verification</option><option value="student_verification">Student verification</option><option value="chat_safety">Chat safety</option><option value="other">Other</option></select><button id="aiftReviewRefresh" type="button">Refresh</button></div><div class="aift-review-metrics" id="aiftReviewMetrics"></div><div class="aift-review-table-wrap"><div id="aiftReviewTable"></div></div></div>';
      const contentHost=document.querySelector("#overviewSection")?.parentElement || main;contentHost.appendChild(section);
      section.querySelector("#aiftReviewSearch")?.addEventListener("input",e=>{state.search=e.target.value;render();});section.querySelector("#aiftReviewStatus")?.addEventListener("change",e=>{state.status=e.target.value;load();});section.querySelector("#aiftReviewType")?.addEventListener("change",e=>{state.type=e.target.value;load();});section.querySelector("#aiftReviewRefresh")?.addEventListener("click",load);section.addEventListener("click",e=>{const row=e.target.closest("[data-review-case-id]");if(row)openCase(row.dataset.reviewCaseId);});
    }
  }

  function openReviewCenter(){
    ensureUI();document.querySelectorAll(".admin-section").forEach(el=>el.classList.add("hidden"));document.getElementById("aiftReviewCenterSection")?.classList.remove("hidden");document.querySelectorAll(".admin-nav button").forEach(btn=>btn.classList.toggle("active",btn.id==="aiftReviewCenterNav"));
    const title=document.getElementById("adminPageTitle"),subtitle=document.getElementById("adminPageSubtitle"),badge=document.getElementById("adminSectionBadge");if(title)title.textContent="AIFT Review Center";if(subtitle)subtitle.textContent="Approve sensitive Career Hub actions before the receiving party can proceed.";if(badge)badge.textContent="Trust & Approvals";load();
  }

  function renderMetrics(){
    const counts={submitted:0,under_review:0,information_requested:0,urgent:0,open:0};state.cases.forEach(item=>{if(counts[item.status]!==undefined)counts[item.status]+=1;if(["urgent","high"].includes(item.priority))counts.urgent+=1;if(!terminal.has(item.status)&&item.status!=="approved")counts.open+=1;});
    const metrics=document.getElementById("aiftReviewMetrics");if(metrics)metrics.innerHTML=`<div class="aift-review-metric"><span>Open</span><strong>${counts.open}</strong></div><div class="aift-review-metric"><span>Submitted</span><strong>${counts.submitted}</strong></div><div class="aift-review-metric"><span>Under Review</span><strong>${counts.under_review}</strong></div><div class="aift-review-metric"><span>Needs Info</span><strong>${counts.information_requested}</strong></div><div class="aift-review-metric"><span>High Priority</span><strong>${counts.urgent}</strong></div>`;const badge=document.getElementById("aiftReviewPendingBadge");if(badge)badge.textContent=String(counts.open);
  }

  function filtered(){const q=state.search.trim().toLowerCase();if(!q)return state.cases;return state.cases.filter(item=>[item.caseNumber,item.title,item.type,item.status,displayName(item.requesterId)].filter(Boolean).join(" ").toLowerCase().includes(q));}
  function render(){
    renderMetrics();const container=document.getElementById("aiftReviewTable");if(!container)return;const rows=filtered();if(!rows.length){container.innerHTML='<div class="aift-review-empty">No AIFT review cases matched these filters.</div>';return;}
    container.innerHTML=`<table class="aift-review-table"><thead><tr><th>Case</th><th>Type</th><th>Request</th><th>Requester</th><th>Status</th><th>Priority</th><th>Submitted</th></tr></thead><tbody>${rows.map(item=>`<tr class="aift-review-row" data-review-case-id="${esc(item._id)}"><td class="aift-review-case">${esc(item.caseNumber)}</td><td>${esc(titleCase(item.type))}</td><td><div class="aift-review-title">${esc(item.title)}</div><div class="aift-review-muted">${esc(String(item.summary||"").slice(0,90))}</div></td><td>${esc(displayName(item.requesterId))}<div class="aift-review-muted">${esc(item.requesterId?.role||"")}</div></td><td><span class="aift-review-pill status-${esc(item.status)}">${esc(titleCase(item.status))}</span></td><td><span class="aift-review-pill priority-${esc(item.priority||"normal")}">${esc(titleCase(item.priority||"normal"))}</span></td><td>${esc(fmt(item.createdAt))}</td></tr>`).join("")}</tbody></table>`;
  }

  async function load(){ensureUI();const container=document.getElementById("aiftReviewTable");if(container)container.innerHTML='<div class="aift-review-empty">Loading AIFT review cases…</div>';try{const params=new URLSearchParams();if(state.status)params.set("status",state.status);if(state.type)params.set("type",state.type);const data=await api(`/api/review-cases/admin${params.toString()?`?${params}`:""}`);state.cases=Array.isArray(data?.cases)?data.cases:[];render();}catch(error){if(container)container.innerHTML=`<div class="aift-review-empty">${esc(error.message)}</div>`;}}
  function currentCase(id){return state.cases.find(item=>String(item._id)===String(id));}

  function workflowCopy(item){
    if(item.type==="investment_interest") return { approved:"Approve investor interest", matched:"Confirm both parties matched", negotiation:"Open negotiation stage", completed:"Complete investment case" };
    return { approved:"Approve request", matched:"Mark matched", negotiation:"Open negotiation", completed:"Complete case" };
  }
  function actionButtons(item){
    if(terminal.has(item.status))return '<div class="aift-review-muted">This review case is closed.</div>';
    const id=esc(item._id),copy=workflowCopy(item),button=(status,label,cls="")=>`<button type="button" class="${cls}" data-review-action="${status}" data-id="${id}">${label}</button>`;
    const actions={
      submitted:[button("under_review","Start review","primary"),button("rejected","Reject","danger")],
      under_review:[button("information_requested","Request information"),button("approved",copy.approved,"primary"),button("rejected","Reject","danger")],
      information_requested:[button("under_review","Resume review","primary"),button("rejected","Reject","danger")],
      approved:item.type==="investment_interest" ? [`<div class="aift-review-muted">AIFT approved the introduction. Waiting for the Venture owner to accept or decline before this case can become matched.</div>`] : [button("matched",copy.matched,"primary"),button("rejected","Reject","danger")],
      matched:[button("negotiation",copy.negotiation,"primary")],
      negotiation:[button("completed",copy.completed,"primary")]
    };
    return `<div class="aift-review-actions">${(actions[item.status]||[]).join("")}</div>`;
  }

  function openCase(id){
    const item=currentCase(id);if(!item)return;const history=Array.isArray(item.history)?item.history:[];const metadata=item.metadata&&typeof item.metadata==="object"?Object.entries(item.metadata).filter(([,v])=>v!==""&&v!==null&&v!==undefined):[];
    const html=`<div class="aift-review-detail-grid"><div class="aift-review-detail"><span>Case number</span><strong>${esc(item.caseNumber)}</strong></div><div class="aift-review-detail"><span>Type</span><strong>${esc(titleCase(item.type))}</strong></div><div class="aift-review-detail"><span>Requester</span><strong>${esc(displayName(item.requesterId))}</strong></div><div class="aift-review-detail"><span>Receiving party</span><strong>${esc(displayName(item.targetUserId))}</strong></div><div class="aift-review-detail"><span>Status</span><strong>${esc(titleCase(item.status))}</strong></div><div class="aift-review-detail"><span>Resource</span><strong>${esc(item.resourceType||"—")}</strong></div><div class="aift-review-detail"><span>Priority</span><strong>${esc(titleCase(item.priority||"normal"))}</strong></div><div class="aift-review-detail"><span>Submitted</span><strong>${esc(fmt(item.createdAt))}</strong></div></div><h4 style="margin:0 0 6px">${esc(item.title)}</h4><p style="color:#475569;line-height:1.6">${esc(item.summary||"No summary provided.")}</p>${metadata.length?`<div class="aift-review-detail" style="margin-top:12px"><span>Review metadata</span>${metadata.map(([k,v])=>`<div style="margin-top:6px"><strong>${esc(titleCase(k))}:</strong> ${esc(typeof v==="object"?JSON.stringify(v):v)}</div>`).join("")}</div>`:""}<div class="aift-review-warning">AIFT approval only authorizes this request to move to its next controlled stage. It does not release personal contact information. Investment interests must still be matched before negotiation can begin.</div><textarea class="aift-review-note" id="aiftReviewDecisionNote" placeholder="Review note / information request / decision reason"></textarea><div class="aift-review-history"><strong>Case history</strong>${history.length?history.slice().reverse().map(h=>`<div class="aift-review-history-item"><strong>${esc(titleCase(h.status))}</strong><span>${esc(h.note||"")} · ${esc(fmt(h.createdAt))}</span></div>`).join(""):'<div class="aift-review-empty">No history yet.</div>'}</div>`;
    if(typeof window.openAdminReviewModal==="function")window.openAdminReviewModal(item.caseNumber,item.title,html,actionButtons(item));else alert(`${item.caseNumber}\n${item.title}\n${item.status}`);
    setTimeout(()=>{document.getElementById("adminReviewActions")?.querySelectorAll("[data-review-action]").forEach(btn=>btn.addEventListener("click",()=>updateCase(btn.dataset.id,btn.dataset.reviewAction)));},0);
  }

  async function updateCase(id,status){
    const item=currentCase(id);if(!item)return;const note=String(document.getElementById("aiftReviewDecisionNote")?.value||"").trim();
    if(["information_requested","rejected"].includes(status)&&!note){if(typeof window.adminToast==="function")window.adminToast("Add a reason before requesting information or rejecting this case.");return;}
    const sensitive=["approved","rejected","completed"];
    const run=async()=>{try{const data=await api(`/api/review-cases/${encodeURIComponent(id)}/admin`,{method:"PATCH",body:JSON.stringify({status,note,decisionNotes:note})});if(typeof window.closeAdminReviewModal==="function")window.closeAdminReviewModal();const sync=data?.resourceSync;const message=sync?.synced?`Review updated and linked resource moved to ${titleCase(sync.resourceStatus||status)}.`:`Review case updated: ${titleCase(status)}.`;if(typeof window.adminToast==="function")window.adminToast(message);await load();}catch(error){if(typeof window.adminToast==="function")window.adminToast(error.message);else alert(error.message);}};
    if(sensitive.includes(status)&&typeof window.openAdminConfirm==="function"){window.openAdminConfirm(`${titleCase(status)} ${item.caseNumber}`,status==="approved"?(item.type==="investment_interest"?"Approve this investor interest for the next controlled AIFT stage? The venture owner may receive the approved interest, but personal contact information is not released.":"Approve this request for its next controlled AIFT stage? Personal contact information is not released."):`This will mark the AIFT review as ${titleCase(status)}. Continue?`,run);return;}await run();
  }

  async function refreshBadge(){try{const data=await api("/api/review-cases/admin");state.cases=Array.isArray(data?.cases)?data.cases:[];renderMetrics();}catch{}}
  function init(){if(String(localStorage.getItem("role")||"").toLowerCase()!=="admin"||!token())return;ensureStyle();ensureUI();setTimeout(refreshBadge,900);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
