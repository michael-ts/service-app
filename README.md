webapp and default file service plug-in for express-modular-server
==================================================================

This is a plug-in for [express-modular-server](https://github.com/michael-ts/express-modular-server/).  It provides two services: first, to serve the `app.html` file from the current directory in response to requests to URLs beginning with `/app/`, and second, to treat any URL not recognized by any other endpoint as a request for a file of the same name.  As such, this plug-in should be loaded last.  The app.html file is intended to be a webapp wrapper file which parses the URL to determine which app to run and any parameters to pass to it on startup.

As of version 2, the logic for locating files has been changed to integrate with the [webapp-app](https://github.com/michael-ts/webapp-app) package which provides the app.html file referenced above.  This change allows each web app to be installed directly from npm as its own separate package.  To accomplish this, instead of looking in a static directory for requested files, a directory of webapp files is constructed at startup by looking for all installed webapps (package name starting with "webapp-") in node_modules/ under the current directory.

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

# Copyright

Written by Michael Schmidt.

# License

GPL 3.0
