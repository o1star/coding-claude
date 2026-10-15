/* =====================================================================
   ASCENSION — tee3d.js  ·  a real parametric 3D t-shirt
   Lofted torso + shoulders + neck, modelled sleeves, ribbed collar and
   rolled hem in washed-black fabric, with the chest + back prints
   projected on as decals. Spins 360 on a turntable.
   ===================================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";
import { DecalGeometry } from "./vendor/DecalGeometry.js";

const stage   = document.getElementById("atelierStage");
const canvas  = document.getElementById("atelierCanvas");
const loading = document.getElementById("atelierLoading");
const hintEl  = document.getElementById("atelierHint");

const V = (x,y,z)=>new THREE.Vector3(x,y,z);

function webglOK(){ try{ const c=document.createElement("canvas");
  return !!(window.WebGLRenderingContext && (c.getContext("webgl2")||c.getContext("webgl"))); }catch{ return false; } }
if(!webglOK()) stage.classList.add("webgl-fail"); else boot();

function boot(){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(3,5,6); key.castShadow=true;
  key.shadow.mapSize.set(1024,1024); key.shadow.camera.near=1; key.shadow.camera.far=20;
  key.shadow.camera.left=-5; key.shadow.camera.right=5; key.shadow.camera.top=6; key.shadow.camera.bottom=-6;
  key.shadow.bias=-0.0004; scene.add(key);
  const fill = new THREE.DirectionalLight(0xbfcfff, 0.5); fill.position.set(-4,1,-3); scene.add(fill);
  const rimR = new THREE.SpotLight(0xff3b2e, 6, 28, 0.7, 0.9); rimR.position.set(-7,3,-3); scene.add(rimR);
  const rimB = new THREE.SpotLight(0x2b49e0, 5, 28, 0.7, 0.9); rimB.position.set(7,0,-3); scene.add(rimB);

  // halo + glow
  const halo = new THREE.Group();
  const haloMat = new THREE.MeshStandardMaterial({ color:0xc6a15b, emissive:0xc6a15b, emissiveIntensity:1.7, metalness:1, roughness:0.3 });
  const haloMesh=new THREE.Mesh(new THREE.TorusGeometry(0.8,0.06,24,120),haloMat); haloMesh.rotation.x=Math.PI/2.15; halo.add(haloMesh);
  halo.add(new THREE.PointLight(0xc6a15b,5,12,2));
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:radialSprite("#c6a15b"),color:0xc6a15b,transparent:true,opacity:0.45,blending:THREE.AdditiveBlending,depthWrite:false}));
  glow.scale.set(4,4,1); halo.add(glow); halo.position.set(0,3.15,0); scene.add(halo);

  // floor (shadow catcher + soft reflection)
  const floor=new THREE.Mesh(new THREE.CircleGeometry(9,64),
    new THREE.MeshStandardMaterial({ color:0x0c0c0f, roughness:0.55, metalness:0.2 }));
  floor.rotation.x=-Math.PI/2; floor.position.y=-2.75; floor.receiveShadow=true; scene.add(floor);

  const group = new THREE.Group(); scene.add(group);

  /* ============ fabric material (washed black + weave normal) ============ */
  function fabricTextures(){
    const S=256;
    // height field = fine weave + soft diagonal drape folds + low noise
    const H=new Float32Array(S*S);
    const nz=(x,y)=>Math.sin(x*0.055+Math.cos(y*0.03)*2)+Math.sin(y*0.047+1.3);
    for(let y=0;y<S;y++) for(let x=0;x<S;x++){
      const weave=(Math.sin(x*0.33)+Math.sin(y*0.33))*0.03;
      const folds=Math.sin((x*0.6+y*0.9)*0.09)*0.5 + Math.sin((x*-0.7+y*0.5)*0.07)*0.4;
      H[y*S+x]=weave + folds*0.6 + nz(x,y)*0.1 + (Math.random()-0.5)*0.03;
    }
    const n=document.createElement("canvas"); n.width=n.height=S; const nctx=n.getContext("2d"); const id=nctx.createImageData(S,S);
    const at=(x,y)=>H[((y+S)%S)*S+((x+S)%S)];
    for(let y=0;y<S;y++) for(let x=0;x<S;x++){ const gx=at(x+1,y)-at(x-1,y), gy=at(x,y+1)-at(x,y-1);
      const nx=-gx*1.2, ny=-gy*1.2, nzv=1, l=Math.hypot(nx,ny,nzv);
      const i=(y*S+x)*4; id.data[i]=(nx/l*0.5+0.5)*255; id.data[i+1]=(ny/l*0.5+0.5)*255; id.data[i+2]=(nzv/l*0.5+0.5)*255; id.data[i+3]=255; }
    nctx.putImageData(id,0,0);
    const norm=new THREE.CanvasTexture(n); norm.wrapS=norm.wrapT=THREE.RepeatWrapping; norm.repeat.set(2,2);
    // base: subtle washed mottling
    const c=document.createElement("canvas"); c.width=c.height=512; const x=c.getContext("2d");
    x.fillStyle="#191920"; x.fillRect(0,0,512,512);
    for(let i=0;i<1800;i++){ x.fillStyle=`rgba(${60+Math.random()*30|0},${60+Math.random()*30|0},${70+Math.random()*30|0},${Math.random()*0.06})`;
      x.beginPath(); x.arc(Math.random()*512,Math.random()*512,Math.random()*60+10,0,7); x.fill(); }
    const base=new THREE.CanvasTexture(c); base.wrapS=base.wrapT=THREE.RepeatWrapping; base.repeat.set(2,2); base.colorSpace=THREE.SRGBColorSpace;
    return {base,norm};
  }
  const fab=fabricTextures();
  const fabricMat=new THREE.MeshStandardMaterial({ color:0x323238, map:fab.base, normalMap:fab.norm,
    normalScale:new THREE.Vector2(0.6,0.6), roughness:0.92, metalness:0.0, side:THREE.DoubleSide });
  const collarMat=new THREE.MeshStandardMaterial({ color:0x121216, roughness:0.85, metalness:0.0, side:THREE.DoubleSide });

  /* ============ parametric geometry helpers ============ */
  function ring(wx,wz,y,n,seg){ const pts=[]; for(let i=0;i<seg;i++){ const t=i/seg*Math.PI*2;
    const ct=Math.cos(t),st=Math.sin(t);
    const x=wx*Math.sign(ct)*Math.pow(Math.abs(ct),2/n);
    const z=wz*Math.sign(st)*Math.pow(Math.abs(st),2/n);
    pts.push(V(x,y,z)); } return pts; }
  function loft(rings, seg, close){
    const pos=[],uv=[],idx=[]; const K=rings.length;
    for(let k=0;k<K;k++) for(let i=0;i<seg;i++){ const p=rings[k][i]; pos.push(p.x,p.y,p.z); uv.push(i/seg, k/(K-1)); }
    for(let k=0;k<K-1;k++) for(let i=0;i<seg;i++){ const a=k*seg+i, b=k*seg+(i+1)%seg, c=(k+1)*seg+i, d=(k+1)*seg+(i+1)%seg;
      idx.push(a,c,b, b,c,d); }
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
    g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
    g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  function lerpProfiles(key, steps){
    // key: [{y,wx,wz,n}], returns dense ring list
    const out=[];
    for(let s=0;s<key.length-1;s++){ const a=key[s],b=key[s+1];
      const sub = s===key.length-2?steps:steps;
      for(let t=0;t<sub;t++){ const f=t/sub;
        out.push({ y:a.y+(b.y-a.y)*f, wx:a.wx+(b.wx-a.wx)*f, wz:a.wz+(b.wz-a.wz)*f, n:a.n+(b.n-a.n)*f }); } }
    out.push(key[key.length-1]); return out;
  }

  const SEG=72;
  function buildBody(){
    const key=[
      {y:-1.78,wx:1.16,wz:0.46,n:2.4},  // rolled hem
      {y:-1.66,wx:1.36,wz:0.56,n:2.35},
      {y:-0.70,wx:1.40,wz:0.60,n:2.35}, // flat-ish torso (wider than deep)
      {y: 0.35,wx:1.44,wz:0.62,n:2.35}, // chest
      {y: 1.05,wx:1.47,wz:0.56,n:2.4},
      {y: 1.52,wx:1.52,wz:0.50,n:2.6},  // shoulder line (widest, flatter)
      {y: 1.66,wx:1.06,wz:0.46,n:2.8},  // yoke slope to neck
      {y: 1.74,wx:0.58,wz:0.40,n:3.1},
      {y: 1.80,wx:0.40,wz:0.33,n:3.4},  // neck opening
    ];
    return loft(lerpProfiles(key,9).map(r=>ring(r.wx,r.wz,r.y,r.n,SEG)), SEG);
  }
  function buildSleeve(sign){
    // short sleeve: a flattened cone curving downward, wide armhole blending into
    // the shoulder, tapering + capped at the cuff
    const L=0.86, rings=[]; const steps=14;
    for(let s=0;s<=steps;s++){ const t=s/steps;
      const rx = t*L;
      const ry=(0.68-0.24*t), rz=(0.40-0.14*t);       // big armhole tapering to a flatter cuff
      const pts=[]; for(let i=0;i<SEG;i++){ const a=i/SEG*Math.PI*2;
        pts.push(V(rx, Math.cos(a)*ry, Math.sin(a)*rz)); } rings.push(pts); }
    const g=new THREE.BufferGeometry(); const pos=[],uv=[],idx=[]; const K=rings.length;
    for(let k=0;k<K;k++) for(let i=0;i<SEG;i++){ const p=rings[k][i]; pos.push(p.x,p.y,p.z); uv.push(i/SEG,k/(K-1)); }
    for(let k=0;k<K-1;k++) for(let i=0;i<SEG;i++){ const a=k*SEG+i,b=k*SEG+(i+1)%SEG,c=(k+1)*SEG+i,d=(k+1)*SEG+(i+1)%SEG; idx.push(a,c,b,b,c,d); }
    const last=rings[K-1]; let cx=0,cy=0,cz=0; last.forEach(p=>{cx+=p.x;cy+=p.y;cz+=p.z;});
    const ci=pos.length/3; pos.push(cx/SEG,cy/SEG,cz/SEG); uv.push(0.5,1);
    for(let i=0;i<SEG;i++){ const a=(K-1)*SEG+i, b=(K-1)*SEG+(i+1)%SEG; idx.push(a,b,ci); }
    g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
    g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
    const m=new THREE.Mesh(g,fabricMat); m.castShadow=true;
    m.rotation.z = sign*(-0.52);        // angle down from the shoulder
    m.rotation.y = sign*(0.06);
    m.position.set(sign*1.30, 1.14, 0.04);   // at the shoulder corner, armhole overlaps the body
    return m;
  }

  let bodyMesh=null, decals=[];
  function build(g){
    // clear
    [...group.children].forEach(c=>group.remove(c));
    decals=[];
    bodyMesh=new THREE.Mesh(buildBody(), fabricMat); bodyMesh.castShadow=true; bodyMesh.receiveShadow=true;
    group.add(bodyMesh);
    group.add(buildSleeve(1), buildSleeve(-1));
    // ribbed collar (elliptical torus at neck)
    const collar=new THREE.Mesh(new THREE.TorusGeometry(0.42,0.05,16,80), collarMat);
    collar.rotation.x=Math.PI/2; collar.scale.set(1.0,0.82,1.0); collar.position.set(0,1.80,0.0);
    group.add(collar);

    haloMat.color.setHex(g.halo); haloMat.emissive.setHex(g.halo);

    // decals (projected prints)
    addDecal(g.back,  V(0,0.15,-0.55), new THREE.Euler(0,Math.PI,0), V(1.7,2.15,1.6));  // back print
    addDecal(g.chest, V(0.55,0.70,0.58), new THREE.Euler(0,0,0),      V(0.52,0.46,0.7));  // chest hit
    group.scale.setScalar(0.72); loading.classList.add("hide");
  }
  function addDecal(url, pos, euler, size){
    loader.load(url, tex=>{ tex.colorSpace=THREE.SRGBColorSpace;
      const dm=new THREE.MeshStandardMaterial({ map:tex, transparent:true, roughness:0.85, metalness:0,
        polygonOffset:true, polygonOffsetFactor:-6, depthTest:true, side:THREE.FrontSide });
      const o=new THREE.Mesh(new DecalGeometry(bodyMesh, pos, euler, size), dm);
      group.add(o); decals.push(o); });
  }

  const loader=new THREE.TextureLoader();
  const GARMENTS=[{ id:"trinity", product:"trinity-tee", name:"The Trinity Tee", price:"$65", halo:0xc6a15b,
    chest:"assets/print/chest.png", back:"assets/print/back.png",
    desc:"The Trinity Tee — a true 3D model in washed-black heavyweight cotton. Chest hit and the red/bone/royal haloed A's across the back. Spin it in the round." }];

  /* ============ turntable ============ */
  let az=0.5, autoSpin=true, dragging=false, lastX=0, vel=0;
  stage.addEventListener("pointerdown", e=>{ dragging=true; hintEl.classList.add("hide"); lastX=(e.touches?e.touches[0]:e).clientX; stage.setPointerCapture?.(e.pointerId); });
  addEventListener("pointermove", e=>{ if(!dragging) return; const x=(e.touches?e.touches[0]:e).clientX; vel=(x-lastX)*0.01; az+=vel; lastX=x; });
  addEventListener("pointerup", ()=>{ dragging=false; });

  function resize(){ const w=stage.clientWidth,h=stage.clientHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage); resize();
  let paused=false; new IntersectionObserver(es=>{ paused=!es[0].isIntersecting; },{threshold:0}).observe(stage);

  const RAD=10.4; const clock=new THREE.Clock();
  (function tick(){ requestAnimationFrame(tick); if(paused) return;
    const t=clock.getElapsedTime();
    if(!dragging){ if(autoSpin) az+=0.005; else { az+=vel; vel*=0.92; } }
    group.rotation.y=az;
    if(group.scale.x<1){ group.scale.addScalar(0.02); if(group.scale.x>1) group.scale.setScalar(1); }
    camera.position.set(0,0.6,RAD); camera.lookAt(0,-0.1,0);
    halo.rotation.y+=0.004; halo.position.y=3.15+Math.sin(t*1.1)*0.04;
    glow.material.opacity=0.4+Math.sin(t*1.6)*0.07;
    renderer.render(scene,camera);
  })();

  /* ============ UI ============ */
  const sw=document.getElementById("atelierSwitch");
  sw.innerHTML=`<button class="opt active" data-cursor="forge">Trinity Tee</button>`;
  function setGarment(){ const g=GARMENTS[0];
    document.getElementById("atelierName").textContent=g.name;
    document.getElementById("atelierPrice").textContent=g.price;
    document.getElementById("atelierDesc").textContent=g.desc;
    document.getElementById("atelierBadge").textContent="TRINITY";
    loading.classList.remove("hide"); hintEl.classList.remove("hide"); build(g);
  }
  document.getElementById("atelierSpin").addEventListener("click", ()=>{ autoSpin=!autoSpin; window.Ascension?.toast(autoSpin?"Auto-spin on":"Auto-spin paused"); });
  document.getElementById("atelierAdd").addEventListener("click", ()=>{ window.Ascension?.openModal?.(GARMENTS[0].product); });
  setGarment();
}

function radialSprite(hex){ const s=128,c=document.createElement("canvas"); c.width=c.height=s; const x=c.getContext("2d");
  const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2); g.addColorStop(0,hex); g.addColorStop(0.35,hex+"aa"); g.addColorStop(1,hex+"00");
  x.fillStyle=g; x.fillRect(0,0,s,s); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }
