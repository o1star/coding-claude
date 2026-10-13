/* =====================================================================
   ASCENSION — cloth.js  ·  real cloth-physics garment (three.js + Verlet)
   A mass-spring shirt pinned at the shoulders: gravity, wind, and
   grab-and-pull mouse interaction. Loads `three` via the page importmap.
   ===================================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const stage   = document.getElementById("atelierStage");
const canvas  = document.getElementById("atelierCanvas");
const loading = document.getElementById("atelierLoading");
const hintEl  = document.getElementById("atelierHint");

const GARMENTS = [
  { id:"trinity",  product:"trinity-tee", name:"The Trinity Tee",     price:"$65",  halo:0xc6a15b,
    front:"assets/cut/tee_front.png",         back:"assets/cut/tee_back.png",
    desc:"A real-cloth Trinity Tee — grab it, tug it, watch it fall and flutter. Red, bone and royal haloed A's across the back." },
  { id:"spectrum", product:"spectrum-zip", name:"Spectrum Zip Hoodie", price:"$150", halo:0xc6a15b,
    front:"assets/cut/hoodie_rbw_front.png",  back:"assets/cut/hoodie_rbw_back.png",
    desc:"The Spectrum zip, simulated as hanging fabric. Six haloed A's in full spectrum down the back." },
  { id:"phantom",  product:"phantom-zip",  name:"Phantom Zip Hoodie",  price:"$145", halo:0x8f8f96,
    front:"assets/cut/hoodie_wash_front.png", back:"assets/cut/hoodie_wash_back.png",
    desc:"Washed-black on washed-black, drifting on the breeze. The Phantom moves unseen." },
];

/* ---- WebGL guard ---- */
function webglOK(){ try{ const c=document.createElement("canvas");
  return !!(window.WebGLRenderingContext && (c.getContext("webgl2")||c.getContext("webgl"))); }catch{ return false; } }
if(!webglOK()) stage.classList.add("webgl-fail"); else boot();

