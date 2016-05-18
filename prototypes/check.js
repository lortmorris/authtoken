"use strict";

var debug = require("debug")("authtoken:prototypes:check");

/**
 * Check if request has auth or not.
 * @param {object} req - The Request object
 * @param {object} res - Response Object (transport method).
 * @returns {Promise}
 */

module.exports =function(req, res) {
    var self = this;
    var path =   req.path || req.url.pathname;

    return new Promise((resolve, reject)=>{


        //check basepath
        if(path.indexOf(self.params.base)!=0){
            resolve("basepath not inside");
            return;
        }

        //check excludes
        if ( ( ()=> {
                var r = false;
                self.params.excludes.forEach((v)=> {
                    if (path.indexOf(v) == 0) r = true;
                });
                return r;
            })() ) { resolve("inside excludes"); return; }


        if(self.params.forcelogin && !req.headers['secret-token']) { reject("secret-token is required"); return; }
        if(self.params.forcelogin==false && !req.headers['apikey']) { reject("apikey is required"); return; }


        if(self.params.forcelogin){
            var key = req.headers['secret-token'];
        }else{
            var key = "_private-"+req.headers['apikey'];
        }


        debug("current key: "+key);

        let trq, limit;
        self.hget(key, "trq")
            .then((trq)=>{
                trq = trq;
                return self.hget(key, "limit");
            })
            .then((limit)=>{
                limit = limit;
                trq = parseInt(trq);
                trq++;

                if (trq == parseInt(limit)) {
                    reject("Too many request");
                    return Promise.resolve();
                }else {
                    return self.hset(key, "trq", trq);
                }

            })
        .then(()=>{
                resolve();
            })
        .catch((err)=>{
               reject(err);
            });

    });

};
