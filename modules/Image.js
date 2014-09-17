var fs = require('fs');
var path = require('path');
var extend = require('extend');
var easyimg = require('easyimage');
var config = require('./Config');
var logger = require('./Logger').getInstance();

module.exports = function(file) {

    var _data = require('./Data').getInstance();
    var _cloud = require('./Cloud').getInstance();

    var img = this;
    this.file = file;
    this.data = _getLocalData();
    this.isdir = _isDir(file);
    this.exists = _exists(file);
    this.valid = _isValid(file);
    this.node = _data.node(img.data.id);
    if (!this.valid) { return this; }

    /**
     * Upload the image file to the cloud storage service,
     * adding the response data to the database when it
     * is completed.
     */
    this.upload = function() {

        logger.info('%s - UPLOADING IMAGE...', img.data.id);

        return _cloud.upload(img).then(function(response) {

            logger.info('%s - UPLOAD COMPLETE', img.data.id);
            img.node.update({cloud: response});

        }).catch(function(e) {

            logger.error('%s - UPLOAD ERROR (%s)', img.data.id, e.message || e);
            img.node.remove();

        });
    };

    /**
     * Set the local image data into the database.
     */
    this.saveData = function() {
        img.node.update({local: img.data});
        return easyimg.info(img.file).then(function(info) {
            img.node.update({local: extend({}, img.data, info)});
        });
    };

    /**
     *
     * @return {RSVP.Promise}
     */
    this.getRemoteData = function() {
        return img.node.fetch();
    }

    /**
     * Remove the file information from the database and
     * delete the file from the cloud storage service.
     *
     */
    this.remove = function() {

        logger.info('%s - REMOVING IMAGE...', img.data.id);

        return _cloud.remove(img.data.cid).then(function(results){

            img.node.remove();
            logger.info('%s - REMOVE COMPLETE', img.data.id);

        }).catch(function(e){
            logger.error('%s - REMOVE ERROR (%s)', img.data.id, e.message || e);
        });
    }

    /**
     *
     * @return {Object}
     * @private
     */
    function _getLocalData() {

        var ext, url, dir, base, name, time, id, cid;

        try {

            ext = path.extname(img.file);
            url = _getShortPath(img.file);
            dir = (path.dirname(url) + '/').replace('./','');
            base = path.basename(img.file, ext);
            name = path.basename(img.file);

            if (_exists(img.file)) {
                time = _getModifiedDate(img.file);
            }

            dir = _cleanFilename(dir);
            id  = _cleanFilename(dir + base);
            cid = config.sitename + '/' + id;

        } catch(e) {
            logger.error(e.message || e);
        }

        return {
            id: id,
            cid: cid,
            url: url,
            dir: dir,
            name: name,
            base: base,
            time: time,
            file: img.file,
            ext: ext
        };

    }

    function _cleanFilename(value) {
        return value.replace(/[^a-zA-Z0-9\/]/g,'-').replace('&', '-and-');
    }

    /**
     * Checks file extension against the config values
     * @return {Boolean}
     * @private
     */
    function _isValid(file) {
        var ext = path.extname(file).toLowerCase();
        return (config.image.formats.indexOf(ext) > -1);
    }

    function _exists(file) {
        return fs.existsSync(file);
    }

    function _getShortPath(file) {
        return file.replace(config.local.source, '');
    }

    function _isDir(file) {
        return _exists(file) && fs.lstatSync(file).isDirectory();
    }

    /**
     * Gets a timestamp of the last modified date of a file
     * @param file
     * @return {*}
     */
    function _getModifiedDate(file) {
        return (new Date(fs.statSync(file).mtime.toString())).getTime();
    }

}