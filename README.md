webapp and default file service plug-in for express-modular-server
==================================================================

This is a plug-in for [express-modular-server](https://github.com/michael-ts/express-modular-server/).  It provides two services: first, to serve the `app.html` file from the current directory in response to requests to URLs beginning with `/app/`, and second, to treat any URL not recognized by any other endpoint as a request for a file of the same name.  As such, this plug-in should be loaded last.  As of express-modular-server version 2.0 this is the default.  The app.html file is intended to be a webapp wrapper file which parses the URL to determine which app to run and any parameters to pass to it on startup.

The logic for locating files integrates with the [webapp-app](https://github.com/michael-ts/webapp-app) package which provides the app.html file referenced above.  This change allows each web app to be installed directly from npm as its own separate package.  

At startup, service-app scans for files and directories to serve.  It starts by looking for/in the `node_modules` sub-directory both of the top-level module (the app being run) and every directory above that.   It looks for modules which begin with the name `webapp-`.  For each one it finds, it looks in the module's directory for a file named `webapp.cfg` in JSON format.  If it finds it, it parses it according to the mapping scheme listed below.  Otherwise, it simply takes each file in that directory not excluded (see "Exclusions" below) and maps it as a root-level request.   For example, "test.js" in the module directory would be served whenever a URL for "/test.js" is received.  Sub-directories in the `webapp-` folder will not be mapped in this case.

In addition to looking for `webapp.cfg` in each `webapp-` directory it finds,  it will also look for and if it exists use `webapp.cfg` in the directory of the top-level module.  This file will be processed last, overriding any entries with the same key in previously loaded modules.

## Mapping

Files and directories can be mapped from request URL to underlying file served.  The mapping is stored in an object.  Each key in the object is the name of a path - if it ends in a slash it is treated as a directory and will be mapped to a directory, otherwise it is treated as a file and will be mapped as a file.  The value is the full path to the local directory or file.

Relative paths in the target are relative to the module containing the `webapp.cfg` file.

For files, the mapping results directly in the file to be served when the corresponding URL path is requested.  For a directory, all requests that begin with that directory are mapped to the target directory.    The path need not be complete, as sub-directories under the target will map directly.  For instance, if this mapping is present:

    "/assets/images/":"../../../images"
   
   A request for `/asset/images/img1.jpg` would translate into a request for `../../../images/img1.jpg` related to the module folder, while `/asset/images/01/img1.jpg` would translate to a request for `../../../images/01/img1.jpg`.  Any additional components in the requested path are sanitized to prevent injections of paths above the based path mapped to.


## Exclusions

Keys in the mapping which begin with the tilde character (~) and have a value of `true` specify exclusions.  To cancel an exclusion set the value to false. These contain regular expressions, if the expression matches a file being auto-scanned for inclusion in the mapping then the file is excluded.

The default exclusion is to omit files named `package.json` or `README.md`, directories named `.git`, and files ending in a tilde.

# Install

    npm install service-app

# Usage

The following example loads the `app` module with the default path:

    var server = require("express-modular-server")({
         http:true
       })
        // other API calls here
        .API("app")
        .start()

Note that this is no longer necessary with [express-modular-server](https://github.com/michael-ts/express-modular-server/) - if the autoload parameter is provided and this package is installed, it will be loaded automatically:

    var server = require("express-modular-server")({
         http:true,
         autoload: true
       }).start()


# Copyright

Written by Michael Schmidt.

# License

GPL 3.0
