window.App = window.App || {};

(function() {

    var instance;

    function Folder(tree, path) {

        var _self = this;
        var _tree = tree || {};
        var _path = path || '';
        var _util = App.Utils;
        var _data = App.Data.getInstance();
        var _ready;

        var _handlers = {
            imageAdded: [],
            imageRemoved: [],
            folderAdded: [],
            folderRemoved: []
        };

        this.id = _path;
        this.images = {};
        this.folders = {};
        this.loaded = false;
        this.empty = true;
        this.node = _data.node(_path);
        this.count = {
            folders: 0,
            images: 0
        };

        _ready = new RSVP.Promise(function(resolve, reject){

            _self.node.on('child_added', function(snapshot){
                _addChild(snapshot.name(), snapshot.val());
                resolve();
            });

            _self.node.on('child_removed', function(snapshot){
                _removeChild(snapshot.name(), snapshot.val());
            });
        });

        /**
         * Public method for accessing the _ready promise
         * @return {RSVP.Promise}
         */
        this.ready = function() {
            return _ready;
        }

        this.onImageAdded = function(fn) {
            if (typeof fn !== 'function') { return false; }
            _handlers.imageAdded.push(fn);
        }

        this.onImageRemoved = function(fn) {
            if (typeof fn !== 'function') { return false; }
            _handlers.imageRemoved.push(fn);
        }

        this.onFolderAdded = function(fn) {
            if (typeof fn !== 'function') { return false; }
            _handlers.folderAdded.push(fn);
        }

        /**
         * Return an array of all the images in this folder
         * @return {*}
         */
        this.getImages = function() {
            return _util.objectToArray(_self.images);
        }

        /**
         * Get a subfolder of a specified text path
         * @param path
         * @return {*}
         */
        this.getChild = function(path) {
            if (!path) { return this; }
            var child = this;
            var paths = path.split('/');
            paths.forEach(function(name){
                if (name && child.folders && child.folders[name]) {
                    child = child.folders[name];
                } else if (name && child.images && child.images[name]) {
                    child = child.images[name];
                }
            });
            return child;
        }

        /**
         *
         * @param data
         * @private
         */
        function _addChild(name, data) {
            if (data.local) {
                _addImage(name, data);
            } else {
                _addSubfolder(name, data);
            }
        }

        function _removeChild(name, data) {
            if (data.local) {
                _removeImage(name, data);
            } else {
                _removeSubfolder(name, data);
            }
        }


        function _removeImage(name, data) {
            var image = _self.images[name];
            if (image) {

                //image.destroy();
                _self.count.images--;
                _self.empty = _self.count.images < 1;

                _handlers.imageRemoved.forEach(function(handler) {
                    handler(image);
                });

                delete _self.images[name];
            }
        }

        function _removeSubfolder(name, data) {
            var folder = _self.folders[name];
            if (folder) {

                _handlers.folderRemoved.forEach(function(handler) {
                    handler(image);
                });

                delete _self.folders[name];
            }
        }



        /**
         * Create a new Image object and save it locally
         * @param name
         * @param data
         * @return {App.Image}
         * @private
         */
        function _addImage(name, data) {
            var image = new App.Image(data);
            _self.images[name] = image;
            _self.count.images++;
            _self.empty = false;

            _handlers.imageAdded.forEach(function(handler) {
                handler(image);
            });

            return image;
        }

        /**
         * Create a new Folder object and save it locally
         * @param name
         * @param data
         * @return {Folder}
         * @private
         */
        function _addSubfolder(name, data) {
            var folder = new Folder(data, _path + name + '/');
            _self.folders[name] = folder;
            _self.count.folders++;

            _handlers.folderAdded.forEach(function(handler) {
                handler(image);
            });

            return folder;
        }


    }

    window.App.Folder = Folder;

}());