/**
 * tranz-video - Options Page Script
 * Manages configuration persistence, preset selection, and connection diagnostics.
 */

import { DEFAULT_CONFIG } from './background.js';

const form = document.getElementById('tzv-options-form');
const endpointInput = document.getElementById('endpoint');
const modelInput = document.getElementById('model');
const apiKeyInput = document.getElementById('apiKey');
const temperatureInput = document.getElementById('temperature');
const targetLanguageSelect = document.getElementById('targetLanguage');
const systemPromptInput = document.getElementById('systemPrompt');
const userPromptTemplateInput = document.getElementById('userPromptTemplate');
const extensionEnabledCheckbox = document.getElementById('extensionEnabled');
const autoPauseCheckbox = document.getElementById('autoPause');

const btnTestConnection = document.getElementById('btn-test-connection');
const testStatusSpan = document.getElementById('test-connection-status');
const btnResetDefaults = document.getElementById('btn-reset-defaults');
const saveStatusMsg = document.getElementById('save-status-msg');

/**
 * Loads and populates options form from storage
 */
async function loadStoredOptions() {
  try {
    const stored = await chrome.storage.local.get(null);
    const config = { ...DEFAULT_CONFIG, ...stored };

    endpointInput.value = config.endpoint || DEFAULT_CONFIG.endpoint;
    modelInput.value = config.model || DEFAULT_CONFIG.model;
    apiKeyInput.value = config.apiKey || '';
    temperatureInput.value = typeof config.temperature === 'number' ? config.temperature : DEFAULT_CONFIG.temperature;

    if (config.targetLanguage) {
      targetLanguageSelect.value = config.targetLanguage;
    }

    const modeRadio = form.querySelector(`input[name="learningMode"][value="${config.learningMode || 'bilingual'}"]`);
    if (modeRadio) {
      modeRadio.checked = true;
    }

    systemPromptInput.value = config.systemPrompt || DEFAULT_CONFIG.systemPrompt;
    userPromptTemplateInput.value = config.userPromptTemplate || DEFAULT_CONFIG.userPromptTemplate;
    extensionEnabledCheckbox.checked = config.extensionEnabled !== false;
    autoPauseCheckbox.checked = config.autoPause !== false;
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

  const updatedConfig = {
    endpoint: endpointInput.value.trim() || DEFAULT_CONFIG.endpoint,
    model: modelInput.value.trim() || DEFAULT_CONFIG.model,
    apiKey: apiKeyInput.value.trim(),
    temperature: parseFloat(temperatureInput.value) || DEFAULT_CONFIG.temperature,
    targetLanguage: targetLanguageSelect.value,
    learningMode: selectedMode,
    systemPrompt: systemPromptInput.value.trim() || DEFAULT_CONFIG.systemPrompt,
    userPromptTemplate: userPromptTemplateInput.value.trim() || DEFAULT_CONFIG.userPromptTemplate,
    extensionEnabled: extensionEnabledCheckbox.checked,
    autoPause: autoPauseCheckbox.checked
  };

  try {
    await chrome.storage.local.set(updatedConfig);
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

// Event Listeners
form.addEventListener('submit', handleSaveOptions);
btnTestConnection.addEventListener('click', handleTestConnection);
btnResetDefaults.addEventListener('click', handleResetDefaults);

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadStoredOptions);
