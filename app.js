// Application State
const state = {
  currentTab: 'summarizer',
  theme: 'dark',
  lastGeneratedId: null,
  lastGeneratedData: null,
  history: [],
  analyticsData: null,
  selectedRating: 0,
  volumeChart: null,
  supplierChart: null
};

// Preset Scenarios
const PRESETS = [
  {
    title: 'Guntur Crop Flood',
    supplier: 'Krishna Agro Industries',
    inputs: 'Dear Manikanta Enterprises, we regret to inform you that heavy unseasonal rainfall and flooding in the Guntur farming region have severely damaged our sunflower crops. Consequently, our processing unit will experience a production delay. Seed shipments scheduled for delivery between June 18th and June 25th will be delayed by approximately 15 to 20 days. We are trying to source supplies from alternative fields and will keep you updated.'
  },
  {
    title: 'Truck Transport Strike',
    supplier: 'Hyderabad Wholesale Logistics Union',
    inputs: 'Alert: The Local Transport Union has declared an indefinite strike starting tomorrow morning (June 17) across the Telangana region over diesel price disputes. All freight operations, warehouse despatches, and container movements to Hyderabad distribution circles will be suspended. Expected disruption: 3 to 5 days. Deliveries of FMCG repeat-orders will be delayed until transport resumes.'
  },
  {
    title: 'Box Packing Shortage',
    supplier: 'Pragati Packaging Solutions',
    inputs: 'Urgent Notification: A major gear shaft failure occurred in our primary corrugated board manufacturing line last night. Repairs are underway but spare parts must be shipped from Chennai. We will experience a 70% capacity shortage of standard packing boxes and shipping crates for the next 10 days. We recommend shipping products in plain wrapping, or rescheduling bulk shipments.'
  },
  {
    title: 'Power Outage Deficit',
    supplier: 'Bharathi Cement Works',
    inputs: 'Customer Notice: Due to emergency maintenance at the sub-station supplying power to our Guntur cement plant, the plant will observe complete power shutdown for 48 hours starting midnight June 18. Stock despatches of cement bags to regional dealers will be heavily restricted, and repeat orders for credit customers will be fulfilled at only 30% of normal volumes for the upcoming week.'
  }
];

// Elements
const elements = {
  themeToggle: document.getElementById('themeToggle'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  screens: document.querySelectorAll('.screen'),
  presetChips: document.getElementById('presetChips'),
  disruptionForm: document.getElementById('disruptionForm'),
  adminNameInput: document.getElementById('adminName'),
  supplierNameInput: document.getElementById('supplierName'),
  supplierInputs: document.getElementById('supplierInputs'),
  charCounter: document.getElementById('charCounter'),
  submitBtn: document.getElementById('submitBtn'),
  outputCard: document.getElementById('outputCard'),
  outputPlaceholder: document.getElementById('outputPlaceholder'),
  loadingContainer: document.getElementById('loadingContainer'),
  outputContainer: document.getElementById('outputContainer'),
  outLatency: document.getElementById('outLatency'),
  outVersion: document.getElementById('outVersion'),
  reportMarkdown: document.getElementById('reportMarkdown'),
  regenerateBtn: document.getElementById('regenerateBtn'),
  copyBtn: document.getElementById('copyBtn'),
  downloadTxtBtn: document.getElementById('downloadTxtBtn'),
  printBtn: document.getElementById('printBtn'),
  starRating: document.getElementById('starRating'),
  feedbackComment: document.getElementById('feedbackComment'),
  submitFeedbackBtn: document.getElementById('submitFeedbackBtn'),
  historySearch: document.getElementById('historySearch'),
  historyList: document.getElementById('historyList'),
  detailModal: document.getElementById('detailModal'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  modalTitle: document.getElementById('modalTitle'),
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

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadPresets();
  restoreSavedState();
  lucide.createIcons();
});

// Event Listeners Setup
function setupEventListeners() {
  // Theme Toggle
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Tab Navigation
  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Textarea Char Counter & Draft Saving
  elements.supplierInputs.addEventListener('input', () => {
    const len = elements.supplierInputs.value.length;
    elements.charCounter.textContent = `${len} characters`;
    
    // Save draft state
    localStorage.setItem('draft_inputs', elements.supplierInputs.value);
  });
  
  elements.adminNameInput.addEventListener('input', () => {
    localStorage.setItem('draft_admin', elements.adminNameInput.value);
  });
  elements.supplierNameInput.addEventListener('input', () => {
    localStorage.setItem('draft_supplier', elements.supplierNameInput.value);
  });

  // Form Submission
  elements.disruptionForm.addEventListener('submit', handleFormSubmit);

  // Output Actions
  elements.copyBtn.addEventListener('click', copyOutputToClipboard);
  elements.downloadTxtBtn.addEventListener('click', downloadOutputAsTxt);
  elements.printBtn.addEventListener('click', exportOutputAsPDF);
  elements.regenerateBtn.addEventListener('click', regenerateOutput);

  // Star Rating Interaction
  const stars = elements.starRating.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.getAttribute('data-rating'), 10);
      setStarRating(rating);
    });
  });

  // Submit Feedback
  elements.submitFeedbackBtn.addEventListener('click', submitFeedback);

  // History Search filter
  elements.historySearch.addEventListener('input', filterHistoryList);

  // Modal Close
  elements.modalCloseBtn.addEventListener('click', hideModal);
  window.addEventListener('click', (e) => {
    if (e.target === elements.detailModal) hideModal();
  });
}

