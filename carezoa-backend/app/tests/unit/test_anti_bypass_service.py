"""Anti-bypass scanning: flags for review, scrubs stored bodies, never blocks clean chat."""

import unittest

from app.services.anti_bypass_service import MASK, scan_message, scrub_text


class Detection(unittest.TestCase):
    def test_phone_flagged_high(self):
        r = scan_message("Please call me directly on 9437100000")
        self.assertTrue(r.flagged)
        self.assertIn("phone_number", r.patterns)
        self.assertEqual(r.severity, "medium")  # 0.6 alone is medium
        self.assertIn(MASK, r.scrubbed)

    def test_phone_plus_social_escalates_to_high(self):
        r = scan_message("my number is 9437100000, whatsapp me anytime")
        self.assertTrue(r.flagged)
        self.assertEqual(r.severity, "high")
        self.assertIn("phone_number", r.patterns)
        self.assertIn("social_handle", r.patterns)

    def test_email_and_upi(self):
        r = scan_message("mail x.z@gmail.com or pay a@okhdfc")
        self.assertTrue(r.flagged)
        self.assertIn("email", r.patterns)
        self.assertIn("upi_or_payment", r.patterns)
        self.assertEqual(r.severity, "high")

    def test_clean_clinical_chat_passes(self):
        r = scan_message("Please give the 08:00 dose before breakfast and record BP")
        self.assertFalse(r.flagged)
        self.assertIsNone(r.severity)
        self.assertEqual(r.scrubbed, "Please give the 08:00 dose before breakfast and record BP")

    def test_scrub_preserves_surrounding_text(self):
        r = scrub_text("reach me at 94371-00000 after 6pm")
        self.assertIn(MASK, r)
        self.assertIn("after 6pm", r)


if __name__ == "__main__":
    unittest.main()
