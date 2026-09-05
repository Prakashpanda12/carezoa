"""initial schema — full shared data model (§2.3) + insert-only guard on audit_logs

Revision ID: 0001_initial
Revises:
Create Date: 2026-01-01

Notes: tables are emitted from the declarative metadata so the migration can
never drift from app/models/*. In production they are evolved via
`alembic revision --autogenerate` diffs on top of this baseline.
"""

from alembic import op
from sqlalchemy.engine import Inspector

from app import models  # noqa: F401
from app.db.base import Base

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = set(Inspector.from_engine(bind).get_table_names())
    for table in Base.metadata.sorted_tables:
        if table.name not in existing:
            table.create(bind, checkfirst=True)

    # ANTI-BYPASS / SECURITY: audit_logs are INSERT-ONLY at the database level too.
    op.execute(
        """
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'carezoa_app') THEN
            REVOKE UPDATE, DELETE ON audit_logs FROM carezoa_app;
          END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    bind = op.get_bind()
    for table in reversed(Base.metadata.sorted_tables):
        table.drop(bind, checkfirst=True)
