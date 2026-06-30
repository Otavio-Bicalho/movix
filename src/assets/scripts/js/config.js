mapboxgl.accessToken = 'pk.eyJ1IjoiYml0cy1tYXAiLCJhIjoiY21vbmduamttMDNmbjJ3cHViNHliYTYxcSJ9.Hp9je8W7TrVVpZGRlTVabQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-43.9345, -19.9167],
    zoom: 14,
    minZoom: 13
});

carregarJSONs().then(() => {

const USUARIOS = {};
(USUARIOS_DATA.usuarios || []).forEach(u => {
    USUARIOS[Number(u.id_usuario)] = u.nome;
});

function resolveUsuarioNome(id) {
    const total = Object.keys(USUARIOS).length || 5;
    const mappedId = ((Number(id) - 1) % total + total) % total + 1;
    return USUARIOS[mappedId] || `Usuário ${id}`;
}

const TIPO_COMBUSTIVEL = {};
(TIPO_COMBUSTIVEL_DATA.tipo_combustivel || []).forEach(t => {
    TIPO_COMBUSTIVEL[Number(t.id_tipo_combustivel)] = t.combustivel;
});

const PRICES_BY_STATION = {};
const FUELS_BY_STATION  = {};
(VL_COMBUSTIVEL_DATA.vl_combustivel || []).forEach(v => {
    const sid = String(v.estabelecimento_id);
    const tid = Number(v.tipo_combustivel_id);
    if (!PRICES_BY_STATION[sid]) PRICES_BY_STATION[sid] = {};
    if (!FUELS_BY_STATION[sid])  FUELS_BY_STATION[sid]  = new Set();
    PRICES_BY_STATION[sid][tid] = Number(v.preco) || 0;
    FUELS_BY_STATION[sid].add(tid);
});

const card      = document.getElementById('posto-card');
const cardTitle = document.getElementById('card-title');
const cardClose = document.getElementById('card-close');

const CARACTERISTICA_ICONS = {
    1:  'src/assets/img/icons/24h.svg',
    2:  'src/assets/img/icons/wifi.svg',
    3:  'src/assets/img/icons/parking.svg',
    4:  'src/assets/img/icons/vaso.svg',
    5:  'src/assets/img/icons/loja.svg',
    6:  'src/assets/img/icons/cama.svg',
    7:  'src/assets/img/icons/pix.svg',
    8:  'src/assets/img/icons/credit.svg',
    9:  'src/assets/img/icons/medicine.svg',
    10: 'src/assets/img/icons/tires.svg',
    11: 'src/assets/img/icons/cama.svg'
};
function getCaracteristicaIcon(id) { return CARACTERISTICA_ICONS[Number(id)] || null; }

const BANDEIRA_LOGOS = {
    '1': 'src/assets/img/logo/postos/ipiranga.jpeg',
    '4': 'src/assets/img/logo/postos/shell.jpeg',
    '5': 'src/assets/img/logo/postos/br.jpeg',
    '6': 'src/assets/img/logo/postos/ale.png'
};

function setCardLogo(bandeiraId) {
    const img = document.getElementById('card-logo-img');
    if (!img) return;
    const url = BANDEIRA_LOGOS[String(bandeiraId)];
    if (url) { img.src = url; img.style.display = ''; }
    else      { img.removeAttribute('src'); img.style.display = 'none'; }
}

function renderCaracteristicaItem(carac) {
    const id       = Number(carac.id_caracteristicas);
    const icon     = getCaracteristicaIcon(id);
    const label    = CARACTERISTICA_LABELS[id] || '';
    const iconHtml = icon ? `<img src="${icon}" alt="">` : '';
    return `
        <li class="service-item">
            <span class="service-icon">${iconHtml}</span>
            <span class="service-text">${label}</span>
        </li>`;
}

const FUEL_BASELINES       = { Gasolina: 6.10, Etanol: 4.30 };
const FUEL_BASELINES_EXTRA = { Diesel: 5.80, 'Diesel S10': 6.10, GNV: 4.40 };
const FUEL_NAME_TO_TIPO    = { Gasolina: 1, Etanol: 2, Diesel: 3, 'Diesel S10': 4, GNV: 5 };

function fmtPrice(n) { return `R$${n.toFixed(2).replace('.', ',')}`; }

const ARROW_UP   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
const ARROW_DOWN = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';

function renderFuelPrices(stationId, prices) {
    const stationPrices = prices || PRICES_BY_STATION[String(stationId)] || {};
    document.querySelectorAll('.produtos-row[data-fuel-row]').forEach(row => {
        const cell   = row.querySelector('[data-price-cell]');
        if (!cell) return;
        const fuel    = row.dataset.fuelRow;
        const tipoId  = FUEL_NAME_TO_TIPO[fuel];
        const price   = Number(stationPrices[tipoId]) || 0;
        const baseline = FUEL_BASELINES[fuel];
        const up = price >= baseline;
        cell.classList.toggle('price-up',   up);
        cell.classList.toggle('price-down', !up);
        cell.innerHTML = price ? `${up ? ARROW_UP : ARROW_DOWN} ${fmtPrice(price)}` : '—';
        const btn = row.querySelector('.abastecer-btn');
        if (btn && price) btn.dataset.price = price.toFixed(2);
    });
    const extra = document.getElementById('produtos-extra-fuels');
    if (!extra) return;
    const EXTRA_FUELS = [{ id: 3, name: 'Diesel' }, { id: 4, name: 'Diesel S10' }, { id: 5, name: 'GNV' }];
    const extrasDisponiveis = EXTRA_FUELS.filter(f => stationPrices[f.id]);

    extra.innerHTML = extrasDisponiveis.map(f => {
        const price    = stationPrices[f.id];
        const baseline = FUEL_BASELINES_EXTRA[f.name];
        const up = price >= baseline;
        return `
            <div class="produtos-row" data-fuel-row="${f.name}">
                <span class="col-name">${f.name}</span>
                <span class="col-value ${up ? 'price-up' : 'price-down'}">${up ? ARROW_UP : ARROW_DOWN} ${fmtPrice(price)}</span>
               
            </div>`;
    }).join('');

    // "Mais Detalhes" só aparece se houver combustíveis além de Gasolina e Etanol
    const detailsBtn   = document.getElementById('produtos-details-btn');
    const produtosExtraEl = document.getElementById('produtos-extra');
    if (detailsBtn) {
        if (extrasDisponiveis.length > 0) {
            detailsBtn.style.display = '';
        } else {
            detailsBtn.style.display = 'none';
            // garante que o painel extra fica fechado ao trocar de posto
            detailsBtn.classList.remove('open');
            if (produtosExtraEl) produtosExtraEl.classList.remove('open');
        }
    }
}

function renderStatusIcons(list, maxIcons = 4) {
    const icons = document.getElementById('status-icons');
    const more  = document.getElementById('status-more');
    if (!icons || !more) return;
    const ativas    = (list || []).filter(c => c && c.status === true);
    const withIcon  = ativas.filter(c => getCaracteristicaIcon(c.id_caracteristicas));
    const shown     = withIcon.slice(0, maxIcons);
    const extra     = withIcon.length - shown.length;
    icons.innerHTML = shown.map(c => `<img src="${getCaracteristicaIcon(c.id_caracteristicas)}" alt="">`).join('');
    if (extra > 0) { more.textContent = `+${extra}`; more.style.display = ''; }
    else             more.style.display = 'none';
}

function activateTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const btn   = document.querySelector(`[data-tab="${tabName}"]`);
    const panel = document.getElementById(`tab-${tabName}`);
    if (btn)   btn.classList.add('active');
    if (panel) panel.classList.add('active');
}

const statusMoreEl = document.getElementById('status-more');
if (statusMoreEl) {
    statusMoreEl.style.cursor = 'pointer';
    statusMoreEl.addEventListener('click', e => { e.stopPropagation(); activateTab('servicos'); });
}

function renderCaracteristicas(list) {
    const ul    = document.getElementById('service-list');
    if (!ul) return;
    const ativas = (list || []).filter(c => c && c.status === true);
    if (!ativas.length) { ul.innerHTML = '<li class="service-item placeholder">Nenhum serviço informado.</li>'; return; }
    ul.innerHTML = ativas.map(renderCaracteristicaItem).join('');
}

function openCard(coordinates, title, kind, bandeiraId, caracteristicas, prices, stationId) {
    closeAllReviews && closeAllReviews();
    const point = map.project(coordinates);
    card.style.left = point.x + 'px';
    card.style.top  = point.y + 'px';
    cardTitle.textContent = title || 'Posto';
    card.dataset.kind = kind || 'posto';
    setCardLogo(bandeiraId);
    renderCaracteristicas(caracteristicas);
    renderStatusIcons(caracteristicas, 4);
    renderFuelPrices(stationId, prices);
    renderStationReviews(stationId, openCard._endereco);
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelector('[data-tab="produtos"]').classList.add('active');
    document.getElementById('tab-produtos').classList.add('active');
    card.classList.add('visible');
}
function closeCard() { card.classList.remove('visible'); }

let _lastCoords = null;
map.on('move', () => {
    if (_lastCoords && card.classList.contains('visible')) {
        const point = map.project(_lastCoords);
        card.style.left = point.x + 'px';
        card.style.top  = point.y + 'px';
    }
});
if (cardClose) cardClose.addEventListener('click', closeCard);


const STAR_URL      = 'src/assets/img/icons/star-symbol-icon.svg';
const DEFAULT_AVATAR = 'src/assets/img/logo/postos/avatar.svg';

function renderReview(review, opts = {}) {
    const score  = Number(review.score ?? 0);
    const full   = Math.round(score);
    const stars  = Array.from({ length: 5 }, (_, i) =>
        `<img${i < full ? '' : ' class="star-empty"'} src="${STAR_URL}" alt="">`).join('');
    const avatar = review.avatar || DEFAULT_AVATAR;
    const dateBR = review.date && review.date.includes('-') ? fmtDateBR(review.date) : (review.date || '');
    const date   = opts.showDate && dateBR
        ? `<span style="font-size:0.75rem;color:#9ca3af;display:block;margin-bottom:2px;">${dateBR}</span>` : '';
    return `
        <li class="review-item">
            <span class="review-avatar"><img src="${avatar}" alt="" onerror="this.style.display='none'"></span>
            <div class="review-body">
                ${date}
                <div class="review-header">
                    <span class="review-name">${review.name}</span>
                    <span class="review-sep">–</span>
                    <span class="review-score">${score.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</span>
                    <span class="review-stars">${stars}</span>
                </div>
                <p class="review-comment">${review.comment}</p>
            </div>
        </li>`;
}

const REVIEWS_BY_STATION = {};
(AVALIACOES_DATA.avaliacoes || []).forEach(a => {
    const sid = String(a.estabelecimento_id);
    if (!REVIEWS_BY_STATION[sid]) REVIEWS_BY_STATION[sid] = [];
    REVIEWS_BY_STATION[sid].push({
        name: resolveUsuarioNome(a.usuario_id),
        score: Number(a.avaliacao) || 0,
        comment: a.descricao || '',
        date: a.data
    });
});
function getStationReviews(stationId) { return REVIEWS_BY_STATION[String(stationId)] || []; }

let CURRENT_STATION_ID   = null;
let CURRENT_STATION_ADDR = '';
const DATE_FILTER = { from: null, to: null };

function renderStationReviews(stationId, endereco) {
    CURRENT_STATION_ID   = stationId;
    CURRENT_STATION_ADDR = endereco || '';
    DATE_FILTER.from = null; DATE_FILTER.to = null;
    const fromEl = document.getElementById('date-from');
    const toEl   = document.getElementById('date-to');
    if (fromEl) fromEl.value = '';
    if (toEl)   toEl.value   = '';
    const lbl  = document.getElementById('all-reviews-filter-label');
    if (lbl)  lbl.textContent = 'Filtrar por data';
    const addr = document.getElementById('all-reviews-address');
    if (addr) addr.textContent = endereco || '';
    _renderStationReviewsNow(stationId);
}

function _filteredStationReviews(stationId) {
    let reviews = getStationReviews(stationId);
    if (DATE_FILTER.from) reviews = reviews.filter(r => r.date && r.date >= DATE_FILTER.from);
    if (DATE_FILTER.to)   reviews = reviews.filter(r => r.date && r.date <= DATE_FILTER.to);
    return reviews;
}

function _renderStationReviewsNow(stationId) {
    const reviews = getStationReviews(stationId);
    const list    = document.getElementById('review-list');
    const allList = document.getElementById('all-reviews-list');
    if (list) {
        list.innerHTML = !reviews.length
            ? '<li class="placeholder">Nenhuma avaliação para este posto.</li>'
            : reviews.slice(0, 3).map(r => renderReview(r)).join('');
    }
    if (allList) {
        const filtered = _filteredStationReviews(stationId);
        allList.innerHTML = !filtered.length
            ? '<li class="placeholder" style="padding:24px;text-align:center;color:#9ca3af;font-style:italic;">Nenhuma avaliação no período.</li>'
            : filtered.map(r => renderReview(r, { showDate: true })).join('');
    }
    const scoreEl = document.querySelector('.card-rating-score');
    const countEl = document.querySelector('.card-rating-count');
    const starsEl = document.querySelector('.card-rating-stars');
    if (scoreEl && countEl && starsEl) {
        const n   = reviews.length;
        const avg = n ? reviews.reduce((s, r) => s + r.score, 0) / n : 0;
        scoreEl.textContent = n ? avg.toFixed(1).replace('.', ',') : '—';
        countEl.textContent = `(${n})`;
        const full = Math.round(avg);
        starsEl.innerHTML = Array.from({ length: 5 }, (_, i) =>
            `<img${i < full ? '' : ' class="star-empty"'} src="${STAR_URL}" alt="">`).join('');
    }
}


const FILTERS = { kind: null, caracs: new Set(), fuels: new Set(), search: '' };

function setKindFilter(value)    { FILTERS.kind = FILTERS.kind === value ? null : value; applyFilters(); syncFilterUI(); }
function toggleCaracFilter(id)   { FILTERS.caracs.has(id) ? FILTERS.caracs.delete(id) : FILTERS.caracs.add(id); applyFilters(); syncFilterUI(); }
function toggleFuelFilter(id)    { FILTERS.fuels.has(id)  ? FILTERS.fuels.delete(id)  : FILTERS.fuels.add(id);  applyFilters(); syncFilterUI(); }
function clearFilters()          { FILTERS.kind = null; FILTERS.caracs.clear(); FILTERS.fuels.clear(); applyFilters(); syncFilterUI(); }

function syncFilterUI() {
    document.querySelectorAll('.chip[data-filter-kind]').forEach(c =>
        c.classList.toggle('active', FILTERS.kind === c.dataset.filterKind));
    document.querySelectorAll('.chip[data-filter-carac]').forEach(c =>
        c.classList.toggle('active', FILTERS.caracs.has(Number(c.dataset.filterCarac))));
    document.querySelectorAll('#filter-popover-list input[data-filter-carac]').forEach(cb =>
        cb.checked = FILTERS.caracs.has(Number(cb.value)));
    document.querySelectorAll('#filter-popover-list input[data-filter-fuel]').forEach(cb =>
        cb.checked = FILTERS.fuels.has(Number(cb.value)));
}

document.querySelectorAll('.chip[data-filter-kind]').forEach(c =>
    c.addEventListener('click', () => setKindFilter(c.dataset.filterKind)));
document.querySelectorAll('.chip[data-filter-carac]').forEach(c =>
    c.addEventListener('click', () => toggleCaracFilter(Number(c.dataset.filterCarac))));

const filterBtn     = document.getElementById('topbar-filter-btn');
const filterPopover = document.getElementById('filter-popover');
const filterList    = document.getElementById('filter-popover-list');
const filterClear   = document.getElementById('filter-clear');

(function renderFilterPopover() {
    const caracs = (CARACTERISTICAS_DATA.caracteristicas || []);
    const fuels  = Object.entries(TIPO_COMBUSTIVEL).map(([id, desc]) => ({ id: Number(id), desc }));
    filterList.innerHTML = `
        <div class="filter-section-title">Combustíveis</div>
        ${fuels.map(f => `<label><input type="checkbox" data-filter-fuel value="${f.id}"><span>${f.desc}</span></label>`).join('')}
        <div class="filter-section-title">Características</div>
        ${caracs.map(c => `<label><input type="checkbox" data-filter-carac value="${c.id_caracteristicas}"><span>${c.descricao}</span></label>`).join('')}
    `;
    filterList.querySelectorAll('input[data-filter-fuel]').forEach(cb =>
        cb.addEventListener('change', () => toggleFuelFilter(Number(cb.value))));
    filterList.querySelectorAll('input[data-filter-carac]').forEach(cb =>
        cb.addEventListener('change', () => toggleCaracFilter(Number(cb.value))));
})();

if (filterBtn && filterPopover) {
    filterBtn.addEventListener('click', e => { e.stopPropagation(); filterPopover.classList.toggle('visible'); });
    document.addEventListener('click', e => {
        if (!filterPopover.contains(e.target) && e.target !== filterBtn)
            filterPopover.classList.remove('visible');
    });
}
if (filterClear) filterClear.addEventListener('click', e => { e.stopPropagation(); clearFilters(); });


const sideMenu      = document.getElementById('side-menu');
const sideOverlay   = document.getElementById('side-overlay');
const sideToggleBtn = document.getElementById('topbar-menu');
function openSide()  { sideMenu.classList.add('visible');    sideOverlay.classList.add('visible');    sideMenu.setAttribute('aria-hidden', 'false'); }
function closeSide() { sideMenu.classList.remove('visible'); sideOverlay.classList.remove('visible'); sideMenu.setAttribute('aria-hidden', 'true');  }
if (sideToggleBtn) sideToggleBtn.addEventListener('click', openSide);
if (sideOverlay)   sideOverlay.addEventListener('click', closeSide);
document.querySelectorAll('.side-group-head[data-toggle]').forEach(btn =>
    btn.addEventListener('click', () => btn.parentElement.classList.toggle('open')));


const produtosDetailsBtn = document.getElementById('produtos-details-btn');
const produtosExtra      = document.getElementById('produtos-extra');
if (produtosDetailsBtn && produtosExtra) {
    produtosDetailsBtn.addEventListener('click', () => {
        produtosDetailsBtn.classList.toggle('open');
        produtosExtra.classList.toggle('open');
    });
}


const abModal   = document.getElementById('abastecimento-modal');
const abOverlay = document.getElementById('abastecimento-overlay');
function openAbastecimento(fuel, price) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('ab-data').value = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}`;
    document.getElementById('ab-hora').value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (fuel) { const sel = document.getElementById('ab-combustivel'); for (const opt of sel.options) if (opt.value === fuel || opt.text === fuel) sel.value = opt.value; }
    if (price) document.getElementById('ab-preco').value = `R$ ${Number(price).toFixed(2).replace('.', ',')}`;
    document.getElementById('ab-litros').value = '';
    document.getElementById('ab-total').value  = '';
    abModal.classList.add('visible');
    abOverlay.classList.add('visible');
}
function closeAbastecimento() { abModal.classList.remove('visible'); abOverlay.classList.remove('visible'); }
document.addEventListener('click', e => { const btn = e.target.closest('.abastecer-btn'); if (!btn) return; e.stopPropagation(); openAbastecimento(btn.dataset.fuel, btn.dataset.price); });
if (abOverlay) abOverlay.addEventListener('click', e => { if (e.target === abOverlay) closeAbastecimento(); });
const abCancelar = document.getElementById('ab-cancelar');
if (abCancelar) abCancelar.addEventListener('click', closeAbastecimento);
const abForm = document.getElementById('abastecimento-form');
if (abForm) abForm.addEventListener('submit', e => { e.preventDefault(); closeAbastecimento(); });

function parsePrice(s)  { return parseFloat(String(s).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0; }
function fmtBRL(n)      { return `R$ ${n.toFixed(2).replace('.', ',')}`; }
function fmtNum(n)       { return n.toFixed(2).replace('.', ','); }
function syncAbastecimento(source) {
    const p = parsePrice(document.getElementById('ab-preco').value);
    const l = parsePrice(document.getElementById('ab-litros').value);
    const t = parsePrice(document.getElementById('ab-total').value);
    if (source === 'ab-total' && p > 0) document.getElementById('ab-litros').value = t ? fmtNum(t / p) : '';
    else document.getElementById('ab-total').value = (p && l) ? fmtBRL(p * l) : '';
}
['ab-preco', 'ab-litros', 'ab-total'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', () => syncAbastecimento(id)); });


const ICONS = {
    ccs2:  'src/assets/img/icons/electric/ccs2.svg',
    ccs1:  'src/assets/img/icons/electric/css1.svg',
    type2: 'src/assets/img/icons/electric/type2.svg'
};
const CHARGE_POINTS = [
    { type: 'CCS2',   power: '6,0 kw DC', price: '2,00', usage: '0/4 em uso', status: 'free', icon: 'ccs2'  },
    { type: 'Tipo 2', power: '3,0 kw AC', price: '2,00', usage: '4/4 em uso', status: 'full', icon: 'type2' }
];
function renderChargePoint(p) {
    const available  = p.status !== 'full';
    const pillClass  = available ? 'pill-dark' : 'pill-red';
    const pillLabel  = available ? 'Recarregar' : 'Indisponível';
    const usageClass = p.status === 'free' ? 'usage-free' : p.status === 'half' ? 'usage-half' : 'usage-full';
    return `
        <div class="charge-card">
            <span class="charge-card-label">${p.type}</span>
            <div class="charge-card-icon"><img src="${ICONS[p.icon]}" alt=""></div>
            <div class="charge-card-info">
                <div><span class="label">Conector</span><div class="conn-name">${p.type}</div><div class="conn-sub">${p.power}</div></div>
                <div><span class="label">Mais informações</span><div class="price">R$${p.price}/Kwh</div><div class="${usageClass}">${p.usage}</div></div>
            </div>
            <button class="action-pill ${pillClass}" ${available ? `data-conn="${p.type} ${p.power}" data-price="${p.price.replace(',', '.')}"` : 'disabled'}>${pillLabel}</button>
        </div>`;
}
const detalhesModal   = document.getElementById('detalhes-modal');
const detalhesOverlay = document.getElementById('detalhes-overlay');
function openDetalhes() {
    const el = document.getElementById('charge-cards');
    el.innerHTML = CHARGE_POINTS.map(renderChargePoint).join('');
    el.querySelectorAll('.action-pill.pill-dark').forEach(btn =>
        btn.addEventListener('click', e => { e.stopPropagation(); closeDetalhes(); openRecarga(btn.dataset.conn, btn.dataset.price); }));
    detalhesModal.classList.add('visible');
    detalhesOverlay.classList.add('visible');
}
function closeDetalhes() { detalhesModal.classList.remove('visible'); detalhesOverlay.classList.remove('visible'); }
document.querySelectorAll('.detalhes-btn').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); openDetalhes(); }));
if (detalhesOverlay) detalhesOverlay.addEventListener('click', e => { if (e.target === detalhesOverlay) closeDetalhes(); });

const rcModal   = document.getElementById('recarga-modal');
const rcOverlay = document.getElementById('recarga-overlay');
function openRecarga(conn, price) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('rc-data').value = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}`;
    document.getElementById('rc-hora').value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (price) document.getElementById('rc-valor-kwh').value = `R$ ${Number(price).toFixed(2).replace('.', ',')}`;
    document.getElementById('rc-energia').value = '';
    document.getElementById('rc-total').value   = '';
    rcModal.classList.add('visible');
    rcOverlay.classList.add('visible');
}
function closeRecarga() { rcModal.classList.remove('visible'); rcOverlay.classList.remove('visible'); }
document.querySelectorAll('.recarregar-btn').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); openRecarga(btn.dataset.conn, btn.dataset.price); }));
if (rcOverlay) rcOverlay.addEventListener('click', e => { if (e.target === rcOverlay) closeRecarga(); });
const rcCancelar = document.getElementById('rc-cancelar');
if (rcCancelar) rcCancelar.addEventListener('click', closeRecarga);
const rcForm = document.getElementById('recarga-form');
if (rcForm) rcForm.addEventListener('submit', e => { e.preventDefault(); closeRecarga(); });

