// 1. CONFIGURAÇÃO DO FIREBASE
// COLE SUAS CHAVES DO FIREBASE AQUI
const firebaseConfig = {
    apiKey: "AIzaSyCDRupoBxBFTovsPdasQPeOBbs3f8Uq1O0",
    authDomain: "plano-de-ingles-teste.firebaseapp.com",
    projectId: "plano-de-ingles-teste",
    storageBucket: "plano-de-ingles-teste.firebasestorage.app",
    messagingSenderId: "868459740241",
    appId: "1:868459740241:web:40be7c54dee9ee39abcc70"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

let diaAtual = 1;
let progressoAtual = { oralidade: 0, leitura: 0, escuta: 0, escrita: 0 };

const frasesMotivacionais = [
    "A jornada de mil milhas começa com um único passo. Você já deu o seu!", // Semana 1
    "Pequenos progressos diários somam-se a grandes resultados.", // Semana 2
    "A persistência é o caminho do êxito.", // Semana 3
    "Não espere por uma crise para descobrir o que é importante na sua vida.", // Semana 4
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.", // Semana 5
    "A falta de ânimo faz parte do processo de aprendizado, por isso é importante você sempre relembrar <strong>o porquê</strong> de estar estudando inglês. Se achar necessário, releia suas respostas às perguntas de reflexão no início do seu plano de estudos.", // Semana 6
    "Cada dia é uma nova oportunidade para aprender e crescer.", // Semana 7
    "Aprender um novo idioma abre portas para um novo mundo.", // Semana 8
    "Seja a mudança que você deseja ver no mundo dos idiomas.", // Semana 9
    "Aprender é o único caminho para o crescimento contínuo.", // Semana 10
    "A fluência não é um destino, é uma jornada. Aproveite cada passo!", // Semana 11
    "Sua dedicação de hoje é a sua fluência de amanhã.", // Semana 12
    "Não desista! O aprendizado é um processo, não um evento.", // Semana 13
    "Cada palavra nova é uma vitória. Celebre-as!", // Semana 14
    "A prática leva à perfeição, especialmente em um novo idioma.", // Semana 15
    "Desafie-se. É assim que você descobre o quão forte você é.", // Semana 16
    "Aprender um idioma é como construir uma ponte para novas culturas.", // Semana 17
    "O maior segredo do sucesso é a paixão pelo que se faz.", // Semana 18
    "Não tenha medo de errar. Errar faz parte do aprendizado.", // Semana 19
    "Sua voz importa, em qualquer idioma.", // Semana 20
    "Parabéns! Você chegou ao fim de mais uma etapa. O mundo é seu!" // Semana 21
];

// Lógica do ciclo de tarefas do PDF (7 dias)
const cicloTarefas = [
    "REVISÃO DE VOCABULÁRIO", // Posição 0 (Múltiplos de 7, ex: Dia 7, 14, 21)
    "ORALIDADE",              // Posição 1 (Ex: Dia 1, 8, 15)
    "ESCUTA",                 // Posição 2 (Ex: Dia 2, 9, 16)
    "REVISÃO DE VOCABULÁRIO", // Posição 3 (Ex: Dia 3, 10, 17)
    "ESCRITA",                // Posição 4 (Ex: Dia 4, 11, 18)
    "LEITURA",                // Posição 5 (Ex: Dia 5, 12, 19)
    "ESTRUTURAS DA LÍNGUA"    // Posição 6 (Ex: Dia 6, 13, 20)
];

// 2. CONTROLE DE LOGIN
auth.onAuthStateChanged(user => {
    document.getElementById('loading-spinner').classList.add('escondido');

    if (user) {
        db.collection('alunos').doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().onboardingConcluido) {
                // USUÁRIO LOGADO E ONBOARDING CONCLUÍDO (MOSTRAR DASHBOARD)
                window.onboardingConcluido = true;
                document.getElementById('tela-login').classList.add('escondido');
                document.getElementById('tela-dashboard').classList.remove('escondido');
                
                const logoElement = document.getElementById('logo-topo-site');
                logoElement.classList.remove('escondido'); // Remove a classe (ainda é bom manter)
                logoElement.style.display = 'block'; // <-- ADICIONE ESTA LINHA: Força o display para 'block'
                logoElement.style.visibility = 'visible';
                
                document.getElementById('logo-rodape-site').classList.remove('escondido');
                gerarGridDias();
                carregarProgressoDias();
            } else {
                // USUÁRIO LOGADO, MAS ONBOARDING NÃO CONCLUÍDO (MOSTRAR ONBOARDING)
                window.onboardingConcluido = false;
                document.getElementById('tela-login').classList.add('escondido');
                document.getElementById('logo-topo-site').classList.add('escondido');
                document.getElementById('logo-rodape-site').classList.add('escondido');
                document.getElementById('tela-ob-1').classList.remove('escondido');
                gerarGridDias();
            }
        }).catch(error => {
            console.error("Erro ao carregar dados do aluno:", error);
            window.onboardingConcluido = false;
            document.getElementById('tela-login').classList.remove('escondido');
            document.getElementById('tela-dashboard').classList.add('escondido');
            document.getElementById('tela-ob-1').classList.add('escondido');
            document.getElementById('logo-topo-site').classList.add('escondido');
        });
    } else {
        // USUÁRIO NÃO LOGADO (MOSTRAR TELA DE LOGIN)
        window.onboardingConcluido = false;
        document.getElementById('tela-login').classList.remove('escondido');
        if (document.getElementById('tela-dashboard').classList.contains('escondido')) {
            document.getElementById('logo-topo-site').classList.add('escondido');
        }
        document.getElementById('tela-dashboard').classList.add('escondido');
        document.getElementById('tela-dia').classList.add('escondido');
        document.getElementById('tela-verificador-semanal').classList.add('escondido');
        document.getElementById('tela-verificador-progresso').classList.add('escondido');
    }
});

        function fazerLogin() {
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;

            if(!email || !senha) {
                alert("Por favor, preencha e-mail e senha.");
                return;
            }

            auth.signInWithEmailAndPassword(email, senha)
                .catch((error) => {
                    const errorCode = error.code;
                    let mensagemAmigavel = "Ocorreu um erro ao fazer login. Por favor, tente novamente.";

                    if (errorCode === 'auth/user-disabled') {
                        // Mensagem específica para conta desativada
                        mensagemAmigavel = "Sua conta está desativada. Isso pode acontecer se sua assinatura expirou. Por favor, entre em contato com o suporte para reativar: https://wa.me/5511920898795";
                    } else if (errorCode === 'auth/invalid-email' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
                        // Mensagem para e-mail/senha incorretos
                        mensagemAmigavel = "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.";
                    } else {
                        // Mensagem genérica para outros erros
                        mensagemAmigavel = "Erro ao fazer login: " + error.message;
                    }

                    alert(mensagemAmigavel);
                });
        }

        function sair() { 
            auth.signOut().then(() => {
                // 1. Esconde a logo do topo
                let logoTopo = document.getElementById('logo-topo-site');
                if (logoTopo) {
                    logoTopo.classList.add('escondido');
                }

                // 2. Esconde a logo do rodapé
                let logoRodape = document.querySelector('.rodape-logo');
                if (logoRodape) {
                    logoRodape.classList.add('escondido');
                }

                // 3. Recarrega a página para garantir que a tela de login volte limpa
                window.location.reload();
            }); 
        }

