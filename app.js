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
const SS=[{n:"Sydney",tz:"Australia/Sydney",s:420,e:960,c:"--sy"},{n:"Tokio",tz:"Asia/Tokyo",s:540,e:1080,c:"--tk"},{n:"London",tz:"Europe/London",s:480,e:1020,c:"--ld"},{n:"New York",tz:NY,s:480,e:1020,c:"--nyc"}];
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
function refreshTz(){$("tzl2").textContent=(fx(tz)!==null?"":tzName()+" · ")+uo(tz);$("tzl").textContent=(fx(tz)!==null?"":tzName()+" · ")+uo(tz);$("curz").textContent="Hozirgi: "+(fx(tz)!==null?"qo‘lda ":tzName()+" · ")+uo(tz);$("setcu").innerHTML=cuHTML();$("shcu").innerHTML=cuHTML()}
function renderSheet(){$("slist").innerHTML=ZN.map(([v,l])=>'<button class="zr'+(tz===v?" sel":"")+'" data-z="'+v+'"><span><b>'+l+'</b><small>'+uo(v)+'</small></span><span class="zt">'+hm(mins(new Date(),v))+'</span>'+(tz===v?IC("check"):"")+'</button>').join("")}
const sheetOpen=()=>!$("sheet").classList.contains("hide");
$("tzb").onclick=()=>{renderSheet();$("sheet").classList.remove("hide")};$("tzb2").onclick=$("tzb").onclick;
$("sbd").onclick=()=>$("sheet").classList.add("hide");
document.addEventListener("click",e=>{
 const z=e.target.closest(".zr");if(z){tz=z.dataset.z;sv("tz",tz);$("sheet").classList.add("hide");refreshTz();buildTL();tick();toast("Vaqt zonasi: "+tzName()+" · "+uo(tz));return}
 const b=e.target.closest(".stp,.cok");if(!b)return;const i=b.closest(".cm").querySelector(".ci"),cl=v=>Math.max(-12,Math.min(14,v));
 if(b.classList.contains("stp")){i.value=cl((+i.value||0)+ +b.dataset.d);return}
 cu=Math.round(cl(+i.value||0)*2)/2;sv("cu",cu);tz=cz();sv("tz",tz);$("sheet").classList.add("hide");refreshTz();buildTL();tick();toast("Qo‘llandi: "+uo(tz))});

/* ---- bo'limlar ---- */
document.querySelectorAll("#nav button").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("#nav button").forEach(x=>x.classList.toggle("a",x===b));
 ["home","jr","stats","tools","set"].forEach(id=>$(id).classList.toggle("hide",id!==b.dataset.t));
 if(b.dataset.t==="jr")renderJr();if(b.dataset.t==="stats")renderStats();if(b.dataset.t==="tools"){renderCal();renderBaza()}$("fab").classList.toggle("hide",b.dataset.t!=="jr");window.scrollTo(0,0)});
document.querySelectorAll("#sub3 button").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("#sub3 button").forEach(x=>x.classList.toggle("on",x===b));
 ["cal","risk","bk"].forEach(p=>$("p-"+p).classList.toggle("hide",p!==b.dataset.p));if(b.dataset.p==="bk")renderBaza();if(b.dataset.p==="cal")renderCal()});

/* ---- vaqt chizig'i ---- */
let h12=ld("h12",false),RI=[],VF=null;
const DNs=["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"],FL=["🇦🇺","🇯🇵","🇬🇧","🇺🇸"];
const VOL=[.2,.2,.25,.3,.3,.35,.4,.6,.8,.8,.7,.7,.9,1,1,.9,.7,.45,.3,.2,.15,.15,.2,.2];
const ft=m=>{m=((Math.floor(m+1e-6)%1440)+1440)%1440;const H=Math.floor(m/60);return h12?(H%12||12)+":"+pad(m%60)+(H<12?" AM":" PM"):pad(H)+":"+pad(m%60)};
function buildTL(){const d=new Date(),ny=mins(d,NY),diff=Math.round(mins(d,tz)-ny),M=v=>((v%1440)+1440)%1440,off=Math.round((wall(+d,tz)-+d)/18e5)/2;
 $("ax").innerHTML=[0,2,4,6,8,10,12,14,16,18,20,22,24].map(x=>"<span>"+(h12?(x%12||12)+(x<12||x===24?"a":"p"):x)+"</span>").join("");
 const blk=(s,len,c)=>(s+len>1440?[[s,1440],[0,s+len-1440]]:[[s,s+len]]).map(([a,b])=>'<i class="blk" style="left:'+a/14.4+"%;width:"+(b-a)/14.4+"%;background:var("+c+')"></i>').join("");
 RI=[];let h="";
 SS.forEach((x,i)=>{const r=RI.length,sh=Math.round(ny-mins(d,x.tz)+1440)%1440,s=M(x.s+sh+diff);RI.push({t:"s",i});
  h+='<div class="rw"><div class="lc"><div class="lh"><span class="fl">'+FL[i]+"</span><b>"+x.n+'</b></div><div class="lt" id="lt'+r+'"></div><small id="ld'+r+'"></small></div><div class="tk"><div class="st" id="st'+r+'" style="color:var('+x.c+')"></div>'+blk(s,x.e-x.s,x.c)+"</div></div>"});
 KZ.forEach((k,i)=>{const r=RI.length,s=M(k.s+diff),len=ee(k)-k.s;RI.push({t:"k",i});
  h+='<div class="rw"><div class="lc"><div class="lh"><i class="dotk" style="background:var('+k.c+')"></i><b>'+k.n.replace(" kill zone","").replace("New York","NY")+'</b></div><div class="lt">'+ft(s)+"–"+ft(s+len)+"</div><small>NY "+hm(k.s)+"–"+hm(k.e)+'</small></div><div class="tk"><div class="st" id="st'+r+'" style="color:var('+k.c+')"></div>'+blk(s,len,k.c)+"</div></div>"});
 const vv=u=>{u=((u-off)%24+24)%24;const i=Math.floor(u),f=u-i;return VOL[i]+(VOL[(i+1)%24]-VOL[i])*f};VF=vv;
 const P=[...Array(25).keys()].map(k=>[k*10,56-vv(k)*50]);let dp="M"+P[0].join(" ");for(let k=1;k<24;k++)dp+=" Q"+P[k][0]+" "+P[k][1]+" "+(P[k][0]+P[k+1][0])/2+" "+(P[k][1]+P[k+1][1])/2;dp+=" L"+P[24].join(" ");
 h+='<div class="rw"><div class="lc"><b>Odatda hajm</b><small>taxminiy</small><span class="vc"><i id="vdot"></i><span id="vt"></span></span></div><div class="tk vk"><svg viewBox="0 0 240 60" preserveAspectRatio="none"><defs><linearGradient id="vg" gradientUnits="userSpaceOnUse" x1="0" y1="6" x2="0" y2="56"><stop offset="0" stop-color="#34c759"/><stop offset=".5" stop-color="#ffcc00"/><stop offset="1" stop-color="#ff2d78"/></linearGradient></defs><path d="'+dp+'" fill="none" stroke="url(#vg)" stroke-width="3" vector-effect="non-scaling-stroke"/></svg><div class="tl3" id="tl3"><i></i><i></i><i></i></div></div></div>';
 $("rws").innerHTML=h;
 const mo=M(diff)/14.4;
 $("ov").innerHTML='<div class="pin" id="pin"><svg viewBox="0 0 28 28" width="30" height="30"><circle cx="14" cy="14" r="13" fill="#fff"/><line id="hh" x1="14" y1="14" x2="14" y2="8" stroke="#444" stroke-width="2.4" stroke-linecap="round"/><line id="mh" x1="14" y1="14" x2="14" y2="5" stroke="#444" stroke-width="1.8" stroke-linecap="round"/></svg><b id="pt"></b><small id="pd"></small></div><i class="nl2" id="nl2"></i><i class="mo2" style="left:'+mo+'%"></i><span class="mol2" style="left:calc('+mo+'% + 4px)">Midnight Open</span>'}
function updChart(d,loc,ny,M){const x=loc/14.4+"%";
 if(!$("pin"))return;$("pin").style.left=x;$("nl2").style.left=x;$("pt").textContent=ft(loc);$("pd").textContent=DNs[new Date(wall(+d,tz)).getUTCDay()];
 $("hh").setAttribute("transform","rotate("+(loc/60%12*30)+" 14 14)");$("mh").setAttribute("transform","rotate("+(loc%60*6)+" 14 14)");
 RI.forEach((r,n)=>{const st=$("st"+n);if(r.t==="s"){const s=SS[r.i],m=mins(d,s.tz),open=M.open&&m>=s.e*0+s.s&&m<s.e;
   st.textContent=s.n.toUpperCase()+" SESSIYASI "+(!M.open?"· BOZOR YOPIQ":open?"OCHIQ · "+dur(s.e-m):"YOPIQ · "+dur(((s.s-m)%1440+1440)%1440));
   $("lt"+n).textContent=ft(m);$("ld"+n).textContent=DNs[new Date(wall(+d,s.tz)).getUTCDay()]+" ("+uo(s.tz).replace("UTC","UTC ")+")"}
  else{const k=KZ[r.i],on=M.open&&act(k,ny);st.textContent=k.n.toUpperCase()+" "+(!M.open?"· BOZOR YOPIQ":on?"FAOL · "+dur(left(k,ny)):"KUTILMOQDA · "+dur(wait(k,ny)))}});
 if(VF){const v=VF(loc/60),lv=v>=.75?0:v>=.4?1:2,tl=$("tl3");tl.style.left=x;tl.style.top=((56-v*50)/60*100)+"%";[...tl.children].forEach((c,i)=>c.classList.toggle("on",i===lv));
  $("vt").textContent=["Yuqori","O‘rtacha","Past"][lv];$("vdot").style.background=["#34c759","#ffcc00","#ff2d78"][lv]}}
