"use strict";
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2,9);

const PAPER = { A4:{w:210,h:297}, A5:{w:148,h:210}, Letter:{w:216,h:279} };

/* ---------- (не используется) палитры производителей [код, название, hex] ---------- */
const MM = 3.7795; // px per mm at 96dpi

const DEFAULT_DESIGN = {
  paper:"A4", orient:"portrait", cols:2, pad:10,
  rowH:16, stripW:0, gap:0, showCode:true, showName:true, border:true, corner:0,
  font:"Montserrat, Arial, sans-serif", fs:10,
  codeBold:false, codeItalic:false, nameBold:false, nameItalic:false,
  codeIndent:14, nameIndent:34,
  spotShape:"circle", spots:1, spotSize:7, spotIndent:3,
  ring:true, ringSize:5, ringIndent:3,
  lineColor:"#d9d9d9", textColor:"#333333",
  bgImage:"", bgMode:"sheet", bgFit:"cover", bgOpacity:18, bgSize:100, bgPosX:50, bgPosY:50,
  bgRotate:0, bgTilePx:60,
  line:false, lineX:24, lineW:1
};

/* ---------- готовые бесшовные паттерны (SVG) ---------- */
const P=(w,h,inner,bg)=>`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${bg?`<rect width='${w}' height='${h}' fill='${bg}'/>`:""}${inner}</svg>`;
const PRESET_PATTERNS=[
  {name:"Горошек", size:26, svg:P(26,26,`<g fill='#f191b4'><circle cx='13' cy='13' r='3.2'/><circle cx='0' cy='0' r='3.2'/><circle cx='26' cy='0' r='3.2'/><circle cx='0' cy='26' r='3.2'/><circle cx='26' cy='26' r='3.2'/></g>`)},
  {name:"Клетка", size:26, svg:P(26,26,`<path d='M26 0H0V26' fill='none' stroke='#a8cdec' stroke-width='1'/>`)},
  {name:"Линии", size:16, svg:P(14,14,`<path d='M-2 2 L6 -6 M0 14 L14 0 M8 16 L16 8' stroke='#c9b4e6' stroke-width='1.5' fill='none'/>`)},
  {name:"Волны", size:40, svg:P(40,14,`<path d='M0 7 Q10 1 20 7 T40 7' fill='none' stroke='#79ccc4' stroke-width='1.5'/>`)},
  {name:"Зигзаг", size:28, svg:P(24,12,`<path d='M0 12 L12 4 L24 12' fill='none' stroke='#f0a35a' stroke-width='1.5'/>`)},
  {name:"Цветочки", size:46, svg:P(46,46,`<g fill='none' stroke='#ef94b6' stroke-width='1.4'><circle cx='23' cy='13' r='4.2'/><circle cx='33' cy='20' r='4.2'/><circle cx='29' cy='32' r='4.2'/><circle cx='17' cy='32' r='4.2'/><circle cx='13' cy='20' r='4.2'/></g><circle cx='23' cy='23' r='3' fill='#f4bf46'/>`)},
  {name:"Листья", size:44, svg:P(44,44,`<g stroke='#7bb98d' stroke-width='1.3' fill='none'><path d='M10 40 C 20 30 24 18 22 6'/><path d='M22 14 C 16 12 12 14 12 20'/><path d='M22 22 C 28 20 32 22 32 28'/><path d='M22 30 C 16 28 13 30 13 36'/></g>`)},
  {name:"Веточки", size:30, svg:P(30,30,`<g stroke='#c7a86a' stroke-width='1.2' fill='none'><path d='M15 28 L15 6'/><path d='M15 12 L9 8 M15 12 L21 8 M15 18 L9 14 M15 18 L21 14 M15 24 L9 20 M15 24 L21 20'/></g>`)},
  {name:"Сердечки", size:28, svg:P(28,28,`<path d='M14 22 C 6 15 8 8 14 11 C 20 8 22 15 14 22 Z' fill='#f191b4'/>`)},
  {name:"Звёзды", size:30, svg:P(30,30,`<path d='M15 6 L17 12 L23 12 L18 16 L20 22 L15 18 L10 22 L12 16 L7 12 L13 12 Z' fill='#f4c04e'/>`)},
  {name:"Круги", size:30, svg:P(30,30,`<g fill='none' stroke='#c9b6e2' stroke-width='1.2'><circle cx='0' cy='15' r='12'/><circle cx='30' cy='15' r='12'/><circle cx='15' cy='0' r='12'/><circle cx='15' cy='30' r='12'/></g>`)},
  {name:"Терраццо", size:70, svg:P(70,70,`<circle cx='12' cy='16' r='5' fill='#f2b7c4'/><rect x='40' y='8' width='11' height='6' rx='3' fill='#a9d3c9' transform='rotate(20 45 11)'/><circle cx='58' cy='30' r='4' fill='#e9c56a'/><ellipse cx='26' cy='46' rx='6' ry='4' fill='#c9b6e2' transform='rotate(-15 26 46)'/><circle cx='50' cy='56' r='5' fill='#f0a58a'/><rect x='8' y='56' width='9' height='5' rx='2.5' fill='#9ec9e8'/><circle cx='62' cy='64' r='3' fill='#f2b7c4'/>`,"#fbf7f1")},
  {name:"Мемфис", size:60, svg:P(60,60,`<g fill='none' stroke-width='1.6'><path d='M6 12 q6 -8 12 0 t12 0' stroke='#7ec9c0'/><path d='M44 8 l8 0 M48 4 l0 8' stroke='#f0a35a'/><path d='M28 50 q6 -6 12 0' stroke='#9ec9e8'/></g><path d='M10 44 L18 44 L14 36 Z' fill='#efb0c2'/><circle cx='46' cy='40' r='3' fill='#c9b6e2'/><circle cx='54' cy='52' r='3' fill='#f4c04e'/>`)},
  {name:"Конфетти", size:48, svg:P(48,48,`<g stroke-width='2' stroke-linecap='round'><line x1='8' y1='8' x2='12' y2='14' stroke='#f191b4'/><line x1='34' y1='6' x2='40' y2='8' stroke='#7ec9c0'/><line x1='20' y1='22' x2='24' y2='18' stroke='#f4c04e'/><line x1='42' y1='26' x2='44' y2='32' stroke='#c9b6e2'/><line x1='10' y1='38' x2='16' y2='40' stroke='#f0a35a'/><line x1='30' y1='40' x2='34' y2='46' stroke='#9ec9e8'/></g>`)}
];
// экранируем ', чтобы data-URI можно было безопасно вставлять в url('...') внутри style
const patternUri=svg=>"data:image/svg+xml,"+encodeURIComponent(svg).replace(/'/g,"%27");

/* ---------- список шрифтов (для трекера) ---------- */
const FONTS=[
  ["Современные",[["Montserrat, Arial, sans-serif","Montserrat"],["Inter, Arial, sans-serif","Inter"],["Manrope, Arial, sans-serif","Manrope"],["Rubik, Arial, sans-serif","Rubik"],["Jost, Arial, sans-serif","Jost"],["Nunito, Arial, sans-serif","Nunito"],["Comfortaa, Arial, sans-serif","Comfortaa"],["Unbounded, Arial, sans-serif","Unbounded"]]],
  ["Прописные и рукописные",[["Caveat, cursive","Caveat"],["'Marck Script', cursive","Marck Script"],["'Bad Script', cursive","Bad Script"],["Neucha, cursive","Neucha"],["'Dancing Script', cursive","Dancing Script"],["'Great Vibes', cursive","Great Vibes"],["Pacifico, cursive","Pacifico"],["'Amatic SC', cursive","Amatic SC"]]],
  ["С засечками",[["'Playfair Display', Georgia, serif","Playfair Display"],["Cormorant, Georgia, serif","Cormorant"],["Lora, Georgia, serif","Lora"],["Georgia, serif","Georgia"],["'Times New Roman', serif","Times"]]],
  ["Классические",[["Arial, sans-serif","Arial"],["Helvetica, Arial, sans-serif","Helvetica"],["'Segoe UI', sans-serif","Segoe UI"],["Verdana, sans-serif","Verdana"],["'Trebuchet MS', sans-serif","Trebuchet"],["'Courier New', monospace","Courier"]]]
];
function fillFontSelect(sel){
  sel.innerHTML=FONTS.map(([g,items])=>`<optgroup label="${g}">`+items.map(([v,l])=>`<option value="${v.replace(/"/g,'&quot;')}" style="font-family:${v}">${l}</option>`).join("")+`</optgroup>`).join("");
}

const DEFAULT_TRACKER = {
  paper:"A4", orient:"portrait", pad:14,
  padTop:14, padBottom:14, padLeft:14, padRight:14,
  title:"Палитра раскраски", subtitle:"", titleFont:"'Great Vibes', cursive", titleSize:30, titleAlign:"center",
  sticker:true, stickerText:"Место для наклейки обложки", stickerW:70, stickerH:26,
  fields:["Тема","Дата","Номер страницы","Заметки"], fieldFont:"Caveat, cursive", fieldSize:14,
  cols:3, rows:10, boxH:11, sqW:11, sqH:11, rectW:22, rectH:11, boxGap:4, boxR:2,
  punch:false, punchN:4, punchSide:"left", punchD:5, punchMargin:8, punchDist:"custom", punchGaps:"45, 65, 45",
  sheetPaper:"A4", copies:1, layout:"single", showGuides:false, cutLine:true,
  font:"Montserrat, Arial, sans-serif", lineColor:"#cbb6c2", textColor:"#6b5563", accent:"#e59ab5"
};

let state = {
  mode: "strips",
  tracker: {...DEFAULT_TRACKER},
  markers: [],
  sets: [],
  design: {...DEFAULT_DESIGN},
  zoom: 0.7
};

/* ---------- persistence ---------- */
const LS = "palette_app_v1";
function save(){
  try{
    localStorage.setItem(LS, JSON.stringify({markers:state.markers, sets:state.sets, design:state.design, tracker:state.tracker, mode:state.mode}));
  }catch(e){ /* переполнение (обычно большая картинка) — работа в памяти продолжается */ }
}
function load(){
  try{
    const raw = localStorage.getItem(LS);
    if(raw){
      const d = JSON.parse(raw);
      state.markers = d.markers||[];
      state.sets = d.sets||[];
      const dd = d.design||{};
      // миграция: сохранения без раздельных сдвигов кода/названия получают их
      // из старого общего сдвига текста (textIndent)
      if(dd.codeIndent===undefined){
        dd.codeIndent = Math.max(10, dd.textIndent||14);
        dd.nameIndent = dd.codeIndent+20;
      }
      state.design = {...DEFAULT_DESIGN, ...dd};
      if(d.tracker){
        state.tracker = {...DEFAULT_TRACKER, ...d.tracker};
        // миграция: старый общий отступ → четыре стороны
        if(d.tracker.padTop===undefined && d.tracker.pad!==undefined){
          const p=d.tracker.pad;
          state.tracker.padTop=state.tracker.padBottom=state.tracker.padLeft=state.tracker.padRight=p;
        }
        // миграция: высота квадрата/прямоугольника из общей высоты клетки
        if(d.tracker.sqH===undefined){
          const bh=d.tracker.boxH||11;
          state.tracker.sqH=bh; state.tracker.rectH=bh;
        }
      }
      if(d.mode) state.mode = d.mode;
    }
  }catch(e){}
}

/* ---------- theme ---------- */
function applyTheme(t){
  document.body.dataset.theme = t;
  $("#btnTheme").textContent = t==="dark" ? "☀️" : "🌙";
  localStorage.setItem("palette_theme", t);
}
function initTheme(){
  const saved = localStorage.getItem("palette_theme");
  const prefers = matchMedia("(prefers-color-scheme: dark)").matches ? "dark":"light";
  applyTheme(saved || prefers);
}

/* ---------- toast ---------- */
let toastT;
function toast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),2200);
}

