# Base de conhecimento do chat da gestante

Esta pasta recebe os `.json` gerados automaticamente a partir da bibliografia oficial.

No ambiente atual, a origem configurada esta em:

`C:\Users\ghiot\OneDrive\Documentos\BaseIA`

Para gerar os chunks a partir dessa pasta:

```bash
backend\.venv\Scripts\python.exe backend/scripts/build_knowledge_chunks.py
```

Tambem e possivel adicionar aqui arquivos `.json` manualmente, se precisar.

Formato aceito:

```json
[
  {
    "title": "Manual de Gestacao de Alto Risco",
    "page": 42,
    "url": "https://link-oficial",
    "section": "Cefaleia na gestacao",
    "content": "Trecho literal ou resumido do material oficial."
  }
]
```

Tambem e aceito:

```json
{
  "chunks": [
    {
      "title": "Cartao de Pre-Natal",
      "page": 3,
      "url": "https://link-oficial",
      "section": "Vacinas",
      "content": "Trecho correspondente."
    }
  ]
}
```

Sem esses arquivos, o chat permanece funcional, mas respondera que a base oficial ainda nao foi carregada suficientemente.
