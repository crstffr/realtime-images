window.App = window.App || {};

(function() {

    var instance;

    function Data(config) {

        var _self = this;
        var _root = new Firebase(config.firebase.root + config.sitename);

        var _createHandlers = [];
        var _removeHandlers = [];


        _root.on('child_added', function(snapshot){
            _createHandlers.forEach(function(handler){
                handler(snapshot);
            });
        });

        _root.on('child_removed', function(snapshot){
            _removeHandlers.forEach(function(handler){
                handler(snapshot);
            });
        });

        /**
         * Filter a data set down to just images (no folders)
         * @param data
         * @return {*}
         */
        this.onlyImages = function(data) {
            return traverse(data).reduce(function(acc, x){
                if (this.level === 1 && x.local) { acc[this.key] = x; }
                return acc;
            }, {});
        }

        /**
         * Filter a data set down to just folders (no images)
         * @param data
         * @return {*}
         */
        this.onlyFolders = function(data) {
            return traverse(data).map(function(x){
                if (x.local && x.local.file) {
                    this.remove();
                }
            });
        }

        this.onCreate = function(handler) {
            if (typeof handler !== 'function') { return; }
            _createHandlers.push(handler);
        }

        this.onRemove = function(handler) {
            if (typeof handler !== 'function') { return; }
            _removeHandlers.push(handler);
        }

        /**
         *
         * @return {RSVP.Promise}
         * @private
         */
        this.fetch = function(child) {
            return new RSVP.Promise(function(resolve, reject){
                 _self.node(child).once('value', function(snapshot){
                    resolve(snapshot.val());
                });
            });
        }

        /**
         * Return a reference to a Firebase node
         * @param child
         * @return {XMLList}
         * @private
         */
        this.node = function(child) {
            var node = (child) ? _root.child(child) : _root;
            node.fetch = function(){
                return _self.fetch(child);
            };
            return node;
        }

    }

    window.App.Data = {
        create: function(a) {
            instance = new Data(a);
            return instance;
        },
        getInstance: function() {
            return instance;
        }
    }

}());