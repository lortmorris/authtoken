"use strict";

const debug = require("../fdebug")("authtoken:keys");

/**
 * Main Keys object. Manager all Keys actions.
 * @param {object} context - The global context
 * @param {object} context.db - The mongoDB instance
 * @constructor
 */
function Keys(context){
    const self = this;
    self.db = context.mongodb;

    debug("Keys lib started");
};


/**
 * Load all clients api keys from MongoDB collection.
 * @returns {Promise}
 */
Keys.prototype.load = function(){
    const self = this;
    debug("Keys.load called");

    return new Promise((resolve, reject)=>{

        self.db.keys.find({}, {}, function(err, docs){
            if(err) {
                debug("Reject getting keys");
                reject("Can't load keys for AUTH Service");
            }
            else {
                debug("Resolve getting keys: "+docs.length);
                resolve(docs);
            }
        });
    });//end Promise
};


module.exports = Keys;