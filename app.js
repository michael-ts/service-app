"use strict";

var fs = require("fs")
var path = require("path")

function Server(req,res,next) {
    res.sendFile(path.join(process.cwd(),servedfile))
}

var endpoint = "/app/"
var servedfile = "app.html"

module.exports = function(app,express,options,file) {
    if (options && typeof options == "string") {
	endpoint = options
    }
    if (file && typeof file == "string") {
	servedfile = file
    }
    Log("service app ",endpoint,",",servedfile)
    app.use(endpoint, Server)
}
