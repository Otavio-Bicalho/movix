"use strict";

// ===================== SESSÃO =====================
// Chave correta do projeto: "UserLogado" (sessionStorage)
const SESSION_KEY = "UserLogado";

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const session = getSession();
if (!session || !session.oficina_id) {
  window.location.href = "/login.html";
  throw new Error("Sessão inválida.");
}

const OFICINA_ID = session.oficina_id;

// ===================== CHAVES DO LOCALSTORAGE (por oficina) =====================
const CATEGORIAS_KEY = `movix_categorias_${OFICINA_ID}`;
const PRODUTOS_KEY   = `movix_produtos_${OFICINA_ID}`;

const ITENS_POR_PAGINA = 10;

// ===================== PERSISTÊNCIA =====================
function loadCategorias() {
  try {
    const raw = localStorage.getItem(CATEGORIAS_KEY);
    if (!raw) return seedCategorias();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedCategorias();
  } catch {
    return seedCategorias();
  }
}

function loadProdutos() {
  try {
    const raw = localStorage.getItem(PRODUTOS_KEY);
    if (!raw) return seedProdutos();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedProdutos();
  } catch {
    return seedProdutos();
  }
}

function saveCategorias(list) {
  localStorage.setItem(CATEGORIAS_KEY, JSON.stringify(list));
}

function saveProdutos(list) {
  localStorage.setItem(PRODUTOS_KEY, JSON.stringify(list));
}

// ===================== SEEDS =====================
function seedCategorias() {
  const data = [
    { id_categoria: 1, descricao: "Motor",       nome_categoria: "Motor",       status: 0 },
    { id_categoria: 2, descricao: "Elétrica",     nome_categoria: "Elétrica",    status: 0 },
    { id_categoria: 3, descricao: "Suspensão",    nome_categoria: "Suspensão",   status: 0 },
    { id_categoria: 4, descricao: "Freios",       nome_categoria: "Freios",      status: 0 },
    { id_categoria: 5, descricao: "Transmissão",  nome_categoria: "Transmissão", status: 0 },
  ];
  saveCategorias(data);
  return data;
}

function seedProdutos() {
  const data = [
    {
      id_produto: 1, categoria_id: 2, estabelecimento_id: OFICINA_ID,
      nome: "Velas de Ignição BKR6E", descricao: "NGK - Platinum",
      preco_custo: 8.50, valor: 12.50, margem_lucro: 32.00,
      fabricante: "NGK", fornecedor_principal: "AutoPeças",
      imagem_url: "", status: 0, deletado: 0, quantidade: 2, qtd_min: 25
    },
    {
      id_produto: 2, categoria_id: 1, estabelecimento_id: OFICINA_ID,
      nome: "Filtro de Óleo", descricao: "Motor S9 - Original Equipment Mfr.",
      preco_custo: 15.00, valor: 24.99, margem_lucro: 39.98,
      fabricante: "Mann", fornecedor_principal: "Distribuidora X",
      imagem_url: "", status: 0, deletado: 0, quantidade: 18, qtd_min: 25
    },
    {
      id_produto: 3, categoria_id: 1, estabelecimento_id: OFICINA_ID,
      nome: "Óleo Sintético", descricao: "5W-30 - Castrol Edge 1L",
      preco_custo: 9.80, valor: 14.20, margem_lucro: 30.99,
      fabricante: "Castrol", fornecedor_principal: "Lubrificantes BR",
      imagem_url: "", status: 0, deletado: 0, quantidade: 190, qtd_min: 25
    },
  ];
  saveProdutos(data);
  return data;
}

// ===================== ESTADO =====================
let categorias = loadCategorias();
let todosProdutos = loadProdutos();
let produtos = todosProdutos.filter(p => p.estabelecimento_id === OFICINA_ID);

let pendingDeleteId   = null;
let pendingDeleteType = null;
let editId      = null;
let filtroAtual = 'all';
let termoBusca  = '';
let paginaAtual = 1;