function syncRecarga(source) {
    const v = parsePrice(document.getElementById('rc-valor-kwh').value);
    const e = parsePrice(document.getElementById('rc-energia').value);
    const t = parsePrice(document.getElementById('rc-total').value);
    if (source === 'rc-total' && v > 0) document.getElementById('rc-energia').value = t ? fmtNum(t / v) : '';
    else document.getElementById('rc-total').value = (v && e) ? fmtBRL(v * e) : '';
}
['rc-valor-kwh', 'rc-energia', 'rc-total'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => syncRecarga(id));
});

document.querySelectorAll('.toggle-group').forEach(group => {
    group.querySelectorAll('.toggle-opt').forEach(btn =>
        btn.addEventListener('click', () => {
            group.querySelectorAll('.toggle-opt').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }));
});

const VEHICLES = [
    { id: 'civic',   label: 'Honda Civic'      },
    { id: 'corolla', label: 'Toyota Corolla'   },
    { id: 'tesla',   label: 'Tesla Model 3'    }
];

const vehicleSelectBtn = document.getElementById('vehicle-select-btn');
const vehicleListMenu  = document.getElementById('vehicle-list-menu');
const vehicleLabelText = document.getElementById('vehicle-label-text');
const avatarBtn        = document.getElementById('avatar-btn');
const accountMenu      = document.getElementById('account-menu');