// Restore saved data from localStorage (like drafted inputs)
function restoreSavedState() {
  const draftAdmin = localStorage.getItem('draft_admin');
  const draftSupplier = localStorage.getItem('draft_supplier');
  const draftInputs = localStorage.getItem('draft_inputs');
  const lastId = localStorage.getItem('last_gen_id');
  const lastOutput = localStorage.getItem('last_gen_output');
  const lastLatency = localStorage.getItem('last_gen_latency');

  if (draftAdmin) elements.adminNameInput.value = draftAdmin;
  if (draftSupplier) elements.supplierNameInput.value = draftSupplier;
  if (draftInputs) {
    elements.supplierInputs.value = draftInputs;
    elements.charCounter.textContent = `${draftInputs.length} characters`;
  }

  // If there was a previously generated item, show it
  if (lastId && lastOutput) {
    state.lastGeneratedId = lastId;
    state.lastGeneratedData = {
      aiOutput: lastOutput,
      responseTimeMs: parseInt(lastLatency || '0', 10)
    };
    displayAiOutput(lastOutput, lastLatency);
  }
}

// Load Preset Chips
function loadPresets() {
  PRESETS.forEach((preset, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'preset-chip';
    chip.textContent = preset.title;
    chip.addEventListener('click', () => {
      elements.supplierNameInput.value = preset.supplier;
      elements.supplierInputs.value = preset.inputs;
      elements.charCounter.textContent = `${preset.inputs.length} characters`;
      
      // Auto-fill admin if blank
      if (!elements.adminNameInput.value) {
        elements.adminNameInput.value = 'Admin (Preset)';
      }
      
      // Save drafts
      localStorage.setItem('draft_admin', elements.adminNameInput.value);
      localStorage.setItem('draft_supplier', preset.supplier);
      localStorage.setItem('draft_inputs', preset.inputs);

      showToast(`Loaded preset: ${preset.title}`);
    });
    elements.presetChips.appendChild(chip);
  });
}

