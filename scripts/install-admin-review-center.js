const fs=require("fs");
const path=require("path");
const file=path.join(__dirname,"..","admin.html");
let source=fs.readFileSync(file,"utf8");
if(!source.includes('aift-review-center-admin.js')){
  if(!source.includes("</body>")) throw new Error("admin.html closing body not found");
  source=source.replace("</body>",'  <script src="aift-review-center-admin.js" defer></script>\n</body>');
  fs.writeFileSync(file,source);
  console.log("Admin Review Center installed");
}else{
  console.log("Admin Review Center already installed");
}
