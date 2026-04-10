PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gestantes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  nome_completo TEXT NOT NULL,
  data_nascimento DATE,
  telefone TEXT,
  dum DATE,
  dpp DATE,
  tipo_sanguineo TEXT,
  semanas_gestacao_atual INTEGER,
  observacoes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS consentimentos_lgpd (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  aceito INTEGER NOT NULL DEFAULT 1,
  versao_termo TEXT NOT NULL,
  aceito_em DATETIME NOT NULL,
  ip_origem TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS relatos_diarios (
  id TEXT PRIMARY KEY,
  gestante_id TEXT NOT NULL,
  data_relato DATE NOT NULL,
  humor TEXT NOT NULL,
  sintomas_json TEXT NOT NULL DEFAULT '[]',
  descricao TEXT,
  pressao_sistolica INTEGER,
  pressao_diastolica INTEGER,
  frequencia_cardiaca INTEGER,
  saturacao_oxigenio INTEGER,
  peso_kg REAL,
  temperatura_c REAL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gestante_id) REFERENCES gestantes (id),
  CONSTRAINT uq_relato_gestante_data UNIQUE (gestante_id, data_relato)
);

CREATE TABLE IF NOT EXISTS medicamentos (
  id TEXT PRIMARY KEY,
  gestante_id TEXT NOT NULL,
  medico_id TEXT,
  nome TEXT NOT NULL,
  dosagem TEXT NOT NULL,
  frequencia TEXT NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  ativo INTEGER NOT NULL DEFAULT 1,
  observacoes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gestante_id) REFERENCES gestantes (id),
  FOREIGN KEY (medico_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS consultas (
  id TEXT PRIMARY KEY,
  gestante_id TEXT NOT NULL,
  medico_id TEXT,
  data_hora DATETIME NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendada',
  local TEXT,
  observacoes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gestante_id) REFERENCES gestantes (id),
  FOREIGN KEY (medico_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS orientacoes (
  id TEXT PRIMARY KEY,
  gestante_id TEXT NOT NULL,
  medico_id TEXT,
  data DATETIME NOT NULL,
  texto TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'normal',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gestante_id) REFERENCES gestantes (id),
  FOREIGN KEY (medico_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS prontuarios (
  id TEXT PRIMARY KEY,
  gestante_id TEXT NOT NULL,
  medico_id TEXT,
  data DATETIME NOT NULL,
  descricao TEXT NOT NULL,
  medicamentos_prescritos_json TEXT NOT NULL DEFAULT '[]',
  acoes_realizadas TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gestante_id) REFERENCES gestantes (id),
  FOREIGN KEY (medico_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS sinais_vitais (
  id TEXT PRIMARY KEY,
  gestante_id TEXT NOT NULL,
  data_registro DATETIME NOT NULL,
  pressao_sistolica INTEGER,
  pressao_diastolica INTEGER,
  frequencia_cardiaca INTEGER,
  saturacao_oxigenio INTEGER,
  peso_kg INTEGER,
  temperatura_c INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gestante_id) REFERENCES gestantes (id)
);

CREATE TABLE IF NOT EXISTS resumos_ia (
  id TEXT PRIMARY KEY,
  gestante_id TEXT NOT NULL,
  periodo_inicio DATETIME NOT NULL,
  periodo_fim DATETIME NOT NULL,
  resumo_texto TEXT NOT NULL,
  nivel_alerta TEXT NOT NULL DEFAULT 'verde',
  sintomas_identificados_json TEXT NOT NULL DEFAULT '[]',
  avisos_json TEXT NOT NULL DEFAULT '[]',
  recomendacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resumo_aprovado_texto TEXT,
  recomendacoes_aprovadas TEXT,
  revisado_por_medico_id TEXT,
  revisado_em DATETIME,
  gerado_em DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gestante_id) REFERENCES gestantes (id),
  FOREIGN KEY (revisado_por_medico_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS alertas (
  id TEXT PRIMARY KEY,
  gestante_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_ig TEXT,
  tipo TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metric_label TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  created_at_event DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gestante_id) REFERENCES gestantes (id)
);

CREATE TABLE IF NOT EXISTS alertas_notas (
  id TEXT PRIMARY KEY,
  alerta_id TEXT NOT NULL,
  text TEXT NOT NULL,
  author_name TEXT NOT NULL,
  created_at_note DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alerta_id) REFERENCES alertas (id)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_gestantes_user_id ON gestantes (user_id);
CREATE INDEX IF NOT EXISTS idx_consentimentos_user_id ON consentimentos_lgpd (user_id);
CREATE INDEX IF NOT EXISTS idx_relatos_gestante_id ON relatos_diarios (gestante_id);
CREATE INDEX IF NOT EXISTS idx_relatos_data_relato ON relatos_diarios (data_relato);
CREATE INDEX IF NOT EXISTS idx_medicamentos_gestante_id ON medicamentos (gestante_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_medico_id ON medicamentos (medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_gestante_id ON consultas (gestante_id);
CREATE INDEX IF NOT EXISTS idx_consultas_medico_id ON consultas (medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data_hora ON consultas (data_hora);
CREATE INDEX IF NOT EXISTS idx_orientacoes_gestante_id ON orientacoes (gestante_id);
CREATE INDEX IF NOT EXISTS idx_orientacoes_medico_id ON orientacoes (medico_id);
CREATE INDEX IF NOT EXISTS idx_orientacoes_data ON orientacoes (data);
CREATE INDEX IF NOT EXISTS idx_prontuarios_gestante_id ON prontuarios (gestante_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_medico_id ON prontuarios (medico_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_data ON prontuarios (data);
CREATE INDEX IF NOT EXISTS idx_sinais_vitais_gestante_id ON sinais_vitais (gestante_id);
CREATE INDEX IF NOT EXISTS idx_sinais_vitais_data_registro ON sinais_vitais (data_registro);
CREATE INDEX IF NOT EXISTS idx_resumos_ia_gestante_id ON resumos_ia (gestante_id);
CREATE INDEX IF NOT EXISTS idx_resumos_ia_gerado_em ON resumos_ia (gerado_em);
CREATE INDEX IF NOT EXISTS idx_alertas_gestante_id ON alertas (gestante_id);
CREATE INDEX IF NOT EXISTS idx_alertas_severity ON alertas (severity);
CREATE INDEX IF NOT EXISTS idx_alertas_status ON alertas (status);
CREATE INDEX IF NOT EXISTS idx_alertas_created_at_event ON alertas (created_at_event);
CREATE INDEX IF NOT EXISTS idx_alertas_notas_alerta_id ON alertas_notas (alerta_id);
CREATE INDEX IF NOT EXISTS idx_alertas_notas_created_at_note ON alertas_notas (created_at_note);
