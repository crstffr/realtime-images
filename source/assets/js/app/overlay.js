window.App = window.App || {};

(function() {

    var instance;

    function Overlay(elements) {

        var _self = this;

        var imginst = {};
        var $overlay = $(elements.overlay);
        var $wrapper = $overlay.find(elements.wrapper);

        function _open(image) {
            $overlay.show();
            return _placeImage(image);
        }

        function _close() {
            $overlay.hide();
        }

        function _placeImage(image) {

            return new RSVP.Promise(function(resolve){

                if (image.id === imginst.id) {
                    resolve();
                    return;
                }

                $wrapper.empty();

                imginst = new image.instance('med');

                $wrapper.append(imginst.$elem);

                imginst.load().then(resolve);

            });

        }


        return {
            open: _open,
            close: _close
        }
        
    }

    window.App.Overlay = {
        create: function(a) {
            instance = new Overlay(a);
            return instance;
        },
        getInstance: function() {
            return instance;
        }
    }

}());