// 3. LÓGICA DO APLICATIVO
function gerarGridDias() {
    const grid = document.getElementById('grid-dias');
    grid.innerHTML = '';

    const diasPorSemana = 7;
    const totalSemanas = 21;            // 21 semanas
    const totalDias = diasPorSemana * totalSemanas; // 147 dias

    for (let s = 0; s < totalSemanas; s++) {
        // Cria a caixa da semana
        const semanaDiv = document.createElement('div');
        semanaDiv.className = 'semana-container';

        // Título da semana
        const titulo = document.createElement('div');
        titulo.className = 'titulo-semana';
        titulo.innerText = 'SEMANA ' + (s + 1);
        semanaDiv.appendChild(titulo);

        // Grade com os 7 dias
        const diasGrid = document.createElement('div');
        diasGrid.className = 'dias-grid';

        // Cria os botões dos dias
        for (let d = 1; d <= diasPorSemana; d++) {
            const numeroDia = (s * diasPorSemana) + d;
            if (numeroDia > totalDias) break;   // não passa de 147

            const btn = document.createElement('button');
            btn.className = 'dia-btn';
            btn.dataset.dia = numeroDia;
            btn.id = 'btn-dia-' + numeroDia;
            btn.innerText = numeroDia;          // mostra o número do dia
            btn.onclick = () => abrirDia(numeroDia);

            diasGrid.appendChild(btn);
        }

        semanaDiv.appendChild(diasGrid);

        // Adiciona o botão do Verificador de Progresso nas semanas 4, 8, 12, 16 e 21
        if (s === 3 || s === 7 || s === 11 || s === 15 || s === 20) {
            // mapeia semana → "mês" do verificador
            let mes;
            if (s === 3)      mes = 1; // depois da semana 4
            else if (s === 7) mes = 2; // depois da semana 8
            else if (s === 11) mes = 3; // depois da semana 12
            else if (s === 15) mes = 4; // depois da semana 16
            else if (s === 20) mes = 5; // depois da semana 21

            const btnProgresso = document.createElement('button');
            btnProgresso.innerText = 'verificador de progresso';
            btnProgresso.style.width = '100%';
            btnProgresso.style.marginTop = '15px';
            btnProgresso.style.backgroundColor = 'var(--cor-roxa)';
            btnProgresso.style.fontSize = '17.5px';
            btnProgresso.onclick = () => abrirVerificadorProgresso(mes);

            semanaDiv.appendChild(btnProgresso);
        }

        grid.appendChild(semanaDiv);
    }

    // Chama a função para pintar os dias já salvos
    carregarProgressoDias();
}

function carregarProgressoDias() {
    const user = auth.currentUser;
    if (user) {
        // Busca todos os dias salvos deste aluno
        db.collection('alunos').doc(user.uid).collection('dias').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                // O nome do documento é "dia_1", "dia_2", etc. Vamos pegar só o número.
                let numeroDiaSalvo = doc.id.split('_')[1]; 
                let botao = document.getElementById('btn-dia-' + numeroDiaSalvo);

                // Se o botão existir, pinta de verde
                if (botao) {
                    botao.classList.add('concluido');
                }
            });
        })
        .catch((error) => {
            console.log("Erro ao carregar progresso: ", error);
        });
    }
}

function abrirDia(numeroDia) {
    window.scrollTo(0, 0);
    diaAtual = numeroDia;
    document.getElementById('tela-dashboard').classList.add('escondido');
    document.getElementById('tela-dia').classList.remove('escondido');

    document.getElementById('titulo-dia').innerText = 'Dia #' + numeroDia + ' - ';
    const indiceTarefa = numeroDia % 7;
    document.getElementById('tarefa-dia').innerText = cicloTarefas[indiceTarefa];

    // Limpa a data e a descrição da tarefa
    let dataDia = document.getElementById('data-dia');
    let descTarefa = document.getElementById('descricao-tarefa');
    if(dataDia) dataDia.value = '';
    if(descTarefa) descTarefa.value = '';
    let diaSemana = document.getElementById('dia-semana');
    if(diaSemana) diaSemana.value = '';

    // 1. Limpa os campos de vocabulário (agora suporta até 50)
    for(let i=1; i<=50; i++) {
        let voc = document.getElementById('voc-'+i);
        let exe = document.getElementById('exe-'+i);

        if(voc) {
            if(i <= 9) { 
                // Mantém os originais do HTML, só apaga o texto
                voc.value = '';
                if(exe) exe.value = '';
            } else { 
                // Remove os campos extras para não vazarem para o próximo dia que você clicar
                voc.remove();
                if(exe) exe.remove();
            }
        }
    }

    // 2. Limpa o empenho (tira a seleção visual e limpa o valor oculto)
    let empenhoSalvo = document.getElementById('empenho-salvo');
    if(empenhoSalvo) empenhoSalvo.value = '';
    let botoesEmpenho = document.querySelectorAll('.btn-empenho');
    botoesEmpenho.forEach(btn => btn.classList.remove('selecionado'));

    // 3. Limpa as bolinhas de porcentagem (deixa tudo desmarcado)
    let botoesPorcentagem = document.querySelectorAll('.btn-porcentagem');
    botoesPorcentagem.forEach(btn => btn.classList.remove('ativo'));

    ['oralidade', 'leitura', 'escuta', 'escrita'].forEach(hab => {
        let input = document.getElementById('progresso-' + hab);
        if(input) input.value = '';
    });

    carregarDia(numeroDia);

let btnVerificador = document.getElementById('btn-ir-verificador');
    if (btnVerificador) {
        if (numeroDia % 7 === 0) {
            btnVerificador.classList.remove('escondido');
        } else {
            btnVerificador.classList.add('escondido');
        }
    }
}

        function voltarDashboard() {
            window.scrollTo(0, 0);
            document.getElementById('tela-dia').classList.add('escondido');
            document.getElementById('tela-dashboard').classList.remove('escondido');
        }

        function mudarProgresso(habilidade, valor) {
            progressoAtual[habilidade] = valor;
            document.getElementById('barra-' + habilidade).style.width = valor + '%';
            document.getElementById('txt-' + habilidade).innerText = valor;
        }

        // 4. SALVAR E CARREGAR