/* ---------- markers ---------- */
function addMarker(code,name){
  code=(code||"").trim(); name=(name||"").trim();
  if(!code && !name){ toast("Введите код или название"); return; }
  state.markers.push({id:uid(),code,name});
  save(); renderMarkers(); renderSheet();
}
function removeMarker(id){
  state.markers = state.markers.filter(m=>m.id!==id);
  save(); renderMarkers(); renderSheet();
}
function renderMarkers(){
  const box=$("#mklist"); box.innerHTML="";
  $("#mkCount").textContent = state.markers.length ? `(${state.markers.length})` : "";
  if(!state.markers.length){
    box.innerHTML='<div class="hint">Пусто. Добавьте маркеры вручную или примените набор.</div>';
    return;
  }
  state.markers.forEach((m,i)=>{
    const el=document.createElement("div");
    el.className="mkitem"; el.draggable=true; el.dataset.i=i;
    el.innerHTML=`<span class="grip">⋮⋮</span>
      <span class="code" title="Нажмите, чтобы изменить">${escapeHtml(m.code)||"—"}</span>
      <span class="name" title="Нажмите, чтобы изменить">${escapeHtml(m.name)||"—"}</span>
      <button class="btn danger small" title="Удалить">✕</button>`;
    el.querySelector("button").onclick=()=>removeMarker(m.id);
    // клик по коду/названию — инлайн-редактирование
    [["code","code"],["name","name"]].forEach(([cls,field])=>{
      const span=el.querySelector("."+cls);
      span.onclick=()=>{
        el.draggable=false;
        const inp=document.createElement("input");
        inp.type="text"; inp.className="edit"; inp.value=m[field]||"";
        span.replaceWith(inp);
        inp.focus(); inp.select();
        let done=false;
        const commit=(cancel)=>{
          if(done) return; done=true;
          if(!cancel){ m[field]=inp.value.trim(); save(); }
          renderMarkers(); renderSheet();
        };
        inp.onblur=()=>commit(false);
        inp.onkeydown=ev=>{
          if(ev.key==="Enter") commit(false);
          else if(ev.key==="Escape") commit(true);
        };
      };
    });
    el.addEventListener("dragstart",e=>{el.classList.add("drag");e.dataTransfer.setData("text",i)});
    el.addEventListener("dragend",()=>el.classList.remove("drag"));
    el.addEventListener("dragover",e=>e.preventDefault());
    el.addEventListener("drop",e=>{
      e.preventDefault();
      const from=+e.dataTransfer.getData("text"), to=i;
      const arr=state.markers; const [it]=arr.splice(from,1); arr.splice(to,0,it);
      save(); renderMarkers(); renderSheet();
    });
    box.appendChild(el);
  });
}

/* ---------- sets ---------- */
function saveSet(){
  const name=$("#setName").value.trim();
  if(!name){ toast("Название набора?"); return; }
  if(!state.markers.length){ toast("Список маркеров пуст"); return; }
  state.sets.push({id:uid(),name,markers:JSON.parse(JSON.stringify(state.markers))});
  $("#setName").value="";
  save(); renderSets(); toast("Набор сохранён");
}
function applySet(id,append){
  const s=state.sets.find(x=>x.id===id); if(!s) return;
  const copy=JSON.parse(JSON.stringify(s.markers)).map(m=>({...m,id:uid()}));
  state.markers = append ? state.markers.concat(copy) : copy;
  save(); renderMarkers(); renderSheet();
  toast(append?"Добавлено в список":"Набор применён");
}
function deleteSet(id){
  state.sets=state.sets.filter(x=>x.id!==id);
  save(); renderSets();
}
function renderSets(){
  const box=$("#setlist"); box.innerHTML="";
  $("#setCount").textContent = state.sets.length ? `(${state.sets.length})` : "";
  if(!state.sets.length){ box.innerHTML='<div class="hint">Наборов пока нет.</div>'; return; }
  state.sets.forEach(s=>{
    const el=document.createElement("div");
    el.className="setitem";
    el.innerHTML=`<div class="top"><span class="nm">${escapeHtml(s.name)}</span>
        <button class="btn danger small">✕</button></div>
      <div class="meta">${s.markers.length} маркеров</div>
      <div class="acts">
        <button class="btn small primary" data-a="apply">Применить</button>
        <button class="btn small" data-a="append">＋ Добавить</button>
      </div>`;
    el.querySelector(".btn.danger").onclick=()=>deleteSet(s.id);
    el.querySelector('[data-a=apply]').onclick=()=>applySet(s.id,false);
    el.querySelector('[data-a=append]').onclick=()=>applySet(s.id,true);
    box.appendChild(el);
  });
}

