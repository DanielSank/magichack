from sqlalchemy import Column, Table, UniqueConstraint
from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlemon import IPythonPrettyPrintable as IPPP


CARD_NAME_LEN = 32
CARD_IMAGE_URL_LEN = 256
CARD_ARTIST_NAME_LEN = 32
TYPE_NAME_LEN = 32


Base = declarative_base()


card_type = Table(
        'card_type',
        Base.metadata,
        Column('card_id', Integer, ForeignKey('cards.id')),
        Column('type_id', Integer, ForeignKey('type.id')))


class Card(Base, IPPP):
    __tablename__ = 'cards'

    id = Column(Integer, primary_key=True)
    name = Column(String(CARD_NAME_LEN), nullable=False, unique=True)
    image_url = Column(String(CARD_IMAGE_URL_LEN), nullable=True)
    flavor = Column(Text)
    artist = Colunn(String(CARD_ARTIST_NAME_LEN))

    # one -> many
    rules = relationship('Rule', back_populates='card')

    # many -> many
    types = relationship('Type', secondary=card_type, back_populates='cards')


class Rule(Base, IPPP):
    __tablename__ = 'rules'

    id = Column(Integer, primary_key=True)
    text = Column(Text)

    # many -> one
    card_id = Column(Integer, ForeignKey('cards.id'), nullable=False)
    card = relationship('Card', back_populates='rules')


class Type():
    __tablename__ = 'types'

    id = Column(Integer, primary_key=True)
    name = Column(String(TYPE_NAME_LEN), nullable=False, unique=True)

    # many -> many
    cards = relationship('Card', secondary=card_type, back_populates='types')

