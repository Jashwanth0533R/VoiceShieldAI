def calculate_voice_risk(ai_probability: float) -> float:
    """
    Convert Group 1 AI probability (0.0-1.0)
    into a voice risk score (0-100).
    """

    ai_probability = max(0.0, min(1.0, ai_probability))
    return ai_probability * 100


def calculate_caller_risk(context: dict) -> float:
    """
    Calculate caller-related risk on a 0-100 scale.
    """

    caller_id = (context.get("caller_id") or "").lower()
    caller_type = (context.get("caller_type") or "").lower()
    claimed_identity = (context.get("claimed_identity") or "").lower()

    score = 0.0

    # Caller identity
    if caller_id in ("known", "trusted", "known caller"):
        score += 10
    elif caller_id in ("unknown", "", "anonymous"):
        score += 70
    else:
        score += 25

    # Caller type
    if caller_type in ("suspicious", "unknown"):
        score += 20

    # Authority impersonation
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
        score += 35

    return min(score, 100.0)


def calculate_transaction_risk(context: dict) -> float:
    """
    Calculate transaction-related risk on a 0-100 scale.
    """

    requested = bool(context.get("transaction_requested", False))
    amount = float(context.get("transaction_amount", 0) or 0)
    sensitive = bool(
        context.get("sensitive_information_requested", False)
    )

    if not requested and not sensitive:
        return 0.0

    score = 0.0

    if requested:
        # Financial transaction base risk
        score += 30

        if amount >= 1_000_000:
            score += 50
        elif amount >= 500_000:
            score += 40
        elif amount >= 100_000:
            score += 30
        elif amount >= 10_000:
            score += 20
        elif amount > 0:
            score += 10

    if sensitive:
        score += 35

    return min(score, 100.0)


def calculate_context_risk(context: dict) -> float:
    """
    Calculate contextual risk using urgency,
    unusual situations and sensitive requests.
    """

    urgency = (context.get("urgency") or "").lower()
    claimed_identity = (context.get("claimed_identity") or "").lower()
    sensitive = bool(
        context.get("sensitive_information_requested", False)
    )

    score = 0.0

    # Urgency
    urgency_scores = {
        "low": 0,
        "normal": 5,
        "medium": 20,
        "high": 35,
        "very high": 50,
        "critical": 60,
    }

    score += urgency_scores.get(urgency, 10)

    # Authority impersonation
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
        score += 20

    if sensitive:
        score += 20

    return min(score, 100.0)