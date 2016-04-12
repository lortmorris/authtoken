"use strict";

const debug = require("./fdebug")("authtoken:main");
const redis = require('redis');
const EventEmitter = require('events').EventEmitter;
const utils = require('util');
const config  = require("config");
const shortid = require('shortid');
const crypto = require('crypto');

//own library
const Keys = require("./lib/Keys");


/**
 * authtoken main function.
 * @returns {Function|*}
 */
function authtoken(){


    const self = this;
    const params = config.get(process.env.NODE_ENV || "default");


    self.params = {
        mongodb: params.mongodb  || "authtoken",
        startupMessage: params.startupMessage || "Waiting for AUTH Service...",
        redis: params.redisConnection || "",
        refreshKeys: params.refreshKeys || 60,
        base : params.base || "/",
        excludes: [].concat(params.excludes) || []
    };


    self.collections = params.collections || ['tokens', 'keys'];


    self.context = {
        mongodb: require("mongojs")(self.params.mongodb, self.collections),
        redis: redis.createClient(self.params.redis)
    };



    self.context.redis.on("error", function (err) {
        debug("Redis.error " + err);
    });

    self.context.redis.on("connect", function () {
        debug("Redis.connect ");
    });





    self.Keys = new Keys(self.context);
    self.ready = false;
    self.on('keysLoaded', ()=>{ self.ready = true; });


    const init = ()=>{
        self.loadKeys()
            .then(()=>{
                debug("Keys loaded");
                self.emit('keysLoaded');
            })
            .catch((err)=>{
                debug("Reject Starting: "+err);
                self.params.startupMessage="AUTH Error: starting faild.";
            });
    }//end init


    self.interval = setInterval(()=>{
        self.loadKeys()
            .catch(()=>{
                self.ready=false;
            });
    }, self.params.refreshKeys * 1000);

    init();

    self.mws = function (req, res, next, who){

        var who = who || "express";
        return new Promise((resolve, reject)=>{


                if(self.ready){

                    if(req.headers.tokenservice && req.headers.tokenservice=="login") {
                        self.login(req.headers.apikey || "", req.headers.secret || "", res)
                            .then((secretToken)=>{
                                res.set("secret-token", secretToken);
                                self.send(res, "Login OK");
                            })
                            .catch((err)=>{
                                debug("catch KLKTR43: "+err.toString());
                                return self.sendError(res, err);
                            })
                    }else{
                        self.check(req, res)
                            .then((razon)=>{
                                debug("pass, next callend: "+razon);
                                if(who=="express") next();
                                else resolve(razon);

                            })
                            .catch((err)=>{
                                debug("Catch Check: "+err.toString());
                                self.sendError(res, err);
                                reject();
                            });
                    }//end else

                }else{
                    return res.end(self.params.startupMessage);
                }//end else
        });

    };



    return this.mws;
};

utils.inherits(authtoken, EventEmitter);


authtoken.prototype.sendError = (res, err)=>{
    res.end(JSON.stringify({Error: true, msg: err, timestamp: new Date().getTime()}));
};

authtoken.prototype.send = (res, msg)=>{
    res.end(JSON.stringify({Error: null, msg: msg, timestamp: new Date().getTime()}) );
};

authtoken.prototype.generateSecretToken = ()=>{
    return crypto.randomBytes(20).toString('hex')+'-'+shortid.generate();
};

/**
 * Check if request has auth or not.
 * @param {object} req - The Request object
 * @param {object} res - Response Object (transport method).
 * @returns {Promise}
 */
authtoken.prototype.check = function(req, res) {
    var self = this;

    var path =   req.path || req.url.pathname;



    return new Promise((resolve, reject)=>{

        if(self.params.base=="/") resolve("basepath /");

        else if(path.indexOf(self.params.base)==0){
            resolve("basepath inside");
        }else if(()=>{
                var r= false;
                self.params.excludes.forEach((v)=>{ if(path.indexOf(v)==0) r=true; });
                return r;
            }() ) resolve("inside excludes");

        else if(req.headers['secret-token']){

            self.context.redis.hget(req.headers['secret-token'],"trq", (err,trq)=>{

                if(err) return reject("Error RDS10020");

                self.context.redis.hget(req.headers['secret-token'], "limit", (err, limit)=>{

                    if(err) return reject("Error RDS10030");

                    trq = parseInt(trq);
                    trq++;


                    if(trq==parseInt(limit)){
                        reject("Too many request");
                    }else{

                        self.context.redis.hset(req.headers['secret-token'], "trq", trq, (err)=>{
                            if(err) reject("Error TRQ29900");
                            else resolve();
                        });

                    }//end else request limit

                }); //end hget
            });//end hget

        }else reject("Need 'secret-token' header");

    });

};


/**
 * Login method.
 * @param {string} apikey - The client api key
 * @param {string} secret - The client Secret Token
 * @param {object} res - Response object (transport method).
 * @returns {Promise}
 */
authtoken.prototype.login  = function (apikey, secret, res) {

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


/**
 * Load all api keys from DB and save to Redis storage
 * @returns {Promise.<T>}
 */
authtoken.prototype.loadKeys = function(){
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
                                total--;
                                if(total==0) resolve();

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




module.exports.express = authtoken;

/**
 * La villada de Hapi, the most ugly framework :p
 * @type {{register: Function}}
 */
module.exports.hapi = {
    register: function(server, options, next){

        var authtoken = new module.exports.express();
        server.ext({
            type: 'onRequest',
            method: function (request, reply) {
                var response = null;

                var emul = {
                    "set": function(k,v){
                        debug("emul.set called: "+k+" "+v);
                        if(!response) reply().header(v, k).hold();
                        else { response.headers[k] = v; }
                    },
                    "end": (buff)=>{
                        debug("emul.end called: "+buff);
                        if(!response) response= reply().header("authtoken", "error").hold();
                        response.source = buff;
                        response.send();
                    }
                };


                authtoken(request, emul, reply.continue, "hapi")
                .then((razon)=>{
                        debug("final hapy: "+razon)
                        reply.continue();
                    })



            }//end method
        });

        next();
    }//end register
};

module.exports.hapi.register.attributes ={
    name: "AUTHToken"
};