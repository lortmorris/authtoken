const debug = require('debug')('authtoken:prototypes:login');
/**
* Login method.
* @param {string} apikey - The client api key
* @param {string} secret - The client Secret Token
* @param {object} res - Response object (transport method).
* @returns {Promise}
*/
module.exports = function login(apikey, secret) {
  debug('authtoken.login');

  return new Promise((resolve, reject) => {
    this.context.redis.hget(apikey, 'secret', (a, b) => {
      if (a) return reject('Bad API Key');
      if (b === secret) {
        const st = this.generateSecretToken();
        this.context.redis.hset(st, 'trq', 0, () => {
          this.context.redis.hget(apikey, 'ratelimit', (err, ratelimit) => {
            this.context.redis.hset(st, 'limit', ratelimit, () => {
              this.context.redis.expire(st, 60 * 60);
              return resolve(st);
            });// end set limit
          }); // end get ratelimit
        });// end set trq
      } else return reject('Bad Secret Token');
      return null;
    });
  });
};
