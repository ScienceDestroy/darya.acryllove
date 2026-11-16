"use strict";
/* =========================================================
   Palette Creator — интерфейс.
   Геометрия и рисование — в engine.js.
   ========================================================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const deep=o=>JSON.parse(JSON.stringify(o));

/* ---------- шрифты ---------- */
const FONTS=[
  ["Современные",[["Montserrat, Arial, sans-serif","Montserrat"],["Inter, Arial, sans-serif","Inter"],["Manrope, Arial, sans-serif","Manrope"],["Rubik, Arial, sans-serif","Rubik"],["Jost, Arial, sans-serif","Jost"],["Nunito, Arial, sans-serif","Nunito"],["Comfortaa, Arial, sans-serif","Comfortaa"],["Unbounded, Arial, sans-serif","Unbounded"]]],
  ["Рукописные",[["Caveat, cursive","Caveat"],["'Marck Script', cursive","Marck Script"],["'Bad Script', cursive","Bad Script"],["Neucha, cursive","Neucha"],["'Dancing Script', cursive","Dancing Script"],["'Great Vibes', cursive","Great Vibes"],["Pacifico, cursive","Pacifico"],["'Amatic SC', cursive","Amatic SC"]]],
  ["С засечками",[["'Playfair Display', Georgia, serif","Playfair Display"],["Cormorant, Georgia, serif","Cormorant"],["Lora, Georgia, serif","Lora"],["Georgia, serif","Georgia"],["'Times New Roman', serif","Times"]]],
  ["Классические",[["Arial, sans-serif","Arial"],["Helvetica, Arial, sans-serif","Helvetica"],["Verdana, sans-serif","Verdana"],["'Trebuchet MS', sans-serif","Trebuchet"],["'Courier New', monospace","Courier"]]]
];

/* ---------- готовые паттерны ---------- */
const P=(w,h,inner,bg)=>`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${bg?`<rect width='${w}' height='${h}' fill='${bg}'/>`:""}${inner}</svg>`;
const PRESET_PATTERNS=[
  {name:"Горошек",size:26,svg:P(26,26,`<g fill='#f191b4'><circle cx='13' cy='13' r='3.2'/><circle cx='0' cy='0' r='3.2'/><circle cx='26' cy='0' r='3.2'/><circle cx='0' cy='26' r='3.2'/><circle cx='26' cy='26' r='3.2'/></g>`)},
  {name:"Клетка",size:26,svg:P(26,26,`<path d='M26 0H0V26' fill='none' stroke='#a8cdec' stroke-width='1'/>`)},
  {name:"Линии",size:16,svg:P(14,14,`<path d='M-2 2 L6 -6 M0 14 L14 0 M8 16 L16 8' stroke='#c9b4e6' stroke-width='1.5' fill='none'/>`)},
  {name:"Волны",size:40,svg:P(40,14,`<path d='M0 7 Q10 1 20 7 T40 7' fill='none' stroke='#79ccc4' stroke-width='1.5'/>`)},
  {name:"Зигзаг",size:28,svg:P(24,12,`<path d='M0 12 L12 4 L24 12' fill='none' stroke='#f0a35a' stroke-width='1.5'/>`)},
  {name:"Цветочки",size:46,svg:P(46,46,`<g fill='none' stroke='#ef94b6' stroke-width='1.4'><circle cx='23' cy='13' r='4.2'/><circle cx='33' cy='20' r='4.2'/><circle cx='29' cy='32' r='4.2'/><circle cx='17' cy='32' r='4.2'/><circle cx='13' cy='20' r='4.2'/></g><circle cx='23' cy='23' r='3' fill='#f4bf46'/>`)},
  {name:"Листья",size:44,svg:P(44,44,`<g stroke='#7bb98d' stroke-width='1.3' fill='none'><path d='M10 40 C 20 30 24 18 22 6'/><path d='M22 14 C 16 12 12 14 12 20'/><path d='M22 22 C 28 20 32 22 32 28'/><path d='M22 30 C 16 28 13 30 13 36'/></g>`)},
  {name:"Веточки",size:30,svg:P(30,30,`<g stroke='#c7a86a' stroke-width='1.2' fill='none'><path d='M15 28 L15 6'/><path d='M15 12 L9 8 M15 12 L21 8 M15 18 L9 14 M15 18 L21 14 M15 24 L9 20 M15 24 L21 20'/></g>`)},
  {name:"Сердечки",size:28,svg:P(28,28,`<path d='M14 22 C 6 15 8 8 14 11 C 20 8 22 15 14 22 Z' fill='#f191b4'/>`)},
  {name:"Звёзды",size:30,svg:P(30,30,`<path d='M15 6 L17 12 L23 12 L18 16 L20 22 L15 18 L10 22 L12 16 L7 12 L13 12 Z' fill='#f4c04e'/>`)},
  {name:"Круги",size:30,svg:P(30,30,`<g fill='none' stroke='#c9b6e2' stroke-width='1.2'><circle cx='0' cy='15' r='12'/><circle cx='30' cy='15' r='12'/><circle cx='15' cy='0' r='12'/><circle cx='15' cy='30' r='12'/></g>`)},
  {name:"Терраццо",size:70,svg:P(70,70,`<circle cx='12' cy='16' r='5' fill='#f2b7c4'/><rect x='40' y='8' width='11' height='6' rx='3' fill='#a9d3c9' transform='rotate(20 45 11)'/><circle cx='58' cy='30' r='4' fill='#e9c56a'/><ellipse cx='26' cy='46' rx='6' ry='4' fill='#c9b6e2' transform='rotate(-15 26 46)'/><circle cx='50' cy='56' r='5' fill='#f0a58a'/><rect x='8' y='56' width='9' height='5' rx='2.5' fill='#9ec9e8'/><circle cx='62' cy='64' r='3' fill='#f2b7c4'/>`,"#fbf7f1")},
  {name:"Мемфис",size:60,svg:P(60,60,`<g fill='none' stroke-width='1.6'><path d='M6 12 q6 -8 12 0 t12 0' stroke='#7ec9c0'/><path d='M44 8 l8 0 M48 4 l0 8' stroke='#f0a35a'/><path d='M28 50 q6 -6 12 0' stroke='#9ec9e8'/></g><path d='M10 44 L18 44 L14 36 Z' fill='#efb0c2'/><circle cx='46' cy='40' r='3' fill='#c9b6e2'/><circle cx='54' cy='52' r='3' fill='#f4c04e'/>`)},
  {name:"Конфетти",size:48,svg:P(48,48,`<g stroke-width='2' stroke-linecap='round'><line x1='8' y1='8' x2='12' y2='14' stroke='#f191b4'/><line x1='34' y1='6' x2='40' y2='8' stroke='#7ec9c0'/><line x1='20' y1='22' x2='24' y2='18' stroke='#f4c04e'/><line x1='42' y1='26' x2='44' y2='32' stroke='#c9b6e2'/><line x1='10' y1='38' x2='16' y2='40' stroke='#f0a35a'/><line x1='30' y1='40' x2='34' y2='46' stroke='#9ec9e8'/></g>`)}
];
const patternUri=svg=>"data:image/svg+xml,"+encodeURIComponent(svg);

/* ---------- настройки по умолчанию ---------- */
const DEFAULT_DESIGN={
  paper:"A4",orient:"portrait",customW:210,customH:297,
  mT:10,mR:10,mB:10,mL:10,marginLink:true,showGuides:true,
  cols:2,stripW:0,rowH:16,gapX:0,gapY:0,hAlign:"left",order:"rows",
  border:"solid",borderW:0.25,corner:0,cropMarks:false,
  font:"Montserrat, Arial, sans-serif",fs:10,codeBold:false,codeItalic:false,nameBold:false,nameItalic:false,
  showCode:true,showName:true,codeIndent:14,nameIndent:34,autoFit:true,
  spots:1,spotSize:7,spotIndent:3,spotGap:1.5,spotShape:"circle",spotDash:true,
  ring:true,ringSize:5,ringIndent:3,
  line:false,lineX:24,vlineW:0.26,
  lineColor:"#c9c9c9",textColor:"#333333",nameColor:"#777777",
  bgImage:"",bgMode:"sheet",bgFit:"cover",bgOpacity:18,bgSize:100,bgPosX:50,bgPosY:50,bgRotate:0,bgTilePx:60
};
const DEFAULT_TRACKER={
  pageType:"tracker",layout:"single",paper:"A4",orient:"portrait",customW:210,customH:297,
  padTop:14,padBottom:14,padLeft:14,padRight:14,padLink:false,showGuides:false,cutLine:true,
  title:"Палитра раскраски",subtitle:"",titleFont:"'Great Vibes', cursive",titleSize:30,titleAlign:"center",
  sticker:true,stickerW:70,stickerH:26,
  fields:["Тема","Дата","Номер страницы","Заметки"],fieldFont:"Caveat, cursive",fieldSize:14,
  cols:3,rows:10,sqW:11,sqH:11,rectW:22,rectH:11,boxGap:4,boxR:0.5,
  punch:false,punchN:4,punchSide:"left",punchD:5,punchMargin:8,punchDist:"custom",punchGaps:"45, 65, 45",
  divImage:"",divFit:"contain",divBackTitle:"Отметь готовые раскраски",divCount:30,divCols:6,divCircle:12,divNumbered:true,
  divPadTop:0,divPadRight:0,divPadBottom:0,divPadLeft:0,divPadLink:true,
  font:"Montserrat, Arial, sans-serif",lineColor:"#cbb6c2",textColor:"#6b5563",accent:"#e59ab5",lineW:0.25
};
const DEFAULT_PRINT={sx:100,sy:100,ox:0,oy:0,uT:4,uR:4,uB:4,uL:4,uLink:true,showSafe:true,dpi:300,calPdf:true,tipsSeen:false};

