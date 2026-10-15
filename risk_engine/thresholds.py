LOW_MAX = 24
MEDIUM_MAX = 49
HIGH_MAX = 74


def get_risk_level(score: float) -> str:
    """Convert a 0-100 risk score into a risk level."""

    if score <= LOW_MAX:
        return "LOW"

    if score <= MEDIUM_MAX:
        return "MEDIUM"

    if score <= HIGH_MAX:
        return "HIGH"

    return "CRITICAL"