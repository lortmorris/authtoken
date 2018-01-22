const debug = require('debug')('authtoken:keys');

/**
* Main Keys object. Manager all Keys actions.
* @param {object} context - The global context
* @param {object} context.db - The mongoDB instance
* @constructor
*/

class Keys {
  constructor(context) {
    this.db = context.mongodb;
    debug('Keys lib started');
  }

  /**
  * Load all clients api keys from MongoDB collection.
  * @returns {Promise}
  */
  load() {
    const self = this;
    debug('Keys.load called');

    return new Promise((resolve, reject) => {
      self.db.keys.find({}, {}, (err, docs) => {
        if (err) {
          debug('Reject getting keys');
          return reject('Cant load keys for AUTH Service');
        }
        debug('Resolve getting keys: ', docs.length);
        return resolve(docs);
      });
    });// end Promise
  }
}


module.exports = Keys;
