// public/js/app.js

// Verifica se já tem alguém logado assim que a página carrega. 
// Bate na rota de sessão sem usar cache pra não pegar dado velho.
// Se tiver logado, já pula a tela de login e vai direto pro painel certo.
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/session', { cache: 'no-store' });
        const data = await res.json();
        
        if (data.logado) {
            document.getElementById('login-view').classList.add('hidden');
            if (data.tipo === 'ALUNO') {
                document.getElementById('aluno-view').classList.remove('hidden');
                showTab('carteirinha');
            } else if (data.tipo === 'ADMIN') {
                document.getElementById('admin-view').classList.remove('hidden');
                showAdminTab('calendario');
            }
        }
    } catch (e) {
        console.log("Nenhuma sessão ativa encontrada ou erro de rede.");
    }
});

// Cria um modal na tela e retorna uma Promise. 
// Isso serve pra travar o fluxo do código com 'await' até eu clicar em OK ou Cancelar. 
// Bem melhor e mais bonito que usar os alerts nativos do navegador.
function openModal(title, message, iconClass, iconColorClass, showCancel = false, isPrompt = false) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-modal');
        const titleEl = document.getElementById('modal-title');
        const msgEl = document.getElementById('modal-message');
        const iconEl = document.getElementById('modal-icon');
        const inputEl = document.getElementById('modal-input');
        const btnCancel = document.getElementById('modal-btn-cancel');
        const btnConfirm = document.getElementById('modal-btn-confirm');

        titleEl.innerText = title;
        msgEl.innerText = message;
        iconEl.innerHTML = `<i class="${iconClass}"></i>`;
        iconEl.className = `modal-icon ${iconColorClass}`;

        if (showCancel) btnCancel.classList.remove('hidden');
        else btnCancel.classList.add('hidden');

        if (isPrompt) {
            inputEl.classList.remove('hidden');
            inputEl.value = '';
            inputEl.focus();
        } else {
            inputEl.classList.add('hidden');
        }

        overlay.classList.remove('hidden');

        btnConfirm.onclick = null;
        btnCancel.onclick = null;

        btnConfirm.onclick = () => {
            overlay.classList.add('hidden');
            if (isPrompt) resolve(inputEl.value);
            else resolve(true);
        };

        btnCancel.onclick = () => {
            overlay.classList.add('hidden');
            resolve(isPrompt ? null : false);
        };
    });
}

// Atalhos marotos pra chamar o modal rápido em qualquer parte do código
const customAlert = (msg, title = "Aviso") => openModal(title, msg, "fa-solid fa-circle-info", "info", false, false);
const customError = (msg, title = "Atenção") => openModal(title, msg, "fa-solid fa-circle-exclamation", "error", false, false);
const customConfirm = (msg, title = "Confirmação") => openModal(title, msg, "fa-solid fa-circle-question", "warning", true, false);
const customPrompt = (msg, title = "Entrada de Dados") => openModal(title, msg, "fa-solid fa-keyboard", "info", true, true);

// Máscara do CPF. Pega o valor, tira tudo que não é número usando regex e vai colocando ponto e traço.
document.getElementById('cpf').addEventListener('input', function(e) {
    let v = e.target.value.replace(/\D/g, ''); 
    if (v.length > 11) v = v.substring(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2'); 
    v = v.replace(/(\d{3})(\d)/, '$1.$2'); 
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2'); 
    e.target.value = v;
});

// A mesma máscara de cima, só que pro input de edição lá no painel do admin.
document.getElementById('edit-cpf')?.addEventListener('input', function(e) {
    let v = e.target.value.replace(/\D/g, ''); 
    if (v.length > 11) v = v.substring(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2'); 
    v = v.replace(/(\d{3})(\d)/, '$1.$2'); 
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2'); 
    e.target.value = v;
});

// Só esconde a tela de login e mostra a de recuperar senha (e vice-versa)
function toggleRecuperarSenha() {
    const loginForm = document.getElementById('login-form');
    const recForm = document.getElementById('recuperar-form');
    if (loginForm.classList.contains('hidden')) {
        loginForm.classList.remove('hidden'); recForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden'); recForm.classList.remove('hidden');
    }
}

// Bate na rota de logout pra matar a sessão no backend e limpa os forms da tela
async function fazerLogout() {
    if(await customConfirm("Deseja realmente sair do sistema?", "Encerrar Sessão")) {
        const res = await fetch('/api/logout', { method: 'POST' });
        if (res.ok) {
            document.getElementById('aluno-view').classList.add('hidden');
            document.getElementById('admin-view').classList.add('hidden');
            document.getElementById('login-view').classList.remove('hidden');
            document.getElementById('login-form').reset();
        }
    }
}

// Manda os dados pra resetar a senha
document.getElementById('recuperar-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const matricula = document.getElementById('rec-matricula').value;
    const novaSenha = document.getElementById('rec-senha').value;
    const res = await fetch('/api/alterar-senha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matricula, novaSenha }) });
    const data = await res.json();
    
    if (res.ok) { await customAlert(data.mensagem, "Sucesso!"); toggleRecuperarSenha(); document.getElementById('recuperar-form').reset(); }
    else await customError(data.erro);
});

// Faz o login. Importante: tem que limpar a máscara do CPF antes de mandar pro banco não dar erro.
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cpfComMascara = document.getElementById('cpf').value;
    const cpfLimpo = cpfComMascara.replace(/\D/g, ''); 
    const senha = document.getElementById('senha').value;
    
    const res = await fetch('/api/login', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ cpf: cpfLimpo, senha }) 
    });
    
    const data = await res.json();
    if (res.ok) {
        document.getElementById('login-view').classList.add('hidden');
        if (data.tipo === 'ALUNO') {
            document.getElementById('aluno-view').classList.remove('hidden');
            showTab('carteirinha');
        } else if (data.tipo === 'ADMIN') { 
            document.getElementById('admin-view').classList.remove('hidden'); 
            showAdminTab('calendario'); 
        }
    } else {
        await customError(data.erro, "Falha no Login");
    }
});

