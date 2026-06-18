/*
 * Sur-Ron LBX Builder — parts catalog
 * --------------------------------------------------------------------------
 * NOTE ON DATA SOURCE
 * The original request was to pull parts live from a Sur-Ron parts retailer.
 * The build/runtime environment here is network-restricted (outbound egress is
 * allow-listed), so live scraping is not possible from inside the sandbox.
 *
 * This file is therefore a CURATED catalog: real part categories and real
 * aftermarket brands/stores, with *estimated* USD prices. Every option links
 * out to a real Sur-Ron retailer. Prices are estimates — always confirm on the
 * store page before buying.
 *
 * To go live later: replace `PARTS` below with data produced by a scraper or a
 * store API (e.g. Shopify `/collections/<x>/products.json`). The app only needs
 * each option to provide: id, name, price, brand, store, url, and a `style`
 * object describing how it paints the SVG model.
 * --------------------------------------------------------------------------
 */

// Base donor bike. The total build price = base + every selected upgrade.
const BASE_BIKE = {
  name: "Sur-Ron Light Bee X (LBX)",
  price: 5400, // estimated MSRP, USD
  note: "Estimated MSRP of the donor bike. Build total = bike + selected upgrades."
};

// Stores referenced (real Sur-Ron retailers).
const STORES = {
  gritshift:   "GritShift",
  revrides:    "REV Rides",
  evfreaks:    "EVFREAKS",
  tbmoto:      "TB Electric Moto",
  luna:        "Luna Cycle"
};

/*
 * Each category targets one or more SVG element ids in the bike model.
 * Each option carries:
 *   id, name, brand, store, price (added cost vs stock), url (real store link)
 *   style: attributes painted onto the target svg elements (fill/stroke/etc.)
 *   swatch: small colour shown in the option card
 * The first option of every category is the $0 "Stock" part.
 */
