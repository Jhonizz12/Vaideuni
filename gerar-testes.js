const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('./database.sqlite');

async function gerarMassaDeDados() {
    // Pega a data de hoje no formato YYYY-MM-DD
    const hoje = new Date().toISOString().split('T')[0];
    const senhaHash = await bcrypt.hash('123456', 10);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 1. Array com os ônibus de teste
        const frota = [
            ['TST-1001', 'Marcos (Teste)', 'Rota Especial 1'],
            ['TST-1002', 'Antonio (Teste)', 'Rota Especial 2'],
            ['TST-1003', 'Ronaldo (Teste)', 'Rota Especial 3']
        ];

        frota.forEach((oni, indexBus) => {
            db.run(`INSERT OR IGNORE INTO onibus (placa, motorista, rota, status) VALUES (?, ?, ?, 'Ativo')`, oni, function(err) {
                if (err) {
                    console.error("Erro ao inserir ônibus:", err.message);
                    return;
                }
                
                const onibusId = this.lastID;
                
                // 2. Loop para criar 20 alunos por ônibus
                for (let i = 1; i <= 20; i++) {
                    const num = (indexBus * 20) + i;
                    // Gera CPFs e matrículas sequenciais para não dar erro de UNIQUE
                    const cpf = `00000000${num.toString().padStart(3, '0')}`;
                    const matricula = `TESTE${num.toString().padStart(4, '0')}`;
                    
                    db.run(`INSERT OR IGNORE INTO usuarios (nome, cpf, email, senha, data_nascimento, tipo) VALUES (?, ?, ?, ?, '2000-01-01', 'ALUNO')`, 
                    [`Aluno Teste ${num}`, cpf, `aluno${num}@teste.com`, senhaHash], function(err) {
                        if (err) return;
                        
                        const usuarioId = this.lastID;
                        
                        db.run(`INSERT OR IGNORE INTO alunos (usuario_id, matricula, instituicao_ensino) VALUES (?, ?, 'Faculdade Teste')`, 
                        [usuarioId, matricula], function(err) {
                            if (err) return;
                            
                            const alunoId = this.lastID;
                            
                            // 3. Insere a confirmação de presença do aluno no ônibus e na data de hoje
                            db.run(`INSERT OR IGNORE INTO confirmacoes_presenca (aluno_id, onibus_id, data_registro, tipo_presenca) VALUES (?, ?, ?, 'IDA_VOLTA')`, 
                            [alunoId, onibusId, hoje]);
                        });
                    });
                }
            });
        });

        db.run("COMMIT", () => {
            console.log("✅ Massa de dados gerada com sucesso!");
            console.log(`Foram criados 3 ônibus e 60 presenças confirmadas para a data de hoje (${hoje}).`);
            console.log("Você já pode acessar o painel do Admin e verificar a lista de embarque.");
            db.close();
        });
    });
}

gerarMassaDeDados();