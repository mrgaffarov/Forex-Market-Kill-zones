
if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(function(){})}
const NY="America/New_York",$=id=>document.getElementById(id),pad=n=>String(n).padStart(2,"0");
const ld=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const DEF=[{id:"as",n:"Asian kill zone",s:1200,e:1440,c:"--asia"},{id:"lo",n:"London kill zone",s:120,e:300,c:"--lon"},{id:"am",n:"New York AM kill zone",s:420,e:600,c:"--nyam"},{id:"pm",n:"New York PM kill zone",s:810,e:960,c:"--nypm"}];
let KZ=ld("kz",null);if(!KZ||KZ.length!==4)KZ=JSON.parse(JSON.stringify(DEF));
let trades=ld("tr",[]),snd=ld("snd",false);
const SS=[{n:"Sydney",tz:"Australia/Sydney",s:420,e:960,c:"--asia"},{n:"Tokio",tz:"Asia/Tokyo",s:540,e:1080,c:"--lon"},{n:"London",tz:"Europe/London",s:480,e:1020,c:"--lon"},{n:"New York",tz:NY,s:480,e:1020,c:"--nyam"}];
const SSD=SS.map(x=>[x.s,x.e]);ld("ss",[]).forEach((v,i)=>{if(SS[i]&&v){SS[i].s=v[0];SS[i].e=v[1]}});
const hm=m=>{m=((Math.floor(m)%1440)+1440)%1440;return pad(Math.floor(m/60))+":"+pad(m%60)};
const dur=m=>{m=Math.max(0,Math.ceil(m));const d=Math.floor(m/1440),h=Math.floor(m%1440/60);return (d?d+" kun ":"")+(h?h+" soat ":"")+pad(m%60)+" daq"};
const fx=z=>/^UTC[+-]/.test(z)?parseFloat(z.slice(3)):null;
const wall=(ms,z)=>{const o=fx(z);if(o!==null)return ms+o*36e5;const f=new Intl.DateTimeFormat("en-GB",{timeZone:z,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date(ms));const g=t=>+f.find(p=>p.type===t).value;return Date.UTC(g("year"),g("month")-1,g("day"),g("hour"),g("minute"),g("second"))};
const mins=(d,z)=>((wall(+d,z)/6e4)%1440+1440)%1440;
function nyInfo(d){const f=new Intl.DateTimeFormat("en-US",{timeZone:NY,weekday:"short",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
 const g=t=>f.find(p=>p.type===t).value;return{dow:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(g("weekday")),date:g("year")+"-"+g("month")+"-"+g("day")}}
const ee=k=>k.e<=k.s?k.e+1440:k.e;
const act=(k,m)=>(m>=k.s&&m<ee(k))||(ee(k)>1440&&m+1440<ee(k));
const left=(k,m)=>ee(k)-(m>=k.s?m:m+1440);
const wait=(k,m)=>((k.s-m)%1440+1440)%1440;
function mkt(dow,m){const w=dow*1440+m;const open=!(w>=5*1440+1020||w<1020);const toOpen=w<1020?1020-w:7*1440-w+1020;return{open,toOpen}}

// timezone
let cu=ld("cu",5),tz=ld("tz","Asia/Tashkent");
const ZN=[["Asia/Tashkent","Toshkent"],["Asia/Karachi","Karachi"],["Asia/Dubai","Dubay"],["Europe/Istanbul","Istanbul"],["Europe/Moscow","Moskva"],["Europe/London","London"],[NY,"New York"],["Asia/Tokyo","Tokio"],["Australia/Sydney","Sydney"]];
const sg=o=>(o>=0?"+":"−")+Math.abs(Math.round(o*2)/2);
const uo=z=>"UTC"+sg((wall(Date.now(),z)-Date.now())/36e5);
const cz=()=>"UTC"+(cu>=0?"+":"-")+Math.abs(cu);
function fillTz(){const s=$("tz");if(fx(tz)!==null)tz=cz();
 s.innerHTML=ZN.map(([v,l])=>'<option value="'+v+'">'+l+' · '+uo(v)+'</option>').join("")+'<option value="'+cz()+'">Boshqa · UTC'+sg(cu)+'</option>';
 if(![...s.options].some(o=>o.value===tz))tz="Asia/Tashkent";s.value=tz;$("cu").value=cu}
$("tz").onchange=e=>{tz=e.target.value;sv("tz",tz);tick()};
$("cu").onchange=e=>{cu=Math.max(-12,Math.min(14,+e.target.value||0));sv("cu",cu);tz=cz();sv("tz",tz);fillTz();tick()};

// tabs
document.querySelectorAll("#nav button").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("#nav button").forEach(x=>x.classList.toggle("a",x===b));
 ["home","jr","tools","set"].forEach(id=>$(id).classList.toggle("hide",id!==b.dataset.t));
 if(b.dataset.t==="jr")renderJr();});

// timeline
let nowEls=[];
function segs(s,e){return e>1440?[[s,1440],[0,e-1440]]:[[s,e]]}
function buildTL(){const tl=$("tl");tl.innerHTML="";nowEls=[];const d=new Date(),ny=mins(d,NY);
 const add=(label,list,c)=>{const r=document.createElement("div");r.className="row";r.innerHTML="<b>"+label+"</b><div class=bar></div>";const bar=r.lastChild;
  list.forEach(([s,e])=>{const x=document.createElement("div");x.className="seg";x.style.left=s/14.4+"%";x.style.width=(e-s)/14.4+"%";x.style.background="var("+c+")";bar.appendChild(x)});
  const n=document.createElement("div");n.className="now";bar.appendChild(n);nowEls.push(n);tl.appendChild(r);return bar};
 SS.forEach(x=>{const sh=((ny-mins(d,x.tz))%1440+1440)%1440,s=(x.s+sh)%1440;add(x.n,segs(s,s+x.e-x.s),x.c)});
 KZ.forEach(k=>add(k.n.replace(" kill zone","").replace("New York","NY"),segs(k.s,ee(k)),k.c));
 const ob=add("ICT",[],"--mute");ob.insertAdjacentHTML("afterbegin",[[0,"MO"],[120,"LO"],[420,"NY"]].map(([m,l])=>'<div style="position:absolute;top:-2px;bottom:-2px;width:2px;background:var(--nypm);left:'+m/14.4+'%"></div><span style="position:absolute;left:calc('+m/14.4+'% + 4px);top:0;font-size:.62rem;font-weight:700">'+l+'</span>').join(""));}

// sound
let ctx=null,prev={};
function beep(){try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();[0,.35].forEach(t=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=880;o.connect(g);g.connect(ctx.destination);g.gain.setValueAtTime(.25,ctx.currentTime+t);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+t+.3);o.start(ctx.currentTime+t);o.stop(ctx.currentTime+t+.3)})}catch(e){}
 try{navigator.vibrate&&navigator.vibrate([300,150,300])}catch(e){}}