/* ---------- design bindings ---------- */
const CHIPS = [["#cCodeB","codeBold"],["#cCodeI","codeItalic"],["#cNameB","nameBold"],["#cNameI","nameItalic"]];
function bindDesign(){
  const d=state.design;
  const set=(id,val)=>{const e=$(id); if(e){ if(e.type==="checkbox") e.checked=val; else e.value=val; }};
  set("#dPaper",d.paper); set("#dOrient",d.orient); set("#dCols",d.cols); set("#dPad",d.pad);
  set("#dRow",d.rowH); set("#dStripW",d.stripW); set("#dGap",d.gap);
  set("#dCode",d.showCode); set("#dNameShow",d.showName);
  set("#dBorder",d.border); set("#dCorner",d.corner); set("#dFont",d.font); set("#dFs",d.fs);
  set("#dSpotShape",d.spotShape); set("#dSpots",d.spots);
  set("#dSpotSize",d.spotSize); set("#dSpotIndent",d.spotIndent);
  set("#dCodeIndent",d.codeIndent); set("#dNameIndent",d.nameIndent);
  set("#dRing",d.ring); set("#dRingSize",d.ringSize); set("#dRingIndent",d.ringIndent);
  set("#dLine",d.line); set("#dLineX",d.lineX); set("#dLineW",d.lineW);
  set("#dLineColor",d.lineColor); set("#dTextColor",d.textColor);
  set("#dBgFit",d.bgFit); set("#dBgOpacity",d.bgOpacity); set("#dBgSize",d.bgSize);
  set("#dBgPosX",d.bgPosX); set("#dBgPosY",d.bgPosY); set("#dBgRotate",d.bgRotate);
  CHIPS.forEach(([sel,key])=>$(sel).classList.toggle("on",!!d[key]));
  updateBgUI();
  updateRangeLabels();
}
function readDesign(){
  const d=state.design;
  const g=(id)=>$(id);
  d.paper=g("#dPaper").value; d.orient=g("#dOrient").value;
  d.cols=+g("#dCols").value; d.pad=+g("#dPad").value;
  d.rowH=+g("#dRow").value; d.stripW=+g("#dStripW").value; d.gap=+g("#dGap").value;
  d.showCode=g("#dCode").checked; d.showName=g("#dNameShow").checked;
  d.border=g("#dBorder").checked; d.corner=+g("#dCorner").value; d.font=g("#dFont").value; d.fs=+g("#dFs").value;
  d.spotShape=g("#dSpotShape").value; d.spots=+g("#dSpots").value;
  d.spotSize=+g("#dSpotSize").value; d.spotIndent=+g("#dSpotIndent").value;
  d.codeIndent=+g("#dCodeIndent").value; d.nameIndent=+g("#dNameIndent").value;
  d.ring=g("#dRing").checked; d.ringSize=+g("#dRingSize").value; d.ringIndent=+g("#dRingIndent").value;
  d.line=g("#dLine").checked; d.lineX=+g("#dLineX").value; d.lineW=+g("#dLineW").value;
  d.lineColor=g("#dLineColor").value; d.textColor=g("#dTextColor").value;
  d.bgFit=g("#dBgFit").value; d.bgOpacity=+g("#dBgOpacity").value; d.bgSize=+g("#dBgSize").value;
  d.bgPosX=+g("#dBgPosX").value; d.bgPosY=+g("#dBgPosY").value; d.bgRotate=+g("#dBgRotate").value;
  updateRangeLabels(); save(); renderSheet();
}
function renderBgPresets(){
  const box=$("#bgPresets"); box.innerHTML="";
  PRESET_PATTERNS.forEach(p=>{
    const uri=patternUri(p.svg);
    const b=document.createElement("button");
    b.title=p.name; b._uri=uri;
    b.style.backgroundImage=`url("${uri}")`;
    b.style.backgroundSize=Math.round(p.size*0.7)+"px";
    b.onclick=()=>{
      state.design.bgImage=uri; state.design.bgFit="tile"; state.design.bgTilePx=p.size;
      if(state.design.bgSize<20) state.design.bgSize=100;
      save(); bindDesign(); renderSheet();
    };
    box.appendChild(b);
  });
}
function updateBgUI(){
  const d=state.design, has=!!d.bgImage;
  $("#bgEmpty").style.display = has ? "none" : "";
  $("#bgLoaded").style.display = has ? "" : "none";
  if(has) $("#bgThumb").src=d.bgImage;
  document.querySelectorAll("#bgModeSeg button").forEach(b=>b.classList.toggle("on",b.dataset.v===d.bgMode));
  document.querySelectorAll("#bgPresets button").forEach(b=>b.classList.toggle("on",b._uri===d.bgImage));
}
function updateSliderFills(){
  document.querySelectorAll('input[type=range]').forEach(el=>{
    const min=+el.min||0, max=+el.max||100, v=+el.value;
    el.style.setProperty('--fill', ((v-min)/(max-min)*100)+'%');
  });
}
function updateRangeLabels(){
  updateSliderFills();
  const d=state.design;
  $("#vCols").textContent=d.cols; $("#vPad").textContent=d.pad+" мм";
  $("#vRow").textContent=d.rowH+" мм";
  $("#vStripW").textContent=d.stripW>0?d.stripW+" мм":"авто";
  $("#vGap").textContent=d.gap+" мм";
  $("#vCorner").textContent=d.corner+" мм";
  $("#vFs").textContent=d.fs+" pt"; $("#vSpots").textContent=d.spots;
  $("#vCodeIndent").textContent=d.codeIndent+" мм";
  $("#vNameIndent").textContent=d.nameIndent+" мм";
  $("#vSpotIndent").textContent=d.spotIndent+" мм";
  $("#vSpotSize").textContent=d.spotSize+" мм"; $("#vRingSize").textContent=d.ringSize+" мм";
  $("#vRingIndent").textContent=d.ringIndent+" мм";
  $("#dLineXNum").value=d.lineX; $("#vLineW").textContent=d.lineW+" px";
  $("#vBgOpacity").textContent=d.bgOpacity+"%"; $("#vBgSize").textContent=d.bgSize+"%";
  $("#vBgPosX").textContent=d.bgPosX+"%"; $("#vBgPosY").textContent=d.bgPosY+"%";
  $("#vBgRotate").textContent=d.bgRotate+"°";
}

