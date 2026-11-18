// The Cake Lady: the cake planner (the message piped on a drawn cake, the date check against her lead times and closed days, the WhatsApp brief),
// section reveals, the drifting strip of cakes and the footer name built from blocks.
document.documentElement.classList.add("js");

const WA = "16492311898";
// Every character is percent-encoded, ! ' ( ) * included, so no app cuts the message short.
const encode = s => encodeURIComponent(s).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
const waLink = text => `https://wa.me/${WA}?text=${encode(text)}`;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const tidy = s => String(s || "").replace(/\s+/g, " ").trim();
const SVG = "http://www.w3.org/2000/svg";

/* ---------- The cake: smooth fondant on a silver board, drawn so the icing can change colour ---------- */

// Each icing has the tones that shade the cake (light, base, shade, deep) and a colour for the writing.
const SCHEMES = {
  white: { name: "White", light: "#fffefa", base: "#f5f0e4", shade: "#e2d9c6", deep: "#cbbfa7", pipe: "#0e6e73" },
  blue: { name: "Shades of blue", light: "#eef5fb", base: "#c9dded", shade: "#a7c3da", deep: "#8eaecb", pipe: "#1f3a6b" },
  blush: { name: "Blush", light: "#fdf0f2", base: "#f3d2d7", shade: "#e2b3bb", deep: "#cf9aa4", pipe: "#a3213a" },
  pistachio: { name: "Pistachio", light: "#f3f7e1", base: "#dbe5ad", shade: "#c2d088", deep: "#a9ba6c", pipe: "#b23d5c" },
  chocolate: { name: "Chocolate", light: "#9a6649", base: "#6e3f27", shade: "#57301c", deep: "#432414", pipe: "#f3d9a4" },
};

const cake = document.getElementById("cake");
// The cake (centre, radius, how deep its ellipses look, top and bottom of the side) and the board under it.
const CX = 200, RX = 128, RY = 28, TOP = 96, BOTTOM = 236, BOARD_Y = 246, BRX = 176, BRY = 44;
let msgText, msgLines, clipRect;

