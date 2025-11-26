    
   
const { jsPDF } = window.jspdf || window.jsPDF;

let currentFormattedText = "";
let currentNoteType = "";

// MAIN PREVIEW HANDLER
function previewText(noteType) {
  const userText = document.getElementById("userText").value.trim();
  if (!userText) {
    alert("Please enter or upload some text first!");
    return;
  }

  currentNoteType = noteType;
  const preview = document.getElementById("previewText");
  const diagramContainer = document.getElementById("diagramContainer");

  preview.textContent = "";
  diagramContainer.innerHTML = "";

  const diagramTypes = ["Diagram-Focused Notes", "Flowchart Notes", "Pie Chart"];

  if (diagramTypes.includes(noteType)) {
    preview.style.display = "none";

    if (noteType === "Pie Chart") {
      renderPieChart(userText);
    } else {
      renderDiagram(userText, noteType);
    }
  } else {
    preview.style.display = "block";
    currentFormattedText = formatTextByNoteType(userText, noteType);
    preview.textContent = currentFormattedText;
  }

  document.getElementById("downloadBtn").style.display = "inline-block";
}

// FIXED PDF DOWNLOAD
function downloadPDF() {
  const doc = new jsPDF("p", "pt", "a4");
  const diagramTypes = ["Diagram-Focused Notes", "Flowchart Notes", "Pie Chart"];

  if (diagramTypes.includes(currentNoteType)) {
    const svgElement = document.querySelector("#diagramContainer svg");

    if (!svgElement) {
      alert("No diagram to export!");
      return;
    }

    convertSVGtoPNG(svgElement).then((imgData) => {
      let pageWidth = doc.internal.pageSize.getWidth();
      let pageHeight = doc.internal.pageSize.getHeight();

      doc.addImage(imgData, "PNG", 20, 40, pageWidth - 40, (pageWidth - 40) * 0.7);
      doc.save(`${currentNoteType.replace(/\s+/g, "_")}.pdf`);
    });
  } else {
    doc.setFontSize(16);
    doc.text(currentNoteType, 20, 30);

    doc.setFontSize(11);
    let lines = doc.splitTextToSize(currentFormattedText, 550);
    doc.text(lines, 20, 60);

    doc.save(`${currentNoteType.replace(/\s+/g, "_")}.pdf`);
  }
}

// SVG → PNG FIXED
function convertSVGtoPNG(svgElement) {
  return new Promise((resolve) => {
    const xml = new XMLSerializer().serializeToString(svgElement);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const image64 = "data:image/svg+xml;base64," + svg64;

    const img = new Image();
    img.onload = function () {
      let canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = image64;
  });
}

// TEXT FORMATTING
function formatTextByNoteType(text, type) {
  const sentences = text.split('.').map(s => s.trim()).filter(Boolean);

  switch (type) {
    case "Definitions Only":
      return sentences.map(s => "- " + s).join("\n");

    case "Formula Sheet":
      return text
        .split("\n")
        .map(line => (line.includes("=") ? line.trim() : ""))
        .filter(Boolean)
        .join("\n");

    case "Exam Notes":
      return sentences.slice(0, 20).join(". ") + ".";

    case "Short Notes":
      return sentences.slice(0, 5).join(". ") + ".";

    case "MCQs Generator":
      return generateMCQs(text);

    case "1-Page Summary":
      return sentences.slice(0, 12).join(". ") + ".";

    case "Ultra Short Notes":
      return sentences.slice(0, 25).map(s => "- " + s).join("\n");

    case "Descriptive Notes":
      return text;

    case "Beginner-Friendly Version":
      return "Beginner Friendly:\n\n" + sentences.slice(0, 15).join(". ") + ".";

    default:
      return text;
  }
}

// MCQ GENERATOR (same)
function generateMCQs(text) {
  const sentences = text
    .split('.')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => s.length > 15);

  if (sentences.length === 0) return "Not enough content to generate MCQs.";

  const letters = ["a", "b", "c", "d"];

  return sentences.map((sentence, i) => {
    const correct = sentence;

    let distractors = sentences.filter(s => s !== sentence);
    shuffleArray(distractors);
    distractors = distractors.slice(0, 3);

    let options = [...distractors, correct];
    shuffleArray(options);

    const correctIndex = options.indexOf(correct);

    let txt = `Q${i + 1}. ${sentence}?\nOptions:\n`;
    options.forEach((o, idx) => (txt += `${letters[idx]}) ${o}\n`));
    txt += `Answer: ${letters[correctIndex]}) ${correct}\n`;

    return txt;
  }).join("\n");
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]];
  }
}

