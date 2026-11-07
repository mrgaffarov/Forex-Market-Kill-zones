"use strict";
if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{})}
const NY="America/New_York",$=id=>document.getElementById(id),pad=n=>String(n).padStart(2,"0");
const ld=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const IC=n=>'<svg class="ic"><use href="#i-'+n+'"/></svg>';
function toast(m){const t=$("toast");t.textContent=m;t.classList.remove("hide");clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.add("hide"),1800)}

/* ---- ma'lumotlar ---- */
const DEF=[{id:"as",n:"Asian kill zone",s:1200,e:1440,c:"--asia"},{id:"lo",n:"London kill zone",s:120,e:300,c:"--lon"},{id:"am",n:"New York AM kill zone",s:420,e:600,c:"--nyam"},{id:"pm",n:"New York PM kill zone",s:810,e:960,c:"--nypm"}];
let KZ=ld("kz",null);if(!KZ||KZ.length!==4)KZ=JSON.parse(JSON.stringify(DEF));
const SS=[{n:"Sydney",tz:"Australia/Sydney",s:420,e:960,c:"--asia"},{n:"Tokio",tz:"Asia/Tokyo",s:540,e:1080,c:"--lon"},{n:"London",tz:"Europe/London",s:480,e:1020,c:"--lon"},{n:"New York",tz:NY,s:480,e:1020,c:"--nyam"}];
const SSD=SS.map(x=>[x.s,x.e]);ld("ss",[]).forEach((v,i)=>{if(SS[i]&&v){SS[i].s=v[0];SS[i].e=v[1]}});
let trades=ld("tr",[]),snd=ld("snd",false),pre=ld("pre",0),th=ld("th","auto"),mine=ld("nw",[]).filter(n=>n.ts);
let side="Buy",prev={},pp={},fl={},ctx=null;

