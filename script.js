const modeButtons = document.querySelectorAll('.mode-btn');
const statusEl = document.getElementById('status');

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-mode');
    const inputText = document.getElementById('inputText').value.trim();
    if (!inputText) { alert('Please enter some text first.'); return; }

    statusEl.textContent = 'Generating notes...';
    statusEl.style.color = '#2563eb';

    let generatedText = '';

    switch(mode) {
      case 'short_notes':
        generatedText = inputText.split('. ').map(s => '- ' + s).join('\n');
        break;
      case 'one_page':
        generatedText = inputText.split('.').slice(0,10).join('. ') + '...';
        break;
      case 'exam_notes':
        const keywords = inputText.match(/\b\w{6,}\b/g) || [];
        generatedText = 'Important keywords:\n' + Array.from(new Set(keywords)).slice(0,20).join(', ');
        break;
      case 'descriptive':
        generatedText = inputText.split('. ').map(s => s + ' (explained)').join('.\n');
        break;
      default:
        generatedText = inputText;
    }

    localStorage.setItem('tpOutput', JSON.stringify({
      mode, originalText: inputText, generatedText
    }));
    window.location.href = 'preview.html';
  });
});
