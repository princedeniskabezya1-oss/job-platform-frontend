const fs=require("fs");
const path=require("path");
const root=path.join(__dirname,"..");
for(const file of ["student.html","school.html","employer.html"]){
  const target=path.join(root,file);
  let source=fs.readFileSync(target,"utf8");
  if(source.includes('aift-student-identity-ui.js')) continue;
  const anchor="</body>";
  if(!source.includes(anchor)) throw new Error(`${file}: closing body tag not found`);
  source=source.replace(anchor,'  <script src="aift-student-identity-ui.js" defer></script>\n</body>');
  fs.writeFileSync(target,source);
  console.log(`Installed AIFT Student Identity UI in ${file}`);
}
