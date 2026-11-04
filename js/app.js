/* Fifty Stars – alle Bildschirme. Daten: FS_DATA (data.js), Lernkern: FS (learn.js), Bausteine: UI (ui.js), Ton: Ton (ton.js).
   Gespeichert wird nur auf dem Gerät (localStorage «fiftystars»): Profile mit ihrem Fortschritt und die Einstellungen. */
(function () {
  'use strict';
  const D = window.FS_DATA, { esc } = UI;
  const app = document.getElementById('app'), sheet = document.getElementById('sheet'), fx = document.getElementById('fx');
  const KEY = 'fiftystars';
  const BY = FS.BY_ID;
  const NAMES = Object.fromEntries([...D.states.map(s => [s.id, s.name]), ['dc', D.dc.name]]);
  const sorted = [...D.states].sort((a, b) => a.name.localeCompare(b.name));

  /* ---------- Speicher */
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) { /* leer oder gesperrt */ }
    return { v: 1, profiles: [], current: null, settings: { voice: true, sounds: true, typing: true, theme: 'auto' } };
  }
  const store = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* privat: dann eben nur für diese Sitzung */ } }
  const me = () => store.profiles.find(p => p.id === store.current) || null;
  const P = () => me().p;
  const set = store.settings;
  Ton.klaenge = () => set.sounds;
  const say = (names, append) => { if (set.voice && names && names.length) Ton.say(names, append); };
  function theme() {
    if (set.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.dataset.theme = set.theme;
  }
  theme();

  /* ---------- Symbole */
  const I = {
    gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    speak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
    city: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V10l4-2v13M9 21V4h6v17M15 21V9h4v12M11.5 7.5h1M11.5 11h1M11.5 14.5h1"/></svg>',
    compass: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
    passport: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16.5h6"/></svg>',
    puzzle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4h-4a2 2 0 1 0-4 0H4v-4a2 2 0 1 0 0-4z"/></svg>',
    keys: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h1M9.5 10h1M13 10h1M16.5 10h1M7 14h10"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    road: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3L4 21M16 3l4 18M12 4v3M12 10v3M12 16v3"/></svg>',
  };
  const ic = (n, cls = '') => `<span class="ic ${cls}">${I[n]}</span>`;

  /* ---------- Zustand */
  const S = { view: 'start', scope: 'All', round: null, ch: null, timer: null, prev: null, explore: 'map' };
  const MODES = {
    mixed: { name: 'Road trip', skills: FS.SKILLS },
    flag: { name: 'Flags', skills: ['flag'], icon: 'flag', blurb: 'Know them at a glance' },
    capital: { name: 'Capitals', skills: ['capital'], icon: 'star', blurb: 'The tricky ones too' },
    map: { name: 'Map', skills: ['map'], icon: 'pin', blurb: 'Where is it?' },
    cities: { name: 'Cities', skills: ['cities'], icon: 'city', blurb: 'The three biggest' },
  };
  const SCOPES = [['All', 'All 50'], ['Northeast', 'Northeast'], ['Midwest', 'Midwest'], ['South', 'South'], ['West', 'West']];

  const fmtPop = n => n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, '')} million` : n >= 1e4 ? (Math.round(n / 1000) * 1000).toLocaleString('en-US') : (Math.round(n / 100) * 100).toLocaleString('en-US');
  const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  function show(view, html) {
    clearInterval(S.timer); S.timer = null;
    S.view = view;
    document.body.dataset.view = view;
    app.innerHTML = html;
    window.scrollTo(0, 0);
    requestAnimationFrame(() => app.querySelectorAll('svg.usmap').forEach(UI.fitHits));
  }
  window.addEventListener('resize', () => document.querySelectorAll('svg.usmap').forEach(UI.fitHits));

  /* ================================================================ Profile */
  function start() {
    if (!store.profiles.length) return newProfile(true);
    if (me()) return home();
    return profiles();
  }
  function profiles() {
    const list = store.profiles.map(p => `<button class="plate-pick" data-act="pick" data-id="${p.id}">${UI.plate(p.name, p.plate)}<span>${FS.summary(p.p).stamped} of 50 stamped</span></button>`).join('');
    show('profiles', `<section class="center-page">
      <div class="brand-big">${starRow()}<h1 class="logo">Fifty <em>Stars</em></h1><p class="tag">Learn the 50 states – flags, capitals, cities and the map.</p></div>
      <h2 class="h-small">Who’s on the road?</h2>
      <div class="plates">${list}<button class="plate-pick new" data-act="newprofile"><span class="plus">+</span><span>New traveler</span></button></div>
    </section>`);
  }
  const starRow = () => `<div class="star-row" aria-hidden="true">${('<svg viewBox="-11 -11 22 22"><path d="' + UI.STAR + '"/></svg>').repeat(5)}</div>`;
  let draft = { name: '', plate: 'classic' };
  function newProfile(first) {
    draft = { name: '', plate: 'classic' };
    const sw = Object.keys(UI.PLATES).map((k, i) => `<label class="swatch" style="--bg:${UI.PLATES[k].bg};--ink:${UI.PLATES[k].ink}"><input type="radio" name="plate" value="${k}" ${i ? '' : 'checked'}><span></span><b class="sr">${k}</b></label>`).join('');
    show('newprofile', `<section class="center-page new-profile">
      ${first ? `<div class="brand-big">${starRow()}<h1 class="logo">Fifty <em>Stars</em></h1><p class="tag">Learn the 50 states – flags, capitals, cities and the map.</p></div>` : '<h1 class="h-page">New traveler</h1>'}
      <form class="np-form" data-form="profile" novalidate>
        <div class="np-plate" id="np-plate">${UI.plate('', draft.plate)}</div>
        <label class="field"><span>Your name on the plate</span><input id="np-name" name="name" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go" placeholder="ALEX"></label>
        <p class="err" id="np-err" hidden></p>
        <fieldset class="swatches"><legend>Plate</legend>${sw}</fieldset>
        <div class="row-btns">${first ? '' : '<button type="button" class="btn ghost" data-act="profiles">Cancel</button>'}<button class="btn primary">Hit the road ${ic('next')}</button></div>
      </form>
      ${first ? '<p class="fine">Your progress stays on this device. No account, no sign-up.</p>' : ''}
    </section>`);
    const name = document.getElementById('np-name');
    const redraw = () => { document.getElementById('np-plate').innerHTML = UI.plate(draft.name, draft.plate); };
    name.addEventListener('input', () => { draft.name = name.value.trim(); document.getElementById('np-err').hidden = true; redraw(); });
    app.querySelectorAll('input[name=plate]').forEach(r => r.addEventListener('change', () => { draft.plate = r.value; redraw(); }));
  }
  function createProfile() {
    const err = document.getElementById('np-err');
    if (!draft.name) { err.textContent = 'Enter a name first.'; err.hidden = false; document.getElementById('np-name').focus(); return; }
    if (store.profiles.some(p => p.name.toLowerCase() === draft.name.toLowerCase())) { err.textContent = 'That name is already on the road. Try another.'; err.hidden = false; return; }
    const p = { id: 'p' + Date.now().toString(36), name: draft.name, plate: draft.plate, created: Date.now(), p: FS.blank() };
    store.profiles.push(p); store.current = p.id; save();
    Ton.sfx.done();
    home();
  }

  /* ================================================================ Start */
  function home() {
    const p = P(), sum = FS.summary(p, 'All'), lit = new Set(Object.keys(p.stamps).filter(id => BY[id]));
    const ssum = FS.summary(p, S.scope), streak = FS.streak(p);
    const next = FS.pickRound(p, { scope: S.scope, size: 10 });
    const dueTxt = ssum.due ? plural(ssum.due, 'review') + ' due' : ssum.started < ssum.total ? `${ssum.total - ssum.started} states still to discover` : 'Everything is fresh – keep it that way';
    const skillCount = k => FS.statesIn(S.scope).filter(s => FS.level(p, s.id, k) >= FS.LEARNED).length;
    const modes = ['flag', 'capital', 'map', 'cities'].map(k => `<button class="mode" data-act="round" data-mode="${k}">${ic(MODES[k].icon)}<b>${MODES[k].name}</b><small>${MODES[k].blurb}</small><span class="meter"><i style="width:${(100 * skillCount(k) / ssum.total).toFixed(0)}%"></i></span><span class="meter-n">${skillCount(k)}/${ssum.total}</span></button>`).join('');
    const scopes = SCOPES.map(([k, n]) => `<button class="chip${S.scope === k ? ' on' : ''}" data-act="scope" data-scope="${k}">${n}</button>`).join('');
    const u = me();
    show('home', `<header class="top">
        <button class="plate-btn" data-act="profiles" aria-label="Switch traveler">${UI.plate(u.name, u.plate)}</button>
        <div class="top-title logo small">Fifty <em>Stars</em></div>
        <button class="icon-btn" data-act="settings" aria-label="Settings">${ic('gear')}</button>
      </header>
      <section class="home">
        <div class="hero">
          <div class="hero-img"><img src="img/hero.webp" alt="" draggable="false"></div>
          <button class="hero-flag" data-act="passport" aria-label="Open your passport">${UI.starField(lit)}</button>
          <div class="hero-text"><b>${sum.stamped}</b> of 50 states stamped${streak > 1 ? ` · <span class="streak">${streak}-day streak</span>` : ''}${sum.review ? ` · ${sum.review} to review` : ''}</div>
        </div>
        <div class="trip">
          <div class="chips" role="group" aria-label="Region">${scopes}</div>
          <button class="go" data-act="round" data-mode="mixed">${UI.CAR}<span><b>${sum.started ? 'Continue your road trip' : 'Start your road trip'}</b><small>${next.length} stops${S.scope === 'All' ? '' : ' in the ' + S.scope} · ${dueTxt}</small></span>${ic('next')}</button>
          <h2 class="h-small">Practice</h2>
          <div class="modes">${modes}</div>
          <div class="more">
            <button class="more-btn" data-act="explore">${ic('compass')}<span><b>Explore</b><small>Map and state cards</small></span></button>
            <button class="more-btn" data-act="passport">${ic('passport')}<span><b>Passport</b><small>${sum.stamped} stamps</small></span></button>
            <button class="more-btn" data-act="challenge" data-kind="fill">${ic('puzzle')}<span><b>Fill the map</b><small>${bestTxt('fill')}</small></span></button>
            <button class="more-btn" data-act="challenge" data-kind="name">${ic('keys')}<span><b>Name them all</b><small>${bestTxt('name')}</small></span></button>
          </div>
        </div>
      </section>`);
  }
  function bestTxt(kind) {
    const b = P().best[kind + '-' + S.scope];
    const n = S.scope === 'All' ? '50 states' : `the ${S.scope}`;
    return b ? `Best: ${fmtTime(b.time)}${b.miss ? ` · ${plural(b.miss, 'miss')}`.replace('misss', 'misses') : ''}` : `Against the clock, ${n}`;
  }

  /* ================================================================ Runde */
  function startRound(mode, items) {
    const p = P(), m = MODES[mode] || MODES.mixed;
    items = items || FS.pickRound(p, { scope: S.scope, skills: m.skills, size: 10 });
    if (!items.length) return home();
    S.round = { mode, name: m.name, items, i: 0, results: [], again: new Set(), stampsBefore: new Set(Object.keys(p.stamps)), news: [], badges: [] };
    Ton.preload(items.map(x => FS.audioState(x.id)));
    nextQuestion();
  }
  function nextQuestion() {
    const R = S.round;
    if (R.i >= R.items.length) return summary();
    R.q = FS.makeQuestion(P(), R.items[R.i], { typing: set.typing });
    R.answered = false; R.tries = 0;
    renderQuestion();
  }
  function road() {
    const R = S.round, n = R.items.length;
    const segs = R.items.map((x, i) => `<i class="${i < R.results.length ? (R.results[i].right ? 'ok' : 'no') : i === R.i ? 'cur' : ''}"></i>`).join('');
    const pos = Math.min(100, (100 * (R.i + (R.answered ? 1 : 0.5)) / n)).toFixed(1);
    return `<div class="road" aria-label="Question ${R.i + 1} of ${n}"><div class="segs">${segs}</div><div class="car-on" style="left:${pos}%">${UI.CAR}</div></div>`;
  }
  function renderQuestion() {
    const R = S.round, q = R.q;
    let body = '', cls = q.type;
    const optBtn = (o, i) => `<button class="opt" data-act="opt" data-id="${esc(o.id)}"><span class="key">${i + 1}</span><span class="lbl">${esc(o.label)}</span></button>`;
    if (q.type === 'flag2state') {
      body = `<div class="prompt"><p class="ask">${esc(q.ask)}</p><div class="flag-big">${UI.flagImg(q.flag)}</div></div><div class="opts">${q.options.map(optBtn).join('')}</div>`;
    } else if (q.type === 'state2flag') {
      body = `<div class="prompt"><p class="ask">${esc(q.ask)}</p></div><div class="opts flags">${q.options.map((o, i) => `<button class="opt fl" data-act="opt" data-id="${o.id}"><span class="key">${i + 1}</span>${UI.flagImg(o.id)}</button>`).join('')}</div>`;
    } else if (q.type === 'mapName') {
      body = `<div class="prompt"><p class="ask">${esc(q.ask)}</p><div class="map-box">${UI.map({ view: S.scope, highlight: q.highlight, cls: 'quiz-map' })}</div></div><div class="opts">${q.options.map(optBtn).join('')}</div>`;
    } else if (q.type === 'mapTap') {
      body = `<div class="prompt wide"><p class="ask">${esc(q.ask)}</p><div class="map-box tap" data-act-map="tap">${UI.map({ view: S.scope, hit: true, cls: 'quiz-map tap' })}</div></div>`;
    } else if (q.type === 'capitalType') {
      body = `<div class="prompt"><p class="ask">${esc(q.ask)}</p><div class="state-tag">${UI.flagImg(q.state, 'small')}<b>${esc(BY[q.state].name)}</b></div></div>
        <form class="type-form" data-form="type" novalidate><input id="type-in" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" enterkeyhint="done" placeholder="Capital city" aria-label="Capital city">
        <button class="btn primary">Check</button><p class="err" id="type-err" hidden></p><button type="button" class="btn ghost small" data-act="dunno">Show me</button></form>`;
    } else if (q.type === 'city2state') {
      body = `<div class="prompt"><p class="ask">In which state is</p><p class="big-name">${esc(q.city)}<span>?</span></p></div><div class="opts">${q.options.map(optBtn).join('')}</div>`;
    } else {   // state2capital, capital2state, whichCapital
      const tag = q.state ? `<div class="state-tag">${UI.flagImg(q.state, 'small')}<b>${esc(BY[q.state].name)}</b></div>` : '';
      body = `<div class="prompt"><p class="ask">${esc(q.ask)}</p>${tag}</div><div class="opts">${q.options.map(optBtn).join('')}</div>`;
    }
    show('quiz', `<header class="top quiz-top"><button class="icon-btn" data-act="quit" aria-label="End round">${ic('x')}</button>${road()}<span class="count">${R.i + 1}/${R.items.length}</span></header>
      <section class="quiz ${cls}">${body}<div class="feedback" id="feedback" hidden></div></section>`);
    if (q.type === 'capitalType') setTimeout(() => document.getElementById('type-in')?.focus(), 60);
    if (q.type === 'flag2state' || q.type === 'state2flag' || q.type === 'mapName' || q.type === 'mapTap') { /* stumm: die Antwort nicht verraten */ }
    else if (q.type === 'state2capital' || q.type === 'whichCapital' || q.type === 'capitalType') say([FS.audioState(q.state)]);
  }
  function choose(id) {
    const R = S.round, q = R.q;
    if (R.answered) return;
    const right = id === q.answer;
    app.querySelectorAll('.opt').forEach(b => {
      if (b.dataset.id === q.answer) b.classList.add('right');
      else if (b.dataset.id === id) b.classList.add('wrong');
      b.disabled = true;
    });
    finish(right, right ? '' : wrongNote(q, id));
  }
  function wrongNote(q, id) {
    if (q.type === 'state2flag') return `That one is ${NAMES[id]}.`;
    if (['flag2state', 'mapName', 'city2state', 'capital2state'].includes(q.type)) {
      const s = BY[id];
      if (q.type === 'capital2state') return `The capital of ${s.name} is ${s.capital}.`;
      if (q.type === 'city2state') return '';
      return '';
    }
    if (q.type === 'state2capital' || q.type === 'whichCapital') {
      const s = BY[q.state];
      if (id === s.cities[0].name) return `${id} is the largest city of ${s.name} – but not its capital.`;
      const owner = D.states.find(x => x.capital === id);
      return owner ? `${id} is the capital of ${owner.name}.` : '';
    }
    return '';
  }
  function tapMap(id) {
    const R = S.round, q = R.q;
    if (R.answered || !id || !BY[id]) return;
    const svg = app.querySelector('svg.usmap');
    const path = svg.querySelector(`path[data-id="${id}"]`);
    if (id === q.target) {
      path.classList.add('right-fill');
      return finish(R.tries === 0, R.tries ? `Found it on the second try.` : '');
    }
    R.tries++;
    path.classList.add('bad');
    Ton.sfx.wrong();
    toast(`That’s ${BY[id].name}.`);
    setTimeout(() => path.classList.remove('bad'), 900);
    if (R.tries >= 2) {
      svg.querySelector(`path[data-id="${q.target}"]`).classList.add('reveal');
      finish(false, '');
    }
  }
  function typed(ev) {
    ev.preventDefault();
    const R = S.round, q = R.q;
    if (R.answered) return;
    const input = document.getElementById('type-in'), res = FS.checkTyped(input.value, q.answer), err = document.getElementById('type-err');
    if (res === 'empty') { err.textContent = 'Type an answer first.'; err.hidden = false; input.focus(); return; }
    input.disabled = true;
    input.classList.add(res === 'wrong' ? 'wrong' : 'right');
    finish(res !== 'wrong', res === 'close' ? `Almost perfect – it’s spelled ${q.answer}.` : res === 'wrong' ? `It’s ${q.answer}.` : '');
  }
  function finish(right, note) {
    const R = S.round, q = R.q, p = P();
    R.answered = true;
    const out = FS.answer(p, q.id, q.skill, right);
    R.news.push(...out.stamps); R.badges.push(...out.badges);
    R.results.push({ id: q.id, skill: q.skill, right });
    if (!right && !R.again.has(q.id + q.skill) && R.items.length < 14) { R.again.add(q.id + q.skill); R.items.push({ id: q.id, skill: q.skill }); }
    save();
    if (right) Ton.sfx.right(R.results.filter(r => r.right).length); else if (q.type !== 'mapTap') Ton.sfx.wrong();
    say(q.say);
    const fb = document.getElementById('feedback');
    fb.hidden = false;
    fb.className = 'feedback ' + (right ? 'good' : 'bad');
    fb.innerHTML = `<div class="fb-text"><b>${right ? pick(['Right!', 'Exactly.', 'Spot on.', 'Nice.', 'Yes!']) : 'Not quite.'}</b> <span>${esc(note ? note + ' ' : '')}${esc(q.explain)}</span></div>
      <button class="btn primary" data-act="next" id="next-btn">${R.i + 1 >= R.items.length ? 'Finish' : 'Next'} ${ic('next')}</button>`;
    app.querySelector('.road').outerHTML = road();
    clearTimeout(R.auto);
    if (right && !note && q.type !== 'capitalType') R.auto = setTimeout(() => { if (S.view === 'quiz' && R.answered && S.round === R) advance(); }, 1700);
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function advance() { const R = S.round; clearTimeout(R.auto); R.i++; nextQuestion(); }

  function summary() {
    const R = S.round, p = P();
    p.stats.rounds++; save();
    const right = R.results.filter(r => r.right).length, total = R.results.length;
    const by = new Map();
    for (const r of R.results) { if (!by.has(r.id)) by.set(r.id, []); by.get(r.id).push(r); }
    const rows = [...by].map(([id, rs]) => `<button class="sum-row" data-act="card" data-id="${id}">${UI.shield(BY[id].abbr)}<b>${esc(BY[id].name)}</b><span class="dots">${rs.map(r => `<i class="${r.right ? 'ok' : 'no'}" title="${FS.SKILL_NAME[r.skill]}"></i>`).join('')}</span>${p.stamps[id] ? '<span class="stamped-mini" aria-label="stamped">' + ic('check') + '</span>' : ''}</button>`).join('');
    const sum = FS.summary(p);
    const msg = right === total ? 'A perfect drive!' : right >= total * 0.8 ? 'Great trip!' : right >= total * 0.5 ? 'Good miles today.' : 'Every trip teaches something.';
    show('summary', `<header class="top"><button class="icon-btn" data-act="home" aria-label="Home">${ic('back')}</button><div class="top-title">Trip report</div><span></span></header>
      <section class="summary">
        <div class="sum-head"><div class="score"><b>${right}</b><span>of ${total}</span></div><div><h1 class="h-page">${msg}</h1><p>${sum.stamped} of 50 states stamped${R.news.length ? ` · <b>${plural(R.news.length, 'new stamp')}</b>` : ''}</p></div></div>
        ${R.news.length ? `<div class="new-stamps">${R.news.map(id => `<button class="ns" data-act="card" data-id="${id}">${UI.stamp(BY[id], 'drop')}<span>${esc(BY[id].name)}</span></button>`).join('')}</div>` : ''}
        ${R.badges.length ? `<div class="new-badges">${R.badges.map(r => `<div class="nb">${UI.badge(r)}<span>${r} complete!</span></div>`).join('')}</div>` : ''}
        <div class="sum-list">${rows}</div>
        <div class="row-btns"><button class="btn ghost" data-act="home">Home</button><button class="btn primary" data-act="round" data-mode="${R.mode}">Keep driving ${ic('next')}</button></div>
      </section>`);
    if (R.news.length || R.badges.length) {
      app.querySelectorAll('.new-stamps .ns, .new-badges .nb').forEach((el, i) => {
        el.style.animationDelay = (0.35 + i * 0.55) + 's';
        setTimeout(() => { if (S.view === 'summary') { Ton.fx('fx_stamp'); if (i === 0) setTimeout(() => Ton.sfx.sparkle(), 250); } }, 350 + i * 550);
      });
    } else Ton.sfx.done();
  }

  /* ================================================================ Entdecken und Staatenkarte */
  function explore() {
    const p = P();
    const stamped = new Set(Object.keys(p.stamps));
    const tabs = `<div class="seg" role="tablist"><button role="tab" class="${S.explore === 'map' ? 'on' : ''}" data-act="extab" data-tab="map">Map</button><button role="tab" class="${S.explore === 'list' ? 'on' : ''}" data-act="extab" data-tab="list">A–Z</button></div>`;
    let body;
    if (S.explore === 'map') {
      body = `<div class="chips" role="group" aria-label="Region">${SCOPES.map(([k, n]) => `<button class="chip${S.scope === k ? ' on' : ''}" data-act="exscope" data-scope="${k}">${n}</button>`).join('')}</div>
        <div class="map-box explore-map">${UI.map({ view: S.scope, labels: true, hit: true, dcTap: true, stamped, cls: 'explore tap' })}</div>
        <p class="hint">Tap a state to open its card. ${UI.esc('★')} = stamped in your passport.</p>`;
    } else {
      body = `<div class="az">${sorted.map(s => `<button class="az-item" data-act="card" data-id="${s.id}">${UI.shield(s.abbr)}<span><b>${esc(s.name)}</b><small>${esc(s.capital)}</small></span>${p.stamps[s.id] ? '<span class="stamped-mini">' + ic('check') + '</span>' : ''}</button>`).join('')}
        <button class="az-item dc" data-act="card" data-id="dc">${UI.shield('DC')}<span><b>Washington, D.C.</b><small>Bonus – not a state</small></span></button></div>`;
    }
    show('explore', `<header class="top"><button class="icon-btn" data-act="home" aria-label="Home">${ic('back')}</button><div class="top-title">Explore</div>${tabs}</header><section class="explore">${body}</section>`);
  }
  function card(id) {
    const p = P();
    if (id === 'dc') return dcCard();
    const s = BY[id], info = FS.stateInfo(p, id);
    const idx = sorted.findIndex(x => x.id === id), prev = sorted[(idx + 49) % 50], next = sorted[(idx + 1) % 50];
    const spk = (name, label) => `<button class="spk" data-act="say" data-say="${name}" aria-label="Hear ${esc(label)}">${ic('speak')}</button>`;
    const capNote = s.capitalRank === 1 ? 'also the largest city' : s.capitalRank && s.capitalRank <= 3 ? `the ${FS.ORDER_WORD(s.capitalRank)} largest city` : `not among the 3 largest cities`;
    const cities = s.cities.map((c, i) => `<li><span class="rank">${i + 1}</span><b>${esc(c.name)}</b>${c.name === s.capital ? '<span class="cap-tag">capital</span>' : ''}<span class="pop">${fmtPop(c.pop)}${c.year ? ' (2020)' : ''}</span>${spk(FS.audioCity(c.name), c.name)}</li>`).join('');
    const mapCities = [{ name: s.capital, at: s.capitalAt, cap: true }, ...s.cities.filter(c => c.name !== s.capital).map(c => ({ name: c.name, at: c.at }))];
    const skills = FS.SKILLS.map(k => `<span class="sk lv${Math.min(info.skills[k], 4)}" title="${FS.SKILL_NAME[k]}: level ${info.skills[k]}">${FS.SKILL_NAME[k]}<i></i></span>`).join('');
    sheet.innerHTML = `<div class="sheet-bg" data-act="close"></div><article class="sheet-card state-card" role="dialog" aria-modal="true" aria-label="${esc(s.name)}">
      <div class="sc-top"><button class="icon-btn" data-act="card" data-id="${prev.id}" aria-label="Previous: ${esc(prev.name)}">${ic('back')}</button>
        <span class="sc-nav">${idx + 1} / 50</span>
        <button class="icon-btn" data-act="card" data-id="${next.id}" aria-label="Next: ${esc(next.name)}">${ic('next')}</button>
        <button class="icon-btn close" data-act="close" aria-label="Close">${ic('x')}</button></div>
      <div class="postcard"><img src="img/pc_${s.id}.webp" alt="${esc(s.card)}" draggable="false"><div class="greet"><small>Greetings from</small><span class="gname">${esc(s.name)}</span></div><span class="pc-cap">${esc(s.card)}</span>${info.stamped ? UI.stamp(s, 'on-card') : ''}</div>
      <div class="sc-body">
        <div class="sc-id">${UI.shield(s.abbr, 'big')}<div><h2>${esc(s.name)} ${spk(FS.audioState(s.id), s.name)}</h2><p class="nick">${esc(s.nick)}</p></div>${UI.flagImg(s.id, 'card-flag')}</div>
        <dl class="facts">
          <div><dt>Capital</dt><dd><b>${esc(s.capital)}</b> ${spk(FS.audioCity(s.capital), s.capital)}<small>${capNote}</small></dd></div>
          <div><dt>Region</dt><dd>${s.region}</dd></div>
          <div><dt>Joined the Union</dt><dd>${s.year} <small>${FS.ORDER_WORD(s.order)} state</small></dd></div>
          <div><dt>Abbreviation</dt><dd>${s.abbr}</dd></div>
        </dl>
        <h3>Largest cities</h3><ol class="cities">${cities}</ol>
        ${miniMap(s, mapCities)}
        <p class="fact">${esc(s.fact)}</p>
        <div class="sc-progress"><span class="sk-title">Your progress</span>${skills}</div>
        <div class="row-btns"><button class="btn primary" data-act="quizstate" data-id="${s.id}">Quiz me on ${esc(s.name)} ${ic('next')}</button></div>
      </div></article>`;
    openSheet();
    say([FS.audioState(s.id)]);
  }
  // Kleine Karte auf der Staatenkarte: Punkte und Namen als HTML darüber, damit sie auf jedem Bildschirm gleich gross und lesbar sind
  function miniMap(s, cities) {
    const vb = UI.viewBox(s.id), pos = at => [(100 * (at[0] - vb[0]) / vb[2]), (100 * (at[1] - vb[1]) / vb[3])];
    // Namen so setzen, dass sie sich nicht überdecken: gerechnet für eine 380 px breite Karte (iPhone, der engste Fall);
    // für jeden Namen die erste freie von sechs Lagen (rechts, links, oben/unten rechts, oben/unten links)
    const W = 380, H = W * vb[3] / vb[2], boxes = [];
    const pts = cities.map(c => { const [x, y] = pos(c.at); return { c, x, y, px: x * W / 100, py: y * H / 100 }; });
    pts.forEach(p => boxes.push([p.px - 7, p.py - 7, p.px + 7, p.py + 7]));
    const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
    const marks = pts.map(p => {
      const w = 7.8 * p.c.name.length + 6, { px: x, py: y } = p;
      const opts = { r: [x + 10, y - 9, x + 10 + w, y + 9], l: [x - 10 - w, y - 9, x - 10, y + 9], tr: [x + 3, y - 26, x + 3 + w, y - 8],
        br: [x + 3, y + 8, x + 3 + w, y + 26], tl: [x - 3 - w, y - 26, x - 3, y - 8], bl: [x - 3 - w, y + 8, x - 3, y + 26] };
      const score = b => boxes.filter(o => hit(o, b)).length * 10 + (b[0] < 0 || b[2] > W || b[1] < 0 || b[3] > H ? 3 : 0);
      const best = Object.keys(opts).reduce((a, k) => (score(opts[k]) < score(opts[a]) ? k : a), 'r');
      boxes.push(opts[best]);
      return `<span class="mm-m ${best}${p.c.cap ? ' cap' : ''}" style="left:${p.x.toFixed(2)}%;top:${p.y.toFixed(2)}%"><i>${p.c.cap ? '★' : ''}</i><b>${esc(p.c.name)}</b></span>`;
    }).join('');
    return `<div class="mini-map"><div class="mm-in" style="aspect-ratio:${vb[2]} / ${vb[3]}">${UI.map({ view: s.id, dc: false, cls: 'mini', aria: `Map of ${s.name} with its capital and largest cities` })}${marks}</div></div>`;
  }
  function dcCard() {
    const s = D.dc, got = P().bonus.dc;
    sheet.innerHTML = `<div class="sheet-bg" data-act="close"></div><article class="sheet-card state-card" role="dialog" aria-modal="true" aria-label="Washington, D.C.">
      <div class="sc-top"><span class="sc-nav">Bonus</span><button class="icon-btn close" data-act="close" aria-label="Close">${ic('x')}</button></div>
      <div class="postcard"><img src="img/pc_dc.webp" alt="${esc(s.card)}" draggable="false"><div class="greet"><small>Greetings from</small><span class="gname">Washington, D.C.</span></div><span class="pc-cap">${esc(s.card)}</span>${got ? UI.stamp({ ...s, order: 51 }, 'on-card') : ''}</div>
      <div class="sc-body">
        <div class="sc-id">${UI.shield('DC', 'big')}<div><h2>Washington, D.C. <button class="spk" data-act="say" data-say="st_dc" aria-label="Hear Washington, D.C.">${ic('speak')}</button></h2><p class="nick">${esc(s.nick)}</p></div>${UI.flagImg('dc', 'card-flag')}</div>
        <dl class="facts"><div><dt>Population</dt><dd>${fmtPop(s.pop)}</dd></div><div><dt>Founded</dt><dd>${s.year}</dd></div></dl>
        <p class="fact">${esc(s.fact)}</p>
        <p class="hint">${got ? 'You have the bonus stamp for D.C.' : 'Bonus stamp: fill the whole map or name all 50 states once.'}</p>
      </div></article>`;
    openSheet();
    say(['st_dc']);
  }
  function openSheet() { sheet.classList.add('open'); document.body.classList.add('has-sheet'); sheet.scrollTop = 0; const c = sheet.querySelector('.sheet-card'); if (c) c.scrollTop = 0; requestAnimationFrame(() => sheet.querySelectorAll('svg.usmap').forEach(UI.fitHits)); }
  function closeSheet() { sheet.classList.remove('open'); document.body.classList.remove('has-sheet'); sheet.innerHTML = ''; Ton.stop(); if (S.view === 'home') home(); }

  /* ================================================================ Pass */
  function passport(tab) {
    const p = P();
    tab = tab || S.ppTab || 'Northeast';
    S.ppTab = tab;
    const tabs = [...FS.REGIONS, 'Bonus'].map(r => `<button role="tab" class="${tab === r ? 'on' : ''}" data-act="pptab" data-tab="${r}">${r}</button>`).join('');
    let page;
    if (tab === 'Bonus') {
      const got = p.bonus.dc;
      page = `<div class="pp-head"><div><h2>Bonus</h2><p>Washington, D.C. – the nation’s capital, not a state.</p></div></div>
        <div class="pp-grid"><button class="slot${got ? ' got' : ''}" data-act="card" data-id="dc">${got ? UI.stamp({ ...D.dc, order: 51 }) : `<span class="empty">${UI.shield('DC')}</span>`}<span>Washington, D.C.</span></button></div>
        <p class="hint">${got ? 'Stamped – you completed an all-50 challenge.' : 'Fill the whole map or name all 50 states once to earn it.'}</p>`;
    } else {
      const list = FS.statesIn(tab).sort((a, b) => a.name.localeCompare(b.name));
      const n = list.filter(s => p.stamps[s.id]).length;
      page = `<div class="pp-head">${UI.badge(tab, !!p.badges[tab])}<div><h2>The ${tab}</h2><p>${n} of ${list.length} stamped${p.badges[tab] ? ' · region complete' : ''}</p></div></div>
        <div class="pp-grid">${list.map(s => {
          const info = FS.stateInfo(p, s.id);
          const dots = FS.SKILLS.map(k => `<i class="${info.skills[k] >= FS.LEARNED ? 'ok' : info.skills[k] ? 'half' : ''}"></i>`).join('');
          return `<button class="slot${info.stamped ? ' got' : ''}${info.review ? ' review' : ''}" data-act="card" data-id="${s.id}">${info.stamped ? UI.stamp(s) : `<span class="empty">${UI.shield(s.abbr)}<span class="dots">${dots}</span></span>`}<span>${esc(s.name)}${info.review ? ' <em>review</em>' : ''}</span></button>`;
        }).join('')}</div>`;
    }
    show('passport', `<header class="top"><button class="icon-btn" data-act="home" aria-label="Home">${ic('back')}</button><div class="top-title">Passport</div><span></span></header>
      <section class="passport"><div class="pp-book"><div class="pp-cover-strip"><span>PASSPORT</span><b>${esc(me().name.toUpperCase())}</b><span>${Object.keys(p.stamps).length}/50</span></div>
      <div class="seg pp-tabs" role="tablist">${tabs}</div><div class="pp-page">${page}</div></div>
      <p class="hint center">A state gets its stamp when you know its map, flag, capital and cities. The four dots show how far you are.</p></section>`);
  }

  /* ================================================================ Herausforderungen */
  function challenge(kind) {
    const list = FS.statesIn(S.scope);
    S.ch = { kind, scope: S.scope, ids: FS.shuffle(list.map(s => s.id)), i: 0, tries: 0, miss: 0, filled: new Set(), missed: new Set(), start: 0, done: false, firstWrong: new Set() };
    const what = S.scope === 'All' ? 'all 50 states' : `the ${list.length} states of the ${S.scope}`;
    const intro = kind === 'fill'
      ? `<h1 class="h-page">Fill the map</h1><p>Tap each state as it’s called – ${what}. Every wrong tap counts as a miss.</p>`
      : `<h1 class="h-page">Name them all</h1><p>Type ${what} from memory, in any order. Each one you get lands on the map.</p>`;
    const b = P().best[kind + '-' + S.scope];
    show('challenge', `<header class="top"><button class="icon-btn" data-act="home" aria-label="Home">${ic('back')}</button><div class="top-title">Challenge</div><span></span></header>
      <section class="center-page ch-intro">${intro}
      <div class="chips" role="group" aria-label="Region">${SCOPES.map(([k, n]) => `<button class="chip${S.scope === k ? ' on' : ''}" data-act="chscope" data-kind="${kind}" data-scope="${k}">${n}</button>`).join('')}</div>
      ${b ? `<p class="best">Your best: ${fmtTime(b.time)}${kind === 'fill' ? ` with ${plural(b.miss, 'miss')}`.replace('misss', 'misses') : ''}</p>` : ''}
      <button class="btn primary big" data-act="chgo">Start the clock ${ic('next')}</button></section>`);
  }
  function chRender() {
    const C = S.ch, total = C.ids.length;
    if (C.kind === 'fill') {
      const cur = BY[C.ids[C.i]];
      show('play', `<header class="top"><button class="icon-btn" data-act="home" aria-label="Stop">${ic('x')}</button><div class="top-title ch-find">${cur ? `Find <b>${esc(cur.name)}</b>` : 'Done!'}</div><span class="clock" id="clock">0:00</span></header>
        <section class="play"><div class="ch-stats"><span>${C.filled.size + C.missed.size}/${total}</span><span>${plural(C.miss, 'miss')}`.replace('misss', 'misses') + `</span></div>
        <div class="map-box tap" data-act-map="fill">${UI.map({ view: C.scope, hit: true, filled: C.filled, missed: C.missed, cls: 'quiz-map tap' })}</div></section>`);
      if (cur) say([FS.audioState(cur.id)]);
    } else {
      show('play', `<header class="top"><button class="icon-btn" data-act="home" aria-label="Stop">${ic('x')}</button><div class="top-title">Name them all</div><span class="clock" id="clock">0:00</span></header>
        <section class="play name-all"><form class="type-form" data-form="name" novalidate><input id="name-in" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" enterkeyhint="done" placeholder="Type a state" aria-label="Type a state">
        <button type="button" class="btn ghost small" data-act="giveup">I’m done</button></form>
        <div class="ch-stats"><span id="found-n">${C.filled.size}/${total}</span><span id="name-msg" class="msg"></span></div>
        <div class="map-box">${UI.map({ view: C.scope, filled: C.filled, cls: 'quiz-map', labels: false })}</div></section>`);
      const input = document.getElementById('name-in');
      input.addEventListener('input', () => nameInput(input, false));
      setTimeout(() => input.focus(), 60);
    }
    tick();
    S.timer = setInterval(tick, 500);
  }
  function tick() { const c = document.getElementById('clock'); if (c && S.ch.start) c.textContent = fmtTime((Date.now() - S.ch.start) / 1000); }
  function fillTap(id) {
    const C = S.ch;
    if (C.done || !id || !BY[id] || C.filled.has(id) || C.missed.has(id)) return;
    const target = C.ids[C.i], svg = app.querySelector('svg.usmap');
    if (id === target) {
      if (!C.firstWrong.has(target)) FS.answer(P(), target, 'map', true);
      C.filled.add(id); Ton.sfx.right(C.filled.size % 10 + 1); C.i++; C.tries = 0;
      return C.i >= C.ids.length ? chEnd() : chRender();
    }
    C.miss++; C.tries++;
    if (!C.firstWrong.has(target)) { C.firstWrong.add(target); FS.answer(P(), target, 'map', false); }
    Ton.sfx.wrong();
    const el = svg.querySelector(`path[data-id="${id}"]`);
    el.classList.add('bad'); setTimeout(() => el.classList.remove('bad'), 800);
    toast(`That’s ${BY[id].name}.`);
    const st = app.querySelector('.ch-stats span:last-child'); if (st) st.textContent = plural(C.miss, 'miss').replace('misss', 'misses');
    if (C.tries >= 3) {
      svg.querySelector(`path[data-id="${target}"]`).classList.add('reveal');
      C.missed.add(target); C.i++; C.tries = 0;
      setTimeout(() => (C.i >= C.ids.length ? chEnd() : chRender()), 1300);
      C.done = C.i >= C.ids.length;
    }
  }
  function nameInput(input, submit) {
    const C = S.ch, msg = document.getElementById('name-msg');
    const left = C.ids.filter(id => !C.filled.has(id)).map(id => BY[id]);
    const norm = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    const v = norm(input.value);
    if (!v) return;
    let s = left.find(x => norm(x.name) === v);
    if (!s && submit) {
      const exactDone = D.states.find(x => norm(x.name) === v);
      if (exactDone && C.filled.has(exactDone.id)) { msg.textContent = `${exactDone.name} is already on the map.`; input.value = ''; return; }
      s = FS.matchState(input.value, left);
      if (s && D.states.some(x => x !== s && norm(x.name) === v)) s = null;   // «Kansas» ist nie «Arkansas»
      if (!s) { msg.textContent = exactDone && !left.includes(exactDone) ? `${exactDone.name} isn’t in the ${C.scope}.` : 'Not a state – check the spelling.'; Ton.sfx.wrong(); input.select(); return; }
      msg.textContent = `Got it: ${s.name}`;
    }
    if (!s) return;
    if (!C.start) C.start = Date.now();
    C.filled.add(s.id); input.value = '';
    if (!submit) msg.textContent = s.name;
    Ton.sfx.right(C.filled.size % 10 + 1);
    const path = app.querySelector(`svg.usmap path[data-id="${s.id}"]`); if (path) path.classList.add('filled', 'pop');
    document.getElementById('found-n').textContent = `${C.filled.size}/${C.ids.length}`;
    if (C.filled.size === C.ids.length) chEnd();
  }
  function chEnd(gaveUp) {
    const C = S.ch, p = P();
    if (C.done && S.view === 'result') return;
    C.done = true; clearInterval(S.timer);
    const time = Math.round((Date.now() - C.start) / 1000), total = C.ids.length;
    const got = C.filled.size, all = got === total;
    if (C.kind === 'name' && gaveUp) C.ids.filter(id => !C.filled.has(id)).forEach(id => C.missed.add(id));
    let record = false, bonus = false;
    if (all || C.kind === 'fill') {
      const k = C.kind + '-' + C.scope, b = p.best[k], score = { time, miss: C.kind === 'fill' ? C.miss : 0 };
      if (C.kind === 'name' ? all : true) {
        if (!b || score.miss < b.miss || (score.miss === b.miss && score.time < b.time)) { p.best[k] = score; record = !!b; if (!b) record = false; }
      }
      if (C.scope === 'All' && (C.kind === 'fill' || all) && !p.bonus.dc) { p.bonus.dc = Date.now(); bonus = true; }
    }
    save();
    const head = C.kind === 'fill' ? `${got} of ${total} found` : all ? `All ${total} named!` : `${got} of ${total} named`;
    const sub = C.kind === 'fill' ? `${fmtTime(time)} · ${plural(C.miss, 'miss')}`.replace('misss', 'misses') : fmtTime(time);
    show('result', `<header class="top"><button class="icon-btn" data-act="home" aria-label="Home">${ic('back')}</button><div class="top-title">${C.kind === 'fill' ? 'Fill the map' : 'Name them all'}</div><span></span></header>
      <section class="result"><div class="sum-head"><div class="score"><b>${fmtTime(time)}</b></div><div><h1 class="h-page">${head}</h1><p>${sub}${record ? ' · <b>new best!</b>' : ''}</p></div></div>
      ${bonus ? `<div class="new-stamps"><div class="ns">${UI.stamp({ ...D.dc, order: 51 }, 'drop')}<span>Bonus stamp: Washington, D.C.</span></div></div>` : ''}
      <div class="map-box">${UI.map({ view: C.scope, filled: C.filled, missed: C.missed, labels: true, cls: 'quiz-map' })}</div>
      ${C.missed.size ? `<p class="hint">Missed: ${[...C.missed].map(id => BY[id].name).sort().join(', ')}</p>` : ''}
      <div class="row-btns"><button class="btn ghost" data-act="home">Home</button><button class="btn primary" data-act="challenge" data-kind="${C.kind}">Try again ${ic('next')}</button></div></section>`);
    Ton.sfx.done();
    if (bonus) setTimeout(() => Ton.fx('fx_stamp'), 400);
  }

  /* ================================================================ Einstellungen */
  function settings() {
    const u = me();
    const tog = (k, label, sub) => `<label class="toggle"><span><b>${label}</b><small>${sub}</small></span><input type="checkbox" data-set="${k}" ${set[k] ? 'checked' : ''}><i></i></label>`;
    sheet.innerHTML = `<div class="sheet-bg" data-act="close"></div><article class="sheet-card settings" role="dialog" aria-modal="true" aria-label="Settings">
      <div class="sc-top"><h2>Settings</h2><button class="icon-btn close" data-act="close" aria-label="Close">${ic('x')}</button></div>
      ${tog('voice', 'Voice', 'Hear the names of states and cities')}
      ${tog('sounds', 'Sounds', 'Little chimes for right and wrong')}
      ${tog('typing', 'Type capitals', 'Once you know a capital, type it instead of picking it')}
      <div class="field-row"><b>Look</b><div class="seg">${[['auto', 'Auto'], ['light', 'Day'], ['dark', 'Night']].map(([k, n]) => `<button class="${set.theme === k ? 'on' : ''}" data-act="theme" data-theme="${k}">${n}</button>`).join('')}</div></div>
      <h3>Traveler: ${esc(u.name)}</h3>
      <div class="row-btns left"><button class="btn ghost" data-act="profiles">Switch traveler</button><button class="btn ghost danger" data-act="reset">Reset progress</button><button class="btn ghost danger" data-act="delprofile">Remove traveler</button></div>
      <p class="err" id="set-msg" hidden></p>
      <h3>About</h3>
      <p class="small-print">Map, cities and population: U.S. Census Bureau (2024 boundaries, 2025 estimates; Hawaii: 2020 Census). Flags: Flagpedia and Wikimedia Commons (public domain). Postcards: drawn with OpenAI. Voice: ElevenLabs. Fonts: Alfa Slab One and Libre Franklin (SIL Open Font License). Your progress stays on this device.</p>
      <p class="small-print">Version ${esc(window.BUILD)}</p>
    </article>`;
    openSheet();
  }
  let confirmAct = null;
  function confirmTwice(act, text, run) {
    const msg = document.getElementById('set-msg');
    if (confirmAct === act) { confirmAct = null; return run(); }
    confirmAct = act; msg.textContent = text; msg.hidden = false;
    setTimeout(() => { if (confirmAct === act) { confirmAct = null; if (msg.isConnected) msg.hidden = true; } }, 4000);
  }

  /* ---------- kleine Meldung */
  let toastT;
  function toast(t) {
    let el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = t; el.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1600);
  }

  /* ================================================================ Bedienung (ein Zuhörer für alles) */
  function onClick(ev) {
    const mapBox = ev.target.closest('[data-act-map]');
    if (mapBox) {
      const svg = mapBox.querySelector('svg.usmap'), scope = S.ch && mapBox.dataset.actMap === 'fill' ? S.ch.scope : S.scope;
      const id = svg && UI.stateAt(svg, ev, new Set(FS.statesIn(scope).map(s => s.id)));
      if (mapBox.dataset.actMap === 'tap') return tapMap(id);
      if (mapBox.dataset.actMap === 'fill') return fillTap(id);
    }
    const exBox = ev.target.closest('.explore-map');
    if (exBox) {
      const id = UI.stateAt(exBox.querySelector('svg.usmap'), ev, new Set([...FS.statesIn(S.scope).map(s => s.id)]));
      if (id) { Ton.sfx.tap(); return card(id); }
      return;
    }
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act, d = b.dataset;
    switch (a) {
      case 'pick': store.current = d.id; save(); Ton.sfx.tap(); return home();
      case 'newprofile': return newProfile(false);
      case 'profiles': closeSheetQuiet(); return profiles();
      case 'home': closeSheetQuiet(); return home();
      case 'settings': return settings();
      case 'scope': S.scope = d.scope; Ton.sfx.tap(); return home();
      case 'round': closeSheetQuiet(); Ton.sfx.tap(); return startRound(d.mode);
      case 'opt': return choose(d.id);
      case 'next': return advance();
      case 'dunno': { const R = S.round; if (!R.answered) { const i = document.getElementById('type-in'); i.disabled = true; finish(false, `It’s ${R.q.answer}.`); } return; }
      case 'quit': Ton.stop(); return S.round.results.length ? summary() : home();
      case 'explore': return explore();
      case 'extab': S.explore = d.tab; return explore();
      case 'exscope': S.scope = d.scope; return explore();
      case 'card': return card(d.id);
      case 'close': return closeSheet();
      case 'say': return Ton.say([d.say]);
      case 'quizstate': { closeSheetQuiet(); const items = FS.shuffle(FS.SKILLS.map(k => ({ id: d.id, skill: k }))); return startRound('mixed', items); }
      case 'passport': Ton.fx('fx_page'); return passport();
      case 'pptab': Ton.fx('fx_page'); return passport(d.tab);
      case 'challenge': return challenge(d.kind);
      case 'chscope': S.scope = d.scope; return challenge(d.kind);
      case 'chgo': S.ch.start = Date.now(); return chRender();
      case 'giveup': return chEnd(true);
      case 'theme': set.theme = d.theme; save(); theme(); return settings();
      case 'reset': return confirmTwice('reset', 'Tap again to erase all progress of this traveler.', () => { me().p = FS.blank(); save(); closeSheet(); home(); });
      case 'delprofile': return confirmTwice('del', 'Tap again to remove this traveler and all their stamps.', () => {
        store.profiles = store.profiles.filter(p => p.id !== store.current); store.current = null; save(); closeSheetQuiet(); start();
      });
    }
  }
  function closeSheetQuiet() { sheet.classList.remove('open'); document.body.classList.remove('has-sheet'); sheet.innerHTML = ''; }
  app.addEventListener('click', onClick);
  sheet.addEventListener('click', onClick);
  sheet.addEventListener('change', ev => { const k = ev.target.dataset && ev.target.dataset.set; if (k) { set[k] = ev.target.checked; save(); if (k === 'sounds' && set.sounds) Ton.sfx.tap(); } });
  document.addEventListener('submit', ev => {
    const f = ev.target.dataset.form;
    if (f === 'profile') { ev.preventDefault(); return createProfile(); }
    if (f === 'type') return typed(ev);
    if (f === 'name') { ev.preventDefault(); return nameInput(document.getElementById('name-in'), true); }
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && sheet.classList.contains('open')) return closeSheet();
    if (S.view !== 'quiz' || ev.target.tagName === 'INPUT') return;
    const R = S.round;
    if (!R.answered && /^[1-4]$/.test(ev.key)) { const o = app.querySelectorAll('.opt')[+ev.key - 1]; if (o) o.click(); }
    else if (R.answered && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); advance(); }
  });

  /* ---------- für die Browser-Tests (nur lesen) */
  window.FS_TEST = () => ({ view: S.view, q: S.round && S.round.q, i: S.round && S.round.i, n: S.round && S.round.items.length, answered: S.round && S.round.answered, ch: S.ch && { kind: S.ch.kind, target: S.ch.ids[S.ch.i], left: S.ch.ids.filter(id => !S.ch.filled.has(id)), done: S.ch.done }, stamps: me() ? Object.keys(P().stamps).length : 0 });

  /* ---------- Offline (nur in der gebauten App) */
  // Neu laden nur bei einem neuen App-Stand – nicht beim allerersten Einrichten (2026-11-04: Safari lud sonst mitten im
  // Profil-Formular neu) und nie mitten in einer Runde, einem Spiel, einem Formular oder bei offener Staatenkarte.
  if ('serviceWorker' in navigator && window.BUILD !== 'dev') {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded || !hadController) return;
      const calm = ['home', 'profiles', 'explore', 'passport', 'summary', 'result'];
      const later = () => { if (!calm.includes(S.view) || sheet.classList.contains('open')) return setTimeout(later, 3000); reloaded = true; location.reload(); };
      later();
    });
  }
  start();
})();
