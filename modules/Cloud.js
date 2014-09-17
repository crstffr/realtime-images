var util = require('util');
var RSVP = require('rsvp');
var Cloudinary = require('cloudinary');
var logger = require('./Logger').getInstance();
var instance;

function Cloud(config) {

    if (!config.sitename || config.sitename === '') {
        throw 'Cloud Class needs a sitename on init';
    }

    Cloudinary.config(config.cloud);


    /**
     *
     * @return {RSVP.Promise}
     * @private
     */
    function _fetch() {

        return new RSVP.Promise(function(resolve, reject){

            Cloudinary.api.resources(function(results){
                (results.error) ? reject(results.error) : resolve(results.resources);
            },{
                max_results: 500,
                type: 'upload',
                prefix: config.sitename
            });
        });
    }


    /**
     *
     * @param image {Image}
     * @return {RSVP.Promise}
     * @private
     */
    function _upload(image) {

        return new RSVP.Promise(function(resolve, reject){

            if (!image.data.cid) {
                reject('CloudStuff.upload - File data does not have an ID');
                return false;
            }

            if (!image.file) {
                reject('CloudStuff.upload - File data does not have a file path');
                return false;
            }

            // Eagerly create variants of this image immediately upon
            // upload.  This makes it speedy to load image requests
            // because the resize has already been completed.

            var eager = [];

            if (config.image.eager.length > 0) {
                config.image.eager.forEach(function(size){
                    if (config.image.sizes[size]) {
                        eager.push(config.image.sizes[size]);
                    }
                });
            }

            var options = {
                eager: eager,
                overwrite: true,
                invalidate: true,
                public_id: image.data.cid,
                crop: config.image.sizes.full.crop,
                width: config.image.sizes.full.width,
                height: config.image.sizes.full.height,
                exif: config.image.exif
            };

            Cloudinary.uploader.upload(image.file, function(results){
                (results.error) ? reject(results.error) : resolve(results);
            }, options);

            return true;

        });

    }


    /**
     * Generate the public ID for an image, which appends the sitename
     * to the beginning of the image ID.
     *
     * @param fileData
     * @return {String}
     * @private
     */
    function _publicId(fileData) {
        return config.sitename + '/' + fileData.id;
    }


    /**
     * Remove a single file by public_id
     *
     * @param public_id
     * @return {RSVP.Promise}
     * @private
     */
    function _remove(public_id) {
        return new RSVP.Promise(function(resolve, reject) {
            Cloudinary.api.delete_resources([public_id], function(results){
                if (!results.error && results.deleted[public_id] === 'deleted') {
                    resolve(results);
                } else {
                    reject(results.error);
                }
            });
        });
    }


    /**
     * Loop over an array of files and upload each one in separate calls.
     * @param arrayOfFiles
     * @return {RSVP.Promise}
     * @private
     */
    function _uploadFiles(arrayOfFiles) {

        if (!util.isArray(arrayOfFiles)) { throw 'CloudStuff.uploadFiles only takes arrays'; }

        var promises = [];

        arrayOfFiles.forEach(function(fileData){
            promises.push(_upload(fileData));
        });

        return RSVP.all(promises);
    }


    /**
     * Loop over an array of files and remove them in one batch call.
     * @param arrayOfFiles
     * @return {RSVP.Promise}
     * @private
     */
    function _removeFiles(arrayOfFiles) {

        if (!util.isArray(arrayOfFiles)) { throw 'CloudStuff.removeFiles only takes arrays'; }

        var ids = [];

        arrayOfFiles.forEach(function(fileData){
            ids.push(_publicId(fileData));
        });

        return new RSVP.Promise(function(resolve, reject){
            Cloudinary.api.delete_resources(ids, function(results){
                (results.error) ? reject(results.error) : resolve(results);
            });
        });
    }

    return {
        fetch: _fetch,
        upload: _upload,
        remove: _remove,
        uploadFiles: _uploadFiles,
        removeFiles: _removeFiles
    };

}


/**
 * Singleton Pattern.  Create first, then getInstances.
 * @type {Object}
 */
module.exports = {
    create: function(a) {
        instance = new Cloud(a);
        return instance;
    },
    getInstance: function() {
        return instance;
    }
}