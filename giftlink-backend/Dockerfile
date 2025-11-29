FROM node:18.12.1-bullseye-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

RUN adduser --disabled-password --gecos '' appuser

USER appuser

COPY . .

EXPOSE 3060

CMD ["node", "app.js"]