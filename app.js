// =========================================================
// AI Supply Chain Disruption Alert Summarizer — App Logic
// =========================================================

const state = {
  currentTab: 'summarizer',
  theme: localStorage.getItem('theme') || 'dark',
  lastGeneratedId: null,
  lastGeneratedData: null,
  currentModalItem: null,
  history: [],
  analyticsData: null,
  selectedRating: 0,
  volumeChart: null,
  supplierChart: null
};

// Template Presets (real Manikanta Enterprises scenarios)
const PRESETS = [
  {
    title: '🌾 Crop Flood Delay',
    supplier: 'Krishna Agro Industries',
    inputs: 'Dear Manikanta Enterprises, we regret to inform you that heavy unseasonal rainfall and flooding in the Guntur farming region have severely damaged our sunflower crops. Consequently, our processing unit will experience a production delay. Seed shipments scheduled for delivery between June 18th and June 25th will be delayed by approximately 15 to 20 days. We are trying to source supplies from alternative fields and will keep you updated.'
  },
  {
    title: '🚛 Transport Strike',
    supplier: 'Hyderabad Wholesale Logistics Union',
    inputs: 'Alert: The Local Transport Union has declared an indefinite strike starting tomorrow morning (June 17) across the Telangana region over diesel price disputes. All freight operations, warehouse despatches, and container movements to Hyderabad distribution circles will be suspended. Expected disruption: 3 to 5 days. Deliveries of FMCG repeat-orders will be delayed until transport resumes.'
  },
  {
    title: '📦 Packaging Shortage',
    supplier: 'Pragati Packaging Solutions',
    inputs: 'Urgent Notification: A major gear shaft failure occurred in our primary corrugated board manufacturing line last night. Repairs are underway but spare parts must be shipped from Chennai. We will experience a 70% capacity shortage of standard packing boxes and shipping crates for the next 10 days. We recommend shipping products in plain wrapping, or rescheduling bulk shipments.'
  },
  {
    title: '⚡ Power Outage',
    supplier: 'Bharathi Cement Works',
    inputs: 'Customer Notice: Due to emergency maintenance at the sub-station supplying power to our Guntur cement plant, the plant will observe complete power shutdown for 48 hours starting midnight June 18. Stock despatches of cement bags to regional dealers will be heavily restricted, and repeat orders for credit customers will be fulfilled at only 30% of normal volumes for the upcoming week.'
  }
];

// Loading text cycle
const LOADING_MESSAGES = [
  'Reading supplier communication...',
  'Identifying disruption type and severity...',
  'Estimating impact on retail dealers...',
  'Analyzing affected credit orders...',
  'Generating recommended response actions...',
  'Formatting executive summary...'
];

