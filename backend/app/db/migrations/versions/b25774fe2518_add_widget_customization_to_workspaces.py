"""Add widget customization to workspaces table

Revision ID: b25774fe2518
Revises: 32ea3801fc5e
Create Date: 2025-12-30 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b25774fe2518'
down_revision = '32ea3801fc5e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add widget customization columns to workspaces table
    op.add_column('workspaces', sa.Column('bot_name', sa.String(length=100), nullable=True))
    op.add_column('workspaces', sa.Column('primary_color', sa.String(length=7), nullable=True))
    op.add_column('workspaces', sa.Column('chat_position', sa.String(length=10), nullable=True))
    op.add_column('workspaces', sa.Column('welcome_message', sa.Text(), nullable=True))
    
    # Set default values for existing rows
    op.execute("UPDATE workspaces SET bot_name = 'AI Assistant' WHERE bot_name IS NULL")
    op.execute("UPDATE workspaces SET primary_color = '#3b82f6' WHERE primary_color IS NULL")
    op.execute("UPDATE workspaces SET chat_position = 'right' WHERE chat_position IS NULL")
    op.execute("UPDATE workspaces SET welcome_message = 'Hi! How can I assist you?' WHERE welcome_message IS NULL")


def downgrade() -> None:
    # Drop widget customization columns
    op.drop_column('workspaces', 'welcome_message')
    op.drop_column('workspaces', 'chat_position')
    op.drop_column('workspaces', 'primary_color')
    op.drop_column('workspaces', 'bot_name')

