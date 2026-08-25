// src/controllers/adminController.js
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

exports.cadastrarAluno = async (req, res) => {
    const { nome, cpf, email, telefone, data_nascimento, matricula, instituicao_ensino } = req.body;
    try {
        const senhaPadrao = await bcrypt.hash('123456', 10);
        db.run(`INSERT INTO usuarios (nome, cpf, email, senha, data_nascimento, tipo) VALUES (?, ?, ?, ?, ?, 'ALUNO')`, 
            [nome, cpf, email, senhaPadrao, data_nascimento || '2000-01-01'], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ erro: 'O CPF ou E-mail informado já está cadastrado.' });
                return res.status(500).json({ erro: 'Erro ao criar usuário.' });
            }
            const usuarioId = this.lastID;
            db.run(`INSERT INTO alunos (usuario_id, matricula, telefone, instituicao_ensino) VALUES (?, ?, ?, ?)`, 
                [usuarioId, matricula, telefone, instituicao_ensino], function(err) {
                if (err) {
                    db.run('DELETE FROM usuarios WHERE id = ?', [usuarioId]);
                    if (err.message.includes('UNIQUE')) return res.status(400).json({ erro: 'A Matrícula informada já está cadastrada.' });
                    return res.status(500).json({ erro: 'Erro ao vincular dados.' });
                }
                const alunoId = this.lastID;
                db.run(`INSERT INTO carteirinhas_virtuais (aluno_id, codigo_identificacao, data_emissao) VALUES (?, ?, DATE('now'))`, 
                    [alunoId, Date.now().toString()], (err) => {
                    res.json({ mensagem: 'Aluno cadastrado com sucesso!' });
                });
            });
        });
    } catch (error) { res.status(500).json({ erro: 'Erro interno.' }); }
};

exports.buscarAlunos = (req, res) => {
    const termo = req.query.q || '';
    const query = `
        SELECT a.id as aluno_id, u.nome, u.cpf, u.email, a.telefone, a.matricula, a.instituicao_ensino, u.ativo
        FROM usuarios u
        JOIN alunos a ON u.id = a.usuario_id
        WHERE u.tipo = 'ALUNO' AND (u.nome LIKE ? OR u.cpf LIKE ?)
    `;
    db.all(query, [`%${termo}%`, `%${termo}%`], (err, rows) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar alunos' });
        res.json(rows);
    });
};

exports.editarAluno = (req, res) => {
    const { id_aluno } = req.params;
    const { nome, email, matricula, instituicao_ensino } = req.body;
    db.run(`UPDATE usuarios SET nome = ?, email = ? WHERE id = (SELECT usuario_id FROM alunos WHERE id = ?)`, 
        [nome, email, id_aluno], (err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao atualizar dados.' });
        db.run(`UPDATE alunos SET matricula = ?, instituicao_ensino = ? WHERE id = ?`, 
            [matricula, instituicao_ensino, id_aluno], (err) => {
            if (err) return res.status(500).json({ erro: 'Erro ao atualizar acadêmico.' });
            res.json({ mensagem: 'Aluno atualizado com sucesso!' });
        });
    });
};

exports.excluirAluno = (req, res) => {
    const { id_aluno } = req.params;
    db.run('UPDATE usuarios SET ativo = 0 WHERE id = (SELECT usuario_id FROM alunos WHERE id = ?)', [id_aluno], (err) => {
        res.json({ mensagem: 'Aluno inativado com sucesso.' });
    });
};

exports.reativarAluno = (req, res) => {
    const { id_aluno } = req.params;
    db.run('UPDATE usuarios SET ativo = 1 WHERE id = (SELECT usuario_id FROM alunos WHERE id = ?)', [id_aluno], (err) => {
        res.json({ mensagem: 'Acesso do aluno restaurado!' });
    });
};

exports.adicionarNotificacao = (req, res) => {
    const { titulo, descricao, tempo_expiracao } = req.body;
    
    if (!titulo || !descricao) {
        return res.status(400).json({ erro: 'Título e descrição são obrigatórios.' });
    }

    const query = `
        INSERT INTO notificacoes (titulo, descricao, tempo_expiracao, autor_id) 
        VALUES (?, ?, ?, (SELECT id FROM administradores WHERE usuario_id = ?))
    `;

    db.run(query, [titulo, descricao, tempo_expiracao, req.session.userId], function(err) {
        if (err) {
            console.error('Erro ao inserir notificação:', err.message);
            return res.status(500).json({ erro: 'Erro ao enviar notificação.' });
        }
        
        if (this.changes === 0) {
            return res.status(400).json({ erro: 'Administrador não encontrado ou sessão inválida.' });
        }

        res.json({ mensagem: 'Notificação enviada com sucesso!' });
    });
};