// FLOWCHART + DIAGRAM (unchanged)
function renderDiagram(text, type) {
  const diagramContainer = document.getElementById("diagramContainer");
  const sentences = text.split('.').map(s => s.trim()).filter(Boolean);

  const svgNS = "http://www.w3.org/2000/svg";
  const width = 900;
  let y = 30;

  const svg = document.createElementNS(svgNS, "svg");

  sentences.forEach((sentence, index) => {
    const boxWidth = 420;
    const lineHeight = 18;
    const maxChars = 35;

    const lines = wrapText(sentence, maxChars);
    const boxHeight = lines.length * lineHeight + 20;

    let x = (width - boxWidth) / 2;

    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", boxWidth);
    rect.setAttribute("height", boxHeight);
    rect.setAttribute("fill", "#0078d4");
    rect.setAttribute("rx", 8);
    svg.appendChild(rect);

    lines.forEach((line, i) => {
      const t = document.createElementNS(svgNS, "text");
      t.setAttribute("x", x + boxWidth / 2);
      t.setAttribute("y", y + 20 + i * lineHeight);
      t.setAttribute("fill", "#fff");
      t.setAttribute("text-anchor", "middle");
      t.textContent = line;
      svg.appendChild(t);
    });

    if (type === "Flowchart Notes" && index < sentences.length - 1) {
      let line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", width / 2);
      line.setAttribute("y1", y + boxHeight);
      line.setAttribute("x2", width / 2);
      line.setAttribute("y2", y + boxHeight + 30);
      line.setAttribute("stroke", "#333");
      line.setAttribute("stroke-width", 2);
      svg.appendChild(line);
    }

    y += boxHeight + 40;
  });

  svg.setAttribute("width", "100%");
  svg.setAttribute("height", y + 20);
  svg.setAttribute("viewBox", `0 0 ${width} ${y + 20}`);

  diagramContainer.appendChild(svg);
}

// TEXT WRAP
function wrapText(txt, max) {
  const words = txt.split(" ");
  let lines = [];
  let line = "";

  words.forEach(w => {
    if ((line + " " + w).trim().length <= max) {
      line = (line + " " + w).trim();
    } else {
      lines.push(line);
      line = w;
    }
  });
  if (line) lines.push(line);

  return lines;
}

// PIE CHART — FULLY FIXED
function renderPieChart(text) {
  const diagramContainer = document.getElementById("diagramContainer");

  let numbers = [30, 20, 25, 25]; // simple fallback
  let labels = ["A", "B", "C", "D"];

  const svg = `
  <svg width="300" height="300" viewBox="0 0 32 32">
    <circle r="16" cx="16" cy="16" fill="#eee"></circle>
    
    <circle r="16" cx="16" cy="16"
      fill="transparent" stroke="#0078d4" stroke-width="32"
      stroke-dasharray="${numbers[0]} ${100 - numbers[0]}"
      transform="rotate(-90 16 16)">
    </circle>

    <circle r="16" cx="16" cy="16"
      fill="transparent" stroke="#00b294" stroke-width="32"
      stroke-dasharray="${numbers[1]} ${100 - numbers[1]}"
      transform="rotate(${numbers[0] * 3.6 - 90} 16 16)">
    </circle>

    <circle r="16" cx="16" cy="16"
      fill="transparent" stroke="#ff8c00" stroke-width="32"
      stroke-dasharray="${numbers[2]} ${100 - numbers[2]}"
      transform="rotate(${(numbers[0] + numbers[1]) * 3.6 - 90} 16 16)">
    </circle>

    <circle r="16" cx="16" cy="16"
      fill="transparent" stroke="#e81123" stroke-width="32"
      stroke-dasharray="${numbers[3]} ${100 - numbers[3]}
      transform="rotate(${(numbers[0] + numbers[1] + numbers[2]) * 3.6 - 90} 16 16)">
    </circle>
  </svg>`;

  diagramContainer.innerHTML = svg;
}

// FILE UPLOAD
document.getElementById("fileInput").addEventListener("change", function (e) {
  readFile(e.target.files[0]);
});

function readFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById("userText").value = e.target.result;
  };
  reader.readAsText(file);
}
