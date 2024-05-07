import isometricMapData from "../assets/map/init";
import { getGroundRuleByName, hasEnoughResourceToApplyCost } from "../scene/game/create";
import { getDesertTiles, getGrassTiles, getNeighbors, resetTileEvents, resetSpecificTileEvent, TILE_FACTOR } from "./util";
import { checkKnowledgeLoading } from "./knowledge";

/**
 * Main function to check event enabling and display them to each game refresh.
 */
export function checkEventEnabling() {
    //Local events
    checkForLocalEvents.call(this);
    displayLocalEvents.call(this);

    //Global events
    checkForGlobalEvents.call(this);
}


/*******************
 *    CONSTANTS    *
 *******************/

const RESOURCE_COST = 5; //50% (of the default tile value, that is 10)
const DECREASE_SOIL_THRESHOLD = 0.3; //fertile tile 30% leftover
const NEIGHBOR_ON_FIRE_PERCENTAGE = 0.2; //20% of chance to set neighbor tile on fire
const ON_FIRE_PERCENTAGE = 0.1; //10% of chance to see new fire appeared
const NEIGHBOR_ILLNESS_PERCENTAGE = 0.2; //20% of chance to get neighbor tile sick
const ILLNESS_PERCENTAGE = 0.1; //10% of chance to see new illness appeared
const SANDSTORM_PERCENTAGE = 0.005; //0.5% of chance to see sandstorm
const DISABLE_SANDSTORM_PERCENTAGE = 0.4; //40% of chance to stop sandstorm
const HEATWAVE_PERCENTAGE = 0.01; //1% of chance to see heatwave
const DISABLE_HEATWAVE_PERCENTAGE = 0.3; //30% of chance to stop heatwave
const RAIN_PERCENTAGE = 0.01; //1% of chance to see rain
const DISABLE_RAIN_PERCENTAGE = 0.3; //30% of chance to stop rain

const HEATWAVE_ON_FIRE_EFFECT = 0.1; //10% extra of chance to see new fire appeared


/******************************
 *    LOCAL EVENT ENABLING    *
 *****************************/

/**
 * Checks different possible local events.
 */