/* ---------- render sheet ---------- */
function spotHtml(){
  const d=state.design;
  const sz=d.spotSize*MM;
  const round = d.spotShape==="circle" ? "50%" : (d.corner*MM*0.4+2)+"px";
  return `<span class="spot" style="width:${sz}px;height:${sz}px;
    border-radius:${round};background:#fff;border:1px dashed ${d.lineColor};display:inline-block"></span>`;
}
function spotsBlock(){
  const d=state.design;
  if(d.spots<=0) return "";
  let s=""; for(let i=0;i<d.spots;i++) s+=spotHtml();
  return `<span class="spots" style="position:absolute;left:${d.spotIndent*MM}px;top:50%;transform:translateY(-50%)">${s}</span>`;
}
function ringHtml(){
  const d=state.design;
  if(!d.ring) return "";
  const sz=d.ringSize*MM;
  return `<span class="ring" title="отверстие под кольцо" style="position:absolute;right:${d.ringIndent*MM}px;top:50%;transform:translateY(-50%);
    width:${sz}px;height:${sz}px;border-radius:50%;
    border:1px dashed ${d.lineColor};background:#fff;display:inline-block"></span>`;
}
function fontStyle(bold,italic){
  return `font-weight:${bold?700:400};font-style:${italic?"italic":"normal"}`;
}
function lineHtml(){
  const d=state.design;
  if(!d.line) return "";
  return `<span class="vline" style="position:absolute;left:${d.lineX*MM}px;top:0;bottom:0;
      width:${d.lineW}px;background:${d.lineColor};pointer-events:none"></span>`;
}
function bgLayerCss(){
  const d=state.design;
  const r=d.bgRotate||0;
  let size, repeat, pos=`${d.bgPosX}% ${d.bgPosY}%`;
  if(d.bgFit==="tile"){
    const tile=Math.max(4,(d.bgTilePx||60)*d.bgSize/100);
    size=`${tile}px auto`; repeat="repeat";
  }else if(d.bgFit==="cover"){ size=(d.bgSize===100?"cover":`${d.bgSize}% auto`); repeat="no-repeat"; }
  else if(d.bgFit==="contain"){ size="contain"; repeat="no-repeat"; }
  else { size="100% 100%"; repeat="no-repeat"; } // stretch
  // при повороте слой увеличиваем и центрируем, чтобы углы ленточки не оголялись
  const box = r
    ? `left:-75%;top:-75%;right:auto;bottom:auto;width:250%;height:250%;transform-origin:center;transform:rotate(${r}deg);`
    : `left:0;top:0;right:0;bottom:0;width:auto;height:auto;transform:none;`;
  return `${box}background-image:url('${d.bgImage}');background-size:${size};`
    +`background-repeat:${repeat};background-position:${pos};opacity:${d.bgOpacity/100}`;
}
function cellHtml(m, collapse, idx){
  const d=state.design;
  const spots = spotsBlock();
  const anchor = `position:absolute;top:50%;transform:translateY(-50%);white-space:nowrap`;
  let txt="";
  if(d.showCode) txt+=`<span class="c-code" style="${anchor};left:${d.codeIndent*MM}px;color:${d.textColor};${fontStyle(d.codeBold,d.codeItalic)}">${escapeHtml(m.code||"")}</span>`;
  if(d.showName) txt+=`<span class="c-name" style="${anchor};left:${d.nameIndent*MM}px;${fontStyle(d.nameBold,d.nameItalic)}">${escapeHtml(m.name||"")}</span>`;
  // схлопывание границ: соседние ленточки делят одну линию (без двойной толщины)
  let border;
  if(!d.border) border="border:1px solid transparent";
  else if(collapse) border=`border-right:1px solid ${d.lineColor};border-bottom:1px solid ${d.lineColor}`;
  else border=`border:1px solid ${d.lineColor}`;
  const cellBg = (d.bgImage && d.bgMode==="cell")
    ? `<span class="cell-bg" style="${bgLayerCss()}"></span>` : "";
  return `<div class="cell" data-i="${idx}" style="${border};border-radius:${d.corner*MM}px;position:relative;
      height:${d.rowH*MM}px;font-family:${d.font};font-size:${d.fs}pt;color:${d.textColor}">
      ${cellBg}${lineHtml()}${spots}${txt}${ringHtml()}
    </div>`;
}
/* ---------- трекер ---------- */
function bindTracker(){
  const t=state.tracker, S=(id,v)=>{const e=$(id); if(!e)return; if(e.type==="checkbox")e.checked=v; else e.value=v;};
  ["#tTitleFont","#tFieldFont","#tFont"].forEach(id=>{ if($(id) && !$(id).options.length) fillFontSelect($(id)); });
  S("#tPaper",t.paper); S("#tOrient",t.orient);
  S("#tPadTop",t.padTop); S("#tPadBottom",t.padBottom); S("#tPadLeft",t.padLeft); S("#tPadRight",t.padRight);
  S("#tTitle",t.title); S("#tSubtitle",t.subtitle); S("#tTitleFont",t.titleFont);
  S("#tTitleSize",t.titleSize); S("#tTitleAlign",t.titleAlign);
  S("#tSticker",t.sticker); S("#tStickerText",t.stickerText); S("#tStickerW",t.stickerW); S("#tStickerH",t.stickerH);
  S("#tFields",t.fields.join("\n")); S("#tFieldFont",t.fieldFont); S("#tFieldSize",t.fieldSize);
  S("#tCols",t.cols); S("#tRows",t.rows); S("#tBoxGap",t.boxGap); S("#tBoxR",t.boxR);
  S("#tSqW",t.sqW); S("#tSqH",t.sqH); S("#tRectW",t.rectW); S("#tRectH",t.rectH);
  S("#tLayout",t.layout); S("#tGuides",t.showGuides); S("#tCutLine",t.cutLine);
  const single=t.layout==="single";
  if($("#tPaperWrap")) $("#tPaperWrap").style.display = single ? "" : "none";
  S("#tPunch",t.punch); S("#tPunchN",t.punchN); S("#tPunchSide",t.punchSide); S("#tPunchD",t.punchD); S("#tPunchM",t.punchMargin);
  S("#tPunchDist",t.punchDist); S("#tPunchGaps",t.punchGaps);
  const gw=$("#tPunchGapsWrap"); if(gw) gw.style.display = t.punchDist==="custom" ? "" : "none";
  S("#tFont",t.font); S("#tLineColor",t.lineColor); S("#tTextColor",t.textColor); S("#tAccent",t.accent);
  updateTrackerLabels();
}
function readTracker(){
  const t=state.tracker, g=id=>$(id);
  t.paper=g("#tPaper").value; t.orient=g("#tOrient").value;
  t.padTop=+g("#tPadTop").value; t.padBottom=+g("#tPadBottom").value; t.padLeft=+g("#tPadLeft").value; t.padRight=+g("#tPadRight").value;
  t.title=g("#tTitle").value; t.subtitle=g("#tSubtitle").value; t.titleFont=g("#tTitleFont").value;
  t.titleSize=+g("#tTitleSize").value; t.titleAlign=g("#tTitleAlign").value;
  t.sticker=g("#tSticker").checked; t.stickerText=g("#tStickerText").value; t.stickerW=+g("#tStickerW").value; t.stickerH=+g("#tStickerH").value;
  t.fields=g("#tFields").value.split("\n").map(s=>s.trim()).filter(Boolean);
  t.fieldFont=g("#tFieldFont").value; t.fieldSize=+g("#tFieldSize").value;
  t.cols=+g("#tCols").value; t.rows=+g("#tRows").value; t.boxGap=+g("#tBoxGap").value; t.boxR=+g("#tBoxR").value;
  t.sqW=+g("#tSqW").value; t.sqH=+g("#tSqH").value; t.rectW=+g("#tRectW").value; t.rectH=+g("#tRectH").value;
  t.layout=g("#tLayout").value; t.showGuides=g("#tGuides").checked; t.cutLine=g("#tCutLine").checked;
  const single=t.layout==="single";
  if($("#tPaperWrap")) $("#tPaperWrap").style.display = single ? "" : "none";
  t.punch=g("#tPunch").checked; t.punchN=+g("#tPunchN").value; t.punchSide=g("#tPunchSide").value; t.punchD=+g("#tPunchD").value; t.punchMargin=+g("#tPunchM").value;
  t.punchDist=g("#tPunchDist").value; t.punchGaps=g("#tPunchGaps").value;
  const gw=$("#tPunchGapsWrap"); if(gw) gw.style.display = t.punchDist==="custom" ? "" : "none";
  t.font=g("#tFont").value; t.lineColor=g("#tLineColor").value; t.textColor=g("#tTextColor").value; t.accent=g("#tAccent").value;
  updateTrackerLabels(); save(); renderSheet();
}
function updateTrackerLabels(){
  updateSliderFills(); const t=state.tracker;
  $("#vtPadTop").textContent=t.padTop+" мм"; $("#vtPadBottom").textContent=t.padBottom+" мм";
  $("#vtPadLeft").textContent=t.padLeft+" мм"; $("#vtPadRight").textContent=t.padRight+" мм";
  $("#vtTitleSize").textContent=t.titleSize+" pt";
  $("#vtStickerW").textContent=t.stickerW+" мм"; $("#vtStickerH").textContent=t.stickerH+" мм";
  $("#vtFieldSize").textContent=t.fieldSize+" pt"; $("#vtCols").textContent=t.cols; $("#vtRows").textContent=t.rows;
  $("#vtBoxGap").textContent=t.boxGap+" мм"; $("#vtBoxR").textContent=t.boxR+" px";
  $("#vtSqW").textContent=t.sqW+" мм"; $("#vtSqH").textContent=t.sqH+" мм";
  $("#vtRectW").textContent=t.rectW+" мм"; $("#vtRectH").textContent=t.rectH+" мм";
  $("#vtPunchN").textContent=t.punchN; $("#vtPunchD").textContent=t.punchD+" мм"; $("#vtPunchM").textContent=t.punchMargin+" мм";
}
// позиции центров отверстий (мм) вдоль края длиной along (мм)
function punchPositions(along){
  const t=state.tracker, n=t.punchN, d=t.punchD;
  const edge=t.punchSide==="left"?Math.min(t.padTop,t.padBottom):Math.min(t.padLeft,t.padRight);
  if(t.punchDist==="even"){
    const start=Math.max(edge,d), end=along-Math.max(edge,d);
    return Array.from({length:n},(_,i)=> n===1?(start+end)/2 : start+(end-start)*i/(n-1));
  }
  // свой шаг: n-1 промежутков, группа центрируется по краю
  let gaps=String(t.punchGaps||"").split(/[,\s]+/).map(parseFloat).filter(v=>!isNaN(v)&&v>0);
  if(!gaps.length) gaps=[45];
  const g=[]; for(let i=0;i<n-1;i++) g.push(gaps[Math.min(i,gaps.length-1)]);
  const total=g.reduce((a,b)=>a+b,0);
  let cur=(along-total)/2; const pos=[cur];
  g.forEach(gap=>{ cur+=gap; pos.push(cur); });
  return pos;
}
// раскладка на листе: пресет определяет физический лист, сетку страниц и линию реза
function trackerLayout(){
  const t=state.tracker;
  if(t.layout==="2a5")   return {sheetW:297, sheetH:210, cols:2, rows:1, cut:"v",     paperCss:"A4", orient:"landscape", pages:2};
  if(t.layout==="2a5v")  return {sheetW:210, sheetH:297, cols:1, rows:2, cut:"h",     paperCss:"A4", orient:"portrait",  pages:2};
  if(t.layout==="4a6")   return {sheetW:210, sheetH:297, cols:2, rows:2, cut:"cross", paperCss:"A4", orient:"portrait",  pages:4};
  // одна страница — по «Формат» + «Ориентация»
  const p=PAPER[t.paper]; let w=p.w,h=p.h; if(t.orient==="landscape")[w,h]=[h,w];
  return {sheetW:w, sheetH:h, cols:1, rows:1, cut:null, paperCss:t.paper, orient:t.orient, pages:1};
}
// физический лист печати (для fitWidth и @page)
function trackerSheet(){
  const L=trackerLayout();
  return {key:L.paperCss, w:L.sheetW, h:L.sheetH, orient:L.orient};
}
// HTML одной единицы трекера размером uw×uh мм
function trackerUnitHtml(uw,uh,cut){
  const t=state.tracker;
  const padCss=`${t.padTop*MM}px ${t.padRight*MM}px ${t.padBottom*MM}px ${t.padLeft*MM}px`;
  const titleHtml = t.title ? `<div class="tguide" style="text-align:${t.titleAlign};font-family:${t.titleFont};font-size:${t.titleSize}pt;line-height:1.1">${escapeHtml(t.title)}</div>`:"";
  const subHtml = t.subtitle ? `<div style="text-align:${t.titleAlign};font-family:${t.fieldFont};font-size:${t.fieldSize+2}pt;color:${t.accent};margin-top:1mm">${escapeHtml(t.subtitle)}</div>`:"";
  const fieldsHtml = t.fields.map(f=>`<div style="display:flex;align-items:flex-end;gap:${2*MM}px;margin-bottom:${t.fieldSize*0.6}px">
      <span style="font-family:${t.fieldFont};font-size:${t.fieldSize}pt;white-space:nowrap">${escapeHtml(f)}</span>
      <span style="flex:1;border-bottom:1px solid ${t.lineColor};height:${t.fieldSize}pt"></span></div>`).join("");
  const stWmm=Math.min(t.stickerW, uw-t.padLeft-t.padRight);
  const sticker = t.sticker ? `<div style="flex:0 0 ${stWmm*MM}px;height:${t.stickerH*MM}px;border:1.5px dashed ${t.lineColor};border-radius:8px;display:flex;align-items:center;justify-content:center;text-align:center;color:${t.lineColor};font-family:${t.font};font-size:${t.fieldSize-1}pt;padding:8px">${escapeHtml(t.stickerText||"")}</div>`:"";
  const header = `<div class="tguide" style="display:flex;gap:${6*MM}px;margin-top:${4*MM}px;align-items:center;min-height:${(t.sticker?t.stickerH:26)*MM}px">${sticker}<div class="tguide" style="flex:1;display:flex;flex-direction:column;justify-content:center">${fieldsHtml}</div></div>`;
  const rowH=Math.max(t.sqH,t.rectH)*MM, sq=t.sqW*MM, sqh=t.sqH*MM, rw=t.rectW*MM, rh=t.rectH*MM, br=t.boxR, gp=1.5*MM;
  // клетка = квадрат + прямоугольник + линия (ширина и высота каждого — раздельно)
  const cellInner=`<div style="display:flex;align-items:flex-end;gap:${gp}px;height:${rowH}px">
      <div style="width:${sq}px;height:${sqh}px;flex:0 0 auto;border:1px solid ${t.lineColor};border-radius:${br}px"></div>
      <div style="width:${rw}px;height:${rh}px;flex:0 0 auto;border:1px solid ${t.lineColor};border-radius:${br}px"></div>
      <span style="flex:1;min-width:0;border-bottom:1px solid ${t.lineColor}"></span>
    </div>`;
  let boxes=""; for(let i=0;i<t.cols*t.rows;i++) boxes+=cellInner;
  const grid = `<div class="tguide" style="display:grid;grid-template-columns:repeat(${t.cols},1fr);gap:${t.boxGap*MM}px;margin-top:${6*MM}px">${boxes}</div>`;
  let punch="";
  if(t.punch){
    const dd=t.punchD*MM, m=t.punchMargin*MM;
    const along = t.punchSide==="left" ? uh : uw;
    punchPositions(along).forEach(aMm=>{
      const a=aMm*MM, cx=t.punchSide==="left"?m:a, cy=t.punchSide==="left"?a:m;
      punch+=`<span style="position:absolute;left:${cx-dd/2}px;top:${cy-dd/2}px;width:${dd}px;height:${dd}px;border-radius:50%;border:1px solid ${t.lineColor};background:#fff"></span>`;
    });
  }
  const cutBorder = cut ? `outline:1px dashed ${t.lineColor};outline-offset:-0.5px;` : "";
  return `<div style="position:relative;width:${uw*MM}px;height:${uh*MM}px;padding:${padCss};overflow:hidden;background:#fff;${cutBorder}font-family:${t.font};color:${t.textColor}">${titleHtml}${subHtml}${header}${grid}${punch}</div>`;
}
// линии реза (пунктир) поверх листа
function cutLinesHtml(L,sw,sh){
  if(!state.tracker.cutLine) return "";
  const S=`position:absolute;pointer-events:none;`;
  const v=`<div style="${S}left:${sw/2*MM}px;top:0;height:${sh*MM}px;border-left:1.5px dashed #b7b7bd"></div>`;
  const h=`<div style="${S}top:${sh/2*MM}px;left:0;width:${sw*MM}px;border-top:1.5px dashed #b7b7bd"></div>`;
  if(L.cut==="v") return v;
  if(L.cut==="h") return h;
  if(L.cut==="cross") return v+h;
  return "";
}
function renderTracker(){
  const L=trackerLayout(), sw=L.sheetW, sh=L.sheetH;
  const gcl=state.tracker.showGuides?" guides":"";
  $("#pageStyle").textContent=`@page{size:${L.paperCss==="Letter"?"letter":L.paperCss} ${L.orient};margin:0}`;
  if(L.pages===1){
    $("#sheetWrap").innerHTML=`<div class="sheet${gcl}" style="position:relative;width:${sw*MM}px;height:${sh*MM}px">${trackerUnitHtml(sw,sh,false)}</div>`;
    $("#pageInfo").textContent="Трекер · 1 страница";
  }else{
    const cellW=sw/L.cols, cellH=sh/L.rows;
    let cells="";
    for(let i=0;i<L.cols*L.rows;i++) cells+=`<div style="position:relative;overflow:hidden">${trackerUnitHtml(cellW,cellH,false)}</div>`;
    $("#sheetWrap").innerHTML=`<div class="sheet${gcl}" style="position:relative;width:${sw*MM}px;height:${sh*MM}px;display:grid;grid-template-columns:repeat(${L.cols},1fr);grid-template-rows:repeat(${L.rows},1fr)">${cells}${cutLinesHtml(L,sw,sh)}</div>`;
    $("#pageInfo").textContent=`Трекер · ${L.pages} стр. на листе A4 (разрезать по пунктиру)`;
  }
  applyZoom();
}

