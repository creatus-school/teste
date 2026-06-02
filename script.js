// Suas configurações do Firebase aqui
const firebaseConfig = {
    apiKey: "AIzaSyCDRupoBxBFTovsPdasQPeOBbs3f8Uq1O0",
    authDomain: "plano-de-ingles-teste.firebaseapp.com",
    projectId: "plano-de-ingles-teste",
    storageBucket: "plano-de-ingles-teste.firebasestorage.app",
    messagingSenderId: "868459740241",
    appId: "1:868459740241:web:40be7c54dee9ee39abcc70"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Variáveis globais para controle de estado
let currentDay = 1;
let currentWeek = 1;
let currentMonth = 1;
let totalDays = 91; // Total de dias do plano
let totalWeeks = Math.ceil(totalDays / 7); // Total de semanas
let totalMonths = Math.ceil(totalDays / 30); // Total de meses (aproximado)

// --- FUNÇÕES DE AUTENTICAÇÃO E INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    showLoadingSpinner();
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário logado
            checkOnboardingStatus(user.uid);
        } else {
            // Usuário não logado
            hideLoadingSpinner();
            showScreen('tela-login');
        }
    });
});

async function fazerLogin() {
    showLoadingSpinner();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        await auth.signInWithEmailAndPassword(email, senha);
        // Login bem-sucedido, o onAuthStateChanged cuidará do resto
    } catch (error) {
        console.error("Erro no login:", error);
        alert("Erro ao fazer login: " + error.message);
        hideLoadingSpinner();
    }
}

function logout() {
    auth.signOut().then(() => {
        // Redireciona para a tela de login
        showScreen('tela-login');
        // Limpa o estado local
        localStorage.removeItem('onboardingCompleto');
        localStorage.removeItem('onboardingStep');
        localStorage.removeItem('currentDay');
        localStorage.removeItem('currentWeek');
        localStorage.removeItem('currentMonth');
        document.getElementById('logo-topo-site').classList.add('escondido');
        document.getElementById('logo-rodape-site').classList.add('escondido');
    }).catch(error => {
        console.error("Erro ao fazer logout:", error);
        alert("Erro ao fazer logout: " + error.message);
    });
}

// --- FUNÇÕES DE NAVEGAÇÃO DE TELAS ---
function showScreen(screenId) {
    document.querySelectorAll('.tela-onboarding, #tela-dashboard, #tela-dia, #tela-verificador-semanal, #tela-verificador-progresso, #tela-estatisticas').forEach(screen => {
        screen.classList.add('escondido');
    });
    document.getElementById(screenId).classList.remove('escondido');

    // Mostra/esconde o logo do topo e rodapé dependendo da tela
    if (screenId === 'tela-login' || screenId.startsWith('tela-ob-')) {
        document.getElementById('logo-topo-site').classList.add('escondido');
        document.getElementById('logo-rodape-site').classList.add('escondido');
    } else {
        document.getElementById('logo-topo-site').classList.remove('escondido');
        document.getElementById('logo-rodape-site').classList.remove('escondido');
    }
    hideLoadingSpinner();
}

function showLoadingSpinner() {
    document.getElementById('loading-spinner').classList.remove('escondido');
}

function hideLoadingSpinner() {
    document.getElementById('loading-spinner').classList.add('escondido');
}

// --- FUNÇÕES DE ONBOARDING ---
async function checkOnboardingStatus(uid) {
    const userDoc = await db.collection('alunos').doc(uid).get();
    if (userDoc.exists && userDoc.data().onboardingCompleto) {
        localStorage.setItem('onboardingCompleto', 'true');
        loadDashboard();
    } else {
        localStorage.removeItem('onboardingCompleto');
        // Se não completou, verifica em qual passo parou ou começa do 1
        let onboardingStep = parseInt(localStorage.getItem('onboardingStep') || '1');
        showScreen('tela-ob-' + onboardingStep);
    }
}

