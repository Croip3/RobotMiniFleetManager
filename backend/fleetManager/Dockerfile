FROM node:20-alpine

WORKDIR /service/fleetManager

COPY ./auth/package*.json ./
RUN npm install

COPY ./fleetManager /service/fleetManager/
COPY ./auth /service/auth/
COPY ./shared /service/shared
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]