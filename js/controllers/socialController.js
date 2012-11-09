define([
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