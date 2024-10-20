const card_width_cm = 6.35;  // 750 px at 300 px/inch
const card_height_cm = 8.89;  // 1050 px at 300 px/inch
const canvas_width_px = 750;
const canvas_height_px = 1050;


async function render() {
    const canvas = document.getElementById('mycanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Set background image
    const img = new Image();
    img.src = "./ucard.png";
    img.onload = function() {
        console.log("Drawing box.");
        var hRatio = canvas.width / img.width;
        var vRatio = canvas.height / img.height;
        var ratio  = Math.min ( hRatio, vRatio );
        ctx.drawImage(img, 0, 0);
        console.log("Done.");
        // Title
        ctx.save();
        ctx.scale(1.1, 1);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "35px goudy";
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 1;
        ctx.shadowColor = "#000000";
        ctx.letterSpacing = "1px";
        ctx.fillText(document.getElementById("title-entry").value, 60, 76);
        ctx.restore();
        // Type
        ctx.save();
        ctx.scale(0.9, 1);
        ctx.font = "35px mplantin";
        ctx.fillStyle = "#FFFFFF";
        ctx.letterSpacing = "1px";
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 1;
        ctx.shadowColor = "#000000";
        ctx.fillText("Summon Wall", 85, 614);
        ctx.restore()
        // Rules
        ctx.font = "28px mplantin";
        ctx.letterSpacing = "1px";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = "#000000";
        ctx.fillText("Lorem ipsum.", 100, 700);
    };
}

window.onload = function() {
    // Draw box around canvas
    console.log("Drawing box...");
    const canvas = document.getElementById('mycanvas');
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = "#FF0000";
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    console.log("Done.");

    // Load fonts
    const myFont = new FontFace('goudy', 'url(./fonts/GoudyMediaevalRegular.ttf)');
    myFont.load().then(function(font) {
        document.fonts.add(font);
    });

    const mplantin = new FontFace('mplantin', 'url(./fonts/MPlantin.woff2)');
    mplantin.load().then(function(font) {
        document.fonts.add(font);
    });
    const button = document.createElement('button');
    button.onclick = render;
    button.innerText = "Render";
    document.body.appendChild(button);
}