// ===================== ELEMENTOS DO DOM =====================
const pecaList      = document.getElementById("pecaList");
const countExibindo = document.getElementById("countExibindo");
const countTotal    = document.getElementById("countTotal");
const valorTotal    = document.getElementById("valorTotal");
const totalAlertas  = document.getElementById("totalAlertas");
const paginationEl  = document.getElementById("pagination");

const deleteModal      = document.getElementById("deleteModal");
const btnDeleteCancel  = document.getElementById("btnDeleteCancel");
const btnDeleteConfirm = document.getElementById("btnDeleteConfirm");

const btnNovaCategoria     = document.getElementById("btnNovaCategoria");
const btnAddCategoria      = document.getElementById("btnAddCategoria");
const categoriaFormWrapper = document.getElementById("categoriaFormWrapper");
const categoriaFormTitle   = document.getElementById("categoriaFormTitle");
const fCatId   = document.getElementById("f-cat-id");
const fCatNome = document.getElementById("f-cat-nome");
const fCatDesc = document.getElementById("f-cat-desc");
const btnCatCancel = document.getElementById("btnCatCancel");
const btnCatSave   = document.getElementById("btnCatSave");
const categoriaTableBody = document.getElementById("categoriaTableBody");
const countCategorias    = document.getElementById("countCategorias");

const btnAdd        = document.getElementById("btnAdd");
const btnFormSave   = document.getElementById("btnFormSave");
const btnFormCancel = document.getElementById("btnFormCancel");
const formTitle     = document.getElementById("formTitle");
const toastEl       = document.getElementById("toast");

const fId         = document.getElementById("f-id");
const fNome       = document.getElementById("f-nome");
const fCategoria  = document.getElementById("f-categoria");
const fPrecoCusto = document.getElementById("f-preco-custo");
const fValor      = document.getElementById("f-valor");
const fMargem     = document.getElementById("f-margem");
const fFabricante = document.getElementById("f-fabricante");
const fFornecedor = document.getElementById("f-fornecedor");
const fQuantidade = document.getElementById("f-quantidade");
const fQtdMin     = document.getElementById("f-qtd-min");
const fDescricao  = document.getElementById("f-descricao");
const fStatus     = document.getElementById("f-status");
const fImagem     = document.getElementById("f-imagem");
const fDeletado   = document.getElementById("f-deletado");

const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput   = document.getElementById('searchInput');

// ===================== MÁSCARA MONETÁRIA =====================
let margemTimer = null;

function calcularMargem() {
  const custo = parseFloat(fPrecoCusto.value.replace(',', '.')) || 0;
  const venda = parseFloat(fValor.value.replace(',', '.'))      || 0;
  if (!fPrecoCusto.value && !fValor.value) { fMargem.value = '0,00%'; return; }
  clearTimeout(margemTimer);
  margemTimer = setTimeout(() => {
    const margem = venda > 0 ? ((venda - custo) / venda) * 100 : 0;
    fMargem.value = margem.toFixed(2).replace('.', ',') + '%';
  }, 800);
}

function maskMoeda(input) {
  input.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '');
    if (v.length === 0) { this.value = ''; calcularMargem(); return; }
    v = (parseInt(v) / 100).toFixed(2);
    this.value = v.replace('.', ',');
    calcularMargem();
  });
}
maskMoeda(fPrecoCusto);
maskMoeda(fValor);

// ===================== NAVEGAÇÃO DE VIEWS =====================
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + viewId);
  if (target) target.classList.add('active');
}

// ===================== CATEGORIAS =====================
function populateCategorias() {
  const select = fCategoria;
  const currentVal = select.value;
  select.innerHTML = '<option value="">Selecione uma categoria</option>';
  categorias
    .filter(c => c.status === 0)
    .forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id_categoria;
      opt.textContent = c.nome_categoria || c.descricao;
      select.appendChild(opt);
    });
  if (currentVal) select.value = currentVal;
}

