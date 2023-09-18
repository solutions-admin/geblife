FROM node:12-alpine

EXPOSE 80
ENV ENV=production

WORKDIR /portal
RUN ls -la
# COPY portal/package*.json ./

# RUN npm i typescript pm2 -g
RUN npm i




COPY . .

RUN ls -la
RUN ls -la /portal
RUN ls -la /portal/node_modules





CMD ["node", "./portal/server.js"]

# RUN chmod +x scripts/deploy_aws_ecs.sh
# CMD ["bash", "-c", "scripts/deploy_aws_ecs.sh"]
# CMD ["npm start", "dist/index.js"]
# docker build -t api-service .
# docker run -it -p 80:80 api-service