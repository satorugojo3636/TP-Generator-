    
   
// jsPDF setup
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

  // Clear previous
  preview.textContent = "";
  diagramContainer.innerHTML = "";

  // Types that use SVG diagrams
  const diagramTypes = ["Diagram-Focused Notes", "Flowchart Notes", "Pie Chart"];

  if (diagramTypes.includes(noteType)) {
    preview.style.display = "none";

    if (noteType === "Pie Chart") {
      renderPieChart(userText);
    } else {
      renderDiagram(userText, noteType);
    }
  } else {
    // Text-based notes
    preview.style.display = "block";
    currentFormattedText = formatTextByNoteType(userText, noteType);
    preview.textContent = currentFormattedText;
  }

  document.getElementById("downloadBtn").style.display = "inline-block";
}

// DOWNLOAD PDF (text OR diagram)
function downloadPDF() {
  const doc = new jsPDF("p", "pt", "a4");
  const diagramTypes = ["Diagram-Focused Notes", "Flowchart Notes", "Pie Chart"];

  if (diagramTypes.includes(currentNoteType)) {
    const svgElement = document.querySelector("#diagramContainer svg");
    if (!svgElement) {
      alert("No diagram to export!");
      return;
    }

    // Convert SVG to PNG and then add to PDF
    svgToPngDataUrl(svgElement).then((imgData) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // keep margin
      const imgWidth = pageWidth - 40;
      const img = new Image();
      img.onload = function () {
        const ratio = img.height / img.width;
        const imgHeight = imgWidth * ratio;
        doc.addImage(imgData, "PNG", 20, 40, imgWidth, imgHeight);
        doc.save(`${currentNoteType.replace(/\s+/g, "_")}.pdf`);
      };
      img.src = imgData;
    });
  } else {
    // Text-based PDF
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(currentNoteType, 20, 30);

    doc.setFontSize(11);
    const lines = doc.splitTextToSize(currentFormattedText, 550);
    doc.text(lines, 20, 60);
    doc.save(`${currentNoteType.replace(/\s+/g, "_")}.pdf`);
  }
}

// Helper: convert SVG element to PNG dataURL
function svgToPngDataUrl(svgEl) {
  return new Promise((resolve) => {
    const xml = new XMLSerializer().serializeToString(svgEl);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const image64 = "data:image/svg+xml;base64," + svg64;

    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const pngData = canvas.toDataURL("image/png");
      resolve(pngData);
    };
    img.src = image64;
  });
}

// FORMAT TEXT FOR EACH NOTE TYPE
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
      return "Beginner Friendly Version:\n\n" +
             sentences.slice(0, 15).join(". ") + ".";

    default:
      return text;
  }
}

// MCQs GENERATOR
function generateMCQs(text) {
  const sentences = text
    .split('.')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => s.length > 15); // ignore very short ones

  if (sentences.length === 0) return "Not enough content to generate MCQs.";

  const letters = ["a", "b", "c", "d"];

  return sentences.map((sentence, i) => {
    const questionText = sentence.replace(/\?+$/, "");
    const correctAnswer = questionText;

    let distractors = sentences.filter(s => s !== sentence);
    shuffleArray(distractors);
    distractors = distractors.slice(0, 3);

    let options = [...distractors, correctAnswer];
    shuffleArray(options);

    const correctIndex = options.indexOf(correctAnswer);

    const optionsText = options
      .map((opt, idx) => `${letters[idx]}) ${opt}`)
      .join("\n");

    return `Q${i + 1}. ${questionText}?\nOptions:\n${optionsText}\nAnswer: ${letters[correctIndex]}) ${correctAnswer}\n`;
  }).join("\n\n");
}

// Shuffle utility
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// RENDER DIAGRAM OR FLOWCHART
function renderDiagram(text, type) {
  const diagramContainer = document.getElementById("diagramContainer");
  const sentences = text.split('.').map(s => s.trim()).filter(Boolean);

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  const width = 900;
  let y = 30;

  sentences.forEach((sentence, i) => {
    const maxCharsPerLine = 35;
    const lines = wrapText(sentence, maxCharsPerLine);
    const lineHeight = 18;
    const boxPadding = 10;
    const boxHeight = lines.length * lineHeight + boxPadding * 2;
    const boxWidth = 420;

    const x = (width - boxWidth) / 2;

    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", boxWidth);
    rect.setAttribute("height", boxHeight);
    rect.setAttribute("fill", "#0078d4");
    rect.setAttribute("rx", 8);
    rect.setAttribute("ry", 8);
    svg.appendChild(rect);

    lines.forEach((line, idx) => {
      const textElem = document.createElementNS(svgNS, "text");
      textElem.setAttribute("x", x + boxWidth / 2);
      textElem.setAttribute("y", y + boxPadding + (idx + 1) * lineHeight);
      textElem.setAttribute("fill", "#ffffff");
      textElem.setAttribute("text-anchor", "middle");
      textElem.setAttribute("font-size", "13");
      textElem.setAttribute("font-family", "Roboto, sans-serif");
      textElem.textContent = line;
      svg.appendChild(textElem);
    });

    if (type === "Flowchart Notes" && i < sentences.length - 1) {
      const lineYStart = y + boxHeight;
      const lineYEnd = lineYStart + 20;

      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", width / 2);
      line.setAttribute("y1", lineYStart);
      line.setAttribute("x2", width / 2);
      line.setAttribute("y2", lineYEnd);
      line.setAttribute("stroke", "#333");
      line.setAttribute("stroke-width", 2);
      svg.appendChild(line);

      const arrow = document.createElementNS(svgNS, "polygon");
      arrow.setAttribute(
        "points",
        `${width / 2 - 5},${lineYEnd} ${width / 2 + 5},${lineYEnd} ${width / 2},${lineYEnd + 8}`
      );
      arrow.setAttribute("fill", "#333");
      svg.appendChild(arrow);
    }

    y += boxHeight + 40;
  });

  svg.setAttribute("width", "100%");
  svg.setAttribute("height", y + 20);
  svg.setAttribute("viewBox", `0 0 ${width} ${y + 20}`);
  diagramContainer.appendChild(svg);
}

