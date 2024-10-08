"""update some feilds

Revision ID: dbcbf4654c8d
Revises: 753bd036de6e
Create Date: 2024-09-11 16:58:46.385127

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'dbcbf4654c8d'
down_revision = '753bd036de6e'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('model', schema=None) as batch_op:
        batch_op.drop_column('model_comparision')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('model', schema=None) as batch_op:
        batch_op.add_column(sa.Column('model_comparision', sa.TEXT(), nullable=True))

    # ### end Alembic commands ###
