from __future__ import print_function, absolute_import

from sqlalchemy import Table, Column, ForeignKey, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

CARD_NAME_LEN = 64
CARD_PRIMARY_TYPE_LEN = 32
SECONDARY_TYPE_NAME_LEN = 32


cards_and_secondary_types = Table(
        'cards_and_secondary_types',
        Base.metadata,
        Column('card_id', Integer, ForeignKey('cards.id')),
        Column('secondary_type_id', Integer, ForeignKey('secondary_types.id')))


class CardColor(Base):
    """A card's mana cost for a particular color.

    To explicitly indicate a color in the absence of a mana cost in that color,
    use value=0.
    """
    __tablename__ = 'card_colors'

    card_id = Column(Integer, ForeignKey('cards.id'), primary_key=True)
    color_id = Column(Integer, ForeignKey('colors.id'), primary_key=True)
    value = Column(Integer, nullable=False)
    card = relationship('Card', back_populates='costs')
    color = relationship('Color', back_populates='cards')


class Card(Base):
    """A card"""
    __tablename__ = 'cards'

    id = Column(Integer, primary_key=True)
    name = Column(String(CARD_NAME_LEN), nullable=False)
    primary_type = Column(String(CARD_PRIMARY_TYPE_LEN), nullable=False)
    flavor = Column(Text, nullable=True)

    # one -> many
    rules = relationship('Rule')

    # many <-> many
    secondary_types = relationship(
            'SecondaryType',
            secondary=cards_and_secondary_types,
            back_populates='cards')
    colors = relationship('CardColor', back_populates='cards')

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


class Land(Card):
    __mapper_args__ = {'polymorphic_identity': 'land'}


class Rule(Base):
    """A single card rule."""
    __tablename__ = 'rules'

    id = Column(Integer, primary_key=True)
    text = Column(Text, nullable=False)

    # many -> one
    card_id = Column(Integer, ForeignKey('cards.id'), nullable=False)


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


class Color(Base):
    __tablename__ = 'colors'

    id = Column(Integer, primary_key=True)
    name = Column(String(12), nullable=False, unique=True)

    # many <-> many
    cards = relationship('CardColor', back_populates='colors')
