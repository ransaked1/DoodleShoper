FROM node:20-alpine as builder
WORKDIR '/app'
COPY package.json .
RUN npm install

RUN npm install axios
RUN npm install react-router-dom
RUN npm install js-cookie

COPY . .
RUN npm run build

FROM nginx
COPY --from=builder /app/build /usr/share/nginx/html