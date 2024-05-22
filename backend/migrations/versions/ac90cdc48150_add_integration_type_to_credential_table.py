"""add integration type to credential table

Revision ID: ac90cdc48150
Revises: a89c45ac9f76
Create Date: 2024-05-21 23:20:18.429097

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'ac90cdc48150'
down_revision = 'a89c45ac9f76'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    enum_type = postgresql.ENUM('VIRUS_TOTAL', 'ALIENVAULT_OTX', name='integrationtype', schema='admyral')
    enum_type.create(op.get_bind(), checkfirst=True)

    op.add_column('credential', sa.Column('credential_type', enum_type, nullable=True), schema='admyral')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('credential', 'credential_type', schema='admyral')

    enum_type = postgresql.ENUM('VIRUS_TOTAL', 'ALIENVAULT_OTX', name='integrationtype', schema='admyral')
    enum_type.drop(op.get_bind(), checkfirst=True)
    # ### end Alembic commands ###
