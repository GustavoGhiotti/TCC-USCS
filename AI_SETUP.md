# IA no projeto

## Estrategia adotada

A IA do projeto foi estruturada para:

- gerar rascunhos clinicos para revisao medica
- nunca publicar automaticamente conteudo clinico para a paciente
- funcionar com custo zero em desenvolvimento local via Ollama
- iniciar e aquecer o Ollama junto com o backend em desenvolvimento
- permitir calibracao por prompt e exemplos do dominio obstetrico

## Stack atual

- provedor padrao: `Ollama`
- modelo local atual: `llama3.2:3b`
- arquivo de calibracao: `backend/app/ai/calibration_examples.json`
- arquivo de validacao: `backend/app/ai/calibration_validation_cases.json`

## Como rodar localmente

1. Instale o Ollama:
   https://ollama.com

2. Baixe o modelo:

```bash
ollama pull llama3.2:3b
```

3. Inicie o backend normalmente. O backend tenta iniciar o Ollama sozinho se ele ainda nao estiver rodando.

4. Variaveis do backend:

```env
AI_ENABLED=true
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_SUMMARY_MODEL=llama3.2:3b
AI_TIMEOUT_SECONDS=180
AI_CHAT_TIMEOUT_SECONDS=8
AI_SUMMARY_TIMEOUT_SECONDS=8
AI_SUMMARY_USE_LLM=false
OLLAMA_AUTO_START=true
OLLAMA_BINARY_PATH=/home/ghiotti/.local/bin/ollama
OLLAMA_WARMUP_ON_STARTUP=true
OLLAMA_KEEP_ALIVE=30m
OLLAMA_NUM_CTX=1024
OLLAMA_NUM_THREAD=6
```

Se o binario `ollama` estiver no `PATH`, `OLLAMA_BINARY_PATH=ollama` tambem funciona.
O aquecimento evita que a primeira pergunta pague todo o tempo de carregamento do modelo.
`AI_CHAT_TIMEOUT_SECONDS=8` limita a espera do chat: se o Ollama passar desse tempo, o backend devolve uma resposta estruturada com o melhor trecho encontrado e a fonte.
`AI_SUMMARY_TIMEOUT_SECONDS=8` faz o mesmo para o gerador de resumos medicos: o sistema tenta polir com IA, mas preserva o resumo local se o modelo demorar.
`AI_SUMMARY_USE_LLM=false` deixa o resumo medico rapido por padrao: ele usa regras clinicas locais + trechos da base/artigos. Se quiser permitir polimento pelo Ollama, altere para `true`.

## Observacao importante

O projeto esta preparado para calibracao por prompt + exemplos.
Isso nao e o mesmo que fine-tuning supervisionado.

Para esta aplicacao, esse caminho e mais seguro porque:

- e barato
- e rapido de iterar
- reduz risco de respostas clinicas fora do escopo
- mantem o medico no loop de aprovacao

## Onde a IA entra

- `POST /resumos-ia/gerar`
- geracao de resumo preliminar para revisao medica
- saida sempre marcada como `pending` ate aprovacao
- `GET /medicos/ia/status`
- mostra se o provedor esta online, qual modelo esta ativo e quantos casos de calibracao existem
- `POST /medicos/ia/calibracao/executar`
- roda a suite de validacao para medir aderencia do semaforo e dos sintomas esperados

## Onde calibrar

- `backend/app/services/ai_calibration.py`
- `backend/app/ai/calibration_examples.json`
- `backend/app/ai/calibration_validation_cases.json`
- `backend/app/services/clinical_ai_service.py`

## Chat da gestante com base oficial

O projeto agora tambem tem um chat para duvidas da gestante em:

- `GET /chat-gestante/me`
- `GET /chat-gestante/status`
- `POST /chat-gestante/perguntar`

Esse chat:

- usa o mesmo provedor de IA do backend
- responde apenas com base nos trechos oficiais/artigos carregados
- devolve resposta `sem_base` quando os trechos encontrados nao sustentam a pergunta
- salva o historico da conversa no banco
- devolve citacoes com fonte, pagina e link quando houver
- cai para resposta segura quando a base oficial nao estiver pronta

## Como carregar os livros/manuais

1. Coloque os PDFs, `.txt` ou `.md` na pasta configurada em `AI_RAW_SOURCES_DIR`
2. No ambiente atual, ela aponta para `C:\Users\ghiot\OneDrive\Documentos\BaseIA`
3. Se quiser, marque paginas com `[[PAGE:42]]`
4. Gere os chunks:

```bash
backend\.venv\Scripts\python.exe backend/scripts/build_knowledge_chunks.py
```

5. Os arquivos gerados irao para `backend/app/ai/knowledge/`

Sem esses chunks, o chat continua funcional, mas informa que ainda nao ha base oficial suficiente para responder com seguranca.
