FROM node:20-slim

ARG APP_VERSION=1.0.0
LABEL version="${APP_VERSION}"

RUN apt-get update \
    && apt-get install -y netcat-openbsd openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "until nc -z postgres 5432; do echo 'Waiting for database...'; sleep 2; done && npx prisma migrate deploy && node src/server.js"]