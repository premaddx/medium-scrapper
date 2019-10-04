FROM node:8.9.0
# ENV NODE_ENV development
WORKDIR /medium-scrapper
COPY . .
RUN npm install --save
EXPOSE 5000
CMD [ "node", "index.js"]
