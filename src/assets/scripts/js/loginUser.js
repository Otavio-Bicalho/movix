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

  sessionStorage.setItem("UserpfLogado", JSON.stringify({
    id_usuario: user.id_usuario,
    nome: user.nome,
    email: user.email,
    loginAt: new Date().toISOString()
  }));

  window.location.href = '../../index.html';
}


function userCad() {
  const nome = document.getElementById('cadNome').value;
  const email = document.getElementById('cadEmail').value;
  const telefone = document.getElementById('cadTelefone').value;
  const cpf = document.getElementById('cadCpf').value;
  const senha = document.getElementById('cadSenha').value;
  const confSenha = document.getElementById('cadConfirmar').value;

  if (confSenha == '' || senha == '' || cpf == '' || telefone == '' || email == '' || nome == '') {
    return alert('Há campos vazios.');
  } else if (confSenha !== senha) {
    return alert('Senhas estão divergentes.');
  } else if (senha.length >= 6) {

    const dadosUser = JSON.parse(localStorage.getItem('usuarios')) || { usuarios: [] };
    const listaUsuarios = dadosUser.usuarios || [];

    const novoId = listaUsuarios.length > 0
      ? Math.max(...listaUsuarios.map(u => u.id_usuario)) + 1
      : 1;

    const novoUsuario = {
      id_usuario: novoId,
      nome: nome,
      email: email,
      telefone: telefone,
      cpf: cpf,
      senha: senha,
      cnpj: null,
      status: true
    };

    listaUsuarios.push(novoUsuario);

    localStorage.setItem('usuarios', JSON.stringify({ usuarios: listaUsuarios }));

    window.location.href = '../../index.html';
  }
}