function el(name, attrs, parent) {
  const n = document.createElementNS(SVG, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

// A gradient across (left to right) or down; colours may be CSS variables, so they go in style.
function gradient(defs, id, across, stops) {
  const g = el("linearGradient", across ? { id } : { id, x2: 0, y2: 1 }, defs);
  for (const [offset, colour, alpha] of stops) {
    el("stop", { offset, style: `stop-color: ${colour}` + (alpha === undefined ? "" : `; stop-opacity: ${alpha}`) }, g);
  }
}

// The front half of an ellipse as deep as the cake's, left to right, with its lowest point at y:
// the curve that a line of writing follows around the side.
const frontArc = (y, rx = RX) => `M${CX - rx},${y - RY} A${rx},${RY} 0 0 0 ${CX + rx},${y - RY}`;

function drawCake() {
  if (!cake) return;
  cake.replaceChildren();
  const defs = el("defs", {}, cake);
  const soft = el("filter", { id: "ck-soft", x: "-20%", y: "-60%", width: "140%", height: "220%" }, defs);
  el("feGaussianBlur", { stdDeviation: 5 }, soft);
  // Light from the upper left: the side is shaded like a cylinder, the top is brightest
  gradient(defs, "ck-side", true, [[0, "var(--ck-deep)"], [.16, "var(--ck-shade)"], [.42, "var(--ck-light)"], [.66, "var(--ck-base)"], [.9, "var(--ck-shade)"], [1, "var(--ck-deep)"]]);
  gradient(defs, "ck-fade", false, [[0, "#fff", .45], [.14, "#fff", 0], [.8, "#000", 0], [1, "#000", .16]]);
  gradient(defs, "ck-top", true, [[0, "var(--ck-light)"], [.6, "var(--ck-light)"], [1, "var(--ck-base)"]]);
  gradient(defs, "ck-board", true, [[0, "#a3abb3"], [.2, "#eef1f4"], [.4, "#c2c8ce"], [.62, "#f7f9fb"], [.84, "#c6ccd2"], [1, "#98a0a8"]]);
  msgLines = [0, 1, 2].map(i => el("path", { id: `ck-line-${i}`, fill: "none" }, defs));
  const clip = el("clipPath", { id: "pipe-clip" }, defs);
  clipRect = el("rect", { x: CX - RX - 12, y: TOP, width: 0, height: BOTTOM - TOP + RY + 12 }, clip);

  // The silver board on the table: its shadow, its edge, the foil
  el("ellipse", { cx: CX, cy: BOARD_Y + 20, rx: BRX + 6, ry: BRY * .75, fill: "#000", opacity: .22, filter: "url(#ck-soft)" }, cake);
  el("ellipse", { cx: CX, cy: BOARD_Y + 7, rx: BRX, ry: BRY, fill: "#8d959d" }, cake);
  el("ellipse", { cx: CX, cy: BOARD_Y, rx: BRX, ry: BRY, fill: "url(#ck-board)" }, cake);
  el("ellipse", { cx: CX, cy: BOARD_Y, rx: BRX - 9, ry: BRY - 6, fill: "none", stroke: "#fff", "stroke-opacity": .5, "stroke-width": 1.4 }, cake);
  // The cake's shadow on the board
  el("ellipse", { cx: CX + 8, cy: BOTTOM + 8, rx: RX + 10, ry: RY + 7, fill: "#000", opacity: .28, filter: "url(#ck-soft)" }, cake);
  // The side, then the light on its upper part and the shade at its foot
  const side = `M${CX - RX},${TOP} L${CX - RX},${BOTTOM} A${RX},${RY} 0 0 0 ${CX + RX},${BOTTOM} L${CX + RX},${TOP} Z`;
  el("path", { d: side, fill: "url(#ck-side)" }, cake);
  el("path", { d: side, fill: "url(#ck-fade)" }, cake);
  // The top, and its soft fondant edge catching the light
  el("ellipse", { cx: CX, cy: TOP, rx: RX, ry: RY, fill: "url(#ck-top)" }, cake);
  el("path", { d: frontArc(TOP + RY, RX - 2), fill: "none", style: "stroke: var(--ck-light)", "stroke-width": 5, "stroke-linecap": "round" }, cake);

  // The writing, on the front of the side, following its curve
  const writing = el("g", { "clip-path": "url(#pipe-clip)" }, cake);
  msgText = el("text", {
    "font-family": "Satisfy, cursive", "font-size": 44, "text-anchor": "middle",
    style: "fill: var(--ck-pipe); stroke: var(--ck-pipe)", "stroke-width": 1, "stroke-linejoin": "round",
  }, writing);
}

function paintCake(colour) {
  const s = SCHEMES[colour] || SCHEMES.white;
  for (const k of ["light", "base", "shade", "deep", "pipe"]) cake.style.setProperty(`--ck-${k}`, s[k]);
}

// One line across the middle of the side (smaller if it is long), or two lines split nearest the middle.
const MAX_W = 196, MID = (TOP + BOTTOM) / 2 + RY;
function line(i, text, y) {
  msgLines[i].setAttribute("d", frontArc(y));
  const t = el("textPath", { href: `#ck-line-${i}`, startOffset: "50%" }, msgText);
  t.textContent = text;
  return t;
}
function writeMessage(msg) {
  if (!msgText) return;
  msgText.replaceChildren();
  msgText.setAttribute("font-size", 44);
  const w = line(0, msg || " ", MID + 14).getComputedTextLength();
  if (w <= MAX_W) return;
  const size = Math.floor(44 * MAX_W / w);
  if (size >= 32 || !msg.includes(" ")) {
    msgText.setAttribute("font-size", Math.max(size, 16));
    return;
  }
  const spaces = [...msg.matchAll(/ /g)].map(m => m.index);
  const cut = spaces.reduce((a, c) => Math.abs(c - msg.length / 2) < Math.abs(a - msg.length / 2) ? c : a);
  msgText.replaceChildren();
  msgText.setAttribute("font-size", 38);
  const lines = [line(1, msg.slice(0, cut), MID - 6), line(2, msg.slice(cut + 1), MID + 34)];
  const widest = Math.max(...lines.map(l => l.getComputedTextLength()));
  if (widest > MAX_W) msgText.setAttribute("font-size", Math.floor(38 * MAX_W / widest));
}

// The piping: the message is revealed left to right, as a piping bag would write it.
let pipeFrame = 0;
function pipe() {
  if (!clipRect) return;
  cancelAnimationFrame(pipeFrame);
  if (reduced) { clipRect.setAttribute("width", 320); return; }
  const start = performance.now(), dur = 1300;
  const step = now => {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 2.2);
    clipRect.setAttribute("width", (320 * eased).toFixed(1));
    if (t < 1) pipeFrame = requestAnimationFrame(step);
  };
  clipRect.setAttribute("width", 0);
  pipeFrame = requestAnimationFrame(step);
}

/* ---------- The planner ---------- */

const form = document.getElementById("plan-form");
const dateInput = document.getElementById("p-date");
const guestsInput = document.getElementById("p-guests");
const msgInput = document.getElementById("p-msg");
const timeCheck = document.getElementById("time-check");
const priceNote = document.getElementById("price-note");
const pickupWhen = document.getElementById("pickup-when");
const sends = [...document.querySelectorAll(".send")];
const tagOut = id => document.getElementById(id);

const DAY = 86400000;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const parseDate = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const longDate = d => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDate = d => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

// Days Adele has closed in her calendar (fully booked or away): the first and the last day, both included.
// To close more days, add a line like ["2027-01-02", "2027-01-05"]; for a single day, write the same date twice.
const CLOSED = [
  ["2026-12-21", "2026-12-26"],
];
const closedRange = date => CLOSED.map(([a, b]) => [parseDate(a), parseDate(b)]).find(([a, b]) => date >= a && date <= b);
const dayMonth = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
const rangeText = ([a, b]) => +a === +b ? `on ${dayMonth(a)}`
  : `from ${a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear() ? a.getDate() : dayMonth(a)} to ${dayMonth(b)}`;

// The date picker. A phone's own calendar cannot cross out single days, so the script swaps the plain date field
// for a month calendar where past and closed days cannot be picked. Without the script, the plain date field stays.
let dateBtn = null;
const yearDate = d => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

function datePicker() {
  const label = form.querySelector('label[for="p-date"]');
  const row = dateInput.closest(".field-row");
  if (!label || !row) return;
  const today = startOfToday();
  const monthOf = d => new Date(d.getFullYear(), d.getMonth(), 1);
  const first = monthOf(today);
  const last = new Date(today.getFullYear(), today.getMonth() + 24, 1);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const unavailable = d => d < today ? "already passed" : closedRange(d) ? "closed" : "";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "date-btn";
  btn.id = "p-date-btn";
  btn.textContent = "Choose the date";
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "p-cal");
  label.id = "p-date-label";
  label.htmlFor = btn.id;
  btn.setAttribute("aria-labelledby", "p-date-label p-date-btn");

  const cal = document.createElement("div");
  cal.className = "cal";
  cal.id = "p-cal";
  cal.hidden = true;
  cal.setAttribute("role", "group");
  cal.setAttribute("aria-label", "Calendar");
  cal.innerHTML = `<div class="cal-head">
      <button type="button" class="cal-nav" data-dir="-1" aria-label="Previous month">‹</button>
      <p class="cal-title" aria-live="polite"></p>
      <button type="button" class="cal-nav" data-dir="1" aria-label="Next month">›</button>
    </div>
    <div class="cal-week" aria-hidden="true">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(w => `<span>${w}</span>`).join("")}</div>
    <div class="cal-days"></div>
    <p class="cal-key"></p>`;
  const title = cal.querySelector(".cal-title");
  const days = cal.querySelector(".cal-days");
  const key = cal.querySelector(".cal-key");
  const [prev, next] = cal.querySelectorAll(".cal-nav");
  let view = first;
  let focusDate = today;

  function render(focus) {
    const chosen = parseDate(dateInput.value);
    title.textContent = view.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    prev.setAttribute("aria-disabled", String(+view <= +first));
    next.setAttribute("aria-disabled", String(+view >= +last));
    const count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    let html = "<span></span>".repeat(view.getDay());
    for (let n = 1; n <= count; n++) {
      const d = new Date(view.getFullYear(), view.getMonth(), n);
      const off = unavailable(d);
      const picked = chosen && +d === +chosen;
      html += `<button type="button" class="cal-day${off === "closed" ? " is-closed" : ""}${picked ? " is-chosen" : ""}" data-date="${iso(d)}" tabindex="-1"`
        + `${off ? ' aria-disabled="true"' : ""}${+d === +today ? ' aria-current="date"' : ""}`
        + ` aria-label="${longDate(d)}${off ? `, ${off}` : picked ? ", chosen" : ""}">${n}</button>`;
    }
    days.innerHTML = html;
    // One day of the month takes the Tab key; the arrow keys move between the days.
    const target = days.querySelector(`[data-date="${iso(focusDate)}"]`) || days.querySelector(".cal-day");
    target.tabIndex = 0;
    if (focus) target.focus();
    const ahead = CLOSED.map(([a, b]) => [parseDate(a), parseDate(b)]).filter(([, b]) => b >= today);
    key.textContent = ahead.length ? `Adele's calendar is closed ${ahead.map(rangeText).join(" and ")}, so those days are crossed out.` : "";
    key.hidden = !ahead.length;
  }

  function show(d) {
    focusDate = d;
    if (+monthOf(d) !== +view) { view = monthOf(d); render(true); return; }
    days.querySelectorAll(".cal-day").forEach(b => { b.tabIndex = -1; });
    const target = days.querySelector(`[data-date="${iso(d)}"]`);
    target.tabIndex = 0;
    target.focus();
  }

  function open() {
    const chosen = parseDate(dateInput.value);
    focusDate = chosen && chosen >= today ? chosen : today;
    view = monthOf(focusDate);
    cal.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    render(true);
  }

  function close(refocus) {
    cal.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    if (refocus) btn.focus();
  }

  btn.addEventListener("click", () => (cal.hidden ? open() : close(false)));
  [prev, next].forEach(b => b.addEventListener("click", () => {
    if (b.getAttribute("aria-disabled") === "true") return;
    view = new Date(view.getFullYear(), view.getMonth() + Number(b.dataset.dir), 1);
    focusDate = new Date(view.getFullYear(), view.getMonth(), Math.min(focusDate.getDate(), 28));
    render(false);
  }));
  days.addEventListener("click", e => {
    const b = e.target.closest(".cal-day");
    if (!b || b.getAttribute("aria-disabled") === "true") return;
    dateInput.value = b.dataset.date;
    close(true);
    update();
  });
  cal.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); close(true); return; }
    if (!e.target.classList.contains("cal-day")) return;
    const cur = parseDate(e.target.dataset.date);
    const y = cur.getFullYear(), m = cur.getMonth(), n = cur.getDate();
    const moves = {
      ArrowLeft: [y, m, n - 1], ArrowRight: [y, m, n + 1], ArrowUp: [y, m, n - 7], ArrowDown: [y, m, n + 7],
      Home: [y, m, n - cur.getDay()], End: [y, m, n + 6 - cur.getDay()],
      PageUp: [y, m - 1, Math.min(n, 28)], PageDown: [y, m + 1, Math.min(n, 28)],
    };
    if (!moves[e.key]) return;
    e.preventDefault();
    const to = new Date(...moves[e.key]);
    if (monthOf(to) < first || monthOf(to) > last) return;
    show(to);
  });

  // A date the browser kept from an earlier visit is dropped if it has passed or Adele has closed it since.
  const kept = parseDate(dateInput.value);
  if (kept && unavailable(kept)) dateInput.value = "";
  dateInput.type = "hidden";
  dateInput.after(btn);
  row.after(cal);
  dateBtn = btn;
}

