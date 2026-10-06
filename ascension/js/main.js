/* =====================================================================
   ASCENSION — main.js
   ===================================================================== */
(() => {
  "use strict";
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = n => "$" + Number(n).toLocaleString("en-US");
  const isTouch = window.matchMedia("(hover: none), (max-width: 760px)").matches;

  /* =============================== DATA =============================== */
  const PRODUCTS = [
    { id:"trinity-tee", name:"The Trinity Tee", price:65, tag:"NEW", sub:"Washed Black · Trinity",
      front:"assets/tee_front.webp", back:"assets/tee_back.webp",
      desc:"Heavyweight 240gsm vintage-washed tee. Blackletter ASCENSION at the left chest; the Trinity halo graphic — red, bone, royal — cracked and sun-faded across the back. Boxy, dropped shoulder.",
      sizes:["S","M","L","XL"], dots:["#1b1b1e","#c2302a","#2b49e0"] },
    { id:"blood-tee", name:"Trinity Tee — Blood", price:68, tag:"LIMITED", sub:"Overdyed Oxblood · Trinity",
      front:"assets/tee_blood_front.webp", back:"assets/tee_blood_back.webp",
      desc:"The Trinity on an overdyed oxblood body, hand-washed for a cracked vintage hand. A limited consecration for the devout.",
      sizes:["S","M","L","XL"], dots:["#8e1f1a","#c2302a","#2b49e0"] },
    { id:"sand-tee", name:"Trinity Tee — Sand", price:68, tag:"LIMITED", sub:"Washed Sand · Trinity",
      front:"assets/tee_bone_front.webp", back:"assets/tee_bone_back.webp",
      desc:"A sun-bleached fatigue-sand colorway. Washed soft, built heavy. Strictly limited run.",
      sizes:["S","M","L","XL"], dots:["#b7a98a","#c2302a","#2b49e0"] },
    { id:"spectrum-zip", name:"Spectrum Zip Hoodie", price:150, tag:"NEW", sub:"Washed Black · Spectrum",
      front:"assets/hoodie_rbw_front.webp", back:"assets/hoodie_rbw_back.webp",
      desc:"Garment-dyed 480gsm zip hoodie with distressed hem and cuffs. Six haloed A's in full spectrum stacked down the back. Oversized boxy fit, double-layer hood.",
      sizes:["S","M","L","XL","XXL"], dots:["#c2302a","#c6a15b","#1f9d55","#2b49e0","#7a3cc0"] },
    { id:"phantom-zip", name:"Phantom Zip Hoodie", price:145, tag:"NEW", sub:"Washed Black · Tonal",
      front:"assets/hoodie_wash_front.webp", back:"assets/hoodie_wash_back.webp",
      desc:"The Spectrum silhouette rendered in full tonal — washed-black on washed-black, haloed A's ghosted across the back. For those who move unseen.",
      sizes:["S","M","L","XL","XXL"], dots:["#1b1b1e","#3a3a3e"] },
    { id:"ash-zip", name:"Phantom Zip — Ash", price:148, tag:"LIMITED", sub:"Stone-washed Ash · Tonal",
      front:"assets/hoodie_wash_ash_front.webp", back:"assets/hoodie_wash_ash_back.webp",
      desc:"The Phantom cut, stone-washed to a ghost-grey ash. Tonal haloed A's ride across the back.",
      sizes:["S","M","L","XL","XXL"], dots:["#7a7a80","#9a9aa0"] }
  ];

  const SW = {
    trinity:  "linear-gradient(135deg,#c2302a 0 33%,#ece7dc 33% 66%,#2b49e0 66%)",
    blood:    "linear-gradient(135deg,#9d241d,#3c0f0c)",
    sand:     "linear-gradient(135deg,#c9bb98,#8a7d5e)",
    spectrum: "conic-gradient(from 210deg,#c2302a,#c6a15b,#1f9d55,#2b49e0,#7a3cc0,#c2302a)",
    tonal:    "linear-gradient(135deg,#4a4a4e,#232326)",
    ash:      "linear-gradient(135deg,#9a9aa0,#5c5c62)"
  };
  const FORGE = {
    silhouettes: [ {id:"tee", label:"Boxy Tee", sizes:["S","M","L","XL"]},
                   {id:"zip", label:"Zip Hoodie", sizes:["S","M","L","XL","XXL"]} ],
    colorways: [ {id:"trinity", label:"Trinity · R/W/B"},
                 {id:"blood", label:"Blood · Oxblood"},
                 {id:"sand", label:"Sand · Fatigue"},
                 {id:"spectrum", label:"Spectrum"},
                 {id:"tonal", label:"Tonal · Phantom"},
                 {id:"ash", label:"Ash · Ghost"} ],
    combos: {
      "tee:trinity":  {id:"trinity-tee",  name:"The Trinity Tee",      price:65,  front:"assets/tee_front.webp",         back:"assets/tee_back.webp",         badge:"TRINITY",  halo:"#c6a15b"},
      "tee:blood":    {id:"blood-tee",    name:"Trinity Tee — Blood",  price:68,  front:"assets/tee_blood_front.webp",   back:"assets/tee_blood_back.webp",   badge:"BLOOD",    halo:"#c2302a"},
      "tee:sand":     {id:"sand-tee",     name:"Trinity Tee — Sand",   price:68,  front:"assets/tee_bone_front.webp",    back:"assets/tee_bone_back.webp",    badge:"SAND",     halo:"#c6a15b"},
      "zip:spectrum": {id:"spectrum-zip", name:"Spectrum Zip Hoodie",  price:150, front:"assets/hoodie_rbw_front.webp",  back:"assets/hoodie_rbw_back.webp",  badge:"SPECTRUM", halo:"#c6a15b"},
      "zip:tonal":    {id:"phantom-zip",  name:"Phantom Zip Hoodie",   price:145, front:"assets/hoodie_wash_front.webp", back:"assets/hoodie_wash_back.webp", badge:"PHANTOM",  halo:"#6a6a6e"},
      "zip:ash":      {id:"ash-zip",      name:"Phantom Zip — Ash",    price:148, front:"assets/hoodie_wash_ash_front.webp", back:"assets/hoodie_wash_ash_back.webp", badge:"ASH", halo:"#9a9aa0"}
    }
  };
  const FREE_SHIP = 150;

  /* =========================== CUSTOM CURSOR ========================== */
  if (!isTouch) {
    const ring = $(".cursor"), dot = $(".cursor-dot"), label = $(".cursor-label");
    const LABELS = { view:"View", add:"Add", cart:"Bag", home:"Home", forge:"Forge",
      enter:"Enter", close:"Close", join:"Ascend", checkout:"Checkout" };
    let rx=innerWidth/2, ry=innerHeight/2, dx=rx, dy=ry;
    addEventListener("mousemove", e => {
      dx = e.clientX; dy = e.clientY;
      dot.style.transform = `translate(${dx}px,${dy}px)`;
      label.style.left = dx+"px"; label.style.top = (dy+34)+"px";
    });
    (function loop(){ rx += (dx-rx)*.18; ry += (dy-ry)*.18;
      ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
    addEventListener("mousedown", ()=>ring.classList.add("down"));
    addEventListener("mouseup",   ()=>ring.classList.remove("down"));
    addEventListener("mouseleave",()=>{ring.classList.add("hidden");dot.classList.add("hidden");});
    addEventListener("mouseenter",()=>{ring.classList.remove("hidden");dot.classList.remove("hidden");});
    const hoverSel = "a, button, .card, .look-item, .opt, .cw, .size, .dot-sw, input";
    document.addEventListener("mouseover", e=>{
      const el = e.target.closest(hoverSel); if(!el) return;
      ring.classList.add("hover");
      const key = el.getAttribute("data-cursor");
      if (key && LABELS[key]) { label.textContent = LABELS[key]; label.classList.add("show"); }
    });
    document.addEventListener("mouseout", e=>{
      const el = e.target.closest(hoverSel); if(!el) return;
      ring.classList.remove("hover"); label.classList.remove("show");
    });
    // magnetic buttons
    $$(".btn, .nav-logo, .cart-btn").forEach(el=>{
      el.addEventListener("mousemove", e=>{
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left+r.width/2), my = e.clientY - (r.top+r.height/2);
        el.style.transform = `translate(${mx*.25}px,${my*.35}px)`;
      });
      el.addEventListener("mouseleave", ()=> el.style.transform = "");
    });
  } else {
    document.body.classList.add("no-custom-cursor");
  }

  /* ============================ PRELOADER ============================= */
  const pre = $("#preloader"), bar = $(".pre-bar span"), cnt = $(".pre-count b");
  let p = 0;
  const tick = setInterval(()=>{
    p += Math.random()*14 + 4; if (p>=100){ p=100; clearInterval(tick); done(); }
    bar.style.width = p+"%"; cnt.textContent = Math.floor(p);
  }, 130);
  function done(){
    setTimeout(()=>{ pre.classList.add("done"); startReveals(); runScramble($(".hero-title")); }, 350);
  }

  /* ============================== NAV ================================= */
  const nav = $("#nav");
  addEventListener("scroll", ()=> nav.classList.toggle("scrolled", scrollY > 40), {passive:true});
  const menu = $("#menu"), burger = $("#burger");
  function toggleMenu(f){ const open = f ?? !menu.classList.contains("open");
    menu.classList.toggle("open", open); burger.classList.toggle("active", open);
    document.body.classList.toggle("menu-open", open); }
  burger.addEventListener("click", ()=>toggleMenu());
  $$("#menu a").forEach(a=>a.addEventListener("click", ()=>toggleMenu(false)));

  /* ========================= SCRAMBLE TEXT =========================== */
  const GLYPHS = "ÆŦØÞ#%&/†ÅẞΩ∆✦ASCENIOND";
  function scramble(el){
    const text = el.getAttribute("data-text") || el.textContent;
    let frame = 0; const dur = 34;
    const queue = [...text].map((ch,i)=>({ch, start: Math.floor(i*2), end: Math.floor(i*2)+Math.random()*14+8}));
    const id = setInterval(()=>{
      let out = "";
      queue.forEach(q=>{
        if (frame >= q.end) out += q.ch;
        else if (frame >= q.start) out += GLYPHS[Math.floor(Math.random()*GLYPHS.length)];
        else out += "";
      });
      el.textContent = out; frame++;
      if (frame > dur+ text.length*2){ clearInterval(id); el.textContent = text; }
    }, 40);
  }
  function runScramble(scope){ $$(".scramble", scope).forEach(el=>{ if(!el.dataset.done){scramble(el); el.dataset.done="1";} }); }

  /* ======================= REVEAL + PARALLAX ========================= */
  let io;
  function startReveals(){
    io = new IntersectionObserver((ents)=>{
      ents.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in");
        if(en.target.querySelector?.(".scramble")) runScramble(en.target);
        io.unobserve(en.target); } });
    }, {threshold:.15, rootMargin:"0px 0px -8% 0px"});
    $$(".reveal").forEach(el=>io.observe(el));
  }
  const px = $$("[data-parallax]");
  addEventListener("scroll", ()=>{ const y = scrollY;
    px.forEach(el=>{ const f = parseFloat(el.dataset.parallax); el.style.transform = `translateY(${y*f}px)`; });
  }, {passive:true});
  // hero pointer parallax
  const heroMark = $(".hero-mark"), heroWord = $(".hero-bg-word");
  if(!isTouch) addEventListener("mousemove", e=>{
    const cx = (e.clientX/innerWidth-.5), cy=(e.clientY/innerHeight-.5);
    if(scrollY<innerHeight){ heroMark.style.marginLeft = (cx*18)+"px"; heroMark.style.marginTop=(cy*10)+"px";
      heroWord.style.marginLeft=(cx*-30)+"px"; }
  });

  /* =========================== CART (state) ========================== */
  const KEY = "ascension_cart_v1";
  let cart = load();
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch{ return []; } }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(cart)); }catch{} }
  function add(item){
    const key = `${item.id}|${item.size}|${item.cw||""}`;
    const found = cart.find(c=>c.key===key);
    if(found) found.qty += item.qty||1; else cart.push({...item, key, qty:item.qty||1});
    save(); renderCart(true); bumpCount();
  }
  function setQty(key,d){ const it=cart.find(c=>c.key===key); if(!it)return;
    it.qty+=d; if(it.qty<=0) cart = cart.filter(c=>c.key!==key); save(); renderCart(); }
  function remove(key){ cart = cart.filter(c=>c.key!==key); save(); renderCart(); }
  const count = ()=> cart.reduce((n,c)=>n+c.qty,0);
  const subtotal = ()=> cart.reduce((n,c)=>n+c.qty*c.price,0);

  const cartCount=$("#cartCount");
  function bumpCount(){ const n=count(); cartCount.textContent=n; cartCount.classList.toggle("show", n>0);
    cartCount.animate([{transform:"scale(1.6)"},{transform:"scale(1)"}],{duration:300,easing:"cubic-bezier(.6,.01,.05,1)"}); }
  function renderCart(bump){
    const box=$("#cartItems"), n=count();
    $("#cartHeadCount").textContent = n? `(${n})` : "";
    cartCount.textContent=n; cartCount.classList.toggle("show", n>0);
    if(!cart.length){
      box.innerHTML = `<div class="cart-empty"><div><img src="assets/mark.png" alt=""><div class="u-label">Your bag is empty</div><p style="margin-top:10px;max-width:220px;color:var(--muted);font-size:13px">The congregation awaits. Choose your relic.</p></div></div>`;
      $("#cartFoot").style.display="none";
    } else {
      $("#cartFoot").style.display="block";
      box.innerHTML = cart.map(c=>`
        <div class="ci">
          <div class="ci-img"><img src="${c.img}" alt=""></div>
          <div>
            <h4>${c.name}</h4>
            <div class="meta">${c.cwLabel? c.cwLabel+" · ":""}Size ${c.size}</div>
            <div class="qty">
              <button data-dec="${c.key}" data-cursor="add">–</button><span>${c.qty}</span><button data-inc="${c.key}" data-cursor="add">+</button>
            </div>
          </div>
          <div class="right">
            <div class="p">${money(c.price*c.qty)}</div>
            <button class="rm" data-rm="${c.key}">Remove</button>
          </div>
        </div>`).join("");
      const sub=subtotal();
      $("#cartSub").textContent=money(sub); $("#cartTot").textContent=money(sub);
      const fs=$("#freeship");
      if(sub>=FREE_SHIP) fs.innerHTML=`<b>✦ Free divine shipping unlocked</b>`;
      else fs.innerHTML=`Spend <b>${money(FREE_SHIP-sub)}</b> more to unlock free divine shipping`;
    }
    if(bump) bumpCount();
  }
  $("#cartItems").addEventListener("click", e=>{
    const inc=e.target.closest("[data-inc]"), dec=e.target.closest("[data-dec]"), rm=e.target.closest("[data-rm]");
    if(inc) setQty(inc.dataset.inc, +1);
    if(dec) setQty(dec.dataset.dec, -1);
    if(rm){ remove(rm.dataset.rm); toast("Removed from bag"); }
  });
  // open/close cart
  const scrim=$("#scrim"), cartEl=$("#cart");
  function openCart(o){ const open=o??true; cartEl.classList.toggle("open",open); scrim.classList.toggle("show",open);
    document.body.classList.toggle("cart-open",open); }
  $("#openCart").addEventListener("click", ()=>openCart(true));
  $("#closeCart").addEventListener("click", ()=>openCart(false));
  scrim.addEventListener("click", ()=>openCart(false));
  $("#checkoutBtn").addEventListener("click", ()=>{
    if(!cart.length) return;
    toast("Checkout is a sacred rite — demo only ✦");
  });

  /* ========================= PRODUCT GRID ============================ */
  const grid=$("#productGrid");
  grid.innerHTML = PRODUCTS.map((p,i)=>`
    <div class="card reveal ${i===1?"d1":i===2?"d2":""}" data-id="${p.id}">
      <div class="card-media" data-cursor="view">
        <span class="card-tag">${p.tag}</span>
        <img class="front" src="${p.front}" alt="${p.name} front" loading="lazy">
        <img class="back"  src="${p.back}"  alt="${p.name} back"  loading="lazy">
        <button class="card-quick" data-quick="${p.id}" data-cursor="view">Quick View ✦</button>
      </div>
      <div class="card-info">
        <div>
          <h3>${p.name}</h3>
          <div class="sub">${p.sub}</div>
          <div class="card-dots">${p.dots.map((d,di)=>`<span class="dot-sw ${di===0?"active":""}" style="background:${d}"></span>`).join("")}</div>
        </div>
        <div class="price">${money(p.price)}</div>
      </div>
    </div>`).join("");
  if(io){ $$("#productGrid .reveal").forEach(el=>io.observe(el)); }
  grid.addEventListener("click", e=>{
    const q=e.target.closest("[data-quick]"); const card=e.target.closest(".card");
    if(q){ openModal(q.dataset.quick); return; }
    if(card){ openModal(card.dataset.id); }
  });
  // swatch hover highlight
  grid.addEventListener("mouseover", e=>{ const s=e.target.closest(".dot-sw"); if(!s)return;
    s.parentElement.querySelectorAll(".dot-sw").forEach(d=>d.classList.remove("active")); s.classList.add("active"); });

  /* ========================= QUICK-VIEW MODAL ======================== */
  const mScrim=$("#modalScrim"); let modalProduct=null, modalSize=null;
  function openModal(id){
    const p = PRODUCTS.find(x=>x.id===id); if(!p) return; modalProduct=p; modalSize=null;
    $("#modalTag").textContent = "The Drop — " + p.sub;
    $("#modalName").textContent = p.name;
    $("#modalPrice").textContent = money(p.price);
    $("#modalDesc").textContent = p.desc;
    const f=$("#modalFront"), b=$("#modalBack");
    f.src=p.front; b.src=p.back; f.classList.add("show"); b.classList.remove("show");
    $$("#modal .mflip button").forEach(btn=>btn.classList.toggle("active", btn.dataset.face==="front"));
    $("#modalSizes").innerHTML = p.sizes.map(s=>`<button class="size" data-size="${s}" data-cursor="add">${s}</button>`).join("");
    mScrim.classList.add("show"); document.body.classList.add("modal-open");
  }
  function closeModal(){ mScrim.classList.remove("show"); document.body.classList.remove("modal-open"); }
  $("#modalX").addEventListener("click", closeModal);
  mScrim.addEventListener("click", e=>{ if(e.target===mScrim) closeModal(); });
  $$("#modal .mflip button").forEach(btn=>btn.addEventListener("click",()=>{
    const face=btn.dataset.face; $$("#modal .mflip button").forEach(b=>b.classList.toggle("active",b===btn));
    $("#modalFront").classList.toggle("show",face==="front");
    $("#modalBack").classList.toggle("show",face==="back");
  }));
  $("#modalSizes").addEventListener("click", e=>{ const s=e.target.closest(".size"); if(!s)return;
    $$("#modalSizes .size").forEach(b=>b.classList.remove("active")); s.classList.add("active"); modalSize=s.dataset.size; });
  $("#modalAdd").addEventListener("click", ()=>{
    if(!modalProduct) return;
    if(!modalSize){ toast("Choose a size first"); shake($("#modalSizes")); return; }
    add({id:modalProduct.id, name:modalProduct.name, price:modalProduct.price, size:modalSize, img:modalProduct.back});
    toast(`${modalProduct.name} — added ✦`); closeModal(); openCart(true);
  });

  /* ============================ HALO FORGE =========================== */
  const fState = { sil:"tee", cw:"trinity", face:"back", size:null };
  const el = {
    stage:$("#forgeStage"), img:$("#forgeImg"), ring:$("#haloRing"), badge:$("#forgeBadge"),
    name:$("#forgeName"), price:$("#forgePrice"), sil:$("#forgeSil"), cw:$("#forgeCw"),
    size:$("#forgeSize"), silLabel:$("#forgeSilLabel"), cwLabel:$("#forgeCwLabel"), sizeLabel:$("#forgeSizeLabel")
  };
  function comboKey(){ return `${fState.sil}:${fState.cw}`; }
  function cwAvailable(sil,cw){ return !!FORGE.combos[`${sil}:${cw}`]; }

  function renderForgeOptions(){
    el.sil.innerHTML = FORGE.silhouettes.map(s=>`<button class="opt ${s.id===fState.sil?"active":""}" data-sil="${s.id}" data-cursor="forge">${s.label}</button>`).join("");
    el.cw.innerHTML = FORGE.colorways.map(c=>{
      const locked = !cwAvailable(fState.sil, c.id);
      return `<button class="cw ${c.id===fState.cw?"active":""} ${locked?"locked":""}" data-cw="${c.id}" data-cursor="forge">
        <span class="sw" style="background:${SW[c.id]}"></span><span>${c.label.split(" · ")[0]}${locked?" · locked":""}</span></button>`;
    }).join("");
    const sizes = FORGE.silhouettes.find(s=>s.id===fState.sil).sizes;
    if(!sizes.includes(fState.size)) fState.size=null;
    el.size.innerHTML = sizes.map(s=>`<button class="size ${s===fState.size?"active":""}" data-fsize="${s}" data-cursor="add">${s}</button>`).join("");
  }
  function updateForge(animate){
    // ensure colorway valid for silhouette
    if(!cwAvailable(fState.sil, fState.cw)){
      const firstCw = FORGE.colorways.find(c=>cwAvailable(fState.sil,c.id));
      if(firstCw) fState.cw = firstCw.id;
    }
    const combo = FORGE.combos[comboKey()];
    renderForgeOptions();
    el.name.textContent = combo.name;
    el.price.textContent = money(combo.price);
    el.badge.textContent = combo.badge;
    el.silLabel.textContent = FORGE.silhouettes.find(s=>s.id===fState.sil).label;
    el.cwLabel.textContent = FORGE.colorways.find(c=>c.id===fState.cw).label;
    el.sizeLabel.textContent = fState.size || "Select";
    el.ring.style.borderColor = combo.halo;
    el.ring.style.boxShadow = `0 0 60px ${combo.halo}44`;
    el.stage.classList.add("ready");
    const src = fState.face==="front" ? combo.front : combo.back;
    if(animate!==false){
      el.img.classList.remove("show");
      setTimeout(()=>{ el.img.src=src; el.img.onload=()=>el.img.classList.add("show"); }, 180);
    } else { el.img.src=src; el.img.classList.add("show"); }
  }
  el.sil.addEventListener("click", e=>{ const b=e.target.closest("[data-sil]"); if(!b)return;
    fState.sil=b.dataset.sil; updateForge(); });
  el.cw.addEventListener("click", e=>{ const b=e.target.closest("[data-cw]"); if(!b)return;
    if(b.classList.contains("locked")){ toast("That halo isn't forged for this silhouette"); shake(b); return; }
    fState.cw=b.dataset.cw; updateForge(); });
  el.size.addEventListener("click", e=>{ const b=e.target.closest("[data-fsize]"); if(!b)return;
    fState.size=b.dataset.fsize; el.sizeLabel.textContent=fState.size;
    $$("#forgeSize .size").forEach(s=>s.classList.toggle("active", s===b)); });
  $$("#forge .forge-flip button").forEach(b=>b.addEventListener("click", ()=>{
    fState.face=b.dataset.face; $$("#forge .forge-flip button").forEach(x=>x.classList.toggle("active",x===b));
    updateForge();
  }));
  $("#forgeAdd").addEventListener("click", ()=>{
    const combo = FORGE.combos[comboKey()];
    if(!fState.size){ toast("Choose a size to consecrate"); shake(el.size); return; }
    add({ id:combo.id, name:combo.name, price:combo.price, size:fState.size,
      cw:fState.cw, cwLabel:FORGE.colorways.find(c=>c.id===fState.cw).label.split(" · ")[0], img:combo.back });
    toast(`${combo.name} — consecrated ✦`); openCart(true);
  });

  /* ============================== TOAST ============================== */
  const toastBox=$("#toasts");
  function toast(msg){
    const t=document.createElement("div"); t.className="toast";
    t.innerHTML=`<img src="assets/mark.png" alt="">${msg}`; toastBox.appendChild(t);
    requestAnimationFrame(()=>t.classList.add("show"));
    setTimeout(()=>{ t.classList.remove("show"); setTimeout(()=>t.remove(),500); }, 2600);
  }
  function shake(node){ node.animate(
    [{transform:"translateX(0)"},{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"translateX(0)"}],
    {duration:300}); }

  /* ============================ JOIN FORM ============================ */
  const jf=$("#joinForm"), je=$("#joinEmail"), jn=$("#joinNote");
  je.addEventListener("focus", ()=>jf.classList.add("focus"));
  je.addEventListener("blur", ()=>{ if(!je.value) jf.classList.remove("focus"); });
  jf.addEventListener("submit", e=>{ e.preventDefault();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(je.value)){ jn.textContent="Enter a true email to ascend."; jn.classList.remove("ok"); shake(jf); return; }
    jn.textContent="✦ Welcome to the congregation. Check your inbox."; jn.classList.add("ok");
    je.value=""; toast("You have ascended ✦");
  });

  /* ========================= ASCEND EASTER EGG ======================= */
  let buf="";
  addEventListener("keydown", e=>{
    if(e.key.length!==1) return;
    buf=(buf+e.key).toLowerCase().slice(-6);
    if(buf.includes("ascend")) ascend();
  });
  function ascend(){
    buf="";
    const f=$("#ascendFlash"); if(f.classList.contains("go")) return;
    // halo burst
    const c=12;
    for(let i=0;i<c;i++){
      const h=document.createElement("div"); h.className="halo-burst";
      f.appendChild(h);
      const ang=(i/c)*Math.PI*2, dist=180+Math.random()*120;
      h.animate([
        {transform:"translate(0,0) scale(1)",opacity:1,offset:0},
        {transform:`translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist}px) scale(${2+Math.random()*3})`,opacity:0}
      ],{duration:1600,easing:"cubic-bezier(.2,.7,.2,1)",delay:300});
      setTimeout(()=>h.remove(),2200);
    }
    f.classList.add("go");
    toast("YOU HAVE ASCENDED ✦ use code RISEN for 15% off");
    setTimeout(()=>f.classList.remove("go"),2400);
  }

  /* ============================== INIT =============================== */
  renderCart(); updateForge(false);
  // expose hooks for the 3D atelier module
  window.Ascension = {
    add, openCart: ()=>openCart(true), toast,
    openModal: id => openModal(id)
  };
  // keyboard: Esc closes overlays
  addEventListener("keydown", e=>{ if(e.key==="Escape"){ closeModal(); openCart(false); toggleMenu(false); } });
  // smooth-scroll offset handled by CSS scroll-behavior; close menu already wired
})();
