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

