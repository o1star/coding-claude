# ASCENSION — gothic luxury streetwear site

An Amiri / Chrome Hearts–inspired brand site for **ASCENSION**. Blackletter type,
halos, washed-black palette, film grain, and a set of genuinely unique interactions.

Built from the brand's own logo + product mockups (sliced into front/back images).

**Live:** published as a hosted artifact (private to the owner) — shareable from its Share menu.

## Open it

Two ways:

- **Single file (easiest):** open `../ascension-website.html` — everything (CSS, JS,
  images) is embedded, so just double-click it. No server, no internet needed
  (fonts load from Google when online; they fall back gracefully offline).
- **Dev version:** serve this folder and open `index.html`:
  ```bash
  python3 -m http.server 8000   # then visit http://localhost:8000
  ```

## Features / "cool functions"

| Feature | What it does |
|---|---|
| **The Atelier — 3D viewer** | A real WebGL (three.js) garment you can **drag to spin 360°**. Front/back textures on a curved cloth mesh, a floating emissive **halo** with real lights + glow, brand rim-lights (red/royal), soft studio environment, auto-rotate, and a silhouette switcher. Vendored locally in `js/vendor/` (no CDN needed). |
| **Custom halo cursor** | Difference-blend ring + dot that eases behind the pointer, grows on hover, shows context labels (VIEW / ADD / BAG…). Magnetic buttons pull toward it. Auto-disabled on touch. |
| **Preloader** | Breathing halo mark + 0→100% "ASCENDING" counter, then reveals the hero with a text-scramble. |
| **Scramble text** | Headings decode from gothic glyphs when they enter the viewport. |
| **Product hover flip** | Each product card swaps front → back image on hover. |
| **Quick View modal** | Front/back toggle, size select, add to bag. |
| **HALO FORGE configurator** | Pick silhouette + colorway + size → live preview image, halo-ring tint, name & price update in real time. Impossible combos show as **LOCKED**. |
| **Cart drawer** | Slide-in bag with qty steppers, remove, subtotal, live free-shipping progress, persisted in `localStorage`. |
| **Toasts** | Branded confirmations ("— consecrated ✦"). |
| **Reveal + parallax** | Scroll-reveal everywhere; pointer/scroll parallax on the hero. |
| **Fullscreen gothic menu** | Clip-path reveal with staggered blackletter links. |
| **Newsletter** | Animated underline field + email validation. |
| **Easter egg** | Type **`ASCEND`** anywhere → halo burst + a hidden discount code. |

## Structure

```
ascension/
├── index.html         # markup + inline SVG grain
├── css/style.css      # all styling / design system
├── js/main.js         # cursor, cart, forge, modal, scramble, reveals, easter egg
└── assets/            # logo mark + product front/back slices
```

## Make it real

- **Products / prices / copy** live in the `PRODUCTS` and `FORGE` objects at the top of
  `js/main.js` — edit there.
- **Checkout** is a demo (shows a toast). Wire the cart to Shopify / Stripe when ready;
  the cart state is already structured (`id, name, price, size, colorway, qty`).
- Swap in real photography by replacing the files in `assets/` (keep the same names).
