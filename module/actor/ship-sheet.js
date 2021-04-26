import {
  setActiveEPTokens,
  shipEPCount,
  crewEPCount,
  getMaxAllowedEPTokens,
  setCrewEPCount,
} from "../item/ep-token.js";
import {
  computeNewBarValue,
  onHoverBarSegmentIn,
  onHoverBarOut,
  prepDataBarBlocks,
} from "./databar.js";

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
      .click(this._onClickCrewBarSegment.bind(this));
    html.find(".bar-segment").mouseenter(onHoverBarSegmentIn);
    html.find(".bar").mouseleave(onHoverBarOut);
  }

  async _onClickEPBarSegment(event) {
    event.preventDefault();
    // when the EP bar is clicked, do the standard data fetching, but activate the correct EPTokens
    const newBarValue = this.getNewBarValue(event);
    await setActiveEPTokens(this.actor, newBarValue);
  }

  async _onClickCrewBarSegment(event) {
    event.preventDefault();
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
}
