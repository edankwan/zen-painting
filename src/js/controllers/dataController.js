define([
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
