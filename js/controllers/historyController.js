define([
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