/* ---- vaqt yordamchilari ---- */
const hm=m=>{m=((Math.floor(m+1e-6)%1440)+1440)%1440;return pad(Math.floor(m/60))+":"+pad(m%60)};
const dur=m=>{m=Math.max(0,Math.ceil(m));const d=Math.floor(m/1440),h=Math.floor(m%1440/60);return(d?d+" kun ":"")+(h?h+" soat ":"")+pad(m%60)+" daq"};
const fx=z=>/^UTC[+-]/.test(z)?parseFloat(z.slice(3)):null;
const wall=(ms,z)=>{const o=fx(z);if(o!==null)return ms+o*36e5;const f=new Intl.DateTimeFormat("en-GB",{timeZone:z,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date(ms));const g=t=>+f.find(p=>p.type===t).value;return Date.UTC(g("year"),g("month")-1,g("day"),g("hour"),g("minute"),g("second"))};
const mins=(d,z)=>((wall(+d,z)/6e4)%1440+1440)%1440;
const nyInfo=d=>{const w=new Date(wall(+d,NY));return{dow:w.getUTCDay(),date:w.toISOString().slice(0,10)}};
const ee=k=>k.e<=k.s?k.e+1440:k.e;
const act=(k,m)=>(m>=k.s&&m<ee(k))||(ee(k)>1440&&m+1440<ee(k));
const left=(k,m)=>ee(k)-(m>=k.s?m:m+1440);
const wait=(k,m)=>((k.s-m)%1440+1440)%1440;
function mkt(dow,m){const w=dow*1440+m;return{open:!(w>=5*1440+1020||w<1020),toOpen:w<1020?1020-w:7*1440-w+1020}}
const fmt=ts=>{const w=new Date(wall(ts,tz));return pad(w.getUTCHours())+":"+pad(w.getUTCMinutes())};

/* ---- vaqt zonasi (UTC) ---- */
const ZN=[["Asia/Tashkent","Toshkent"],[NY,"New York"],["Europe/London","London"],["Asia/Tokyo","Tokio"],["Australia/Sydney","Sydney"]];
let cu=ld("cu",5),tz=ld("tz","Asia/Tashkent");
if(fx(tz)===null&&!ZN.some(z=>z[0]===tz))tz="Asia/Tashkent";
const sg=o=>(o>=0?"+":"−")+Math.abs(Math.round(o*2)/2);
const uo=z=>"UTC"+sg((wall(Date.now(),z)-Date.now())/36e5);
const cz=()=>"UTC"+(cu>=0?"+":"-")+Math.abs(cu);
const tzName=()=>{const f=ZN.find(z=>z[0]===tz);return f?f[1]:"Boshqa"};
const cuHTML=()=>'<div class="cm"><button class="sq stp" data-d="-1" aria-label="Kamaytirish">−</button><input class="ci" type="number" step="0.5" min="-12" max="14" inputmode="decimal" value="'+cu+'"><button class="sq stp" data-d="1" aria-label="Oshirish">+</button><button class="pri cok">'+IC("check")+'Tasdiqlash</button></div>';
function refreshTz(){$("tzl").textContent=(fx(tz)!==null?"":tzName()+" · ")+uo(tz);$("curz").textContent="Hozirgi: "+(fx(tz)!==null?"qo‘lda ":tzName()+" · ")+uo(tz);$("setcu").innerHTML=cuHTML();$("shcu").innerHTML=cuHTML()}
function renderSheet(){$("slist").innerHTML=ZN.map(([v,l])=>'<button class="zr'+(tz===v?" sel":"")+'" data-z="'+v+'"><span><b>'+l+'</b><small>'+uo(v)+'</small></span><span class="zt">'+hm(mins(new Date(),v))+'</span>'+(tz===v?IC("check"):"")+'</button>').join("")}
const sheetOpen=()=>!$("sheet").classList.contains("hide");
$("tzb").onclick=()=>{renderSheet();$("sheet").classList.remove("hide")};
$("sbd").onclick=()=>$("sheet").classList.add("hide");
document.addEventListener("click",e=>{
 const z=e.target.closest(".zr");if(z){tz=z.dataset.z;sv("tz",tz);$("sheet").classList.add("hide");refreshTz();buildTL();tick();toast("Vaqt zonasi: "+tzName()+" · "+uo(tz));return}
 const b=e.target.closest(".stp,.cok");if(!b)return;const i=b.closest(".cm").querySelector(".ci"),cl=v=>Math.max(-12,Math.min(14,v));
 if(b.classList.contains("stp")){i.value=cl((+i.value||0)+ +b.dataset.d);return}
 cu=Math.round(cl(+i.value||0)*2)/2;sv("cu",cu);tz=cz();sv("tz",tz);$("sheet").classList.add("hide");refreshTz();tick();toast("Qo‘llandi: "+uo(tz))});

/* ---- bo'limlar ---- */
document.querySelectorAll("#nav button").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("#nav button").forEach(x=>x.classList.toggle("a",x===b));
 ["home","jr","tools","set"].forEach(id=>$(id).classList.toggle("hide",id!==b.dataset.t));
 if(b.dataset.t==="jr")renderJr();if(b.dataset.t==="tools")renderCal();window.scrollTo(0,0)});
document.querySelectorAll("#sub3 button").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("#sub3 button").forEach(x=>x.classList.toggle("on",x===b));
 ["cal","risk","bk"].forEach(p=>$("p-"+p).classList.toggle("hide",p!==b.dataset.p))});

