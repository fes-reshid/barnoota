# Tuhfatul Atfaal — Local Testing

## Quick method

Open `dist/index.html` in Chrome, Edge, Firefox, or Safari.

## Recommended method

Some browsers handle local audio and storage more reliably through a small local server.

1. Open Terminal or Command Prompt in this project folder.
2. Run:

   ```bash
   python3 -m http.server 8080 --directory dist
   ```

3. Open `http://localhost:8080` in your browser.
4. To test on a phone connected to the same Wi-Fi, open `http://YOUR-COMPUTER-IP:8080` on the phone.
5. Stop the server by pressing `Ctrl+C` in the terminal.

No installation or build step is required.

## Main files

- `dist/index.html` — the complete interactive course.
- `dist/assets/tajweed-journey.webp` — journey artwork.
- `dist/assets/tajweed-vocabulary.webp` — vocabulary artwork.
- `dist/assets/tuhfatul-atfaal-title-v2.webp` — title artwork.
- `.openai/hosting.json` — hosting configuration.