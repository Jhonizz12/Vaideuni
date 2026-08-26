// src/controllers/authController.js
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// Valida a integridade e a existencia de uma sessao ativa para o cliente.
// Retorna o status de autenticacao e o nivel de privilegio (tipo) associado para o controle de rotas no frontend.
exports.checkSession = (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ logado: true, tipo: req.session.tipo });
    } else {
        res.json({ logado: false });
    }
};

// Processa a autenticacao de usuarios no sistema.
// Realiza a validacao do CPF, checa o status de atividade da conta e compara o hash criptografico da senha.
// Estabelece os parametros de sessao no servidor em caso de sucesso.
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

// Processa a redefinicao de credenciais de acesso.
// Efetua a busca do usuario a partir da matricula academica vinculada, aplica o algoritmo de hash na nova senha e atualiza o registro no banco de dados.
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

// Encerra ativamente a sessao do usuario autenticado.
// Destroi os dados de sessao armazenados no servidor e invalida o cookie de conexao no cliente.
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao encerrar sessão.' });
        res.clearCookie('connect.sid'); 
        res.json({ mensagem: 'Sessão encerrada com segurança.' });
    });
};