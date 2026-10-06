/* =====================================================================
   ASCENSION — atelier.js  ·  3D garment viewer (three.js)
   Loads `three` via the page's importmap (vendored locally).
   ===================================================================== */
import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const stage   = document.getElementById("atelierStage");
const canvas  = document.getElementById("atelierCanvas");
const loading = document.getElementById("atelierLoading");
const hintEl  = document.getElementById("atelierHint");

const GARMENTS = [
  { id:"trinity",  product:"trinity-tee",  name:"The Trinity Tee",     price:"$65",
    front:"assets/cut/tee_front.png",         back:"assets/cut/tee_back.png",         halo:0xc6a15b,
    desc:"Rotate the Trinity in real space — red, bone and royal haloed A's cracked across the back." },
  { id:"spectrum", product:"spectrum-zip",  name:"Spectrum Zip Hoodie", price:"$150",
    front:"assets/cut/hoodie_rbw_front.png",  back:"assets/cut/hoodie_rbw_back.png",  halo:0xc6a15b,
    desc:"Six haloed A's in full spectrum, stacked down the back of a distressed 480gsm zip." },
  { id:"phantom",  product:"phantom-zip",   name:"Phantom Zip Hoodie",  price:"$145",
    front:"assets/cut/hoodie_wash_front.png", back:"assets/cut/hoodie_wash_back.png", halo:0x8f8f96,
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
  camera.position.set(1.7, 0.25, 8.7);   // start on a 3/4 angle

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
  let frontMesh=null, backMesh=null, loadToken=0;

  function bentPlane(ratio){
    const h = 3.8, w = h*ratio;
    const g = new THREE.PlaneGeometry(w, h, 40, 40);
    const pos = g.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x = pos.getX(i), y = pos.getY(i);
      const nx = x/(w/2);                       // -1..1
      const z = Math.cos(nx*Math.PI*0.5)*0.42   // horizontal barrel curve
              + Math.sin((y/h)*Math.PI)*0.05;   // slight vertical drape
      pos.setZ(i, z);
    }
    g.computeVertexNormals();
    return g;
  }
  function makeMat(tex, flip){
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    if(flip){ tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = -1; }
    return new THREE.MeshStandardMaterial({ map:tex, transparent:true, alphaTest:0.42, roughness:0.92, metalness:0.0, side:THREE.FrontSide });
  }

  function loadGarment(g){
    const token = ++loadToken;      // guards against overlapping switches
    let f, bk, done=0;
    const two=()=>{ if(++done<2 || token!==loadToken) return;
      const ratio = (f.image && f.image.width/f.image.height) || 0.8;
      const geo = bentPlane(ratio);
      if(frontMesh) garmentGroup.remove(frontMesh, backMesh);
      frontMesh = new THREE.Mesh(geo, makeMat(f,false));
      frontMesh.position.z = 0.03;
      backMesh  = new THREE.Mesh(geo.clone(), makeMat(bk,true));
      backMesh.rotation.y = Math.PI; backMesh.position.z = -0.03;
      garmentGroup.add(frontMesh, backMesh);
      haloMat.color.setHex(g.halo); haloMat.emissive.setHex(g.halo);
      haloLight.color.setHex(g.halo); glow.material.color.setHex(g.halo);
      garmentGroup.scale.setScalar(0.6);
      loading.classList.add("hide");
    };
    f = loader.load(g.front, two); bk = loader.load(g.back, two);
  }

  let active = 0;

  /* ---------- controls ---------- */
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false; controls.enableZoom = false;
  controls.enableDamping = true; controls.dampingFactor = 0.07;
  controls.autoRotate = true; controls.autoRotateSpeed = -1.4;
  controls.minPolarAngle = Math.PI*0.32; controls.maxPolarAngle = Math.PI*0.68;
  controls.rotateSpeed = 0.75;
  let spin = true;
  controls.addEventListener("start", ()=>{ controls.autoRotate=false; hintEl.classList.add("hide"); });
  controls.addEventListener("end",   ()=>{ clearTimeout(idle); idle=setTimeout(()=>{ if(spin) controls.autoRotate=true; }, 2600); });
  let idle;

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
    controls.update();
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
  document.getElementById("atelierSpin").addEventListener("click", ()=>{
    spin=!spin; controls.autoRotate=spin;
    window.Ascension?.toast(spin? "Auto-rotate on":"Auto-rotate paused");
  });
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
