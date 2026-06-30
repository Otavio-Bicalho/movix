const sessao = JSON.parse(
    sessionStorage.getItem('UserpfLogado') || 'null'
);

if (!sessao || !sessao.id_usuario) {
    window.location.href = 'loginUser.html';
}


function lsArray(chave, prop) {

    try {

        const raw = localStorage.getItem(chave);

        if (!raw) return [];

        const dados = JSON.parse(raw);

        if (Array.isArray(dados)) return dados;

        if (dados && Array.isArray(dados[prop])) {
            return dados[prop];
        }

        return [];

    } catch {
        return [];
    }
}



function salvarLs(chave, prop, lista) {

    localStorage.setItem(
        chave,
        JSON.stringify({
            [prop]: lista
        })
    );

}



async function seedSeNecessario(chave, arquivo) {

    if (localStorage.getItem(chave)) return;

    try {

        const resposta = await fetch(arquivo);
        const dados = await resposta.json();

        localStorage.setItem(
            chave,
            JSON.stringify(dados)
        );

    } catch (erro) {
        console.error(
            `Erro carregando ${chave}`,
            erro
        );
    }

}




async function carregarDados() {


    await seedSeNecessario(
        'meus_veiculos',
        '../assets/scripts/meus_veiculos.json'
    );

    await seedSeNecessario(
        'motoristas',
        '../assets/scripts/motoristas.json'
    );

    await seedSeNecessario(
        'lancamento',
        '../assets/scripts/lancamentos.json'
    );



    const todosVeiculos =
        lsArray('meus_veiculos','meus_veiculos');


    const motoristas =
        lsArray('motoristas','motoristas');


    const lancamentos =
        lsArray('lancamento','lancamento');



    const veiculos =
        todosVeiculos.filter(v =>
            Number(v.usuario_id) ===
            Number(sessao.id_usuario)
        );



    const container =
        document.getElementById('cards-veiculos');


    if (!container) return;



    let cardsHTML = '';



    veiculos.forEach(veiculo => {


        const motorista =
            motoristas.find(m =>
                m.id_motorista === veiculo.motorista_id
            );



        let lancamentosVeiculo =
            lancamentos.filter(l =>
                l.meus_veiculos_id === veiculo.id_meuveiculo
            );



        /*
            ORDENA POR DATA
            E PEGA SOMENTE OS 2 ÚLTIMOS
        */

        lancamentosVeiculo.sort((a,b)=>{

            return new Date(b.data_inicio)
                -
            new Date(a.data_inicio);

        });



        const ultimosLancamentos =
            lancamentosVeiculo.slice(0,2);



        let htmlLancamentos = '';



        ultimosLancamentos.forEach(l => {


            htmlLancamentos += `

            <div class="evento">

                <p>${l.evento}</p>

                <strong>
                    ${l.data_inicio
                    .split('-')
                    .reverse()
                    .join('/')}
                </strong>

            </div>

            `;


        });



        cardsHTML += `


        <div 
            class="card-veiculo"
            data-id="${veiculo.id_meuveiculo}"
        >



            <div class="topo-card">


                <div class="header-esquerda">


                    <div class="menu-container">


                        <button class="btn-opcoes">

                            <img 
                            src="../assets/img/icons/tres-pontos.svg">

                        </button>



                        <div class="menu-opcoes escondido">


                            <button 
                            class="opcao-menu btn-detalhes">

                                Ver detalhes

                            </button>



                            <button
                            class="opcao-menu btn-editar"
                            data-id="${veiculo.id_meuveiculo}">

                                Editar

                            </button>



                            <button
                            class="opcao-menu btn-deletar">

                                Deletar

                            </button>



                        </div>


                    </div>



                    <div class="veiculo-nome">

                        ${veiculo.modelo}
                        ${veiculo.ano_modelo}
                        -
                        ${veiculo.marca}

                    </div>


                </div>





                <div class="topo-item">

                    <span>Motorista</span>

                    <p>
                    ${
                    motorista
                    ? motorista.nome
                    : 'Sem motorista'
                    }
                    </p>

                </div>




                <div class="topo-item">


                    <span>Status</span>


                    <div class="${
                        veiculo.status
                        ? 'status-ativo'
                        :
                        'status-inativo'
                    }">


                    ${
                    veiculo.status
                    ? 'Ativo'
                    :
                    'Inativo'
                    }


                    </div>


                </div>





                <div class="topo-item">

                    <span>Proprietário</span>

                    <p>${veiculo.proprietario}</p>

                </div>



                <div class="seta">

                    <img
                    src="../assets/img/icons/seta-baixo.svg">

                </div>



            </div>






            <div class="infos">



                <div class="lado-esquerdo">


                ${campo('Marca',veiculo.marca)}
                ${campo('Modelo',veiculo.modelo)}
                ${campo('Ano Modelo',veiculo.ano_modelo)}
                ${campo('Ano Fabricação',veiculo.ano_fabricacao)}
                ${campo('Cor',veiculo.cor)}
                ${campo('Tipo de câmbio',veiculo.tipo_cambio)}
                ${campo('Tipo Combustível',veiculo.tipo_combustivel)}
                ${campo('Vol. do Tanque',veiculo.vl_tanque+'L')}
                ${campo('Placa',veiculo.placa)}
                ${campo('Renavam',veiculo.renavam)}
                ${campo('Quilômetros',veiculo.quilometros+' Km')}


                </div>





                <div class="cronograma">


                    <h2>Cronograma</h2>


                    ${
                    htmlLancamentos ||
                    '<p>Nenhum lançamento</p>'
                    }



                    <button 
                    class="btn-cronograma"
                    data-id="${veiculo.id_meuveiculo}">

                        Exibir Cronograma Completo

                    </button>


                </div>



            </div>



        </div>



        `;


    });



    container.innerHTML = cardsHTML;




    eventosCards();



}







