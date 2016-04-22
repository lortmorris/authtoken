"use strict";
var debug = require("debug")("authtoken:prototypes:login");
/**
 * Login method.
 * @param {string} apikey - The client api key
 * @param {string} secret - The client Secret Token
 * @param {object} res - Response object (transport method).
 * @returns {Promise}
 */
module.exports  = function (apikey, secret, res) {

    const self = this;
    debug("authtoken.login");

    return new Promise((resolve, reject)=>{
        self.context.redis.hget(apikey, "secret", (a, b)=>{
            if(a) reject("Bad API Key");
            else{
                if(b===secret){
                    var st = self.generateSecretToken();
                    self.context.redis.hset(st, "trq", 0, ()=>{
                        self.context.redis.hget(apikey, "ratelimit", (err, ratelimit)=>{
                            self.context.redis.hset(st, "limit", ratelimit, ()=>{
                                self.context.redis.expire(st, 60*60);
                                resolve(st);
                            });//end set limit
                        }); //end get ratelimit
                    });//end set trq
                }else reject("Bad Secret Token");
            }//end else
        })
    });
};


