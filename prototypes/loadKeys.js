"use strict";
var debug = require("debug")("authtoken:prototypes:loadKeys");

/**
 * Load all api keys from DB and save to Redis storage
 * @returns {Promise.<T>}
 */
module.exports = function(){
    const self = this;

    debug("authtoken.loadKeys called");

    return new Promise((resolve, reject)=>{
        self.Keys.load()
            .then((keys)=>{
                let total  = keys.length;

                keys.forEach(function(a,b){

                    ((a)=>{
                        self.hset(a.apikey, "secret", a.secret)
                            .then(()=>{
                                return self.hset(a.apikey,"ratelimit", a.ratelimit);
                            })
                            .then(()=>{
                                return self.hset('_private-'+a.apikey, "limit",a.ratelimit);
                            })
                            .then(()=>{
                                return self.expire('_private-'+a.apikey, 60*60);
                            })
                            .then(()=>{
                                return self.hset('_private-'+a.apikey, "trq", 0);
                            })
                            .then(()=>{
                                total--;
                                if(total==0) resolve();
                            })
                        .catch((err)=>{
                                reject(err);
                            })
                    })(a, total);

                });

            }, reject)
    })
        .catch((err)=>{
            debug("Catch: Error loadKeys: "+err.toString());
        });
};
