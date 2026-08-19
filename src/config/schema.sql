-- src/config/schema.sql

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL, 
    data_nascimento DATE NOT NULL,
    ativo BOOLEAN DEFAULT 1, 
    tipo TEXT NOT NULL CHECK(tipo IN ('ALUNO', 'ADMIN'))
);

CREATE TABLE IF NOT EXISTS administradores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    endereco TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS alunos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    matricula TEXT UNIQUE NOT NULL, 
    telefone TEXT,
    instituicao_ensino TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS carteirinhas_virtuais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id INTEGER NOT NULL UNIQUE,
    codigo_identificacao TEXT UNIQUE NOT NULL,
    data_emissao DATE NOT NULL,
    ativa BOOLEAN DEFAULT 1,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id)
);

CREATE TABLE IF NOT EXISTS onibus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    placa TEXT UNIQUE NOT NULL,
    motorista TEXT NOT NULL,
    rota TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Ativo'
);

CREATE TABLE IF NOT EXISTS confirmacoes_presenca (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id INTEGER NOT NULL,
    onibus_id INTEGER NOT NULL,
    data_registro DATE NOT NULL,
    tipo_presenca TEXT NOT NULL CHECK(tipo_presenca IN ('IDA_VOLTA', 'APENAS_IDA', 'APENAS_VOLTA')),
    data_confirmacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    FOREIGN KEY (onibus_id) REFERENCES onibus(id)
);

CREATE TABLE IF NOT EXISTS notificacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    data_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tempo_expiracao DATETIME NOT NULL,
    ativa BOOLEAN DEFAULT 1,
    autor_id INTEGER NOT NULL,
    FOREIGN KEY (autor_id) REFERENCES administradores(id)
);

CREATE TABLE IF NOT EXISTS dias_calendario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dia_semana TEXT NOT NULL,
    horario_saida TEXT NOT NULL,
    horario_volta TEXT NOT NULL,
    observacao TEXT,
    onibus_id INTEGER NOT NULL,
    FOREIGN KEY (onibus_id) REFERENCES onibus(id)
);

-- NOVA TABELA: Feriados e Exceções (Dias sem ônibus)
CREATE TABLE IF NOT EXISTS dias_sem_onibus (
    data_exata DATE PRIMARY KEY,
    motivo TEXT NOT NULL
);