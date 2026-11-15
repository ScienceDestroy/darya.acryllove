"use strict";
/* =========================================================
   Движок разметки. ВСЕ размеры — в миллиметрах.
   Раскладка строит «список фигур» (rect/circle/line/text/image/group),
   который затем рисуется ОДИНАКОВО:
     • в SVG — превью на экране и печать через браузер;
     • в canvas — экспорт PDF.
   Поэтому превью, печать и PDF совпадают до долей миллиметра.
   ========================================================= */
const PT = 25.4/72;        // мм в одном пункте шрифта
const PX = 25.4/96;        // мм в одном CSS-пикселе
const PX_PER_MM = 96/25.4; // CSS-пикселей в мм (экран при 100%)
const PAPER = { A3:[297,420], A4:[210,297], A5:[148,210], A6:[105,148], Letter:[215.9,279.4] };

function paperSize(key, orient, cw, ch){
  let w, h;
  if(key==="custom"){ w=+cw||210; h=+ch||297; return {w,h}; }
  [w,h] = PAPER[key]||PAPER.A4;
  return orient==="landscape" ? {w:Math.max(w,h),h:Math.min(w,h)} : {w:Math.min(w,h),h:Math.max(w,h)};
}
const r3 = v => Math.round(v*1000)/1000;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
function escXml(s){ return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

/* ---------- измерение текста (через canvas, с реальными веб-шрифтами) ---------- */
const _mctx = document.createElement("canvas").getContext("2d");
const _metrics = new Map();
const fontCss = (fam,w,it,px) => `${it?"italic ":""}${w||400} ${px}px ${fam}`;
function fontMetrics(fam,w,it){
  const k=fam+"|"+w+"|"+it;
  if(_metrics.has(k)) return _metrics.get(k);
  _mctx.font=fontCss(fam,w,it,100);
  const cap=_mctx.measureText("H0").actualBoundingBoxAscent/100||0.7;
  const m=_mctx.measureText("Hgjy");
  const asc=(m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent*1.15)/100;
  const desc=(m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent*1.15)/100;
  const r={cap,asc,desc}; _metrics.set(k,r); return r;
}
function textWidth(s,fam,w,it,size){ _mctx.font=fontCss(fam,w,it,100); return _mctx.measureText(s).width/100*size; }
function clearMetrics(){ _metrics.clear(); }
// уместить текст в ширину: сначала уменьшить (до 70%), потом обрезать с «…»
function fitText(s,fam,w,it,size,maxW,auto){
  s=String(s||"");
  if(!s) return {s,size,cut:false};
  if(maxW<=0.5) return {s:"",size,cut:true};
  const tw=textWidth(s,fam,w,it,size);
  if(tw<=maxW) return {s,size,cut:false};
  let sz=size;
  if(auto){ sz=Math.max(size*0.7,size*maxW/tw*0.995); if(textWidth(s,fam,w,it,sz)<=maxW) return {s,size:sz,cut:false,shrunk:true}; }
  let lo=0,hi=s.length;
  while(lo<hi){ const mid=(lo+hi+1)>>1; if(textWidth(s.slice(0,mid)+"…",fam,w,it,sz)<=maxW) lo=mid; else hi=mid-1; }
  return {s:lo?s.slice(0,lo).trimEnd()+"…":"",size:sz,cut:true};
}

/* ---------- картинки ---------- */
const imgCache = new Map(); // src → {img,w,h,ok}
let onImageReady = ()=>{};
function getImg(src){
  if(!src) return null;
  let e=imgCache.get(src);
  if(!e){
    e={ok:false}; imgCache.set(src,e);
    const im=new Image();
    im.onload=()=>{ e.img=im; e.w=im.naturalWidth||100; e.h=im.naturalHeight||100; e.ok=true; onImageReady(); };
    im.onerror=()=>{ e.err=true; };
    im.src=src;
  }
  return e.ok?e:null;
}
function waitImages(srcs){
  return Promise.all([...new Set(srcs.filter(Boolean))].map(src=>new Promise(res=>{
    const e=imgCache.get(src); if(e&&e.ok) return res();
    const im=new Image(); im.onload=()=>{ imgCache.set(src,{img:im,w:im.naturalWidth||100,h:im.naturalHeight||100,ok:true}); res(); };
    im.onerror=()=>res(); im.src=src;
  })));
}
function collectImages(items,out=[]){
  items.forEach(it=>{ if(it.k==="image") out.push(it.src); else if(it.k==="group") collectImages(it.items,out); });
  return out;
}
// размещение картинки в области clip (общая математика для SVG и canvas)
function imagePlacement(it,nat){
  const {x,y,w,h}=it.clip, cx=x+w/2, cy=y+h/2, rot=it.rot||0;
  const ew=rot?w*2.5:w, eh=rot?h*2.5:h, ex=cx-ew/2, ey=cy-eh/2, ar=nat.w/nat.h;
  if(it.fit==="tile"){
    const tw=Math.max(0.5,it.tileMm), th=tw/ar;
    const ox=x+(((w-tw)*it.posX/100)%tw), oy=y+(((h-th)*it.posY/100)%th);
    return {tile:true,tw,th,ox,oy,ex,ey,ew,eh,cx,cy,rot};
  }
  let dw,dh;
  if(it.fit==="stretch"){ dw=ew; dh=eh; }
  else if(it.fit==="contain"){ if(ew/eh>ar){dh=eh;dw=eh*ar;}else{dw=ew;dh=ew/ar;} }
  else if(it.scale && it.scale!==100){ dw=ew*it.scale/100; dh=dw/ar; }
  else { if(ew/eh>ar){dw=ew;dh=ew/ar;}else{dh=eh;dw=eh*ar;} }
  return {tile:false,x:ex+(ew-dw)*it.posX/100,y:ey+(eh-dh)*it.posY/100,w:dw,h:dh,cx,cy,rot};
}

/* ---------- фигуры ---------- */
const S = {
  rect:(x,y,w,h,o={})=>({k:"rect",x,y,w,h,...o}),
  circle:(cx,cy,r,o={})=>({k:"circle",cx,cy,r,...o}),
  line:(x1,y1,x2,y2,o={})=>({k:"line",x1,y1,x2,y2,...o}),
  text:(x,y,s,o={})=>({k:"text",x,y,s,...o}),
  group:(items,o={})=>({k:"group",items,tx:0,ty:0,sx:1,sy:1,...o}),
};
// базовая линия, при которой заглавные буквы стоят ровно по центру cy
function baselineCentered(cy,fam,w,it,size){ return cy+fontMetrics(fam,w,it).cap*size/2; }

/* =========================================================
   SVG
   ========================================================= */
let _svgUid=0;
function svgItems(items,defs){
  let out="";
  for(const it of items){
    const st = it.stroke ? ` stroke="${it.stroke}" stroke-width="${r3(it.sw||0.25)}"${it.dash?` stroke-dasharray="${it.dash.join(" ")}"`:""}` : "";
    const fill = ` fill="${it.fill||"none"}"`;
    const op = it.opacity!=null&&it.opacity<1 ? ` opacity="${it.opacity}"` : "";
    switch(it.k){
      case "rect": out+=`<rect x="${r3(it.x)}" y="${r3(it.y)}" width="${r3(it.w)}" height="${r3(it.h)}"${it.r?` rx="${r3(it.r)}"`:""}${fill}${st}${op}/>`; break;
      case "circle": out+=`<circle cx="${r3(it.cx)}" cy="${r3(it.cy)}" r="${r3(it.r)}"${fill}${st}${op}/>`; break;
      case "line": out+=`<line x1="${r3(it.x1)}" y1="${r3(it.y1)}" x2="${r3(it.x2)}" y2="${r3(it.y2)}"${st}${it.cap?` stroke-linecap="${it.cap}"`:""}${op}/>`; break;
      case "text": {
        const ref = it.ref ? ` data-i="${it.ref.i}" data-f="${it.ref.f}"` : "";
        out+=`<text x="${r3(it.x)}" y="${r3(it.y)}" font-family="${escXml(it.fam)}" font-size="${r3(it.size)}"`
          +`${it.w&&it.w!==400?` font-weight="${it.w}"`:""}${it.it?` font-style="italic"`:""} fill="${it.fill||"#000"}"`
          +`${it.anchor&&it.anchor!=="start"?` text-anchor="${it.anchor}"`:""}${op}${ref} xml:space="preserve">${escXml(it.s)}</text>`;
        break;
      }
      case "image": {
        const e=getImg(it.src); if(!e) break;
        const P=imagePlacement(it,e), id="c"+(++_svgUid), c=it.clip;
        defs.push(`<clipPath id="${id}"><rect x="${r3(c.x)}" y="${r3(c.y)}" width="${r3(c.w)}" height="${r3(c.h)}"${c.r?` rx="${r3(c.r)}"`:""}/></clipPath>`);
        const href=escXml(it.src);
        if(P.tile){
          const pid="p"+(++_svgUid);
          defs.push(`<pattern id="${pid}" patternUnits="userSpaceOnUse" x="${r3(P.ox)}" y="${r3(P.oy)}" width="${r3(P.tw)}" height="${r3(P.th)}"${P.rot?` patternTransform="rotate(${P.rot} ${r3(P.cx)} ${r3(P.cy)})"`:""}><image href="${href}" width="${r3(P.tw)}" height="${r3(P.th)}" preserveAspectRatio="none"/></pattern>`);
          out+=`<rect clip-path="url(#${id})" x="${r3(c.x)}" y="${r3(c.y)}" width="${r3(c.w)}" height="${r3(c.h)}" fill="url(#${pid})" opacity="${it.opacity}"/>`;
        }else{
          out+=`<g clip-path="url(#${id})"><image href="${href}" x="${r3(P.x)}" y="${r3(P.y)}" width="${r3(P.w)}" height="${r3(P.h)}" preserveAspectRatio="none" opacity="${it.opacity}"${P.rot?` transform="rotate(${P.rot} ${r3(P.cx)} ${r3(P.cy)})"`:""}/></g>`;
        }
        break;
      }
      case "group":
        out+=`<g transform="translate(${r3(it.tx)} ${r3(it.ty)}) scale(${it.sx} ${it.sy})">${svgItems(it.items,defs)}</g>`; break;
    }
  }
  return out;
}
// page = {w,h,items,pv}; opts: preview (рисовать вспом. слой), cal (калибровка), pxW (ширина на экране)
function pageSvg(page,{preview=false,cal=null,pxW=null}={}){
  const defs=[];
  let body=svgItems(page.items,defs);
  if(cal) body=`<g transform="translate(${cal.ox} ${cal.oy}) scale(${cal.sx} ${cal.sy})">${body}</g>`;
  if(preview && page.pv) body+=svgItems(page.pv,defs);
  const size = pxW ? `width="${r3(pxW)}" height="${r3(pxW*page.h/page.w)}"` : `width="${page.w}mm" height="${page.h}mm"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" ${size} viewBox="0 0 ${page.w} ${page.h}">`
    +`${defs.length?`<defs>${defs.join("")}</defs>`:""}<rect width="${page.w}" height="${page.h}" fill="#fff"/>${body}</svg>`;
}

/* =========================================================
   Canvas (для PDF). Текст рисуется в реальном пиксельном размере,
   чтобы не было ошибок округления мелких шрифтов.
   ========================================================= */
function canvasItems(ctx,items,k){
  for(const it of items){
    ctx.save();
    if(it.opacity!=null) ctx.globalAlpha*=it.opacity;
    const stroke=()=>{ if(!it.stroke) return; ctx.strokeStyle=it.stroke; ctx.lineWidth=it.sw||0.25; ctx.setLineDash(it.dash||[]); ctx.lineCap=it.cap||"butt"; ctx.stroke(); };
    const fill=()=>{ if(it.fill&&it.fill!=="none"){ ctx.fillStyle=it.fill; ctx.fill(); } };
    switch(it.k){
      case "rect": ctx.beginPath(); roundRectPath(ctx,it.x,it.y,it.w,it.h,it.r||0); fill(); stroke(); break;
      case "circle": ctx.beginPath(); ctx.arc(it.cx,it.cy,it.r,0,Math.PI*2); fill(); stroke(); break;
      case "line": ctx.beginPath(); ctx.moveTo(it.x1,it.y1); ctx.lineTo(it.x2,it.y2); stroke(); break;
      case "text": {
        ctx.translate(it.x,it.y); ctx.scale(1/k,1/k);
        ctx.font=fontCss(it.fam,it.w,it.it,it.size*k);
        ctx.fillStyle=it.fill||"#000"; ctx.textBaseline="alphabetic";
        ctx.textAlign=it.anchor==="middle"?"center":it.anchor==="end"?"right":"left";
        ctx.fillText(it.s,0,0); break;
      }
      case "image": {
        const e=getImg(it.src); if(!e) break;
        const P=imagePlacement(it,e), c=it.clip;
        ctx.beginPath(); roundRectPath(ctx,c.x,c.y,c.w,c.h,c.r||0); ctx.clip();
        ctx.globalAlpha*=it.opacity;
        if(P.rot){ ctx.translate(P.cx,P.cy); ctx.rotate(P.rot*Math.PI/180); ctx.translate(-P.cx,-P.cy); }
        if(P.tile){
          const pat=ctx.createPattern(e.img,"repeat");
          if(pat){ pat.setTransform(new DOMMatrix().translate(P.ox,P.oy).scale(P.tw/e.w,P.th/e.h)); ctx.fillStyle=pat; ctx.fillRect(P.ex,P.ey,P.ew,P.eh); }
        }else ctx.drawImage(e.img,P.x,P.y,P.w,P.h);
        break;
      }
      case "group": ctx.translate(it.tx,it.ty); ctx.scale(it.sx,it.sy); canvasItems(ctx,it.items,k*Math.sqrt(it.sx*it.sy)); break;
    }
    ctx.restore();
  }
}
function roundRectPath(ctx,x,y,w,h,r){
  r=Math.max(0,Math.min(r,w/2,h/2));
  if(!r){ ctx.rect(x,y,w,h); return; }
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function pageCanvas(page,dpi,cal){
  const k=dpi/25.4, cv=document.createElement("canvas");
  cv.width=Math.round(page.w*k); cv.height=Math.round(page.h*k);
  const ctx=cv.getContext("2d");
  ctx.fillStyle="#fff"; ctx.fillRect(0,0,cv.width,cv.height);
  ctx.scale(k,k);
  if(cal){ ctx.translate(cal.ox,cal.oy); ctx.scale(cal.sx,cal.sy); }
  canvasItems(ctx,page.items,cal?k*Math.sqrt(cal.sx*cal.sy):k);
  return cv;
}

/* ---------- PDF без библиотек: каждая страница — JPEG точно в размер листа ---------- */
function canvasesToPdf(pages){ // pages: [{cv,w,h}] (w,h в мм)
  const enc=new TextEncoder(), chunks=[], off={}; let len=0;
  const push=u8=>{chunks.push(u8); len+=u8.length;}, str=s=>push(enc.encode(s));
  const obj=(id,body,bin)=>{ off[id]=len; str(`${id} 0 obj\n${body}\n`); if(bin){ str("stream\n"); push(bin); str("\nendstream\n"); } str("endobj\n"); };
  str("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const n=pages.length, kids=pages.map((_,i)=>`${3+i*3} 0 R`).join(" ");
  obj(1,"<< /Type /Catalog /Pages 2 0 R >>");
  obj(2,`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`);
  pages.forEach((p,i)=>{
    const wPt=(p.w*72/25.4).toFixed(3), hPt=(p.h*72/25.4).toFixed(3), pid=3+i*3, cid=pid+1, iid=pid+2;
    obj(pid,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] /Resources << /XObject << /Im0 ${iid} 0 R >> >> /Contents ${cid} 0 R >>`);
    const content=`q ${wPt} 0 0 ${hPt} 0 0 cm /Im0 Do Q`;
    obj(cid,`<< /Length ${content.length} >>`,enc.encode(content));
    const b64=p.cv.toDataURL("image/jpeg",0.94).split(",")[1], bin=atob(b64), jpg=new Uint8Array(bin.length);
    for(let j=0;j<bin.length;j++) jpg[j]=bin.charCodeAt(j);
    obj(iid,`<< /Type /XObject /Subtype /Image /Width ${p.cv.width} /Height ${p.cv.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>`,jpg);
  });
  const xref=len, total=2+n*3;
  let x=`xref\n0 ${total+1}\n0000000000 65535 f \n`;
  for(let id=1;id<=total;id++) x+=String(off[id]).padStart(10,"0")+" 00000 n \n";
  str(x+`trailer\n<< /Size ${total+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const out=new Uint8Array(len); let o=0; chunks.forEach(c=>{out.set(c,o); o+=c.length;});
  return new Blob([out],{type:"application/pdf"});
}

/* =========================================================
   РАЗЛИНОВКА (выкраска-ленточки)
   ========================================================= */
const GUIDE = "#d4467a";
function bgImageItem(d,clip){
  return {k:"image",src:d.bgImage,clip,fit:d.bgFit,opacity:d.bgOpacity/100,rot:d.bgRotate||0,
    posX:d.bgPosX,posY:d.bgPosY,scale:d.bgSize,tileMm:(d.bgTilePx||60)*d.bgSize/100*PX};
}
function marginGuide(W,H,t,r,b,l){
  return S.rect(l,t,W-l-r,H-t-b,{stroke:GUIDE,sw:0.2,dash:[1.5,1],opacity:0.55});
}
function unprintableOverlay(W,H,p){
  const o={fill:"#d4467a",opacity:0.09}, out=[];
  if(p.uT>0) out.push(S.rect(0,0,W,p.uT,o));
  if(p.uB>0) out.push(S.rect(0,H-p.uB,W,p.uB,o));
  if(p.uL>0) out.push(S.rect(0,p.uT,p.uL,H-p.uT-p.uB,o));
  if(p.uR>0) out.push(S.rect(W-p.uR,p.uT,p.uR,H-p.uT-p.uB,o));
  return out;
}
function checkUnprintable(warn,margins,p,what){
  const sides=[["сверху",margins[0],p.uT],["справа",margins[1],p.uR],["снизу",margins[2],p.uB],["слева",margins[3],p.uL]]
    .filter(([,m,u])=>u>0 && m<u-0.01);
  if(sides.length) warn.push(`${what} заходит в непечатаемую зону принтера (${sides.map(([s,m,u])=>`${s}: поле ${+m.toFixed(1)} мм < ${u} мм`).join(", ")}). Увеличьте поля или проверьте поля принтера во вкладке «Печать».`);
}

function layoutStrips(d,markers,print,{showSafe=true}={}){
  const {w:W,h:H}=paperSize(d.paper,d.orient,d.customW,d.customH);
  const warn=[], cW=W-d.mL-d.mR, cH=H-d.mT-d.mB, cols=Math.max(1,d.cols|0);
  const sw = d.stripW>0 ? d.stripW : (cW-d.gapX*(cols-1))/cols;
  const gridW = sw*cols + d.gapX*(cols-1);
  if(cW<=0||cH<=0) warn.push("Поля больше самого листа — уменьшите поля.");
  if(gridW>cW+0.05) warn.push(`Ленточки не помещаются по ширине: нужно ${gridW.toFixed(1)} мм, а между полями ${cW.toFixed(1)} мм. Уменьшите ширину ленточки, число колонок или поля.`);
  if(d.rowH>cH) warn.push("Высота ленточки больше рабочей области листа.");
  const x0 = d.mL + (d.hAlign==="center" ? (cW-gridW)/2 : 0);
  const rowsPP = Math.max(1,Math.floor((cH+d.gapY+1e-6)/(d.rowH+d.gapY)));
  const perPage = rowsPP*cols, n=markers.length;
  const chunks=[]; for(let s=0;s<n;s+=perPage) chunks.push(markers.slice(s,s+perPage));
  if(!chunks.length) chunks.push([]);
  const fs=d.fs*PT, lc=d.lineColor, bw=d.borderW;
  const collapse = d.border!=="none" && d.gapX<0.01 && d.gapY<0.01 && d.corner<0.01;
  const bDash = d.border==="dashed" ? [1.4,0.9] : null;
  let cutTexts=0, shrunk=0;
  const pages = chunks.map((chunk,pi)=>{
    const items=[], pv=[];
    if(d.bgImage && d.bgMode==="sheet") items.push(bgImageItem(d,{x:0,y:0,w:W,h:H}));
    const cells = chunk.map((m,i)=>{
      const [c,r] = d.order==="cols" ? [Math.floor(i/rowsPP), i%rowsPP] : [i%cols, Math.floor(i/cols)];
      return {m, idx:pi*perPage+i, x:x0+c*(sw+d.gapX), y:d.mT+r*(d.rowH+d.gapY)};
    });
    // фон каждой ленточки
    if(d.bgImage && d.bgMode==="cell") cells.forEach(c=>items.push(bgImageItem(d,{x:c.x,y:c.y,w:sw,h:d.rowH,r:d.corner})));
    // рамки: при нулевых зазорах соседние ленточки делят одну линию
    if(d.border!=="none"){
      if(collapse){
        const seen=new Set();
        const edge=(x1,y1,x2,y2)=>{ const key=[x1,y1,x2,y2].map(v=>v.toFixed(3)).join(","); if(seen.has(key)) return; seen.add(key);
          items.push(S.line(x1,y1,x2,y2,{stroke:lc,sw:bw,dash:bDash,cap:"square"})); };
        cells.forEach(c=>{ edge(c.x,c.y,c.x+sw,c.y); edge(c.x,c.y+d.rowH,c.x+sw,c.y+d.rowH); edge(c.x,c.y,c.x,c.y+d.rowH); edge(c.x+sw,c.y,c.x+sw,c.y+d.rowH); });
      } else cells.forEach(c=>items.push(S.rect(c.x,c.y,sw,d.rowH,{r:d.corner,stroke:lc,sw:bw,dash:bDash})));
    }
    cells.forEach(c=>{
      const {x,y}=c, h=d.rowH, cy=y+h/2;
      if(d.line && d.lineX>0 && d.lineX<sw) items.push(S.line(x+d.lineX,y,x+d.lineX,y+h,{stroke:lc,sw:d.vlineW}));
      // кружки под выкрас
      for(let i=0;i<d.spots;i++){
        const sz=d.spotSize, sx=x+d.spotIndent+i*(sz+d.spotGap);
        const o={fill:"#fff",stroke:lc,sw:bw,dash:d.spotDash?[0.7,0.7]:null};
        items.push(d.spotShape==="circle" ? S.circle(sx+sz/2,cy,sz/2,o) : S.rect(sx,cy-sz/2,sz,sz,{...o,r:Math.min(sz/4,d.corner*0.4+0.5)}));
      }
      // отверстие под кольцо
      const ringL = d.ring ? x+sw-d.ringIndent-d.ringSize : x+sw;
      if(d.ring) items.push(S.circle(ringL+d.ringSize/2,cy,d.ringSize/2,{fill:"#fff",stroke:lc,sw:bw,dash:[0.7,0.7]}));
      // текст: каждый ограничен началом следующего элемента
      const texts=[];
      if(d.showCode) texts.push({f:"code",x:x+d.codeIndent,s:c.m.code,w:d.codeBold?700:400,it:d.codeItalic,fill:d.textColor});
      if(d.showName) texts.push({f:"name",x:x+d.nameIndent,s:c.m.name,w:d.nameBold?700:400,it:d.nameItalic,fill:d.nameColor});
      texts.forEach(t=>{
        const next=Math.min(ringL, ...texts.filter(o=>o.x>t.x+0.01).map(o=>o.x));
        const maxW=next-t.x-1;
        const r=fitText(t.s,d.font,t.w,t.it,fs,maxW,d.autoFit);
        if(r.cut && t.s) cutTexts++; if(r.shrunk) shrunk++;
        if(r.s) items.push(S.text(t.x,baselineCentered(cy,d.font,t.w,t.it,r.size),r.s,{fam:d.font,size:r.size,w:t.w,it:t.it,fill:t.fill,ref:{i:c.idx,f:t.f}}));
      });
    });
    // метки обрезки снаружи сетки
    if(d.cropMarks && cells.length){
      const xs=new Set(), ys=new Set();
      cells.forEach(c=>{ xs.add(r3(c.x)); xs.add(r3(c.x+sw)); ys.add(r3(c.y)); ys.add(r3(c.y+d.rowH)); });
      const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys), L=4, g=1.5, o={stroke:"#000",sw:0.15};
      xs.forEach(v=>{ items.push(S.line(v,minY-g,v,Math.max(0,minY-g-L),o)); items.push(S.line(v,maxY+g,v,Math.min(H,maxY+g+L),o)); });
      ys.forEach(v=>{ items.push(S.line(minX-g,v,Math.max(0,minX-g-L),v,o)); items.push(S.line(maxX+g,v,Math.min(W,maxX+g+L),v,o)); });
    }
    if(d.showGuides) pv.push(marginGuide(W,H,d.mT,d.mR,d.mB,d.mL));
    if(showSafe && print.showSafe) pv.push(...unprintableOverlay(W,H,print));
    if(!n) pv.push(S.text(W/2,H/2,"Добавьте маркеры — здесь появится разлиновка",{fam:"Manrope, sans-serif",size:4.2,fill:"#a99aa3",anchor:"middle"}));
    return {w:W,h:H,items,pv};
  });
  if(cutTexts) warn.push(`Текст не поместился у ${cutTexts} подпис${cutTexts===1?"и":"ей"} и обрезан «…». Уменьшите шрифт, сдвиньте подписи или расширьте ленточку.`);
  checkUnprintable(warn,[d.mT,d.mR,d.mB,d.mL],print,"Разлиновка");
  const usedRows=Math.min(rowsPP,Math.ceil(Math.max(1,n)/cols));
  return {pages,warn,info:{perPage,rowsPP,cols,sw,gridW,cW,cH,W,H,usedRows,shrunk}};
}

/* =========================================================
   ТРЕКЕР
   ========================================================= */
function trackerLayoutGrid(t){
  if(t.layout==="2a5")  return {W:297,H:210,cols:2,rows:1,cut:"v",pages:2};
  if(t.layout==="2a5v") return {W:210,H:297,cols:1,rows:2,cut:"h",pages:2};
  if(t.layout==="4a6")  return {W:210,H:297,cols:2,rows:2,cut:"cross",pages:4};
  const {w,h}=paperSize(t.paper,t.orient,t.customW,t.customH);
  return {W:w,H:h,cols:1,rows:1,cut:null,pages:1};
}
function punchPositions(t,along){
  const n=t.punchN, d=t.punchD;
  if(t.punchDist==="even"){
    const edge=t.punchSide==="left"?Math.min(t.padTop,t.padBottom):Math.min(t.padLeft,t.padRight);
    const a=Math.max(edge,d), b=along-a;
    return Array.from({length:n},(_,i)=>n===1?(a+b)/2:a+(b-a)*i/(n-1));
  }
  let gaps=String(t.punchGaps||"").split(/[,;\s]+/).map(v=>parseFloat(v.replace(",","."))).filter(v=>v>0);
  if(!gaps.length) gaps=[45];
  const g=[]; for(let i=0;i<n-1;i++) g.push(gaps[Math.min(i,gaps.length-1)]);
  let cur=(along-g.reduce((a,b)=>a+b,0))/2; const pos=[cur];
  g.forEach(v=>{cur+=v; pos.push(cur);});
  return pos;
}
function trackerUnit(t,uw,uh,warn){
  const items=[], pv=[], lc=t.lineColor, sw=t.lineW;
  const pL=t.padLeft,pR=t.padRight,pT=t.padTop,pB=t.padBottom, cw=uw-pL-pR;
  let y=pT;
  const ax = t.titleAlign==="center"?pL+cw/2 : t.titleAlign==="right"?uw-pR : pL;
  const anchor = t.titleAlign==="center"?"middle":t.titleAlign==="right"?"end":"start";
  const line=(fam,sizePt,s,fill,lh)=>{
    const size=sizePt*PT, m=fontMetrics(fam,400,false), boxH=size*lh, base=y+(boxH-(m.asc+m.desc)*size)/2+m.asc*size;
    const r=fitText(s,fam,400,false,size,cw,true);
    items.push(S.text(ax,base,r.s,{fam,size:r.size,fill,anchor})); y+=boxH;
  };
  if(t.title) line(t.titleFont,t.titleSize,t.title,t.textColor,1.25);
  if(t.subtitle){ y+=1; line(t.fieldFont,t.fieldSize+2,t.subtitle,t.accent,1.3); }
  // шапка: место под наклейку + поля с линиями
  y+=4;
  const fSize=t.fieldSize*PT, rowH=fSize*1.6, fieldsH=t.fields.length*rowH;
  const stW=t.sticker?Math.min(t.stickerW,cw):0, stH=t.sticker?t.stickerH:0;
  const headerH=Math.max(fieldsH,stH);
  if(t.sticker) pv.push(S.rect(pL,y,stW,stH,{stroke:GUIDE,sw:0.25,dash:[1.5,1],opacity:0.5,r:1.5}));
  const fx=pL+(t.sticker?stW+6:0), fEnd=uw-pR;
  let fy=y+(headerH-fieldsH)/2;
  const fm=fontMetrics(t.fieldFont,400,false);
  t.fields.forEach(f=>{
    const base=fy+rowH*0.72;
    const r=fitText(f,t.fieldFont,400,false,fSize,Math.max(0,fEnd-fx-8),true);
    items.push(S.text(fx,base,r.s,{fam:t.fieldFont,size:r.size,fill:t.textColor}));
    const lx=fx+textWidth(r.s,t.fieldFont,400,false,r.size)+1.5;
    if(lx<fEnd-2) items.push(S.line(lx,base+fm.desc*fSize*0.35,fEnd,base+fm.desc*fSize*0.35,{stroke:lc,sw}));
    fy+=rowH;
  });
  if(t.fields.length||t.sticker) y+=headerH+6; else y+=2;
  // сетка клеток: квадрат + прямоугольник + линия, по нижнему краю ряда
  const gap=t.boxGap, cols=Math.max(1,t.cols), bw=(cw-gap*(cols-1))/cols, bh=Math.max(t.sqH,t.rectH), gp=1.5;
  if(t.sqW+gp+t.rectW>bw+0.01) warn.push(`Квадрат и прямоугольник (${(t.sqW+gp+t.rectW).toFixed(1)} мм) шире колонки (${bw.toFixed(1)} мм) — уменьшите их или число колонок.`);
  let fitted=0;
  for(let r=0;r<t.rows;r++){
    const by=y+r*(bh+gap);
    if(by+bh>uh-pB+0.01) break;
    fitted++;
    for(let c=0;c<cols;c++){
      const bx=pL+c*(bw+gap), bottom=by+bh, o={stroke:lc,sw,r:t.boxR};
      items.push(S.rect(bx,bottom-t.sqH,Math.min(t.sqW,bw),t.sqH,o));
      const rx=bx+t.sqW+gp, rwid=Math.min(t.rectW,bx+bw-rx);
      if(rwid>0.5) items.push(S.rect(rx,bottom-t.rectH,rwid,t.rectH,o));
      const ls=rx+t.rectW+gp;
      if(ls<bx+bw-1) items.push(S.line(ls,bottom,bx+bw,bottom,{stroke:lc,sw}));
    }
  }
  if(fitted<t.rows) warn.push(`Поместилось ${fitted} из ${t.rows} рядов клеток — уменьшите число рядов, высоту клеток, зазор или шапку.`);
  // отверстия под дырокол
  if(t.punch){
    const along=t.punchSide==="left"?uh:uw;
    punchPositions(t,along).forEach(a=>{
      const cx=t.punchSide==="left"?t.punchMargin:a, cy=t.punchSide==="left"?a:t.punchMargin;
      items.push(S.circle(cx,cy,t.punchD/2,{fill:"#fff",stroke:lc,sw}));
    });
    const reach=t.punchMargin+t.punchD/2, pad=t.punchSide==="left"?pL:pT;
    if(reach>pad-1) warn.push(`Отверстия дырокола заходят на содержимое: отступ ${t.punchSide==="left"?"слева":"сверху"} ${pad} мм, а отверстия доходят до ${reach.toFixed(1)} мм. Увеличьте отступ.`);
  }
  if(t.showGuides) pv.push(marginGuide(uw,uh,pT,pR,pB,pL));
  return {items,pv};
}
function layoutTracker(t,print,{showSafe=true}={}){
  const warn=[];
  if(t.pageType==="divider") return layoutDivider(t,print,warn,showSafe);
  const L=trackerLayoutGrid(t), uw=L.W/L.cols, uh=L.H/L.rows;
  const unit=trackerUnit(t,uw,uh,warn), items=[], pv=[];
  for(let i=0;i<L.cols*L.rows;i++){
    const tx=(i%L.cols)*uw, ty=Math.floor(i/L.cols)*uh;
    items.push(S.group(unit.items,{tx,ty})); pv.push(S.group(unit.pv,{tx,ty}));
  }
  if(L.cut && t.cutLine){
    const o={stroke:"#b5abb1",sw:0.3,dash:[2,1.6]};
    if(L.cut==="v"||L.cut==="cross") items.push(S.line(L.W/2,0,L.W/2,L.H,o));
    if(L.cut==="h"||L.cut==="cross") items.push(S.line(0,L.H/2,L.W,L.H/2,o));
  }
  if(showSafe && print.showSafe) pv.push(...unprintableOverlay(L.W,L.H,print));
  checkUnprintable(warn,[t.padTop,t.padRight,t.padBottom,t.padLeft],print,"Трекер");
  return {pages:[{w:L.W,h:L.H,items,pv}],warn:[...new Set(warn)],info:{W:L.W,H:L.H,units:L.pages}};
}
function layoutDivider(t,print,warn,showSafe){
  const {w:W,h:H}=paperSize(t.paper,t.orient,t.customW,t.customH);
  const front={w:W,h:H,items:[],pv:[],cap:"Лицевая сторона"}, back={w:W,h:H,items:[],pv:[],cap:"Оборотная сторона"};
  const ax=t.divPadLeft, ay=t.divPadTop, aw=W-t.divPadLeft-t.divPadRight, ah=H-t.divPadTop-t.divPadBottom;
  if(t.divImage) front.items.push({k:"image",src:t.divImage,clip:{x:ax,y:ay,w:aw,h:ah},fit:t.divFit==="cover"?"cover":"contain",opacity:1,rot:0,posX:50,posY:50,scale:100});
  else front.pv.push(S.rect(ax+2,ay+2,aw-4,ah-4,{stroke:GUIDE,sw:0.3,dash:[2,1.5],r:3,opacity:.6}),
    S.text(W/2,H/2,"Загрузите картинку раскраски",{fam:"Manrope, sans-serif",size:5,fill:"#a99aa3",anchor:"middle"}));
  // все поля 0 — сознательная печать «в край», не предупреждаем
  if(t.divPadTop+t.divPadRight+t.divPadBottom+t.divPadLeft>0) checkUnprintable(warn,[t.divPadTop,t.divPadRight,t.divPadBottom,t.divPadLeft],print,"Картинка разделителя");
  let y=t.padTop; const cw=W-t.padLeft-t.padRight;
  if(t.divBackTitle){
    const size=Math.max(14,t.titleSize*0.7)*PT, m=fontMetrics(t.titleFont,400,false);
    back.items.push(S.text(W/2,y+m.asc*size,fitText(t.divBackTitle,t.titleFont,400,false,size,cw,true).s,{fam:t.titleFont,size,fill:t.textColor,anchor:"middle"}));
    y+=(m.asc+m.desc)*size+4;
  }
  const gap=3, cols=Math.max(1,t.divCols), cellW=(cw-gap*(cols-1))/cols, d=Math.min(t.divCircle,cellW), step=d+gap;
  const nSize=Math.max(6,t.divCircle*0.42)*PT; let shown=0;
  for(let i=0;i<t.divCount;i++){
    const c=i%cols, r=Math.floor(i/cols), cx=t.padLeft+c*(cellW+gap)+cellW/2, cy=y+r*step+d/2;
    if(cy+d/2>H-t.padBottom+0.01) break;
    shown++;
    back.items.push(S.circle(cx,cy,d/2,{stroke:t.lineColor,sw:t.lineW}));
    if(t.divNumbered) back.items.push(S.text(cx,baselineCentered(cy,t.font,400,false,nSize),String(i+1),{fam:t.font,size:nSize,fill:t.textColor,anchor:"middle"}));
  }
  if(shown<t.divCount) warn.push(`На обороте поместилось ${shown} из ${t.divCount} кружков — уменьшите размер кружка или добавьте колонок.`);
  checkUnprintable(warn,[t.padTop,t.padRight,t.padBottom,t.padLeft],print,"Оборот разделителя");
  if(t.showGuides){ back.pv.push(marginGuide(W,H,t.padTop,t.padRight,t.padBottom,t.padLeft)); }
  if(showSafe && print.showSafe){ front.pv.push(...unprintableOverlay(W,H,print)); back.pv.push(...unprintableOverlay(W,H,print)); }
  return {pages:[front,back],warn,info:{W,H,divider:true}};
}

/* =========================================================
   ТЕСТОВАЯ СТРАНИЦА для калибровки принтера
   ========================================================= */
function layoutCalibration(W,H){
  const items=[], k="#222", f="Manrope, Arial, sans-serif";
  const T=(x,y,s,size=3,o={})=>items.push(S.text(x,y,s,{fam:f,size,fill:k,...o}));
  // «лесенка» у каждого края: линии на расстоянии 1…10 мм — самая близкая напечатанная = поле принтера
  for(let i=1;i<=10;i++){
    const len=i%5===0?7:4, o={stroke:k,sw:0.2};
    items.push(S.line(W/2-len,i,W/2+len,i,o), S.line(W/2-len,H-i,W/2+len,H-i,o), S.line(i,H/2-len,i,H/2+len,o), S.line(W-i,H/2-len,W-i,H/2+len,o));
    if(i%2===0){
      T(W/2+9,i+0.9,String(i),2.2); T(W/2+9,H-i+0.9,String(i),2.2);
      T(i-0.6,H/2-9,String(i),2.2,{anchor:"middle"}); T(W-i+0.6,H/2-9,String(i),2.2,{anchor:"middle"});
    }
  }
  // уголки ровно в 10 мм от краёв
  [[10,10,1,1],[W-10,10,-1,1],[10,H-10,1,-1],[W-10,H-10,-1,-1]].forEach(([x,y,dx,dy])=>{
    items.push(S.line(x,y,x+8*dx,y,{stroke:k,sw:0.25}),S.line(x,y,x,y+8*dy,{stroke:k,sw:0.25}));
  });
  const ruler=(x,y,len,vertical)=>{
    for(let i=0;i<=len;i++){
      const l=i%10===0?5:i%5===0?3.5:2;
      if(vertical) items.push(S.line(x,y+i,x+l,y+i,{stroke:k,sw:0.15}));
      else items.push(S.line(x+i,y,x+i,y-l,{stroke:k,sw:0.15}));
      if(i%10===0){ if(vertical) T(x+6.5,y+i+1,String(i/10),2.4); else T(x+i,y-6.5,String(i/10),2.4,{anchor:"middle"}); }
    }
    if(vertical) items.push(S.line(x,y,x,y+len,{stroke:k,sw:0.25})); else items.push(S.line(x,y,x+len,y,{stroke:k,sw:0.25}));
  };
  const hx=(W-100)/2;
  T(W/2,26,"Тестовая страница · Palette Creator",5,{anchor:"middle",w:700});
  T(W/2,33,"Печатайте с масштабом 100% и без полей. Затем измерьте линейкой:",3,{anchor:"middle"});
  ruler(hx,52,100,false); T(W/2,58,"← эта линия должна быть ровно 100 мм (10 см) →",3,{anchor:"middle"});
  const vy=Math.max(66,(H-150)/2+10), vlen=Math.min(150,H-vy-30);
  ruler(26,vy,vlen,true);
  T(42,vy+vlen/2,`↕ ${vlen} мм`,3);
  // квадрат 50 × 50
  const sx=W/2-10, sy=vy+10;
  items.push(S.rect(sx,sy,50,50,{stroke:k,sw:0.25}));
  T(sx+25,sy+27,"50 × 50 мм",3,{anchor:"middle"});
  const lines=["1. Длина горизонтальной линии (должна быть 100 мм)",`2. Длина вертикальной линии (должна быть ${vlen} мм)`,
    "3. Насколько смещены уголки от краёв (должно быть 10 мм)","4. Самая близкая к краю видимая цифра у «лесенки» = поле принтера","Введите результаты во вкладке «Печать» → «Калибровка»."];
  lines.forEach((s,i)=>T(sx-4,sy+64+i*5.5,s,2.8));
  return {pages:[{w:W,h:H,items,pv:[]}],warn:[],info:{W,H,calVLen:vlen}};
}
