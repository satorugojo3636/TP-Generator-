const modeButtons = document.querySelectorAll('.mode-btn');
const statusEl = document.getElementById('status');
const fileInput = document.getElementById('fileInput');
const inputTextArea = document.getElementById('inputText');

// 1️⃣ Multi-file upload
fileInput.addEventListener('change', async () => {
  const files = fileInput.files;
  let combinedText = '';
  for(const file of files){
    const text = await file.text();
    combinedText += text + '\n';
  }
  inputTextArea.value = combinedText.trim();
});

// 2️⃣ Pseudo-AI logic per button
modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-mode');
    const inputText = inputTextArea.value.trim();
    if(!inputText){ 
      alert('Please enter or upload text first.'); 
      return; 
    }

    statusEl.textContent = 'Generating notes...';
    statusEl.style.color = '#2563eb';

    let generatedText = '';

    switch(mode){
      case 'short_notes':
        // Split into key sentences, bullets
        generatedText = inputText
          .split(/(?<=\.|\?|!)/)
          .map(s => s.trim())
          .filter(s => s.length > 5)
          .map(s => '- ' + s)
          .join('\n');
        break;

      case 'one_page':
        // Top 10 sentences as paragraph
        generatedText = inputText
          .split(/(?<=\.|\?|!)/)
          .map(s => s.trim())
          .filter(s => s.length > 5)
          .slice(0,10)
          .join(' ') + ' ...';
        break;

      case 'exam_notes':
        // Extract keywords
        const keywords = inputText.match(/\b\w{6,}\b/g) || [];
        generatedText = 'Important keywords:\n' + Array.from(new Set(keywords)).slice(0,30).join(', ');
        break;

      case 'descriptive':
        // Expand sentences
        generatedText = inputText
          .split(/(?<=\.|\?|!)/)
          .map(s => s.trim() + ' (explained)')
          .join('\n');
        break;

      default:
        generatedText = inputText;
    }

    // Save to localStorage for preview
    localStorage.setItem('tpOutput', JSON.stringify({
      mode, originalText: inputText, generatedText
    }));

    window.location.href = 'preview.html';
  });
});

// 3️⃣ Pie chart button (percentages + numbers)
document.getElementById('pieBtn').addEventListener('click', () => {
  const text = inputTextArea.value;

  const labels = [];
  const values = [];

  // Detect percentages
  const percentRegex = /([\w\s]+?)\s*(?:were|was|make up|made up|are|is)?\s*(\d+\.?\d*)\s*%/gi;
  let match;
  while ((match = percentRegex.exec(text)) !== null) {
    labels.push(match[1].trim());
    values.push(parseFloat(match[2]));
  }

  // Detect raw numbers
  const numberRegex = /([\w\s]+?):\s*(\d+\.?\d*)/g;
  while ((match = numberRegex.exec(text)) !== null) {
    const label = match[1].trim();
    const value = parseFloat(match[2]);
    if (!labels.includes(label)) { // avoid duplicates
      labels.push(label);
      values.push(value);
    }
  }

  if(labels.length === 0){
    alert('No numeric or percentage data found in text for pie chart.');
    return;
  }

  // Render pie chart
  new Chart(document.getElementById('lengthChart').getContext('2d'), {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, i) => `hsl(${i * 60 % 360},70%,50%)`)
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
});
