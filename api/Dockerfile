# Stage 1 — Base build
FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
