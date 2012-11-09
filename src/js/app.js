define([
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


        var DEFAULT_DATA = 'Sso1F360295277772096q7F05882541036117p6F03676624962207l17t8p4kF23161765355552374/De06o21kkpjl8d7m9f1n2h5n1g5o5h8n2f5l3c8nb6kikfkdkb/Sso1F360295277772096q7F05882541036117p6F03676624962207l17t8p4kF23161765355552374/Dc37nkkkc6ch5b1h7if8b0h2kh8ef6dd0bb8kb7kked5cgcb7bhbfdjbfchbfcckebcbebc/Ssm0F404412337034238n3F52941270518058p6F03676624962207l60l42l00kF23161765355552374/Db79o70kkkepc6te8m9i8n6b12n0i5n6h5n0h7m3j8m1i2l0f5kb1kbkkkkkkkk/Spl4F338235696294326m2F05882414814512p6F03676624962207l60l42l00kF20955882940737863/Dc4l28kkkdn1c3p3d8q0e2r4e6r2d1r8d4q6c5o0b9m8b0l0gl3bl3cl5dl9b0m2b1n0b9n1c7m3c6m0c9l1b9m4e1m0d0l8c6kkl3c7l0b3/Spn6F948530448143075p5F5882368533257p6F03676624962207p2n9l0kF4080882467406847/Dg57o11kbkebb1mb1m1c1n6d3s2f3t8g8p8e1q9c5p8c3n2b3l6b0oglgkilglhoelembmdncodrf/Spm3F713235959256o4F11764829629024p6F03676624962207p2n9l0kF4080882467406847/Db12b1kkmgqb0tb9l6c7n3d9o1e2p0e9o7e0p3e0r0f1p9d8p8c9n3b7l8hshofkdcb0/Spl4F889706299997954m3F823530079996726p6F03676624962207o7n5qkF28676471392588654/Dc51f17kklsnm1kkkl7l0s1oq6pq4om0po4kp3lo3ko4mm7kl6lqklkkkkkkkkkkkkllmkkklkkkkklk/Spl4F889706299997954m3F823530079996726p6F03676624962207o7n5qkF28676471392588654/De23o04kkpel9b9m2d0m1d7td6tc5rb6pb2nhmindkblkkkkbkblkmcleoepisi/SprF169117848147163qF176470761480633p6F03676624962207o7n5qkF28676471392588654/Db53o08kkkfmb5td2l3e3m6h8m9g4m8f8m2f1m4g1l9f0rf4me5kc7cgbhkccdkd/Spl1F029412074072559l5F882353386664485p6F03676624962207l52l21o9kF11029412074072559/Dn25b19kkkb2kb6l4d3l2e0m1g1l6b23kb65c4h3c6kc4kb3kfkfk/Spo6F32353071110475q9F70588430813858p6F03676624962207l37n5n5kF5073529554073377/Dn24e01kkhpb9ne2kkkb24id7b0d2c0b3hkkrrn5m2p8m7p6l3p0rn1rl2qotlpkpkkkkkkkckckckhkjpd1oc9rc0qhpenfncmeodrfokqktotrsrl6l1pkl6nl2e/Spm8F676471392588653m6F470588977774142p6F03676624962207q5n6n6kF5073529554073377/Ssl2F132353281479816m5F588236011848338p6F03676624962207p7ttkF5073529554073377/Dm92d95kkkcdgib1b6b6d9c4i2d9f0c3/Ssl2F132353281479816m5F588236011848338p6F03676624962207l95l07l07kF5073529554073377/Dq15b74kmkpkpospl0ntnn/';

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
