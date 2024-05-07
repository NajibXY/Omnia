import {
    getWaterIncludedBorders, getFertileExcludedBorders, getDesertTiles, getGrassTiles, getFarmingObjects, getVegetationObjects, getHabitationObjects, getSecondRangeNeighbors,
    values, sum, resetIntoDesert, resetTileTexture, resetTileContent, resetTileEvents, TILE_FACTOR
} from "./util";
import { checkEventEnabling } from "./event";
import { checkKnowledgeLoading } from "./knowledge";

/**
 * Main function to make all logic computations.
 * Updates the game state every 1 second.
 */
export function updateLogic() {
    const hudScene = this.scene.get("hudScene");
    if(hudScene && hudScene.sys.config.active) {
        console.log('game refresh ' + this.counter++);

        //Player's gains computation
        computeResourceGains.call(this);

        if(this.counter > 5) {
            //Endgame checking
            checkEndgames.call(this);

            //Tile relations checking
            checkMissingVegetation.call(this);
            checkExcessiveFarming.call(this);
            checkBalanceFarmingProduction.call(this);
            checkFarawayHabitation.call(this);
            checkResetIntoDesert.call(this);
            checkResetObject.call(this);

            //Event checking
            checkFertileSoil.call(this);
            checkFire.call(this);
            checkIllness.call(this);

            //Event enabling & display
            checkEventEnabling.call(this);
        }
    }
}


/*******************
 *    CONSTANTS    *
 *******************/

const OBJECT_COST = 10;
const EVAPORATION_THRESHOLD = 200;
const EXCESSIVE_FARMING_DELTA = 50;
const FARMING_BALANCE_DELTA = 50;
const EVAPORATION_SAMPLE = 0.1; //10%
const EVAPORATION_DECREMENT = 0.05; //5% (of the default tile value, that is 1)
const FERTILE_PERCENTAGE = 0.3; //30%
const HABITATION_DECREMENT = 0.5; //5% (of the default object value, that is 10)
const FARMING_DECREMENT = HABITATION_DECREMENT; //10% (idem that just above)
const DECREASE_SOIL_SAMPLE = 0.15; //15%
const DECREASE_SOIL_DECREMENT = 0.5; //5% (of the default object value, that is 10)
const FIRE_DECREMENT = DECREASE_SOIL_DECREMENT; //2.5% (idem that just above)
const ILLNESS_DECREMENT = FIRE_DECREMENT; //2.5% (idem that just above)
const RESOURCE_PERCENTAGE = 0.05; //5% of the total resource value

const HEATWAVE_EVAPORATION_EFFECT = 2; //x2 factor of evaporation increasing
const RAIN_EVAPORATION_EFFECT = 3; //x3 factor of evaporation decreasing
const HEATWAVE_FERTILE_EFFECT = 2; //x2 factor of new tile not appearing
const RAIN_FERTILE_EFFECT = 1; //100% of chance to see new fertile tile when it's raining
const SANDSTORM_FARAWAY_EFFECT = 2; //x2 factor of faraway house damages
const HEATWAVE_DECREASE_SOIL_EFFECT = 2; //x2 factor of soil value decreasing
const HEATWAVE_FIRE_EFFECT = 2; //x2 factor of fire increasing


/**************************
 *    ENDGAME CHECKING    *
 **************************/

/**
 * Checks different possible endgames.
 */
function checkEndgames() {
    let activeEndgame = null;

    //first endgame: no vegetation on map + not enough of ecosystem resource.
    const first = getVegetationObjects.call(this).length === 0 && this.ecosystemValue < OBJECT_COST;
    if (first) activeEndgame = 'firstEndgame';

    //second endgame: no farming/habitations on map + not enough of civilisation resource.
    const second = getFarmingObjects.call(this).concat(getHabitationObjects.call(this)).length === 0
        && this.civilisationValue < OBJECT_COST;
    if (second) activeEndgame = 'secondEndgame';

    //third endgame: no fertile tiles available anymore.
    const third = getGrassTiles.call(this).length === 0;
    if (third) activeEndgame = 'thirdEndgame';

    //then stop timer.
    if (activeEndgame !== null) {
        checkKnowledgeLoading.call(this, activeEndgame);
        this.timedEvent.remove();
        console.log("game over");
    }
}


/****************************************
 *    EVENT & TILE RELATION CHECKING    *
 ****************************************/

/**
 * Checks if there is needed to apply event effects / tile relation effects.
 */