// Wrap text for SVG
function wrapText(text, maxCharsPerLine) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach(word => {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

// PIE CHART (auto, option A style)
function renderPieChart(text) {
  const diagramContainer = document.getElementById("diagramContainer");
  const svgNS = "http://www.w3.org/2000/svg";

  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  let items = [];
  const percentPattern = /^(.*?)[\s\-:=]+(\d+(?:\.\d+)?)\s*%?$/;

  lines.forEach(line => {
    const m = line.match(percentPattern);
    if (m) {
      const label = m[1].trim();
      const value = parseFloat(m[2]);
      if (label && !isNaN(value) && value > 0) {
        items.push({ label, value });
      }
    }
  });

  if (items.length === 0) {
    const sentences = text
      .split('.')
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    if (sentences.length === 0) {
      diagramContainer.textContent = "Not enough structured information to generate a pie chart.";
      return;
    }

    const equalVal = 100 / sentences.length;
    items = sentences.map(s => ({
      label: s.length > 40 ? s.slice(0, 37) + "..." : s,
      value: equalVal
    }));
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    diagramContainer.textContent = "Could not detect numeric values for pie chart.";
    return;
  }

  items = items.map(item => ({
    label: item.label,
    value: (item.value / total) * 100
  }));

  const svg = document.createElementNS(svgNS, "svg");
  const width = 900;
  const height = 400;
  const cx = 220;
  const cy = 200;
  const radius = 120;

  svg.setAttribute("width", "100%");
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const colors = [
    "#0078d4", "#00b294", "#ff8c00",
    "#e81123", "#5c2d91", "#498205",
    "#ffb900", "#ca5010"
  ];

  let startAngle = 0;

  items.forEach((item, index) => {
    const sliceAngle = (item.value / 100) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z"
    ].join(" ");

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", colors[index % colors.length]);
    svg.appendChild(path);

    const midAngle = startAngle + sliceAngle / 2;
    const labelRadius = radius * 0.65;
    const lx = cx + labelRadius * Math.cos(midAngle);
    const ly = cy + labelRadius * Math.sin(midAngle);

    const labelText = document.createElementNS(svgNS, "text");
    labelText.setAttribute("x", lx);
    labelText.setAttribute("y", ly);
    labelText.setAttribute("fill", "#ffffff");
    labelText.setAttribute("font-size", "10");
    labelText.setAttribute("text-anchor", "middle");
    labelText.setAttribute("dominant-baseline", "middle");
    labelText.textContent = `${item.value.toFixed(1)}%`;
    svg.appendChild(labelText);

    startAngle = endAngle;
  });

  const legendX = 450;
  let legendY = 80;

  items.forEach((item, index) => {
    const legendColorBox = document.createElementNS(svgNS, "rect");
    legendColorBox.setAttribute("x", legendX);
    legendColorBox.setAttribute("y", legendY);
    legendColorBox.setAttribute("width", 16);
    legendColorBox.setAttribute("height", 16);
    legendColorBox.setAttribute("fill", colors[index % colors.length]);
    svg.appendChild(legendColorBox);

    const legendText = document.createElementNS(svgNS, "text");
    legendText.setAttribute("x", legendX + 24);
    legendText.setAttribute("y", legendY + 12);
    legendText.setAttribute("fill", "#333333");
    legendText.setAttribute("font-size", "12");
    legendText.setAttribute("font-family", "Roboto, sans-serif");
    legendText.textContent = `${item.label} (${item.value.toFixed(1)}%)`;
    svg.appendChild(legendText);

    legendY += 24;
  });

  diagramContainer.appendChild(svg);
}

// DRAG & DROP + FILE INPUT
const fileDropArea = document.getElementById("fileDropArea");
const fileInput = document.getElementById("fileInput");

fileDropArea.addEventListener("click", () => fileInput.click());

fileDropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  fileDropArea.style.background = "#f0f0f0";
});

fileDropArea.addEventListener("dragleave", (e) => {
  e.preventDefault();
  fileDropArea.style.background = "#fafafa";
});

fileDropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  fileDropArea.style.background = "#fafafa";
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    readFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    readFile(e.target.files[0]);
  }
});

function readFile(file) {
  if (file && file.type === "text/plain") {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("userText").value = e.target.result;
    };
    reader.readAsText(file);
  } else {
    alert("Please upload a valid .txt file");
  }
}
