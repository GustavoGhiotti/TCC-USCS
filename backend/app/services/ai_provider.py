import json
import socket
from dataclasses import dataclass
from urllib import error, request

from app.core.config import settings


class AIProviderError(RuntimeError):
    pass


@dataclass
class AIProviderResult:
    payload: dict
    provider_name: str
    model_name: str


class OllamaProvider:
    provider_name = "ollama"

    def __init__(self, base_url: str | None = None, model: str | None = None):
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self.model = model or settings.ollama_model

    def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        max_output_tokens: int | None = None,
        timeout_seconds: int | None = None,
    ) -> AIProviderResult:
        options = {
            "temperature": 0.2,
            "top_p": 0.85,
            "repeat_penalty": 1.08,
            "num_ctx": settings.ollama_num_ctx,
        }
        if settings.ollama_num_thread > 0:
            options["num_thread"] = settings.ollama_num_thread
        if max_output_tokens is not None:
            options["num_predict"] = max_output_tokens

        body = {
            "model": self.model,
            "format": "json",
            "stream": False,
            "keep_alive": settings.ollama_keep_alive,
            "prompt": f"{system_prompt}\n\n{user_prompt}",
            "options": options,
        }
        req = request.Request(
            url=f"{self.base_url}/api/generate",
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=timeout_seconds or settings.ai_timeout_seconds) as response:
                raw = response.read().decode("utf-8")
        except (error.URLError, TimeoutError, socket.timeout) as exc:
            raise AIProviderError(f"Falha ao conectar no Ollama: {exc}") from exc

        try:
            data = json.loads(raw)
            model_response = data.get("response", "{}")
            payload = json.loads(model_response)
        except (json.JSONDecodeError, TypeError) as exc:
            raise AIProviderError("Resposta invalida do provedor de IA.") from exc

        return AIProviderResult(
            payload=payload,
            provider_name=self.provider_name,
            model_name=self.model,
        )

    def healthcheck(self) -> bool:
        try:
            req = request.Request(
                url=f"{self.base_url}/api/tags",
                headers={"Content-Type": "application/json"},
                method="GET",
            )
            with request.urlopen(req, timeout=min(settings.ai_timeout_seconds, 10)) as response:
                data = json.loads(response.read().decode("utf-8"))
        except (AIProviderError, error.URLError, TimeoutError, socket.timeout, json.JSONDecodeError):
            return False
        return isinstance(data, dict) and "models" in data


def get_ai_provider(*, model: str | None = None) -> OllamaProvider:
    return OllamaProvider(model=model)
