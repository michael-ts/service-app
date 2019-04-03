"use strict";

var fs = require("fs")
var path = require("path")
var mime = require("mime-types")

/*
  This module scans all directories in node_modules for modules starting with 
  "webapp-".  We exclude files "package.json", "README.md", all .git files,
  and all back files (ending in "~").  Otherwise, we put all files in the
  directory in the *dir* mapping, and all sub-folders in the *vdir* mapping.
  We serve these files we requested relative to /.
  If the API is invoked with show_dirs:true, e.g.
    .API("app",{show_dirs:true})
  then directories themselves will be returned as HTML with links to each file
  in the directory.

  The vdir mapping is exposed as the global variable service_app_vdir for other
  services that need to reference it.

  The vdir feature is new in version 2.1.0.
*/

var show_dirs  // if true, show directories in vdir
var err404 = "<H1>404 File not Found</H1>"
//var debug1
function DefaultFile(req, res) {
    var file = req.path
    if (file[0] == "/") file = file.slice(1)

    if (file in dir) {
	res.sendFile(dir[file])	
    } else {
	var i
	for (i in vdir) {
	    if (i==file.slice(0,i.length)) {
		var file0 = file.slice(i.length)
		var file2 = decodeURI(vdir[i]+path.sep+file0)
		if (fs.existsSync(file2)) {
		    var st = fs.statSync(file2)
		    if (st.isDirectory()) {
			if (show_dirs) {
			    var dir1 = fs.readdirSync(file2).map(file=>{
				var fp = fs.realpathSync(vdir[i])+path.sep+file0+path.sep+file
				var mt = mime.lookup(fp)
				if (fs.statSync(fp).isDirectory()) {
				    return `<A HREF="${file}/">${file}</A><BR>`
				} else if (mt && mt.slice(0,6) == "image/") {
				    return `<A HREF="${file}"><IMG src="/thumb/${i+file0+path.sep+file}"></A>`
				} else {
				    return `<A HREF="${file}">${file}</A><BR>`
				}
			    })
			    res.send("<!doctype html><html><head></head><body>"+dir1.join("\n")+"</body></html>")
			} else res.status(404).send("404 File not found")
			return
		    } else if (st.isFile()) {
			res.sendFile(file2)
			return
		    } 
		}
	    }
	}
	res.status(404).send(err404)
    }
}

function Server(req,res,next) {
    console.log("default:",servedfile)
    res.sendFile(dir[servedfile])
}
var dir = { }, vdir = { }
global.service_app_vdir = vdir

function* walker(dir) {
    var files = fs.readdirSync(dir)
    while (files.length) {
	var fn = files.shift()
	var fullpath = path.join(dir,fn)
	try {
	    var stat = fs.statSync(fullpath)
	    if (stat.isFile()) {
		//console.log("found file",fullpath)
		stat.path = dir
		stat.name = fn
		yield stat
	    } else if (stat.isDirectory()) {
		if (fullpath != fs.realpathSync(fullpath)) {
		    // WTF, why are we even here?
		    // We are NOT appending a slash to the end of our path,
		    // so the symlink should NOT be getting resolved.
		    // Yet this is exactly what we see. WTAF?!!!!!!!
		    //console.log("found sYmlink masquerading as a directory",fullpath,"->",fs.realpathSync(fullpath))
		    yield fullpath
		} else {
		    //console.log("found directory",fullpath)
		    yield* walker(fullpath)
		}
	    }
	    if (stat.isSymbolicLink()) {
		console.log("found symlink",fullpath)
		yield fullpath
	    }
	} catch (e) {
	}
    }
    return false
}

var p = path.resolve(".")
async function do_init(dir0) {
    //if (!fs.existsSync(dir0+"/content")) return
    var walk = walker(dir0)
    console.log("walk",dir0)
    var next = {done:false}
    while (true) {
	next = walk.next()
	if (next.done) break
	if (typeof next.value == "string") { 
	    var file = next.value.slice(dir0.length+1)+"/"
	    console.log("adding vdir ",file)
	    vdir[file] = next.value
	} else {
	    var fullpath = next.value.path+"/"+next.value.name
	    var file = fullpath.slice(dir0.length+1)
	    var parts = file.split("/"), plen = parts.length-1
	    if (parts[plen] == "package.json") continue
	    if (parts[plen] == "README.md") continue
	    if (parts[plen].slice(-1) == "~") continue
	    if (parts[0] == ".git") continue
	    console.log("adding dir ",file)
	    dir[file] = fullpath
	}
    }
}

while (true) {
    if (fs.existsSync(p+path.sep+"node_modules")) {
	var tmp = fs.readdirSync(p+path.sep+"node_modules")
	    .filter(file=>{
		return file.slice(0,7) == "webapp-"
		    && fs.statSync(p+path.sep+"node_modules"+path.sep+file).isDirectory()
	    })
	    .map(file=>{
		do_init(p+path.sep+"node_modules"+path.sep+file)
	    })
    }
    if (p == path.sep) break
    p = path.resolve(p+path.sep+"..")
}

var endpoint = "/app/"
var servedfile = "app.html"

module.exports = function(app,express,options,file) {
    if (options && typeof options == "string") {
	endpoint = options
    }
    if (typeof options == "object") {
	if ("endpoint" in options) endpoint = options.endpoint
	if ("show_dirs" in options) show_dirs = options.show_dirs
    }
    if (file && typeof file == "string") {
	servedfile = file
    }
    Log("service app ",endpoint,",",servedfile)
    Log("service DefaultFile")
    app.use(endpoint, Server)
    app.use(DefaultFile)
}
