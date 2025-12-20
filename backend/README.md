# MedMnemonic Backend

This is the FastAPI backend for MedMnemonic.

## Setup

1.  **Install dependencies**:
    ```bash
    uv sync
    ```

2.  **Run the server**:
    ```bash
    uv run uvicorn app.main:app --reload --port 8000
    ```

## Testing

Run tests with `pytest`:

```bash
cd backend
env PYTHONPATH=. uv run pytest tests/test_api.py
```
