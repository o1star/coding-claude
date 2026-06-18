/* Sur-Ron LBX Builder — app logic */
(function () {
  "use strict";

  const { BASE_BIKE, STORES, PARTS } = window.SURRON;

  // Where each category's hotspot dot sits on the bike (SVG viewBox units: 960x540).
  const HOTSPOTS = {
    grips:      { x: 578, y: 150 },
    bars:       { x: 632, y: 150 },
    seat:       { x: 446, y: 176 },
    controller: { x: 489, y: 198 },
    frame:      { x: 470, y: 332 },
    plastics:   { x: 430, y: 288 },
    motor:      { x: 432, y: 352 },
    pegs:       { x: 407, y: 398 },
    sprocket:   { x: 304, y: 360 },
    wheels:     { x: 270, y: 470 },
    tires:      { x: 730, y: 478 },
    fork:       { x: 700, y: 260 }
  };

  // selection state: categoryId -> optionId (defaults to first/stock option)
  const state = {};
  PARTS.forEach((cat) => { state[cat.id] = cat.options[0].id; });

  const $ = (sel) => document.querySelector(sel);
  const svg = $("#bike");

  const fmt = (n) => "$" + Math.round(n).toLocaleString("en-US");

  function getOption(cat, optId) {
    return cat.options.find((o) => o.id === optId) || cat.options[0];
  }
  function findCat(catId) { return PARTS.find((c) => c.id === catId); }

  /* ---------- paint the SVG ---------- */
  function applyStyle(cat, opt) {
    cat.targets.forEach((targetId) => {
      const el = svg.getElementById(targetId);
      if (!el) return;
      // clear optional attrs that a previous option may have set
      ["stroke", "stroke-width"].forEach((attr) => {
        if (!(attr in opt.style)) el.removeAttribute(attr);
      });
      Object.entries(opt.style).forEach(([k, v]) => el.setAttribute(k, v));
    });
  }

  /* ---------- pricing ---------- */
  function totals() {
    let upgrades = 0;
    PARTS.forEach((cat) => { upgrades += getOption(cat, state[cat.id]).price; });
    return { base: BASE_BIKE.price, upgrades, total: BASE_BIKE.price + upgrades };
  }

  function refreshTotals() {
    const t = totals();
    $("#totalPrice").textContent = fmt(t.total);
    $("#sumBase").textContent = fmt(t.base);
    $("#sumUpgrades").textContent = fmt(t.upgrades);
    $("#sumTotal").textContent = fmt(t.total);
  }

  /* ---------- category chips ---------- */
  function buildChips() {
    const list = $("#categoryList");
    list.innerHTML = "";
    PARTS.forEach((cat) => {
      const opt = getOption(cat, state[cat.id]);
      const isStock = opt.price === 0;
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.type = "button";
      chip.dataset.cat = cat.id;
      chip.innerHTML = `
        <span class="chip-swatch" style="background:${opt.swatch}"></span>
        <span class="chip-main">
          <span class="chip-cat">${cat.name}</span><br>
          <span class="chip-sel">${opt.name}</span>
        </span>
        <span class="chip-price ${isStock ? "stock" : ""}">${isStock ? "Stock" : "+" + fmt(opt.price)}</span>`;
      chip.addEventListener("click", () => openCatalog(cat.id));
      list.appendChild(chip);
    });
  }

  /* ---------- hotspots on the bike ---------- */
  function buildHotspots() {
    const wrap = $("#hotspots");
    wrap.innerHTML = "";
    PARTS.forEach((cat, i) => {
      const pos = HOTSPOTS[cat.id];
      if (!pos) return;
      const dot = document.createElement("button");
      dot.className = "hotspot";
      dot.type = "button";
      dot.style.left = (pos.x / 960) * 100 + "%";
      dot.style.top = (pos.y / 540) * 100 + "%";
      dot.title = cat.name;
      dot.textContent = i + 1;
      dot.dataset.cat = cat.id;
      dot.addEventListener("click", () => openCatalog(cat.id));
      wrap.appendChild(dot);
    });
    markChangedHotspots();
  }

  function markChangedHotspots() {
    document.querySelectorAll(".hotspot").forEach((dot) => {
      const cat = findCat(dot.dataset.cat);
      const changed = getOption(cat, state[cat.id]).price > 0;
      dot.classList.toggle("changed", changed);
    });
  }

  /* ---------- catalog modal ---------- */
  function openCatalog(catId) {
    const cat = findCat(catId);
    $("#modalTitle").textContent = cat.name;
    $("#modalBlurb").textContent = cat.blurb || "";
    const grid = $("#optionGrid");
    grid.innerHTML = "";

    cat.options.forEach((opt) => {
      const isStock = opt.price === 0;
      const selected = state[catId] === opt.id;
      const card = document.createElement("div");
      card.className = "option" + (selected ? " selected" : "");
      card.innerHTML = `
        <div class="option-top">
          <span class="option-swatch" style="background:${opt.swatch}"></span>
          <div>
            <div class="option-name">${opt.name}</div>
            <div class="option-brand">${opt.brand} · <span class="option-store">${STORES[opt.store] || opt.store}</span></div>
          </div>
        </div>
        <div class="option-meta">
          <span class="option-price ${isStock ? "stock" : ""}">${isStock ? "Included" : "+" + fmt(opt.price)}</span>
          ${opt.spec ? `<span class="option-spec">${opt.spec}</span>` : ""}
        </div>
        <a class="option-link" href="${opt.url}" target="_blank" rel="noopener">View on ${STORES[opt.store] || opt.store} ↗</a>`;

      // selecting (but not when clicking the link)
      card.addEventListener("click", (e) => {
        if (e.target.closest(".option-link")) return;
        selectOption(catId, opt.id);
        // refresh selected styling within the open modal
        grid.querySelectorAll(".option").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
      });
      grid.appendChild(card);
    });

    showModal("#catalogModal");
  }

  function selectOption(catId, optId) {
    state[catId] = optId;
    const cat = findCat(catId);
    applyStyle(cat, getOption(cat, optId));
    buildChips();
    refreshTotals();
    markChangedHotspots();
  }

  /* ---------- cart / build sheet ---------- */
  function openCart() {
    const list = $("#cartList");
    list.innerHTML = "";

    // base bike row
    const baseRow = document.createElement("div");
    baseRow.className = "cart-item";
    baseRow.innerHTML = `
      <div><div class="ci-name">${BASE_BIKE.name}</div><div class="ci-sub">Donor bike (estimated MSRP)</div></div>
      <a class="ci-link" href="https://lunacycle.com/sur-ron-parts/" target="_blank" rel="noopener">Shop ↗</a>
      <div class="ci-price">${fmt(BASE_BIKE.price)}</div>`;
    list.appendChild(baseRow);

    PARTS.forEach((cat) => {
      const opt = getOption(cat, state[cat.id]);
      const isStock = opt.price === 0;
      const row = document.createElement("div");
      row.className = "cart-item" + (isStock ? " stock" : "");
      row.innerHTML = `
        <div>
          <div class="ci-name">${cat.name}: ${opt.name}</div>
          <div class="ci-sub">${opt.brand} · ${STORES[opt.store] || opt.store}</div>
        </div>
        <a class="ci-link" href="${opt.url}" target="_blank" rel="noopener">View ↗</a>
        <div class="ci-price">${isStock ? "Stock" : "+" + fmt(opt.price)}</div>`;
      list.appendChild(row);
    });

    $("#cartTotal").textContent = fmt(totals().total);
    showModal("#cartModal");
  }

  /* ---------- modal helpers ---------- */
  function showModal(sel) { $(sel).hidden = false; }
  function hideModal(sel) { $(sel).hidden = true; }

  /* ---------- reset ---------- */
  function resetAll() {
    PARTS.forEach((cat) => {
      state[cat.id] = cat.options[0].id;
      applyStyle(cat, cat.options[0]);
    });
    buildChips();
    refreshTotals();
    markChangedHotspots();
  }

  /* ---------- init ---------- */
  function init() {
    $("#baseName").textContent = BASE_BIKE.name;
    $("#basePrice").textContent = fmt(BASE_BIKE.price);

    // paint stock parts onto the model
    PARTS.forEach((cat) => applyStyle(cat, cat.options[0]));

    buildChips();
    buildHotspots();
    refreshTotals();

    $("#resetBtn").addEventListener("click", resetAll);
    $("#cartBtn").addEventListener("click", openCart);
    $("#closeModal").addEventListener("click", () => hideModal("#catalogModal"));
    $("#closeCart").addEventListener("click", () => hideModal("#cartModal"));

    // click backdrop to close
    document.querySelectorAll(".modal").forEach((m) => {
      m.addEventListener("click", (e) => { if (e.target === m) m.hidden = true; });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") document.querySelectorAll(".modal").forEach((m) => (m.hidden = true));
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
