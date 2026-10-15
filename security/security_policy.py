"""
VoiceShield AI - Security Policy

Executable implementation of the security rules documented
by Member 5 in the security/ documentation.

This layer applies contextual escalation rules after the
weighted risk score has been calculated.
"""


def apply_security_policy(
    risk_level: str,
    ai_probability: float,
    context: dict,
) -> str:
    """
    Apply Member 5 security escalation rules.

    Parameters:
        risk_level:
            Risk level produced by the weighted risk engine.

        ai_probability:
            AI-generated/synthetic voice probability (0.0-1.0).

        context:
            Caller, request, transaction and urgency context.

    Returns:
        Final security risk level.
    """

    if not isinstance(context, dict):
        raise ValueError("context must be a dictionary")

    ai_probability = max(
        0.0,
        min(1.0, float(ai_probability))
    )

    caller_id = (
        context.get("caller_id") or ""
    ).lower()

    claimed_identity = (
        context.get("claimed_identity") or ""
    ).lower()

    sensitive_requested = bool(
        context.get("sensitive_information_requested", False)
    )

    transaction_requested = bool(
        context.get("transaction_requested", False)
    )

    urgency = (
        context.get("urgency") or ""
    ).lower()

    unknown_caller = caller_id in (
        "",
        "unknown",
        "anonymous",
    )

    authority_roles = {
        "ceo",
        "cfo",
        "cto",
        "director",
        "manager",
        "government official",
        "bank official",
    }

    authority_claim = claimed_identity in authority_roles

    # ---------------------------------------------------------
    # Rule 1: Unknown caller
    # ---------------------------------------------------------
    # Unknown callers require additional scrutiny.
    if unknown_caller and risk_level == "LOW":
        risk_level = "MEDIUM"

    # ---------------------------------------------------------
    # Rule 2: Synthetic voice + unknown caller +
    #          sensitive information
    # ---------------------------------------------------------
    # This is a high-confidence impersonation/social-engineering
    # combination and should be blocked/escalated.
    if (
        ai_probability >= 0.70
        and unknown_caller
        and sensitive_requested
    ):
        risk_level = "CRITICAL"

    # ---------------------------------------------------------
    # Rule 3: Synthetic voice + money transfer
    # ---------------------------------------------------------
    # Member 5 documentation states that synthetic voice,
    # impersonation, unknown caller or high urgency can make
    # financial requests critical.
    if ai_probability >= 0.70 and transaction_requested:
        risk_level = "CRITICAL"

    # ---------------------------------------------------------
    # Rule 4: Synthetic voice + authority impersonation
    # ---------------------------------------------------------
    # Potential executive/official impersonation requires
    # elevated scrutiny.
    if ai_probability >= 0.70 and authority_claim:
        if risk_level == "LOW":
            risk_level = "HIGH"
        elif risk_level == "MEDIUM":
            risk_level = "HIGH"

    # ---------------------------------------------------------
    # Rule 5: Authority impersonation + sensitive request
    # ---------------------------------------------------------
    if authority_claim and sensitive_requested:
        if risk_level in ("LOW", "MEDIUM"):
            risk_level = "HIGH"

    # ---------------------------------------------------------
    # Rule 6: High urgency increases scrutiny
    # ---------------------------------------------------------
    # Do not independently make every urgent request critical.
    # Urgency is used as a contextual escalation factor.
    if urgency in ("very high", "critical"):
        if risk_level == "LOW":
            risk_level = "MEDIUM"

    return risk_level