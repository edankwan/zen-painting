
define('controllers/historyController',[
        'exports',
        'app',
        'controllers/dataController',
        'controllers/uiController',
        'controllers/paintController'
    ],
    function(historyController, app, dataController, uiController, paintController){

        var undef;

        historyController.history = [];

        // index of the history array
        historyController.index = 0;

        historyController.MAX_UNDO_HISTORY = 8;

        var history = historyController.history;
        var _mapId = -1;

        function init(){

            _initVariables();
            _initEvents();

            reset();
        }

        function _initVariables(){

        }

        function _initEvents(){

        }

        function reset(){
            historyController.index = history.length;
            save();
        }

        function save(){
            history.splice(0, historyController.index);
            _mapId = _mapId - historyController.index + 1;
            _mapId = _mapId < 0 ? _mapId + historyController.MAX_UNDO_HISTORY : _mapId >= historyController.MAX_UNDO_HISTORY ? _mapId - historyController.MAX_UNDO_HISTORY: _mapId;
            historyController.index = 0;
            history.unshift(_mapId);
            history.splice(historyController.MAX_UNDO_HISTORY, 1);
            paintController.saveHistory(_mapId);
            dataController.saveHistory(_mapId);

            uiController.setUndoAvailability(history.length > 1);
            uiController.setRedoAvailability(false);
        }

        function undo(){
            if(history.length > 0 && historyController.index < history.length - 1) {
                if(app.playMode) dataController.endRedraw();
                historyController.index++;
                var id = history[historyController.index];
                paintController.loadHistory(id);
                dataController.loadHistory(id);
                uiController.setUndoAvailability(historyController.index < history.length - 1);
                uiController.setRedoAvailability(true);
            } else {

            }
        }

        function redo(){
            if(historyController.index > 0) {
                if(app.playMode) dataController.endRedraw();
                historyController.index--;
                var id = history[historyController.index];
                paintController.loadHistory(id);
                dataController.loadHistory(id);
                uiController.setUndoAvailability(true);
                uiController.setRedoAvailability(historyController.index > 0);
            } else {

            }
        }

        historyController.init = init;
        historyController.reset = reset;
        historyController.save = save;
        historyController.undo = undo;
        historyController.redo = redo;

    }

);

