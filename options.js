/**
 * tranz-video - Options Page Script
 * Manages tabbed configuration persistence, real-time live preview theme engine,
 * and endpoint connectivity diagnostics.
 */

import { DEFAULT_CONFIG } from './background.js';

// Elements
const form = document.getElementById('tzv-options-form');
const tabButtons = document.querySelectorAll('.tzv-tab-btn');
const tabPanes = document.querySelectorAll('.tzv-tab-pane');

// Tab 1: AI Service Inputs & Profile Manager
const endpointsGrid = document.getElementById('endpoints-grid');
const btnAddEndpoint = document.getElementById('btn-add-endpoint');
const btnActivateSelected = document.getElementById('btn-activate-selected');
const btnDeleteEndpoint = document.getElementById('btn-delete-endpoint');
const editorSectionTitle = document.getElementById('editor-section-title');

const endpointNameInput = document.getElementById('endpointName');
const endpointInput = document.getElementById('endpoint');
const modelInput = document.getElementById('model');
const apiKeyInput = document.getElementById('apiKey');
const temperatureInput = document.getElementById('temperature');
const btnTestConnection = document.getElementById('btn-test-connection');
const testStatusSpan = document.getElementById('test-connection-status');

// Local multi-endpoint state
let endpointsList = [];
let activeEndpointId = 'ep-local';
let editingEndpointId = 'ep-local';

// Tab 2: Appearance Inputs & Preview
const previewWindow = document.getElementById('tzv-preview-window');

const hudBgColorInput = document.getElementById('hudBgColor');
const hudBgColorHex = document.getElementById('hudBgColor-hex');
const hudOpacityInput = document.getElementById('hudOpacity');
const hudOpacityVal = document.getElementById('hudOpacity-val');

const sourceFontSizeInput = document.getElementById('sourceFontSize');
const sourceFontSizeVal = document.getElementById('sourceFontSize-val');
const sourceColorInput = document.getElementById('sourceColor');
const sourceColorHex = document.getElementById('sourceColor-hex');

const furiganaFontSizeInput = document.getElementById('furiganaFontSize');
const furiganaFontSizeVal = document.getElementById('furiganaFontSize-val');
const furiganaColorInput = document.getElementById('furiganaColor');
const furiganaColorHex = document.getElementById('furiganaColor-hex');

const targetFontSizeInput = document.getElementById('targetFontSize');
const targetFontSizeVal = document.getElementById('targetFontSize-val');
const targetColorInput = document.getElementById('targetColor');
const targetColorHex = document.getElementById('targetColor-hex');

// Tab 3: Translation Inputs
const targetLanguageSelect = document.getElementById('targetLanguage');
const systemPromptInput = document.getElementById('systemPrompt');
const userPromptTemplateInput = document.getElementById('userPromptTemplate');

// Actions
const btnResetDefaults = document.getElementById('btn-reset-defaults');
const saveStatusMsg = document.getElementById('save-status-msg');

/**
 * Converts a 3-hex or 6-hex color code to RGB components
 */
