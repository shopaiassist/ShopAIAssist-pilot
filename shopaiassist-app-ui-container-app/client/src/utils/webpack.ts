/** Dirty hack to make typescript happy with the global variables that are exposed by Webpack 5's module federation. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const __webpack_init_sharing__: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const __webpack_share_scopes__: any;

/**
 * Webpack module federation utility function that will load a component from a remote (after the 'remoteEntry' script has been dynamically fetched and loaded).
 * When an application is built with Webpack 5 and module federation, the remoteEntry script will expose a global variable that contains the remote's scope.
 * This function will use that scope to load the component from the remote.
 *
 * Important to have default export for microfrontend to work with module federation!!
 * The module being exposed in webpack.config.ts is the default export
 *
 * Example (from webpack.config.ts):
 *     ...
 *     plugins: [
 *         new ModuleFederationPlugin({
 *             name: 'remote_react_module', <----- This is the scope
 *             filename: 'RemoteEntry.js',
 *             exposes: {
 *                 './App': './src/App.tsx', <----- This is the module (./App) must have a default export!!
 *             },
 *     }),
 *     ....
 *
 * Also, import the public path in output is set to auto
 *
 *   output: {
 *     path: path.resolve(__dirname, 'dist'),
 *     publicPath: 'auto',
 *   },
 *
 * @param scope
 * @param module
 * @param elementId
 */
export const loadComponent = (scope: string, module: string, elementId?: string) => {
  return async () => {
    // Initializes the share scope. This fills it with known provided modules from this build and all remotes
    await __webpack_init_sharing__('default');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const container = (window as any)[scope];
    if (!container) {
      const message = `${
        Object.prototype.hasOwnProperty.call(window, scope)
          ? 'Empty container (' + container + ') defined'
          : 'No container present'
      } for scope '${scope}' in module ${module}.`;
      return { default: () => `Error: ${message}` };
    }
    // Initialize the container, it may provide shared modules
    await container.init(__webpack_share_scopes__.default);
    const factory = await container.get(module);
    const Module = factory();

    if (!!elementId && document.getElementById(elementId) !== null) {
      // Bootstrap the Angular application
      Module.default(document.getElementById(elementId));
    }

    return Module;
  };
};
