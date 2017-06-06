from wtforms import Form, BooleanField, StringField, validators

import magichack.models as models


class CardQueryForm(Form):
    name = StringField('Name', [validators.Length(max=models.CARD_NAME_LEN)])
