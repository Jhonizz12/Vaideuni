// src/controllers/alunoController.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

exports.verificarPresencaHoje = (req, res) => {
    const hoje = new Date().toISOString().split('T')[0];
    const query = `
        SELECT p.tipo_presenca, o.placa, o.rota, o.motorista 
        FROM confirmacoes_presenca p
        JOIN onibus o ON p.onibus_id = o.id
        WHERE p.aluno_id = (SELECT id FROM alunos WHERE usuario_id = ?) AND p.data_registro = ?
    `;
    db.get(query, [req.session.userId, hoje], (err, row) => {
        if (err) return res.status(500).json({ erro: 'Erro ao verificar presença.' });
        if (row) return res.json({ confirmada: true, dados: row });
        res.json({ confirmada: false });
    });
};

exports.confirmarPresenca = (req, res) => {
    const hoje = new Date().toISOString().split('T')[0];

    // Trava do servidor: Checa se é feriado antes de deixar confirmar
    db.get('SELECT motivo FROM dias_sem_onibus WHERE data_exata = ?', [hoje], (err, feriado) => {
        if (feriado) return res.status(403).json({ erro: `Presença bloqueada. Não haverá ônibus hoje: ${feriado.motivo}` });

        const horaAtual = new Date().getHours();
        if (horaAtual < 6 || horaAtual >= 15) {
            return res.status(403).json({ erro: 'Prazo encerrado. Confirmações apenas entre 06h e 15h.' });
        }

        const { tipo_presenca, onibus_id } = req.body;
        if (!onibus_id) return res.status(400).json({ erro: 'Por favor, selecione qual ônibus você irá pegar.' });

        const alunoIdQuery = '(SELECT id FROM alunos WHERE usuario_id = ?)';
        db.get(`SELECT id FROM confirmacoes_presenca WHERE aluno_id = ${alunoIdQuery} AND data_registro = ?`, [req.session.userId, hoje], (err, row) => {
            if (row) return res.status(400).json({ erro: 'Você já confirmou presença hoje! Caso precise mudar, cancele a anterior.' });

            db.run(`INSERT INTO confirmacoes_presenca (aluno_id, onibus_id, data_registro, tipo_presenca) VALUES (${alunoIdQuery}, ?, ?, ?)`, 
                [req.session.userId, onibus_id, hoje, tipo_presenca], (err) => {
                if (err) return res.status(500).json({ erro: 'Erro ao registrar presença.' });
                res.json({ mensagem: 'Presença confirmada com sucesso!' });
            });
        });
    });
};

exports.cancelarPresenca = (req, res) => {
    const horaAtual = new Date().getHours();
    if (horaAtual < 6 || horaAtual >= 15) {
        return res.status(403).json({ erro: 'Prazo encerrado. Cancelamentos apenas entre 06h e 15h.' });
    }

    const hoje = new Date().toISOString().split('T')[0];
    db.run(`DELETE FROM confirmacoes_presenca WHERE aluno_id = (SELECT id FROM alunos WHERE usuario_id = ?) AND data_registro = ?`, 
        [req.session.userId, hoje], (err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao cancelar presença.' });
        res.json({ mensagem: 'Confirmação cancelada com sucesso.' });
    });
};

exports.listarOnibusAtivos = (req, res) => {
    db.all("SELECT id, placa, rota, motorista FROM onibus WHERE status = 'Ativo'", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar opções de ônibus.' });
        res.json(rows);
    });
};

exports.getCarteirinha = (req, res) => {
    const query = `
        SELECT u.nome, a.matricula, a.instituicao_ensino, c.codigo_identificacao 
        FROM usuarios u
        JOIN alunos a ON u.id = a.usuario_id
        JOIN carteirinhas_virtuais c ON a.id = c.aluno_id
        WHERE u.id = ?
    `;
    db.get(query, [req.session.userId], (err, row) => {
        if (err || !row) return res.status(404).json({ erro: 'Carteirinha não encontrada' });
        res.json(row);
    });
};

exports.buscarCalendarioDia = (req, res) => {
    const { dia } = req.params;
    const query = `
        SELECT d.horario_saida, d.horario_volta, d.observacao, o.motorista as motorista_nome, o.rota as rota_descricao, o.placa
        FROM dias_calendario d
        JOIN onibus o ON d.onibus_id = o.id
        WHERE d.dia_semana = ?
    `;
    db.all(query, [dia], (err, rows) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar a escala do dia.' });
        res.json(rows);
    });
};

exports.getNotificacoes = (req, res) => {
    const query = `
        SELECT titulo, descricao, tempo_expiracao 
        FROM notificacoes 
        WHERE ativa = 1 AND tempo_expiracao > datetime('now', 'localtime') 
        ORDER BY data_envio DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar notificações' });
        res.json(rows);
    });
};