// server.js
const express = require('express');
const session = require('express-session');
const path = require('path');

const authController = require('./src/controllers/authController');
const alunoController = require('./src/controllers/alunoController');
const adminController = require('./src/controllers/adminController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'vai-de-uni-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/login', authController.login);
app.post('/api/alterar-senha', authController.alterarSenha);
app.post('/api/logout', authController.logout);

app.get('/api/aluno/presenca/hoje', alunoController.verificarPresencaHoje);
app.post('/api/aluno/presenca', alunoController.confirmarPresenca);
app.delete('/api/aluno/presenca', alunoController.cancelarPresenca);
app.get('/api/aluno/carteirinha', alunoController.getCarteirinha);
app.get('/api/aluno/calendario/:dia', alunoController.buscarCalendarioDia);
app.get('/api/aluno/notificacoes', alunoController.getNotificacoes);
app.get('/api/aluno/onibus', alunoController.listarOnibusAtivos);

app.post('/api/admin/aluno', adminController.cadastrarAluno);
app.get('/api/admin/alunos', adminController.buscarAlunos);
app.put('/api/admin/aluno/:id_aluno', adminController.editarAluno);
app.delete('/api/admin/aluno/:id_aluno', adminController.excluirAluno);
app.put('/api/admin/aluno/:id_aluno/reativar', adminController.reativarAluno);

app.post('/api/admin/notificacao', adminController.adicionarNotificacao);
app.get('/api/admin/notificacoes', adminController.listarNotificacoesAdmin);
app.put('/api/admin/notificacao/:id/cancelar', adminController.cancelarNotificacao);

app.get('/api/admin/calendario/:dia', adminController.buscarCalendarioDia);
app.post('/api/admin/calendario', adminController.adicionarCalendario);
app.delete('/api/admin/calendario/:id', adminController.removerCalendario);

app.post('/api/admin/onibus', adminController.cadastrarOnibus);
app.get('/api/admin/onibus', adminController.listarOnibus);
app.put('/api/admin/onibus/:id', adminController.editarOnibus);
app.put('/api/admin/onibus/:id/status', adminController.atualizarStatusOnibus);

app.get('/api/admin/presencas', adminController.listarPresencasDoDia);

// ROTAS DE EXCEÇÃO (FERIADOS / SEM ÔNIBUS)
app.get('/api/calendario/excecoes', adminController.listarExcecoes);
app.post('/api/admin/calendario/excecao', adminController.adicionarExcecao);
app.delete('/api/admin/calendario/excecao/:data', adminController.removerExcecao);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});