// ==================== DOM REFS ====================
const el = {
  themeToggle: document.getElementById('themeToggle'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  screens: document.querySelectorAll('.screen'),
  presetChips: document.getElementById('presetChips'),
  form: document.getElementById('disruptionForm'),
  adminInput: document.getElementById('adminName'),
  supplierInput: document.getElementById('supplierName'),
  inputsArea: document.getElementById('supplierInputs'),
  charCounter: document.getElementById('charCounter'),
  submitBtn: document.getElementById('submitBtn'),
  outputPlaceholder: document.getElementById('outputPlaceholder'),
  loadingContainer: document.getElementById('loadingContainer'),
  loadingText: document.getElementById('loadingText'),
  outputContainer: document.getElementById('outputContainer'),
  outLatency: document.getElementById('outLatency'),
  outVersion: document.getElementById('outVersion'),
  reportMarkdown: document.getElementById('reportMarkdown'),
  regenerateBtn: document.getElementById('regenerateBtn'),
  copyBtn: document.getElementById('copyBtn'),
  downloadPdfBtn: document.getElementById('downloadPdfBtn'),
  downloadTxtBtn: document.getElementById('downloadTxtBtn'),
  printBtn: document.getElementById('printBtn'),
  starRating: document.getElementById('starRating'),
  feedbackComment: document.getElementById('feedbackComment'),
  submitFeedbackBtn: document.getElementById('submitFeedbackBtn'),
  historySearch: document.getElementById('historySearch'),
  historyList: document.getElementById('historyList'),
  historyCountBadge: document.getElementById('historyCountBadge'),
  detailModal: document.getElementById('detailModal'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  modalDownloadPdfBtn: document.getElementById('modalDownloadPdfBtn'),
  modalDownloadTxtBtn: document.getElementById('modalDownloadTxtBtn'),
  modalSupplier: document.getElementById('modalSupplier'),
  modalAdmin: document.getElementById('modalAdmin'),
  modalDate: document.getElementById('modalDate'),
  modalLatency: document.getElementById('modalLatency'),
  modalRawInput: document.getElementById('modalRawInput'),
  modalAiOutput: document.getElementById('modalAiOutput'),
  modalFeedbackInfo: document.getElementById('modalFeedbackInfo'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
  statTotal: document.getElementById('statTotal'),
  statRating: document.getElementById('statRating'),
  statLatency: document.getElementById('statLatency'),
  statCoverage: document.getElementById('statCoverage')
};

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(state.theme);
  setupListeners();
  loadPresets();
  restoreDrafts();
  lucide.createIcons();
});

// ==================== THEME ====================
function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
  state.theme = theme;
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const next = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  const icon = el.themeToggle.querySelector('i');
  icon.setAttribute('data-lucide', next === 'dark' ? 'sun' : 'moon');
  lucide.createIcons();
  if (state.volumeChart || state.supplierChart) redrawCharts();
}

