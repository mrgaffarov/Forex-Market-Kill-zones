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
 ["home","jr","tools","set"].forEach(id=>$(id).classList.toggle("hide",id!==b.dataset.t));
 if(b.dataset.t==="jr")renderJr();if(b.dataset.t==="tools")renderCal();window.scrollTo(0,0)});
document.querySelectorAll("#sub3 button").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("#sub3 button").forEach(x=>x.classList.toggle("on",x===b));
 ["cal","risk","bk"].forEach(p=>$("p-"+p).classList.toggle("hide",p!==b.dataset.p))});

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
function evCard(e,now){const f=e.f||"",p=e.p||"",a=e.a||"",na=num(a),nf=num(f);
 const ar=a&&!isNaN(na)&&!isNaN(nf)&&na!==nf?(na>nf?'<span class="up">▲</span>':'<span class="dn">▼</span>'):"";
 const df=(e.ts-now)/6e4;
 return'<div class="ev"><div class="evh"><b>'+esc(e.t)+'</b><button class="x" data-id="'+e.id+'" aria-label="O‘chirish">'+IC("x")+'</button></div>'
 +'<div class="evm">'+IC("clock").replace('class="ic"','class="ic s"')+fmt(e.ts)+(df>0?" · "+dur(df)+" qoldi":"")+'<span class="imp"><i></i><i></i><i></i></span></div>'
 +'<div class="ev3"><div><small>Haqiqiy '+ar+'</small><input class="ai" data-id="'+e.id+'" value="'+esc(a)+'" placeholder="—"></div><div><small>Prognoz</small><b>'+(esc(f)||"—")+'</b></div><div><small>Oldingi</small><b>'+(esc(p)||"—")+'</b></div></div></div>'}
function homeAlert(){const now=Date.now(),L=evList().filter(e=>{const df=(e.ts-now)/6e4;return df>-15&&df<=60}).slice(0,3);
 $("al").innerHTML=L.map(e=>{const df=(e.ts-now)/6e4;return'<div class="al"><span class="bd hot"></span><div class="alt"><b>'+esc(e.t)+'</b><small>'+fmt(e.ts)+" · "+(df>0?dur(df)+" qoldi":"hozir chiqdi")+'</small></div><div class="alp">'+(e.a?'<span>Haq. <b>'+esc(e.a)+'</b></span>':"")+(e.f?'<span>Prog. <b>'+esc(e.f)+'</b></span>':"")+(e.p?'<span>Old. <b>'+esc(e.p)+'</b></span>':"")+"</div></div>"}).join("");
 if(snd)L.forEach(e=>{const df=(e.ts-now)/6e4;if(df>0&&df<=60&&!fl[e.id+"a"]){fl[e.id+"a"]=1;beep()}if(df>0&&df<=5&&!fl[e.id+"b"]){fl[e.id+"b"]=1;beep()}})}
function renderCal(){const now=Date.now(),days={},today=new Date(wall(now,tz)).toISOString().slice(0,10);
 evList().forEach(e=>{const d=new Date(wall(e.ts,tz)).toISOString().slice(0,10);(days[d]=days[d]||[]).push(e)});
 const DN=["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"],MN=["yan","fev","mar","apr","may","iyn","iyl","avg","sen","okt","noy","dek"],K=Object.keys(days).sort();
 const ord=K.filter(k=>k>=today).concat(K.filter(k=>k<today).reverse());
 $("cal").innerHTML=ord.map(k=>{const dt=new Date(k+"T12:00:00Z");return'<div class="dh">'+DN[dt.getUTCDay()]+", "+dt.getUTCDate()+"-"+MN[dt.getUTCMonth()]+(k===today?" · bugun":"")+"</div>"+days[k].map(e=>evCard(e,now)).join("")}).join("")||'<div class="mute">Hali yangilik kiritilmagan.</div>';
 $("calu").textContent="Vaqt "+(fx(tz)!==null?"":tzName()+" ")+uo(tz)+" bo‘yicha kiritiladi. Yangilikka 1 soat qolganda Asosiy sahifada ogohlantirish chiqadi. Haqiqiy qiymatni chiqqach kartada yozasiz."}