function read() {
  const d = new FormData(form);
  return {
    occasion: d.get("occasion") || "Birthday",
    date: parseDate(d.get("date")),
    guests: Math.max(0, Math.round(Number(d.get("guests")) || 0)),
    flavour: d.get("flavour") || "Vanilla",
    gf: d.get("gf") === "on",
    vegan: d.get("vegan") === "on",
    nut: d.get("nut") === "on",
    colour: d.get("colour") || "white",
    message: tidy(d.get("message")),
    delivery: d.get("handover") === "delivery",
    pickup: tidy(d.get("pickup")),
    details: tidy(d.get("details")),
    candles: d.get("candles") === "on",
  };
}

// Her lead times, from her VisitTCI listing: one to two weeks, up to three for very detailed cakes.
function timing(date) {
  if (!date) return "Pick the date and you will see if there is still time.";
  const days = Math.round((date - startOfToday()) / DAY);
  if (days < 0) return "That date has already passed. Pick the day of your celebration.";
  const closed = closedRange(date);
  if (closed) return `Adele's calendar is closed ${rangeText(closed)}. Please pick another date for your cake.`;
  if (days < 7) {
    const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
    return `That is ${when}, which is short notice. Message Adele right away and she will tell you what is still possible.`;
  }
  const by = n => shortDate(new Date(date.getTime() - n * DAY));
  if (days < 14) return `${days} days to go. Adele asks for one to two weeks, so send your order today. Very detailed cakes need up to three weeks.`;
  if (days < 21) return `${days} days to go: good timing for most cakes. To be safe, order by ${by(14)}. A very detailed design needs up to three weeks, so ask Adele first.`;
  return `${days} days to go: plenty of time, even for a very detailed cake. Order by ${by(21)} for a detailed design, or by ${by(14)} for a simpler one.`;
}

