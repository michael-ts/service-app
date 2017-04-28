webapp and default file service plug-in for express-modular-server
==================================================================

This is a plug-in for [express-modular-server](https://github.com/michael-ts/express-modular-server/).  It provides two services: first, to serve the `app.html` file from the current directory in response to requests to URLs beginning with `/app/`, and second, to treat any URL not recognized by any other endpoint as a request for a file of the same name.  As such, this plug-in should be loaded last.  The app.html file is intended to be a webapp wrapper file which parses the URL to determine which app to run and any parameters to pass to it on startup.

If a string option is presented upon initialization, it is the path to the directory containing static files available to be served.  If this option is not present,  a directory `files` in the current directory will be used.

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

In this example, the a path relative to the current directory is used for serving file, specifically from the directory "static-content":


    var server = require("express-modular-server")({
         http:true
       })
        // other API calls here
        .API("app","static-content")
        .start()

# Copyright

Written by Michael Schmidt.

# License

GPL 3.0
