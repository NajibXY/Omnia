import IsoPlugin from "phaser3-plugin-isometric";

export function preload() {
    loadPlugins.call(this);
    loadInputs.call(this);
    loadSprites.call(this);
}

function loadPlugins() {
    this.load.scenePlugin({
        key: "IsoPlugin",
        url: IsoPlugin,
        sceneKey: "iso"
    });
}

function loadInputs() {
    this.input.on('gameout', function() {
        this.mouseIn = false;
    }.bind(this));
    this.input.on('gameover', function() {
        this.mouseIn = true;
    }.bind(this));
}

function loadSprites() {
    this.load.setPath('src/assets/sprites/');

    this.load.image('grounds/desert');
    this.load.image('grounds/grass');
    this.load.image('grounds/water');

    this.load.image('objects/greenery_1');
    this.load.image('objects/house');
    this.load.image('objects/palm_1');
    this.load.image('objects/palm_2');
    this.load.image('objects/tree_1');
    this.load.image('objects/tree_2');

    this.load.image('icons/tools/bulldozer');

    this.load.image('events/decrease_soil');
    this.load.image('events/fire');
    this.load.image('events/illness');
    this.load.image('events/notification_for_one');
    this.load.image('events/notification_for_three');
    this.load.image('events/notification_for_two');
}