function campo(nome, valor){

return `

<div class="campo">

<label>
<strong>${nome}</strong>
</label>

<div class="valor">
${valor ?? ''}
</div>

</div>

`;

}







function eventosCards(){



document.querySelectorAll('.card-veiculo')
.forEach(card=>{


    card.addEventListener('click',()=>{

        card.querySelector('.infos')
        .classList.toggle('ativo');

        card.classList.toggle('ativo');

    });


});





document.querySelectorAll('.btn-opcoes')
.forEach(btn=>{


btn.addEventListener('click',e=>{


e.stopPropagation();


const menu =
btn.parentElement
.querySelector('.menu-opcoes');



document.querySelectorAll('.menu-opcoes')
.forEach(m =>
m.classList.add('escondido')
);



menu.classList.toggle('escondido');



});


});





document.querySelectorAll('.btn-editar')
.forEach(btn=>{


btn.addEventListener('click',e=>{


e.stopPropagation();



const id =
btn.dataset.id;



const veiculo =
lsArray('meus_veiculos','meus_veiculos')
.find(v =>
v.id_meuveiculo == id
);



localStorage.setItem(
'veiculoEditar',
JSON.stringify(veiculo)
);



window.location.href =
'../pages/InserirVeiculos.html';



});

});





document.querySelectorAll('.btn-cronograma')
.forEach(btn=>{


btn.addEventListener('click',e=>{


e.stopPropagation();



window.location.href =
'view_cronograma.html?veiculo_id='
+
btn.dataset.id;



});

});






let idExcluir = null;



document.querySelectorAll('.btn-deletar')
.forEach(btn=>{


btn.addEventListener('click',e=>{


e.stopPropagation();



idExcluir =
btn.closest('.card-veiculo')
.dataset.id;



document
.getElementById('modal-delete')
.classList.remove('escondido');



});

});




document
.querySelector('.btn-cancelar-modal')
?.addEventListener('click',()=>{


idExcluir=null;


document
.getElementById('modal-delete')
.classList.add('escondido');


});





document
.querySelector('.btn-confirmar-delete')
?.addEventListener(()=>{



let lista =
lsArray('meus_veiculos','meus_veiculos');



lista =
lista.filter(v =>
v.id_meuveiculo != idExcluir
);



salvarLs(
'meus_veiculos',
'meus_veiculos',
lista
);



location.reload();



});



}







carregarDados();







document
.getElementById('btn-adicionar')
?.addEventListener('click',()=>{


localStorage.removeItem('veiculoEditar');


window.location.href =
'../pages/InserirVeiculos.html';


});






document
.querySelector('.search')
?.addEventListener('input',e=>{


const termo =
e.target.value
.toLowerCase()
.trim();



document
.querySelectorAll('.card-veiculo')
.forEach(card=>{


card.style.display =
card.innerText
.toLowerCase()
.includes(termo)
?
''
:
'none';


});


});