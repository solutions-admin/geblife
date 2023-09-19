FROM node:19-bullseye

EXPOSE 80
ENV ENV=production

# Create a working directory in the container
# WORKDIR /app

RUN ls -la

# Copy the entire contents of your local directory into the container at /app
COPY . .

RUN ls -la


# Install application dependencies (package.json and package-lock.json)
RUN npm i

RUN ls -la

RUN npm update express-handlebars nodemailer-express-handlebars

RUN ls -la node_modules




RUN ls -la db

RUN node -v


CMD ["node", "server.js"]

# RUN chmod +x scripts/deploy_aws_ecs.sh
# CMD ["bash", "-c", "scripts/deploy_aws_ecs.sh"]
# CMD ["npm start", "dist/index.js"]
# docker build -t api-service .
# docker run -it -p 80:80 api-service