// ==================== EVENT LISTENERS ====================
function setupListeners() {
  el.themeToggle.addEventListener('click', toggleTheme);

  // Tabs
  el.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Character counter + draft saving
  el.inputsArea.addEventListener('input', () => {
    el.charCounter.textContent = `${el.inputsArea.value.length} characters`;
    localStorage.setItem('draft_inputs', el.inputsArea.value);
  });
  el.adminInput.addEventListener('input', () => localStorage.setItem('draft_admin', el.adminInput.value));
  el.supplierInput.addEventListener('input', () => localStorage.setItem('draft_supplier', el.supplierInput.value));

  // Form submit
  el.form.addEventListener('submit', handleSubmit);

  // Output actions
  el.copyBtn.addEventListener('click', copyOutput);
  el.downloadPdfBtn.addEventListener('click', downloadCurrentPdf);
  el.downloadTxtBtn.addEventListener('click', downloadTxt);
  el.printBtn.addEventListener('click', () => window.print());
  el.regenerateBtn.addEventListener('click', () => handleSubmit());

  // Stars
  el.starRating.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => setRating(parseInt(star.dataset.rating)));
    star.addEventListener('mouseenter', () => highlightStars(parseInt(star.dataset.rating)));
  });
  el.starRating.addEventListener('mouseleave', () => highlightStars(state.selectedRating));

  // Feedback submit
  el.submitFeedbackBtn.addEventListener('click', submitFeedback);

  // History search
  el.historySearch.addEventListener('input', filterHistory);

  // Modal close & download
  el.modalCloseBtn.addEventListener('click', closeModal);
  el.modalDownloadPdfBtn.addEventListener('click', () => {
    if (state.currentModalItem) downloadHistoryItemPDF(state.currentModalItem);
  });
  el.modalDownloadTxtBtn.addEventListener('click', () => {
    if (state.currentModalItem) downloadHistoryItem(state.currentModalItem);
  });
  window.addEventListener('click', e => { if (e.target === el.detailModal) closeModal(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// ==================== DRAFTS ====================
function restoreDrafts() {
  const admin = localStorage.getItem('draft_admin');
  const supplier = localStorage.getItem('draft_supplier');
  const inputs = localStorage.getItem('draft_inputs');
  if (admin) el.adminInput.value = admin;
  if (supplier) el.supplierInput.value = supplier;
  if (inputs) {
    el.inputsArea.value = inputs;
    el.charCounter.textContent = `${inputs.length} characters`;
  }

  // Restore last output
  const lastId = localStorage.getItem('last_gen_id');
  const lastOutput = localStorage.getItem('last_gen_output');
  const lastLatency = localStorage.getItem('last_gen_latency');
  if (lastId && lastOutput) {
    state.lastGeneratedId = lastId;
    state.lastGeneratedData = { aiOutput: lastOutput, responseTimeMs: parseInt(lastLatency || '0') };
    showOutput(lastOutput, lastLatency);
  }
}

// ==================== PRESETS ====================
function loadPresets() {
  PRESETS.forEach(preset => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'preset-chip';
    chip.textContent = preset.title;
    chip.addEventListener('click', () => {
      el.supplierInput.value = preset.supplier;
      el.inputsArea.value = preset.inputs;
      el.charCounter.textContent = `${preset.inputs.length} characters`;
      if (!el.adminInput.value) el.adminInput.value = 'Admin';
      localStorage.setItem('draft_admin', el.adminInput.value);
      localStorage.setItem('draft_supplier', preset.supplier);
      localStorage.setItem('draft_inputs', preset.inputs);
      showToast(`Loaded: ${preset.title}`);
    });
    el.presetChips.appendChild(chip);
  });
}

// ==================== TAB SWITCHING ====================
function switchTab(tab) {
  el.tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  el.screens.forEach(s => s.classList.toggle('active', s.id === `${tab}Screen`));
  state.currentTab = tab;
  if (tab === 'history') fetchHistory();
  if (tab === 'analytics') fetchAnalytics();
}

// ==================== FORM SUBMIT ====================
let loadingMsgInterval;

async function handleSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const admin = el.adminInput.value.trim();
  const supplier = el.supplierInput.value.trim();
  const inputs = el.inputsArea.value.trim();

  if (!admin || !supplier || !inputs) {
    showToast('Please fill all required fields.', 'danger');
    return;
  }

  // Show loading
  el.outputPlaceholder.style.display = 'none';
  el.outputContainer.style.display = 'none';
  el.loadingContainer.style.display = 'flex';
  el.submitBtn.disabled = true;
  el.submitBtn.innerHTML = '<div class="btn-spinner"></div> Generating...';

  // Cycle loading messages
  let msgIdx = 0;
  el.loadingText.textContent = LOADING_MESSAGES[0];
  loadingMsgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
    el.loadingText.style.opacity = '0';
    setTimeout(() => {
      el.loadingText.textContent = LOADING_MESSAGES[msgIdx];
      el.loadingText.style.opacity = '1';
    }, 200);
  }, 2000);

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin, supplier, inputs })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Generation failed.');

    state.lastGeneratedId = data.id;
    state.lastGeneratedData = data;
    localStorage.setItem('last_gen_id', data.id);
    localStorage.setItem('last_gen_output', data.aiOutput);
    localStorage.setItem('last_gen_latency', data.responseTimeMs);

    showOutput(data.aiOutput, data.responseTimeMs);
    showToast('AI analysis generated successfully!');
  } catch (err) {
    console.error(err);
    el.outputPlaceholder.style.display = 'flex';
    el.loadingContainer.style.display = 'none';
    showToast(err.message, 'danger');
  } finally {
    clearInterval(loadingMsgInterval);
    el.submitBtn.disabled = false;
    el.submitBtn.innerHTML = '<i data-lucide="sparkles" style="width:16px;height:16px;"></i><span>Generate AI Summary</span>';
    lucide.createIcons();
  }
}

// ==================== DISPLAY OUTPUT ====================
function showOutput(text, latencyMs) {
  el.loadingContainer.style.display = 'none';
  el.outputPlaceholder.style.display = 'none';
  el.outputContainer.style.display = 'block';
  el.outLatency.textContent = `${(latencyMs / 1000).toFixed(2)}s`;
  el.outVersion.textContent = 'v4';
  el.reportMarkdown.innerHTML = renderMarkdown(text);
  setRating(0);
  el.feedbackComment.value = '';
}

