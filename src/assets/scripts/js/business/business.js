(function () {

    // ===================== SESSÃO =====================
    var sessao = JSON.parse(sessionStorage.getItem('UserLogado') || 'null');
    if (!sessao || !sessao.oficina_id) {
        window.location.href = 'login_business.html';
        return;
    }

    // ===================== LEITURA DO LOCALSTORAGE =====================
    function ls(chave, prop) {
        try {
            var d = JSON.parse(localStorage.getItem(chave) || 'null');
            return (d && Array.isArray(d[prop])) ? d[prop] : [];
        } catch (e) { return []; }
    }

    var todasOficinas = ls('oficina', 'oficina');
    var clientes = ls('cliente', 'cliente');
    var veiculos = ls('veiculo', 'veiculo');
    var usuarios = ls('user_interno', 'user_interno');
    var tiposUser = ls('tipo_user_interno', 'tipo_user_interno');
    var todasOrdens = ls('ordem_servico', 'ordem_servico');
    var todosBoxes = ls('boxes', 'boxes');

    // ===================== FILTRA PELA OFICINA DO USUÁRIO LOGADO =====================
    var oficina = todasOficinas.find(function (o) {
        return Number(o.id_oficina) === Number(sessao.oficina_id);
    }) || {};

    var estId = Number(oficina.estabelecimento_id);

    var boxes = todosBoxes.filter(function (b) {
        return Number(b.estabelecimento_id) === estId;
    });

    var ordens = todasOrdens.filter(function (o) {
        return Number(o.estabelecimento_id) === estId;
    });

    // usuário logado pelo id da sessão
    var userLogado = usuarios.find(function (u) {
        return Number(u.user_interno_id) === Number(sessao.user_interno_id);
    }) || { nome: sessao.nome, email: sessao.email };

    // ---- índices por id ----
    function indexBy(arr, key) {
        var m = {};
        arr.forEach(function (it) { m[it[key]] = it; });
        return m;
    }
    var clienteById = indexBy(clientes, 'id_cliente');
    var veiculoById = indexBy(veiculos, 'id_veiculo');
    var usuarioById = indexBy(usuarios, 'user_interno_id');
    var tipoUserById = indexBy(tiposUser, 'tipo_user_interno_id');
    var ordemById = indexBy(ordens, 'id_ordem_servico');

    // ===================== PERSISTÊNCIA (estado dos boxes + status das ordens) =====================
    // chave escopada por oficina para não misturar estado entre unidades
    var STORAGE_KEY = 'movix_business_state_v1_oficina_' + sessao.oficina_id;
    function loadState() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }
    function saveState() {
        try {
            var ordemStatus = {};
            ordens.forEach(function (o) { ordemStatus[o.id_ordem_servico] = o.status; });
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
                boxes: boxModel,
                ordemStatus: ordemStatus
            }));
        } catch (e) { /* localStorage indisponível — segue sem persistir */ }
    }
    var estadoSalvo = loadState();

    // restaura status das ordens antes de calcular estatísticas/renderizar
    if (estadoSalvo && estadoSalvo.ordemStatus) {
        Object.keys(estadoSalvo.ordemStatus).forEach(function (id) {
            if (ordemById[id]) ordemById[id].status = estadoSalvo.ordemStatus[id];
        });
    }

    // ===================== HELPERS DE APRESENTAÇÃO =====================
    var PALETTE = ['#3a6df0', '#e0556b', '#7b4dd6', '#1aa15b', '#e08c12', '#1f6f6b'];
    function iniciais(nome) {
        var p = (nome || '').trim().split(/\s+/);
        return ((p[0] || '')[0] || '').concat((p.length > 1 ? p[p.length - 1][0] : '') || '').toUpperCase() || '—';
    }
    function corDe(id) { return PALETTE[(Number(id) - 1 + PALETTE.length) % PALETTE.length]; }
    function moeda(v) {
        return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function moedaCurta(v) {
        return 'R$ ' + Math.round(Number(v || 0)).toLocaleString('pt-BR');
    }
    function statusInfo(status) {
        var s = (status || '').toLowerCase();
        var concluida = s.indexOf('conclu') === 0 || s.indexOf('finaliz') === 0;
        return {
            rotulo: status || '—',
            classe: concluida ? 'b-done' : 'b-progress',
            ativo: !concluida && s.indexOf('cancel') !== 0,
            aguardando: s.indexOf('aguard') === 0,
            concluida: concluida
        };
    }

    // ===================== TOPBAR =====================
    document.getElementById('oficina-name').textContent =
        oficina.nome_oficina || (oficina.matriz ? 'Matriz Principal' : (oficina.filial ? 'Filial' : '—'));

    var tipoLogado = tipoUserById[userLogado.tipo_user_interno_id] || {};
    document.getElementById('user-name').textContent = userLogado.nome || sessao.nome || '';
    document.getElementById('user-role').textContent = tipoLogado.tipo_user || '';
    document.getElementById('user-avatar').textContent = iniciais(userLogado.nome || sessao.nome);

    // ===================== STATS =====================
    function renderStats() {
        var receitaTotal = ordens.reduce(function (acc, o) { return acc + Number(o.valor || 0); }, 0);
       

        var ativas = ordens.filter(function (o) { return statusInfo(o.status).ativo; });
        var aguardando = ordens.filter(function (o) { return statusInfo(o.status).aguardando; });
        document.getElementById('stat-ativas').textContent = ativas.length;
        document.getElementById('stat-ativas-foot').textContent = aguardando.length + ' ordens aguardando técnico';

        var concluidos = ordens.filter(function (o) { return statusInfo(o.status).concluida; });
        document.getElementById('stat-concluidos').textContent = concluidos.length;
    }
    renderStats();

    // ===================== ORDENS RECENTES =====================
    var carIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13"/><path d="M4 13h16v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><circle cx="7.5" cy="15.5" r=".6"/><circle cx="16.5" cy="15.5" r=".6"/></svg>';

    function veiculosDoCliente(clienteId) {
        return veiculos.filter(function (v) { return v.cliente_id === clienteId; })[0];
    }

    function renderRecentes() {
        var recentes = ordens.slice().sort(function (a, b) {
            return new Date(b.previsao_entrega) - new Date(a.previsao_entrega);
        }).slice(0, 4);

        document.getElementById('ordens-tbody').innerHTML = recentes.map(function (o) {
            var cli = clienteById[o.cliente_id] || {};
            var vei = veiculoById[o.veiculo_id] || veiculosDoCliente(o.cliente_id) || {};
            var st = statusInfo(o.status);
            return '' +
                '<tr>' +
                '<td class="os-id">#OS-' + o.id_ordem_servico + '</td>' +
                '<td><div class="client"><div class="avatar" style="background:' + corDe(o.cliente_id) + '">' +
                iniciais(cli.nome) + '</div><span class="client-name">' + (cli.nome || '—') + '</span></div></td>' +
                '<td><div class="vehicle-main">' + (vei.modelo || '—') + '</div>' +
                '<div class="vehicle-sub">' + (vei.placa || vei.ano || '') + '</div></td>' +
                '<td><span class="badge ' + st.classe + '">' + st.rotulo + '</span></td>' +
                '<td class="value">' + moeda(o.valor) + '</td>' +
                '</tr>';
        }).join('');

        document.getElementById('ordens-cards').innerHTML = recentes.map(function (o) {
            var cli = clienteById[o.cliente_id] || {};
            var vei = veiculoById[o.veiculo_id] || veiculosDoCliente(o.cliente_id) || {};
            var st = statusInfo(o.status);
            return '' +
                '<div class="ocard">' +
                '<div class="ocard-top">' +
                '<span class="ocard-id">#OS-' + o.id_ordem_servico + '</span>' +
                '<span class="badge ' + st.classe + '">' + st.rotulo + '</span>' +
                '</div>' +
                '<div class="ocard-client">' + (cli.nome || '—') + '</div>' +
                '<hr class="ocard-div">' +
                '<div class="ocard-bottom">' +
                '<span class="ocard-vehicle">' + carIcon + (vei.modelo || '—') + '</span>' +
                '<span class="ocard-value">' + moeda(o.valor) + '</span>' +
                '</div>' +
                '</div>';
        }).join('');
    }
    renderRecentes();

    // ===================== BOXES =====================
    var totalBoxes = Number(oficina.numero_boxes) || boxes.length;
    var boxPorNumero = indexBy(boxes, 'num_boxe');
    var boxModel = [];
    for (var n = 1; n <= totalBoxes; n++) {
        var ex = boxPorNumero[n];
        boxModel.push(ex
            ? { num_boxe: n, status: !!ex.status, ordem_servico_id: ex.ordem_servico_id, veiculo_id: ex.veiculo_id }
            : { num_boxe: n, status: false, ordem_servico_id: null, veiculo_id: null });
    }

    if (estadoSalvo && estadoSalvo.boxes) {
        var boxSalvoPorNumero = indexBy(estadoSalvo.boxes, 'num_boxe');
        boxModel.forEach(function (b) {
            var s = boxSalvoPorNumero[b.num_boxe];
            if (s) { b.status = !!s.status; b.ordem_servico_id = s.ordem_servico_id; b.veiculo_id = s.veiculo_id; }
        });
    }

    var boxesList = document.getElementById('boxes-list');
    var boxesMobile = document.getElementById('boxes-mobile');

    function cardOcupado(b) {
        var ordem = ordemById[b.ordem_servico_id] || {};
        var vei = veiculoById[b.veiculo_id] || {};
        var mec = usuarioById[ordem.user_interno_id] || {};
        return '' +
            '<div class="box-card" draggable="true" data-box="' + b.num_boxe + '">' +
            '<div class="box-head"><span class="box-num">BOX ' + b.num_boxe + '</span>' +
            '<span class="box-state s-busy">Ocupado</span></div>' +
            '<span class="box-vehicle">' + (vei.modelo || '—') + '</span>' +
            '<span class="box-service">' + (ordem.detalhamento_servico || '—') + '</span>' +
            '<span class="box-mech">' +
            '<span class="tech-avatar" style="background:' + corDe(ordem.user_interno_id) + '">' +
            iniciais(mec.nome) + '</span>' +
            'Técnico: ' + (mec.nome || '—') +
            '</span>' +
            '</div>';
    }
    function cardVazio(b) {
        return '' +
            '<div class="box-card empty" data-box="' + b.num_boxe + '">' +
            '<div class="box-head"><span class="box-num">BOX ' + b.num_boxe + '</span>' +
            '<span class="box-state s-free">Vazio</span></div>' +
            '<a href="new_ordemservico.html">' +
            '<span class="box-assign">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<circle cx="12" cy="12" r="9"/>' +
            '<path d="M12 8v8M8 12h8"/>' +
            '</svg>' +
            'Atribuir Ordem' +
            '</span>' +
            '</a>' +
            '</div>';
    }

    var carIconMb = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13"/><path d="M4 13h16v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><circle cx="7.5" cy="15.5" r=".6"/><circle cx="16.5" cy="15.5" r=".6"/></svg>';
    var checkIconMb = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>';
    function mboxCard(b) {
        var cls = b.status ? 'ocupado' : 'vazio';
        return '' +
            '<div class="mbox">' +
            '<div class="mbox-title">Box ' + b.num_boxe + '</div>' +
            '<div class="mbox-ico ' + cls + '">' + (b.status ? carIconMb : checkIconMb) + '</div>' +
            '<div class="mbox-state ' + cls + '">' + (b.status ? 'OCUPADO' : 'VAZIO') + '</div>' +
            '<div class="mbox-bar ' + cls + '"></div>' +
            '</div>';
    }
    function renderBoxes() {
        boxesList.innerHTML = boxModel.map(function (b) {
            return b.status ? cardOcupado(b) : cardVazio(b);
        }).join('');
        boxesMobile.innerHTML =
            '<div class="boxes-mobile-head"><h2>Status dos Boxes</h2>' +
            '<span class="total">Total: ' + boxModel.length + '</span></div>' +
            '<div class="mbox-strip">' + boxModel.map(mboxCard).join('') + '</div>';
    }
    renderBoxes();

    // ---- arrastar e soltar ----
    var dragFrom = null;
    boxesList.addEventListener('dragstart', function (e) {
        var card = e.target.closest('.box-card');
        if (!card || card.classList.contains('empty')) { e.preventDefault(); return; }
        dragFrom = Number(card.getAttribute('data-box'));
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(dragFrom));
    });
    boxesList.addEventListener('dragend', function () {
        dragFrom = null;
        Array.prototype.forEach.call(boxesList.querySelectorAll('.box-card'), function (c) {
            c.classList.remove('dragging', 'drop-target');
        });
    });
    boxesList.addEventListener('dragover', function (e) {
        var card = e.target.closest('.box-card');
        if (!card || dragFrom == null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    boxesList.addEventListener('dragenter', function (e) {
        var card = e.target.closest('.box-card');
        if (!card || dragFrom == null) return;
        if (Number(card.getAttribute('data-box')) !== dragFrom) card.classList.add('drop-target');
    });
    boxesList.addEventListener('dragleave', function (e) {
        var card = e.target.closest('.box-card');
        if (card && !card.contains(e.relatedTarget)) card.classList.remove('drop-target');
    });
    boxesList.addEventListener('drop', function (e) {
        e.preventDefault();
        var card = e.target.closest('.box-card');
        if (!card || dragFrom == null) return;
        var to = Number(card.getAttribute('data-box'));
        if (to === dragFrom) return;
        var a = boxModel[dragFrom - 1];
        var b = boxModel[to - 1];
        var tmp = { status: a.status, ordem_servico_id: a.ordem_servico_id, veiculo_id: a.veiculo_id };
        a.status = b.status; a.ordem_servico_id = b.ordem_servico_id; a.veiculo_id = b.veiculo_id;
        b.status = tmp.status; b.ordem_servico_id = tmp.ordem_servico_id; b.veiculo_id = tmp.veiculo_id;
        renderBoxes();
        saveState();
    });

    // ---- atribuir ordem a box vazio ----
    var assignOverlay = document.getElementById('assign-overlay');
    var assignModal = document.getElementById('assign-modal');
    var assignBody = document.getElementById('assign-body');
    var assignSub = document.getElementById('assign-sub');
    var assignClose = document.getElementById('assign-close');
    var assignBoxAtual = null;

    function ordensLivres() {
        var ocupadas = {};
        boxModel.forEach(function (b) { if (b.ordem_servico_id) ocupadas[b.ordem_servico_id] = true; });
        return ordens.filter(function (o) { return !ocupadas[o.id_ordem_servico]; });
    }

    function abrirAssign(numBox) {
        assignBoxAtual = numBox;
        assignSub.textContent = 'Selecione uma ordem para o BOX ' + numBox;
        var livres = ordensLivres();
        if (!livres.length) {
            assignBody.innerHTML = '<div class="assign-empty">Nenhuma ordem disponível para atribuição.<br>Todas as ordens já estão alocadas em boxes.</div>';
        } else {
            assignBody.innerHTML = livres.map(function (o) {
                var cli = clienteById[o.cliente_id] || {};
                var vei = veiculosDoCliente(o.cliente_id) || {};
                return '' +
                    '<button type="button" class="assign-item" data-ordem="' + o.id_ordem_servico + '">' +
                    '<span class="ai-avatar" style="background:' + corDe(o.cliente_id) + '">' + iniciais(cli.nome) + '</span>' +
                    '<span class="ai-main">' +
                    '<span class="ai-top">' +
                    '<span class="ai-os">#OS-' + o.id_ordem_servico + '</span>' +
                    '<span class="ai-client">' + (cli.nome || '—') + '</span>' +
                    '</span>' +
                    '<span class="ai-sub">' + (vei.modelo || '—') + ' · ' + (o.detalhamento_servico || '—') + '</span>' +
                    '</span>' +
                    '<span class="ai-value">' + moeda(o.valor) + '</span>' +
                    '</button>';
            }).join('');
        }
        assignOverlay.classList.add('show');
        assignModal.classList.add('show');
    }

    function fecharAssign() {
        assignOverlay.classList.remove('show');
        assignModal.classList.remove('show');
        assignBoxAtual = null;
    }

    function atribuirOrdem(ordemId) {
        var ordem = ordemById[ordemId];
        if (!ordem || assignBoxAtual == null) return;
        var vei = veiculosDoCliente(ordem.cliente_id) || {};
        var b = boxModel[assignBoxAtual - 1];
        b.status = true;
        b.ordem_servico_id = ordem.id_ordem_servico;
        b.veiculo_id = vei.id_veiculo || null;
        ordem.status = 'Em execução';
        renderBoxes();
        renderStats();
        renderRecentes();
        saveState();
        fecharAssign();
    }

    boxesList.addEventListener('click', function (e) {
        var vazio = e.target.closest('.box-card.empty');
        if (!vazio) return;
        abrirAssign(Number(vazio.getAttribute('data-box')));
    });
    assignBody.addEventListener('click', function (e) {
        var item = e.target.closest('.assign-item');
        if (!item) return;
        atribuirOrdem(Number(item.getAttribute('data-ordem')));
    });
    assignClose.addEventListener('click', fecharAssign);
    assignOverlay.addEventListener('click', fecharAssign);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && assignModal.classList.contains('show')) fecharAssign();
    });

    // ===================== MENU MOBILE (drawer) =====================
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    var toggle = document.getElementById('menu-toggle');
    function fecharMenu() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }
    if (toggle) toggle.addEventListener('click', function () { sidebar.classList.add('open'); overlay.classList.add('show'); });
    if (overlay) overlay.addEventListener('click', fecharMenu);
    Array.prototype.forEach.call(document.querySelectorAll('.nav-item'), function (a) {
        a.addEventListener('click', fecharMenu);
    });

    // ===================== MENU DE AÇÕES DAS ORDENS (⋮) =====================
    var rowMenuPop = document.getElementById('row-menu-pop');
    function fecharRowMenu() { rowMenuPop.style.display = 'none'; }
    document.addEventListener('click', function (e) {
        var trigger = e.target.closest('.row-menu');
        if (trigger) {
            e.stopPropagation();
            var aberto = rowMenuPop.style.display === 'block' && rowMenuPop._anchor === trigger;
            if (aberto) { fecharRowMenu(); return; }
            rowMenuPop._anchor = trigger;
            rowMenuPop.style.display = 'block';
            var r = trigger.getBoundingClientRect();
            var w = rowMenuPop.offsetWidth;
            var left = Math.min(r.right - w, window.innerWidth - w - 8);
            rowMenuPop.style.left = Math.max(8, left) + 'px';
            rowMenuPop.style.top = (r.bottom + 6) + 'px';
            return;
        }
        if (!e.target.closest('#row-menu-pop')) fecharRowMenu();
    });
    Array.prototype.forEach.call(rowMenuPop.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () { fecharRowMenu(); });
    });
    window.addEventListener('resize', fecharRowMenu);
    window.addEventListener('scroll', fecharRowMenu, true);

})();