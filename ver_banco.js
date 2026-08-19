// ver_banco.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'));

console.log('🔍 Consultando confirmações de presença hoje...\n');

const query = `
    SELECT 
        u.nome, 
        a.matricula, 
        c.tipo_presenca, 
        c.data_registro, 
        c.data_confirmacao 
    FROM confirmacoes_presenca c
    JOIN alunos a ON c.aluno_id = a.id
    JOIN usuarios u ON a.usuario_id = u.id
`;

db.all(query, [], (err, rows) => {
    if (err) {
        console.error('Erro ao consultar banco:', err.message);
        return;
    }
    
    if (rows.length === 0) {
        console.log('Nenhuma presença confirmada ainda.');
    } else {
        console.table(rows);
    }
});