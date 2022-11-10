FROM node:lts-alpine

WORKDIR /src

COPY package.json ./
RUN npm install

COPY . ./

CMD ["node","index.js"]