const LOGIN_URL = 'src/pages/loginUser.html';

function isLoggedIn() { return !!sessionStorage.getItem('UserpfLogado'); }

function getUser() {
    try { return JSON.parse(sessionStorage.getItem('UserpfLogado') || 'null'); }
    catch { return null; }
}

function closeAllMenus() {
    if (vehicleListMenu) vehicleListMenu.classList.remove('visible');
    if (accountMenu)     accountMenu.classList.remove('visible');
}


function initSession() {
    const user = getUser();

    if (avatarBtn) {
        if (user) {
            const partes   = (user.nome || '').trim().split(/\s+/);
            const iniciais = ((partes[0] || '')[0] || '')
                           + ((partes.length > 1 ? partes[partes.length - 1][0] : '') || '');
            avatarBtn.innerHTML  = `<span class="avatar-iniciais">${iniciais.toUpperCase()}</span>`;
            avatarBtn.title      = user.nome;
        } else {
            avatarBtn.innerHTML = `<img src="src/assets/img/logo/postos/avatar.svg" alt="Entrar" onerror="this.style.display='none'">`;
            avatarBtn.title     = 'Entrar';
        }
    }

    if (accountMenu) {
        if (user) {
            accountMenu.innerHTML = `
                <div class="account-user">
                    <strong>${user.nome}</strong>
                    <span>${user.email || ''}</span>
                </div>
                  
                <button id="acc-logout" class="acc-logout">Sair</button>`;

            document.getElementById('acc-perfil')?.addEventListener('click', () => {
                closeAllMenus();
                window.location.href = 'src/pages/perfilUser.html';
            });
            document.getElementById('acc-historico')?.addEventListener('click', () => {
                closeAllMenus();
                window.location.href = 'src/pages/historico.html';
            });
            document.getElementById('acc-logout')?.addEventListener('click', () => {
                sessionStorage.removeItem('UserpfLogado');
                closeAllMenus();
                initSession(); 
            });
        } else {
            accountMenu.innerHTML = `
                <div class="account-user">
                    <strong>Bem-vindo!</strong>
                    <span>Faça login para continuar</span>
                </div>
                <hr>
                <button id="acc-login">Entrar</button>
                <button id="acc-cadastro">Criar conta</button>`;

            document.getElementById('acc-login')?.addEventListener('click', () => {
                closeAllMenus();
                window.location.href = LOGIN_URL;
            });
            document.getElementById('acc-cadastro')?.addEventListener('click', () => {
                closeAllMenus();
                window.location.href = 'src/pages/cadastroUser.html';
            });
        }
    }


    document.querySelectorAll('.blockLogin').forEach(el => {
        if (user) {
            el.classList.remove('login-required');
            el.removeAttribute('title');
        } else {
            el.classList.add('login-required');
            el.title = 'Faça login para acessar';
        }
    });
}


