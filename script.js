    
   
// jsPDF setup
const { jsPDF } = window.jspdf || window.jsPDF;

let currentFormattedText = "";
let currentNoteType = "";

// ============= MAIN PREVIEW HANDLER =============
function previewText(noteType) {
  const userText = document.getElementById("userText").value.trim();
  if (!userText) {
    alert("Please enter or upload some text first!");
    return;
  }

  currentNoteType = noteType;

  const preview = document.getElementById("previewText");
  const diagramContainer = document.getElementById("diagramContainer");

  // Clear previous output
  preview.textContent = "";
  diagramContainer.innerHTML = "";
  preview.style.display = "none";

  const diagramTypes = ["Diagram-Focused Notes", "Flowchart Notes"];

  if (diagramTypes.includes(noteType)) {
    // SVG-based outputs
    renderDiagram(userText, noteType);
  } else {
    // Text-based outputs
    currentFormattedText = formatTextByNoteType(userText, noteType);
    preview.style.display = "block";
    preview.textContent = currentFormattedText;
  }

  document.getElementById("downloadBtn").style.display = "inline-block";
}

// ============= DOWNLOAD PDF =============
function downloadPDF() {
  const doc = new jsPDF("p", "pt", "a4");
  const diagramTypes = ["Diagram-Focused Notes", "Flowchart Notes"];

  if (diagramTypes.includes(currentNoteType)) {
    const svgElement = document.querySelector("#diagramContainer svg");
    if (!svgElement) {
      alert("No diagram to export!");
      return;
    }

    svgToPngDataUrl(svgElement).then((imgData) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 30;
      const imgWidth = pageWidth - margin * 2;

      const img = new Image();
      img.onload = function () {
        const ratio = img.height / img.width;
        const imgHeight = imgWidth * ratio;
        doc.addImage(imgData, "PNG", margin, 40, imgWidth, imgHeight);
        doc.save(currentNoteType.replace(/\s+/g, "_") + ".pdf");
      };
      img.src = imgData;
    });
  } else {
    // Text-based PDF
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    const lines = doc.splitTextToSize(currentFormattedText, 540);
    doc.text(lines, 30, 40);
    doc.save(currentNoteType.replace(/\s+/g, "_") + ".pdf");
  }
}

// Convert SVG element to PNG dataURL
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

// ============= TEXT ANALYSIS CORE =============

