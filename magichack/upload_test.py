import pytest

import magichack.upload as upload
from magichack.upload import MANA_COST_RE


def test_mana_cost_re():
    assert MANA_COST_RE.match('3UB').groups() == ('3', '', 'U', 'B', '', '')
    assert MANA_COST_RE.match('WUB').groups() == ('', 'W', 'U', 'B', '', '')


def test_parse_cost():
    assert upload.parse_cost('3UB') == {
            '_': 3,
            'U': 1,
            'B': 1,
            }
    assert upload.parse_cost('WUUG') == {
            'W': 1,
            'U': 2,
            'G': 1,
            }
