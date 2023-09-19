FROM node:12-alpine

EXPOSE 80
ENV ENV=production

# Create a working directory in the container
WORKDIR /app

RUN ls -la

COPY portal/package*.json ./
# Copy the entire contents of your local directory into the container at /app
COPY . .

RUN ls -la


# Install application dependencies (package.json and package-lock.json)
RUN npm i

RUN ls -la

RUN ls -la node_modules



RUN ls -la portal

RUN ls -la portal/db

CMD ["node", "portal/server.js"]

# RUN chmod +x scripts/deploy_aws_ecs.sh
# CMD ["bash", "-c", "scripts/deploy_aws_ecs.sh"]
# CMD ["npm start", "dist/index.js"]
# docker build -t api-service .
# docker run -it -p 80:80 api-service