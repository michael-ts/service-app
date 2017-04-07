"use strict";

var fs = require("fs")
var path = require("path")
var sanitize = require("sanitize-filename")
var dir = "file"

function DefaultFile(req, res){
    var DIR=process.cwd()
    Log("DefaultFile:",req.path,".")
    var path = req.path.split("/").map(sanitize).join(path.sep)
    var p = path.join(DIR, "file", req.path)
    if (fs.existsSync(p)) {
	res.sendFile(p)
    } else {
	var sym = path.join(DIR,"file",req.path+".symlink")
	if (fs.existsSync(sym)) {
	    var file = fs.readFileSync(sym, "utf8")
	    if (file[0] != "/") {
		file = path.join(DIR, path.sep + dir + path.sep , file)
	    }
	    if (fs.existsSync(file)) {
		res.sendFile(file)
	    } else {
		res.send("404 File not Found "+file)
	    }
	} else {
	    res.send("404 File not Found")
	}
    }
}

module.exports = function(app,express,options) {
    if (options && typeof options == "string") {
	dir = options
    }
    Log("service DefaultFile")
    app.use(DefaultFile)
}
