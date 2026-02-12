const fs=require("fs");
const path=require("path");
const bp="apps/web/src/app/api/study-planner";
const files=["calendar/sync-sessions/route.ts","calendar/insert-events/route.ts","calendar/events/route.ts","calendar/cleanup/route.ts","calendar/connect/route.ts","plan/route.ts","pending-lessons/route.ts","dashboard/chat/route.ts","sessions/update/route.ts","sessions/route.ts","save-plan/route.ts","course-progress/route.ts","user-context/route.ts","status/route.ts","events/route.ts","validate-session-times/route.ts"];
let tc=0;const rp=[];
function se(s){let c=s;
c=c.replace(/[Ã][ -¿][Â-Å][-¿][Â-Å][-¿]/g,"");
c=c.replace(/Ã¯Â¸[Â][-]/g,"");
try{c=c.replace(/[🌀-🿿]/gu,"");c=c.replace(/[☀-➿]/gu,"");c=c.replace(/[︀-️]/gu,"");c=c.replace(/‍/gu,"");}catch(e){}
c=c.replace(/[Â][-]/g,"");
c=c.replace(/ +/g," ");return c;}

for(const f of files){
const fp=path.join(bp,f);
if(!fs.existsSync(fp)){rp.push("SKIP:"+f);continue;}
const ct=fs.readFileSync(fp,"utf8");
const ls=ct.split(String.fromCharCode(10));
const nl=[];let fc=0;const dt=[];
for(let i=0;i<ls.length;i++){
let l=ls[i];
if(/^s*//s*console.(log|warn|error|info)s*(/.test(l)){fc++;dt.push("  Del commented L"+(i+1));continue;}
const isCL=/console.logs*(/.test(l)&&!/console.error/.test(l)&&!/console.warn/.test(l);
if(isCL){let pc=0,fo=false;for(let ci=0;ci<l.length;ci++){if(l[ci]==="("){pc++;fo=true;}if(l[ci]===")")pc--;}let el=i;while(fo&&pc>0&&el+1<ls.length){el++;for(let ci=0;ci<ls[el].length;ci++){if(ls[el][ci]==="(")pc++;if(ls[el][ci]===")")pc--;}}fc++;dt.push("  Del log L"+(i+1)+(el>i?"-"+(el+1):""));i=el;continue;}
if(/console.(error|warn|info)s*(/.test(l)){const cl=se(l);if(cl!==l){fc++;const mm=l.match(/console.(error|warn|info)/);dt.push("  Strip "+(mm?mm[1]:"?")+" L"+(i+1));l=cl;}}
nl.push(l);}
if(fc>0){fs.writeFileSync(fp,nl.join(String.fromCharCode(10)),"utf8");rp.push("CHANGED:"+f+" "+fc);dt.forEach(d=>rp.push(d));tc+=fc;}else{rp.push("NO CHANGES:"+f);}}
rp.push("");rp.push("Total:"+tc);console.log(rp.join(String.fromCharCode(10)));