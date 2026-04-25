# AhaSpaceUI | Enlightenment Frontend

React 19 frontend for the Enlightenment learning platform.

## Tech Stack

- **Framework**: React 19.2.4
- **Build Tool**: Vite 8.0.1
- **Routing**: React Router DOM 7.14.0
- **Linting**: ESLint 9.39.4

## Features

- User registration with form validation
- JWT-based authentication
- Protected dashboard routes
- Responsive design

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
cd AhaSpaceUI
npm install
```

### Development

```bash
npm run dev
```

The dev server will start on `http://localhost:5173`

### Build

```bash
npm run build
```

Output goes to `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/        # React context (AuthContext)
├── pages/          # Route components
│   ├── Login.jsx
│   ├── Register.jsx
│   └── Dashboard.jsx
├── App.jsx         # Root component with routes
└── main.jsx        # Entry point
```

## API Integration

The frontend connects to the Spring Boot backend at `http://localhost:8080`

| Endpoint | Usage |
|----------|-------|
| `POST /api/auth/register` | User registration |
| `POST /api/auth/login` | User login (returns JWT) |
| `GET /api/auth/me` | Fetch current user |

## ESLint

Run linting:
```bash
npm run lint
```

## Original Vite Template Info

This project was bootstrapped with Vite's React template. See [Vite docs](https://vitejs.dev/) for more.
