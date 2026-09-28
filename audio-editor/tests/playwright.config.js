// Browser tests for the audio editor. Run from this folder:
//   npm install && npx playwright install --with-deps && npm test
// The site is served from the repository root, like GitHub Pages does.
const { defineConfig, devices } = require('@playwright/test');
const PORT = Number(process.env.AE_PORT || 8765);

module.exports = defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.js/,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/audio-editor/`,
    serviceWorkers: 'block', // tests control every request; the offline app is tested separately
    acceptDownloads: true,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium', testIgnore: /mobile\.spec\.js/,
      use: { ...devices['Desktop Chrome'], permissions: ['microphone'],
        launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] } },
    },
    {
      name: 'firefox', testIgnore: /mobile\.spec\.js/,
      use: { ...devices['Desktop Firefox'],
        launchOptions: { firefoxUserPrefs: { 'media.navigator.streams.fake': true, 'media.navigator.permission.disabled': true, 'media.autoplay.default': 0 } } },
    },
    { name: 'webkit', testIgnore: /mobile\.spec\.js/, use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] }, testMatch: /mobile\.spec\.js/ },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] }, testMatch: /mobile\.spec\.js/ },
  ],
  webServer: {
    command: `npx http-server ../.. -p ${PORT} -s -c-1`,
    url: `http://localhost:${PORT}/audio-editor/`,
    reuseExistingServer: !process.env.CI,
  },
});