$("h24").checked=!h12;$("h24").onchange=e=>{h12=!e.target.checked;sv("h12",h12);buildTL();tick()};
/* ---- ovoz ---- */
function beep(){try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();[0,.35].forEach(t=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=880;o.connect(g);g.connect(ctx.destination);g.gain.setValueAtTime(.25,ctx.currentTime+t);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+t+.3);o.start(ctx.currentTime+t);o.stop(ctx.currentTime+t+.3)})}catch(e){}try{navigator.vibrate&&navigator.vibrate([300,150,300])}catch(e){}}
$("snd").checked=snd;$("snd").onchange=e=>{snd=e.target.checked;sv("snd",snd);if(snd)beep()};
$("pre").value=pre;$("pre").onchange=e=>{pre=+e.target.value;sv("pre",pre)};

/* ---- iqtisodiy taqvim ---- */
const fixIds=()=>mine.forEach((n,i)=>{if(!n.id)n.id="e"+i+"_"+n.ts});fixIds();
const evList=()=>mine.slice().sort((a,b)=>a.ts-b.ts);
const num=v=>parseFloat(String(v).replace(/[^0-9.\-]/g,""));
const shortD=m=>m>=1440?Math.floor(m/1440)+" kun":m>=60?Math.floor(m/60)+" s "+pad(Math.floor(m%60))+" d":Math.ceil(m)+" daq";
function evCard(e,now){const f=e.f||"",p=e.p||"",a=e.a||"",na=num(a),nf=num(f),df=(e.ts-now)/6e4;
 const ar=a&&!isNaN(na)&&!isNaN(nf)&&na!==nf?(na>nf?'<span class="up">▲</span>':'<span class="dn">▼</span>'):"";
 const st=df>0?(df<=60?'<span class="stc hotc2">Tez orada</span>':'<span class="stc">Kutilmoqda</span>'):(a?'<span class="stc ok">Chiqdi</span>':'<span class="stc warn2">Natija kiritilmagan</span>');
 return'<div class="ev2"><div class="ev2t"><b>'+fmt(e.ts)+"</b><small>"+(df>0?shortD(df):"")+'</small></div><div class="ev2b"><div class="ev2h"><b>'+esc(e.t)+'</b><span class="imp"><i></i><i></i><i></i></span><button class="x" data-id="'+e.id+'" aria-label="O‘chirish">'+IC("x")+"</button></div>"+st
 +'<div class="ev3"><div><small>Haqiqiy '+ar+'</small><input class="ai" data-id="'+e.id+'" value="'+esc(a)+'" placeholder="—"></div><div><small>Prognoz</small><b>'+(esc(f)||"—")+'</b></div><div><small>Oldingi</small><b>'+(esc(p)||"—")+"</b></div></div></div></div>"}
function homeAlert(){const now=Date.now(),L=evList().filter(e=>{const df=(e.ts-now)/6e4;return df>-15&&df<=60}).slice(0,3);
 $("al").innerHTML=L.map(e=>{const df=(e.ts-now)/6e4;return'<div class="al"><span class="bd hot"></span><div class="alt"><b>'+esc(e.t)+'</b><small>'+fmt(e.ts)+" · "+(df>0?dur(df)+" qoldi":"hozir chiqdi")+'</small></div><div class="alp">'+(e.a?'<span>Haq. <b>'+esc(e.a)+'</b></span>':"")+(e.f?'<span>Prog. <b>'+esc(e.f)+'</b></span>':"")+(e.p?'<span>Old. <b>'+esc(e.p)+'</b></span>':"")+"</div></div>"}).join("");
 if(snd)L.forEach(e=>{const df=(e.ts-now)/6e4;if(df>0&&df<=60&&!fl[e.id+"a"]){fl[e.id+"a"]=1;beep()}if(df>0&&df<=5&&!fl[e.id+"b"]){fl[e.id+"b"]=1;beep()}})}
const NFO=[["up","Kutilayotgan"],["past","O‘tgan"],["all","Hammasi"]];let nfl=ld("nfl","up");
function renderHero(){const now=Date.now(),L=evList(),nb=L.filter(e=>e.ts>now).length;$("nbg").textContent=nb;$("nbg").classList.toggle("hide",!nb);
 if($("tools").classList.contains("hide")||$("p-cal").classList.contains("hide"))return;
 const e=L.filter(x=>x.ts>now-9e5)[0];
 if(!e){$("nhero").innerHTML='<div class="empty"><span class="ib">'+IC("cal")+'</span><b>Yaqin yangilik yo‘q</b><small>“Yangilik” tugmasi bilan qo‘shing</small></div>';return}
 const df=e.ts-now,hot=df<=36e5,w=new Date(wall(e.ts,tz)),dt=pad(w.getUTCDate())+"."+pad(w.getUTCMonth()+1),
  cdw=df<=0?"hozir":df>=864e5?Math.floor(df/864e5)+" kun "+Math.floor(df%864e5/36e5)+" soat":pad(Math.floor(df/36e5))+":"+pad(Math.floor(df%36e5/6e4))+":"+pad(Math.floor(df%6e4/1e3));
 $("nhero").innerHTML='<div class="nh'+(hot?" hot":"")+'"><div class="nh1"><span class="lbl">Keyingi yangilik</span>'+(hot?'<span class="bd hot"></span>':"")+'</div><div class="nh2"><b>'+esc(e.t)+'</b></div><div class="nh3">'+cdw+'</div><div class="nh4">'+dt+" · "+fmt(e.ts)+" · Prognoz "+(esc(e.f)||"—")+" · Oldingi "+(esc(e.p)||"—")+"</div></div>"}
function renderCal(){const now=Date.now(),all=evList(),L=nfl==="up"?all.filter(e=>e.ts>now-9e5):nfl==="past"?all.filter(e=>e.ts<=now-9e5):all,days={},today=K(new Date(wall(now,tz)));
 L.forEach(e=>{const d=K(new Date(wall(e.ts,tz)));(days[d]=days[d]||[]).push(e)});
 const ks=Object.keys(days).sort(),ord=nfl==="past"?ks.reverse():nfl==="all"?ks.filter(k=>k>=today).concat(ks.filter(k=>k<today).reverse()):ks;
 $("nfv").textContent=NFO.find(o=>o[0]===nfl)[1];
 $("cal").innerHTML=ord.map(k=>{const dt=D(k);return'<div class="dh">'+DNs[dt.getUTCDay()]+", "+dt.getUTCDate()+"-"+MS[dt.getUTCMonth()]+(k===today?" · bugun":"")+"</div>"+days[k].map(e=>evCard(e,now)).join("")}).join("")||(nfl==="up"?"":'<div class="empty"><b>Yangilik yo‘q</b><small>Bu ro‘yxatda hozircha hech narsa yo‘q</small></div>');
 renderHero()}
$("cal").onclick=e=>{const b=e.target.closest(".x");if(b){mine=mine.filter(n=>n.id!==b.dataset.id);sv("nw",mine);renderCal();homeAlert()}};
$("cal").onchange=e=>{const i=e.target.closest(".ai");if(!i)return;const n=mine.find(x=>x.id===i.dataset.id);if(n){n.a=i.value.trim();sv("nw",mine);renderCal();homeAlert();toast("Saqlandi")}};
$("nfp").onclick=()=>openPick("Ko‘rsatish",NFO,nfl,v=>{nfl=v;sv("nfl",nfl);renderCal()});
const NPRE=["NFP","CPI","FOMC","PPI","GDP","Retail Sales","ISM PMI","ADP","Jobless Claims","Unemployment"];
$("npre").innerHTML=NPRE.map(x=>'<button class="ch" data-n="'+x+'">'+x+"</button>").join("");
$("npre").onclick=e=>{const b=e.target.closest("[data-n]");if(b)$("nt").value=b.dataset.n};
$("nopen").onclick=()=>{$("nd").value=new Date(wall(Date.now(),tz)).toISOString().slice(0,10);$("ntm").value="";$("ntz").textContent="Vaqt "+(fx(tz)!==null?"":tzName()+" ")+uo(tz)+" bo‘yicha kiritiladi";$("nm").classList.remove("hide")};
$("nclose").onclick=$("nbd").onclick=()=>$("nm").classList.add("hide");
const toUTC=(d,t,z)=>{const[y,m,dd]=d.split("-").map(Number),[h,mi]=t.split(":").map(Number),g=Date.UTC(y,m-1,dd,h,mi);let u=g-(wall(g,z)-g);u=g-(wall(u,z)-u);return u};
$("nadd").onclick=()=>{if(!$("nd").value||!$("ntm").value||!$("nt").value.trim()){toast("Nomi, sana va vaqtni kiriting");return}
 mine.push({id:"e"+Date.now()+Math.floor(Math.random()*1e3),ts:toUTC($("nd").value,$("ntm").value,tz),t:$("nt").value.trim(),f:$("nfc").value.trim(),p:$("npv").value.trim(),a:""});sv("nw",mine);
 ["nt","nfc","npv"].forEach(id=>$(id).value="");$("nm").classList.add("hide");renderCal();homeAlert();toast("Yangilik qo‘shildi")};