// Toggle Theme (Dark / Light)
function toggleTheme() {
  if (state.theme === 'dark') {
    document.body.classList.add('light-mode');
    state.theme = 'light';
    elements.themeToggle.querySelector('i').setAttribute('data-lucide', 'moon');
  } else {
    document.body.classList.remove('light-mode');
    state.theme = 'dark';
    elements.themeToggle.querySelector('i').setAttribute('data-lucide', 'sun');
  }
  lucide.createIcons();
  
  // Update charts options for colors if charts exist
  if (state.volumeChart || state.supplierChart) {
    refreshChartsColors();
  }
}

// Switch Screens/Tabs
function switchTab(tabName) {
  elements.tabBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  elements.screens.forEach(screen => {
    if (screen.id === `${tabName}Screen`) {
      screen.classList.add('active');
    } else {
      screen.classList.remove('active');
    }
  });

  state.currentTab = tabName;

  if (tabName === 'history') {
    fetchHistory();
  } else if (tabName === 'analytics') {
    fetchAnalytics();
  }
}

// Form Submit -> Call API
async function handleFormSubmit(e) {
  if (e) e.preventDefault();

  const admin = elements.adminNameInput.value.trim();
  const supplier = elements.supplierNameInput.value.trim();
  const inputs = elements.supplierInputs.value.trim();

  if (!admin || !supplier || !inputs) {
    showToast('Please fill out all required fields.', 'danger');
    return;
  }

  // Show loading state
  elements.outputPlaceholder.style.display = 'none';
  elements.outputContainer.style.display = 'none';
  elements.loadingContainer.style.display = 'flex';
  elements.submitBtn.disabled = true;
  elements.submitBtn.innerHTML = '<i class="spinner" style="width: 14px; height: 14px; border-width: 2px; display: inline-block;"></i> Generating...';

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin, supplier, inputs })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to generate summary.');
    }

    state.lastGeneratedId = data.id;
    state.lastGeneratedData = data;

    // Cache locally
    localStorage.setItem('last_gen_id', data.id);
    localStorage.setItem('last_gen_output', data.aiOutput);
    localStorage.setItem('last_gen_latency', data.responseTimeMs);

    displayAiOutput(data.aiOutput, data.responseTimeMs);
    showToast('AI analysis generated successfully!');

  } catch (error) {
    console.error('Submit error:', error);
    elements.outputPlaceholder.style.display = 'flex';
    elements.loadingContainer.style.display = 'none';
    showToast(error.message, 'danger');
  } finally {
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML = '<i data-lucide="sparkles" style="width: 16px; height: 16px;"></i> Generate AI Summary';
    lucide.createIcons();
  }
}

// Display AI response
function displayAiOutput(aiOutput, latencyMs) {
  elements.loadingContainer.style.display = 'none';
  elements.outputPlaceholder.style.display = 'none';
  elements.outputContainer.style.display = 'block';

  elements.outLatency.textContent = `${(latencyMs / 1000).toFixed(2)}s`;
  elements.outVersion.textContent = 'v4';
  
  // Render Markdown
  elements.reportMarkdown.innerHTML = renderMarkdown(aiOutput);
  
  // Reset star rating for new generations
  setStarRating(0);
  elements.feedbackComment.value = '';
}

// Regenerate AI completion with same variables
async function regenerateOutput() {
  const admin = elements.adminNameInput.value.trim();
  const supplier = elements.supplierNameInput.value.trim();
  const inputs = elements.supplierInputs.value.trim();

  if (!admin || !supplier || !inputs) {
    showToast('Required inputs are empty.', 'danger');
    return;
  }
  
  showToast('Regenerating report...');
  await handleFormSubmit();
}

// Render simple markdown tags to HTML
function renderMarkdown(mdText) {
  if (!mdText) return '';
  
  // Escape HTML tags to prevent XSS
  let text = mdText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Emojis mapping for sections if needed, otherwise rely on AI
  
  // Headers
  text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Bullet Lists
  // 1. Identify list items starting with * or -
  text = text.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>');
  
  // 2. Wrap consecutive lists in <ul>
  text = text.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  
  // 3. Merge adjacent <ul> blocks
  text = text.replace(/<\/ul>\s*<ul>/gim, '');

  // Line breaks to paragraphs
  const lines = text.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('</ul')) {
      return line;
    }
    return `<p>${line}</p>`;
  });

  return processedLines.join('\n');
}

