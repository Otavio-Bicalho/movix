
const arquivosJSONBusiness = [
  "boxes.json",
  "cliente.json",
  "oficina.json",
  "ordem_servico.json",
  "tipo_user_interno.json",
  "veiculo.json",
  "user_interno.json"
];

const arquivosJSON = [
  "categoria.json",
  "estabelecimentos.json",
  "estoque.json",
  "produtos.json",
  "servico.json",
  "tipo_user.json"
];

async function carregarJSONs() {

  arquivosJSONBusiness.forEach(arquivo => {
    let nome = arquivo.replace(".json", "");
    if (localStorage.getItem(nome) !== null) return;
    fetch(`../../assets/scripts/business/${arquivo}`)
      .then(response => response.json())
      .then(data => {
        localStorage.setItem(nome, JSON.stringify(data));
      });
  });

  arquivosJSON.forEach(arquivo => {
    let nome = arquivo.replace(".json", "");
    if (localStorage.getItem(nome) !== null) return;
    fetch(`../../assets/scripts/${arquivo}`)
      .then(response => response.json())
      .then(data => {
        localStorage.setItem(nome, JSON.stringify(data));
      });
  });

}



function LoginBusiness() {
  const email = document.getElementById('loginEmail').value;
  const senha = document.getElementById('loginSenha')?.value || '';

  if (!email || !senha) {
    return alert('Preencha e-mail e senha.');
  }

  const dados = JSON.parse(localStorage.getItem("user_interno")) || {};
  const usuarios = dados.user_interno || [];

  const user = usuarios.find(u => u.email === email && u.senha === senha);

  if (!user) {
    return alert('E-mail ou senha incorretos.');
  }

  sessionStorage.setItem("UserLogado", JSON.stringify({
    user_interno_id: user.user_interno_id,
    oficina_id: user.oficina_id,
    nome: user.nome,
    email: user.email,
    loginAt: new Date().toISOString()
  }));

  window.location.href = 'inicial.html';
}


function userCad() {
  const nome = document.getElementById('cadNome').value;
  const email = document.getElementById('cadEmail').value;
  const telefone = document.getElementById('cadTelefone').value;
  const cpf = document.getElementById('cadCpf').value;
  const senha = document.getElementById('cadSenha').value;
  const confSenha = document.getElementById('cadConfirmar').value

  if (confSenha == '' || senha == '' || cpf == '' || telefone == '' || email == '' || nome == '') {
    return alert('Há campos vazios.')
  }
  else if (confSenha !== senha) {
    return alert('Senhas estão divergentes');
  } else if (confSenha == senha && (confSenha.length >= 6 && senha.length >= 6)) {


    sessionStorage.setItem('UserCad', JSON.stringify({
      nome: nome,
      email: email,
      telefone: telefone,
      cpf: cpf,
      senha: senha,
    }));
    window.location.href = 'cad_emp_p1.html'
  }


}

function cad_pt1() {
  const nomeOficina = document.getElementById('nomeOficina').value;
  const cnpj = document.getElementById('cnpj').value;
  const telefoneComercial = document.getElementById('telefoneComercial').value;
  const emailAdmin = document.getElementById('emailAdmin').value;


  if (nomeOficina == '' || cnpj == '' || telefoneComercial == '' || emailAdmin == '') {
    return alert('Há campos vazios.')

  } else {
    sessionStorage.setItem('info1', JSON.stringify({
      nomeOficina: nomeOficina,
      cnpj: cnpj,
      telefoneComercial: telefoneComercial,
      emailAdmin: emailAdmin
    }));

    window.location.href = 'cad_emp_p2.html'
  }
}

function cad_pt2() {
  const cep = document.getElementById('cep').value;
  const logradouro = document.getElementById('logradouro').value;
  const numero = document.getElementById('numero').value;
  const bairro = document.getElementById('bairro').value;
  const cidade = document.getElementById('cidade').value;
  const estado = document.getElementById('estado').value;


  if (cep == '' || logradouro == '' || numero == '' || bairro == '' || cidade == '' || estado == '') {
    return alert('Há campos vazios.')
  } else {


    sessionStorage.setItem('info2', JSON.stringify({
      cep: cep,
      logradouro: logradouro,
      numero: numero,
      bairro: bairro,
      cidade: cidade,
      estado: estado,
    }));

    window.location.href = 'cad_emp_p3.html'
  }
}



function cad_pt3() {
  const numBoxes = document.getElementById('numBoxes').value;
  const horaSemanaInicio = document.getElementById('horaSemanaInicio').value;
  const horaSemanaFim = document.getElementById('horaSemanaFim').value;
  const horaSabadoInicio = document.getElementById('horaSabadoInicio').value;
  const horaSabadoFim = document.getElementById('horaSabadoFim').value;


  if (numBoxes == '' || horaSemanaInicio == '' || horaSemanaFim == '' || horaSabadoInicio == '' || horaSabadoFim == '') {
    return alert('Há campos vazios.')
  } else {


    sessionStorage.setItem('info3', JSON.stringify({
      numBoxes: numBoxes,
      horaSemanaInicio: horaSemanaInicio,
      horaSemanaFim: horaSemanaFim,
      horaSabadoInicio: horaSabadoInicio,
      horaSabadoFim: horaSabadoFim,
    }));

    window.location.href = 'cad_emp_p4.html'
  }
}

