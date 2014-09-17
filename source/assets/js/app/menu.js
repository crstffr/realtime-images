window.App = window.App || {};

(function() {

    var instance;

    function Menu(element) {

        var _self = this;
        var _util = window.Utils;

        var _tree;
        var _ready;
        var _current;
        var _handlers = [];
        var $menu = $(element);
        var $folders = $();
        var $back;

        this.select = _select;
        this.destroy = _destroy;
        this.makeFancy = _makeFancy;
        this.buildFolder = _buildFolder;

        _ready = new RSVP.Promise(function(resolve, reject){
            $menu.on('onInit.waSlideMenu', function(){
                resolve();
            });
        });

        this.ready = function() {
            return _ready;
        }

        this.onClick = function(handler){
            _handlers.push(handler);
            return this;
        }

        /**
         *
         * @param id
         * @return {*}
         * @private
         */
        function _getParentElement(id) {
            return (id) ? _getFolder(id) : $menu;
        }

        /**
         *
         * @return {*}
         * @private
         */
        function _getFolders() {
            return $menu.find('li[data-id]');
        }

        /**
         *
         * @param id
         * @return {*}
         * @private
         */
        function _getFolder(id) {
            return $menu.find('li[data-id="' + id + '"]');
        }

        /**
         *
         * @param folder
         * @private
         */
        function _buildFolder(folder) {

            if (folder.count.folders === 0) { return; }

            var $ul = $('<ul/>');
            var $parent = _getParentElement(folder.id);
            $parent.append($ul);

            for (var name in folder.folders) {
                if (folder.folders.hasOwnProperty(name)) {
                    var data = folder.folders[name];
                    var $li = _buildElement($parent, name, data);
                    $ul.append($li);
                    _buildFolder(data);
                }
            }

            $folders = _getFolders();
        }

        /**
         *
         * @param path
         * @private
         */
        function _select(path) {
            if (!path) { return; }
            _self.ready().then(function(){
                var $folder = _getFolder(path);
                $folders.removeClass('selected');
                $folder.addClass('selected');
            });
        }

        /**
         *
         * @return {*}
         * @private
         */
        function _destroy() {
            $menu.waSlideMenu('exec','destroy');
            $menu.empty();
            _tree = {};
            return this;
        }

        /**
         *
         * @private
         */
        function _makeFancy() {
            $menu.waSlideMenu({
                slideSpeed: 200,
                backOnTop: true,
                autoHeightMenu: false,
                backLinkContent: '..'
            });
            $back = $menu.find('.waSlideMenu-back a');
            $back.on('click', _onMenuClick);
        }

        /**
         *
         * @param $parent
         * @param name
         * @param data
         * @return {*}
         * @private
         */
        function _buildElement($parent, name, data) {
            
            var id = data.id;
            var $li, $a;

            $a = $('<a/>');
            $li = $('<li/>');

            $a.text(name);
            $a.appendTo($li);
            $li.attr('data-id', id);
            $li.addClass('menu-item');
            $a.attr('href', '#/' + id);
            $a.on('click', _onMenuClick);

            if (data.count.folders > 0) {
                $a.addClass('has-children');
            }

            return $li;
        }


        function _onMenuClick(event) {
            var element = this;
            _handlers.forEach(function(handler, i){
                if (typeof handler !== 'function') { return; }
                var path = $(element).attr('href').replace('#/','');
                handler.bind(element)(event, path);
            });
        }


    }

    window.App.Menu = {
        create: function(a) {
            instance = new Menu(a);
            return instance;
        },
        getInstance: function() {
            return instance;
        }
    }

}());