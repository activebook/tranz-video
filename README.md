<div align="center">
  <img src="images/icon.png" alt="Tranz Video Icon" width="128" height="128" />
  <h1>Tranz Video</h1>
  <p><strong>Translate on-screen text, game dialogue, and visual text from any web video.</strong></p>
  <p>
    <a href="https://developer.chrome.com/docs/extensions/mv3/intro/"><img src="https://img.shields.io/badge/Manifest-V3-6366f1.svg" alt="Manifest V3"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
    <a href="https://www.google.com/chrome/"><img src="https://img.shields.io/badge/Platform-Chromium-38bdf8.svg" alt="Platform: Chrome / Edge / Brave"></a>
  </p>
</div>

**Tranz Video** is a Google Chrome extension that lets you translate any text you see inside a video.

While regular subtitle extensions only work when a video has uploaded subtitle files, Tranz Video reads the words directly from the video itself. This lets you translate game dialogues, hardcoded subtitles, on-screen signs, and presentation slides on any website.

---

## Why Tranz Video?

Standard subtitle tools cannot read text that is built into the video itself:

- **Game Dialogues & Walkthroughs:** Translate dialogue boxes, skill descriptions, quest text, and in-game menus.
- **Foreign Shows & Anime:** Read hardcoded subtitles, signs, and background text.
- **Tutorials & Lectures:** Translate slides, code, diagrams, and foreign presentations.

Whenever you see text you want to read, simply pause the video and click **Translate** to see the translation in a floating window.

---

## Features

- **Translate Any On-Screen Text:** Understand words shown in any video, even without subtitles.
- **Side-by-Side Bilingual View:** Shows the original words alongside the translation to help you learn languages.
- **Movable & Resizable Window:** Drag the translation box anywhere on your screen and adjust its size as needed.
- **Minimize Anytime:** Shrink the window into a small floating button to keep your screen clear.
- **One-Click Copy:** Copy translated text to your clipboard with a single click.
- **Clean & Unobtrusive:** The translation window only appears when you are watching a video, and stays hidden on regular websites.
- **Private:** All your settings and keys are stored locally in your browser.

---

## How to Install

1. Download or clone this repository to your computer:
   ```bash
   git clone https://github.com/activebook/tranz-video.git
   ```
2. In your browser, navigate to `chrome://extensions/` (works on Chrome, Edge, Brave, and other Chromium browsers).
3. Turn on the **Developer mode** switch in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `tranz-video` folder.
6. Pin **Tranz Video** to your browser toolbar.

---

## Setup

1. Click the **Tranz Video** icon in your toolbar and open **Settings** (or right-click the icon and choose **Options**).
2. Choose your preferred setup:
   - **Target Language:** Select the language you want to translate into (e.g. English, Chinese, Japanese, etc.).
   - **AI Service:** Connect your local AI model (such as Ollama or LiteLLM) or enter your API key for a cloud service (such as Gemini or OpenAI).
3. Click **Test API Connection** to verify everything is working, then click **Save Settings**.

---

## How to Use

1. Open any video on YouTube, Bilibili, Netflix, or any web player.
2. Pause the video on a frame with text you want to translate.
3. Click the **⚡** button on the floating window or in the toolbar.
4. Read the translated text directly on top of the video.

---

## Supported Languages

Tranz Video can translate into:

- 🇺🇸 **English** (`en`)
- 🇨🇳 **Simplified Chinese** (`zh-Hans` / 简体中文)
- 🇭🇰 **Traditional Chinese** (`zh-Hant` / 繁體中文)
- 🇯🇵 **Japanese** (`ja` / 日本語)
- 🇰🇷 **Korean** (`ko` / 한국어)
- 🇪🇸 **Spanish** (`es` / Español)
- 🇫🇷 **French** (`fr` / Français)

The language in the video is detected automatically.

---

## Frequently Asked Questions

**Does it work in full screen?**  
Yes. The translation window follows your video into full-screen mode automatically.

**Can I use free or local AI models?**  
Yes. You can connect local AI tools like Ollama without paying for an API subscription.

**Why does the window not appear on regular websites?**  
Tranz Video stays hidden on normal web pages (like search engines or news sites) and only appears when a video is present.

---

## License

This project is licensed under the [MIT License](LICENSE).
