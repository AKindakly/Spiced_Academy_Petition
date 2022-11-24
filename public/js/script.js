// create canvas element
let canvas = document.getElementById("canvas");

// get canvas 2D context
let ctx = canvas.getContext("2d");

// last known position
let pos = { x: 0, y: 0 };

document.addEventListener("mousemove", draw);
document.addEventListener("mousedown", setPosition);
document.addEventListener("mouseenter", setPosition);

// new position from mouse event
function setPosition(e) {
    pos.x = e.offsetX;
    pos.y = e.offsetY;
}

function draw(e) {
    // mouse left button must be pressed
    if (e.buttons !== 1) return;

    ctx.beginPath(); // begin

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    ctx.moveTo(pos.x, pos.y); // from
    setPosition(e);
    ctx.lineTo(pos.x, pos.y); // to

    ctx.stroke(); // draw it!
}

// save canvas image as data URL
let canvasImg = document.getElementById("canvasImg");
document.addEventListener("mouseup", () => {
    canvasImg.value = canvas.toDataURL();
});