// Envia a confirmação de assento do aluno
document.getElementById('presenca-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tipo = document.querySelector('input[name="tipo"]:checked').value;
    const onibus_id = document.getElementById('presenca-onibus').value;
    
    const res = await fetch('/api/aluno/presenca', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo_presenca: tipo, onibus_id }) });
    const data = await res.json();
    
    if (res.ok) { showTab('presenca'); } 
    else { await customError(data.erro, "Ops!"); }
});

// Cancela o assento caso o aluno desista de ir
async function cancelarPresencaAPI() {
    if(await customConfirm('Tem certeza que não irá mais utilizar o transporte hoje?', 'Cancelar Assento')) {
        const res = await fetch('/api/aluno/presenca', { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) { await customAlert('Sua vaga foi liberada com sucesso.', 'Cancelado'); showTab('presenca'); } 
        else await customError(data.erro);
    }
}

let diasExcecao = [];

// Puxa do banco os feriados/dias parados pra gente usar no calendário depois
async function carregarExcecoesGlobais() {
    try {
        const res = await fetch('/api/calendario/excecoes', { cache: 'no-store' });
        if(res.ok) diasExcecao = await res.json();
    } catch(e) { console.error("Falha ao buscar exceções"); }
}

// O admin bloqueia as rotas de um dia específico
async function marcarFeriado() {
    const motivo = await customPrompt('Qual o motivo da suspensão da frota neste dia? (Ex: Feriado Nacional, Problema na via)', 'Suspender Operação');
    if (!motivo) return;
    const res = await fetch('/api/admin/calendario/excecao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_exata: diaAtivoISO, motivo: motivo })
    });
    if (res.ok) {
        await carregarExcecoesGlobais();
        renderizarCalendarioVisual();
        clicarDia(diaAtivoISO, diaAtivoSemana, document.querySelector('.dia-calendario.selected'));
    }
}

// O admin libera as rotas de novo
async function removerFeriado() {
    if(!await customConfirm('Deseja restaurar as rotas normais de ônibus para este dia?', 'Restaurar Operação')) return;
    const res = await fetch(`/api/admin/calendario/excecao/${diaAtivoISO}`, { method: 'DELETE' });
    if(res.ok) {
        await carregarExcecoesGlobais();
        renderizarCalendarioVisual();
        clicarDia(diaAtivoISO, diaAtivoSemana, document.querySelector('.dia-calendario.selected'));
    }
}

let dataRefAluno = new Date();
let diaAtivoSemanaAluno = null;

