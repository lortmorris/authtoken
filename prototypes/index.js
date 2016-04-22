"use strict";

var debug = require("debug")("authtoken:prototypes");

module.exports = function(func){
    debug("injecting...");

    func.prototype.check = require("./check");
    func.prototype.loadKeys = require("./loadKeys");
    func.prototype.login = require("./login");

    func.prototype.hset = function(key, property, value){
        return new Promise((resolve, reject)=>{
            self.context.redis.hset(key, property, value, (err)=> {
                if(err) reject(err);
                else resolve();
            });
        });
    };

    func.prototype.hget = function(key, property){
        return new Promise((resolve, reject)=>{

            self.context.redis.hget(key, property, (err, value)=> {
                if(err) reject(err);
                else resolve(value)
            });
        });
    };

};