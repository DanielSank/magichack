"""
This module parses card formats.
"""
from __future__ import annotations

import os
import re
import enum
import csv
from typing import Union
import dataclasses
import xml.etree.cElementTree as ET


re_cost = re.compile(r"(?P<generic>\d*)(?P<colors>[a-zA-Z]*)")


@enum.verify(enum.UNIQUE)
class Rarity(enum.Enum):
    COMMON = "C"
    UNCOMMON = "U"
    RARE = "R"
    MYTHIC = "M"

    @classmethod
    def from_string(cls, s: str) -> Rarity:
        for elem in cls:
            if elem.value == s:
                return elem
        raise ValueError

    def long_name(self) -> str:
        return {
                "C": "common",
                "U": "uncommon",
                "R": "rare",
                "M": "mythic",
        }[self.value]


COLORS = ("W", "U", "B", "R", "G")


@dataclasses.dataclass
class Cost:
    W: int
    U: int
    B: int
    R: int
    G: int
    generic: Union[int, None]
    colorless: int

    def as_str(self) -> str:
        colors = "".join(getattr(self, symbol) * symbol for symbol in "WUBRG")
        generic = str(self.generic) if self.generic is not None else ""
        return generic + colors


    @classmethod
    def from_str(cls, s: str) -> Cost:
        maybe_result = re_cost.fullmatch(s)
        if maybe_result is None:
            raise ValueError
        if (value := maybe_result.group("generic")) != "":
            generic = int(value)
        else:
            generic = None

        colored: dict[str, int] = {c: 0 for c in COLORS}
        for char in maybe_result.group("colors"):
            if char in COLORS:
                colored[char] = colored.get(char, 0) + 1

        return cls(
                generic=generic,
                **colored,
                colorless=0,
        )

    def cmc(self) -> int:
        cmc = sum(getattr(self, color) for color in COLORS)
        if self.generic is not None:
            cmc += self.generic
        return cmc


@dataclasses.dataclass
class Card:
    sset: str
    rarity: Rarity
    legendary: bool
    types: list[str]
    subtypes: list[str]
    classes: list[str]
    power: Union[int, str, None]
    toughness: Union[int, str, None]
    cost: Cost
    rules: list[str]
    name: str
    flavor: str

    def expand_rules(self) -> list[str]:
        rules: list[str] = []
        for rule in self.rules:
            rules.append(rule.replace("~", self.name))
        return rules

    def as_xml_element(self) -> ET.Element:
        root = ET.Element("card")
        name = ET.SubElement(root, "name")
        name.text = self.name
        text = ET.SubElement(root, "text")
        text.text = "\n".join(self.rules)
        prop = ET.SubElement(root, "prop")
        layout = ET.SubElement(prop, "layout")
        layout.text = "normal"
        side = ET.SubElement(prop, "side")
        side.text = "front"
        ttype = ET.SubElement(prop, "type")
        ttype.text = " ".join(t.lower() for t in self.types)
        maintype = ET.SubElement(prop, "maintype")
        maintype.text = self.types[0].lower()
        manacost = ET.SubElement(prop, "manacost")
        manacost.text = self.cost.as_str()
        cmc = ET.SubElement(prop, "cmc")
        cmc.text = str(self.cost.cmc())
        colors = ET.SubElement(prop, "colors")
        colors.text = "".join(c for c in COLORS if getattr(self.cost, c) > 0)
        color_identity = ET.SubElement(prop, "coloridentity")
        color_identity.text = colors.text
        if self.power is not None and self.toughness is not None:
            pt = ET.SubElement(prop, "pt")
            pt.text = "/".join((str(self.power), str(self.toughness)))
        sset = ET.SubElement(root, "set", rarity=self.rarity.long_name())
        sset.text = self.sset
        tablerow = ET.SubElement(root, "tablerow")
        tablerow.text = str(type_to_tablerow(maintype.text))
        return root


# gSheets specific stuff


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


# Cockatrice specific stuff


def type_to_tablerow(ttype: str) -> int:
    match ttype:
        case "land": return 0
        case "basic land": return 0
        case "enchantment": return 1
        case "artifact": return 1
        case "creature": return 2
        case "instant": return 3
        case "sorcery": return 3
    raise ValueError


root = ET.Element("cockatrice_carddatabase", version="4")


def export(cards: list[Card], set_code: str, set_long_name: str):
    root = ET.Element("cockatrice_carddatabase", version="4")
    sets_element = ET.SubElement(root, "sets")
    sset = ET.SubElement(sets_element, "set")
    set_name = ET.SubElement(sset, "name")
    set_name.text = set_code
    set_longname = ET.SubElement(sset, "longname")
    set_longname.text = set_long_name
    set_type = ET.SubElement(sset, "type")
    set_type.text = "Custom"
    set_release_date = ET.SubElement(sset, "releasedate")
    set_release_date.text = "2025-02-22"

    cards_element = ET.SubElement(root, "cards")
    for card in cards:
        cards_element.append(card.as_xml_element())
    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ", level=0)
    with open("sb.xml", mode="wb") as file:
        tree.write(file, encoding="utf-8", xml_declaration=True)

