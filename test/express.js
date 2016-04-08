/**
 * AUTH Token test for Express.js
 *
 */


const authtoken = require("../index");
const app = require("express")();

app.use(new authtoken.express());
app.listen(1234);