define('controllers/socialController',[
        'exports',
        'app',
        'controllers/dataController',
        'controllers/uiController',
        'controllers/paintController'
    ],
    function(socialController, app, dataController, uiController, paintController){

        var undef;

        socialController.SHARE_URL_BASE = window.__DEFAULT_SHARE_URL + '?data=';
        socialController.HASHED_SHARE_URL_BASE = window.__DEFAULT_SHARE_URL + '#';
        socialController.SHARE_URL_BASE_LENGTH = socialController.SHARE_URL_BASE.length;
        socialController.MAXIMUM_DATA_LENGTH = 2048 - socialController.SHARE_URL_BASE_LENGTH; //even though IE maximum uri length is 2083, Google url shortener only accept 2048 characters


        var API_KEY = 'AIzaSyAkV0WiUgBsOGcP8VS1AhSULMfwnndiMh0';

        var _container;
        var _longUrl;
        var _shortUrl;
        var _facebookBtn;
        var _twitterBtn;
        var _closeBtn;
        var _lastUrl = '';

        var _isShown = false;
        var _isGoogleShortenerReady = false;

        function init(){
            
            _initVariables();
            _initEvents();

            // if using codepen, dont use dynamic script loader
            if(!window.onGoogleApiReady) {
                _loadGoogleApi();
            } else if(window.__isGoogleApiReady){
                window.onGoogleApiReady = onGoogleApiReady;
                onGoogleApiReady();
            } else {
                window.onGoogleApiReady = onGoogleApiReady;
            }
        }

        function _initVariables(){
            _socialContainer = document.getElementById('share-container');
            _longUrl = document.getElementById('long-url');
            _shortUrl = document.getElementById('short-url');
            _facebookBtn = _socialContainer.querySelector('.facebook');
            _twitterBtn = _socialContainer.querySelector('.twitter');
            _closeBtn = _socialContainer.querySelector('.close-btn');
        }

        function _initEvents(){
            _socialContainer.addEventListener('click', _onContainerClicked);
        }

        function _onContainerClicked(e){
            if(e.target == _socialContainer || e.target == _closeBtn) _hide('show');
        }

        function _loadGoogleApi(){
            window.onGoogleApiReady = onGoogleApiReady;
            var scriptTag = document.createElement('script');
            scriptTag.type = 'text/javascript';
            scriptTag.src = 'https://apis.google.com/js/client.js?onload=onGoogleApiReady';
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(scriptTag, firstScriptTag);
        }

        function onGoogleApiReady(){
            gapi.client.setApiKey(API_KEY);
            gapi.client.load('urlshortener', 'v1', _onShortenerReady);
        }

        function _onShortenerReady(){
            _isGoogleShortenerReady = true;
            if(_isShown) {
                _requestShortenUrl();
            }
        }

        function _requestShortenUrl(){
            if(!_isGoogleShortenerReady) return;
            var url = socialController.SHARE_URL_BASE + dataController.compressData(dataController.data);
            var request = gapi.client.urlshortener.url.insert({'resource': {'longUrl': url}});
            request.execute(function(res) {
                if(_lastUrl != res.longUrl) return;
                if (res.error) {
                    _shortUrl.classList.add('error');
                    _shortUrl.value = 'Something is wrong and the url can\'t be shortened';
                } else {
                    _socialContainer.classList.add('ready');
                    _shortUrl.classList.remove('error');
                    _shortUrl.value = res.id;
                    _facebookBtn.setAttribute('href', 'https://www.facebook.com/sharer.php?u=' + encodeURIComponent(res.id) + '&t=Check out my artwork');
                    _twitterBtn.setAttribute('href', 'https://twitter.com/intent/tweet?text=' + encodeURIComponent('Check out my artwork: ') + encodeURIComponent(res.id));
                }
            });
        }

        function onFooterIconsClick(){
            var compressedData = dataController.compressData(dataController.data);
            _lastUrl = socialController.SHARE_URL_BASE + compressedData;
            _longUrl.value = socialController.HASHED_SHARE_URL_BASE + compressedData;
            
            _isShown = true;
            _facebookBtn.removeAttribute('href');
            _twitterBtn.removeAttribute('href');
            _socialContainer.classList.remove('ready');
            _socialContainer.classList.add('show');
            if(compressedData.length < socialController.MAXIMUM_DATA_LENGTH) {
                _shortUrl.value = 'Requesting Shortened URL from Google API...';
                _requestShortenUrl(_lastUrl);
            } else {
                _shortUrl.value = 'URL is too long as what she says that can\'t be shared via social network.';
            }
        }

        function _hide(){
            _isShown = false;
            _socialContainer.classList.remove('show');
        }



        socialController.init = init;
        socialController.onFooterIconsClick = onFooterIconsClick;

    }

);
define('controllers/paintController',[
        'exports',
        'app',
        'controllers/dataController',
        'controllers/uiController',
        'controllers/historyController',
        'controllers/socialController'
    ],
    function(paintController, app, dataController, uiController, historyController, socialController){

        var undef;

        paintController.canvas = null;

        var _canvas;
        var _context;
        var _cache;
        var _cacheContext;

        var _undoCaches = [];
        var _undoCacheContexts = [];

        var _ribbons = [];
        var _amount = 0;

        var _px = -1;
        var _py = -1;
        var _x = 0;
        var _y = 0;
        var _ptx = 0;
        var _pty = 0;
        var _tx = 0;
        var _ty = 0;

        var MAX_RIBBIONS = 10;


        function init(){

            _initVariables();
            _initEvents();
        }

        function _initVariables(){
            var i, undoCache;

            _canvas = paintController.canvas = document.getElementById('canvas');
            _context = _canvas.getContext('2d');
            _cache = document.createElement('canvas');
            _cacheContext = _cache.getContext('2d');

            for(i = 0; i < MAX_RIBBIONS; i++) {
                _ribbons[i] = new Ribbon(0, 0);
            }
            for(i = 0; i < historyController.MAX_UNDO_HISTORY; i++) {
                undoCache = _undoCaches[i] = document.createElement('canvas');
                _undoCacheContexts[i] = undoCache.getContext('2d');
            }
        }

        function _initEvents(){
        }

        function onResize(){
            _cacheContext.drawImage(_canvas, 0, 0);
            _canvas.width = app.stageWidth;
            _canvas.height =  app.stageHeight;
            _context.drawImage(_cache,  app.halfW - app.prevHalfW,  app.halfH - app.prevHalfH);
            Ribbon.maxDistance = Math.sqrt( app.halfW *  app.halfW +  app.halfH *  app.halfH) * 2;
            _cache.width =  app.stageWidth;
            _cache.height =  app.stageHeight;
        }

        function clearRect(){
            if(app.playMode) dataController.endRedraw();
            _context.clearRect(0, 0, window.innerWidth, window.innerHeight);
            dataController.data = '';
            app.playMode = false;
            historyController.save();
            uiController.updateURLLength(0);
        }


        function onSettingChanged(){
            var guiData = uiController.guiData;

            _amount = guiData.numOfBrush;
            var r = guiData.r >> 0;
            var g = guiData.g >> 0;
            var b = guiData.b >> 0;
            var opacity = guiData.opacity;
            _context.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
            _context.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (opacity * opacity * opacity)+ ')';

            var ribbon, d, length;
            for(var i = 0; i < _amount; i++) {
                d = (_amount - i) / _amount;
                ribbon = _ribbons[i];
                ribbon.radiusBase = d  * d  * d / _amount * guiData.radiusBase;
                ribbon.radiusScale = d * guiData.radiusScale;
                ribbon.radiusPower = guiData.radiusPower;
                length = Math.cos(d * Math.PI) * guiData.radiusBase;
                ribbon.offsetX = Math.sin(d * Math.PI * 2) * length;
                ribbon.offsetY =  Math.cos(d * Math.PI * 2) * length;
            }

            dataController.saveLocalStorageSetting();
        }

        function resetRibbons(x, y){
            for(var i = 0; i < _amount; i++) {
                _ribbons[i].reset(x, y);
            }
        }

        function setDownXY(x, y) {
            _ptx = _tx = _x = x;
            _pty = _ty = _y = y;
        }

        function setMoveXY(x, y) {
            _tx = x;
            _ty = y;
        }

        function drawLine(){
            _x += (_tx - _x) * .2;
            _y += (_ty - _y) * .2;
            var x = _x + app.halfW >> 0;
            var y = _y + app.halfH >> 0;
            var ribbon;
            if(_px == x && _py == y) return;
            _px = x;
            _py = y;
            if(!app.playMode) {
                dataController.appendData((_tx - _ptx) + '/' + (_ty - _pty) + '/');
                _ptx = _tx;
                _pty = _ty;
            }

            for(var i = 0; i < _amount; i++) {
                ribbon = _ribbons[i];
                ribbon.update(x +ribbon.offsetX, y + ribbon.offsetY);

                _context.beginPath();
                _context.moveTo(ribbon.p2_p0x, ribbon.p2_p0y);
                _context.quadraticCurveTo(ribbon.p2_c0x, ribbon.p2_c0y, ribbon.p1_p0x, ribbon.p1_p0y);
                _context.lineTo(ribbon.p1_p1x, ribbon.p1_p1y);
                _context.quadraticCurveTo(ribbon.p2_c1x, ribbon.p2_c1y, ribbon.p2_p1x, ribbon.p2_p1y);
                _context.fill();
                _context.stroke();
            }
        }

        function drawCap(){
            var ribbon;
            for(var i = 0; i < _amount; i++) {
                ribbon = _ribbons[i];
                _context.beginPath();
                _context.arc(ribbon.p1_x, ribbon.p1_y, ribbon.p1_radius, ribbon.previousAngle - Math.PI, ribbon.previousAngle, false);
                _context.fill();
            }
        }

        function loadHistory(id){
            var undoCache = _undoCaches[id];
            _context.clearRect(0, 0, app.stageWidth, app.stageHeight);
            _context.drawImage(undoCache,  app.stageWidth - undoCache.width >> 1,  app.stageHeight - undoCache.height >> 1);
        }

        function saveHistory(id){
            var undoCache = _undoCaches[id];
            var undoContext = _undoCacheContexts[id];
            undoCache.width = app.stageWidth;
            undoCache.height =  app.stageHeight;
            undoContext.clearRect(0, 0, app.stageWidth, app.stageHeight);
            undoContext.drawImage(_canvas, 0, 0);
        }

        paintController.init = init;
        paintController.onResize = onResize;
        paintController.clearRect = clearRect;
        paintController.resetRibbons = resetRibbons;
        paintController.onSettingChanged = onSettingChanged;
        paintController.setDownXY = setDownXY;
        paintController.setMoveXY = setMoveXY;
        paintController.drawLine = drawLine;
        paintController.drawCap = drawCap;
        paintController.loadHistory = loadHistory;
        paintController.saveHistory = saveHistory;

    }

);

