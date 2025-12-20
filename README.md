# MedMnemonic

## Running the Project

This project uses `concurrently` to run both the FastAPI backend and React frontend simultaneously.

### Prerequisites

1.  **Backend**: Ensure you have `uv` installed.
    ```bash
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ```
2.  **Frontend**: Ensure you have Node.js and npm installed.

### Setup

1.  **Install Root Dependencies**:
    ```bash
    npm install
    ```

2.  **Install Backend Dependencies**:
    ```bash
    cd backend
    uv sync
    cd ..
    ```

3.  **Install Frontend Dependencies**:
    ```bash
    cd frontend
    npm install
    cd ..
    ```

### Start Development Server

To run both the backend (port 8000) and frontend (default Vite port) at the same time:

```bash
npm run dev
```

- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:5173 (usually)
