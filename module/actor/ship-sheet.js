import {
  setActiveEPTokens,
  shipEPCount,
  crewEPCount,
  getMaxAllowedEPTokens,
  setCrewEPCount,
  crewHasTokens,
  canChangeEPForShip,
} from "../item/ep-token.js";
import {
  getActorById,
  getActorEntityById,
  getOwnedItemsByType,
} from "../util.js";
import {
  computeNewBarValue,
  onHoverBarSegmentIn,
  onHoverBarOut,
  prepDataBarBlocks,
} from "./databar.js";

import { toggleShipModule } from "../item/ship-module.js";
import { coriolisRoll } from "../coriolis-roll.js";
import { coriolisModifierDialog } from "../coriolis-roll.js";

/**
 * Extend the basic ActorSheet for a basic Coriolis ship sheet
 * @extends {ActorSheet}
 */
export class yzecoriolisShipSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["yzecoriolis", "sheet", "actor", "ship"],
      template: "systems/yzecoriolis/templates/actor/ship-sheet.html",
      width: 1200,
      height: 880,
      resizable: false,
      tabs: [
        {
          navSelector: ".navigation",
          contentSelector: ".sheet-panels",
          initial: "crew",
        },
      ],
    });
  }

  getData() {
    const data = super.getData();
    if (this.actor.data.type === "ship") {
      this._prepShipStats(data);
    }
    data.config = CONFIG.YZECORIOLIS;
    return data;
  }

  _prepShipStats(sheetData) {
    const sheetActor = sheetData.actor;
    const data = sheetActor.data;
    sheetActor.hullBlocks = prepDataBarBlocks(
      data.hullPoints.value,
      data.hullPoints.max
    );

    const maxTokens = getMaxAllowedEPTokens();
    const shipTokenCount = shipEPCount(this.actor);
    sheetActor.energyBlocks = prepDataBarBlocks(shipTokenCount, maxTokens);

    // since energy points are a derived value and not a stored value, we need to expose it as a field
    // for the template, unlike the more simple hull points.
    sheetActor.currentShipEP = shipTokenCount;

    // pull in any relevant crew.
    sheetActor.crew = [];
    const shipId = sheetActor._id;
    for (let e of game.actors.entities) {
      let rootData = e.data;
      if (rootData.type === "character" || rootData.type === "npc") {
        const crewShipId = rootData.data.bio.crewPosition.shipId;
        if (shipId !== crewShipId) {
          continue;
        }
        const charEPCount = crewEPCount(this.actor, rootData._id);
        const crewCopy = { ...rootData };
        crewCopy.energyBlocks = prepDataBarBlocks(charEPCount, maxTokens);
        crewCopy.currentEP = charEPCount;
        sheetActor.crew.push(crewCopy);
      }
    }

    // have a consistent sort order when displaying ship crews.
    // TODO: should probably have a set of coriolis constants for these positions.
    const crewSortingOrder = {
      captain: 0,
      engineer: 1,
      pilot: 2,
      sensorOperator: 3,
      gunner: 4,
    };

    sheetActor.crew = sheetActor.crew.sort((a, b) => {
      return (
        crewSortingOrder[a.data.bio.crewPosition.position] -
        crewSortingOrder[b.data.bio.crewPosition.position]
      );
    });

    sheetActor.modules = getOwnedItemsByType(this.actor, "shipModule");
    // for dynamic css just attach css classes to the module we'll inject in
    // various parts
    for (let m of sheetActor.modules) {
      // enabledCSS used for toggle button
      m.enabledCSS = "";
      if (m.data.enabled) {
        m.enabledCSS = "enabled";
      }
    }
    sheetActor.features = {
      dataset: {
        type: "shipFeature",
        defaultName: game.i18n.localize("YZECORIOLIS.NewShipFeature"),
      },
      items: getOwnedItemsByType(this.actor, "shipFeature"),
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // databar editing
    html
      .find(".hull-bar-segment")
      .click(this._onClickHullBarSegment.bind(this));
    html.find(".ep-bar-segment").click(this._onClickEPBarSegment.bind(this));
    html
      .find(".crew-bar-segment")
      .click(this._onClickCrewEPBarSegment.bind(this));
    html.find(".bar-segment").mouseenter(onHoverBarSegmentIn);
    html.find(".bar").mouseleave(onHoverBarOut);

    // crew portrait rolling
    html.find(".crew-portrait").click(this._onRollCrewPosition.bind(this));

    // crew portrait hovering flourishes
    html
      .find(".crew-portrait")
      .mouseenter(this._onHoverInCrewPortrait.bind(this));
    html
      .find(".crew-portrait")
      .mouseleave(this._onHoverOutCrewPortrait.bind(this));

    html
      .find(".toggle-ship-module")
      .click(this._onClickToggleModule.bind(this));

    html.find(".module-edit").click(this._onClickEditModule.bind(this));
    html.find(".module-delete").click(this._onClickDeleteModule.bind(this));

    html.find(".feature-create").click(this._onClickCreateFeature.bind(this));
    html.find(".feature-edit").click(this._onClickEditFeature.bind(this));
    html.find(".feature-delete").click(this._onClickDeleteFeature.bind(this));

    html
      .find(".expandable-info")
      .click((event) => this._onFeatureSummary(event));
    // update gear quantity directly from sheet.
    html
      .find(".quantity-input")
      .change(this._onModuleQuantityChanged.bind(this));
  }

  async _onModuleQuantityChanged(event) {
    event.preventDefault();
    const input = event.target;
    const moduleId = input.dataset.module;
    const item = this.actor.getOwnedItem(moduleId);
    let value = input.value;
    if (value < 0) {
      value = 0;
    }
    return item.update({ "data.quantity": value });
  }

  _onClickEditModule(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const moduleId = targetButton.dataset.module;
    const item = this.actor.getOwnedItem(moduleId);
    item.sheet.render(true);
  }

  async _onClickDeleteModule(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const moduleId = targetButton.dataset.module;
    this.actor.deleteOwnedItem(moduleId);
  }

  _onClickCreateFeature(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const type = targetButton.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(targetButton.dataset);
    // Initialize a default name.
    const name = data.defaultname;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data,
    };

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];
    // no need to keep ahold of defaultname after creation.
    delete itemData.data["defaultname"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  _onClickEditFeature(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const featureId = targetButton.dataset.feature;
    const item = this.actor.getOwnedItem(featureId);
    item.sheet.render(true);
  }

  async _onClickDeleteFeature(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const featureId = targetButton.dataset.feature;
    this.actor.deleteOwnedItem(featureId);
  }

  async _onClickEPBarSegment(event) {
    event.preventDefault();
    const canChange = canChangeEPForShip(this.actor);
    if (!canChange) {
      ui.notifications.error(
        game.i18n.localize("YZECORIOLIS.InvalidEPPermissions")
      );
      return;
    }
    // when the EP bar is clicked, do the standard data fetching, but activate the correct EPTokens
    const newBarValue = this.getNewBarValue(event);
    if (crewHasTokens(this.actor)) {
      ui.notifications.info(
        game.i18n.localize("YZECORIOLIS.EnergyPointsReset")
      );
    }
    await setActiveEPTokens(this.actor, newBarValue);
  }

  // you can distribute EP to crew mates, but only the engineer and GM can.
  async _onClickCrewEPBarSegment(event) {
    event.preventDefault();
    const canChange = canChangeEPForShip(this.actor);
    if (!canChange) {
      ui.notifications.error(
        game.i18n.localize("YZECORIOLIS.InvalidEPPermissions")
      );
      return;
    }
    const targetSegment = event.currentTarget;
    const crewId = targetSegment.dataset.crew;
    const newBarValue = this.getNewBarValue(event);
    await setCrewEPCount(this.actor, crewId, newBarValue);
  }

  async _onClickHullBarSegment(event) {
    event.preventDefault();
    const targetSegment = event.currentTarget;
    const newBarValue = this.getNewBarValue(event);

    const targetField = targetSegment.dataset.name;
    let update = {};
    update[targetField] = newBarValue;
    await this.actor.update(update);
  }

  getNewBarValue(event) {
    event.preventDefault();
    const targetSegment = event.currentTarget;
    // Get the bar segment data
    const index = Number(targetSegment.dataset.index) || 0;
    const curValue = Number(targetSegment.dataset.current) || 0;
    const minValue = Number(targetSegment.dataset.min) || 0;
    const maxValue = Number(targetSegment.dataset.max) || 0;
    // Grab any data associated with this control.
    return computeNewBarValue(index, curValue, minValue, maxValue);
  }

  async _onClickToggleModule(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const moduleId = targetButton.dataset.module;
    return toggleShipModule(this.actor, moduleId);
  }

  async _onRollCrewPosition(event) {
    event.preventDefault();
    const targetPortrait = event.currentTarget;
    const crewId = targetPortrait.dataset.crew;
    const crewEntity = getActorEntityById(crewId);

    // For rolling on the ship sheet, the user who owns that actor can roll on
    // the ship sheet. The GM can also roll any actor.
    const isGM = game.user.isGM;

    //  you own a character (in the case you may
    // be running two different characters at the same time in a session)
    const isRollingForOwnActor =
      crewEntity.permission === CONST.ENTITY_PERMISSIONS.OWNER;

    if (!isGM && !isRollingForOwnActor) {
      ui.notifications.error(
        game.i18n.localize("YZECORIOLIS.InvalidCrewRollPermissions")
      );
      return;
    }

    const crewmate = getActorById(crewId);
    const crewPosition = crewmate.data.bio.crewPosition;
    const skillKey = CONFIG.YZECORIOLIS.crewRolls[crewPosition.position];
    const attributeKey = crewmate.data.skills[skillKey].attribute;

    // create a skill roll based off the crew's position.
    const rollData = {
      rollType: crewmate.data.skills[skillKey].category,
      skillKey: skillKey,
      skill: skillKey ? crewmate.data.skills[skillKey].value : 0,
      attributeKey: attributeKey,
      attribute: attributeKey
        ? crewmate.data.attributes[attributeKey].value
        : 0,
      modifier: 0,
      rollTitle: CONFIG.YZECORIOLIS.skillRolls[skillKey],
      pushed: false,
      actor: crewEntity,
    };

    const chatOptions = crewEntity._prepareChatRollOptions(
      "systems/yzecoriolis/templates/sidebar/roll.html",
      "skill"
    );
    coriolisModifierDialog((modifier) => {
      rollData.modifier = modifier;
      coriolisRoll(chatOptions, rollData);
    });
  }

  _onHoverInCrewPortrait(event) {
    event.preventDefault();
    // make the number animate
    const portraitDiv = event.currentTarget;
    $(portraitDiv).find(".crew-roll-number").addClass("crew-roll-number-hover");
    $(portraitDiv).find(".roll-glow").addClass("roll-glow-animated");
    // brighten the portraits a bit
    $(portraitDiv)
      .parent()
      .find(".crew-portrait")
      .addClass("crew-portrait-hovered");
  }

  _onHoverOutCrewPortrait(event) {
    event.preventDefault();
    // make the number animation reset.
    const portraitDiv = event.currentTarget;
    $(portraitDiv)
      .find(".crew-roll-number")
      .removeClass("crew-roll-number-hover");

    $(portraitDiv).find(".roll-glow").removeClass("roll-glow-animated");
    $(portraitDiv)
      .parent()
      .find(".crew-portrait")
      .removeClass("crew-portrait-hovered");
  }

  /**
   * Handle showing an item's description in the character sheet as an easy fold out.
   * @private
   */
  _onFeatureSummary(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.getOwnedItem(li.data("item-id"));
    const chatData = item.getChatData({ secrets: this.actor.owner });
    // Toggle summary
    if (li.hasClass("expanded")) {
      let summary = li.children(".item-summary");
      summary.slideUp(200, () => {
        summary.remove();
      });
    } else {
      let div = $(
        `<div class="item-summary"><div class="item-summary-wrapper"><div>${chatData.description}</div></div></div>`
      );
      let props = $(`<div class="item-properties"></div>`);

      $(div).find(".item-summary-wrapper").append(props);
      li.append(div.hide());
      div.slideDown(200);
    }
    li.toggleClass("expanded");
  }
}