$("cal").onclick=e=>{const b=e.target.closest(".x");if(b){mine=mine.filter(n=>n.id!==b.dataset.id);sv("nw",mine);renderCal();homeAlert()}};
$("cal").onchange=e=>{const i=e.target.closest(".ai");if(!i)return;const n=mine.find(x=>x.id===i.dataset.id);if(n){n.a=i.value.trim();sv("nw",mine);renderCal();homeAlert();toast("Saqlandi")}};
const toUTC=(d,t,z)=>{const[y,m,dd]=d.split("-").map(Number),[h,mi]=t.split(":").map(Number),g=Date.UTC(y,m-1,dd,h,mi);let u=g-(wall(g,z)-g);u=g-(wall(u,z)-u);return u};
$("nadd").onclick=()=>{if(!$("nd").value||!$("ntm").value||!$("nt").value.trim()){toast("Sana, vaqt va nomni kiriting");return}
 mine.push({id:"e"+Date.now()+Math.floor(Math.random()*1e3),ts:toUTC($("nd").value,$("ntm").value,tz),t:$("nt").value.trim(),f:$("nfc").value.trim(),p:$("npv").value.trim(),a:""});sv("nw",mine);$("nt").value="";$("nfc").value="";$("npv").value="";renderCal();homeAlert();toast("Qo‘shildi")};
