export function updateHUD() {
    const gameScene = this.scene.get("gameScene");
    if(gameScene && gameScene.groundLayer) {
        checkRightMouseClick.call(this);
        updateLabelHUD.call(this);
    }
}

function checkRightMouseClick() {
    // If right mouse button is pressed, we set the selected object/tool to null
    if(this.input.activePointer.rightButtonDown()) {
        const gameScene = this.scene.get("gameScene");
        gameScene.newSelectedObject = null;
        if (gameScene.preview !== null) {
            gameScene.preview.destroy();
            gameScene.preview = null;
        }
        this.resolveClick(this.gridData, this.gridTable);
    }
}

/**
 * Updating ecosystem and civilisation values
 */
function updateLabelHUD() {
    const gameScene = this.scene.get("gameScene");

    //RESOURCES
    const ecosystemValue = gameScene.ecosystemValue;
    const civilisationValue = gameScene.civilisationValue;

    if (ecosystemValue < 10) this.ecosysLabel.list[1].setColor("#FF0000");
    else if (ecosystemValue >= 10 && ecosystemValue < 30) this.ecosysLabel.list[1].setColor("#FFA500");
    else if (ecosystemValue >= 30) this.ecosysLabel.list[1].setColor("#FFFFFF");
    this.ecosysLabel.setText("Écosystème : " + ecosystemValue);

    if (civilisationValue < 10) this.civLabel.list[1].setColor("#FF0000");
    else if (civilisationValue >= 10 && civilisationValue < 30) this.civLabel.list[1].setColor("#FFA500");
    else if (civilisationValue >= 30) this.civLabel.list[1].setColor("#FFFFFF");
    this.civLabel.setText("Civilisation : " + civilisationValue);


    //COUNTS
    const habitationCount = gameScene.getObjectsCount('habitation');
    const farmingCount = gameScene.getObjectsCount('farming');
    const vegetationCount = gameScene.getObjectsCount('vegetation');
    const fireCount = gameScene.getLocalEventCount('fire');
    const illnessCount = gameScene.getLocalEventCount('illness');
    const decreaseSoilCount = gameScene.getLocalEventCount('decrease_soil');
    const globalEvent = gameScene.getLabelGlobalEvent();

    if (habitationCount === 0) this.nbHab.list[0].setColor("#FF0000");
    else if (habitationCount - 5 > farmingCount) this.nbHab.list[0].setColor("#FFA500");
    else if (habitationCount > 0) this.nbHab.list[0].setColor("#FFFFFF");
    this.nbHab.setText("Habitation : " + habitationCount);

    if (farmingCount === 0) this.nbFarm.list[0].setColor("#FF0000");
    else if (farmingCount - 5 > habitationCount) this.nbFarm.list[0].setColor("#FFA500");
    else if (farmingCount > 0) this.nbFarm.list[0].setColor("#FFFFFF");
    this.nbFarm.setText("Agriculture : " + farmingCount);

    if (vegetationCount === 0) this.nbVege.list[0].setColor("#FF0000");
    else if (vegetationCount > 0) this.nbVege.list[0].setColor("#FFFFFF");
    this.nbVege.setText("Végétation : " + vegetationCount);

    if (fireCount === 0) this.labelFire.list[0].setColor("#FFFFFF");
    else if (fireCount > 0 && fireCount < 10) this.labelFire.list[0].setColor("#FFA500");
    else if (fireCount >= 10) this.labelFire.list[0].setColor("#FF0000");
    this.labelFire.setText("Incendie : " + fireCount);

    if (illnessCount === 0) this.labelSick.list[0].setColor("#FFFFFF");
    else if (illnessCount > 0 && illnessCount < 10) this.labelSick.list[0].setColor("#FFA500");
    else if (illnessCount >= 10) this.labelSick.list[0].setColor("#FF0000");
    this.labelSick.setText("Maladie : " + illnessCount);

    if (decreaseSoilCount === 0) this.labelFertility.list[0].setColor("#FFFFFF");
    else if (decreaseSoilCount > 0 && decreaseSoilCount < 10) this.labelFertility.list[0].setColor("#FFA500");
    else if (decreaseSoilCount >= 10) this.labelFertility.list[0].setColor("#FF0000");
    this.labelFertility.setText("Perte de fertilité : " + decreaseSoilCount);

    this.labelGlobalEvent.list[0].setColor(globalEvent !== 'Aucun' ? "#318CE7" : "#FFFFFF");
    this.labelGlobalEvent.setText("Événement : " + globalEvent);
}
