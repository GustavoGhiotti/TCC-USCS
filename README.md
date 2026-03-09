# Sistema de Monitoramento de Gestantes - Frontend

Projeto TCC para um sistema inteligente de acompanhamento gestacional com analise de IA.

## Como Iniciar

### Pre-requisitos
- Node.js 16+ instalado
- npm ou yarn

### Instalacao

1. Extraia a pasta do projeto
2. Entre na pasta do projeto:
   ```bash
   cd monitoramento-gestantes
   ```

3. Instale as dependencias:
   ```bash
   npm install
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Abra no navegador: `http://localhost:5173`

## Credenciais de Teste

### Gestante
- Email: `gestante@example.com`
- Role: `gestante`

### Medico
- Email: `medico@example.com`
- Role: `medico`

## Estrutura do Projeto

```text
src/
  components/     # Componentes React reutilizaveis
  pages/          # Paginas/telas principais
  routes/         # Configuracao de rotas
  services/       # Logica de integracao
  types/          # Tipos TypeScript
  main.tsx        # Entrada da aplicacao
```

## Stack Tecnologico

- React 18
- TypeScript
- React Router
- Tailwind CSS
- Vite

## Proximos Passos

- [ ] Implementar formulario de Novo Relato
- [ ] Criar tela de Resumos da IA
- [ ] Adicionar sistema de notificacoes
- [ ] Integracao com backend real
- [ ] Testes unitarios

## Backend FastAPI (fase inicial real)

Foi adicionada a pasta `backend/` com API para autenticacao, perfil gestante e LGPD.

Endpoints implementados:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /gestantes/me`
- `PUT /gestantes/me`
- `GET /consentimentos/me`
- `POST /consentimentos/me`
- `POST /relatos`
- `GET /relatos/me`
- `GET /relatos/me/{id}`

Para subir o backend:
1. `cd backend`
2. `pip install -r requirements.txt`
3. `uvicorn app.main:app --reload --port 8000`

Credenciais seed:
- `doctor@gestacare.com` / `123456`
- `patient@gestacare.com` / `123456`