define('controllers/uiController',[
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

define('controllers/dataController',[
        'exports',
        'app',
        'controllers/uiController',
        'controllers/paintController',
        'controllers/historyController',
        'controllers/socialController'
    ],
    function(dataController, app, uiController, paintController, historyController, socialController){

        var undef;

        /*
        special characters in the data:
        'S' => Setting
        'D' => Mouse Down
        'F' => Dot (.)
        'M' => Minus (-)
        A shitty compression is used to reduce the length of the data in order to share the art work through url:
            'M0..9': 'a..j'
            '/0..9': 'k..t'
        */

        var LOCAL_STORAGE_SETTING_ID = 'zen-painting-setting';
        var LOCAL_STORAGE_DATA_ID = 'zen-painting-data';

        dataController.LOCAL_STORAGE_DATA_ID = LOCAL_STORAGE_DATA_ID;
        dataController.setting = localStorage[LOCAL_STORAGE_SETTING_ID] ? JSON.parse(localStorage[LOCAL_STORAGE_SETTING_ID]) : {
            numOfBrush: 5,
            radiusBase: 15,
            radiusScale: 20,
            radiusPower: 150,
            r: 0,
            g: 0,
            b: 0,
            opacity: 1
        };
        dataController.settingChanged = false;
        dataController.data = '';

        var _dataArr = [];
        var _x;
        var _y;
        var _savedSetting = {};
        var _undoData = [];
        var _undoSettings = [];

        var setting = dataController.setting;

        var COMPRESSION_SKIP = 30;
        var _compressionCount = COMPRESSION_SKIP;
        var _compressionCountDataLength = 0;


        function init(){

            _initVariables();
            _initEvents();

        }

        function _initVariables(){
            if(localStorage[LOCAL_STORAGE_SETTING_ID]) dataController.setting = JSON.parse(localStorage[LOCAL_STORAGE_SETTING_ID]);

            for(i = 0; i < historyController.MAX_UNDO_HISTORY; i++) {
                _undoData[i] = "";
                _undoSettings[i] = {};
            }
        }

        function _initEvents(){

        }

        function loadLocalStorageData(){
            if(localStorage[LOCAL_STORAGE_DATA_ID]) redrawData(localStorage[LOCAL_STORAGE_DATA_ID]);
        }

        function redrawData(data){
            paintController.clearRect();
            dataController.data = decompressData(data);
            uiController.updateURLLength(_getCompressedLength(dataController.data));

            _saveSetting(_savedSetting);
            _dataArr = dataController.data.replace(/M/g,'/-').replace(/F/g,'.').split('/');
            app.playMode = true;
        }

        function _saveSetting(settingObject){
            var guiData = uiController.guiData;
            for(var i in guiData) settingObject[i] = guiData[i];
        }
        function _loadSetting(settingObject){
            var guiData = uiController.guiData;
            for(var i in settingObject) guiData[i] = settingObject[i];
            uiController.updateBrushSetting();
            paintController.onSettingChanged();
        }

        function saveLocalStorageData(){
            localStorage[LOCAL_STORAGE_DATA_ID] = compressData(dataController.data);
        }

        function loadLocalStorageSetting(){
            var guiData = uiController.guiData;
            guiData.numOfBrush = setting.numOfBrush;
            guiData.radiusBase = setting.radiusBase;
            guiData.radiusScale = setting.radiusScale;
            guiData.radiusPower = setting.radiusPower;
            guiData.color[0] = setting.r;
            guiData.color[1] = setting.g;
            guiData.color[2] = setting.b;
            guiData.opacity = setting.opacity;
        }

        function saveLocalStorageSetting(){
            var guiData = uiController.guiData;
            setting.numOfBrush = guiData.numOfBrush;
            setting.radiusBase = guiData.radiusBase;
            setting.radiusScale = guiData.radiusScale;
            setting.radiusPower = guiData.radiusPower;
            setting.r = guiData.r >> 0;
            setting.g = guiData.g >> 0;
            setting.b = guiData.b >> 0;
            setting.opacity = guiData.opacity;
            localStorage[LOCAL_STORAGE_SETTING_ID] = JSON.stringify(setting);

            dataController.settingChanged = true;
        }

        function clearLocalStorage(){
            localStorage[LOCAL_STORAGE_DATA_ID] = '';
            localStorage[LOCAL_STORAGE_SETTING_ID] = '';

            dataController.settingChanged = true;
        }


        function runData(){
            var guiData;
            if(_dataArr.length > 1) {
                if(_dataArr[0] == 'S') {
                    guiData = uiController.guiData;
                    _dataArr.shift();
                    guiData.numOfBrush = parseInt(_dataArr.shift(), 10);
                    guiData.radiusBase = parseFloat(_dataArr.shift());
                    guiData.radiusScale = parseFloat(_dataArr.shift());
                    guiData.radiusPower = parseFloat(_dataArr.shift());
                    guiData.r = guiData.color[0] = _dataArr.shift();
                    guiData.g = guiData.color[1] = _dataArr.shift();
                    guiData.b = guiData.color[2] = _dataArr.shift();
                    guiData.opacity = parseFloat(_dataArr.shift());
                    uiController.updateBrushSetting();
                    paintController.onSettingChanged();
                } else if(_dataArr[0] == 'D') {
                    _dataArr.shift();
                    _x = parseInt(_dataArr.shift(), 10);
                    _y = parseInt(_dataArr.shift(), 10);
                    paintController.setDownXY(_x, _y);
                    paintController.resetRibbons(_x + app.halfW, _y + app.halfH);
                    paintController.drawLine();
                } else {
                    _x = parseInt(_dataArr.shift(), 10) + _x;
                    _y = parseInt(_dataArr.shift(), 10) + _y;
                    paintController.setMoveXY(_x, _y);
                    paintController.drawLine();

                    if(_dataArr.length === 0 || isNaN(parseInt(_dataArr[0], 10))) {
                        paintController.drawCap();
                    }
                }
            } else{
                _dataArr.shift();
                endRedraw();
                historyController.save();
            }
        }

        function endRedraw(){
            app.playMode = false;
            _loadSetting(_savedSetting);
        }

        /*
         * Append the data and convert the seperator / coming with - into 'M' and . into F.
         */
        function appendData(str) {
            dataController.data = (dataController.data + str).replace(/\/\-/g, 'M').replace(/\./g, 'F');
        }

        /**
         * a slightly faster way to get the length of the compressed data instead of getting the length after compressed the data
         * @param  {String} data - raw data
         * @return {int}       length of the compressed data
         */
        function _getCompressedLength(data){
            var i, character, code;
            var output = data.length;
            for(i = 0, len = output; i < len; i++) {
                character = data[i];
                if((character == 'M' || character == '/') && (i+1 < len && (code = data.charCodeAt(i+1)) > 47 && code < 58)) output--;
            }
            return  output;
        }


        /**
         * shitty compression to reduce the length of the data
         * @param  {String} data - raw data
         * @return {String}       compressed data
         */
        function compressData(data){
            var i, len, character, code;
            var arr = [];
            for(i = 0, len = data.length; i < len; i++) {
                character = data[i];
                if((character == 'M' || character == '/') && (i+1 < len && (code = data.charCodeAt(i+1)) > 47 && code < 58)) {
                    arr.push(String.fromCharCode(character == 'M' ? code + 49 : code + 59));
                    i++;
                } else {
                    arr.push(character);
                }
            }
            return  arr.join('');
        }

        /**
         * data decompression
         * @param  {String} data - compressed data
         * @return {String}       raw data
         */
        function decompressData(data){
            var i, len, code;
            var arr = [];
            for(i = 0, len = data.length; i < len; i++) {
                if((code = data.charCodeAt(i)) > 106) {
                    arr.push('/' , String.fromCharCode(code - 59));
                } else if(code > 96) {
                    arr.push('M' , String.fromCharCode(code - 49));
                } else {
                    arr.push(data[i]);
                }
            }
            return arr.join('');
        }

        function compressTick(){
            if(_compressionCount === 0) {
                if(_compressionCountDataLength < socialController.MAXIMUM_DATA_LENGTH && _compressionCountDataLength != dataController.data.length) {
                    _compressionCountDataLength = _getCompressedLength(dataController.data);
                    _compressionCount = COMPRESSION_SKIP;
                    uiController.updateURLLength(_compressionCountDataLength);
                }
            } else {
                _compressionCount--;
            }
        }


        function loadHistory(id){
            _compressionCountDataLength = 0;
            _compressionCount = 0;
            compressTick();
            dataController.data = _undoData[id];
            //_loadSetting(_undoSettings[id]);
            uiController.updateURLLength(_getCompressedLength(dataController.data));
        }

        function saveHistory(id){
            _undoData[id] = dataController.data;
            //_saveSetting(_undoSettings[id]);
        }

        dataController.init = init;
        dataController.loadLocalStorageData = loadLocalStorageData;
        dataController.saveLocalStorageData = saveLocalStorageData;
        dataController.clearLocalStorage = clearLocalStorage;
        dataController.loadLocalStorageSetting = loadLocalStorageSetting;
        dataController.saveLocalStorageSetting = saveLocalStorageSetting;
        dataController.redrawData = redrawData;
        dataController.endRedraw = endRedraw;
        dataController.runData = runData;
        dataController.appendData = appendData;
        dataController.compressData = compressData;
        dataController.decompressData = decompressData;
        dataController.compressTick = compressTick;
        dataController.loadHistory = loadHistory;
        dataController.saveHistory = saveHistory;



    }

);

define('app',[
        'exports',
        'controllers/dataController',
        'controllers/uiController',
        'controllers/paintController',
        'controllers/historyController',
        'controllers/socialController'
    ],
    function(app, dataController, uiController, paintController, historyController, socialController){

        var undef;


        app.stageWidth = window.innerWidth;
        app.stageHeight = window.innerHeight;
        app.halfW = 0;
        app.halfH = 0;
        app.prevHalfW = 0;
        app.prevHalfH = 0;
        app.playMode = false;
        app.isDown = false;


        var DEFAULT_DATA = 'Sso1F360295277772096q7F05882541036117p6F03676624962207l17t8p4kF23161765355552374/De06o21kkpjl8d7m9f1n2h5n1g5o5h8n2f5l3c8nb6kikfkdkb/Sso1F360295277772096q7F05882541036117p6F03676624962207l17t8p4kF23161765355552374/Dc37nkkkc6ch5b1h7if8b0h2kh8ef6dd0bb8kb7kked5cgcb7bhbfdjbfchbfcckebcbebc/Ssm0F404412337034238n3F52941270518058p6F03676624962207l60l42l00kF23161765355552374/Db79o70kkkepc6te8m9i8n6b12n0i5n6h5n0h7m3j8m1i2l0f5kb1kbkkkkkkkk/Spl4F338235696294326m2F05882414814512p6F03676624962207l60l42l00kF20955882940737863/Dc4l28kkkdn1c3p3d8q0e2r4e6r2d1r8d4q6c5o0b9m8b0l0gl3bl3cl5dl9b0m2b1n0b9n1c7m3c6m0c9l1b9m4e1m0d0l8c6kkl3c7l0b3/Spn6F948530448143075p5F5882368533257p6F03676624962207p2n9l0kF4080882467406847/Dg57o11kbkebb1mb1m1c1n6d3s2f3t8g8p8e1q9c5p8c3n2b3l6b0oglgkilglhoelembmdncodrf/Spm3F713235959256o4F11764829629024p6F03676624962207p2n9l0kF4080882467406847/Db12b1kkmgqb0tb9l6c7n3d9o1e2p0e9o7e0p3e0r0f1p9d8p8c9n3b7l8hshofkdcb0/Spl4F889706299997954m3F823530079996726p6F03676624962207o7n5qkF28676471392588654/Dc51f17kklsnm1kkkl7l0s1oq6pq4om0po4kp3lo3ko4mm7kl6lqklkkkkkkkkkkkkllmkkklkkkkklk/Spl4F889706299997954m3F823530079996726p6F03676624962207o7n5qkF28676471392588654/De23o04kkpel9b9m2d0m1d7td6tc5rb6pb2nhmindkblkkkkbkblkmcleoepisi/SprF169117848147163qF176470761480633p6F03676624962207o7n5qkF28676471392588654/Db53o08kkkfmb5td2l3e3m6h8m9g4m8f8m2f1m4g1l9f0rf4me5kc7cgbhkccdkd/Spl1F029412074072559l5F882353386664485p6F03676624962207l52l21o9kF11029412074072559/Dn25b19kkkb2kb6l4d3l2e0m1g1l6b23kb65c4h3c6kc4kb3kfkfk/Spo6F32353071110475q9F70588430813858p6F03676624962207l37n5n5kF5073529554073377/Dn24e01kkhpb9ne2kkkb24id7b0d2c0b3hkkrrn5m2p8m7p6l3p0rn1rl2qotlpkpkkkkkkkckckckhkjpd1oc9rc0qhpenfncmeodrfokqktotrsrl6l1pkl6nl2e/Spm8F676471392588653m6F470588977774142p6F03676624962207q5n6n6kF5073529554073377/Ssl2F132353281479816m5F588236011848338p6F03676624962207p7ttkF5073529554073377/Dm92d95kkkcdgib1b6b6d9c4i2d9f0c3/Ssl2F132353281479816m5F588236011848338p6F036766249622/Dq15b74kmkpkpospl0ntnn/';

        var _canvas;

        function init(){

            _initVariables();
            _initEvents();

            dataController.init();
            uiController.init();

            uiController.show();
            uiController.updateURLLength(0);

            paintController.init();
            historyController.init();
            socialController.init();

            _drawDefaultData();

            uiController.updateRGB();
            _onResize();
            _loop();


        }

        function _drawDefaultData(){
            var href = window.location.href.toString();
            var data = DEFAULT_DATA;
            if(href.indexOf('#') > 0) {
                data = href.split('#')[1];
            } else if (window.__QUERY_STRING['data']){
                data = window.__QUERY_STRING['data'];
            }
            dataController.redrawData(data);
        }

        function _initVariables(){
            _canvas = document.getElementById('canvas');
        }

        function _initEvents(){
            window.addEventListener('resize', _onResize);
            window.addEventListener('orientationchange', _onResize);

            if('ontouchstart' in window) {
                _canvas.addEventListener('touchstart', function(e){e.preventDefault(); _onDown(_parseTouchEvent(e));});
                window.addEventListener('touchmove', function(e){e.preventDefault(); _onMove(_parseTouchEvent(e));});
                window.addEventListener('touchend', function(e){_onUp(_parseTouchEvent(e));});
            } else {
                _canvas.addEventListener('mousedown', function(e){e.preventDefault(); _onDown(e);});
                window.addEventListener('mousemove', function(e){e.preventDefault(); _onMove(e);});
                window.addEventListener('mouseup', _onUp);
            }
            window.addEventListener('keyup', _onKey);
        }


        function _onKey(e){
            if(e.ctrlKey) {
                if(e.keyCode == 90) {
                    historyController.undo();
                }else if(e.keyCode == 89) {
                    historyController.redo();
                }
            }
        }

        function _parseTouchEvent(e){
            var fakeEvent = e.touches.length > 0 ? e.touches[0] : e.changedTouches[0];
            return fakeEvent;
        }

        function _onDown(e){
            var x = e.pageX - app.halfW;
            var y = e.pageY - app.halfH;
            app.isDown = true;

            if(app.playMode) paintController.clearRect();

            paintController.setDownXY(x, y);
            paintController.resetRibbons(e.pageX, e.pageY);
            if(dataController.settingChanged) {
                var guiData = uiController.guiData;
                dataController.appendData('S/' + guiData.numOfBrush + '/' + guiData.radiusBase + '/' + guiData.radiusScale + '/' + guiData.radiusPower + '/' + guiData.r + '/' + guiData.g + '/' + guiData.b + '/' + guiData.opacity + '/');
            }
            dataController.appendData('D/'+ x + '/' + y + '/');
        }

        function _onMove(e){
            if(!app.isDown) return;
            paintController.setMoveXY(e.pageX - app.halfW, e.pageY - app.halfH);
        }

        function _onUp(e){
            if(!app.isDown) return;
            app.isDown = false;
           paintController.drawCap();
           historyController.save();
        }

        function _onResize(){
            app.prevHalfW = app.halfW;
            app.prevHalfH = app.halfH;
            app.stageWidth = window.innerWidth;
            app.stageHeight = window.innerHeight;
            app.halfW = app.stageWidth >> 1;
            app.halfH = app.stageHeight >> 1;

            paintController.onResize();
            paintController.onSettingChanged();
        }


        function _loop(){
            window.requestAnimationFrame(_loop);
            if(app.playMode) {
                dataController.runData();

                return;
            }

            dataController.compressTick();

            if(!app.isDown) return;
            paintController.drawLine();
        }

        setTimeout(init);

    }

);