function renderCategorias() {
  const list = categorias.filter(c => c.status === 0);
  countCategorias.textContent = list.length;
  if (!list.length) {
    categoriaTableBody.innerHTML = `
      <tr><td colspan="3">
        <div class="empty-state">
          <i class="bi bi-tags"></i><p>Nenhuma categoria cadastrada.</p>
        </div>
      </td></tr>`;
    return;
  }
  categoriaTableBody.innerHTML = list.map(c => {
    const possuiItens = categoriaPossuiItens(c.id_categoria);
    return `
      <tr>
        <td><strong>${esc(c.nome_categoria || c.descricao)}</strong></td>
        <td>${esc(c.descricao_extra || '')}</td>
        <td class="col-actions">
          <div class="td-actions">
            <button class="btn-edit-cat" data-id="${c.id_categoria}" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-delete-cat" data-id="${c.id_categoria}"
              ${possuiItens ? 'disabled' : ''}
              title="${possuiItens ? 'Não é possível excluir: há peças nesta categoria' : 'Deletar'}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  categoriaTableBody.querySelectorAll('.btn-edit-cat').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openEditCategoria(parseInt(btn.dataset.id)); });
  });
  categoriaTableBody.querySelectorAll('.btn-delete-cat').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openDeleteCategoria(parseInt(btn.dataset.id)); });
  });
}

function setCategoriaFormVisible(visible) {
  categoriaFormWrapper.style.display = visible ? 'block' : 'none';
  btnNovaCategoria.style.display = visible ? 'none' : '';
}

function openEditCategoria(id) {
  const cat = categorias.find(c => c.id_categoria === id);
  if (!cat) return;
  fCatId.value  = cat.id_categoria;
  fCatNome.value = cat.nome_categoria || cat.descricao;
  fCatDesc.value = cat.descricao_extra || '';
  categoriaFormTitle.textContent = 'Editar Categoria';
  setCategoriaFormVisible(true);
  document.getElementById('err-f-cat-nome').textContent = '';
  fCatNome.classList.remove('error');
  showView('categorias');
}

function openDeleteCategoria(id) {
  if (categoriaPossuiItens(id)) {
    showToast('Não é possível excluir: há peças cadastradas nesta categoria.');
    return;
  }
  pendingDeleteId   = id;
  pendingDeleteType = 'categoria';
  deleteModal.classList.add('open');
}

function clearCategoriaForm() {
  fCatId.value = ''; fCatNome.value = ''; fCatDesc.value = '';
  categoriaFormTitle.textContent = 'Nova Categoria';
  setCategoriaFormVisible(false);
  document.getElementById('err-f-cat-nome').textContent = '';
  fCatNome.classList.remove('error');
}

btnNovaCategoria.addEventListener('click', () => { clearCategoriaForm(); setCategoriaFormVisible(true); showView('categorias'); });
btnAddCategoria.addEventListener('click',  () => { clearCategoriaForm(); showView('categorias'); renderCategorias(); });
document.getElementById('btnCatBack').addEventListener('click', () => { showView('dashboard'); renderDashboard(); });
btnCatCancel.addEventListener('click', clearCategoriaForm);

btnCatSave.addEventListener('click', () => {
  const nome = fCatNome.value.trim();
  if (!nome) {
    document.getElementById('err-f-cat-nome').textContent = 'Nome da categoria é obrigatório.';
    fCatNome.classList.add('error');
    return;
  }
  const descExtra = fCatDesc.value.trim();
  const id = fCatId.value ? parseInt(fCatId.value) : null;

  if (id) {
    const idx = categorias.findIndex(c => c.id_categoria === id);
    if (idx !== -1) {
      categorias[idx].nome_categoria  = nome;
      categorias[idx].descricao       = nome;
      categorias[idx].descricao_extra = descExtra;
      saveCategorias(categorias);
      showToast('Categoria atualizada com sucesso!');
    }
  } else {
    const maxId = categorias.reduce((max, c) => Math.max(max, c.id_categoria || 0), 0);
    categorias.push({ id_categoria: maxId + 1, nome_categoria: nome, descricao: nome, descricao_extra: descExtra, status: 0 });
    saveCategorias(categorias);
    showToast('Categoria cadastrada com sucesso!');
  }
  clearCategoriaForm();
  renderCategorias();
  populateCategorias();
});

// ===================== DASHBOARD / STATS =====================
function renderDashboard() { renderLista(); updateStats(); }

function updateStats() {
  const ativos  = produtos.filter(p => p.deletado === 0);
  const valor   = ativos.reduce((acc, p) => acc + ((p.valor || 0) * (p.quantidade || 0)), 0);
  const alertas = ativos.filter(p => p.quantidade <= p.qtd_min).length;
  valorTotal.textContent   = 'R$ ' + valor.toFixed(2).replace('.', ',');
  totalAlertas.textContent = String(alertas).padStart(2, '0') + ' Itens';
  countTotal.textContent   = ativos.length;
}

// ===================== HELPERS =====================
function formatMoeda(valor) { return 'R$ ' + valor.toFixed(2).replace('.', ','); }

function getCategoriaNome(id) {
  const cat = categorias.find(c => c.id_categoria === id);
  return cat ? (cat.nome_categoria || cat.descricao) : 'N/A';
}

function categoriaPossuiItens(id) {
  return produtos.some(p => p.categoria_id === id && p.deletado === 0);
}

function getDisponibilidade(produto) {
  const qtd = produto.quantidade || 0;
  const min = produto.qtd_min   || 0;
  if (qtd <= 0 || qtd <= min) return { label: 'CRÍTICO',    class: 'badge-critico',   progressClass: 'critico'   };
  if (qtd <= min * 3)         return { label: 'OK',         class: 'badge-ok',        progressClass: 'ok'        };
  return                             { label: 'DISPONÍVEL', class: 'badge-abundante', progressClass: 'abundante' };
}

function getProgressPercent(produto) {
  const qtd = produto.quantidade || 0;
  const min = produto.qtd_min   || 1;
  return Math.min(Math.max((qtd / (min * 10)) * 100, 0), 100);
}

function getProdutosFiltrados() {
  let list = produtos.filter(p => p.deletado === 0);
  if (filtroAtual === 'baixo') list = list.filter(p => p.quantidade <= p.qtd_min);
  if (termoBusca.trim()) {
    const term = termoBusca.toLowerCase().trim();
    list = list.filter(p =>
      p.nome.toLowerCase().includes(term) ||
      (p.descricao && p.descricao.toLowerCase().includes(term)) ||
      getCategoriaNome(p.categoria_id).toLowerCase().includes(term)
    );
  }
  return list;
}

// ===================== PAGINAÇÃO =====================
function renderPaginacao(totalItens) {
  const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA) || 1;
  if (totalPaginas <= 1) { paginationEl.innerHTML = ''; return; }

  let html = `<button class="page-btn" data-page="${paginaAtual - 1}" ${paginaAtual <= 1 ? 'disabled' : ''}><i class="bi bi-chevron-left"></i></button>`;
  const maxVisible = 5;
  let startPage = Math.max(1, paginaAtual - Math.floor(maxVisible / 2));
  let endPage   = Math.min(totalPaginas, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

  if (startPage > 1) { html += `<button class="page-btn" data-page="1">1</button>`; if (startPage > 2) html += `<span class="page-dots">...</span>`; }
  for (let i = startPage; i <= endPage; i++) html += `<button class="page-btn ${i === paginaAtual ? 'active' : ''}" data-page="${i}">${i}</button>`;
  if (endPage < totalPaginas) { if (endPage < totalPaginas - 1) html += `<span class="page-dots">...</span>`; html += `<button class="page-btn" data-page="${totalPaginas}">${totalPaginas}</button>`; }
  html += `<button class="page-btn" data-page="${paginaAtual + 1}" ${paginaAtual >= totalPaginas ? 'disabled' : ''}><i class="bi bi-chevron-right"></i></button>`;

  paginationEl.innerHTML = html;
  paginationEl.querySelectorAll('.page-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      if (!isNaN(page) && page >= 1 && page <= totalPaginas) { paginaAtual = page; renderLista(); }
    });
  });
}

// ===================== LISTA DE PEÇAS =====================
function renderLista() {
  const list        = getProdutosFiltrados();
  const totalItens  = list.length;
  const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA) || 1;
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
  if (paginaAtual < 1)            paginaAtual = 1;

  const inicio      = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const fim         = Math.min(inicio + ITENS_POR_PAGINA, totalItens);
  const itensPagina = list.slice(inicio, fim);

  countExibindo.textContent = totalItens > 0 ? `${inicio + 1} - ${fim}` : '0';

  if (!itensPagina.length) {
    pecaList.innerHTML = `<div class="empty-state"><i class="bi bi-box-seam"></i><p>Nenhuma peça encontrada.</p></div>`;
    renderPaginacao(totalItens);
    return;
  }

  pecaList.innerHTML = itensPagina.map(p => {
    const catNome  = getCategoriaNome(p.categoria_id);
    const disp     = getDisponibilidade(p);
    const progress = getProgressPercent(p);
    const qtd      = p.quantidade || 0;
    const min      = p.qtd_min    || 0;
    let fabricante = p.fabricante || '';
    let detalhe    = p.descricao  || '';
    if (!fabricante && detalhe) {
      const partes = detalhe.split(' - ');
      if (partes.length >= 2) { fabricante = partes[0]; detalhe = partes.slice(1).join(' - '); }
    }
    return `
      <div class="peca-item" data-id="${p.id_produto}">
        <div class="col-item">
          <div class="nome">${esc(p.nome)}</div>
          <div class="detalhes">${fabricante ? `<span class="fabricante">${esc(fabricante)}</span>` : ''}${detalhe ? ` - ${esc(detalhe)}` : ''}</div>
        </div>
        <div class="col-categoria"><span>${esc(catNome)}</span></div>
        <div class="col-disponibilidade">
          <span class="badge-disponibilidade ${disp.class}">${disp.label}</span>
          <div class="progress-wrapper">
            <span class="qtd">${qtd}/${min} unid.</span>
            <div class="progress-bar"><div class="progress-fill ${disp.progressClass}" style="width:${progress}%;"></div></div>
          </div>
        </div>
        <div class="col-preco">${formatMoeda(p.valor)}</div>
        <div class="col-actions">
          <button class="btn-actions" data-id="${p.id_produto}" title="Ações"><i class="bi bi-three-dots-vertical"></i></button>
          <div class="dropdown-actions" id="drop-${p.id_produto}">
            <button class="edit-action"   data-id="${p.id_produto}"><i class="bi bi-pencil"></i> Editar</button>
            <button class="delete-action btn-delete" data-id="${p.id_produto}"><i class="bi bi-trash"></i> Deletar</button>
          </div>
        </div>
      </div>`;
  }).join('');

  pecaList.querySelectorAll('.btn-actions').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const drop = document.getElementById(`drop-${btn.dataset.id}`);
      document.querySelectorAll('.dropdown-actions.open').forEach(d => { if (d !== drop) d.classList.remove('open'); });
      drop.classList.toggle('open');
    });
  });
  pecaList.querySelectorAll('.edit-action').forEach(btn => { btn.addEventListener('click', () => openEdit(btn.dataset.id)); });
  pecaList.querySelectorAll('.delete-action').forEach(btn => { btn.addEventListener('click', () => openDelete(btn.dataset.id)); });
  document.addEventListener('click', e => {
    if (!e.target.closest('.col-actions')) document.querySelectorAll('.dropdown-actions.open').forEach(d => d.classList.remove('open'));
  }, { once: false });

  renderPaginacao(totalItens);
}

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroAtual = btn.dataset.filter;
    paginaAtual = 1;
    renderLista();
  });
});

searchInput.addEventListener('input', () => { termoBusca = searchInput.value; paginaAtual = 1; renderLista(); });

// ===================== FORMULÁRIO DE PEÇA =====================
function clearForm() {
  fId.value = ''; fNome.value = ''; fCategoria.value = '';
  fPrecoCusto.value = ''; fValor.value = ''; fMargem.value = '0,00%';
  fFabricante.value = ''; fFornecedor.value = '';
  fQuantidade.value = 0; fQtdMin.value = 5;
  fDescricao.value = ''; fStatus.value = 0; fImagem.value = ''; fDeletado.value = 0;
  editId = null;
  formTitle.textContent = 'Cadastro de Peça / Produto';
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-field input, .form-field select').forEach(el => el.classList.remove('error'));
  populateCategorias();
}

function fillForm(produto) {
  fId.value         = produto.id_produto;
  fNome.value       = produto.nome;
  fCategoria.value  = produto.categoria_id || '';
  fPrecoCusto.value = (produto.preco_custo  || 0).toFixed(2).replace('.', ',');
  fValor.value      = (produto.valor        || 0).toFixed(2).replace('.', ',');
  fMargem.value     = (produto.margem_lucro || 0).toFixed(2).replace('.', ',') + '%';
  fFabricante.value = produto.fabricante          || '';
  fFornecedor.value = produto.fornecedor_principal || '';
  fQuantidade.value = produto.quantidade || 0;
  fQtdMin.value     = produto.qtd_min    || 5;
  fDescricao.value  = produto.descricao  || '';
  fStatus.value     = produto.status     || 0;
  fImagem.value     = produto.imagem_url || '';
  fDeletado.value   = produto.deletado   || 0;
  editId = produto.id_produto;
  formTitle.textContent = 'Edição de Peça / Produto';
  populateCategorias();
  if (fCategoria.value !== String(produto.categoria_id)) fCategoria.value = produto.categoria_id;
}

function getFormData() {
  const custo = parseFloat(fPrecoCusto.value.replace(',', '.')) || 0;
  const venda = parseFloat(fValor.value.replace(',', '.'))      || 0;
  const margem = venda > 0 ? ((venda - custo) / venda) * 100 : 0;
  return {
    id_produto:           fId.value ? parseInt(fId.value) : null,
    categoria_id:         parseInt(fCategoria.value) || null,
    estabelecimento_id:   OFICINA_ID,
    nome:                 fNome.value.trim(),
    descricao:            fDescricao.value.trim(),
    preco_custo:          custo,
    valor:                venda,
    margem_lucro:         margem,
    fabricante:           fFabricante.value.trim(),
    fornecedor_principal: fFornecedor.value.trim(),
    imagem_url:           fImagem.value.trim(),
    status:               parseInt(fStatus.value)    || 0,
    deletado:             parseInt(fDeletado.value)  || 0,
    quantidade:           parseInt(fQuantidade.value) || 0,
    qtd_min:              parseInt(fQtdMin.value)     || 5,
  };
}

function validateForm() {
  let ok = true;
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-field input, .form-field select').forEach(el => el.classList.remove('error'));
  if (!fNome.value.trim()) {
    document.getElementById('err-f-nome').textContent = 'Nome é obrigatório.';
    fNome.classList.add('error'); ok = false;
  }
  if (!fCategoria.value || parseInt(fCategoria.value) <= 0) {
    document.getElementById('err-f-categoria').textContent = 'Selecione uma categoria válida.';
    fCategoria.classList.add('error'); ok = false;
  }
  return ok;
}

btnAdd.addEventListener('click',        () => { clearForm(); showView('form'); });
btnFormCancel.addEventListener('click', () => { showView('dashboard'); renderDashboard(); });

btnFormSave.addEventListener('click', () => {
  if (!validateForm()) {
    const firstError = document.querySelector('.form-field input.error, .form-field select.error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const data = getFormData();
  try {
    if (editId) {
      const idx = produtos.findIndex(p => p.id_produto === editId);
      if (idx === -1) { showToast('Erro: peça não encontrada.'); return; }
      produtos[idx] = { ...produtos[idx], ...data };
    } else {
      const maxId = todosProdutos.reduce((max, p) => Math.max(max, p.id_produto || 0), 0);
      data.id_produto = maxId + 1;
      produtos.push(data);
      todosProdutos.push(data);
    }
    const outros = todosProdutos.filter(p => p.estabelecimento_id !== OFICINA_ID);
    todosProdutos = [...outros, ...produtos];
    saveProdutos(todosProdutos);
    showToast(editId ? 'Peça atualizada com sucesso!' : 'Peça cadastrada com sucesso!');
    showView('dashboard');
    renderDashboard();
  } catch (error) {
    console.error('Erro ao salvar:', error);
    showToast('Erro ao salvar. Verifique os dados.');
  }
});

function openEdit(id) {
  const p = produtos.find(item => item.id_produto === parseInt(id));
  if (!p) return;
  fillForm(p);
  showView('form');
}

function openDelete(id) {
  pendingDeleteId   = parseInt(id);
  pendingDeleteType = 'produto';
  deleteModal.classList.add('open');
}

// ===================== MODAL DE EXCLUSÃO =====================
btnDeleteCancel.addEventListener('click', () => { deleteModal.classList.remove('open'); pendingDeleteId = null; pendingDeleteType = null; });

btnDeleteConfirm.addEventListener('click', () => {
  if (!pendingDeleteId) { deleteModal.classList.remove('open'); return; }
  if (pendingDeleteType === 'produto') {
    const idx = produtos.findIndex(p => p.id_produto === pendingDeleteId);
    if (idx !== -1) {
      produtos[idx].deletado = 1;
      const idxGlobal = todosProdutos.findIndex(p => p.id_produto === pendingDeleteId && p.estabelecimento_id === OFICINA_ID);
      if (idxGlobal !== -1) todosProdutos[idxGlobal].deletado = 1;
      saveProdutos(todosProdutos);
      showToast('Peça removida com sucesso.');
      renderDashboard();
    }
  } else if (pendingDeleteType === 'categoria') {
    if (categoriaPossuiItens(pendingDeleteId)) {
      showToast('Não é possível excluir: há peças cadastradas nesta categoria.');
      deleteModal.classList.remove('open'); pendingDeleteId = null; pendingDeleteType = null; return;
    }
    const idx = categorias.findIndex(c => c.id_categoria === pendingDeleteId);
    if (idx !== -1) {
      categorias[idx].status = 1;
      saveCategorias(categorias);
      showToast('Categoria removida com sucesso.');
      renderCategorias(); populateCategorias();
    }
  }
  deleteModal.classList.remove('open'); pendingDeleteId = null; pendingDeleteType = null;
});

deleteModal.addEventListener('click', e => {
  if (e.target === deleteModal) { deleteModal.classList.remove('open'); pendingDeleteId = null; pendingDeleteType = null; }
});

// ===================== TOAST =====================
let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// ===================== ESCAPE HTML =====================
function esc(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str ?? ''));
  return d.innerHTML;
}

// ===================== SIDEBAR MOBILE =====================
(function () {
  const sidebar = document.getElementById('sidebar');
  const btnMenu = document.getElementById('menu-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar || !btnMenu || !overlay) return;
  function openSidebar()  { sidebar.classList.add('open');    overlay.classList.add('open');    document.body.style.overflow = 'hidden'; }
  function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; }
  btnMenu.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  overlay.addEventListener('click', closeSidebar);
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => { if (window.innerWidth <= 767) closeSidebar(); });
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) { sidebar.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; }
  });
})();

// ===================== INIT =====================
populateCategorias();
showView('dashboard');
renderDashboard();