async function avancarOnboarding(currentStep, nextStep) {
    // Validações para cada passo
    if (currentStep === 2) { // Contrato
        const nome = document.getElementById('ob-nome-contrato').value.trim();
        const assinatura = document.getElementById('ob-assinatura').value.trim();
        if (!nome || !assinatura) {
            alert("Por favor, preencha seu nome e assine o contrato para continuar.");
            return;
        }
        // Salva nome e assinatura no Firebase
        const user = auth.currentUser;
        if (user) {
            await db.collection('alunos').doc(user.uid).set({
                nome: nome,
                assinatura: assinatura
            }, { merge: true });
        }
    } else if (currentStep === 5) { // Rotina Semanal
        const rotinaItems = document.querySelectorAll('#lista-rotina .rotina-item');
        const rotinaData = [];
        rotinaItems.forEach(item => {
            const atividade = item.querySelector('.input-linha').value.trim();
            const tempo = item.querySelector('input[type="number"]').value.trim();
            if (atividade && tempo) {
                rotinaData.push({ atividade, tempo: parseInt(tempo) });
            }
        });
        if (rotinaData.length === 0) {
            alert("Por favor, adicione pelo menos uma atividade à sua rotina.");
            return;
        }
        const user = auth.currentUser;
        if (user) {
            await db.collection('alunos').doc(user.uid).set({
                rotinaSemanal: rotinaData
            }, { merge: true });
        }
    } else if (currentStep === 6) { // Prioridades
        const prioridadesSelecionadas = [];
        document.querySelectorAll('.lista-atividades input[type="checkbox"]:checked').forEach(checkbox => {
            prioridadesSelecionadas.push(checkbox.id.replace('prioridade-', ''));
        });
        if (prioridadesSelecionadas.length === 0) {
            alert("Por favor, selecione pelo menos uma prioridade.");
            return;
        }
        const user = auth.currentUser;
        if (user) {
            await db.collection('alunos').doc(user.uid).set({
                prioridades: prioridadesSelecionadas
            }, { merge: true });
        }
    } else if (currentStep === 7) { // Pontos Fortes e Fracos
        const pontosFortes = document.getElementById('ob-pontos-fortes').value.trim();
        const pontosFracos = document.getElementById('ob-pontos-fracos').value.trim();
        if (!pontosFortes || !pontosFracos) {
            alert("Por favor, preencha seus pontos fortes e fracos.");
            return;
        }
        const user = auth.currentUser;
        if (user) {
            await db.collection('alunos').doc(user.uid).set({
                pontosFortes: pontosFortes,
                pontosFracos: pontosFracos
            }, { merge: true });
        }
    } else if (currentStep === 8) { // Objetivos e Metas
        const nivelMeta = document.getElementById('ob-nivel-meta').value;
        const tempoMeta = document.getElementById('ob-tempo-meta').value.trim();
        const tipoTempo = document.getElementById('ob-tipo-tempo').value;
        const objetivo = document.getElementById('ob-objetivo').value.trim();
        const tempoDiario = document.getElementById('ob-tempo-diario').value.trim();
        const metaDias = document.getElementById('meta-dias').value.trim();

        if (!nivelMeta || !tempoMeta || !tipoTempo || !objetivo || !tempoDiario || !metaDias) {
            alert("Por favor, preencha todos os campos de objetivos e metas.");
            return;
        }
        const user = auth.currentUser;
        if (user) {
            await db.collection('alunos').doc(user.uid).set({
                objetivosMetas: {
                    nivelMeta,
                    tempoMeta: parseInt(tempoMeta),
                    tipoTempo,
                    objetivo,
                    tempoDiario: parseInt(tempoDiario),
                    metaDias: parseInt(metaDias)
                }
            }, { merge: true });
        }
    }

    localStorage.setItem('onboardingStep', nextStep);
    showScreen('tela-ob-' + nextStep);

    // Se for o último passo do onboarding (ir para o dashboard)
    if (nextStep === 10) {
        const user = auth.currentUser;
        if (user) {
            await db.collection('alunos').doc(user.uid).set({
                onboardingCompleto: true
            }, { merge: true });
            localStorage.setItem('onboardingCompleto', 'true');
            loadDashboard();
        }
    }
}

function abrirOnboarding(step) {
    showScreen('tela-ob-' + step);
}

function adicionarLinhaRotina() {
    const listaRotina = document.getElementById('lista-rotina');
    const div = document.createElement('div');
    div.classList.add('rotina-item');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';
    div.innerHTML = `
        <input type="text" class="input-linha" placeholder="Atividade" style="flex: 2;">
        <input type="number" class="input-linha" placeholder="Tempo (min)" style="flex: 1;">
        <button onclick="this.parentNode.remove()" style="background-color: #dc3545; padding: 5px 10px; border-radius: 5px; margin-top: 0; font-size: 0.8rem;">X</button>
    `;
    listaRotina.appendChild(div);
}

