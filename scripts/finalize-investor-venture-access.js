const fs=require('fs'),path=require('path');const root=path.join(__dirname,'..');
function write(file,fn){const p=path.join(root,file),a=fs.readFileSync(p,'utf8'),b=fn(a);if(a===b)throw new Error(file+' unchanged');fs.writeFileSync(p,b);}
write('venture.html',s=>{
  const needle='`/api/ventures/${\n              encodeURIComponent(\n                identifier\n              )\n            }`';
  const replacement='(new URLSearchParams(window.location.search).get("from") === "family-investor" ? `/api/ventures/investor/${encodeURIComponent(identifier)}` : `/api/ventures/${encodeURIComponent(identifier)}`)';
  const count=s.split(needle).length-1;
  if(count<1)throw new Error('venture detail endpoint anchor missing');
  return s.split(needle).join(replacement);
});
write('aift-review-center-admin.js',s=>{
  const old='      approved:[button("matched",copy.matched,"primary"),button("rejected","Reject","danger")],';
  if(!s.includes(old))throw new Error('approved action anchor missing');
  return s.replace(old,'      approved:item.type==="investment_interest" ? [`<div class="aift-review-muted">AIFT approved the introduction. Waiting for the Venture owner to accept or decline before this case can become matched.</div>`] : [button("matched",copy.matched,"primary"),button("rejected","Reject","danger")],');
});
console.log('Investor venture access and Review Center stage UX finalized');
