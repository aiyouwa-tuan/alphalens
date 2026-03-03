from typing import Any, Optional

from langchain_google_genai import ChatGoogleGenerativeAI

from .base_client import BaseLLMClient
from .validators import validate_model


class NormalizedChatGoogleGenerativeAI(ChatGoogleGenerativeAI):
    """ChatGoogleGenerativeAI with normalized content output.

    Gemini 3 models return content as list: [{'type': 'text', 'text': '...'}]
    This normalizes to string for consistent downstream handling.
    """

    def _normalize_content(self, response):
        content = response.content
        if isinstance(content, list):
            texts = []
            for item in content:
                if isinstance(item, dict) and "text" in item:
                    texts.append(str(item["text"]))
                elif isinstance(item, str):
                    texts.append(item)
            response.content = "".join(texts)
        return response

    def invoke(self, input, config=None, **kwargs):
        resp = super().invoke(input, config, **kwargs)
        return self._normalize_content(resp)

    def stream(self, input, config=None, **kwargs):
        for chunk in super().stream(input, config, **kwargs):
            yield self._normalize_content(chunk)

    async def astream(self, input, config=None, **kwargs):
        async for chunk in super().astream(input, config, **kwargs):
            yield self._normalize_content(chunk)


class GoogleClient(BaseLLMClient):
    """Client for Google Gemini models."""

    def __init__(self, model: str, base_url: Optional[str] = None, **kwargs):
        super().__init__(model, base_url, **kwargs)

    def get_llm(self) -> Any:
        """Return configured ChatGoogleGenerativeAI instance."""
        llm_kwargs = {"model": self.model}

        for key in ("timeout", "max_retries", "google_api_key", "callbacks", "max_tokens"):
            if key in self.kwargs:
                target_key = "max_output_tokens" if key == "max_tokens" else key
                llm_kwargs[target_key] = self.kwargs[key]

        # Add robust default retries for Gemini 503 availability issues
        if "max_retries" not in llm_kwargs:
            llm_kwargs["max_retries"] = 5

        # Map thinking_level to appropriate API param based on model
        # Gemini 3 Pro: low, high
        # Gemini 3 Flash: minimal, low, medium, high
        # Gemini 2.5: thinking_budget (0=disable, -1=dynamic)
        thinking_level = self.kwargs.get("thinking_level")
        if thinking_level:
            model_lower = self.model.lower()
            if "gemini-3" in model_lower:
                # Gemini 3 Pro doesn't support "minimal", use "low" instead
                if "pro" in model_lower and thinking_level == "minimal":
                    thinking_level = "low"
                llm_kwargs["thinking_level"] = thinking_level
            else:
                # Gemini 2.5: map to thinking_budget
                llm_kwargs["thinking_budget"] = -1 if thinking_level == "high" else 0

        # Gemini 3: Langchain doesn't currently inject thought_signature
        # into function calls, which causes the API to reject the request with 400 Bad Request.
        # We will flag this instance so that tools are bypassed downstream.
        is_gemini_3 = "gemini-3" in self.model.lower()

        llm = NormalizedChatGoogleGenerativeAI(**llm_kwargs)
        llm._is_gemini_3 = is_gemini_3
        return llm

    def validate_model(self) -> bool:
        """Validate model for Google."""
        return validate_model("google", self.model)
