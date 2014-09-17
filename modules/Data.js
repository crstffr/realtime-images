var RSVP = require('rsvp');
var Moment = require('moment');
var Firebase = require('firebase');
var TokenGenerator = require('firebase-token-generator');
var logger = require('./Logger').getInstance();
var uuid = require('node-uuid');
var instance;

function Data(config) {

    var data = this;

    if (!config.sitename || config.sitename === '') {
        throw 'Data Class needs a sitename on init';
    }

    if (!config.firebase.api_secret) {
        throw 'Firebase secret not defined in the config';
    }

    data.authed = false;

    data.root = new Firebase(config.firebase.root + config.sitename);

    /**
     *
     * @private
     */
    function _authenticate() {

        if (data.authed) { return data.authed; }

        return data.authed = new RSVP.Promise(function(resolve, reject){

            var maker = new TokenGenerator(config.firebase.api_secret);
            var expire = Moment().add(1, 'day');
            var auth = {uid: config.firebase.server_uid};
            var opts = {expires: expire.unix()};
            var token = maker.createToken(auth, opts);

            data.root.auth(token, function(error, result) {

                if (error) {

                    logger.error('Firebase auth failure, invalid token');
                    reject(error);

                } else {

                    var now = Moment();
                    var expires = Moment.unix(result.expires);
                    var reset = expires.diff(now) - 10000;
                    var string = Moment.duration(reset).humanize();

                    logger.info('Firebase auth token expires in: %s (%d seconds)', string, reset / 1000);

                    // Set a timeout to reauthenticate a couple seconds
                    // before the token expires.  This should keep the
                    // auth alive and well;

                    setTimeout(function(){
                        data.authed = false;
                        _authenticate();
                    }, reset);

                    resolve();

                }
            });
        });
    }



    /**
     *
     * @return {RSVP.Promise}
     * @private
     */
    function _fetch(child) {
        return _authenticate().then(function(){
              return new RSVP.Promise(function(resolve, reject){
                 _node(child).once('value', function(snapshot){
                    resolve(snapshot.val());
                });
            });
        });
    }

    /**
     * Return a reference to a Firebase node
     * @param child
     * @return {XMLList}
     * @private
     */
    function _node(child) {
        var node = (child) ? data.root.child(child) : data.root;
        node.fetch = function(){
            return _fetch(child);
        };
        return node;
    }

    return {
        node: _node,
        fetch: _fetch
    };
}


/**
 * Singleton Pattern.  Create first, then getInstances.
 * @type {Object}
 */
module.exports = {
    create: function(a) {
        instance = new Data(a);
        return instance;
    },
    getInstance: function() {
        return instance;
    }
}