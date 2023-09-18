FROM node:12-alpine

EXPOSE 80
ENV ENV=production

WORKDIR /app
RUN ls
COPY portal/* ./
COPY . .

# RUN npm i typescript pm2 -g
RUN npm i

RUN ls

# RUN mv -rf node_modules /portal/

RUN ls -la
# RUN ls -la /portal





CMD ["node", "./server.js"]

# RUN chmod +x scripts/deploy_aws_ecs.sh
# CMD ["bash", "-c", "scripts/deploy_aws_ecs.sh"]
# CMD ["npm start", "dist/index.js"]
# docker build -t api-service .
# docker run -it -p 80:80 api-service