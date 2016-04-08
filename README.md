# authtoken
This is the easy way for add support to app key and tokens access to your REST Applications.

# Install

```
hostname$ npm install authtoken --save
```

# Config
authtoken use config library. You can edit the config/default.json file or create you own config file and set a new NODE_ENV
 
# Methods

Using the header "tokenservice" for run methods into library.

## login
Require 2 headers, "apikey" and "secret".

Example:
```
var options = {
  hostname: 'www.website.com',
  port: 443,
  path: '/',
  method: 'POST',
  headers: {
    'tokenservice': 'login',
    'apikey': "asdkkeb123kjk98365ben978h1bb4bja82ubb4889asdfn3n",
    'secret': "dk23ij8fhhhasd3oh9812b12d-12asdlk388hahsdkj3jlkk"
  }
};

``` 


## logout
