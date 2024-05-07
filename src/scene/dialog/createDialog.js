import { checkKnowledgeLoading } from "../../logic/knowledge";

const COLOR_PRIMARY = 0x4e342e;
const COLOR_LIGHT = 0x7b5e57;
const COLOR_DARK = 0x260e04;

export function createDialog() {
    createInitDialog.call(this);
}

/**
 * Function for creating initial rule Pop up
 */
function createInitDialog() {
    checkKnowledgeLoading.call(this, 'tutorial');
}

/**
 * Function to display a dialog for event/knowledge.
 */
export function createEventKnowledgeDialog(knowledge) {
    this.pause();
    this.dialogCount++;
    let dialog = this.rexUI.add.dialog({
        x: 400,
        y: 300,

        background: this.rexUI.add.roundRectangle(0, 0, 100, 100, 20, 0x3e2723),

        title: this.rexUI.add.label({
            background: this.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x1b0000),
            text: this.add.text(0, 0, "          "+knowledge.content.title+"          ", {
                fontSize: '24px'
            }),
            space: {
                left: 15,
                right: 15,
                top: 10,
                bottom: 10
            }
        }),

        content: createTextArea.call(this, knowledge),

        actions : [ createActionLabel.call(this, 'icons/hud/game', "OK", "#FFFFFF", "center", 0, 10, "0x6a4f4b") ],

        space: {
            title: 25,
            left: 25,
            right: 25,
            top: 25,
            bottom: 25
        }
    });
    dialog
        .on('button.click', function (button, groupName, index) {
            if (button.text === "OK") {
                const hud = this.scene.get("hudScene");
                hud.resolveClick(hud.menuData, hud.menuTable);
                dialog.scaleDownDestroy(100);

                this.dialogCount--;
                if (this.dialogCount === 0) this.resume();
            }
        }, this)
        .on('button.over', function (button, groupName, index) {
            if (button.text === "OK") {
                button.getElement('background').setStrokeStyle(1, 0xffffff);
            }
        })
        .on('button.out', function (button, groupName, index) {
            if (button.text === "OK") {
                button.getElement('background').setStrokeStyle();
            }
        });

    this.rexUI.add.sizer({
        x: window.innerWidth * 0.5, y: window.innerHeight * 0.45,
        width: 500, height: 500,
        orientation: 1
    }).add(dialog, 1, 'center').layout();
}

function createLabel(icon, text, colorId, alignType, space, iconSpace, backgroundColor) {
    return this.rexUI.add.label({
        text: this.add.text(0, 0, text, {color: colorId, fontSize:22, fontStyle:"bold"}),
        icon: this.add.image(0, 0, icon).setTint(COLOR_LIGHT),
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

function createTextArea(knowledge) {
    let textArea = this.rexUI.add.textArea({
        x: 400,
        y: 300,
        height: 400,
        text: this.add.text(0, 0, '', {
            fontSize: '20px'
        }),
        space: {
            bottom: 20
        },
        slider: {
            track: this.rexUI.add.roundRectangle(0, 0, 20, 10, 10, 0x260e04),
            thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 13, 0x7b5e57),
        },
    });
    textArea.setText(knowledge.content.text);

    return textArea;
}

function createActionLabel(icon, text, colorId, alignType, space, iconSpace, backgroundColor) {
    return this.rexUI.add.label({
        // Background to be able to put stroke style on hover
        background: this.rexUI.add.roundRectangle(0, 0, 100, 30, 20, backgroundColor),
        text: this.add.text(0, 0, text, {color: colorId, fontSize:30, fontStyle:"bold"}),
        icon: this.add.image(0, 0, icon).setTint(COLOR_LIGHT),
        align: alignType,
        space: {
            left: 5 + space,
            right: 10 + space,
            top: space,
            bottom: space,
            icon: iconSpace
        }
    });
}
