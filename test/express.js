/**
 * AUTH Token test for Express.js
 *
 */


const authtoken = require("../index");
const app = require("express")();

app.use(new authtoken.express());
app.listen(8000);

app.get("/services", (req, res, next)=>{
    res.json({name: "REST API", "version":"1.0.0"});
});

app.get("/exa1", (req, res, next)=>{
   res.json({name: "exa1", version: "1.0.0"});
});

app.get("/exa2", (req, res, next)=>{
    res.json({name: "exa2", version: "1.0.0"});
});