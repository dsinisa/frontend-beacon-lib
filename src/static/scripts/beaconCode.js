


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


})(window, navigator);