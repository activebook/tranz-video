# Tranz Video

> **AI-Powered On-Screen Video Text Translator & Language Learning HUD for Google Chrome**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-6366f1.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Chrome / Edge / Brave](https://img.shields.io/badge/Platform-Chromium-38bdf8.svg)](https://www.google.com/chrome/)

**Tranz Video** is a browser extension that translates text directly from video screens using AI vision.

Unlike traditional subtitle tools that only read closed-caption files, Tranz Video reads the actual video image. It lets you translate video game dialogue, hardcoded foreign subtitles, on-screen signs, and presentation slides on any web video.

---

## Why Tranz Video?

Most subtitle extensions only work when a video has uploaded subtitle tracks (`.srt` or `.vtt`). They cannot help when text is part of the video itself:

- **Video Games & Walkthroughs:** Untranslated RPG dialogue boxes, game menus, quest text, and item descriptions.
- **Foreign Media & Anime:** Hardcoded subtitles, signs, background text, and manga speech bubbles.
- **Online Courses & Tutorials:** Text inside presentation slides, diagrams, and programming tutorials.

Tranz Video solves this. Pause any video, click **Translate Frame**, and instantly see the original text and its translation in a floating window.

---

## What It Can Do

- **Translate Any On-Screen Text:** Understand dialogue, signs, and slides that have no subtitles.
- **Bilingual Learning Display:** See the original transcribed line directly above the translated line, making it easy to learn new vocabulary in context.
- **Floating, Movable Window:** Drag the translation window anywhere on your screen and resize it to fit your video layout.
- **Minimize to Floating Pill:** Shrink the window into a small floating button when you want an unobstructed view of the video.
- **One-Click Copy:** Easily copy all translated dialogue to your clipboard.
- **Smart Video Detection:** Only appears when you are watching a video. It stays hidden during normal web browsing.
- **Private & Local:** All settings, keys, and preferences are stored strictly on your computer.

---

## How to Install

1. Download or clone this repository to your computer.
2. Open your browser and go to `chrome://extensions/` (works in Chrome, Edge, Brave, and other Chromium browsers).
3. Turn on the **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `tranz-video` folder.
6. Pin **Tranz Video** to your browser toolbar for easy access.

---

## Quick Setup

1. Click the **Tranz Video** icon in your browser toolbar and select **Settings Dashboard** (or right-click the icon and choose **Options**).
2. Enter your AI service details:
   - **API Base URL:** Your AI endpoint (e.g., `http://127.0.0.1:8045/v1` for local models, or your cloud provider URL).
   - **Model Identifier:** The model to use (e.g., `gemini-2.5-flash-lite` or `gpt-4o`).
   - **API Key:** Required if you are using a cloud service (leave empty for local gateways).
   - **Target Language:** Select the language you want text translated into.
3. Click **Test API Connection** to confirm your setup is working.
4. Click **Save Settings**.

---

## How to Use

1. Open any website with video content (such as YouTube, Bilibili, or Netflix).
2. Pause the video on any scene with text you want to read.
3. Click the **⚡** button on the floating translation window or in the toolbar.
4. The translated text will appear right over your video.

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

The original language in the video is detected automatically.

---

## Frequently Asked Questions

**Does this work with full-screen videos?**  
Yes. The translation window automatically moves into full-screen mode with your video.

**Can I use free or local AI models?**  
Yes. You can use local AI runners like Ollama or LiteLLM without needing a paid cloud subscription.

**Why is the window not showing up on regular websites?**  
Tranz Video only activates when a video is present on the page, keeping your screen clean while browsing normal articles or search results.

---

## License

This project is licensed under the [MIT License](LICENSE).
