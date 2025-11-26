const { jsPDF } = window.jspdf;

let currentFormattedText = "";
let currentNoteType = "";

// Preview text on page
function previewText(noteType) {
  const userText = document.getElementById("userText").value.trim();
  if (!userText) {
    alert("Please enter some text first!");
    return;
  }

  currentNoteType = noteType;
  currentFormattedText = formatTextByNoteType(userText, noteType);

  const preview = document.getElementById("previewText");
  const diagramContainer = document.getElementById("diagramContainer");

  // Clear previous diagram
  diagramContainer.innerHTML = "";
  preview.style.display = "block";
  preview.textContent = "";

  if (noteType === "Diagram-Focused Notes" || noteType === "Flowchart Notes") {
    // Hide text preview for diagrams
    preview.style.display = "none";
    renderDiagram(userText, noteType);
  } else {
    // Show normal preview text
    preview.style.display = "block";
    preview.textContent = currentFormattedText;
  }

  document.getElementById("downloadBtn").style.display = "inline-block";
}

// Download PDF
function downloadPDF() {
  const doc = new jsPDF();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  if (currentNoteType === "Diagram-Focused Notes" || currentNoteType === "Flowchart Notes") {
    // Convert SVG diagram to image for PDF
    const svgElement = document.querySelector("#diagramContainer svg");
    if (!svgElement) return alert("No diagram to export!");
    const xml = new XMLSerializer().serializeToString(svgElement);
    const svg64 = btoa(xml);
    const image64 = "data:image/svg+xml;base64," + svg64;
    const img = new Image();
    img.onload = function() {
      doc.addImage(img, 'PNG', 10, 10, 180, 0);
      doc.save(`${currentNoteType.replace(/\s+/g,'_')}.pdf`);
    };
    img.src = image64;
  } else {
    doc.text(currentNoteType, 10, 20);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(currentFormattedText, 180);
    doc.text(lines, 10, 30);
    doc.save(`${currentNoteType.replace(/\s+/g,'_')}.pdf`);
  }
}

// Format text for different note types
function formatTextByNoteType(text, type) {
  switch(type) {
    case 'Definitions Only':
      return text.split('.').map(s => s.trim()).filter(Boolean).join('\n- ');

    case 'Formula Sheet':
      return text.split('\n').map(line => line.includes('=') ? line : '').filter(Boolean).join('\n');

    case 'Exam Notes':
      return text + "\n\n[Highlight important points for exams]";

    case 'Short Notes':
      return text.split('.').slice(0,5).join('. ') + '.';

    case 'MCQs Generator':
      return generateMCQs(text);

    case '1-Page Summary':
      return text.split('.').slice(0,10).join('. ') + '.';

    case 'Ultra Short Notes':
      return text.split('.').slice(0,20).map(s => '- ' + s.trim()).join('\n');

    case 'Descriptive Notes':
      return text;

    case 'Beginner-Friendly Version':
      return "Beginner Friendly Notes:\n\n" + text.split('.').slice(0,15).join('. ') + '.';

    default:
      return text;
  }
}

// MCQs generator with random distractors
function generateMCQs(text) {
  const sentences = text.split('.').filter(Boolean);
  return sentences.map((q, i) => {
    const question = q.trim();
    const correctAnswer = question;

    // Random 3 distractors from other sentences
    let distractors = sentences.filter(s => s.trim() !== question);
    shuffleArray(distractors);
    distractors = distractors.slice(0, 3).map(d => d.trim());

    // Combine options and shuffle
    let options = [...distractors, correctAnswer];
    shuffleArray(options);

    const letters = ['a','b','c','d'];
    const correctIndex = options.indexOf(correctAnswer);

    let optionsText = options.map((opt, idx) => ` ${letters[idx]}) ${opt}`).join('\n');
    return `Q${i+1}: ${question}?\nOptions:\n${optionsText}\nAnswer: ${letters[correctIndex]}) ${correctAnswer}\n`;
  }).join('\n');
}

// Shuffle array utility
function shuffleArray(array) {
  for (let i = array.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Render SVG Diagram / Flowchart
function renderDiagram(text, type) {
  const diagramContainer = document.getElementById("diagramContainer");
  const sentences = text.split('.').filter(Boolean);
  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");
  let y = 20;

  sentences.forEach((s,i) => {
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", 50);
    rect.setAttribute("y", y);
    rect.setAttribute("width", 300);
    rect.setAttribute("height", 40);
    rect.setAttribute("fill", "#0078d4");
    rect.setAttribute("rx", 5);
    svg.appendChild(rect);

    const textElem = document.createElementNS(svgNS, "text");
    textElem.setAttribute("x", 200);
    textElem.setAttribute("y", y+25);
    textElem.setAttribute("fill", "#fff");
    textElem.setAttribute("text-anchor", "middle");
    textElem.setAttribute("font-size", "14");
    textElem.setAttribute("font-family", "Roboto, sans-serif");
    textElem.textContent = s.trim();
    svg.appendChild(textElem);

    if (type === "Flowchart Notes" && i < sentences.length - 1) {
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", 200);
      line.setAttribute("y1", y+40);
      line.setAttribute("x2", 200);
      line.setAttribute("y2", y+60);
      line.setAttribute("stroke", "#333");
      line.setAttribute("stroke-width", 2);
      svg.appendChild(line);

      const arrow = document.createElementNS(svgNS, "polygon");
      arrow.setAttribute("points", "195," + (y+60) + " 205," + (y+60) + " 200," + (y+70));
      arrow.setAttribute("fill", "#333");
      svg.appendChild(arrow);
    }

    y += 80;
  });

  svg.setAttribute("width", "100%");
  svg.setAttribute("height", y);
  diagramContainer.appendChild(svg);
}

// Drag-and-drop file support
const fileDropArea = document.getElementById("fileDropArea");
const fileInput = document.getElementById("fileInput");

fileDropArea.addEventListener("dragover", (e) => { e.preventDefault(); fileDropArea.style.background = "#e6f0ff"; });
fileDropArea.addEventListener("dragleave", (e) => { e.preventDefault(); fileDropArea.style.background = "#f9f9f9"; });
fileDropArea.addEventListener("drop", (e) => { e.preventDefault(); fileDropArea.style.background = "#f9f9f9"; readFile(e.dataTransfer.files[0]); });
fileInput.addEventListener("change", (e) => readFile(e.target.files[0]));

function readFile(file) {
  if (file && file.type === "text/plain") {
    const reader = new FileReader();
    reader.onload = function(e) { document.getElementById("userText").value = e.target.result; };
    reader.readAsText(file);
  } else {
    alert("Please upload a valid .txt file");
  }
}
