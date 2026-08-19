/**
 * Tranz Video - Popup Action Menu Controller
 * Handles Master Enable/Disable toggle, quick target language switching,
 * and navigation to the full settings dashboard.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const enableToggle = document.getElementById('enable-toggle');
  const statusSubtext = document.getElementById('status-subtext');
  const targetLangSelect = document.getElementById('target-lang-select');
  const openOptionsBtn = document.getElementById('btn-open-options');

  // 1. Load active configuration from storage
  try {
    if (chrome.runtime?.id) {
      const config = await chrome.storage.local.get(['extensionEnabled', 'targetLanguage']);
      const isEnabled = config.extensionEnabled !== false; // Default true
      enableToggle.checked = isEnabled;
      updateStatusText(isEnabled);

      if (config.targetLanguage && targetLangSelect) {
        targetLangSelect.value = config.targetLanguage;
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

  // 3. Handle Target Language Quick Switch
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
