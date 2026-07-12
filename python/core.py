from __future__ import annotations

from typing import Union
import dataclasses
import enum
import re


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


@dataclasses.dataclass(eq=True, frozen=True)
class Cost:
    W: int
    U: int
    B: int
    R: int
    G: int
    D: int
    generic: Union[int, None]
    colorless: int

    def as_str(self) -> str:
        colors = "".join(getattr(self, symbol) * symbol for symbol in "WUBRG")
        generic = str(self.generic) if self.generic is not None else ""
        return generic + colors

    def __str__(self) -> str:
        return self.as_str()

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


COLORS = ("W", "U", "B", "R", "G", "D")


@dataclasses.dataclass
class Card:
    sset: str
    rarity: Rarity
    legendary: bool
    types: tuple[str, ...]
    subtypes: tuple[str, ...]
    classes: tuple[str, ...]
    power: Union[int, str, None]
    toughness: Union[int, str, None]
    cost: Cost
    rules: tuple[str, ...]
    name: str
    flavor: str
    image_url: str | None

    def expand_rules(self) -> list[str]:
        rules: list[str] = []
        for rule in self.rules:
            rules.append(rule.replace("~", self.name))
        return rules

    def __str__(self) -> str:
        result = "\n".join(
                (
                    self.name,
                    str(self.cost),
                    self.rarity.value,
                    " ".join(self.types) + " - " + " ".join(self.subtypes) + " " + " ".join(self.classes),
                    "\n".join(self.expand_rules()),
                )
        )
        if self.power is not None and self.toughness is not None:
            result = "\n".join(
                    (
                        result,
                        "/".join((str(self.power), str(self.toughness))),
                    )
            )
        return result

