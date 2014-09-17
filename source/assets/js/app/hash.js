window.App = window.App || {};

(function() {

    var instance;

    function Hash(config) {

        var _self = this;
        var _util = window.Utils;
        var _handlers = [];

        hasher.initialized.add(_onHashChange);
        hasher.changed.add(_onHashChange);

        this.init = function() {
            hasher.init();
            return this;
        }

        this.current = function() {
            return hasher.getHash();
        }

        this.setHash = function(hash) {
            hasher.setHash(hash);
        }

        this.onChange = function(handler) {
            _handlers.push(handler);
            return this;
        }

        function _onHashChange(newHash, oldHash) {
            _handlers.forEach(function(handler, i){
                if (typeof handler === 'function') {
                    handler(newHash, oldHash);
                }
            });
        }


    }

    window.App.Hash = {
        create: function(a) {
            instance = new Hash(a);
            return instance;
        },
        getInstance: function() {
            return instance;
        }
    }

}());