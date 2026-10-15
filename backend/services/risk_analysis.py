def analyze_risk(
    voice_result,
    context
):
    """
    Member 3's responsibility:
    Pass Group 1 voice result + context
    to the risk engine.

    Member 4 owns the actual risk calculations.
    """

    try:

        from risk_engine.risk_engine import calculate_risk

    except ImportError:

        raise RuntimeError(
            "Risk engine could not be imported"
        )

    result = calculate_risk(
        voice_result,
        context
    )

    if not isinstance(result, dict):

        raise ValueError(
            "Risk engine must return a dictionary"
        )

    return result