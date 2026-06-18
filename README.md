# Sur-Ron LBX Builder

An interactive **Sur-Ron Light Bee X (LBX) builder**. Pick parts from a catalog,
watch them apply to a model of the bike, see a running **estimated build price**,
and get a **direct link to every part** on a real Sur-Ron retailer.

## What it does

- **Pick parts by category** — grips, seat, tires, wheels/rims, fork, handlebars,
  motor, controller, sprocket, plastics/fenders, foot pegs, frame colour.
- **Click a part on the bike** — numbered hotspots on the model open that part's
  catalog. Choosing an option instantly repaints that part on the bike.
- **Live price** — the build total = donor bike + every selected upgrade.
- **Buy links** — every option links out to a real Sur-Ron store
  (GritShift, REV Rides, EVFREAKS, TB Electric Moto, Luna Cycle). The
  "View parts list & links" button gives a full shopping sheet.

## Run it

It's a static site — no build step. Just open `index.html`:

```bash
# any static server works, e.g.
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page + inline SVG model of the LBX (each part is an id'd element) |
| `css/styles.css` | Styling |
| `js/catalog.js` | **The parts data** — categories, options, prices, store links, and how each paints the SVG |
| `js/app.js` | App logic — chips, hotspots, catalog modal, pricing, cart sheet |

## About the parts data (important)

The original ask was to pull parts **live** from a Sur-Ron parts retailer. The
environment this was built in is network-restricted (outbound egress is
allow-listed), so live scraping isn't possible here, and the retailers tested
block automated requests anyway.

So `js/catalog.js` is a **curated catalog**: real part categories and real
aftermarket brands/retailers, with **estimated USD prices**. Every option links
to a real store. Treat prices as estimates and confirm on the store page.

### Going live later

The app only needs each option to provide `id, name, price, brand, store, url`
and a `style` object (how it paints the SVG). To use real data, replace the
`PARTS` array in `catalog.js` with output from a scraper or store API — most of
these shops run Shopify, which exposes `/collections/<handle>/products.json`.
Map each product's price/handle into an option and you're done; no other code
changes are required.

## Stores referenced

- [GritShift](https://gritshift.com/collections/sur-ron)
- [REV Rides](https://revrides.com/collections/surron-parts-accessories)
- [EVFREAKS](https://evfreaks.uk/collections/sur-ron-parts-upgrades)
- [TB Electric Moto](https://tbelectricmoto.com/collections/surron-lightbee-x-parts)
- [Luna Cycle](https://lunacycle.com/sur-ron-parts/)
