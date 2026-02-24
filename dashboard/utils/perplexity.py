"""
Backward-compatibility shim — redirects to openai_llm.py.
Perplexity has been replaced with OpenAI GPT-4o-mini.
"""
from utils.openai_llm import generate_topic, fix_topic  # noqa: F401
