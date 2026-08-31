const fs=require('fs'),path=require('path');const p=path.join(__dirname,'..','aift-review-center-admin.js');let s=fs.readFileSync(p,'utf8');
const old='      matched:[button("negotiation",copy.negotiation,"primary")],';
if(!s.includes(old))throw new Error('matched action anchor missing');
s=s.replace(old,'      matched:item.type==="investment_interest" ? [button("open_deal_room","Open AIFT Deal Room","primary")] : [button("negotiation",copy.negotiation,"primary")],');
const anchor='  async function updateCase(id,status){\n    const item=currentCase(id);if(!item)return;const note=String(document.getElementById("aiftReviewDecisionNote")?.value||"").trim();';
if(!s.includes(anchor))throw new Error('updateCase anchor missing');
const replacement='  async function updateCase(id,status){\n    const item=currentCase(id);if(!item)return;const note=String(document.getElementById("aiftReviewDecisionNote")?.value||"").trim();\n    if(status==="open_deal_room"){\n      try{\n        const data=await api(`/api/deal-rooms/from-review/${encodeURIComponent(id)}`,{method:"POST"});\n        if(typeof window.closeAdminReviewModal==="function")window.closeAdminReviewModal();\n        if(typeof window.adminToast==="function")window.adminToast("AIFT Deal Room opened. The case is now in negotiation.");\n        const roomId=data?.room?._id;\n        if(roomId) window.open(`deal-room.html?id=${encodeURIComponent(roomId)}`,"_blank","noopener");\n        await load();\n      }catch(error){if(typeof window.adminToast==="function")window.adminToast(error.message);else alert(error.message);}\n      return;\n    }';
s=s.replace(anchor,replacement);
fs.writeFileSync(p,s);console.log('Admin Deal Room action connected');
