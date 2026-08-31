const fs=require('fs'),path=require('path');const root=path.join(__dirname,'..');
const files=['student.html','school.html','employer.html'];
for(const f of files){const p=path.join(root,f);let s=fs.readFileSync(p,'utf8');if(s.includes('src="aift-student-identity-ui.js"')){console.log('already',f);continue;}const anchor='</body>';if(!s.includes(anchor))throw new Error(`${f}: body close missing`);s=s.replace(anchor,'<script src="aift-student-identity-ui.js"></script>\n'+anchor);fs.writeFileSync(p,s);console.log('patched',f);}
