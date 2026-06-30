
const sessaoCron = JSON.parse(sessionStorage.getItem('UserpfLogado') || 'null');


function getVeiculoAtual() {

    const params = new URLSearchParams(window.location.search);
    const idUrl  = Number(params.get("veiculo_id"));
    if (idUrl) return idUrl;

   
    if (sessaoCron) {
        try {
            const raw    = localStorage.getItem("meus_veiculos");
            const d      = JSON.parse(raw || "null");
            const lista  = Array.isArray(d) ? d : (d?.meus_veiculos || []);
            const veiculo = lista.find(v =>
                Number(v.usuario_id) === Number(sessaoCron.id_usuario) && v.status
            );
            if (veiculo) return veiculo.id_meuveiculo;
        } catch { /* silently */ }
    }
    return null;
}

function getLancamentos() {
    try {
        const raw = localStorage.getItem("lancamento") || localStorage.getItem("lancamentos");
        if (!raw) return [];
        const d = JSON.parse(raw);
        if (Array.isArray(d))                  return d;
        if (d && Array.isArray(d.lancamento))  return d.lancamento;
        return [];
    } catch { return []; }
}

function saveLancamentos(lista) {
    localStorage.setItem("lancamento", JSON.stringify({ lancamento: lista }));
}

async function seedLancamentos() {
    if (localStorage.getItem("lancamento") !== null) return;
    try {
        const res  = await fetch("../assets/scripts/lancamentos.json");
        const json = await res.json();
        localStorage.setItem("lancamento", JSON.stringify(json));
    } catch (e) { console.warn("Seed lancamentos falhou:", e); }
}

function formatDateBR(dateStr) {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("pt-BR");
}

function normalizeDate(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
}