// Every price is a starting price, as Adele asked: "from", never a fixed total.
function price(s) {
  if (s.occasion === "Wedding") return "Wedding cakes start from $500, depending on the design.";
  if (s.occasion === "Christmas") return "Christmas sugar cookies come by the dozen, from $40, and cakes start from $160.";
  let text = `${s.occasion === "Birthday" ? "Birthday and party cakes" : "Cakes"} start from $160. Sculpted, tiered and very detailed cakes cost more.`;
  if (s.guests >= 60) text += " For a big crowd, ask about tiers, or add cupcakes from $40 a dozen.";
  return text;
}

function flavourLine(s) {
  const extras = [s.gf && "gluten-free", s.vegan && "vegan", s.nut && "nut-free"].filter(Boolean);
  if (!extras.length) return s.flavour;
  const last = extras.pop();
  return `${s.flavour}, ${extras.length ? `${extras.join(", ")} and ${last}` : last}`;
}

function brief(s) {
  const scheme = SCHEMES[s.colour] || SCHEMES.white;
  const lines = [
    "Hi Adele! I'd like to order a cake.",
    "",
    `Occasion: ${s.occasion}`,
    `Date: ${s.date ? longDate(s.date) : "not fixed yet"}`,
    `Guests: about ${s.guests || "?"}`,
    `Flavour: ${flavourLine(s)}`,
    `Icing: ${scheme.name.toLowerCase()}`,
    `Message on the cake: ${s.message ? `"${s.message}"` : "none"}`,
    s.delivery ? "I'd like it delivered." : "I'll pick it up in Discovery Bay.",
    ...(s.delivery ? [] : [`Preferred pickup day and time: ${s.pickup || "to agree with you"}`]),
    ...(s.candles ? ["Candles: yes, please"] : []),
    ...(s.details ? ["", `More about the cake: ${s.details}`] : []),
    "",
    "Is that date free? I can send you pictures of cakes I like.",
  ];
  return lines.join("\n");
}