if (vehicleListMenu) {
    vehicleListMenu.innerHTML = VEHICLES.map(v =>
        `<button data-vehicle-id="${v.id}">${v.label}</button>`).join('');
    vehicleListMenu.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!isLoggedIn()) { closeAllMenus(); window.location.href = LOGIN_URL; return; }
            vehicleLabelText.textContent = btn.textContent;
            closeAllMenus();
        });
    });
}

if (vehicleSelectBtn) {
    vehicleSelectBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (!isLoggedIn()) { window.location.href = LOGIN_URL; return; }
        const wasOpen = vehicleListMenu.classList.contains('visible');
        closeAllMenus();
        if (!wasOpen) vehicleListMenu.classList.add('visible');
    });
}


if (avatarBtn) {
    avatarBtn.addEventListener('click', e => {
        e.stopPropagation();
        const wasOpen = accountMenu.classList.contains('visible');
        closeAllMenus();
        if (!wasOpen) accountMenu.classList.add('visible');
    });
}


document.querySelectorAll('.blockLogin').forEach(el => {
    el.addEventListener('click', e => {
        e.stopPropagation();
        if (!isLoggedIn()) {
            closeSide();
            closeAllMenus();
            window.location.href = LOGIN_URL;
            return;
        }
      
        const href = el.dataset.href;
        closeSide();
        closeAllMenus();
        if (href) window.location.href = href;
    });
});