/* ---- vaqt chizig'i ---- */
let nowEls=[];
const segs=(s,e)=>e>1440?[[s,1440],[0,e-1440]]:[[s,e]];
function buildTL(){const tl=$("tl");tl.innerHTML="";nowEls=[];const d=new Date(),ny=mins(d,NY);
 const add=(label,list,c)=>{const r=document.createElement("div");r.className="row";r.innerHTML="<b>"+label+"</b><div class=bar></div>";const bar=r.lastChild;
  list.forEach(([s,e])=>{const x=document.createElement("div");x.className="seg";x.style.left=s/14.4+"%";x.style.width=(e-s)/14.4+"%";x.style.background="var("+c+")";bar.appendChild(x)});
  const n=document.createElement("div");n.className="now";bar.appendChild(n);nowEls.push(n);tl.appendChild(r);return bar};
 SS.forEach(x=>{const sh=Math.round(ny-mins(d,x.tz)+1440)%1440,s=(x.s+sh)%1440;add(x.n,segs(s,s+x.e-x.s),x.c)});
 KZ.forEach(k=>add(k.n.replace(" kill zone","").replace("New York","NY"),segs(k.s,ee(k)),k.c));
 add("ICT",[],"--mute").insertAdjacentHTML("afterbegin",[[0,"MO"],[120,"LO"],[420,"NY"]].map(([m,l])=>'<div style="position:absolute;top:-2px;bottom:-2px;width:2px;background:var(--nypm);left:'+m/14.4+'%"></div><span style="position:absolute;left:calc('+m/14.4+'% + 4px);top:0;font-size:.62rem;font-weight:700">'+l+'</span>').join(""))}

/* ---- ovoz ---- */
function beep(){try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();[0,.35].forEach(t=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=880;o.connect(g);g.connect(ctx.destination);g.gain.setValueAtTime(.25,ctx.currentTime+t);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+t+.3);o.start(ctx.currentTime+t);o.stop(ctx.currentTime+t+.3)})}catch(e){}try{navigator.vibrate&&navigator.vibrate([300,150,300])}catch(e){}}
$("snd").checked=snd;$("snd").onchange=e=>{snd=e.target.checked;sv("snd",snd);if(snd)beep()};
$("pre").value=pre;$("pre").onchange=e=>{pre=+e.target.value;sv("pre",pre)};

/* ---- iqtisodiy taqvim ---- */
const evList=()=>CAL.map(e=>({...e,ts:Date.parse(e.ts)})).concat(mine.map(n=>({ts:n.ts,t:n.t,own:1}))).sort((a,b)=>a.ts-b.ts);
const num=v=>parseFloat(String(v).replace(/[^0-9.\-]/g,""));
function evCard(e,now,home){const df=(e.ts-now)/6e4,hot=df>-15&&df<=60,a=e.a||"",f=e.f||"",p=e.p||"",na=num(a),nf=num(f);
 const ar=a&&!isNaN(na)&&!isNaN(nf)&&na!==nf?(na>nf?'<span class="up">▲</span>':'<span class="dn">▼</span>'):"";
 const when=df>0?dur(df)+" qoldi":df>-15?"hozir chiqdi":"";
 return '<div class="ev'+(home&&hot?" hotc":"")+'"><div class="evh">'+(home?'<span class="bd'+(hot?" hot":"")+'"></span>':"")+'<b>'+esc(e.t)+'</b><span class="chip">'+(e.own?"Mening":"USD")+'</span>'+(e.own&&!home?'<button class="x" data-ts="'+e.ts+'" aria-label="O‘chirish">'+IC("x")+'</button>':"")+'</div>'
 +'<div class="evm">'+IC("clock").replace('class="ic"','class="ic s"')+fmt(e.ts)+(home&&when?" · "+when:"")+'<span class="imp"><i></i><i></i><i></i></span></div>'
 +(e.own?"":'<div class="ev3"><div><small>Haqiqiy</small><b>'+(esc(a)||"—")+ar+'</b></div><div><small>Prognoz</small><b>'+(esc(f)||"—")+'</b></div><div><small>Oldingi</small><b>'+(esc(p)||"—")+'</b></div></div>')+'</div>'}
function homeNews(){const now=Date.now(),L=evList().filter(e=>e.ts>now-9e5).slice(0,3);
 $("hn").innerHTML=L.length?L.map(e=>evCard(e,now,true)).join(""):'<div class="mute">Yaqin yuqori ta’sirli yangilik yo‘q</div>';
 if(snd)L.forEach(e=>{const df=(e.ts-now)/6e4;if(df>0&&df<=60&&!fl[e.ts+"a"]){fl[e.ts+"a"]=1;beep()}if(df>0&&df<=5&&!fl[e.ts+"b"]){fl[e.ts+"b"]=1;beep()}})}
