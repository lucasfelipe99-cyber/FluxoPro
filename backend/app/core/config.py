from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Fluxo Caixa Empresarial"
    database_url: str = "sqlite:///./finance.db"
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 720
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    app_base_url: str = "http://localhost:5173"
    api_base_url: str = "http://localhost:8000/api"
    admin_email: str = ""
    admin_password: str = ""
    mercado_pago_access_token: str = ""
    mercado_pago_monthly_price: float = 29.90
    mercado_pago_annual_price: float = 299.90
    mercado_pago_plan_title: str = "Fluxo Caixa Empresarial"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
