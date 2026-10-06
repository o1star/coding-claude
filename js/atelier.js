/* =====================================================================
   ASCENSION — atelier.js  ·  3D garment viewer (three.js)
   Loads `three` via the page's importmap (vendored locally).
   ===================================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const stage   = document.getElementById("atelierStage");
const canvas  = document.getElementById("atelierCanvas");
const loading = document.getElementById("atelierLoading");
const hintEl  = document.getElementById("atelierHint");

const GARMENTS = [
  { id:"trinity",  product:"trinity-tee",  name:"The Trinity Tee",     price:"$65",
    front:"assets/cut/tee_front.png",  frontH:"assets/cut/tee_front_h.png",  frontN:"assets/cut/tee_front_n.png",
    back:"assets/cut/tee_back.png",    backH:"assets/cut/tee_back_h.png",    backN:"assets/cut/tee_back_n.png",  halo:0xc6a15b,
    desc:"Rotate the Trinity in real space — red, bone and royal haloed A's cracked across the back." },
  { id:"spectrum", product:"spectrum-zip",  name:"Spectrum Zip Hoodie", price:"$150",
    front:"assets/cut/hoodie_rbw_front.png",  frontH:"assets/cut/hoodie_rbw_front_h.png",  frontN:"assets/cut/hoodie_rbw_front_n.png",
    back:"assets/cut/hoodie_rbw_back.png",     backH:"assets/cut/hoodie_rbw_back_h.png",    backN:"assets/cut/hoodie_rbw_back_n.png",  halo:0xc6a15b,
    desc:"Six haloed A's in full spectrum, stacked down the back of a distressed 480gsm zip." },
  { id:"phantom",  product:"phantom-zip",   name:"Phantom Zip Hoodie",  price:"$145",
    front:"assets/cut/hoodie_wash_front.png", frontH:"assets/cut/hoodie_wash_front_h.png", frontN:"assets/cut/hoodie_wash_front_n.png",
    back:"assets/cut/hoodie_wash_back.png",    backH:"assets/cut/hoodie_wash_back_h.png",   backN:"assets/cut/hoodie_wash_back_n.png",  halo:0x8f8f96,
    desc:"Washed-black on washed-black. The Phantom moves unseen — tonal haloed A's throughout." },
];

/* ---- WebGL guard ---- */
function webglOK(){ try{ const c=document.createElement("canvas");
  return !!(window.WebGLRenderingContext && (c.getContext("webgl")||c.getContext("experimental-webgl"))); }catch{ return false; } }
if(!webglOK()){ stage.classList.add("webgl-fail"); }
else { boot(); }

