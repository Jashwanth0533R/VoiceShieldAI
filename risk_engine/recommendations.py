def get_recommendation(risk_level: str) -> str:
    """Return the recommended security action."""

    recommendations = {
        "LOW": "ALLOW",
        "MEDIUM": "WARN",
        "HIGH": "SECONDARY VERIFICATION",
        "CRITICAL": "BLOCK / ESCALATE",
    }

    return recommendations.get(
        risk_level,
        "SECONDARY VERIFICATION"
    )