  // ===================== SESSÃO =====================
  const sessao = JSON.parse(sessionStorage.getItem('UserLogado') || 'null');
  if (!sessao || !sessao.oficina_id) {
    window.location.href = 'login_business.html';
  }

  // ===================== LEITURA DO LOCALSTORAGE =====================
  function ls(chave, prop) {
    try {
      const d = JSON.parse(localStorage.getItem(chave) || 'null');
      return (d && Array.isArray(d[prop])) ? d[prop] : [];
    } catch (e) {
      console.error(`Erro ao ler "${chave}" do localStorage:`, e);
      return [];
    }
  }

  // ===================== DADOS GLOBAIS =====================
  let oficinas         = [];
  let oficina          = {};
  let clientes         = [];
  let veiculos         = [];
  let tiposUserInterno = [];
  let usersInternos    = [];
  let boxes            = [];
  let ordensServico    = [];

  const PAGE_SIZE = 5;
  let paginaAtual   = 1;
  let ordensFiltradas = [];

  // ===================== CARREGAMENTO =====================
  function carregarDados() {
    const todasOficinas = ls('oficina',           'oficina');
    clientes            = ls('cliente',           'cliente');
    veiculos            = ls('veiculo',           'veiculo');
    tiposUserInterno    = ls('tipo_user_interno', 'tipo_user_interno');
    usersInternos       = ls('user_interno',      'user_interno');
    boxes               = ls('boxes',             'boxes');
    const todasOrdens   = ls('ordem_servico',     'ordem_servico');

    // Oficina do usuário logado
    oficina = todasOficinas.find(o =>
      Number(o.id_oficina) === Number(sessao.oficina_id)
    ) || {};

    // Exibe apenas as ordens do estabelecimento da oficina logada
    const estId = Number(oficina.estabelecimento_id);
    ordensServico = todasOrdens.filter(o =>
      Number(o.estabelecimento_id) === estId
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
  function normalize(str) {
    return (str || '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function formatBRL(n) {
    return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatarData(data) {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  function getCliente(id)  { return clientes.find(c => c.id_cliente === id)         || null; }
  function getVeiculo(id)  { return veiculos.find(v => v.id_veiculo === id)          || null; }
  function getMecanico(id) { return usersInternos.find(u => u.user_interno_id === id) || null; }

  // ===================== STATUS =====================
  function statusVisual(status) {
    const s = normalize(status);
    if (s.includes('execucao') || s.includes('andamento'))
      return { classe: 'blue',   icon: '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>' };
    if (s.includes('aguardando'))
      return { classe: 'red',    icon: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>' };
    if (s.includes('concluido'))
      return { classe: 'green',  icon: '<polyline points="20 6 9 17 4 12"/>' };
    if (s.includes('aprovado'))
      return { classe: 'green',  icon: '<circle cx="12" cy="12" r="10"/><polyline points="16 8 10 16 8 13"/>' };
    if (s.includes('recusado'))
      return { classe: 'red',    icon: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' };
    if (s.includes('orcamento'))
      return { classe: 'yellow', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/>' };
    if (s.includes('entregue'))
      return { classe: 'gray',   icon: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>' };
    return { classe: 'gray', icon: '<circle cx="12" cy="12" r="10"/>' };
  }

  function renderStatusPill(status) {
    const v = statusVisual(status);
    return `<span class="status-pill ${v.classe}">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${v.icon}</svg>
      ${status}
    </span>`;
  }

  // ===================== FILTROS =====================
  function aplicarFiltros() {
    const statusSel  = document.getElementById('filtroStatus').value;
    const periodoSel = document.getElementById('filtroPeriodo').value;
    const searchEl   = document.getElementById('searchInput');
    const termoBusca = searchEl ? normalize(searchEl.value) : '';

    let lista = [...ordensServico];

    if (statusSel && normalize(statusSel) !== 'todos os status' && statusSel !== 'todos') {
      const statusNorm = normalize(statusSel);
      lista = lista.filter(os => normalize(os.status) === statusNorm);
    }

    const hoje  = new Date();
    const umDia = 24 * 60 * 60 * 1000;
    lista = lista.filter(os => {
      if (!os.previsao_entrega) return true;
      const diffDias = (hoje - new Date(os.previsao_entrega)) / umDia;
      switch (periodoSel) {
        case 'Última Semana':    return diffDias <= 7;
        case 'Últimos 30 dias':  return diffDias <= 30;
        case 'Últimos 3 Meses':  return diffDias <= 90;
        case 'Últimos 6 Meses':  return diffDias <= 180;
        case 'Últimos 12 Meses': return diffDias <= 365;
        default: return true;
      }
    });

    if (termoBusca) {
      lista = lista.filter(os => {
        const cliente = getCliente(os.cliente_id);
        const veiculo = getVeiculo(os.veiculo_id);
        const texto   = [
          `os-${os.id_ordem_servico}`,
          cliente ? cliente.nome : '',
          veiculo ? veiculo.modelo : '',
          veiculo ? veiculo.placa  : ''
        ].map(normalize).join(' ');
        return texto.includes(termoBusca);
      });
    }

    ordensFiltradas = lista;
    paginaAtual     = 1;
    renderIndicadores(lista);
    renderTabela();
  }

  function renderIndicadores(lista) {
    document.getElementById('totalAtivas').textContent = lista.filter(os => {
      const s = normalize(os.status);
      return s !== 'orcamento recusado' && s !== 'entregue';
    }).length;
    document.getElementById('totalAguardando').textContent =
      lista.filter(os => normalize(os.status).includes('aguardando')).length;
    document.getElementById('totalConcluido').textContent =
      lista.filter(os => normalize(os.status) === 'concluido').length;
  }

  function renderTabela() {
    const tbody       = document.getElementById('tbodyOs');
    const totalPaginas = Math.max(Math.ceil(ordensFiltradas.length / PAGE_SIZE), 1);
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

    const inicio = (paginaAtual - 1) * PAGE_SIZE;
    const pagina = ordensFiltradas.slice(inicio, inicio + PAGE_SIZE);

    if (!pagina.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="8">Nenhuma Ordem de Serviço encontrada.</td></tr>`;
    } else {
      tbody.innerHTML = pagina.map(os => {
        const cliente  = getCliente(os.cliente_id);
        const veiculo  = getVeiculo(os.veiculo_id);
        const mecanico = getMecanico(os.user_interno_id);
        return `
          <tr>
            <td>#OS-${os.id_ordem_servico}</td>
            <td>${formatarData(os.previsao_entrega)}</td>
            <td>
              ${cliente ? cliente.nome : '—'}
              <div class="cell-sub">${cliente ? cliente.telefone : ''}</div>
            </td>
            <td>
              ${veiculo ? veiculo.modelo : '—'}
              <div class="cell-sub">${veiculo ? veiculo.placa : ''}</div>
            </td>
            <td><div class="mecanico-cell">${mecanico ? mecanico.nome : '—'}</div></td>
            <td>${renderStatusPill(os.status)}</td>
            <td class="num total-price">${formatBRL(os.valor)}</td>
            <td class="num">
              <div class="row-actions-table">
                <a class="icon-btn" href="edit_ordemservico.html?id=${os.id_ordem_servico}" title="Editar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                </a>
              </div>
            </td>
          </tr>`;
      }).join('');
    }

    document.getElementById('footerResumo').textContent =
      `Exibindo ${pagina.length} de ${ordensFiltradas.length} resultados`;

    renderPaginacao(totalPaginas);
  }

  function renderPaginacao(totalPaginas) {
    const wrap = document.getElementById('pagination');
    let botoes = `<button class="page-btn" id="pagAnterior" ${paginaAtual === 1 ? 'disabled' : ''}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
    </button>`;
    for (let p = 1; p <= totalPaginas; p++) {
      botoes += `<button class="page-btn ${p === paginaAtual ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
    botoes += `<button class="page-btn" id="pagProxima" ${paginaAtual === totalPaginas ? 'disabled' : ''}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`;
    wrap.innerHTML = botoes;

    wrap.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => { paginaAtual = Number(btn.getAttribute('data-page')); renderTabela(); });
    });
    document.getElementById('pagAnterior').addEventListener('click', () => {
      if (paginaAtual > 1) { paginaAtual--; renderTabela(); }
    });
    document.getElementById('pagProxima').addEventListener('click', () => {
      if (paginaAtual < totalPaginas) { paginaAtual++; renderTabela(); }
    });
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
    toast._hideTimeout = setTimeout(() => { toast.style.opacity = '0'; }, 2200);
  }

  // ===================== INIT =====================
  function init() {
    carregarDados();
    renderTopbar();
    aplicarFiltros();

    document.getElementById('filtroStatus').addEventListener('change',  aplicarFiltros);
    document.getElementById('filtroPeriodo').addEventListener('change', aplicarFiltros);
    const searchEl = document.getElementById('searchInput');
    if (searchEl) searchEl.addEventListener('input', aplicarFiltros);
  }

  document.addEventListener('DOMContentLoaded', init);