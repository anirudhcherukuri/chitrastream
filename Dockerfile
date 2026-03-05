FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirement first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code first (excludes frontend/dist via .dockerignore)
COPY app.py db.py ./
COPY static/ ./static/
COPY render.yaml ./

# Copy frontend source and build it
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm install --legacy-peer-deps

COPY frontend/index.html frontend/vite.config.js frontend/eslint.config.js ./frontend/
COPY frontend/src/ ./frontend/src/
COPY frontend/public/ ./frontend/public/
RUN cd frontend && npm run build

# Environment variables
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

# Using gthread worker - no eventlet/gevent = no MongoDB SSL conflicts
CMD ["gunicorn", "-k", "gthread", "--threads", "4", "-w", "1", "--bind", "0.0.0.0:5000", "--timeout", "120", "app:app"]