function renderCal(){const now=Date.now(),L=evList().filter(e=>e.ts>now-10*864e5),days={};
 L.forEach(e=>{const d=new Date(wall(e.ts,tz)).toISOString().slice(0,10);(days[d]=days[d]||[]).push(e)});
 const DN=["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"],MN=["yan","fev","mar","apr","may","iyn","iyl","avg","sen","okt","noy","dek"];
 $("cal").innerHTML=Object.keys(days).sort().reverse().map(k=>{const dt=new Date(k+"T12:00:00Z");return'<div class="dh">'+DN[dt.getUTCDay()]+", "+dt.getUTCDate()+"-"+MN[dt.getUTCMonth()]+"</div>"+days[k].map(e=>evCard(e,now,false)).join("")}).join("")||'<div class="mute">Ma’lumot yo‘q</div>';
 $("calu").textContent="Faqat USD · yuqori ta’sir · vaqt "+(fx(tz)!==null?"":tzName()+" ")+uo(tz)+" · ma’lumot yangilangan: "+CAL_UPD}
$("cal").onclick=e=>{const b=e.target.closest(".x");if(b){mine=mine.filter(n=>String(n.ts)!==b.dataset.ts);sv("nw",mine);renderCal();homeNews()}};
const toUTC=(d,t,z)=>{const[y,m,dd]=d.split("-").map(Number),[h,mi]=t.split(":").map(Number),g=Date.UTC(y,m-1,dd,h,mi);let u=g-(wall(g,z)-g);u=g-(wall(u,z)-u);return u};
$("nadd").onclick=()=>{if(!$("nd").value||!$("ntm").value||!$("nt").value.trim()){toast("Sana, vaqt va nomni kiriting");return}
 mine.push({ts:toUTC($("nd").value,$("ntm").value,tz),t:$("nt").value.trim()});sv("nw",mine);$("nt").value="";renderCal();homeNews();toast("Qo‘shildi")};
$("nd").value=new Date(wall(Date.now(),tz)).toISOString().slice(0,10);

/* ---- asosiy tick ---- */
function tick(){
 const d=new Date(),loc=mins(d,tz),ny=mins(d,NY),inf=nyInfo(d),M=mkt(inf.dow,ny),diff=Math.round(loc-ny);
 $("clock").textContent=hm(loc)+":"+pad(Math.floor((loc%1)*60+1e-6));
 $("sub").textContent="New York "+hm(ny)+":"+pad(Math.floor((ny%1)*60+1e-6))+" · "+uo(NY);
 nowEls.forEach(n=>n.style.left=ny/14.4+"%");
 const a=M.open?KZ.find(k=>act(k,ny)):null,b=$("ban");
 if(!M.open){b.style.background="var(--mute)";b.innerHTML="<b>Bozor yopiq (dam olish kuni)</b><span>Ochilishiga "+dur(M.toOpen)+"</span>"}
 else if(a){b.style.background="var("+a.c+")";b.innerHTML="<b>HOZIR: "+a.n+"</b><span>Tugashiga "+dur(left(a,ny))+"</span>"}
 else{const nx=KZ.slice().sort((x,y)=>wait(x,ny)-wait(y,ny))[0];b.style.background="var(--mute)";b.innerHTML="<b>Kill zone emas</b><span>Keyingisi: "+nx.n+", "+dur(wait(nx,ny))+" dan keyin</span>"}
 KZ.forEach(k=>{const on=M.open&&act(k,ny),w=wait(k,ny),pr=pre>0&&M.open&&!on&&w>0&&w<=pre;if(on&&prev[k.id]===false&&snd)beep();if(pr&&!pp[k.id]&&snd)beep();prev[k.id]=on;pp[k.id]=pr});
 $("curkz").textContent="Kill zone: "+(a?a.n:(M.open?"emas (tashqarida)":"bozor yopiq"));
 $("kz").innerHTML=KZ.map(k=>{const on=M.open&&act(k,ny);
  const st=!M.open?'<div class="st">Yopiq<small>dam olish</small></div>':on?'<div class="st on">Faol<span class="pill2">LIVE</span><small>tugashiga '+dur(left(k,ny))+'</small></div>':'<div class="st">Boshlanishiga<small>'+dur(wait(k,ny))+'</small></div>';
  return'<div class="kz"><i class="dot" style="background:var('+k.c+')"></i><div class="i"><div class="n">'+k.n+'</div><div class="t">'+hm(k.s+diff)+" – "+hm(k.e+diff)+" · NY "+hm(k.s)+" – "+hm(k.e)+"</div></div>"+st+"</div>"}).join("");
 $("ss").innerHTML=SS.map(x=>{const m=mins(d,x.tz),open=M.open&&m>=x.s&&m<x.e,l=open?x.e-m:((x.s-m)%1440+1440)%1440,sh=Math.round(ny-m+1440)%1440,s=(x.s+sh+diff+1440)%1440;
  return'<div class="kz"><i class="dot" style="background:var('+x.c+')"></i><div class="i"><div class="n">'+x.n+'</div><div class="t">'+hm(s)+" – "+hm(s+x.e-x.s)+'</div></div><div class="st'+(open?" on":"")+'">'+(open?"Ochiq":"Yopiq")+'<small>'+(open?"yopilishiga ":"ochilishiga ")+dur(l)+"</small></div></div>"}).join("");
 homeNews();if(sheetOpen())renderSheet()}

