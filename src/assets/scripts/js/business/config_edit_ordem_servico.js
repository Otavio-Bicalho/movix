// ===================== SESSÃO =====================
const sessao = JSON.parse(sessionStorage.getItem('UserLogado') || 'null');
if (!sessao || !sessao.oficina_id) {
  window.location.href = 'login_business.html';
}

// ===================== LEITURA / ESCRITA DO LOCALSTORAGE =====================
function ls(chave, prop) {
  try {
    const d = JSON.parse(localStorage.getItem(chave) || 'null');
    return (d && Array.isArray(d[prop])) ? d[prop] : [];
  } catch (e) {
    console.error(`Erro ao ler "${chave}" do localStorage:`, e);
    return [];
  }
}

function salvarOrdens(lista) {
  try {
    localStorage.setItem('ordem_servico', JSON.stringify({ ordem_servico: lista }));
    return true;
  } catch (e) {
    console.error('Erro ao salvar ordens no localStorage:', e);
    return false;
  }
}

// ===================== DADOS GLOBAIS =====================
let oficinas          = [];
let oficina           = {};
let clientes          = [];
let veiculos          = [];
let tiposUserInterno  = [];
let usersInternos     = [];
let mecanicos         = [];
let boxes             = [];
let ordensServico     = [];   // todas as ordens (não filtradas) — necessário para salvar de volta
let ordemServicoAtual = null;

const statusOptions = [
  'Orçamento',
  'Orçamento Aprovado',
  'Orçamento Recusado',
  'Em execução',
  'Aguardando Peças',
  'Concluído',
  'Entregue'
];

let state = {
  clienteId:  null,
  veiculoId:  null,
  mecanicoId: null,
  boxId:      null,
  status:     statusOptions[0],
  descricao:  '',
  previsao:   '',
  itens:      [],
  desconto:   0
};

// ===================== CARREGAMENTO =====================
function carregarDados() {
  const todasOficinas = ls('oficina',           'oficina');
  clientes            = ls('cliente',           'cliente');
  veiculos            = ls('veiculo',           'veiculo');
  tiposUserInterno    = ls('tipo_user_interno', 'tipo_user_interno');
  usersInternos       = ls('user_interno',      'user_interno');
  const todosBoxes    = ls('boxes',             'boxes');
  ordensServico       = ls('ordem_servico',     'ordem_servico'); // todas, para salvar de volta

  // Oficina do usuário logado
  oficina = todasOficinas.find(o =>
    Number(o.id_oficina) === Number(sessao.oficina_id)
  ) || {};

  // Boxes da oficina
  const estId = Number(oficina.estabelecimento_id);
  boxes = todosBoxes.filter(b => Number(b.estabelecimento_id) === estId);

  // Mecânicos da mesma oficina
  const tipoMecanico   = tiposUserInterno.find(t => t.tipo_user === 'Mecânico');
  const tipoMecanicoId = tipoMecanico ? tipoMecanico.tipo_user_interno_id : 2;
  mecanicos = usersInternos.filter(u =>
    u.tipo_user_interno_id === tipoMecanicoId &&
    Number(u.oficina_id) === Number(sessao.oficina_id)
  );
}

// ===================== TOPBAR =====================
function renderTopbar() {
  const nomeEl     = document.getElementById('oficina-name');
  const userNameEl = document.getElementById('user-name');
  const userRoleEl = document.getElementById('user-role');
  const avatarEl   = document.getElementById('user-avatar');

  if (nomeEl) {
    nomeEl.textContent = oficina.nome_oficina
      || (oficina.matriz ? 'Matriz Principal' : '—');
  }

  const userLogado = usersInternos.find(u =>
    Number(u.user_interno_id) === Number(sessao.user_interno_id)
  ) || { nome: sessao.nome };

  const tipoLogado = tiposUserInterno.find(t =>
    t.tipo_user_interno_id === userLogado.tipo_user_interno_id
  ) || {};

  if (userNameEl) userNameEl.textContent = userLogado.nome || sessao.nome || '';
  if (userRoleEl) userRoleEl.textContent = tipoLogado.tipo_user || '';
  if (avatarEl) {
    const partes   = (userLogado.nome || sessao.nome || '').trim().split(/\s+/);
    const iniciais = ((partes[0] || '')[0] || '')
                   + ((partes.length > 1 ? partes[partes.length - 1][0] : '') || '');
    avatarEl.textContent = iniciais.toUpperCase() || '—';
  }
}