// Monta o visual do calendário do aluno. Calcula que dia cai o começo do mês pra colocar as divs vazias e alinhar os números.
async function renderizarCalendarioVisualAluno() {
    await carregarExcecoesGlobais();
    const grid = document.getElementById('aluno-calendario-dias');
    const displayMes = document.getElementById('aluno-calendario-mes-ano');
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const diasSemanaNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    
    const ano = dataRefAluno.getFullYear(); const mes = dataRefAluno.getMonth();
    displayMes.innerText = `${meses[mes]} ${ano}`; grid.innerHTML = '';
    
    const primeiroDiaMes = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    
    for(let i = 0; i < primeiroDiaMes; i++) grid.innerHTML += `<div></div>`; 
    
    for(let i = 1; i <= diasNoMes; i++) {
        const stringDia = `${ano}-${String(mes+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const nomeDia = diasSemanaNomes[new Date(ano, mes, i).getDay()];
        let classeExtra = '';
        if (stringDia === new Date().toISOString().split('T')[0]) classeExtra = 'selected'; 
        if (diasExcecao.find(e => e.data_exata === stringDia)) classeExtra += ' sem-onibus';

        grid.innerHTML += `<div class="dia-calendario ${classeExtra}" onclick="clicarDiaAluno('${stringDia}', '${nomeDia}', this)">${i}</div>`;
    }
    document.getElementById('aluno-painel-detalhes-dia').style.display = 'none';
}

function mudarMesAluno(offset) { dataRefAluno.setMonth(dataRefAluno.getMonth() + offset); renderizarCalendarioVisualAluno(); }

// Quando clica no dia, carrega se tem ônibus ou se é feriado pra mostrar pro aluno
async function clicarDiaAluno(dataISO, nomeDiaSemana, elementoHTML) {
    if(elementoHTML.parentElement) elementoHTML.parentElement.querySelectorAll('.dia-calendario').forEach(el => el.classList.remove('selected'));
    elementoHTML.classList.add('selected');
    
    diaAtivoSemanaAluno = nomeDiaSemana;
    document.getElementById('aluno-titulo-data-selecionada').innerText = `${dataISO.split('-').reverse().join('/')} - ${nomeDiaSemana}`;
    document.getElementById('aluno-span-dia-semana').innerText = nomeDiaSemana;
    document.getElementById('aluno-painel-detalhes-dia').style.display = 'block';

    const feriado = diasExcecao.find(e => e.data_exata === dataISO);
    const boxFeriado = document.getElementById('aluno-aviso-feriado');
    const blocoEscala = document.getElementById('aluno-escala-normal');

    if(feriado) {
        boxFeriado.classList.remove('hidden');
        document.getElementById('aluno-motivo-feriado').innerText = feriado.motivo;
        blocoEscala.classList.add('hidden');
    } else {
        boxFeriado.classList.add('hidden');
        blocoEscala.classList.remove('hidden');
        const lista = document.getElementById('aluno-lista-escala-dia');
        const res = await fetch(`/api/aluno/calendario/${nomeDiaSemana}`, { cache: 'no-store' });
        if (res.ok) {
            const escalas = await res.json();
            if (escalas.length === 0) lista.innerHTML = '<p class="text-light" style="text-align:center;"><i class="fa-solid fa-inbox"></i> Nenhum ônibus agendado para este dia da semana.</p>';
            else lista.innerHTML = escalas.map(e => `
                <li class="list-item" style="border-left: 4px solid var(--primary-color);">
                    <strong><i class="fa-solid fa-bus text-primary"></i> ${e.placa} - ${e.rota_descricao}</strong>
                    <div class="meta"><i class="fa-solid fa-id-card-clip"></i> Motorista: ${e.motorista_nome}</div>
                    <div class="meta"><i class="fa-regular fa-clock"></i> Partida: ${e.horario_saida} &nbsp;|&nbsp; Retorno: ${e.horario_volta}</div>
                    ${e.observacao ? `<div class="meta text-accent"><i class="fa-solid fa-circle-info"></i> Obs: ${e.observacao}</div>` : ''}
                </li>`).join('');
        }
    }
}

let dataRef = new Date();
let diaAtivoISO = null;
let diaAtivoSemana = null;

// Mesmo calendário, só que pro admin (libera opções de editar rotas e ver lista de presença)
async function renderizarCalendarioVisual() {
    await carregarExcecoesGlobais();
    const grid = document.getElementById('calendario-dias');
    const displayMes = document.getElementById('calendario-mes-ano');
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const diasSemanaNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    
    const ano = dataRef.getFullYear(); const mes = dataRef.getMonth();
    displayMes.innerText = `${meses[mes]} ${ano}`; grid.innerHTML = '';
    
    const primeiroDiaMes = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    for(let i = 0; i < primeiroDiaMes; i++) grid.innerHTML += `<div></div>`; 
    
    for(let i = 1; i <= diasNoMes; i++) {
        const stringDia = `${ano}-${String(mes+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const nomeDia = diasSemanaNomes[new Date(ano, mes, i).getDay()];
        
        let classeExtra = '';
        if (stringDia === new Date().toISOString().split('T')[0]) classeExtra = 'selected'; 
        if (diasExcecao.find(e => e.data_exata === stringDia)) classeExtra += ' sem-onibus';

        grid.innerHTML += `<div class="dia-calendario ${classeExtra}" onclick="clicarDia('${stringDia}', '${nomeDia}', this)">${i}</div>`;
    }
    document.getElementById('painel-detalhes-dia').style.display = 'none';
}

function mudarMes(offset) { dataRef.setMonth(dataRef.getMonth() + offset); renderizarCalendarioVisual(); }

async function clicarDia(dataISO, nomeDiaSemana, elementoHTML) {
    if(elementoHTML.parentElement) elementoHTML.parentElement.querySelectorAll('.dia-calendario').forEach(el => el.classList.remove('selected'));
    elementoHTML.classList.add('selected');
    
    diaAtivoISO = dataISO; diaAtivoSemana = nomeDiaSemana;
    document.getElementById('titulo-data-selecionada').innerText = `${dataISO.split('-').reverse().join('/')} - ${nomeDiaSemana}`;
    document.getElementById('span-dia-semana').innerText = nomeDiaSemana;
    document.getElementById('painel-detalhes-dia').style.display = 'block';

    const feriado = diasExcecao.find(e => e.data_exata === dataISO);
    const boxFeriado = document.getElementById('box-feriado-ativo');
    const blocoEscala = document.getElementById('bloco-escala-normal');
    const btnMarcar = document.getElementById('btn-marcar-feriado');

    if (feriado) {
        boxFeriado.classList.remove('hidden');
        document.getElementById('motivo-feriado-admin').innerText = feriado.motivo;
        blocoEscala.classList.add('hidden');
        btnMarcar.classList.add('hidden');
    } else {
        boxFeriado.classList.add('hidden');
        blocoEscala.classList.remove('hidden');
        btnMarcar.classList.remove('hidden');
        
        carregarEscalaDoDia();
        carregarPresencasDaData(dataISO);
        const resFrota = await fetch('/api/admin/onibus', { cache: 'no-store' });
        if (resFrota.ok) {
            const frota = await resFrota.json();
            const select = document.getElementById('cal-onibus');
            if (frota.length === 0) select.innerHTML = '<option disabled>Nenhum ônibus ativo na frota.</option>';
            else select.innerHTML = '<option value="" disabled selected>Selecione um veículo...</option>' + frota.map(o => `<option value="${o.id}">${o.placa} - ${o.rota} (${o.motorista})</option>`).join('');
        }
    }
}

// Puxa a programação de rotas cadastradas pra esse dia da semana
async function carregarEscalaDoDia() {
    const lista = document.getElementById('lista-escala-dia');
    const res = await fetch(`/api/admin/calendario/${diaAtivoSemana}`, { cache: 'no-store' });
    if (res.ok) {
        const escalas = await res.json();
        if (escalas.length === 0) lista.innerHTML = '<p class="text-light" style="text-align:center;"><i class="fa-solid fa-inbox"></i> A escala deste dia da semana está vazia.</p>';
        else lista.innerHTML = escalas.map(e => `
            <li class="list-item" style="border-left: 4px solid var(--accent-color);">
                <strong><i class="fa-solid fa-bus text-primary"></i> ${e.placa} - ${e.rota}</strong>
                <div class="meta"><i class="fa-solid fa-id-card-clip"></i> Mot: ${e.motorista}</div>
                <div class="meta"><i class="fa-regular fa-clock"></i> Ida: ${e.horario_saida} &nbsp;|&nbsp; Volta: ${e.horario_volta}</div>
                ${e.observacao ? `<div class="meta"><i class="fa-solid fa-circle-info"></i> Obs: ${e.observacao}</div>` : ''}
                <button onclick="removerEscala(${e.id})" class="btn-outline" style="margin-top: 10px; border-color: var(--danger); color: var(--danger);"><i class="fa-solid fa-trash"></i> Remover da Escala</button>
            </li>
        `).join('');
    }
}

// Aloca um novo ônibus pra escala semanal
document.getElementById('form-add-escala').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = { dia_semana: diaAtivoSemana, onibus_id: document.getElementById('cal-onibus').value, horario_saida: document.getElementById('cal-saida').value, horario_volta: document.getElementById('cal-volta').value, observacao: document.getElementById('cal-observacao').value };
    const res = await fetch('/api/admin/calendario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if(res.ok) { document.getElementById('form-add-escala').reset(); carregarEscalaDoDia(); } else await customError((await res.json()).erro);
});

async function removerEscala(id) { 
    if (await customConfirm('Remover este ônibus da escala deste dia da semana?', 'Confirmar Exclusão')) { 
        await fetch(`/api/admin/calendario/${id}`, { method: 'DELETE' }); 
        carregarEscalaDoDia(); 
    } 
}

// Traz a lista de todos os alunos que confirmaram que vão usar o transporte naquele dia.
// Agrupa bonitinho por ônibus pra ficar fácil pro motorista checar.
async function carregarPresencasDaData(dataStr) {
    const res = await fetch(`/api/admin/presencas?data=${dataStr}`, { cache: 'no-store' });
    if (res.ok) {
        const presencas = await res.json();
        const divConteudo = document.getElementById('conteudo-presencas-calendario');
        if (presencas.length === 0) return divConteudo.innerHTML = '<p class="text-light" style="text-align:center;"><i class="fa-solid fa-users-slash"></i> Ninguém confirmou assento nesta data.</p>';
        
        const grupos = {};
        presencas.forEach(p => { const chave = `<i class="fa-solid fa-bus"></i> ${p.placa} (${p.rota})`; if (!grupos[chave]) grupos[chave] = []; grupos[chave].push(p); });
        
        let html = `<div style="background: var(--primary-color); color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px; box-shadow: var(--shadow);"><h3 style="margin: 0; font-size: 20px;"><i class="fa-solid fa-users"></i> Embarques do Dia: ${presencas.length}</h3></div>`;
        for (const [onibus, alunos] of Object.entries(grupos)) {
            html += `<div style="background: #fff; padding: 20px; border-radius: var(--radius); border: 1px solid var(--border-color); margin-bottom: 15px; box-shadow: var(--shadow);"><h4 style="margin-top: 0; color: var(--text-main); display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #eee; padding-bottom:10px; margin-bottom:15px;">${onibus} <span style="background: var(--primary-color); color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px;"><i class="fa-solid fa-user-check"></i> ${alunos.length} Passageiros</span></h4><ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px;">`;
            alunos.forEach(a => { 
                // Essa gambiarra do 'Z' é pra forçar o javascript a entender que o horário do banco tá em UTC, aí ele ajusta pro fuso do Brasil
                const horaCorrigida = new Date(a.data_confirmacao + 'Z').toLocaleTimeString('pt-BR').substring(0,5);
                html += `<li style="background: #f9fafb; padding: 12px; border-radius: 8px; border-left: 4px solid var(--primary-color); display: flex; justify-content: space-between; align-items: center;"><div><strong style="color:var(--text-main); display:block;">${a.nome}</strong><span style="font-size: 12px; color: var(--text-light);"><i class="fa-solid fa-hashtag"></i> ${a.matricula} &nbsp;|&nbsp; <i class="fa-solid fa-arrows-turn-to-dots"></i> ${a.tipo_presenca.replace('_', ' ')}</span></div><div style="font-size:12px; font-weight:600; color:var(--text-light);"><i class="fa-regular fa-clock"></i> ${horaCorrigida}</div></li>`; 
            });
            html += `</ul></div>`;
        }
        divConteudo.innerHTML = html;
    }
}

// Cadastra um aluno novo na base
document.getElementById('form-cadastro-aluno').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = { nome: document.getElementById('novo-nome').value, cpf: document.getElementById('novo-cpf').value, email: document.getElementById('novo-email').value, telefone: document.getElementById('novo-telefone').value, data_nascimento: document.getElementById('novo-nascimento').value, matricula: document.getElementById('novo-matricula').value, instituicao_ensino: document.getElementById('novo-instituicao').value };
    const res = await fetch('/api/admin/aluno', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json(); 
    if(res.ok) { await customAlert(data.mensagem, "Sucesso!"); document.getElementById('form-cadastro-aluno').reset(); } else await customError(data.erro);
});

