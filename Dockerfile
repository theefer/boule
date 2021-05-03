
# Use the official lightweight Node.js 12 image.
# https://hub.docker.com/_/node
# FROM node:15-slim
FROM node:16

# Install Python (for building libsass).
# RUN apt-get update || : && apt-get install python2 -y

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
# If you add a package-lock.json, speed your build by switching to 'npm ci'.
# RUN npm ci --only=production
# RUN npm install --only=production
RUN npm ci

# Copy local code to the container image.
COPY . ./

# Build the app bundle.
RUN npm run build

# Run the web service on container startup.
CMD [ "node", "__sapper__/build" ]
