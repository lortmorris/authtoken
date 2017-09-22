const debug = require('debug')('authtoken:prototypes:check');

/**
* Check if request has auth or not.
* @param {object} req - The Request object
* @param {object} res - Response Object (transport method).
* @returns {Promise}
*/

module.exports = function check(req) {
  const path = req.path || req.url.pathname;
  let key = '';
  return new Promise((resolve, reject) => {
    // check basepath
    if (path.indexOf(this.params.base) !== 0) {
      return resolve('basepath not inside');
    }
    // check excludes
    if ((() => {
      let r = false;
      this.params.excludes.forEach((v) => {
        if (path.indexOf(v) === 0) r = true;
      });
      return r;
    })()) {
      return resolve('inside excludes');
    }

    if (this.params.forcelogin && !req.headers['secret-token']) {
      return reject('secret-token is required');
    }

    if (this.params.forcelogin === false && !req.headers.apikey) {
      return reject('apikey is required');
    }

    if (this.params.forcelogin) {
      key = req.headers['secret-token'];
    } else {
      key = `_private-${req.headers.apikey}`;
    }


    debug('current key: ', key);

    let trq = null;
    let limit = null;

    return this.hget(key, 'trq')
      .then(($trq) => {
        if ($trq === null || isNaN($trq)) return reject('invalid API-Key');
        trq = $trq;
        debug('getting: ', JSON.stringify($trq));
        return this.hget(key, 'limit');
      })
      .then(($limit) => {
        limit = $limit == null ? 0 : limit;
        trq = parseInt(trq, 10);
        trq += 1;
        if (trq === parseInt(limit, 10)) return reject('Too many request');
        return this.hset(key, 'trq', trq);
      })
      .then(() => resolve())
      .catch(err => reject(err));
  });
};
