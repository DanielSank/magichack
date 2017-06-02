import sqlalchemy as sa
import sqlalchemy.orm as orm

import magichack.gsheets as gsheets
import magichack.models as models


def get_cards_from_sheet(sheet_id, tab):
    sheet = gsheets.SingleSheet(sheet_id)
    data = sheet.read_range_as_DataFrame('{}!A1:E14'.format(tab))
    cards = []
    for _, row in data.iterrows():
        major, minors = parse_type(row.TYPE)
        secondary_types = [models.SecondaryType(name=minor)
                           for minor in minors]
        cards.append(models.Card(
                name=row.NAME,
                primary_type=major,
                secondary_types=secondary_types))
    return cards


def parse_type(t):
    if ' - ' in t:
        major, minors = t.split(' - ')
        minors = minors.split(' ')
    else:
        major = t
        minors = []
    return major, minors