/* ---- asosiy tick ---- */
function tick(){
 const d=new Date(),loc=mins(d,tz),ny=mins(d,NY),inf=nyInfo(d),M=mkt(inf.dow,ny),diff=Math.round(loc-ny);
 $("clock").textContent=hm(loc)+":"+pad(Math.floor((loc%1)*60+1e-6));
 $("sub").textContent="New York "+hm(ny)+":"+pad(Math.floor((ny%1)*60+1e-6))+" · "+uo(NY);
 updChart(d,loc,ny,M);
 const a=M.open?KZ.find(k=>act(k,ny)):null,b=$("ban");
 if(!M.open){b.style.background="var(--mute)";b.innerHTML="<b>Bozor yopiq (dam olish kuni)</b><span>Ochilishiga "+dur(M.toOpen)+"</span>"}
 else if(a){b.style.background="var("+a.c+")";b.innerHTML="<b>HOZIR: "+a.n+"</b><span>Tugashiga "+dur(left(a,ny))+"</span>"}
 else{const nx=KZ.slice().sort((x,y)=>wait(x,ny)-wait(y,ny))[0];b.style.background="var(--mute)";b.innerHTML="<b>Kill zone emas</b><span>Keyingisi: "+nx.n+", "+dur(wait(nx,ny))+" dan keyin</span>"}
 KZ.forEach(k=>{const on=M.open&&act(k,ny),w=wait(k,ny),pr=pre>0&&M.open&&!on&&w>0&&w<=pre;if(on&&prev[k.id]===false&&snd)beep();if(pr&&!pp[k.id]&&snd)beep();prev[k.id]=on;pp[k.id]=pr});
 $("curkz").textContent="Kill zone: "+(a?a.n:(M.open?"emas (tashqarida)":"bozor yopiq"));
 
 
 homeAlert();renderHero();if(sheetOpen())renderSheet()}

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
const TP="Foyda (TP)",SL="Zarar (SL)";
let outc="w",vw="m",cm=ld("cm","d"),mt=ld("mt","r"),wk=ld("wk",false),selDay=null,sp=ld("sp",30),an=ld("an","kz"),fmi=new Set(),pk=null;
let MI=ld("mi",["Erta kirdim","Stopni surdim","FOMO","Qasos savdosi","Riskni oshirdim","Rejaga amal qilmadim","Kech chiqdim"]);
const D=k=>new Date(k+"T12:00:00Z"),K=d=>d.toISOString().slice(0,10),addD=(k,n)=>{const d=D(k);d.setUTCDate(d.getUTCDate()+n);return K(d)},dow=k=>(D(k).getUTCDay()+6)%7;
const dk=ts=>K(new Date(wall(ts,tz))),todayK=()=>dk(Date.now());let anc=todayK();
const tms=t=>t.ts||Date.parse(t.d.slice(0,10)+"T12:00:00Z");
const val=t=>mt==="u"?(+t.u||0):(+t.r||0);
const oc=t=>t.out==="w"||t.out==="l"||t.out==="d"?t.out:((t.r>0||t.u>0)?"w":(t.r<0||t.u<0)?"l":"d");
const fv=(v,sg)=>{const a=Math.abs(v),x=mt==="u"?"$"+a.toFixed(2):a.toFixed(1)+"R";return(v<0?"−":sg&&v>0?"+":"")+x};
const cl=v=>v>0?"pos":v<0?"neg":"";
const MN=["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"],MS=["yan","fev","mar","apr","may","iyn","iyl","avg","sen","okt","noy","dek"],WD=["Du","Se","Ch","Pa","Ju","Sh","Ya"];
const nowT=()=>{const w=new Date(wall(Date.now(),tz));return pad(w.getUTCHours())+":"+pad(w.getUTCMinutes())};
const kzs=k=>(k||"").replace(" kill zone","").replace("New York","NY");
const mapDays=()=>{const m={};trades.forEach(t=>{const k=dk(tms(t)),o=m[k]=m[k]||{s:0,n:0,w:0,l:0};o.s+=val(t);o.n++;const c=oc(t);if(c==="w")o.w++;else if(c==="l")o.l++});return m};
const dcl=o=>!o?"":o.s>0?"w":o.s<0?"l":o.w>o.l?"w":o.l>o.w?"l":"d";
const dim=(y,m)=>new Date(Date.UTC(y,m+1,0)).getUTCDate();
const rng=()=>{const d=D(anc),y=d.getUTCFullYear(),m=d.getUTCMonth();if(vw==="w"){const s=addD(anc,-dow(anc));return[s,addD(s,6)]}if(vw==="m")return[y+"-"+pad(m+1)+"-01",y+"-"+pad(m+1)+"-"+pad(dim(y,m))];if(vw==="y")return[y+"-01-01",y+"-12-31"];return null};
const inR=(t,R)=>{if(!R)return true;const k=dk(tms(t));return k>=R[0]&&k<=R[1]};
function ttl(){const d=D(anc);if(vw==="m")return MN[d.getUTCMonth()]+" "+d.getUTCFullYear();if(vw==="y")return""+d.getUTCFullYear();if(vw==="a")return"Barcha vaqt";const s=D(addD(anc,-dow(anc))),e=D(addD(anc,6-dow(anc)));return s.getUTCDate()+" "+MS[s.getUTCMonth()]+" – "+e.getUTCDate()+" "+MS[e.getUTCMonth()]+" "+e.getUTCFullYear()}
const cell=(k,o)=>'<button class="cd '+dcl(o)+(k===selDay?" sel":"")+(k===todayK()?" tod":"")+'" data-k="'+k+'"><span class="dn">'+D(k).getUTCDate()+"</span>"+(o?"<b>"+fv(o.s,1)+"</b><small>"+o.n+" savdo</small>":"<em>—</em>")+"</button>";
function calHTML(days){const d=D(anc),y=d.getUTCFullYear(),m=d.getUTCMonth(),W7=wk||Object.keys(days).some(k=>dow(k)>4&&(vw==="m"?k.slice(0,7)===y+"-"+pad(m+1):vw==="w"?k>=addD(anc,-dow(anc))&&k<=addD(anc,6-dow(anc)):false)),c=W7?7:5,head='<div class="cg c'+c+'">'+WD.slice(0,c).map(x=>'<span class="wd">'+x+"</span>").join("")+"</div>";
 if(vw==="m"){const cs=[];for(let i=1;i<=dim(y,m);i++){const k=y+"-"+pad(m+1)+"-"+pad(i),w=dow(k);if(!W7&&w>4)continue;if(!cs.length)for(let j=0;j<w;j++)cs.push("<i></i>");cs.push(cell(k,days[k]))}return head+'<div class="cg c'+c+'">'+cs.join("")+"</div>"}
 if(vw==="w"){const s=addD(anc,-dow(anc)),cs=[];for(let i=0;i<c;i++){const k=addD(s,i);cs.push(cell(k,days[k]))}return head+'<div class="cg c'+c+'">'+cs.join("")+"</div>"}
 if(vw==="y"){let h='<div class="yg">';for(let mm=0;mm<12;mm++){const cs=[];let tot=0,cnt=0;for(let i=1;i<=dim(y,mm);i++){const k=y+"-"+pad(mm+1)+"-"+pad(i),o=days[k];if(!cs.length)for(let j=0;j<dow(k);j++)cs.push("<u></u>");cs.push('<i class="dt '+dcl(o)+'"></i>');if(o){tot+=o.s;cnt+=o.n}}
   h+='<button class="mini" data-m="'+mm+'"><b>'+MS[mm]+'</b><div class="mg">'+cs.join("")+'</div><span class="'+cl(tot)+'">'+(cnt?fv(tot,1):"—")+"</span></button>"}return h+"</div>"}
 const mo={};Object.keys(days).forEach(k=>{const q=k.slice(0,7),o=mo[q]=mo[q]||{s:0,n:0};o.s+=days[k].s;o.n+=days[k].n});const ks=Object.keys(mo).sort().reverse(),mx=Math.max(1e-9,...ks.map(q=>Math.abs(mo[q].s)));
 return ks.length?ks.map(q=>'<div class="ab"><span>'+MN[+q.slice(5)-1].slice(0,3)+" "+q.slice(0,4)+'</span><div class="abb"><i class="'+(mo[q].s>=0?"g":"r")+'" style="width:'+Math.max(4,Math.abs(mo[q].s)/mx*100)+'%"></i></div><b class="'+cl(mo[q].s)+'">'+fv(mo[q].s,1)+"</b></div>").join(""):'<div class="mute">Hali savdo yo‘q.</div>'}
