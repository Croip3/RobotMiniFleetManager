FROM node:20-alpine

WORKDIR /service/simulation

COPY ./auth/package*.json ./
RUN npm install

COPY ./simulation /service/simulationDataMocker
COPY ./shared /service/shared
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]