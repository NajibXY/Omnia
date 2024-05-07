import Phaser from "phaser";
import { preload } from "./scene/game/preload";
import { create } from "./scene/game/create";
import { update } from "./scene/game/update";
import { preloadHUD } from "./scene/hud/preloadHUD";
import {createHUD, resolveClick} from "./scene/hud/createHUD";
import { updateHUD } from "./scene/hud/updateHUD";
import { preloadDialog } from "./scene/dialog/preloadDialog";
import { createDialog, createEventKnowledgeDialog } from "./scene/dialog/createDialog";
import MouseWheelToUpDownPlugin from "phaser3-rex-plugins/plugins/mousewheeltoupdown-plugin";
import { getFarmingObjects, getVegetationObjects, getHabitationObjects } from "./logic/util";


const GameScene = new Phaser.Class({

    Extends: Phaser.Scene,
    initialize: function GameScene() {
        Phaser.Scene.call(this, {key: 'gameScene', active: true, mapAdd: {isoPlugin: "iso"}});
        this.cursorKeys = null;
        this.groundLayer = null;
        this.mouseIn = true;
        this.newSelectedObject = null;
        this.preview = null;

        // Values variables for HUD
        this.ecosystemValue = null;
        this.civilisationValue = null;
    },
    preload: function(){
        return preload.call(this);
    },
    create: function(){
        return create.call(this);
    },
    update: function(){
        return update.call(this);
    },
    switchMode: function(mode){
        switch(mode) {
            case "Agriculture":
                const fields = ['greenery_1', 'palm_1', 'palm_2'];
                this.newSelectedObject = fields[Math.floor(Math.random() * fields.length)];
                break;
            case "Végétation":
                const trees = ['tree_1', 'tree_2'];
                this.newSelectedObject = trees[Math.floor(Math.random() * trees.length)];
                break;
            case "Habitation":
                this.newSelectedObject = 'house';
                break;
            case "Bulldozer":
                this.newSelectedObject = 'bulldozer';
                break;
        }
    },
    getObjectsCount(objectType) {
        switch(objectType) {
            case "farming":
                return getFarmingObjects.call(this).length;
            case "vegetation":
                return getVegetationObjects.call(this).length;
            case "habitation":
                return getHabitationObjects.call(this).length;
        }
    },
    getLocalEventCount(eventName) {
        return this.groundLayer.getChildren()
            .filter(tile => tile.getData('events').content.find(event => event.name === eventName) !== undefined).length
    },
    getLabelGlobalEvent() {
        switch(this.globalEvent) {
            case "heatwave":
                return "Forte chaleur";
            case "rain":
                return "Pluie diluvienne";
            case "sandstorm":
                return "Tempête de sable";
            default:
                return "Aucun"
        }
    }
});

const HUDScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function HUDScene() {
        Phaser.Scene.call(this, {key: 'hudScene', active: true});

        // Bottom HUD grid
        this.gridTable = null;

        // left HUD grid
        this.menuTable = null;

        // Labels for right HUD
        this.nbHab = null;
        this.nbFarm = null;
        this.nbVege = null;
        this.labelFire = null;
        this.labelSick = null;
        this.labelFertility = null;
        this.labelGlobalEvent = null;

        // Labels for top HUD
        this.civLabel = null;
        this.ecosysLabel = null;

        // data for bottom grid
        this.gridData = [
            {
                id: "Agriculture",
                color: 0xADF12D,
                selected: false,
                cost: "(10 civ)"
            },
            {
                id: "Végétation",
                color: 0x36F12D,
                selected: false,
                cost: "(10 eco)"
            },
            {
                id: "Habitation",
                color: 0x148121,
                selected: false,
                cost: "(10 civ)"
            },
            {
                id: "Bulldozer",
                color: 0xF21409,
                selected: false,
                cost: "(5 civ/eco)"
            }
        ];

        // data for left grid
        this.menuData = [];
    },
    preload: function(){
        return preloadHUD.call(this);
    },
    create: function(){
        return createHUD.call(this);
    },
    update: function(){
        return updateHUD.call(this);
    },
    resolveClick: function(data, table){
        return resolveClick.call(this, data, table);
    }
});

const DialogScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function DialogScene() {
        Phaser.Scene.call(this, {key: 'dialogScene', active: true});
        this.dialogCount = 0;
    },
    preload: function(){
        return preloadDialog.call(this);
    },
    create: function(){
        return createDialog.call(this);
    },
    pause: function(){
        this.scene.pause("hudScene");
        this.scene.pause("gameScene");
    },
    resume: function(){
        this.scene.resume("hudScene");
        this.scene.resume("gameScene");
    },
    createEventKnowledgeDialog: function(knowledge){
        return createEventKnowledgeDialog.call(this, knowledge);
    }
});

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'main',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight
    },
    physics: {
        default: false,
    },
    scene: [GameScene, HUDScene, DialogScene],
    plugins: {
        global: [
            {
                key: 'rexMouseWheelToUpDown',
                plugin: MouseWheelToUpDownPlugin,
                start: true
            }
        ]
    },
    fps: {
        min: 10,
        target: 60,
        forceSetTimeOut: true,
    },
    disableContextMenu: true
};

const game = new Phaser.Game(config);
