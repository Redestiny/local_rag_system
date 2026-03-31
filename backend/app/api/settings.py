from fastapi import APIRouter, Depends, HTTPException

from ..core.exceptions import LLMError
from ..schemas.pydantic import LLMSettings, LLMSettingsResponse, OllamaModelsResponse
from ..services.llm_settings import LLMSettingsService

router = APIRouter()


def get_llm_settings_service() -> LLMSettingsService:
    from ..main import llm_settings_service
    return llm_settings_service


@router.get("/llm", response_model=LLMSettingsResponse)
def get_llm_settings(
    settings_service: LLMSettingsService = Depends(get_llm_settings_service),
):
    settings_payload = settings_service.load_settings()
    return LLMSettingsResponse(
        settings=settings_payload,
        provider_catalog=settings_service.get_provider_catalog(),
    )


@router.put("/llm", response_model=LLMSettingsResponse)
def update_llm_settings(
    llm_settings: LLMSettings,
    settings_service: LLMSettingsService = Depends(get_llm_settings_service),
):
    try:
        saved = settings_service.save_settings(llm_settings)
    except LLMError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return LLMSettingsResponse(
        settings=saved,
        provider_catalog=settings_service.get_provider_catalog(),
    )


@router.get("/ollama/models", response_model=OllamaModelsResponse)
def get_ollama_models(
    settings_service: LLMSettingsService = Depends(get_llm_settings_service),
):
    try:
        models = settings_service.get_ollama_models()
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return OllamaModelsResponse(models=models)