$("snd").checked=snd;$("snd").onchange=e=>{snd=e.target.checked;sv("snd",snd);if(snd)beep()};

function curKz(){const d=new Date(),i=nyInfo(d),m=mins(d,NY);if(!mkt(i.dow,m).open)return null;return KZ.find(k=>act(k,m))||null}

function tick(){
 const d=new Date(),loc=mins(d,tz),ny=mins(d,NY),inf=nyInfo(d),M=mkt(inf.dow,ny),diff=loc-ny;
 $("clock").textContent=hm(loc)+":"+pad(Math.floor((loc%1)*60));
 $("sub").textContent="New York: "+hm(ny)+":"+pad(Math.floor((ny%1)*60));
 nowEls.forEach(n=>n.style.left=ny/14.4+"%");
 // banner
 const a=M.open?KZ.find(k=>act(k,ny)):null;let b=$("ban");
 if(!M.open){b.style.background="var(--mute)";b.innerHTML="<b>Bozor yopiq (dam olish kuni)</b><span>Ochilishiga "+dur(M.toOpen)+"</span>"}
 else if(a){b.style.background="var("+a.c+")";b.innerHTML="<b>HOZIR: "+a.n+"</b><span>Tugashiga "+dur(left(a,ny))+"</span>"}
 else{const nx=KZ.slice().sort((x,y)=>wait(x,ny)-wait(y,ny))[0];b.style.background="var(--mute)";b.innerHTML="<b>Kill zone emas</b><span>Keyingisi: "+nx.n+", "+dur(wait(nx,ny))+" dan keyin</span>"}
 renderNews();
 // signal
 KZ.forEach(k=>{const on=M.open&&act(k,ny),w=wait(k,ny),pr=pre>0&&M.open&&!on&&w>0&&w<=pre;if(on&&prev[k.id]===false&&snd)beep();if(pr&&!pp[k.id]&&snd)beep();prev[k.id]=on;pp[k.id]=pr});
 $("curkz").textContent=a?a.n:(M.open?"Kill zone emas":"Bozor yopiq");
 $("kz").innerHTML=KZ.map(k=>{const on=M.open&&act(k,ny);
  const st=!M.open?'<div class="st">Yopiq<small>bozor dam olishda</small></div>':on?'<div class="st on">Faol<span class="pill">LIVE</span><small>tugashiga '+dur(left(k,ny))+'</small></div>':'<div class="st">Boshlanishiga<small>'+dur(wait(k,ny))+'</small></div>';
  return '<div class="kz"><div class="dot" style="background:var('+k.c+')"></div><div class="i"><div class="n">'+k.n+'</div><div class="t">'+hm(k.s+diff)+' – '+hm(k.e+diff)+' · NY '+hm(k.s)+' – '+hm(k.e)+'</div></div>'+st+'</div>'}).join("");
 $("ss").innerHTML=SS.map(x=>{const m=mins(d,x.tz),open=M.open&&m>=x.s&&m<x.e,l=open?x.e-m:((x.s-m)%1440+1440)%1440,sh=((ny-m)%1440+1440)%1440,s=(x.s+sh+diff)%1440;
  return '<div class="kz"><div class="i"><div class="n">'+x.n+'</div><div class="t">'+hm(s)+' – '+hm(s+x.e-x.s)+'</div></div><div class="st'+(open?' on':'')+'">'+(open?'Ochiq':'Yopiq')+'<small>'+(open?'yopilishiga ':'ochilishiga ')+dur(l)+'</small></div></div>'}).join("");
}

