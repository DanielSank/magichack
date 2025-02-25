import core
import xml.etree.ElementTree as ET


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


def card_to_xml_element(card: core.Card) -> ET.Element:
    """Convert one Card to a single XML element.

    Args:
        card: The card to convert.

    Returns an 
    """
    root = ET.Element("card")
    name = ET.SubElement(root, "name")
    name.text = card.name
    text = ET.SubElement(root, "text")
    text.text = "\n".join(card.rules)
    prop = ET.SubElement(root, "prop")
    layout = ET.SubElement(prop, "layout")
    layout.text = "normal"
    side = ET.SubElement(prop, "side")
    side.text = "front"
    ttype = ET.SubElement(prop, "type")
    ttype.text = " ".join(t.lower() for t in card.types)
    maintype = ET.SubElement(prop, "maintype")
    maintype.text = card.types[0].lower()
    manacost = ET.SubElement(prop, "manacost")
    manacost.text = card.cost.as_str()
    cmc = ET.SubElement(prop, "cmc")
    cmc.text = str(card.cost.cmc())
    colors = ET.SubElement(prop, "colors")
    colors.text = "".join(c for c in core.COLORS if getattr(card.cost, c) > 0)
    color_identity = ET.SubElement(prop, "coloridentity")
    color_identity.text = colors.text
    if card.power is not None and card.toughness is not None:
        pt = ET.SubElement(prop, "pt")
        pt.text = "/".join((str(card.power), str(card.toughness)))
    sset = ET.SubElement(root, "set", rarity=card.rarity.long_name())
    sset.text = card.sset
    tablerow = ET.SubElement(root, "tablerow")
    tablerow.text = str(type_to_tablerow(maintype.text))
    return root


def export_cockatrice_xml(
        cards: list[core.Card],
        set_filename: str,
        set_code: str,
        set_long_name: str,
        date_string: str,
        ):
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
    set_release_date.text = date_string

    cards_element = ET.SubElement(root, "cards")
    for card in cards:
        cards_element.append(card_to_xml_element(card))
    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ", level=0)
    with open(set_filename, mode="wb") as file:
        tree.write(file, encoding="utf-8", xml_declaration=True)
