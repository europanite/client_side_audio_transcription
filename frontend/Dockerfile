FROM node:24-bookworm-slim

WORKDIR /app
COPY app/package*.json ./
RUN npm ci
COPY . .