// Set star rating UI selection
function setStarRating(rating) {
  state.selectedRating = rating;
  const stars = elements.starRating.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

// Submit feedback rating & comment
async function submitFeedback() {
  if (!state.lastGeneratedId) {
    showToast('No active generation to rate.', 'danger');
    return;
  }

  if (state.selectedRating === 0) {
    showToast('Please select a star rating (1-5) before submitting.', 'danger');
    return;
  }

  const comment = elements.feedbackComment.value.trim();
  elements.submitFeedbackBtn.disabled = true;
  elements.submitFeedbackBtn.textContent = 'Submitting...';

  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: state.lastGeneratedId,
        rating: state.selectedRating,
        comment: comment
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit feedback.');
    }

    showToast('Feedback submitted successfully. Thank you!');
    elements.feedbackComment.value = '';
    
  } catch (error) {
    console.error('Feedback error:', error);
    showToast(error.message, 'danger');
  } finally {
    elements.submitFeedbackBtn.disabled = false;
    elements.submitFeedbackBtn.textContent = 'Submit';
  }
}

// Copy Summary to Clipboard
function copyOutputToClipboard() {
  if (!state.lastGeneratedData) return;
  
  navigator.clipboard.writeText(state.lastGeneratedData.aiOutput)
    .then(() => showToast('Copied raw markdown to clipboard!'))
    .catch(() => showToast('Failed to copy text.', 'danger'));
}

// Download output as text file
function downloadOutputAsTxt() {
  if (!state.lastGeneratedData) return;
  
  const text = state.lastGeneratedData.aiOutput;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `Supply_Disruption_Summary_${state.lastGeneratedId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Text file download started!');
}

// Export Summary as PDF (Uses window.print styled dynamically)
function exportOutputAsPDF() {
  if (!state.lastGeneratedData) return;
  window.print();
}

// Fetch Log History
async function fetchHistory() {
  elements.historyList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);"><div class="spinner" style="width: 30px; height: 30px; margin: 0 auto 1rem;"></div>Loading history logs...</div>';

  try {
    const response = await fetch('/api/history');
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch log history.');
    }

    state.history = data.history;
    renderHistoryList(data.history);

  } catch (error) {
    console.error('Fetch history error:', error);
    elements.historyList.innerHTML = `<div style="text-align: center; color: var(--accent-danger); padding: 2rem;">Error: ${error.message}</div>`;
  }
}

// Render history list cards
function renderHistoryList(historyData) {
  if (historyData.length === 0) {
    elements.historyList.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-muted);"><i data-lucide="folder-open" style="width: 32px; height: 32px; margin-bottom: 0.5rem; opacity: 0.5;"></i><p>No disruption records found in the database.</p></div>';
    lucide.createIcons();
    return;
  }

  elements.historyList.innerHTML = '';
  
  historyData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-item';
    
    // Formatting date
    const date = new Date(item.created_at);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    // Formatting latency
    const latencySec = (item.response_time_ms / 1000).toFixed(1);
    
    // Display ratings if present
    const ratingStr = item.rating 
      ? `<span class="rating-badge">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</span>` 
      : '<span style="color: var(--text-muted); font-size:0.75rem;">No rating</span>';

    // Extract first 150 chars of output to preview
    const previewText = item.ai_output.replace(/[#\*`]/g, '').substring(0, 150) + '...';

    card.innerHTML = `
      <div class="history-item-header">
        <span class="supplier-badge">${item.supplier_name}</span>
        <span class="history-time">${dateStr}</span>
      </div>
      <div class="history-item-body">
        ${previewText}
      </div>
      <div class="history-item-footer">
        <div class="admin-tag">
          <i data-lucide="user" style="width: 12px; height: 12px;"></i>
          Admin: <span>${item.admin_name}</span>
        </div>
        <div>
          <span>Time: ${latencySec}s</span> | 
          ${ratingStr}
        </div>
      </div>
    `;

    card.addEventListener('click', () => showHistoryDetail(item));
    elements.historyList.appendChild(card);
  });
  
  lucide.createIcons();
}