function salvarDia() {
    const user = auth.currentUser;
    if (user) {
        let dadosParaSalvar = {
            data: document.getElementById('data-dia') ? document.getElementById('data-dia').value : '',
            diaSemana: document.getElementById('dia-semana') ? document.getElementById('dia-semana').value : '',            
            descricaoTarefa: document.getElementById('descricao-tarefa') ? document.getElementById('descricao-tarefa').value : '',
            empenho: document.getElementById('empenho-salvo') ? document.getElementById('empenho-salvo').value : '',
            oralidade: document.getElementById('progresso-oralidade') ? document.getElementById('progresso-oralidade').value : '',
            leitura: document.getElementById('progresso-leitura') ? document.getElementById('progresso-leitura').value : '',
            escuta: document.getElementById('progresso-escuta') ? document.getElementById('progresso-escuta').value : '',
            escrita: document.getElementById('progresso-escrita') ? document.getElementById('progresso-escrita').value : ''
        };

        // Salva até 50 campos dinâmicos
        for(let i=1; i<=50; i++) {
            let voc = document.getElementById('voc-'+i);
            let exe = document.getElementById('exe-'+i);

            // Só salva se o campo realmente existir na tela
            if (voc || exe) {
                dadosParaSalvar['voc'+i] = voc ? voc.value : '';
                dadosParaSalvar['exe'+i] = exe ? exe.value : '';
            }
        }

        db.collection('alunos').doc(user.uid).collection('dias').doc('dia_' + diaAtual).set(dadosParaSalvar)
        .then(() => {
            let botaoPainel = document.getElementById('btn-dia-' + diaAtual);
            if(botaoPainel) botaoPainel.classList.add('concluido');
            const msg = document.getElementById('mensagem-sucesso');
            if(msg) {
                msg.classList.remove('escondido');
                setTimeout(() => {
                    msg.classList.add('escondido');
                }, 3000);
            }
        })
        .catch((error) => {
            alert("Erro ao salvar: " + error);
        });
    }
}

function carregarDia(numeroDia) {
    const user = auth.currentUser;
    if (user) {
        db.collection('alunos').doc(user.uid).collection('dias').doc('dia_' + numeroDia).get()
        .then(doc => {
            if (doc.exists) {
                const dados = doc.data();

                // Carrega a data e a descrição da tarefa
                let dataDia = document.getElementById('data-dia');
                let descTarefa = document.getElementById('descricao-tarefa');
                if(dataDia) dataDia.value = dados.data || '';
                let diaSemana = document.getElementById('dia-semana');
                if(diaSemana) diaSemana.value = dados.diaSemana || '';
                if(descTarefa) descTarefa.value = dados.descricaoTarefa || '';

                // 1. Carrega os vocabulários (agora até 50 campos)
                for(let i=1; i<=50; i++) {
                    let textoVoc = dados['voc'+i];
                    let textoExe = dados['exe'+i];

                    // Trava de segurança: Verifica se existe algo salvo E se não é apenas um texto vazio
                    let temTextoSalvo = (textoVoc && textoVoc.trim() !== '') || (textoExe && textoExe.trim() !== '');

                    if(temTextoSalvo) {
                        let voc = document.getElementById('voc-'+i);
                        let exe = document.getElementById('exe-'+i);

                        // Se o campo não existe no HTML, nós criamos ele dinamicamente!
                        if(!voc) {
                            const grid = document.querySelector('.grid-vocabulario');
                            if(grid) {
                                voc = document.createElement('input');
                                voc.type = 'text';
                                voc.id = `voc-${i}`;
                                voc.className = 'input-cinza';

                                exe = document.createElement('input');
                                exe.type = 'text';
                                exe.id = `exe-${i}`;
                                exe.className = 'input-cinza';

                                grid.appendChild(voc);
                                grid.appendChild(exe);
                            }
                        }

                        // Preenche com o texto salvo
                        if(voc) voc.value = textoVoc || '';
                        if(exe) exe.value = textoExe || '';
                    }
                }

                // 2. Carrega o empenho visualmente
                let valorEmpenho = dados.empenho || '';
                let empenhoSalvo = document.getElementById('empenho-salvo');
                if(empenhoSalvo) empenhoSalvo.value = valorEmpenho;

                if(valorEmpenho) {
                    let btnCorreto = document.querySelector(`.btn-empenho[data-valor="${valorEmpenho}"]`);
                    if(btnCorreto) btnCorreto.classList.add('selecionado');
                }

                // 3. Carrega as bolinhas roxas apenas se houver algo salvo
                if (typeof selecionarPorcentagem === "function") {
                    if (dados.oralidade) selecionarPorcentagem('oralidade', dados.oralidade);
                    if (dados.leitura) selecionarPorcentagem('leitura', dados.leitura);
                    if (dados.escuta) selecionarPorcentagem('escuta', dados.escuta);
                    if (dados.escrita) selecionarPorcentagem('escrita', dados.escrita);
                }
            }
        });
    }
}

        // Função para selecionar o emoji no Verificador Diário
function selecionarEmpenho(botaoClicado) {
    // Remove a classe 'selecionado' de todos os botões
    let botoes = document.querySelectorAll('.btn-empenho');
    botoes.forEach(btn => btn.classList.remove('selecionado'));

    // Adiciona a classe 'selecionado' apenas no botão clicado
    botaoClicado.classList.add('selecionado');

    // Salva o valor escolhido no campo escondido
    document.getElementById('empenho-salvo').value = botaoClicado.getAttribute('data-valor');
}

// Função para selecionar a porcentagem nas faixas roxas
function selecionarPorcentagem(habilidade, valor) {
    // Salva o valor no campo escondido
    document.getElementById('progresso-' + habilidade).value = valor;

    // Encontra a linha certa (Oralidade, Leitura, etc)
    let container = document.querySelector(`.porcentagens[data-habilidade="${habilidade}"]`);

    // Apaga todas as bolinhas dessa linha
    let botoes = container.querySelectorAll('.btn-porcentagem');
    botoes.forEach(btn => btn.classList.remove('ativo'));

    // Acende apenas a bolinha que foi clicada
    let botaoClicado = Array.from(botoes).find(btn => btn.innerText === valor + '%');
    if(botaoClicado) {
        botaoClicado.classList.add('ativo');
    }
}

