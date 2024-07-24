FROM alpine:3.18

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache npm && \
    mkdir data

ADD package.json .
ADD package-lock.json .

RUN npm install --omit=dev

ADD dist/ dist/
ADD vite.config.js .

CMD [ "node", "./dist/index.js" ]