let lastColour = "";
function update() {
  const s = read();
  const scheme = SCHEMES[s.colour] || SCHEMES.white;
  paintCake(s.colour);
  writeMessage(s.message);
  cake.setAttribute("aria-label", `${scheme.name} cake${s.message ? ` with "${s.message}" written on it` : ""}`);
  tagOut("t-occasion").textContent = s.occasion;
  tagOut("t-flavour").textContent = flavourLine(s);
  tagOut("t-colour").textContent = scheme.name;
  tagOut("t-guests").textContent = `${s.guests || "?"} guests`;
  tagOut("t-date").textContent = s.date ? shortDate(s.date) : "Date to choose";
  if (dateBtn) dateBtn.textContent = s.date ? yearDate(s.date) : "Choose the date";
  tagOut("t-hand").textContent = s.delivery ? "Delivery" : (s.pickup ? `Pickup, ${s.pickup}` : "Pickup, Discovery Bay");
  if (pickupWhen) pickupWhen.hidden = s.delivery;
  timeCheck.textContent = timing(s.date);
  priceNote.textContent = price(s);
  const href = waLink(brief(s));
  sends.forEach(a => { a.href = href; });
  // A new colour pipes the message again, in the new icing.
  if (lastColour && lastColour !== s.colour) pipe();
  lastColour = s.colour;
}