// Funções do Onboarding (Telas Iniciais)
function avancarOnboarding(telaAtual, proximaTela) {
    window.scrollTo(0, 0);
    document.getElementById('tela-ob-' + telaAtual).classList.add('escondido');

    // Verifica se o usuário já concluiu o onboarding (ou seja, está revisando as telas)
    // Se a próxima tela é o dashboard, finaliza o onboarding.
    if (proximaTela === 'dashboard') {
        finalizarOnboarding(); // Chama a função que já existe para finalizar e ir para o dashboard
    } else {
        if (window.onboardingConcluido) {
            // Se o onboarding já foi concluído, usamos abrirTelaAvulsa para a próxima tela
            // para garantir que o botão "voltar ao menu" apareça.
            abrirTelaAvulsa('tela-ob-' + proximaTela);
        } else {
            // Se o onboarding ainda não foi concluído, apenas avança normalmente.
            document.getElementById('tela-ob-' + proximaTela).classList.remove('escondido');
        }
    }
}

function abrirTela(idTela) {
    window.scrollTo(0, 0);
    document.getElementById('tela-dashboard').classList.add('escondido');
    document.getElementById(idTela).classList.remove('escondido');
}

function voltarAoMenu(idTelaAtual) {
    window.scrollTo(0, 0);
    document.getElementById(idTelaAtual).classList.add('escondido');
    document.getElementById('tela-dashboard').classList.remove('escondido');
}

function finalizarOnboarding() {
    const user = auth.currentUser;
    if (user) {
        db.collection('alunos').doc(user.uid).set({ onboardingConcluido: true }, { merge: true })
        .then(() => {
            window.onboardingConcluido = true; // Define a flag global
            document.getElementById('tela-ob-9').classList.add('escondido');
            document.getElementById('tela-dashboard').classList.remove('escondido');
            // remover: adicionarBotoesVoltarOnboarding(); // Esta linha já foi removida
        });
    }
}

function abrirTelaAvulsa(idTela) {
    window.scrollTo(0, 0); // Rola para o topo da página

    // Esconde todas as telas que podem estar visíveis antes de abrir a nova
    document.getElementById('tela-dashboard').classList.add('escondido');
    document.getElementById('tela-dia').classList.add('escondido');
    document.getElementById('tela-verificador-semanal').classList.add('escondido');
    document.getElementById('tela-verificador-progresso').classList.add('escondido');
    // Adicione aqui qualquer outra tela que possa estar visível e precise ser escondida
    // Esconde todas as telas de onboarding também
    for (let i = 1; i <= 9; i++) {
        let telaOnboarding = document.getElementById('tela-ob-' + i);
        if (telaOnboarding) {
            telaOnboarding.classList.add('escondido');
        }
    }


    let telaDestino = document.getElementById(idTela);
    if (telaDestino) { // Verifica se a tela de destino existe
        telaDestino.classList.remove('escondido');

        // Cria um botão "Voltar" automaticamente no topo da tela acessada
        // Verifica se o botão já existe para não duplicar
        if (!document.getElementById('btn-voltar-' + idTela)) {
            let btnVoltar = document.createElement('button');
            btnVoltar.id = 'btn-voltar-' + idTela;
            btnVoltar.innerText = 'voltar ao menu';
            btnVoltar.style.backgroundColor = '#999';
            btnVoltar.style.marginBottom = '20px';
            btnVoltar.style.width = 'auto'; // Mude de '100%' para 'auto'
            btnVoltar.style.padding = '15px 20px'; // Diminua o padding (ex: 10px de altura, 20px de largura)
            btnVoltar.onclick = function() {
                telaDestino.classList.add('escondido');
                document.getElementById('tela-dashboard').classList.remove('escondido');
            };
            // Insere o botão como primeiro filho da tela de destino
            telaDestino.insertBefore(btnVoltar, telaDestino.firstChild);
        }
    }
}

function adicionarLinhaRotina() {
    const container = document.getElementById('lista-rotina');
    const div = document.createElement('div');
    div.className = 'atividade-item';
    div.style.marginBottom = '10px';
    div.innerHTML = `
        <input type="text" class="input-linha" placeholder="Atividade" style="width: 60%;">
        <input type="text" class="input-linha" placeholder="Tempo (ex: 1h)" style="width: 30%;">
    `;
    container.appendChild(div);
}

// Adiciona 3 linhas vazias de rotina logo que a página carrega
window.onload = function() {
    for(let i=0; i<3; i++) adicionarLinhaRotina();
};

// Funções para abrir e fechar as subpáginas de tarefas
function abrirSubpagina(categoria) {
    window.scrollTo(0, 0);
    // Esconde o menu principal de tarefas
    document.getElementById('tela-ob-tarefas').classList.add('escondido');
    // Mostra a subpágina escolhida
    document.getElementById('subpagina-' + categoria).classList.remove('escondido');
}

function voltarMenuTarefas() {
    window.scrollTo(0, 0);
    // Lista com os IDs de todas as subpáginas
    const categorias = ['oralidade', 'escuta', 'escrita', 'leitura', 'vocabulario', 'estruturas'];

    // Esconde todas elas
    categorias.forEach(cat => {
        let tela = document.getElementById('subpagina-' + cat);
        if(tela) tela.classList.add('escondido');
    });

    // Mostra o menu principal novamente
    document.getElementById('tela-ob-tarefas').classList.remove('escondido');
}

// Lógica do Verificador Semanal
let semanaAtualVS = 1;

function selecionarSimNao(botaoClicado, idInput, valor) {
    // 1. Salva a sua resposta (SIM ou NÃO) no campo escondido
    document.getElementById(idInput).value = valor;

    // 2. Pega a "caixa" (div) exata que envolve os botões SIM e NÃO que você clicou
    let caixaDosBotoes = botaoClicado.parentElement;

    // 3. Encontra TODOS os botões dentro dessa caixa e remove a marcação deles
    let botoes = caixaDosBotoes.querySelectorAll('button');
    botoes.forEach(btn => {
        btn.classList.remove('selecionado');
    });

    // 4. Pinta de roxo APENAS o botão que você acabou de clicar
    botaoClicado.classList.add('selecionado');
}