// ── Fecha menus ao clicar fora ──
document.addEventListener('click', e => {
    if (vehicleListMenu && vehicleSelectBtn
        && !vehicleListMenu.contains(e.target) && !vehicleSelectBtn.contains(e.target))
        vehicleListMenu.classList.remove('visible');
    if (accountMenu && avatarBtn
        && !accountMenu.contains(e.target) && !avatarBtn.contains(e.target))
        accountMenu.classList.remove('visible');
});

// ── Inicializa assim que os dados estão prontos ──
initSession();

// =======================================================================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

const allReviewsPanel    = document.getElementById('all-reviews-panel');
const allReviewsBackdrop = document.getElementById('all-reviews-backdrop');
function openAllReviews()  { if (allReviewsPanel) allReviewsPanel.classList.add('visible');    if (allReviewsBackdrop) allReviewsBackdrop.classList.add('visible');    }
function closeAllReviews() { if (allReviewsPanel) allReviewsPanel.classList.remove('visible'); if (allReviewsBackdrop) allReviewsBackdrop.classList.remove('visible'); }
document.addEventListener('click', e => {
    if (e.target.closest('.review-all-btn')) { openAllReviews(); return; }
    if (e.target.closest('#all-reviews-back')) closeAllReviews();
});
const _backBtn = document.getElementById('all-reviews-back');
if (_backBtn) _backBtn.addEventListener('click', e => { e.stopPropagation(); closeAllReviews(); });

