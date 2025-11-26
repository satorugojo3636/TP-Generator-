    
   
// Load File
document.getElementById("fileInput").addEventListener("change", function () {
    let reader = new FileReader();
    reader.onload = function () {
        document.getElementById("inputText").value = reader.result;
    };
    reader.readAsText(this.files[0]);
});

// Generate Text Outputs
function previewText(type) {
    let text = document.getElementById("inputText").value;
    let output = "";

    document.getElementById("diagramContainer").innerHTML = ""; // Clear old diagrams

    switch (type) {
        case "Definitions":
            output = "🔹 DEFINITIONS\n\n" + text;
            break;

        case "Summary":
            output = "📌 SUMMARY\n\n" + text.slice(0, 300) + "...";
            break;

        case "Short Notes":
            output = "📝 SHORT NOTES\n\n" + text.slice(0, 200);
            break;

        case "Exam Notes":
            output = "📘 EXAM NOTES\n\n" + text;
            break;

        case "MCQs":
            output = "🔸 AUTO-GENERATED MCQs\n\n";
            output += `1) What is the topic about?\nA) ${text.split(" ")[0]}\nB) Something else\nC) Another option\nD) None\n\n`;
            break;

        case "Flowchart":
            output = "📊 FLOWCHART GENERATED BELOW ↓";
            generateFlowchart();
            break;

        case "Diagram Notes":
            output = "🖼 Diagram-based notes coming soon.";
            break;
    }

    document.getElementById("previewText").innerText = output;
}

// Flowchart SVG
function generateFlowchart() {
    let svg = `
    <svg width="100%" height="150">
        <rect x="40" y="20" width="200" height="40" rx="6" fill="#e9f0ff" stroke="#99b3ff"/>
        <text x="110" y="47" font-size="14" text-anchor="middle">Start</text>

        <line x1="140" y1="60" x2="140" y2="95" stroke="#777"/>

        <rect x="40" y="95" width="200" height="40" rx="6" fill="#f8f8f8" stroke="#ccc"/>
        <text x="140" y="120" font-size="14" text-anchor="middle">Process</text>
    </svg>
    `;
    document.getElementById("diagramContainer").innerHTML = svg;
}

// Pie Chart SVG
function generatePieChart() {
    let svg = `
    <svg width="260" height="260" viewBox="0 0 32 32">
        <circle r="16" cx="16" cy="16" fill="#eee"></circle>
        <circle r="16" cx="16" cy="16" fill="transparent"
          stroke="#4a90e2" stroke-width="32"
          stroke-dasharray="40 60"
          transform="rotate(-90 16 16)">
        </circle>
    </svg>
    `;
    document.getElementById("diagramContainer").innerHTML = svg;
}

// Download PDF (TEXT + DIAGRAM TOGETHER IN ONE PDF)
function downloadPDF() {
    const textContent = document.getElementById("previewText").innerText;
    const svgElement = document.querySelector("#diagramContainer svg");

    // STEP 1 — Convert SVG to PNG (IF PRESENT)
    if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = function () {
            createPDF(textContent, img); // Go to PDF creation
            URL.revokeObjectURL(url);
        };
        img.src = url;
    } else {
        // No diagram → just text PDF
        createPDF(textContent, null);
    }
}

// STEP 2 — Create final PDF using canvas → PNG → PDF
function createPDF(text, diagramImage) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set PDF canvas size
    canvas.width = 800;
    canvas.height = 1100;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // TEXT
    ctx.fillStyle = "#000";
    ctx.font = "18px Arial";

    let lineY = 40;
    let lines = text.split("\n");
    lines.forEach(line => {
        ctx.fillText(line, 40, lineY);
        lineY += 26;
    });

    // DIAGRAM BELOW TEXT
    if (diagramImage) {
        ctx.drawImage(diagramImage, 200, lineY + 20, 350, 350);
    }

    // Convert canvas to PNG then download as PDF
    const imgData = canvas.toDataURL("image/png");

    const pdfWindow = window.open("");
    pdfWindow.document.write("<iframe width='100%' height='100%' src='" + imgData + "'></iframe>");
}

    
   
  
   

   


    
   