function checkForLocalEvents() {
    enableDecreaseSoil.call(this);
    enableFire.call(this);
    enableIllness.call(this);
}
function enableDecreaseSoil() {
    let concernedTiles = getGrassTiles.call(this)
        .filter(tile => tile.getData('events').content.find(event => event.name === 'decrease_soil') === undefined)
        .filter(tile => tile.getData('value') < DECREASE_SOIL_THRESHOLD);

    if (concernedTiles.length > 0) checkKnowledgeLoading.call(this, 'decreaseSoil');

    concernedTiles.forEach(function(tile) {
        tile.getData('events').content.push({'name': 'decrease_soil', 'sprite': undefined});
    });
}
function enableFire() {
    const scene = this;
    const fireableTiles = getGrassTiles.call(this).concat(getDesertTiles.call(this))
        .filter(tile => tile.getData('events').content.find(event => event.name === 'fire') === undefined)
        .filter(tile => tile.getData('content') !== undefined);
    const alreadyOnFireTiles = getGrassTiles.call(this).concat(getDesertTiles.call(this))
        .filter(tile => tile.getData('events').content.find(event => event.name === 'fire') !== undefined);

    let onFirePercentage = ON_FIRE_PERCENTAGE;
    if (scene.globalEvent === 'heatwave') onFirePercentage += HEATWAVE_ON_FIRE_EFFECT;

    //if there is at least one fire on map
    if (alreadyOnFireTiles.length > 0) {
        const haveFullNeighbors = alreadyOnFireTiles.filter(function(tile) {
            return getNeighbors.call(scene, Math.floor(tile.isoX / TILE_FACTOR), Math.floor(tile.isoY / TILE_FACTOR))
                .filter(tile => tile.getData('events').content.find(event => event.name === 'fire') === undefined)
                .filter(neighbor => neighbor.getData('content') !== undefined).length > 0;
        });
        if (haveFullNeighbors.length > 0) {
            const randomTile = haveFullNeighbors[Math.floor(Math.random() * haveFullNeighbors.length)];
            const neighbors =
                getNeighbors.call(this, Math.floor(randomTile.isoX / TILE_FACTOR), Math.floor(randomTile.isoY / TILE_FACTOR))
                    .filter(tile => tile.getData('events').content.find(event => event.name === 'fire') === undefined)
                    .filter(neighbor => neighbor.getData('content') !== undefined);
            let randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];

            //40% of chance to set neighbor tile on fire
            if (Math.random() < NEIGHBOR_ON_FIRE_PERCENTAGE) {
                randomNeighbor.getData('events').content.push({'name': 'fire', 'sprite': undefined});
            }
        };
    }
    //otherwise, 20% of chance to see new fire appeared
    else if (fireableTiles.length > 0 && Math.random() < onFirePercentage) {
        checkKnowledgeLoading.call(this, 'fire');

        let randomTile = fireableTiles[Math.floor(Math.random() * fireableTiles.length)];
        randomTile.getData('events').content.push({'name': 'fire', 'sprite': undefined});
    }
}
function enableIllness() {
    const scene = this;
    const illnessableTiles = getGrassTiles.call(this).concat(getDesertTiles.call(this))
        .filter(tile => tile.getData('events').content.find(event => event.name === 'illness') === undefined)
        .filter(function(tile) {
            const content = tile.getData('content');
            return content !== undefined && content.getData('type') === 'habitation';
        });
    const alreadyIllnessTiles = getGrassTiles.call(this).concat(getDesertTiles.call(this))
        .filter(tile => tile.getData('events').content.find(event => event.name === 'illness') !== undefined);

    //if there is at least one illness on map
    if (alreadyIllnessTiles.length > 0) {
        const haveFullNeighbors = alreadyIllnessTiles.filter(function(tile) {
            return getNeighbors.call(scene, Math.floor(tile.isoX / TILE_FACTOR), Math.floor(tile.isoY / TILE_FACTOR))
                .filter(tile => tile.getData('events').content.find(event => event.name === 'illness') === undefined)
                .filter(function(tile) {
                    const content = tile.getData('content');
                    return content !== undefined && content.getData('type') === 'habitation';
                }).length > 0;
        });
        if (haveFullNeighbors.length > 0) {
            const randomTile = haveFullNeighbors[Math.floor(Math.random() * haveFullNeighbors.length)];
            const neighbors =
                getNeighbors.call(this, Math.floor(randomTile.isoX / TILE_FACTOR), Math.floor(randomTile.isoY / TILE_FACTOR))
                    .filter(tile => tile.getData('events').content.find(event => event.name === 'illness') === undefined)
                    .filter(function(tile) {
                        const content = tile.getData('content');
                        return content !== undefined && content.getData('type') === 'habitation';
                    });
            let randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];

            //15% of chance to get neighbor tile sick
            if (Math.random() < NEIGHBOR_ILLNESS_PERCENTAGE) {
                randomNeighbor.getData('events').content.push({'name': 'illness', 'sprite': undefined});
            }
        };
    }
    //otherwise, 5% of chance to see new illness appeared
    else if (illnessableTiles.length > 0 && Math.random() < ILLNESS_PERCENTAGE) {
        checkKnowledgeLoading.call(this, 'illness');

        let randomTile = illnessableTiles[Math.floor(Math.random() * illnessableTiles.length)];
        randomTile.getData('events').content.push({'name': 'illness', 'sprite': undefined});
    }
}


/*******************************
 *    GLOBAL EVENT ENABLING    *
 *******************************/

/**
 * Checks different possible global events.
 */
function checkForGlobalEvents() {
    enableSandstorm.call(this);
    enableHeatwave.call(this);
    enableRain.call(this);
}
function enableSandstorm() {
    //enables sandstorm
    if (this.globalEvent === undefined) {
        if (Math.random() < SANDSTORM_PERCENTAGE) {
            this.globalEvent = 'sandstorm';
            console.log("sandstorm appearing");

            checkKnowledgeLoading.call(this, 'sandstorm');
        }
        return;
    }

    //disables sandstorm
    if (this.globalEvent === 'sandstorm' && Math.random() < DISABLE_SANDSTORM_PERCENTAGE) {
        this.globalEvent = undefined;
        console.log("sandstorm disappearing");
        return;
    }

    //lasts sandstorm...
}
function enableHeatwave() {
    //enables heatwave
    if (this.globalEvent === undefined) {
        if (Math.random() < HEATWAVE_PERCENTAGE) {
            this.globalEvent = 'heatwave';
            console.log("heatwave appearing");

            checkKnowledgeLoading.call(this, 'heatwave');
        }
        return;
    }

    //disables heatwave
    if (this.globalEvent === 'heatwave' && Math.random() < DISABLE_HEATWAVE_PERCENTAGE) {
        this.globalEvent = undefined;
        console.log("heatwave disappearing");
        return;
    }

    //lasts heatwave...
}
function enableRain() {
    //enables rain
    if (this.globalEvent === undefined) {
        if (Math.random() < RAIN_PERCENTAGE) {
            this.globalEvent = 'rain';
            console.log("rain appearing");

            checkKnowledgeLoading.call(this, 'rain');
        }
        return;
    }

    //disables rain
    if (this.globalEvent === 'rain' && Math.random() < DISABLE_RAIN_PERCENTAGE) {
        this.globalEvent = undefined;
        console.log("rain disappearing");
        return;
    }

    //lasts rain...
}