let state={mode:"strips",markers:[],sets:[],design:deep(DEFAULT_DESIGN),tracker:deep(DEFAULT_TRACKER),print:deep(DEFAULT_PRINT),
  zoom:0.7,tab:{strips:"markers",tracker:"page"}};

/* ---------- сохранение ---------- */
const LS="palette_app_v1";
let saveT, warnedQuota=false;
function save(){ clearTimeout(saveT); saveT=setTimeout(saveNow,250); }
function saveNow(){
  try{ localStorage.setItem(LS,JSON.stringify({v:2,markers:state.markers,sets:state.sets,design:state.design,tracker:state.tracker,
    print:state.print,mode:state.mode,tab:state.tab})); }
  catch(e){ if(!warnedQuota){ warnedQuota=true; toast("Не хватает места для сохранения — скорее всего, слишком большая картинка"); } }
}
// перенос старых сохранений (v1) на новые поля
function migrateDesign(dd){
  dd={...dd};
  if(dd.mT===undefined){ const p=dd.pad??10; dd.mT=dd.mR=dd.mB=dd.mL=p; }
  if(dd.gapX===undefined){ const g=dd.gap??0; dd.gapX=dd.gapY=g; }
  if(typeof dd.border==="boolean") dd.border=dd.border?"solid":"none";
  if(dd.vlineW===undefined && dd.lineW!==undefined) dd.vlineW=Math.round(dd.lineW*PX*100)/100;
  if(dd.codeIndent===undefined){ dd.codeIndent=Math.max(10,dd.textIndent||14); dd.nameIndent=dd.codeIndent+20; }
  delete dd.pad; delete dd.gap; delete dd.lineW; delete dd.textIndent;
  return {...DEFAULT_DESIGN,...dd};
}
function migrateTracker(t,v){
  t={...t};
  if(t.padTop===undefined && t.pad!==undefined) t.padTop=t.padBottom=t.padLeft=t.padRight=t.pad;
  if(t.sqH===undefined){ const bh=t.boxH||11; t.sqH=bh; t.rectH=bh; }
  if(!v && t.boxR!==undefined) t.boxR=Math.round(t.boxR*PX*10)/10; // раньше было в пикселях
  if(!Array.isArray(t.fields)) t.fields=DEFAULT_TRACKER.fields.slice();
  return {...DEFAULT_TRACKER,...t};
}
function load(){
  try{
    const raw=localStorage.getItem(LS); if(!raw) return;
    const d=JSON.parse(raw);
    state.markers=(d.markers||[]).map(m=>({id:m.id||uid(),code:m.code||"",name:m.name||""}));
    state.sets=(d.sets||[]).map(s=>({id:s.id||uid(),name:s.name||"Набор",markers:s.markers||[]}));
    state.design=migrateDesign(d.design||{});
    state.tracker=migrateTracker(d.tracker||{},d.v);
    state.print={...DEFAULT_PRINT,...(d.print||{})};
    if(d.mode) state.mode=d.mode;
    if(d.tab) state.tab={...state.tab,...d.tab};
  }catch(e){ console.warn(e); }
}

/* ---------- мелочи ---------- */
let toastT;
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),2600); }
function applyTheme(t){ document.body.dataset.theme=t; try{localStorage.setItem("palette_theme",t);}catch(e){} }
function modal({title,html="",buttons=[{label:"Закрыть"}],onOpen}){
  $("#modalTitle").textContent=title; $("#modalBody").innerHTML=html;
  const foot=$("#modalFoot"); foot.innerHTML="";
  buttons.forEach(b=>{ const el=document.createElement("button"); el.className="btn"+(b.primary?" primary":"");
    el.textContent=b.label; el.onclick=()=>{ if(b.onClick && b.onClick()===false) return; closeModal(); }; foot.appendChild(el); });
  $("#modalBg").classList.add("show"); onOpen&&onOpen($("#modalBody"));
}
function closeModal(){ $("#modalBg").classList.remove("show"); }
function download(blob,name){
  const url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),15000);
}
function pickFile(accept){ return new Promise(res=>{ const inp=$("#fileInput"); inp.accept=accept; inp.value="";
  inp.onchange=()=>res(inp.files[0]||null); inp.click(); }); }
const readAs=(f,how)=>new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; how==="text"?r.readAsText(f):r.readAsDataURL(f); });
// уменьшаем фото, чтобы оно поместилось в память браузера (печать остаётся чёткой: 2400 px ≈ 290 dpi на A4)
async function loadImageFile(f,maxPx=2400){
  const url=await readAs(f,"url");
  if(/svg/.test(f.type)) return url;
  const im=await new Promise(r=>{const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src=url;});
  if(!im) return url;
  const k=Math.min(1,maxPx/Math.max(im.naturalWidth,im.naturalHeight));
  if(k===1 && url.length<1.5e6) return url;
  const cv=document.createElement("canvas"); cv.width=Math.round(im.naturalWidth*k); cv.height=Math.round(im.naturalHeight*k);
  const ctx=cv.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,cv.width,cv.height); ctx.drawImage(im,0,0,cv.width,cv.height);
  return cv.toDataURL("image/jpeg",0.9);
}

/* =========================================================
   Конструктор форм: поля описываются схемой, привязка — автоматически
   ========================================================= */
const num=(key,label,min,max,step=1,unit="мм",x={})=>({t:"num",key,label,min,max,step,unit,...x});
const sel=(key,label,opts,x={})=>({t:"sel",key,label,opts,...x});
const seg=(key,label,opts,x={})=>({t:"seg",key,label,opts,...x});
const tog=(key,label,x={})=>({t:"tog",key,label,...x});
const col=(key,label)=>({t:"col",key,label});
const txt=(key,label,ph="",x={})=>({t:"txt",key,label,ph,...x});
const area=(key,label,ph="",x={})=>({t:"area",key,label,ph,...x});
const font=(key,label)=>({t:"font",key,label});
const sides=(keys,label,link,max=60)=>({t:"sides",keys,label,link,max});
const row=(...fields)=>({t:"row",fields});
const chips=(label,items)=>({t:"chips",label,items});
const custom=(build)=>({t:"custom",build});
const PAPERS=[["A4","A4 · 210×297"],["A5","A5 · 148×210"],["A6","A6 · 105×148"],["A3","A3 · 297×420"],["Letter","Letter"],["custom","Свой размер"]];
const ORIENT=[["portrait","Книжная"],["landscape","Альбомная"]];

