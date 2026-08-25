// seed.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Caminho para o banco e para o schema
const dbPath = path.resolve(__dirname, 'database.sqlite');
const schemaPath = path.resolve(__dirname, 'src/config/schema.sql');

// Inicia a conexão
const db = new sqlite3.Database(dbPath);

async function rodarSeed() {
    console.log('Iniciando a configuração do Banco de Dados...');

    try {
        // 1. Lê e executa o schema.sql para criar as tabelas
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        db.exec(schema, async (err) => {
            if (err) {
                console.error('❌ Erro ao criar as tabelas:', err.message);
                return;
            }
            console.log('✅ Tabelas criadas com sucesso.');

            // 2. Gera o hash da senha padrão (123456)
            const senhaHash = await bcrypt.hash('123456', 10);
            const senhaAdmin = await bcrypt.hash('Adm@vs', 10);

            // 3. Injeta o Administrador de Teste
            db.run(`INSERT INTO usuarios (nome, cpf, email, senha, data_nascimento, tipo) 
                    VALUES ('Admin Silva', '00000000000', 'admin@varresai.rj.gov.br', ?, '1980-05-10', 'ADMIN')`, [senhaAdmin], function(err) {
                if (!err) {
                    db.run(`INSERT INTO administradores (usuario_id, endereco) VALUES (?, 'Centro, Varre-Sai')`, [this.lastID]);
                    console.log('✅ Administrador de teste criado (CPF: 00000000000).');
                }
            });

            // 4. Injeta o Aluno de Teste (João Paulo, do protótipo)
            db.run(`INSERT INTO usuarios (nome, cpf, email, senha, data_nascimento, tipo) 
                    VALUES ('João Paulo', '11111111111', 'joao@ufes.br', ?, '2002-10-15', 'ALUNO')`, [senhaHash], function(err) {
                if (!err) {
                    const usuarioAlunoId = this.lastID;
                    db.run(`INSERT INTO alunos (usuario_id, matricula, instituicao_ensino) VALUES (?, '202319700084', 'Sistemas de Informação')`, [usuarioAlunoId], function(err) {
                        if (!err) {
                            const alunoIdTabela = this.lastID;
                            // Gera a carteirinha do aluno
                            db.run(`INSERT INTO carteirinhas_virtuais (aluno_id, codigo_identificacao, data_emissao) VALUES (?, '2023123456', '2026-08-18')`, [alunoIdTabela]);
                            console.log('✅ Aluno de teste criado (CPF: 11111111111).');
                        }
                    });
                }
            });
        });
    } catch (erro) {
        console.error('❌ Erro durante a leitura do Schema:', erro.message);
    }
}

rodarSeed();