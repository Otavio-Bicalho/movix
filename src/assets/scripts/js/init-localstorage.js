const arquivosJSON = [
    "abastecimento.json",
    "avaliacoes.json",
    "bandeira.json",
    "caracteristicas.json",
    "estabelecimento_caracteristicas.json",
    "estabelecimentos.json",
    "hist_preco_combustivel.json",
    "lancamentos.json",
    "lancamentos.json",
    "meus_veiculos.json",
    "motoristas.json",
    "pontos_recarga.json",
    "servico.json",
    "tipo_combustivel.json",
    "tipo_estabelecimentos.json",
    "usuarios.json",
    "veiculo.json",
    "vl_combustivel.json",
];

async function carregarJSONs() {
    const promises = arquivosJSON.map(arquivo => {
        const nome = arquivo.replace(".json", "");
        if (localStorage.getItem(nome) !== null) return Promise.resolve();
        return fetch(`src/assets/scripts/${arquivo}`)
            .then(response => response.json())
            .then(data => {
                localStorage.setItem(nome, JSON.stringify(data));
            })
            .catch(err => console.warn(`[init-ls] Falha ao carregar ${arquivo}:`, err.message));
    });

    await Promise.all(promises);

   
    function ls(key) {
        try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
    }
    window.USUARIOS_DATA         = ls('usuarios');
    window.TIPO_COMBUSTIVEL_DATA = ls('tipo_combustivel');
    window.VL_COMBUSTIVEL_DATA   = ls('vl_combustivel');
    window.AVALIACOES_DATA       = ls('avaliacoes');
    window.CARACTERISTICAS_DATA  = ls('caracteristicas');
    window.BANDEIRA_DATA         = ls('bandeira');
    window.ESTABELECIMENTOS_DATA = ls('estabelecimentos');
    window.ESTABELECIMENTO_CARACTERISTICAS_DATA = ls('estabelecimento_caracteristicas');
}




function LoginUser() {
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha')?.value || '';

    if (!email || !senha) {
        return alert('Preencha e-mail e senha.');
    }

    const dados = JSON.parse(localStorage.getItem("usuarios")) || {};
    const usuarios = dados.usuarios || [];

    const user = usuarios.find(u => u.email === email && u.senha === senha);

    if (!user) {
        return alert('E-mail ou senha incorretos.');
    }

    sessionStorage.setItem("UserLogado", JSON.stringify({
        id_usuario: user.id_usuario,
        nome: user.nome,
        email: user.email,
        loginAt: new Date().toISOString()
    }));

    window.location.href = 'index.html';
}