exports.listarNotificacoesAdmin = (req, res) => {
    db.all('SELECT * FROM notificacoes ORDER BY data_envio DESC', [], (err, rows) => {
        res.json(rows);
    });
};

exports.cancelarNotificacao = (req, res) => {
    const { id } = req.params;
    db.run("UPDATE notificacoes SET ativa = 0, tempo_expiracao = datetime('now', 'localtime') WHERE id = ?", [id], (err) => {
        res.json({ mensagem: 'Notificação cancelada.' });
    });
};

exports.buscarCalendarioDia = (req, res) => {
    const { dia } = req.params;
    const query = `
        SELECT d.id, d.horario_saida, d.horario_volta, d.observacao, o.placa, o.rota, o.motorista, o.id as onibus_id
        FROM dias_calendario d
        JOIN onibus o ON d.onibus_id = o.id
        WHERE d.dia_semana = ?
    `;
    db.all(query, [dia], (err, rows) => {
        res.json(rows);
    });
};

exports.adicionarCalendario = (req, res) => {
    const { dia_semana, horario_saida, horario_volta, onibus_id, observacao } = req.body;
    db.run(`INSERT INTO dias_calendario (dia_semana, horario_saida, horario_volta, onibus_id, observacao) VALUES (?, ?, ?, ?, ?)`,
        [dia_semana, horario_saida, horario_volta, onibus_id, observacao], (err) => {
            if (err) return res.status(500).json({ erro: 'Erro ao cadastrar na escala.' });
            res.json({ mensagem: 'Ônibus adicionado à escala!' });
        });
};

exports.removerCalendario = (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM dias_calendario WHERE id = ?`, [id], (err) => {
        res.json({ mensagem: 'Escala removida.' });
    });
};

exports.cadastrarOnibus = (req, res) => {
    const { placa, motorista, rota, status } = req.body;
    db.run(`INSERT INTO onibus (placa, motorista, rota, status) VALUES (?, ?, ?, ?)`, 
        [placa, motorista, rota, status || 'Ativo'], (err) => {
        res.json({ mensagem: 'Veículo cadastrado!' });
    });
};

exports.listarOnibus = (req, res) => {
    db.all('SELECT * FROM onibus', [], (err, rows) => {
        res.json(rows);
    });
};

exports.editarOnibus = (req, res) => {
    const { id } = req.params;
    const { placa, motorista, rota, status } = req.body;
    db.run('UPDATE onibus SET placa = ?, motorista = ?, rota = ?, status = ? WHERE id = ?', 
        [placa, motorista, rota, status, id], (err) => {
        res.json({ mensagem: 'Dados atualizados!' });
    });
};

exports.atualizarStatusOnibus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.run('UPDATE onibus SET status = ? WHERE id = ?', [status, id], (err) => {
        res.json({ mensagem: 'Status atualizado.' });
    });
};

exports.listarPresencasDoDia = (req, res) => {
    const dataAlvo = req.query.data || new Date().toISOString().split('T')[0];
    const query = `
        SELECT u.nome, a.matricula, c.tipo_presenca, c.data_confirmacao, o.placa, o.rota
        FROM confirmacoes_presenca c
        JOIN alunos a ON c.aluno_id = a.id
        JOIN usuarios u ON a.usuario_id = u.id
        JOIN onibus o ON c.onibus_id = o.id
        WHERE c.data_registro = ?
        ORDER BY o.rota ASC, c.data_confirmacao DESC
    `;
    db.all(query, [dataAlvo], (err, rows) => {
        res.json(rows);
    });
};

// --- NOVAS FUNÇÕES PARA DIAS SEM ÔNIBUS (FERIADOS) ---
exports.listarExcecoes = (req, res) => {
    db.all('SELECT * FROM dias_sem_onibus', [], (err, rows) => {
        res.json(rows || []);
    });
};

exports.adicionarExcecao = (req, res) => {
    const { data_exata, motivo } = req.body;
    db.run('INSERT OR REPLACE INTO dias_sem_onibus (data_exata, motivo) VALUES (?, ?)', [data_exata, motivo], (err) => {
        if (err) return res.status(500).json({erro: 'Erro ao marcar dia como sem ônibus.'});
        res.json({mensagem: 'Dia marcado como Sem Ônibus com sucesso.'});
    });
};

exports.removerExcecao = (req, res) => {
    const { data } = req.params;
    db.run('DELETE FROM dias_sem_onibus WHERE data_exata = ?', [data], (err) => {
        if (err) return res.status(500).json({erro: 'Erro ao restaurar ônibus neste dia.'});
        res.json({mensagem: 'Escala restaurada para este dia.'});
    });
};