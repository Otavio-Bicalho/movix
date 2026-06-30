const STORAGE_CLIENTE = "cliente";
const STORAGE_VEICULO = "veiculo";

const bancoClientes = JSON.parse(localStorage.getItem(STORAGE_CLIENTE) || "{}");
let clientes = Array.isArray(bancoClientes.cliente) ? bancoClientes.cliente : [];

const bancoVeiculos = JSON.parse(localStorage.getItem(STORAGE_VEICULO) || "{}");
const veiculos = Array.isArray(bancoVeiculos.veiculo) ? bancoVeiculos.veiculo : [];

// ---------- Utilitários de ID ----------
function idValido(id) {
    return id !== null && id !== undefined && String(id).trim() !== "" && String(id) !== "NaN";
}

function gerarNovoId() {
    let novo;
    do {
        novo = Date.now() + Math.floor(Math.random() * 1000);
    } while (clientes.some(c => String(c.id_cliente) === String(novo)));
    return novo;
}

// ---------- Saneamento: corrige clientes legados sem id válido ----------
(function sanearClientes() {
    let alterado = false;
    clientes.forEach(c => {
        if (!idValido(c.id_cliente)) {
            c.id_cliente = gerarNovoId();
            alterado = true;
        }
    });
    if (alterado) {
        localStorage.setItem(STORAGE_CLIENTE, JSON.stringify({ cliente: clientes }));
    }
})();

// ---------- Carregamento do cliente a editar ----------
const clienteEditar = JSON.parse(localStorage.getItem("clienteEditar") || "null");
const modoEdicao = clienteEditar !== null;

let clienteId = null;
if (modoEdicao) {
    clienteId = clienteEditar.id_cliente ?? clienteEditar.id ?? null;

    if (!idValido(clienteId)) {
        // Fallback: tenta localizar o registro correspondente pelos dados
        const encontrado = clientes.find(c =>
            c.documento === clienteEditar.documento && c.nome === clienteEditar.nome
        );
        clienteId = encontrado ? encontrado.id_cliente : gerarNovoId();
    }
}

// ---------- Exibe o bloco de veículos somente em modo de edição ----------
const veiculosBox = document.querySelector(".veiculos-form-box");
const formLayout = document.querySelector(".form-cliente-layout");

if (veiculosBox) {
    veiculosBox.style.display = modoEdicao ? "" : "none";
}
if (formLayout) {
    formLayout.classList.toggle("layout-sem-veiculos", !modoEdicao);
}

if (modoEdicao) {
    document.title = "Editar Cliente";
    document.querySelector(".form-page-title").textContent = "Editar Cliente";

    document.getElementById("nome").value     = clienteEditar.nome      || "";
    document.getElementById("cpf").value      = clienteEditar.documento || clienteEditar.cpf || "";
    document.getElementById("telefone").value = clienteEditar.telefone  || "";
    document.getElementById("email").value    = clienteEditar.email     || "";
    document.getElementById("cep").value      = clienteEditar.cep       || "";
    document.getElementById("rua").value      = clienteEditar.rua       || "";
    document.getElementById("numero").value   = clienteEditar.numero    || "";
    document.getElementById("bairro").value   = clienteEditar.bairro    || "";
    document.getElementById("cidade").value   = clienteEditar.cidade    || "";
    document.getElementById("uf").value       = clienteEditar.uf        || "";

    const meusVeiculos = veiculos.filter(v => String(v.cliente_id) === String(clienteId));
    renderVeiculosForm(meusVeiculos);
} else {
    renderVeiculosForm([]); // bloco não é exibido, mas mantém consistência interna
}

function renderVeiculosForm(lista) {
    const container = document.getElementById("lista-veiculos-form");
    if (!container) return;

    if (!lista.length) {
        container.innerHTML = `<p class="veiculos-vazio">Nenhum veículo associado.</p>`;
        return;
    }

    container.innerHTML = lista.map((v, index) => {
        const marca = Array.isArray(v.marca) ? v.marca[0] : (v.marca || "—");
        const km    = Number(v.quilometragem || 0).toLocaleString("pt-BR");
        return `
            <div class="veiculo-form-card" data-index="${index}">
                <div class="veiculo-form-placa">${v.placa}</div>
                <div class="veiculo-form-nome">${marca} ${v.modelo} ${v.ano}</div>
                <div class="veiculo-form-detalhes">
                    Cor: ${v.cor || "—"} | Km: ${km}
                </div>
            </div>`;
    }).join("");

    container.querySelectorAll(".veiculo-form-card").forEach(card => {
        card.addEventListener("click", () => {
            const veiculo = lista[card.dataset.index];
            if (veiculo) {
                localStorage.setItem("veiculoClienteEditar", JSON.stringify(veiculo));
                localStorage.setItem("clienteIdVeiculo", clienteId);
                window.location.href = "../../pages/business/GerenciarVeiculo.html";
            }
        });
    });
}

document.getElementById("btn-add-veiculo").addEventListener("click", () => {
    if (!modoEdicao) return; // segurança extra: não vincula veículo a cliente inexistente
    localStorage.removeItem("veiculoClienteEditar");
    localStorage.setItem("clienteIdVeiculo", clienteId);
    window.location.href = "../../pages/business/GerenciarVeiculo.html";
});

document.getElementById("btn-cancelar").addEventListener("click", () => {
    localStorage.removeItem("clienteEditar");
    window.location.href = "../../pages/business/Clientes.html";
});

document.getElementById("btn-salvar").addEventListener("click", () => {
    const nome     = document.getElementById("nome").value.trim();
    const cpf      = document.getElementById("cpf").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const email    = document.getElementById("email").value.trim();
    const cep      = document.getElementById("cep").value.trim();
    const rua      = document.getElementById("rua").value.trim();
    const numero   = document.getElementById("numero").value.trim();
    const bairro   = document.getElementById("bairro").value.trim();
    const cidade   = document.getElementById("cidade").value.trim();
    const uf       = document.getElementById("uf").value;

    if (!nome) { alert("Preencha o nome."); return; }
    if (!cpf)  { alert("Preencha CPF/CNPJ."); return; }

    // ID definitivo: em edição usa o id já resolvido; em criação, gera um novo
    const novoId = modoEdicao ? clienteId : gerarNovoId();

    const clienteAtualizado = {
        id_cliente: novoId,
        nome,
        documento: cpf,
        telefone,
        email,
        cep,
        rua,
        numero,
        bairro,
        cidade,
        uf,
        endereco: `${rua}, ${numero} - ${bairro}, ${cidade}`
    };

    const index = clientes.findIndex(c => String(c.id_cliente) === String(novoId));

    if (index !== -1) {
        // Atualização: preserva campos extras (veiculos embutidos, visitas, etc.)
        clientes[index] = { ...clientes[index], ...clienteAtualizado };
    } else {
        // Criação real (somente quando não havia esse id antes)
        clientes.push(clienteAtualizado);
    }

    localStorage.setItem(STORAGE_CLIENTE, JSON.stringify({ cliente: clientes }));
    localStorage.removeItem("clienteEditar");
    window.location.href = "../../pages/business/Clientes.html";
});