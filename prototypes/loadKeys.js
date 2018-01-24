const debug = require('debug')('authtoken:prototypes:loadKeys');

/**
* Load all api keys from DB and save to Redis storage
* @returns {Promise.<T>}
*/
module.exports = function loadKeys() {
  debug('authtoken.loadKeys called');

  return new Promise((resolve, reject) => {
    this.Keys.load()
      .then((keys) => {
        let total = keys.length;
        keys.forEach(a => ((aa) => {
          this.hset(aa.apikey, 'secret', aa.secret || '')
            .then(() => this.hset(aa.apikey, 'ratelimit', aa.ratelimit || 10000000))
            .then(() => this.hset(`_private-${aa.apikey}`, 'limit', aa.ratelimit || 10000000))
            .then(() => this.expire(`_private-${aa.apikey}`, 60 * 60))
            .then(() => this.hset(`_private-${aa.apikey}`, 'trq', 0))
            .then(() => {
              total -= 1;
              if (total === 0) return resolve();
              return null;
            })
            .catch(err => reject(err));
        })(a, total));
      }, reject);
  })
    .catch(err => debug('Catch: Error loadKeys: ', err.toString()));
};