$("nd").value=new Date(wall(Date.now(),tz)).toISOString().slice(0,10);

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
 
 
 homeAlert();if(sheetOpen())renderSheet()}

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
let outc="w",per=0;
const tms=t=>t.ts||Date.parse(t.d.slice(0,10)+"T12:00:00Z"),inPer=t=>!per||tms(t)>Date.now()-per*864e5;
const grp=(T,f)=>{const o={};T.forEach(t=>f(t).forEach(k=>{const x=o[k]=o[k]||{n:0,w:0,r:0};x.n++;if(t.r>0)x.w++;x.r+=t.r}));return o};
const f1=n=>(n>0?"+":"")+n.toFixed(1);
const tb=(o,h)=>Object.keys(o).length?'<table><tr><th>'+h+'</th><th>Savdo</th><th>Gʻalaba</th><th>R</th></tr>'+Object.keys(o).sort().map(k=>'<tr><td>'+esc(k)+'</td><td>'+o[k].n+'</td><td>'+Math.round(o[k].w/o[k].n*100)+'%</td><td class="'+(o[k].r>=0?"pos":"neg")+'">'+f1(o[k].r)+"</td></tr>").join("")+"</table>":'<div class="mute">Ma’lumot yo‘q</div>';
function donut(w,l,b,n){const C=2*Math.PI*40;let off=0,h='<svg viewBox="0 0 100 100" class="donut"><circle cx="50" cy="50" r="40" fill="none" stroke="var(--line)" stroke-width="12"/>';
 if(n)[[w,"var(--on)"],[l,"var(--bad)"],[b,"var(--mute)"]].forEach(([v,c])=>{if(!v)return;const len=v/n*C;h+='<circle cx="50" cy="50" r="40" fill="none" stroke="'+c+'" stroke-width="12" stroke-dasharray="'+len+" "+(C-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 50 50)"/>';off+=len});
 return h+'<text x="50" y="50" text-anchor="middle" class="dv">'+(n?Math.round(w/n*100)+"%":"—")+'</text><text x="50" y="63" text-anchor="middle" class="dl">Gʻalaba</text></svg>'}
function renderJr(){const T=trades.filter(inPer),n=T.length,w=T.filter(t=>t.r>0).length,l=T.filter(t=>t.r<0).length,b=n-w-l,sum=T.reduce((a,t)=>a+t.r,0),gw=T.filter(t=>t.r>0).reduce((a,t)=>a+t.r,0),gl=-T.filter(t=>t.r<0).reduce((a,t)=>a+t.r,0),pc=v=>n?" ("+Math.round(v/n*100)+"%)":"";
 $("dn").innerHTML=donut(w,l,b,n);
 $("leg").innerHTML='<div class="lg"><i style="background:var(--on)"></i>Gʻalaba<b>'+w+pc(w)+'</b></div><div class="lg"><i style="background:var(--bad)"></i>Magʻlubiyat<b>'+l+pc(l)+'</b></div><div class="lg"><i style="background:var(--mute)"></i>Durrang<b>'+b+pc(b)+"</b></div>";
 $("kpi").innerHTML='<div><b>'+n+'</b>Savdolar</div><div><b class="'+(sum>=0?"pos":"neg")+'">'+f1(sum)+'R</b>Jami</div><div><b>'+(n?f1(sum/n)+"R":"—")+'</b>O‘rtacha</div>';
 let c=0;const pts=T.slice().reverse().map(t=>c+=t.r);let svg='<div class="mute">Kamida 2 ta savdo kerak</div>';
 if(pts.length>1){const mn=Math.min(0,...pts),mx=Math.max(0,...pts),rg=(mx-mn)||1,p=pts.map((v,i)=>(i/(pts.length-1)*300).toFixed(1)+","+(90-(v-mn)/rg*90).toFixed(1)).join(" "),z=(90+mn/rg*90).toFixed(1);
  svg='<svg viewBox="0 0 300 90" width="100%" height="90" preserveAspectRatio="none"><line x1="0" x2="300" y1="'+z+'" y2="'+z+'" stroke="var(--line)"/><polyline fill="none" stroke="var(--nyam)" stroke-width="2" points="'+p+'"/></svg>'}
 const DN=["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"],ac=(t,body)=>'<details class="card"><summary>'+t+'</summary><div style="margin-top:10px">'+body+"</div></details>";
 $("jan").innerHTML=ac("Equity (jami R)",svg)+ac("Kill zone bo‘yicha",tb(grp(T,t=>[t.kz]),"Kill zone"))+ac("Hafta kuni",tb(grp(T,t=>[DN[new Date(t.d.slice(0,10)+"T12:00:00Z").getUTCDay()]]),"Kun"))+ac("Soat (NY)",tb(grp(T,t=>[t.d.slice(11,13)+":00"]),"Soat"))+ac("Teglar",tb(grp(T,t=>t.tg||[]),"Teg"))+ac("Profit factor",'<b style="font-size:1.2rem">'+(gl?(gw/gl).toFixed(2):"—")+"</b>");
 const L=trades.map((t,i)=>[t,i]).filter(([t])=>inPer(t)).slice(0,40);
 $("list").innerHTML=L.length?L.map(([t,i])=>{const k=t.r>0?"w":t.r<0?"l":"d";return'<div class="tr '+k+'"><div><span class="bdg '+k+'">'+(k==="w"?"Gʻalaba":k==="l"?"Magʻlubiyat":"Durrang")+"</span><b>"+esc(t.p)+"</b> "+esc(t.s)+"<small>"+esc(t.kz)+" · "+esc(t.d)+(t.nt?" · "+esc(t.nt):"")+(t.tg&&t.tg.length?" · #"+esc(t.tg.join(" #")):"")+'</small></div><div><b class="'+(t.r>0?"pos":t.r<0?"neg":"")+'">'+f1(t.r)+'R</b><button class="x" data-i="'+i+'" aria-label="O‘chirish">'+IC("x")+"</button></div></div>"}).join(""):'<div class="mute">Hali savdo yo‘q.</div>'}
$("list").onclick=e=>{const b=e.target.closest(".x");if(b){trades.splice(+b.dataset.i,1);sv("tr",trades);renderJr()}};
$("per").onclick=e=>{const b=e.target.closest("button");if(!b)return;per=+b.dataset.d;document.querySelectorAll("#per button").forEach(x=>x.classList.toggle("on",x===b));renderJr()};
$("jnew").onclick=()=>$("jform").classList.toggle("hide");
$("side").onclick=e=>{const b=e.target.closest("button");if(!b)return;side=b.dataset.v;document.querySelectorAll("#side button").forEach(x=>x.classList.toggle("on",x===b))};
$("out").onclick=e=>{const b=e.target.closest("button");if(!b)return;outc=b.dataset.v;document.querySelectorAll("#out button").forEach(x=>x.classList.toggle("on",x===b));$("resw").classList.toggle("hide",outc==="d")};
$("add").onclick=()=>{const v=Math.abs(parseFloat($("res").value));if(outc!=="d"&&isNaN(v)){$("res").focus();toast("R miqdorini kiriting");return}
 const d=new Date(),i=nyInfo(d),M=mkt(i.dow,mins(d,NY)),k=M.open?KZ.find(x=>act(x,mins(d,NY))):null;
 trades.unshift({ts:Date.now(),p:$("pair").value.trim().toUpperCase()||"—",s:side,r:outc==="w"?v:outc==="l"?-v:0,kz:k?k.n:"Kill zone tashqarida",nt:$("note").value.trim(),tg:$("tags").value.split(",").map(x=>x.trim().toLowerCase()).filter(Boolean),d:i.date+" "+hm(mins(d,NY))+" NY"});
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

/* ---- GitHub baza ---- */
function applyData(o){if(o.kz&&o.kz.length===4){KZ=o.kz;sv("kz",KZ)}if(Array.isArray(o.ss))o.ss.forEach((v,i)=>{if(SS[i]&&v){SS[i].s=v[0];SS[i].e=v[1]}});sv("ss",SS.map(y=>[y.s,y.e]));
 if(Array.isArray(o.tr)){trades=o.tr;sv("tr",trades)}if(Array.isArray(o.nw)){mine=o.nw.filter(n=>n.ts);fixIds();sv("nw",mine)}eKZ();eSS();buildTL();renderJr();renderCal();tick()}
$("imp").onclick=()=>{try{applyData(JSON.parse($("bk").value));$("bkm").textContent="Tiklandi.";toast("Tiklandi")}catch(e){$("bkm").textContent="Matn noto‘g‘ri.";toast("Matn noto‘g‘ri")}};
const GH={o:ld("gho","mrgaffarov"),r:ld("ghr","killzone-data"),t:ld("ght","")},GP="data/killzone-data.json";
["gho","ghr","ght"].forEach(id=>{$(id).value=GH[id[2]];$(id).onchange=()=>{GH[id[2]]=$(id).value.trim();sv(id,GH[id[2]])}});
const b64=s=>btoa(unescape(encodeURIComponent(s))),unb64=s=>decodeURIComponent(escape(atob(s.replace(/\s/g,""))));
const snap=()=>JSON.stringify({app:"killzone",saved:new Date().toISOString(),kz:KZ,ss:SS.map(y=>[y.s,y.e]),tr:trades,nw:mine},null,1);
const ghu=()=>"https://api.github.com/repos/"+GH.o+"/"+GH.r+"/contents/"+GP,ghm=t=>{$("ghm").textContent=t};
const ghh=()=>{const h={Accept:"application/vnd.github+json"};if(GH.t)h.Authorization="Bearer "+GH.t;return h};
$("ghsave").onclick=async()=>{if(!GH.t){ghm("Avval tokenni kiriting.");return}ghm("Saqlanmoqda…");
 try{let sha;const g=await fetch(ghu(),{headers:ghh(),cache:"no-store"});if(g.ok)sha=(await g.json()).sha;else if(g.status!==404){ghm(g.status===401?"Token noto‘g‘ri.":g.status===403?"Ruxsat yo‘q (token huquqini tekshiring).":"Xato: "+g.status);return}
  const r=await fetch(ghu(),{method:"PUT",headers:{...ghh(),"Content-Type":"application/json"},body:JSON.stringify({message:"Ma’lumot saqlandi "+new Date().toISOString().slice(0,16),content:b64(snap()),sha})});
  if(r.ok){ghm("GitHub’ga saqlandi.");toast("GitHub’ga saqlandi")}else ghm(r.status===404?"Omborxona topilmadi (nom yoki token huquqini tekshiring).":r.status===401||r.status===403?"Ruxsat yo‘q.":"Xato: "+r.status)}catch(e){ghm("Internet yo‘q yoki ulanmadi.")}};
$("ghload").onclick=async()=>{ghm("Yuklanmoqda…");try{const g=await fetch(ghu(),{headers:ghh(),cache:"no-store"});
 if(g.status===404){ghm("Hali saqlanmagan yoki omborxona topilmadi (private bo‘lsa token kerak).");return}if(!g.ok){ghm("Xato: "+g.status);return}
 applyData(JSON.parse(unb64((await g.json()).content)));ghm("GitHub’dan tiklandi.");toast("Tiklandi")}catch(e){ghm("Tiklab bo‘lmadi.")}};

/* ---- boshlash ---- */
$("ver").textContent="Versiya: v8";
applyTh();refreshTz();eKZ();eSS();buildTL();tick();renderJr();renderCal();
setInterval(tick,1000);setInterval(buildTL,3600000);
