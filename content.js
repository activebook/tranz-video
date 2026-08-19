/**
 * tranz-video - Universal In-Context Video Translation & Language Learning HUD
 * Injected Content Script (DOM Layer, Video Detector, Translucent HUD, Paired Lexer)
 */

(function () {
  // 1. Guard against iframe clutter: only run in top window or standalone embed players
  const isTopFrame = window === window.top;
  const isEmbedPlayer =
    window.location.pathname.includes('/embed/') ||
    window.location.pathname.includes('/player') ||
    window.location.hostname.includes('player.');

  if (!isTopFrame && !isEmbedPlayer) {
    return;
  }

  // Prevent duplicate script execution
  if (window.__TRANZ_VIDEO_LOADED__) return;
  window.__TRANZ_VIDEO_LOADED__ = true;

  let currentConfig = null;
  let hudRoot = null;
  let windowEl = null;
  let pillEl = null;
  let isTranslating = false;
  let hasUserMovedWindow = false;

  // Window geometry state
  let state = {
    x: 32,
    y: 80,
    width: 440,
    height: 380,
    zoom: 1.0,
    isMinimized: false,
    isVisible: true
  };

  /**
   * Universal Video Element Discovery Engine
   */
  function findTargetVideo() {
    const allVideos = Array.from(document.querySelectorAll('video'));

    // Also check open shadow roots if present
    function searchShadow(node) {
      if (node.shadowRoot) {
        allVideos.push(...Array.from(node.shadowRoot.querySelectorAll('video')));
        node.shadowRoot.querySelectorAll('*').forEach(searchShadow);
      }
    }
    document.querySelectorAll('*').forEach(searchShadow);

    if (allVideos.length === 0) return null;
    if (allVideos.length === 1) return allVideos[0];

    // Score videos based on playing state, surface area, and viewport visibility
    const scored = allVideos.map((video) => {
      const rect = video.getBoundingClientRect();
      const isVisible =
        rect.width > 40 &&
        rect.height > 40 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth;

      if (!isVisible) return { video, score: -1 };

      let score = rect.width * rect.height;
      if (!video.paused && !video.ended && video.readyState > 2) {
        score += 10000000; // Priority to actively playing stream
      }

      // Bonus for center proximity
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distFromCenter = Math.hypot(centerX - window.innerWidth / 2, centerY - window.innerHeight / 2);
      score -= distFromCenter * 10;

      return { video, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.score > 0 ? scored[0].video : null;
  }

  /**
   * Initializes and synchronizes configuration from background worker
   */
  async function loadConfig() {
    if (!chrome.runtime?.id) return;
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
      if (response?.success && response.config) {
        currentConfig = response.config;
        if (currentConfig.windowGeometry) {
          const geom = currentConfig.windowGeometry;
          if (typeof geom.x === 'number' && geom.x >= 0 && geom.x < window.innerWidth - 80) {
            state.x = geom.x;
          }
          if (typeof geom.y === 'number' && geom.y >= 0 && geom.y < window.innerHeight - 60) {
            state.y = geom.y;
          }
          if (typeof geom.width === 'number' && geom.width >= 320) {
            state.width = geom.width;
          }
          if (typeof geom.height === 'number' && geom.height >= 220) {
            state.height = geom.height;
          }
          if (typeof geom.zoom === 'number' && geom.zoom >= 0.7 && geom.zoom <= 1.6) {
            state.zoom = geom.zoom;
          }
          if (typeof geom.isMinimized === 'boolean') {
            state.isMinimized = geom.isMinimized;
          }

          if (geom.x !== 32 || geom.y !== 80) {
            hasUserMovedWindow = true;
          }
        }
      }
    } catch (err) {
      if (chrome.runtime?.id) {
        console.warn('[Tranz Video] Could not load stored config:', err);
      }
    }

    state.isVisible = true;
    applyGeometry();
  }

  /**
   * Persists geometry state to storage
   */
  let saveTimeout = null;
  function persistState() {
    if (!chrome.runtime?.id) return;
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (!chrome.runtime?.id) return;
      chrome.runtime.sendMessage({
        type: 'SAVE_CONFIG',
        config: {
          windowGeometry: {
            x: Math.round(state.x),
            y: Math.round(state.y),
            width: Math.round(state.width),
            height: Math.round(state.height),
            zoom: Number(state.zoom.toFixed(2)),
            isMinimized: state.isMinimized,
            isVisible: true
          }
        }
      }).catch(() => {});
    }, 400);
  }

  /**
   * Synchronizes overlay visibility with video presence on the active page.
   * On pages without any <video> element (e.g. google.com), the window remains completely hidden.
   */
  function syncVideoPresence(forceShow = false) {
    if (currentConfig?.extensionEnabled === false) {
      if (hudRoot) hudRoot.style.display = 'none';
      return;
    }

    const video = findTargetVideo();
    if (video || forceShow) {
      ensureHudElements();
      if (hudRoot) hudRoot.style.display = 'block';
    } else {
      if (hudRoot) {
        hudRoot.style.display = 'none';
      }
    }
  }

  /**
   * Creates or ensures the floating window DOM tree is present in the DOM
   */
  function ensureHudElements() {
    if (currentConfig?.extensionEnabled === false) {
      if (hudRoot) hudRoot.style.display = 'none';
      return;
    }

    const parentContainer = document.fullscreenElement || document.body || document.documentElement;
    if (!parentContainer) return;

    if (hudRoot && parentContainer.contains(hudRoot)) {
      return;
    }

    if (!hudRoot) {
      hudRoot = document.createElement('div');
      hudRoot.id = 'tzv-hud-root';

      const iconUrl = chrome.runtime?.getURL ? chrome.runtime.getURL('icons/icon48.png') : '';

      // Build Floating Window
      windowEl = document.createElement('div');
      windowEl.className = 'tzv-window';
      windowEl.innerHTML = `
        <div class="tzv-header">
          <div class="tzv-header-left">
            <img src="${iconUrl}" class="tzv-logo-badge" alt="Tranz Video">
          </div>
          <div class="tzv-header-right">
            <button class="tzv-btn-icon tzv-btn-icon-highlight" id="tzv-btn-translate-action" title="Translate Frame">⚡</button>
            <button class="tzv-btn-icon" id="tzv-btn-copy-all" title="Copy All">📋</button>
            <button class="tzv-btn-icon" id="tzv-btn-close" title="Close">✕</button>
          </div>
        </div>
        <div class="tzv-body" id="tzv-body-content">
          <div class="tzv-loading-state" id="tzv-empty-state">
            <p style="color: var(--tzv-text-muted); font-size: 13px;">Click ⚡ to translate active video frame.</p>
          </div>
        </div>
        <div class="tzv-footer">
          <div class="tzv-status-container">
            <div class="tzv-status-dot" id="tzv-status-indicator"></div>
            <span id="tzv-status-text">Ready</span>
          </div>
        </div>
        <div class="tzv-resize-handle" id="tzv-resize-handle"></div>
      `;

      // Build Floating Minimized Pill
      pillEl = document.createElement('div');
      pillEl.className = 'tzv-pill tzv-hidden';
      pillEl.innerHTML = `
        <img src="${iconUrl}" class="tzv-logo-badge" alt="Tranz Video">
        <button class="tzv-btn-icon tzv-btn-icon-highlight" id="tzv-pill-translate" title="Translate Frame">⚡</button>
        <button class="tzv-btn-icon" id="tzv-pill-expand" title="Expand Translation Window">↗</button>
      `;

      hudRoot.appendChild(windowEl);
      hudRoot.appendChild(pillEl);
      attachEventListeners();
    }

    if (!parentContainer.contains(hudRoot)) {
      parentContainer.appendChild(hudRoot);
    }

    // Auto-position over video on initial load if virgin coordinates
    if (!hasUserMovedWindow) {
      const video = findTargetVideo();
      if (video) {
        const rect = video.getBoundingClientRect();
        if (rect.width > 200 && rect.height > 150) {
          state.x = Math.max(16, Math.min(window.innerWidth - state.width - 24, rect.left + 24));
          state.y = Math.max(16, Math.min(window.innerHeight - state.height - 24, rect.top + 24));
        }
      }
    }

    applyGeometry();
  }

  /**
   * Applies position, size, and zoom styling to the window and pill
   */
  function applyGeometry() {
    if (!windowEl || !pillEl) return;

    // Viewport boundary constraints
    state.x = Math.max(8, Math.min(window.innerWidth - 100, state.x));
    state.y = Math.max(8, Math.min(window.innerHeight - 60, state.y));

    windowEl.style.left = `${state.x}px`;
    windowEl.style.top = `${state.y}px`;
    windowEl.style.width = `${state.width}px`;
    windowEl.style.height = `${state.height}px`;

    pillEl.style.left = `${state.x}px`;
    pillEl.style.top = `${state.y}px`;

    if (state.isMinimized) {
      windowEl.classList.add('tzv-hidden');
      pillEl.classList.remove('tzv-hidden');
    } else {
      pillEl.classList.add('tzv-hidden');
      windowEl.classList.remove('tzv-hidden');
    }
  }

  /**
   * Attaches interaction handlers (drag, resize, controls)
   */
  function attachEventListeners() {
    // Window drag from anywhere on the window frame (excluding buttons and resize handle)
    initDrag(windowEl, (dx, dy) => {
      hasUserMovedWindow = true;
      state.x += dx;
      state.y += dy;
      applyGeometry();
      persistState();
    });

    // Pill drag
    initDrag(pillEl, (dx, dy) => {
      hasUserMovedWindow = true;
      state.x += dx;
      state.y += dy;
      applyGeometry();
      persistState();
    });

    // Corner resize
    const resizeHandle = windowEl.querySelector('#tzv-resize-handle');
    initResize(resizeHandle, (dw, dh) => {
      state.width = Math.max(320, state.width + dw);
      state.height = Math.max(200, state.height + dh);
      applyGeometry();
      persistState();
    });

    windowEl.querySelector('#tzv-btn-close').addEventListener('click', () => {
      state.isMinimized = true;
      applyGeometry();
      persistState();
    });

    windowEl.querySelector('#tzv-btn-copy-all').addEventListener('click', () => {
      copyAllContent();
    });

    windowEl.querySelector('#tzv-btn-translate-action').addEventListener('click', () => {
      handleTranslate();
    });

    // Pill controls
    pillEl.querySelector('#tzv-pill-expand').addEventListener('click', () => {
      state.isMinimized = false;
      applyGeometry();
      persistState();
    });

    pillEl.querySelector('#tzv-pill-translate').addEventListener('click', () => {
      handleTranslate();
    });
  }

  /**
   * Pointer-based smooth dragging helper with threshold to allow clicks and text selection
   */
  function initDrag(element, onMove) {
    let startX = 0;
    let startY = 0;
    let isTracking = false;
    let hasCaptured = false;

    element.addEventListener('pointerdown', (e) => {
      // Ignore interactive controls, links, inputs, and resize handle
      if (e.target.closest('button, a, input, select, textarea, .tzv-resize-handle, [role="button"]')) {
        return;
      }
      isTracking = true;
      hasCaptured = false;
      startX = e.clientX;
      startY = e.clientY;
    });

    element.addEventListener('pointermove', (e) => {
      if (!isTracking) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!hasCaptured) {
        // Drag threshold of 4px ensures clicks & selection aren't hijacked
        if (Math.hypot(dx, dy) > 4) {
          hasCaptured = true;
          try {
            element.setPointerCapture(e.pointerId);
          } catch {}
        } else {
          return;
        }
      }

      startX = e.clientX;
      startY = e.clientY;
      onMove(dx, dy);
    });

    const endDrag = (e) => {
      if (!isTracking) return;
      isTracking = false;
      if (hasCaptured) {
        hasCaptured = false;
        try {
          element.releasePointerCapture(e.pointerId);
        } catch {}
      }
    };

    element.addEventListener('pointerup', endDrag);
    element.addEventListener('pointercancel', endDrag);
  }

  /**
   * Pointer-based smooth resizing helper
   */
  function initResize(handle, onResize) {
    let startX = 0;
    let startY = 0;
    let isResizing = false;

    handle.addEventListener('pointerdown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    });

    handle.addEventListener('pointermove', (e) => {
      if (!isResizing) return;
      const dw = e.clientX - startX;
      const dh = e.clientY - startY;
      startX = e.clientX;
      startY = e.clientY;
      onResize(dw, dh);
    });

    const endResize = (e) => {
      if (!isResizing) return;
      isResizing = false;
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch {}
    };

    handle.addEventListener('pointerup', endResize);
    handle.addEventListener('pointercancel', endResize);
  }

  /**
   * Shows in-window loading state with title and subtitle
   */
  function showLoadingState(title, subtitle) {
    const bodyContent = windowEl.querySelector('#tzv-body-content');
    bodyContent.innerHTML = `
      <div class="tzv-loading-state">
        <div class="tzv-spinner"></div>
        <div class="tzv-loading-title">${escapeHtml(title || 'Translating frame...')}</div>
        <div class="tzv-loading-subtitle">${escapeHtml(subtitle || 'Extracting on-screen text and generating bilingual pairs...')}</div>
      </div>
    `;
  }

  /**
   * Strips reasoning / internal thinking tags output by models (e.g. DeepSeek-R1, Qwen-Thinking, Gemini Thinking)
   */
  function stripReasoningTags(raw) {
    if (!raw || typeof raw !== 'string') return '';
    return raw
      .replace(/<(think|thought|thinking)>[\s\S]*?<\/\1>/gi, '')
      .replace(/<(think|thought|thinking)>[\s\S]*$/gi, '')
      .replace(/```(?:thought|thinking)[\s\S]*?```/gi, '')
      .replace(/^(?:thought|thinking process):\s*[\s\S]*?\n\n/i, '')
      .trim();
  }

  /**
   * Parses model output into interleaved line-by-line pairs
   */
  function parseModelOutput(rawText) {
    if (!rawText) return { type: 'empty', pairs: [], raw: '' };

    // Strip reasoning / thinking tags before parsing
    const cleanedText = stripReasoningTags(rawText);
    if (!cleanedText) return { type: 'empty', pairs: [], raw: '' };

    const pairs = [];

    // Pattern 1: Matches [PAIR] ... [/PAIR] blocks
    const pairBlockRegex = /\[PAIR\]([\s\S]*?)\[\/PAIR\]/gi;
    let match;
    while ((match = pairBlockRegex.exec(cleanedText)) !== null) {
      const blockContent = match[1];
      const srcMatch = blockContent.match(/\[(?:SRC|SOURCE|JP)\]([\s\S]*?)\[\/(?:SRC|SOURCE|JP)\]/i);
      const transMatch = blockContent.match(/\[(?:TRANS|TARGET|EN|CHN)\]([\s\S]*?)\[\/(?:TRANS|TARGET|EN|CHN)\]/i);

      if (srcMatch || transMatch) {
        pairs.push({
          src: srcMatch ? srcMatch[1].trim() : '',
          trans: transMatch ? transMatch[1].trim() : blockContent.trim()
        });
      }
    }

    if (pairs.length > 0) {
      return { type: 'pairs', pairs, raw: cleanedText };
    }

    // Pattern 2: Standalone sequential [SRC]...[/SRC] and [TRANS]...[/TRANS]
    const srcRegex = /\[(?:SRC|SOURCE|JP)\]([\s\S]*?)\[\/(?:SRC|SOURCE|JP)\]/gi;
    const transRegex = /\[(?:TRANS|TARGET|EN|CHN)\]([\s\S]*?)\[\/(?:TRANS|TARGET|EN|CHN)\]/gi;

    const sources = [];
    const targets = [];
    let sMatch, tMatch;

    while ((sMatch = srcRegex.exec(cleanedText)) !== null) {
      sources.push(sMatch[1].trim());
    }
    while ((tMatch = transRegex.exec(cleanedText)) !== null) {
      targets.push(tMatch[1].trim());
    }

    if (sources.length > 0 || targets.length > 0) {
      const maxLen = Math.max(sources.length, targets.length);
      for (let i = 0; i < maxLen; i++) {
        pairs.push({
          src: sources[i] || '',
          trans: targets[i] || ''
        });
      }
      return { type: 'pairs', pairs, raw: cleanedText };
    }

    // Pattern 3: Line-by-line slashed format (e.g. "AAA / BBB")
    const lines = cleanedText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const slashPairs = [];
    for (const line of lines) {
      if (line.includes(' / ')) {
        const parts = line.split(' / ');
        slashPairs.push({ src: parts[0].trim(), trans: parts.slice(1).join(' / ').trim() });
      }
    }
    if (slashPairs.length >= 2) {
      return { type: 'pairs', pairs: slashPairs, raw: cleanedText };
    }

    // Fallback: Raw unstructured output
    return {
      type: 'raw',
      pairs: [],
      raw: cleanedText.trim()
    };
  }

  /**
   * Renders all paired translation blocks in a clean, unified text flow
   */
  function renderTranslationResult(parsedData) {
    const bodyContent = windowEl.querySelector('#tzv-body-content');
    bodyContent.innerHTML = '';

    if (parsedData.type === 'pairs' && parsedData.pairs.length > 0) {
      const container = document.createElement('div');
      container.className = 'tzv-pairs-list';

      parsedData.pairs.forEach((pair) => {
        const item = document.createElement('div');
        item.className = 'tzv-pair-item';

        let innerHtml = '';
        if (pair.src) {
          innerHtml += `<div class="tzv-pair-source">${escapeHtml(pair.src)}</div>`;
        }
        if (pair.trans) {
          innerHtml += `<div class="tzv-pair-target">${escapeHtml(pair.trans)}</div>`;
        }

        item.innerHTML = innerHtml;
        container.appendChild(item);
      });

      bodyContent.appendChild(container);
    } else {
      // Raw fallback
      const rawContainer = document.createElement('div');
      rawContainer.className = 'tzv-pairs-list';
      const rawItem = document.createElement('div');
      rawItem.className = 'tzv-pair-item';
      rawItem.innerHTML = `<div class="tzv-pair-target">${escapeHtml(parsedData.raw)}</div>`;
      rawContainer.appendChild(rawItem);
      bodyContent.appendChild(rawContainer);
    }
  }

  /**
   * Helper to safely escape HTML entities
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Copies text to clipboard and provides visual button feedback
   */
  async function copyText(text, btnElement) {
    try {
      await navigator.clipboard.writeText(text);
      const origText = btnElement.innerText;
      btnElement.innerText = '✓ Copied';
      btnElement.classList.add('tzv-copied');
      setTimeout(() => {
        btnElement.innerText = origText;
        btnElement.classList.remove('tzv-copied');
      }, 1600);
    } catch (err) {
      console.error('[tranz-video] Failed to copy text:', err);
    }
  }

  /**
   * Copies all text currently displayed in the HUD
   */
  function copyAllContent() {
    const bodyContent = windowEl.querySelector('#tzv-body-content');
    const text = bodyContent.innerText;
    if (!text) return;
    const copyAllBtn = windowEl.querySelector('#tzv-btn-copy-all');
    copyText(text, copyAllBtn);
  }

  /**
   * Sets the visual status banner
   */
  function setStatus(type, message) {
    const dot = windowEl.querySelector('#tzv-status-indicator');
    const text = windowEl.querySelector('#tzv-status-text');

    dot.className = 'tzv-status-dot';
    if (type === 'busy') {
      dot.classList.add('tzv-busy');
    } else if (type === 'error') {
      dot.classList.add('tzv-error');
    }

    text.innerText = message;
  }

  /**
   * Attempts direct frame extraction from the HTML5 <video> element.
   * This captures ONLY the decoded video pixels at native resolution,
   * completely bypassing all DOM overlays (YouTube controls, speed, YouTuber title, avatar, seekbar).
   */
  function captureRawVideoFrame(video) {
    try {
      const width = video.videoWidth || video.clientWidth;
      const height = video.videoHeight || video.clientHeight;
      if (!width || !height) return null;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/png');
      if (dataUrl && dataUrl.length > 200 && !dataUrl.startsWith('data:,')) {
        return dataUrl;
      }
    } catch (err) {
      console.warn('[tranz-video] Direct canvas capture blocked or tainted, using clean viewport fallback:', err);
    }
    return null;
  }

  /**
   * Selectors for web video player UI overlays across YouTube, Bilibili, Netflix, HTML5 players.
   */
  const PLAYER_OVERLAY_SELECTORS = [
    // YouTube
    '.ytp-chrome-top',
    '.ytp-chrome-bottom',
    '.ytp-gradient-top',
    '.ytp-gradient-bottom',
    '.ytp-pause-overlay',
    '.ytp-ce-element',
    '.ytp-bezel-text-wrapper',
    '.ytp-bezel',
    '.ytp-iv-video-content',
    '.ytp-contextmenu',
    '.ytp-watermark',
    '.ytp-caption-window-container',
    // Bilibili
    '.bpx-player-control-wrap',
    '.bpx-player-top-wrap',
    '.bpx-player-cmd-dm-wrap',
    // Generic / Video.js / HTML5
    '.vjs-control-bar',
    '.jw-controls',
    '.plyr__controls'
  ];

  /**
   * Temporarily suppresses player overlays (YouTube controls, speed badge, title, seekbar)
   * to ensure a clean video snapshot during fallback tab capture.
   */
  function suppressPlayerOverlays() {
    const hiddenElements = [];
    const elements = document.querySelectorAll(PLAYER_OVERLAY_SELECTORS.join(', '));
    elements.forEach((el) => {
      if (el.style.display !== 'none' && el.style.opacity !== '0') {
        const origDisplay = el.style.display;
        const origOpacity = el.style.opacity;
        const origVisibility = el.style.visibility;
        el.style.setProperty('display', 'none', 'important');
        hiddenElements.push({ el, origDisplay, origOpacity, origVisibility });
      }
    });

    return () => {
      hiddenElements.forEach(({ el, origDisplay, origOpacity, origVisibility }) => {
        el.style.display = origDisplay;
        el.style.opacity = origOpacity;
        el.style.visibility = origVisibility;
      });
    };
  }

  /**
   * Primary Translation Workflow Handler
   */
  async function handleTranslate() {
    if (isTranslating) return;

    ensureHudElements();
    await loadConfig();

    const video = findTargetVideo();
    if (!video) {
      state.isMinimized = false;
      applyGeometry();
      setStatus('error', 'No video found');
      const bodyContent = windowEl.querySelector('#tzv-body-content');
      bodyContent.innerHTML = `
        <div class="tzv-error-state">
          <div style="font-size: 24px;">⚠️</div>
          <p class="tzv-error-msg">No active &lt;video&gt; element detected on this page.</p>
          <p style="font-size: 12px; color: var(--tzv-text-muted);">Please play or pause a video and try again.</p>
        </div>
      `;
      return;
    }

    // 1. Auto-pause video if configured
    if (currentConfig?.autoPause !== false) {
      try {
        if (!video.paused) {
          video.pause();
        }
      } catch (err) {
        console.warn('[tranz-video] Could not pause video:', err);
      }
    }

    isTranslating = true;

    try {
      let rawImageDataUrl = null;
      let needCrop = false;
      const rect = video.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Method A: Direct pristine <video> canvas capture (fastest, native resolution, zero DOM overlays)
      rawImageDataUrl = captureRawVideoFrame(video);

      // Method B: If canvas was tainted (cross-origin), use tab capture with player overlay suppression
      if (!rawImageDataUrl) {
        // Hide our own HUD
        windowEl.classList.add('tzv-hidden');
        pillEl.classList.add('tzv-hidden');

        // Hide player UI overlays (speed, 1080p, seekbar, title, channel avatar)
        const restorePlayerOverlays = suppressPlayerOverlays();

        // Wait for 2 rAF animation frame cycles to guarantee clean paint
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 30);
            });
          });
        });

        try {
          const captureRes = await chrome.runtime.sendMessage({ type: 'CAPTURE_FRAME' });
          if (!captureRes?.success || !captureRes.dataUrl) {
            throw new Error(captureRes?.error || 'Failed to capture video frame.');
          }
          rawImageDataUrl = captureRes.dataUrl;
          needCrop = true;
        } finally {
          restorePlayerOverlays();
        }
      }

      // Restore HUD and immediately show in-window loading indicator
      state.isMinimized = false;
      applyGeometry();
      setStatus('busy', 'Translating...');
      showLoadingState('Analyzing & translating...', 'Extracting dialogue and generating bilingual pairs...');

      // Send to background service worker for translation
      const translatePayload = {
        type: 'TRANSLATE_IMAGE',
        dataUrl: rawImageDataUrl
      };
      if (needCrop) {
        translatePayload.rect = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        };
        translatePayload.dpr = dpr;
      }

      const translateRes = await chrome.runtime.sendMessage(translatePayload);

      if (translateRes && translateRes.success) {
        setStatus('ready', 'Translation complete');
        const parsed = parseModelOutput(translateRes.text);
        renderTranslationResult(parsed);
      } else {
        const errMsg = translateRes?.error || 'Failed to translate video frame.';
        setStatus('error', 'Error');
        const bodyContent = windowEl.querySelector('#tzv-body-content');
        bodyContent.innerHTML = `
          <div class="tzv-error-state">
            <div style="font-size: 24px;">❌</div>
            <p class="tzv-error-msg">${escapeHtml(errMsg)}</p>
            <button class="tzv-btn-retry" id="tzv-retry-btn">Retry Translation</button>
          </div>
        `;
        bodyContent.querySelector('#tzv-retry-btn')?.addEventListener('click', () => {
          handleTranslate();
        });
      }
    } catch (err) {
      state.isMinimized = false;
      applyGeometry();
      setStatus('error', 'Request failed');
      const bodyContent = windowEl.querySelector('#tzv-body-content');
      bodyContent.innerHTML = `
        <div class="tzv-error-state">
          <div style="font-size: 24px;">❌</div>
          <p class="tzv-error-msg">${escapeHtml(err.message || 'Extension communication failure.')}</p>
          <button class="tzv-btn-retry" id="tzv-retry-btn">Retry</button>
        </div>
      `;
      bodyContent.querySelector('#tzv-retry-btn')?.addEventListener('click', () => {
        handleTranslate();
      });
    } finally {
      isTranslating = false;
    }
  }

  // Handle Fullscreen transitions (re-parent to fullscreen container if active)
  function handleFullscreenChange() {
    syncVideoPresence(false);
  }
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

  // Handle SPA (Single Page App) navigations (e.g. YouTube, Bilibili)
  window.addEventListener('yt-navigate-finish', () => {
    setTimeout(() => syncVideoPresence(false), 400);
  });
  window.addEventListener('popstate', () => {
    setTimeout(() => syncVideoPresence(false), 400);
  });

  // Watch for media play/load events
  document.addEventListener('play', (e) => {
    if (e.target?.tagName === 'VIDEO') {
      syncVideoPresence(false);
    }
  }, true);

  // Dynamic MutationObserver to detect late-mounted or asynchronously hydrated <video> elements
  let videoObserver = null;
  let mutationDebounce = null;
  function observeVideoElements() {
    if (videoObserver) return;
    try {
      videoObserver = new MutationObserver(() => {
        clearTimeout(mutationDebounce);
        mutationDebounce = setTimeout(() => {
          syncVideoPresence(false);
        }, 300);
      });

      videoObserver.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
      });
    } catch (err) {
      console.warn('[Tranz Video] MutationObserver error:', err);
    }
  }

  // Listen for messages from background service worker / popup action menu
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TRIGGER_TRANSLATE') {
      state.isMinimized = false;
      syncVideoPresence(true); // Force show window on explicit user trigger
      applyGeometry();
      handleTranslate();
      sendResponse({ received: true });
    }
  });

  // Listen for storage changes across tabs (e.g. Enable/Disable toggle in popup)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.extensionEnabled !== undefined) {
        currentConfig = currentConfig || {};
        currentConfig.extensionEnabled = changes.extensionEnabled.newValue;
        syncVideoPresence(false);
      }
      if (changes.targetLanguage !== undefined) {
        currentConfig = currentConfig || {};
        currentConfig.targetLanguage = changes.targetLanguage.newValue;
      }
    }
  });

  // Initialize: Load configuration, synchronize video presence, and start observer
  loadConfig().then(() => {
    syncVideoPresence(false);
    observeVideoElements();
  });
})();
