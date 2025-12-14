# Stripula

A Stripe card validation tool with a React frontend and Node.js backend.

## Features

- Card validation using Stripe API
- Multiple validation modes (Charge, No-Charge, Setup, Direct API)
- Stripe key management and validation
- Proxy support for requests
- BIN lookup integration
- Modern React UI with Tailwind CSS

## Project Structure

```
├── backend/          # Node.js + Express API server
│   └── src/
│       ├── controllers/    # Route handlers
│       ├── services/       # Business logic
│       ├── validators/     # Card validation strategies
│       ├── infrastructure/ # External integrations
│       └── domain/         # Domain models
│
└── frontend/         # React + Vite application
    └── src/
        ├── components/     # UI components
        └── hooks/          # Custom React hooks
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Create `.env` file in backend with your configuration

### Running the Application

**Backend** (port 5000):
```bash
cd backend
npm run dev
```

**Frontend** (port 3000):
```bash
cd frontend
npm run dev
```

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **APIs**: Stripe API, BIN Lookup

## License

MIT
