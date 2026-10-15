def generate_explanation(
    voice_risk: float,
    caller_risk: float,
    transaction_risk: float,
    context_risk: float,
    context: dict,
    ai_probability: float,
) -> list[str]:
    """Generate human-readable reasons for the risk score."""

    reasons = []

    if ai_probability >= 0.70:
        reasons.append(
            f"Synthetic voice probability is high ({ai_probability:.0%})"
        )
    elif ai_probability >= 0.40:
        reasons.append(
            f"Voice shows moderate AI-generation probability ({ai_probability:.0%})"
        )

    caller_id = (context.get("caller_id") or "").lower()
    claimed_identity = (
        context.get("claimed_identity") or ""
    ).lower()

    if caller_id in ("unknown", "", "anonymous"):
        reasons.append("Caller identity is unknown")

    if claimed_identity:
        authority_roles = {
            "ceo",
            "cfo",
            "cto",
            "director",
            "manager",
            "government official",
            "bank official",
        }

        if claimed_identity in authority_roles:
            reasons.append(
                f"Caller claims an authority identity ({context.get('claimed_identity')})"
            )

    amount = float(context.get("transaction_amount", 0) or 0)

    if context.get("transaction_requested"):
        if amount > 0:
            reasons.append(
                f"Financial transaction requested: ₹{amount:,.0f}"
            )
        else:
            reasons.append("Financial transaction requested")

    if context.get("sensitive_information_requested"):
        reasons.append("Sensitive information requested")

    urgency = (context.get("urgency") or "").lower()

    if urgency in ("high", "very high", "critical"):
        reasons.append(
            f"High urgency detected ({context.get('urgency')})"
        )

    if not reasons:
        reasons.append("No major suspicious indicators detected")

    return reasons