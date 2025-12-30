"""Add status and chunks_count to documents table

Revision ID: 32ea3801fc5e
Revises: 620c5c4fbe73
Create Date: 2025-12-30 21:30:38.906113

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '32ea3801fc5e'
down_revision = '620c5c4fbe73'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type first
    documentstatus_enum = sa.Enum('UPLOADED', 'PROCESSING', 'READY', 'FAILED', name='documentstatus')
    documentstatus_enum.create(op.get_bind(), checkfirst=True)
    
    # Add columns
    op.add_column('documents', sa.Column('status', documentstatus_enum, nullable=False, server_default='UPLOADED'))
    op.add_column('documents', sa.Column('chunks_count', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    # Drop columns
    op.drop_column('documents', 'chunks_count')
    op.drop_column('documents', 'status')
    
    # Drop enum type
    sa.Enum(name='documentstatus').drop(op.get_bind(), checkfirst=True)