function boot(){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(2,3,5); scene.add(key);
  const rimR = new THREE.SpotLight(0xff3b2e, 8, 26, 0.7, 0.9); rimR.position.set(-6,2,-2); scene.add(rimR);
  const rimB = new THREE.SpotLight(0x2b49e0, 7, 26, 0.7, 0.9); rimB.position.set(6,-1,-3); scene.add(rimB);

  // halo + glow + shadow (same language as before)
  const halo = new THREE.Group();
  const haloMat = new THREE.MeshStandardMaterial({ color:0xc6a15b, emissive:0xc6a15b, emissiveIntensity:1.8, metalness:1, roughness:0.3 });
  const haloMesh = new THREE.Mesh(new THREE.TorusGeometry(0.85,0.07,28,140), haloMat);
  haloMesh.rotation.x = Math.PI/2.15; halo.add(haloMesh);
  const haloLight = new THREE.PointLight(0xc6a15b,6,12,2); halo.add(haloLight);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map:radialSprite("#c6a15b"), color:0xc6a15b, transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false }));
  glow.scale.set(4.2,4.2,1); halo.add(glow);
  halo.position.set(0,3.25,0); scene.add(halo);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.6,2.4),
    new THREE.MeshBasicMaterial({ map:radialSprite("#000000"), transparent:true, opacity:0.5, depthWrite:false }));
  shadow.rotation.x = -Math.PI/2; shadow.position.set(0,-3.1,0); scene.add(shadow);

  /* =================== CLOTH SIMULATION =================== */
  const Hd = 5.4;                 // world height of the garment grid
  const GRAV = new THREE.Vector3(0, -9.8*0.45, 0);
  const DAMP = 0.97, STEP = 1/60, STEP2 = STEP*STEP, ITER = 15;

  let cols=0, rows=0, Wd=0, P=[], constraints=[], geom=null, frontMesh=null, backMesh=null, clothGroup=new THREE.Group();
  scene.add(clothGroup);
  let wind=0.32, windTarget=0.32, gust=0;
  let loadToken=0, showBack=false, active=0;

  const loader = new THREE.TextureLoader();

  function buildCloth(g){
    const token=++loadToken;
    const colorTex = loader.load(g.front, img=>{ if(token!==loadToken) return; make(img.image); });
    const backTex  = loader.load(g.back);
    colorTex.colorSpace = THREE.SRGBColorSpace; backTex.colorSpace = THREE.SRGBColorSpace;
    backTex.wrapS = THREE.RepeatWrapping; backTex.repeat.x = -1;

    function make(img){
      // read alpha (silhouette) from the cut-out
      const iw=img.width, ih=img.height, ratio=iw/ih;
      Wd = Hd*ratio;
      const cv=document.createElement("canvas"); cv.width=iw; cv.height=ih;
      const cx=cv.getContext("2d"); cx.drawImage(img,0,0);
      const data=cx.getImageData(0,0,iw,ih).data;
      cols = 58; rows = Math.round(cols/ratio);
      const idx=(i,j)=>i+j*cols;
      const alphaAt=(u,v)=>{ const px=Math.min(iw-1,Math.max(0,Math.round(u*(iw-1))));
        const py=Math.min(ih-1,Math.max(0,Math.round(v*(ih-1)))); return data[(py*iw+px)*4+3]; };

      // true silhouette, then dilate by one cell so the mesh overshoots the
      // edge; alphaTest then carves a smooth outline while the extra ring
      // still simulates (free-fluttering sleeves + hem)
      const trueAct=new Uint8Array(cols*rows);
      for(let j=0;j<rows;j++) for(let i=0;i<cols;i++) trueAct[idx(i,j)] = alphaAt(i/(cols-1), j/(rows-1))>40 ? 1:0;
      const sim=new Uint8Array(cols*rows);
      for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){
        let on=trueAct[idx(i,j)];
        for(let dj=-1;dj<=1&&!on;dj++) for(let di=-1;di<=1&&!on;di++){
          const ni=i+di,nj=j+dj; if(ni>=0&&ni<cols&&nj>=0&&nj<rows&&trueAct[idx(ni,nj)]) on=1; }
        sim[idx(i,j)]=on;
      }

      P = new Array(cols*rows);
      for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){
        const u=i/(cols-1), v=j/(rows-1);
        const x=(u-0.5)*Wd, y=(0.5-v)*Hd, z=(Math.random()-0.5)*0.06;
        P[idx(i,j)] = { x,y,z, px:x,py:y,pz:z, active:sim[idx(i,j)]===1, pinned:false, grab:false, u,v };
      }
      // pin the top shoulder band (top 2 rows of the silhouette per column) so
      // the shoulders + sleeve-tops hold their shape instead of collapsing
      for(let i=0;i<cols;i++){ let c=0; for(let j=0;j<rows;j++){ if(trueAct[idx(i,j)]){ const p=P[idx(i,j)]; p.pinned=true; p.px=p.x; p.py=p.y; if(++c>=2) break; } } }

      // constraints: structural, shear, bend
      constraints=[];
      const link=(a,b)=>{ const pa=P[a],pb=P[b]; if(pa&&pb&&pa.active&&pb.active){
        const dx=pa.x-pb.x,dy=pa.y-pb.y,dz=pa.z-pb.z; constraints.push([pa,pb,Math.hypot(dx,dy,dz)]); } };
      for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){
        if(i+1<cols) link(idx(i,j),idx(i+1,j));
        if(j+1<rows) link(idx(i,j),idx(i,j+1));
        if(i+1<cols&&j+1<rows){ link(idx(i,j),idx(i+1,j+1)); link(idx(i+1,j),idx(i,j+1)); }   // shear
        if(i+2<cols) link(idx(i,j),idx(i+2,j));                                                 // bend
        if(j+2<rows) link(idx(i,j),idx(i,j+2));
      }

      // geometry: quads where all 4 corners active
      const vmap=new Int32Array(cols*rows).fill(-1); let vn=0;
      for(let k=0;k<P.length;k++) if(P[k].active) vmap[k]=vn++;
      const pos=new Float32Array(vn*3), uv=new Float32Array(vn*2);
      for(let k=0;k<P.length;k++){ if(vmap[k]<0) continue; const p=P[k];
        uv[vmap[k]*2]=p.u; uv[vmap[k]*2+1]=1-p.v; }
      const index=[];
      for(let j=0;j<rows-1;j++) for(let i=0;i<cols-1;i++){
        const a=idx(i,j),b=idx(i+1,j),c=idx(i,j+1),d=idx(i+1,j+1);
        if(P[a].active&&P[b].active&&P[c].active&&P[d].active){
          index.push(vmap[a],vmap[c],vmap[b], vmap[b],vmap[c],vmap[d]);
        }
      }
      geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(pos,3));
      geom.setAttribute("uv", new THREE.BufferAttribute(uv,2));
      geom.setIndex(index); geom._vmap = vmap;

      if(frontMesh) clothGroup.remove(frontMesh, backMesh);
      const mkMat=(tex,side)=> new THREE.MeshStandardMaterial({ map:tex, side, transparent:true, alphaTest:0.5, roughness:0.9, metalness:0.0 });
      frontMesh = new THREE.Mesh(geom, mkMat(colorTex, THREE.FrontSide));
      backMesh  = new THREE.Mesh(geom, mkMat(backTex,  THREE.BackSide));
      clothGroup.add(frontMesh, backMesh);

      haloMat.color.setHex(g.halo); haloMat.emissive.setHex(g.halo);
      haloLight.color.setHex(g.halo); glow.material.color.setHex(g.halo);

      // pre-settle so it starts already hanging
      for(let s=0;s<40;s++) simulate(1/60);
      syncGeometry();
      loading.classList.add("hide");
    }
  }

  function simulate(dt){
    const t=performance.now()*0.001;
    const windVec = new THREE.Vector3();
    const VMAX=0.16;   // clamp per-step velocity so the sim can never explode
    for(let k=0;k<P.length;k++){ const p=P[k]; if(!p.active||p.pinned||p.grab) continue;
      // forces: gravity + wind (per-particle noise so it ripples)
      const w = (wind+gust) * (0.5+0.5*Math.sin(t*2.0 + p.u*6 + p.v*4));
      windVec.set(Math.sin(t*1.3+p.v*3)*0.4*w, Math.sin(t*0.9+p.u*5)*0.1*w, w*0.85);
      const ax=GRAV.x+windVec.x, ay=GRAV.y+windVec.y, az=GRAV.z+windVec.z;
      let vx=(p.x-p.px)*DAMP, vy=(p.y-p.py)*DAMP, vz=(p.z-p.pz)*DAMP;
      const vl=Math.hypot(vx,vy,vz); if(vl>VMAX){ const s=VMAX/vl; vx*=s; vy*=s; vz*=s; }
      const nx=p.x+vx+ax*STEP2, ny=p.y+vy+ay*STEP2, nz=p.z+vz+az*STEP2;
      p.px=p.x; p.py=p.y; p.pz=p.z; p.x=nx; p.y=ny; p.z=nz;
    }
    for(let it=0; it<ITER; it++){
      for(let c=0;c<constraints.length;c++){
        const [a,b,rest]=constraints[c];
        let dx=b.x-a.x, dy=b.y-a.y, dz=b.z-a.z;
        const d=Math.hypot(dx,dy,dz)||1e-6; const diff=(d-rest)/d*0.5;
        dx*=diff; dy*=diff; dz*=diff;
        const am=(a.pinned||a.grab)?0:1, bm=(b.pinned||b.grab)?0:1, s=am+bm||1;
        if(am){ a.x+=dx*(am/s)*2; a.y+=dy*(am/s)*2; a.z+=dz*(am/s)*2; }
        if(bm){ b.x-=dx*(bm/s)*2; b.y-=dy*(bm/s)*2; b.z-=dz*(bm/s)*2; }
      }
    }
    gust *= 0.9; wind += (windTarget-wind)*0.02;
  }

  function syncGeometry(){
    if(!geom) return; const pos=geom.attributes.position.array, vmap=geom._vmap;
    for(let k=0;k<P.length;k++){ const v=vmap[k]; if(v<0) continue; const p=P[k];
      pos[v*3]=p.x; pos[v*3+1]=p.y; pos[v*3+2]=p.z; }
    geom.attributes.position.needsUpdate=true; geom.computeVertexNormals(); geom.computeBoundingSphere();
  }

  /* =================== CAMERA (orbit front/back) =================== */
  const RAD=10; let az=0, azTarget=0, azSway=0;
  function placeCamera(t){
    azSway = Math.sin(t*0.3)*0.05;
    az += (azTarget-az)*0.06;
    const a=az+azSway;
    camera.position.set(Math.sin(a)*RAD, 0.3, Math.cos(a)*RAD);
    camera.lookAt(0,-0.2,0);
  }

  /* =================== GRAB INTERACTION =================== */
  const ray=new THREE.Raycaster(); const ndc=new THREE.Vector2();
  const plane=new THREE.Plane(); const hit=new THREE.Vector3();
  let grabbed=null, grabWasPinned=false;
  function setNDC(e){ const r=stage.getBoundingClientRect(); const p=e.touches?e.touches[0]:e;
    ndc.x=((p.clientX-r.left)/r.width)*2-1; ndc.y=-((p.clientY-r.top)/r.height)*2+1; }
  stage.addEventListener("pointerdown", e=>{
    setNDC(e); ray.setFromCamera(ndc,camera);
    const hits=ray.intersectObjects([frontMesh,backMesh].filter(Boolean),false);
    if(!hits.length) return;
    hintEl.classList.add("hide");
    // nearest active particle to hit point
    const h=hits[0].point; let best=1e9,bi=-1;
    for(let k=0;k<P.length;k++){ const p=P[k]; if(!p.active) continue;
      const d=(p.x-h.x)**2+(p.y-h.y)**2+(p.z-h.z)**2; if(d<best){best=d;bi=k;} }
    if(bi<0) return;
    grabbed=P[bi]; grabWasPinned=grabbed.pinned; grabbed.grab=true;
    stage.setPointerCapture?.(e.pointerId);
  });
  addEventListener("pointermove", e=>{
    if(!grabbed) return; setNDC(e); ray.setFromCamera(ndc,camera);
    plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(),
      new THREE.Vector3(grabbed.x,grabbed.y,grabbed.z));
    if(ray.ray.intersectPlane(plane,hit)){ grabbed.x=hit.x; grabbed.y=hit.y; grabbed.z=hit.z; }
  });
  addEventListener("pointerup", ()=>{ if(!grabbed) return;
    grabbed.grab=false; grabbed.pinned=grabWasPinned;
    if(!grabWasPinned){ grabbed.px=grabbed.x; grabbed.py=grabbed.y; grabbed.pz=grabbed.z; } // drop velocity
    grabbed=null; });

  /* =================== LOOP =================== */
  let paused=false;
  new IntersectionObserver(es=>{ paused=!es[0].isIntersecting; },{threshold:0}).observe(stage);
  function resize(){ const w=stage.clientWidth,h=stage.clientHeight; renderer.setSize(w,h,false);
    camera.aspect=w/h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage); resize();

  const clock=new THREE.Clock();
  (function tick(){
    requestAnimationFrame(tick);
    if(paused) return;
    const t=clock.getElapsedTime();
    if(P.length){ simulate(STEP); syncGeometry(); }
    halo.rotation.y+=0.004; halo.position.y=3.25+Math.sin(t*1.1)*0.05;
    glow.material.opacity=0.42+Math.sin(t*1.6)*0.08;
    placeCamera(t);
    renderer.render(scene,camera);
  })();

  /* =================== UI =================== */
  function setGarment(i){ active=i; showBack=false; azTarget=0;
    [...sw.children].forEach((b,bi)=>b.classList.toggle("active",bi===i));
    const g=GARMENTS[i];
    document.getElementById("atelierName").textContent=g.name;
    document.getElementById("atelierPrice").textContent=g.price;
    document.getElementById("atelierDesc").textContent=g.desc;
    document.getElementById("atelierBadge").textContent=g.id.toUpperCase();
    loading.classList.remove("hide"); hintEl.classList.remove("hide");
    buildCloth(g);
  }
  const sw=document.getElementById("atelierSwitch");
  sw.innerHTML=GARMENTS.map((g,i)=>`<button class="opt ${i===0?"active":""}" data-g="${i}" data-cursor="forge">${g.name.replace(" Hoodie","")}</button>`).join("");
  sw.addEventListener("click",e=>{ const b=e.target.closest("[data-g]"); if(b) setGarment(+b.dataset.g); });

  document.getElementById("atelierSpin").addEventListener("click", ()=>{   // Flip front/back
    showBack=!showBack; azTarget = showBack?Math.PI:0;
    document.getElementById("atelierBadge").textContent=(showBack?"BACK · ":"")+GARMENTS[active].id.toUpperCase();
    window.Ascension?.toast(showBack?"Viewing the back":"Viewing the front"); });
  document.getElementById("atelierGust")?.addEventListener("click", ()=>{ gust=1.7; window.Ascension?.toast("A gust of wind ✦"); });
  document.getElementById("atelierReset")?.addEventListener("click", ()=>{ buildCloth(GARMENTS[active]); window.Ascension?.toast("Fabric reset"); });
  document.getElementById("atelierAdd").addEventListener("click", ()=>{
    const g=GARMENTS[active]; window.Ascension?.openModal?.(g.product); });

  setGarment(0);
}

function radialSprite(hex){
  const s=128,c=document.createElement("canvas"); c.width=c.height=s; const x=c.getContext("2d");
  const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  g.addColorStop(0,hex); g.addColorStop(0.35,hex+"aa"); g.addColorStop(1,hex+"00");
  x.fillStyle=g; x.fillRect(0,0,s,s); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
