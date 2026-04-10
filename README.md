# GestaCare

Frontend React + backend FastAPI para acompanhamento de gestantes.

O projeto agora está configurado para usar **SQLite local** no backend, sem depender de Postgres online.

## Stack

- Frontend: React 18, TypeScript, Vite
- Backend: FastAPI, SQLAlchemy
- Banco local: SQLite

## Estrutura

```text
src/                    frontend
backend/                API FastAPI + banco SQLite
backend/gestacare.db    arquivo do banco local
backend/schema.sql      script SQL manual para criar as tabelas
backend/init_sqlite.py  inicialização automática do banco + seed
```

## Pré-requisitos

- Node.js 18+
- Python 3.11+ ou 3.12+

## 1. Instalar o frontend

No diretório raiz do projeto:

```powershell
npm install
```

## 2. Instalar o backend

Entre na pasta `backend`:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 3. Criar o banco SQLite local

Você tem 2 formas.

### Opção A: criação automática pelo projeto

Ainda dentro de `backend/`:

```powershell
python init_sqlite.py
```

Isso:

- cria o arquivo [`backend/gestacare.db`](/c:/Users/ghiot/OneDrive/Documentos/Programação/front_end_gestante/backend/gestacare.db)
- cria as tabelas
- insere dados iniciais de teste

### Opção B: criação manual via SQL

Se quiser criar as tabelas manualmente:

```powershell
python -m sqlite3 gestacare.db ".read schema.sql"
```

Se o comando acima não funcionar no seu Python, use um gerenciador visual como **DB Browser for SQLite** e execute o conteúdo de [`backend/schema.sql`](/c:/Users/ghiot/OneDrive/Documentos/Programação/front_end_gestante/backend/schema.sql).

## 4. Rodar o backend

Ainda em `backend/`:

```powershell
uvicorn app.main:app --reload --port 8000
```

O backend ficará em `http://localhost:8000`.

Health check:

```powershell
curl http://localhost:8000/health
```

## 5. Rodar o frontend

Na raiz do projeto:

```powershell
npm run dev
```

O frontend ficará em `http://localhost:5173`.

## Configuração usada

O frontend usa:

```env
VITE_API_URL=http://localhost:8000
```

O backend usa SQLite local por padrão:

```text
sqlite:///.../backend/gestacare.db
```

## Credenciais seed

Criadas automaticamente pelo `python init_sqlite.py` ou no startup da API:

- Médico: `doctor@gestacare.com` / `123456`
- Gestante: `patient@gestacare.com` / `123456`

## Tabelas principais

O banco local contém:

- `users`
- `gestantes`
- `consentimentos_lgpd`
- `relatos_diarios`
- `medicamentos`
- `consultas`
- `orientacoes`
- `prontuarios`
- `sinais_vitais`
- `resumos_ia`
- `alertas`
- `alertas_notas`

## Como abrir o banco e conferir os dados

### Pelo terminal

Dentro de `backend/`:

```powershell
python -m sqlite3 gestacare.db
```

Exemplos úteis:

```sql
.tables
SELECT id, email, role FROM users;
SELECT id, nome_completo, semanas_gestacao_atual FROM gestantes;
SELECT id, data_relato, humor FROM relatos_diarios ORDER BY data_relato DESC;
SELECT id, patient_name, tipo, severity, status FROM alertas;
```

Para sair:

```sql
.quit
```

### Pelo DB Browser for SQLite

1. Baixe o DB Browser for SQLite.
2. Abra o arquivo [`backend/gestacare.db`](/c:/Users/ghiot/OneDrive/Documentos/Programação/front_end_gestante/backend/gestacare.db).
3. Vá em `Browse Data` para ver e editar registros.

## Fluxos que agora usam o banco local

- login/autenticação
- dashboard da gestante
- relatos da gestante
- medicamentos da gestante
- resumos IA da gestante
- dashboard do médico
- alertas do médico
- relatórios do médico
- detalhes da paciente
- cadastro de medicamentos, prontuário e sinais vitais no fluxo médico

## Observações

- O arquivo do banco fica local na máquina, em [`backend/gestacare.db`](/c:/Users/ghiot/OneDrive/Documentos/Programação/front_end_gestante/backend/gestacare.db).
- Se quiser resetar o banco, apague `backend/gestacare.db` e execute `python init_sqlite.py` novamente.
- O backend também recria as tabelas no startup, mas `init_sqlite.py` é a forma mais direta para preparar o ambiente.
