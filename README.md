<div align="center">
  <img src="images/icon.png" alt="Tranz Video Icon" width="128" height="128" />
  <h1>Tranz Video</h1>
  <p><strong>Translate on-screen text, game dialogue, and visual text from any web video.</strong></p>
  <p>
    <a href="https://developer.chrome.com/docs/extensions/mv3/intro/"><img src="https://img.shields.io/badge/Manifest-V3-6366f1.svg" alt="Manifest V3"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-3178c6.svg" alt="TypeScript"></a>
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

## Game Translation & Walkthroughs

Translating foreign video games has always been notoriously difficult because dialogue boxes, quest logs, choice prompts, item descriptions, and skill menus are baked directly into video frames with no subtitle files available.

**Tranz Video** turns any foreign gameplay video, stream, or visual novel into an interactive language-learning experience:

| RPG Dialogue Transcription | In-Game Menus & Prompts | Furigana & Vocabulary Cards |
| :---: | :---: | :---: |
| ![RPG Dialogue](images/jap_game.png) | ![In-Game Selection](images/jap_game2.png) | ![Furigana & Vocab Card](images/jap_game3.png) |

- **RPG & Visual Novel Dialogue:** Transcribe stylized Japanese, Korean, or Chinese dialogue boxes and on-screen story text.
- **Japanese Furigana Mode:** Automatically generate Hiragana reading pronunciation for complex Kanji names, locations, and lore terms.
- **Vocabulary Breakdown:** Extract game-specific item names, verbs, and idioms into an integrated glossary card below each line.
- **Livestreams & Walkthroughs:** Follow along with foreign creators on YouTube Gaming, Twitch, and Bilibili without getting lost in menus.

---

## Other Use Cases

| Video Podcasts & Foreign Shows | Presentations & Technical Slides |
| :---: | :---: |
| ![Video Podcast Translation](images/jap_podcast.png) | ![Document Translation](images/jap_paper.png) |

---

## Features

- **Translate Any On-Screen Text:** Reads words directly from the video — no subtitle files needed. Works on game dialogue, anime, tutorial slides, and signs.
- **4 Helpful Learning Modes:**
  - **Bilingual:** Shows the original sentence and translation together.
  - **Japanese Furigana:** Adds Hiragana pronunciation readings for Japanese text.
  - **Vocabulary Cards:** Breaks down key words and phrases with simple explanations.
  - **Translation Only:** A clean view showing just the translated text.
- **Floating Translation Window:** A sleek, transparent window on top of your video. Drag it anywhere, resize it, or minimize it into a small button.
- **Works with Multiple AI Services:** Connect free local tools (like Ollama) or popular AI providers (Gemini, OpenAI, OpenRouter) and switch between them with one click.
- **Customizable Appearance:** Adjust window transparency, colors, and font sizes to make text easy to read.
- **Smart & Seamless:** Automatically pauses the video while translating and follows your video into full screen.

---

## How to Install

### Option 1: Quick Install (Recommended)

1. Download the latest **`tranz-video-v*.zip`** from [**Releases**](https://github.com/activebook/tranz-video/releases/latest).
2. Extract (unzip) the downloaded zip file on your computer.
3. Open your browser and go to `chrome://extensions/` (works on Chrome, Edge, Brave, and other Chromium browsers).
4. Turn on the **Developer mode** toggle in the top-right corner.
5. Click **Load unpacked** in the top-left corner.
6. Select the extracted folder.
7. Pin **Tranz Video** to your browser toolbar.

<details>
<summary><strong>Option 2: Build From Source (Developers)</strong></summary>

```bash
git clone https://github.com/activebook/tranz-video.git
cd tranz-video
npm install
npm run build
```
*(For active development with live re-bundling, run `npm run dev`)*

In `chrome://extensions/`, enable Developer mode, click **Load unpacked**, and select the **`dist`** folder.
</details>

---

## Setup

1. Click the **Tranz Video** icon in your toolbar and open **Settings** (or right-click the icon and choose **Options**).
2. Configure your preferences across the three tabs:
   - **AI Service:** Select or add your preferred AI provider profile (**Local Ollama**, **Google Gemini**, **OpenAI Direct**, **OpenRouter**, or custom proxies). Click **Test API Connection** to verify latency.
   - **Appearance:** Choose your preferred window effect (Frosted Glass, Translucent, Opaque, Glow), adjust background opacity, and customize font sizes and colors for Source, Furigana, and Target text with real-time live preview.
   - **Translation:** Select your target language, output mode (**Bilingual Pair**, **Japanese Furigana**, **Vocabulary Breakdown**, or **Target Only**), and optionally customize system and user prompts.
3. Click **Save Settings**.

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
