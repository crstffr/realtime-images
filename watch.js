var RSVP = require('rsvp');
var traverse = require('traverse');
var Queue = require('promise-queue');
var config = require('./modules/Config');
var Logger = require('./modules/Logger');
var logger = Logger.create(config, config.sitename);

var Local = require('./modules/Local');
var Cloud = require('./modules/Cloud');
var Image = require('./modules/Image');
var Watch = require('./modules/Watch');
var Data = require('./modules/Data');
var File = require('./modules/File');

process.on('SIGINT', function() {
    logger.warn('SIGINT - process interrupted');
    setTimeout(process.exit, 1000);
});

process.on('SIGTERM', function() {
    logger.error('SIGTERM - process terminated');
    setTimeout(process.exit, 1000);
});

process.on('uncaughtException', function(e) {
    logger.error('UncaughtException: ' + e);
    setTimeout(process.exit, 1000);
});

(function(){

    Queue.configure(RSVP.Promise);
    var concur = config.cloud.concurrent_uploads || 1;

    var _data = Data.create(config);
    var _local = Local.create(config);
    var _cloud = Cloud.create(config);
    var _watch = Watch.create(config);
    var _upload = new Queue(concur, Infinity);

    _init();

    /**
     *
     * @private
     */
    function _init() {

        logger.line();
        logger.info('Starting Local <> Remote sync...');

        _sync();

        _watch.start(config.local.source);
        _watch.onCreate(_onCreate);
        _watch.onRemove(_onRemove);

        // Resync every hour to keep up to date

        setInterval(function(){
            _upload.add(_sync);
        }, 3600000);

    }

    function _onCreate(f, stat, image) {
        if (image.exists && image.isdir && image.data) {
            _upload.add(_sync);
        } else if (image.valid) {
            image.saveData();
            _upload.add(image.upload);
        }
    }

    function _onRemove(f, stat, image){
        if (image.valid) {
            image.remove();
        }
    }

    function _sync() {

        var sources = {
            local: _local.fetch(),
            data: _data.fetch()
        };

        var fetch = RSVP.hash(sources);
        var sync = fetch.then(_syncLocal);
        return sync.catch(function(e) {
            logger.warn('Fetch was rejected: %s', e.message || e);
        });
    }

    /**
     *
     * @param results
     * @private
     */
    function _syncLocal(results) {

        var _images = {};

        // If pictures exist in SRC but not in FB
            // copy & resize the images
            // collect all information on images
            // add image data to FB

        // logger.info('Syncing Local Images: %d', results.local.length);

        // Loop over each of the local source pictures, checking for
        // values in Firebase.  If there is no data, then collect
        // it and set it into the database.

        results.local.forEach(function(image, i) {
            _images[image.file] = image;
            try {
                image.getRemoteData().then(function(data){

                    if (!data) {
                        logger.info('%s - NEW', image.data.id);
                        _upload.add(image.upload);
                        image.saveData();
                    }
                });
            } catch(e) {
                logger.error('Error syncing local images: %s', e.message || e);
            }
        });


        // Remove images that exist in Firebase but do not exist in source.

        if (results.data) {
            traverse(results.data).forEach(function(x){
                if (x && x.cloud && x.local) {
                    if (_images[x.local.file]) { return; }
                    if (x.local.file) {
                        var image = new Image(x.local.file);
                        logger.info('%s - IS MISSING', image.data.id);
                        image.remove();
                    }
                }
            });
        }

    }

})();

