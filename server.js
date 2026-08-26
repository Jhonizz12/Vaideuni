// server.js
const express = require('express');
const session = require('express-session');
const path = require('path');

const authController = require('./src/controllers/authController');
const alunoController = require('./src/controllers/alunoController');
const adminController = require('./src/controllers/adminController');

// Ponto de entrada principal da aplicacao backend.
// Inicializa o servidor Express, que atuara como o nucleo para o roteamento e gerenciamento de middlewares.
const app = express();
const PORT = process.env.PORT || 3000;

// Configura os parsers nativos do Express para processar requisicoes com corpo no formato JSON e URL-encoded.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura o middleware de sessao da aplicacao.
// Responsavel por manter o estado de autenticacao do usuario armazenando dados no lado do servidor e vinculando-os por meio de cookies temporarios.
app.use(session({
    secret: 'vai-de-uni-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

// Define o diretorio raiz para a entrega de arquivos estaticos (HTML, CSS e JavaScript client-side).
// Permite que o Express sirva a interface da aplicacao diretamente sem a necessidade de processamento adicional.
app.use(express.static(path.join(__dirname, 'public')));


// ROTAS DE AUTENTICACAO E SESSAO
// Gerenciam os estagios do acesso de usuarios, verificacao de estado e redefinicao de credenciais.
app.get('/api/session', authController.checkSession);
app.post('/api/login', authController.login);
app.post('/api/alterar-senha', authController.alterarSenha);
app.post('/api/logout', authController.logout);


// ROTAS DO MODULO ALUNO
// Expoem os endpoints necessarios para as operacoes de uso diario dos estudantes no painel de transporte.
app.get('/api/aluno/presenca/hoje', alunoController.verificarPresencaHoje);
app.post('/api/aluno/presenca', alunoController.confirmarPresenca);
app.delete('/api/aluno/presenca', alunoController.cancelarPresenca);
app.get('/api/aluno/carteirinha', alunoController.getCarteirinha);
app.get('/api/aluno/calendario/:dia', alunoController.buscarCalendarioDia);
app.get('/api/aluno/notificacoes', alunoController.getNotificacoes);
app.get('/api/aluno/onibus', alunoController.listarOnibusAtivos);


// ROTAS DO MODULO ADMINISTRADOR
// Concentram todas as operacoes de gestao e CRUDs pertinentes ao controle interno do sistema.

// Gestao de Alunos
app.post('/api/admin/aluno', adminController.cadastrarAluno);
app.get('/api/admin/alunos', adminController.buscarAlunos);
app.put('/api/admin/aluno/:id_aluno', adminController.editarAluno);
app.delete('/api/admin/aluno/:id_aluno', adminController.excluirAluno);
app.put('/api/admin/aluno/:id_aluno/reativar', adminController.reativarAluno);

// Gestao de Comunicados Globais
app.post('/api/admin/notificacao', adminController.adicionarNotificacao);
app.get('/api/admin/notificacoes', adminController.listarNotificacoesAdmin);
app.put('/api/admin/notificacao/:id/cancelar', adminController.cancelarNotificacao);

// Gestao da Escala Fixa Semanal
app.get('/api/admin/calendario/:dia', adminController.buscarCalendarioDia);
app.post('/api/admin/calendario', adminController.adicionarCalendario);
app.delete('/api/admin/calendario/:id', adminController.removerCalendario);

// Gestao da Frota de Veiculos
app.post('/api/admin/onibus', adminController.cadastrarOnibus);
app.get('/api/admin/onibus', adminController.listarOnibus);
app.put('/api/admin/onibus/:id', adminController.editarOnibus);
app.put('/api/admin/onibus/:id/status', adminController.atualizarStatusOnibus);

// Controle de Passageiros e Embarque
app.get('/api/admin/presencas', adminController.listarPresencasDoDia);

// Controle de Feriados e Excecoes Operacionais
app.get('/api/calendario/excecoes', adminController.listarExcecoes);
app.post('/api/admin/calendario/excecao', adminController.adicionarExcecao);
app.delete('/api/admin/calendario/excecao/:data', adminController.removerExcecao);

// Inicializa o servidor HTTP na porta especificada, passando a escutar as requisicoes ativamente.
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});