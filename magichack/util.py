import re

from magichack.models import COLORS

MANA_COST_RE = re.compile(r'(\d*)'+''.join(['({}*)'.format(char)
                                            for char in COLORS[1:]]))
# TODO: Add detection for X/Y costs


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
    cost['_'] = int(groups[0]) if groups[0] != '' else None
    for i, color in enumerate(COLORS[1:]):  # Skip colorless
        num = len(groups[i+1])
        cost[color] = num if num > 0 else None
    return cost
