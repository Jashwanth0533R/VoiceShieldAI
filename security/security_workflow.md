# VoiceShield AI - Security Decision Workflow

## Objective

Convert voice analysis and contextual information into an appropriate security action.

## Workflow

Audio -> AI voice detection -> AI probability -> caller context -> request context -> transaction context -> risk calculation -> risk level -> security decision -> user recommendation

## Decision Levels

| Risk | Meaning | Action |
|---|---|---|
| LOW | Normal interaction with no significant suspicious indicators | ALLOW |
| MEDIUM | Suspicious indicators without a clear high-impact attack | WARN |
| HIGH | Potential impersonation, fraud, or synthetic-voice attack | SECONDARY VERIFICATION |
| CRITICAL | High-impact attack likely | BLOCK / ESCALATE |

### LOW example

Genuine voice + known caller + normal conversation + no sensitive request.

### MEDIUM example

Unknown caller + unusual request + moderate urgency.

### HIGH example

Synthetic voice + unknown caller + identity impersonation.

### CRITICAL example

Synthetic voice + unknown caller + CEO impersonation + INR 5,00,000 transfer + high urgency.

## Independent Verification

For HIGH and CRITICAL interactions, use a channel independent from the suspicious call: a known phone number, official application, official organizational contact method, or appropriate MFA.

## Important Rule

A high AI probability alone must not automatically make every interaction CRITICAL. The final decision must combine voice analysis with contextual risk factors to reduce false alarms while protecting against high-impact attacks.

## Explainability Requirements

Every HIGH or CRITICAL result should expose the AI probability, risk level, contributing risk factors, recommended action, and verification guidance.

Example:

```text
Risk level: CRITICAL
AI voice probability: 91%
Risk factors: unknown caller; CEO claim; INR 5,00,000 transfer; high urgency
Recommended action: BLOCK / ESCALATE
Guidance: Do not authorize the transfer. Verify through an independent trusted channel.
```