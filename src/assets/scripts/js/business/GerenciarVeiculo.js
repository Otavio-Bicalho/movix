const veiculoEditar = JSON.parse(
    localStorage.getItem("veiculoClienteEditar") || "null"
);

const clienteId = localStorage.getItem("clienteIdVeiculo") || "";

const modoEdicao = veiculoEditar !== null;


if (modoEdicao) {
    document.title = "Editar Veículo";

    document.querySelector(".form-page-title").textContent =
        "Editar Veículo";

        document.getElementById("placa").value =
        veiculoEditar.placa || "";

    document.getElementById("chassi").value =
        veiculoEditar.chassi || "";

    document.getElementById("marca").value =
        Array.isArray(veiculoEditar.marca)
            ? veiculoEditar.marca[0]
            : veiculoEditar.marca || 
        "";

    document.getElementById("modelo").value =
        veiculoEditar.modelo || "";

    document.getElementById("ano").value =
        veiculoEditar.ano || "";

    document.getElementById("cor").value =
        veiculoEditar.cor || "";

    document.getElementById("quilometragem").value =
        veiculoEditar.quilometragem || 0;
}
document.getElementById("btn-cancelar")
    .addEventListener("click", () => {
        localStorage.removeItem("veiculoClienteEditar");
        window.location.href =
            "../../pages/business/Clientes.html";
    });
document.getElementById("btn-salvar")
    .addEventListener("click", () => {
        const placa =
            document.getElementById("placa").value.trim();
        const marca =
            document.getElementById("marca").value;
        const modelo =
            document.getElementById("modelo").value.trim();
        if (!placa) {
            alert("Preencha a placa do veículo.");
            return;
        }
        if (!marca) {
            alert("Selecione a marca.");
            return;
        }
        if (!modelo) {
            alert("Preencha o modelo.");
            return;
        }
        const dadosNovoVeiculo = {
            id_veiculo:
                veiculoEditar?.id_veiculo ||
                Date.now(),
            cliente_id:
                Number(clienteId),
            placa,
            chassi:
                document.getElementById("chassi").value.trim(),
            marca,
            modelo,
            ano:
                Number(document.getElementById("ano").value),
            cor:
                document.getElementById("cor").value.trim(),
            quilometragem:
                Number(
                    document.getElementById("quilometragem").value
                ) || 0
        };
        const dadosVeiculos = JSON.parse(
            localStorage.getItem("veiculo") || "{}"
        );
        let veiculos =
            dadosVeiculos.veiculo || [];
        if (modoEdicao) {
            const index =
                veiculos.findIndex(v =>
                    String(v.id_veiculo) ===
                    String(veiculoEditar.id_veiculo)
                );
            if (index !== -1) {
                veiculos[index] =
                    dadosNovoVeiculo;
            }
        }
        else {
            veiculos.push(
                dadosNovoVeiculo
            );
        }
        localStorage.setItem("veiculo",
            JSON.stringify({
                veiculo: veiculos
            })
        );
        localStorage.removeItem(
            "veiculoClienteEditar"
        );
        window.location.href =
            "../../pages/business/Clientes.html";


    });