const grp=(T,f)=>{const o={};T.forEach(t=>f(t).forEach(k=>{const x=o[k]=o[k]||{n:0,w:0,r:0};x.n++;if(oc(t)==="w")x.w++;x.r+=val(t)}));return o};
function streak(T){const s=T.slice().sort((a,b)=>tms(a)-tms(b));let bw=0,bl=0,cw=0,cL=0,cur=0,ty="";s.forEach(t=>{const c=oc(t);if(c==="w"){cw++;cL=0;bw=Math.max(bw,cw)}else if(c==="l"){cL++;cw=0;bl=Math.max(bl,cL)}});
 for(let i=s.length-1;i>=0;i--){const c=oc(s[i]);if(c==="d")continue;if(!ty)ty=c;if(c===ty)cur++;else break}return{cur,ty,bw,bl}}
function ring(w,l){const n=w+l,C=2*Math.PI*42,g=w&&l?5:0;let h='<svg viewBox="0 0 110 110" class="donut"><circle cx="55" cy="55" r="42" fill="none" stroke="var(--line)" stroke-width="11"/>';
 const arc=(c,len,off)=>'<circle cx="55" cy="55" r="42" fill="none" stroke="'+c+'" stroke-width="11" stroke-dasharray="'+Math.max(0,len)+" "+C+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 55 55)"/>';
 if(n){const a=w/n*C,b=l/n*C;if(w)h+=arc("#16a34a",a-g,0);if(l)h+=arc("#dc2626",b-g,a)}
 return h+'<text x="55" y="55" text-anchor="middle" class="dv">'+(n?Math.round(w/n*100)+"%":"—")+'</text><text x="55" y="69" text-anchor="middle" class="dl">Win rate</text><text x="55" y="80" text-anchor="middle" class="ds">'+n+" savdo</text></svg>"}
function spark(T){const s=T.filter(t=>oc(t)!=="d").sort((a,b)=>tms(a)-tms(b));if(s.length<10)return'<div class="foot">Win rate trendi uchun kamida 10 ta savdo kerak.</div>';
 const r=[];for(let i=9;i<s.length;i++){let c=0;for(let j=i-9;j<=i;j++)if(oc(s[j])==="w")c++;r.push(c*10)}
 const X=i=>r.length>1?i*300/(r.length-1):150,Y=v=>52-v/100*48;
 return'<span class="lbl">Win rate trendi (oxirgi 10 savdo oynasi)</span><svg viewBox="0 0 300 56" width="100%" height="56" preserveAspectRatio="none" style="margin-top:6px"><line x1="0" x2="300" y1="'+Y(50)+'" y2="'+Y(50)+'" style="stroke:var(--line)" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/><polyline fill="none" style="stroke:var(--nyam)" stroke-width="2.4" stroke-linejoin="round" vector-effect="non-scaling-stroke" points="'+r.map((v,i)=>X(i).toFixed(1)+","+Y(v).toFixed(1)).join(" ")+'"/></svg><div class="foot">Hozirgi: '+r[r.length-1]+"% · punktir chiziq: 50%</div>"}
const rowH=(t,i)=>{const k=oc(t),has=mt==="r"||(t.u!==undefined&&t.u!==null),v=val(t),w=t.ts?new Date(wall(t.ts,tz)):null,tm=w?pad(w.getUTCHours())+":"+pad(w.getUTCMinutes())+" · ":"";
 return'<div class="tr '+k+'"><div class="tl"><div class="t1">'+(k==="d"?"":'<span class="bdg '+k+'">'+(k==="w"?TP:SL)+"</span>")+"<b>"+esc(t.p)+'</b><span class="sd">'+esc(t.s)+"</span></div><small>"+tm+esc(kzs(t.kz))+" · "+esc(t.d)+"</small>"+(t.nt?'<div class="nt">'+esc(t.nt)+"</div>":"")+(t.mi&&t.mi.length?'<div class="mb">Xato: '+t.mi.map(esc).join(" · ")+"</div>":"")+'</div><div class="tv"><b class="'+cl(v)+'">'+(has?fv(v,1):"—")+'</b><button class="x xd" data-i="'+i+'" aria-label="O‘chirish">'+IC("x")+"</button></div></div>"};
function renderJr(){
 document.querySelectorAll("#vw button").forEach(b=>b.classList.toggle("on",b.dataset.v===vw));
 document.querySelectorAll("#mt button").forEach(b=>b.classList.toggle("on",b.dataset.v===mt));
 const days=mapDays(),R=rng(),T=trades.filter(t=>inR(t,R)),n=T.length,w=T.filter(t=>oc(t)==="w").length,l=T.filter(t=>oc(t)==="l").length,tot=T.reduce((a,t)=>a+val(t),0);
 $("jttl").textContent=ttl();$("jprev").style.visibility=$("jnext").style.visibility=vw==="a"?"hidden":"visible";
 $("jwk").style.display=(vw==="m"||vw==="w")?"":"none";
 $("jcal").innerHTML=calHTML(days);
 $("jwk").textContent="Shanba/Yakshanba: "+(wk?"ko‘rinadi":$("jcal").innerHTML.includes("cg c7")?"ko‘rinadi (savdo bor)":"yashirin");
 $("jtot").textContent=fv(tot,1);$("jtot").className="big "+cl(tot);
 const st=streak(T),g=grp(T,t=>[t.kz]),bk=Object.keys(g).filter(k=>g[k].r>0).sort((a,c)=>g[c].r-g[a].r)[0];
 $("jstk").innerHTML='<span class="lbl" style="margin:0">Seriya</span><div class="big2 '+(st.ty==="w"?"pos":st.ty==="l"?"neg":"")+'">'+(st.cur||"—")+"<small> "+(st.ty==="w"?TP:st.ty==="l"?SL:"")+'</small></div><div class="foot">Eng uzun: '+st.bw+" TP · "+st.bl+' SL</div><div class="foot">Eng yaxshi: '+(bk?esc(kzs(bk))+" "+fv(g[bk].r,1):"—")+"</div>";
 const vs=T.filter(t=>oc(t)==="w").map(val),vl=T.filter(t=>oc(t)==="l").map(val),gw=vs.reduce((a,v)=>a+v,0),gl=-vl.reduce((a,v)=>a+v,0),aw=w?gw/w:0,al=l?gl/l:0,pf=gl?gw/gl:(gw>0?Infinity:0),rr=al?aw/al:(aw>0?Infinity:0),ex=(w+l)?(gw-gl)/(w+l):0,pc=v=>(w+l)?" <small>"+Math.round(v/(w+l)*100)+"%</small>":"",inf=v=>v===Infinity?"∞":v.toFixed(2);
 $("dn").innerHTML=ring(w,l);
 $("leg").innerHTML='<div class="lg"><i style="background:#16a34a"></i>'+TP+"<b>"+w+pc(w)+'</b></div><div class="lg"><i style="background:#dc2626"></i>'+SL+"<b>"+l+pc(l)+"</b></div>";
 $("kpi").innerHTML='<div><b class="'+(pf>=1?"pos":(w+l)?"neg":"")+'">'+((w+l)?inf(pf):"—")+'</b>Profit Factor</div><div><b>'+((w+l)?inf(rr):"—")+'</b>Foyda/Zarar nisbati</div><div><b class="'+cl(ex)+'">'+((w+l)?fv(ex,1):"—")+'</b>Kutilgan natija</div><div><b class="pos">'+(w?fv(aw):"—")+'</b>O‘rt. foyda</div><div><b class="neg">'+(l?fv(-al):"—")+'</b>O‘rt. zarar</div><div><b>'+n+'</b>Savdolar</div>';
 $("wsp").innerHTML=spark(T);
 const dd=$("dayd");
 if(selDay){const o=days[selDay],dl=trades.map((t,i)=>[t,i]).filter(([t])=>dk(tms(t))===selDay),dt=D(selDay);dd.classList.remove("hide");
  dd.innerHTML='<div class="dhd"><b>'+dt.getUTCDate()+"-"+MS[dt.getUTCMonth()]+", "+DNs[dt.getUTCDay()]+'</b><span class="'+cl(o?o.s:0)+'">'+(o?fv(o.s,1):"")+"</span></div>"+(dl.length?dl.map(([t,i])=>rowH(t,i)).join(""):'<div class="mute">Bu kunda savdo yo‘q.</div>')+'<button class="wide" data-add="'+selDay+'" style="margin:8px 0 0">'+IC("plus")+"Savdo qo‘shish</button>"}else dd.classList.add("hide");
 const L2=trades.map((t,i)=>[t,i]).filter(([t])=>inR(t,R)).sort((a,c)=>tms(c[0])-tms(a[0])).slice(0,40);
 $("list").innerHTML=L2.length?L2.map(([t,i])=>rowH(t,i)).join(""):'<div class="mute">Hali savdo yo‘q.</div>';
 renderStats()}
