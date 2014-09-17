var fs = require('fs');
var extend = require('extend');
var nodepath = require('path');
var config = require('./Config');
var Folder = require('./Folder');
var Image = require('./Image');
var logger = require('./Logger').getInstance();

module.exports = function(path) {

    var _data = require('./Data').getInstance();

    var self = this;

    this.path = path;
    this.data = _getLocalData();
    this.isdir = _isDir();
    this.exists = _exists();
    this.isimage = _isImage();

    this.node = _data.node(self.data.id);

    if (this.isimage) {

        this.object = new Image(path);

    } else if (this.isdir) {

        this.object = new Folder(path);

    }

    /**
     * Set the local data into the database.
     */
    this.saveData = function(data) {
        self.node.update(data);
    };

    /**
     *
     * @return {RSVP.Promise}
     */
    this.getRemoteData = function() {
        return self.node.fetch();
    }

    /**
     * Remove the file information from the database and
     * delete the file from the cloud storage service.
     *
     */
    this.remove = function() {

        logger.info('%s - REMOVING IMAGE...', self.data.id);

        _cloud.remove(self.data.cid).then(function(results){

            self.node.remove();
            logger.info('%s - REMOVE COMPLETE', self.data.id);

        }).catch(function(e){
            logger.error('%s - REMOVE ERROR (%s)', self.data.id, e.message || e);
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

            ext = nodepath.extname(self.file);
            url = _getShortPath(self.file);
            dir = (nodepath.dirname(url) + '/').replace('./','');
            base = nodepath.basename(self.file, ext);
            name = nodepath.basename(self.file);

            if (_exists(self.file)) {
                time = _getModifiedDate(self.file);
            }

            id = dir + base;
            id = id.replace(/[^a-zA-Z0-9\/]/g,'-');
            id = id.replace('&', 'and');
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
            file: self.file,
            ext: ext
        };

    }


    /**
     * Checks file extension against the config values
     * @return {Boolean}
     * @private
     */
    function _isImage() {
        var ext = nodepath.extname(self.path).toLowerCase();
        return (config.image.formats.indexOf(ext) > -1);
    }

    function _exists() {
        return fs.existsSync(self.path);
    }

    function _getShortPath() {
        return self.path.replace(config.local.source, '');
    }

    function _isDir() {
        return _exists() && fs.lstatSync(self.path).isDirectory();
    }

    /**
     * Gets a timestamp of the last modified date of the file
     * @return {*}
     */
    function _getModifiedDate() {
        return (new Date(fs.statSync(self.path).mtime.toString())).getTime();
    }

}