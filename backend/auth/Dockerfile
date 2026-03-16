FROM node:20-alpine

WORKDIR /service/auth

COPY ./auth/package*.json ./
RUN npm install

COPY ./auth /service/auth
COPY ./shared /service/shared
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]