const shift=n=>{const d=D(anc);if(vw==="w")d.setUTCDate(d.getUTCDate()+7*n);else if(vw==="m"){d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+n)}else if(vw==="y")d.setUTCFullYear(d.getUTCFullYear()+n);anc=K(d);selDay=null;renderJr()};
$("jprev").onclick=()=>shift(-1);$("jnext").onclick=()=>shift(1);
$("vw").onclick=e=>{const b=e.target.closest("button");if(b){vw=b.dataset.v;selDay=null;renderJr()}};
$("mt").onclick=e=>{const b=e.target.closest("button");if(b){mt=b.dataset.v;sv("mt",mt);renderJr()}};
$("jwk").onclick=()=>{wk=!wk;sv("wk",wk);renderJr()};
$("jr").onclick=e=>{const t=e.target;let b;
 if(b=t.closest(".cd")){selDay=b.dataset.k;renderJr();return}
 if(b=t.closest(".mini")){anc=anc.slice(0,5)+pad(+b.dataset.m+1)+"-01";vw="m";renderJr();return}
 if(b=t.closest(".xd")){trades.splice(+b.dataset.i,1);sv("tr",trades);renderJr();return}
 if(b=t.closest("[data-add]")){openForm(b.dataset.add)}};
/* ---- qalqib chiquvchi tanlov oynasi ---- */
function renderPick(){const o=pk.opts;$("pop").innerHTML=o.length?o.map(([v,l,d])=>{const on=pk.multi?pk.sel.has(v):String(pk.sel)===String(v);return'<button class="zr'+(on?" sel":"")+'" data-p="'+esc(String(v))+'"><span><b>'+esc(l)+"</b>"+(d?"<small>"+esc(d)+"</small>":"")+"</span>"+(on?IC("check"):"")+"</button>"}).join(""):'<div class="mute">Ro‘yxat bo‘sh. Sozlamada qo‘shing.</div>'}
function openPick(title,opts,cur,cb,multi){pk={opts,cb,multi,sel:multi?new Set(cur):cur};$("ptl").textContent=title;$("pok").classList.toggle("hide",!multi);renderPick();$("pick").classList.remove("hide")}
$("pop").onclick=e=>{const b=e.target.closest("[data-p]");if(!b||!pk)return;const o=pk.opts.find(x=>String(x[0])===b.dataset.p),v=o[0];if(pk.multi){pk.sel.has(v)?pk.sel.delete(v):pk.sel.add(v);renderPick()}else{$("pick").classList.add("hide");pk.cb(v)}};
$("pok").onclick=()=>{$("pick").classList.add("hide");pk.cb(pk.sel)};
$("pbd").onclick=()=>$("pick").classList.add("hide");
/* ---- savdo kiritish oynasi ---- */
function chips(){$("fml").textContent=fmi.size?[...fmi].join(", "):"Xato yo‘q";
 $("emi").innerHTML=MI.map((x,i)=>'<span class="ch">'+esc(x)+'<button class="cx" data-i="'+i+'" aria-label="O‘chirish">×</button></span>').join("")}
$("emi").onclick=e=>{const b=e.target.closest(".cx");if(b){MI.splice(+b.dataset.i,1);sv("mi",MI);chips()}};
$("ami").onclick=()=>{const v=$("nmi").value.trim();if(v&&!MI.includes(v)){MI.push(v);sv("mi",MI);$("nmi").value="";chips()}};
function openForm(k){$("td").value=k;$("tt").value=nowT();const d=D(k);$("tdt").textContent=d.getUTCDate()+"-"+MS[d.getUTCMonth()]+" "+d.getUTCFullYear()+", "+DNs[d.getUTCDay()];$("tm").classList.remove("hide")}
$("fab").onclick=()=>openForm(selDay||todayK());
$("tbd").onclick=$("tclose").onclick=()=>$("tm").classList.add("hide");
$("fmb").onclick=()=>openPick("Xatolar",MI.map(m=>[m,m]),fmi,s=>{fmi=new Set(s);chips()},true);
$("side").onclick=e=>{const b=e.target.closest("button");if(!b)return;side=b.dataset.v;document.querySelectorAll("#side button").forEach(x=>x.classList.toggle("on",x===b))};
$("out").onclick=e=>{const b=e.target.closest("button");if(!b)return;outc=b.dataset.v;document.querySelectorAll("#out button").forEach(x=>x.classList.toggle("on",x===b))};
$("add").onclick=()=>{const rv=Math.abs(parseFloat($("res").value)),uv=Math.abs(parseFloat($("usd").value));
 if(isNaN(rv)&&isNaN(uv)){toast("P&L ($) yoki R kiriting");return}
 if(!$("td").value||!$("tt").value){toast("Sana va vaqtni kiriting");return}
 const ts=toUTC($("td").value,$("tt").value,tz),dd=new Date(ts),i=nyInfo(dd),nm=mins(dd,NY),k=mkt(i.dow,nm).open?KZ.find(x=>act(x,nm)):null,sg=outc==="w"?1:-1;
 trades.unshift({ts,p:$("pair").value.trim().toUpperCase()||"—",s:side,out:outc,r:sg*(isNaN(rv)?0:rv),u:isNaN(uv)?undefined:sg*uv,kz:k?k.n:"Kill zone tashqarida",nt:$("note").value.trim(),mi:[...fmi],d:i.date+" "+hm(nm)+" NY"});
 sv("tr",trades);["res","usd","note"].forEach(id=>$(id).value="");fmi=new Set();chips();$("tm").classList.add("hide");selDay=dk(ts);anc=selDay;renderJr();toast("Saqlandi")};
/* ---- statistika ---- */
const SPO=[[7,"Oxirgi 7 kun"],[30,"Oxirgi 30 kun"],[90,"Oxirgi 90 kun"],[365,"Oxirgi 1 yil"],[0,"Hammasi"]],CMO=[["d","Kunlik","Oxirgi 30 sessiya (Du–Ju)"],["w","Haftalik","Oxirgi 12 hafta"],["m","Oylik","Oxirgi 12 oy"],["a","Hammasi","Barcha savdolar"]],ANO=[["kz","Sessiya (kill zone)","Qaysi sessiyada natija yaxshi"],["dw","Hafta kuni","Qaysi kun samarali"],["hr","Soat (New York)","Qaysi soatda yaxshi savdo qilasiz"],["mi","Xatolar","Takrorlanadigan xatolar va ularning narxi"]],MTO=[["r","R (risk birligi)"],["u","$ (dollar)"]];
$("fp1").onclick=()=>openPick("Davr",SPO,sp,v=>{sp=+v;sv("sp",sp);renderStats()});
$("fp2").onclick=()=>openPick("Birlik",MTO,mt,v=>{mt=v;sv("mt",mt);renderJr()});
$("fp3").onclick=()=>openPick("Grafik davri",CMO,cm,v=>{cm=v;sv("cm",cm);renderStats()});
$("fp4").onclick=()=>openPick("Tahlil turi",ANO,an,v=>{an=v;sv("an",an);renderStats()});
function series(){const days=mapDays(),tk=todayK(),L=[];let c=0;
 if(cm==="d"){let k=tk;const ks=[];while(ks.length<30){if(dow(k)<5)ks.unshift(k);k=addD(k,-1)}ks.forEach(k=>{c+=(days[k]||{s:0}).s;L.push({k,v:c})});return{L,sub:"Oxirgi 30 sessiya (Du–Ju)"}}
 if(cm==="w"){const mon=addD(tk,-dow(tk));for(let i=11;i>=0;i--){const s=addD(mon,-7*i);for(let j=0;j<7;j++)c+=(days[addD(s,j)]||{s:0}).s;L.push({k:s,v:c})}return{L,sub:"Oxirgi 12 hafta"}}
 if(cm==="m"){const d=D(tk);for(let i=11;i>=0;i--){const q=K(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()-i,1))).slice(0,7);Object.keys(days).forEach(k=>{if(k.slice(0,7)===q)c+=days[k].s});L.push({k:q+"-01",v:c})}return{L,sub:"Oxirgi 12 oy"}}
 trades.slice().sort((a,b)=>tms(a)-tms(b)).forEach(t=>{c+=val(t);L.push({k:dk(tms(t)),v:c})});return{L,sub:"Barcha savdolar"}}