function renderLancamentos(lista) {
    const container = document.getElementById("timeline-wrapper");
    if (!container) return;
    container.innerHTML = "";

    if (!lista.length) {
        container.innerHTML = `<p style="padding:20px;">Nenhum lançamento encontrado</p>`;
        return;
    }

    lista.forEach(l => {
        const data  = formatDateBR(l.data_fim);
        const valor = Number(l.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

        container.innerHTML += `
            <div class="cards">
                <div class="timeline"><div class="bolinha"></div></div>
                <div class="lancamento">
                    <div class="textos">
                        <p>${l.tipo_lancamento}</p>
                        <p class="titulo"><strong>${l.evento}</strong></p>
                        <p>${data}</p>
                        <p><strong>${valor}</strong></p>
                    </div>
                    <div class="botoes">
                        <a href="../pages/edit_cronograma.html?id=${l.id_lancamento}">
                            <img src="../assets/img/icons/pencil.svg">
                        </a>
                        <img src="../assets/img/icons/trash.svg"
                             onclick="openDeleteModal(${l.id_lancamento})"
                             style="cursor:pointer;">
                    </div>
                </div>
            </div>`;
    });
}

function viewLancamentos() {
    const VEICULO_ATUAL = getVeiculoAtual();
    const lancamentos   = getLancamentos();

    const filtrados = lancamentos
        .filter(l =>
            (VEICULO_ATUAL ? l.meus_veiculos_id == VEICULO_ATUAL : true) &&
            l.status !== false
        )
        .sort((a, b) => new Date(b.data_fim) - new Date(a.data_fim));

    renderLancamentos(filtrados);
}


function filtrarLancamentos(texto) {
    const VEICULO_ATUAL = getVeiculoAtual();
    const busca         = texto.toLowerCase().trim();

    const filtrados = getLancamentos()
        .filter(l =>
            (VEICULO_ATUAL ? l.meus_veiculos_id == VEICULO_ATUAL : true) &&
            l.status !== false
        )
        .filter(l =>
            l.evento?.toLowerCase().includes(busca)           ||
            l.tipo_lancamento?.toLowerCase().includes(busca)  ||
            String(l.valor).includes(busca)                   ||
            normalizeDate(l.data_inicio).includes(busca)      ||
            normalizeDate(l.data_fim).includes(busca)
        )
        .sort((a, b) => new Date(b.data_fim) - new Date(a.data_fim));

    renderLancamentos(filtrados);
}


let idParaDeletar = null;
const modal      = document.getElementById("deleteModal");
const cancelBtn  = document.getElementById("cancelBtn");
const confirmBtn = document.getElementById("confirmBtn");

function openDeleteModal(id) { idParaDeletar = id; modal?.classList.add("active"); }
function closeModal()        { modal?.classList.remove("active"); idParaDeletar = null; }

cancelBtn?.addEventListener("click", closeModal);
modal?.addEventListener("click", e => { if (e.target === modal) closeModal(); });

confirmBtn?.addEventListener("click", () => {
    const lancamentos = getLancamentos();
    const index       = lancamentos.findIndex(l => l.id_lancamento === idParaDeletar);
    if (index !== -1) { lancamentos[index].status = false; saveLancamentos(lancamentos); }
    closeModal();
    viewLancamentos();
});


function insertLancamento() {
    const VEICULO_ATUAL = getVeiculoAtual();
    if (!VEICULO_ATUAL) { alert("Nenhum veículo selecionado."); return; }

    const lancamentos = getLancamentos();
    const tipo        = document.getElementById("tipo_evento").value;
    const inputsText  = document.querySelectorAll('input[type="text"]');
    const dates       = document.querySelectorAll('input[type="date"]');

    const evento     = inputsText[0]?.value || "";
    const odometroRaw = inputsText[1]?.value || "";
    const valorRaw    = inputsText[2]?.value || "";
    const dataInicio  = dates[0]?.value || "";
    const dataFim     = dates[1]?.value || "";

    if (!tipo || !evento || !dataInicio || !dataFim) {
        alert("Preencha os campos obrigatórios");
        return;
    }

    const maxId = lancamentos.length
        ? Math.max(...lancamentos.map(l => Number(l.id_lancamento) || 0))
        : 0;

    const novo = {
        id_lancamento:    maxId + 1,
        meus_veiculos_id: VEICULO_ATUAL,
        tipo_lancamento:  tipo,
        evento,
        odometro:    Number(odometroRaw.replace(/[^\d]/g, "")),
        data_inicio: dataInicio,
        data_fim:    dataFim,
        valor:       Number(valorRaw.replace("R$", "").replace(/\./g, "").replace(",", ".")),
        status:      true
    };

    lancamentos.push(novo);
    saveLancamentos(lancamentos);

    document.querySelector(".form-evento")?.reset();
    window.location.href = "../pages/view_cronograma.html";
}


function getIdFromURL() {
    return Number(new URLSearchParams(window.location.search).get("id"));
}

function getLancamentoById(id) {
    return getLancamentos().find(l => l.id_lancamento === id);
}

function fillForm(l) {
    if (!l) return;
    document.getElementById("tipo_evento").value = l.tipo_lancamento;

    const inputsText = document.querySelectorAll('input[type="text"]');
    const dates      = document.querySelectorAll('input[type="date"]');

    if (inputsText[0]) inputsText[0].value = l.evento;
    if (inputsText[1]) inputsText[1].value = l.odometro;
    if (inputsText[2]) inputsText[2].value = "R$ " + Number(l.valor).toFixed(2).replace(".", ",");
    if (dates[0])      dates[0].value      = l.data_inicio;
    if (dates[1])      dates[1].value      = l.data_fim;
}


function updateLancamento(id) {
    const lancamentos = getLancamentos();
    const index       = lancamentos.findIndex(l => l.id_lancamento === id);
    if (index === -1) return alert("Lançamento não encontrado");

    const tipo        = document.getElementById("tipo_evento").value;
    const inputsText  = document.querySelectorAll('input[type="text"]');
    const dates       = document.querySelectorAll('input[type="date"]');

    lancamentos[index] = {
        ...lancamentos[index],
        tipo_lancamento: tipo,
        evento:          inputsText[0]?.value || lancamentos[index].evento,
        odometro:        Number((inputsText[1]?.value || "0").replace(/[^\d]/g, "")),
        data_inicio:     dates[0]?.value      || lancamentos[index].data_inicio,
        data_fim:        dates[1]?.value      || lancamentos[index].data_fim,
        valor:           Number(
            (inputsText[2]?.value || "0")
                .replace("R$", "").replace(/\./g, "").replace(",", ".")
        )
    };

    saveLancamentos(lancamentos);
    window.location.href = "../pages/view_cronograma.html";
}

document.addEventListener("DOMContentLoaded", async () => {
    await seedLancamentos();
    viewLancamentos();

    const form   = document.querySelector(".form-evento");
    const search = document.querySelector(".search");
    const id     = getIdFromURL();
    const lanc   = id ? getLancamentoById(id) : null;

    if (lanc) fillForm(lanc);

    form?.addEventListener("submit", e => {
        e.preventDefault();
        if (lanc) updateLancamento(id);
        else insertLancamento();
    });

    search?.addEventListener("input", e => filtrarLancamentos(e.target.value));
});