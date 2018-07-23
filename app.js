"use strict";

var fs = require("fs")
var path = require("path")

/*
  We are going to have to do this all over because apparently
  npm install rudely deleted all my hard work!

  Here is what we must do.
  At startup, scan through all directories in node_modules.
  Find all directories which start with "webapp-".
  In those, scan the directory and find all files not named
  "package.json" or "README.md".
  Now map each filename found to the directory it is found in
  relative to the current directory.
  Change Server() and DefaultFile to look up the directory
  to search the file from this mapping.
  (Note, we may need to search ancestral node_modules
  directories as well!)
*/
var err404 = "<H1>404 File not Found</H1>"
function DefaultFile(req, res) {
    var file = req.path.split("/")
    file = file[file.length-1]
    if (file in dir) {
	res.sendFile(dir[file])	
    } else {
	res.status(404).send(err404)
    }
}

function Server(req,res,next) {
    res.sendFile(dir[servedfile])
}
var dir = { }

var p = path.resolve(".")
while (true) {
    if (fs.existsSync(p+path.sep+"node_modules")) {
	var tmp = fs.readdirSync(p+path.sep+"node_modules")
	    .filter(file=>{
		return file.slice(0,7) == "webapp-"
		    && fs.statSync(p+path.sep+"node_modules"+path.sep+file).isDirectory()
	    })
	    .map(file=>{
		var file0=file
		var files = fs.readdirSync(p+path.sep+"node_modules"+path.sep+file).filter(file=>{
		    var ret =  file != "package.json"
			&& file != "README.md"
			&& file.slice(-1) != "~"
			&& !fs.statSync(p+path.sep+"node_modules"+path.sep+file0+path.sep+file).isDirectory()
		    if (ret) dir[file] = p+path.sep+"node_modules"+path.sep+file0+path.sep+file
		})
		
		//console.log(p+path.sep+"node_modules"+path.sep+file)
		//console.log(files)
	    })
    }
    if (p == path.sep) break
    p = path.resolve(p+path.sep+"..")
}

    console.log(dir)
    
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
    Log("service DefaultFile")
    app.use(endpoint, Server)
    app.use(DefaultFile)
}