function ticks(lo,hi,n){const raw=(hi-lo)/n,mg=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/mg,st=(f<=1?1:f<=2?2:f<=5?5:10)*mg,t=[];for(let v=Math.ceil(lo/st)*st;v<=hi+1e-9;v+=st)t.push(Math.round(v/st)*st);return t}
function drawPnl(){const{L,sub}=series(),el=$("pnl"),n=L.length,last=n?L[n-1].v:0;let pk_=0,mdd=0;
 const dd=L.map(p=>{pk_=Math.max(pk_,p.v);const x=p.v-pk_;mdd=Math.min(mdd,x);return x});
 $("pbig").textContent=fv(last,1);$("pbig").className="big "+cl(last);$("psub").textContent=sub;$("pmdd").textContent="Maks. drawdown: "+fv(mdd);
 if(n<2||L.every(p=>p.v===0)){el.innerHTML='<div class="mute">Grafik uchun savdo ma’lumoti kerak.</div>';$("ddc").innerHTML="";return}
 const W=Math.max(260,el.clientWidth||320),H=210,Lm=40,Rm=10,Tm=10,Bm=22,vs=L.map(p=>p.v);let lo=Math.min(0,...vs),hi=Math.max(0,...vs);const sp_=(hi-lo)||1;lo-=sp_*.06;hi+=sp_*.06;
 const X=i=>Lm+i*(W-Lm-Rm)/(n-1),Y=v=>Tm+(hi-v)*(H-Tm-Bm)/(hi-lo),y0=Y(0),tk=ticks(lo,hi,4),f=v=>Math.abs(v)>=1000?(v/1000).toFixed(1)+"k":(Number.isInteger(v)?v:v.toFixed(1)),lab=p=>cm==="m"?MS[+p.k.slice(5,7)-1]:p.k.slice(8,10)+"."+p.k.slice(5,7);
 const ln=L.map((p,i)=>(i?"L":"M")+X(i).toFixed(1)+" "+Y(p.v).toFixed(1)).join(" "),ar=ln+" L"+X(n-1).toFixed(1)+" "+y0.toFixed(1)+" L"+X(0).toFixed(1)+" "+y0.toFixed(1)+"Z";
 const lx=[...new Set([0,Math.round((n-1)/4),Math.round((n-1)/2),Math.round(3*(n-1)/4),n-1])];
 el.innerHTML='<svg viewBox="0 0 '+W+" "+H+'" width="'+W+'" height="'+H+'"><defs><linearGradient id="gg" gradientUnits="userSpaceOnUse" x1="0" y1="'+Tm+'" x2="0" y2="'+y0+'"><stop offset="0" style="stop-color:#16a34a;stop-opacity:.5"/><stop offset="1" style="stop-color:#16a34a;stop-opacity:.03"/></linearGradient><linearGradient id="gr" gradientUnits="userSpaceOnUse" x1="0" y1="'+y0+'" x2="0" y2="'+(H-Bm)+'"><stop offset="0" style="stop-color:#dc2626;stop-opacity:.03"/><stop offset="1" style="stop-color:#dc2626;stop-opacity:.5"/></linearGradient><clipPath id="cg"><rect x="0" y="0" width="'+W+'" height="'+y0+'"/></clipPath><clipPath id="cr"><rect x="0" y="'+y0+'" width="'+W+'" height="'+(H-y0)+'"/></clipPath></defs>'
  +tk.map(v=>'<line x1="'+Lm+'" x2="'+(W-Rm)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'" style="stroke:var(--line)"/><text x="'+(Lm-6)+'" y="'+(Y(v)+3).toFixed(1)+'" text-anchor="end" class="ax">'+f(v)+"</text>").join("")
  +'<line x1="'+Lm+'" x2="'+(W-Rm)+'" y1="'+y0.toFixed(1)+'" y2="'+y0.toFixed(1)+'" style="stroke:var(--mute)" stroke-dasharray="4 4"/>'
  +'<path d="'+ar+'" fill="url(#gg)" clip-path="url(#cg)"/><path d="'+ar+'" fill="url(#gr)" clip-path="url(#cr)"/>'
  +'<path d="'+ln+'" fill="none" style="stroke:var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>'
  +lx.map(i=>'<text x="'+X(i).toFixed(1)+'" y="'+(H-6)+'" text-anchor="'+(i===0?"start":i===n-1?"end":"middle")+'" class="ax">'+lab(L[i])+"</text>").join("")
  +'<line id="pcl" y1="'+Tm+'" y2="'+(H-Bm)+'" style="stroke:var(--mute);display:none" stroke-dasharray="3 3"/><circle id="pcc" r="5" style="fill:var(--card);stroke:var(--ink);display:none" stroke-width="2"/></svg>';
 const mv=e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,i=Math.max(0,Math.min(n-1,Math.round((x-Lm)/((W-Lm-Rm)/(n-1))))),p=L[i],cx=X(i),a=$("pcl"),b=$("pcc"),tp=$("ptip");
  a.setAttribute("x1",cx);a.setAttribute("x2",cx);a.style.display="";b.setAttribute("cx",cx);b.setAttribute("cy",Y(p.v));b.style.display="";
  tp.textContent=lab(p)+" · "+fv(p.v,1)+" · DD "+fv(dd[i]);tp.classList.remove("hide");tp.style.left=Math.max(70,Math.min(r.width-70,cx*r.width/W))+"px"};
 el.onpointermove=mv;el.onpointerdown=mv;
 const H2=72,mn=Math.min(...dd),Y2=v=>6+(v/(mn*1.15))*(H2-14),d2=dd.map((v,i)=>(i?"L":"M")+X(i).toFixed(1)+" "+Y2(v).toFixed(1)).join(" ");
 $("ddc").innerHTML=mdd<0?'<svg viewBox="0 0 '+W+" "+H2+'" width="'+W+'" height="'+H2+'"><path d="'+d2+" L"+X(n-1).toFixed(1)+" 6 L"+X(0).toFixed(1)+' 6Z" style="fill:#dc2626;fill-opacity:.28"/><path d="'+d2+'" fill="none" style="stroke:#dc2626" stroke-width="1.8" stroke-linejoin="round"/><line x1="'+Lm+'" x2="'+(W-Rm)+'" y1="6" y2="6" style="stroke:var(--mute)"/><text x="'+(Lm-6)+'" y="10" text-anchor="end" class="ax">0</text><text x="'+(Lm-6)+'" y="'+(Y2(mn)+3).toFixed(1)+'" text-anchor="end" class="ax">'+f(+mn.toFixed(2))+"</text></svg>":'<div class="mute">Bu davrda drawdown bo‘lmagan.</div>'}
function bars(o,sort,lab){const ks=Object.keys(o);if(!ks.length)return'<div class="mute">Ma’lumot yo‘q</div>';ks.sort(sort||((a,b)=>o[b].r-o[a].r));const mx=Math.max(1e-9,...ks.map(k=>Math.abs(o[k].r)));
 return ks.map(k=>{const x=o[k];return'<div class="br"><div class="bh"><b>'+esc(lab?lab(k):k)+"</b><span>"+x.n+" savdo · win rate "+Math.round(x.w/x.n*100)+"%"+(x.n<5?'<i class="few">kam</i>':"")+'</span><em class="'+cl(x.r)+'">'+fv(x.r,1)+'</em></div><div class="bt"><i class="'+(x.r>=0?"g":"r")+'" style="width:'+Math.max(3,Math.abs(x.r)/mx*100)+'%"></i></div></div>'}).join("")}
const bestLine=(o,lab)=>{const k=Object.keys(o).filter(k=>o[k].n>=3).sort((a,b)=>o[b].r-o[a].r)[0];return k&&o[k].r>0?'<div class="foot" style="margin-top:8px">Eng yaxshi: <b>'+esc(lab?lab(k):k)+"</b> · "+fv(o[k].r,1)+"</div>":""};
function renderStats(){
 $("fv1").textContent=SPO.find(o=>o[0]===sp)[1];$("fv2").textContent=mt==="u"?"$ (dollar)":"R (risk)";$("fv3").textContent=CMO.find(o=>o[0]===cm)[1];$("fv4").textContent=ANO.find(o=>o[0]===an)[1];
 const T=trades.filter(t=>!sp||tms(t)>Date.now()-sp*864e5),n=T.length,DW=["Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba","Yakshanba"];
 $("swarn").innerHTML=n<20?'<div class="warn"><b>Ma’lumot kam:</b> tahlil davrida '+n+' ta savdo bor. Ishonchli xulosa uchun kamida 20–30 ta kerak.</div>':"";
 let h="";
 if(an==="kz"){const g=grp(T,t=>[t.kz||"—"]);h=bars(g,null,kzs)+bestLine(g,kzs)}
 else if(an==="dw"){const g=grp(T,t=>[DNs[new Date(wall(tms(t),tz)).getUTCDay()]]);h=bars(g,(a,b)=>DW.indexOf(a)-DW.indexOf(b))+bestLine(g)}
 else if(an==="hr"){const g=grp(T,t=>[t.d.slice(11,13)+":00"]);h=bars(g,(a,b)=>a<b?-1:1)+bestLine(g)}
 else{const mo={};T.forEach(t=>(t.mi||[]).forEach(m=>{const x=mo[m]=mo[m]||{n:0,w:0,r:0};x.n++;if(oc(t)==="w")x.w++;x.r+=val(t)}));
  const wm=T.filter(t=>t.mi&&t.mi.length),nm=T.filter(t=>!(t.mi&&t.mi.length)),wp=a=>a.length?Math.round(a.filter(t=>oc(t)==="w").length/a.length*100)+"%":"—",worst=Object.keys(mo).sort((a,b)=>mo[a].r-mo[b].r)[0];
  h=wm.length?(worst&&mo[worst].r<0?'<div class="hl">Eng qimmat xato: <b>'+esc(worst)+"</b> · "+fv(mo[worst].r,1)+" ("+mo[worst].n+" marta)</div>":"")+'<div class="cmp"><div><b>'+wp(nm)+"</b>Xatosiz savdolar win rate ("+nm.length+')</div><div><b>'+wp(wm)+"</b>Xatoli savdolar win rate ("+wm.length+")</div></div>"+bars(mo,(a,b)=>mo[a].r-mo[b].r):'<div class="mute">Hali xato belgilanmagan. Savdo qo‘shganda “Xatolar” maydonidan belgilang.</div>'}
 $("an").innerHTML=h;drawPnl()}