/* ---- sozlamalar: vaqtlarni tahrirlash ---- */
function edit(el,arr,l1,l2,cb){el.innerHTML=arr.map((x,i)=>'<div class="er"><i class="dot" style="background:var('+x.c+')"></i><div class="ec"><b>'+x.n+'</b><div class="g2"><label>'+l1+'<input type="time" data-i="'+i+'" data-f="s" value="'+hm(x.s)+'"></label><label>'+l2+'<input type="time" data-i="'+i+'" data-f="e" value="'+hm(x.e)+'"></label></div></div></div>').join("");
 el.querySelectorAll("input").forEach(inp=>inp.onchange=()=>{if(!inp.value)return;const[h,m]=inp.value.split(":").map(Number),x=arr[+inp.dataset.i],o=x[inp.dataset.f];x[inp.dataset.f]=h*60+m;if(arr===SS&&x.e<=x.s){x[inp.dataset.f]=o;edit(el,arr,l1,l2,cb);toast("Yopilish ochilishdan keyin bo‘lsin");return}cb();toast("Saqlandi")})}
const eKZ=()=>edit($("edit"),KZ,"Boshlanish","Tugash",()=>{sv("kz",KZ);buildTL();tick()});
const eSS=()=>edit($("sedit"),SS,"Ochilish","Yopilish",()=>{sv("ss",SS.map(y=>[y.s,y.e]));buildTL();tick()});
$("reset").onclick=()=>{KZ=JSON.parse(JSON.stringify(DEF));sv("kz",KZ);eKZ();buildTL();tick()};
$("sreset").onclick=()=>{SSD.forEach((v,i)=>{SS[i].s=v[0];SS[i].e=v[1]});sv("ss",SSD);eSS();buildTL();tick()};
function applyTh(){th==="auto"?document.documentElement.removeAttribute("data-theme"):document.documentElement.setAttribute("data-theme",th);document.querySelectorAll("#th button").forEach(b=>b.classList.toggle("on",b.dataset.v===th))}
document.querySelectorAll("#th button").forEach(b=>b.onclick=()=>{th=b.dataset.v;sv("th",th);applyTh()});

