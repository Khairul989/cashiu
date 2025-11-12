# Use the official Node.js 20 image as the base
FROM node:22

# Install PM2 globally to run the AdonisJS server
RUN npm install -g pm2

# Install bun in order for pm2 to work
RUN npm install -g bun

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

COPY .npmrc ./

# Install all dependencies (including dev dependencies)
RUN npm i

# Expose the development port (AdonisJS default is 3333)
EXPOSE 3333

# Start the AdonisJS development server with hot-reloading
CMD [ "pm2-runtime", "start", "npm", "--", "run", "dev" ]