const PARTS = [
  {
    id: "grips",
    name: "Grips",
    blurb: "Handlebar grips — comfort and control.",
    targets: ["grip-l", "grip-r"],
    options: [
      { id: "grip-stock", name: "Stock Grips", brand: "OEM", store: "tbmoto", price: 0,
        url: "https://tbelectricmoto.com/collections/surron-lightbee-x-parts",
        style: { fill: "#23262e" }, swatch: "#23262e" },
      { id: "grip-odi-red", name: "ODI Lock-On Grips — Red", brand: "ODI", store: "revrides", price: 28,
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { fill: "#d23b2f" }, swatch: "#d23b2f" },
      { id: "grip-odi-blue", name: "ODI Lock-On Grips — Blue", brand: "ODI", store: "revrides", price: 28,
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { fill: "#2f6fd2" }, swatch: "#2f6fd2" },
      { id: "grip-foam", name: "Pro Taper Foam Grips — Grey", brand: "Pro Taper", store: "tbmoto", price: 19,
        url: "https://tbelectricmoto.com/collections/surron-lightbee-x-parts",
        style: { fill: "#8b8f98" }, swatch: "#8b8f98" }
    ]
  },
  {
    id: "seat",
    name: "Seat",
    blurb: "Seat cover / foam — taller seats add range of motion.",
    targets: ["seat"],
    options: [
      { id: "seat-stock", name: "Stock Seat", brand: "OEM", store: "gritshift", price: 0,
        url: "https://gritshift.com/collections/sur-ron",
        style: { fill: "#15171c" }, swatch: "#15171c" },
      { id: "seat-tall", name: "Tall Comfort Seat — Black", brand: "GritShift", store: "gritshift", price: 145,
        url: "https://gritshift.com/collections/sur-ron",
        style: { fill: "#0c0d11" }, swatch: "#0c0d11" },
      { id: "seat-red", name: "Gripper Seat Cover — Red Stitch", brand: "EVFREAKS", store: "evfreaks", price: 64,
        url: "https://evfreaks.uk/collections/sur-ron-parts-upgrades",
        style: { fill: "#2a1416", stroke: "#d23b2f", "stroke-width": "2" }, swatch: "#d23b2f" },
      { id: "seat-tan", name: "Vintage Tan Seat", brand: "REV Rides", store: "revrides", price: 129,
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { fill: "#b88a52" }, swatch: "#b88a52" }
    ]
  },
  {
    id: "tires",
    name: "Tires",
    blurb: "Front + rear tires. Knobby for dirt, street for pavement.",
    targets: ["tire-front", "tire-rear"],
    options: [
      { id: "tire-stock", name: "Stock CST Knobby", brand: "CST", store: "tbmoto", price: 0,
        url: "https://tbelectricmoto.com/collections/surron-lightbee-x-parts",
        style: { fill: "#15171c" }, swatch: "#15171c" },
      { id: "tire-mxk", name: "Kenda MX K270 Knobby Set", brand: "Kenda", store: "tbmoto", price: 96,
        url: "https://tbelectricmoto.com/collections/surron-lightbee-x-parts",
        style: { fill: "#101216" }, swatch: "#101216" },
      { id: "tire-street", name: "Shinko 244 Street/Trail Set", brand: "Shinko", store: "revrides", price: 110,
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { fill: "#1c1f26" }, swatch: "#1c1f26" }
    ]
  },
  {
    id: "wheels",
    name: "Wheels / Rims",
    blurb: "Rim colour & build.",
    targets: ["rim-front", "rim-rear"],
    options: [
      { id: "rim-stock", name: "Stock Black Rims", brand: "OEM", store: "gritshift", price: 0,
        url: "https://gritshift.com/collections/sur-ron",
        style: { fill: "#2a2e38" }, swatch: "#2a2e38" },
      { id: "rim-silver", name: "Warp 9 Silver Rims", brand: "Warp 9", store: "revrides", price: 420,
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { fill: "#c9cdd4" }, swatch: "#c9cdd4" },
      { id: "rim-red", name: "Warp 9 Anodized Red Rims", brand: "Warp 9", store: "revrides", price: 460,
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { fill: "#c23a2f" }, swatch: "#c23a2f" },
      { id: "rim-gold", name: "Excel Gold Rims", brand: "Excel", store: "evfreaks", price: 520,
        url: "https://evfreaks.uk/collections/sur-ron-parts-upgrades",
        style: { fill: "#c9a13b" }, swatch: "#c9a13b" }
    ]
  },
  {
    id: "fork",
    name: "Front Fork / Suspension",
    blurb: "Upgraded forks improve handling and travel.",
    targets: ["fork-l", "fork-r"],
    options: [
      { id: "fork-stock", name: "Stock DNM Fork", brand: "DNM", store: "luna", price: 0,
        url: "https://lunacycle.com/sur-ron-parts/",
        style: { fill: "#3a3f49" }, swatch: "#3a3f49" },
      { id: "fork-gold", name: "DNM USD-8 Gold Fork", brand: "DNM", store: "luna", price: 340,
        url: "https://lunacycle.com/sur-ron-parts/",
        style: { fill: "#caa23a" }, swatch: "#caa23a" },
      { id: "fork-ext", name: "EXT Era Coil Fork", brand: "EXT", store: "revrides", price: 1290,
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { fill: "#d6dade" }, swatch: "#d6dade" }
    ]
  },
  {
    id: "bars",
    name: "Handlebars",
    blurb: "Bar bend & material.",
    targets: ["handlebar"],
    options: [
      { id: "bar-stock", name: "Stock Bars", brand: "OEM", store: "tbmoto", price: 0,
        url: "https://tbelectricmoto.com/collections/surron-lightbee-x-parts",
        style: { stroke: "#2a2e38" }, swatch: "#2a2e38" },
      { id: "bar-fat", name: "Pro Taper Fat Bars — Black", brand: "Pro Taper", store: "tbmoto", price: 95,
        url: "https://tbelectricmoto.com/collections/surron-lightbee-x-parts",
        style: { stroke: "#0d0e12" }, swatch: "#0d0e12" },
      { id: "bar-red", name: "Renthal Fatbar — Red", brand: "Renthal", store: "revrides", price: 110,
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { stroke: "#d23b2f" }, swatch: "#d23b2f" }
    ]
  },
  {
    id: "motor",
    name: "Motor",
    blurb: "Mid-drive motor. More copper = more power & heat capacity.",
    targets: ["motor"],
    options: [
      { id: "motor-stock", name: "Stock 6kW Motor", brand: "Sur-Ron", store: "luna", price: 0, spec: "6 kW peak",
        url: "https://lunacycle.com/sur-ron-parts/",
        style: { fill: "#2c303a" }, swatch: "#2c303a" },
      { id: "motor-mxc", name: "EBMX MaXcooler Motor", brand: "EBMX", store: "revrides", price: 1150, spec: "~12 kW peak",
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { fill: "#5a6070" }, swatch: "#5a6070" },
      { id: "motor-foc", name: "Lightning Rods Hi-Torque Motor", brand: "Lightning Rods", store: "revrides", price: 1450, spec: "high torque",
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { fill: "#7a818f" }, swatch: "#7a818f" }
    ]
  },
  {
    id: "controller",
    name: "Controller",
    blurb: "Brain of the bike. Higher amps = more power.",
    targets: ["controller"],
    options: [
      { id: "ctrl-stock", name: "Stock Controller", brand: "Sur-Ron", store: "luna", price: 0, spec: "~50A",
        url: "https://lunacycle.com/sur-ron-parts/",
        style: { fill: "#23262e" }, swatch: "#23262e" },
      { id: "ctrl-asi", name: "ASI BAC2000 Controller", brand: "ASI", store: "revrides", price: 520, spec: "up to 400A",
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { fill: "#2f6fd2" }, swatch: "#2f6fd2" },
      { id: "ctrl-ebmx", name: "EBMX X-1F Controller", brand: "EBMX", store: "revrides", price: 690, spec: "plug-and-play",
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { fill: "#22a06b" }, swatch: "#22a06b" }
    ]
  },
  {
    id: "sprocket",
    name: "Rear Sprocket",
    blurb: "Gearing. Bigger = more torque, lower top speed.",
    targets: ["sprocket"],
    options: [
      { id: "spr-stock", name: "Stock 48T Sprocket", brand: "OEM", store: "gritshift", price: 0,
        url: "https://gritshift.com/collections/sur-ron",
        style: { fill: "#3a3f49" }, swatch: "#3a3f49" },
      { id: "spr-red", name: "GritShift 52T — Red", brand: "GritShift", store: "gritshift", price: 65,
        url: "https://gritshift.com/collections/sur-ron",
        style: { fill: "#d23b2f" }, swatch: "#d23b2f" },
      { id: "spr-gold", name: "GritShift 56T — Gold", brand: "GritShift", store: "gritshift", price: 72,
        url: "https://gritshift.com/collections/sur-ron",
        style: { fill: "#caa23a" }, swatch: "#caa23a" }
    ]
  },
  {
    id: "plastics",
    name: "Plastics / Fenders",
    blurb: "Body panels and fenders — set the colour scheme.",
    targets: ["fender-front", "fender-rear", "panel"],
    options: [
      { id: "plast-stock", name: "Stock Black Plastics", brand: "OEM", store: "gritshift", price: 0,
        url: "https://gritshift.com/collections/sur-ron",
        style: { fill: "#1b1e24" }, swatch: "#1b1e24" },
      { id: "plast-red", name: "Race Red Plastics Kit", brand: "EVFREAKS", store: "evfreaks", price: 175,
        url: "https://evfreaks.uk/collections/sur-ron-parts-upgrades",
        style: { fill: "#c2362c" }, swatch: "#c2362c" },
      { id: "plast-blue", name: "Cobalt Blue Plastics Kit", brand: "EVFREAKS", store: "evfreaks", price: 175,
        url: "https://evfreaks.uk/collections/sur-ron-parts-upgrades",
        style: { fill: "#2f5fd2" }, swatch: "#2f5fd2" },
      { id: "plast-white", name: "Arctic White Plastics Kit", brand: "REV Rides", store: "revrides", price: 165,
        url: "https://revrides.com/collections/surron-parts-accessories",
        style: { fill: "#e7e9ec" }, swatch: "#e7e9ec" }
    ]
  },
  {
    id: "pegs",
    name: "Foot Pegs",
    blurb: "Wide pegs = better grip standing up.",
    targets: ["peg"],
    options: [
      { id: "peg-stock", name: "Stock Pegs", brand: "OEM", store: "tbmoto", price: 0,
        url: "https://tbelectricmoto.com/collections/surron-lightbee-x-parts",
        style: { fill: "#3a3f49" }, swatch: "#3a3f49" },
      { id: "peg-wide", name: "IMS Wide Foot Pegs", brand: "IMS", store: "tbmoto", price: 89,
        url: "https://tbelectricmoto.com/collections/surron-lightbee-x-parts",
        style: { fill: "#b9bdc4" }, swatch: "#b9bdc4" },
      { id: "peg-ti", name: "Ti Titanium Pegs — Bronze", brand: "GritShift", store: "gritshift", price: 130,
        url: "https://gritshift.com/collections/sur-ron",
        style: { fill: "#9a6b3a" }, swatch: "#9a6b3a" }
    ]
  },
  {
    id: "frame",
    name: "Frame Colour",
    blurb: "Powder-coat / wrap the main frame & battery box.",
    targets: ["frame-box", "frame-tube", "swingarm"],
    options: [
      { id: "frame-stock", name: "Raw Black Frame", brand: "OEM", store: "gritshift", price: 0,
        url: "https://gritshift.com/collections/sur-ron",
        style: { fill: "#23262e" }, swatch: "#23262e" },
      { id: "frame-grey", name: "Gunmetal Powder Coat", brand: "GritShift", store: "gritshift", price: 240,
        url: "https://gritshift.com/collections/sur-ron",
        style: { fill: "#4a4f59" }, swatch: "#4a4f59" },
      { id: "frame-red", name: "Candy Red Powder Coat", brand: "EVFREAKS", store: "evfreaks", price: 260,
        url: "https://evfreaks.uk/collections/sur-ron-parts-upgrades",
        style: { fill: "#8e1f1a" }, swatch: "#8e1f1a" }
    ]
  }
];

// Expose for the app (also works if loaded as a module later).
window.SURRON = { BASE_BIKE, STORES, PARTS };
