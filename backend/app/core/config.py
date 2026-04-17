from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SQLITE_PATH = BACKEND_DIR / "gestacare.db"


class Settings(BaseSettings):
    app_name: str = "GestaCare API"
    secret_key: str = "<SECRET>"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    database_url: str = f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    ai_provider: str = "ollama"
    ai_enabled: bool = True
    ai_timeout_seconds: int = 45
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_summary_model: str = "llama3.1:8b"
    ai_raw_sources_dir: str = str(Path.home() / "OneDrive" / "Documentos" / "BaseIA")
    ai_knowledge_dir: str = str(BACKEND_DIR / "app" / "ai" / "knowledge")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