// единая разбивка на страницы для превью, печати и PDF
function paginate(){
  const d=state.design, p=PAPER[d.paper];
  let w=p.w, h=p.h;
  if(d.orient==="landscape"){ [w,h]=[h,w]; }
  const rowsPerPage=Math.max(1, Math.floor((h-2*d.pad+d.gap)/(d.rowH+d.gap)));
  const perPage=rowsPerPage*d.cols;
  const pages=[];
  for(let s=0;s<state.markers.length;s+=perPage) pages.push(state.markers.slice(s,s+perPage));
  return {w,h,perPage,pages:pages.length?pages:[[]]};
}
function renderSheet(){
  if(state.mode==="tracker"){ renderTracker(); return; }
  const d=state.design;
  const p=PAPER[d.paper];
  let w=p.w, h=p.h;
  if(d.orient==="landscape"){ [w,h]=[h,w]; }
  // формат страницы для печати 1:1 (без полей браузера и колонтитулов)
  $("#pageStyle").textContent=`@page{size:${d.paper==="Letter"?"letter":d.paper} ${d.orient};margin:0}`;
  const wrap=$("#sheetWrap");
  const sheetStyle=`position:relative;width:${w*MM}px;height:${h*MM}px;padding:${d.pad*MM}px;overflow:hidden`;
  const sheetBg = (d.bgImage && d.bgMode==="sheet")
    ? `<div class="sheet-bg" style="${bgLayerCss()}"></div>` : "";

  if(!state.markers.length){
    wrap.innerHTML=`<div class="sheet" style="${sheetStyle}"><div class="empty-note">Добавьте маркеры — здесь появится разлиновка.</div></div>`;
    $("#pageInfo").textContent="";
    applyZoom();
    return;
  }
  // реальная разбивка на страницы — как при печати и в PDF
  const {perPage, pages:pageChunks} = paginate();
  const collapse = d.border && d.gap===0 && d.corner===0;
  let gridStyle=`display:grid;align-content:start;justify-content:start;`
    +`grid-template-columns:${d.stripW>0?`repeat(${d.cols}, ${d.stripW*MM}px)`:`repeat(${d.cols}, 1fr)`};`
    +`width:${d.stripW>0?"fit-content":"100%"};`
    +`grid-auto-rows:${d.rowH*MM}px;gap:${d.gap*MM}px;position:relative;z-index:1;`
    +(collapse?`border-top:1px solid ${d.lineColor};border-left:1px solid ${d.lineColor};`:"");
  const pages=pageChunks;
  wrap.innerHTML=pages.map((chunk,pi)=>{
    const cells=chunk.map((m,i)=>cellHtml(m,collapse,pi*perPage+i)).join("");
    return `<div class="sheet" style="${sheetStyle}">${sheetBg}<div class="grid" style="${gridStyle}">${cells}</div></div>`;
  }).join("");
  $("#pageInfo").textContent=`${pages.length} стр. · ${perPage} на стр.`;
  applyZoom();
}

/* ---------- экспорт в PDF (canvas → JPEG → PDF без библиотек) ---------- */
const CSSMM = 1/MM; // 1 css-пиксель в мм