const forms=[]; // {root, refresh}
function buildForm(container,sections,getObj,onChange){
  const refreshers=[];
  const change=(key)=>{ onChange(key); refreshers.forEach(r=>r()); };
  const mk=(f)=>{
    const o=()=>getObj();
    const wrap=document.createElement("div");
    const vis=()=>{ if(f.show) wrap.style.display=f.show(o())?"":"none"; };
    switch(f.t){
      case "row": {
        wrap.className="frow"; f.fields.forEach(x=>wrap.appendChild(mk(x))); break;
      }
      case "num": {
        wrap.className="f";
        wrap.innerHTML=`<label><span>${f.label}</span><span class="nv"><input type="number" step="${f.step}" min="${f.min}" max="${f.max}" inputmode="decimal"><i>${f.unit}</i></span></label><input type="range" min="${f.min}" max="${f.max}" step="${f.step}">`;
        const n=$("input[type=number]",wrap), r=$("input[type=range]",wrap);
        const fill=()=>r.style.setProperty("--fill",((+r.value-f.min)/(f.max-f.min)*100)+"%");
        const set=(v,src)=>{ v=Math.round(v/f.step)*f.step; v=+v.toFixed(3); o()[f.key]=v; if(src!=="n") n.value=v; if(src!=="r") r.value=v; fill(); change(f.key); };
        r.oninput=()=>set(+r.value,"r");
        n.oninput=()=>{ const v=parseFloat(String(n.value).replace(",",".")); if(isNaN(v)) return; set(clamp(v,f.hardMin??f.min,f.hardMax??f.max*4),"n"); };
        n.onblur=()=>{ n.value=o()[f.key]; };
        refreshers.push(()=>{ if(document.activeElement!==n) n.value=o()[f.key]; r.value=o()[f.key]; fill(); });
        break;
      }
      case "sel": case "font": {
        wrap.className="f";
        wrap.innerHTML=`${f.label?`<label>${f.label}</label>`:""}<select></select>`;
        const s=$("select",wrap);
        s.innerHTML = f.t==="font"
          ? FONTS.map(([g,items])=>`<optgroup label="${g}">`+items.map(([v,l])=>`<option value="${esc(v)}" style="font-family:${esc(v)}">${l}</option>`).join("")+`</optgroup>`).join("")
          : f.opts.map(([v,l])=>`<option value="${esc(v)}">${l}</option>`).join("");
        s.onchange=()=>{ o()[f.key]=f.numeric?+s.value:s.value; change(f.key); };
        refreshers.push(()=>{ s.value=o()[f.key]; });
        break;
      }
      case "seg": {
        wrap.className="f";
        wrap.innerHTML=`${f.label?`<label>${f.label}</label>`:""}<div class="seg">${f.opts.map(([v,l])=>`<button type="button" data-v="${esc(v)}">${l}</button>`).join("")}</div>`;
        $$("button",wrap).forEach(b=>b.onclick=()=>{ o()[f.key]=f.numeric?+b.dataset.v:b.dataset.v; change(f.key); });
        refreshers.push(()=>$$("button",wrap).forEach(b=>b.classList.toggle("on",String(o()[f.key])===b.dataset.v)));
        break;
      }
      case "tog": {
        wrap.innerHTML=`<label class="toggle"><input type="checkbox"> ${f.label}</label>`;
        const c=$("input",wrap); c.onchange=()=>{ o()[f.key]=c.checked; change(f.key); };
        refreshers.push(()=>{ c.checked=!!o()[f.key]; });
        break;
      }
      case "col": {
        wrap.className="f"; wrap.innerHTML=`<label>${f.label}</label><input type="color">`;
        const c=$("input",wrap); c.oninput=()=>{ o()[f.key]=c.value; change(f.key); };
        refreshers.push(()=>{ c.value=o()[f.key]; });
        break;
      }
      case "txt": case "area": {
        wrap.className="f";
        wrap.innerHTML=`${f.label?`<label>${f.label}</label>`:""}${f.t==="txt"?`<input type="text" placeholder="${esc(f.ph)}">`:`<textarea rows="${f.rows||4}" placeholder="${esc(f.ph)}"></textarea>`}`;
        const c=$("input,textarea",wrap);
        c.oninput=()=>{ o()[f.key]=f.lines?c.value.split("\n").map(s=>s.trim()).filter(Boolean):c.value; change(f.key); };
        refreshers.push(()=>{ if(document.activeElement===c) return; const v=o()[f.key]; c.value=f.lines?(v||[]).join("\n"):(v??""); });
        break;
      }
      case "chips": {
        wrap.className="f";
        wrap.innerHTML=`<label>${f.label}</label><div class="chips">${f.items.map(([k,l,cls])=>`<button type="button" class="chip ${cls||""}" data-k="${k}">${l}</button>`).join("")}</div>`;
        $$("button",wrap).forEach(b=>b.onclick=()=>{ o()[b.dataset.k]=!o()[b.dataset.k]; change(b.dataset.k); });
        refreshers.push(()=>$$("button",wrap).forEach(b=>b.classList.toggle("on",!!o()[b.dataset.k])));
        break;
      }
      case "sides": {
        wrap.className="f";
        const names=["top","right","bottom","left"], titles=["Сверху","Справа","Снизу","Слева"];
        wrap.innerHTML=`<div class="lbl"><span>${f.label}</span><span class="count">мм</span></div><div class="sides">`
          +names.map((s,i)=>`<input class="s-${s}" type="number" step="0.5" min="0" max="${f.max}" title="${titles[i]}" inputmode="decimal">`).join("")
          +`<div class="s-page"><button type="button" class="s-link" title="Связать: менять все поля сразу">🔗</button></div></div>`;
        const ins=names.map(s=>$(".s-"+s,wrap)), link=$(".s-link",wrap), page=$(".s-page",wrap);
        ins.forEach((inp,i)=>inp.oninput=()=>{
          const v=parseFloat(String(inp.value).replace(",",".")); if(isNaN(v)) return;
          const val=clamp(v,0,f.max);
          if(o()[f.link]) f.keys.forEach((k,j)=>{ o()[k]=val; if(j!==i) ins[j].value=val; }); else o()[f.keys[i]]=val;
          change(f.keys[i]);
        });
        ins.forEach((inp,i)=>inp.onblur=()=>{ inp.value=o()[f.keys[i]]; });
        link.onclick=()=>{ o()[f.link]=!o()[f.link]; if(o()[f.link]){ const v=o()[f.keys[0]]; f.keys.forEach(k=>o()[k]=v); } change(f.keys[0]); };
        refreshers.push(()=>{
          ins.forEach((inp,i)=>{ if(document.activeElement!==inp) inp.value=o()[f.keys[i]]; });
          link.classList.toggle("on",!!o()[f.link]);
          ["--pt","--pr","--pb","--pl"].forEach((v,i)=>page.style.setProperty(v,Math.min(24,o()[f.keys[i]]*0.6+2)+"px"));
        });
        break;
      }
      case "custom": f.build(wrap,{o,change,refreshers}); break;
    }
    if(f.show) refreshers.push(vis);
    return wrap;
  };
  sections.forEach(sec=>{
    const el=document.createElement(sec.plain?"div":"details");
    el.className=sec.plain?"card":"sec"; if(!sec.plain && sec.open!==false) el.open=true;
    el.innerHTML=sec.plain?(sec.title?`<h3>${sec.title}</h3>`:""):`<summary>${sec.title}</summary>`;
    const body=document.createElement("div"); body.className=sec.plain?"":"sec-body";
    sec.fields.forEach(f=>body.appendChild(mk(f)));
    el.appendChild(body);
    if(sec.show) refreshers.push(()=>{ el.style.display=sec.show(getObj())?"":"none"; });
    container.appendChild(el);
  });
  const refresh=()=>refreshers.forEach(r=>r());
  forms.push({refresh}); refresh();
  return refresh;
}
const refreshForms=()=>forms.forEach(f=>f.refresh());

/* =========================================================
   Вкладки по режимам
   ========================================================= */
