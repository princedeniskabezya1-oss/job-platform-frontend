const fs=require('fs');
const path=require('path');
function patch(file, changes){const p=path.join(__dirname,'..',file);let s=fs.readFileSync(p,'utf8');for(const c of changes){if(s.includes(c.replace))continue;if(!s.includes(c.find))throw new Error(`${c.label} anchor missing`);s=s.replace(c.find,c.replace);}fs.writeFileSync(p,s);}
patch('family.html',[{
label:'family link modal',
find:`<header class="family-modal-head"><div><h2>Link AIFT Student</h2><p>Enter the Student account ID to connect this child to an existing AIFT Student record.</p></div><button class="family-modal-close" type="button" data-close-modal="familyLinkModal">×</button></header>\n      <div class="family-modal-body">\n        <form id="familyLinkForm"><input type="hidden" id="familyLinkChildId"><label class="family-label" for="familyLinkStudentId">AIFT Student ID</label><input class="family-input" id="familyLinkStudentId" required><div class="family-help">Linking is verified by the backend and only valid Student accounts can be connected.</div><div class="family-form-actions"><button class="family-button" type="button" data-close-modal="familyLinkModal">Cancel</button><button class="family-button primary" type="submit">Link Student</button></div></form>\n      </div>`,
replace:`<header class="family-modal-head"><div><h2>Connect Verified AIFT Student</h2><p>Enter the permanent AIFT Student ID issued after school verification. The student must approve your request.</p></div><button class="family-modal-close" type="button" data-close-modal="familyLinkModal">×</button></header>\n      <div class="family-modal-body">\n        <form id="familyLinkForm">\n          <input type="hidden" id="familyLinkChildId">\n          <div class="family-field full"><label class="family-label" for="familyLinkStudentId">AIFT Student ID</label><input class="family-input" id="familyLinkStudentId" required maxlength="19" autocomplete="off" placeholder="AIFT-STU-XXXXXXXXXX"><div class="family-help">Only active school-verified AIFT Student IDs can receive a connection request. Knowing an ID never grants Family access by itself.</div></div>\n          <div class="family-field full" style="margin-top:14px"><label class="family-label" for="familyLinkRelationship">Relationship</label><select class="family-select" id="familyLinkRelationship" required><option value="">Select relationship</option><option value="parent">Parent</option><option value="guardian">Guardian</option><option value="sibling">Sibling</option><option value="family_member">Family member</option><option value="other">Other</option></select><div class="family-help">The student sees this relationship when deciding whether to accept or decline.</div></div>\n          <div class="family-form-actions"><button class="family-button" type="button" data-close-modal="familyLinkModal">Cancel</button><button class="family-button primary" type="submit">Send Approval Request</button></div>\n        </form>\n      </div>`
}]);
patch('family-production.js',[{
label:'state family links',
find:'    notifications:[]\n  };',
replace:'    notifications:[],\n    familyStudentLinks:[]\n  };'
},{
label:'render child pending',
find:'      const linked = child.linkStatus === "linked" && child.linkedStudentId;\n      return `<article class="family-child-card" data-child-id="${escapeHtml(child._id)}">',
replace:'      const linked = child.linkStatus === "linked" && child.linkedStudentId;\n      const pending = child.linkStatus === "pending";\n      const pendingRequest = state.familyStudentLinks.find(request => String(request.familyChildId?._id || request.familyChildId) === String(child._id) && request.status === "pending");\n      return `<article class="family-child-card" data-child-id="${escapeHtml(child._id)}">'
},{
label:'child link copy',
find:'<p>${linked ? `Linked to ${escapeHtml(child.linkedStudentId.name || child.linkedStudentId.email || "AIFT Student")}` : "Not linked to an AIFT Student account"}</p><div class="family-row-actions" style="margin-top:10px"><button class="family-small-button" type="button" data-edit-child="${escapeHtml(child._id)}">Edit</button>${linked ? `<button class="family-small-button" type="button" data-unlink-child="${escapeHtml(child._id)}">Unlink Student</button>` : `<button class="family-small-button primary" type="button" data-link-child="${escapeHtml(child._id)}">Link Student</button>`}',
replace:'<p>${linked ? `Connected to verified AIFT Student: ${escapeHtml(child.linkedStudentId.name || "Student")}` : pending ? "Student approval request pending" : "Not connected to a verified AIFT Student"}</p><div class="family-row-actions" style="margin-top:10px"><button class="family-small-button" type="button" data-edit-child="${escapeHtml(child._id)}">Edit</button>${linked ? `<button class="family-small-button" type="button" data-unlink-child="${escapeHtml(child._id)}">Unlink Student</button>` : pending && pendingRequest ? `<button class="family-small-button" type="button" data-cancel-family-link="${escapeHtml(pendingRequest._id)}">Cancel Request</button>` : `<button class="family-small-button primary" type="button" data-link-child="${escapeHtml(child._id)}">Connect by AIFT ID</button>`}'
},{
label:'load children links',
find:'  async function loadChildren(force = false){\n    if(state.children.length && !force) return state.children;\n    try{\n      const data = await api("/api/family/children");',
replace:'  async function loadChildren(force = false){\n    if(state.children.length && !force) return state.children;\n    try{\n      try{ const linksData = await api("/api/family-student-links/family"); state.familyStudentLinks = Array.isArray(linksData?.requests) ? linksData.requests : []; }catch(linkError){ state.familyStudentLinks = []; }\n      const data = await api("/api/family/children");'
},{
label:'link child function',
find:'    const studentId = $("#familyLinkStudentId").value.trim();\n    try{\n      await api(`/api/family/children/${encodeURIComponent(childId)}/link-student`,{\n        method:"PATCH",\n        body:{ studentId }\n      });',
replace:'    const aiftStudentId = $("#familyLinkStudentId").value.trim().toUpperCase();\n    const relationshipType = $("#familyLinkRelationship").value;\n    try{\n      await api(`/api/family-student-links/request`,{\n        method:"POST",\n        body:{ familyChildId:childId, aiftStudentId, relationshipType }\n      });'
},{
label:'link success',
find:'      toast("AIFT Student account linked.","success");',
replace:'      toast("Approval request sent to the verified AIFT Student.","success");'
},{
label:'cancel handler insert',
find:'  async function unlinkChild(id){',
replace:'  async function cancelFamilyLinkRequest(id){\n    if(!window.confirm("Cancel this pending Student connection request?")) return;\n    try{ await api(`/api/family-student-links/${encodeURIComponent(id)}/cancel`,{method:"PATCH"}); state.children=[]; state.familyStudentLinks=[]; await loadChildren(true); toast("Connection request cancelled.","success"); }catch(error){ toast(error.message,"error"); }\n  }\n\n  async function unlinkChild(id){'
},{
label:'cancel click handler',
find:'      const unlink = event.target.closest("[data-unlink-child]");',
replace:'      const cancelFamilyLink = event.target.closest("[data-cancel-family-link]");\n      if(cancelFamilyLink){ await cancelFamilyLinkRequest(cancelFamilyLink.dataset.cancelFamilyLink); return; }\n\n      const unlink = event.target.closest("[data-unlink-child]");'
}]);
console.log('Family verified Student ID UI installed');