// Pesquisa os alunos e monta a listona pra gerenciar
async function buscarAlunosAPI() {
    const termo = document.getElementById('busca-aluno').value;
    const res = await fetch(`/api/admin/alunos?q=${termo}`, { cache: 'no-store' });
    if (res.ok) {
        const alunos = await res.json();
        const lista = document.getElementById('lista-gerenciamento-alunos');
        
        // Joga a caixa de edição pro pai pra não perder ela quando recriar a lista
        const boxEdicao = document.getElementById('box-edicao-aluno');
        boxEdicao.classList.add('hidden');
        document.getElementById('tab-gerenciar-alunos').appendChild(boxEdicao);

        if (alunos.length === 0) return lista.innerHTML = '<p class="text-light" style="text-align:center;"><i class="fa-solid fa-magnifying-glass"></i> Nenhum aluno encontrado.</p>';
        
        lista.innerHTML = alunos.map(a => {
            const isAtivo = Number(a.ativo) === 1;

            const btnAcao = isAtivo ? 
                `<button onclick="excluirAlunoAPI(${a.aluno_id})" class="btn-outline" style="border-color:var(--danger); color:var(--danger); flex:1;"><i class="fa-solid fa-user-xmark"></i> Inativar</button>` 
                : 
                `<button onclick="reativarAlunoAPI(${a.aluno_id})" style="background-color: #28a745 !important; border: none; border-radius: 8px; color: white !important; flex:1; padding: 10px; cursor: pointer; font-weight: bold;"><i class="fa-solid fa-user-check"></i> Reativar</button>`;

            return `<li class="list-item" style="${isAtivo ? 'border-left: 4px solid var(--primary-color);' : 'border-left: 4px solid var(--text-light); opacity: 0.7; filter: grayscale(1);'}"><strong><i class="fa-solid fa-user"></i> ${a.nome}</strong><div class="meta"><i class="fa-solid fa-address-card"></i> CPF: ${a.cpf} &nbsp;|&nbsp; <i class="fa-solid fa-hashtag"></i> Matrícula: ${a.matricula}</div><div class="meta"><i class="fa-solid fa-phone"></i> Tel: ${a.telefone || 'N/A'}</div><div style="margin-top: 10px; display: flex; gap: 10px;"><button onclick="prepararEdicao(this, ${a.aluno_id}, '${a.nome}', '${a.cpf}', '${a.email}', '${a.matricula}', '${a.instituicao_ensino}')" class="btn-outline" style="flex:1;"><i class="fa-solid fa-pen"></i> Editar</button> ${btnAcao}</div></li>`;
        }).join('');
    }
}

