"""Runtime settings loaded from environment variables (spec §14.2).

The AI service reads the same shared environment as the rest of the monorepo.
Values are case-insensitive, so `DATABASE_URL` populates `database_url`.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str
    ai_service_secret: str
    openai_api_key: str
    anthropic_api_key: str

    # Embeddings — text-embedding-3-small / 1536 dims (spec §5.3).
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    embedding_batch_size: int = 100
    embedding_max_chars: int = 24000

    # LLM selection per task (spec §5.4).
    research_model: str = "claude-3-5-sonnet-20241022"
    contract_model: str = "claude-3-5-sonnet-20241022"
    chat_model: str = "claude-3-5-haiku-20241022"
    summarise_model: str = "claude-3-5-haiku-20241022"
    proofread_model: str = "claude-3-5-haiku-20241022"

    research_max_tokens: int = 4096
    chat_max_tokens: int = 2048
    document_max_tokens: int = 4096

    # Retrieval defaults (spec §5.2).
    retrieval_limit: int = 12
    context_chunks_quick: int = 8
    context_chunks_deep: int = 12

    db_pool_min_size: int = 1
    db_pool_max_size: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