function selecionarEmpenhoVS(botaoClicado) {
    let container = botaoClicado.parentElement;
    let botoes = container.querySelectorAll('.btn-empenho');
    botoes.forEach(btn => btn.classList.remove('selecionado'));

    botaoClicado.classList.add('selecionado');
    document.getElementById('vs-avaliacao-geral').value = botaoClicado.getAttribute('data-valor');
}

function abrirVerificadorSemanal() {
    window.scrollTo(0, 0);
    semanaAtualVS = Math.ceil(diaAtual / 7);
    document.getElementById('tela-dia').classList.add('escondido');
    document.getElementById('tela-verificador-semanal').classList.remove('escondido');
    document.getElementById('titulo-semana-atual').innerText = 'Semana ' + semanaAtualVS;

    // Criação da frase motivacional //
    const fraseMotivacionalElement = document.getElementById('container-frase-motivacional-semanal');
    if (fraseMotivacionalElement) {
        // Ajusta o índice para o array (semana 1 -> índice 0)
        const indiceFrase = semanaAtualVS - 1;
        if (indiceFrase >= 0 && indiceFrase < frasesMotivacionais.length) {
            fraseMotivacionalElement.innerText = frasesMotivacionais[indiceFrase];
        } else {
            fraseMotivacionalElement.innerText = "Continue firme em sua jornada!"; // Frase padrão se não houver uma específica
        }
    }

    carregarVerificadorSemanal(semanaAtualVS);
}

function voltarDashboardVS() {
    window.scrollTo(0, 0);
    document.getElementById('tela-verificador-semanal').classList.add('escondido');
    document.getElementById('tela-dashboard').classList.remove('escondido');
}

function salvarVerificadorSemanal() {
    const user = auth.currentUser;
    if (user) {
        let dadosVS = {
            diasEmpenho: document.getElementById('vs-dias-marcados').value,
            q1: document.getElementById('vs-q1').value,
            q2: document.getElementById('vs-q2').value,
            q3: document.getElementById('vs-q3').value,
            q4: document.getElementById('vs-q4').value,
            q5: document.getElementById('vs-q5').value,
            positivos: document.getElementById('vs-positivos').value,
            negativos: document.getElementById('vs-negativos').value,
            melhorar: document.getElementById('vs-melhorar').value
        };

        db.collection('alunos').doc(user.uid).collection('verificadores').doc('semana_' + semanaAtualVS).set(dadosVS)
        .then(() => {
            const msg = document.getElementById('msg-sucesso-vs');
            msg.classList.remove('escondido');
            setTimeout(() => msg.classList.add('escondido'), 3000);
        })
        .catch(error => alert("Erro ao salvar: " + error));
    }
}

function carregarVerificadorSemanal(semana) {
    const user = auth.currentUser;
    if (user) {
        // 1. PRIMEIRO: Limpa toda a tela antes de carregar os dados novos
        document.getElementById('vs-positivos').value = '';
        document.getElementById('vs-negativos').value = '';
        document.getElementById('vs-melhorar').value = '';
        document.getElementById('vs-dias-marcados').value = '[]';

        // Limpa os dias marcados (CORRIGIDO: removido o código que causava crash)
        document.querySelectorAll('.dia-rastreador').forEach(el => {
            el.classList.remove('marcado');
        });

        // Limpa os botões SIM/NÃO (CORRIGIDO: a classe certa é .vs-btn-sn)
        ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(q => {
            document.getElementById('vs-' + q).value = '';
            let inputHidden = document.getElementById('vs-' + q);
            let container = inputHidden.parentElement;
            let botoes = container.querySelectorAll('.vs-btn-sn'); // Correção aqui
            botoes.forEach(btn => btn.classList.remove('selecionado'));
        });

        // 2. SEGUNDO: Busca os dados da semana específica no banco
        db.collection('alunos').doc(user.uid).collection('verificadores').doc('semana_' + semana).get()
        .then(doc => {
            if (doc.exists) {
                const dados = doc.data();

                // Preenche textareas
                document.getElementById('vs-positivos').value = dados.positivos || '';
                document.getElementById('vs-negativos').value = dados.negativos || '';
                document.getElementById('vs-melhorar').value = dados.melhorar || '';

                // Restaura os dias marcados na caixa roxa
                if (dados.diasEmpenho) {
                    try {
                        // Devolve os dados para o input escondido para não perder ao clicar em outro dia
                        document.getElementById('vs-dias-marcados').value = dados.diasEmpenho;

                        let diasSalvos = JSON.parse(dados.diasEmpenho);
                        diasSalvos.forEach(dia => {
                            let elementosDia = document.querySelectorAll('.dia-rastreador');
                            elementosDia.forEach(el => {
                                let nomeDiaTela = el.querySelector('.nome-dia').innerText.trim();
                                if (nomeDiaTela === dia.trim()) {
                                    el.classList.add('marcado'); // O CSS já coloca o '✔' automaticamente
                                }
                            });
                        });
                    } catch (e) {
                        console.error("Erro ao carregar dias de empenho", e);
                    }
                }

                // Restaura botões SIM/NÃO (CORRIGIDO: a classe certa é .vs-btn-sn)
                ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(q => {
                    if(dados[q]) {
                        document.getElementById('vs-' + q).value = dados[q];
                        let inputHidden = document.getElementById('vs-' + q);
                        let container = inputHidden.parentElement;
                        let botoes = container.querySelectorAll('.vs-btn-sn'); // Correção aqui
                        botoes.forEach(btn => {
                            if(btn.innerText.trim() === dados[q].trim()) {
                                btn.classList.add('selecionado');
                            }
                        });
                    }
                });
            }
        });
    }
}

// Frases de incentivo para cada dia
const frasesIncentivo = {
    'Dom': 'Bom trabalho!',
    'Seg': 'Continue assim!',
    'Ter': 'Ótimo trabalho!',
    'Qua': 'Você arrasa!',
    'Qui': 'Excelente!',
    'Sex': 'Quase lá!',
    'Sáb': 'Missão cumprida!'
};

// Array para guardar os dias selecionados
let diasMarcadosVS = [];

