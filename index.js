"use strict";

var fs = require("fs")
var path = require("path")
var mime = require("mime-types")
var sanitize = require("sanitize-filename")
var os = require("os")
var HOME=os.homedir()

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
/*
function DefaultFile(req, res) {
    var file = req.path
    if (file[0] == "/") file = file.slice(1)

    if (file == "") file = "index.html"
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
			} else if (fs.existsSync(file2+path.sep+"index.html")) {
			    res.sendFile(file2+path.sep+"index.html")
			} else {
			    res.status(404).send("404 File not found")
			} 
			return
		    } else if (st.isFile()) {
			res.sendFile(file2,{maxAge:864000000})
			return
		    } 
		} else {
		    console.log(`Not found:${file2}`)
		}
	    }
	}
	res.status(404).send(err404)
    }
}
*/

function Server(req,res,next) {
    console.log("app:",servedfile)
    res.sendFile(files[servedfile])
}
/*
var dir = { }, vdir = { }
global.service_app_vdir = vdir
*/

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
		    //console.log("found apparent symlinked path",fullpath)
		    yield fullpath
		} else {
		    //console.log("found directory",fullpath)
		    yield fullpath
		}
	    }
	    if (stat.isSymbolicLink()) {
		//console.log("found symlink",fullpath)
		yield fullpath
	    }
	} catch (e) {
	}
    }
    return false
}

var p = path.resolve(".")
/*
async function do_init(dir0) {
    //if (!fs.existsSync(dir0+"/content")) return
    //console.log(`walking ${dir0}`)
    var walk = walker(dir0)
    //console.log("walk",dir0)
    var next = {done:false}
    while (true) {
	next = walk.next()
	if (next.done) break
	if (typeof next.value == "string") { 
	    //var file = next.value.slice(dir0.length+1)+"/"
	    //console.log("adding vdir ",file)
	    //vdir[file] = next.value
	} else {
	    var fullpath = next.value.path+"/"+next.value.name
	    var file = fullpath.slice(dir0.length+1)
	    var parts = file.split("/"), plen = parts.length-1
	    if (parts[plen] == "package.json") continue
	    if (parts[plen] == "README.md") continue
	    if (parts[plen].slice(-1) == "~") continue
	    if (parts[0] == ".git") continue
	    console.log(`adding map ${file} -> ${fullpath}`)
	    dir[file] = fullpath
	}
    }
}
*/

var endpoint = "/app/"
var servedfile = "app.html"
var files = { }

function DefaultFile(req,res) {
    var file = req.path.slice(1)
    if (!(file in files)) {
	res.status(404).send("404 File not found")
	return
    }
    res.sendFile(files[file])
}

function ProcessWebAppDir(app,path0,fn) {
    var wa_path = path0+path.sep+fn
    console.log("map: ",wa_path)
    if (ProcessConfig(app,wa_path)) return
    var tmp2 = fs.readdirSync(wa_path)
	.map(file2=> {
	    if (file2 == ".git") return false
	    if (file2 == "node_modules") return false
	    if (file2 == "package.json") return false
	    if (file2 == "README.md") return false
	    if (file2.slice(-1) == "~") return false
	    var x= wa_path+path.sep+file2
	    var stat = fs.existsSync(x) && fs.statSync(x)
	    if (stat && stat.isDirectory()) {
		RouteAdd(app,file2,wa_path+path.sep+file2+path.sep)
	    } else if (stat && stat.isFile()) {
		files[file2] = wa_path+path.sep+file2
		console.log(file2,"->",wa_path+path.sep+file2);
	    }
	})
}

function RouteAdd(app,file,dest) {
    console.log(file,"=>",dest);
    app.get(path.sep+file+path.sep+"*", (req,res) => {
	//console.log(`path=${req.path} => ${dest}`)
	var sub = dest+req.params[0].split("/").map(sanitize).join("/")
	console.log(sub)
	res.sendFile(sub)
    })
}



function Interpolate(wa_path,str) {
    /*
      ${HOME} -> user's home directory
      ${module} -> package "module"'s top-level directory
    */
    var base = path.dirname(require.resolve(`${wa_path}/package.json`))
    console.log(`Interpolate ${wa_path}, ${str}`)
    try {
	return str.replace(/(?:\$\{)(.*?)\}/g, (a,b) => {
	    if (b == "HOME") return HOME
	    try {
		// first try the node_modules directory of the module being loaded
		return path.normalize(path.dirname(require.resolve(`${base}/node_modules/${b}/package.json`)))
	    } catch (e) {
		// if that fails, try the regular search path
		return path.normalize(path.dirname(require.resolve(`${b}/package.json`)))
	    }
	})
    } catch (e) {
	console.log(`interpolate: ${e}`)
	return ""
    }
}

function ProcessConfig(app,wa_path) {
    var conf = wa_path+path.sep+"webapp.cfg"
    if (!fs.existsSync(conf)) return false
    try {
	var i,config = JSON.parse(fs.readFileSync(conf))
	for (i in config) {
	    config[i] = Interpolate(wa_path,config[i])
	    if (!config[i]) continue
	    // i thought of another variable besides HOME which could be useful, what was it?
	    var isDir = i.slice(-1) == "/" || config[i].slice(-1) == "/"
	    var isAbs = config[i].slice(0,1) == "/"
	    var dest, i0=i
	    if (config[i].slice(-1) == "/") config[i] = config[i].slice(0,-1)
	    if (isAbs) {
		dest = config[i]
	    } else {
		dest = fs.realpathSync(wa_path+path.sep+config[i])
	    }
	    if (i0.slice(-1) == "/") i0 = i0.slice(0,-1)
	    
	    if (isDir) {
		RouteAdd(app,i0,dest+path.sep)
	    } else {
		console.log(`${i} -> ${dest}`)
		files[i0] = dest
	    }
	}
	return true
    } catch (e) {
	console.log(`error ${e}`)
	return false
    }
}

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
    var appdir = p
    while (true) {
	var path0 = p+path.sep+"node_modules"
	console.log(`l00king for ${path0}`)
	if (fs.existsSync(path0)) {
	    var tmp = fs.readdirSync(path0)
		.filter(file=>{
		    return file.slice(0,7) == "webapp-"
			&& fs.statSync(path0+path.sep+file).isDirectory()
		})
		.map(fn=>ProcessWebAppDir(app,path0,fn))
	}
	if (p == path.sep) break
	p = path.resolve(p+path.sep+"..")
    }
    ProcessConfig(app,appdir)
    app.use(endpoint, Server)
    app.use(DefaultFile)
}