/* ---- jurnal ---- */
const grp=f=>{const o={};trades.forEach(t=>f(t).forEach(k=>{const x=o[k]=o[k]||{n:0,w:0,r:0};x.n++;if(t.r>0)x.w++;x.r+=t.r}));return o};
const f1=n=>(n>0?"+":"")+n.toFixed(1);
const tb=(o,h)=>Object.keys(o).length?'<table><tr><th>'+h+'</th><th>Savdo</th><th>Yutuq</th><th>R</th></tr>'+Object.keys(o).sort().map(k=>'<tr><td>'+esc(k)+'</td><td>'+o[k].n+'</td><td>'+Math.round(o[k].w/o[k].n*100)+'%</td><td class="'+(o[k].r>=0?"pos":"neg")+'">'+f1(o[k].r)+"</td></tr>").join("")+"</table>":'<div class="mute">Ma’lumot yo‘q</div>';
function donut(w,l,b,n){const C=2*Math.PI*40;let off=0,h='<svg viewBox="0 0 100 100" class="donut"><circle cx="50" cy="50" r="40" fill="none" stroke="var(--line)" stroke-width="12"/>';
 if(n)[[w,"var(--on)"],[l,"var(--bad)"],[b,"var(--mute)"]].forEach(([v,c])=>{if(!v)return;const len=v/n*C;h+='<circle cx="50" cy="50" r="40" fill="none" stroke="'+c+'" stroke-width="12" stroke-dasharray="'+len+" "+(C-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 50 50)"/>';off+=len});
 return h+'<text x="50" y="50" text-anchor="middle" class="dv">'+(n?Math.round(w/n*100)+"%":"—")+'</text><text x="50" y="63" text-anchor="middle" class="dl">Win rate</text></svg>'}
function renderJr(){const T=trades,n=T.length,w=T.filter(t=>t.r>0).length,l=T.filter(t=>t.r<0).length,b=n-w-l,sum=T.reduce((a,t)=>a+t.r,0);
 const gw=T.filter(t=>t.r>0).reduce((a,t)=>a+t.r,0),gl=-T.filter(t=>t.r<0).reduce((a,t)=>a+t.r,0);
 $("dn").innerHTML=donut(w,l,b,n);
 $("leg").innerHTML='<div class="lg"><i style="background:var(--on)"></i>Yutuq<b>'+w+'</b></div><div class="lg"><i style="background:var(--bad)"></i>Yutqizish<b>'+l+'</b></div><div class="lg"><i style="background:var(--mute)"></i>Durang<b>'+b+"</b></div>";
 $("kpi").innerHTML='<div><b>'+n+'</b>Savdolar</div><div><b class="'+(sum>=0?"pos":"neg")+'">'+f1(sum)+'R</b>Jami</div><div><b>'+(n?f1(sum/n)+"R":"—")+'</b>O‘rtacha</div>';
 let c=0;const pts=T.slice().reverse().map(t=>c+=t.r);let svg='<div class="mute">Kamida 2 ta savdo kerak</div>';
 if(pts.length>1){const mn=Math.min(0,...pts),mx=Math.max(0,...pts),rg=(mx-mn)||1,p=pts.map((v,i)=>(i/(pts.length-1)*300).toFixed(1)+","+(90-(v-mn)/rg*90).toFixed(1)).join(" "),z=(90+mn/rg*90).toFixed(1);
  svg='<svg viewBox="0 0 300 90" width="100%" height="90" preserveAspectRatio="none"><line x1="0" x2="300" y1="'+z+'" y2="'+z+'" stroke="var(--line)"/><polyline fill="none" stroke="var(--nyam)" stroke-width="2" points="'+p+'"/></svg>'}
 const DN=["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"],ac=(t,body)=>'<details class="card"><summary>'+t+"</summary><div style=\"margin-top:10px\">"+body+"</div></details>";
 $("jan").innerHTML=ac("Equity (jami R)",svg)+ac("Kill zone bo‘yicha",tb(grp(t=>[t.kz]),"Kill zone"))+ac("Hafta kuni",tb(grp(t=>[DN[new Date(t.d.slice(0,10)+"T12:00:00Z").getUTCDay()]]),"Kun"))+ac("Soat (NY)",tb(grp(t=>[t.d.slice(11,13)+":00"]),"Soat"))+ac("Teglar",tb(grp(t=>t.tg||[]),"Teg"))+ac("Profit factor",'<b style="font-size:1.2rem">'+(gl?(gw/gl).toFixed(2):"—")+"</b>");
 $("list").innerHTML=n?T.slice(0,30).map((t,i)=>'<div class="tr '+(t.r>0?"w":t.r<0?"l":"")+'"><div><b>'+esc(t.p)+"</b> "+esc(t.s)+" · "+esc(t.kz)+"<small>"+esc(t.d)+(t.nt?" · "+esc(t.nt):"")+(t.tg&&t.tg.length?" · #"+esc(t.tg.join(" #")):"")+'</small></div><div><b class="'+(t.r>=0?"pos":"neg")+'">'+f1(t.r)+'R</b><button class="x" data-i="'+i+'" aria-label="O‘chirish">'+IC("x")+"</button></div></div>").join(""):'<div class="mute">Hali savdo yo‘q.</div>'}
$("list").onclick=e=>{const b=e.target.closest(".x");if(b){trades.splice(+b.dataset.i,1);sv("tr",trades);renderJr()}};
$("jnew").onclick=()=>$("jform").classList.toggle("hide");
$("side").onclick=e=>{const b=e.target.closest("button");if(!b)return;side=b.dataset.v;document.querySelectorAll("#side button").forEach(x=>x.classList.toggle("on",x===b))};
$("add").onclick=()=>{const r=parseFloat($("res").value);if(isNaN(r)){$("res").focus();toast("Natijani (R) kiriting");return}
 const d=new Date(),i=nyInfo(d),M=mkt(i.dow,mins(d,NY)),k=M.open?KZ.find(x=>act(x,mins(d,NY))):null;
 trades.unshift({p:$("pair").value.trim().toUpperCase()||"—",s:side,r:r,kz:k?k.n:"Kill zone tashqarida",nt:$("note").value.trim(),tg:$("tags").value.split(",").map(s=>s.trim().toLowerCase()).filter(Boolean),d:i.date+" "+hm(mins(d,NY))+" NY"});
 sv("tr",trades);$("res").value="";$("note").value="";$("tags").value="";$("jform").classList.add("hide");renderJr();toast("Saqlandi")};

/* ---- risk va zaxira ---- */
function calc(){const b=+$("bal").value,r=+$("rk").value,s=+$("sl").value,p=+$("pv").value;
 $("lot").innerHTML=(b&&r&&s&&p)?'Risk: <b>$'+(b*r/100).toFixed(2)+'</b> · Lot: <b>'+(b*r/100/(s*p)).toFixed(2)+"</b>":"Maydonlarni to‘ldiring";sv("calc",[b,r,s,p])}
{const c=ld("calc",[1000,1,10,10]);["bal","rk","sl","pv"].forEach((id,i)=>{$(id).value=c[i]||"";$(id).oninput=calc});calc()}
$("exp").onclick=()=>{const s=JSON.stringify({kz:KZ,ss:SS.map(y=>[y.s,y.e]),tr:trades,nw:mine});$("bk").value=s;try{navigator.clipboard.writeText(s)}catch(e){}$("bkm").textContent="Nusxalandi. Telegram “Saved messages” ga joylab qo‘ying.";toast("Nusxalandi")};
$("imp").onclick=()=>{try{const o=JSON.parse($("bk").value);
 if(o.kz&&o.kz.length===4){KZ=o.kz;sv("kz",KZ)}if(Array.isArray(o.ss))o.ss.forEach((v,i)=>{if(SS[i]&&v){SS[i].s=v[0];SS[i].e=v[1]}});sv("ss",SS.map(y=>[y.s,y.e]));
 if(Array.isArray(o.tr)){trades=o.tr;sv("tr",trades)}if(Array.isArray(o.nw)){mine=o.nw.filter(n=>n.ts);sv("nw",mine)}
 eKZ();eSS();buildTL();renderJr();renderCal();tick();$("bkm").textContent="Tiklandi.";toast("Tiklandi")}catch(e){$("bkm").textContent="Matn noto‘g‘ri.";toast("Matn noto‘g‘ri")}};

/* ---- boshlash ---- */
$("ver").textContent="Versiya: v6";
applyTh();refreshTz();eKZ();eSS();buildTL();tick();renderJr();renderCal();
setInterval(tick,1000);setInterval(buildTL,3600000);
