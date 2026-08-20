/**
 * Tranz Video - Popup Action Menu Controller
 * Handles Master Enable/Disable toggle, quick target language switching,
 * and navigation to the full settings dashboard.
 */

import type { AppConfig, LearningMode } from './types/config';

document.addEventListener('DOMContentLoaded', async () => {
  const enableToggle = document.getElementById('enable-toggle') as HTMLInputElement | null;
  const statusSubtext = document.getElementById('status-subtext') as HTMLElement | null;
  const endpointSelect = document.getElementById('endpoint-select') as HTMLSelectElement | null;
  const targetLangSelect = document.getElementById('target-lang-select') as HTMLSelectElement | null;
  const learningModeSelect = document.getElementById('learning-mode-select') as HTMLSelectElement | null;
  const openOptionsBtn = document.getElementById('btn-open-options') as HTMLButtonElement | null;

  const versionBadge = document.querySelector('.popup-version') as HTMLElement | null;
  if (versionBadge && chrome.runtime?.getManifest) {
    versionBadge.innerText = `v${chrome.runtime.getManifest().version}`;
  }

  function updateStatusText(isEnabled: boolean): void {
    if (statusSubtext) {
      statusSubtext.innerText = isEnabled ? 'Active on web videos' : 'Disabled (Window hidden)';
      statusSubtext.style.color = isEnabled ? 'var(--tzv-text-muted)' : 'var(--tzv-danger)';
    }
  }

  // 1. Load active configuration from storage
  try {
    if (chrome.runtime?.id) {
      const config = (await chrome.storage.local.get([
        'extensionEnabled',
        'targetLanguage',
        'learningMode',
        'endpoints',
        'activeEndpointId'
      ])) as Partial<AppConfig>;

      const isEnabled = config.extensionEnabled !== false; // Default true
      if (enableToggle) {
        enableToggle.checked = isEnabled;
      }
      updateStatusText(isEnabled);

      // Populate endpoints dropdown
      if (endpointSelect && Array.isArray(config.endpoints) && config.endpoints.length > 0) {
        endpointSelect.innerHTML = '';
        config.endpoints.forEach((ep) => {
          const opt = document.createElement('option');
          opt.value = ep.id;
          opt.textContent = ep.name || ep.model || ep.endpoint;
          endpointSelect.appendChild(opt);
        });
        if (config.activeEndpointId) {
          endpointSelect.value = config.activeEndpointId;
        }
      }

      if (config.targetLanguage && targetLangSelect) {
        targetLangSelect.value = config.targetLanguage;
      }
      if (config.learningMode && learningModeSelect) {
        learningModeSelect.value = config.learningMode;
      }
    }
  } catch (err) {
    console.warn('[Tranz Video] Failed to load popup state:', err);
  }

  // 2. Handle Master Enable / Disable Toggle
  if (enableToggle) {
    enableToggle.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      const isEnabled = target.checked;
      updateStatusText(isEnabled);
      try {
        if (chrome.runtime?.id) {
          await chrome.storage.local.set({ extensionEnabled: isEnabled });
        }
      } catch (err) {
        console.error('[Tranz Video] Failed to save enabled state:', err);
      }
    });
  }

  // 3. Handle Active AI Provider Quick Switch
  if (endpointSelect) {
    endpointSelect.addEventListener('change', async (e) => {
      const target = e.target as HTMLSelectElement;
      const newEndpointId = target.value;
      try {
        if (chrome.runtime?.id) {
          await chrome.storage.local.set({ activeEndpointId: newEndpointId });
        }
      } catch (err) {
        console.error('[Tranz Video] Failed to save active endpoint:', err);
      }
    });
  }

  // 4. Handle Target Language Quick Switch
  if (targetLangSelect) {
    targetLangSelect.addEventListener('change', async (e) => {
      const target = e.target as HTMLSelectElement;
      const newLang = target.value;
      try {
        if (chrome.runtime?.id) {
          await chrome.storage.local.set({ targetLanguage: newLang });
        }
      } catch (err) {
        console.error('[Tranz Video] Failed to save target language:', err);
      }
    });
  }

  // 5. Handle Learning Mode Quick Switch
  if (learningModeSelect) {
    learningModeSelect.addEventListener('change', async (e) => {
      const target = e.target as HTMLSelectElement;
      const newMode = target.value as LearningMode;
      try {
        if (chrome.runtime?.id) {
          await chrome.storage.local.set({ learningMode: newMode });
        }
      } catch (err) {
        console.error('[Tranz Video] Failed to save learning mode:', err);
      }
    });
  }

  // 6. Handle Open Settings Dashboard
  if (openOptionsBtn) {
    openOptionsBtn.addEventListener('click', () => {
      if (chrome.runtime?.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
      window.close();
    });
  }
});
