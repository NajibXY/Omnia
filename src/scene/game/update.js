export function update() {
    checkCursorKeys.call(this);
    checkMousePosition.call(this);
    checkMouseWheel.call(this);
    updateCameraRendering.call(this);
}

// Moving camera with keys
function checkCursorKeys() {
    const cursors = this.cursorKeys;
    if (cursors.up.isDown) {
        this.cameras.main.scrollY -= 10;
    } else if (cursors.down.isDown) {
        this.cameras.main.scrollY += 10;
    }
    if (cursors.left.isDown) {
        this.cameras.main.scrollX -= 10;
    } else if (cursors.right.isDown) {
        this.cameras.main.scrollX += 10;
    }
}

// Moving camera with mouse
function checkMousePosition() {
    if(this.mouseIn) {
        const lastMouseX = this.input.x;
        const lastMouseY = this.input.y;
        const height = this.scale.height;
        const width = this.scale.width;

        if (lastMouseX > 0 && lastMouseX < width) {
            if (lastMouseX > (width - 50)) {
                this.cameras.main.scrollX += 10;
            }
            if (lastMouseX < 50) {
                this.cameras.main.scrollX -= 10;
            }
        }
        if (lastMouseY > 0 && lastMouseY < height) {
            if (lastMouseY > (height - 50)) {
                this.cameras.main.scrollY += 10;
            }
            if (lastMouseY < 50) {
                this.cameras.main.scrollY -= 10;
            }
        }
    }
}

// Zooming with mouseWheel
function checkMouseWheel() {
    const mouseWheels = this.mouseWheelKeys;
    if (mouseWheels.up.isDown) {
        if (this.cameras.main.zoom < 1.8) {
            this.cameras.main.zoom += 0.1;
        }
    } else if (mouseWheels.down.isDown) {
        if (this.cameras.main.zoom > 0.25) {
            this.cameras.main.zoom -= 0.1;
        }
    }
}

// update what object is visible at runtime
function updateCameraRendering() {
    // set every children to not visible
    let children = this.children.getChildren();
    for (let child of children)
        child.visible = false;

    // set only children visible by the camera to visible
    let visible = this.cameras.main.cull(children);
    for (let child of visible)
        child.visible = true;
}