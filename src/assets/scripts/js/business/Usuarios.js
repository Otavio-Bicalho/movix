let usuarios = [];
let selecionadoId = null;

    const userLogado = JSON.parse(sessionStorage.getItem("UserLogado") || "{}");
    const userLogadoId= JSON.parse(sessionStorage.getItem("UserLogado") || "{}")

function carregarDados() {
    const dadosUsuarios = JSON.parse(localStorage.getItem("user_interno") || "{}");
    const userLogado = JSON.parse(sessionStorage.getItem("UserLogado") || "{}");
    const oficinaId = userLogado.oficina_id;

    usuarios = (dadosUsuarios.user_interno || [])
        .filter(u => String(u.oficina_id) === String(oficinaId))
        .map(u => ({
            id: String(u.user_interno_id),
            nome: u.nome,
            telefone: u.telefone,
            email: u.email,
            cpf: u.documento,
            cep: u.cep,
            rua: u.rua,
            numero: u.numero,
            bairro: u.bairro,
            cidade: u.cidade,
            uf: u.uf,
            tipoUsuario: u.tipo_user_interno_id || "-",
        }));

    selecionadoId = usuarios.length ? usuarios[0].id : null;
    renderLista();
    renderPerfil();
}



function deletarUsuario(id) {
    const dadosUsuarios = JSON.parse(localStorage.getItem("user_interno") || "{}");
    const lista = dadosUsuarios.user_interno || [];
    const novaLista = lista.filter(u => String(u.user_interno_id) !== String(id));
    localStorage.setItem("user_interno", JSON.stringify({ user_interno: novaLista }));
}

document.getElementById("btn-adicionar-usuario").addEventListener("click", () => {
    localStorage.removeItem("usuarioEditar");
    window.location.href = "../../pages/business/PerfilUsuario.html";
});

const iconPhone = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.91.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

const iconMail = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6" /></svg>`;

const iconMapPin = `<svg width="11" height="14" viewBox="0 0 11 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.33333 6.66667C5.7 6.66667 6.01389 6.53611 6.275 6.275C6.53611 6.01389 6.66667 5.7 6.66667 5.33333C6.66667 4.96667 6.53611 4.65278 6.275 4.39167C6.01389 4.13056 5.7 4 5.33333 4C4.96667 4 4.65278 4.13056 4.39167 4.39167C4.13056 4.65278 4 4.96667 4 5.33333C4 5.7 4.13056 6.01389 4.39167 6.275C4.65278 6.53611 4.96667 6.66667 5.33333 6.66667ZM5.33333 11.5667C6.68889 10.3222 7.69444 9.19167 8.35 8.175C9.00556 7.15833 9.33333 6.25556 9.33333 5.46667C9.33333 4.25556 8.94722 3.26389 8.175 2.49167C7.40278 1.71944 6.45556 1.33333 5.33333 1.33333C4.21111 1.33333 3.26389 1.71944 2.49167 2.49167C1.71944 3.26389 1.33333 4.25556 1.33333 5.46667C1.33333 6.25556 1.66111 7.15833 2.31667 8.175C2.97222 9.19167 3.97778 10.3222 5.33333 11.5667ZM5.33333 13.3333C3.54444 11.8111 2.20833 10.3972 1.325 9.09167C0.441667 7.78611 0 6.57778 0 5.46667C0 3.8 0.536111 2.47222 1.60833 1.48333C2.68056 0.494444 3.92222 0 5.33333 0C6.74444 0 7.98611 0.494444 9.05833 1.48333C10.1306 2.47222 10.6667 3.8 10.6667 5.46667C10.6667 6.57778 10.225 7.78611 9.34167 9.09167C8.45833 10.3972 7.12222 11.8111 5.33333 13.3333Z" fill="#091426"/>
</svg>`;