const TABS={
  strips:[["markers","Маркеры","🖊️"],["sets","Наборы","📚"],["sheet","Лист","📄"],["style","Ленточка","🎴"],["print","Печать","🖨️"]],
  tracker:[["page","Лист","📄"],["content","Содержимое","📋"],["style","Стиль","🎨"],["print","Печать","🖨️"]]
};
const panes={}; // `${mode}:${tab}` → element
function pane(mode,tab){ const el=document.createElement("div"); el.className="pane"; el.dataset.p=mode+":"+tab; el.style.display="none"; $("#panes").appendChild(el); panes[mode+":"+tab]=el; return el; }
function showTab(tab){
  state.tab[state.mode]=tab; save();
  $$("#tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  Object.entries(panes).forEach(([k,el])=>el.style.display = k===state.mode+":"+tab ? "" : "none");
  if(document.body.dataset.mview && document.body.dataset.mview!=="preview") setMView(tab);
}
function renderTabs(){
  const t=TABS[state.mode];
  $("#tabs").innerHTML=t.map(([k,l])=>`<button data-tab="${k}">${l}</button>`).join("");
  $$("#tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
  $("#mobileNav").innerHTML=t.map(([k,l,i])=>`<button data-m="${k}"><span class="ico">${i}</span>${l}</button>`).join("")+`<button data-m="preview"><span class="ico">👁️</span>Превью</button>`;
  $$("#mobileNav button").forEach(b=>b.onclick=()=>setMView(b.dataset.m));
  const cur=t.some(x=>x[0]===state.tab[state.mode])?state.tab[state.mode]:t[0][0];
  showTab(cur);
}
function setMView(v){
  document.body.dataset.mview=v;
  $$("#mobileNav button").forEach(b=>b.classList.toggle("active",b.dataset.m===v));
  if(v==="preview") requestAnimationFrame(fitWidth);
  else if(state.tab[state.mode]!==v){ state.tab[state.mode]=v; $$("#tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===v));
    Object.entries(panes).forEach(([k,el])=>el.style.display = k===state.mode+":"+v ? "" : "none"); }
}
function setMode(m){
  state.mode=m; save();
  $$("#modeSeg button").forEach(b=>b.classList.toggle("on",b.dataset.v===m));
  renderTabs(); render(); requestAnimationFrame(fitWidth);
}

/* ---------- общий обработчик изменений ---------- */
const onDesign=(k)=>{ save(); render(); if(k==="font") loadFont(state.design.font); };
const onTracker=(k)=>{ save(); render(); if(/font/i.test(k)) loadFont(state.tracker[k]); };
const onPrint=()=>{ save(); render(); };
function loadFont(fam){ if(!fam||!document.fonts) return; Promise.all([document.fonts.load(`16px ${fam}`),document.fonts.load(`italic 700 16px ${fam}`)]).then(()=>{ clearMetrics(); render(); }).catch(()=>{}); }

/* =========================================================
   ВЫКРАСКА: вкладки
   ========================================================= */
function buildStripsPanes(){
  /* --- Маркеры --- */
  const pm=pane("strips","markers");
  pm.innerHTML=`
    <div class="card"><h3>Добавить маркер</h3>
      <div class="mk-add"><input type="text" class="code" id="addCode" placeholder="Код"><input type="text" id="addName" placeholder="Название / бренд"></div>
      <button class="btn primary wide" id="btnAdd">Добавить</button>
      <p class="hint">Enter в поле кода — добавить. Название остаётся, удобно набивать серию кодов подряд.</p></div>
    <div class="card"><h3>Добавить много кодов</h3>
      <div class="f"><input type="text" id="bulkName" placeholder="Название для всех (напр. Languo)"></div>
      <div class="f"><textarea id="bulkCodes" rows="3" placeholder="B701, B702, G 202 или диапазон B701-750"></textarea></div>
      <button class="btn primary wide" id="btnBulk">Добавить все</button>
      <p class="hint" id="bulkHint"></p></div>
    <div class="card"><h3>Список <span class="count" id="mkCount"></span></h3>
      <div class="list-tools">
        <button class="btn sm" id="btnSort" title="Сортировать по коду (числа — по порядку)">↕ По коду</button>
        <button class="btn sm" id="btnDedup" title="Убрать повторяющиеся коды">Убрать повторы</button>
        <button class="btn sm danger" id="btnClear">Очистить</button>
      </div>
      <div class="mklist" id="mklist"></div>
      <p class="hint">Перетаскивайте ⋮⋮ для порядка. Нажмите на код или название, чтобы изменить — или прямо на листе в превью.</p></div>`;
  /* --- Наборы --- */
  const ps=pane("strips","sets");
  ps.innerHTML=`
    <div class="card"><h3>Мои наборы <span class="count" id="setCount"></span></h3>
      <div class="frow"><input type="text" id="setName" placeholder="Название набора"><button class="btn primary" id="btnSaveSet" style="flex:0 0 auto">Сохранить список</button></div>
      <p class="hint">Сохраняет текущий список маркеров как ваш набор.</p>
      <div id="setlist" style="margin-top:10px"></div>
      <div class="list-tools" style="margin-top:8px">
        <button class="btn sm" id="btnNewSet">＋ Набор из кодов</button>
        <button class="btn sm" id="btnSetsExport">⇩ Экспорт наборов</button>
        <button class="btn sm" id="btnSetsImport">⇧ Импорт</button>
      </div></div>`;
  /* --- Лист --- */
  buildForm(pane("strips","sheet"),[
    {title:"Формат листа",fields:[
      row(sel("paper","Формат",PAPERS),sel("orient","Ориентация",ORIENT,{show:d=>d.paper!=="custom"})),
      row(num("customW","Ширина",50,500,1,"мм",{show:d=>d.paper==="custom"}),num("customH","Высота",50,500,1,"мм",{show:d=>d.paper==="custom"})),
    ]},
    {title:"Поля листа",fields:[
      sides(["mT","mR","mB","mL"],"Отступы от края листа","marginLink"),
      tog("showGuides","Показывать границы полей на превью"),
      custom((w)=>{ w.innerHTML=`<p class="hint">Розовая зона на превью — область, которую принтер может не пропечатать. Её размер задаётся во вкладке «Печать».</p>`; }),
    ]},
    {title:"Сетка ленточек",fields:[
      row(num("cols","Колонок",1,8,1,"шт"),num("rowH","Высота",6,60,0.5)),
      num("stripW","Ширина ленточки (0 — на всю ширину)",0,200,0.5,"мм"),
      row(num("gapX","Зазор колонок",0,20,0.5),num("gapY","Зазор рядов",0,20,0.5)),
      row(seg("hAlign","По горизонтали",[["left","Слева"],["center","По центру"]]),seg("order","Порядок",[["rows","По рядам"],["cols","По колонкам"]])),
      custom((w,{refreshers})=>{ w.className="info"; refreshers.push(()=>{ const i=lastInfo; if(!i||state.mode!=="strips") return;
        w.innerHTML=`На странице: <b>${i.rowsPP}</b> рядов × <b>${i.cols}</b> = <b>${i.perPage}</b> ленточек<br>Ширина ленточки: <b>${i.sw.toFixed(1)} мм</b> · сетка ${i.gridW.toFixed(1)} из ${i.cW.toFixed(1)} мм`; }); }),
    ]},
    {title:"Линии и рез",fields:[
      seg("border","Рамка ленточки",[["solid","Сплошная"],["dashed","Пунктир"],["none","Нет"]]),
      row(num("borderW","Толщина линий",0.05,1.5,0.05),num("corner","Скругление",0,10,0.5)),
      col("lineColor","Цвет линий"),
      tog("cropMarks","Метки обрезки по краям сетки"),
      custom(w=>{ w.innerHTML=`<p class="hint">При нулевых зазорах соседние ленточки делят одну линию — режьте точно по ней. Метки обрезки помогают резать на резаке.</p>`; }),
    ]},
  ],()=>state.design,onDesign);
  /* --- Ленточка --- */
  buildForm(pane("strips","style"),[
    {title:"Текст",fields:[
      font("font","Шрифт"),
      row(num("fs","Размер",5,24,0.5,"pt"),tog("autoFit","Ужимать длинный текст")),
      row(tog("showCode","Код"),tog("showName","Название")),
      row(num("codeIndent","Сдвиг кода",0,150,0.5,"мм",{show:d=>d.showCode}),num("nameIndent","Сдвиг названия",0,150,0.5,"мм",{show:d=>d.showName})),
      row(chips("Код",[["codeBold","B"],["codeItalic","I","i"]]),chips("Название",[["nameBold","B"],["nameItalic","I","i"]])),
      row(col("textColor","Цвет кода"),col("nameColor","Цвет названия")),
    ]},
    {title:"Кружки под выкрас",fields:[
      row(num("spots","Кол-во",0,6,1,"шт"),seg("spotShape","Форма",[["circle","Круг"],["square","Квадрат"]])),
      row(num("spotSize","Размер",3,30,0.5),num("spotIndent","Отступ слева",0,60,0.5)),
      row(num("spotGap","Между кружками",0,20,0.5),tog("spotDash","Пунктир")),
    ]},
    {title:"Отверстие под кольцо",fields:[
      tog("ring","Показать отверстие"),
      row(num("ringSize","Диаметр",2,12,0.5,"мм",{show:d=>d.ring}),num("ringIndent","От правого края",0,60,0.5,"мм",{show:d=>d.ring})),
    ]},
    {title:"Вертикальная полоска",open:false,fields:[
      tog("line","Показать полоску"),
      row(num("lineX","От левого края",0,200,0.5,"мм",{show:d=>d.line}),num("vlineW","Толщина",0.05,2,0.05,"мм",{show:d=>d.line})),
    ]},
    {title:"Рисунок / паттерн",open:false,fields:[
      custom((w,{change,refreshers})=>{
        w.innerHTML=`<label class="f" style="display:block;font-size:12px;color:var(--muted);font-weight:600;margin-bottom:6px">Готовые паттерны</label><div class="bg-gallery"></div>
          <div class="bg-drop" data-a="pick">📷 Загрузить свою картинку</div>
          <div class="bg-loaded"><img class="bg-thumb" alt=""><div class="frow"><button class="btn sm" data-a="pick">Заменить</button><button class="btn sm danger" data-a="clear">Убрать</button></div></div>`;
        const g=$(".bg-gallery",w);
        PRESET_PATTERNS.forEach(p=>{ const uri=patternUri(p.svg), b=document.createElement("button"); b.title=p.name; b._uri=uri;
          b.style.backgroundImage=`url("${uri}")`; b.style.backgroundSize=Math.round(p.size*0.7)+"px";
          b.onclick=()=>{ Object.assign(state.design,{bgImage:uri,bgFit:"tile",bgTilePx:p.size}); if(state.design.bgSize<20) state.design.bgSize=100; change("bgImage"); };
          g.appendChild(b); });
        $$("[data-a=pick]",w).forEach(b=>b.onclick=async()=>{ const f=await pickFile("image/*"); if(!f) return;
          state.design.bgImage=await loadImageFile(f); state.design.bgTilePx=80; if(state.design.bgFit==="tile") state.design.bgFit="cover"; change("bgImage"); });
        $("[data-a=clear]",w).onclick=()=>{ state.design.bgImage=""; change("bgImage"); };
        refreshers.push(()=>{ const has=!!state.design.bgImage; $(".bg-drop",w).style.display=has?"none":""; $(".bg-loaded",w).style.display=has?"":"none";
          if(has) $(".bg-thumb",w).src=state.design.bgImage; $$("button",g).forEach(b=>b.classList.toggle("on",b._uri===state.design.bgImage)); });
      }),
      seg("bgMode","Где",[["sheet","На весь лист"],["cell","В каждой ленточке"]],{show:d=>!!d.bgImage}),
      sel("bgFit","Вписать",[["cover","Заполнить"],["contain","Вместить"],["tile","Замостить (паттерн)"],["stretch","Растянуть"]],{show:d=>!!d.bgImage}),
      row(num("bgOpacity","Прозрачность",0,100,1,"%",{show:d=>!!d.bgImage}),num("bgSize","Размер",5,300,1,"%",{show:d=>!!d.bgImage})),
      num("bgRotate","Поворот",0,360,5,"°",{show:d=>!!d.bgImage}),
      row(num("bgPosX","Позиция ↔",0,100,1,"%",{show:d=>!!d.bgImage}),num("bgPosY","Позиция ↕",0,100,1,"%",{show:d=>!!d.bgImage})),
    ]},
    {title:"",plain:true,fields:[custom(w=>{ w.innerHTML=`<button class="btn ghost wide">↺ Сбросить оформление</button>`;
      $("button",w).onclick=()=>{ if(!confirm("Вернуть оформление ленточки и листа по умолчанию? Маркеры останутся.")) return;
        state.design=deep(DEFAULT_DESIGN); refreshForms(); save(); render(); toast("Оформление сброшено"); }; })]},
  ],()=>state.design,onDesign);
  buildPrintPane("strips");
}

/* =========================================================
   ТРЕКЕР: вкладки
   ========================================================= */
function buildTrackerPanes(){
  const isDiv=t=>t.pageType==="divider", isTr=t=>t.pageType!=="divider";
  buildForm(pane("tracker","page"),[
    {title:"Тип листа",plain:true,fields:[
      seg("pageType","",[["tracker","📋 Трекер"],["divider","🖼 Разделитель"]]),
      custom((w,{refreshers})=>refreshers.push(()=>{ w.innerHTML=`<p class="hint">${isDiv(state.tracker)
        ?"Разделитель — вставной лист: на лицевой стороне ваша картинка, на обороте — кружки-номера для отметки готовых раскрасок. Печать двусторонняя."
        :"Трекер — лист с шапкой и клетками: квадрат под выкрас, прямоугольник под код и линия для заметки."}</p>`; })),
    ]},
    {title:"Раскладка на листе",show:isTr,fields:[
      sel("layout","",[["single","Одна страница"],["2a5","2 × A5 на A4 — рез по вертикали"],["2a5v","2 × A5 на A4 — рез по горизонтали"],["4a6","4 × A6 на A4"]]),
      tog("cutLine","Линия реза между страницами",{show:t=>t.layout!=="single"}),
      custom(w=>{ w.innerHTML=`<p class="hint">Несколько страниц на листе: печатайте на A4 и разрежьте по пунктиру. Все страницы одинаковые.</p>`; }),
    ]},
    {title:"Формат",show:t=>isDiv(t)||t.layout==="single",fields:[
      row(sel("paper","Формат",PAPERS),sel("orient","Ориентация",ORIENT,{show:t=>t.paper!=="custom"})),
      row(num("customW","Ширина",50,500,1,"мм",{show:t=>t.paper==="custom"}),num("customH","Высота",50,500,1,"мм",{show:t=>t.paper==="custom"})),
    ]},
    {title:"Отступы от края",fields:[
      sides(["padTop","padRight","padBottom","padLeft"],"Поля страницы (оборот — для разделителя)","padLink"),
      tog("showGuides","Показывать границы на превью"),
    ]},
    {title:"Картинка разделителя",show:isDiv,fields:[
      custom((w,{change,refreshers})=>{
        w.innerHTML=`<div class="bg-drop">🖼 Загрузить картинку (лицевая сторона)</div><div class="bg-loaded"><img class="bg-thumb" alt=""><div class="frow"><button class="btn sm" data-a="pick">Заменить</button><button class="btn sm danger" data-a="clear">Убрать</button></div></div>`;
        const pick=async()=>{ const f=await pickFile("image/*"); if(!f) return; state.tracker.divImage=await loadImageFile(f,3000); change("divImage"); };
        $(".bg-drop",w).onclick=pick; $("[data-a=pick]",w).onclick=pick;
        $("[data-a=clear]",w).onclick=()=>{ state.tracker.divImage=""; change("divImage"); };
        refreshers.push(()=>{ const has=!!state.tracker.divImage; $(".bg-drop",w).style.display=has?"none":""; $(".bg-loaded",w).style.display=has?"":"none"; if(has) $(".bg-thumb",w).src=state.tracker.divImage; });
      }),
      seg("divFit","Вписать",[["contain","Целиком"],["cover","Заполнить"]]),
      sides(["divPadTop","divPadRight","divPadBottom","divPadLeft"],"Поля картинки (0 — до края)","divPadLink"),
    ]},
  ],()=>state.tracker,onTracker);

  buildForm(pane("tracker","content"),[
    {title:"Заголовок",show:isTr,fields:[
      txt("title","","Заголовок (напр. Палитра раскраски)"),
      txt("subtitle","","Подзаголовок (необязательно)"),
      font("titleFont","Шрифт заголовка"),
      row(num("titleSize","Размер",10,60,1,"pt"),sel("titleAlign","Выравнивание",[["center","По центру"],["left","Слева"],["right","Справа"]])),
    ]},
    {title:"Шапка",show:isTr,fields:[
      tog("sticker","Место под наклейку"),
      row(num("stickerW","Ширина",10,190,1,"мм",{show:t=>t.sticker}),num("stickerH","Высота",10,240,1,"мм",{show:t=>t.sticker})),
      area("fields","Поля (по одному на строку)","Тема\nДата\nНомер страницы\nЗаметки",{lines:true}),
      font("fieldFont","Шрифт полей"),
      num("fieldSize","Размер полей",8,24,0.5,"pt"),
    ]},
    {title:"Сетка клеток",show:isTr,fields:[
      row(num("cols","Колонок",1,8,1,"шт"),num("rows","Рядов",1,40,1,"шт")),
      row(num("sqW","Квадрат: ширина",3,50,0.5),num("sqH","Квадрат: высота",3,50,0.5)),
      row(num("rectW","Прям.: ширина",0,90,0.5),num("rectH","Прям.: высота",3,50,0.5)),
      row(num("boxGap","Зазор рядов",0,15,0.5),num("boxR","Скругление",0,6,0.25)),
    ]},
    {title:"Отверстия для дырокола",fields:[
      tog("punch","Отверстия под кольца / дырокол"),
      row(num("punchN","Кол-во",1,10,1,"шт",{show:t=>t.punch}),sel("punchSide","Сторона",[["left","Слева"],["top","Сверху"]],{show:t=>t.punch})),
      row(num("punchD","Диаметр",2,10,0.5,"мм",{show:t=>t.punch}),num("punchMargin","Центр от края",3,25,0.5,"мм",{show:t=>t.punch})),
      sel("punchDist","Расстояние",[["custom","Своё (мм, через запятую)"],["even","Равномерно по краю"]],{show:t=>t.punch}),
      txt("punchGaps","Промежутки между центрами, мм","45, 65, 45",{show:t=>t.punch&&t.punchDist==="custom"}),
      custom(w=>{ w.innerHTML=`<p class="hint">Стандарт для 4 колец A5 — <b>45, 65, 45</b>; дырокол на 2 отверстия — <b>80</b>. Группа центрируется по краю.</p>`; }),
    ]},
    {title:"Оборот разделителя",show:isDiv,fields:[
      txt("divBackTitle","Заголовок","Отметь готовые раскраски"),
      font("titleFont","Шрифт заголовка"),
      row(num("divCount","Кружков",1,300,1,"шт"),num("divCols","Колонок",1,20,1,"шт")),
      row(num("divCircle","Диаметр кружка",5,30,0.5),tog("divNumbered","Номера")),
    ]},
  ],()=>state.tracker,onTracker);

  buildForm(pane("tracker","style"),[
    {title:"Оформление",fields:[
      font("font","Основной шрифт"),
      row(col("lineColor","Линии"),col("textColor","Текст"),col("accent","Акцент")),
      num("lineW","Толщина линий",0.05,1.5,0.05),
    ]},
    {title:"",plain:true,fields:[custom(w=>{ w.innerHTML=`<button class="btn ghost wide">↺ Сбросить трекер</button>`;
      $("button",w).onclick=()=>{ if(!confirm("Вернуть все настройки трекера по умолчанию?")) return;
        state.tracker=deep(DEFAULT_TRACKER); refreshForms(); save(); render(); toast("Трекер сброшен"); }; })]},
  ],()=>state.tracker,onTracker);
  buildPrintPane("tracker");
}

/* =========================================================
   ПЕЧАТЬ: калибровка и поля принтера (общие для всех режимов)
   ========================================================= */
function buildPrintPane(mode){
  buildForm(pane(mode,"print"),[
    {title:"Как печатать точно",plain:true,fields:[custom(w=>{ w.innerHTML=`
      <ol class="hint" style="padding-left:18px;margin:0">
        <li><b>PDF</b> — самый надёжный путь: страница уже точно нужного размера. Печатайте его с масштабом <b>100% / «Фактический размер»</b>.</li>
        <li>Кнопка <b>«Печать»</b>: в окне печати выберите масштаб <b>100%</b>, поля — <b>Нет</b>, колонтитулы — <b>выкл</b>.</li>
        <li>Один раз распечатайте <b>тестовую страницу</b> и при необходимости введите поправки ниже.</li>
      </ol>
      <div class="frow" style="margin-top:10px"><button class="btn sm" data-a="cal">🖨 Тестовая страница</button><button class="btn sm" data-a="calpdf">PDF теста</button></div>`;
      $("[data-a=cal]",w).onclick=()=>printCalibration(false); $("[data-a=calpdf]",w).onclick=()=>printCalibration(true); })]},
    {title:"Поля принтера (непечатаемая зона)",fields:[
      sides(["uT","uR","uB","uL"],"Принтер не печатает ближе к краю, чем","uLink",20),
      tog("showSafe","Показывать эту зону на превью"),
      custom(w=>{ w.innerHTML=`<p class="hint">Обычно 3–5 мм. Узнать точно: на тестовой странице посмотрите «лесенку» у краёв — самая близкая к краю видимая цифра и есть поле. Приложение предупредит, если разметка туда заходит.</p>`; }),
    ]},
    {title:"Калибровка масштаба",fields:[
      custom((w,{change,refreshers})=>{
        w.innerHTML=`<p class="hint" style="margin-top:0">Измерьте линейкой линии на тестовой странице и введите, сколько получилось:</p>
          <div class="frow"><div class="f"><label>Линия 100 мм вышла</label><input type="number" step="0.1" data-m="x" placeholder="100"></div>
          <div class="f"><label>Вертикальная вышла</label><input type="number" step="0.1" data-m="y" placeholder="150"></div></div>
          <button class="btn sm wide" data-a="apply">Рассчитать поправку</button>`;
        $("[data-a=apply]",w).onclick=()=>{
          const mx=parseFloat($("[data-m=x]",w).value), my=parseFloat($("[data-m=y]",w).value), vl=calibVLen();
          if(!(mx>50) && !(my>50)){ toast("Введите измеренную длину в мм"); return; }
          if(mx>50) state.print.sx=+(state.print.sx*100/mx).toFixed(2);
          if(my>50) state.print.sy=+(state.print.sy*vl/my).toFixed(2);
          change("sx"); toast(`Поправка: ${state.print.sx}% × ${state.print.sy}%`);
        };
        refreshers.push(()=>{ $("[data-m=y]",w).placeholder=String(calibVLen()); });
      }),
      row(num("sx","Масштаб по ширине",90,110,0.05,"%"),num("sy","Масштаб по высоте",90,110,0.05,"%")),
      row(num("ox","Сдвиг вправо",-10,10,0.1,"мм"),num("oy","Сдвиг вниз",-10,10,0.1,"мм")),
      tog("calPdf","Применять поправку и в PDF"),
      custom((w,{change})=>{ w.innerHTML=`<button class="btn ghost sm wide">Сбросить калибровку</button>`;
        $("button",w).onclick=()=>{ Object.assign(state.print,{sx:100,sy:100,ox:0,oy:0}); change("sx"); }; }),
      custom(w=>{ w.innerHTML=`<p class="hint">Поправка действует только при печати и в PDF — превью показывает настоящий размер. Если уголки на тесте сместились (например, на 11.5 мм вместо 10), введите сдвиг −1.5 мм.</p>`; }),
    ]},
    {title:"Качество PDF",open:false,fields:[
      seg("dpi","",[["200","200 dpi"],["300","300 dpi"],["400","400 dpi"]],{numeric:true}),
      custom(w=>{ w.innerHTML=`<p class="hint">300 dpi — чёткие тонкие линии и текст. 400 — для очень мелкого шрифта, файл больше.</p>`; }),
    ]},
  ],()=>state.print,onPrint);
}
const calibVLen=()=>{ const s=sheetSize(); return Math.min(150,s.h-Math.max(66,(s.h-150)/2+10)-30); };

/* =========================================================
   Маркеры
   ========================================================= */
function addMarkers(list){ state.markers.push(...list.map(m=>({id:uid(),code:m.code||"",name:m.name||""}))); save(); renderMarkers(); render(); }
const naturalKey=c=>String(c).replace(/\d+/g,n=>n.padStart(8,"0")).toLowerCase();
function expandCodes(text){
  const out=[];
  text.split(/[\n,;]+/).map(s=>s.trim()).filter(Boolean).forEach(tok=>{
    const m=tok.match(/^(.*?)(\d+)\s*[-–—]\s*(?:\1)?(\d+)$/);
    if(m){ const [,pre,a,b]=m, from=parseInt(a,10), to=parseInt(b.length<a.length?a.slice(0,a.length-b.length)+b:b,10);
      if(to>=from && to-from<1000){ for(let i=from;i<=to;i++) out.push(pre+String(i).padStart(a.length,"0")); return; } }
    out.push(tok);
  });
  return out;
}
function renderMarkers(){
  const box=$("#mklist"); if(!box) return;
  $("#mkCount").textContent=state.markers.length?`· ${state.markers.length}`:"";
  if(!state.markers.length){ box.innerHTML=`<div class="empty">Пусто. Добавьте коды выше или примените свой набор во вкладке «Наборы».</div>`; return; }
  box.innerHTML=state.markers.map((m,i)=>`<div class="mkitem" draggable="true" data-i="${i}"><span class="grip">⋮⋮</span><span class="num">${i+1}</span>
    <span class="code" data-f="code">${esc(m.code)||"—"}</span><span class="name" data-f="name">${esc(m.name)||"—"}</span><button class="x" title="Удалить">✕</button></div>`).join("");
}
function initMarkerEvents(){
  const box=$("#mklist");
  box.addEventListener("click",e=>{
    const it=e.target.closest(".mkitem"); if(!it) return; const m=state.markers[+it.dataset.i];
    if(e.target.closest(".x")){ state.markers.splice(+it.dataset.i,1); save(); renderMarkers(); render(); return; }
    const span=e.target.closest("[data-f]"); if(!span) return;
    it.draggable=false;
    const inp=document.createElement("input"); inp.className="edit"; inp.value=m[span.dataset.f]||""; span.replaceWith(inp); inp.focus(); inp.select();
    let done=false; const commit=ok=>{ if(done) return; done=true; if(ok){ m[span.dataset.f]=inp.value.trim(); save(); render(); } renderMarkers(); };
    inp.onblur=()=>commit(true); inp.onkeydown=ev=>{ if(ev.key==="Enter") commit(true); if(ev.key==="Escape") commit(false); };
  });
  let from=null;
  box.addEventListener("dragstart",e=>{ const it=e.target.closest(".mkitem"); if(!it) return; from=+it.dataset.i; it.classList.add("drag"); e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("text/plain",""); });
  box.addEventListener("dragend",()=>$$(".mkitem",box).forEach(x=>x.classList.remove("drag","over")));
  box.addEventListener("dragover",e=>{ e.preventDefault(); $$(".mkitem",box).forEach(x=>x.classList.remove("over")); e.target.closest(".mkitem")?.classList.add("over"); });
  box.addEventListener("drop",e=>{ e.preventDefault(); const it=e.target.closest(".mkitem"); if(!it||from===null) return;
    const to=+it.dataset.i, [mv]=state.markers.splice(from,1); state.markers.splice(to,0,mv); from=null; save(); renderMarkers(); render(); });

  const add=()=>{ const c=$("#addCode").value.trim(), n=$("#addName").value.trim(); if(!c&&!n){ toast("Введите код или название"); return; }
    addMarkers([{code:c,name:n}]); $("#addCode").value=""; $("#addCode").focus(); box.scrollTop=box.scrollHeight; };
  $("#btnAdd").onclick=add;
  $("#addCode").onkeydown=e=>{ if(e.key==="Enter") add(); };
  $("#addName").onkeydown=e=>{ if(e.key==="Enter") add(); };
  const hint=()=>{ const n=expandCodes($("#bulkCodes").value).length;
    $("#bulkHint").innerHTML=n?`Будет добавлено: <b>${n}</b>`:`Разделители — запятая или новая строка. Диапазоны: <b>701-750</b>, <b>B701-750</b>, <b>001-050</b> (нули сохраняются).`; };
  $("#bulkCodes").oninput=hint; hint();
  $("#btnBulk").onclick=()=>{ const codes=expandCodes($("#bulkCodes").value); if(!codes.length){ toast("Введите коды"); return; }
    const name=$("#bulkName").value.trim(); addMarkers(codes.map(code=>({code,name}))); $("#bulkCodes").value=""; hint(); toast(`Добавлено ${codes.length}`); };
  $("#btnSort").onclick=()=>{ state.markers.sort((a,b)=>naturalKey(a.code)<naturalKey(b.code)?-1:naturalKey(a.code)>naturalKey(b.code)?1:0); save(); renderMarkers(); render(); };
  $("#btnDedup").onclick=()=>{ const seen=new Set(), before=state.markers.length;
    state.markers=state.markers.filter(m=>{ const k=(m.code||m.name).trim().toUpperCase(); if(!k) return true; if(seen.has(k)) return false; seen.add(k); return true; });
    save(); renderMarkers(); render(); toast(`Убрано повторов: ${before-state.markers.length}`); };
  $("#btnClear").onclick=()=>{ if(state.markers.length && confirm("Очистить весь список маркеров?")){ state.markers=[]; save(); renderMarkers(); render(); } };
}

/* =========================================================
   Наборы: мои
   ========================================================= */
function applyList(list,append,label){
  const copy=list.map(m=>({id:uid(),code:m.code||"",name:m.name||""}));
  if(!append && state.markers.length && !confirm(`Заменить текущий список (${state.markers.length} шт.) на «${label}»?`)) return;
  state.markers=append?state.markers.concat(copy):copy;
  save(); renderMarkers(); render(); toast(append?`Добавлено ${copy.length} в список`:`«${label}»: ${copy.length} маркеров`);
}
function renderSets(){
  const box=$("#setlist"); if(!box) return;
  $("#setCount").textContent=state.sets.length?`· ${state.sets.length}`:"";
  box.innerHTML=state.sets.length?state.sets.map(s=>`<div class="pset" data-id="${s.id}"><div class="top"><span class="nm">${esc(s.name)}</span><span class="sz">${s.markers.length}</span></div>
    <div class="meta">${esc(s.markers.slice(0,6).map(m=>m.code||m.name).join(", "))}${s.markers.length>6?"…":""}</div>
    <div class="acts"><button class="btn sm primary" data-a="apply">Применить</button><button class="btn sm" data-a="append">＋ Дописать</button>
    <button class="btn sm ghost" data-a="update" title="Заменить содержимое набора текущим списком">⟳ Обновить</button><button class="btn sm ghost" data-a="rename">✎</button><button class="btn sm ghost danger" data-a="del">✕</button></div></div>`).join("")
    :`<div class="empty">Своих наборов пока нет. Наберите список во вкладке «Маркеры» и сохраните его здесь.</div>`;
}
function initSetEvents(){
  $("#setlist").onclick=e=>{
    const b=e.target.closest("[data-a]"); if(!b) return;
    const s=state.sets.find(x=>x.id===b.closest(".pset").dataset.id); if(!s) return;
    const a=b.dataset.a;
    if(a==="apply"||a==="append") applyList(s.markers,a==="append",s.name);
    else if(a==="del"){ if(confirm(`Удалить набор «${s.name}»?`)){ state.sets=state.sets.filter(x=>x!==s); save(); renderSets(); } }
    else if(a==="rename"){ const n=prompt("Новое название набора",s.name); if(n&&n.trim()){ s.name=n.trim(); save(); renderSets(); } }
    else if(a==="update"){ if(!state.markers.length){ toast("Текущий список пуст"); return; }
      if(confirm(`Заменить содержимое «${s.name}» текущим списком (${state.markers.length} шт.)?`)){ s.markers=deep(state.markers).map(({code,name})=>({code,name})); save(); renderSets(); toast("Набор обновлён"); } }
  };
  $("#btnSaveSet").onclick=()=>{
    const name=$("#setName").value.trim(); if(!name){ toast("Введите название набора"); $("#setName").focus(); return; }
    if(!state.markers.length){ toast("Список маркеров пуст"); return; }
    state.sets.push({id:uid(),name,markers:state.markers.map(({code,name})=>({code,name}))}); $("#setName").value=""; save(); renderSets(); toast("Набор сохранён");
  };
  $("#setName").onkeydown=e=>{ if(e.key==="Enter") $("#btnSaveSet").click(); };
  $("#btnNewSet").onclick=()=>modal({title:"Новый набор из кодов",
    html:`<div class="f"><label>Название набора</label><input type="text" id="nsName" placeholder="Напр. NuSoulra 168"></div>
      <div class="f"><label>Подпись для всех маркеров (необязательно)</label><input type="text" id="nsLabel" placeholder="Напр. NuSoulra"></div>
      <div class="f"><label>Коды — через запятую, с новой строки или диапазоном</label><textarea id="nsCodes" rows="6" placeholder="Y01-Y17, F01-F37&#10;600-650"></textarea></div><p class="hint" id="nsHint"></p>`,
    onOpen:b=>{ const h=()=>$("#nsHint",b).innerHTML=`Кодов: <b>${expandCodes($("#nsCodes",b).value).length}</b>`; $("#nsCodes",b).oninput=h; h(); $("#nsName",b).focus(); },
    buttons:[{label:"Отмена"},{label:"Создать",primary:true,onClick:()=>{
      const name=$("#nsName").value.trim(), codes=expandCodes($("#nsCodes").value), lbl=$("#nsLabel").value.trim();
      if(!name||!codes.length){ toast("Нужны название и коды"); return false; }
      state.sets.push({id:uid(),name,markers:codes.map(code=>({code,name:lbl}))}); save(); renderSets(); toast(`Набор «${name}»: ${codes.length} кодов`); }}]});
  $("#btnSetsExport").onclick=()=>{ if(!state.sets.length){ toast("Нет своих наборов"); return; }
    download(new Blob([JSON.stringify({type:"palette-sets",sets:state.sets},null,1)],{type:"application/json"}),"мои-наборы.json"); };
  $("#btnSetsImport").onclick=async()=>{ const f=await pickFile(".json,application/json"); if(!f) return;
    try{ const d=JSON.parse(await readAs(f,"text")), sets=d.sets||(Array.isArray(d)?d:null); if(!sets) throw 0;
      sets.forEach(s=>state.sets.push({id:uid(),name:s.name||"Набор",markers:(s.markers||[]).map(m=>({code:m.code||"",name:m.name||""}))}));
      save(); renderSets(); toast(`Импортировано наборов: ${sets.length}`); }catch(e){ toast("Не удалось прочитать файл наборов"); } };
}

/* =========================================================
   Превью
   ========================================================= */
let lastPages=[], lastInfo=null, renderQueued=false;
function layoutCurrent(opts={}){
  return state.mode==="tracker" ? layoutTracker(state.tracker,state.print,opts) : layoutStrips(state.design,state.markers,state.print,opts);
}
function sheetSize(){ const L=layoutCurrent(); return {w:L.pages[0].w,h:L.pages[0].h}; }
function render(){ if(renderQueued) return; renderQueued=true; requestAnimationFrame(()=>{ renderQueued=false; renderNow(); }); }
function renderNow(){
  const L=layoutCurrent(); lastPages=L.pages; lastInfo=L.info;
  const pxW=p=>p.w*PX_PER_MM*state.zoom;
  $("#sheetWrap").innerHTML=L.pages.map((p,i)=>`<div class="sheet-box">${L.pages.length>1||p.cap?`<div class="sheet-cap">${p.cap||`Страница ${i+1} из ${L.pages.length}`}</div>`:""}<div class="sheet" data-p="${i}">${pageSvg(p,{preview:true,pxW:pxW(p)})}</div></div>`).join("");
  $("#warns").innerHTML=L.warn.map(w=>`<div class="warn">${esc(w)}</div>`).join("");
  const W=L.pages[0].w, H=L.pages[0].h, size=`${+W.toFixed(1)}×${+H.toFixed(1)} мм`;
  $("#pageInfo").textContent = state.mode==="tracker"
    ? (L.info.divider?`Разделитель · 2 стороны · ${size}`:`Трекер · ${size}${L.info.units>1?` · ${L.info.units} стр. на листе`:""}`)
    : (state.markers.length?`${L.pages.length} стр. · ${L.info.perPage} на стр. · ${state.markers.length} маркеров · ${size}`:size);
  $("#zoomVal").textContent=Math.round(state.zoom*100)+"%";
  refreshForms();
}
function applyZoom(){
  $("#zoomVal").textContent=Math.round(state.zoom*100)+"%";
  $$("#sheetWrap .sheet").forEach(el=>{ const p=lastPages[+el.dataset.p], svg=$("svg",el); if(!p||!svg) return;
    const w=p.w*PX_PER_MM*state.zoom; svg.setAttribute("width",w); svg.setAttribute("height",w*p.h/p.w); });
}
function fitWidth(){
  const main=$("#main"); if(!main.clientWidth||!lastPages[0]) return;
  const avail=main.clientWidth-(innerWidth<860?20:60);
  state.zoom=clamp(avail/(lastPages[0].w*PX_PER_MM),0.15,1.6); applyZoom();
}
function initPreviewEvents(){
  $("#zoomIn").onclick=()=>{ state.zoom=Math.min(3,+(state.zoom+0.1).toFixed(2)); applyZoom(); };
  $("#zoomOut").onclick=()=>{ state.zoom=Math.max(0.15,+(state.zoom-0.1).toFixed(2)); applyZoom(); };
  $("#zoomVal").onclick=()=>{ state.zoom=1; applyZoom(); };
  $("#zoomFit").onclick=fitWidth;
  const wrap=$("#sheetWrap");
  wrap.addEventListener("mousemove",e=>{ const s=e.target.closest(".sheet"); if(!s){ $("#cursorMm").textContent=""; return; }
    const p=lastPages[+s.dataset.p], r=s.getBoundingClientRect();
    $("#cursorMm").textContent=`x ${((e.clientX-r.left)/r.width*p.w).toFixed(1)} · y ${((e.clientY-r.top)/r.height*p.h).toFixed(1)} мм`; });
  wrap.addEventListener("mouseleave",()=>$("#cursorMm").textContent="");
  // клик по подписи на листе — правка на месте
  wrap.addEventListener("click",e=>{
    const t=e.target.closest("text[data-i]"); if(!t) return;
    const m=state.markers[+t.dataset.i], f=t.dataset.f; if(!m) return;
    const r=t.getBoundingClientRect(), inp=document.createElement("input");
    inp.className="inline-edit"; inp.value=m[f]||""; inp.style.left=r.left-6+"px"; inp.style.top=r.top-6+"px"; inp.style.width=Math.max(120,r.width+40)+"px";
    document.body.appendChild(inp); inp.focus(); inp.select();
    let done=false; const commit=ok=>{ if(done) return; done=true; if(ok){ m[f]=inp.value.trim(); save(); renderMarkers(); render(); } inp.remove(); };
    inp.onblur=()=>commit(true); inp.onkeydown=ev=>{ if(ev.key==="Enter") commit(true); if(ev.key==="Escape") commit(false); };
  });
  $("#main").addEventListener("wheel",e=>{ if(!(e.ctrlKey||e.metaKey)) return; e.preventDefault();
    state.zoom=clamp(state.zoom*(e.deltaY<0?1.1:1/1.1),0.15,3); applyZoom(); },{passive:false});
}

/* =========================================================
   Печать и PDF
   ========================================================= */
const calOf=()=>({sx:state.print.sx/100,sy:state.print.sy/100,ox:state.print.ox,oy:state.print.oy});
function hasCal(){ const p=state.print; return p.sx!==100||p.sy!==100||p.ox!==0||p.oy!==0; }
function buildPrint(pages,applyCal=true){
  const W=pages[0].w, H=pages[0].h;
  $("#pageStyle").textContent=`@page{size:${W}mm ${H}mm;margin:0}`;
  const cal=applyCal&&hasCal()?calOf():null;
  // высота блока на 0.2 мм меньше листа — иначе браузер иногда добавляет пустую страницу
  $("#printRoot").innerHTML=pages.map(p=>`<div class="print-page" style="width:${p.w}mm;height:${p.h-0.2}mm">${pageSvg(p,{cal})}</div>`).join("");
}
async function ensureReady(pages){
  try{ await document.fonts.ready; }catch(e){}
  await waitImages(pages.flatMap(p=>collectImages(p.items)));
}
async function doPrint(pages,{skipTips}={}){
  const go=async()=>{ await ensureReady(pages); buildPrint(pages); setTimeout(()=>window.print(),60); };
  if(skipTips||state.print.tipsSeen) return go();
  modal({title:"Перед печатью",html:`<p style="margin-top:0">Чтобы размеры совпали до миллиметра, в окне печати выберите:</p>
    <ul><li>Масштаб: <b>100%</b> (не «По размеру страницы»)</li><li>Поля: <b>Нет</b> (или «Без полей»)</li><li>Колонтитулы: <b>выключены</b></li>
    <li>Размер бумаги: <b>${pages[0].w}×${pages[0].h} мм</b>${state.mode==="tracker"&&state.tracker.pageType==="divider"?" · двусторонняя печать":""}</li></ul>
    <p class="hint">С телефона надёжнее кнопка <b>PDF</b>. Совет показывается один раз.</p>`,
    buttons:[{label:"Отмена"},{label:"Печатать",primary:true,onClick:()=>{ state.print.tipsSeen=true; save(); go(); }}]});
}
async function doPdf(pages,name,applyCal){
  toast("Готовим PDF…");
  await ensureReady(pages);
  const cal=applyCal&&hasCal()?calOf():null, out=[];
  for(const p of pages){ out.push({cv:pageCanvas(p,state.print.dpi,cal),w:p.w,h:p.h}); await new Promise(r=>setTimeout(r)); }
  download(canvasesToPdf(out),name);
  toast(`PDF готов · ${out.length} стр. · ${pages[0].w}×${pages[0].h} мм`);
}
function currentPagesForOutput(){ return layoutCurrent({showSafe:false}).pages; }
function printCalibration(pdf){
  const s=sheetSize(), L=layoutCalibration(s.w,s.h);
  if(pdf) doPdf(L.pages,"тестовая-страница.pdf",false); else { buildPrint(L.pages,false); setTimeout(()=>window.print(),60); }
}
window.addEventListener("beforeprint",()=>{ if(!$("#printRoot").innerHTML) buildPrint(currentPagesForOutput()); });
window.addEventListener("afterprint",()=>{ setTimeout(()=>{ $("#printRoot").innerHTML=""; },300); });

/* =========================================================
   Обмен: ссылка, файл проекта
   ========================================================= */
function payload(){ return {v:2,mode:state.mode,markers:state.markers.map(({code,name})=>({code,name})),sets:state.sets,design:state.design,tracker:state.tracker}; }
const b64u={enc:u8=>{ let s=""; u8.forEach(b=>s+=String.fromCharCode(b)); return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); },
  dec:s=>{ s=s.replace(/-/g,"+").replace(/_/g,"/"); const bin=atob(s); return Uint8Array.from(bin,c=>c.charCodeAt(0)); }};
async function encodeShare(obj){
  const json=new TextEncoder().encode(JSON.stringify(obj));
  if(window.CompressionStream){ const buf=await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer(); return "z"+b64u.enc(new Uint8Array(buf)); }
  return b64u.enc(json);
}
async function decodeShare(str){
  str=str.trim().replace(/^.*#p=/,"");
  if(str[0]==="z" && window.DecompressionStream){
    const buf=await new Response(new Blob([b64u.dec(str.slice(1))]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer();
    return JSON.parse(new TextDecoder().decode(buf));
  }
  try{ return JSON.parse(new TextDecoder().decode(b64u.dec(str))); }catch(e){ return JSON.parse(decodeURIComponent(escape(atob(str)))); } // старый формат
}
function importData(o){
  if(!o||typeof o!=="object") throw new Error("bad");
  if(o.design) state.design=migrateDesign(o.design);
  if(o.tracker) state.tracker=migrateTracker(o.tracker,o.v);
  if(o.markers) state.markers=o.markers.map(m=>({id:uid(),code:m.code||"",name:m.name||""}));
  if(o.sets) state.sets=o.sets.map(s=>({id:uid(),name:s.name,markers:s.markers||[]}));
  save(); renderMarkers(); renderSets(); refreshForms(); setMode(o.mode||state.mode);
}
async function share(){
  const p=payload();
  const big=[p.design.bgImage,p.tracker.divImage].some(s=>s&&s.startsWith("data:image/")&&!s.startsWith("data:image/svg")&&s.length>2000);
  if(big){ p.design={...p.design,bgImage:p.design.bgImage.startsWith("data:image/svg")?p.design.bgImage:""}; p.tracker={...p.tracker,divImage:""}; }
  const link=location.href.split("#")[0]+"#p="+await encodeShare(p);
  try{ await navigator.clipboard.writeText(link); }catch(e){}
  modal({title:"Поделиться",html:`<p class="hint" style="margin-top:0">Ссылка открывает ваш список и все настройки как есть.${big?" <b>Свои картинки в ссылку не входят</b> — для них сохраните проект файлом.":""} ${link.length>8000?"Ссылка длинная — некоторые мессенджеры её обрежут, надёжнее файл.":""} Уже скопирована в буфер.</p><textarea readonly>${esc(link)}</textarea>`,
    onOpen:b=>{ const t=$("textarea",b); t.focus(); t.select(); }});
}
function openDrawer(){ $("#dataDrawer").classList.add("show"); $("#drawerBg").classList.add("show"); }
function closeDrawer(){ $("#dataDrawer").classList.remove("show"); $("#drawerBg").classList.remove("show"); }
function initDataEvents(){
  $("#btnShare").onclick=share; $("#btnData").onclick=openDrawer;
  $("#drawerClose").onclick=closeDrawer; $("#drawerBg").onclick=closeDrawer;
  $("#drShare").onclick=()=>{ closeDrawer(); share(); };
  $("#drExport").onclick=()=>{ download(new Blob([JSON.stringify(payload(),null,1)],{type:"application/json"}),"palette-проект.json"); toast("Проект сохранён в файл"); };
  $("#drOpen").onclick=async()=>{ const f=await pickFile(".json,application/json"); if(!f) return;
    try{ importData(JSON.parse(await readAs(f,"text"))); closeDrawer(); toast("Проект открыт"); }catch(e){ toast("Не удалось прочитать файл"); } };
  $("#drawerImport").onclick=async()=>{ const txt=$("#drawerText").value.trim(); if(!txt){ toast("Вставьте данные"); return; }
    try{ importData(txt.startsWith("{")?JSON.parse(txt):await decodeShare(txt)); $("#drawerText").value=""; closeDrawer(); toast("Импортировано"); }
    catch(e){ toast("Не удалось разобрать данные"); } };
}

/* =========================================================
   Приветствие
   ========================================================= */
function initWelcome(){
  const demo=["601 Sky blue","605 Red","612 Pink","615 Bright yellow","622 Pine green","635 Purple","644 Clay colour","651 Violet","660 Heartbeat pink","673 Klein blue","684 Apricot yellow","691 Coral powder","703 Ivory orange","723 Sakura","744 Lavender","767 Cloud blue","777 Pure yellow","783 Orange red","802 Mango yellow","821 Ice blue","836 Soft pink","854 Fluorescent pink"]
    .map(s=>{ const [code,...n]=s.split(" "); return {code,name:n.join(" ")}; });
  const W=t=>{ const L=t(), p=L.pages[0]; return pageSvg(p,{pxW:200}); };
  const fill=()=>{
    $("#wPrevStrips").innerHTML=W(()=>layoutStrips({...DEFAULT_DESIGN,showGuides:false},demo,{...DEFAULT_PRINT,showSafe:false}));
    $("#wPrevTracker").innerHTML=W(()=>layoutTracker({...DEFAULT_TRACKER,showGuides:false},{...DEFAULT_PRINT,showSafe:false}));
  };
  fill(); document.fonts?.ready.then(()=>{ clearMetrics(); fill(); });
  $$(".wcard").forEach(b=>b.onclick=()=>{ hideWelcome(); setMode(b.dataset.choose); });
  $("#welcomeSkip").onclick=hideWelcome;
  $("#btnHome").onclick=()=>$("#welcome").classList.add("show");
  let seen=false; try{ seen=!!localStorage.getItem("palette_seen"); }catch(e){}
  if(!seen) $("#welcome").classList.add("show");
}
function hideWelcome(){ $("#welcome").classList.remove("show"); try{localStorage.setItem("palette_seen","1");}catch(e){} requestAnimationFrame(fitWidth); }

/* =========================================================
   Запуск
   ========================================================= */
async function boot(){
  let theme="light"; try{ theme=localStorage.getItem("palette_theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"); }catch(e){}
  applyTheme(theme);
  load();
  if(location.hash.startsWith("#p=")){
    try{ importData(await decodeShare(location.hash.slice(3))); toast("Палитра загружена из ссылки"); try{localStorage.setItem("palette_seen","1");}catch(e){} }catch(e){ toast("Ссылка повреждена"); }
    history.replaceState(null,"",location.pathname);
  }
  onImageReady=render;
  buildStripsPanes(); buildTrackerPanes();
  initMarkerEvents(); initSetEvents(); initPreviewEvents(); initDataEvents();
  renderMarkers(); renderSets();
  $$("#modeSeg button").forEach(b=>b.onclick=()=>setMode(b.dataset.v));
  $("#btnTheme").onclick=()=>applyTheme(document.body.dataset.theme==="dark"?"light":"dark");
  $("#btnPrint").onclick=()=>doPrint(currentPagesForOutput());
  $("#btnPdf").onclick=()=>{ if(state.mode==="strips"&&!state.markers.length){ toast("Сначала добавьте маркеры"); return; }
    doPdf(currentPagesForOutput(),state.mode==="tracker"?(state.tracker.pageType==="divider"?"разделитель.pdf":"трекер.pdf"):"выкраска.pdf",state.print.calPdf); };
  $("#modalBg").onclick=e=>{ if(e.target===$("#modalBg")) closeModal(); };
  document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ closeDrawer(); closeModal(); } });
  if(matchMedia("(max-width:860px)").matches) document.body.dataset.mview=state.tab[state.mode]||"markers";
  setMode(state.mode);
  initWelcome();
  addEventListener("resize",()=>{ clearTimeout(boot._r); boot._r=setTimeout(fitWidth,150); });
  // веб-шрифты влияют на ширину текста — после загрузки пересчитываем
  document.fonts?.ready.then(()=>{ clearMetrics(); render(); requestAnimationFrame(fitWidth); });
  [state.design.font,state.tracker.font,state.tracker.titleFont,state.tracker.fieldFont].forEach(loadFont);
}
boot();
