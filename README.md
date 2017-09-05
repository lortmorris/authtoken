# Authtoken
This is the easy way for add support to app key and tokens access to your REST Applications.

Powered by: [Cesar Casas](https://ar.linkedin.com/in/cesarcasas "Linkedin")
# Install

```bash
hostname$ npm install authtoken --save
```
# Implement
## Express.js
This is a Express.js example

```js

const authtoken = require('authtoken');
const app = require('express')();

app.use(new authtoken({
  mongodb: dbInstance
}));
app.listen(8000);

app.get("/services", (req, res, next)=> res.json({ name: 'REST API', version: '1.0.0' }));
app.get("/exa1", (req, res, next)=> res.json({ name: 'exa1', version: '1.0.0' }));
app.get("/exa2", (req, res, next)=> res.json({ name: 'exa2', version: '1.0.0' }));

```

## Create new API KEY.
Default collection: "keys".
Example field:
```js
{
    "_id" : ObjectId("5703e7392665bb1e424ba981"),
    "apikey" : "abc789",
    "secret" : "secretito", //secret token
    "ratelimit" : 7 //rate limit
}
```

## Debug
```bash
hostname$ DEBUG=authtoken* node app.js
```
# Settings
```js
{
    mongodb: 'authtoken', // mongodb url connection
    startupMessage: 'AUTH SERVICE NOT READY!, RETURN IN FEW SECONDS!', // msg error
    redisConnection: '',// redis url connection
    collections: ['tokens', 'keys'], // collectiosn for tokens and keys
    refreshKeys: 10, // second refresh key
    rateLimit: 100, // default rate limit
    base: '/services', // base api url
    excludes:['/exa1', '/exa2'], // exclude directories
    forcelogin: false // is true, all request require login, if false, onlye need api key in header
  }
```

### config redis
you can use redis sentinel, just pass like argument a array with {host, port} properties.

```js
"redisConnection": [{host: '127.0.0.1', port: 26379},{host: '127.0.0.1', port: 26380}];
```  

# Methods

Using the header "tokenservice" for run methods into library.

## login
Require 2 headers, "apikey" and "secret".
The system return the header "status". If login ok, status header is "logged", else "error".

Example:
```js
const https = require('https');
var options = {
  hostname: 'www.website.com',
  port: 80,
  path: '/',
  method: 'POST',
  headers: {
    'tokenservice': 'login',
    'apikey': "asdkkeb123kjk98365ben978h1bb4bja82ubb4889asdfn3n",
    'secret': "dk23ij8fhhhasd3oh9812b12d-12asdlk388hahsdkj3jlkk"
  }
};

var req = https.request(options, (res) => {
  console.log('statusCode: ', res.statusCode);
  console.log('headers: ', res.headers);

  res.on('data', (d) => {
    process.stdout.write(d);
  });
});
req.end();

req.on('error', (e) => {
  console.error(e);
});
```

# TODO
- Add logout
- Add routes patterns
