import pytest

import magichack.upload as upload
from magichack.upload import MANA_COST_RE


def test_mana_cost_re():
    assert MANA_COST_RE.match('3UB').groups() == ('3', '', 'U', 'B', '', '')
    assert MANA_COST_RE.match('WUB').groups() == ('', 'W', 'U', 'B', '', '')


def test_parse_cost():
    assert upload.parse_cost('3UB') == {
            '_': 3,
            'W': None,
            'U': 1,
            'B': 1,
            'R': None,
            'G': None,
            }
    assert upload.parse_cost('WUUG') == {
            '_': None,
            'W': 1,
            'U': 2,
            'B': None,
            'R': None,
            'G': 1,
            }
