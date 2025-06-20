FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application source code
COPY . .

# Expose service port
EXPOSE 4003

# Start the application
CMD ["node", "src/index.js"]

