# Aimed to mine valuable info from HN stores

## TODOs

- [ ] download all HN stores into mongodb
- [ ] query mongo to get the info I want

## File description

- `savedMaxItem.json` stores the item number saved in database;
- `downloadData.js` download unrecorded items from hacker-news api into mongodb

## Usage

### initialize database

1. set the number in `savedMaxItem.json` to 1
2. `node downloadData.js`