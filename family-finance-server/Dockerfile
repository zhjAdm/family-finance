FROM node:20-alpine

# Alpine 使用 apk，不是 apt-get
# netcat-openbsd 提供 nc
# openssl / libc6-compat 是给 Prisma engine 用的
RUN apk add --no-cache \
    netcat-openbsd \
    openssl \
    openssl-dev \
    libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "until nc -z postgres 5432; do echo 'Waiting for database...'; sleep 2; done && npx prisma migrate deploy && node src/server.js"]