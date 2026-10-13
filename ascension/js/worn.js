/* =====================================================================
   ASCENSION — worn.js  ·  spin-able 3D garment, inflated/molded as if worn
   Builds a single WATERTIGHT shell from the garment silhouette (front +
   back surfaces welded at the seam), puffed through the torso, and spins
   it on a turntable. Loads `three` via the page importmap.
   ===================================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const stage   = document.getElementById("atelierStage");
const canvas  = document.getElementById("atelierCanvas");
const loading = document.getElementById("atelierLoading");
const hintEl  = document.getElementById("atelierHint");

const GARMENTS = [
  { id:"trinity", product:"trinity-tee", name:"The Trinity Tee", price:"$65", halo:0xc6a15b,
    front:"assets/cut/tee_front.png",  frontH:"assets/cut/tee_front_h.png",
    back:"assets/cut/tee_back.png",
    desc:"The Trinity Tee rendered in 3D — filled out as if worn, spinning in the round. Red, bone and royal haloed A's across the back." },
  { id:"spectrum", product:"spectrum-zip", name:"Spectrum Zip Hoodie", price:"$150", halo:0xc6a15b,
    front:"assets/cut/hoodie_rbw_front.png",  frontH:"assets/cut/hoodie_rbw_front_h.png",
    back:"assets/cut/hoodie_rbw_back.png",
    desc:"The Spectrum zip, molded and spinning. Six haloed A's in full spectrum down the back." },
  { id:"phantom", product:"phantom-zip", name:"Phantom Zip Hoodie", price:"$145", halo:0x8f8f96,
    front:"assets/cut/hoodie_wash_front.png", frontH:"assets/cut/hoodie_wash_front_h.png",
    back:"assets/cut/hoodie_wash_back.png",
    desc:"Washed-black on washed-black, turning slowly in the round. The Phantom, worn." },
];

function webglOK(){ try{ const c=document.createElement("canvas");
  return !!(window.WebGLRenderingContext && (c.getContext("webgl2")||c.getContext("webgl"))); }catch{ return false; } }
if(!webglOK()) stage.classList.add("webgl-fail"); else boot();

function boot(){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2,3,5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6); fill.position.set(-3,1,-4); scene.add(fill);
  const rimR = new THREE.SpotLight(0xff3b2e, 7, 26, 0.7, 0.9); rimR.position.set(-6,2,-2); scene.add(rimR);
  const rimB = new THREE.SpotLight(0x2b49e0, 6, 26, 0.7, 0.9); rimB.position.set(6,-1,-3); scene.add(rimB);

  // halo + glow + ground shadow
  const halo = new THREE.Group();
  const haloMat = new THREE.MeshStandardMaterial({ color:0xc6a15b, emissive:0xc6a15b, emissiveIntensity:1.8, metalness:1, roughness:0.3 });
  const haloMesh=new THREE.Mesh(new THREE.TorusGeometry(0.85,0.07,28,140), haloMat); haloMesh.rotation.x=Math.PI/2.15; halo.add(haloMesh);
  const haloLight = new THREE.PointLight(0xc6a15b,6,12,2); halo.add(haloLight);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map:radialSprite("#c6a15b"), color:0xc6a15b, transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false }));
  glow.scale.set(4.2,4.2,1); halo.add(glow);
  halo.position.set(0,2.95,0); scene.add(halo);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.6,2.4),
    new THREE.MeshBasicMaterial({ map:radialSprite("#000000"), transparent:true, opacity:0.5, depthWrite:false }));
  shadow.rotation.x=-Math.PI/2; shadow.position.set(0,-2.7,0); scene.add(shadow);

  const group = new THREE.Group(); scene.add(group);   // the spinning garment
  const loader = new THREE.TextureLoader();
  let mesh=null, loadToken=0, active=0;
  const Hd = 4.9, DEPTH = 1.7;   // garment height + how far it inflates

  function build(g){
    const token=++loadToken;
    const colorF = loader.load(g.front); const colorB = loader.load(g.back);
    colorF.colorSpace=THREE.SRGBColorSpace; colorB.colorSpace=THREE.SRGBColorSpace;
    colorB.wrapS=THREE.RepeatWrapping; colorB.repeat.x=-1;   // back reads correctly from behind
    const hImg=new Image();
    hImg.onload=()=>{ if(token!==loadToken) return;
      const cImg=new Image();
      cImg.onload=()=>{ if(token!==loadToken) return; make(hImg, cImg); };
      cImg.src=g.front;
    };
    hImg.src=g.frontH;

    function sampler(img){
      const cv=document.createElement("canvas"); cv.width=img.width; cv.height=img.height;
      const cx=cv.getContext("2d"); cx.drawImage(img,0,0);
      const d=cx.getImageData(0,0,img.width,img.height).data;
      return { w:img.width, h:img.height, at:(u,v,ch)=>{ const px=Math.min(img.width-1,Math.max(0,Math.round(u*(img.width-1))));
        const py=Math.min(img.height-1,Math.max(0,Math.round(v*(img.height-1)))); return d[(py*img.width+px)*4+ch]; } };
    }

    function make(hImg, cImg){
      const H=sampler(hImg), C=sampler(cImg);
      const ratio=C.w/C.h, Wd=Hd*ratio;
      const cols=90, rows=Math.round(cols/ratio);
      const idx=(i,j)=>i+j*cols;
      const act=new Uint8Array(cols*rows), dep=new Float32Array(cols*rows);
      for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){
        const u=i/(cols-1), v=j/(rows-1);
        act[idx(i,j)] = C.at(u,v,3)>60 ? 1:0;
        dep[idx(i,j)] = H.at(u,v,0)/255;      // 0..1 puff from the baked height map
      }
      const isBoundary=(i,j)=>{ for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){
        const ni=i+di,nj=j+dj; if(ni<0||ni>=cols||nj<0||nj>=rows||!act[idx(ni,nj)]) return true; } return false; };

      const frontV=new Int32Array(cols*rows).fill(-1), backV=new Int32Array(cols*rows).fill(-1);
      const pos=[], uv=[];
      const push=(x,y,z,u,v)=>{ pos.push(x,y,z); uv.push(u,1-v); return pos.length/3-1; };
      for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){ if(!act[idx(i,j)]) continue;
        const u=i/(cols-1), v=j/(rows-1), x=(u-0.5)*Wd, y=(0.5-v)*Hd;
        // torso-ish profile: fuller through the chest, tapering to the hem
        const vert = 0.75 + 0.45*Math.sin(Math.min(1,Math.max(0,v))*Math.PI);
        const d = DEPTH * dep[idx(i,j)] * vert;
        if(isBoundary(i,j)){ const w=push(x,y,0,u,v); frontV[idx(i,j)]=w; backV[idx(i,j)]=w; }   // welded seam
        else { frontV[idx(i,j)]=push(x,y, d,u,v); backV[idx(i,j)]=push(x,y,-d,u,v); }
      }
      const fFaces=[], bFaces=[];
      for(let j=0;j<rows-1;j++) for(let i=0;i<cols-1;i++){
        const a=idx(i,j),b=idx(i+1,j),c=idx(i,j+1),e=idx(i+1,j+1);
        if(act[a]&&act[b]&&act[c]&&act[e]){
          fFaces.push(frontV[a],frontV[c],frontV[b], frontV[b],frontV[c],frontV[e]);  // +Z out
          bFaces.push(backV[a],backV[b],backV[c],  backV[b],backV[e],backV[c]);        // -Z out (reversed)
        }
      }
      const geo=new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos,3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv,2));
      const index=fFaces.concat(bFaces); geo.setIndex(index);
      geo.addGroup(0, fFaces.length, 0);              // front faces -> material 0
      geo.addGroup(fFaces.length, bFaces.length, 1);  // back faces  -> material 1
      geo.computeVertexNormals(); geo.computeBoundingSphere();

      const mk=(tex)=> new THREE.MeshStandardMaterial({ map:tex, roughness:0.92, metalness:0.0, side:THREE.FrontSide });
      if(mesh){ group.remove(mesh); mesh.geometry.dispose(); }
      mesh=new THREE.Mesh(geo, [mk(colorF), mk(colorB)]);
      group.add(mesh);
      haloMat.color.setHex(g.halo); haloMat.emissive.setHex(g.halo);
      haloLight.color.setHex(g.halo); glow.material.color.setHex(g.halo);
      group.scale.setScalar(0.72); loading.classList.add("hide");
    }
  }

  /* ---------- turntable: auto-spin + drag ---------- */
  let az=0, autoSpin=true, dragging=false, lastX=0, vel=0, pitch=0;
  stage.addEventListener("pointerdown", e=>{ dragging=true; hintEl.classList.add("hide");
    lastX=(e.touches?e.touches[0]:e).clientX; stage.setPointerCapture?.(e.pointerId); });
  addEventListener("pointermove", e=>{ if(!dragging) return; const x=(e.touches?e.touches[0]:e).clientX;
    vel=(x-lastX)*0.01; az+=vel; lastX=x; });
  addEventListener("pointerup", ()=>{ dragging=false; });

  function resize(){ const w=stage.clientWidth,h=stage.clientHeight; renderer.setSize(w,h,false);
    camera.aspect=w/h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage); resize();

  let paused=false;
  new IntersectionObserver(es=>{ paused=!es[0].isIntersecting; },{threshold:0}).observe(stage);

  const RAD=9.6; const clock=new THREE.Clock();
  (function tick(){
    requestAnimationFrame(tick);
    if(paused) return;
    const t=clock.getElapsedTime();
    if(!dragging){ if(autoSpin) az+=0.006; else { az+=vel; vel*=0.92; } }
    group.rotation.y = az;
    group.rotation.x = Math.sin(t*0.4)*0.02;
    if(group.scale.x<1){ group.scale.addScalar(0.02); if(group.scale.x>1) group.scale.setScalar(1); }
    camera.position.set(0,0.3,RAD); camera.lookAt(0,-0.1,0);
    halo.rotation.y+=0.004; halo.position.y=2.95+Math.sin(t*1.1)*0.05;
    glow.material.opacity=0.42+Math.sin(t*1.6)*0.08;
    renderer.render(scene,camera);
  })();

  /* ---------- UI ---------- */
  const sw=document.getElementById("atelierSwitch");
  sw.innerHTML=GARMENTS.map((g,i)=>`<button class="opt ${i===0?"active":""}" data-g="${i}" data-cursor="forge">${g.name.replace(" Hoodie","")}</button>`).join("");
  sw.addEventListener("click",e=>{ const b=e.target.closest("[data-g]"); if(b) setGarment(+b.dataset.g); });
  function setGarment(i){ active=i;
    [...sw.children].forEach((b,bi)=>b.classList.toggle("active",bi===i));
    const g=GARMENTS[i];
    document.getElementById("atelierName").textContent=g.name;
    document.getElementById("atelierPrice").textContent=g.price;
    document.getElementById("atelierDesc").textContent=g.desc;
    document.getElementById("atelierBadge").textContent=g.id.toUpperCase();
    loading.classList.remove("hide"); hintEl.classList.remove("hide"); build(g);
  }
  document.getElementById("atelierSpin").addEventListener("click", ()=>{ autoSpin=!autoSpin;
    window.Ascension?.toast(autoSpin?"Auto-spin on":"Auto-spin paused"); });
  document.getElementById("atelierAdd").addEventListener("click", ()=>{ window.Ascension?.openModal?.(GARMENTS[active].product); });

  setGarment(0);
}

function radialSprite(hex){
  const s=128,c=document.createElement("canvas"); c.width=c.height=s; const x=c.getContext("2d");
  const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  g.addColorStop(0,hex); g.addColorStop(0.35,hex+"aa"); g.addColorStop(1,hex+"00");
  x.fillStyle=g; x.fillRect(0,0,s,s); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