// --- FUNÇÕES DO DASHBOARD ---
async function loadDashboard() {
    showLoadingSpinner();
    showScreen('tela-dashboard');
    const user = auth.currentUser;
    if (!user) return;

    const gridDias = document.getElementById('grid-dias');
    gridDias.innerHTML = ''; // Limpa o grid antes de carregar

    const userDoc = await db.collection('alunos').doc(user.uid).get();
    const userData = userDoc.data();
    const diasConcluidos = userData && userData.diasConcluidos ? userData.diasConcluidos : {};

    for (let i = 0; i < totalWeeks; i++) {
        const semanaNum = i + 1;
        const semanaContainer = document.createElement('div');
        semanaContainer.classList.add('semana-container');
        semanaContainer.innerHTML = `<h3 class="titulo-semana">Semana ${semanaNum}</h3><div class="dias-grid"></div>`;
        const diasGrid = semanaContainer.querySelector('.dias-grid');

        for (let j = 1; j <= 7; j++) {
            const diaNum = (i * 7) + j;
            if (diaNum > totalDays) break; // Não cria dias além do total

            const diaBtn = document.createElement('button');
            diaBtn.classList.add('dia-btn');
            diaBtn.innerText = diaNum;
            diaBtn.onclick = () => abrirDia(diaNum);

            if (diasConcluidos['dia_' + diaNum]) {
                diaBtn.classList.add('concluido');
            }
            diasGrid.appendChild(diaBtn);
        }
        gridDias.appendChild(semanaContainer);
    }
    hideLoadingSpinner();
}

