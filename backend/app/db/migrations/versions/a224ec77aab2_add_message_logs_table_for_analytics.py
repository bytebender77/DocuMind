"""Add message_logs table for analytics

Revision ID: a224ec77aab2
Revises: b25774fe2518
Create Date: 2025-12-30 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'a224ec77aab2'
down_revision = 'b25774fe2518'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create message_logs table
    op.create_table(
        'message_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('is_context_used', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    )
    
    # Create indexes for performance
    op.create_index('ix_message_logs_workspace_id', 'message_logs', ['workspace_id'])
    op.create_index('ix_message_logs_created_at', 'message_logs', ['created_at'])
    op.create_index('ix_message_logs_id', 'message_logs', ['id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_message_logs_id', table_name='message_logs')
    op.drop_index('ix_message_logs_created_at', table_name='message_logs')
    op.drop_index('ix_message_logs_workspace_id', table_name='message_logs')
    
    # Drop table
    op.drop_table('message_logs')

