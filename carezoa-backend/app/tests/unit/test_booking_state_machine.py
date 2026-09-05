"""Happy path + every exception state for the booking state machine (pure)."""

import unittest

from app.state_machines.booking_state_machine import (
    ActorRole,
    BookingStatus,
    Event,
    GuardFailed,
    TransitionContext,
    TransitionError,
    allowed_events,
    assert_transition,
    is_terminal,
)

PATIENT = TransitionContext(actor_role=ActorRole.PATIENT)


class HappyPath(unittest.TestCase):
    def test_full_visiting_flow(self):
        plan = assert_transition(BookingStatus.PENDING_PAYMENT, Event.PAYMENT_SUCCEEDED, PATIENT)
        self.assertEqual(plan.to_status, BookingStatus.CONFIRMED)
        self.assertEqual(plan.stamp_field, "confirmed_at")
        self.assertIn("notify_provider_new_booking", plan.effects)

        plan = assert_transition(BookingStatus.CONFIRMED, Event.PROVIDER_DEPARTED, PATIENT)
        self.assertEqual(plan.to_status, BookingStatus.EN_ROUTE)
        self.assertIn("issue_checkin_otp", plan.effects)

        plan = assert_transition(
            BookingStatus.EN_ROUTE,
            Event.OTP_VERIFIED,
            TransitionContext(
                actor_role=ActorRole.PROVIDER, expected_otp="4821", provided_otp="4821"
            ),
        )
        self.assertEqual(plan.to_status, BookingStatus.CHECKED_IN)
        self.assertEqual(plan.stamp_field, "checked_in_at")

        plan = assert_transition(BookingStatus.CHECKED_IN, Event.SERVICE_STARTED, PATIENT)
        self.assertEqual(plan.to_status, BookingStatus.IN_SERVICE)

        plan = assert_transition(BookingStatus.IN_SERVICE, Event.SERVICE_COMPLETED, PATIENT)
        self.assertEqual(plan.to_status, BookingStatus.COMPLETED)
        self.assertIn("request_service_report", plan.effects)
        self.assertTrue(is_terminal(BookingStatus.COMPLETED))

    def test_terminal_states_reject_everything(self):
        for status in (BookingStatus.COMPLETED, BookingStatus.CANCELLED):
            for event in Event:
                with self.assertRaises(TransitionError):
                    assert_transition(status, event, PATIENT)


class OtpGuards(unittest.TestCase):
    def test_wrong_otp_rejected(self):
        with self.assertRaises(GuardFailed) as ctx:
            assert_transition(
                BookingStatus.EN_ROUTE,
                Event.OTP_VERIFIED,
                TransitionContext(
                    actor_role=ActorRole.PROVIDER, expected_otp="4821", provided_otp="0000"
                ),
            )
        self.assertIn("Incorrect check-in code", str(ctx.exception))

    def test_otp_before_issue_rejected(self):
        with self.assertRaises(GuardFailed):
            assert_transition(
                BookingStatus.EN_ROUTE,
                Event.OTP_VERIFIED,
                TransitionContext(actor_role=ActorRole.PROVIDER, provided_otp="4821"),
            )


class CancellationAndReschedule(unittest.TestCase):
    def test_cancel_confirmed_fires_refund_effect(self):
        plan = assert_transition(
            BookingStatus.CONFIRMED,
            Event.CANCEL,
            TransitionContext(actor_role=ActorRole.PATIENT, hours_until_start=24),
        )
        self.assertEqual(plan.to_status, BookingStatus.CANCELLED)
        self.assertIn("initiate_refund_if_paid", plan.effects)

    def test_cancel_en_route_invalid(self):
        with self.assertRaises(TransitionError):
            assert_transition(BookingStatus.EN_ROUTE, Event.CANCEL, PATIENT)

    def test_cancel_inside_notice_window_guard(self):
        with self.assertRaises(GuardFailed):
            assert_transition(
                BookingStatus.CONFIRMED,
                Event.CANCEL,
                TransitionContext(actor_role=ActorRole.PATIENT, hours_until_start=1),
            )

    def test_reschedule_allowed_with_notice(self):
        plan = assert_transition(
            BookingStatus.CONFIRMED,
            Event.RESCHEDULE,
            TransitionContext(actor_role=ActorRole.PATIENT, hours_until_start=10),
        )
        self.assertEqual(plan.to_status, BookingStatus.CONFIRMED)
        self.assertIn("notify_provider_rescheduled", plan.effects)


class ExceptionStates(unittest.TestCase):
    def test_provider_no_show(self):
        plan = assert_transition(BookingStatus.CONFIRMED, Event.PROVIDER_NO_SHOW, PATIENT)
        self.assertEqual(plan.to_status, BookingStatus.NO_SHOW)
        self.assertIn("alert_support", plan.effects)

    def test_incident_moves_to_disputed(self):
        for status in (
            BookingStatus.EN_ROUTE,
            BookingStatus.CHECKED_IN,
            BookingStatus.IN_SERVICE,
        ):
            plan = assert_transition(status, Event.INCIDENT_RAISED, PATIENT)
            self.assertEqual(plan.to_status, BookingStatus.DISPUTED)

    def test_dispute_resolution_requires_support_role(self):
        with self.assertRaises(GuardFailed):
            assert_transition(
                BookingStatus.DISPUTED,
                Event.DISPUTE_RESOLVED,
                TransitionContext(actor_role=ActorRole.PATIENT, resolution="completed"),
            )

    def test_dispute_resolution_maps_to_resolved_status(self):
        plan = assert_transition(
            BookingStatus.DISPUTED,
            Event.DISPUTE_RESOLVED,
            TransitionContext(actor_role=ActorRole.SUPPORT_AGENT, resolution="cancelled"),
        )
        self.assertEqual(plan.to_status, BookingStatus.CANCELLED)

    def test_unknown_event_rejected(self):
        with self.assertRaises(TransitionError):
            assert_transition(BookingStatus.PENDING_PAYMENT, Event.SERVICE_COMPLETED, PATIENT)

    def test_allowed_events_list(self):
        self.assertIn(Event.PAYMENT_SUCCEEDED, allowed_events(BookingStatus.PENDING_PAYMENT))
        self.assertNotIn(Event.OTP_VERIFIED, allowed_events(BookingStatus.CONFIRMED))


if __name__ == "__main__":
    unittest.main()
