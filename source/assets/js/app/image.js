window.App = window.App || {};

(function() {

    var instance;

    function Image(data) {

        var _self = this;
        var _instances = [];
        var _data = App.Data.getInstance();
        var _view = App.View.getInstance();
        var _ready;

        this.data = data;
        this.id = data.local.id;
        this.node = _data.node(this.id);

        _ready = new RSVP.Promise(function(resolve){

            if (_self.data.cloud) {
                resolve();
                return;
            }

            _self.node.on('child_added', function(snapshot){
                var name = snapshot.name();
                var data = snapshot.val();
                _self.data[name] = data;
                switch (name) {
                    case 'local':
                        _setSizes();
                        break;
                    case 'cloud':
                        resolve();
                        break;
                }
            });
        });

        _self.node.on('child_changed', function(snapshot){
            var name = snapshot.name();
            var data = snapshot.val();
            _self.data[name] = data;
            if (name === 'local') {
                _setSizes();
            }
        });

        this.ready = function() {
            return _ready;
        }

        this.getInstance = function(name) {
            for (var i = 0; i < _instances.length; i++) {
                if (_instances[i].name === name) {
                    return _instances[i];
                }
            }
        }

        this.destroy = function() {
            _instances.forEach(function(instance){
                instance.remove();
            });
            _instances = null;
        }

        function _setSizes() {
            _instances.forEach(function(instance){
                instance.resize();
            });
        }

        function _dimensions(width) {
            width = width || _self.data.local.width;
            var w = parseInt(_self.data.local.width || 1, 10);
            var h = parseInt(_self.data.local.height || 1, 10);
            var r = h / w;
            return {
                r: r,
                w: parseInt(width, 10),
                h: parseInt(Math.round(width * r), 10)
            }
        }


        /**
         *
         * @param name
         * @param opts
         */
        this.instance = function(name, opts){

            var _inst = this;

            _inst.config = $.extend({}, {
                onClick: function(){},
                onLoad: function(){}
            }, config.image.sizes[name], opts);

            this.name = name;
            this.loaded = false;

            this.id = _self.id;
            this.data = _self.data;
            this.size = _dimensions(_inst.config.width);
            this.$elem = $('<img class="image"/>');
            this.load = _load;
            this.remove = _remove;
            this.resize = _resize;

            _instances.push(_inst);

            /**
             * Set the SRC of the image element to the URL, returning a
             * promise that is resolved when the image is loaded.
             *
             * @param delay
             * @return {RSVP.Promise}
             */
            function _load(delay){

                delay = parseInt(delay || 0, 10);

                if (_inst.loaded) {
                    return new RSVP.Promise(function(resolve){ resolve(); });
                }

                return new RSVP.Promise(function(resolve){

                    _inst.$elem.on('load', function() {
                        _inst.config.onLoad();
                        _inst.loaded = true;
                        resolve();
                    });

                    _ready.then(function(){
                        _inst.url = _url();
                        setTimeout(function(){
                            _inst.$elem.attr('src', _inst.url);
                        }, delay);
                    });
                });
            }

            /**
             * Given the config width of this instance, calculate the
             * width and height based upon the ratio calculated from
             * the local data retrieved from the file.
             */
            function _resize() {
                var size = _dimensions(_inst.config.width);
                _inst.$elem.width(size.w);
                _inst.$elem.height(size.h);
            }

            function _url() {
                var settings = _inst.config;
                settings.version = _inst.data.cloud.version;
                return $.cloudinary.url(_inst.data.cloud.public_id, settings);
            }

            function _remove() {
                _inst.$elem.remove();
            }

        }



    }

    window.App.Image = Image;

}());