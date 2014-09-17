window.App = window.App || {};

(function() {

    var instance;

    function Pictures() {

        App.Utils.loadLiveReloadScript();

        var _self = this;
        var _util;
        var _data;
        var _hash;
        var _menu;
        var _view;
        var _root;
        var _ready;
        var _loaded;
        var _overlay;

        var _config = $.extend({}, config, {
             app: {
                load: {
                    delay: 50
                },
                elements: {
                    menu: 'nav.menu',
                    view: {
                        viewport: '.viewport',
                        container: '.image-container',
                        loading: '.msg-loading',
                        empty: '.msg-empty'
                    },
                    overlay: {
                        overlay: '.overlay',
                        wrapper: '.image-wrapper'
                    }
                }
            }
        });

        /**
         * Public initialization method
         */
        this.init = function() {

            _loaded = {};
            _util = App.Utils;
            _data = App.Data.create(_config);
            _hash = App.Hash.create(_config);
            _menu = App.Menu.create(_config.app.elements.menu);
            _view = App.View.create(_config.app.elements.view);
            _overlay = App.Overlay.create(_config.app.elements.overlay);

            $.cloudinary.config(_config.cloud);

            _view.isBusy(); // Start the loader bar

            // Build the Menu from data in Firebase

            _ready = new RSVP.Promise(function(resolve, reject){

                _data.fetch().then(function(data){
                    _root = new App.Folder(data);
                    _root.ready().then(function(){
                        _menu.buildFolder(_root);
                        _menu.makeFancy();
                        resolve();
                    });
                }).catch(function(e){
                    console.error('Error fetching data: ', e.message || e);
                });

            });

            _menu.onClick(function(event, path){
                _hash.setHash(path);
            });

            _menu.ready().then(function(){

                _hash.onChange(function(path, oldPath) {

                    _view.isBusy();
                    _menu.select(path);
                    _loadChild(path);

                });

                _hash.init();

            });

        }

        /**
         * Given a path, load the child whether it be a folder or an image.
         *
         * @param path
         * @private
         */
        function _loadChild(path) {

            var child = _root.getChild(path);

            if (child instanceof App.Folder) {

                _view.filter(path).then(function(){
                    _bindFolder(child);
                    _loadFolder(child);
                });

            } else if (child instanceof App.Image) {

                _loadImage(child);

            }
        }

        /**
         *
         * @param image
         * @private
         */
        function _loadImage(image) {

            _view.isBusy();

            _overlay.open(image).then(function(){
                _view.isDone();
            });
        }

        /**
         * Register handlers for when images are added or removed
         * from a given folder.
         *
         * @param folder
         * @private
         */
        function _bindFolder(folder) {

            if (folder.bound) { return; }

            // Register an event handler for this folder to
            // remove the thumbnail for any removed images.

            folder.onImageRemoved(function(image) {
                var thumb = image.getInstance('thumb');
                if (thumb) {
                    _view.remove(thumb);
                    _view.relayout();
                }
            });

            // Register an event handler for this folder to
            // load thumbnails for any images that are added
            // from here on out.  This allows us a realtime
            // pop-in effect of newly added images.

            folder.onImageAdded(function(image){

                folder.loading++;
                _view.isBusy();

                _loadThumb(image).then(function(){
                    _view.relayout();
                    _view.isDone();
                    folder.loading--;
                });
            });

            folder.bound = true;

        }



        /**
         * Load a folder full of images and register event handlers for when
         * images are added or removed.
         *
         * @param folder
         * @private
         */
        function _loadFolder(folder) {

            _overlay.close();

            if (!folder instanceof App.Folder) {
                throw 'Cannot load folder, instance is not a Folder object';
            }

            if (folder.loaded && folder.loading === 0) {
                _view.isDone();
                return;
            }

            if (folder.loading > 0) {
                _view.isBusy();
                return;
            }

            var delay = 0;
            var promises = [];
            folder.loading = 0;

            // Loop over each of the image objects in the folder
            // and load them with a small delay.  When an image
            // is loaded, it increments the loader bar by a
            // a measured amount relevant to the total

            var increment = 1 / (folder.count.images || 1);

            folder.getImages().forEach(function(image) {

                folder.loading++;

                var promise = _loadThumb(image, delay);

                // Increment our loader by a specific amount
                // calculated based upon how many total images
                // there are to load in the folder.

                promise.then(function(){
                    _view.isWorking(increment);
                    folder.loading--;
                });

                // Add this image to our stack of promises.

                promises.push(promise);

                // Delay the loading of each image by a small
                // offset.  This leads to a smoother overall
                // performance, as well as a nice effect of
                // the images being drawn in as they load.

                delay += _config.app.load.delay;

            });

            // When ALL of the images in this folder have completed
            // their missions and have loaded completely, then set
            // the folder.loaded flag and relayout the view.

            RSVP.all(promises).then(function(){
                folder.loaded = true;
                _view.relayout();
                _view.isDone();
            });

        }

        /**
         * Create a thumbnail sized instance of the image and append it to the view.
         *
         * @param image
         * @param delay
         * @return {*}
         * @private
         */
        function _loadThumb(image, delay) {

            delay = delay || 0;

            if (!image instanceof App.Image) {
                console.warn('Object is not an instance of App.Image', image);
                return;
            }

            var thumb = new image.instance('thumb');

            thumb.resize();

            _view.append(thumb);

            return thumb.load(delay);
        }


    }

    window.App.Pictures = new Pictures();

}());