function marcarDiaRastreador(elemento, dia) {
    // Alterna a classe visual
    elemento.classList.toggle('marcado');

    // Adiciona ou remove o checkmark (✓)
    let circulo = elemento.querySelector('.circulo-dia');
    if (elemento.classList.contains('marcado')) {
        circulo.innerHTML = '✓';
        // Mostra a frase de incentivo
        document.getElementById('frase-incentivo-texto').innerText = frasesIncentivo[dia];

        // Adiciona ao array se não existir
        if (!diasMarcadosVS.includes(dia)) {
            diasMarcadosVS.push(dia);
        }
    } else {
        circulo.innerHTML = '';
        // Limpa a frase se desmarcar
        document.getElementById('frase-incentivo-texto').innerText = '';

        // Remove do array
        diasMarcadosVS = diasMarcadosVS.filter(d => d !== dia);
    }

    // Atualiza o input hidden para salvar no Firebase
    document.getElementById('vs-dias-marcados').value = JSON.stringify(diasMarcadosVS);
}

function toggleDia(elemento, dia) {
    // Alterna a classe visual (pinta de verde e coloca o check)
    elemento.classList.toggle('marcado');

    // Pega a lista de dias salvos no input escondido
    let inputDias = document.getElementById('vs-dias-marcados');
    let diasMarcados = JSON.parse(inputDias.value || '[]');

    if (elemento.classList.contains('marcado')) {
        // Se marcou, adiciona na lista
        if (!diasMarcados.includes(dia)) diasMarcados.push(dia);
    } else {
        // Se desmarcou, remove da lista
        diasMarcados = diasMarcados.filter(d => d !== dia);
    }

    // Salva a lista atualizada no input
    inputDias.value = JSON.stringify(diasMarcados);
}

let mesAtualVP = 1;

function abrirVerificadorProgresso(mes) {
    window.scrollTo(0, 0);
    mesAtualVP = mes;
    document.getElementById('tela-dashboard').classList.add('escondido');
    document.getElementById('tela-verificador-progresso').classList.remove('escondido');
    document.getElementById('titulo-mes-atual').innerText = 'Mês ' + mes;

    carregarVerificadorProgresso(mes);
}

function voltarDashboardVP() {
    window.scrollTo(0, 0);
    document.getElementById('tela-verificador-progresso').classList.add('escondido');
    document.getElementById('tela-dashboard').classList.remove('escondido');
}

function salvarVerificadorProgresso() {
    const user = auth.currentUser;
    if (user) {
        let dadosVP = {};
        for(let i=1; i<=5; i++) {
            dadosVP['q'+i] = document.getElementById('vp-q'+i).value;
        }

        db.collection('alunos').doc(user.uid).collection('verificadores_progresso').doc('mes_' + mesAtualVP).set(dadosVP)
        .then(() => {
            const msg = document.getElementById('msg-sucesso-vp');
            msg.classList.remove('escondido');
            setTimeout(() => msg.classList.add('escondido'), 3000);
        })
        .catch(error => alert("Erro ao salvar: " + error));
    }
}

function carregarVerificadorProgresso(mes) {
    const user = auth.currentUser;
    if (user) {
        // Limpa a tela primeiro
        for(let i=1; i<=5; i++) {
            document.getElementById('vp-q'+i).value = '';
        }

        // Busca os dados
        db.collection('alunos').doc(user.uid).collection('verificadores_progresso').doc('mes_' + mes).get()
        .then(doc => {
            if (doc.exists) {
                const dados = doc.data();
                for(let i=1; i<=5; i++) {
                    if(dados['q'+i]) {
                        document.getElementById('vp-q'+i).value = dados['q'+i];
                    }
                }
            }
        });
    }
}
    // Adiciona novos campos à lista de vocabulario nos dias
    window.adicionarNovoCampo = function(dia) {
    // 1. Encontra o container principal do dia (ex: container-palavras-dia1)
    const container = document.getElementById(`container-palavras-${dia}`);

    // 2. Encontra a grade onde os inputs ficam dentro desse dia
    const grid = container.querySelector('.grid-vocabulario');

    // 3. Conta quantos campos de vocabulário já existem para saber o próximo número
    // Ele procura todos os inputs que o ID começa com "voc-"
    const quantidadeAtual = grid.querySelectorAll('input[id^="voc-"]').length;
    const proximoNumero = quantidadeAtual + 1;

    // 4. Cria o novo campo de Palavra/Expressão
    const inputVoc = document.createElement('input');
    inputVoc.type = 'text';
    inputVoc.id = `voc-${proximoNumero}`;
    inputVoc.className = 'input-cinza';

    // 5. Cria o novo campo de Exemplo
    const inputExe = document.createElement('input');
    inputExe.type = 'text';
    inputExe.id = `exe-${proximoNumero}`;
    inputExe.className = 'input-cinza';

    // 6. Adiciona os dois novos campos no final da grade
    grid.appendChild(inputVoc);
    grid.appendChild(inputExe);
};

// Função auxiliar para deletar as subcoleções do Firebase
async function deletarColecao(nomeColecao) {
    const user = auth.currentUser;
    if (!user) return;
    const snapshot = await db.collection('alunos').doc(user.uid).collection(nomeColecao).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}

// Função principal para zerar o progresso
window.resetarProgresso = async function() {
    const user = auth.currentUser;
    if (!user) return;

    const confirmacao = confirm("Tem certeza que deseja ZERAR todo o seu progresso? Esta ação não pode ser desfeita.");
    if (!confirmacao) return;

    try {
        await deletarColecao('dias');
        await deletarColecao('verificadores');
        await deletarColecao('verificadores_progresso');

        // Reseta o status de onboarding para ver as telas de boas-vindas novamente
        await db.collection('alunos').doc(user.uid).update({
            onboardingConcluido: false
        });

        alert("Progresso resetado com sucesso! A página será recarregada.");
        window.location.reload(); 

    } catch (error) {
        console.error("Erro ao resetar progresso: ", error);
        alert("Ocorreu um erro ao tentar resetar o progresso.");
    }
};

// Função para mostrar o grid de progresso geral do usuário
function voltarDashboardEstatisticas() {
    window.scrollTo(0, 0);
    document.getElementById('tela-estatisticas').classList.add('escondido');
    document.getElementById('tela-dashboard').classList.remove('escondido');
}

// Variáveis globais para os gráficos (para podermos destruí-los antes de recriar)
let chartPalavras = null;
let chartHabilidades = null;

