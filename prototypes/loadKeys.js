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
                        self.context.redis.hset(a.apikey, "secret", a.secret, ()=>{
                            self.context.redis.hset(a.apikey,"ratelimit", a.ratelimit, ()=>{
                                self.context.redis.hset('_private-'+a.apikey, "limit",a.ratelimit ,()=>{
                                    self.context.redis.expire('_private-'+a.apikey, ()=>{
                                        self.context.redis.hset('_private-'+a.apikey, "trq", 0, ()=>{
                                            total--;
                                            if(total==0) resolve();
                                        });

                                    });

                                });

                            });
                        });

                    })(a, total);
                });

            }, reject)
    })
        .catch((err)=>{
            debug("Catch: Error loadKeys: "+err.toString());
        });
};
