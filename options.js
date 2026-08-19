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

// Tab 1: AI Service Inputs
const endpointInput = document.getElementById('endpoint');
const modelInput = document.getElementById('model');
const apiKeyInput = document.getElementById('apiKey');
const temperatureInput = document.getElementById('temperature');
const btnTestConnection = document.getElementById('btn-test-connection');
const testStatusSpan = document.getElementById('test-connection-status');

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
    previewWindow.style.setProperty('--tzv-target-size', `${targetFontSizeInput.value}px`);
    previewWindow.style.setProperty('--tzv-target-color', targetColorInput.value);

    // Apply directly with important priority to override any CSS specificity
    const allSources = previewWindow.querySelectorAll('.tzv-pair-source');
    allSources.forEach((el) => {
      el.style.setProperty('font-size', `${sourceFontSizeInput.value}px`, 'important');
      el.style.setProperty('color', sourceColorInput.value, 'important');
    });

    const allTargets = previewWindow.querySelectorAll('.tzv-pair-target');
    allTargets.forEach((el) => {
      el.style.setProperty('font-size', `${targetFontSizeInput.value}px`, 'important');
      el.style.setProperty('color', targetColorInput.value, 'important');
    });
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

    // Tab 1: AI Service
    endpointInput.value = config.endpoint || DEFAULT_CONFIG.endpoint;
    modelInput.value = config.model || DEFAULT_CONFIG.model;
    apiKeyInput.value = config.apiKey || '';
    temperatureInput.value = typeof config.temperature === 'number' ? config.temperature : DEFAULT_CONFIG.temperature;

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

  const selectedMode = form.querySelector('input[name="learningMode"]:checked')?.value || 'bilingual';
  const selectedEffect = form.querySelector('input[name="hudEffect"]:checked')?.value || 'translucent';

  const updatedConfig = {
    endpoint: endpointInput.value.trim() || DEFAULT_CONFIG.endpoint,
    model: modelInput.value.trim() || DEFAULT_CONFIG.model,
    apiKey: apiKeyInput.value.trim(),
    temperature: parseFloat(temperatureInput.value) || DEFAULT_CONFIG.temperature,
    targetLanguage: targetLanguageSelect.value,
    learningMode: selectedMode,
    hudTheme: {
      hudEffect: selectedEffect,
      hudBgColor: hudBgColorInput.value,
      hudOpacity: parseInt(hudOpacityInput.value, 10),
      sourceFontSize: parseInt(sourceFontSizeInput.value, 10),
      sourceColor: sourceColorInput.value,
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
  targetFontSizeInput,
  targetColorInput
].forEach((input) => {
  input.addEventListener('input', updateLivePreview);
  input.addEventListener('change', updateLivePreview);
});

form.querySelectorAll('input[name="hudEffect"]').forEach((radio) => {
  radio.addEventListener('change', updateLivePreview);
});

// Event Listeners
form.addEventListener('submit', handleSaveOptions);
btnTestConnection.addEventListener('click', handleTestConnection);
btnResetDefaults.addEventListener('click', handleResetDefaults);

// Initialize
initTabs();
document.addEventListener('DOMContentLoaded', loadStoredOptions);