function cad_pt4() {
  const info1 = JSON.parse(sessionStorage.getItem('info1'));
  const info2 = JSON.parse(sessionStorage.getItem('info2'));
  const info3 = JSON.parse(sessionStorage.getItem('info3'));
  const userCadData = JSON.parse(sessionStorage.getItem('UserCad'));


  const dadosEstabelecimentos = JSON.parse(localStorage.getItem('estabelecimentos')) || { estabelecimento: [] };
  const dadosOficina = JSON.parse(localStorage.getItem('oficina')) || { oficina: [] };
  const dadosUserInterno = JSON.parse(localStorage.getItem('user_interno')) || { user_interno: [] };
  const dadosBoxes = JSON.parse(localStorage.getItem('boxes')) || { boxes: [] };

  const listaEstabelecimentos = dadosEstabelecimentos.estabelecimento || [];
  const listaOficina = dadosOficina.oficina || [];
  const listaUserInterno = dadosUserInterno.user_interno || [];
  const listaBoxes = dadosBoxes.boxes || [];


  const novoEstabelecimentoId = listaEstabelecimentos.length > 0
    ? Math.max(...listaEstabelecimentos.map(e => parseInt(e.id))) + 1
    : 1;

  const novaOficinaId = listaOficina.length > 0
    ? Math.max(...listaOficina.map(o => o.id_oficina)) + 1
    : 1;

  const novoUserInternoId = listaUserInterno.length > 0
    ? Math.max(...listaUserInterno.map(u => u.user_interno_id)) + 1
    : 1;

  const ultimoBoxId = listaBoxes.length > 0
    ? Math.max(...listaBoxes.map(b => b.id_boxes))
    : 0;

 
  const novoEstabelecimento = {
    id: String(novoEstabelecimentoId),
    endereco: `${info2.logradouro}, ${info2.numero}, ${info2.bairro}, ${info2.cidade} - ${info2.estado}, ${info2.cep}`,
    cnpj: info1.cnpj,
    tipo_ID: "2"
  };


  const novaOficina = {
    id_oficina: novaOficinaId,
    estabelecimento_id: novoEstabelecimentoId,
    nome_oficina: info1.nomeOficina,
    telefone_comercial: info1.telefoneComercial,
    email_comercial: info1.emailAdmin,
    matriz: true,
    filial: false,
    numero_boxes: parseInt(info3.numBoxes),
    horario_func_inicial: info3.horaSemanaInicio,
    horario_func_final: info3.horaSemanaFim,
    horario_sabado: info3.horaSabadoInicio,
    horario_sabado_final: info3.horaSabadoFim
  };


  const novoUserInterno = {
    user_interno_id: novoUserInternoId,
    oficina_id: novaOficinaId,
    tipo_user_interno_id: 1,
    nome: userCadData.nome,
    documento: userCadData.cpf,
    telefone: userCadData.telefone,
    email: userCadData.email,
    senha: userCadData.senha,
    cep: info2.cep,
    rua: info2.logradouro,
    numero: info2.numero,
    bairro: info2.bairro,
    cidade: info2.cidade,
    uf: info2.estado
  };

  // Cria os boxes conforme o número informado no schema do JSON
  const numBoxes = parseInt(info3.numBoxes);
  const novosBoxes = [];
  for (let i = 1; i <= numBoxes; i++) {
    novosBoxes.push({
      id_boxes: ultimoBoxId + i,
      num_boxe: i,
      estabelecimento_id: novoEstabelecimentoId,
      ordem_servico_id: null,
      veiculo_id: null,
      status: false
    });
  }


  listaEstabelecimentos.push(novoEstabelecimento);
  listaOficina.push(novaOficina);
  listaUserInterno.push(novoUserInterno);
  novosBoxes.forEach(box => listaBoxes.push(box));

 
  localStorage.setItem('estabelecimentos', JSON.stringify({ estabelecimento: listaEstabelecimentos }));
  localStorage.setItem('oficina', JSON.stringify({ oficina: listaOficina }));
  localStorage.setItem('user_interno', JSON.stringify({ user_interno: listaUserInterno }));
  localStorage.setItem('boxes', JSON.stringify({ boxes: listaBoxes }));

  window.location.href = 'login_business.html'

  sessionStorage.removeItem('UserCad');
  sessionStorage.removeItem('info1');
  sessionStorage.removeItem('info2');
  sessionStorage.removeItem('info3');

}


function revisaocad() {
  const info1 = sessionStorage.getItem('info1');
  const info2 = sessionStorage.getItem('info2');
  const info3 = sessionStorage.getItem('info3');
  const info4 = sessionStorage.getItem('info4');

  if (!info1 || !info2 || !info3) return;

  document.getElementById('revTelefone').textContent = info1.telefoneComercial;
  document.getElementById('revEmail').textContent = info1.emailAdmin;
  document.getElementById('revCnpj').textContent = info1.cnpj;
  document.getElementById('revNomeOficina').textContent = info1.nomeOficina;

  document.getElementById('revHorarioSemana').textContent =
    `Seg–Sex: ${info3.horaSemanaInicio} às ${info3.horaSemanaFim}`;
  document.getElementById('revHorarioSabado').textContent =
    `Sábado: ${info3.horaSabadoInicio} às ${info3.horaSabadoFim}`;
  document.getElementById('revBoxes').textContent = `${info3.numBoxes} box(es)`;

  document.getElementById('revEndereco').textContent =
    `${info2.logradouro}, ${info2.numero} – ${info2.bairro}`;
  document.getElementById('revCidadeEstado').textContent =
    `${info2.cidade} / ${info2.estado}`;
  document.getElementById('revCep').textContent = info2.cep;
}

function removerUserCad() {
  sessionStorage.removeItem('UserCad');
}
function removerinfo1() {
  sessionStorage.removeItem('info1');
}
function removerinfo2() {
  sessionStorage.removeItem('info2');
}
function removerinfo3() {
  sessionStorage.removeItem('info3');
}
function removerinfo4() {
  sessionStorage.removeItem('info4');
}
