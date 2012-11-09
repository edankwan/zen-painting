define([
        'exports',
        'app',
        'controllers/dataController',
        'controllers/paintController',
        'controllers/historyController',
        'controllers/socialController'
    ],
    function(uiController, app, dataController, paintController, historyController, socialController){

        var undef;

        // initial setting values can be found in the dataController
        uiController.guiData = {
            numOfBrush: 0,
            radiusBase: 0,
            radiusScale: 0,
            radiusPower: 0,
            color: [0,0,0],
            r: 0,
            g: 0,
            b: 0,
            opacity: 0,
            loadLocal: null,
            saveLocal: null,
            clearLocal: null,
            savePNG: _savePNG,
            viewCode: _viewCode,
            cleanUp: null,
            redraw: _redraw,
            undo: null,
            redo: null
        };

        var guiData = uiController.guiData;
        var _gui;
        var _guiBrush;
        var _guiFile;
        var _transparencyCheckbox;
        var _imageContainer;
        var _image;
        var _codeContainer;
        var _code;
        var _redrawBtn;

        var _footer;
        var _socialIcons;
        var _shareInfo;

        var _colorController;
        var _undoController;
        var _redoController;

        function init(){

            dataController.loadLocalStorageSetting();
            guiData.loadLocal = dataController.loadLocalStorageData;
            guiData.saveLocal = dataController.saveLocalStorageData;
            guiData.clearLocal = dataController.clearLocalStorage;

            guiData.cleanUp = paintController.clearRect;
            guiData.undo = historyController.undo;
            guiData.redo = historyController.redo;

            _initVariables();
            _initEvents();
        }

        function _initVariables(){
            _footer = document.getElementById('footer');
            _socialIcons = _footer.querySelectorAll('.social-icon');
            _shareInfo = _footer.querySelector('.info');

            _imageContainer = document.getElementById('image-container');
            _image = document.getElementById('image');
            _transparencyCheckbox = document.getElementById('transparency-checkbox');

            _codeContainer = document.getElementById('code-container');
            _code = document.getElementById('code');
            _redrawBtn = document.getElementById('redraw-btn');


            _gui = new dat.GUI();
        }

        function _initEvents(){

            _imageContainer.addEventListener('click', _onContainerClick, false);
            _transparencyCheckbox.addEventListener('click', _onTransparencyCheckboxClick);

            _codeContainer.addEventListener('click', _onContainerClick, false);
            _redrawBtn.addEventListener('click', _onRedrawClick);

            for(var i = 0; i < _socialIcons.length; i++) {
                _socialIcons[i].addEventListener('click', socialController.onFooterIconsClick, false);
            }

            _guiBrush = _gui.addFolder('Brush');
            _guiFile = _gui.addFolder('File');
            var colorController;
            _guiBrush.add(guiData, 'numOfBrush',1, 10).step(1).name('number of brush').onChange(paintController.onSettingChanged);
            _guiBrush.add(guiData, 'radiusBase', 0, 50).name('base radius').onChange(paintController.onSettingChanged);
            _guiBrush.add(guiData, 'radiusScale',0, 80).name('radius scale').onChange(paintController.onSettingChanged);
            _guiBrush.add(guiData, 'radiusPower',1, 500).name('radius power').onChange(paintController.onSettingChanged);
            _colorController = _guiBrush.addColor(guiData, 'color').onChange(updateRGB);
            _guiBrush.add(guiData, 'opacity', 0, 1).onChange(paintController.onSettingChanged);
            _guiFile.add(guiData, 'loadLocal').name('load local storage');
            _guiFile.add(guiData, 'saveLocal').name('save local storage');
            _guiFile.add(guiData, 'clearLocal').name('clear local storage');
            _guiFile.add(guiData, 'savePNG').name('save as PNG');
            _guiFile.add(guiData, 'viewCode').name('view codes');


            _gui.add(guiData, 'cleanUp').name('clean up canvas');
            _gui.add(guiData, 'redraw').name('redraw');
            _undoController = _gui.add(guiData, 'undo').name('undo (ctrl + z)');
            _redoController = _gui.add(guiData, 'redo').name('redo (ctrl + y)');

            _guiBrush.open();
            _guiFile.open();
        }

        function _redraw(){
            dataController.redrawData(dataController.compressData(dataController.data));
        }

        function _onRedrawClick(){
            _codeContainer.classList.remove('show');
            dataController.redrawData(_code.value);
        }

        function _onContainerClick(e){
            if(!e.target.classList.contains('interactive')) this.classList.remove('show');
        }

        function _onTransparencyCheckboxClick(){
            _showImage(this.checked);
        }

        function _showImage(isTransparent){
            var canvas = paintController.canvas;
            if(isTransparent) {
                _image.src = paintController.canvas.toDataURL('image/png');
            } else {
                var cache = document.createElement("canvas");
                var context = cache.getContext('2d');
                cache.width = canvas.width;
                cache.height = canvas.height;
                context.fillStyle = "#fff";
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(canvas, 0, 0);
                _image.src = cache.toDataURL('image/png');

                delete cache;
                delete context;
            }
        }

        function updateBrushSetting(){
            var controllers = _guiBrush.__controllers;
            for (var i in controllers) controllers[i].updateDisplay();
        }

        function updateRGB() {
            guiData.r = _colorController.__color.r >> 0;
            guiData.g = _colorController.__color.g >> 0;
            guiData.b = _colorController.__color.b >> 0;
            paintController.onSettingChanged();
        }

        function _savePNG(){
            _imageContainer.classList.add('show');
            _showImage(true);
        }


        function _viewCode(){
            _codeContainer.classList.add('show');
            _code.value = dataController.compressData(dataController.data);
        }



        function show(){
            document.getElementById('logo').classList.add('show');
            _footer.classList.add('show');
            document.querySelector('.dg.ac').classList.add('show');
        }

        function updateURLLength(num){
            _shareInfo.innerHTML = '<< SHARE YOUR ARTWORK (' + (num+10000).toString().substr(1) + '/' + socialController.MAXIMUM_DATA_LENGTH + ')';
            if(num > socialController.MAXIMUM_DATA_LENGTH) {
                _footer.classList.add('no-share');
            } else {
                _footer.classList.remove('no-share');
            }
        }

        function setUndoAvailability(bool){
            var classList = _undoController.domElement.parentNode.classList;
            if(bool) {
                _undoController.domElement.parentNode.classList.remove('disable');
            } else {
                _undoController.domElement.parentNode.classList.add('disable');
            }
        }

        function setRedoAvailability(bool){
            var classList = _redoController.domElement.parentNode.classList;
            if(bool) {
                classList.remove('disable');
            } else {
                classList.add('disable');
            }
        }

        uiController.init = init;
        uiController.updateRGB = updateRGB;
        uiController.updateBrushSetting = updateBrushSetting;
        uiController.updateURLLength = updateURLLength;
        uiController.show = show;
        uiController.setUndoAvailability = setUndoAvailability;
        uiController.setRedoAvailability = setRedoAvailability;

    }

);
