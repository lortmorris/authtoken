/**
 * AUTH Token test for Express.js
 *
 */


const authtoken = require("../index");
const app = require("express")();

app.use(new authtoken.express());
app.listen(1234);

app.get("/", (req, res, next)=>{
    res.json({name: "REST API", "version":"1.0.0"});
});