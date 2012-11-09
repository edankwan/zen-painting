define([
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
