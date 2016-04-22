/**
 * AUTH Token test for Express.js
 *
 */



const authtoken = require("../index");
const app = require("express")();
const debug=require("debug")("authtoken:express");


function exampleExpress(port){

    var port = port  || 8000;
    debug("Express.js example called on port: "+port);

    app.use(new authtoken.express());
    app.listen(port);

    app.get("/", (req, res, next)=>{

        res.end("Hello!");
    });

    app.get("/services", (req, res, next)=>{
        res.json({name: "REST API", "version":"1.0.0"});
    });

    app.get("/exa1", (req, res, next)=>{
        res.json({name: "exa1", version: "1.0.0"});
    });

    app.get("/exa2", (req, res, next)=>{
        res.json({name: "exa2", version: "1.0.0"});
    });

};

if (require.main === module) {
    exampleExpress(8000);
} else {
    module.exports = exampleExpress;
}