// Filter history list based on search bar
function filterHistoryList() {
  const query = elements.historySearch.value.toLowerCase().trim();
  if (!query) {
    renderHistoryList(state.history);
    return;
  }

  const filtered = state.history.filter(item => {
    return (
      item.supplier_name.toLowerCase().includes(query) ||
      item.admin_name.toLowerCase().includes(query) ||
      item.ai_output.toLowerCase().includes(query) ||
      item.raw_input.toLowerCase().includes(query)
    );
  });

  renderHistoryList(filtered);
}

// Show History Detail Modal
function showHistoryDetail(item) {
  const date = new Date(item.created_at);
  const dateStr = date.toLocaleString();
  const latencySec = (item.response_time_ms / 1000).toFixed(2);

  elements.modalSupplier.textContent = item.supplier_name;
  elements.modalAdmin.textContent = item.admin_name;
  elements.modalDate.textContent = dateStr;
  elements.modalLatency.textContent = `${latencySec} seconds`;
  elements.modalRawInput.textContent = item.raw_input;
  elements.modalAiOutput.innerHTML = renderMarkdown(item.ai_output);
  
  let feedbackHtml = '';
  if (item.rating) {
    feedbackHtml = `
      <div style="background: rgba(245,158,11,0.05); padding: 0.75rem; border-radius: 6px; border: 1px solid rgba(245,158,11,0.2); display: flex; flex-direction: column; gap: 0.25rem;">
        <div><strong>User Rating:</strong> <span style="color: var(--accent-warning);">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</span> (${item.rating}/5)</div>
        ${item.feedback_comment ? `<div><strong>Admin Comment:</strong> <span style="color: var(--text-main); font-style: italic;">"${item.feedback_comment}"</span></div>` : ''}
      </div>
    `;
  } else {
    feedbackHtml = `<span style="color: var(--text-muted);">No feedback logged for this summary.</span>`;
  }
  elements.modalFeedbackInfo.innerHTML = feedbackHtml;

  elements.detailModal.classList.add('active');
}

function hideModal() {
  elements.detailModal.classList.remove('active');
}

// Fetch Analytics logs & Draw charts
async function fetchAnalytics() {
  elements.statTotal.textContent = '...';
  elements.statRating.textContent = '...';
  elements.statLatency.textContent = '...';
  elements.statCoverage.textContent = '...';

  try {
    const response = await fetch('/api/analytics');
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch analytics metrics.');
    }

    state.analyticsData = data;
    renderAnalytics(data);

  } catch (error) {
    console.error('Analytics fetch error:', error);
    showToast('Could not load analytics metrics: ' + error.message, 'danger');
  }
}

// Render Analytics numbers and initialize charts
function renderAnalytics(data) {
  const summary = data.summary;
  elements.statTotal.textContent = summary.totalGenerations;
  elements.statRating.textContent = summary.totalGenerations > 0 && summary.averageRating > 0 
    ? `${summary.averageRating} / 5` 
    : 'N/A';
  elements.statLatency.textContent = summary.totalGenerations > 0 
    ? `${(summary.averageResponseTimeMs / 1000).toFixed(2)}s` 
    : 'N/A';

  const coveragePct = summary.totalGenerations > 0 
    ? Math.round((summary.ratedCount / summary.totalGenerations) * 100) 
    : 0;
  elements.statCoverage.textContent = `${coveragePct}%`;

  // Draw Charts
  drawCharts(data.raw);
}

