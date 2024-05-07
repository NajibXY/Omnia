import { findByTitle } from "../../logic/knowledge";

const COLOR_PRIMARY = 0x4e342e;
const COLOR_LIGHT = 0x7b5e57;
const COLOR_DARK = 0x260e04;

export function createHUD() {
    createMenuHUD.call(this);
    createLabelHUD.call(this);
    createGlobalHUD.call(this);
    createGridHUD.call(this);
}

/**
 * Function for creating the hud to display more global info
 */
function createGlobalHUD() {
    const background = this.rexUI.add.roundRectangle(0, 0, 0, 0, 0, COLOR_PRIMARY).setDepth(0);

    this.nbHab = createRightLabel.call(this, "Habitation : 0", "#FFFFFF", 'left', 10);
    this.nbFarm = createRightLabel.call(this, "Agriculture : 0", "#FFFFFF", 'left', 10);
    this.nbVege = createRightLabel.call(this, "Végétation : 0", "#FFFFFF", 'left', 10);
    this.labelFire = createRightLabel.call(this, "Incendie : 0", "#FFFFFF", 'left', 10);
    this.labelSick = createRightLabel.call(this, "Maladie : 0", "#FFFFFF", 'left', 10);
    this.labelFertility = createRightLabel.call(this, "Perte de fertilité : 0", "#FFFFFF", 'left', 10);
    this.labelGlobalEvent = createRightLabel.call(this, "Événement : aucun", "#FFFFFF", 'left', 10);

    this.rexUI.add.sizer({
        x: window.innerWidth - 100,
        y: 175,
        width: 200,
        height: 350,
        orientation: "y",
    })
        .addBackground(background)
        .add(this.nbHab, 1, 'left')
        .add(this.nbFarm, 1, 'left')
        .add(this.nbVege, 1, 'left')
        .add(this.labelFire, 1, 'left')
        .add(this.labelSick, 1, 'left')
        .add(this.labelFertility, 1, 'left')
        .add(this.labelGlobalEvent, 1, 'left')
        .layout();
}

/**
 * Function for creating the labels for ecosystem and civilisation
 */
function createLabelHUD() {
    const background = this.rexUI.add.roundRectangle(0, 0, 10, 10, 10, COLOR_PRIMARY).setDepth(0);
    this.ecosysLabel = createLabel.call(this, 'icons/hud/ecosystem',  "Ecosystème : 100",
        "#FFFFFF", 'left', 20, 10);
    this.civLabel = createLabel.call(this, 'icons/hud/civ',  "Civilisation : 100",
        "#FFFFFF", 'left', 20, 10);

    this.rexUI.add.sizer({
        x: window.innerWidth * 0.5, y: 50,
        width: 500, height: 50,
        orientation: 0,
    })
        .addBackground(background)
        .add(this.ecosysLabel, 1, 'center')
        .add(this.civLabel, 1, 'center')
        .layout();
}

function createLabel(icon, text, colorId, alignType, space, iconSpace) {
    return this.rexUI.add.label({
        text: this.add.text(0, 0, text, {color: colorId, fontSize:22, fontStyle:"bold"}),
        icon: this.add.image(0, 0, icon).setTintFill(0xFFFFFF),
        align: alignType,
        space: {
            left: space,
            right: space,
            top: space,
            bottom: space,
            icon: iconSpace
        }
    });
}

function createRightLabel(text, colorId, alignType, space) {
    return this.rexUI.add.label({
        text: this.add.text(0, 0, text, {
            color: colorId,
            fontSize: 12,
            fontStyle: "bold",
            wordWrap: {
                width: 175
            },
            align: 'left'
        }),
        align: alignType,
        space: {
            left: space,
            right: space,
            top: space,
            bottom: space
        }
    });
}

/**
 * Function for creating the grid for posable tiles
 */
