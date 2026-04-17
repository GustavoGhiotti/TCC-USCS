# Fontes brutas da IA

Por padrao, o projeto agora olha para a pasta configurada em `AI_RAW_SOURCES_DIR`.

No ambiente atual ela aponta para:

`C:\Users\ghiot\OneDrive\Documentos\BaseIA`

Se quiser usar outra pasta, altere `.env`.

Tambem e possivel colocar arquivos localmente aqui dentro, se preferir centralizar tudo no repositorio.

Arquivos aceitos pelo script local:

- `.txt`
- `.md`
- `.pdf`

Cabecalho opcional no inicio do arquivo:

```txt
Title: Manual de Gestacao de Alto Risco
URL: https://link-oficial
Section: Cefaleia e sinais de alerta

[[PAGE:42]]
Texto da pagina 42...

[[PAGE:43]]
Texto da pagina 43...
```

Depois execute:

```bash
backend\.venv\Scripts\python.exe backend/scripts/build_knowledge_chunks.py
```

Isso vai gerar os arquivos `.json` em `backend/app/ai/knowledge/`, que sao os trechos realmente consultados pelo chat.
