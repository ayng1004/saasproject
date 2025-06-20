FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN ls -la

# Install dependencies
RUN npm install 

# Copy application source code
COPY . .

# Expose service port
EXPOSE 4001

# Start the application
CMD ["node", "src/index.js"]