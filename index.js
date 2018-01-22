const debug = require('debug')('authtoken:main');
const redis = require('redis');
const shortid = require('shortid');
const crypto = require('crypto');
const sentinel = require('redis-sentinel');
const mongojs = require('mongojs');
const Keys = require('./lib/Keys');

/**
* authtoken main function.
* @returns {Function|*}
*/
function authtoken(params = {}) {
  this.mws = (req, res, next) => {
    debug('do request: ', req.path);

    if (this.ready) {
      if (req.headers.tokenservice && req.headers.tokenservice === 'login') {
        debug('login');
        return this.login(req.headers.apikey || '', req.headers.secret || '', res)
          .then((secretToken) => {
            res.set('secret-token', secretToken);
            this.send(res, 'Login OK');
          })
          .catch((err) => {
            debug('catch KLKTR43: ', err.toString());
            return this.sendError(res, err);
          });
      }
      return this.check(req, res)
        .then((razon) => {
          debug('pass, next called: ', razon);
          next();
          return true;
        })
        .catch((err) => {
          debug('Catch Check: ', err.toString());
          this.sendError(res, err);
          return err;
        });
    }
    return res.end(this.params.startupMessage);
  };
  return this.run(params);
}

require('./prototypes')(authtoken);


authtoken.prototype.run = function run(params) {
  debug('run called: ', params);
  this.params = Object.assign({}, {
    mongodb: 'authtoken',
    startupMessage: 'Waiting for AUTH Service...',
    redis: '',
    refreshKeys: 60,
    base: '/',
    excludes: [],
    forcelogin: false,
  }, params);

  this.collections = params.collections || ['tokens', 'keys'];

  this.context = {
    mongodb: mongojs(this.params.mongodb, this.collections),
    redis: (() => {
      if (Object.prototype.toString.call(this.params.redis) === '[object Array]') {
        return sentinel.createClient(this.params.redis, null, null);
      }
      return redis.createClient(this.params.redis);
    })(),
  };

  this.context.redis.on('error', err => debug('Redis.error: ', err));
  this.context.redis.on('connect', () => debug('Redis.connect '));


  this.Keys = new Keys(this.context);
  this.ready = false;

  const init = () => {
    this.loadKeys()
      .then(() => {
        debug('Keys loaded');
        this.ready = true;
      })
      .catch((err) => {
        debug('Reject Starting: ', err);
        this.params.startupMessage = 'AUTH Error: starting faild.';
      });
  };// end init


  this.interval = setInterval(() => {
    this.loadKeys()
      .catch(() => {
        this.ready = false;
      });
  }, this.params.refreshKeys * 1000);

  init();

  return this.mws;
};


authtoken.prototype.sendError = (res, err) => res.status(401).end(JSON.stringify({ Error: true,
  msg: err,
  timestamp: new Date().getTime(),
}));

authtoken.prototype.send = (res, msg) => res.end(JSON.stringify({ Error: null,
  msg,
  timestamp: new Date().getTime(),
}));

authtoken.prototype.generateSecretToken = () => `${crypto.randomBytes(20).toString('hex')}-${shortid.generate()}`;

module.exports = authtoken;