if (form && cake) {
  drawCake();
  const t = startOfToday();
  dateInput.min = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  datePicker();
  // The colour and the message sit beside the cake, outside the form element, so listen wherever the planner's fields are.
  const ownField = e => e.target.form === form;
  document.addEventListener("input", e => { if (ownField(e)) update(); });
  document.addEventListener("change", e => { if (ownField(e)) update(); });
  msgInput.addEventListener("change", pipe);
  document.querySelectorAll(".step-btn").forEach(b => b.addEventListener("click", () => {
    const next = Math.min(400, Math.max(1, (Number(guestsInput.value) || 0) + Number(b.dataset.step)));
    guestsInput.value = next;
    update();
  }));
  // "Plan one like it" sets the colour of that cake before the page scrolls to the planner.
  document.querySelectorAll("[data-like]").forEach(a => a.addEventListener("click", () => {
    const radio = document.querySelector(`input[name="colour"][value="${a.dataset.like}"]`);
    if (radio) { radio.checked = true; update(); }
  }));
  update();
  // The first piping waits for the font and for the cake to be seen.
  const firstPipe = () => {
    if (!("IntersectionObserver" in window)) { pipe(); return; }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); pipe(); }
    }, { threshold: 0.45 });
    io.observe(cake);
  };
  if (document.fonts) {
    document.fonts.load("58px Satisfy").then(() => { update(); firstPipe(); }, firstPipe);
    document.fonts.addEventListener("loadingdone", () => writeMessage(read().message));
  } else {
    firstPipe();
  }
}

/* ---------- Questions: one card open at a time ---------- */

const qcards = [...document.querySelectorAll(".qcard")];
qcards.forEach(d => d.addEventListener("toggle", () => {
  if (d.open) qcards.forEach(o => { if (o !== d) o.open = false; });
}));

/* ---------- The quick WhatsApp bar ---------- */

const quick = document.getElementById("quick");
if (quick) {
  quick.addEventListener("submit", e => {
    e.preventDefault();
    const d = new FormData(quick);
    const name = tidy(d.get("name")), when = tidy(d.get("when"));
    let text = "Hi Adele!";
    if (name) text += ` My name is ${name}.`;
    text += when ? ` I'd like a cake for ${when}. Can we talk about it?` : " I'd like to order a cake. Can we talk about it?";
    window.open(waLink(text), "_blank", "noopener");
  });
}

/* ---------- The strip of cakes drifts on a loop ---------- */

const track = document.querySelector(".strip-track");
if (track && !reduced) {
  [...track.children].forEach(img => track.appendChild(img.cloneNode(true)));
}

/* ---------- The footer name, built from blocks of different heights ---------- */

const blocksG = document.getElementById("blocks");
const blocksSvg = blocksG && blocksG.ownerSVGElement;
const BLOCK_COLOURS = ["#36c2ba", "#f8d35e", "#f9c49e", "#bccfad", "#f3913f", "#fffcf6"];
const HEIGHTS = [1, .74, .9, .64, .96, .7, .86, .66, 1, .8, .62, .92, .76];
let blocksNarrow = null;

function buildBlocks() {
  if (!blocksG) return;
  const narrow = innerWidth < 700;
  if (narrow === blocksNarrow) return;
  blocksNarrow = narrow;
  const rows = narrow ? ["THE CAKE", "LADY TCI"] : ["THE CAKE LADY TCI"];
  const W = 1200, gap = 6, rowH = narrow ? 330 : 260, rowGap = 14;
  blocksG.replaceChildren();
  let k = 0;
  // Every row uses the block width of the longest row, so the letters match in size.
  const longest = rows.reduce((a, r) => r.length > a.length ? r : a, "");
  const nL = longest.replace(/ /g, "").length, nS = longest.split(" ").length - 1;
  const bw = (W - (nL + nS - 1) * gap) / (nL + 0.35 * nS);
  rows.forEach((row, ri) => {
    const bottom = rowH * (ri + 1) + rowGap * ri;
    let x = 0;
    for (const ch of row) {
      if (ch === " ") { x += bw * 0.35 + gap; continue; }
      const h = rowH * HEIGHTS[k % HEIGHTS.length];
      const colour = BLOCK_COLOURS[k % BLOCK_COLOURS.length];
      el("rect", { x: x.toFixed(1), y: (bottom - h).toFixed(1), width: bw.toFixed(1), height: h.toFixed(1), fill: colour }, blocksG);
      const t = el("text", { x: (x + bw / 2).toFixed(1), y: (bottom - bw * 0.3).toFixed(1), "text-anchor": "middle", "font-size": (bw * 1.02).toFixed(1), fill: "#0e6e73" }, blocksG);
      t.textContent = ch;
      x += bw + gap;
      k++;
    }
  });
  blocksSvg.setAttribute("viewBox", `0 0 ${W} ${rowH * rows.length + rowGap * (rows.length - 1)}`);
}
buildBlocks();
addEventListener("resize", buildBlocks);

