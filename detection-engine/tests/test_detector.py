import unittest
from datetime import datetime, timezone, timedelta
from detector import analyze


class DetectorTests(unittest.TestCase):
    def setUp(self):
        self.app = {"name": "Calculator", "category": "utility", "expected_permissions": ["storage"]}
        self.now = datetime.now(timezone.utc)

    def event(self, resource="storage", authorized=True, seconds=0):
        return {"resource": resource, "authorized": authorized, "timestamp": self.now + timedelta(seconds=seconds)}

    def test_expected_authorized_access_is_trusted(self):
        result = analyze(self.app, [self.event()])
        self.assertEqual(result["score"], 100)
        self.assertEqual(result["band"], "Trusted")
        self.assertEqual(result["alerts"], [])

    def test_unexpected_granted_access_is_flagged(self):
        result = analyze(self.app, [self.event("contacts", True)])
        self.assertEqual(result["score"], 90)
        self.assertEqual(result["alerts"][0]["type"], "unnecessary_permission")

    def test_blocked_attempts_escalate(self):
        result = analyze(self.app, [self.event("camera", False, i) for i in range(3)])
        self.assertEqual(result["score"], 75)
        self.assertEqual(result["alerts"][0]["severity"], "critical")

    def test_blocked_unexpected_attempt_is_not_double_counted_as_granted_overuse(self):
        result = analyze(self.app, [self.event("contacts", False)])
        self.assertEqual(result["score"], 75)
        self.assertEqual(len(result["breakdown"]), 1)
        self.assertEqual(result["alerts"][0]["type"], "unauthorized_attempt")

    def test_burst_is_detected(self):
        result = analyze(self.app, [self.event(seconds=i) for i in range(12)])
        self.assertEqual(result["score"], 85)
        self.assertTrue(any(a["type"] == "excessive_frequency" for a in result["alerts"]))

    def test_score_is_clamped(self):
        result = analyze(self.app, [self.event(resource, False) for resource in ("camera", "location", "contacts", "microphone")])
        self.assertEqual(result["score"], 0)


if __name__ == "__main__":
    unittest.main()
