// -------------------------
// GLOBAL VARIABLES
// -------------------------
let currentChart = null;

// Utility: Split text into sentences
function getSentences(text) {
    return text
        .replace(/\n+/g, ". ")
        .split(/[.?!]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

// Utility: Extract keywords
function getKeywords(text) {
    let words = text.toLowerCase().match(/[a-zA-Z]+/g) || [];
    let freq = {};

    words.forEach(w => {
        if (!["the", "is", "are", "and", "or", "for", "to", "of", "in", "on", "a", "an"].includes(w)) {
            freq[w] = (freq[w] || 0) + 1;
        }
    });

    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
}

// -------------------------
// PREVIEW HANDLER
// -------------------------
function updatePreview(text) {
    const preview = document.getElementById("preview");
    preview.style.whiteSpace = "pre-wrap";
    preview.style.writingMode = "vertical-rl";
    preview.style.textOrientation = "upright";
    preview.innerText = text;
}

// -------------------------
// 1) SHORT NOTES
// -------------------------
function generateShortNotes() {
    let text = document.getElementById("inputText").value;
    let sentences = getSentences(text);
    let output = sentences.slice(0, 4).join("\n• ");
    updatePreview("• " + output);
}

// -------------------------
// 2) ULTRA SHORT NOTES
// -------------------------
function generateUltraShort() {
    let keywords = getKeywords(document.getElementById("inputText").value)
        .map(k => "• " + k[0].toUpperCase());

    updatePreview(keywords.join("\n"));
}

// -------------------------
// 3) EXAM NOTES
// -------------------------
function generateExamNotes() {
    let text = document.getElementById("inputText").value;
    let sentences = getSentences(text);

    let important = sentences.filter(s =>
        s.includes("important") ||
        s.includes("key") ||
        s.length > 80
    );

    if (important.length === 0) important = sentences.slice(0, 5);

    updatePreview("📌 EXAM NOTES:\n\n- " + important.join("\n- "));
}

// -------------------------
// 4) 1 PAGE SUMMARY
// -------------------------
function generateOnePage() {
    let text = document.getElementById("inputText").value;
    let sentences = getSentences(text);
    let summary = sentences.slice(0, 10).join("\n\n");
    updatePreview(summary);
}

// -------------------------
// 5) DESCRIPTIVE NOTES
// -------------------------
function generateDescriptive() {
    let text = document.getElementById("inputText").value;
    updatePreview("📝 DESCRIPTIVE EXPLANATION\n\n" + text);
}

// -------------------------
// 6) BEGINNER FRIENDLY NOTES
// -------------------------
function generateBeginner() {
    let text = document.getElementById("inputText").value;

    let simple = text
        .replace(/([\w]+)[\w]{4,}/g, match => match.slice(0, 4) + "...")
        .replace(/therefore|however|furthermore/gi, "so");

    updatePreview("✨ BEGINNER FRIENDLY VERSION:\n\n" + simple);
}

// -------------------------
// 7) DIAGRAM FOCUSED NOTES
// -------------------------
function generateDiagramNotes() {
    let text = document.getElementById("inputText").value;
    let keywords = getKeywords(text).map(k => k[0].toUpperCase());

    let diagram = "📊 DIAGRAM (ASCII FLOW)\n\n";

    keywords.forEach((k, i) => {
        if (i < keywords.length - 1) {
            diagram += `${k} → `;
        } else {
            diagram += k;
        }
    });

    updatePreview(diagram);
}

// -------------------------
// 8) FLOWCHART NOTES
// -------------------------
function generateFlowchart() {
    let text = document.getElementById("inputText").value;
    let sentences = getSentences(text).slice(0, 5);

    let chart = "🔽 FLOWCHART\n\n";
    sentences.forEach((s, i) => {
        chart += `[ Step ${i + 1} ] ${s}\n   |\n   v\n`;
    });

    updatePreview(chart);
}

// -------------------------
// 9) PIE CHART (Keyword Frequency)
// -------------------------
function generatePiechart() {
    let text = document.getElementById("inputText").value;
    let data = getKeywords(text);

    let labels = data.map(d => d[0]);
    let values = data.map(d => d[1]);

    updatePreview("📊 Pie chart generated below");

    let ctx = document.getElementById("chartCanvas").getContext("2d");

    if (currentChart) currentChart.destroy();

    currentChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: values
            }]
        }
    });
}

// -------------------------
// 10) MCQ GENERATOR (WITH RANDOM OPTIONS)
// -------------------------
function generateMCQ() {
    let text = document.getElementById("inputText").value;
    let sentences = getSentences(text);

    if (sentences.length < 2) {
        updatePreview("Not enough content to make MCQs");
        return;
    }

    let mcqs = "";

    sentences.slice(0, 5).forEach((s, index) => {
        let answer = s.split(" ")[0]; // simple extracted answer
        let wrong1 = "Wrong_" + Math.random().toString(36).slice(2, 7);
        let wrong2 = "Wrong_" + Math.random().toString(36).slice(2, 7);
        let wrong3 = "Wrong_" + Math.random().toString(36).slice(2, 7);

        let options = [answer, wrong1, wrong2, wrong3]
            .sort(() => Math.random() - 0.5);

        mcqs += `Q${index + 1}. ${s}?\n`;
        mcqs += `a) ${options[0]}\n`;
        mcqs += `b) ${options[1]}\n`;
        mcqs += `c) ${options[2]}\n`;
        mcqs += `d) ${options[3]}\n\nCorrect: ${answer}\n\n`;
    });

    updatePreview(mcqs);
}

// -------------------------
// EXPORT TO PDF
// -------------------------
function downloadPDF() {
    let text = document.getElementById("preview").innerText;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "notes.txt";
    a.click();
}
    
   
