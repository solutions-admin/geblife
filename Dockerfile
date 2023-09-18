FROM node:12-alpine

EXPOSE 80
ENV ENV=production

# Create a working directory in the container
WORKDIR /app

# Copy the entire contents of your local directory into the container at /app
COPY . .

# Install application dependencies (package.json and package-lock.json)
RUN npm i

RUN ls -la

CMD ["node", "portal/server.js"]

# RUN chmod +x scripts/deploy_aws_ecs.sh
# CMD ["bash", "-c", "scripts/deploy_aws_ecs.sh"]
# CMD ["npm start", "dist/index.js"]
# docker build -t api-service .
# docker run -it -p 80:80 api-service