function hexToRgb(hex) {
  if (!hex) return { r: 10, g: 14, b: 22 };
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 10, g: 14, b: 22 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Updates the in-page live interactive preview with the current theme settings
 */
function updateLivePreview() {
  const hex = hudBgColorInput.value || '#0a0e16';
  const opacity = parseInt(hudOpacityInput.value, 10) / 100;
  const rgb = hexToRgb(hex);

  // Update text badges
  hudBgColorHex.innerText = hex.toUpperCase();
  hudOpacityVal.innerText = `${hudOpacityInput.value}%`;
  sourceFontSizeVal.innerText = `${sourceFontSizeInput.value}px`;
  sourceColorHex.innerText = sourceColorInput.value.toUpperCase();
  furiganaFontSizeVal.innerText = `${furiganaFontSizeInput.value}px`;
  furiganaColorHex.innerText = furiganaColorInput.value.toUpperCase();
  targetFontSizeVal.innerText = `${targetFontSizeInput.value}px`;
  targetColorHex.innerText = targetColorInput.value.toUpperCase();

  // Read selected effect
  const selectedEffect = form.querySelector('input[name="hudEffect"]:checked')?.value || 'translucent';

  let bgValue = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  let backdropFilter = 'none';

  if (selectedEffect === 'glassmorphism') {
    backdropFilter = 'blur(12px) saturate(180%)';
    bgValue = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(0.80, Number((opacity * 0.85).toFixed(2)))})`;
  } else if (selectedEffect === 'opaque') {
    bgValue = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    backdropFilter = 'none';
  } else if (selectedEffect === 'transparent_glow') {
    bgValue = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
    backdropFilter = 'none';
  }

  if (previewWindow) {
    previewWindow.style.background = bgValue;
    previewWindow.style.backdropFilter = backdropFilter;
    previewWindow.style.webkitBackdropFilter = backdropFilter;

    // Set CSS custom properties on preview window container
    previewWindow.style.setProperty('--tzv-source-size', `${sourceFontSizeInput.value}px`);
    previewWindow.style.setProperty('--tzv-source-color', sourceColorInput.value);
    previewWindow.style.setProperty('--tzv-furigana-size', `${furiganaFontSizeInput.value}px`);
    previewWindow.style.setProperty('--tzv-furigana-color', furiganaColorInput.value);
    previewWindow.style.setProperty('--tzv-target-size', `${targetFontSizeInput.value}px`);
    previewWindow.style.setProperty('--tzv-target-color', targetColorInput.value);

    // Apply directly with important priority to override any CSS specificity
    const allSources = previewWindow.querySelectorAll('.tzv-pair-source');
    allSources.forEach((el) => {
      el.style.setProperty('font-size', `${sourceFontSizeInput.value}px`, 'important');
      el.style.setProperty('color', sourceColorInput.value, 'important');
    });

    const allPhonetics = previewWindow.querySelectorAll('.tzv-pair-phonetic');
    allPhonetics.forEach((el) => {
      el.style.setProperty('font-size', `${furiganaFontSizeInput.value}px`, 'important');
      el.style.setProperty('color', furiganaColorInput.value, 'important');
    });

    const allTargets = previewWindow.querySelectorAll('.tzv-pair-target');
    allTargets.forEach((el) => {
      el.style.setProperty('font-size', `${targetFontSizeInput.value}px`, 'important');
      el.style.setProperty('color', targetColorInput.value, 'important');
    });

    // Update preview based on selected learning mode
    const selectedMode = form.querySelector('input[name="learningMode"]:checked')?.value || 'bilingual';
    const phoEl = document.getElementById('preview-phonetic-line');
    const vocabEl = document.getElementById('preview-vocab-card');
    const srcEl = document.getElementById('preview-source-line');
    const srcEl2 = document.getElementById('preview-source-line-2');

    if (phoEl) {
      phoEl.style.display = selectedMode === 'furigana' ? 'block' : 'none';
    }
    if (vocabEl) {
      vocabEl.style.display = selectedMode === 'vocabulary' ? 'block' : 'none';
    }
    if (srcEl) {
      srcEl.style.display = selectedMode === 'target_only' ? 'none' : 'block';
    }
    if (srcEl2) {
      srcEl2.style.display = selectedMode === 'target_only' ? 'none' : 'block';
    }
  }
}

/**
 * Initializes Tab navigation listeners
 */
function initTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabKey = btn.getAttribute('data-tab');

      tabButtons.forEach((b) => b.classList.remove('tzv-tab-active'));
      tabPanes.forEach((p) => p.classList.remove('tzv-tab-active'));

      btn.classList.add('tzv-tab-active');
      const activePane = document.getElementById(`tab-pane-${tabKey}`);
      if (activePane) {
        activePane.classList.add('tzv-tab-active');
      }
    });
  });
}

/**
 * Safely escapes HTML strings for DOM rendering
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Saves current form inputs into the currently active editing profile in state
 */
function saveCurrentEditingEndpointToState() {
  const current = endpointsList.find((e) => e.id === editingEndpointId);
  if (current) {
    current.name = endpointNameInput.value.trim() || 'Untitled Endpoint';
    current.endpoint = endpointInput.value.trim();
    current.model = modelInput.value.trim();
    current.apiKey = apiKeyInput.value.trim();
    current.temperature = parseFloat(temperatureInput.value) || 0.2;
  }
}

/**
 * Populates the Tab 1 editor form with a selected profile
 */
function populateEditorForm(profile) {
  if (!profile) return;
  endpointNameInput.value = profile.name || '';
  endpointInput.value = profile.endpoint || '';
  modelInput.value = profile.model || '';
  apiKeyInput.value = profile.apiKey || '';
  temperatureInput.value = typeof profile.temperature === 'number' ? profile.temperature : 0.2;

  editorSectionTitle.innerText = `Edit: ${profile.name || 'Endpoint Profile'}`;

  // Toggle Activate and Delete buttons
  if (profile.id === activeEndpointId) {
    btnActivateSelected.style.display = 'none';
  } else {
    btnActivateSelected.style.display = 'inline-block';
  }

  if (endpointsList.length > 1) {
    btnDeleteEndpoint.style.display = 'inline-block';
  } else {
    btnDeleteEndpoint.style.display = 'none';
  }

  testStatusSpan.innerText = '';
}

/**
 * Renders the endpoint profiles list as interactive cards
 */
function renderEndpointsGrid() {
  if (!endpointsGrid) return;
  endpointsGrid.innerHTML = '';

  endpointsList.forEach((profile) => {
    const card = document.createElement('div');
    card.className = 'tzv-endpoint-card';
    if (profile.id === editingEndpointId) card.classList.add('tzv-editing');
    if (profile.id === activeEndpointId) card.classList.add('tzv-active');

    card.innerHTML = `
      <div class="tzv-endpoint-top">
        <span class="tzv-endpoint-name" title="${escapeHtml(profile.name)}">${escapeHtml(profile.name)}</span>
        ${profile.id === activeEndpointId ? '<span class="tzv-endpoint-badge-active">● Active</span>' : ''}
      </div>
      <div class="tzv-endpoint-model" title="${escapeHtml(profile.model)}">${escapeHtml(profile.model || 'model unset')}</div>
      <div class="tzv-endpoint-url" title="${escapeHtml(profile.endpoint)}">${escapeHtml(profile.endpoint || 'url unset')}</div>
    `;

    card.addEventListener('click', () => {
      if (editingEndpointId !== profile.id) {
        saveCurrentEditingEndpointToState();
        editingEndpointId = profile.id;
        populateEditorForm(profile);
        renderEndpointsGrid();
      }
    });

    endpointsGrid.appendChild(card);
  });
}

/**
 * Adds a new endpoint profile and selects it for editing
 */
function handleAddEndpoint() {
  saveCurrentEditingEndpointToState();

  const newId = `ep-${Date.now()}`;
  const newProfile = {
    id: newId,
    name: `Custom Endpoint ${endpointsList.length + 1}`,
    endpoint: 'http://127.0.0.1:11434/v1',
    model: 'qwen2.5-vl',
    apiKey: '',
    temperature: 0.2
  };

  endpointsList.push(newProfile);
  editingEndpointId = newId;
  populateEditorForm(newProfile);
  renderEndpointsGrid();
  endpointNameInput.focus();
}

/**
 * Deletes the currently selected endpoint profile
 */
function handleDeleteEndpoint() {
  if (endpointsList.length <= 1) {
    alert('At least one AI endpoint profile must be maintained.');
    return;
  }

  const profileToDelete = endpointsList.find((e) => e.id === editingEndpointId);
  const name = profileToDelete?.name || 'this endpoint';
  if (!confirm(`Are you sure you want to delete "${name}"?`)) {
    return;
  }

  endpointsList = endpointsList.filter((e) => e.id !== editingEndpointId);
  if (activeEndpointId === editingEndpointId) {
    activeEndpointId = endpointsList[0].id;
  }
  editingEndpointId = endpointsList[0].id;
  populateEditorForm(endpointsList[0]);
  renderEndpointsGrid();
}

/**
 * Activates the currently edited profile
 */
function handleActivateSelected() {
  saveCurrentEditingEndpointToState();
  activeEndpointId = editingEndpointId;
  populateEditorForm(endpointsList.find((e) => e.id === editingEndpointId));
  renderEndpointsGrid();
}

/**
 * Loads and populates options form from storage
 */
async function loadStoredOptions() {
  try {
    const stored = await chrome.storage.local.get(null);
    const config = {
      ...DEFAULT_CONFIG,
      ...stored,
      hudTheme: {
        ...DEFAULT_CONFIG.hudTheme,
        ...(stored.hudTheme || {})
      }
    };

    // Tab 1: AI Service Profiles
    let loadedEndpoints = config.endpoints;
    if (!Array.isArray(loadedEndpoints) || loadedEndpoints.length === 0) {
      loadedEndpoints = DEFAULT_CONFIG.endpoints;
    }
    endpointsList = JSON.parse(JSON.stringify(loadedEndpoints));
    activeEndpointId = config.activeEndpointId || endpointsList[0]?.id || 'ep-local';
    editingEndpointId = activeEndpointId;

    const currentProfile = endpointsList.find((e) => e.id === editingEndpointId) || endpointsList[0];
    populateEditorForm(currentProfile);
    renderEndpointsGrid();

    // Tab 2: Appearance & Theme
    const theme = config.hudTheme || DEFAULT_CONFIG.hudTheme;
    const effectRadio = form.querySelector(`input[name="hudEffect"][value="${theme.hudEffect || 'translucent'}"]`);
    if (effectRadio) {
      effectRadio.checked = true;
    }

    hudBgColorInput.value = theme.hudBgColor || DEFAULT_CONFIG.hudTheme.hudBgColor;
    hudOpacityInput.value = theme.hudOpacity !== undefined ? theme.hudOpacity : DEFAULT_CONFIG.hudTheme.hudOpacity;

    sourceFontSizeInput.value = theme.sourceFontSize || DEFAULT_CONFIG.hudTheme.sourceFontSize;
    sourceColorInput.value = theme.sourceColor || DEFAULT_CONFIG.hudTheme.sourceColor;

    furiganaFontSizeInput.value = theme.furiganaFontSize || DEFAULT_CONFIG.hudTheme.furiganaFontSize;
    furiganaColorInput.value = theme.furiganaColor || DEFAULT_CONFIG.hudTheme.furiganaColor;

    targetFontSizeInput.value = theme.targetFontSize || DEFAULT_CONFIG.hudTheme.targetFontSize;
    targetColorInput.value = theme.targetColor || DEFAULT_CONFIG.hudTheme.targetColor;

    // Tab 3: Translation
    if (config.targetLanguage) {
      targetLanguageSelect.value = config.targetLanguage;
    }

    const modeRadio = form.querySelector(`input[name="learningMode"][value="${config.learningMode || 'bilingual'}"]`);
    if (modeRadio) {
      modeRadio.checked = true;
    }

    systemPromptInput.value = config.systemPrompt || DEFAULT_CONFIG.systemPrompt;
    userPromptTemplateInput.value = config.userPromptTemplate || DEFAULT_CONFIG.userPromptTemplate;

    updateLivePreview();
  } catch (err) {
    console.error('[tranz-video] Failed to load options:', err);
  }
}

/**
 * Saves options form values to chrome.storage.local
 */
async function handleSaveOptions(e) {
  e.preventDefault();

  saveCurrentEditingEndpointToState();

  const selectedMode = form.querySelector('input[name="learningMode"]:checked')?.value || 'bilingual';
  const selectedEffect = form.querySelector('input[name="hudEffect"]:checked')?.value || 'translucent';
  const activeProfile = endpointsList.find((e) => e.id === activeEndpointId) || endpointsList[0];

  const updatedConfig = {
    endpoints: endpointsList,
    activeEndpointId: activeEndpointId,
    // Active resolved credentials for fallback compatibility
    endpoint: activeProfile?.endpoint || DEFAULT_CONFIG.endpoint,
    model: activeProfile?.model || DEFAULT_CONFIG.model,
    apiKey: activeProfile?.apiKey || '',
    temperature: typeof activeProfile?.temperature === 'number' ? activeProfile.temperature : DEFAULT_CONFIG.temperature,
    targetLanguage: targetLanguageSelect.value,
    learningMode: selectedMode,
    hudTheme: {
      hudEffect: selectedEffect,
      hudBgColor: hudBgColorInput.value,
      hudOpacity: parseInt(hudOpacityInput.value, 10),
      sourceFontSize: parseInt(sourceFontSizeInput.value, 10),
      sourceColor: sourceColorInput.value,
      furiganaFontSize: parseInt(furiganaFontSizeInput.value, 10),
      furiganaColor: furiganaColorInput.value,
      targetFontSize: parseInt(targetFontSizeInput.value, 10),
      targetColor: targetColorInput.value
    },
    systemPrompt: systemPromptInput.value.trim() || DEFAULT_CONFIG.systemPrompt,
    userPromptTemplate: userPromptTemplateInput.value.trim() || DEFAULT_CONFIG.userPromptTemplate
  };

  try {
    await chrome.storage.local.set(updatedConfig);
    saveStatusMsg.innerText = '✓ Settings saved successfully!';
    saveStatusMsg.classList.add('tzv-show');
    renderEndpointsGrid();
    setTimeout(() => {
      saveStatusMsg.classList.remove('tzv-show');
    }, 2500);
  } catch (err) {
    alert(`Failed to save settings: ${err.message}`);
  }
}

/**
 * Tests live connection to the configured OpenAI-compatible endpoint
 */
async function handleTestConnection() {
  testStatusSpan.style.color = '#94a3b8';
  testStatusSpan.innerText = 'Pinging endpoint...';

  const testConfig = {
    endpoint: endpointInput.value.trim() || DEFAULT_CONFIG.endpoint,
    model: modelInput.value.trim() || DEFAULT_CONFIG.model,
    apiKey: apiKeyInput.value.trim()
  };

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TEST_CONNECTION',
      config: testConfig
    });

    if (response?.success) {
      testStatusSpan.style.color = '#10b981';
      testStatusSpan.innerText = `✓ Connected (HTTP ${response.status}, Latency: ${response.latency}ms)`;
    } else {
      testStatusSpan.style.color = '#ef4444';
      testStatusSpan.innerText = `❌ Error: ${response?.error || 'Connection failed'}`;
    }
  } catch (err) {
    testStatusSpan.style.color = '#ef4444';
    testStatusSpan.innerText = `❌ Request failed: ${err.message}`;
  }
}

/**
 * Resets all settings to factory defaults
 */
async function handleResetDefaults() {
  if (!confirm('Are you sure you want to reset all configuration settings to factory defaults?')) {
    return;
  }

  try {
    await chrome.storage.local.set(DEFAULT_CONFIG);
    await loadStoredOptions();
    saveStatusMsg.innerText = '✓ Restored to defaults!';
    saveStatusMsg.classList.add('tzv-show');
    setTimeout(() => {
      saveStatusMsg.innerText = '✓ Settings saved successfully!';
      saveStatusMsg.classList.remove('tzv-show');
    }, 2500);
  } catch (err) {
    alert(`Failed to reset defaults: ${err.message}`);
  }
}

// Live interactive theme binding
[
  hudBgColorInput,
  hudOpacityInput,
  sourceFontSizeInput,
  sourceColorInput,
  furiganaFontSizeInput,
  furiganaColorInput,
  targetFontSizeInput,
  targetColorInput
].forEach((input) => {
  input.addEventListener('input', updateLivePreview);
  input.addEventListener('change', updateLivePreview);
});

// Live endpoint card label synchronization
[endpointNameInput, modelInput, endpointInput].forEach((input) => {
  input.addEventListener('input', () => {
    const current = endpointsList.find((e) => e.id === editingEndpointId);
    if (current) {
      current.name = endpointNameInput.value.trim() || 'Untitled';
      current.endpoint = endpointInput.value.trim();
      current.model = modelInput.value.trim();
      editorSectionTitle.innerText = `Edit: ${current.name}`;
      renderEndpointsGrid();
    }
  });
});

form.querySelectorAll('input[name="hudEffect"], input[name="learningMode"]').forEach((radio) => {
  radio.addEventListener('change', updateLivePreview);
});

// Event Listeners
form.addEventListener('submit', handleSaveOptions);
btnAddEndpoint.addEventListener('click', handleAddEndpoint);
btnActivateSelected.addEventListener('click', handleActivateSelected);
btnDeleteEndpoint.addEventListener('click', handleDeleteEndpoint);
btnTestConnection.addEventListener('click', handleTestConnection);
btnResetDefaults.addEventListener('click', handleResetDefaults);

// Initialize
initTabs();
document.addEventListener('DOMContentLoaded', loadStoredOptions);

