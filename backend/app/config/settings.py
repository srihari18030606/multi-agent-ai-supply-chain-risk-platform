from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # -----------------------------------------
    # Database
    # -----------------------------------------
    DATABASE_URL: str

    # -----------------------------------------
    # JWT
    # -----------------------------------------
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # -----------------------------------------
    # News API
    # -----------------------------------------
    NEWS_API_KEY: str = ""
    NEWS_API_BASE_URL: str = "https://newsapi.org/v2/everything"

    NEWS_SEARCH_QUERY: str = (
        "supply chain OR logistics OR shipping OR freight "
        "OR port strike OR customs OR semiconductor"
    )

    NEWS_LANGUAGE: str = "en"
    NEWS_PAGE_SIZE: int = 20

    # -----------------------------------------
    # Weather API
    # -----------------------------------------
    WEATHER_API_KEY: str = ""
    WEATHER_API_BASE_URL: str = "http://api.weatherapi.com/v1/current.json"

    DEFAULT_WEATHER_CITY: str = "Singapore"

    # -----------------------------------------
    # Event Defaults
    # -----------------------------------------
    DEFAULT_EVENT_LOCATION: str = "Unknown"
    DEFAULT_EVENT_SEVERITY: str = "Unknown"
    DEFAULT_EVENT_STATUS: str = "Active"

    # -----------------------------------------
    # Scheduler
    # -----------------------------------------
    SCHEDULER_INTERVAL_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()