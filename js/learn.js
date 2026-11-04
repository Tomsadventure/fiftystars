/* Fifty Stars – Lernkern ohne Bildschirm (läuft auch in Node: Scripts/test.mjs).
   Jeder Staat hat vier Fähigkeiten: map (Lage), flag (Flagge), capital (Hauptstadt), cities (Städte).
   Jede Fähigkeit hat eine Stufe 0–6 und ein «fällig ab» (Wiederholung in wachsenden Abständen, wie Lernkarten).
   - Richtig: Stufe 0 -> 1; sonst eine Stufe höher, aber nur, wenn die Wiederholung fällig war (sonst bleibt sie).
   - Falsch: zurück auf Stufe 1 (oder 0), sofort wieder fällig.
   - Ein Staat bekommt seinen Stempel (und einen Stern), wenn alle vier Fähigkeiten mindestens Stufe 2 haben.
     Der Stempel bleibt, auch wenn später etwas vergessen wird – dann zeigt die App «review».
   - Eine Region bekommt ihr Abzeichen, wenn alle ihre Staaten gestempelt sind. */
(function (root) {
  'use strict';
  const D = root.FS_DATA;
  const SKILLS = ['map', 'flag', 'capital', 'cities'];
  const SKILL_NAME = { map: 'Map', flag: 'Flag', capital: 'Capital', cities: 'Cities' };
  const REGIONS = ['Northeast', 'Midwest', 'South', 'West'];
  const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;
  const INTERVAL = [0, 10 * MIN, 20 * HOUR, 3 * DAY, 7 * DAY, 21 * DAY, 60 * DAY];   // fällig nach Erreichen der Stufe i
  const LEARNED = 2, MAX = INTERVAL.length - 1;
  const BY_ID = Object.fromEntries(D.states.map(s => [s.id, s]));
  const ORDER_WORD = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');

  /* ---------- Hilfen */
  const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const audioState = id => 'st_' + id;
  const audioCity = name => 'ct_' + slug(name);
  function shuffle(a, rng = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const pick = (a, rng = Math.random) => a[Math.floor(rng() * a.length)];
  const statesIn = scope => D.states.filter(s => scope === 'All' || s.region === scope);

  // Städtenamen, die in mehreren Staaten vorkommen (Springfield, Portland, Kansas City, Augusta, Columbus, Charleston …):
  // bei «In welchem Staat liegt …?» dürfen diese Staaten nicht als falsche Antwort erscheinen.
  const PLACES = {};
  for (const s of D.states) for (const n of new Set([s.capital, ...s.cities.map(c => c.name)])) (PLACES[n] ||= new Set()).add(s.id);
  const statesWithPlace = name => PLACES[name] || new Set();

  /* ---------- Fortschritt eines Profils */
  function blank() { return { items: {}, stamps: {}, badges: {}, bonus: {}, best: {}, stats: { rounds: 0, answers: 0, right: 0, days: [] } }; }
  const key = (id, skill) => id + '.' + skill;
  const item = (p, id, skill) => p.items[key(id, skill)] || { l: 0, d: 0, n: 0, w: 0 };
  const level = (p, id, skill) => item(p, id, skill).l;

  function stateInfo(p, id, now = Date.now()) {
    const skills = {}; let due = false, learned = true, seen = false;
    for (const k of SKILLS) {
      const it = item(p, id, k);
      skills[k] = it.l;
      if (it.l < LEARNED) learned = false;
      if (it.n) seen = true;
      if (it.l >= LEARNED && it.d <= now) due = true;
    }
    return { skills, learned, stamped: !!p.stamps[id], review: !!p.stamps[id] && (!learned || due), seen };
  }

  /* Eine Antwort eintragen; gibt zurück, was neu ist (Stempel, Abzeichen) */
  function answer(p, id, skill, right, now = Date.now()) {
    const k = key(id, skill), it = { ...item(p, id, skill) };
    const before = it.l;
    it.n++;
    if (right) {
      if (it.l === 0) it.l = 1;
      else if (it.d <= now) it.l = Math.min(MAX, it.l + 1);
      it.d = now + INTERVAL[it.l];
    } else {
      it.w++;
      it.l = it.l >= 2 ? 1 : 0;
      it.d = now;
    }
    it.t = now;
    p.items[k] = it;
    p.stats.answers++; if (right) p.stats.right++;
    const day = new Date(now).toISOString().slice(0, 10);
    if (!p.stats.days.includes(day)) { p.stats.days.push(day); p.stats.days = p.stats.days.slice(-400); }
    const out = { up: it.l > before, level: it.l, stamps: [], badges: [] };
    if (!p.stamps[id] && stateInfo(p, id, now).learned) { p.stamps[id] = now; out.stamps.push(id); }
    for (const r of REGIONS) {
      if (p.badges[r]) continue;
      if (statesIn(r).every(s => p.stamps[s.id])) { p.badges[r] = now; out.badges.push(r); }
    }
    return out;
  }

  function streak(p, now = Date.now()) {
    const days = new Set(p.stats.days);
    let n = 0, t = now;
    const iso = x => new Date(x).toISOString().slice(0, 10);
    if (!days.has(iso(t))) t -= DAY;                       // heute noch nicht gespielt: ab gestern zählen
    while (days.has(iso(t))) { n++; t -= DAY; }
    return n;
  }

  function summary(p, scope = 'All', now = Date.now()) {
    const list = statesIn(scope);
    let stamped = 0, review = 0, started = 0;
    for (const s of list) {
      const i = stateInfo(p, s.id, now);
      if (i.stamped) stamped++;
      if (i.review) review++;
      if (i.seen) started++;
    }
    let due = 0;
    for (const s of list) for (const k of SKILLS) { const it = item(p, s.id, k); if (it.l > 0 && it.d <= now) due++; }
    return { total: list.length, stamped, review, started, due };
  }

  /* ---------- Eine Runde zusammenstellen: zuerst Fälliges, dann ein paar neue Staaten, dann Üben */
  function pickRound(p, { scope = 'All', skills = SKILLS, size = 10, now = Date.now(), rng = Math.random } = {}) {
    const list = statesIn(scope);
    const all = [];
    for (const s of list) for (const k of skills) all.push({ id: s.id, skill: k, it: item(p, s.id, k) });
    // fällig = schon gesehen und an der Reihe (auch was zuletzt falsch war, Stufe 0)
    const due = all.filter(x => x.it.n > 0 && x.it.d <= now)
      .sort((a, b) => (b.it.w > 0) - (a.it.w > 0) || a.it.l - b.it.l || a.it.d - b.it.d);
    const fresh = all.filter(x => x.it.n === 0);
    const learning = all.filter(x => x.it.n > 0 && x.it.d > now).sort((a, b) => a.it.l - b.it.l || a.it.d - b.it.d);
    const out = [], used = new Set();
    const take = x => { if (out.length < size && !used.has(key(x.id, x.skill))) { used.add(key(x.id, x.skill)); out.push({ id: x.id, skill: x.skill }); } };
    due.slice(0, Math.ceil(size * 0.6)).forEach(take);
    // neue Staaten: bei allen vier Fähigkeiten höchstens 2 neue Staaten pro Runde, bei einer Fähigkeit höchstens 4
    const newStates = shuffle([...new Set(fresh.map(x => x.id))], rng);
    const maxNew = skills.length > 1 ? 2 : 4;
    const startedNew = newStates.filter(id => all.some(x => x.id === id && x.it.n > 0));   // schon angefangen: zuerst fertig machen
    const order = [...startedNew, ...newStates.filter(id => !startedNew.includes(id))].slice(0, maxNew);
    for (const id of order) fresh.filter(x => x.id === id).forEach(take);
    due.forEach(take);
    learning.forEach(take);
    if (out.length < size) shuffle(fresh, rng).forEach(take);              // alles andere ist gelernt: dann eben Neues
    return spread(shuffle(out, rng));
  }
  // derselbe Staat nicht zweimal hintereinander: immer den Staat mit den meisten übrigen Fragen nehmen, aber nie den letzten
  function spread(a) {
    const out = [], rest = a.slice();
    while (rest.length) {
      const last = out.length ? out[out.length - 1].id : null, cnt = {};
      for (const x of rest) cnt[x.id] = (cnt[x.id] || 0) + 1;
      let best = -1;
      for (let i = 0; i < rest.length; i++) if (rest[i].id !== last && (best < 0 || cnt[rest[i].id] > cnt[rest[best].id])) best = i;
      out.push(rest.splice(best < 0 ? 0 : best, 1)[0]);
    }
    return out;
  }

  /* ---------- Falsche Antworten: Staaten (gleiche Region ist schwerer), Hauptstädte (mit der grössten Stadt als Falle) */
  function otherStates(s, n, { avoid = new Set(), hard = false, rng = Math.random } = {}) {
    const pool = D.states.filter(x => x.id !== s.id && !avoid.has(x.id));
    const near = shuffle(pool.filter(x => x.region === s.region), rng);
    const far = shuffle(pool.filter(x => x.region !== s.region), rng);
    const src = hard ? [...near, ...far] : shuffle([...near.slice(0, 2), ...far], rng);
    return src.slice(0, n);
  }

  function makeQuestion(p, { id, skill }, { rng = Math.random, typing = true } = {}) {
    const s = BY_ID[id], lv = level(p, id, skill), hard = lv >= 2;
    const stateOpt = x => ({ id: x.id, label: x.name, flag: x.id });
    const q = { id, skill, level: lv };
    if (skill === 'flag') {
      const others = otherStates(s, 3, { hard, rng });
      if (lv < 2 || rng() < 0.5) {
        Object.assign(q, { type: 'flag2state', ask: 'Which state flies this flag?', flag: id, options: shuffle([s, ...others], rng).map(stateOpt), answer: id });
      } else {
        Object.assign(q, { type: 'state2flag', ask: `Which is the flag of ${s.name}?`, options: shuffle([s, ...others], rng).map(stateOpt), answer: id, flags: true });
      }
      q.say = [audioState(id)];
      q.explain = `This is the flag of ${s.name}.`;
    } else if (skill === 'map') {
      if (lv < 2) {
        Object.assign(q, { type: 'mapName', ask: 'Which state is highlighted?', highlight: id, options: shuffle([s, ...otherStates(s, 3, { hard: true, rng })], rng).map(stateOpt), answer: id });
      } else {
        Object.assign(q, { type: 'mapTap', ask: `Find ${s.name} on the map.`, target: id, answer: id });
      }
      q.say = [audioState(id)];
      q.explain = `${s.name} is in the ${s.region}.`;
    } else if (skill === 'capital') {
      const big = s.cities[0].name;
      const trap = s.capitalRank !== 1 ? big : null;
      const kinds = ['state2capital'];
      if (lv >= 2) {
        kinds.push('capital2state');
        if (typing) kinds.push('capitalType', 'capitalType');
        if (trap) kinds.push('whichCapital');
      }
      const type = lv < 2 ? 'state2capital' : pick(kinds, rng);
      const capNote = trap ? ` The largest city is ${big}.` : s.capitalRank === 1 ? ` It’s also the largest city.` : '';
      q.explain = `${s.capital} is the capital of ${s.name}.${capNote}`;
      q.say = [audioCity(s.capital)];
      if (type === 'state2capital') {
        const capOf = otherStates(s, 6, { hard, rng }).map(x => x.capital).filter(c => c !== s.capital && c !== trap);
        const wrong = [...(trap && lv >= 1 ? [trap] : []), ...capOf].slice(0, 3);
        Object.assign(q, { type, ask: `What’s the capital of ${s.name}?`, state: id, options: shuffle([s.capital, ...wrong], rng).map(c => ({ id: c, label: c })), answer: s.capital });
      } else if (type === 'capital2state') {
        const avoid = statesWithPlace(s.capital);
        Object.assign(q, { type, ask: `${s.capital} is the capital of …`, options: shuffle([s, ...otherStates(s, 3, { hard, rng, avoid })], rng).map(stateOpt), answer: id });
      } else if (type === 'whichCapital') {
        const opts = [...new Set([s.capital, ...s.cities.map(c => c.name)])];
        Object.assign(q, { type, ask: `Which of these cities is the capital of ${s.name}?`, state: id, options: shuffle(opts, rng).map(c => ({ id: c, label: c })), answer: s.capital });
      } else {
        Object.assign(q, { type: 'capitalType', ask: `Type the capital of ${s.name}.`, state: id, answer: s.capital });
      }
    } else if (skill === 'cities') {
      const it = item(p, id, skill);
      const c = s.cities[it.n % s.cities.length];
      const rank = s.cities.indexOf(c) + 1;
      const avoid = statesWithPlace(c.name);
      Object.assign(q, { type: 'city2state', ask: `In which state is ${c.name}?`, city: c.name, cityAt: c.at,
        options: shuffle([s, ...otherStates(s, 3, { hard, rng, avoid })], rng).map(stateOpt), answer: id });
      const where = rank === 1 ? 'the largest city' : `the ${ORDER_WORD(rank)} largest city`;
      q.explain = `${c.name} is ${where} in ${s.name}${c.name === s.capital ? ' – and its capital' : ''}.`;
      const twin = [...avoid].filter(x => x !== id).map(x => BY_ID[x].name);
      if (twin.length) q.explain += ` There’s also a ${c.name} in ${twin.join(' and ')}.`;
      q.say = [audioCity(c.name), { pause: 120 }, audioState(id)];
    }
    return q;
  }

  /* ---------- Eingetippte Antworten: Gross/klein, Akzente, Satzzeichen egal; «St.» = «Saint»; ein Tippfehler ist «fast» */
  const norm = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\bst\.?\s/g, 'saint ').replace(/\bmt\.?\s/g, 'mount ')
    .replace(/[^a-z]/g, '');
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function checkTyped(input, want) {
    const a = norm(input || ''), b = norm(want);
    if (!a) return 'empty';
    if (a === b) return 'right';
    const dist = lev(a, b);
    return dist <= (b.length > 6 ? 2 : 1) ? 'close' : 'wrong';
  }
  // «Name all 50»: welcher Staat ist gemeint? (genau oder mit kleinem Tippfehler, ab 4 Buchstaben)
  function matchState(input, among = D.states) {
    const a = norm(input || '');
    if (a.length < 4) return null;
    let best = null, bd = 9;
    for (const s of among) {
      const b = norm(s.name), d = a === b ? 0 : lev(a, b);
      if (d < bd && d <= (b.length > 7 ? 2 : 1)) { best = s; bd = d; }
    }
    return best;
  }

  const FS = root.FS = {
    D, SKILLS, SKILL_NAME, REGIONS, LEARNED, BY_ID, blank, level, item, stateInfo, answer, summary, streak, pickRound, makeQuestion,
    checkTyped, matchState, statesIn, shuffle, audioState, audioCity, slug, ORDER_WORD,
    fmtPop: n => n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, '')} million` : n.toLocaleString('en-US'),
  };
  if (typeof module !== 'undefined') module.exports = FS;
})(typeof window !== 'undefined' ? window : globalThis);
