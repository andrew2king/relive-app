FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

EXPOSE 8001

ENV NODE_ENV=development

CMD ["npm", "run", "dev"]