// Group data by day and draw Chart.js charts
function drawCharts(rawData) {
  const isLight = document.body.classList.contains('light-mode');
  const textColor = isLight ? '#0f172a' : '#9ca3af';
  const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
  const primaryColor = '#6366f1';
  const secondaryColor = '#06b6d4';

  // 1. Group Volume by Date (last 7 days containing records)
  const volumeMap = {};
  rawData.forEach(item => {
    const date = new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    volumeMap[date] = (volumeMap[date] || 0) + 1;
  });

  // Sort dates chronologically (using raw created_at is better but for simple charting we sort by key)
  const dates = Object.keys(volumeMap).reverse().slice(-7); // get last 7 active dates
  const counts = dates.map(d => volumeMap[d]);

  // If no data, show empty labels
  const finalDates = dates.length > 0 ? dates : ['No Data'];
  const finalCounts = counts.length > 0 ? counts : [0];

  // Destroy previous Volume Chart
  if (state.volumeChart) state.volumeChart.destroy();

  const ctxVolume = document.getElementById('volumeChart').getContext('2d');
  state.volumeChart = new Chart(ctxVolume, {
    type: 'line',
    data: {
      labels: finalDates,
      datasets: [{
        label: 'Disruption Summaries Generated',
        data: finalCounts,
        borderColor: primaryColor,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: secondaryColor
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Inter' } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, stepSize: 1, precision: 0 },
          beginAtZero: true
        }
      }
    }
  });

  // 2. Group Alerts by Supplier
  const supplierMap = {};
  rawData.forEach(item => {
    const name = item.supplier_name;
    supplierMap[name] = (supplierMap[name] || 0) + 1;
  });

  const suppliers = Object.keys(supplierMap);
  // Sort by count descending and take top 5
  suppliers.sort((a, b) => supplierMap[b] - supplierMap[a]);
  const topSuppliers = suppliers.slice(0, 5);
  const supplierCounts = topSuppliers.map(s => supplierMap[s]);

  const finalSuppliers = topSuppliers.length > 0 ? topSuppliers : ['No Data'];
  const finalSupplierCounts = supplierCounts.length > 0 ? supplierCounts : [0];

  // Destroy previous Supplier Chart
  if (state.supplierChart) state.supplierChart.destroy();

  const ctxSupplier = document.getElementById('supplierChart').getContext('2d');
  state.supplierChart = new Chart(ctxSupplier, {
    type: 'bar',
    data: {
      labels: finalSuppliers.map(s => s.length > 15 ? s.substring(0, 15) + '..' : s),
      datasets: [{
        label: 'Disruptions',
        data: finalSupplierCounts,
        backgroundColor: [
          'rgba(99, 102, 241, 0.75)',
          'rgba(6, 182, 212, 0.75)',
          'rgba(16, 185, 129, 0.75)',
          'rgba(245, 158, 11, 0.75)',
          'rgba(239, 68, 68, 0.75)'
        ],
        borderRadius: 6,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // horizontal bar chart
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, stepSize: 1, precision: 0 },
          beginAtZero: true
        },
        y: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'Inter' } }
        }
      }
    }
  });
}

// Update chart option colors on theme switch
function refreshChartsColors() {
  if (!state.analyticsData) return;
  drawCharts(state.analyticsData.raw);
}

// Toast notification helper
let toastTimeout;
function showToast(message, type = 'success') {
  clearTimeout(toastTimeout);
  
  elements.toastMessage.textContent = message;
  elements.toast.className = 'toast'; // reset classes
  
  if (type === 'danger') {
    elements.toast.classList.add('danger');
    elements.toast.querySelector('i').setAttribute('data-lucide', 'alert-circle');
  } else {
    elements.toast.querySelector('i').setAttribute('data-lucide', 'check-circle');
  }
  
  lucide.createIcons();
  elements.toast.classList.add('active');

  toastTimeout = setTimeout(() => {
    elements.toast.classList.remove('active');
  }, 3000);
}