function checkMissingVegetation() {
    const plantsSum = sum.call(this,
        getGrassTiles.call(this)
            .filter(function(tile) {
                const content = tile.getData('content');
                return content !== undefined
                    && content.getData('type') !== 'habitation'
                    && content.getData('value') !== 0;
            })
            .map(function(tile) {
                const factor = tile.getData('value');
                return tile.getData('content').getData('value') * factor;
            })
    );

    //If inferior to threshold of 200, remove a random number of random water/fertile tiles.
    if (plantsSum < EVAPORATION_THRESHOLD) {
        checkKnowledgeLoading.call(this, 'missingVegetation');
        reduceWaterAndFertileTiles.call(this);
    }
    //Otherwise, with a probability of 30%, add a new fertile tile.
    else {
        checkKnowledgeLoading.call(this, 'addingFertile');
        addFertileTile.call(this);
    }
}
function checkExcessiveFarming() {
    const farmingSum = sum.call(this,
        getGrassTiles.call(this)
            .filter(function(tile) {
                const content = tile.getData('content');
                return content !== undefined
                    && content.getData('type') === 'farming'
                    && content.getData('value') !== 0;
            })
            .map(function(tile) {
                const factor = tile.getData('value');
                return tile.getData('content').getData('value') * factor;
            })
    );
    const fertileCount = getGrassTiles.call(this).length;

    const result = farmingSum - fertileCount;

    //If superior to delta threshold, reduce the value of random water/fertile tiles.
    if (result > EXCESSIVE_FARMING_DELTA) {
        checkKnowledgeLoading.call(this, 'excessiveFarming');
        reduceWaterAndFertileTiles.call(this);
    }
}
function checkBalanceFarmingProduction() {
    const houseSum = sum.call(this, values.call(this, getHabitationObjects.call(this)));
    const farmingSum = sum.call(this, values.call(this, getFarmingObjects.call(this)));

    const result = houseSum - farmingSum;

    //If there are too many houses to be provided with farming, then reduce the value of all habitations.
    if (result > FARMING_BALANCE_DELTA) {
        checkKnowledgeLoading.call(this, 'balanceFarming');
        reduceHouseObjects.call(this);
    }
    //Otherwise, reduce the value of all farmings.
    else if (result < -FARMING_BALANCE_DELTA) {
        checkKnowledgeLoading.call(this, 'balanceFarming');
        reduceFarmingObjects.call(this);
    }
}
function checkFarawayHabitation() {
    const fertileTiles = getGrassTiles.call(this);
    const desertTiles = getDesertTiles.call(this);

    const scene = this;
    const farawayHouseObjects = fertileTiles.concat(desertTiles)
        .filter(function(tile) {
            const content = tile.getData('content');
            return content !== undefined
                && content.getData('type') === 'habitation'
                && content.getData('value') !== 0;
        })
        .filter(function(tile) {
            const intX = Math.floor(tile.isoX / TILE_FACTOR);
            const intY = Math.floor(tile.isoY / TILE_FACTOR);
            return !getSecondRangeNeighbors.call(scene, intX, intY)
                .filter(neighbor => neighbor.getData('name') !== 'desert').length > 0
        });

    if (farawayHouseObjects.length > 0) {
        checkKnowledgeLoading.call(this, 'farawayHouse');
        reduceFarawayHouseObjects.call(this, farawayHouseObjects);
    }
}
function checkFertileSoil() {
    reduceRandomFarmingObjects.call(this);
}
function checkFire() {
    reduceOnFireObjects.call(this);
}
function checkIllness() {
    reduceIllnessObjects.call(this);
}


/**************************************
 *    EVENT / TILE EFFECT ENABLING    *
 **************************************/

/**
 * Applies the related relation effect on tiles/objects.
 */
