"use strict";

const debug = require("./fdebug")("authtoken:main");
const redis = require('redis');
const bluebird = require("bluebird");
const EventEmitter = require('events').EventEmitter;
const utils = require('util');
const config  = require("config")


//own library
const Keys = require("./lib/Keys");


/**
 * authtoken main function.
 * @returns {Function|*}
 */
function authtoken(server, options, next){


    const self = this;
    const params = config.get(process.env.NODE_ENV || "default");

    bluebird.promisifyAll(redis.RedisClient.prototype);
    bluebird.promisifyAll(redis.Multi.prototype);


    self.params = {
        mongodb: params.mongodb  || "authtoken",
        startupMessage: params.startupMessage || "Waiting for AUTH Service...",
        redis: params.redisConnection || "",
        refreshKeys: params.refreshKeys || 60
    };


    self.collections = params.collections || ['tokens', 'keys'];


    var context = {
        mongodb: require("mongojs")(self.params.mongodb, self.collections)
    };



    self.Keys = new Keys(context);
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

    self.mws = function (req, res, next){

        if(self.ready){
            if(req.headers.tokenservice && req.headers.tokenservice=="login") {
                self.login(req.headers.apikey || "", req.headers.secret || "", res)
                    .then(()=>{
                        return;
                    }).catch((err)=>{
                        return self.sendError(res, err);
                    })
            }else{
                return self.check(req, res)
                            .then(()=>{ next(); })
                            .catch((err)=>{
                                    self.sendError(err);
                                })
            }

        }else{

            res.end(self.params.startupMessage);
            return;
        }//end else

    };



    return this.mws;
};

utils.inherits(authtoken, EventEmitter);


authtoken.prototype.sendError = (res, err)=>{
    res.json({Error: true, msg: err, timestamp: new Date().getTime()});
};

/**
 * Check if request has auth or not.
 * @param {object} req - The Request object
 * @param {object} res - Response Object (transport method).
 * @returns {Promise}
 */
authtoken.prototype.check = (req, res) => {
    var self = this;
    res.set('AUTHREST', "ok");

    return new Promise((resolve, reject)=>{

        resolve();
    })

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
    return new Promise((resolve, reject)=>{

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
                keys.forEach(function(a,b){
                    console.log(a,b);
                });

                resolve();
            }, reject);

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

              var emul = {
                  "set": function(k,v){
                        reply().headers[k] = v;
                  },
                  "end": reply.response
              };

              return authtoken(request, emul, reply.continue);

          }//end method
      });

      next();
  }
};

module.exports.hapi.register.attributes ={
    name: "AUTHToken"
};