const dateFilterBtn     = document.getElementById('all-reviews-filter-btn');
const dateFilterPopover = document.getElementById('date-filter-popover');
const dateApply         = document.getElementById('date-apply');
const dateClear         = document.getElementById('date-clear');
if (dateFilterBtn && dateFilterPopover) {
    dateFilterBtn.addEventListener('click', e => { e.stopPropagation(); dateFilterPopover.classList.toggle('visible'); });
    document.addEventListener('click', e => {
        if (e.target.closest('#all-reviews-filter-btn')) return;
        if (e.target.closest('#date-filter-popover')) return;
        dateFilterPopover.classList.remove('visible');
    });
}
function fmtDateBR(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; }
function parseBrDate(br) {
    if (!br) return null;
    const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    return `${m[3]}-${m[2]}-${m[1]}`;
}
function attachBrDateMask(input) {
    if (!input) return;
    input.addEventListener('input', () => {
        let v = input.value.replace(/\D/g, '').slice(0, 8);
        if (v.length >= 5)      v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
        else if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
        input.value = v;
    });
}
attachBrDateMask(document.getElementById('date-from'));
attachBrDateMask(document.getElementById('date-to'));
if (dateApply) dateApply.addEventListener('click', () => {
    DATE_FILTER.from = parseBrDate(document.getElementById('date-from').value) || null;
    DATE_FILTER.to   = parseBrDate(document.getElementById('date-to').value)   || null;
    const lbl = document.getElementById('all-reviews-filter-label');
    if (DATE_FILTER.from || DATE_FILTER.to)
        lbl.textContent = `${fmtDateBR(DATE_FILTER.from) || '...'} a ${fmtDateBR(DATE_FILTER.to) || '...'}`;
    else lbl.textContent = 'Filtrar por data';
    if (CURRENT_STATION_ID != null) _renderStationReviewsNow(CURRENT_STATION_ID);
    dateFilterPopover.classList.remove('visible');
});
if (dateClear) dateClear.addEventListener('click', () => {
    DATE_FILTER.from = null; DATE_FILTER.to = null;
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value   = '';
    document.getElementById('all-reviews-filter-label').textContent = 'Filtrar por data';
    if (CURRENT_STATION_ID != null) _renderStationReviewsNow(CURRENT_STATION_ID);
});

let ALL_FEATURES = [];
function featureMatchesFilters(f) {
    const props = f.properties || {};
    if (FILTERS.kind && props.kind !== FILTERS.kind) return false;
    if (FILTERS.search) {
        const hay = `${props.title || ''} ${props.endereco || ''}`.toLowerCase();
        if (!hay.includes(FILTERS.search)) return false;
    }
    if (FILTERS.fuels.size > 0) {
        const fuelSet = new Set((props.fuels || '').split(',').map(Number).filter(Boolean));
        for (const id of FILTERS.fuels) if (!fuelSet.has(id)) return false;
    }
    if (FILTERS.caracs.size === 0) return true;
    let caracs = [];
    try { caracs = JSON.parse(props.caracteristicas || '[]'); } catch {}
    const ativas = new Set(caracs.filter(c => c && c.status === true).map(c => Number(c.id_caracteristicas)));
    for (const id of FILTERS.caracs) if (!ativas.has(id)) return false;
    return true;
}
const searchInput = document.getElementById('topbar-search-input');
if (searchInput) {
    searchInput.addEventListener('input', () => { FILTERS.search = searchInput.value.trim().toLowerCase(); applyFilters(); });
}
function applyFilters() {
    const src = map.getSource && map.getSource('places');
    if (!src) return;
    src.setData({ 'type': 'FeatureCollection', 'features': ALL_FEATURES.filter(featureMatchesFilters) });
}