function reduceWaterAndFertileTiles() {
    const waterTiles = getWaterIncludedBorders.call(this);
    const fertileTiles = getGrassTiles.call(this);
    const concernedTiles = waterTiles.concat(fertileTiles);

    //Do nothing if there are no concerned tiles anymore.
    if (concernedTiles.length === 0) return;

    let tileSample = EVAPORATION_SAMPLE;
    if (this.globalEvent === 'heatwave') tileSample *= HEATWAVE_EVAPORATION_EFFECT;
    else if (this.globalEvent === 'rain') tileSample /= RAIN_EVAPORATION_EFFECT;

    concernedTiles
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.ceil(concernedTiles.length * tileSample))
        .forEach(tile => tile.setData({'value': Math.max(0, tile.getData('value') - EVAPORATION_DECREMENT)}));
}
function addFertileTile() {
    let fertilePercentage = FERTILE_PERCENTAGE;
    if (this.globalEvent === 'heatwave') fertilePercentage /= HEATWAVE_FERTILE_EFFECT;
    else if (this.globalEvent === 'rain') fertilePercentage = RAIN_FERTILE_EFFECT;

    if (Math.random() < fertilePercentage) {
        const desertTiles = getFertileExcludedBorders.call(this);
        if (desertTiles.length === 0) return;

        const randomTile = desertTiles[Math.floor(Math.random() * desertTiles.length)];
        resetTileTexture.call(this, randomTile, 'grass');
    }
}
function reduceHouseObjects() {
    const houseObjects = getHabitationObjects.call(this);
    houseObjects.forEach(object => object.setData({'value': Math.max(0, object.getData('value') - HABITATION_DECREMENT)}));
}
function reduceFarmingObjects() {
    const farmingObjects = getFarmingObjects.call(this);
    farmingObjects.forEach(object => object.setData({'value': Math.max(0, object.getData('value') - FARMING_DECREMENT)}));
}
function reduceFarawayHouseObjects(farawayHouseObjects) {
    let habitationDecrement = HABITATION_DECREMENT;
    if (this.globalEvent === 'sandstorm') habitationDecrement *= SANDSTORM_FARAWAY_EFFECT;

    farawayHouseObjects.forEach(object => object.setData({'value': Math.max(0, object.getData('value') - habitationDecrement)}));
}
function reduceRandomFarmingObjects() {
    if (this.globalEvent !== 'rain') {
        let soilSample = DECREASE_SOIL_SAMPLE;
        if (this.globalEvent === 'heatwave') soilSample *= HEATWAVE_DECREASE_SOIL_EFFECT;

        const randomFarmingObjects = getFarmingObjects.call(this);
        randomFarmingObjects
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.ceil(randomFarmingObjects.length * soilSample))
            .forEach(object => object.setData({'value': Math.max(0, object.getData('value') - DECREASE_SOIL_DECREMENT)}));
    }
}
function reduceOnFireObjects() {
    if (this.globalEvent !== 'rain') {
        this.groundLayer.getChildren()
            .filter(tile => tile.getData('events').content.find(event => event.name === 'fire') !== undefined)
            .forEach(function(tile) {
                const content = tile.getData('content');
                content.setData({'value': Math.max(0, content.getData('value') - FIRE_DECREMENT)});
            });
    }
}
function reduceIllnessObjects() {
    this.groundLayer.getChildren()
        .filter(tile => tile.getData('events').content.find(event => event.name === 'illness') !== undefined)
        .forEach(function(tile) {
            const content = tile.getData('content');
            content.setData({'value': Math.max(0, content.getData('value') - ILLNESS_DECREMENT)});
        });
}


/************************************
 *    RESOURCE GAINS COMPUTATION    *
 ************************************/

/**
 * Computes the ecosystem and civilisation gains for player.
 */
function computeResourceGains() {
    //ecosystem gain (5% of vegetation values sum)
    const ecosystemObjects = getVegetationObjects.call(this);
    const ecosystemSum = sum.call(this, values.call(this, ecosystemObjects));
    this.ecosystemValue += Math.ceil(ecosystemSum * RESOURCE_PERCENTAGE);

    //civilisation gain (5% of farming and habitation values sum)
    const civilisationObjects = getFarmingObjects.call(this).concat(getHabitationObjects.call(this));
    const civilisationSum = sum.call(this, values.call(this, civilisationObjects));
    this.civilisationValue += Math.ceil(civilisationSum * RESOURCE_PERCENTAGE);
}


/*************************
 *    COMPONENT RESET    *
 *************************/

/**
 * Checks if certain tiles should be reset (into desert).
 */
function checkResetIntoDesert() {
    let desertTiles = this.groundLayer.getChildren()
        .filter(tile => tile.getData('name') !== 'desert' && tile.getData('value') <= 0);

    desertTiles.forEach(tile => resetIntoDesert.call(this, tile));
}

/**
 * Checks if certain objects should be reset (into nothing).
 */
function checkResetObject() {
    let objects = this.groundLayer.getChildren()
        .filter(function(tile) {
            const content = tile.getData('content');
            return content !== undefined && content.getData('value') <= 0;
        });

    objects.forEach(function(tile) {
        resetTileContent.call(this, tile);
        resetTileEvents.call(this, tile);
    });
}
