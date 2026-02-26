FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirement first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend code and build it
COPY frontend/ ./frontend/
RUN cd frontend && npm install --legacy-peer-deps && npm run build

# Copy remaining backend code
COPY . .

# Environment variables
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

# Using eventlet worker for SocketIO compatibility
CMD ["gunicorn", "-k", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "app:app"]
