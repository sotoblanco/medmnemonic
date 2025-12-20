# Stage 1: Build Frontend
FROM node:18-alpine as frontend_build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Backend
FROM python:3.10-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy backend project files
# Note: This Dockerfile expects to be built from the project root context
COPY backend/pyproject.toml backend/uv.lock ./
COPY backend/README.md ./

# Install dependencies
RUN uv sync --frozen --no-install-project

# Copy backend app code
COPY backend/app ./app

# Copy built frontend static files to backend's static directory
COPY --from=frontend_build /app/dist ./app/static

# Expose port
EXPOSE 8000

# Run commands
CMD ["sh", "-c", "uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
