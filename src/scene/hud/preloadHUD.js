import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";

export function preloadHUD() {
    loadPlugins.call(this);
    loadSprites.call(this);
}

function loadPlugins() {
    this.load.scenePlugin({
        key: 'rexuiplugin',
        url: RexUIPlugin,
        sceneKey: 'rexUI'
    });
}

function loadSprites() {
    this.load.setPath('src/assets/sprites/');

    this.load.image('icons/hud/ecosystem');
    this.load.image('icons/hud/civ');
}

