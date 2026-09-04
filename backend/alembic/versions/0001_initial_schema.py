"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-09-03

Creates the four core tables:
- analysis_history
- threat_intel_records
- simulator_sessions
- simulator_events
"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analysis_history",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("raw_url", sa.Text(), nullable=False),
        sa.Column("normalized_url", sa.Text(), nullable=False),
        sa.Column("domain", sa.String(length=255), nullable=False),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column("classification", sa.String(length=20), nullable=False),
        sa.Column("ml_probability", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_analysis_history_domain", "analysis_history", ["domain"])

    op.create_table(
        "threat_intel_records",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("analysis_id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("matched", sa.Boolean(), nullable=True),
        sa.Column("severity", sa.String(length=20), nullable=True),
        sa.Column("raw_details", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["analysis_id"], ["analysis_history.id"], name="fk_threat_intel_analysis"),
    )

    op.create_table(
        "simulator_sessions",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("target_email", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "simulator_events",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("session_id", sa.String(length=64), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("username_entered", sa.String(length=255), nullable=True),
        sa.Column("password_entered", sa.Boolean(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["simulator_sessions.id"], name="fk_simulator_event_session"),
    )


def downgrade() -> None:
    op.drop_table("simulator_events")
    op.drop_table("simulator_sessions")
    op.drop_index("ix_analysis_history_domain", table_name="analysis_history")
    op.drop_table("threat_intel_records")
    op.drop_table("analysis_history")
