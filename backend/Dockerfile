FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 8000

ENV NODE_ENV=development

CMD ["npm", "run", "dev"]