import isometricMapData from "../../assets/map/init";
import { updateLogic } from '../../logic/logic';
import { resolveEvents } from "../../logic/event";
import { resetTileContent, resetTileEvents } from "../../logic/util";
import { knowledge } from "../../logic/knowledge";

export function create() {
    //Tiled parameters
    this.groundLayer = this.add.group();
    this.iso.projector.origin.setTo(0.5, -0.7);

    //Rules for different sprites, useful for the initial configuration.
    //Warning : the sprites current order is important into loading process, don't interchange them !
    this.rules = {
        'grounds': [
            {'prefix': 'grounds/', 'name': 'desert', 'value': 0},
            {'prefix': 'grounds/', 'name': 'grass', 'value': 1},
            {'prefix': 'grounds/', 'name': 'water', 'value': 1}
        ],
        'objects': [
            {'prefix': 'objects/', 'type': 'farming', 'name': 'greenery_1', 'category': 'civilisation', 'value': 10, 'cost': 10, 'authorized': ['grass']},
            {'prefix': 'objects/', 'type': 'habitation', 'name': 'house', 'category': 'civilisation', 'value': 10, 'cost': 10, 'authorized': ['desert', 'grass']},
            {'prefix': 'objects/', 'type': 'farming', 'name': 'palm_1', 'category': 'civilisation', 'value': 10, 'cost': 10, 'authorized': ['grass']},
            {'prefix': 'objects/', 'type': 'farming', 'name': 'palm_2', 'category': 'civilisation', 'value': 10, 'cost': 10, 'authorized': ['grass']},
            {'prefix': 'objects/', 'type': 'vegetation', 'name': 'tree_1', 'category': 'ecosystem', 'value': 10, 'cost': 10, 'authorized': ['grass']},
            {'prefix': 'objects/', 'type': 'vegetation', 'name': 'tree_2', 'category': 'ecosystem', 'value': 10, 'cost': 10, 'authorized': ['grass']},
        ],
        'tools': [
            {'prefix': 'icons/tools/', 'name': 'bulldozer'}
        ]
    };

    // Keyboard cursor keys handling
    this.cursorKeys = this.input.keyboard.createCursorKeys();
    // Mousewheel keys handling
    this.mouseWheelToUpDown = this.plugins.get('rexMouseWheelToUpDown').add(this);
    this.mouseWheelKeys = this.mouseWheelToUpDown.createCursorKeys();

    this.cameras.main.setBackgroundColor("rgba(105,105,105,1)");

    //Logic parameters
    this.ecosystemValue = 100;
    this.civilisationValue = 100;
    this.globalEvent = undefined;
    this.knowledge = knowledge;

    createMap.call(this);

    //Time parameters
    this.timedEvent = this.time.addEvent({ delay: 1000, callback: updateLogic, callbackScope: this, loop: true });
    this.counter = 0;
}

/**
 * Creates the tiled map from initially loaded json file.
 */
function createMap() {
    let index = 0;
    const tileHeight = isometricMapData.tileheight * 1.2;
    const groundLayer = isometricMapData.layers[0].data;
    const objectLayer = isometricMapData.layers[1].data;

    for (let y = 0; y < isometricMapData.height; y++) {
        for (let x = 0; x < isometricMapData.width; x++) {
            const groundId = groundLayer[index] - 1;
            const groundRule = getGroundRuleById.call(this, groundId);
            const groundPath = groundRule.prefix + groundRule.name;
            let groundTile = this.add.isoSprite(x * tileHeight, y * tileHeight, 0, groundPath, this.groundLayer);
            groundTile.setData({
                'name': groundRule.name,
                'value': groundRule.value,
                'events': {'container': undefined, 'content': []}
            });

            const objectId = objectLayer[index] - 4;
            if (objectId >= 0) {
                const objectRule = getObjectRuleById.call(this, objectId);
                const objectPath = objectRule.prefix + objectRule.name;
                let objectTile = this.add.isoSprite(x * tileHeight, y * tileHeight, isometricMapData.tileheight * 0.8, objectPath);
                objectTile.setData({
                    'name': objectRule.name,
                    'type': objectRule.type,
                    'category': objectRule.category,
                    'value': objectRule.value,
                    'cost' : objectRule.cost
                });
                groundTile.setData({'content': objectTile});
            }

            configureTileEvents.call(this, groundTile, x, y, tileHeight);

            index++;
        }
    }
}

/**
 * Configures events for given tile.
 */