function createGridHUD() {
    this.gridTable = this.rexUI.add.gridTable({
        x: window.innerWidth * 0.5,
        y: window.innerHeight - 50,
        width: 540,
        height: 80,
        background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 0, COLOR_PRIMARY),
        table: {
            cellWidth: 135,
            cellHeight: 80,
            columns: 4,
            rows: 1,
            mask: {
                padding: 2,
            },
            reuseCellContainer: true,
        },
        createCellContainerCallback: function (cell, cellContainer) {
            const scene = cell.scene,
                width = cell.width,
                height = cell.height,
                item = cell.item,
                index = cell.index;

            let color;
            if(item.selected) {
                color = COLOR_LIGHT;
            } else if(item.id === "Bulldozer") {
                color = 0x000000;
            } else {
                color = COLOR_DARK;
            }

            if (cellContainer === null) {
                cellContainer = scene.rexUI.add.label({
                    width: width,
                    height: height,

                    orientation: 1,
                    background: scene.rexUI.add.roundRectangle(0, 0, 20, 20, 0),
                    icon: scene.rexUI.add.roundRectangle(0, 0, 20, 20, 10, 0x0),
                    text: scene.add.text(0, 0, ''),
                    space: {
                        icon: 10,
                        left: 15,
                        top: 15,
                    }
                });
            }
            // Set properties from item value
            cellContainer.setMinSize(width, height); // Size might changed in this demo
            cellContainer.getElement('text').setText(item.id + '\n' + item.cost).setAlign('center'); // Set text of text object
            cellContainer.getElement('icon').setFillStyle(item.color); // Set fill color of round rectangle object
            cellContainer.getElement('background').setFillStyle(color);
            return cellContainer;
        },
        items : this.gridData
    }).layout();

    this.gridTable
        .on('cell.over', function (cellContainer, cellIndex) {
            cellContainer.getElement('background').setStrokeStyle(2, COLOR_LIGHT);
        }, this)
        .on('cell.out', function (cellContainer, cellIndex) {
            cellContainer.getElement('background').setStrokeStyle(2, COLOR_DARK);
        }, this)
        .on('cell.1tap', function (cellContainer, cellIndex) {
            clickOnCellForGrid.call(this, this.gridData, this.gridTable, cellContainer);
            this.scene.get("gameScene").switchMode(cellContainer.text.substr(0, cellContainer.text.indexOf('\n')));
        }, this);
}


/// MENU
function createMenuHUD() {
    this.menuTable = this.rexUI.add.gridTable({
        x: 100,
        y: window.innerHeight/2,
        width: 400,
        height: window.innerHeight,
        background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 0, COLOR_PRIMARY),
        table: {
            cellHeight: 60,
            cellWidth: 400,
            reuseCellContainer: true,
        },
        /*slider: {
            track: this.rexUI.add.roundRectangle(0, 0, 20, 10, 10, COLOR_DARK),
            thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 13, COLOR_LIGHT),
        },
        scrollMode: 0,*/
        createCellContainerCallback: function (cell, cellContainer) {
            const scene = cell.scene,
                width = cell.width,
                height = cell.height,
                item = cell.item,
                index = cell.index;

            let color;
            if(item.selected) {
                color = COLOR_LIGHT;
            } else {
                color = COLOR_DARK;
            }

            if (cellContainer === null) {
                cellContainer = scene.rexUI.add.label({
                    width: width,
                    height: height,
                    background: scene.rexUI.add.roundRectangle(0, 0, 20, 20, 0).setFillStyle(COLOR_DARK),
                    text: scene.add.text(0, 0, '', {
                        wordWrap: {
                            width: 260
                        },
                        align: 'left'
                    }),
                    space: {
                        left: 125,
                        top: 15,
                        bottom: 15
                    }
                });

            }
            // Set properties from item value
            cellContainer.setMinSize(width, height); // Size might changed in this demo
            cellContainer.getElement('text').setText(item.id); // Set text of text object
            cellContainer.getElement('background').setFillStyle(color);
            return cellContainer;
        },
        items : this.menuData
    }).layout();

    this.menuTable
        .on('cell.over', function (cellContainer, cellIndex) {
            cellContainer.getElement('background').setStrokeStyle(2, COLOR_LIGHT);
        }, this)
        .on('cell.out', function (cellContainer, cellIndex) {
            cellContainer.getElement('background').setStrokeStyle(2, COLOR_DARK);
        }, this)
        .on('cell.1tap', function (cellContainer, cellIndex) {
            clickOnCellForMenu.call(this, this.menuData, this.menuTable, cellContainer);
            const activeCell = this.menuData.find(cell => cell.selected === true);
            const knowledge = findByTitle.call(this, activeCell.id);
            this.scene.get("dialogScene").createEventKnowledgeDialog(knowledge);
        }, this);
}

function clickOnCellForMenu(data, table, container) {
    data.forEach(i => {
        i.selected = i.id === container.text;
    });
    table.refresh();
}

function clickOnCellForGrid(data, table, container) {
    data.forEach(i => {
        i.selected = i.id === container.text.substr(0, container.text.indexOf('\n'));
    });
    table.refresh();
}

export function resolveClick(data, table) {
    data.forEach(i => {
        i.selected = false;
    });
    table.refresh();
}

