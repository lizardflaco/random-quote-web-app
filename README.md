# random-quote-web-app

This repository contains a minimal web app that displays a random quote. It also
serves as a foundation for the broader **Quantum Lingua** vision. See
`APP_VISION.md` for the long-term concept and privacy model based on the
Sentinel Assistant Protocol.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. To run the server in production mode:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000` by default.
3. To run in development with automatic restarts (using nodemon):
   ```bash
   npm run dev
   ```

Visit the home page to see a random quote. Click "New Quote" to fetch another
from the `/api/quote` endpoint.
