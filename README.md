# Coriolis The Third Horizon
A Foundry VTT system for [Free League's Coriolis RPG](https://frialigan.se/en/games/coriolis-2/).

## System Status
The initial goal is to get the system into a state where one can run a Coriolis game in Foundry with basic rolls for stats, weapons, etc. As such, styling for character sheets and such are still a WIP, and there's very little automation implemented at the moment.

Once playable, I'd like to start updating the styling of sheets, as well as start adding automations to different rules in the system.

## Installation
1. Inside Foundry's Configuration and Setup screen, go to **Game Systems**
2. Click "Install System"
3. In the Manifest URL field paste: `TODO`

## Features
![Character Sheet](https://github.com/winks-vtt/yze-coriolis/raw/master/images/char_sheet_preview.png)

- Basic Character sheets for PCs
- Ability to roll Skills and Attributes
- Can create Talents, Weapons, Gear, Armor and drag-n-drop onto character sheets.
- Can click on weapons to roll with bonus modifiers
- Can push rolls in chat
- Can do armor rating rolls
- Be able to track Darkness Points
- Track encumbrance in the inventory tab
- Support for [Dice So Nice]( https://gitlab.com/riccisi/foundryvtt-dice-so-nice) with custom Dice skins

## How-Tos

### Modifying Rolls
![Modifying Rolls](https://github.com/winks-vtt/yze-coriolis/raw/master/images/ht_modifier_rolls.gif)

When selecting an attribute or skill, a pop up will request a modifier to any roll coming from the character sheet.

### Pushing Rolls
![Pushing Rolls](https://github.com/winks-vtt/yze-coriolis/raw/master/images/ht_push_rolls.gif)

To push a roll, click on the "pray to the Icons" button under the roll in the chat window

### Using Weapons and Armor
![Using Items](https://github.com/winks-vtt/yze-coriolis/raw/master/images/ht_use_items.gif)

Weapons, Explosives, and Armor can be rolled in the items tab. You can click on the name of the item to unfold further details, or click on the icon of the item to roll. Rollable items will fade to a dice icon.

### Handling Darkness Points
![Darkness Points Tools](https://github.com/winks-vtt/yze-coriolis/raw/master/images/dp_bar.png)
- You can increment or decrement darkness points via the tool bar on the left.
- Whenever a player pushes a roll, 1 DP is added to the DB pool of the GM

### Updating Character Art
The system comes with placeholder art-work. To change it, click on the upper 3rd of the art-work to upload a new one. For reference, the placeholder artwork is 604x1488 pixels. The slot is designed for easily dropping in character art from the core rulebook.

## Recommended Modules
- [Dice So Nice]( https://gitlab.com/riccisi/foundryvtt-dice-so-nice)

## Immediate Todos
- [ ] Update styling of character sheets
- [ ] Create a Ship character sheet

## Support
For questions, feature requests, or bug reports, feel free to contact me on the Foundry Discord (Winks#1731) or open an issue here directly.

## License
This Foundry VTT system, written by Winks, is licensed under a [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/)

Art:
nav icons: material.io (apache v2)
bg: NASA Hubble

This work is licensed under [Foundry Virtual Tabletop EULA - Limited License Agreement for module development](https://foundryvtt.com/article/license/).