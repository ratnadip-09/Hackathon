"""Trust-score rules. Heuristic estimate from simulated behaviour - NOT proof an app is safe."""

# Starting values for a prototype, not industry-standard risk weights.
PENALTIES = {
    "unnecessary_permission": 10,
    "unauthorized_attempt": 25,
    "excessive_frequency": 15,
}
SCORE_MIN, SCORE_MAX = 0, 100
BANDS = [(80, "Trusted"), (50, "Medium"), (0, "Suspicious")]


def band_for(score: int) -> str:
    for floor, name in BANDS:
        if score >= floor:
            return name
    return "Suspicious"


def compute_score(breakdown: list[dict]) -> int:
    total = sum(item["penalty"] for item in breakdown)
    return max(SCORE_MIN, min(SCORE_MAX, SCORE_MAX - total))