function loadBgImage(){
  if(!state.design.bgImage) return Promise.resolve(null);
  return new Promise(r=>{
    const im=new Image();
    im.onload=()=>r(im); im.onerror=()=>r(null);
    im.src=state.design.bgImage;
  });
}
function canvasFont(bold,italic){
  const d=state.design;
  return `${italic?"italic ":""}${bold?"700 ":""}${(d.fs*0.3528).toFixed(3)}px ${d.font}`;
}
function drawBgOn(ctx,x,y,w,h,img){
  const d=state.design;
  ctx.save();
  ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
  ctx.globalAlpha=d.bgOpacity/100;
  const rot=(d.bgRotate||0)*Math.PI/180;
  const cx=x+w/2, cy=y+h/2;
  if(rot){ ctx.translate(cx,cy); ctx.rotate(rot); ctx.translate(-cx,-cy); }
  const ew=rot?w*2.5:w, eh=rot?h*2.5:h;
  const ex=cx-ew/2, ey=cy-eh/2;
  if(d.bgFit==="tile"){
    const tileMm=((d.bgTilePx||60)*d.bgSize/100)*CSSMM;
    const pat=ctx.createPattern(img,"repeat");
    if(pat){
      if(pat.setTransform) pat.setTransform(new DOMMatrix().scale(tileMm/img.naturalWidth));
      ctx.fillStyle=pat; ctx.fillRect(ex,ey,ew,eh);
    }
  }else{
    const ar=img.naturalWidth/img.naturalHeight;
    let dw,dh;
    if(d.bgFit==="stretch"){ dw=ew; dh=eh; }
    else if(d.bgFit==="contain"){ if(ew/eh>ar){dh=eh;dw=eh*ar;}else{dw=ew;dh=ew/ar;} }
    else { if(ew/eh>ar){dw=ew;dh=ew/ar;}else{dh=eh;dw=eh*ar;} }
    ctx.drawImage(img, ex+(ew-dw)*(d.bgPosX/100), ey+(eh-dh)*(d.bgPosY/100), dw, dh);
  }
  ctx.restore();
}
function dashedShape(ctx,draw){
  const d=state.design;
  ctx.save();
  ctx.fillStyle="#fff"; ctx.strokeStyle=d.lineColor;
  ctx.lineWidth=CSSMM; ctx.setLineDash([0.7,0.7]);
  ctx.beginPath(); draw(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawCellOn(ctx,m,x,y,w,h,img){
  const d=state.design;
  if(img && d.bgMode==="cell") drawBgOn(ctx,x,y,w,h,img);
  if(d.border){
    ctx.save();
    ctx.strokeStyle=d.lineColor; ctx.lineWidth=CSSMM;
    ctx.beginPath();
    if(d.corner>0 && ctx.roundRect) ctx.roundRect(x,y,w,h,d.corner); else ctx.rect(x,y,w,h);
    ctx.stroke(); ctx.restore();
  }
  if(d.line){
    ctx.save(); ctx.fillStyle=d.lineColor;
    ctx.fillRect(x+d.lineX, y, d.lineW*CSSMM, h); ctx.restore();
  }
  if(d.spots>0){
    const sz=d.spotSize, gapS=6*CSSMM;
    let sx=x+d.spotIndent, sy=y+h/2;
    for(let i=0;i<d.spots;i++){
      const px=sx, py=sy-sz/2;
      dashedShape(ctx,()=>{
        if(d.spotShape==="circle") ctx.arc(px+sz/2,py+sz/2,sz/2,0,Math.PI*2);
        else if(ctx.roundRect) ctx.roundRect(px,py,sz,sz,(d.corner*MM*0.4+2)*CSSMM);
        else ctx.rect(px,py,sz,sz);
      });
      sx+=sz+gapS;
    }
  }
  ctx.save(); ctx.textBaseline="middle"; ctx.textAlign="left";
  if(d.showCode){
    ctx.font=canvasFont(d.codeBold,d.codeItalic); ctx.fillStyle=d.textColor;
    ctx.fillText(m.code||"", x+d.codeIndent, y+h/2);
  }
  if(d.showName){
    ctx.font=canvasFont(d.nameBold,d.nameItalic); ctx.fillStyle="#777777";
    ctx.fillText(m.name||"", x+d.nameIndent, y+h/2);
  }
  ctx.restore();
  if(d.ring){
    const sz=d.ringSize, rx=x+w-d.ringIndent-sz, ry=y+h/2-sz/2;
    dashedShape(ctx,()=>ctx.arc(rx+sz/2,ry+sz/2,sz/2,0,Math.PI*2));
  }
}
function renderPageCanvas(chunk,img,dpi,w,h){
  const d=state.design, s=dpi/25.4;
  const cv=document.createElement("canvas");
  cv.width=Math.round(w*s); cv.height=Math.round(h*s);
  const ctx=cv.getContext("2d");
  ctx.scale(s,s);
  ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,h);
  if(img && d.bgMode==="sheet") drawBgOn(ctx,0,0,w,h,img);
  const contentW=w-2*d.pad;
  const cellW = d.stripW>0 ? d.stripW : (contentW-d.gap*(d.cols-1))/d.cols;
  chunk.forEach((m,i)=>{
    const col=i%d.cols, row=Math.floor(i/d.cols);
    drawCellOn(ctx,m,d.pad+col*(cellW+d.gap),d.pad+row*(d.rowH+d.gap),cellW,d.rowH,img);
  });
  return cv;
}
function dataUrlToBytes(u){
  const bin=atob(u.split(",")[1]);
  const a=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) a[i]=bin.charCodeAt(i);
  return a;
}
function canvasesToPdf(cvs,wMm,hMm){
  const enc=new TextEncoder();
  const wPt=wMm*72/25.4, hPt=hMm*72/25.4;
  const chunks=[]; let len=0; const off={};
  const push=u8=>{chunks.push(u8); len+=u8.length;};
  const pushStr=s=>push(enc.encode(s));
  const addObj=(id,body,bin)=>{
    off[id]=len;
    pushStr(`${id} 0 obj\n${body}\n`);
    if(bin){ pushStr("stream\n"); push(bin); pushStr("\nendstream\n"); }
    pushStr("endobj\n");
  };
  pushStr("%PDF-1.4\n");
  const n=cvs.length;
  const kids=[]; for(let i=0;i<n;i++) kids.push(`${3+i*3} 0 R`);
  addObj(1,"<< /Type /Catalog /Pages 2 0 R >>");
  addObj(2,`<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${n} >>`);
  cvs.forEach((cv,i)=>{
    const pageId=3+i*3, contId=4+i*3, imgId=5+i*3;
    addObj(pageId,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt.toFixed(2)} ${hPt.toFixed(2)}] `
      +`/Resources << /XObject << /Im0 ${imgId} 0 R >> >> /Contents ${contId} 0 R >>`);
    const content=`q ${wPt.toFixed(2)} 0 0 ${hPt.toFixed(2)} 0 0 cm /Im0 Do Q`;
    addObj(contId,`<< /Length ${content.length} >>`, enc.encode(content));
    const jpg=dataUrlToBytes(cv.toDataURL("image/jpeg",0.95));
    addObj(imgId,`<< /Type /XObject /Subtype /Image /Width ${cv.width} /Height ${cv.height} `
      +`/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>`, jpg);
  });
  const xrefOff=len, total=2+n*3;
  let xref=`xref\n0 ${total+1}\n0000000000 65535 f \n`;
  for(let id=1;id<=total;id++) xref+=String(off[id]).padStart(10,"0")+" 00000 n \n";
  pushStr(xref);
  pushStr(`trailer\n<< /Size ${total+1} /Root 1 0 R >>\nstartxref\n${xrefOff}\n%%EOF`);
  const out=new Uint8Array(len); let o=0;
  chunks.forEach(c=>{out.set(c,o); o+=c.length;});
  return new Blob([out],{type:"application/pdf"});
}
function roundRectPath(ctx,x,y,w,h,r){
  r=Math.max(0,Math.min(r,w/2,h/2));
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
// одна единица трекера размером uw×uh мм → canvas
function drawTrackerUnitCanvas(uw,uh,dpi){
  const t=state.tracker, s=dpi/25.4, pm=v=>v*0.3528;
  const w=uw, h=uh;
  const cv=document.createElement("canvas"); cv.width=Math.round(w*s); cv.height=Math.round(h*s);
  const ctx=cv.getContext("2d"); ctx.scale(s,s);
  ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,h);
  const padL=t.padLeft, padR=t.padRight, padT=t.padTop, padB=t.padBottom;
  const cw=w-padL-padR; let y=padT;
  const alignX=()=>t.titleAlign==="center"?(padL+cw/2):(t.titleAlign==="right"?w-padR:padL);
  ctx.textBaseline="top";
  if(t.title){
    ctx.fillStyle=t.textColor; ctx.font=`${pm(t.titleSize)}px ${t.titleFont}`;
    ctx.textAlign=t.titleAlign; ctx.fillText(t.title,alignX(),y); y+=pm(t.titleSize)*1.2;
  }
  if(t.subtitle){
    ctx.fillStyle=t.accent; ctx.font=`${pm(t.fieldSize+2)}px ${t.fieldFont}`;
    ctx.textAlign=t.titleAlign; ctx.fillText(t.subtitle,alignX(),y); y+=pm(t.fieldSize+2)*1.4;
  }
  y+=3;
  const fieldsH=t.fields.length*pm(t.fieldSize)*1.6;
  const stW=t.sticker?Math.min(t.stickerW,cw):0;
  const stH=t.sticker?t.stickerH:0;
  const headerH=Math.max(fieldsH,stH,26);
  if(t.sticker){
    const bx=padL, by=y+(headerH-stH)/2;
    ctx.save(); ctx.strokeStyle=t.lineColor; ctx.setLineDash([1.2,1.2]); ctx.lineWidth=0.4;
    roundRectPath(ctx,bx,by,stW,stH,2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=t.lineColor; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.font=`${pm(t.fieldSize-1)}px ${t.font}`;
    // перенос подписи по словам под ширину стикера
    const words=(t.stickerText||"").split(/\s+/).filter(Boolean); const lines=[]; let cur="";
    words.forEach(wd=>{ const tryL=cur?cur+" "+wd:wd; if(ctx.measureText(tryL).width>stW-4 && cur){lines.push(cur);cur=wd;} else cur=tryL; });
    if(cur) lines.push(cur);
    const lh=pm(t.fieldSize)*1.2, y0=by+stH/2-(lines.length-1)*lh/2;
    lines.forEach((ln,i)=>ctx.fillText(ln,bx+stW/2,y0+i*lh));
    ctx.restore();
  }
  const fx=padL+(t.sticker?stW+6:0), fw=w-padR-fx;
  let fy=y+(headerH-fieldsH)/2;
  ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  t.fields.forEach(f=>{
    const rowH=pm(t.fieldSize)*1.6, baseY=fy+rowH*0.7;
    ctx.fillStyle=t.textColor; ctx.font=`${pm(t.fieldSize)}px ${t.fieldFont}`;
    ctx.fillText(f,fx,baseY);
    const lw=ctx.measureText(f+" ").width;
    ctx.strokeStyle=t.lineColor; ctx.lineWidth=0.3; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(fx+lw,baseY+1); ctx.lineTo(fx+fw,baseY+1); ctx.stroke();
    fy+=rowH;
  });
  y+=headerH+6;
  const gap=t.boxGap, bw=(cw-gap*(t.cols-1))/t.cols, bh=Math.max(t.sqH,t.rectH), br=t.boxR*CSSMM;
  const gp=1.5, sq=t.sqW, sqh=t.sqH, rw=t.rectW, rh=t.rectH;
  ctx.strokeStyle=t.lineColor; ctx.lineWidth=0.3; ctx.setLineDash([]);
  for(let i=0;i<t.cols*t.rows;i++){
    const c=i%t.cols, r=Math.floor(i/t.cols), bx=padL+c*(bw+gap), by=y+r*(bh+gap);
    if(by+bh>h-padB) break;
    const bottom=by+bh; // элементы прижаты к низу ряда
    roundRectPath(ctx,bx,bottom-sqh,sq,sqh,br); ctx.stroke();
    roundRectPath(ctx,bx+sq+gp,bottom-rh,rw,rh,br); ctx.stroke();
    const lineStart=bx+sq+gp+rw+gp;
    if(lineStart<bx+bw-1){ ctx.beginPath(); ctx.moveTo(lineStart,bottom); ctx.lineTo(bx+bw,bottom); ctx.stroke(); }
  }
  if(t.punch){
    const dd=t.punchD, m=t.punchMargin;
    const along=t.punchSide==="left"?h:w;
    ctx.strokeStyle=t.lineColor; ctx.lineWidth=0.3; ctx.setLineDash([]);
    punchPositions(along).forEach(a=>{
      const cx=t.punchSide==="left"?m:a, cy=t.punchSide==="left"?a:m;
      ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(cx,cy,dd/2,0,7); ctx.fill(); ctx.stroke();
    });
  }
  return cv;
}
function drawTrackerCanvas(dpi){
  const L=trackerLayout(), sw=L.sheetW, sh=L.sheetH;
  if(L.pages===1){
    return {cv:drawTrackerUnitCanvas(sw,sh,dpi), w:sw, h:sh};
  }
  const s=dpi/25.4, t=state.tracker;
  const sheet=document.createElement("canvas"); sheet.width=Math.round(sw*s); sheet.height=Math.round(sh*s);
  const ctx=sheet.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,sheet.width,sheet.height);
  const cellW=sw/L.cols, cellH=sh/L.rows;
  const unit=drawTrackerUnitCanvas(cellW,cellH,dpi);
  for(let i=0;i<L.cols*L.rows;i++){
    const c=i%L.cols, r=Math.floor(i/L.cols);
    ctx.drawImage(unit,Math.round(c*cellW*s),Math.round(r*cellH*s));
  }
  // линии реза
  if(t.cutLine){
    ctx.strokeStyle="#b7b7bd"; ctx.lineWidth=1.5; ctx.setLineDash([6,5]);
    if(L.cut==="v"||L.cut==="cross"){ ctx.beginPath(); ctx.moveTo(sw/2*s,0); ctx.lineTo(sw/2*s,sh*s); ctx.stroke(); }
    if(L.cut==="h"||L.cut==="cross"){ ctx.beginPath(); ctx.moveTo(0,sh/2*s); ctx.lineTo(sw*s,sh/2*s); ctx.stroke(); }
    ctx.setLineDash([]);
  }
  return {cv:sheet, w:sw, h:sh};
}
async function exportPdf(){
  if(state.mode!=="tracker" && !state.markers.length){ toast("Сначала добавьте маркеры"); return; }
  toast("Готовим PDF…");
  try{ await document.fonts.ready; }catch(e){}
  let cvs, w, h;
  if(state.mode==="tracker"){
    const res=drawTrackerCanvas(200); cvs=[res.cv]; w=res.w; h=res.h;
  }else{
    const img=await loadBgImage();
    const pg=paginate(); w=pg.w; h=pg.h;
    cvs=pg.pages.map(chunk=>renderPageCanvas(chunk,img,200,w,h));
  }
  const blob=canvasesToPdf(cvs,w,h);
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download="palette.pdf"; a.rel="noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
  toast(`PDF готов · ${cvs.length} стр.`);
}

/* ---------- zoom ---------- */
function applyZoom(){
  $("#sheetWrap").style.transform=`scale(${state.zoom})`;
  $("#zoomVal").textContent=Math.round(state.zoom*100)+"%";
}
function fitWidth(){
  let w;
  if(state.mode==="tracker"){ w=trackerSheet().w*MM; }
  else { const p=PAPER[state.design.paper]; w=(state.design.orient==="landscape"?p.h:p.w)*MM; }
  const avail=$(".main").clientWidth-60;
  state.zoom=Math.min(1.2, Math.max(0.2, avail/w));
  applyZoom();
}

/* ---------- share / export / import ---------- */
function payload(){
  return {v:1, markers:state.markers, sets:state.sets, design:state.design};
}
function encodeShare(){
  const json=JSON.stringify(payload());
  return btoa(unescape(encodeURIComponent(json)));
}
function decodeShare(str){
  return JSON.parse(decodeURIComponent(escape(atob(str))));
}
function makeShareLink(){
  const base=location.href.split("#")[0];
  return base+"#p="+encodeShare();
}
function importData(obj,{merge}={}){
  if(!obj) return;
  if(obj.design) state.design={...DEFAULT_DESIGN,...obj.design};
  if(merge){
    if(obj.markers) state.markers=state.markers.concat(obj.markers.map(m=>({...m,id:uid()})));
    if(obj.sets) state.sets=state.sets.concat(obj.sets.map(s=>({...s,id:uid()})));
  }else{
    if(obj.markers) state.markers=obj.markers;
    if(obj.sets) state.sets=obj.sets;
  }
  save(); bindDesign(); renderMarkers(); renderSets(); renderSheet();
}

/* ---------- modal ---------- */
function modal({title,hint,value,readonly,onOk}){
  $("#modalTitle").textContent=title;
  $("#modalHint").textContent=hint||"";
  const ta=$("#modalText"); ta.value=value||""; ta.readOnly=!!readonly;
  $("#modalBg").classList.add("show");
  if(readonly){ ta.focus(); ta.select(); }
  $("#modalOk").onclick=()=>{ if(onOk) onOk(ta.value); $("#modalBg").classList.remove("show"); };
  $("#modalOk").style.display = onOk ? "" : "none";
}

/* ---------- util ---------- */
function escapeHtml(s){return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}

/* ---------- events ---------- */
function initEvents(){
  document.querySelectorAll(".tabs button").forEach(b=>{
    b.onclick=()=>{
      document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      document.querySelectorAll(".tabpane").forEach(p=>p.style.display="none");
      $(`[data-pane=${b.dataset.tab}]`).style.display="";
    };
  });

  // мобильная навигация: Маркеры/Наборы/Дизайн — панель, Превью — лист
  document.querySelectorAll("#mobileNav button").forEach(b=>{
    b.onclick=()=>setMView(b.dataset.mtab);
  });
  $("#btnAdd").onclick=()=>{
    addMarker($("#addCode").value,$("#addName").value);
    $("#addCode").value=""; $("#addCode").focus(); // название остаётся для серии
  };

  // массовое добавление: одно название + много кодов (в т.ч. диапазоны B701-750)
  const expandCodes=(text)=>{
    const out=[];
    text.split(/[\n,;]+/).map(s=>s.trim()).filter(Boolean).forEach(tok=>{
      const m=tok.match(/^(.*?)(\d+)[-–—](?:\D*?)(\d+)$/);
      if(m){
        const [,prefix,a,b]=m;
        let from=parseInt(a,10), to=parseInt(b,10);
        if(to>=from && to-from<999){
          const pad=a.length;
          for(let i=from;i<=to;i++) out.push(prefix+String(i).padStart(pad,"0"));
          return;
        }
      }
      out.push(tok);
    });
    return out;
  };
  const bulkPreview=()=>{
    const n=expandCodes($("#bulkCodes").value).length;
    $("#bulkHint").innerHTML = n
      ? `Будет добавлено: <b>${n}</b> шт.`
      : `Разделители: запятая или новая строка (коды с пробелами вроде «G 202» не разрезаются). Диапазоны: <b>701-750</b>, <b>B701-750</b>, <b>001-050</b> (нули сохраняются).`;
  };
  $("#bulkCodes").addEventListener("input",bulkPreview);
  $("#btnBulk").onclick=()=>{
    const name=$("#bulkName").value.trim();
    const codes=expandCodes($("#bulkCodes").value);
    if(!codes.length){ toast("Введите коды"); return; }
    codes.forEach(code=>state.markers.push({id:uid(),code,name}));
    save(); renderMarkers(); renderSheet();
    $("#bulkCodes").value=""; bulkPreview();
    toast(`Добавлено ${codes.length} маркеров${name?" · "+name:""}`);
  };
  $("#addName").addEventListener("keydown",e=>{if(e.key==="Enter")$("#btnAdd").click();});
  $("#addCode").addEventListener("keydown",e=>{if(e.key==="Enter")$("#addName").focus();});
  $("#btnClearMarkers").onclick=()=>{ if(confirm("Очистить весь список маркеров?")){state.markers=[];save();renderMarkers();renderSheet();} };

  $("#btnSaveSet").onclick=saveSet;

  // #dLineXNum исключён: у него свой обработчик, иначе общий перезаписывал бы вводимое число
  document.querySelectorAll("#stripsDesign input:not(#dLineXNum), #stripsDesign select")
    .forEach(el=>el.addEventListener("input",readDesign));

  // трекер: все настройки
  document.querySelectorAll("#trackerDesign input, #trackerDesign select, #trackerDesign textarea")
    .forEach(el=>el.addEventListener("input",readTracker));
  $("#btnResetTracker").onclick=()=>{ state.tracker={...DEFAULT_TRACKER}; bindTracker(); save(); renderSheet(); toast("Трекер сброшен"); };

  // переключатель режима Разлиновка / Трекер
  document.querySelectorAll("#modeSeg button").forEach(b=>{
    b.onclick=()=>setMode(b.dataset.v);
  });
  CHIPS.forEach(([sel,key])=>{
    $(sel).onclick=()=>{
      state.design[key]=!state.design[key];
      $(sel).classList.toggle("on",state.design[key]);
      save(); renderSheet();
    };
  });
  $("#btnResetDesign").onclick=()=>{ state.design={...DEFAULT_DESIGN}; bindDesign(); save(); renderSheet(); toast("Дизайн сброшен"); };

  // числовой ввод положения полоски синхронизирован со слайдером
  $("#dLineXNum").addEventListener("input",()=>{
    const el=$("#dLineXNum");
    if(el.value==="") return; // даём стереть поле перед вводом нового числа
    const v=Math.max(0,Math.min(200,Math.round(+el.value)||0));
    $("#dLineX").value=v;
    readDesign();
  });
  $("#dLineXNum").addEventListener("blur",()=>{ $("#dLineXNum").value=state.design.lineX; });

  // рисунок / паттерн
  const pickBg=()=>$("#bgFile").click();
  $("#bgDrop").onclick=pickBg;
  $("#bgReplace").onclick=pickBg;
  $("#bgFile").addEventListener("change",e=>{
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=()=>{ state.design.bgImage=rd.result; state.design.bgTilePx=80; save(); updateBgUI(); renderSheet();
      try{ if(localStorage.getItem(LS).length>4.5e6) toast("Картинка большая — может не сохраниться"); }catch(err){ toast("Слишком большая картинка для сохранения"); } };
    rd.readAsDataURL(f);
    e.target.value="";
  });
  $("#bgClear").onclick=()=>{ state.design.bgImage=""; save(); updateBgUI(); renderSheet(); };
  document.querySelectorAll("#bgModeSeg button").forEach(b=>{
    b.onclick=()=>{ state.design.bgMode=b.dataset.v; save(); updateBgUI(); renderSheet(); };
  });

  $("#zoomIn").onclick=()=>{state.zoom=Math.min(1.5,state.zoom+0.1);applyZoom();};
  $("#zoomOut").onclick=()=>{state.zoom=Math.max(0.2,state.zoom-0.1);applyZoom();};
  $("#zoomFit").onclick=fitWidth;

  $("#btnTheme").onclick=()=>applyTheme(document.body.dataset.theme==="dark"?"light":"dark");
  $("#btnPrint").onclick=()=>window.print();
  $("#btnPdf").onclick=exportPdf;
  $("#btnShare").onclick=()=>{
    const link=makeShareLink();
    if(link.length>16000){
      toast("Слишком много данных для ссылки — используйте экспорт JSON");
    }
    navigator.clipboard?.writeText(link).then(()=>toast("Ссылка скопирована"),()=>{});
    modal({title:"Поделиться",hint:"Ссылка содержит всю палитру и настройки. Отправьте её другу — откроется как есть. (Также скопирована в буфер.)",value:link,readonly:true});
  };
  $("#btnExport").onclick=()=>{
    const data=JSON.stringify(payload(),null,2);
    const blob=new Blob([data],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download="palette.json"; a.click();
    modal({title:"Экспорт JSON",hint:"Файл palette.json скачан. Ниже — те же данные, можно скопировать.",value:data,readonly:true});
  };
  // выезжающая панель импорта
  const openDrawer=()=>{ $("#importDrawer").classList.add("show"); $("#drawerBg").classList.add("show"); $("#drawerText").focus(); };
  const closeDrawer=()=>{ $("#importDrawer").classList.remove("show"); $("#drawerBg").classList.remove("show"); };
  $("#btnImport").onclick=openDrawer;
  $("#drawerClose").onclick=closeDrawer;
  $("#drawerBg").onclick=closeDrawer;
  $("#drawerImport").onclick=()=>{
    const txt=$("#drawerText").value.trim(); if(!txt){ toast("Вставьте данные"); return; }
    try{
      const obj = txt.startsWith("{") ? JSON.parse(txt) : decodeShare(txt.replace(/^#?p=/,""));
      importData(obj); $("#drawerText").value=""; closeDrawer(); toast("Импортировано");
    }catch(e){ toast("Не удалось разобрать данные"); }
  };
  $("#drawerShare").onclick=()=>{ closeDrawer(); $("#btnShare").click(); };
  $("#drawerExport").onclick=()=>{ closeDrawer(); $("#btnExport").click(); };
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeDrawer(); });
  // клик по тексту ленточки на листе — редактирование на месте
  $("#sheetWrap").addEventListener("click",e=>{
    const t=e.target.closest(".c-code,.c-name");
    if(!t || t.isContentEditable) return;
    const cell=t.closest(".cell");
    const m=state.markers[+cell.dataset.i]; if(!m) return;
    const field=t.classList.contains("c-code")?"code":"name";
    t.contentEditable="true";
    t.focus();
    const range=document.createRange(); range.selectNodeContents(t);
    const sel=getSelection(); sel.removeAllRanges(); sel.addRange(range);
    let done=false;
    const commit=(cancel)=>{
      if(done) return; done=true;
      if(!cancel){ m[field]=t.textContent.trim(); save(); }
      renderMarkers(); renderSheet();
    };
    t.onblur=()=>commit(false);
    t.onkeydown=ev=>{
      if(ev.key==="Enter"){ ev.preventDefault(); commit(false); }
      else if(ev.key==="Escape"){ commit(true); }
    };
  });

  $("#modalCancel").onclick=()=>$("#modalBg").classList.remove("show");
  $("#modalBg").onclick=e=>{ if(e.target===$("#modalBg")) $("#modalBg").classList.remove("show"); };
}

/* ---------- режим листа ---------- */
function setMode(v){
  state.mode=v; save();
  document.querySelectorAll("#modeSeg button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));
  $("#stripsDesign").style.display = v==="tracker" ? "none" : "";
  $("#trackerDesign").style.display = v==="tracker" ? "" : "none";
  // в режиме трекера маркеры/наборы не нужны — прячем их вкладки, оставляем «Дизайн»
  const isTracker = v==="tracker";
  document.querySelector('.tabs button[data-tab=markers]').style.display = isTracker ? "none" : "";
  document.querySelector('.tabs button[data-tab=sets]').style.display = isTracker ? "none" : "";
  const dTab=document.querySelector('.tabs button[data-tab=design]');
  dTab.textContent = isTracker ? "Настройки трекера" : "Дизайн";
  if(isTracker) dTab.click();
  else if(!document.querySelector('.tabs button.active')) document.querySelector('.tabs button[data-tab=markers]').click();
  // подсветка активного режима в меню
  document.querySelector('#modeSeg')?.setAttribute('data-mode',v);
  renderSheet(); fitWidth();
}

/* ---------- приветственная страница ---------- */
function unsplash(id){ return `https://images.unsplash.com/photo-${id}?w=900&q=70&auto=format&fit=crop`; }
function showWelcome(){ $("#welcome").classList.add("show"); }
function hideWelcome(){ $("#welcome").classList.remove("show"); localStorage.setItem("palette_seen","1"); }
function spawnFloaties(){
  const box=$("#floaties"); if(!box) return;
  box.innerHTML="";
  const emojis=["🖊️","🎨","✏️","🖍️","🌈","✨","🖌️","🟣","🔵","🟢","🟡","🩷"];
  const colors=["#5b8cff","#ff6fae","#54d6a6","#ffc24d","#c181d1","#00c2d6"];
  const N=22;
  for(let i=0;i<N;i++){
    const el=document.createElement("span");
    const useEmoji=Math.random()<0.6;
    const size=useEmoji?(16+Math.random()*20):(6+Math.random()*12);
    el.className="floatie"+(useEmoji?"":" dot");
    if(useEmoji){ el.textContent=emojis[(Math.random()*emojis.length)|0]; el.style.fontSize=size+"px"; }
    else { el.style.width=size+"px"; el.style.height=size+"px"; el.style.background=colors[(Math.random()*colors.length)|0]; el.style.opacity=".0"; }
    el.style.left=(Math.random()*100)+"vw";
    el.style.setProperty("--sway",(Math.random()*80-40)+"px");
    el.style.animationDuration=(12+Math.random()*16)+"s";
    el.style.animationDelay=(-Math.random()*20)+"s";
    box.appendChild(el);
  }
}
function initWelcome(){
  spawnFloaties();
  // подгружаем фото Unsplash с плавным фолбэком на градиент
  document.querySelectorAll(".wcard-img[data-img]").forEach(el=>{
    const im=new Image();
    im.onload=()=>{ el.style.backgroundImage=`url("${unsplash(el.dataset.img)}")`; };
    im.src=unsplash(el.dataset.img);
  });
  document.querySelectorAll(".wcard[data-choose]").forEach(b=>{
    b.onclick=()=>{ hideWelcome(); setMode(b.dataset.choose); fitWidth(); };
  });
  $("#welcomeSkip").onclick=hideWelcome;
  $("#btnHome").onclick=showWelcome;
  if(!localStorage.getItem("palette_seen")) showWelcome();
}

/* ---------- mobile view ---------- */
function setMView(v){
  document.body.dataset.mview=v;
  document.querySelectorAll("#mobileNav button").forEach(b=>b.classList.toggle("active",b.dataset.mtab===v));
  if(v==="preview"){
    fitWidth();
  }else{
    const tab=document.querySelector(`.tabs button[data-tab=${v}]`);
    if(tab) tab.onclick();
  }
}

/* ---------- boot ---------- */
function boot(){
  initTheme();
  load();
  if(location.hash.startsWith("#p=")){
    try{ importData(decodeShare(location.hash.slice(3))); toast("Палитра загружена из ссылки");
      history.replaceState(null,"",location.pathname);
    }catch(e){}
  }
  renderBgPresets();
  bindDesign();
  bindTracker();
  initEvents();
  setMode(state.mode);
  renderMarkers(); renderSets(); renderSheet();
  if(matchMedia("(max-width:800px)").matches) setMView("markers");
  initWelcome();
  fitWidth();
}
boot();
