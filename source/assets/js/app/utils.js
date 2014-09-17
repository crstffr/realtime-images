window.App = window.App || {};

(function() {

    function Utils() {

        this.arrayUnique = function(array) {
            var a = array.concat();
            for (var i = 0; i < a.length; ++i) {
                for (var j = i + 1; j < a.length; ++j) {
                    if (a[i] === a[j])
                        a.splice(j--, 1);
                }
            }
            return a;
        }

        this.objectToArray = function(object) {
            var arr = [];
            for(var i in object) {
                if (object.hasOwnProperty(i)) {
                    arr.push(object[i]);
                }
            }
            return arr;
        }

        this.loadLiveReloadScript = function() {
            if (window.config && window.config.livereload) {
                var url, config = window.config.livereload;
                var host = window.document.location.hostname;
                if (config[host]) {
                    url = '//' + host + ':' + config[host].port + '/livereload.js';
                    this.loadScript(url);
                }
            }
        }

        this.loadScript = function(url) {
            var el, s;
            el = document.createElement('script');
            el.type = 'text/javascript';
            el.async = true; el.src = url;
            s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(el, s);
        }

    }

    window.Utils = window.App.Utils = new Utils();

}());