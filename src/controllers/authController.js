// src/controllers/authController.js
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

exports.login = (req, res) => {
    const { cpf, senha } = req.body;
    db.get('SELECT * FROM usuarios WHERE cpf = ?', [cpf], async (err, user) => {
        if (err || !user) return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
        if (!user.ativo) return res.status(403).json({ erro: 'Conta inativa. Procure a secretaria.' });
        
        const match = await bcrypt.compare(senha, user.senha);
        if (!match) return res.status(401).json({ erro: 'Usuário ou senha incorretos' });

        req.session.userId = user.id;
        req.session.tipo = user.tipo;
        res.json({ mensagem: 'Login realizado com sucesso', tipo: user.tipo });
    });
};

exports.alterarSenha = async (req, res) => {
    const { matricula, novaSenha } = req.body;
    if (!matricula || !novaSenha) return res.status(400).json({ erro: 'Preencha todos os campos.' });

    db.get('SELECT u.id FROM usuarios u JOIN alunos a ON u.id = a.usuario_id WHERE a.matricula = ?', [matricula], async (err, row) => {
        if (err || !row) return res.status(404).json({ erro: 'Matrícula não encontrada.' });
        
        const hash = await bcrypt.hash(novaSenha, 10);
        db.run('UPDATE usuarios SET senha = ? WHERE id = ?', [hash, row.id], (err) => {
            if (err) return res.status(500).json({ erro: 'Erro ao alterar a senha.' });
            res.json({ mensagem: 'Senha alterada com sucesso! Você já pode fazer login.' });
        });
    });
};

// NOVA FUNÇÃO LGPD: Destruição segura da sessão
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao encerrar sessão.' });
        res.clearCookie('connect.sid'); // Limpa o cookie de sessão do navegador
        res.json({ mensagem: 'Sessão encerrada com segurança.' });
    });
};