/*******************************
 *    LOCAL EVENT RESOLVING    *
 *******************************/

/**
 * Removes events from map and applying some callback effects, if the player clicks on them.
 */
export function resolveEvents(tile) {
    const scene = this;
    const events = tile.getData('events');

    events.content.forEach(function(event) {
        if (hasEnoughResourceToApplyCost.call(scene, 'ecosystem', RESOURCE_COST)) {
            if (event.name === 'decrease_soil') {
                resolveDecreaseSoil.call(scene, tile);
            }
        }
        if (hasEnoughResourceToApplyCost.call(scene, 'civilisation', RESOURCE_COST)) {
            if (event.name === 'fire') {
                resolveFire.call(scene);
            }
            else if (event.name === 'illness') {
                resolveIllness.call(scene);
            }
        }
    });

    resetTileEvents.call(scene, tile);
}
function resolveDecreaseSoil(tile) {
    const rule = getGroundRuleByName.call(this, tile.getData('name'));
    tile.setData({'value': rule.value});

    getNeighbors.call(this, Math.floor(tile.isoX / TILE_FACTOR), Math.floor(tile.isoY / TILE_FACTOR))
        .filter(tile => tile.getData('events').content.find(event => event.name === 'decrease_soil') !== undefined)
        .forEach(function(tile) {
            resetSpecificTileEvent.call(this, tile, 'decrease_soil');
            tile.setData({'value': rule.value});
        });

    this.ecosystemValue -= RESOURCE_COST;
}
function resolveFire() {
    this.civilisationValue -= RESOURCE_COST;
}
function resolveIllness() {
    this.civilisationValue -= RESOURCE_COST;
}


/**************
 *    MISC    *
 **************/

/**
 * Updates (if necessary) the scene with event sprites adding.
 */
function displayLocalEvents() {
    const eventPrefix = 'events/';
    const tileHeight = isometricMapData.tileheight;

    const scene = this;
    this.groundLayer.getChildren()
        .filter(tile => tile.getData('events').content.filter(event => event.sprite === undefined).length > 0)
        .forEach(function(tile) {
            const events = tile.getData('events');
            const notificationParams = chooseNotificationParams.call(scene, events.content.length);

            if (events.container !== undefined) events.container.destroy();
            events.container = scene.add.isoSprite(tile.isoX, tile.isoY, tileHeight * 0.8,
                eventPrefix + notificationParams.sprite);

            events.content.forEach(function(event, index) {
                const position = notificationParams.positions[index];
                if (event.sprite !== undefined) event.sprite.destroy();
                event.sprite = scene.add.isoSprite(tile.isoX + position.x, tile.isoY + position.y, tileHeight * 0.9, eventPrefix + event.name);
            });
        });
}

/**
 * Chooses the notification sprite name and positions according to the given events array size.
 */
function chooseNotificationParams(size) {
    if (size === 1) {
        return {
            'sprite': 'notification_for_one',
            'positions':[{'x': 0, 'y': 0}]
        };
    } else if (size === 2) {
        return {
            'sprite': 'notification_for_two',
            'positions':[{'x': -8, 'y': 8}, {'x': 8, 'y': -8}]
        };
    } else if (size === 3) {
        return {
            'sprite': 'notification_for_three',
            'positions': [{'x': -16, 'y': 16}, {'x': 0, 'y': 0}, {'x': 16, 'y': -16}]
        };
    }
    console.log('UNKNOWN NOTIFICATION SIZE');
}
