# Magichack planning document

## Overview

We're writing a web application for users to create and share custom cards and card sets for trading card games (like Magic the Gathering or Pokemon).


## Features

The application should have the following features:

1. Support for various "games" where a "game" is a set of attributes attributed to each card.
For example, a card in a deck of typical playing cards has a suit and a rank, while a Magic the Gathering card has name, casting cost, rules, flavor, and other fields.
Games are defined statically by the application, i.e. users cannot add games.
1. For a given game, we need to support various "styles". A style is a particular way of rendering a card. For example, a card rendered in two different styles would have the same name but that name might be rendered in different font.
It would be cool if users can define their own styles, and we have to talk about how we'd persist that information. To start, we can make styles statically determined by the application.
1. Card editor. Users visiting the application choose a game and then get a GUI where they can design cards. By design cards, I mean they choose the card attributes, which can include various text strings (name, rules text) and images.
The card editor shows a visual render of the card.
The card editor will have to adapt to the game selected by the user, i.e. the editable attributes of the cards depend on what game the card belongs to.
1. Set editor. Users can define "sets" of cards. A set is essentially a group of cards with some other attributes.
1. Persistence. Cards and sets that have been designed can be stored to a database and fetched later.
1. Publishing. Users can make their cards and sets publicly viewable by others.
1. Card image exporting.

## Implementation

1. I am not picky about the language. I think I want to use typescript in the front end, but I could be convinced to use something else with wasm.
1. I imagine the back end is pretty much just serving the application and handling data storage and retrival. I am not too picky about how that works but it would be good to use languages I know. I know Python really well and I'm willing to learn Rust.