window.addEventListener("resize",()=>{if(!$("stats").classList.contains("hide"))drawPnl()});

/* ---- risk va zaxira ---- */
function calc(){const b=+$("bal").value,r=+$("rk").value,sl=+$("sl").value,p=+$("pv").value;sv("calc",[b,r,sl,p]);
 document.querySelectorAll("#rkc .ch").forEach(c=>c.classList.toggle("on",+c.dataset.r===r));
 if(!(b>0&&r>0&&sl>0&&p>0)){$("rres").innerHTML='<div class="empty" style="margin:0;border:0;padding:8px"><span class="ib">'+IC("calc")+"</span><b>Natija shu yerda chiqadi</b><small>Balans, risk, stop-loss va pip qiymatini kiriting</small></div>";return}
 const risk=b*r/100,lot=risk/(sl*p),m=v=>"$"+v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
 $("rres").innerHTML=(r>3?'<div class="warn" style="margin-bottom:12px"><b>Yuqori risk:</b> bitta savdoda hisobning '+r+'% xavf ostida. Odatda 0.5–2% tavsiya etiladi.</div>':"")
  +'<span class="lbl">Tavsiya etilgan lot</span><div class="lotv">'+lot.toFixed(2)+"<small> lot</small></div>"
  +'<div class="rrow"><div><b>'+m(risk)+'</b>Risk summasi</div><div><b>'+(lot*10).toFixed(1)+'</b>Mini lot</div><div><b>'+(lot*100).toFixed(0)+'</b>Mikro lot</div></div>'
  +'<div class="rt"><div class="rth">Maqsad foyda (Risk : Foyda)</div>'+[1,2,3].map(k=>'<div class="rtr"><span>1 : '+k+" · "+(sl*k)+' pips</span><b>+'+m(risk*k)+"</b></div>").join("")+'</div><div class="foot" style="margin-top:8px">1 pip = '+m(lot*p)+" (shu lot bilan)</div>"}
$("rkc").innerHTML=[0.5,1,2,3].map(x=>'<button class="ch" data-r="'+x+'">'+x+"%</button>").join("");
$("rkc").onclick=e=>{const b=e.target.closest("[data-r]");if(b){$("rk").value=b.dataset.r;calc()}};
{const c=ld("calc",[1000,1,10,10]);["bal","rk","sl","pv"].forEach((id,i)=>{$(id).value=c[i]||"";$(id).oninput=calc});calc()}
$("exp").onclick=()=>{const s=JSON.stringify({kz:KZ,ss:SS.map(y=>[y.s,y.e]),tr:trades,nw:mine,mi:MI});$("bk").value=s;try{navigator.clipboard.writeText(s)}catch(e){}$("bkm").textContent="Nusxalandi. Telegram “Saved messages” ga joylab qo‘ying.";toast("Nusxalandi")};
$("imp").onclick=()=>{try{const o=JSON.parse($("bk").value);
 if(o.kz&&o.kz.length===4){KZ=o.kz;sv("kz",KZ)}if(Array.isArray(o.ss))o.ss.forEach((v,i)=>{if(SS[i]&&v){SS[i].s=v[0];SS[i].e=v[1]}});sv("ss",SS.map(y=>[y.s,y.e]));
 if(Array.isArray(o.tr)){trades=o.tr;sv("tr",trades)}if(Array.isArray(o.mi)){MI=o.mi;sv("mi",MI)}if(Array.isArray(o.nw)){mine=o.nw.filter(n=>n.ts);sv("nw",mine)}
 eKZ();eSS();buildTL();renderJr();renderCal();tick();$("bkm").textContent="Tiklandi.";toast("Tiklandi")}catch(e){$("bkm").textContent="Matn noto‘g‘ri.";toast("Matn noto‘g‘ri")}};

/* ---- GitHub baza ---- */
function applyData(o){if(o.kz&&o.kz.length===4){KZ=o.kz;sv("kz",KZ)}if(Array.isArray(o.ss))o.ss.forEach((v,i)=>{if(SS[i]&&v){SS[i].s=v[0];SS[i].e=v[1]}});sv("ss",SS.map(y=>[y.s,y.e]));
 if(Array.isArray(o.tr)){trades=o.tr;sv("tr",trades)}if(Array.isArray(o.mi)){MI=o.mi;sv("mi",MI)}if(Array.isArray(o.nw)){mine=o.nw.filter(n=>n.ts);fixIds();sv("nw",mine)}chips();eKZ();eSS();buildTL();renderJr();renderCal();tick()}
$("imp").onclick=()=>{try{applyData(JSON.parse($("bk").value));$("bkm").textContent="Tiklandi.";toast("Tiklandi")}catch(e){$("bkm").textContent="Matn noto‘g‘ri.";toast("Matn noto‘g‘ri")}};
const GH={o:ld("gho","mrgaffarov"),r:ld("ghr","killzone-data"),t:ld("ght","")},GP_OLD="data/killzone-data.json";
["gho","ghr","ght"].forEach(id=>{$(id).value=GH[id[2]];$(id).onchange=()=>{GH[id[2]]=$(id).value.trim();sv(id,GH[id[2]]);renderBaza()}});
const b64=s=>btoa(unescape(encodeURIComponent(s))),unb64=s=>decodeURIComponent(escape(atob(s.replace(/\s/g,""))));
const ghf=p=>"https://api.github.com/repos/"+GH.o+"/"+GH.r+"/contents/"+p,ghm=t=>{$("ghm").textContent=t};
const ghh=raw=>{const h={Accept:raw?"application/vnd.github.raw+json":"application/vnd.github+json"};if(GH.t)h.Authorization="Bearer "+GH.t;return h};
const hsh=x=>{let h=5381;for(let i=0;i<x.length;i++)h=((h<<5)+h+x.charCodeAt(i))|0;return String(h)};
let GC=ld("ghc",{});
const monthsOf=()=>{const m={};trades.forEach(t=>{const k=(t.d||"").slice(0,7)||dk(tms(t)).slice(0,7);(m[k]=m[k]||[]).push(t)});return m};
const pack=(k,a)=>JSON.stringify({v:1,oy:k,savdolar:a.slice().sort((x,y)=>tms(x)-tms(y))},null,1);
const setsPack=()=>JSON.stringify({v:1,vaqtlar:KZ,sessiyalar:SS.map(y=>[y.s,y.e]),xatolar:MI,yangiliklar:mine,afzalliklar:{birlik:mt,hafta_oxiri:wk,davr:sp,tahlil:an,grafik:cm,mavzu:th,soat12:h12,tovush:snd,ogohlantirish:pre,zona:tz,utc:cu}},null,1);
function statPack(ts){const mm=monthsOf(),agg=a=>{let tp=0,sl=0,r=0,u=0,gwR=0,glR=0,gwU=0,glU=0;a.forEach(t=>{const c=oc(t);if(c==="w")tp++;else if(c==="l")sl++;const rv=+t.r||0,uv=+t.u||0;r+=rv;u+=uv;if(rv>0)gwR+=rv;else glR-=rv;if(uv>0)gwU+=uv;else glU-=uv});const n=tp+sl;
  return{savdo:a.length,tp,sl,winrate:n?+(tp/n*100).toFixed(1):null,pnl_r:+r.toFixed(2),pnl_usd:+u.toFixed(2),profit_factor_r:glR?+(gwR/glR).toFixed(2):null,profit_factor_usd:glU?+(gwU/glU).toFixed(2):null}},oy={};
 Object.keys(mm).sort().forEach(k=>oy[k]=agg(mm[k]));const o={v:1,eslatma:"Savdolardan hisoblangan xulosa. Ilova uni o‘qimaydi, faqat GitHub’da ko‘rish uchun.",jami:agg(trades),oylar:oy};if(ts)o.yangilangan=new Date().toISOString();return JSON.stringify(o,null,1)}
