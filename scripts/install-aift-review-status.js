const fs=require("fs");
const path=require("path");
const root=path.join(__dirname,"..");
const files=["student.html","family.html","school.html","employer.html","venture.html","create-venture.html"];
for(const file of files){
  const target=path.join(root,file);
  if(!fs.existsSync(target)){console.log(`skip missing ${file}`);continue;}
  let source=fs.readFileSync(target,"utf8");
  if(source.includes('aift-review-status.js')){console.log(`already installed ${file}`);continue;}
  if(!source.includes("</body>"))throw new Error(`${file}: closing body not found`);
  source=source.replace("</body>",'  <script src="aift-review-status.js" defer></script>\n</body>');
  fs.writeFileSync(target,source);
  console.log(`installed ${file}`);
}
