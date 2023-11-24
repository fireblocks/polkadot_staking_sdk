FROM node:18 as base
WORKDIR /home/ubuntu/app
COPY package*.json ./
RUN npm i
COPY . .