// settings
function renderEdit(){$("edit").innerHTML=KZ.map((k,i)=>'<div class="kz"><div class="dot" style="background:var('+k.c+')"></div><div class="i"><div class="n">'+k.n+'</div><div class="g" style="margin-top:6px"><div><label>Boshlanish</label><input type="time" data-i="'+i+'" data-f="s" value="'+hm(k.s)+'"></div><div><label>Tugash</label><input type="time" data-i="'+i+'" data-f="e" value="'+hm(k.e)+'"></div></div></div></div>').join("");
 $("edit").querySelectorAll("input").forEach(el=>el.onchange=()=>{if(!el.value)return;const[h,m]=el.value.split(":").map(Number);KZ[+el.dataset.i][el.dataset.f]=h*60+m;sv("kz",KZ);buildTL();tick()})}
$("reset").onclick=()=>{KZ=JSON.parse(JSON.stringify(DEF));sv("kz",KZ);renderEdit();buildTL();tick()};

// journal
function renderJr(){renderExtra();
 const T=trades,w=T.filter(t=>t.r>0).length,sum=T.reduce((a,t)=>a+t.r,0),f=n=>(n>0?"+":"")+n.toFixed(1);
 const by={};T.forEach(t=>{const o=by[t.kz]=by[t.kz]||{n:0,w:0,r:0};o.n++;if(t.r>0)o.w++;o.r+=t.r});
 $("stats").innerHTML=T.length?'<div class="stats"><div><b>'+T.length+'</b>savdo</div><div><b>'+Math.round(w/T.length*100)+'%</b>yutuq</div><div><b class="'+(sum>=0?"pos":"neg")+'">'+f(sum)+'R</b>jami</div></div><table style="margin-top:10px"><tr><th>Kill zone</th><th>Savdo</th><th>Yutuq</th><th>R</th></tr>'+Object.keys(by).map(k=>'<tr><td>'+esc(k)+'</td><td>'+by[k].n+'</td><td>'+Math.round(by[k].w/by[k].n*100)+'%</td><td class="'+(by[k].r>=0?"pos":"neg")+'">'+f(by[k].r)+'</td></tr>').join("")+'</table>':'<div class="t">Hali savdo yo‘q.</div>';
 $("list").innerHTML=T.length?T.slice(0,30).map((t,i)=>'<div class="tr"><div><b>'+esc(t.p)+'</b> '+esc(t.s)+' · '+esc(t.kz)+'<small>'+esc(t.d)+(t.nt?' · '+esc(t.nt):'')+(t.tg&&t.tg.length?' · #'+esc(t.tg.join(' #')):'')+'</small></div><div><b class="'+(t.r>=0?"pos":"neg")+'">'+f(t.r)+'R</b><button class="x" data-i="'+i+'" aria-label="O‘chirish">✕</button></div></div>').join(""):'<div class="t">Bo‘sh.</div>';
 $("list").querySelectorAll(".x").forEach(b=>b.onclick=()=>{trades.splice(+b.dataset.i,1);sv("tr",trades);renderJr()})}
