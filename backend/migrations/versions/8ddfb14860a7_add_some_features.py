"""add some features

Revision ID: 8ddfb14860a7
Revises: b5bca021e0e5
Create Date: 2024-09-11 12:58:09.368384

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8ddfb14860a7'
down_revision = 'b5bca021e0e5'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('model', schema=None) as batch_op:
        batch_op.add_column(sa.Column('objectives', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('dataset', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('data_cleaning', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('feature_creation', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('hyperparameter', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('cross_validation', sa.Float(precision=3), nullable=True))
        batch_op.add_column(sa.Column('matrices', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('model_comparision', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('confusion_matrices', sa.Text(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('model', schema=None) as batch_op:
        batch_op.drop_column('confusion_matrices')
        batch_op.drop_column('model_comparision')
        batch_op.drop_column('matrices')
        batch_op.drop_column('cross_validation')
        batch_op.drop_column('hyperparameter')
        batch_op.drop_column('feature_creation')
        batch_op.drop_column('data_cleaning')
        batch_op.drop_column('dataset')
        batch_op.drop_column('objectives')

    # ### end Alembic commands ###