// Pega os dados do aluno clicado, injeta no form de edição e arrasta o form pra debaixo do card dele
function prepararEdicao(btn, id, nome, cpf, email, matricula, inst) { 
    document.getElementById('edit-id').value = id; 
    document.getElementById('edit-nome').value = nome; 
    
    let cpfFormatado = cpf.replace(/\D/g, '');
    if (cpfFormatado.length === 11) {
        cpfFormatado = cpfFormatado.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    document.getElementById('edit-cpf').value = cpfFormatado;
    document.getElementById('edit-email').value = email; 
    document.getElementById('edit-matricula').value = matricula; 
    document.getElementById('edit-instituicao').value = inst; 
    
    const boxEdicao = document.getElementById('box-edicao-aluno');
    const listItem = btn.closest('.list-item');
    
    boxEdicao.style.marginTop = '15px';
    listItem.appendChild(boxEdicao);
    boxEdicao.classList.remove('hidden'); 
    
    setTimeout(() => {
        boxEdicao.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Salva as edições do aluno
document.getElementById('form-editar-aluno').addEventListener('submit', async (e) => { 
    e.preventDefault(); 
    const id = document.getElementById('edit-id').value; 
    const cpfLimpo = document.getElementById('edit-cpf').value.replace(/\D/g, '');
    
    const payload = { 
        nome: document.getElementById('edit-nome').value, 
        cpf: cpfLimpo,
        email: document.getElementById('edit-email').value, 
        matricula: document.getElementById('edit-matricula').value, 
        instituicao_ensino: document.getElementById('edit-instituicao').value 
    }; 
    
    const res = await fetch(`/api/admin/aluno/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); 
    const data = await res.json(); 
    if(res.ok) { 
        await customAlert(data.mensagem, "Sucesso!"); 
        document.getElementById('box-edicao-aluno').classList.add('hidden'); 
        buscarAlunosAPI(); 
    } else {
        await customError(data.erro); 
    }
});

async function excluirAlunoAPI(id) { if(await customConfirm('Inativar o acesso deste aluno ao app?', 'Atenção')) { await fetch(`/api/admin/aluno/${id}`, { method: 'DELETE' }); buscarAlunosAPI(); } }
async function reativarAlunoAPI(id) { if(await customConfirm('Restaurar o acesso deste aluno?', 'Atenção')) { await fetch(`/api/admin/aluno/${id}/reativar`, { method: 'PUT' }); buscarAlunosAPI(); } }

// Envia um aviso novo. Arruma a data que vem do html pra ficar com o formato certinho pro banco ler
document.getElementById('form-notificacao').addEventListener('submit', async (e) => { 
    e.preventDefault(); 
    
    const expiracaoRaw = document.getElementById('aviso-expiracao').value;
    const expiracaoFormatada = expiracaoRaw.replace('T', ' ') + ':00'; 

    const payload = { 
        titulo: document.getElementById('aviso-titulo').value, 
        descricao: document.getElementById('aviso-descricao').value, 
        tempo_expiracao: expiracaoFormatada
    }; 
    
    try {
        const res = await fetch('/api/admin/notificacao', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        }); 
        
        const data = await res.json(); 
        
        if (res.ok) { 
            await customAlert(data.mensagem, "Enviado!"); 
            document.getElementById('form-notificacao').reset(); 
            carregarNotificacoesAdmin(); 
        } else {
            await customError(data.erro); 
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        await customError("Falha na conexão com o servidor.");
    }
});

// Puxa os avisos pro admin. Já filtra tirando da tela os que já expiraram ou foram cancelados.
async function carregarNotificacoesAdmin() { 
    const res = await fetch('/api/admin/notificacoes', { cache: 'no-store' }); 
    if (res.ok) { 
        const avisos = await res.json(); 
        const lista = document.getElementById('lista-avisos-admin'); 
        const agora = new Date(); 
        
        const avisosAtivos = avisos.filter(a => {
            const dataExp = new Date(a.tempo_expiracao.replace(' ', 'T'));
            return (a.ativa === 1 && dataExp > agora);
        });

        if (avisosAtivos.length === 0) {
            return lista.innerHTML = '<p class="text-light" style="text-align:center;"><i class="fa-solid fa-inbox"></i> Nenhum comunicado ativo no momento.</p>'; 
        }
        
        lista.innerHTML = avisosAtivos.map(a => {
            const dataExp = new Date(a.tempo_expiracao.replace(' ', 'T'));

            return `<li class="list-item" style="border-left: 4px solid var(--accent-color);">
                <strong><i class="fa-solid fa-bullhorn"></i> ${a.titulo}</strong>
                <p style="font-size:14px; margin-top:5px; color:var(--text-main);">${a.descricao}</p>
                <div class="meta" style="margin-top:10px;"><i class="fa-regular fa-clock"></i> Expira: ${dataExp.toLocaleString('pt-BR')}</div>
                <button onclick="cancelarNotificacao(${a.id})" class="btn-outline" style="border-color:var(--danger); color:var(--danger); margin-top: 10px;"><i class="fa-solid fa-trash-can"></i> Retirar do Ar</button>
            </li>`;
        }).join(''); 
    } 
}

async function cancelarNotificacao(id) { if (await customConfirm('Cancelar este comunicado imediatamente?', 'Atenção')) { await fetch(`/api/admin/notificacao/${id}/cancelar`, { method: 'PUT' }); carregarNotificacoesAdmin(); } }

// Registra ônibus novo na frota
document.getElementById('form-onibus')?.addEventListener('submit', async (e) => { e.preventDefault(); const payload = { placa: document.getElementById('onibus-placa').value, motorista: document.getElementById('onibus-motorista').value, rota: document.getElementById('onibus-rota').value, status: document.getElementById('onibus-status').value }; const res = await fetch('/api/admin/onibus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await res.json(); if (res.ok) { await customAlert(data.mensagem, "Registrado!"); document.getElementById('form-onibus').reset(); carregarFrota(); } else await customError(data.erro); });

// Edita dados do ônibus
document.getElementById('form-editar-onibus')?.addEventListener('submit', async (e) => { e.preventDefault(); const id = document.getElementById('edit-oni-id').value; const payload = { placa: document.getElementById('edit-oni-placa').value, motorista: document.getElementById('edit-oni-motorista').value, rota: document.getElementById('edit-oni-rota').value, status: document.getElementById('edit-oni-status').value }; const res = await fetch(`/api/admin/onibus/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await res.json(); if (res.ok) { await customAlert(data.mensagem, "Atualizado!"); document.getElementById('box-edicao-onibus').classList.add('hidden'); carregarFrota(); } else await customError(data.erro); });

// Mesma lógica de arrastar o form de edição do aluno, só que pra o ônibus clicado
function prepararEdicaoOnibus(btn, id, placa, motorista, rota, status) { 
    document.getElementById('edit-oni-id').value = id; 
    document.getElementById('edit-oni-placa').value = placa; 
    document.getElementById('edit-oni-motorista').value = motorista; 
    document.getElementById('edit-oni-rota').value = rota; 
    document.getElementById('edit-oni-status').value = status; 
    
    const boxEdicao = document.getElementById('box-edicao-onibus');
    const listItem = btn.closest('.list-item');
    
    boxEdicao.style.marginTop = '15px';
    listItem.appendChild(boxEdicao);
    boxEdicao.classList.remove('hidden'); 
    
    setTimeout(() => {
        boxEdicao.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Lista os ônibus na aba da frota e colore de acordo com o status
async function carregarFrota() { 
    const res = await fetch('/api/admin/onibus', { cache: 'no-store' }); 
    if (res.ok) { 
        const frota = await res.json(); 
        const lista = document.getElementById('lista-frota'); 
        
        const boxEdicao = document.getElementById('box-edicao-onibus');
        boxEdicao.classList.add('hidden');
        document.getElementById('tab-frota').appendChild(boxEdicao);

        if (frota.length === 0) return lista.innerHTML = '<p class="text-light" style="text-align:center;"><i class="fa-solid fa-inbox"></i> Frota vazia.</p>'; 
        lista.innerHTML = frota.map(o => { 
            let statIcon = o.status === 'Ativo' ? '<i class="fa-solid fa-circle-check text-success"></i>' : (o.status === 'Em Manutenção' ? '<i class="fa-solid fa-screwdriver-wrench text-accent"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'); 
            return `<li class="list-item" style="${o.status === 'Inativo' ? 'border-left: 4px solid var(--danger); opacity: 0.6;' : (o.status === 'Em Manutenção' ? 'border-left: 4px solid var(--accent-color);' : 'border-left: 4px solid var(--success);')}"><strong><i class="fa-solid fa-bus text-primary"></i> Placa: ${o.placa}</strong><div class="meta"><i class="fa-solid fa-user-tie"></i> Motorista Titular: ${o.motorista}</div><div class="meta"><i class="fa-solid fa-route"></i> Rota Padrão: ${o.rota}</div><div class="meta" style="margin-top:5px; font-weight:600;">Status: &nbsp; ${statIcon} ${o.status}</div><button onclick="prepararEdicaoOnibus(this, ${o.id}, '${o.placa}', '${o.motorista}', '${o.rota}', '${o.status}')" class="btn-outline" style="margin-top: 10px;"><i class="fa-solid fa-pen"></i> Editar Ficha</button></li>`
        }).join(''); 
    } 
}

// O controlador das abas. Esconde tudo e mostra só o que precisa, já carregando os dados.
async function showTab(tabId) {
    document.querySelectorAll('#aluno-view .tab').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    if (tabId === 'presenca') {
        try {
            await carregarExcecoesGlobais();
            const hojeIso = new Date().toISOString().split('T')[0];
            const feriadoHoje = diasExcecao.find(e => e.data_exata === hojeIso);
            
            const form = document.getElementById('presenca-form');
            const statusBox = document.getElementById('presenca-status');
            const avisoFeriado = document.getElementById('aviso-feriado-presenca');
            
            if (feriadoHoje) {
                form.style.display = 'none'; statusBox.classList.add('hidden'); avisoFeriado.classList.remove('hidden');
                document.getElementById('motivo-feriado-texto').innerText = feriadoHoje.motivo;
                return;
            }

            avisoFeriado.classList.add('hidden');
            const verifyRes = await fetch('/api/aluno/presenca/hoje', { cache: 'no-store' });
            const verifyData = await verifyRes.json();

            if (verifyData.confirmada) {
                form.style.display = 'none'; statusBox.classList.remove('hidden');
                document.getElementById('status-detalhes').innerHTML = `<i class="fa-solid fa-bus text-primary"></i> <strong>Ônibus:</strong> ${verifyData.dados.motorista} | ${verifyData.dados.placa} - ${verifyData.dados.rota}<br><i class="fa-solid fa-arrows-turn-to-dots text-primary" style="margin-top:10px;"></i> <strong>Modo:</strong> ${verifyData.dados.tipo_presenca.replace('_', ' ')}`;
            } else {
                form.style.display = 'block'; statusBox.classList.add('hidden');
                const res = await fetch('/api/aluno/onibus', { cache: 'no-store' });
                const select = document.getElementById('presenca-onibus');
                
                if (res.ok) {
                    const onibusList = await res.json();
                    if (onibusList.length === 0) {
                        select.innerHTML = '<option value="" disabled selected>Nenhum ônibus ativo na frota.</option>';
                    } else {
                        select.innerHTML = '<option value="" disabled selected>Selecione o veículo na lista...</option>' + 
                            onibusList.map(o => `<option value="${o.id}">${o.motorista} | ${o.placa} | ${o.rota}</option>`).join('');
                    }
                } else {
                    select.innerHTML = '<option value="" disabled selected>⚠️ Falha ao carregar ônibus.</option>';
                }
            }
        } catch(e) { console.error("Erro na aba de presença:", e); }
    } else if (tabId === 'carteirinha') {
        const res = await fetch('/api/aluno/carteirinha', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json(); document.getElementById('cart-nome').innerText = data.nome; document.getElementById('cart-matricula').innerText = data.matricula; document.getElementById('cart-curso').innerText = data.instituicao_ensino; document.getElementById('cart-codigo').innerText = data.codigo_identificacao; document.getElementById('cart-iniciais').innerText = data.nome.substring(0, 2).toUpperCase();
        }
    } else if (tabId === 'rotas') {
        renderizarCalendarioVisualAluno();
    } else if (tabId === 'avisos') {
        const res = await fetch('/api/aluno/notificacoes', { cache: 'no-store' });
        if (res.ok) {
            const avisos = await res.json(); const lista = document.getElementById('lista-avisos');
            if (avisos.length === 0) lista.innerHTML = '<p class="text-light" style="text-align:center;"><i class="fa-solid fa-inbox"></i> Nenhum comunicado da Secretaria de Educação.</p>';
            else lista.innerHTML = avisos.map(a => `<li class="list-item" style="border-left: 4px solid var(--accent-color);"><strong><i class="fa-solid fa-circle-exclamation text-accent"></i> ${a.titulo}</strong><p style="margin-top:5px; font-size:14px;">${a.descricao}</p><div class="meta" style="margin-top:10px;"><i class="fa-regular fa-clock"></i> Expira em: ${new Date(a.tempo_expiracao).toLocaleString('pt-BR')}</div></li>`).join('');
        }
    }
}

// Mesma coisa da função de cima, só que pras abas do admin.
function showAdminTab(tabId) {
    document.querySelectorAll('#admin-view .tab').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    if (tabId === 'gerenciar-alunos') buscarAlunosAPI();
    if (tabId === 'frota') carregarFrota();
    if (tabId === 'nova-notificacao') carregarNotificacoesAdmin();
    if (tabId === 'calendario') renderizarCalendarioVisual();
}