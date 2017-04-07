"use strict";

var fs = require("fs")
var path = require("path")
var sanitize = require("sanitize-filename")
var dir = "file"

function DefaultFile(req, res){
    var DIR=process.cwd()
    Log("DefaultFile:",req.path,".")
    var tmp = req.path.split("/").map(sanitize)
    var p = path.join(DIR, "file", req.path.split("/").map(sanitize).join(path.sep))
    if (fs.existsSync(p)) {
        res.sendFile(p, function(err) {
            if (err) res.status(404).send("<H1>404 File not Found</H1>")
        })
    } else {
        var sym = path.join(DIR,"file",req.path+".symlink")
        if (fs.existsSync(sym)) {
            var file = fs.readFileSync(sym, "utf8")
            if (file[0] != "/") {
                file = path.join(DIR, path.sep + dir + path.sep , file)
            }
            if (fs.existsSync(file)) {
                res.sendFile(file, function(err) {
                    if (err) res.status(404).send("<H1>404 File not Found</H1>")
                })
            } else {
                res.status(404).send("<H1>404 File not Found</H1>")
            }
        } else {
            res.status(404).send("<H1>404 File not Found</H1>")
        }
    }
}

module.exports = function(app,express,options) {
    if (options && typeof options == "string") {
        dir = options.split("/").join(path.sep)
    }
    Log("service DefaultFile")
    app.use(DefaultFile)
}


