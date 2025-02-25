"""
This module parses card formats.
"""
from __future__ import annotations

import os
import csv

from core import Card, Rarity, Cost


def parse_gsheet_csv(filename: str, setcode: str) -> dict[str, Card]:

    def parse_pt(pt: str) -> int | str | None:
        if pt == "":
            return None
        else:
            try:
                return int(pt)
            except ValueError:
                return pt

    cards: dict[str, Card] = {}
    with open(filename, mode="r", encoding="utf-8") as file:
        reader = csv.reader(file)
        _ = next(reader)  # Skip the header
        for row in reader:
            rarity, legendary, ttype, subtype, cclass, p, t, cost, rules, name, flavor, image, *rest = tuple(row)
            if name == "":  # Skip empty sheet rows
                continue
            cards[name] = Card(
                    sset=setcode,
                    rarity=Rarity.from_string(rarity),
                    legendary=True if legendary == "TRUE" else False,
                    types=[ttype],
                    subtypes=subtype.split(" "),
                    classes=cclass.split(" "),
                    power=parse_pt(p),
                    toughness=parse_pt(t),
                    cost=Cost.from_str(cost),
                    rules=rules.split("\n"),
                    name=name,
                    flavor=flavor,
            )
    return cards


def all_cards():
    files = [f for f in os.listdir(".") if os.path.isfile(f)]
    files = [f for f in files if f.endswith("csv")]
    cards: dict[str, Card] = {}
    for file in files:
        cards.update(parse_gsheet_csv(file, "SBA"))
    return cards
