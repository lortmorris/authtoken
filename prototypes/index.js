const debug = require('debug')('authtoken:prototypes');

const check = require('./check');
const loadKeys = require('./loadKeys');
const login = require('./login');

module.exports = function main(func) {
  debug('injecting...');

  func.prototype.check = check;
  func.prototype.loadKeys = loadKeys;
  func.prototype.login = login;

  func.prototype.hset = function hset(key, property, value) {
    return new Promise((resolve, reject) => {
      this.context.redis.hset(key, property, value, (err) => {
        debug('setted ', { key, property, value });
        if (err) return reject(err);
        return resolve();
      });
    });
  };

  func.prototype.hget = function hget(key, property) {
    return new Promise((resolve, reject) => {
      this.context.redis.hget(key, property, (err, value) => {
        debug('.hget : ', value);
        if (err) return reject(err);
        return resolve(value);
      });
    });
  };


  func.prototype.expire = function expire(key, time) {
    return new Promise((resolve, reject) => {
      this.context.redis.expire(key, time, (err) => {
        if (err) return reject();
        return resolve();
      });
    });
  };
};
