# Fulcrum

Website for Fulcrum - Leverage for Discovery.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing

Tests use [Playwright](https://playwright.dev) to load every page of the production build at desktop and mobile sizes. They check for errors, missing assets and broken internal links, and save a full-page screenshot of each page to `screenshots/`.

```bash
# One-time: install the browser
npx playwright install chromium

# Build, then test
npm run build
npm test
```

New pages need adding to `rollupOptions.input` in `vite.config.js`. The tests fail if a page is missing from the build.

CI runs the tests on every pull request. The screenshots are attached to each run as a `screenshots` artifact, which you can download from the run's summary page.

## Project Structure

```
fulcrum/
├── index.html          # Main HTML entry point
├── src/
│   ├── main.js         # JavaScript entry point
│   └── styles.css      # All styles
├── public/             # Static assets
├── package.json
└── vite.config.js
```

## Deployment

Build the project and deploy the `dist/` folder to your hosting provider:

```bash
npm run build
```

The site is designed to be hosted at `fulcrum.science`.
