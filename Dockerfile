FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm pkg delete scripts.postinstall

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3003

CMD ["npm", "run", "start:prod"]