// ===================== HELPERS =====================
function obterOsIdAtual() {
  const params  = new URLSearchParams(window.location.search);
  const idParam = params.get('id');
  if (idParam) return Number(idParam.replace(/['"]/g, ''));
  return ordensServico.length ? ordensServico[0].id_ordem_servico : null;
}

function obterOrdemServicoPorId(id) {
  return ordensServico.find(o => o.id_ordem_servico === id) || null;
}

function montarItensDaOS(os) {
  const itensServico = (os.servicos || []).map(s => ({
    id:       `servico-${s.id_servico}`,
    tipo:     'Serviço',
    descricao: s.descricao,
    qtd:       1,
    unitario:  s.valor
  }));

  let itensPeca = [];
  if (Array.isArray(os.pecas_detalhe) && os.pecas_detalhe.length) {
    itensPeca = os.pecas_detalhe.map(p => ({
      id:       `peca-${p.id_peca}`,
      tipo:     'Peça',
      descricao: p.descricao,
      qtd:       p.qtd,
      unitario:  p.valor
    }));
  } else if (Array.isArray(os.produtos_id) && os.produtos_id.length) {
    const totalServicos = itensServico.reduce((acc, i) => acc + i.qtd * i.unitario, 0);
    const saldoPecas    = Math.max((os.valor || 0) - totalServicos, 0);
    const valorUnit     = saldoPecas / os.produtos_id.length;
    itensPeca = os.produtos_id.map(idProduto => ({
      id:       `peca-${idProduto}`,
      tipo:     'Peça',
      descricao: `Produto #${idProduto}`,
      qtd:       1,
      unitario:  Math.round(valorUnit * 100) / 100
    }));
  }

  return [...itensPeca, ...itensServico];
}

function montarState(os) {
  return {
    clienteId:  os.cliente_id,
    veiculoId:  os.veiculo_id,
    mecanicoId: os.user_interno_id,
    boxId:      os.boxes_id,
    status:     os.status,
    descricao:  os.detalhamento_servico,
    previsao:   (os.previsao_entrega || '').slice(0, 10),
    itens:      montarItensDaOS(os),
    desconto:   typeof os.desconto === 'number' ? os.desconto : 0
  };
}

function formatBRL(n) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ===================== POPULATE / RENDER =====================
function populateClientes() {
  const sel = document.getElementById('clienteSelect');
  sel.innerHTML = clientes
    .map(c => `<option value="${c.id_cliente}" ${c.id_cliente === state.clienteId ? 'selected' : ''}>${c.nome}</option>`)
    .join('');
}

function nomeMarca(v) { return Array.isArray(v.marca) ? v.marca[0] : v.marca; }

function populateVeiculos() {
  const sel   = document.getElementById('veiculoSelect');
  const lista = veiculos.filter(v => v.cliente_id === state.clienteId);
  sel.innerHTML = lista
    .map(v => `<option value="${v.id_veiculo}" ${v.id_veiculo === state.veiculoId ? 'selected' : ''}>${nomeMarca(v)} ${v.modelo} (${v.placa}) - ${v.ano}</option>`)
    .join('');
  if (!lista.find(v => v.id_veiculo === state.veiculoId) && lista.length) {
    state.veiculoId = lista[0].id_veiculo;
  }
}

function renderVeiculoInfo() {
  const v = veiculos.find(v => v.id_veiculo === state.veiculoId);
  if (!v) {
    document.getElementById('infoPlaca').textContent   = '—';
    document.getElementById('infoKm').textContent      = '—';
    document.getElementById('infoCorAno').textContent  = '—';
    return;
  }
  document.getElementById('infoPlaca').textContent  = v.placa;
  document.getElementById('infoKm').textContent     = v.quilometragem.toLocaleString('pt-BR');
  document.getElementById('infoCorAno').textContent = `${v.cor} / ${v.ano}`;
}

function populateMecanicos() {
  const sel = document.getElementById('mecanicoSelect');
  sel.innerHTML = mecanicos
    .map(m => `<option value="${m.user_interno_id}" ${m.user_interno_id === state.mecanicoId ? 'selected' : ''}>${m.nome}</option>`)
    .join('');
}

function statusIcon(s, active) {
  const color = active ? 'var(--ink)' : 'var(--muted-faint)';
  const icons = {
    'Orçamento':          `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    'Orçamento Aprovado': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="16 8 10 16 8 13"/></svg>`,
    'Orçamento Recusado': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    'Em execução':        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
    'Aguardando Peças':   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41a2 2 0 0 0-.59 1.42V22"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/></svg>`,
    'Concluído':          `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="16 8 10 16 8 13"/></svg>`,
    'Entregue':           `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`
  };
  return icons[s] || '';
}

function renderStatusList() {
  const wrap = document.getElementById('statusList');
  wrap.innerHTML = statusOptions.map(s => {
    const active = s === state.status;
    return `
      <div class="status-item ${active ? 'active' : ''}" data-status="${s}">
        <div class="left">${statusIcon(s, active)} ${s}</div>
        <div class="check-circle ${active ? 'filled' : ''}">
          ${active ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
        </div>
      </div>`;
  }).join('');
  wrap.querySelectorAll('.status-item').forEach(el => {
    el.addEventListener('click', () => { state.status = el.getAttribute('data-status'); renderStatusList(); });
  });
}

function renderBoxes() {
  const wrap = document.getElementById('boxGrid');
  wrap.innerHTML = boxes
    .map(b => `<div class="box-chip ${b.id_boxes === state.boxId ? 'active' : ''}" data-box="${b.id_boxes}">Box ${b.num_boxe}</div>`)
    .join('');
  wrap.querySelectorAll('.box-chip').forEach(el => {
    el.addEventListener('click', () => { state.boxId = Number(el.getAttribute('data-box')); renderBoxes(); updateBoxLabel(); });
  });
  updateBoxLabel();
}

function updateBoxLabel() {
  const lbl = document.getElementById('boxSelectedLabel');
  const b   = boxes.find(b => b.id_boxes === state.boxId);
  lbl.textContent = b ? `Box ${b.num_boxe} selecionada` : 'Selecione a Box';
}

function renderItensTable() {
  const tbody = document.getElementById('itensTableBody');
  tbody.innerHTML = state.itens.map(item => {
    const total    = item.qtd * item.unitario;
    const tagClass = item.tipo === 'Peça' ? 'peca' : 'servico';
    return `
      <tr data-id="${item.id}">
        <td><span class="tag ${tagClass}">${item.tipo}</span></td>
        <td class="desc-cell" title="${item.descricao}">${item.descricao}</td>
        <td class="num">${item.qtd}</td>
        <td class="num">${formatBRL(item.unitario)}</td>
        <td class="num total-cell">${formatBRL(total)}</td>
        <td class="num action-cell">
          <div class="row-actions">
            <button class="icon-btn" data-edit="${item.id}" title="Editar item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
            </button>
            <button class="icon-btn danger" data-remove="${item.id}" title="Remover item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('button[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeItem(btn.getAttribute('data-remove')));
  });
  tbody.querySelectorAll('button[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = state.itens.find(i => String(i.id) === btn.getAttribute('data-edit'));
      if (item) openItemModal(item.tipo, item);
    });
  });
}

function renderTotals() {
  const pecas    = state.itens.filter(i => i.tipo === 'Peça').reduce((s, i) => s + i.qtd * i.unitario, 0);
  const servicos = state.itens.filter(i => i.tipo === 'Serviço').reduce((s, i) => s + i.qtd * i.unitario, 0);
  const total    = Math.max(pecas + servicos - state.desconto, 0);
  document.getElementById('subtotalPecas').textContent    = formatBRL(pecas);
  document.getElementById('subtotalServicos').textContent = formatBRL(servicos);
  document.getElementById('finPecas').textContent         = formatBRL(pecas);
  document.getElementById('finServicos').textContent      = formatBRL(servicos);
  document.getElementById('finTotal').textContent         = formatBRL(total);
}

function removeItem(id) {
  state.itens = state.itens.filter(i => String(i.id) !== String(id));
  renderItensTable();
  renderTotals();
}

// ===================== MODAL DE ITEM =====================
function openItemModal(tipo, itemParaEditar) {
  const overlay   = document.getElementById('itemModalOverlay');
  const isPeca    = tipo === 'Peça';
  const descInput = document.getElementById('itemModalDescricao');
  document.getElementById('itemModalTipo').value        = tipo;
  document.getElementById('itemModalEditId').value      = itemParaEditar ? itemParaEditar.id : '';
  document.getElementById('itemModalTitle').textContent    = itemParaEditar ? `Editar ${isPeca ? 'Peça' : 'Serviço'}` : `Adicionar ${isPeca ? 'Peça' : 'Serviço'}`;
  document.getElementById('itemModalDescLabel').textContent = isPeca ? 'Descrição da Peça'    : 'Descrição do Serviço';
  document.getElementById('itemModalQtdLabel').textContent  = isPeca ? 'Quantidade'            : 'Qtd / Horas';
  descInput.placeholder = isPeca ? 'Ex: Pastilha de freio dianteira' : 'Ex: Alinhamento e balanceamento';
  descInput.value = itemParaEditar ? itemParaEditar.descricao : '';
  document.getElementById('itemModalQtd').value        = itemParaEditar ? itemParaEditar.qtd      : 1;
  document.getElementById('itemModalUnitario').value   = itemParaEditar ? itemParaEditar.unitario  : 0;
  document.getElementById('itemModalSalvar').textContent = itemParaEditar ? 'Salvar Alterações' : 'Adicionar Item';
  updateItemModalPreview();
  overlay.classList.add('show');
  setTimeout(() => descInput.focus(), 50);
}

function closeItemModal() {
  document.getElementById('itemModalOverlay').classList.remove('show');
}

function updateItemModalPreview() {
  const qtd      = parseFloat(document.getElementById('itemModalQtd').value)      || 0;
  const unitario = parseFloat(document.getElementById('itemModalUnitario').value) || 0;
  document.getElementById('itemModalTotalPreview').textContent = formatBRL(qtd * unitario);
}

function handleItemModalSalvar() {
  const tipo      = document.getElementById('itemModalTipo').value;
  const editId    = document.getElementById('itemModalEditId').value;
  const descricao = document.getElementById('itemModalDescricao').value.trim();
  const qtd       = parseFloat(document.getElementById('itemModalQtd').value)      || 0;
  const unitario  = parseFloat(document.getElementById('itemModalUnitario').value) || 0;

  if (!descricao) { document.getElementById('itemModalDescricao').focus(); return; }

  if (editId) {
    const item = state.itens.find(i => String(i.id) === String(editId));
    if (item) { item.descricao = descricao; item.qtd = qtd; item.unitario = unitario; }
  } else {
    state.itens.push({ id: `${tipo === 'Peça' ? 'peca' : 'servico'}-${Date.now()}`, tipo, descricao, qtd, unitario });
  }
  renderItensTable();
  renderTotals();
  closeItemModal();
}

// ===================== SALVAR OS (atualização) =====================
function persistirOrdemServico() {
  const idx = ordensServico.findIndex(o => o.id_ordem_servico === ordemServicoAtual.id_ordem_servico);
  if (idx === -1) return false;

  const servicos = state.itens
    .filter(i => i.tipo === 'Serviço')
    .map((i, pos) => ({ id_servico: pos + 1, descricao: i.descricao, valor: i.unitario }));

  const pecasDetalhe = state.itens
    .filter(i => i.tipo === 'Peça')
    .map((i, pos) => ({ id_peca: pos + 1, descricao: i.descricao, qtd: i.qtd, valor: i.unitario }));

  const totalGeral = state.itens.reduce((acc, i) => acc + i.qtd * i.unitario, 0) - state.desconto;

  const ordemAtualizada = {
    ...ordensServico[idx],
    status:               state.status,
    detalhamento_servico: state.descricao,
    cliente_id:           state.clienteId,
    veiculo_id:           state.veiculoId,
    user_interno_id:      state.mecanicoId,
    previsao_entrega:     `${state.previsao}T00:00:00`,
    boxes_id:             state.boxId,
    servicos,
    pecas_detalhe:        pecasDetalhe,
    desconto:             state.desconto,
    valor:                Math.round(Math.max(totalGeral, 0) * 100) / 100
  };

  ordensServico[idx]  = ordemAtualizada;
  ordemServicoAtual   = ordemAtualizada;

  return salvarOrdens(ordensServico);
}

function handleSalvar() {
  const ok = persistirOrdemServico();
  if (ok) {
    showToast('Ordem de Serviço salva com sucesso!');
    setTimeout(() => { window.location.href = 'ordemservico.html'; }, 1000);
  } else {
    showToast('Não foi possível salvar. Tente novamente.', true);
  }
}

function handleCancelar() {
  if (confirm('Descartar alterações não salvas?')) {
    window.location.href = 'ordemservico.html';
  }
}

// ===================== TOAST =====================
function showToast(message, isError) {
  let toast = document.getElementById('movixToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'movixToast';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
      color: '#fff', zIndex: '999', boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      transition: 'opacity .25s ease'
    });
    document.body.appendChild(toast);
  }
  toast.style.background = isError ? '#C0392B' : '#16161A';
  toast.textContent       = message;
  toast.style.opacity     = '1';
  clearTimeout(toast._hideTimeout);
  toast._hideTimeout = setTimeout(() => { toast.style.opacity = '0'; }, 2400);
}

// ===================== INIT =====================
function init() {
  carregarDados();

  const osId = obterOsIdAtual();
  ordemServicoAtual = obterOrdemServicoPorId(osId);

  if (!ordemServicoAtual) {
    showToast('Ordem de Serviço não encontrada.', true);
    return;
  }

  state = montarState(ordemServicoAtual);

  renderTopbar();

  document.getElementById('osTitle').textContent    = `Ordem de Serviço #OS-${ordemServicoAtual.id_ordem_servico}`;
  document.getElementById('descricaoServico').value = state.descricao;
  document.getElementById('previsaoEntrega').value  = state.previsao;
  document.getElementById('descontoInput').value    = state.desconto.toFixed(2);

  populateClientes();
  populateVeiculos();
  renderVeiculoInfo();
  populateMecanicos();
  renderStatusList();
  renderBoxes();
  renderItensTable();
  renderTotals();

  document.getElementById('clienteSelect').addEventListener('change', e => {
    state.clienteId = Number(e.target.value); populateVeiculos(); renderVeiculoInfo();
  });
  document.getElementById('veiculoSelect').addEventListener('change', e => {
    state.veiculoId = Number(e.target.value); renderVeiculoInfo();
  });
  document.getElementById('mecanicoSelect').addEventListener('change', e => {
    state.mecanicoId = Number(e.target.value);
  });
  document.getElementById('descricaoServico').addEventListener('input', e => {
    state.descricao = e.target.value;
  });
  document.getElementById('previsaoEntrega').addEventListener('change', e => {
    state.previsao = e.target.value;
  });
  document.getElementById('descontoInput').addEventListener('input', e => {
    state.desconto = parseFloat(e.target.value) || 0; renderTotals();
  });

  document.getElementById('btnAddPeca').addEventListener('click',    () => openItemModal('Peça',    null));
  document.getElementById('btnAddServico').addEventListener('click', () => openItemModal('Serviço', null));
  document.getElementById('itemModalClose').addEventListener('click',    closeItemModal);
  document.getElementById('itemModalCancelar').addEventListener('click', closeItemModal);
  document.getElementById('itemModalSalvar').addEventListener('click',   handleItemModalSalvar);
  document.getElementById('itemModalOverlay').addEventListener('click', e => {
    if (e.target.id === 'itemModalOverlay') closeItemModal();
  });
  document.getElementById('itemModalQtd').addEventListener('input',      updateItemModalPreview);
  document.getElementById('itemModalUnitario').addEventListener('input', updateItemModalPreview);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeItemModal(); });

  document.getElementById('btnSalvar').addEventListener('click',   handleSalvar);
  document.getElementById('btnCancelar').addEventListener('click', handleCancelar);
}

document.addEventListener('DOMContentLoaded', init);