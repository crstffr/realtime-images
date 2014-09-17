window.App = window.App || {};

(function() {

    function Load() {
        this.bar = NProgress;

        this.inc = function(){
            this.bar.inc();
        }
    }

    window.App.Load = new Load();

}());