// ==================== MARKDOWN RENDERER ====================
function renderMarkdown(md) {
  if (!md) return '';
  let t = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Headers
  t = t.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  t = t.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  t = t.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  // Bold
  t = t.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  // Italic
  t = t.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  // Lists
  t = t.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>');
  t = t.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  t = t.replace(/<\/ul>\s*<ul>/gim, '');
  // Numbered lists
  t = t.replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>');
  // Paragraphs
  const lines = t.split('\n');
  return lines.map(line => {
    const tr = line.trim();
    if (!tr) return '';
    if (/^<(h[1-3]|ul|li|\/ul|ol|\/ol)/.test(tr)) return line;
    return `<p>${line}</p>`;
  }).join('\n');
}

// ==================== RATING ====================
function setRating(r) {
  state.selectedRating = r;
  highlightStars(r);
}

function highlightStars(r) {
  el.starRating.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < r));
}

// ==================== FEEDBACK ====================
async function submitFeedback() {
  if (!state.lastGeneratedId) return showToast('No generation to rate.', 'danger');
  if (!state.selectedRating) return showToast('Select a star rating first.', 'danger');

  el.submitFeedbackBtn.disabled = true;
  el.submitFeedbackBtn.innerHTML = '<div class="btn-spinner"></div> Saving...';

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: state.lastGeneratedId, rating: state.selectedRating, comment: el.feedbackComment.value.trim() })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Feedback failed.');
    showToast('Feedback submitted — thank you!');
    el.feedbackComment.value = '';
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    el.submitFeedbackBtn.disabled = false;
    el.submitFeedbackBtn.innerHTML = '<i data-lucide="send" style="width:14px;height:14px;"></i> Submit';
    lucide.createIcons();
  }
}

// ==================== COPY / DOWNLOAD ====================
function copyOutput() {
  if (!state.lastGeneratedData) return;
  navigator.clipboard.writeText(state.lastGeneratedData.aiOutput)
    .then(() => showToast('Copied to clipboard!'))
    .catch(() => showToast('Copy failed.', 'danger'));
}

