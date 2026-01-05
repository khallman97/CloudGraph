# Use Node 24 Alpine
FROM node:24-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Expose Vite port
EXPOSE 5173

# Run npm install at startup to sync any new dependencies from mounted volume,
# then start dev server. This ensures node_modules stays in sync when package.json
# changes in development.
CMD ["sh", "-c", "npm install && npm run dev -- --host"]
