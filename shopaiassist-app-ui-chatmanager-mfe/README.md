# Matters Micro Frontend (MFE)

## Overview

Welcome to `chatmanager_mfe`, the dedicated micro-frontend for managing matters efficiently and
intuitively. Named after chatmanager, the Greek Titaness symbolizing order and fairness, this service
embodies the principles of structured organization and clear governance. It is designed to
seamlessly integrate with the [Assitance](https://github.com/ai-assistance) main container app,
providing a specialized interface for managing various matters within our platform.

This repository hosts a React-based Micro Frontend (MFE) application, designed to be integrated
within a larger MFE architecture. The application, featuring a Node.js server backend, acts as a
standalone unit that can be seamlessly embedded into a container application. Leveraging Webpack 5
and Module Federation, it exposes its components via a `remoteEntry` file, allowing for dynamic
integration and interaction with other MFEs. This approach ensures modularity and scalability in
developing complex web applications.

## Features

- **Micro Frontends (MFE) Integration:** Designed as a self-contained unit, ready for integration
  into a larger MFE ecosystem, enhancing modularity and flexibility.
- **Webpack 5 & Module Federation:** Utilizes advanced bundling and module federation techniques to
  expose single or multiple components through a `remoteEntry` file, facilitating efficient
  component sharing and collaboration across MFEs.
- **Component Exposition and Sharing:** Exposes components for use by other MFEs, allowing for
  reusability and consistency across the larger application.
- **Scalable and Modular Architecture:** Designed for scalability, it supports the growing needs of
  large-scale applications by allowing easy integration of additional MFEs.

## Example: Configuring Webpack with Module Federation to Expose a Component

Here is an example of how to configure Webpack with Module Federation to expose a component:

```javascript
// webpack.config.ts
const ModuleFederationPlugin = require("webpack").container.ModuleFederationPlugin;
const path = require("path");

module.exports = {
  ...
    plugins
:
[
  new ModuleFederationPlugin({
    name: "MyMicroFrontend",
    filename: "remoteEntry.js",
    exposes: {
      './MyComponent': './src/MyComponent',
    },
    shared: {
      react: {singleton: true},
      "react-dom": {singleton: true}
    },
  }),
],
...
}
;
```

In this configuration:

- `name`: The name of your MFE. This will be used by the host application to reference your MFE.
- `filename`: The name of the file that acts as the entry point for the host to load your MFE.
- `exposes`: An object mapping paths (as seen by the host) to the corresponding file paths in your
  source code. Here, `./MyComponent` is exposed for the host to import.
- `shared`: Lists packages that should be shared between the host and the MFE, like React and
  ReactDOM. The `singleton: true` ensures that only a single version of these shared modules is
  used.

This setup allows your MFE to expose `MyComponent`, which can be dynamically loaded by a host
application.

## Getting Started

### Prerequisites

- Node.js (version 20.x or higher)
- npm (version 6.x or higher)
- It is critical to set the reactTEXT_NPM_TOKEN and TR_NPM_TOKEN variables before running npm install.

  ***NPM token***
    1. Go to https://www.npmjs.com/
    2. Sign in with your TR/reacttext NPM login.
    3. Click on your user icon in the top right corner and go to Access Tokens.
    4. Click Generate New Token > Classic Token.
    5. Set API key as reactTEXT_NPM_TOKEN variable in your shell : `echo 'export reactTEXT_NPM_TOKEN=<YOUR_API_KEY>' >> ~/.zshrc`

  ***JFROG token***
    1. Go to https://npm/packages
    2. Sign in with SAML SSO
    3. Click on Welcome, \employee id in the top right corner
    4. Click Edit Profile
    5. Click Generate API Key
    6. Set API key as TR_NPM_TOKEN variable in your shell: `echo 'export TNPM_TOKEN='$(echo -n "<YOUR_ID>:<YOUR_API_KEY>" | base64)'' >> ~/.zshrc`

  ***Important:*** Run `source ~/.zshrc` to apply the changes.

  ***Note:*** If you are using bash shell, replace `~/.zshrc` with `~/.bashrc` in the above commands.

- MongoDB (see [here](#mongodb) for installation instructions)

### Installation

1. **Install Dependencies:**
   ```
   npm install
   ```

2. **Set Up Environment Variables:**

- Make a copy of the `example.env` file and rename it to `.env`:
  ```
  cp example.env .env
  ```
- Open the `.env` file and set your environment variables. This file will typically include
  configurations like API endpoints, secret keys, and other necessary settings.

3. **One-time setup:**
   ```
   npm run setup
   ```

4. **Start the Node.js Server:**
   ```
   npm start
   ```

## Running Tests

To ensure the reliability and stability of the application, a comprehensive suite of tests is
provided. To run these tests, execute the following command in the project root:

```
npm test
```

This command will run all unit tests defined in the project. It's recommended to run these tests
before pushing any changes to the repository.

## Building and Contributing MFEs

- Each MFE should be built using Webpack 5 and Module Federation.
- MFEs must expose the components to be used at runtime by the container app.

## Best Practices

- Ensure MFEs are loosely coupled and can operate independently.
- Maintain consistency in design and user experience across different MFEs.
- Regularly update dependencies to leverage the latest features of Webpack and React.

## Communication between MFEs

Micro Frontends (MFEs) are a design approach in which a web application is composed of
semi-independent "micro" applications, each potentially owned by different teams and built with
their preferred frameworks or technologies. Communication between these MFEs is crucial for
maintaining a cohesive user experience and ensuring that each component can effectively share data
and state changes.

### Using `useMFECommunication` Hook for MFE Communication

The `useMFECommunication` React hook facilitates communication between MFEs, especially when they
are served from different domains or origins, where traditional methods like the Broadcast Channel
API are not feasible. This hook leverages the `window` object's ability to dispatch and listen for
custom events, thus enabling cross-origin communication in a secure and controlled manner.

#### How to Implement:

1. **Define the Hook:**

- Import `useMFECommunication` in your MFE's components where you need to send or receive data.

2. **Sending Data:**

- Use the `sendEvent` function provided by the hook to dispatch a custom event with the desired
  data payload.

   ```typescript
   const sendEvent = useCustomWindowEvent<MyCustomEventData>('myEventName');
   sendEvent({message: 'Hello from MFE1'});
   ```

3. **Receiving Data:**

- Register a callback function to handle incoming data when a specific event is received.

   ```typescript
   useCustomWindowEvent<MyCustomEventData>('myEventName', (data) => {
  console.log('Received data:', data.message);
  // Additional logic to handle the received data
  });
   ```

## Using this Repository as a Template

1. **Clone the Existing Repository:**
   First, clone the existing repository to your local machine.
   ```
   git clone [existing repository URL] existing-repo
   ```
   Replace `[existing repository URL]` with the URL of the repository you want to clone.

2. **Create a New Directory for the New Repository:**
   Create a new directory on your local machine where you will initialize the new Git repository.
   ```
   mkdir new-repo
   cd new-repo
   ```

3. **Copy the Files:**
   Copy all the files from the cloned repository (`existing-repo`) to the new
   directory (`new-repo`). You can use the following command:
   ```
   cp -R ../existing-repo/* .
   ```
   This command copies all files and folders, including hidden ones (like `.gitignore`),
   from `existing-repo` to the current directory (`new-repo`). The `-R` flag ensures that
   directories are copied recursively.

4. **Remove the Old .git Directory:**
   If you want to completely disassociate this copy from the original repository (for example, if
   you're starting a new project based on an old one), you should remove the `.git` directory
   in `new-repo`. This can be done with:
   ```
   rm -rf .git
   ```
   If you plan to keep the history and association with the original repository, skip this step.

5. **Initialize a New Git Repository:**
   Initialize a new Git repository in `new-repo`:
   ```
   git init
   ```

6. **Add and Commit the Files:**
   Now, add all the copied files to the new repository and make an initial commit:
   ```
   git add .
   git commit -m "Initial commit"
   ```

7. **Link to a New Remote Repository:**
   Create a new repository on your preferred Git hosting service (e.g., GitHub, GitLab) and link it
   to your local repository:
   ```
   git remote add origin [new repository URL]
   ```
   Replace `[new repository URL]` with the URL of your new remote repository.

8. **Push to the New Repository:**
   Finally, push the files to the new repository:
   ```
   git push -u origin master
   ```

## MongoDB
- Install mongo:
  - To install manually on macOS: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/
  - To install manually on Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/

### When installing Mongo without brew:

- Mongo requires a directory path to store data by default it looks for '/data/db', so create that via `sudo mkdir -p /data/db` or point to
   different path when starting mongo
 - Be sure the above dir has your user permissions and not root
 - If not started, start the mongo daemon in a terminal window `mongod` or `mongod --dbpath /User/path/to/mongodb/data/db`

### When installing Mongo with brew:

- After installing, run `brew services start mongodb-community`

- Optional: Install [Robo 3T](https://robomongo.org/download) or [Compass](https://www.mongodb.com/try/download/compass) for browsing Mongo DB data

## Additional Information

- [Database schemas](doc/db.md)
- [Troubleshooting](doc/troubleshooting.md)
