"""Tools for placing print orders.

Usual workflow would be to first get a set of core.Card,
then copy those into a list of this module's Card,
then use the xml() function to make an XML file for ordering.
"""
import dataclasses
from typing import Callable
import xml.etree.ElementTree as ET

import core


@dataclasses.dataclass(eq=True, frozen=True)
class Card:
    drive_id: str
    filename: str


def card_to_xml_element(card: core.Card, slot: int, copies: int):
    root = ET.Element("card")
    idd = ET.SubElement(root, "id")
    idd.text = card.drive_id
    source_type = ET.SubElement(root, "sourceType")
    source_type.text = "Google Drive"
    slots = ET.SubElement(root, "slots")
    slots.text = ",".join((str(_ + slot) for _ in range(copies)))
    name = ET.SubElement(root, "name")
    name.text = card.filename
    query = ET.SubElement(root, "query")
    query.text = card.filename.split(".")[0].lower()
    return root


def xml(
        card_to_copies: Callable[[Card], int],
        cards: list[Card],
        output_filename: str,
):
    quantity_total = sum(card_to_copies(_) for _ in cards)
    root = ET.Element("order")

    details = ET.SubElement(root, "details")
    quantity = ET.SubElement(details, "quantity")
    quantity.text = str(quantity_total)
    stock = ET.SubElement(details, "stock")
    stock.text = "(S33) Superior Smooth"
    foil = ET.SubElement(details, "foil")
    foil.text = "false"

    fronts = ET.SubElement(root, "fronts")
    slot = 0
    for card in cards:
        copies = card_to_copies(card)
        fronts.append(
                card_to_xml_element(
                    card=card,
                    slot=slot,
                    copies=copies,
                ),
        )
        slot += copies

    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ", level=0)
    with open(output_filename, mode="wb") as file:
        tree.write(file, encoding="utf-8", xml_declaration=False)
