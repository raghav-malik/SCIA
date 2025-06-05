# Smart Crypto Investment Assistant

A React-based web application that serves as a cryptocurrency investment assistant with blockchain integration and AI-powered recommendations.

## Features

- Real-time cryptocurrency price tracking via CoinGecko API
- Risk profile assessment using AI (Google's Gemini API)
- Portfolio recommendations based on risk profile
- Ethereum wallet integration via MetaMask
- Investment vault for depositing and withdrawing funds
- Investment simulation and visualization

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- Google Gemini API key (for AI features)
- CoinGecko API key (optional, for higher rate limits)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/smart-crypto-assistant.git
   cd smart-crypto-assistant
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following:
   ```
   # CoinGecko API Key (optional)
   REACT_APP_COINGECKO_API_KEY=your_coingecko_api_key_here
   
   # Gemini API Key (required for server.js)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the backend server:
   ```
   npm run server
   ```

5. In a separate terminal, start the frontend:
   ```
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## API Keys

### CoinGecko API
- The app will work without a CoinGecko API key, but you may encounter rate limiting.
- For better reliability, get a free API key at [CoinGecko API Pricing](https://www.coingecko.com/en/api/pricing).
- Add your API key to the `.env` file.

### Gemini API
- Required for the risk profile and portfolio recommendation features.
- Get a key at [Google AI Studio](https://ai.google.dev/).
- Add your API key to the `.env` file.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm run server`

Runs the backend server for AI-powered recommendations.\
The server runs on [http://localhost:5000](http://localhost:5000).

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
