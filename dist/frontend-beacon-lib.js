


(function(window, navigator) {

    var reportOnInit = function() {
        var report = getBaseReport();
        report.type = 'init';
        track(report);
    };

    var initOnError = function() {
        var _onError = window.onerror;

        window.onerror = function(e, url, lineNumber, columnNumber, eObject){
            if(_onError){
                _onError.apply(window, [e, url, lineNumber, columnNumber, eObject]);
            }

            eObject = eObject || {};

            var report = getBaseReport(),
                _report = options.report.fields;

            report.type = 'error';
            if(_report.url) report.url = location.href;
            if(_report.errorText) report.errorText = e;
            if(_report.errorName) report.errorName = eObject.name;
            if(_report.errorMessage) report.errorMessage = eObject.message;
            if(_report.errorStack) report.errorStack = eObject.stack;
            if(_report.lineNumber) report.lineNumber = lineNumber;
            if(_report.columnNumber) report.columnNumber = columnNumber;

            track(report);
        };
    };

    var generateUUID = function () {
        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
            d += performance.now(); //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    };

    var onAjaxDone = function() {
        consoleLog('onAjaxDone');
        ajaxDone = true;
    };

    var ajax = function(data, bSynchronous) {

        ajaxDone = false;

        var ajaxOptions = options.report.ajaxOptions;

        if (navigator && navigator.sendBeacon) {
            navigator.sendBeacon(ajaxOptions.url, JSON.stringify(data));
            ajaxDone = true;
            return;
        }


        if(window.$ && $.ajax && !ajaxOptions.builtIn){
            var jqOptions = {
                type: ajaxOptions.method,
                url: ajaxOptions.url,
                dataType: (ajaxOptions.sendJSON ? 'json' : undefined),
                async: !ajaxOptions.synchronous,
                data: data,
                success: onAjaxDone,
                error: onAjaxDone
            };
            if (bSynchronous) {
                jqOptions.async = false;
            }
            return $.ajax(jqOptions);
        }

        var oParams = {
            method: ajaxOptions.method,
            url: ajaxOptions.url,
            sendJSON: ajaxOptions.sendJSON,
            params: data,
            success: onAjaxDone,
            failure: onAjaxDone
        };

        var sUrl = oParams.url,
            method = oParams.method,
            params = oParams.params || {},
            sData = '',
            bAsync = !ajaxOptions.synchronous,
            p,
            type = oParams.type || 'json',
            headers = oParams.headers || {};

        if (bSynchronous) {
            bAsync = false;
        }

        /* clean up the '&' garbage */
        if(sData.replace(/\&/g, '') === ''){
            sData = '';
        }

        for(p in params){
            sData += p+'='+params[p] + '&';
        }

        sData = sData.substring(0, sData.length - 1);

        var oBeforeSend = oParams.beforeSend || null,
            oErrorCallback = oParams.failure || null,
            oSuccessCallback = oParams.success || null,
            oXhr = null;

        try{
            if(window.ActiveXObject){
                oXhr = new ActiveXObject('Microsoft.XMLHTTP');
            }
            else if(window.XMLHttpRequest){
                oXhr = new XMLHttpRequest();
            }

        }
        catch(oError){}

        var bLocal = (window.location.protocol === 'file:');

        if(oXhr){
            oXhr.onreadystatechange = function(){
                if(oXhr.readyState === 4){
                    if(bLocal || (oXhr.status >= 200 && oXhr.status < 300)) {
                        if(oSuccessCallback){
                            switch(type){
                                case 'json':
                                    oSuccessCallback(eval( '(' + oXhr.responseText + ')' ), oXhr.status, oXhr, sUrl);
                                    break;

                                case 'html':
                                case 'text':
                                    oSuccessCallback(oXhr.responseText , oXhr.status, oXhr, sUrl);
                                    break;

                                default:
                                    throw new Error('this type is not set');
                            }
                        }
                    }
                    if(oXhr.status >= 400) {
                        if (oErrorCallback){
                            oErrorCallback(oXhr, oXhr.status, oXhr.statusText, sUrl);
                        }
                    }

                    oXhr.onreadystatechange = new window.Function;
                    oXhr = null;
                }
            };

            if(!window.ActiveXObject){
                oXhr.onerror = function(){
                    if(oErrorCallback){
                        oErrorCallback(oXhr, 0, '', sUrl);
                    }
                };
            }

            method = method.toUpperCase();

            if (bAsync) {
                oXhr.timeout = 10;
            }

            if(method === 'GET'){
                if(sData !== ''){
                    if(sUrl.indexOf('?') === -1){
                        sUrl += '?';
                    }
                    sUrl += sData;
                }
                oXhr.open('GET', sUrl, bAsync);
            }
            else{
                oXhr.open(method, sUrl, bAsync);
                oXhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

                if( oParams.sendJSON ){
                    oXhr.setRequestHeader('Content-type', 'application/json');
                }
                else{
                    oXhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                }

                for(var p in headers){
                    oXhr.setRequestHeader(p, headers[p]);
                }
            }

            if(oBeforeSend){
                oBeforeSend(oXhr);
            }
            try{
                if( oParams.sendJSON ){
                    oXhr.send( JSON.stringify(oParams.params) );
                }
                else{
                    oXhr.send(sData);
                }

                if(!bAsync){
                    if(oSuccessCallback){
                        switch(type){
                            case 'json':
                                oSuccessCallback(eval( '(' + oXhr.responseText + ')' ), oXhr.status, oXhr, sUrl);
                                break;
                            case 'html':
                            case 'text':
                                oSuccessCallback(oXhr.responseText , oXhr.status, oXhr, sUrl);
                                break;
                            default:
                                throw new Error('this type is not set');
                        }
                    }
                }
            }
            catch(e){
                if (bLocal){
                    if (oErrorCallback){
                        oErrorCallback(oXhr, oXhr.status, oXhr.statusText, sUrl);
                        oXhr.onreadystatechange = new window.Function;
                        oXhr = null;
                    }
                }
            }
        }
    };

    var getUserInfo = function(){
        var unknown = 'Unknown', result = {};

        // browser
        var nVer = navigator.appVersion,
            nAgt = navigator.userAgent,
            browser = navigator.appName,
            version = '' + parseFloat(navigator.appVersion),
            majorVersion = parseInt(navigator.appVersion, 10),
            nameOffset, verOffset, ix;

        // Opera
        if((verOffset = nAgt.indexOf('Opera')) !== -1){
            browser = 'Opera';
            version = nAgt.substring(verOffset + 6);

            if((verOffset = nAgt.indexOf('Version')) !== -1){
                version = nAgt.substring(verOffset + 8);
            }
        }

        // Opera Next
        if ((verOffset = nAgt.indexOf('OPR')) !== -1) {
            browser = 'Opera';
            version = nAgt.substring(verOffset + 4);
        }
        // Edge
        else if((verOffset = nAgt.indexOf('Edge')) !== -1) {
            browser = 'Microsoft Edge';
            version = nAgt.substring(verOffset + 5);
        }
        // MSIE
        else if((verOffset = nAgt.indexOf('MSIE')) !== -1) {
            browser = 'Microsoft Internet Explorer';
            version = nAgt.substring(verOffset + 5);
        }
        // Chrome
        else if((verOffset = nAgt.indexOf('Chrome')) !== -1) {
            browser = 'Chrome';
            version = nAgt.substring(verOffset + 7);
        }
        // Safari
        else if((verOffset = nAgt.indexOf('Safari')) !== -1) {
            browser = 'Safari';
            version = nAgt.substring(verOffset + 7);
            if((verOffset = nAgt.indexOf('Version')) !== -1) {
                version = nAgt.substring(verOffset + 8);
            }
        }
        // Firefox
        else if((verOffset = nAgt.indexOf('Firefox')) !== -1) {
            browser = 'Firefox';
            version = nAgt.substring(verOffset + 8);
        }
        // MSIE 11+
        else if(nAgt.indexOf('Trident/') !== -1) {
            browser = 'Microsoft Internet Explorer';
            version = nAgt.substring(nAgt.indexOf('rv:') + 3);
        }
        // Other browsers
        else if((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
            browser = nAgt.substring(nameOffset, verOffset);
            version = nAgt.substring(verOffset + 1);
            if(browser.toLowerCase() === browser.toUpperCase()) {
                browser = navigator.appName;
            }
        }
        // trim the version string
        if((ix = version.indexOf(';')) !== -1) version = version.substring(0, ix);
        if((ix = version.indexOf(' ')) !== -1) version = version.substring(0, ix);
        if((ix = version.indexOf(')')) !== -1) version = version.substring(0, ix);

        majorVersion = parseInt('' + version, 10);
        if(isNaN(majorVersion)){
            version = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        // mobile version
        var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

        // cookie
        var cookieEnabled = (navigator.cookieEnabled) ? true : false;

        if(typeof navigator.cookieEnabled === 'undefined' && !cookieEnabled){
            document.cookie = 'testcookie';
            cookieEnabled = (document.cookie.indexOf('testcookie') != -1) ? true : false;
        }

        // system
        var os = unknown;
        var clientStrings = [
            {s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/},
            {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
            {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
            {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
            {s:'Windows Vista', r:/Windows NT 6.0/},
            {s:'Windows Server 2003', r:/Windows NT 5.2/},
            {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
            {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
            {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
            {s:'Windows 98', r:/(Windows 98|Win98)/},
            {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
            {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
            {s:'Windows CE', r:/Windows CE/},
            {s:'Windows 3.11', r:/Win16/},
            {s:'Android', r:/Android/},
            {s:'Open BSD', r:/OpenBSD/},
            {s:'Sun OS', r:/SunOS/},
            {s:'Linux', r:/(Linux|X11)/},
            {s:'iOS', r:/(iPhone|iPad|iPod)/},
            {s:'Mac OS X', r:/Mac OS X/},
            {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
            {s:'QNX', r:/QNX/},
            {s:'UNIX', r:/UNIX/},
            {s:'BeOS', r:/BeOS/},
            {s:'OS/2', r:/OS\/2/},
            {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
        ];

        for(var id in clientStrings){
            var cs = clientStrings[id];
            if(cs.r.test(nAgt)){
                os = cs.s;
                break;
            }
        }

        var osVersion = unknown;

        if (/Windows/.test(os)) {
            osVersion = /Windows (.*)/.exec(os)[1];
            os = 'Windows';
        }

        switch(os){
            case 'Mac OS X':
                osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                break;
            case 'Android':
                osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                break;
            case 'iOS':
                osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                break;
        }

        result.userAgent = navigator.userAgent;
        result.os = os +' '+ osVersion;
        result.browser = browser + ' ' + majorVersion;
        result.mobile = mobile;

        result.sessionID = generateUUID();

        return result;
    };

     var getBaseReport = function(){

         var report = {},
             _report = options.report.fields;

         if(_report.userAgent) report.userAgent = userInfo.userAgent;
         if(_report.os) report.os = userInfo.os;
         if(_report.browser) report.browser = userInfo.browser;
         if(_report.mobile) report.mobile = userInfo.mobile;
         if(_report.url) report.url = location.href;

         report.sessionID = userInfo.sessionID;

         return report;
    };

    var track = function(data) {
        data.ts = new Date();
        data.sessionID = userInfo.sessionID;

        if (!options.report || !options.report.buffer) {
            return ajax(data);
        }

        trackBuffer.push(data);
    };

    var delay = function (ms) {
        var wd = 0;
        var start = new Date();
        while (!ajaxDone) {
            var now = new Date();
            if (now - start > ms)
                return;
            if (wd++ > ms * 1000)
                return;
        }
    };

    var flushBuffer = function(synchronous) {
        if (!trackBuffer.length)
            return;

        var opt = options.report.beforeUnload || {};
        ajax(trackBuffer, synchronous && opt.synchronous);
        trackBuffer = [];
        if (synchronous && opt.delay > 0) {
            delay(opt.delay);
        }
    };

    var options = window['loggingOptions'] || {};

    var userInfo = getUserInfo();

    var trackBuffer = [];
    var ajaxDone = false;

    if (window.console) {

        var consoleDebug = window.console.debug;
        var consoleLog = window.console.log;
        var consoleError = window.console.error;
        var consoleInfo = window.console.info;
        var consoleWarn = window.console.warn;

        var lineNumber = function (fnName) {
            var lines, text;
            try {
                throw new Error();
            } catch(e) {
                try {
                    lines = e.stack.substr( e.stack.indexOf( fnName ) ).split( /(\r\n|\n|\r)/gm )[2].trim().split(' ');
                    text = lines[ lines.length - 1 ];
                    consoleLog( '%c >> ' + text , 'color: red;' );
                } catch(e) {}
            }
            return text;
        };

        var consoleOutput = function(args, consoleFn, fnName) {
            var lnText;
            if (options.console.lineNumbers && !options.console.mute) {
                lnText = lineNumber(fnName);
            }
            if (!options.console.mute) {
                consoleFn.apply(window.console, args);
            }

            var data = {
                type: fnName,
                params: args
            };

            if (lnText) {
                data.line = lnText;
            }

            if (options.report && options.report.console) {
                track(data);
            }
        };

        if (options.console && options.console.hook) {

            window.console.debug = function () {
                consoleOutput(arguments, consoleDebug, 'console.debug');
            };

            window.console.log = function () {
                consoleOutput(arguments, consoleLog, 'console.log');
            };

            window.console.error = function () {
                consoleOutput(arguments, consoleError, 'console.error');
            };

            window.console.info = function () {
                consoleOutput(arguments, consoleInfo, 'console.info');
            };

            window.console.warn = function () {
                consoleOutput(arguments, consoleWarn, 'console.warn');
            };

        }

        if (options.console && options.console.globalLogFn) {
            window.console[options.globalLogFn] = consoleLog.bind(window.console);
        }

        if (options.debugLib && options.debugLib.hook) {
            window.console.DebugLog = function() {
                consoleOutput(arguments, consoleLog, 'debug');
            }
        }
    }

    if (options.report) {
        if (options.report.onInit) {
            reportOnInit();
        }

        if (options.report.onError) {
            initOnError();
        }

        if (options.report.buffer) {
            setInterval(flushBuffer, options.report.buffer * 1000);
            var _onbeforeunload = window.onbeforeunload;
            if (options.report.beforeUnload) {

                var unloading = false;

                window.onbeforeunload = function() {
                    if (unloading)
                        return;
                    unloading = true;
                    flushBuffer(true);
                    if (_onbeforeunload) {
                        _onbeforeunload.apply(window, arguments);
                    }
                };
            }
        }
    }


})(window, navigator);(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.debug = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],2:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * Active `debug` instances.
 */
exports.instances = [];

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  var prevTime;

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);
  debug.destroy = destroy;

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  exports.instances.push(debug);

  return debug;
}

function destroy () {
  var index = exports.instances.indexOf(this);
  if (index !== -1) {
    exports.instances.splice(index, 1);
    return true;
  } else {
    return false;
  }
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var i;
  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }

  for (i = 0; i < exports.instances.length; i++) {
    var instance = exports.instances[i];
    instance.enabled = exports.enabled(instance.namespace);
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  if (name[name.length - 1] === '*') {
    return true;
  }
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":1}],4:[function(require,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  '#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC',
  '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF',
  '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC',
  '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF',
  '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC',
  '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033',
  '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366',
  '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933',
  '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC',
  '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF',
  '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // Internet Explorer and Edge do not support colors.
  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    return false;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))
},{"./debug":3,"_process":2}]},{},[4])(4)
});(function(window) {

    var options = (window['loggingOptions'] || {}).debugLib;

    if (!options)
        return;

    if (window.debug && typeof window.debug === 'function' && window.debug.enable) {

        if (!options.colors) {
            debug.useColors = function() {return false;};
        }

        if (options.hook && console.DebugLog) {
            debug.log = console.DebugLog;
        }

        if (options.hookConsole) {
            console.debug = debug('console:debug');
            console.log = debug('console:log');
            console.error = debug('console:error');
            console.info = debug('console:info');
        }

        if (options.enable) {
            debug.enable(options.enable);
        }

    }
})(window);
