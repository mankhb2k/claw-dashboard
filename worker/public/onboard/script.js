/**
 * OpenClaw Onboard Script
 * Handles form interaction and API calls
 */

const api = {
  run: async (payload) => {
    const res = await fetch('/api/onboard/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Thiết lập thất bại');
    }
    return res.json();
  },
  skip: async () => {
    const res = await fetch('/api/onboard/skip', { method: 'POST' });
    if (!res.ok) throw new Error('Không thể bỏ qua');
    return res.json();
  },
};

// DOM Elements
const setupApi = document.getElementById('setupApi');
const setupOllama = document.getElementById('setupOllama');
const sectionApi = document.getElementById('sectionApi');
const sectionOllama = document.getElementById('sectionOllama');
const provider = document.getElementById('provider');
const apiKey = document.getElementById('apiKey');
const model8 = document.getElementById('model8');
const acceptRisk = document.getElementById('acceptRisk');
const btnSkip = document.getElementById('btnSkip');
const btnRun = document.getElementById('btnRun');
const errorBox = document.getElementById('errorBox');
const progressBar = document.getElementById('progressBar');

let isBusy = false;

/**
 * Show error message
 */
function showError(msg) {
  errorBox.textContent = msg || '';
  errorBox.classList.toggle('visible', Boolean(msg));
}

/**
 * Set busy state
 */
function setBusy(busy) {
  isBusy = busy;
  btnSkip.disabled = busy;
  btnRun.disabled = busy;
  acceptRisk.disabled = busy;
  setupApi.disabled = busy;
  setupOllama.disabled = busy;
  apiKey.disabled = busy;
  provider.disabled = busy;
  btnRun.textContent = busy ? 'Đang chạy…' : 'Chạy thiết lập';
  progressBar.classList.toggle('active', busy);
}

/**
 * Sync form sections based on selected option
 */
function syncSections() {
  const apiMode = setupApi.checked;
  sectionApi.classList.toggle('section-hidden', !apiMode);
  sectionOllama.classList.toggle('section-hidden', apiMode);
}

/**
 * Event Listeners
 */
setupApi.addEventListener('change', syncSections);
setupOllama.addEventListener('change', syncSections);

btnSkip.addEventListener('click', async () => {
  showError('');
  setBusy(true);
  try {
    await api.skip();
    window.location.href = '/';
  } catch (e) {
    showError(e.message);
    setBusy(false);
  }
});

btnRun.addEventListener('click', async () => {
  showError('');

  if (!acceptRisk.checked) {
    showError('Vui lòng đánh dấu xác nhận rủi ro');
    return;
  }

  setBusy(true);

  try {
    if (setupApi.checked) {
      const key = apiKey.value.trim();
      if (!key) {
        showError('Vui lòng nhập API key');
        setBusy(false);
        return;
      }
      await api.run({
        kind: 'api',
        provider: provider.value,
        apiKey: key,
      });
    } else {
      const modelId = document.querySelector(
        'input[name="ollamaModel"]:checked'
      ).value;
      await api.run({
        kind: 'ollama',
        ollamaModelId: modelId,
      });
    }

    // Nếu thành công, show message + redirect
    showError('');
    errorBox.classList.remove('visible');
    errorBox.classList.add('success');
    errorBox.innerHTML =
      '✅ Thiết lập thành công!<br><br>Gateway đang khởi động trên port 18789...<br><br>Chuyển hướng tới dashboard trong 3 giây...';
    errorBox.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
    errorBox.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    errorBox.style.color = '#10b981';
    errorBox.classList.add('visible');

    setTimeout(() => {
      window.location.href = 'http://localhost:18789';
    }, 3000);
  } catch (e) {
    showError(e.message);
    setBusy(false);
  }
});

// Initialize
syncSections();
