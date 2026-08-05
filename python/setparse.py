"""
This module parses card formats.
"""
from __future__ import annotations

import os
import csv

import core
from core import Rarity, Cost


def parse_pt(pt: str) -> int | str | None:
    if pt == "":
        return None
    else:
        try:
            return int(pt)
        except ValueError:
            return pt


def parse_gsheet(
        rows: list[list[str]],
        setcode: str,
) -> list[core.Card]:
    # Format the gsheet rows a bit before creating Cards.
    column_names = rows[0]
    formatted: list[dict[str, str | list[str]]] = []
    for row in rows[1:]:
        d: dict[str, str] = {}
        types: list[str] = []
        for name, val in zip(column_names, row):
            if name == "Type":
                if val:
                    types.append(val)
            else:
                d[name] = val
        d["Type"] = "\n".join(types)
        formatted.append(d)

    cards: list[core.Card] = []
    for row in formatted:
        cards.append(
                core.Card(
                    sset=setcode,
                    rarity=Rarity.from_string(row["Rarity"]),
                    legendary=True if row["Legendary"] == "TRUE" else False,
                    types=tuple(row["Type"].split("\n")),
                    subtypes=tuple(row["Subtypes"].split("\n")),
                    classes=tuple(row["Classes"].split("\n")),
                    power=parse_pt(row["P"]),
                    toughness=parse_pt(row["T"]),
                    cost=Cost.from_str(row["Cost"]),
                    rules=tuple(row["Rules"].split("\n")),
                    name=row["Name"],
                    flavor=row.get("Flavor", ""),
                    image_url=row["Image"] if row.get("Image", None) else None,
                )
        )
    return cards


def parse_gsheet_csv(filename: str, setcode: str) -> dict[str, core.Card]:
    cards: dict[str, core.Card] = {}
    with open(filename, mode="r", encoding="utf-8") as file:
        reader = csv.reader(file)
        _ = next(reader)  # Skip the header
        for row in reader:
            rarity, legendary, ttype, _, subtypes, classes, p, t, cost, rules, name, image, flavor, *rest = tuple(row)
            if name == "":  # Skip empty sheet rows
                continue
            cards[name] = core.Card(
                    sset=setcode,
                    rarity=Rarity.from_string(rarity),
                    legendary=True if legendary == "TRUE" else False,
                    types=[ttype],
                    subtypes=subtype.split("\n"),
                    classes=classes.split("\n"),
                    power=parse_pt(p),
                    toughness=parse_pt(t),
                    cost=Cost.from_str(cost),
                    rules=rules.split("\n"),
                    name=name,
                    flavor=flavor,
            )
    return cards


def all_cards(set_tag: str) -> dict[str, core.Card]:
    """
    Args:
        set_tag: The three letter abbreviation for the set, e.g. "LEA"
             for "Limited Edition Alpha".
    """
    files = [f for f in os.listdir(".") if os.path.isfile(f)]
    files = [f for f in files if f.endswith("csv")]
    cards: dict[str, core.Card] = {}
    for file in files:
        cards.update(parse_gsheet_csv(file, set_tag))
    return cards
