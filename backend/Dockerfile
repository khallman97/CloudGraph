# Use Python 3.11 Slim (Lightweight)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if needed later for Terraform CLI)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Run Uvicorn with Hot Reload enabled
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]