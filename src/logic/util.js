import { getGroundRuleByName } from "../scene/game/create";

/*******************
 *    CONSTANTS    *
 *******************/

export const TILE_FACTOR = 69.6;
const NEIGHBOR_LIMIT = 2;


/*****************
 *    GETTERS    *
 *****************/

/**
 * Gets border tiles of the water source.
 */
export function getWaterIncludedBorders() {
    return getWaterTiles.call(this).filter(tile =>
        getNeighbors.call(this, Math.floor(tile.isoX / TILE_FACTOR), Math.floor(tile.isoY / TILE_FACTOR))
            .filter(neighbor => neighbor.getData('name') !== 'water')
            .length > NEIGHBOR_LIMIT);
}
/**
 * Gets border desert tiles of the fertile area.
 */
export function getFertileExcludedBorders() {
    return getDesertTiles.call(this).filter(tile =>
        getNeighbors.call(this, Math.floor(tile.isoX / TILE_FACTOR), Math.floor(tile.isoY / TILE_FACTOR))
            .filter(neighbor => neighbor.getData('name') === 'grass')
            .length > NEIGHBOR_LIMIT);
}

/**
 * Gets all existing desert/grass/water tiles.
 */
function getTiles(name) {
    return this.groundLayer.getChildren().filter(tile => tile.getData('name') === name);
}
export function getDesertTiles() {
    return getTiles.call(this, 'desert');
}
export function getGrassTiles() {
    return getTiles.call(this, 'grass');
}
function getWaterTiles() {
    return getTiles.call(this, 'water');
}

/**
 * Gets all existing farming/vegetation/habitation objects.
 */
function getObjects() {
    return this.groundLayer.getChildren()
        .filter(tile => tile.getData('content') !== undefined)
        .map(tile => tile.getData('content'))
}
export function getFarmingObjects() {
    return getObjects.call(this).filter(object => object.getData('type') === 'farming');
}
export function getVegetationObjects() {
    return getObjects.call(this).filter(object => object.getData('type') === 'vegetation');
}
export function getHabitationObjects() {
    return getObjects.call(this).filter(object => object.getData('type') === 'habitation');
}

/**
 * Gets tile from groundLayer collection, according to a given integer position {'x': intX, 'y': intY}.
 */
function getTileByLogicPosition(position) {
    const match = this.groundLayer.getChildren().filter(tile =>
        Math.floor(tile.isoX / TILE_FACTOR) === position.x &&
        Math.floor(tile.isoY / TILE_FACTOR) === position.y);
    if (match.length === 0) return undefined;
    return match[0];
}

/**
 * Gets nearest neighbors of a tile at the given position (intX, intY).
 */
export function getNeighbors(intX, intY) {
    const directions = [
        {'x': 0, 'y': 1},
        {'x': 0, 'y': -1},
        {'x': -1, 'y': 0},
        {'x': 1, 'y': 0},
        {'x': -1, 'y': 1},
        {'x': 1, 'y': 1},
        {'x': -1, 'y': -1},
        {'x': 1, 'y': -1}
    ];

    let neighborPositions = [];
    directions.forEach(function(dir) {
        neighborPositions.push({'x': intX + dir.x, 'y': intY + dir.y});
    });

    let neighborTiles = [];
    const scene = this;
    neighborPositions.forEach(function(position) {
        const neigh = getTileByLogicPosition.call(scene, position);
        if (neigh !== undefined) neighborTiles.push(neigh);
    });

    return neighborTiles;
}

/**
 * Gets nearest neighbors (2-tiles)-distanced of a tile at the given position (intX, intY).
 */
export function getSecondRangeNeighbors(intX, intY) {
    const scene = this;
    let secondRangeNeighborTiles = [];
    let alreadyCheckedTiles = [];
    const firstRangeNeighborTiles = getNeighbors.call(scene, intX, intY);

    alreadyCheckedTiles.push(getTileByLogicPosition.call(this, {'x': intX, 'y': intY}));
    firstRangeNeighborTiles.forEach(tile => alreadyCheckedTiles.push(tile));

    firstRangeNeighborTiles.forEach(function(first) {
        intX = Math.floor(first.isoX / TILE_FACTOR);
        intY = Math.floor(first.isoY / TILE_FACTOR);
        getNeighbors.call(scene, intX, intY)
            .filter(second => !alreadyCheckedTiles.includes(second))
            .forEach(function(second) {
                alreadyCheckedTiles.push(second);
                secondRangeNeighborTiles.push(second);
            });
    });

    return secondRangeNeighborTiles;
}


/********************
 *    OPERATIONS    *
 ********************/

/**
 * Gets all values from objects array.
 */
export function values(array) {
    return array.map(elem => elem.getData('value'));
}

/**
 * Computes the sum of a given set of values.
 */
export function sum(values) {
    return values.reduce((acc, val) => acc + val, 0);
}


/********************
 *    TILE RESET    *
 ********************/

/**
 * Resets tile (i.e. texture, params, content and events) into desert when its value is 0.
 */
export function resetIntoDesert(tile) {
    resetTileTexture.call(this, tile, 'desert');
    resetTileContent.call(this, tile, true);
    resetTileEvents.call(this, tile);
}

/**
 * Resets tile texture and main tile params to default.
 */
export function resetTileTexture(tile, type) {
    const rule = getGroundRuleByName.call(this, type);
    tile.setTexture(rule.prefix + rule.name);
    tile.setData({'name': rule.name, 'value': rule.value});
}

/**
 * Resets content (if existing) of the given tile.
 * The desertReset param (false by default) allows to know if this is a reset desert tile or not.
 */
export function resetTileContent(tile, desertReset = false) {
    const content = tile.getData('content');
    if (content !== undefined) {
        if (desertReset && content.getData('type') === 'habitation') {
            return;
        }
        content.destroy();
        tile.setData({'content': undefined});
    }
}

/**
 * Resets events (if existing) of the given tile.
 */
export function resetTileEvents(tile) {
    let events = tile.getData('events');
    if (events.content.length > 0) {
        events.container.destroy();
        events.content.forEach(event => event.sprite.destroy());
        tile.setData({'events': {'container': undefined, 'content': []}});
    }
}

/**
 * Resets one specific event according to the given eventName.
 */
export function resetSpecificTileEvent(tile, eventName) {
    let events = tile.getData('events');
    if (events.content.length > 0) {
        let eventContent = events.content.find(event => event.name === eventName);
        let allContent = events.content.filter(event => event.name !== eventName);

        if (eventContent !== undefined && allContent.length === 0) {
            events.container.destroy();
            events.content.forEach(event => event.sprite.destroy());
            tile.setData({'events': {'container': undefined, 'content': []}});
        }
        else if (eventContent !== undefined) events.content = allContent;
    }
}
