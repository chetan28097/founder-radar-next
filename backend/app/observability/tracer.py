import os
import logging
from contextlib import contextmanager
from app.config import settings

logger = logging.getLogger(__name__)

_neatlogs_initialized = False


def init_tracer():
    """
    Initialize Neatlogs auto-instrumentation and OpenInference tracing.
    Must be called before importing or dispatching calls to LiteLLM.
    """
    global _neatlogs_initialized
    if _neatlogs_initialized:
        return True

    api_key = settings.NEATLOGS_API_KEY
    if not api_key:
        logger.warning("NEATLOGS_API_KEY is not set. Neatlogs tracing is disabled.")
        return False

    try:
        import neatlogs

        neatlogs.init(
            api_key=api_key,
            workflow_name=settings.NEATLOGS_WORKFLOW,
            instrumentations=["litellm"],
        )
        _neatlogs_initialized = True
        logger.info("Neatlogs successfully initialized with LiteLLM instrumentation.")
        return True
    except Exception as exc:
        logger.error(f"Failed to initialize Neatlogs: {exc}")
        return False


def is_tracer_active() -> bool:
    return _neatlogs_initialized


@contextmanager
def trace_span(name: str, **attributes):
    """
    Context manager to wrap workflow steps into cohesive Neatlogs spans/traces.
    Gracefully falls back to a no-op context if Neatlogs is unavailable.
    """
    if not _neatlogs_initialized:
        yield None
        return

    try:
        import neatlogs

        with neatlogs.trace(name, **attributes) as span_ctx:
            yield span_ctx
    except Exception as exc:
        logger.debug(f"Trace span '{name}' execution error: {exc}")
        yield None


def flush_traces():
    if _neatlogs_initialized:
        try:
            import neatlogs
            neatlogs.flush()
        except Exception as exc:
            logger.debug(f"Neatlogs flush error: {exc}")


def shutdown_traces():
    if _neatlogs_initialized:
        try:
            import neatlogs
            neatlogs.shutdown()
        except Exception as exc:
            logger.debug(f"Neatlogs shutdown error: {exc}")
