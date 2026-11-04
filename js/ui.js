/* Fifty Stars – Bausteine als SVG/HTML-Text: Karte, Sternenfeld, Nummernschild, Strassenschild, Pass-Stempel, Abzeichen, Auto.
   Alles ohne Bilder, damit es scharf ist und offline geht. Gemeinsame <defs> (Tinte, Bögen) stehen in index.html. */
(function () {
  'use strict';
  const D = window.FS_DATA, M = D.map;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const REGION_CLASS = { Northeast: 'ne', Midwest: 'mw', South: 'so', West: 'we' };
  const BY = Object.fromEntries(D.states.map(s => [s.id, s]));
  const regionOf = id => (id === 'dc' ? 'South' : BY[id].region);

  /* ---------- Karte
     opt: { view: 'All'|Region|stateId, labels, highlight, filled:Set, wrong:Set, hit:true (für Antippen), cities:[{name, at, cap}], dc:true, cls } */
  function bbox(ids) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const id of ids) { const b = M.box[id]; x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); }
    return [x0, y0, x1, y1];
  }
  function viewBox(view) {
    if (!view || view === 'All') return [0, 0, M.w, M.h];
    let ids, pad, min;
    if (BY[view] || view === 'dc') {
      ids = [view]; pad = 0.45; min = 70;
    } else {
      ids = D.states.filter(s => s.region === view).map(s => s.id);
      if (view === 'South') ids.push('dc');
      pad = 0.04; min = 200;
    }
    let [x0, y0, x1, y1] = bbox(ids);
    let w = x1 - x0, h = y1 - y0;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    w = Math.max(min, w * (1 + 2 * pad)); h = Math.max(min * 0.62, h * (1 + 2 * pad));
    if (w / h < 1.25) w = h * 1.25; else if (w / h > 1.9) h = w / 1.9;   // nicht zu hoch, nicht zu flach
    return [cx - w / 2, cy - h / 2, w, h].map(v => +v.toFixed(1));
  }
  function map(opt = {}) {
    const vb = viewBox(opt.view);
    const k = vb[2] / M.w;                                   // Massstab: Linien und Punkte gleich dick bei jedem Ausschnitt
    const focus = BY[opt.view] ? opt.view : null;
    const zoomRegion = !focus && opt.view && opt.view !== 'All' ? opt.view : null;
    const paths = [];
    for (const s of D.states) {
      const cls = ['st', REGION_CLASS[s.region]];
      if (opt.highlight === s.id || focus === s.id) cls.push('hl');
      if (opt.filled && opt.filled.has(s.id)) cls.push('filled');
      if (opt.wrong && opt.wrong.has(s.id)) cls.push('bad');
      if (opt.missed && opt.missed.has(s.id)) cls.push('missed');
      if (opt.stamped && opt.stamped.has(s.id)) cls.push('stamped');
      if (focus && focus !== s.id) cls.push('dim');
      if (zoomRegion && s.region !== zoomRegion) cls.push('dim');
      paths.push(`<path class="${cls.join(' ')}" data-id="${s.id}" d="${M.paths[s.id]}"/>`);
    }
    const ins = Object.values(M.insets).map(([x0, y0, x1, y1]) => `<rect class="inset" x="${x0}" y="${y0}" width="${(x1 - x0).toFixed(1)}" height="${(y1 - y0).toFixed(1)}" rx="${4 * k}"/>`).join('');
    let dc = '';
    if (opt.dc !== false) {
      dc = `<path class="st dcp" d="${M.paths.dc}"/><circle class="dc${opt.dcTap ? ' tap' : ''}" data-id="${opt.dcTap ? 'dc' : ''}" cx="${D.dc.at[0]}" cy="${D.dc.at[1]}" r="${(2.6 * k + 1.2).toFixed(1)}"/>`;
    }
    let labels = '';
    if (opt.labels) {
      labels = D.states.filter(s => !(zoomRegion && s.region !== zoomRegion)).map(s => {
        const [x, y] = M.label[s.id], small = M.size[s.id] / k < 28;
        return small ? '' : `<text class="lbl" x="${x}" y="${y}" font-size="${(11 * k).toFixed(1)}" dy="0.35em">${s.abbr}</text>`;
      }).join('');
    }
    let cities = '';
    if (opt.cities) {
      cities = opt.cities.map((c, i) => {
        const r = (c.cap ? 4.2 : 3.2) * k * (focus ? 1.7 : 1);
        const mark = c.cap
          ? `<path class="cap" transform="translate(${c.at[0]} ${c.at[1]}) scale(${(r / 10).toFixed(3)})" d="M0-10l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L0 5.6l-6.3 3.9 1.7-7.3-5.4-4.7 7.1-.6z"/>`
          : `<circle class="city" cx="${c.at[0]}" cy="${c.at[1]}" r="${r.toFixed(2)}"/>`;
        const fs = (focus ? 17 : 10.5) * k;
        const t = c.name ? `<text class="ctl" x="${(c.at[0] + r * 1.6).toFixed(1)}" y="${c.at[1]}" font-size="${fs.toFixed(1)}" dy="0.35em">${esc(c.name)}</text>` : '';
        return `<g class="cg" style="--i:${i}">${mark}${t}</g>`;
      }).join('');
    }
    const hits = '';                                          // Antippen: siehe stateAt()
    return `<svg class="usmap ${opt.cls || ''}" viewBox="${vb.join(' ')}" style="--k:${k.toFixed(3)}" role="img" aria-label="${esc(opt.aria || 'Map of the United States')}">`
      + `<g class="lands">${paths.join('')}</g>${ins}${dc}${labels}${cities}${hits}</svg>`;
  }
  // nach dem Zeichnen: Kreise für Staaten, die auf dem Bildschirm kleiner als ~34 px sind (mindestens 15 px Radius)
  function fitHits() { /* früher: Kreise für kleine Staaten (überlappten auf dem iPhone, 2026-11-04) – jetzt stateAt() */ }
  // Welcher Staat ist gemeint? Kleine Staaten (auf dem Bildschirm unter 34 px) sind schwer zu treffen. Darum (2026-11-04):
  // - Liegt der Finger auf einem kleinen Staat, im Wasser oder neben der Küste: der kleine Staat, dessen Mitte am nächsten ist (bis 22 px).
  // - Liegt er auf einem grossen Staat: dieser – ausser er ist höchstens 10 px von der Mitte eines kleinen Staats entfernt.
  //   So überlappen sich keine Tippflächen (vorher landete ein Tipp auf Connecticut bei Rhode Island).
  function stateAt(svg, ev, only) {
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const dc = el && el.closest && el.closest('circle.dc[data-id]');
    if (dc && dc.dataset.id) return dc.dataset.id;
    const hit = el && el.closest && el.closest('path.st[data-id]');
    const direct = hit && svg.contains(hit) ? hit.dataset.id : null;
    const m = svg.getScreenCTM();
    if (!m) return direct;
    const px = m.a, pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const p = pt.matrixTransform(m.inverse());
    const tiny = id => M.size[id] * px < 34;
    let best = null, bd = Infinity;
    for (const s of D.states) {
      if (only && !only.has(s.id)) continue;
      if (!tiny(s.id)) continue;
      const [x, y] = M.label[s.id], d = Math.hypot(x - p.x, y - p.y) * px;
      if (d < bd) { bd = d; best = s.id; }
    }
    if (!direct || tiny(direct)) return bd <= 22 ? best : direct;
    return bd <= 10 ? best : direct;
  }

  /* ---------- Sternenfeld wie auf der Flagge: 9 Reihen mit 6 und 5 Sternen, Stern i = Staat Nr. i (Reihenfolge des Beitritts) */
  const STAR = 'M0-10l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L0 5.6l-6.3 3.9 1.7-7.3-5.4-4.7 7.1-.6z';
  function starField(lit, fresh = new Set()) {
    const W = 260, H = 184, byOrder = [...D.states].sort((a, b) => a.order - b.order);
    let i = 0, out = '';
    for (let r = 0; r < 9; r++) {
      const n = r % 2 ? 5 : 6;
      for (let c = 0; c < n; c++) {
        const s = byOrder[i++], x = (r % 2 ? 2 * c + 2 : 2 * c + 1) * W / 12, y = (r + 1) * H / 10;
        const cls = lit.has(s.id) ? (fresh.has(s.id) ? 'on new' : 'on') : 'off';
        out += `<path class="${cls}" data-id="${s.id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(0.92)" d="${STAR}"><title>${esc(s.name)}</title></path>`;
      }
    }
    return `<svg class="stars" viewBox="0 0 ${W} ${H}" role="img" aria-label="${lit.size} of 50 stars lit"><rect class="canton" width="${W}" height="${H}" rx="6"/>${out}</svg>`;
  }

  /* ---------- Nummernschild (Profil) */
  const PLATES = {
    classic: { bg: '#f2c94c', ink: '#1d1d1b', top: '#1d1d1b' },
    navy: { bg: '#1f3a5f', ink: '#f4ead5', top: '#e3b75a' },
    white: { bg: '#f7f3ea', ink: '#1f3a5f', top: '#b5402f' },
    green: { bg: '#2f5d50', ink: '#f4ead5', top: '#e3b75a' },
    red: { bg: '#a63d2f', ink: '#fbf1dc', top: '#fbf1dc' },
    sky: { bg: '#9cc3d5', ink: '#1f3a5f', top: '#1f3a5f' },
  };
  function plate(name, style = 'classic', sub = 'FIFTY STARS') {
    const p = PLATES[style] || PLATES.classic, txt = (name || '').toUpperCase() || '·  ·  ·';
    const long = txt.length > 7;
    return `<svg class="plate" viewBox="0 0 240 120" role="img" aria-label="${esc(name || 'License plate')}">`
      + `<rect x="2" y="2" width="236" height="116" rx="12" fill="${p.bg}" stroke="${p.ink}" stroke-opacity=".35" stroke-width="2"/>`
      + `<rect x="9" y="9" width="222" height="102" rx="8" fill="none" stroke="${p.ink}" stroke-width="2.5"/>`
      + ['28,22', '212,22', '28,98', '212,98'].map(c => `<circle cx="${c.split(',')[0]}" cy="${c.split(',')[1]}" r="4" fill="${p.ink}" fill-opacity=".3"/>`).join('')
      + `<text x="120" y="31" text-anchor="middle" font-family="Libre Franklin, sans-serif" font-weight="700" font-size="13" letter-spacing="4" fill="${p.top}">${esc(sub)}</text>`
      + `<text x="120" y="83" text-anchor="middle" font-family="Alfa Slab One, serif" font-size="${long ? 36 : 46}" ${txt.length > 8 ? 'textLength="200" lengthAdjust="spacingAndGlyphs"' : ''} fill="${p.ink}">${esc(txt)}</text>`
      + `<text x="120" y="104" text-anchor="middle" font-family="Libre Franklin, sans-serif" font-weight="600" font-size="10" letter-spacing="3" fill="${p.ink}" fill-opacity=".7">★ ROAD TRIP ★</text></svg>`;
  }

  /* ---------- Strassenschild mit dem Kürzel (wie die US-Highway-Schilder) */
  function shield(abbr, cls = '') {
    return `<svg class="shield ${cls}" viewBox="0 0 40 44" aria-hidden="true"><path class="sh-b" d="M4 4c6 2 12 1 16-2 4 3 10 4 16 2 2 10 2 20-3 28-4 6-9 9-13 11-4-2-9-5-13-11C2 24 2 14 4 4z"/>`
      + `<path class="sh-t" d="M5.6 6.4c5 1.4 10.6.6 14.4-1.8 3.8 2.4 9.4 3.2 14.4 1.8.4 2 .6 3.9.7 5.6H4.9c.1-1.7.3-3.6.7-5.6z"/>`
      + `<text x="20" y="30" text-anchor="middle" font-family="Alfa Slab One, serif" font-size="14">${esc(abbr)}</text></svg>`;
  }

  /* ---------- Pass-Stempel: Form, Farbe und Drehung hängen fest am Staat (jeder sieht jedes Mal gleich aus) */
  const INKS = ['#b5402f', '#1f3a5f', '#2f6b4f', '#8a4f1d', '#2b6f86', '#6b3f7a'];
  function stamp(s, cls = '') {
    const n = s.order || 51, ink = INKS[(n * 7) % INKS.length], form = n % 5, rot = ((n * 37) % 25) - 12;
    const name = esc(s.name.toUpperCase()), year = s.year, abbr = s.abbr;
    const L = name.length, fs = L > 12 ? 7.4 : L > 9 ? 8.4 : L > 6 ? 9.6 : 10.5;
    const fit = w => (L > 8 ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : '');   // lange Namen genau einpassen
    let body;
    if (form === 0 || form === 3) {          // rund (3 = doppelter Aussenring, gepunkteter Innenring)
      // Schriftband zwischen Innenring (r 33) und Aussenring (r 46): oben Grundlinie r 37, unten r 42.5 (Buchstaben nach innen)
      body = (form === 3
        ? `<circle cx="50" cy="50" r="47" fill="none" stroke-width="1.6"/><circle cx="50" cy="50" r="44.6" fill="none" stroke-width="1.2"/><circle cx="50" cy="50" r="33" fill="none" stroke-width="1.6" stroke-dasharray="1 2.6" stroke-linecap="round"/>`
        : `<circle cx="50" cy="50" r="46" fill="none" stroke-width="3"/><circle cx="50" cy="50" r="33" fill="none" stroke-width="1.5"/>`)
        + `<text font-size="${fs}" font-family="Libre Franklin, sans-serif" font-weight="800" letter-spacing="1"><textPath href="#arc-top" startOffset="50%" text-anchor="middle">${name}</textPath></text>`
        + `<text font-size="7.6" font-family="Libre Franklin, sans-serif" font-weight="700" letter-spacing="1.4"><textPath href="#arc-bottom" startOffset="50%" text-anchor="middle">EST. ${year}</textPath></text>`
        + `<text x="50" y="60" text-anchor="middle" font-family="Alfa Slab One, serif" font-size="22">${abbr}</text>`
        + `<path transform="translate(50 32) scale(.42)" d="${STAR}"/>`;
    } else if (form === 1) {                 // Rechteck mit Doppelrand
      body = `<rect x="6" y="18" width="88" height="64" rx="5" fill="none" stroke-width="3"/><rect x="11" y="23" width="78" height="54" rx="2" fill="none" stroke-width="1.2"/>`
        + `<text x="50" y="38" text-anchor="middle"${fit(72)} font-size="${fs}" font-family="Libre Franklin, sans-serif" font-weight="800" letter-spacing="1">${name}</text>`
        + `<text x="50" y="62" text-anchor="middle" font-family="Alfa Slab One, serif" font-size="21">${abbr}</text>`
        + `<text x="50" y="73" text-anchor="middle" font-size="7.5" font-family="Libre Franklin, sans-serif" font-weight="700" letter-spacing="2">★ ${year} ★</text>`;
    } else if (form === 2) {                 // Oval
      body = `<ellipse cx="50" cy="50" rx="46" ry="33" fill="none" stroke-width="3"/><ellipse cx="50" cy="50" rx="39" ry="26" fill="none" stroke-width="1.2" stroke-dasharray="4 2"/>`
        + `<text x="50" y="43" text-anchor="middle"${fit(64)} font-size="${fs}" font-family="Libre Franklin, sans-serif" font-weight="800" letter-spacing="1">${name}</text>`
        + `<text x="50" y="64" text-anchor="middle" font-family="Alfa Slab One, serif" font-size="19">${abbr}</text>`
        + `<path transform="translate(22 56) scale(.32)" d="${STAR}"/><path transform="translate(78 56) scale(.32)" d="${STAR}"/>`;
    } else {                                 // Achteck
      body = `<path d="M31 6h38l25 25v38L69 94H31L6 69V31z" fill="none" stroke-width="3" stroke-linejoin="round"/><path d="M34 13h32l21 21v32L66 87H34L13 66V34z" fill="none" stroke-width="1.2"/>`
        + `<text x="50" y="40" text-anchor="middle"${fit(66)} font-size="${fs}" font-family="Libre Franklin, sans-serif" font-weight="800" letter-spacing="1">${name}</text>`
        + `<text x="50" y="64" text-anchor="middle" font-family="Alfa Slab One, serif" font-size="22">${abbr}</text>`
        + `<text x="50" y="77" text-anchor="middle" font-size="7.5" font-family="Libre Franklin, sans-serif" font-weight="700" letter-spacing="2">${year}</text>`;
    }
    return `<svg class="stamp ${cls}" viewBox="0 0 100 100" role="img" aria-label="Stamp: ${esc(s.name)}"><g transform="rotate(${rot} 50 50)" fill="${ink}" stroke="${ink}" filter="url(#ink)">${body.replace(/<text /g, '<text stroke="none" ')}</g></svg>`;
  }
  // Abzeichen einer Region (wie ein Aufnäher)
  // Leuchtturm (Nordosten), Scheune (Mittlerer Westen), Palme (Süden), Berge (Westen)
  const BADGE = {
    Northeast: ['#2b6f86', 'M44 34h12l4 34H40zM42 34l8-9 8 9M36 68h28M45 46h10M44 56h12'],
    Midwest: ['#c98b2b', 'M28 68V46l22-16 22 16v22zM43 68V55h14v13M28 46h44M41 41l18 0'],
    South: ['#b5402f', 'M48 70c0-12 2-22 7-31M55 39c-7-6-17-5-23 1M55 39c5-8 15-9 22-3M55 39c-1-8-8-13-17-12M55 39c5 2 11 8 12 15M38 70h22'],
    West: ['#4f7a4a', 'M22 68l16-26 10 14 8-10 22 22z'],
  };
  function badge(region, on = true) {
    const [c, icon] = BADGE[region];
    return `<svg class="badge ${on ? 'on' : 'off'}" viewBox="0 0 100 100" role="img" aria-label="${region} badge${on ? '' : ' (not yet)'}">`
      + `<circle cx="50" cy="50" r="47" fill="${on ? c : 'none'}" stroke="${on ? '#f4ead5' : 'currentColor'}" stroke-width="3" stroke-dasharray="${on ? 'none' : '5 4'}"/>`
      + `<circle cx="50" cy="50" r="40" fill="none" stroke="${on ? '#f4ead5' : 'currentColor'}" stroke-width="1.5" stroke-opacity=".7"/>`
      + `<path d="${icon}" fill="none" stroke="${on ? '#f4ead5' : 'currentColor'}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill-opacity=".9"/>`
      + `<text x="50" y="84" text-anchor="middle" font-family="Libre Franklin, sans-serif" font-weight="800" font-size="${region.length > 6 ? 7.4 : 8.6}" letter-spacing="1.1" fill="${on ? '#f4ead5' : 'currentColor'}">${region.toUpperCase()}</text></svg>`;
  }

  /* ---------- Auto (für die Strasse oben in der Runde) */
  const CAR = `<svg class="car" viewBox="0 0 64 32" aria-hidden="true"><path class="car-b" d="M4 22q0-6 6-7l10-1 7-7q2-2 6-2h11q4 0 6 3l4 6 4 1q4 1 4 5v3q0 2-2 2H6q-2 0-2-2z"/>`
    + `<path class="car-w" d="M24.5 14l6-6h6.5v6zM40 8h6l3.5 6H40z"/><circle class="car-t" cx="17" cy="25" r="5.5"/><circle class="car-t" cx="49" cy="25" r="5.5"/>`
    + `<circle class="car-h" cx="17" cy="25" r="2"/><circle class="car-h" cx="49" cy="25" r="2"/></svg>`;

  function flagImg(id, cls = '') {
    const s = id === 'dc' ? D.dc : BY[id];
    return `<img class="flag ${cls}" src="flags/${id}.webp" alt="Flag of ${esc(s.name)}" draggable="false">`;
  }

  window.UI = { esc, map, fitHits, stateAt, viewBox, starField, plate, PLATES, shield, stamp, badge, CAR, flagImg, REGION_CLASS, regionOf, STAR };
})();