async function abrirEstatisticas() {
    window.scrollTo(0, 0);
    document.getElementById('tela-dashboard').classList.add('escondido');
    document.getElementById('tela-estatisticas').classList.remove('escondido');

    const user = auth.currentUser;
    if (!user) return;

    try {
        const snapshot = await db.collection('alunos')
            .doc(user.uid)
            .collection('dias')
            .get();

        const NUM_SEMANAS = 21;     // agora seu plano tem 21 semanas
        const DIAS_POR_SEMANA = 7;

        let diasEstudados = 0;
        let palavrasUnicas = new Set();
        let contagemEmpenho = {};
        let totalEmpenho = 0;

        // Médias gerais das habilidades
        let somaHabilidades = { oralidade: 0, escuta: 0, escrita: 0, leitura: 0 };
        let contHabilidades = { oralidade: 0, escuta: 0, escrita: 0, leitura: 0 };

        // Dados por semana
        let palavrasPorSemana = Array(NUM_SEMANAS).fill(0);
        let habPorSemana = {
            oralidade: Array(NUM_SEMANAS).fill(0),
            escuta:    Array(NUM_SEMANAS).fill(0),
            escrita:   Array(NUM_SEMANAS).fill(0),
            leitura:   Array(NUM_SEMANAS).fill(0),
            contagem:  Array(NUM_SEMANAS).fill(0)
        };

        snapshot.forEach(doc => {
            const dados = doc.data();
            const idDoc = doc.id;            // "dia_1", "dia_92", etc.
            const numeroDia = parseInt(idDoc.replace('dia_', ''), 10);

            // ignora qualquer coisa fora do plano de 147 dias, por segurança
            if (isNaN(numeroDia) || numeroDia < 1 || numeroDia > NUM_SEMANAS * DIAS_POR_SEMANA) {
                return;
            }

            const indiceSemana = Math.ceil(numeroDia / DIAS_POR_SEMANA) - 1; // 0..20

            // conta dias estudados
            if (dados.data && dados.data.trim() !== '') {
                diasEstudados++;
            }

            // PALAVRAS
            let palavrasNesteDia = 0;
            for (let i = 1; i <= 50; i++) {
                const campo = dados['voc' + i];
                if (campo && campo.trim() !== '') {
                    const palavraLimpa = campo.trim().toLowerCase();
                    if (!palavrasUnicas.has(palavraLimpa)) {
                        palavrasUnicas.add(palavraLimpa);
                        palavrasNesteDia++;
                    }
                }
            }
            palavrasPorSemana[indiceSemana] += palavrasNesteDia;

            // EMPENHO
            if (dados.empenho) {
                contagemEmpenho[dados.empenho] = (contagemEmpenho[dados.empenho] || 0) + 1;
                totalEmpenho++;
            }

            // HABILIDADES
            const habs = ['oralidade', 'escuta', 'escrita', 'leitura'];
            let praticouHabilidadeHoje = false;

            habs.forEach(h => {
                if (dados[h]) {
                    let valor = parseInt(dados[h], 10);
                    if (!isNaN(valor)) {
                        somaHabilidades[h] += valor;
                        contHabilidades[h]++;
                        habPorSemana[h][indiceSemana] += valor;
                        praticouHabilidadeHoje = true;
                    }
                }
            });

            if (praticouHabilidadeHoje) {
                habPorSemana.contagem[indiceSemana]++;
            }
        });

        // Atualiza os números grandes
        document.getElementById('stat-dias').innerText = diasEstudados;
        document.getElementById('stat-palavras').innerText = palavrasUnicas.size;

        // Barras de empenho
        const containerEmpenho = document.getElementById('stat-empenho-container');
        containerEmpenho.innerHTML = '';
        if (totalEmpenho > 0) {
            for (const [nivel, quantidade] of Object.entries(contagemEmpenho)) {
                let pct = Math.round((quantidade / totalEmpenho) * 100);
                containerEmpenho.innerHTML += `
                    <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${nivel}</div>
                    <div class="barra-empenho-bg">
                        <div class="barra-empenho-fill" style="width: ${pct}%;">${pct}%</div>
                    </div>
                `;
            }
        }

        // Barras de habilidades (média geral)
        const containerHabs = document.getElementById('stat-habilidades-container');
        containerHabs.innerHTML = '';
        const nomesHabs = {
            oralidade: 'Oralidade',
            escuta:    'Escuta',
            escrita:   'Escrita',
            leitura:   'Leitura'
        };
        const coresHabs = {
            oralidade: '#FF6B6B',
            escuta:    '#4ECDC4',
            escrita:   '#45B7D1',
            leitura:   '#96CEB4'
        };

        for (let h in somaHabilidades) {
            let media = contHabilidades[h] > 0
                ? Math.round(somaHabilidades[h] / contHabilidades[h])
                : 0;
            containerHabs.innerHTML += `
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${nomesHabs[h]}</div>
                <div class="barra-empenho-bg">
                    <div class="barra-empenho-fill"
                         style="width: ${media}%; background-color: ${coresHabs[h]};">
                        ${media}%
                    </div>
                </div>
            `;
        }

        // -------- GRÁFICOS --------
        const labelsSemanas = Array.from({ length: NUM_SEMANAS }, (_, i) => `Sem ${i + 1}`);

        // Gráfico de Palavras
        if (chartPalavras) chartPalavras.destroy();
        chartPalavras = new Chart(document.getElementById('graficoPalavras'), {
            type: 'line',
            data: {
                labels: labelsSemanas,
                datasets: [{
                    label: 'Novas Palavras',
                    data: palavrasPorSemana,
                    borderColor: '#822483',
                    backgroundColor: 'rgba(130, 36, 131, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            }
        });

        // Médias semanais por habilidade
        let mediaHabSemanal = { oralidade: [], escuta: [], escrita: [], leitura: [] };
        for (let i = 0; i < NUM_SEMANAS; i++) {
            let div = habPorSemana.contagem[i] > 0 ? habPorSemana.contagem[i] : 1;
            mediaHabSemanal.oralidade.push(habPorSemana.oralidade[i] / div);
            mediaHabSemanal.escuta.push(habPorSemana.escuta[i] / div);
            mediaHabSemanal.escrita.push(habPorSemana.escrita[i] / div);
            mediaHabSemanal.leitura.push(habPorSemana.leitura[i] / div);
        }

        // Gráfico de Habilidades
        if (chartHabilidades) chartHabilidades.destroy();
        chartHabilidades = new Chart(document.getElementById('graficoHabilidades'), {
            type: 'bar',
            data: {
                labels: labelsSemanas,
                datasets: [
                    { label: 'Oralidade', data: mediaHabSemanal.oralidade, backgroundColor: '#FF6B6B' },
                    { label: 'Escuta',    data: mediaHabSemanal.escuta,    backgroundColor: '#4ECDC4' },
                    { label: 'Escrita',   data: mediaHabSemanal.escrita,   backgroundColor: '#45B7D1' },
                    { label: 'Leitura',   data: mediaHabSemanal.leitura,   backgroundColor: '#96CEB4' }
                ]
            },
            options: { scales: { y: { beginAtZero: true, max: 100 } } }
        });

    } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
    }
}

// Função para criar um relatorio em pdf
async function baixarRelatorioPDF() {
    const user = auth.currentUser;
    if (!user) {
        alert("Você precisa estar logado para baixar o relatório.");
        return;
    }

    const btnBaixar = document.getElementById('btn-baixar-pdf');
    const textoOriginal = btnBaixar.innerText;
    btnBaixar.innerText = "Gerando PDF... Aguarde";
    btnBaixar.disabled = true;

    const telaEstatisticas = document.getElementById('tela-estatisticas');
    const botoes = telaEstatisticas.querySelectorAll('button');

    let divPalavras = null;

    // Salvar os estilos originais para restaurar depois
    let originalOverflowBody = document.body.style.overflow;
    let originalOverflowTela = telaEstatisticas.style.overflow;
    let originalHeightTela = telaEstatisticas.style.height;
    let originalMaxHeightTela = telaEstatisticas.style.maxHeight;
    let originalWidthTela = telaEstatisticas.style.width;
    let originalPositionTela = telaEstatisticas.style.position;
    let originalLeftTela = telaEstatisticas.style.left;
    let originalTransformTela = telaEstatisticas.style.transform;
    let originalTransformOriginTela = telaEstatisticas.style.transformOrigin;
    let originalMarginTela = telaEstatisticas.style.margin; // Salvar a margem original da telaEstatisticas

    // Armazenar o display original de cada botão
    const originalDisplays = new Map();
    botoes.forEach(b => {
        originalDisplays.set(b, b.style.display); // Salva o display inline atual
    });

    try {
        // Esconder os botões antes da captura
        botoes.forEach(b => b.style.display = 'none');

        // Garante que todo o conteúdo do body e da tela de estatísticas seja visível
        document.body.style.overflow = 'visible';
        telaEstatisticas.style.overflow = 'visible';
        telaEstatisticas.style.height = 'auto';
        telaEstatisticas.style.maxHeight = 'none';

        // --- AJUSTES PARA A GERAÇÃO DO PDF ---
        // Define uma largura mais razoável para o elemento principal para o PDF
        telaEstatisticas.style.width = '800px'; // Reduzindo a largura para 800px para o PDF
        telaEstatisticas.style.margin = '0 auto'; // Centraliza o elemento para a captura do PDF
        telaEstatisticas.style.position = 'static'; // Remove posicionamento absoluto/fixo
        telaEstatisticas.style.left = 'auto';
        telaEstatisticas.style.transform = 'none'; // REMOVE QUALQUER ESCALA OU TRANSFORMAÇÃO
        telaEstatisticas.style.transformOrigin = 'initial';

        // 2. Buscar palavras no Firebase
        const snapshot = await db.collection('alunos').doc(user.uid).collection('dias').get();

        let htmlPalavras = '<h2 style="color: #822483; margin-top: 40px; border-bottom: 2px solid #38A3D1; padding-bottom: 10px; text-align: left;">Meu Vocabulário Aprendido</h2>';
        htmlPalavras += '<ul style="text-align: left; font-size: 14px; line-height: 1.8; list-style-type: none; padding-left: 0;">';

        let temPalavras = false;
        snapshot.forEach(doc => {
            const dados = doc.data();
            for(let i=1; i<=50; i++) {
                if (dados['voc'+i] && dados['voc'+i].trim() !== '') {
                    temPalavras = true;
                    let palavra = dados['voc'+i].trim();
                    let exemplo = dados['exe'+i] ? dados['exe'+i].trim() : 'Sem exemplo registrado';
                    htmlPalavras += `<li style="margin-bottom: 10px; background-color: #f4f4f4; padding: 10px; border-radius: 8px;">
                        <strong style="color: #38A3D1; font-size: 16px;">${palavra}</strong><br>
                        <span style="color: #555;">Exemplo: <em>${exemplo}</em></span>
                    </li>`;
                }
            }
        });

        if (!temPalavras) htmlPalavras += '<li>Nenhuma palavra registrada ainda.</li>';
        htmlPalavras += '</ul>';

        // 3. Adicionar a lista DIRETAMENTE na tela visível
        divPalavras = document.createElement('div');
        divPalavras.innerHTML = htmlPalavras;
        telaEstatisticas.appendChild(divPalavras);

        // Força o navegador a recalcular o layout e a altura real de telaEstatisticas
        void telaEstatisticas.offsetHeight;

        // 4. Gerar o PDF da tela real
        const opcoes = {
            // A margem aqui é para o html2pdf.js, mas as margens do jsPDF são mais específicas
            // margin: 30, // Esta linha pode ser removida se você usar as margens do jsPDF abaixo

            filename:     'Meu_Progresso_Ingles.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  {
                scale: 2, // Mantém a escala de 2 para boa qualidade da imagem
                useCORS: true,
                scrollY: 0,
            },
            jsPDF: {
                unit: 'mm',
                format: [350,475], // Formato personalizado
                orientation: 'landscape', // Orientação paisagem
                margin: { // Margens específicas para o jsPDF
                    top: 40,
                    right: 0,
                    bottom: 20,
                    left: 85
                }
            }
        };

        await html2pdf().set(opcoes).from(telaEstatisticas).save();

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
        // 5. Limpar a tela (remover a lista de palavras)
        if (divPalavras && divPalavras.parentNode) {
            divPalavras.parentNode.removeChild(divPalavras);
        }

        // Restaura a visibilidade original de todos os botões
        botoes.forEach(b => {
            b.style.display = originalDisplays.get(b); // Restaura o display original salvo
        });

        btnBaixar.innerText = textoOriginal;
        btnBaixar.disabled = false;

        // Restaura os estilos originais da telaEstatisticas
        document.body.style.overflow = originalOverflowBody;
        telaEstatisticas.style.overflow = originalOverflowTela;
        telaEstatisticas.style.height = originalHeightTela;
        telaEstatisticas.style.maxHeight = originalMaxHeightTela;
        telaEstatisticas.style.width = originalWidthTela; // RESTAURADO
        telaEstatisticas.style.position = originalPositionTela;
        telaEstatisticas.style.left = originalLeftTela;
        telaEstatisticas.style.transform = originalTransformTela;
        telaEstatisticas.style.transformOrigin = originalTransformOriginTela;
        telaEstatisticas.style.margin = originalMarginTela; // RESTAURADO
    }
}
