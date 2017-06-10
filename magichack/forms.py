from wtforms import Form, BooleanField, StringField, SelectField, validators

import magichack.models as models


class CardQueryForm(Form):
    name = StringField('Name', [validators.Length(max=models.CARD_NAME_LEN)])
    cost = StringField(
            'Cost',
            render_kw={'placeholder': 'e.g. 1UU'}
            )
    primary_type = SelectField(
            'Primary type',
            choices= [(t, t) for t in models.TYPES])
