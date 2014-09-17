var util = require('util');
var path = require('path');
var RSVP = require('rsvp');
var Image = require('./Image');
var recursive = require('recursive-readdir');
var logger = require('./Logger').getInstance();
var instance;

function Local(config) {

    if (!config.sitename || config.sitename === '') {
        throw 'Local Class needs a sitename on init';
    }

    /**
     *
     * @return {RSVP.Promise}
     * @private
     */
    function _fetch(where) {

        where = where || config.local.source;

        return (new RSVP.Promise(function(resolve, reject){

            try {
                recursive(where, function(err, files){
                    (err) ? reject(err) : resolve(files);
                });
            } catch(e) {
                logger.error('ERROR: %s', e.message || e);
            }

        })).then(function(files){

            files = files || [];
            var out = [];

            files.forEach(function(file, i){
                try {
                    var image = new Image(file);
                    if (image.valid) {
                        out.push(image);
                    }
                } catch (e) {
                    logger.error(e.message || e);
                }
            });
            return out;
        });

    }

    return {
        fetch: _fetch
    }

}

/**
 * Singleton Pattern.  Create first, then getInstances.
 * @type {Object}
 */
module.exports = {
    create: function(a) {
        instance = new Local(a);
        return instance;
    },
    getInstance: function() {
        return instance;
    }
}