$("add").onclick=()=>{const r=parseFloat($("res").value);if(isNaN(r)){$("res").focus();return}
 const d=new Date(),k=curKz();trades.unshift({p:$("pair").value.trim().toUpperCase()||"—",s:$("side").value,r:r,kz:k?k.n:"Kill zone tashqarida",nt:$("note").value.trim(),tg:$("tags").value.split(",").map(s=>s.trim().toLowerCase()).filter(Boolean),d:nyInfo(d).date+" "+hm(mins(d,NY))+" NY"});
 sv("tr",trades);$("res").value="";$("note").value="";$("tags").value="";renderJr()};

let pre=ld("pre",0),pp={},news=ld("nw",[]).filter(n=>n.ts),th=ld("th","auto");
function renderExtra(){const T=trades.slice().reverse();let c=0;const pts=T.map(t=>c+=t.r);let svg="";
 if(pts.length>1){const mn=Math.min(0,...pts),mx=Math.max(0,...pts),rg=(mx-mn)||1,p=pts.map((v,i)=>(i/(pts.length-1)*300).toFixed(1)+","+(90-(v-mn)/rg*90).toFixed(1)).join(" "),z=(90+mn/rg*90).toFixed(1);
  svg='<svg viewBox="0 0 300 90" width="100%" height="90" preserveAspectRatio="none"><line x1="0" x2="300" y1="'+z+'" y2="'+z+'" stroke="var(--line)"/><polyline fill="none" stroke="var(--nyam)" stroke-width="2" points="'+p+'"/></svg>'}
 const grp=f=>{const o={};trades.forEach(t=>f(t).forEach(k=>{const x=o[k]=o[k]||{n:0,w:0,r:0};x.n++;if(t.r>0)x.w++;x.r+=t.r}));return o};
 const tb=(o,h)=>Object.keys(o).length?'<table><tr><th>'+h+'</th><th>Savdo</th><th>Yutuq</th><th>R</th></tr>'+Object.keys(o).sort().map(k=>'<tr><td>'+esc(k)+'</td><td>'+o[k].n+'</td><td>'+Math.round(o[k].w/o[k].n*100)+'%</td><td class="'+(o[k].r>=0?"pos":"neg")+'">'+(o[k].r>0?"+":"")+o[k].r.toFixed(1)+'</td></tr>').join("")+'</table>':'<div class="t">Ma’lumot yo‘q</div>';
 const DN=["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"],hd='<h2 style="margin-top:14px">';
 $("extra").innerHTML='<h2>Equity (jami R)</h2>'+(svg||'<div class="t">Kamida 2 ta savdo kerak</div>')+hd+'Hafta kuni</h2>'+tb(grp(t=>[DN[new Date(t.d.slice(0,10)+"T12:00:00Z").getUTCDay()]]),"Kun")+hd+'Soat (NY)</h2>'+tb(grp(t=>[t.d.slice(11,13)+":00"]),"Soat")+hd+'Teglar</h2>'+tb(grp(t=>t.tg||[]),"Teg")}
