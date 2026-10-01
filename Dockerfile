FROM node:22-alpine

# Install build dependencies for better-sqlite3 native compilation on alpine
RUN apk add --no-cache build-base gcompat python3

WORKDIR /app

# Copy package.json and packages
COPY package*.json ./
COPY jsconfig.json ./

# Install dependencies including native C++ module compilation
RUN npm install

# Create data directory for SQLite persistence (to be mapped to a Docker volume)
RUN mkdir -p /app/data

# Copy the rest of the application code
COPY src ./src
COPY public ./public
COPY scripts ./scripts
COPY next.config.mjs ./

# We will use Docker volume binding or SSH syncing for .env and credential key files.
# But for the standard Next.js build process, we copy a skeleton env so that it builds correctly.
COPY .env.production ./
COPY .env.key.json ./

# Build the Next.js application
RUN npm run build

# Expose the application port
EXPOSE 3000

# Start Next.js with init-db to validate schema and create defaults
CMD ["npm", "start"]
