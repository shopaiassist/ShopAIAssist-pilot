FROM tr1-docker-remote.jfrog.io/node:20-bullseye-slim

ARG TR_NPM_TOKEN
ARG reactTEXT_NPM_TOKEN

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json .
COPY tsconfig.json .
COPY env ./env

# Bundle app source
COPY client ./client
COPY server ./server

# Install AWS and JQ
RUN apt update
RUN apt install -y jq curl unzip
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

# Generate .npmrc file
RUN echo "engine-strict=true" > .npmrc
RUN echo "//registry.npmjs.org/:_authToken=npm_${reactTEXT_NPM_TOKEN}" >> .npmrc
RUN echo "//tr1.jfrog.io/artifactory/api/npm/npm/:_authToken=${TR_NPM_TOKEN}" >> .npmrc
RUN echo "@on:registry=https://tr1.jfrog.io/artifactory/api/npm/npm/" >> .npmrc
RUN echo "registry=https://tr1.jfrog.io/artifactory/api/npm/npm/" >> .npmrc

# Generate client .npmrc file
RUN echo "engine-strict=true" > ./client/.npmrc
RUN echo "//registry.npmjs.org/:_authToken=npm_${reactTEXT_NPM_TOKEN}" >> ./client/.npmrc
RUN echo "//tr1.jfrog.io/artifactory/api/npm/npm/:_authToken=${TR_NPM_TOKEN}" >> ./client/.npmrc
RUN echo "@on:registry=https://tr1.jfrog.io/artifactory/api/npm/npm/" >> ./client/.npmrc
RUN echo "registry=https://tr1.jfrog.io/artifactory/api/npm/npm/" >> ./client/.npmrc

# Generate server .npmrc file
RUN echo "engine-strict=true" > ./server/.npmrc
RUN echo "//registry.npmjs.org/:_authToken=npm_${reactTEXT_NPM_TOKEN}" >> ./server/.npmrc
RUN echo "//tr1.jfrog.io/artifactory/api/npm/npm/:_authToken=${TR_NPM_TOKEN}" >> ./server/.npmrc
RUN echo "@on:registry=https://tr1.jfrog.io/artifactory/api/npm/npm/" >> ./server/.npmrc
RUN echo "registry=https://tr1.jfrog.io/artifactory/api/npm/npm/" >> ./server/.npmrc

# install dependencies
RUN npm install
RUN npm run postinstall

# Copy shell script for building and running the app and set as executable
COPY iac/start.sh .
RUN chmod +x start.sh

ADD https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /etc/ssl/certs/global-bundle.pem

EXPOSE 5004
CMD ["sh", "-c", "./start.sh"]
