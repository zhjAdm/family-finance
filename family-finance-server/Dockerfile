FROM node:20-slim

RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "until nc -z postgres 5432; do echo 'Waiting for database...'; sleep 2; done && npx prisma migrate deploy && node src/server.js"]
