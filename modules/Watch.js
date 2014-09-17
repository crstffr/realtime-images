var util = require('util');
var RSVP = require('rsvp');
var watch = require('watch');
var Image = require('./Image');
var logger = require('./Logger').getInstance();
var instance;

function Watch(config) {

    var _createHandlers = [];
    var _changeHandlers = [];
    var _removeHandlers = [];

    this.onCreate = function(handler) {
        if (typeof handler !== 'function') { return; }
        _createHandlers.push(handler);
    }

    this.onChange = function(handler) {
        if (typeof handler !== 'function') { return; }
        _changeHandlers.push(handler);
    }

    this.onRemove = function(handler) {
        if (typeof handler !== 'function') { return; }
        _removeHandlers.push(handler);
    }

    this.start = function(watchFolder) {

        logger.info('Starting image watch process...');

        watch.createMonitor(watchFolder, function(monitor) {

            monitor.on("created", function(f, stat) {
                var image = new Image(f);
                _createHandlers.forEach(function(handler){
                    handler(f, stat, image);
                })
            });

            monitor.on("changed", function(f, curr, prev) {
                var image = new Image(f);
                _changeHandlers.forEach(function(handler){
                    handler(f, curr, prev, image);
                })
            });

            monitor.on("removed", function(f, stat) {
                var image = new Image(f);
                _removeHandlers.forEach(function(handler){
                    handler(f, stat, image);
                })
            });
        });
    }

    this.onCreate(function(f, stat, image){
        if (!image || !image.valid && !image.isdir) {
            logger.warn('%s - SOURCE: ADDED - UNABLE TO PROCESS', f);
        } else if (image.exists && image.isdir && image.data) {
            logger.info('%s - SOURCE: ADDED FOLDER', image.data.id);
        } else if (image.valid) {
            logger.info('%s - SOURCE: ADDED', image.data.id);
        }
    });

    this.onRemove(function(f, stat, image){
        if (!image.exists && image.data && image.data.ext === '') {
            logger.info('%s - SOURCE: REMOVED FOLDER', image.data.id);
        } else if (image.valid) {
            logger.info('%s - SOURCE: REMOVED IMAGE', image.data.id);
        } else {
            logger.warn('%s - SOURCE: REMOVED - UNABLE TO PROCESS', f);
        }
    });

}


/**
 * Singleton Pattern.  Create first, then getInstances.
 * @type {Object}
 */
module.exports = {
    create: function(a) {
        instance = new Watch(a);
        return instance;
    },
    getInstance: function() {
        return instance;
    }
}