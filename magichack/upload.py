import re

import sqlalchemy as sa
import sqlalchemy.orm as orm

import magichack.gsheets as gsheets
import magichack.models as models

from magichack.models import COLORS


MANA_COST_RE = re.compile(r'(\d*)'+''.join(['({}*)'.format(char)
                                            for char in COLORS[1:]]))
# TODO: Add detection for X/Y costs


def get_cards_from_sheet(session, sheet_id, tab):
    """Read cards from Google spreadsheet

    Returns (list[models.Card])
    """
    sheet = gsheets.SingleSheet(sheet_id)
    data = sheet.read_range_as_DataFrame('{}!A1:F100'.format(tab))

    cards = []
    all_secondary_types = {t.name: t
                       for t in session.query(models.SecondaryType).all()}

    for _, row in data.iterrows():
        constructor_kwargs = {}

        constructor_kwargs['name'] = row['NAME']

        primary_type_name, secondary_type_names = parse_type(
                row['TYPE'].lower())
        secondary_types = [
                all_secondary_types.setdefault(
                        secondary_type_name,
                        models.SecondaryType(name=secondary_type_name))
                for secondary_type_name in secondary_type_names]

        constructor_kwargs['primary_type'] = primary_type_name
        constructor_kwargs['secondary_types'] = secondary_types

        card_factory = models.card_factories[primary_type_name]

        rule_texts = row.RULES.split(';')
        rules = [models.Rule (text=rule_text) for rule_text in rule_texts]
        constructor_kwargs['rules'] = rules
        # TODO: Maybe keep Rules unique.

        if row['PT'] != '':
            power, toughness = row['PT'].split('/')
            constructor_kwargs['power'] = power
            constructor_kwargs['toughness'] = toughness

        card = card_factory(**constructor_kwargs)

        cost = parse_cost(row['COST'])
        if cost is not None:
            for k, v in cost.items():
                if k == 'colorless':
                    card.mana_colorless = v
                else:
                    setattr(card, 'mana_{}'.format(k.lower()), v)
        cards.append(card)
        session.add(card)
    return cards


def parse_type(t):
    if ' - ' in t:
        major, minors = t.split(' - ')
        minors = minors.split(' ')
    else:
        major = t
        minors = []
    return major, minors


def parse_cost(cost):
    """Get a dict representation of a mana cost.

    Args:
        cost (str): String representation of mana cost, i.e. 3WRG.

    Returns (dict): Keys are 'colorless', and elements of MANA_COLORS. Each
        value is the cost for that color.
    """
    if cost is None:
        return None
    groups = MANA_COST_RE.match(cost).groups()
    cost = {}
    cost['_'] = int(groups[0]) if groups[0] != '' else 0
    for i, color in enumerate(COLORS[1:]):  # Skip colorless
        cost[color] = len(groups[i+1])

    sanitized_cost = {k: v for k, v in cost.items() if v!=0}
    # Drop zero costs so that the value in the Card model is NULL. We
    # do this because a cost of 0 for e.g. green means that the card is
    # green but there's no actual green mana cost.
    return sanitized_cost
