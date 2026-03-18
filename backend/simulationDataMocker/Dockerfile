FROM node:20-alpine

WORKDIR /service/simulationDataMocker

COPY ./simulationDataMocker/package*.json ./
RUN npm install

COPY ./simulationDataMocker /service/simulationDataMocker
COPY ./shared /service/shared
RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]