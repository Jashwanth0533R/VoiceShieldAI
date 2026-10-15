from risk_engine.risk_factors import (
    calculate_voice_risk,
    calculate_caller_risk,
    calculate_transaction_risk,
    calculate_context_risk,
)

from risk_engine.thresholds import get_risk_level

from risk_engine.recommendations import get_recommendation

from risk_engine.explanations import generate_explanation

from security.security_policy import apply_security_policy

VOICE_WEIGHT = 0.40
CALLER_WEIGHT = 0.20
TRANSACTION_WEIGHT = 0.25
CONTEXT_WEIGHT = 0.15


def calculate_risk(
    voice_result: dict,
    context: dict
) -> dict:
    """
    Calculate the final VoiceShield security risk.

    Parameters:
        voice_result: Output from Group 1 voice analysis.
        context: Caller, transaction and conversation context.

    Returns:
        Dictionary containing risk score, level,
        risk factors, explanation and recommendation.
    """

    if not isinstance(voice_result, dict):
        raise ValueError("voice_result must be a dictionary")

    if not isinstance(context, dict):
        raise ValueError("context must be a dictionary")

    ai_probability = float(
        voice_result.get("ai_probability", 0.0)
    )

    ai_probability = max(
        0.0,
        min(1.0, ai_probability)
    )

    voice_risk = calculate_voice_risk(
        ai_probability
    )

    caller_risk = calculate_caller_risk(
        context
    )

    transaction_risk = calculate_transaction_risk(
        context
    )

    context_risk = calculate_context_risk(
        context
    )

    final_score = (
        VOICE_WEIGHT * voice_risk
        + CALLER_WEIGHT * caller_risk
        + TRANSACTION_WEIGHT * transaction_risk
        + CONTEXT_WEIGHT * context_risk
    )

    final_score = round(
        max(0.0, min(100.0, final_score)),
        2
    )

    risk_level = get_risk_level(final_score)

    # Apply Member 5 security policy.
    # The weighted risk score provides the baseline decision,
    # while contextual security rules handle dangerous combinations.
    risk_level = apply_security_policy(
        risk_level=risk_level,
        ai_probability=ai_probability,
        context=context,
    )

    recommendation = get_recommendation(
        risk_level
    )

    explanation = generate_explanation(
        voice_risk=voice_risk,
        caller_risk=caller_risk,
        transaction_risk=transaction_risk,
        context_risk=context_risk,
        context=context,
        ai_probability=ai_probability,
    )

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "recommendation": recommendation,
        "risk_factors": {
            "voice_risk": round(voice_risk, 2),
            "caller_risk": round(caller_risk, 2),
            "transaction_risk": round(transaction_risk, 2),
            "context_risk": round(context_risk, 2),
        },
        "explanation": explanation,
    }