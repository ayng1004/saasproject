FROM node:18-alpine
WORKDIR /app

# Copie les fichiers de config d'abord
COPY package*.json ./
COPY .env ./

RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
