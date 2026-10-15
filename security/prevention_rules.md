# VoiceShield AI - Prevention Rules

## Rules

1. **Unknown caller:** If an unknown caller makes an unusual request, WARN and verify independently.
2. **Synthetic voice:** If synthetic probability is high, increase scrutiny and do not trust the voice alone.
3. **CEO impersonation:** An unusual or sensitive executive request requires secondary verification or blocking, depending on severity.
4. **Money transfer:** Require additional verification. Synthetic voice, unknown caller, impersonation, or high urgency can make the case CRITICAL and require BLOCK / ESCALATE.
5. **OTP request:** Never disclose an OTP. BLOCK / ESCALATE when suspicious indicators are present.
6. **Password request:** BLOCK / ESCALATE. Never provide passwords to callers.
7. **PIN request:** BLOCK / ESCALATE. Never disclose PIN information.
8. **Sensitive documents:** An unexpected request requires secondary verification.
9. **High urgency:** Immediate-action demands, secrecy, threats, and emergency pressure increase scrutiny.
10. **Independent verification:** For HIGH or CRITICAL risk, do not authorize the action until identity and request are verified independently.

## Response Summary

LOW -> ALLOW  
MEDIUM -> WARN  
HIGH -> SECONDARY VERIFICATION  
CRITICAL -> BLOCK / ESCALATE