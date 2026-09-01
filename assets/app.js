/* Plano Alimentar — PWA offline, sem build step.
   Dia lógico vira às 05:00: o que for marcado de madrugada conta no dia anterior. */
(() => {
  'use strict';

  const STORAGE_KEY = 'saude.plano.v1';
  const RESET_HOUR = 5;
  const APP_VERSION = '1.0.0';

  /* ---------------- estado ---------------- */

  const DEFAULT_STATE = () => ({
    version: 1,
    prefs: { goalCups: 12, cupMl: 250, lancheOption: 1 },
    subs: {},   // "mealId_itemId" -> índice do substituto (-1 = padrão)
    days: {},   // "AAAA-MM-DD" -> { water: Number }
    body: []    // [{ date, weight, waist, hip, chest, arm, note }]
  });

  let state = load();
  let view = 'hoje';
  let activeMealTab = 'cafe';
  let bodyFormOpen = false;   // formulário de medidas começa fechado
  let todayKey;   // definido em render(); os helpers de data são declarados abaixo

  function load() {
    const base = DEFAULT_STATE();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      const saved = JSON.parse(raw);
      return {
        ...base, ...saved,
        prefs: { ...base.prefs, ...(saved.prefs || {}) },
        subs: saved.subs || {},
        days: saved.days || {},
        body: Array.isArray(saved.body) ? saved.body : []
      };
    } catch (e) {
      console.warn('Estado inválido no armazenamento, começando do zero.', e);
      return base;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      toast('Não consegui salvar (armazenamento cheio?)');
    }
  }

  /* ---------------- datas ---------------- */

  const pad = (n) => String(n).padStart(2, '0');
  const fmtKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function dayKey(date = new Date()) {
    return fmtKey(new Date(date.getTime() - RESET_HOUR * 3600e3));
  }
  function keyToDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function shiftKey(key, days) {
    const d = keyToDate(key);
    d.setDate(d.getDate() + days);
    return fmtKey(d);
  }
  const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const WEEKDAYS_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function longLabel(key) {
    const d = keyToDate(key);
    return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  }
  function labelKey(key) {
    const d = keyToDate(key);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  }
  function weekday(key) { return WEEKDAYS[keyToDate(key).getDay()]; }

  function day(key = todayKey) {
    if (!state.days[key]) state.days[key] = { water: 0 };
    const d = state.days[key];
    if (typeof d.water !== 'number') d.water = 0;
    return d;
  }
  const dayOrNull = (key) => state.days[key] || null;

  /* ---------------- regras do plano ---------------- */

  const waterOf = (key) => (state.days[key] ? state.days[key].water || 0 : 0);
  const mlOf = (key) => waterOf(key) * state.prefs.cupMl;
  const hitGoal = (key) => waterOf(key) >= state.prefs.goalCups;

  /* dias seguidos batendo a meta de água (hoje só conta se já bateu) */
  function streak() {
    let n = 0;
    let key = hitGoal(todayKey) ? todayKey : shiftKey(todayKey, -1);
    while (hitGoal(key)) { n++; key = shiftKey(key, -1); }
    return n;
  }

  function resolvedMealId(tabId) {
    return tabId === 'lanche' ? (state.prefs.lancheOption === 2 ? 'lanche_2' : 'lanche_1') : tabId;
  }
  const mealById = (id) => MEALS_DATA.find((m) => m.id === id) || MEALS_DATA[0];

  function selectionFor(mealId, item) {
    const idx = state.subs[`${mealId}_${item.id}`];
    if (typeof idx === 'number' && idx >= 0 && item.substitutes[idx]) {
      const sub = item.substitutes[idx];
      return { name: sub.name, qty: sub.qty, isSub: true, idx };
    }
    return { name: item.name, qty: item.defaultQty, isSub: false, idx: -1 };
  }

  /* ---------------- utilidades de UI ---------------- */

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (id) => document.getElementById(id);
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let toastTimer;
  function toast(msg) {
    const t = el('toast');
    t.textContent = msg;
    t.hidden = false;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* cai no fallback */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function mealAsText(mealId) {
    const meal = mealById(mealId);
    let text = `*${meal.name}* (${meal.time})\n\n`;
    meal.items.forEach((item) => {
      const sel = selectionFor(mealId, item);
      text += `• ${sel.name}: ${sel.qty}\n`;
    });
    if (meal.notes) text += `\nObs: ${meal.notes}`;
    return text;
  }

  /* ---------------- pedaços reutilizáveis (permitem atualizar só o que mudou) ---------------- */

  const waterAmountInner = (d) =>
    `${d.water * state.prefs.cupMl}<span class="goal">ml / ${state.prefs.goalCups * state.prefs.cupMl}ml</span>`;

  const waterHint = (d) => d.water >= state.prefs.goalCups
    ? 'Meta batida hoje ✓'
    : `Faltam ${(state.prefs.goalCups - d.water) * state.prefs.cupMl}ml — cada ponto = ${state.prefs.cupMl}ml`;

  function itemInner(mealId, item) {
    const sel = selectionFor(mealId, item);
    const zero = /^0[\s.,]/.test(sel.qty) || /\(0g\)/.test(sel.qty);
    const chips = item.substitutes.length ? `
      <div class="chips">
        <button class="chip ${!sel.isSub ? 'is-active' : ''}" data-act="sub" data-meal="${mealId}" data-item="${item.id}" data-idx="-1">Padrão</button>
        ${item.substitutes.map((sub, i) => `
          <button class="chip ${sel.idx === i ? 'is-active' : ''}" data-act="sub" data-meal="${mealId}" data-item="${item.id}" data-idx="${i}">${escapeHtml(sub.name)}</button>`).join('')}
      </div>` : '';
    return `
      <div class="item-row">
        <span class="item-name ${sel.isSub ? 'is-sub' : ''}">${escapeHtml(sel.name)}</span>
        <span class="item-qty ${zero ? 'is-zero' : ''}">${escapeHtml(sel.qty)}</span>
      </div>
      ${chips}`;
  }

  /* Atualizações pontuais: nada de redesenhar a tela inteira a cada toque. */

  function paintWater() {
    const d = dayOrNull(todayKey) || { water: 0 };
    document.querySelectorAll('.water-dot').forEach((b) =>
      b.classList.toggle('is-on', Number(b.dataset.cups) <= d.water));
    const amount = $('.water-amount');
    if (amount) amount.innerHTML = waterAmountInner(d);
    const hint = $('.water-hint');
    if (hint) hint.textContent = waterHint(d);
  }

  function paintItem(mealId, itemId) {
    const item = mealById(mealId).items.find((i) => i.id === itemId);
    const node = $(`.item[data-item="${itemId}"]`);
    if (item && node) node.innerHTML = itemInner(mealId, item);
  }

  /* ---------------- view: HOJE ---------------- */

  function viewHoje() {
    const d = dayOrNull(todayKey) || { water: 0 };
    const goal = state.prefs.goalCups;
    const cup = state.prefs.cupMl;
    const tabId = activeMealTab;
    const mealId = resolvedMealId(tabId);
    const meal = mealById(mealId);

    const dots = Array.from({ length: goal }, (_, i) => {
      const v = i + 1;
      return `<button class="water-dot ${v <= d.water ? 'is-on' : ''}" data-act="water" data-cups="${v}"
        aria-label="${v * cup}ml"><i></i></button>`;
    }).join('');

    const tabs = MEAL_TABS.map((t) => `
      <button class="meal-tab ${t.id === tabId ? 'is-active' : ''}" data-act="tab" data-tab="${t.id}">${t.label}</button>`).join('');

    const segmented = tabId === 'lanche' ? `
      <div class="segmented">
        <div class="segmented-inner">
          <button data-act="lanche" data-opt="1" class="${state.prefs.lancheOption === 1 ? 'is-active' : ''}">Opção 1</button>
          <button data-act="lanche" data-opt="2" class="${state.prefs.lancheOption === 2 ? 'is-active' : ''}">Opção 2</button>
        </div>
      </div>` : '';

    const items = meal.items
      .map((item) => `<div class="item" data-item="${item.id}">${itemInner(mealId, item)}</div>`)
      .join('');

    const title = tabId === 'lanche' ? `LANCHE — OPÇÃO ${state.prefs.lancheOption}` : meal.name;

    return `
      <section class="divider">
        <div class="water-head">
          <span class="section-label" style="margin:0">Consumo de Água</span>
          <span class="water-amount">${waterAmountInner(d)}</span>
        </div>
        <div class="water-dots">${dots}</div>
        <p class="water-hint">${waterHint(d)}</p>
      </section>

      <section>
        <span class="section-label">Guia de refeições</span>
        <div class="meal-tabs">${tabs}</div>
      </section>

      ${segmented}

      <section class="fade-in">
        <div class="meal-head">
          <div>
            <h2 class="meal-title">${escapeHtml(title)}</h2>
            <span class="meal-time">⏰ ${escapeHtml(meal.time)}</span>
          </div>
          <div class="meal-actions">
            <button class="link-btn" data-act="copy" data-meal="${mealId}">Copiar</button>
          </div>
        </div>
        <div class="items">${items}</div>
        ${meal.notes ? `<div class="note">💡 ${escapeHtml(meal.notes)}</div>` : ''}
      </section>`;
  }

  /* ---------------- view: HISTÓRICO ---------------- */

  function viewHistorico() {
    const days30 = Array.from({ length: 30 }, (_, i) => shiftKey(todayKey, -(29 - i)));
    const tracked = days30.filter((k) => waterOf(k) > 0);
    const goalDays = days30.filter(hitGoal).length;
    const pct = tracked.length ? Math.round((goalDays / tracked.length) * 100) : 0;
    const avg = tracked.length
      ? Math.round(tracked.reduce((a, k) => a + mlOf(k), 0) / tracked.length)
      : 0;

    const cells = days30.map((key) => {
      const ratio = waterOf(key) / state.prefs.goalCups;
      const level = ratio <= 0 ? 0 : Math.max(1, Math.min(4, Math.ceil(ratio * 4)));
      return `<div class="heat-cell ${key === todayKey ? 'is-today' : ''}" data-level="${level}"
        title="${labelKey(key)} — ${mlOf(key)}ml"></div>`;
    }).join('');

    const weights = Object.fromEntries(state.body.filter((e) => e.weight != null).map((e) => [e.date, e.weight]));

    const rows = Array.from({ length: 14 }, (_, i) => shiftKey(todayKey, -i))
      .filter((key) => waterOf(key) > 0 || weights[key] != null)
      .map((key) => {
        const ratio = Math.min(1, waterOf(key) / state.prefs.goalCups);
        return `
          <div class="dayrow">
            <span class="dayrow-date">${labelKey(key)}<small>${weekday(key)}</small>${key === todayKey ? '<small>hoje</small>' : ''}</span>
            <span class="dayrow-meta">
              ${weights[key] != null ? `<span>${weights[key]}kg</span>` : ''}
              <span class="bar"><i style="width:${Math.round(ratio * 100)}%"></i></span>
              <span class="${hitGoal(key) ? 'is-goal' : ''}">${mlOf(key)}ml</span>
            </span>
          </div>`;
      }).join('');

    return `
      <section>
        <span class="section-label">Últimos 30 dias</span>
        <div class="stats">
          <div class="stat"><div class="stat-value">${(avg / 1000).toFixed(1)}<small> L</small></div><div class="stat-label">Média por dia</div></div>
          <div class="stat"><div class="stat-value">${streak()}<small> d</small></div><div class="stat-label">Sequência</div></div>
          <div class="stat"><div class="stat-value">${pct}<small>%</small></div><div class="stat-label">Dias na meta</div></div>
        </div>
      </section>

      <section>
        <span class="section-label">Mapa de hidratação</span>
        <div class="heat">${cells}</div>
        <div class="heat-legend">
          <span>seco</span>
          <i style="background:rgba(255,255,255,.35)"></i>
          <i style="background:rgba(14,165,233,.22)"></i>
          <i style="background:rgba(14,165,233,.42)"></i>
          <i style="background:rgba(14,165,233,.62)"></i>
          <i style="background:rgba(14,165,233,.85);border-color:transparent"></i>
          <span>meta</span>
        </div>
      </section>

      <section>
        <span class="section-label">Detalhe por dia</span>
        <div class="daylist">${rows || '<p class="empty">Nenhum dia registrado ainda.</p>'}</div>
      </section>`;
  }

  /* ---------------- view: CORPO ---------------- */

  function lineChart(points, unit) {
    if (points.length < 2) return '<p class="empty">Registre pelo menos 2 medições para ver o gráfico.</p>';
    const W = 340, H = 170, padX = 10, padY = 22;
    const vals = points.map((p) => p.v);
    const min = Math.min(...vals), max = Math.max(...vals);
    const span = (max - min) || 1;
    const lo = min - span * 0.25, hi = max + span * 0.25;
    const x = (i) => padX + (i * (W - padX * 2)) / (points.length - 1);
    const y = (v) => padY + (1 - (v - lo) / (hi - lo)) * (H - padY * 2);
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
    const area = `${line} L${x(points.length - 1).toFixed(1)},${H - padY} L${x(0).toFixed(1)},${H - padY} Z`;
    const dots = points.map((p, i) => `<circle class="pt" cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="3"/>`).join('');
    const first = points[0], last = points[points.length - 1];
    const delta = last.v - first.v;
    return `
      <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img"
           aria-label="Evolução de ${unit}: de ${first.v} a ${last.v}">
        <line class="grid" x1="${padX}" y1="${y(max).toFixed(1)}" x2="${W - padX}" y2="${y(max).toFixed(1)}"/>
        <line class="grid" x1="${padX}" y1="${y(min).toFixed(1)}" x2="${W - padX}" y2="${y(min).toFixed(1)}"/>
        <path class="area" d="${area}"/>
        <path class="line" d="${line}"/>
        ${dots}
      </svg>
      <div class="chart-legend">
        <span>${labelKey(first.key)} · ${first.v}${unit}</span>
        <span>${delta === 0 ? '—' : (delta > 0 ? '+' : '') + delta.toFixed(1) + unit}</span>
        <span>${labelKey(last.key)} · ${last.v}${unit}</span>
      </div>`;
  }

  function viewCorpo() {
    const entries = [...state.body].sort((a, b) => (a.date < b.date ? 1 : -1));
    const latest = entries[0];
    const todayEntry = entries.find((e) => e.date === todayKey);

    const fields = BODY_FIELDS.map((f) => {
      const v = todayEntry && todayEntry[f.id] != null ? todayEntry[f.id] : '';
      return `
        <div class="field">
          <label for="f_${f.id}">${f.label}</label>
          <div class="input-wrap">
            <input id="f_${f.id}" type="number" inputmode="decimal" step="${f.step}" min="${f.min}" max="${f.max}"
                   value="${v}" placeholder="—">
            <span class="unit">${f.unit}</span>
          </div>
        </div>`;
    }).join('');

    const weightPoints = [...state.body]
      .filter((e) => typeof e.weight === 'number')
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-20)
      .map((e) => ({ key: e.date, v: e.weight }));

    const list = entries.slice(0, 20).map((e) => {
      const vals = BODY_FIELDS.filter((f) => e[f.id] != null)
        .map((f) => `${f.label} ${e[f.id]}${f.unit}`).join(' · ');
      return `
        <div class="entry">
          <span class="entry-main">
            <span class="entry-date">${labelKey(e.date)} <small style="color:var(--muted-2)">${weekday(e.date)}</small></span>
            <span class="entry-vals">${escapeHtml(vals || '—')}${e.note ? ' · ' + escapeHtml(e.note) : ''}</span>
          </span>
          <button class="entry-del" data-act="del-body" data-date="${e.date}">excluir</button>
        </div>`;
    }).join('');

    const sub = todayEntry
      ? `Registrado hoje${todayEntry.weight != null ? ` · ${todayEntry.weight}kg` : ''}`
      : latest
        ? `Último: ${latest.weight != null ? latest.weight + 'kg · ' : ''}${labelKey(latest.date)}`
        : 'Nenhuma medição ainda';

    return `
      <section>
        <div class="collapse ${bodyFormOpen ? 'is-open' : ''}">
          <button class="collapse-head" data-act="toggle-form" aria-expanded="${bodyFormOpen}">
            <span class="collapse-text">
              <span class="collapse-title">${todayEntry ? 'Editar registro de hoje' : 'Registrar peso e medidas'}</span>
              <span class="collapse-sub">${escapeHtml(sub)}</span>
            </span>
            <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div class="collapse-body" ${bodyFormOpen ? '' : 'hidden'}>
            <div class="form-grid">${fields}</div>
            <div class="field" style="margin-top:12px">
              <label for="f_note">Observação</label>
              <div class="input-wrap">
                <input id="f_note" type="text" maxlength="80" placeholder="opcional"
                       value="${todayEntry && todayEntry.note ? escapeHtml(todayEntry.note) : ''}">
              </div>
            </div>
            <div class="btn-row">
              <button class="btn" data-act="save-body">${todayEntry ? 'Atualizar registro' : 'Salvar registro'}</button>
              ${latest && latest.date !== todayKey && latest.weight != null
                ? `<button class="btn btn-ghost" data-act="repeat-body">Repetir ${latest.weight}kg</button>` : ''}
            </div>
          </div>
        </div>
      </section>

      <section>
        <span class="section-label">Evolução do peso</span>
        ${lineChart(weightPoints, 'kg')}
      </section>

      <section>
        <span class="section-label">Histórico de medidas</span>
        ${list || '<p class="empty">Nenhuma medição registrada ainda.</p>'}
      </section>`;
  }

  /* ---------------- view: AJUSTES ---------------- */

  function viewAjustes() {
    const p = state.prefs;
    const dayCount = Object.keys(state.days).filter((k) => waterOf(k) > 0).length;
    return `
      <section>
        <span class="section-label">Metas</span>
        <div class="setting">
          <span class="setting-text">
            <span class="setting-title">Meta de água</span>
            <span class="setting-desc">${p.goalCups} copos de ${p.cupMl}ml = ${(p.goalCups * p.cupMl / 1000).toFixed(1)}L por dia</span>
          </span>
          <span class="stepper">
            <button data-act="goal" data-delta="-1" aria-label="Diminuir">−</button>
            <span>${(p.goalCups * p.cupMl / 1000).toFixed(2)}L</span>
            <button data-act="goal" data-delta="1" aria-label="Aumentar">+</button>
          </span>
        </div>
        <div class="setting">
          <span class="setting-text">
            <span class="setting-title">Tamanho do copo</span>
            <span class="setting-desc">Cada ponto na barra de água vale ${p.cupMl}ml</span>
          </span>
          <span class="stepper">
            <button data-act="cup" data-delta="-50" aria-label="Diminuir">−</button>
            <span>${p.cupMl}ml</span>
            <button data-act="cup" data-delta="50" aria-label="Aumentar">+</button>
          </span>
        </div>
      </section>

      <section>
        <span class="section-label">Dados</span>
        <div class="setting">
          <span class="setting-text">
            <span class="setting-title">Backup</span>
            <span class="setting-desc">${dayCount} dia(s) de água e ${state.body.length} medição(ões) guardados só neste aparelho. Exporte de vez em quando — limpar os dados do navegador apaga tudo.</span>
          </span>
        </div>
        <div class="btn-row">
          <button class="btn" data-act="export">Exportar JSON</button>
          <button class="btn btn-ghost" data-act="import">Importar</button>
          <button class="btn btn-danger" data-act="wipe">Apagar tudo</button>
        </div>
        <input id="importFile" type="file" accept="application/json,.json" hidden>
      </section>

      <section>
        <span class="section-label">Sobre</span>
        <div class="card" style="font-size:11.5px;color:#635E55;line-height:1.7">
          <p><strong>Plano Alimentar</strong> v${APP_VERSION}</p>
          <p>Plano prescrito em 04/07/2022.</p>
          <p>O dia vira às ${pad(RESET_HOUR)}:00. Água e refeições zeram sozinhas nesse horário.</p>
          <p>Funciona offline. Para instalar no Android: menu do Chrome → “Instalar app”.</p>
        </div>
      </section>`;
  }

  /* ---------------- render ---------------- */

  const VIEWS = { hoje: viewHoje, historico: viewHistorico, corpo: viewCorpo, ajustes: viewAjustes };

  function render() {
    todayKey = dayKey();
    el('view').innerHTML = VIEWS[view]();
    el('dayLabel').textContent = longLabel(todayKey);
    document.querySelectorAll('.tabbar-btn').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.view === view));
  }

  /* ---------------- ações ---------------- */

  function readBodyForm() {
    const entry = { date: todayKey };
    let any = false;
    BODY_FIELDS.forEach((f) => {
      const input = el(`f_${f.id}`);
      if (!input) return;
      const raw = input.value.trim().replace(',', '.');
      if (raw === '') return;
      const num = Number(raw);
      if (!Number.isFinite(num) || num < f.min || num > f.max) {
        throw new Error(`${f.label} precisa ficar entre ${f.min} e ${f.max}${f.unit}.`);
      }
      entry[f.id] = Math.round(num * 10) / 10;
      any = true;
    });
    const note = el('f_note') ? el('f_note').value.trim() : '';
    if (note) entry.note = note;
    if (!any) throw new Error('Preencha ao menos um valor.');
    return entry;
  }

  function upsertBody(entry) {
    const i = state.body.findIndex((e) => e.date === entry.date);
    if (i >= 0) state.body[i] = entry; else state.body.push(entry);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plano-alimentar-backup-${todayKey}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Backup gerado');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== 'object' || !data.days || !data.prefs) {
          throw new Error('formato inesperado');
        }
        const base = DEFAULT_STATE();
        state = {
          ...base, ...data,
          prefs: { ...base.prefs, ...data.prefs },
          subs: data.subs || {},
          days: data.days || {},
          body: Array.isArray(data.body) ? data.body : []
        };
        save(); render();
        toast('Backup importado');
      } catch (e) {
        toast('Arquivo inválido');
      }
    };
    reader.readAsText(file);
  }

  document.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-act], .tabbar-btn');
    if (!btn) return;

    if (btn.classList.contains('tabbar-btn')) {
      view = btn.dataset.view;
      render();
      window.scrollTo({ top: 0 });
      return;
    }

    const act = btn.dataset.act;

    switch (act) {
      case 'water': {
        const d = day();
        const cups = Number(btn.dataset.cups);
        d.water = d.water === cups ? cups - 1 : cups;
        save(); paintWater();
        break;
      }
      case 'tab':
        activeMealTab = btn.dataset.tab;
        render();
        break;
      case 'lanche':
        state.prefs.lancheOption = Number(btn.dataset.opt);
        save(); render();
        break;
      case 'sub': {
        const idx = Number(btn.dataset.idx);
        const key = `${btn.dataset.meal}_${btn.dataset.item}`;
        if (idx < 0) delete state.subs[key]; else state.subs[key] = idx;
        save(); paintItem(btn.dataset.meal, btn.dataset.item);
        break;
      }
      case 'copy': {
        const ok = await copyText(mealAsText(btn.dataset.meal));
        toast(ok ? 'Copiado!' : 'Não consegui copiar');
        break;
      }
      case 'toggle-form': {
        bodyFormOpen = !bodyFormOpen;
        const wrap = btn.closest('.collapse');
        wrap.classList.toggle('is-open', bodyFormOpen);
        wrap.querySelector('.collapse-body').hidden = !bodyFormOpen;
        btn.setAttribute('aria-expanded', String(bodyFormOpen));
        if (bodyFormOpen) el('f_weight').focus({ preventScroll: true });
        break;
      }
      case 'save-body':
        try {
          upsertBody(readBodyForm());
          bodyFormOpen = false;
          save(); render();
          toast('Registro salvo');
        } catch (e) { toast(e.message); }
        break;
      case 'repeat-body': {
        const last = [...state.body].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
        if (last) {
          upsertBody({ ...last, date: todayKey });
          bodyFormOpen = false;
          save(); render();
          toast('Repetido para hoje');
        }
        break;
      }
      case 'del-body':
        state.body = state.body.filter((e) => e.date !== btn.dataset.date);
        save(); render();
        break;
      case 'goal':
        state.prefs.goalCups = Math.min(20, Math.max(4, state.prefs.goalCups + Number(btn.dataset.delta)));
        save(); render();
        break;
      case 'cup':
        state.prefs.cupMl = Math.min(500, Math.max(100, state.prefs.cupMl + Number(btn.dataset.delta)));
        save(); render();
        break;
      case 'export': exportData(); break;
      case 'import': el('importFile').click(); break;
      case 'wipe':
        if (confirm('Apagar todo o histórico, medidas e preferências deste aparelho? Não dá para desfazer.')) {
          state = DEFAULT_STATE();
          save(); render();
          toast('Dados apagados');
        }
        break;
    }
  });

  document.addEventListener('change', (ev) => {
    if (ev.target.id === 'importFile' && ev.target.files[0]) {
      importData(ev.target.files[0]);
      ev.target.value = '';
    }
  });

  el('infoBtn').addEventListener('click', () => {
    const card = el('infoCard');
    card.hidden = !card.hidden;
    el('infoBtn').setAttribute('aria-expanded', String(!card.hidden));
  });

  /* virada do dia às 05:00, mesmo com o app aberto */
  function checkRollover() {
    if (dayKey() !== todayKey) render();
  }
  setInterval(checkRollover, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkRollover(); });

  render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW não registrado', e));
    });
  }
})();