const CARACTERISTICA_LABELS = {};
(CARACTERISTICAS_DATA.caracteristicas || []).forEach(c => {
    CARACTERISTICA_LABELS[Number(c.id_caracteristicas)] = c.descricao;
});

function titleCase(str) {
    return String(str || '').toLowerCase().replace(/(^|[\s\-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}
const BANDEIRA_OVERRIDES = { 4: 'Shell', 5: 'Petrobras' };
const BANDEIRA_NAMES     = {};
(BANDEIRA_DATA.bandeira || []).forEach(b => {
    const id = Number(b.id_bandeira);
    BANDEIRA_NAMES[id] = BANDEIRA_OVERRIDES[id] || titleCase(b.bandeira);
});
function buildTitle(bandeiraId) {
    const name = BANDEIRA_NAMES[Number(bandeiraId)];
    return name ? `Posto ${name}` : 'Posto';
}

const CARACS_BY_STATION = {};
(ESTABELECIMENTO_CARACTERISTICAS_DATA.estabelecimento_caracteristicas || []).forEach(ec => {
    const sid = String(ec.estabelecimento_id);
    if (!CARACS_BY_STATION[sid]) CARACS_BY_STATION[sid] = [];
    CARACS_BY_STATION[sid].push({ id_caracteristicas: Number(ec.caracteristicas_id), status: true });
});

function loadEstabelecimentos() {
    return ((ESTABELECIMENTOS_DATA && ESTABELECIMENTOS_DATA.estabelecimento) || [])
        .filter(e => e && e.latitude && e.longitude && e.latitude !== 'null' && e.longitude !== 'null')
        .map(e => {
            const sid = String(e.id);
            return {
                'type': 'Feature',
                'properties': {
                    'estabelecimento_id': e.id,
                    'title':             buildTitle(e.bandeira_ID),
                    'kind':              String(e.tipo_ID) === '2' ? 'recarga' : 'posto',
                    'endereco':          e.endereco,
                    'bandeira_id':       String(e.bandeira_ID || ''),
                    'fuels':             FUELS_BY_STATION[sid] ? Array.from(FUELS_BY_STATION[sid]).join(',') : '',
                    'prices':            JSON.stringify(PRICES_BY_STATION[sid] || {}),
                    'caracteristicas':   JSON.stringify(CARACS_BY_STATION[sid] || [])
                },
                'geometry': { 'type': 'Point', 'coordinates': [parseFloat(e.longitude), parseFloat(e.latitude)] }
            };
        });
}

map.on('load', () => {
    map.addSource('places', { 'type': 'geojson', 'generateId': true, 'data': { 'type': 'FeatureCollection', 'features': [] } });
    ALL_FEATURES = loadEstabelecimentos();
    applyFilters();

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    const ICON_POSTO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 10 11" fill="none"><path d="M1.26172 0.0422211C0.84848 0.152254 0.525715 0.482354 0.415682 0.900481C0.383895 1.02274 0.379004 1.55579 0.379004 4.88614C0.379004 7.08192 0.369223 8.73242 0.356997 8.73242C0.312984 8.73242 0.13204 8.93292 0.0684653 9.05518L0 9.18478V9.78385C0 10.356 0.00244519 10.3878 0.0562393 10.493C0.141821 10.669 0.239628 10.7717 0.408346 10.8622L0.562393 10.9453H3.70446H6.84653L7.00057 10.8622C7.17174 10.7693 7.24509 10.6935 7.3429 10.5076C7.40647 10.3854 7.40892 10.3731 7.41625 9.85231C7.42359 9.42685 7.4187 9.29481 7.38691 9.19211C7.34045 9.02584 7.21819 8.84001 7.11305 8.77399L7.02992 8.72019V6.83006C7.02992 5.7933 7.0397 4.94238 7.05192 4.94238C7.08126 4.94238 7.25487 5.06464 7.294 5.11109C7.41136 5.26025 7.40892 5.22846 7.42115 6.42416L7.43337 7.54895L7.52384 7.73478C7.63388 7.95729 7.7757 8.09422 8.0031 8.20181C8.15226 8.27272 8.18893 8.28006 8.40167 8.28006C8.62173 8.28006 8.64374 8.27517 8.81979 8.18959C9.0423 8.07955 9.17924 7.93773 9.28682 7.71033L9.36507 7.5465L9.37241 5.24803C9.37974 2.70992 9.38219 2.7466 9.22569 2.47274C9.13522 2.30891 8.11558 1.27215 7.98843 1.21102C7.80993 1.12544 7.56786 1.20858 7.48472 1.38218C7.43826 1.47755 7.43337 1.64382 7.47249 1.72206C7.48717 1.75141 7.72924 2.00571 8.01044 2.28935C8.33076 2.61456 8.53371 2.83707 8.55571 2.89331C8.58994 2.974 8.59484 3.25031 8.59484 5.1869V7.39001L8.53371 7.44869C8.45546 7.52939 8.34298 7.52939 8.26474 7.44869L8.20361 7.39001V6.3557C8.20361 5.19668 8.19627 5.13555 8.03733 4.83479C7.86617 4.50469 7.52629 4.2455 7.15951 4.15992L7.02992 4.13057V2.58522C7.02992 1.27704 7.02502 1.01785 6.99324 0.895591C6.8832 0.475019 6.55555 0.149809 6.13253 0.0397758C5.92714 -0.014019 1.46222 -0.0115738 1.26172 0.0422211ZM5.67528 1.24036C5.71196 1.26726 5.76575 1.32105 5.79265 1.35773C5.844 1.42375 5.844 1.45065 5.844 2.54609C5.844 3.64154 5.844 3.66843 5.79265 3.73445C5.76575 3.77113 5.71196 3.82493 5.67528 3.85182C5.60926 3.90317 5.5897 3.90317 3.70446 3.90317C1.81922 3.90317 1.79966 3.90317 1.73364 3.85182C1.69696 3.82493 1.64317 3.77113 1.61627 3.73445C1.56737 3.66843 1.56492 3.6342 1.55758 2.61211C1.55269 2.03016 1.55758 1.52156 1.56492 1.47755C1.58204 1.37974 1.68473 1.25503 1.78499 1.21102C1.84367 1.18412 2.2129 1.17923 3.7338 1.18412C5.58481 1.18901 5.60926 1.18901 5.67528 1.24036Z" fill="#fff"/></svg>';
    const ICON_CARGA_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="11" viewBox="0 0 8 11" fill="none"><path d="M3.30147 10.6807C3.28486 11.0922 3.83298 11.0922 4.04885 10.76L7.91897 4.7088C7.91897 4.7088 8.25122 4.09138 7.57016 4.10742C6.88911 4.12346 4.19839 4.11298 4.19839 4.11298C4.19839 4.11298 4.71318 0.663384 4.68002 0.299178C4.64686 -0.0650291 4.24822 -0.0967409 4.01563 0.204223C3.78304 0.505187 0.0957411 6.32881 0.0957411 6.32881C-0.135478 6.67834 0.095741 6.94601 0.328277 6.94601H3.79971L3.30147 10.6807Z" fill="#FFB819"/></svg>';

    function svgDataURI(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
    function buildMarker(name, opts) {
        const size = 128; const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d'); const inset = 4;
        if (opts.shape === 'square') {
            ctx.fillStyle = opts.bg; roundRect(ctx, inset, inset, size-inset*2, size-inset*2, 28); ctx.fill();
            ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; roundRect(ctx, inset, inset, size-inset*2, size-inset*2, 28); ctx.stroke();
        } else {
            ctx.fillStyle = opts.bg; ctx.beginPath(); ctx.arc(size/2, size/2, size/2-inset, 0, Math.PI*2); ctx.fill();
            ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(size/2, size/2, size/2-inset, 0, Math.PI*2); ctx.stroke();
        }
        const iconImg = new Image();
        iconImg.onload = () => {
            const targetH = size * (opts.iconScale || 0.52); const ratio = iconImg.naturalWidth / iconImg.naturalHeight;
            const drawH = targetH; const drawW = drawH * ratio;
            ctx.drawImage(iconImg, (size-drawW)/2, (size-drawH)/2, drawW, drawH);
            const finalImg = new Image();
            finalImg.onload = () => { if (!map.hasImage(name)) map.addImage(name, finalImg); };
            finalImg.src = canvas.toDataURL();
        };
        iconImg.src = opts.icon;
    }
    buildMarker('marker-posto',   { shape: 'circle', bg: '#735CC5', icon: svgDataURI(ICON_POSTO_SVG), iconScale: 0.52 });
    buildMarker('marker-recarga', { shape: 'square', bg: '#248277', icon: svgDataURI(ICON_CARGA_SVG), iconScale: 0.55 });

    map.addLayer({
        'id': 'places', 'type': 'symbol', 'source': 'places', 'minzoom': 13,
        'layout': {
            'icon-image':             ['match', ['get', 'kind'], 'recarga', 'marker-recarga', 'marker-posto'],
            'icon-size':              0.2,
            'icon-anchor':            'center',
            'icon-allow-overlap':     true,
            'icon-ignore-placement':  true
        }
    });

    map.on('click', 'places', e => {
        const f = e.features && e.features[0];
        if (!f) return;
        const coords = f.geometry.coordinates.slice();
        let caracs = []; try { caracs = JSON.parse(f.properties.caracteristicas || '[]'); } catch {}
        let prices = null; try { prices = JSON.parse(f.properties.prices || '{}'); } catch {}
        const stationId = f.properties.estabelecimento_id || f.properties.id;
        _lastCoords = coords;
        openCard._endereco = f.properties.endereco || '';
        openCard(coords, f.properties.title, f.properties.kind, f.properties.bandeira_id, caracs, prices, stationId);
    });
    map.on('click', e => { if (!map.queryRenderedFeatures(e.point, { layers: ['places'] }).length) closeCard(); });
    map.addInteraction('places-mouseenter-interaction', { type: 'mouseenter', target: { layerId: 'places' }, handler: () => { map.getCanvas().style.cursor = 'pointer'; } });
    map.addInteraction('places-mouseleave-interaction', { type: 'mouseleave', target: { layerId: 'places' }, handler: () => { map.getCanvas().style.cursor = ''; } });
});

let userLocationMarker = null;
const locateBtn = document.getElementById('locate-btn');
function locateUser(silent) {
    if (!('geolocation' in navigator)) { if (!silent) alert('Geolocalização não é suportada neste navegador.'); return; }
    if (locateBtn) locateBtn.classList.add('locating');
    navigator.geolocation.getCurrentPosition(
        pos => {
            if (locateBtn) locateBtn.classList.remove('locating');
            const lngLat = [pos.coords.longitude, pos.coords.latitude];
            const el = document.createElement('div');
            el.className = 'user-location-marker'; el.title = 'Você está aqui';
            if (userLocationMarker) userLocationMarker.remove();
            userLocationMarker = new mapboxgl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
            map.flyTo({ center: lngLat, zoom: 14, essential: true });
        },
        err => {
            if (locateBtn) locateBtn.classList.remove('locating');
            console.warn('Geolocalização falhou (código ' + (err && err.code) + '):', err && err.message);
            if (silent) return;
            if (err && err.code === 1) alert('Permissão de localização negada. Clique no cadeado da barra de endereço, libere a Localização para este site e tente de novo.');
            else alert('Não foi possível obter sua localização. Verifique se a localização do sistema está ligada.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}
if (locateBtn) locateBtn.addEventListener('click', () => locateUser(false));
if (map.loaded()) locateUser(true);
else map.on('load', () => locateUser(true));

});