function downloadTxt() {
  if (!state.lastGeneratedData) return;
  const blob = new Blob([state.lastGeneratedData.aiOutput], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Disruption_Report_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  showToast('File download started!');
}

function downloadCurrentPdf() {
  if (!state.lastGeneratedData) return showToast('No report to download.', 'danger');
  const item = {
    supplier_name: el.supplierInput.value || 'Unknown Supplier',
    admin_name: el.adminInput.value || 'Admin',
    raw_input: el.inputsArea.value || '',
    ai_output: state.lastGeneratedData.aiOutput,
    response_time_ms: state.lastGeneratedData.responseTimeMs || 0,
    created_at: new Date().toISOString(),
    rating: state.selectedRating || null,
    feedback_comment: el.feedbackComment.value || null
  };
  downloadHistoryItemPDF(item);
}

function downloadHistoryItem(item) {
  const date = new Date(item.created_at);
  const dateStr = date.toISOString().slice(0, 10);
  const safeName = item.supplier_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const content = [
    '═══════════════════════════════════════════════════════',
    '  SUPPLY CHAIN DISRUPTION REPORT',
    '  Manikanta Enterprises — AI Generated Summary',
    '═══════════════════════════════════════════════════════',
    '',
    `Supplier:   ${item.supplier_name}`,
    `Admin:      ${item.admin_name}`,
    `Date:       ${date.toLocaleString()}`,
    `AI Latency: ${(item.response_time_ms / 1000).toFixed(2)}s`,
    item.rating ? `Rating:     ${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)} (${item.rating}/5)` : 'Rating:     Not rated',
    item.feedback_comment ? `Comment:    ${item.feedback_comment}` : '',
    '',
    '───────────────────────────────────────────────────────',
    '  RAW SUPPLIER COMMUNICATION',
    '───────────────────────────────────────────────────────',
    '',
    item.raw_input,
    '',
    '───────────────────────────────────────────────────────',
    '  AI GENERATED ANALYSIS',
    '───────────────────────────────────────────────────────',
    '',
    item.ai_output,
    '',
    '═══════════════════════════════════════════════════════',
    '  Generated by Supply Chain AI · Manikanta Enterprises',
    '═══════════════════════════════════════════════════════'
  ].filter(l => l !== undefined).join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Report_${safeName}_${dateStr}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  showToast(`Downloaded TXT for ${item.supplier_name}`);
}

function downloadHistoryItemPDF(item) {
  const date = new Date(item.created_at);
  const ratingHtml = item.rating
    ? `<span style="color:#f59e0b;">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</span> (${item.rating}/5)`
    : '<span style="color:#9ca3af;">Not rated</span>';
  const commentHtml = item.feedback_comment
    ? `<p style="margin-top:4px;"><strong>Feedback:</strong> <em>"${item.feedback_comment}"</em></p>`
    : '';
  const aiHtml = renderMarkdown(item.ai_output);

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Disruption Report — ${item.supplier_name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }
  .brand h1 { font-size: 20px; color: #6366f1; font-weight: 700; }
  .brand p { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
  .date-box { text-align: right; font-size: 12px; color: #64748b; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .meta-item { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .meta-item .label { font-size: 10px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 2px; }
  .meta-item .value { font-size: 14px; font-weight: 600; color: #0f172a; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6366f1; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .raw-input { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; color: #475569; white-space: pre-wrap; font-family: 'Courier New', monospace; }
  .ai-output { padding: 4px 0; font-size: 14px; }
  .ai-output h1 { font-size: 18px; color: #0f172a; margin: 16px 0 8px; }
  .ai-output h2 { font-size: 15px; color: #334155; margin: 14px 0 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
  .ai-output h3 { font-size: 14px; color: #475569; margin: 12px 0 4px; }
  .ai-output p { margin-bottom: 8px; }
  .ai-output ul, .ai-output ol { margin: 8px 0; padding-left: 20px; }
  .ai-output li { margin-bottom: 4px; }
  .ai-output strong { color: #0891b2; }
  .feedback { background: #fffbeb; padding: 12px 16px; border-radius: 8px; border: 1px solid #fde68a; font-size: 13px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 2px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
  <div class="header">
    <div class="brand">
      <h1>⚡ Supply Chain Disruption Report</h1>
      <p>Manikanta Enterprises &bull; Hyderabad</p>
    </div>
    <div class="date-box">
      <div style="font-weight:600;color:#0f172a;">${date.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
      <div>${date.toLocaleTimeString()}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><div class="label">Supplier</div><div class="value">${item.supplier_name}</div></div>
    <div class="meta-item"><div class="label">Reported By</div><div class="value">${item.admin_name}</div></div>
    <div class="meta-item"><div class="label">AI Latency</div><div class="value">${(item.response_time_ms / 1000).toFixed(2)}s</div></div>
    <div class="meta-item"><div class="label">Rating</div><div class="value">${ratingHtml}</div></div>
  </div>

  <div class="section">
    <div class="section-title">Raw Supplier Communication</div>
    <div class="raw-input">${item.raw_input}</div>
  </div>

  <div class="section">
    <div class="section-title">AI Generated Analysis</div>
    <div class="ai-output">${aiHtml}</div>
  </div>

  ${commentHtml ? `<div class="feedback">${commentHtml}</div>` : ''}

  <div class="footer">Generated by Supply Chain AI &bull; Manikanta Enterprises &bull; Powered by Groq Llama 3</div>
</body></html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(html);
  printWindow.document.close();
  // Wait for fonts to load then trigger print (Save as PDF)
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };
  showToast('PDF print dialog opened!');
}

// ==================== HISTORY ====================
async function fetchHistory() {
  el.historyList.innerHTML = '<div class="history-loading"><div class="btn-spinner"></div><span>Loading history...</span></div>';
  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch history.');
    state.history = data.history;
    el.historyCountBadge.textContent = `${data.history.length} record${data.history.length !== 1 ? 's' : ''}`;
    renderHistory(data.history);
  } catch (err) {
    el.historyList.innerHTML = `<div class="history-empty"><p style="color:var(--accent-danger);">${err.message}</p></div>`;
  }
}

function renderHistory(items) {
  if (!items.length) {
    el.historyList.innerHTML = '<div class="history-empty"><i data-lucide="inbox" style="width:40px;height:40px;opacity:0.3;"></i><p>No disruption records found.</p></div>';
    lucide.createIcons();
    return;
  }
  el.historyList.innerHTML = '';
  items.forEach(item => {
    const d = new Date(item.created_at);
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const latency = (item.response_time_ms / 1000).toFixed(1);
    const stars = item.rating ? '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating) : '';
    const preview = item.ai_output.replace(/[#\*`]/g, '').substring(0, 140) + '...';

    const card = document.createElement('div');
    card.className = 'history-item';
    card.innerHTML = `
      <div class="history-item-header">
        <span class="supplier-badge">${item.supplier_name}</span>
        <span class="history-time">${dateStr}</span>
      </div>
      <div class="history-item-body">${preview}</div>
      <div class="history-item-footer">
        <div class="admin-tag">
          <i data-lucide="user" style="width:12px;height:12px;"></i>
          <span>${item.admin_name}</span>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <span style="font-size:0.75rem;">${latency}s</span>
          ${stars ? `<span class="rating-badge">${stars}</span>` : '<span style="opacity:0.4;font-size:0.75rem;">No rating</span>'}
          <button class="history-dl-btn history-pdf-btn" title="Download PDF">
            <i data-lucide="file-text" style="width:13px;height:13px;"></i> PDF
          </button>
          <button class="history-dl-btn history-txt-btn" title="Download TXT">
            <i data-lucide="file-down" style="width:13px;height:13px;"></i> TXT
          </button>
        </div>
      </div>`;
    // Download buttons (stop propagation so they don't open the modal)
    card.querySelector('.history-pdf-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      downloadHistoryItemPDF(item);
    });
    card.querySelector('.history-txt-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      downloadHistoryItem(item);
    });
    card.addEventListener('click', () => openModal(item));
    el.historyList.appendChild(card);
  });
  lucide.createIcons();
}

function filterHistory() {
  const q = el.historySearch.value.toLowerCase().trim();
  if (!q) return renderHistory(state.history);
  renderHistory(state.history.filter(i =>
    i.supplier_name.toLowerCase().includes(q) ||
    i.admin_name.toLowerCase().includes(q) ||
    i.ai_output.toLowerCase().includes(q) ||
    i.raw_input.toLowerCase().includes(q)
  ));
}

// ==================== MODAL ====================
function openModal(item) {
  state.currentModalItem = item;
  const d = new Date(item.created_at);
  el.modalSupplier.textContent = item.supplier_name;
  el.modalAdmin.textContent = item.admin_name;
  el.modalDate.textContent = d.toLocaleString();
  el.modalLatency.textContent = `${(item.response_time_ms / 1000).toFixed(2)}s`;
  el.modalRawInput.textContent = item.raw_input;
  el.modalAiOutput.innerHTML = renderMarkdown(item.ai_output);

  if (item.rating) {
    el.modalFeedbackInfo.innerHTML = `
      <div class="modal-feedback-card">
        <strong>Rating:</strong> <span style="color:var(--accent-warning);">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</span> (${item.rating}/5)
        ${item.feedback_comment ? `<br><strong>Comment:</strong> <em>"${item.feedback_comment}"</em>` : ''}
      </div>`;
  } else {
    el.modalFeedbackInfo.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No feedback recorded for this report.</p>';
  }

  el.detailModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  el.detailModal.classList.remove('active');
  document.body.style.overflow = '';
}

// ==================== ANALYTICS ====================
async function fetchAnalytics() {
  el.statTotal.textContent = '...';
  el.statRating.textContent = '...';
  el.statLatency.textContent = '...';
  el.statCoverage.textContent = '...';
  try {
    const res = await fetch('/api/analytics');
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Analytics failed.');
    state.analyticsData = data;
    const s = data.summary;
    el.statTotal.textContent = s.totalGenerations;
    el.statRating.textContent = s.averageRating > 0 ? `${s.averageRating} / 5` : 'N/A';
    el.statLatency.textContent = s.totalGenerations > 0 ? `${(s.averageResponseTimeMs / 1000).toFixed(2)}s` : 'N/A';
    el.statCoverage.textContent = s.totalGenerations > 0 ? `${Math.round((s.ratedCount / s.totalGenerations) * 100)}%` : '0%';
    drawCharts(data.raw);
  } catch (err) {
    showToast('Analytics error: ' + err.message, 'danger');
  }
}

function drawCharts(raw) {
  redrawCharts(raw);
}

function redrawCharts(raw) {
  if (!raw && state.analyticsData) raw = state.analyticsData.raw;
  if (!raw) return;

  const isLight = document.body.classList.contains('light-mode');
  const txtCol = isLight ? '#334155' : '#94a3b8';
  const gridCol = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  // Volume by date
  const volMap = {};
  raw.forEach(r => {
    const d = new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    volMap[d] = (volMap[d] || 0) + 1;
  });
  const dates = Object.keys(volMap).reverse().slice(-7);
  const counts = dates.map(d => volMap[d]);

  if (state.volumeChart) state.volumeChart.destroy();
  state.volumeChart = new Chart(document.getElementById('volumeChart').getContext('2d'), {
    type: 'line',
    data: {
      labels: dates.length ? dates : ['No data'],
      datasets: [{
        label: 'Disruptions',
        data: counts.length ? counts : [0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.12)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#22d3ee',
        pointBorderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridCol }, ticks: { color: txtCol, font: { family: 'Inter' } } },
        y: { grid: { color: gridCol }, ticks: { color: txtCol, stepSize: 1, precision: 0 }, beginAtZero: true }
      }
    }
  });

  // Supplier frequency
  const supMap = {};
  raw.forEach(r => supMap[r.supplier_name] = (supMap[r.supplier_name] || 0) + 1);
  const sups = Object.keys(supMap).sort((a, b) => supMap[b] - supMap[a]).slice(0, 5);
  const supCounts = sups.map(s => supMap[s]);
  const barColors = ['rgba(99,102,241,0.8)', 'rgba(34,211,238,0.8)', 'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)'];

  if (state.supplierChart) state.supplierChart.destroy();
  state.supplierChart = new Chart(document.getElementById('supplierChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: (sups.length ? sups : ['No data']).map(s => s.length > 18 ? s.substring(0, 18) + '…' : s),
      datasets: [{
        label: 'Alerts',
        data: supCounts.length ? supCounts : [0],
        backgroundColor: barColors,
        borderRadius: 6,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridCol }, ticks: { color: txtCol, stepSize: 1, precision: 0 }, beginAtZero: true },
        y: { grid: { display: false }, ticks: { color: txtCol, font: { family: 'Inter' } } }
      }
    }
  });
}

// ==================== TOAST ====================
let toastTimer;
function showToast(msg, type = 'success') {
  clearTimeout(toastTimer);
  el.toastMessage.textContent = msg;
  el.toast.className = 'toast' + (type === 'danger' ? ' danger' : '');
  const icon = el.toast.querySelector('i');
  icon.setAttribute('data-lucide', type === 'danger' ? 'alert-circle' : 'check-circle');
  lucide.createIcons();
  el.toast.classList.add('active');
  toastTimer = setTimeout(() => el.toast.classList.remove('active'), 3500);
}