function calc(){const b=+$("bal").value,r=+$("rk").value,sl=+$("sl").value,pv=+$("pv").value;
 $("lot").innerHTML=(b&&r&&sl&&pv)?'Risk: <b>$'+(b*r/100).toFixed(2)+'</b> · Lot: <b>'+(b*r/100/(sl*pv)).toFixed(2)+'</b>':'Maydonlarni to‘ldiring';sv("calc",[b,r,sl,pv])}
{const c=ld("calc",[1000,1,10,10]);["bal","rk","sl","pv"].forEach((id,i)=>{$(id).value=c[i]||"";$(id).oninput=calc});calc()}
const toUTC=(d,t,z)=>{const[y,m,dd]=d.split("-").map(Number),[h,mi]=t.split(":").map(Number),g=Date.UTC(y,m-1,dd,h,mi);let u=g-(wall(g,z)-g);u=g-(wall(u,z)-u);return u};
function renderNews(){const now=Date.now();news=news.filter(n=>n.ts>now-864e5);news.sort((a,b)=>a.ts-b.ts);
 const fm=ts=>{const w=new Date(wall(ts,tz));return pad(w.getUTCDate())+"."+pad(w.getUTCMonth()+1)+" "+pad(w.getUTCHours())+":"+pad(w.getUTCMinutes())};let hot=false,h="";
 news.forEach((n,i)=>{const df=(n.ts-now)/6e4;if(df<-15)return;const bl=df<=60;if(bl)hot=true;
  if(snd){if(df<=60&&df>0&&!n.a1){n.a1=1;beep()}if(df<=5&&df>0&&!n.a2){n.a2=1;beep()}}
  h+='<div class="tr"><div>'+(bl?'<span class="bd"></span> ':'')+'<b>'+esc(n.t)+'</b><small>'+fm(n.ts)+' · '+(df>0?dur(df)+' qoldi':'chiqdi')+'</small></div><button class="x" data-i="'+i+'" aria-label="O‘chirish">✕</button></div>'});
 $("nlist").innerHTML=h||'<div class="t" style="margin-top:8px">Yaqin yangilik yo‘q</div>';
 document.querySelectorAll(".hd").forEach(e=>e.classList.toggle("hide",!hot));$("nws").style.borderColor=hot?"#ff2d4a":""}
$("ntog").onclick=()=>{$("nform").classList.toggle("hide");if(!$("nd").value)$("nd").value=new Date(wall(Date.now(),tz)).toISOString().slice(0,10)};
$("nadd").onclick=()=>{if(!$("nd").value||!$("ntm").value||!$("nt").value.trim())return;news.push({ts:toUTC($("nd").value,$("ntm").value,tz),t:$("nt").value.trim()});sv("nw",news);$("nt").value="";$("nform").classList.add("hide");renderNews()};
$("nlist").onclick=e=>{const b=e.target.closest(".x");if(b){news.splice(+b.dataset.i,1);sv("nw",news);renderNews()}};
$("exp").onclick=()=>{const s=JSON.stringify({kz:KZ,tr:trades,nw:news});$("bk").value=s;try{navigator.clipboard.writeText(s)}catch(e){}$("bkm").textContent="Nusxalandi. Telegram “Saved messages” ga joylab qo‘ying."};
$("imp").onclick=()=>{try{const o=JSON.parse($("bk").value);if(o.kz&&o.kz.length===4){KZ=o.kz;sv("kz",KZ)}if(Array.isArray(o.tr)){trades=o.tr;sv("tr",trades)}if(Array.isArray(o.nw)){news=o.nw.filter(n=>n.ts);sv("nw",news)}renderEdit();buildTL();renderJr();renderNews();tick();$("bkm").textContent="Tiklandi."}catch(e){$("bkm").textContent="Matn noto‘g‘ri."}};
$("pre").value=pre;$("pre").onchange=e=>{pre=+e.target.value;sv("pre",pre)};
function applyTh(){th==="auto"?document.documentElement.removeAttribute("data-theme"):document.documentElement.setAttribute("data-theme",th)}
$("th").value=th;$("th").onchange=e=>{th=e.target.value;sv("th",th);applyTh()};applyTh();renderNews();
function renderSedit(){$("sedit").innerHTML=SS.map((x,i)=>'<div class="kz"><div class="dot" style="background:var('+x.c+')"></div><div class="i"><div class="n">'+x.n+'</div><div class="g" style="margin-top:6px"><div><label>Ochilish</label><input type="time" data-i="'+i+'" data-f="s" value="'+hm(x.s)+'"></div><div><label>Yopilish</label><input type="time" data-i="'+i+'" data-f="e" value="'+hm(x.e)+'"></div></div></div></div>').join("");
 $("sedit").querySelectorAll("input").forEach(el=>el.onchange=()=>{if(!el.value)return;const[h,m]=el.value.split(":").map(Number),x=SS[+el.dataset.i],o=x[el.dataset.f];x[el.dataset.f]=h*60+m;if(x.e<=x.s){x[el.dataset.f]=o;renderSedit();return}sv("ss",SS.map(y=>[y.s,y.e]));buildTL();tick()})}
$("sreset").onclick=()=>{SSD.forEach((v,i)=>{SS[i].s=v[0];SS[i].e=v[1]});sv("ss",SSD);renderSedit();buildTL();tick()};
fillTz();renderSedit();renderEdit();buildTL();tick();renderJr();
setInterval(tick,1000);setInterval(buildTL,3600000);