async function zerarProgresso() {
    if (!confirm("Tem certeza que deseja zerar todo o seu progresso? Esta ação é irreversível.")) {
        return;
    }

    showLoadingSpinner();
    const user = auth.currentUser;
    if (!user) {
        alert("Usuário não logado.");
        hideLoadingSpinner();
        return;
    }

    try {
        // Excluir todos os documentos da subcoleção 'dias'
        const diasRef = db.collection('alunos').doc(user.uid).collection('dias');
        const snapshot = await diasRef.get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Resetar o campo 'diasConcluidos' no documento do aluno
        await db.collection('alunos').doc(user.uid).update({
            diasConcluidos: {},
            onboardingCompleto: false // Força o onboarding novamente
        });

        // Limpar o localStorage
        localStorage.clear();

        alert("Seu progresso foi zerado com sucesso. Você será redirecionado para o início.");
        // Redirecionar para a tela de login ou onboarding
        auth.signOut(); // Força o logout para reiniciar o fluxo
    } catch (error) {
        console.error("Erro ao zerar progresso:", error);
        alert("Ocorreu um erro ao zerar o progresso: " + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

// --- FUNÇÕES DA TELA DO DIA ---
async function abrirDia(diaNum) {
    showLoadingSpinner();
    currentDay = diaNum;
    document.getElementById('dia-semana').value = diaNum;
    showScreen('tela-dia');

    const user = auth.currentUser;
    if (!user) return;

    // Carregar dados do dia se existirem
    const diaDoc = await db.collection('alunos').doc(user.uid).collection('dias').doc('dia_' + diaNum).get();
    if (diaDoc.exists) {
        const dados = diaDoc.data();
        document.getElementById('data-dia').value = dados.data || '';
        document.getElementById('tarefa-dia').value = dados.tarefa || '';

        // Carregar vocabulário
        const gridVocabulario = document.getElementById('grid-vocabulario');
        gridVocabulario.innerHTML = ''; // Limpa antes de preencher
        let temVocabulario = false;
        for (let i = 1; i <= 50; i++) { // Supondo um máximo de 50 pares de vocabulário
            if (dados['voc' + i] || dados['exe' + i]) {
                adicionarCampoVocabulario(dados['voc' + i], dados['exe' + i]);
                temVocabulario = true;
            }
        }
        if (!temVocabulario) { // Se não houver vocabulário, adiciona um campo vazio
            adicionarCampoVocabulario();
        }

        // Carregar empenho
        document.querySelectorAll('.btn-empenho').forEach(btn => {
            btn.classList.remove('selecionado');
            if (btn.dataset.empenho === dados.empenho) {
                btn.classList.add('selecionado');
            }
        });

        // Carregar habilidades
        ['oralidade', 'leitura', 'escuta', 'escrita'].forEach(habilidade => {
            document.querySelectorAll(`.btn-porcentagem[data-habilidade="${habilidade}"]`).forEach(btn => {
                btn.classList.remove('ativo');
                if (parseInt(btn.dataset.porcentagem) === dados[habilidade]) {
                    btn.classList.add('ativo');
                }
            });
        });
    } else {
        // Limpar campos se não houver dados para o dia
        document.getElementById('data-dia').value = '';
        document.getElementById('tarefa-dia').value = '';
        document.getElementById('grid-vocabulario').innerHTML = '';
        adicionarCampoVocabulario(); // Adiciona um campo vazio para começar
        document.querySelectorAll('.btn-empenho').forEach(btn => btn.classList.remove('selecionado'));
        document.querySelectorAll('.btn-porcentagem').forEach(btn => btn.classList.remove('ativo'));
    }
    hideLoadingSpinner();
}

function adicionarCampoVocabulario(palavra = '', exemplo = '') {
    const gridVocabulario = document.getElementById('grid-vocabulario');
    const inputPalavra = document.createElement('input');
    inputPalavra.type = 'text';
    inputPalavra.classList.add('input-cinza');
    inputPalavra.placeholder = 'Palavra/Expressão';
    inputPalavra.value = palavra;

    const inputExemplo = document.createElement('input');
    inputExemplo.type = 'text';
    inputExemplo.classList.add('input-cinza');
    inputExemplo.placeholder = 'Exemplo';
    inputExemplo.value = exemplo;

    gridVocabulario.appendChild(inputPalavra);
    gridVocabulario.appendChild(inputExemplo);
}

async function salvarProgressoDia() {
    showLoadingSpinner();
    const user = auth.currentUser;
    if (!user) {
        alert("Usuário não logado.");
        hideLoadingSpinner();
        return;
    }

    const data = document.getElementById('data-dia').value;
    const tarefa = document.getElementById('tarefa-dia').value;

    const vocabularioData = {};
    const palavras = document.querySelectorAll('#grid-vocabulario input[placeholder="Palavra/Expressão"]');
    const exemplos = document.querySelectorAll('#grid-vocabulario input[placeholder="Exemplo"]');

    for (let i = 0; i < palavras.length; i++) {
        if (palavras[i].value.trim() !== '') {
            vocabularioData['voc' + (i + 1)] = palavras[i].value.trim();
            vocabularioData['exe' + (i + 1)] = exemplos[i].value.trim();
        }
    }

    const empenhoSelecionado = document.querySelector('.btn-empenho.selecionado');
    const empenho = empenhoSelecionado ? empenhoSelecionado.dataset.empenho : '';

    const habilidades = {};
    ['oralidade', 'leitura', 'escuta', 'escrita'].forEach(habilidade => {
        const btnAtivo = document.querySelector(`.btn-porcentagem[data-habilidade="${habilidade}"].ativo`);
        habilidades[habilidade] = btnAtivo ? parseInt(btnAtivo.dataset.porcentagem) : 0;
    });

    try {
        await db.collection('alunos').doc(user.uid).collection('dias').doc('dia_' + currentDay).set({
            data,
            tarefa,
            ...vocabularioData,
            empenho,
            ...habilidades
        }, { merge: true });

        // Marcar o dia como concluído no documento principal do aluno
        await db.collection('alunos').doc(user.uid).set({
            diasConcluidos: {
                ['dia_' + currentDay]: true
            }
        }, { merge: true });

        document.getElementById('mensagem-sucesso').classList.remove('escondido');
        setTimeout(() => {
            document.getElementById('mensagem-sucesso').classList.add('escondido');
        }, 3000); // Esconde a mensagem após 3 segundos

    } catch (error) {
        console.error("Erro ao salvar progresso do dia:", error);
        alert("Erro ao salvar progresso: " + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

function voltarDashboard() {
    loadDashboard(); // Recarrega o dashboard para atualizar os dias concluídos
}

// Event listeners para os botões de empenho
document.querySelectorAll('.btn-empenho').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.btn-empenho').forEach(btn => btn.classList.remove('selecionado'));
        this.classList.add('selecionado');
    });
});

// Event listeners para os botões de porcentagem de habilidades
document.querySelectorAll('.btn-porcentagem').forEach(button => {
    button.addEventListener('click', function() {
        const habilidade = this.dataset.habilidade;
        document.querySelectorAll(`.btn-porcentagem[data-habilidade="${habilidade}"]`).forEach(btn => btn.classList.remove('ativo'));
        this.classList.add('ativo');
    });
});

// --- FUNÇÕES DO VERIFICADOR SEMANAL ---
async function abrirVerificadorSemanal() {
    showLoadingSpinner();
    showScreen('tela-verificador-semanal');

    currentWeek = Math.ceil(currentDay / 7);
    document.getElementById('semana-atual-verificador').innerText = currentWeek;

    const user = auth.currentUser;
    if (!user) return;

    // Carregar empenho diário da semana
    const rastreadorEmpenho = document.getElementById('rastreador-empenho-semanal');
    rastreadorEmpenho.innerHTML = ''; // Limpa antes de preencher

    const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const emojisEmpenho = {
        'Demais': '🤩', 'Muito': '😁', 'Ok': '🙂', 'Pouco': '😕', 'Nada': '😞'
    };
    const frasesEmpenho = {
        'Demais': 'Você venceu', 'Muito': 'Ótimo trabalho', 'Ok': 'Bom trabalho',
        'Pouco': 'Quase lá', 'Nada': 'Não desista'
    };

    for (let i = 0; i < 7; i++) {
        const diaReal = ((currentWeek - 1) * 7) + i + 1;
        if (diaReal > totalDays) break;

        const diaDoc = await db.collection('alunos').doc(user.uid).collection('dias').doc('dia_' + diaReal).get();
        const empenhoDia = diaDoc.exists ? diaDoc.data().empenho : 'Nada'; // Padrão para 'Nada' se não houver registro

        const diaRastreador = document.createElement('div');
        diaRastreador.classList.add('dia-rastreador');
        diaRastreador.innerHTML = `
            <span class="nome-dia">${diasDaSemana[i]}</span>
            <span class="emoji-dia">${emojisEmpenho[empenhoDia]}</span>
            <span class="frase-dia">${frasesEmpenho[empenhoDia]}</span>
            <div class="checkbox-dia ${diaDoc.exists && diaDoc.data().empenho ? 'marcado' : ''}"></div>
        `;
        rastreadorEmpenho.appendChild(diaRastreador);
    }

    // Carregar respostas do verificador semanal
    const verificadorDoc = await db.collection('alunos').doc(user.uid).collection('verificadores').doc('semana_' + currentWeek).get();
    if (verificadorDoc.exists) {
        const dados = verificadorDoc.data();
        for (let i = 1; i <= 5; i++) {
            const resposta = dados['q' + i];
            if (resposta) {
                document.querySelectorAll(`.vs-btn-sn[data-pergunta="q${i}"][data-resposta="${resposta}"]`).forEach(btn => {
                    btn.classList.add('selecionado');
                });
                if (i === 4 && resposta === 'sim') { // Se "Me senti desanimado(a)?" for SIM
                    document.getElementById('vs-motivacional-q4').style.display = 'block';
                } else {
                    document.getElementById('vs-motivacional-q4').style.display = 'none';
                }
            }
        }
        document.getElementById('vs-q6').value = dados.q6 || '';
        document.getElementById('vs-q7').value = dados.q7 || '';
        document.getElementById('vs-q8').value = dados.q8 || '';
    } else {
        // Limpar campos se não houver dados
        document.querySelectorAll('.vs-btn-sn').forEach(btn => btn.classList.remove('selecionado'));
        document.getElementById('vs-motivacional-q4').style.display = 'none';
        document.getElementById('vs-q6').value = '';
        document.getElementById('vs-q7').value = '';
        document.getElementById('vs-q8').value = '';
    }
    hideLoadingSpinner();
}

// Event listeners para os botões SIM/NÃO do verificador semanal
document.querySelectorAll('.vs-btn-sn').forEach(button => {
    button.addEventListener('click', function() {
        const pergunta = this.dataset.pergunta;
        document.querySelectorAll(`.vs-btn-sn[data-pergunta="${pergunta}"]`).forEach(btn => btn.classList.remove('selecionado'));
        this.classList.add('selecionado');

        // Lógica para mostrar/esconder o texto motivacional da pergunta 4
        if (pergunta === 'q4') {
            if (this.dataset.resposta === 'sim') {
                document.getElementById('vs-motivacional-q4').style.display = 'block';
            } else {
                document.getElementById('vs-motivacional-q4').style.display = 'none';
            }
        }
    });
});

async function salvarVerificadorSemanal() {
    showLoadingSpinner();
    const user = auth.currentUser;
    if (!user) {
        alert("Usuário não logado.");
        hideLoadingSpinner();
        return;
    }

    const respostas = {};
    for (let i = 1; i <= 5; i++) {
        const btnSelecionado = document.querySelector(`.vs-btn-sn[data-pergunta="q${i}"].selecionado`);
        respostas['q' + i] = btnSelecionado ? btnSelecionado.dataset.resposta : '';
    }
    respostas.q6 = document.getElementById('vs-q6').value;
    respostas.q7 = document.getElementById('vs-q7').value;
    respostas.q8 = document.getElementById('vs-q8').value;

    try {
        await db.collection('alunos').doc(user.uid).collection('verificadores').doc('semana_' + currentWeek).set(respostas, { merge: true });
        document.getElementById('msg-sucesso-vs').classList.remove('escondido');
        setTimeout(() => {
            document.getElementById('msg-sucesso-vs').classList.add('escondido');
        }, 3000);
    } catch (error) {
        console.error("Erro ao salvar verificador semanal:", error);
        alert("Erro ao salvar verificador semanal: " + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

// --- FUNÇÕES DO VERIFICADOR DE PROGRESSO (MENSAL) ---
async function abrirVerificadorProgresso() {
    showLoadingSpinner();
    showScreen('tela-verificador-progresso');

    currentMonth = Math.ceil(currentDay / 30); // Calcula o mês baseado no dia atual
    document.getElementById('mes-atual-verificador').innerText = currentMonth;

    const user = auth.currentUser;
    if (!user) return;

    const verificadorDoc = await db.collection('alunos').doc(user.uid).collection('verificadores').doc('mes_' + currentMonth).get();
    if (verificadorDoc.exists) {
        const dados = verificadorDoc.data();
        for (let i = 1; i <= 9; i++) {
            document.getElementById('vp-q' + i).value = dados['q' + i] || '';
        }
    } else {
        for (let i = 1; i <= 9; i++) {
            document.getElementById('vp-q' + i).value = '';
        }
    }
    hideLoadingSpinner();
}

async function salvarVerificadorProgresso() {
    showLoadingSpinner();
    const user = auth.currentUser;
    if (!user) {
        alert("Usuário não logado.");
        hideLoadingSpinner();
        return;
    }

    const respostas = {};
    for (let i = 1; i <= 9; i++) {
        respostas['q' + i] = document.getElementById('vp-q' + i).value;
    }

    try {
        await db.collection('alunos').doc(user.uid).collection('verificadores').doc('mes_' + currentMonth).set(respostas, { merge: true });
        document.getElementById('msg-sucesso-vp').classList.remove('escondido');
        setTimeout(() => {
            document.getElementById('msg-sucesso-vp').classList.add('escondido');
        }, 3000);
    } catch (error) {
        console.error("Erro ao salvar verificador de progresso:", error);
        alert("Erro ao salvar verificador de progresso: " + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

// --- FUNÇÕES DAS SUBPÁGINAS DE TAREFAS (ONBOARDING) ---
function abrirSubpagina(categoria) {
    document.getElementById('tela-ob-tarefas').classList.add('escondido');
    document.getElementById('subpagina-' + categoria).classList.remove('escondido');
}

function voltarMenuTarefas() {
    document.querySelectorAll('[id^="subpagina-"]').forEach(subpagina => {
        subpagina.classList.add('escondido');
    });
    document.getElementById('tela-ob-tarefas').classList.remove('escondido');
}

// --- FUNÇÕES DE ESTATÍSTICAS ---
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
        const snapshot = await db.collection('alunos').doc(user.uid).collection('dias').get();

        let diasEstudados = 0;
        let palavrasUnicas = new Set();
        let contagemEmpenho = {};
        let totalEmpenho = 0;

        // Para as médias de habilidades gerais
        let somaHabilidades = { oralidade: 0, escuta: 0, escrita: 0, leitura: 0 };
        let contHabilidades = { oralidade: 0, escuta: 0, escrita: 0, leitura: 0 };

        // Para os gráficos semanais (13 semanas para 91 dias)
        let palavrasPorSemana = Array(13).fill(0);
        let habPorSemana = {
            oralidade: Array(13).fill(0), escuta: Array(13).fill(0),
            escrita: Array(13).fill(0), leitura: Array(13).fill(0),
            contagem: Array(13).fill(0)
        };

        snapshot.forEach(doc => {
            const dados = doc.data();
            const idDoc = doc.id; // Ex: "dia_1", "dia_15"
            const numeroDia = parseInt(idDoc.replace('dia_', ''));
            const indiceSemana = Math.ceil(numeroDia / 7) - 1; // 0 a 12

            if (dados.data && dados.data.trim() !== '') diasEstudados++;

            // Palavras
            let palavrasNesteDia = 0;
            for(let i=1; i<=50; i++) {
                if (dados['voc'+i] && dados['voc'+i].trim() !== '') {
                    let palavraLimpa = dados['voc'+i].trim().toLowerCase();
                    if (!palavrasUnicas.has(palavraLimpa)) {
                        palavrasUnicas.add(palavraLimpa);
                        palavrasNesteDia++;
                    }
                }
            }
            if (indiceSemana >= 0 && indiceSemana < 13) {
                palavrasPorSemana[indiceSemana] += palavrasNesteDia;
            }

            // Empenho
            if (dados.empenho) {
                contagemEmpenho[dados.empenho] = (contagemEmpenho[dados.empenho] || 0) + 1;
                totalEmpenho++;
            }

            // Habilidades
            const habs = ['oralidade', 'escuta', 'escrita', 'leitura'];
            let praticouHabilidadeHoje = false;

            habs.forEach(h => {
                if (dados[h]) {
                    let valor = parseInt(dados[h]);
                    somaHabilidades[h] += valor;
                    contHabilidades[h]++;

                    if (indiceSemana >= 0 && indiceSemana < 13) {
                        habPorSemana[h][indiceSemana] += valor;
                        praticouHabilidadeHoje = true;
                    }
                }
            });

            if (praticouHabilidadeHoje && indiceSemana >= 0 && indiceSemana < 13) {
                habPorSemana.contagem[indiceSemana]++;
            }
        });

        // Atualiza textos
        document.getElementById('stat-dias').innerText = diasEstudados;
        document.getElementById('stat-palavras').innerText = palavrasUnicas.size;

        // Renderiza Barras de Empenho
        const containerEmpenho = document.getElementById('stat-empenho-container');
        containerEmpenho.innerHTML = '';
        if (totalEmpenho > 0) {
            for (const [nivel, quantidade] of Object.entries(contagemEmpenho)) {
                let pct = Math.round((quantidade / totalEmpenho) * 100);
                containerEmpenho.innerHTML += `
                    <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${nivel}</div>
                    <div class="barra-empenho-bg"><div class="barra-empenho-fill" style="width: ${pct}%;">${pct}%</div></div>
                `;
            }
        }

        // Renderiza Barras de Habilidades (Média Geral)
        const containerHabs = document.getElementById('stat-habilidades-container');
        containerHabs.innerHTML = '';
        const nomesHabs = { oralidade: 'Oralidade', escuta: 'Escuta', escrita: 'Escrita', leitura: 'Leitura' };
        const coresHabs = { oralidade: '#FF6B6B', escuta: '#4ECDC4', escrita: '#45B7D1', leitura: '#96CEB4' };

        for (let h in somaHabilidades) {
            let media = contHabilidades[h] > 0 ? Math.round(somaHabilidades[h] / contHabilidades[h]) : 0;
            containerHabs.innerHTML += `
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${nomesHabs[h]}</div>
                <div class="barra-empenho-bg">
                    <div class="barra-empenho-fill" style="width: ${media}%; background-color: ${coresHabs[h]};">${media}%</div>
                </div>
            `;
        }

        // --- GRÁFICOS ---
        const labelsSemanas = Array.from({length: 13}, (_, i) => `Sem ${i+1}`);

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

        // Preparar dados de média semanal para o gráfico de habilidades
        let mediaHabSemanal = { oralidade: [], escuta: [], escrita: [], leitura: [] };
        for (let i = 0; i < 13; i++) {
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
                    { label: 'Escuta', data: mediaHabSemanal.escuta, backgroundColor: '#4ECDC4' },
                    { label: 'Escrita', data: mediaHabSemanal.escrita, backgroundColor: '#45B7D1' },
                    { label: 'Leitura', data: mediaHabSemanal.leitura, backgroundColor: '#96CEB4' }
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
