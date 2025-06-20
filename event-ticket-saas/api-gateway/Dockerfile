FROM node:18-alpine
ENV HOST=0.0.0.0
WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application source code
COPY . .

# Expose service port
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]