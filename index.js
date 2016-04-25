"use strict";

const debug = require("./fdebug")("authtoken:main");
const redis = require('redis');
const utils = require('util');
const config  = require("config");
const shortid = require('shortid');
const crypto = require('crypto');
const sentinel = require('redis-sentinel');

//own library
const Keys = require("./lib/Keys");


/**
 * authtoken main function.
 * @returns {Function|*}
 */
function authtoken(who){
    this.who  = who || "express";
    var self = this;

    this.mws = function (req, res, next){

        debug("do request: ", req.path);


        return new Promise((resolve, reject)=>{
            if(self.ready){
                if(req.headers.tokenservice && req.headers.tokenservice=="login") {
                    debug("login");
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
                            debug("pass, next called: "+razon);
                            debug("who: "+self.who);
                            if(self.who=="express") {
                                next();
                                resolve();
                            }
                            else {
                                resolve(razon);
                            }

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

    return this.run();
};

require("./prototypes")(authtoken);


authtoken.prototype.run = function(){
    const self = this;
    const params = config.get(process.env.NODE_ENV || "default");


    self.params = {
        mongodb: params.mongodb  || "authtoken",
        startupMessage: params.startupMessage || "Waiting for AUTH Service...",
        redis: params.redisConnection || "",
        refreshKeys: params.refreshKeys || 60,
        base : params.base || "/",
        excludes: [].concat(params.excludes) || [],
        forcelogin: params.forcelogin || false

    };


    self.collections = params.collections || ['tokens', 'keys'];


    self.context = {
        mongodb: require("mongojs")(self.params.mongodb, self.collections),
        redis: (()=>{
            if(Object.prototype.toString.call( self.params.redis) ){
                return sentinel.createClient(self.params.redis, null, null);
            }else{
                return redis.createClient(self.params.redis);
            }

        })
    };

    self.context.redis.on("error", function (err) {
        debug("Redis.error " + err);
    });

    self.context.redis.on("connect", function () {
        debug("Redis.connect ");
    });



    self.Keys = new Keys(self.context);
    self.ready = false;

    const init = ()=>{
        self.loadKeys()
            .then(()=>{
                debug("Keys loaded");
                self.ready = true;
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

    return this.mws;
};




authtoken.prototype.sendError = (res, err)=>{
    res.end(JSON.stringify({Error: true, msg: err, timestamp: new Date().getTime()}));
};

authtoken.prototype.send = (res, msg)=>{
    res.end(JSON.stringify({Error: null, msg: msg, timestamp: new Date().getTime()}) );
};

authtoken.prototype.generateSecretToken = ()=>{
    return crypto.randomBytes(20).toString('hex')+'-'+shortid.generate();
};


module.exports.express = authtoken;

/**
 * La villada de Hapi, the most ugly framework :p
 * @type {{register: Function}}
 */
module.exports.hapi = {
    register: function(server, options, next){

        var authtoken = new module.exports.express("hapi");

        server.ext({
            type: 'onRequest',
            method: function (request, reply) {
                var response = null;

                var emul = {
                    "set": function(k,v){
                        debug("emul.set called: "+k+" "+v);
                        if(!response) response = reply().header(k, v).hold();
                        else { response.headers[k] = v; }
                    },
                    "end": (buff)=>{
                        debug("emul.end called: "+buff);
                        if(!response) response= reply().header("authtoken", "error").hold();
                        response.source = buff;
                        response.send();
                    }
                };


                authtoken(request, emul, reply.continue)
                    .then((razon)=>{
                        debug("final hapy: "+razon)
                        reply.continue();
                    });

            }//end method
        });

        next();
    }//end register
};

module.exports.hapi.register.attributes ={
    name: "AUTHToken"
};