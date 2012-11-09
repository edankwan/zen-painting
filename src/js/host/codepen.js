window.__urlInfo = (function(){

    var queryString = {};
    var href = document.location.href.toString();
    var referrer = document.referrer.toString();
    var url = href.indexOf('http://secure.codepen.io/pen/secure_iframe') === 0 ? referrer : href;
    var baseUrl = url.match(/^(http[a-zA-Z0-9\.\-\_\/\:]*)/g)[0];
    var id = baseUrl.substr(baseUrl.lastIndexOf('/')+1);
    url.replace(new RegExp("([^?=&]+)(=([^&#]*))?", "g"),function($0, $1, $2, $3) {
        queryString[$1] = $3;
    });

    return {
        id: id,
        queryString: queryString,
        editorUrl: 'http://codepen.io/edankwan/pen/' + id,
        detailsUrl: 'http://codepen.io/edankwan/full/' + id
    };

}());
// for codepen, it is better to share details url instead of editor url because if the URI is too large, we can still use hash tag instead of querystring
window.__DEFAULT_SHARE_URL = window.__urlInfo.detailsUrl;
window.__QUERY_STRING = window.__urlInfo.queryString;

window.__isGoogleApiReady = false;
window.onGoogleApiReady = function(){
    window.__isGoogleApiReady = true;
};
