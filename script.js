const modeButtons = document.querySelectorAll('.mode-btn');
const statusEl = document.getElementById('status');
const fileInput = document.getElementById('fileInput');
const inputTextArea = document.getElementById('inputText');

// Handle multi-file upload
fileInput.addEventListener('change', async () => {
  const files = fileInput.files;
  let combinedText = '';
  for(const file of files){
    const text = await file.text();
    combinedText += text + '\n';
  }
  inputTextArea.value = combinedText.trim();
});

// Pseudo-AI logic per button
modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-mode');
    const inputText = inputTextArea.value.trim();
    if(!inputText){ alert('Please enter or upload text first.'); return; }

    statusEl.textContent = 'Generating notes...';
    statusEl.style.color = '#2563eb';

    let generatedText = '';

    switch(mode){
      case 'short_notes':
        generatedText = inputText
          .split(/[.!?]\s/)
          .map(s => '- ' + s.trim())
          .filter(s => s.length>2)
          .join('\n');
        break;

      case 'one_page':
        // Pick first 10 sentences, remove extra spaces
        generatedText = inputText.split(/[.!?]\s/).slice(0,10).join('. ') + '...';
        break;

      case 'exam_notes':
        const keywords = inputText.match(/\b\w{6,}\b/g) || [];
        generatedText = 'Important keywords:\n' + Array.from(new Set(keywords)).slice(0,20).join(', ');
        break;

      case 'descriptive':
        generatedText = inputText.split(/[.!?]\s/).map(s => s + ' (explained)').join('.\n');
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

// Pie chart button
document.getElementById('pieBtn').addEventListener('click', () => {
  const text = inputTextArea.value;
  const regex = /(\w[\w\s]*):\s*(\d+)/g;
  let labels=[], values=[], match;
  while((match=regex.exec(text))!==null){
    labels.push(match[1].trim());
    values.push(parseFloat(match[2]));
  }

  if(labels.length === 0){ 
    alert('No numeric data found in text for pie chart.');
    return; 
  }

  new Chart(document.getElementById('lengthChart').getContext('2d'), {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: labels.map((_,i)=>`hsl(${i*60 %360},70%,50%)`) }]
    },
    options: { responsive:true, plugins:{ legend:{ position:'bottom' } } }
  });
});
