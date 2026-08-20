/**
 * Tranz Video - Popup Action Menu Controller
 * Handles Master Enable/Disable toggle, quick target language switching,
 * and navigation to the full settings dashboard.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const enableToggle = document.getElementById('enable-toggle');
  const statusSubtext = document.getElementById('status-subtext');
  const endpointSelect = document.getElementById('endpoint-select');
  const targetLangSelect = document.getElementById('target-lang-select');
  const learningModeSelect = document.getElementById('learning-mode-select');
  const openOptionsBtn = document.getElementById('btn-open-options');

  const versionBadge = document.querySelector('.popup-version');
  if (versionBadge && chrome.runtime?.getManifest) {
    versionBadge.innerText = `v${chrome.runtime.getManifest().version}`;
  }

  // 1. Load active configuration from storage
  try {
    if (chrome.runtime?.id) {
      const config = await chrome.storage.local.get(['extensionEnabled', 'targetLanguage', 'learningMode', 'endpoints', 'activeEndpointId']);
      const isEnabled = config.extensionEnabled !== false; // Default true
      enableToggle.checked = isEnabled;
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
  enableToggle.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    updateStatusText(isEnabled);
    try {
      if (chrome.runtime?.id) {
        await chrome.storage.local.set({ extensionEnabled: isEnabled });
      }
    } catch (err) {
      console.error('[Tranz Video] Failed to save enabled state:', err);
    }
  });

  function updateStatusText(isEnabled) {
    if (statusSubtext) {
      statusSubtext.innerText = isEnabled ? 'Active on web videos' : 'Disabled (Window hidden)';
      statusSubtext.style.color = isEnabled ? 'var(--tzv-text-muted)' : 'var(--tzv-danger)';
    }
  }

  // 3. Handle Active AI Provider Quick Switch
  if (endpointSelect) {
    endpointSelect.addEventListener('change', async (e) => {
      const newEndpointId = e.target.value;
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
  targetLangSelect.addEventListener('change', async (e) => {
    const newLang = e.target.value;
    try {
      if (chrome.runtime?.id) {
        await chrome.storage.local.set({ targetLanguage: newLang });
      }
    } catch (err) {
      console.error('[Tranz Video] Failed to save target language:', err);
    }
  });

  // 4. Handle Learning Mode Quick Switch
  if (learningModeSelect) {
    learningModeSelect.addEventListener('change', async (e) => {
      const newMode = e.target.value;
      try {
        if (chrome.runtime?.id) {
          await chrome.storage.local.set({ learningMode: newMode });
        }
      } catch (err) {
        console.error('[Tranz Video] Failed to save learning mode:', err);
      }
    });
  }

  // 4. Handle Open Settings Dashboard
  openOptionsBtn.addEventListener('click', () => {
    if (chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
    window.close();
  });
});
