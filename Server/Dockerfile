# Use official Node.js LTS image as base
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first (allows Docker to cache the npm install layer)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the server code
COPY . .

# Expose the port Express runs on
EXPOSE 3000

# Start the server
CMD ["node", "src/index.js"]