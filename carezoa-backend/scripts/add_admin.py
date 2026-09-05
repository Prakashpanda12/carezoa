"""
Add admin user to an existing Carezoa database.

Usage:
  python -m scripts.add_admin                          # default: +919999999999
  python -m scripts.add_admin --phone +919876543210    # custom phone

Then login with that phone + OTP 123456 (dev/sandbox mode).
"""

from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.core.security import Role
from app.db.session import SessionFactory
from app.models.user import User


async def add_admin(phone: str = "+919999999999") -> None:
    async with SessionFactory() as s:
        existing = (
            await s.execute(select(User).where(User.phone == phone))
        ).scalar_one_or_none()

        if existing:
            existing.role = Role.ADMIN
            existing.mfa_enabled = True
            existing.is_active = True
            await s.commit()
            print(f"Updated existing user {phone} → role=admin, mfa_enabled=True")
        else:
            user = User(phone=phone, role=Role.ADMIN, mfa_enabled=True)
            s.add(user)
            await s.commit()
            print(f"Created admin user: {phone}")

        print(f"\nLogin to admin console:")
        print(f"  Phone: {phone}")
        print(f"  OTP:   123456  (dev/sandbox mode)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Add admin user to Carezoa")
    parser.add_argument("--phone", default="+919999999999", help="Admin phone number")
    args = parser.parse_args()
    asyncio.run(add_admin(args.phone))
