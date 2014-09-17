window.App = window.App || {};

(function() {

    var instance;

    function View(elements) {

        var _self = this;
        var _util = window.Utils;
        var _images = {};
        var _ready;

        var $viewport = $(elements.viewport);
        var $container = $viewport.find(elements.container);
        var $loading = $viewport.find(elements.loading);
        var $empty = $viewport.find(elements.empty);

        _ready = new RSVP.Promise(function(resolve, reject) {
            $container.isotope({
                layoutMode: 'packery',
                isInitLayout: true,
                packery: {
                    columnWidth: 220,
                    gutter: 25
                }
            });
            resolve();
        });

        this.isBusy = function() {
            App.Load.bar.start();
            $loading.show();
        }

        this.isWorking = function(howMuch) {
            App.Load.bar.inc(howMuch || 0.05);
        }

        this.isDone = function() {
            App.Load.bar.done();
            $loading.hide();
        }

        this.filter = function(path) {
            return new RSVP.Promise(function(resolve){
                _ready.then(function(){
                    $container.isotope({filter: '[data-path="' + path + '"]'});

                    // This timer is necessary so that the filter effect can
                    // have a moment to animate before showing more images.
                    // This fixes a graphical 'jitter' when changing folders.

                    setTimeout(resolve, 100);
                });
            });
        }

        this.append = function(imageInstance) {
            var $elem = _buildElem(imageInstance);
            $container.append($elem);
            $container.isotope('appended', $elem);
            _images[imageInstance.id] = $elem;
        }

        this.prepend = function(imageInstance) {
            var $elem = _buildElem(imageInstance);
            $container.prepend($elem);
            $container.isotope('prepended', $elem);
            _images[imageInstance.id] = $elem;
        }

        this.remove = function(imageInstance) {
            var $elem = _images[imageInstance.id];
            if ($elem) {
                $container.isotope('remove', $elem);
            }
        }

        this.relayout = function() {
            setTimeout(function(){
                $container.isotope('updateSortData');
            }, 100);
            setTimeout(function(){
                $container.isotope('layout');
            }, 500);
        }

        function _buildElem(imageInstance) {

            var $img = imageInstance.$elem;
            var data = imageInstance.data.local;
            var $a = $('<a class="image-wrapper"/>');

            $a.append($img);
            $a.attr('href', '#/' + data.id);
            $a.attr('data-date', data.time);
            $a.attr('data-path', data.dir);

            $a.on('click', function(evt){
                 // return false;
            });

            return $a;
        }
    }

    window.App.View = {
        create: function(a) {
            instance = new View(a);
            return instance;
        },
        getInstance: function() {
            return instance;
        }
    }

}());