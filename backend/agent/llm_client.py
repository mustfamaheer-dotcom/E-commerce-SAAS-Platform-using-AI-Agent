# backend/agent/llm_client.py
import logging
from typing import Optional, Any
from backend import config

logger = logging.getLogger(__name__)

_llm_instance = None
_streaming_llm_instance = None

def get_llm(streaming: bool = False) -> Optional[Any]:
    """
    Returns an LLM client instance (Gemini or OpenAI).
    Returns None if no API keys are provided or initialization fails,
    enabling the agent to gracefully fall back to local rule-based execution.
    """
    global _llm_instance, _streaming_llm_instance
    if streaming and _streaming_llm_instance is not None:
        return _streaming_llm_instance
    if not streaming and _llm_instance is not None:
        return _llm_instance

    llm = None
    # 1. Try Google Gemini if key is provided
    if config.GEMINI_API_KEY and config.GEMINI_API_KEY != "gemini-demo-key":
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                temperature=0.2,
                streaming=streaming,
                google_api_key=config.GEMINI_API_KEY,
            )
            logger.info("Initialized Google Gemini 1.5 Flash LLM client.")
        except Exception as e:
            logger.warning(f"Failed to initialize Gemini LLM: {e}")

    # 2. Try OpenAI / OpenRouter if Gemini not available or failed
    if llm is None and config.OPENAI_API_KEY and config.OPENAI_API_KEY != "sk-demo-key":
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.2,
                streaming=streaming,
                openai_api_key=config.OPENAI_API_KEY,
            )
            logger.info("Initialized OpenAI LLM client.")
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI LLM: {e}")

    if streaming:
        _streaming_llm_instance = llm
    else:
        _llm_instance = llm

    return llm