function boot(){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.15, 8.7);   // head-on; the garment itself yaws

  // soft studio environment for subtle material sheen
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // lights — key + brand rim lights (red / royal)
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(2.5,4,5); scene.add(key);
  const rimR = new THREE.SpotLight(0xff3b2e, 10, 22, 0.6, 0.8); rimR.position.set(-5,1,-3); scene.add(rimR);
  const rimB = new THREE.SpotLight(0x2b49e0, 9, 22, 0.6, 0.8); rimB.position.set(5,-1,-3.5); scene.add(rimB);

  const root = new THREE.Group(); scene.add(root);

  /* ---------- halo (torus + glow sprite + light) ---------- */
  const halo = new THREE.Group();
  const haloMat = new THREE.MeshStandardMaterial({ color:0xc6a15b, emissive:0xc6a15b, emissiveIntensity:1.9, metalness:1, roughness:0.28 });
  const haloMesh = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 28, 140), haloMat);
  haloMesh.rotation.x = Math.PI/2.15;
  halo.add(haloMesh);
  const haloLight = new THREE.PointLight(0xc6a15b, 7, 11, 2); halo.add(haloLight);
  // glow sprite
  const glowTex = radialSprite("#c6a15b");
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0xc6a15b, transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false }));
  glow.scale.set(4.2,4.2,1); halo.add(glow);
  halo.position.set(0, 2.2, 0);
  root.add(halo);

  /* ---------- soft contact shadow (fake) ---------- */
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 2.2),
    new THREE.MeshBasicMaterial({ map:radialSprite("#000000"), transparent:true, opacity:0.5, depthWrite:false }));
  shadow.rotation.x = -Math.PI/2; shadow.position.set(0,-2.2,0); root.add(shadow);

  /* ---------- garment: two curved planes (front/back) ---------- */
  const loader = new THREE.TextureLoader();
  const garmentGroup = new THREE.Group(); root.add(garmentGroup);
  let frontMesh=null, backMesh=null, loadToken=0, showBack=false;

  const PUFF = 0.66;   // how far the garment inflates off the mid-plane
  function garmentPlane(ratio){
    const h = 3.7, w = h*ratio;
    // flat base; the displacement map provides all the volume, and a flat
    // rim (height 0) means the front and back shells meet exactly at z=0.
    const g = new THREE.PlaneGeometry(w, h, 220, 220);
    return g;   // normals are +Z; displacement pushes straight out, back mesh mirrors it
  }
  // front and back share ONE geometry: front bulges +Z (FrontSide), back bulges
  // -Z (BackSide, negative displacement) so both have the identical outline.
  function makeMat(color, height, normal, back){
    color.colorSpace = THREE.SRGBColorSpace; color.anisotropy = 8;
    if(back){ [color, height, normal].forEach(t=>{ t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; }); }
    return new THREE.MeshStandardMaterial({
      map: color, displacementMap: height, displacementScale: back ? -PUFF : PUFF,
      normalMap: normal, normalScale: new THREE.Vector2(back?-1.15:1.15, 1.15),
      roughness:0.96, metalness:0.0, side: back ? THREE.BackSide : THREE.FrontSide
    });
  }

  // keep only the triangles that fall on the garment (drop the rest of the rectangle),
  // so the edge is real geometry instead of an aliased alpha-clip comb
  function trimToSilhouette(geo, img){
    const cv=document.createElement("canvas"); cv.width=img.width; cv.height=img.height;
    const cx=cv.getContext("2d"); cx.drawImage(img,0,0);
    const d=cx.getImageData(0,0,img.width,img.height).data;
    const uv=geo.attributes.uv, n=geo.attributes.position.count;
    const inside=new Uint8Array(n);
    for(let i=0;i<n;i++){
      const px=Math.min(img.width-1, Math.max(0, Math.round(uv.getX(i)*(img.width-1))));
      const py=Math.min(img.height-1,Math.max(0, Math.round((1-uv.getY(i))*(img.height-1))));
      inside[i]= d[(py*img.width+px)*4+3] > 24 ? 1 : 0;   // alpha channel = silhouette
    }
    const idx=geo.index.array, keep=[];
    for(let f=0;f<idx.length;f+=3){
      const a=idx[f],b=idx[f+1],c=idx[f+2];
      if(inside[a]&&inside[b]&&inside[c]) keep.push(a,b,c);   // fully-inside faces = crisp edge, no smear
    }
    geo.setIndex(keep);
  }

  function loadGarment(g){
    const token = ++loadToken;      // guards against overlapping switches
    const t = {}; let done = 0; const need = 6;
    const ready = ()=>{ if(++done < need || token !== loadToken) return;
      const ratio = (t.cf.image && t.cf.image.width/t.cf.image.height) || 0.8;
      const geo = garmentPlane(ratio);
      trimToSilhouette(geo, t.cf.image);     // cut the mesh down to the garment outline
      if(frontMesh) garmentGroup.remove(frontMesh, backMesh);
      frontMesh = new THREE.Mesh(geo, makeMat(t.cf, t.hf, t.nf, false));  // same geo, bulges +Z
      backMesh  = new THREE.Mesh(geo, makeMat(t.cb, t.hb, t.nb, true));   // same geo, bulges -Z (BackSide)
      garmentGroup.add(frontMesh, backMesh);
      haloMat.color.setHex(g.halo); haloMat.emissive.setHex(g.halo);
      haloLight.color.setHex(g.halo); glow.material.color.setHex(g.halo);
      garmentGroup.scale.setScalar(0.6);
      loading.classList.add("hide");
    };
    const F = showBack ? {c:g.back, h:g.backH, n:g.backN} : {c:g.front, h:g.frontH, n:g.frontN};
    const B = showBack ? {c:g.front,h:g.frontH,n:g.frontN} : {c:g.back, h:g.backH, n:g.backN};
    t.cf = loader.load(F.c, ready); t.cb = loader.load(B.c, ready);
    t.hf = loader.load(F.h, ready); t.hb = loader.load(B.h, ready);
    t.nf = loader.load(F.n, ready); t.nb = loader.load(B.n, ready);
  }

  let active = 0;

  /* ---------- interaction: subtle live-parallax rotate + flip-reveal ---------- */
  const LIMIT = 0.30;                 // gentle yaw each side (~17°) — always in the clean zone
  let dragYaw = 0, dragPitch = 0, idleT = 3, dragging = false, lastX = 0, lastY = 0;
  const dom = renderer.domElement;
  const getp = e => e.touches ? e.touches[0] : e;
  dom.addEventListener("pointerdown", e=>{ dragging=true; hintEl.classList.add("hide"); const p=getp(e); lastX=p.clientX; lastY=p.clientY; });
  addEventListener("pointermove", e=>{ if(!dragging) return; const p=getp(e);
    dragYaw   = Math.max(-LIMIT, Math.min(LIMIT, dragYaw + (p.clientX-lastX)*0.005));
    dragPitch = Math.max(-0.20, Math.min(0.20, dragPitch + (p.clientY-lastY)*0.003));
    lastX=p.clientX; lastY=p.clientY; idleT=0; });
  addEventListener("pointerup", ()=>{ dragging=false; });
  // flip = clean texture-swap reveal (never spins through the thin edge-on profile)
  function flip(){ showBack = !showBack; dragYaw = 0; loadGarment(GARMENTS[active]);
    document.getElementById("atelierBadge").textContent = (showBack?"BACK · ":"") + GARMENTS[active].id.toUpperCase();
    window.Ascension?.toast(showBack ? "Viewing the back" : "Viewing the front"); }

  /* ---------- resize ---------- */
  function resize(){ const w=stage.clientWidth, h=stage.clientHeight;
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage); resize();

  /* ---------- loop ---------- */
  let pausedOffscreen=false;
  new IntersectionObserver(es=>{ pausedOffscreen = !es[0].isIntersecting; },{threshold:0}).observe(stage);
  const clock = new THREE.Clock();
  (function tick(){
    requestAnimationFrame(tick);
    if(pausedOffscreen) return;
    const t = clock.getElapsedTime();
    halo.rotation.y += 0.004;
    halo.position.y = 2.55 + Math.sin(t*1.1)*0.06;
    glow.material.opacity = 0.42 + Math.sin(t*1.6)*0.08;
    if(garmentGroup.scale.x < 1){ garmentGroup.scale.addScalar(0.02); if(garmentGroup.scale.x>1) garmentGroup.scale.setScalar(1); }
    idleT += 1/60;
    if(!dragging && idleT>2.2){ dragYaw += -dragYaw*0.02; dragPitch += -dragPitch*0.02; }
    const rock = (!dragging && idleT>1.8) ? Math.sin(t*0.5)*0.22 : 0;   // gentle live-3D sway
    garmentGroup.rotation.y = dragYaw + rock;
    garmentGroup.rotation.x = dragPitch + Math.sin(t*0.4)*0.015;
    renderer.render(scene,camera);
  })();

  /* ---------- UI wiring ---------- */
  const sw = document.getElementById("atelierSwitch");
  sw.innerHTML = GARMENTS.map((g,i)=>`<button class="opt ${i===0?"active":""}" data-g="${i}" data-cursor="forge">${g.name.replace(" Hoodie","")}</button>`).join("");
  function setGarment(i){ active=i;
    [...sw.children].forEach((b,bi)=>b.classList.toggle("active", bi===i));
    const g=GARMENTS[i];
    document.getElementById("atelierName").textContent=g.name;
    document.getElementById("atelierPrice").textContent=g.price;
    document.getElementById("atelierDesc").textContent=g.desc;
    document.getElementById("atelierBadge").textContent=g.id.toUpperCase();
    loading.classList.remove("hide"); hintEl.classList.remove("hide");
    loadGarment(g);
  }
  sw.addEventListener("click", e=>{ const b=e.target.closest("[data-g]"); if(!b) return; setGarment(+b.dataset.g); });
  document.getElementById("atelierSpin").addEventListener("click", flip);
  document.getElementById("atelierAdd").addEventListener("click", ()=>{
    const g=GARMENTS[active];
    if(window.Ascension?.openModal) window.Ascension.openModal(g.product);
  });

  // set initial panel text
  setGarment(0); loading.classList.remove("hide");
}

/* radial gradient sprite texture */
function radialSprite(hex){
  const s=128, c=document.createElement("canvas"); c.width=c.height=s;
  const x=c.getContext("2d");
  const grd=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  grd.addColorStop(0, hex); grd.addColorStop(0.35, hex+"aa"); grd.addColorStop(1, hex+"00");
  x.fillStyle=grd; x.fillRect(0,0,s,s);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
