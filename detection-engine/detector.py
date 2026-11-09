"""Explainable rule-based analysis of simulated app access events."""
from collections import Counter
from datetime import timedelta
from trust_score import PENALTIES, band_for, compute_score

FREQ_WINDOW = timedelta(seconds=60)
FREQ_LIMIT = 8
REPEAT_LIMIT = 3
VALID_RESOURCES = {"camera", "location", "contacts", "microphone", "storage"}


def analyze(app: dict, events: list[dict]) -> dict:
    expected = set(app["expected_permissions"])
    alerts, breakdown, recs = [], [], []

    # Count successful use of unrelated resources as over-permission use.
    unnecessary = Counter(
        e["resource"] for e in events
        if e["resource"] not in expected and e["authorized"]
    )
    for res, n in unnecessary.items():
        reason = (f"{app['name']} ({app['category']}) used {res} {n} time(s); "
                  "this resource is not expected for the app.")
        alerts.append({"type": "unnecessary_permission", "severity": "medium", "resource": res,
                       "reason": reason, "penalty": PENALTIES["unnecessary_permission"]})
        breakdown.append({"rule": "Unnecessary permission", "resource": res,
                          "penalty": PENALTIES["unnecessary_permission"], "detail": reason})
        recs.append({"action": "revoke", "resource": res,
                     "reason": f"Review or restrict {res}: unrelated to what {app['name']} does."})

    # Denied access attempts are separate from permissions that were granted.
    blocked = Counter(e["resource"] for e in events if not e["authorized"])
    for res, n in blocked.items():
        repeated = n >= REPEAT_LIMIT
        reason = (f"{n} blocked attempt(s) to access {res} without permission"
                  + (" - repeated attempts on a restricted resource." if repeated else "."))
        alerts.append({"type": "repeated_restricted_access" if repeated else "unauthorized_attempt",
                       "severity": "critical" if repeated else "high", "resource": res,
                       "reason": reason, "penalty": PENALTIES["unauthorized_attempt"]})
        breakdown.append({"rule": "Unauthorized attempt", "resource": res,
                          "penalty": PENALTIES["unauthorized_attempt"], "detail": reason})
        recs.append({"action": "keep_blocked", "resource": res,
                     "reason": f"Keep {res} blocked; the app attempted to access it without permission."})

    if events:
        latest = max(e["timestamp"] for e in events)
        recent = [e for e in events if latest - e["timestamp"] <= FREQ_WINDOW]
        if len(recent) > FREQ_LIMIT:
            reason = f"{len(recent)} access events in 60s (limit {FREQ_LIMIT})."
            alerts.append({"type": "excessive_frequency", "severity": "medium", "resource": "any",
                           "reason": reason, "penalty": PENALTIES["excessive_frequency"]})
            breakdown.append({"rule": "Excessive access frequency", "resource": "any",
                              "penalty": PENALTIES["excessive_frequency"], "detail": reason})
            recs.append({"action": "review", "resource": "any",
                         "reason": "Review why this app accesses resources so often."})

    score = compute_score(breakdown)
    return {"score": score, "band": band_for(score), "alerts": alerts,
            "breakdown": breakdown, "recommendations": recs}
