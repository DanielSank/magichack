from __future__ import print_function, absolute_import

from sqlalchemy import Table, Column, ForeignKey, Integer, String, Text
from sqlalchemy import UnicodeText, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

CARD_NAME_LEN = 64
CARD_PRIMARY_TYPE_LEN = 32
SECONDARY_TYPE_NAME_LEN = 32
SET_NAME_LEN = 32

COLORS = ['_', 'W', 'U', 'B', 'R', 'G']

cards_and_secondary_types = Table(
        'cards_and_secondary_types',
        Base.metadata,
        Column('card_id', Integer, ForeignKey('cards.id')),
        Column('secondary_type_id', Integer, ForeignKey('secondary_types.id')))


cards_and_sets = Table(
        'cards_and_sets',
        Base.metadata,
        Column('card_id', Integer, ForeignKey('cards.id')),
        Column('set_id', Integer, ForeignKey('sets.id')))


class Card(Base):
    """A card"""
    __tablename__ = 'cards'

    id = Column(Integer, primary_key=True)
    name = Column(String(CARD_NAME_LEN), nullable=False)
    primary_type = Column(String(CARD_PRIMARY_TYPE_LEN), nullable=False)
    flavor = Column(UnicodeText, nullable=True)
    rarity = Column(Enum('common', 'uncommon', 'rare'), nullable=True)

    mana__ = Column(Integer, nullable=True)  # colorless
    mana_w = Column(Integer, nullable=True)
    mana_u = Column(Integer, nullable=True)
    mana_b = Column(Integer, nullable=True)
    mana_r = Column(Integer, nullable=True)
    mana_g = Column(Integer, nullable=True)

    @property
    def cost(self):
        d = {}
        for color in COLORS:
            d[color] = getattr(self, 'mana_{}'.format(color.lower()))
        return d

    # one -> many
    rules = relationship('Rule', back_populates='card')

    # many <-> many
    secondary_types = relationship(
            'SecondaryType',
            secondary=cards_and_secondary_types,
            back_populates='cards')
    # colors = relationship('CardColor', back_populates='cards')

    def cost_pretty_print(self):
        pretty = '{colorless}{white}{blue}'.format(
                colorless=self.mana__ if self.mana__ else '',
                white = self.mana_w*'W' if self.mana_w else '',
                blue = self.mana_u*'U' if self.mana_u else '')
        return pretty

    sets = relationship(
            'Set',
            secondary=cards_and_sets,
            back_populates='cards')

    __mapper_args__ = {
            'polymorphic_identity': 'card',
            'polymorphic_on': 'primary_type',
    }


class Enchantment(Card):
    __mapper_args__ = {'polymorphic_identity': 'enchantment'}


class Creature(Card):
    power = Column(Integer, nullable=False)
    toughness = Column(Integer, nullable=False)

    __mapper_args__ = {'polymorphic_identity': 'creature'}


class Sorcery(Card):
    __mapper_args__ = {'polymorphic_identity': 'sorcery'}


class Instant(Card):
    __mapper_args__ = {'polymorphic_identity': 'instant'}


class Artifact(Card):
    __mapper_args__ = {'polymorphic_identity': 'artifact'}


class Land(Card):
    __mapper_args__ = {'polymorphic_identity': 'land'}


card_factories = {
        'enchantment': Enchantment,
        'creature': Creature,
        'sorcery': Sorcery,
        'instant': Instant,
        'artifact': Artifact,
        'land': Land,
        }


class Rule(Base):
    """A single card rule."""
    __tablename__ = 'rules'

    id = Column(Integer, primary_key=True)
    text = Column(UnicodeText, nullable=False)

    # many -> one
    card_id = Column(Integer, ForeignKey('cards.id'), nullable=False)
    card = relationship('Card', back_populates='rules')


class SecondaryType(Base):
    """A card secondardy type, i.e. "Aura" or "Goblin"."""
    __tablename__ = 'secondary_types'

    id = Column(Integer, primary_key=True)
    name = Column(String(SECONDARY_TYPE_NAME_LEN), nullable=False, unique=True)

    # many <-> many
    cards = relationship(
            'Card',
            secondary=cards_and_secondary_types,
            back_populates='secondary_types')


'''
class Color(Base):
    __tablename__ = 'colors'

    id = Column(Integer, primary_key=True)
    name = Column(String(12), nullable=False, unique=True)

    # many <-> many
    cards = relationship('CardColor', back_populates='colors')


class CardColor(Base):
    """A card's mana cost for a particular color.

    To explicitly indicate a color in the absence of a mana cost in that color,
    use value=0.
    """
    __tablename__ = 'card_colors'

    card_id = Column(Integer, ForeignKey('cards.id'), primary_key=True)
    color_id = Column(Integer, ForeignKey('colors.id'), primary_key=True)
    value = Column(Integer, nullable=False)
    card = relationship('Card', back_populates='colors')
    color = relationship('Color', back_populates='cards')
'''


class Set(Base):
    __tablename__ = 'sets'

    id = Column(Integer, primary_key=True)
    name = Column(String(SET_NAME_LEN), unique=True)

    # many <-> many
    cards = relationship(
            'Card',
            secondary=cards_and_sets,
            back_populates='sets')