function applySets(o){if(o.vaqtlar&&o.vaqtlar.length===4){KZ=o.vaqtlar;sv("kz",KZ)}
 if(Array.isArray(o.sessiyalar)){o.sessiyalar.forEach((v,i)=>{if(SS[i]&&v){SS[i].s=v[0];SS[i].e=v[1]}});sv("ss",SS.map(y=>[y.s,y.e]))}
 if(Array.isArray(o.xatolar)){MI=o.xatolar;sv("mi",MI)}
 if(Array.isArray(o.yangiliklar)){mine=o.yangiliklar.filter(n=>n.ts);fixIds();sv("nw",mine)}
 const a=o.afzalliklar||{};
 if(a.birlik){mt=a.birlik;sv("mt",mt)}if(a.hafta_oxiri!==undefined){wk=a.hafta_oxiri;sv("wk",wk)}if(a.davr!==undefined){sp=a.davr;sv("sp",sp)}if(a.tahlil){an=a.tahlil;sv("an",an)}if(a.grafik){cm=a.grafik;sv("cm",cm)}
 if(a.mavzu){th=a.mavzu;sv("th",th);applyTh()}if(a.soat12!==undefined){h12=a.soat12;sv("h12",h12);$("h24").checked=!h12}if(a.tovush!==undefined){snd=a.tovush;sv("snd",snd);$("snd").checked=snd}if(a.ogohlantirish!==undefined){pre=a.ogohlantirish;sv("pre",pre);$("pre").value=pre}
 if(a.utc!==undefined){cu=a.utc;sv("cu",cu)}if(a.zona){tz=a.zona;if(fx(tz)===null&&!ZN.some(z=>z[0]===tz))tz="Asia/Tashkent";sv("tz",tz)}refreshTz()}
const refreshAll=()=>{chips();eKZ();eSS();buildTL();renderJr();renderCal();tick()};
const ghErr=e=>{const m=String(e&&e.message||e);return m==="401"?"Token noto‘g‘ri.":m==="403"?"Ruxsat yo‘q (token huquqini tekshiring).":m==="404"?"Omborxona topilmadi (nom yoki token huquqini tekshiring).":/^\d+$/.test(m)?"Xato: "+m:"Internet yo‘q yoki ulanmadi."};
async function ghPut(path,content,msg,hkey){const key=hsh(hkey===undefined?content:hkey),c=GC[path];if(c&&c.h===key)return"o‘zgarmagan";let sha=c&&c.sha;
 for(let a=0;a<2;a++){const body={message:msg,content:b64(content)};if(sha)body.sha=sha;
  const r=await fetch(ghf(path),{method:"PUT",headers:{...ghh(),"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(r.ok){const j=await r.json();GC[path]={h:key,sha:j.content.sha};sv("ghc",GC);return"yangilandi"}
  if((r.status===409||r.status===422)&&a===0){const g=await fetch(ghf(path),{headers:ghh()});sha=g.ok?(await g.json()).sha:undefined;continue}
  throw new Error(r.status)}}
async function ghSave0(force){if(!GH.t){ghm("Avval tokenni kiriting.");return}if(force){GC={};sv("ghc",GC)}ghm("Saqlanmoqda…");const L=[];
 try{const mm=monthsOf(),keys=new Set(Object.keys(mm));Object.keys(GC).forEach(p=>{const m=p.match(/^data\/savdolar\/(\d{4}-\d{2})\.json$/);if(m)keys.add(m[1])});
  for(const k of [...keys].sort()){L.push(k+".json — "+await ghPut("data/savdolar/"+k+".json",pack(k,mm[k]||[]),"Savdolar "+k+" yangilandi"))}
  L.push("sozlamalar.json — "+await ghPut("data/sozlamalar.json",setsPack(),"Sozlamalar yangilandi"));
  L.push("statistika.json — "+await ghPut("data/statistika.json",statPack(true),"Statistika yangilandi",statPack(false)));
  const ch=L.filter(x=>x.endsWith("yangilandi")).length;ghm(ch+" fayl yangilandi, "+(L.length-ch)+" fayl o‘zgarmagan.");sv("ghlast",Date.now());toast("GitHub’ga saqlandi")}
 catch(e){ghm((L.length?L.join("\n")+"\n":"")+ghErr(e))}}
$("ghsave").onclick=()=>ghSave(false);$("ghfull").onclick=()=>ghSave(true);
async function ghRestore(){ghm("Yuklanmoqda…");
 try{const get=(p,raw)=>fetch(ghf(p),{headers:ghh(raw),cache:"no-store"});
  const ls=await get("data/savdolar"),st=await get("data/sozlamalar.json");
  if(!ls.ok&&!st.ok){const old=await get(GP_OLD);
   if(old.ok){applyData(JSON.parse(unb64((await old.json()).content)));renderBaza();ghm("Eski formatdan tiklandi. Endi “Saqlash” yangi tuzilmada yozadi.");toast("Tiklandi");return}
   ghm("Hali saqlanmagan yoki omborxona topilmadi (private bo‘lsa token kerak).");return}
  let all=[],nf=0;
  if(ls.ok){const files=(await ls.json()).filter(f=>/^\d{4}-\d{2}\.json$/.test(f.name)),res=await Promise.all(files.map(async f=>{const r=await get(f.path,true);if(!r.ok)throw new Error(r.status);const tx=await r.text();GC[f.path]={h:hsh(tx),sha:f.sha};return JSON.parse(tx).savdolar||[]}));res.forEach(a=>{all=all.concat(a);nf++})}
  if(ls.ok){trades=all;sv("tr",trades)}
  if(st.ok){const j=await st.json(),tx=unb64(j.content);GC["data/sozlamalar.json"]={h:hsh(tx),sha:j.sha};applySets(JSON.parse(tx))}
  sv("ghc",GC);refreshAll();renderBaza();ghm("GitHub’dan tiklandi: "+all.length+" ta savdo ("+nf+" oy fayli)"+(st.ok?", sozlamalar":"")+".");toast("Tiklandi")}
 catch(e){ghm(ghErr(e))}};

async function ghSave(force){$("ghsave").disabled=true;try{await ghSave0(force)}finally{$("ghsave").disabled=false;renderBaza()}}
$("ghload").onclick=()=>openPick("Tiklashni tasdiqlang",[["y","Ha, tiklash","Shu qurilmadagi savdolar GitHub’dagi bilan almashtiriladi"],["n","Bekor qilish"]],"n",v=>{if(v==="y")ghRestore()});
$("ghshow").onchange=e=>{$("ght").type=e.target.checked?"text":"password"};
const ago=t=>{const d=new Date(t),n=new Date();return d.toDateString()===n.toDateString()?pad(d.getHours())+":"+pad(d.getMinutes()):pad(d.getDate())+"."+pad(d.getMonth()+1)};
function renderBaza(){const ok=!!(GH.t&&GH.r&&GH.o),last=ld("ghlast",0),mm=monthsOf(),rows=[],chk=(p,key)=>!GC[p]?"y":GC[p].h===hsh(key)?"s":"o";
 $("ghs").textContent=ok?"GitHub bilan ulangan":"Ulanmagan";$("ghr2").textContent=ok?GH.o+"/"+GH.r:"Ulanish sozlamalarida token va omborxonani kiriting";
 Object.keys(mm).sort().reverse().forEach(k=>rows.push([k+".json","savdolar · "+mm[k].length+" ta savdo",chk("data/savdolar/"+k+".json",pack(k,mm[k]))]));
 rows.push(["sozlamalar.json","sozlamalar va yangiliklar",chk("data/sozlamalar.json",setsPack())]);
 rows.push(["statistika.json","faqat ko‘rish uchun",chk("data/statistika.json",statPack(false))]);
 const pend=rows.filter(r=>r[2]!=="s").length;
 $("gbd").textContent=!ok?"":pend?pend+" ta o‘zgargan":"Hammasi saqlangan";$("gbd").className="gbadge "+(pend?"warn":"okb");
 $("gsx").innerHTML="<div><b>"+trades.length+"</b>savdo</div><div><b>"+Object.keys(mm).length+"</b>oy fayli</div><div><b>"+(last?ago(last):"—")+"</b>oxirgi saqlash</div>";
 $("gfl").innerHTML=rows.map(r=>'<div class="fl2"><span class="ib">'+IC("db")+'</span><div class="fn"><b>'+r[0]+"</b><small>"+r[1]+'</small></div><span class="fchip st-'+r[2]+'">'+(r[2]==="s"?"Saqlangan":r[2]==="y"?"Yangi":"O‘zgargan")+"</span></div>").join("")}

/* ---- boshlash ---- */
$("ver").textContent="Versiya: v13";
applyTh();refreshTz();chips();eKZ();eSS();buildTL();tick();renderJr();renderCal();renderBaza();$("gcon").open=!GH.t;
setInterval(tick,1000);setInterval(buildTL,3600000);
