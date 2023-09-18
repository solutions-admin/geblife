FROM node:12-alpine

EXPOSE 80
ENV ENV=production

WORKDIR /app
COPY portal/package*.json ./
COPY tsconfig.json ./
COPY . .

# RUN npm i typescript pm2 -g
RUN npm i
COPY . .
# RUN tsc


CMD ["node", "./dist/server.js"]

# RUN chmod +x scripts/deploy_aws_ecs.sh
# CMD ["bash", "-c", "scripts/deploy_aws_ecs.sh"]
# CMD ["npm start", "dist/index.js"]
# docker build -t api-service .
# docker run -it -p 80:80 api-service