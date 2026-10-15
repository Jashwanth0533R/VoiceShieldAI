# VoiceShield AI - Context Factors

## Purpose

Security decisions should use contextual information in addition to the AI-generated voice probability.

## Factors

1. **Caller identity:** known or unknown.
2. **Claimed identity:** user, employee, manager, CEO, bank employee, government official, or family member.
3. **Authority level:** low authority, employee, manager, executive, or official. High authority plus an unusual request increases impersonation risk.
4. **Request type:** normal conversation, information request, money transfer, OTP, password, PIN, bank details, account access, or sensitive document.
5. **Transaction amount:** record the requested amount; large or unusual transactions require more scrutiny.
6. **Urgency:** low, medium, or high. High urgency is a strong social-engineering indicator.
7. **Sensitive information:** OTPs, PINs, passwords, bank information, credentials, or personal documents.
8. **Unexpected request:** an unusual money transfer, password request, or document request for that caller or situation.
9. **Pressure:** immediate action, secrecy, account-blocking threats, or emergency claims.
10. **Previous interaction:** established interaction, no previous interaction, or unexpected interaction.

## Context Combination

Synthetic voice + unknown caller + CEO claim + INR 5,00,000 transfer + high urgency indicates a potentially CRITICAL situation.