/* ---------- The bar: the Cakes menu, the phone menu, and the cupcake that walks with the page ---------- */

const topbar = document.querySelector(".topbar");
const menuBtn = document.querySelector(".menu-btn");
const subBtn = document.querySelector(".sub-btn");
const subItem = subBtn && subBtn.closest(".has-sub");
const setSub = open => {
  if (!subBtn) return;
  subBtn.setAttribute("aria-expanded", String(open));
  subItem.classList.toggle("open", open);
};
const setMenu = open => {
  if (!menuBtn) return;
  menuBtn.setAttribute("aria-expanded", String(open));
  topbar.classList.toggle("menu-open", open);
};
if (topbar) {
  if (subBtn) subBtn.addEventListener("click", () => setSub(subBtn.getAttribute("aria-expanded") !== "true"));
  if (menuBtn) menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
  topbar.querySelectorAll(".site-nav a").forEach(a => a.addEventListener("click", () => { setSub(false); setMenu(false); }));
  document.addEventListener("click", e => { if (!topbar.contains(e.target)) { setSub(false); setMenu(false); } });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const wasOpen = subItem && subItem.classList.contains("open");
    setSub(false); setMenu(false);
    if (wasOpen && subBtn) subBtn.focus();
  });
}

// Like the jeep on Turks Jeeps: the cupcake walks from left to right as the page goes down, and turns round going up.
const walker = document.querySelector("[data-walker]");
const rootEl = document.documentElement;
let walkTick = false, walkIdle = 0, lastY = scrollY;
const wordmarkEl = document.querySelector(".wordmark");
const navEl = document.querySelector(".site-nav");
const phoneBar = matchMedia("(max-width: 860px)");
// On a phone the cupcake has its own lane under the bar; on a wide screen it walks the empty stretch between the name and the menu.
function lane() {
  const w = walker.offsetWidth;
  if (phoneBar.matches || !wordmarkEl || !navEl) return [0, rootEl.clientWidth - w];
  const a = wordmarkEl.getBoundingClientRect().right + 24;
  const b = navEl.getBoundingClientRect().left - w - 24;
  return b - a > 60 ? [a, b] : [0, rootEl.clientWidth - w];
}
function walk() {
  walkTick = false;
  const max = Math.max(1, rootEl.scrollHeight - innerHeight);
  const p = Math.min(1, Math.max(0, scrollY / max));
  if (walker) {
    const [a, b] = lane();
    walker.style.setProperty("--walk-x", `${Math.round(a + p * (b - a))}px`);
  }
  if (walker && !reduced && scrollY !== lastY) {
    walker.classList.toggle("back", scrollY < lastY);
    walker.classList.add("walking");
    clearTimeout(walkIdle);
    walkIdle = setTimeout(() => walker.classList.remove("walking"), 220);
  }
  lastY = scrollY;
}
addEventListener("scroll", () => { if (!walkTick) { walkTick = true; requestAnimationFrame(walk); } }, { passive: true });
addEventListener("resize", walk);
walk();

/* ---------- Each section's parts come in one after another the first time they are seen ---------- */

const groups = document.querySelectorAll("[data-reveal]");
groups.forEach(g => {
  const kids = g.classList.contains("steps-grid") ? [...g.querySelectorAll(".step > *")] : [...g.children];
  kids.forEach((c, i) => c.style.setProperty("--i", Math.min(i, 9)));
});
const panels = document.querySelectorAll(".panel");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  groups.forEach(g => io.observe(g));
  panels.forEach(p => io.observe(p));
} else {
  groups.forEach(g => g.classList.add("is-in"));
  panels.forEach(p => p.classList.add("is-in"));
}
