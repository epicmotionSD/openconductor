FROM node:22-alpine

WORKDIR /app

# Copy shared package
COPY ../shared ./shared
WORKDIR /app/shared
RUN npm install
RUN npm run build

# Copy and build API
WORKDIR /app/api
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/server.js"]