// Split into meaningful sentences
function extractSentences(text) {
  return text
    .split(/[\.\?\!\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // ignore tiny fragments
}

// Rank sentences using simple keyword-based scoring
function rankSentences(sentences) {
  const scoreWords = [
    "is", "are", "means", "refers to", "defined as", "because",
    "therefore", "hence", "important", "key", "major", "used to",
    "consists of", "results in", "causes"
  ];

  return sentences.map(s => {
    const lower = s.toLowerCase();
    let score = 0;
    scoreWords.forEach(w => {
      if (lower.includes(w)) score += 1;
    });
    // little bonus for longer (but not extremely long) sentences
    if (s.length > 50 && s.length < 250) score += 0.5;
    return { text: s, score };
  });
}

// Pick top N important sentences
function pickImportant(sentences, limit) {
  if (sentences.length <= limit) return sentences;

  const ranked = rankSentences(sentences)
    .sort((a, b) => b.score - a.score || b.text.length - a.text.length);

  return ranked.slice(0, limit).map(o => o.text);
}

// Extract formulas (lines with = or operators)
function extractFormulas(text) {
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(l =>
      l.includes("=") ||
      /[0-9]\s*[\+\-\*\/×÷]\s*[0-9]/.test(l)
    )
    .join("\n");
}

// Extract definitions: sentences containing is/are/means/defined as
function extractDefinitions(sentences) {
  const regex = /\b(is|are|means|refers to|defined as)\b/i;
  const defs = sentences.filter(s => regex.test(s));
  if (defs.length === 0) return "No clear definition-style sentences detected.";
  return defs.map(s => "- " + s).join("\n");
}

// ============= FORMAT PER NOTE TYPE =============
function formatTextByNoteType(text, type) {
  const sentences = extractSentences(text);

  switch (type) {
    case "Definitions Only":
      return extractDefinitions(sentences);

    case "Formula Sheet":
      return extractFormulas(text) || "No formulas detected (no '=' or math operators found).";

    case "Short Notes": {
      const picked = pickImportant(sentences, 5);
      return picked.join(". ") + (picked.length ? "." : "");
    }

    case "Exam Notes": {
      const picked = pickImportant(sentences, 15);
      return picked.join(". ") + (picked.length ? "." : "");
    }

    case "1-Page Summary": {
      const picked = pickImportant(sentences, 10);
      return picked.join(". ") + (picked.length ? "." : "");
    }

    case "Ultra Short Notes": {
      const picked = pickImportant(sentences, 12);
      return picked.map(s => "• " + s).join("\n");
    }

    case "Descriptive Notes":
      return text.trim();

    case "Beginner-Friendly Version": {
      const picked = pickImportant(sentences, 12);
      if (picked.length === 0) return text.trim();
      return "Beginner Friendly Version:\n\n" +
             picked.join(". ") + ".";
    }

    case "MCQs Generator":
      return generateMCQs(sentences);

    default:
      return text.trim();
  }
}

// ============= MCQ GENERATOR =============
function generateMCQs(sentences) {
  const clean = sentences.filter(s => s.length > 20);
  if (clean.length < 4) {
    return "Not enough content to generate MCQs (need at least 4 meaningful sentences).";
  }

  const letters = ["a", "b", "c", "d"];

  const mcqs = clean.map((sentence, i) => {
    const questionBase = sentence.replace(/\s+/g, " ").trim();

    // Try to convert statement into simple question
    let questionText = questionBase;
    const isIndex = questionBase.toLowerCase().indexOf(" is ");
    if (isIndex !== -1) {
      const subject = questionBase.slice(0, isIndex).trim();
      questionText = `What is ${subject}?`;
    } else if (questionBase.toLowerCase().startsWith("the")) {
      questionText = `What does this statement mean: "${questionBase}"`;
    }

    const correctAnswer = questionBase;

    // distractors = other sentences
    let distractors = clean.filter(s => s !== sentence);
    shuffleArray(distractors);
    distractors = distractors.slice(0, 3);

    let options = [...distractors, correctAnswer];
    shuffleArray(options);

    const correctIndex = options.indexOf(correctAnswer);
    const optionsText = options
      .map((opt, idx) => `${letters[idx]}) ${opt}`)
      .join("\n");

    return `Q${i + 1}. ${questionText}\n${optionsText}\nAnswer: ${letters[correctIndex]}) ${correctAnswer}\n`;
  });

  return mcqs.join("\n");
}

// Simple array shuffle
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ============= DIAGRAM & FLOWCHART =============
function renderDiagram(text, type) {
  const diagramContainer = document.getElementById("diagramContainer");
  const sentences = pickImportant(extractSentences(text), 8); // max 8 boxes

  if (sentences.length === 0) {
    diagramContainer.textContent = "Not enough structured information to build a diagram.";
    return;
  }

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  const width = 900;
  let y = 40;

  sentences.forEach((sentence, i) => {
    const boxWidth = 520;
    const lines = wrapText(sentence, 40);
    const lineHeight = 18;
    const paddingY = 14;
    const boxHeight = lines.length * lineHeight + paddingY * 2;
    const x = (width - boxWidth) / 2;

    // Box
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", boxWidth);
    rect.setAttribute("height", boxHeight);
    rect.setAttribute("fill", "#0078d4");
    rect.setAttribute("rx", 10);
    rect.setAttribute("ry", 10);
    svg.appendChild(rect);

    // Text inside box
    lines.forEach((line, idx) => {
      const textEl = document.createElementNS(svgNS, "text");
      textEl.setAttribute("x", x + boxWidth / 2);
      textEl.setAttribute("y", y + paddingY + (idx + 1) * lineHeight);
      textEl.setAttribute("fill", "#ffffff");
      textEl.setAttribute("font-size", "13");
      textEl.setAttribute("text-anchor", "middle");
      textEl.setAttribute("font-family", "Roboto, sans-serif");
      textEl.textContent = line;
      svg.appendChild(textEl);
    });

    // Arrows between boxes (for Flowchart)
    if (type === "Flowchart Notes" && i < sentences.length - 1) {
      const lineY1 = y + boxHeight;
      const lineY2 = lineY1 + 25;

      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", width / 2);
      line.setAttribute("y1", lineY1);
      line.setAttribute("x2", width / 2);
      line.setAttribute("y2", lineY2);
      line.setAttribute("stroke", "#333");
      line.setAttribute("stroke-width", 2);
      svg.appendChild(line);

      const arrow = document.createElementNS(svgNS, "polygon");
      arrow.setAttribute(
        "points",
        `${width / 2 - 5},${lineY2} ${width / 2 + 5},${lineY2} ${width / 2},${lineY2 + 8}`
      );
      arrow.setAttribute("fill", "#333");
      svg.appendChild(arrow);
    }

    y += boxHeight + 45;
  });

  svg.setAttribute("width", "100%");
  svg.setAttribute("height", y + 40);
  svg.setAttribute("viewBox", `0 0 ${width} ${y + 40}`);

  diagramContainer.appendChild(svg);
}

// Wrap text into multiple lines for diagram boxes
function wrapText(text, maxCharsPerLine) {
  const words = text.split(" ");
  const lines = [];
  let current = "";

  words.forEach(word => {
    if ((current + " " + word).trim().length <= maxCharsPerLine) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  });

  if (current) lines.push(current);
  return lines;
}

// ============= DRAG & DROP + FILE INPUT =============
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
