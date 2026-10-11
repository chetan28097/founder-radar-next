from app.observability.tracer import init_tracer, trace_span, is_tracer_active


def test_neatlogs_tracer_initialization_and_span():
    # Tracer init should return a boolean and not crash
    result = init_tracer()
    assert isinstance(result, bool)

    # trace_span context manager should execute cleanly without exceptions
    with trace_span("test_custom_workflow_span", key="value") as span:
        executed = True

    assert executed is True
