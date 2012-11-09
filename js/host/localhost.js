window.__urlInfo = (function(){

    var queryString = {};
    var url = document.location.href.toString();
    var baseUrl = url.match(/^([a-zA-Z0-9\.\-\_\/\:]*)/g)[0];
    url.replace(new RegExp("([^?=&]+)(=([^&#]*))?", "g"),function($0, $1, $2, $3) {
        queryString[$1] = $3;
    });

    return {
        queryString: queryString,
        url: url
    };

}());
window.__DEFAULT_SHARE_URL = window.__urlInfo.url;
window.__QUERY_STRING = window.__urlInfo.queryString;