function configureTileEvents(groundTile, x, y, tileHeight) {
    const scene = this;
    scene.preview = null;
    groundTile.setInteractive();

    //first event: preview on hover
    groundTile.on("pointerover", function () {
        //logTileInformation.call(this);

        //No tool is selected
        if (scene.newSelectedObject === null) {
            this.setTint(0xB0B0B0);
            return;
        }

        //The bulldozer tool is selected
        if (scene.newSelectedObject === 'bulldozer') {
            const bulldozerRule = getBulldozerRule.call(scene);
            const bulldozerPath = bulldozerRule.prefix + bulldozerRule.name;
            scene.preview = scene.add.isoSprite(x * tileHeight, y * tileHeight, isometricMapData.tileheight * 0.8, bulldozerPath);
            if (!isEmpty.call(this)
                && hasEnoughResourceToApplyCost.call(scene,
                    this.getData('content').getData('category'),
                    this.getData('content').getData('cost') / 2)) {
                //green (authorized bulldozer removing)
                this.setTintFill(0x05C305);
            } else {
                //red (unauthorized bulldozer removing)
                this.setTintFill(0xD40404);
            }
        }
        // Object tool is selected
        else {
            const objectRule = getObjectRuleByName.call(scene, scene.newSelectedObject);
            const objectPath = objectRule.prefix + objectRule.name;
            scene.preview = scene.add.isoSprite(x * tileHeight, y * tileHeight, isometricMapData.tileheight * 0.8, objectPath);
            scene.preview.setAlpha(0.5);
            if (checkObjectLaying.call(this, scene, objectRule.authorized, objectRule.category, objectRule.cost)) {
                //green (authorized object laying)
                this.setTintFill(0x05C305);
            } else {
                //red (authorized object laying)
                this.setTintFill(0xD40404);
            }
        }
    });

    //second event: put object on tile
    groundTile.on("pointerdown", function () {
        //We can cancel action by clicking with other mouse key
        if (!scene.input.activePointer.leftButtonDown()) {
            this.setTint(0xB0B0B0);
            return;
        }

        //If no tool is selected, useful to click on (to resolve) event notification
        if (scene.newSelectedObject === null) {
            const events = this.getData('events');
            if (events.content.length > 0) {
                resolveEvents.call(scene, this);
            }
        }

        //If the left button is pressed
        //The bulldozer tool is selected
        else if (scene.newSelectedObject === 'bulldozer') {
            if (!isEmpty.call(this)) {
                const content = this.getData('content');
                const category = content.getData('category');
                const cost = content.getData('cost') / 2;
                if (hasEnoughResourceToApplyCost.call(scene, category, cost)) {
                    applyCost.call(scene, category, cost);
                    resetTileContent.call(scene, this);
                    resetTileEvents.call(scene, this);
                    this.setTintFill(0xD40404);
                }
            }
        } else {
            //Object tool is selected
            const objectRule = getObjectRuleByName.call(scene, scene.newSelectedObject);
            if (checkObjectLaying.call(this, scene, objectRule.authorized, objectRule.category, objectRule.cost)) {
                const objectPath = objectRule.prefix + objectRule.name;
                let objectTile = scene.add.isoSprite(x * tileHeight, y * tileHeight, isometricMapData.tileheight * 0.8, objectPath);
                objectTile.setData({
                    'name': objectRule.name,
                    'type': objectRule.type,
                    'category': objectRule.category,
                    'value': objectRule.value,
                    'cost': objectRule.cost
                });
                this.setData({"content": objectTile});
                this.setTintFill(0xD40404);
                applyCost.call(scene, objectRule.category, objectRule.cost);
            }
        }
    });

    //third event: remove preview when we go out of the tile
    groundTile.on("pointerout", function () {
        if (scene.preview !== null) {
            scene.preview.destroy();
            scene.preview = null;
        }
        this.clearTint();
    });
}

/**
 * Checks if the object can be put on tile or not.
 */
function checkObjectLaying(scene, authorized, category, cost) {
    return authorized.includes(this.getData("name"))
        && isEmpty.call(this)
        && hasEnoughResourceToApplyCost.call(scene, category, cost);
}

/**
 * Checks if there is enough of the given resource to apply the given cost.
 */
export function hasEnoughResourceToApplyCost(category, cost) {
    return ((category === 'ecosystem') ? this.ecosystemValue : this.civilisationValue) - cost >= 0;
}

/**
 * Applies cost when object is added on the map.
 */
function applyCost(category, cost) {
    if (category === 'ecosystem') this.ecosystemValue -= cost;
    else this.civilisationValue -= cost;
}

/**
 * Returns the rule for given ground id/name.
 */
function getGroundRuleById(id) {
    return this.rules.grounds[id];
}
export function getGroundRuleByName(name) {
    return this.rules.grounds.find(elem => elem.name === name);
}

/**
 * Returns the rule for given object id/name.
 */
function getObjectRuleById(id) {
    return this.rules.objects[id];
}
function getObjectRuleByName(name) {
    return this.rules.objects.find(elem => elem.name === name);
}

/**
 * Returns the bulldozer rule.
 */
function getBulldozerRule() {
    return this.rules.tools[0];
}

/**
 * Check if tile has content
 */
function isEmpty() {
    return this.getData("content") === undefined;
}

/**
 * Logs information about tile, i.e. its position, type and content.
 */
function logTileInformation() {
    const groundPosition = this._isoPosition;
    const groundName = this.getData("name");
    const groundValue = this.getData("value");

    let contentName = 'noContent';
    let contentValue = 'noValue';
    let contentCost = 'noCost';
    if (!isEmpty.call(this)) {
        const groundContent = this.getData("content");
        contentName = groundContent.getData("name");
        contentValue = groundContent.getData("value");
        contentCost = groundContent.getData("cost");
    }

    console.log(
        '(' + Math.floor(groundPosition.x / 69.6) + ', '
        + Math.floor(groundPosition.y / 69.6) + ', '
        + Math.floor(groundPosition.z / 69.6) + '), '
        + groundName + ', '
        + groundValue + ', '
        + contentName + ', '
        + contentValue + ', '
        + contentCost
    );
}
