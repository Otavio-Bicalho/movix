const STORAGE_USUARIOS = "user_interno";

// ---------- Utilitários de ID ----------
function idValido(id) {
    return id !== null && id !== undefined && String(id).trim() !== "" && String(id) !== "NaN";
}

function gerarNovoId(listaUsuarios) {
    let novo;
    do {
        novo = Date.now() + Math.floor(Math.random() * 1000);
    } while (listaUsuarios.some(u => String(u.user_interno_id) === String(novo)));
    return novo;
}

// ---------- Carrega lista do localStorage ----------
const bancoUsuarios = JSON.parse(localStorage.getItem(STORAGE_USUARIOS) || "{}");
let usuarios = Array.isArray(bancoUsuarios.user_interno) ? bancoUsuarios.user_interno : [];

// ---------- Saneamento: corrige registros sem id válido ----------
(function sanearUsuarios() {
    let alterado = false;
    usuarios.forEach(u => {
        if (!idValido(u.user_interno_id)) {
            u.user_interno_id = gerarNovoId(usuarios);
            alterado = true;
        }
    });
    if (alterado) {
        localStorage.setItem(STORAGE_USUARIOS, JSON.stringify({ user_interno: usuarios }));
    }
})();

// ---------- Carregamento do usuário a editar ----------
const usuarioEditar = JSON.parse(localStorage.getItem("usuarioEditar") || "null");
const modoEdicao = usuarioEditar !== null;

const userLogado = JSON.parse(sessionStorage.getItem("UserLogado") || "{}");
const oficinaId = userLogado.oficina_id;

let usuarioId = null;
if (modoEdicao) {
    usuarioId = usuarioEditar.id ?? null;

    if (!idValido(usuarioId)) {
        const encontrado = usuarios.find(u =>
            u.documento === (usuarioEditar.cpf || usuarioEditar.documento) &&
            u.nome === usuarioEditar.nome
        );
        usuarioId = encontrado ? encontrado.user_interno_id : gerarNovoId(usuarios);
    }
}

if (modoEdicao) {
    document.title = "Editar Usuário";
    document.querySelector(".form-page-title").textContent = "Editar Usuário";

    document.getElementById("nome").value        = usuarioEditar.nome        || "";
    document.getElementById("cpf").value         = usuarioEditar.cpf         || usuarioEditar.documento || "";
    document.getElementById("telefone").value    = usuarioEditar.telefone    || "";
    document.getElementById("email").value       = usuarioEditar.email       || "";
    document.getElementById("cep").value         = usuarioEditar.cep         || "";
    document.getElementById("rua").value         = usuarioEditar.rua         || "";
    document.getElementById("numero").value      = usuarioEditar.numero      || "";
    document.getElementById("bairro").value      = usuarioEditar.bairro      || "";
    document.getElementById("cidade").value      = usuarioEditar.cidade      || "";
    document.getElementById("uf").value          = usuarioEditar.uf          || "";
    document.getElementById("tipoUsuario").value = usuarioEditar.tipoUsuario || "";
}

document.getElementById("btn-cancelar").addEventListener("click", () => {
    localStorage.removeItem("usuarioEditar");
    window.location.href = "../../pages/business/Usuarios.html";
});

document.getElementById("btn-salvar").addEventListener("click", () => {
    const nome        = document.getElementById("nome").value.trim();
    const cpf         = document.getElementById("cpf").value.trim();
    const telefone    = document.getElementById("telefone").value.trim();
    const email       = document.getElementById("email").value.trim();
    const cep         = document.getElementById("cep").value.trim();
    const rua         = document.getElementById("rua").value.trim();
    const numero      = document.getElementById("numero").value.trim();
    const bairro      = document.getElementById("bairro").value.trim();
    const cidade      = document.getElementById("cidade").value.trim();
    const uf          = document.getElementById("uf").value;
    const tipoUsuario = document.getElementById("tipoUsuario").value;

    if (!nome)        { alert("Preencha o nome do usuário."); return; }
    if (!cpf)         { alert("Preencha o CPF do usuário."); return; }
    if (!telefone)    { alert("Preencha o telefone do usuário."); return; }
    if (!email)       { alert("Preencha o e-mail do usuário."); return; }
    if (!tipoUsuario) { alert("Selecione o tipo de usuário."); return; }

    const novoId = modoEdicao ? usuarioId : gerarNovoId(usuarios);

    const usuarioAtualizado = {
        user_interno_id: novoId,
        oficina_id: modoEdicao ? (usuarioEditar.oficina_id || oficinaId) : oficinaId,
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
        tipo_user_interno_id: tipoUsuario,
    };

    const index = usuarios.findIndex(u => String(u.user_interno_id) === String(novoId));

    if (index !== -1) {
        // Atualização: preserva campos extras (senha, etc.)
        usuarios[index] = { ...usuarios[index], ...usuarioAtualizado };
    } else {
        // Criação
        usuarios.push(usuarioAtualizado);
    }

    localStorage.setItem(STORAGE_USUARIOS, JSON.stringify({ user_interno: usuarios }));
    localStorage.removeItem("usuarioEditar");
    window.location.href = "../../pages/business/Usuarios.html";
});