const iconIdCard = `<svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.06667 14L3.8 11.8667L1.4 11.3333L1.63333 8.86667L0 7L1.63333 5.13333L1.4 2.66667L3.8 2.13333L5.06667 0L7.33333 0.966667L9.6 0L10.8667 2.13333L13.2667 2.66667L13.0333 5.13333L14.6667 7L13.0333 8.86667L13.2667 11.3333L10.8667 11.8667L9.6 14L7.33333 13.0333L5.06667 14ZM5.63333 12.3L7.33333 11.5667L9.06667 12.3L10 10.7L11.8333 10.2667L11.6667 8.4L12.9 7L11.6667 5.56667L11.8333 3.7L10 3.3L9.03333 1.7L7.33333 2.43333L5.6 1.7L4.66667 3.3L2.83333 3.7L3 5.56667L1.76667 7L3 8.4L2.83333 10.3L4.66667 10.7L5.63333 12.3ZM6.63333 9.36667L10.4 5.6L9.46667 4.63333L6.63333 7.46667L5.2 6.06667L4.26667 7L6.63333 9.36667Z" fill="#091426"/>
</svg>`;

const iconEdit = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.5 12H2.56875L9.9 4.66875L8.83125 3.6L1.5 10.9312V12ZM0 13.5V10.3125L9.9 0.43125C10.05 0.29375 10.2156 0.1875 10.3969 0.1125C10.5781 0.0375 10.7688 0 10.9688 0C11.1687 0 11.3625 0.0375 11.55 0.1125C11.7375 0.1875 11.9 0.3 12.0375 0.45L13.0688 1.5C13.2188 1.6375 13.3281 1.8 13.3969 1.9875C13.4656 2.175 13.5 2.3625 13.5 2.55C13.5 2.75 13.4656 2.94062 13.3969 3.12188C13.3281 3.30313 13.2188 3.46875 13.0688 3.61875L3.1875 13.5H0ZM12 2.55L10.95 1.5L12 2.55ZM9.35625 4.14375L8.83125 3.6L9.9 4.66875L9.35625 4.14375Z" fill="#091426"/>
</svg>`;

const iconTrash = `<svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.25 13.5C1.8375 13.5 1.48438 13.3531 1.19062 13.0594C0.896875 12.7656 0.75 12.4125 0.75 12V2.25H0V0.75H3.75V0H8.25V0.75H12V2.25H11.25V12C11.25 12.4125 11.1031 12.7656 10.8094 13.0594C10.5156 13.3531 10.1625 13.5 9.75 13.5H2.25ZM9.75 2.25H2.25V12H9.75V2.25ZM3.75 10.5H5.25V3.75H3.75V10.5ZM6.75 10.5H8.25V3.75H6.75V10.5ZM2.25 2.25V12V2.25Z" fill="#505F76"/>
</svg>`;

const coresAvatar = ["#1F2937", "#2563EB", "#059669", "#D97706", "#7C3AED", "#DB2777"];

function corPorId(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return coresAvatar[Math.abs(hash) % coresAvatar.length];
}

function iniciais(nome) {
    return nome
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0])
        .join("")
        .toUpperCase();
}

function renderLista(filtro = "") {
    const container = document.getElementById("lista-usuarios");
    const termo = filtro.toLowerCase().trim();

    const filtrados = usuarios.filter(u =>
        u.nome.toLowerCase().includes(termo) ||
        (u.email || "").toLowerCase().includes(termo) ||
        (u.telefone || "").toLowerCase().includes(termo) ||
        (u.id || "").toLowerCase().includes(termo)
    );

    const badge = document.getElementById("badge-total-usuarios");
    if (badge) badge.textContent = `${usuarios.length} total`;

    if (filtrados.length === 0) {
        container.innerHTML = `<div class="lista-vazio">Nenhum usuário encontrado.</div>`;
        return;
    }

    container.innerHTML = filtrados.map(u => `
        <div class="usuario-card ${u.id === selecionadoId ? "selecionado" : ""}" data-id="${u.id}">
            <div class="usuario-avatar" style="background:${corPorId(u.id)}">${iniciais(u.nome)}</div>
            <div class="usuario-info">
                <span class="usuario-nome">${u.nome}</span>
                <span class="usuario-id">ID: #${u.id}</span>
                <div class="usuario-contato">
                    <span>${iconPhone} ${u.telefone || "-"}</span>
                    <span>${iconMail} ${u.email || "-"}</span>
                </div>
            </div>
        </div>
    `).join("");

    container.onclick = (e) => {
        const card = e.target.closest(".usuario-card");
        if (!card) return;
        selecionadoId = card.dataset.id;
        const busca = document.getElementById("busca-usuario");
        renderLista(busca ? busca.value : "");
        renderPerfil();
    };
}

function renderPerfil() {
    const container = document.getElementById("usuario-perfil");
    const usuario = usuarios.find(u => u.id === selecionadoId);

    if (!usuario) {
        container.innerHTML = `<div class="perfil-vazio">Selecione um usuário para ver os detalhes.</div>`;
        return;
    }

    container.innerHTML = `
        <div class="perfil-header">
            <div class="perfil-nome">
                <h2>${usuario.nome}</h2>
            </div>
            <div class="perfil-acoes">
                <button class="btn-editar-usuario" id="btn-editar-usuario">${iconEdit} Editar</button>
                <button class="btn-deletar-usuario" id="btn-deletar-usuario">${iconTrash}</button>
            </div>
        </div>

        <div class="informacoes-usuarios">
            <div class="telefone-secundario">
                <p><label for="telefone">Telefone</label></p>
                <input type="text" id="telefone" value="${usuario.telefone || ''}" disabled>
            </div>
            <div class="email">
                <p><label for="email">E-mail</label></p>
                <input type="text" id="email" value="${usuario.email || ''}" disabled>
            </div>
            <div class="cpf">
                <p><label for="cpf">CPF</label></p>
                <input type="text" id="cpf" value="${usuario.cpf || ''}" disabled>
            </div>
            <div class="cep">
                <p><label for="cep">CEP</label></p>
                <input type="text" id="cep" value="${usuario.cep || ''}" disabled>
            </div>
            <div class="rua">
                <p><label for="rua">Rua</label></p>
                <input type="text" id="rua" value="${usuario.rua || ''}" disabled>
            </div>
            <div class="numero">
                <p><label for="numero">Número</label></p>
                <input type="text" id="numero" value="${usuario.numero || ''}" disabled>
            </div>
            <div class="bairro">
                <p><label for="bairro">Bairro</label></p>
                <input type="text" id="bairro" value="${usuario.bairro || ''}" disabled>
            </div>
            <div class="cidade">
                <p><label for="cidade">Cidade</label></p>
                <input type="text" id="cidade" value="${usuario.cidade || ''}" disabled>
            </div>
            <div class="uf">
                <p><label for="uf">UF</label></p>
                <input type="text" id="uf" value="${usuario.uf || ''}" disabled>
            </div>
            <div class="tipo-usuario">
                <p><label for="tipoUsuario">Tipo de Usuário</label></p>
                <input type="text" id="tipoUsuario" value="${usuario.tipoUsuario || ''}" disabled>
            </div>
        </div>
    `;

    document.getElementById("btn-deletar-usuario").addEventListener("click", abrirModalDelete);

    document.getElementById("btn-editar-usuario").addEventListener("click", () => {
        localStorage.setItem("usuarioEditar", JSON.stringify(usuario));
        window.location.href = "../../pages/business/PerfilUsuario.html";
    });
}

const modal = document.getElementById("modal-delete-usuario");
const btnCancelarDelete = document.getElementById("btn-cancelar-delete-usuario");
const btnConfirmarDelete = document.getElementById("btn-confirmar-delete-usuario");

function abrirModalDelete() {
    modal.classList.remove("escondido");
}

btnCancelarDelete.addEventListener("click", () => {
    modal.classList.add("escondido");
});

btnConfirmarDelete.addEventListener("click", () => {
    if (!selecionadoId) {
        modal.classList.add("escondido");
        return;
    }

    deletarUsuario(selecionadoId);
    carregarDados();
    modal.classList.add("escondido");
});

const campoBusca = document.getElementById("busca-usuario");
if (campoBusca) {
    campoBusca.addEventListener("input", (e) => {
        renderLista(e.target.value);
    });
}


carregarDados();