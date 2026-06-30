
const sessaoPf = JSON.parse(sessionStorage.getItem('UserpfLogado') || 'null');

function setStatus(valor, btn) {
    document.getElementById("status").value = valor;
    document.querySelectorAll(".toggle button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
}


function lsVeiculos() {
    try {
        const raw = localStorage.getItem("meus_veiculos");
        if (!raw) return [];
        const d = JSON.parse(raw);
        return Array.isArray(d) ? d : (d.meus_veiculos || []);
    } catch { return []; }
}

function salvarVeiculos(lista) {
    localStorage.setItem("meus_veiculos", JSON.stringify({ meus_veiculos: lista }));
}


window.addEventListener("DOMContentLoaded", () => {
    const dados = localStorage.getItem("veiculoEditar");
    if (!dados) return;

    const veiculo = JSON.parse(dados);

    document.getElementById("nomeproprietario").value = veiculo.proprietario  || "";
    document.getElementById("placa").value            = veiculo.placa          || "";
    document.getElementById("marca").value            = veiculo.marca          || "";
    document.getElementById("modelo").value           = veiculo.modelo         || "";
    document.getElementById("anoFabricacao").value    = veiculo.ano_fabricacao || "";
    document.getElementById("anoModelo").value        = veiculo.ano_modelo     || "";
    document.getElementById("cor").value              = veiculo.cor            || "";
    document.getElementById("renavam").value          = veiculo.renavam        || "";
    document.getElementById("combustivel").value      = veiculo.tipo_combustivel || "";
    document.getElementById("volumeTanque").value     = veiculo.vl_tanque      || "";
    document.getElementById("cambio").value           = veiculo.tipo_cambio    || "";
    document.getElementById("quilometros").value      = veiculo.quilometros    || "";

    const statusBtn = veiculo.status ? ".toggle .active" : ".toggle .inative";
    document.querySelector(statusBtn)?.click();
});

document.querySelector(".btn-salvar").addEventListener("click", () => {

    const campos = [
        { id: "nomeproprietario", label: "Nome do proprietário" },
        { id: "placa",            label: "Placa" },
        { id: "marca",            label: "Marca" },
        { id: "modelo",           label: "Modelo" },
        { id: "anoFabricacao",    label: "Ano de fabricação" },
        { id: "anoModelo",        label: "Ano do modelo" },
        { id: "cor",              label: "Cor" },
        { id: "combustivel",      label: "Tipo de combustível" },
        { id: "volumeTanque",     label: "Vol. do Tanque" },
        { id: "cambio",           label: "Tipo de câmbio" },
        { id: "quilometros",      label: "Quilometragem" },
    ];

    for (const campo of campos) {
        const el = document.getElementById(campo.id);
        if (!el || !el.value.toString().trim()) {
            alert(`O campo "${campo.label}" é obrigatório.`);
            el?.focus();
            return;
        }
    }

    const statusVal = document.getElementById("status").value;
    if (!statusVal) { alert("Selecione o Status do veículo."); return; }

    const lista  = lsVeiculos();
    const editar = JSON.parse(localStorage.getItem("veiculoEditar") || "null");

    // Gera ID sequencial para novo veículo
    const novoId = editar?.id_meuveiculo ?? (() => {
        const max = lista.length ? Math.max(...lista.map(v => Number(v.id_meuveiculo) || 0)) : 0;
        return max + 1;
    })();

    const veiculo = {
        id_meuveiculo:    novoId,
        usuario_id:       sessaoPf?.id_usuario || 0,
        motorista_id:     editar?.motorista_id || null,
        proprietario:     document.getElementById("nomeproprietario").value.trim(),
        placa:            document.getElementById("placa").value.trim(),
        marca:            document.getElementById("marca").value.trim(),
        modelo:           document.getElementById("modelo").value.trim(),
        ano_fabricacao:   Number(document.getElementById("anoFabricacao").value),
        ano_modelo:       Number(document.getElementById("anoModelo").value),
        cor:              document.getElementById("cor").value.trim(),
        tipo_combustivel: document.getElementById("combustivel").value,
        vl_tanque:        Number(document.getElementById("volumeTanque").value),
        tipo_cambio:      document.getElementById("cambio").value,
        quilometros:      Number(document.getElementById("quilometros").value),
        renavam:          document.getElementById("renavam").value.trim(),
        status:           statusVal === "ativo",
    };

    const index = lista.findIndex(v => v.id_meuveiculo === novoId);
    if (index !== -1) {
        lista[index] = { ...lista[index], ...veiculo };
    } else {
        lista.push(veiculo);
    }

    salvarVeiculos(lista);
    localStorage.removeItem("veiculoEditar");
    window.location.href = "../pages/MeusVeiculos.html";
});


document.querySelector(".btn-cancelar").addEventListener("click", () => {
    window.location.href = "../pages/MeusVeiculos.html";
});