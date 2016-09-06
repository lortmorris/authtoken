"use strict";

var debug = require("debug")("authtoken:prototypes");

module.exports = function (func) {
    debug("injecting...");

    func.prototype.check = require("./check");
    func.prototype.loadKeys = require("./loadKeys");
    func.prototype.login = require("./login");

    func.prototype.hset = function (key, property, value) {
        var self = this;
        return new Promise((resolve, reject)=> {
            self.context.redis.hset(key, property, value, (err)=> {
                debug("setted " + JSON.stringify({key: key, property: property, value: value}));
                if (err) reject(err);
                else resolve();
            });
        });
    };

    func.prototype.hget = function (key, property) {
        var self = this;
        return new Promise((resolve, reject)=> {
            self.context.redis.hget(key, property, (err, value)=> {
                debug(".hget : ", JSON.stringify(value));
                console.log(".hget: ", key, property, value);
                if (err) reject(err);
                else resolve(value)
            });
        });
    };


    func.prototype.expire = function (key, time) {
        var self = this;
        return new Promise((resolve, reject)=> {
            self.context.redis.expire(key, time, ()=> {
                resolve();
            });
        });
    };

};