(function(window) {

    if (window.console) {

        var consoleDebug = window.console.debug;
        var consoleLog = window.console.log;
        var consoleError = window.console.error;
        var consoleInfo = window.console.info;
        var consoleWarn = window.console.warn;

        var lineNumber = function (fnName) {
            var lines;
            try {
                throw new Error();
            } catch(e) {
                try {
                    lines = e.stack.substr( e.stack.indexOf( fnName ) ).split( /(\r\n|\n|\r)/gm )[2].trim().split(' ');
                    consoleLog( '%c >> ' + lines[ lines.length - 1 ] , 'color: red;' );
                } catch(e) {}
            }
            return '';
        };

        var appendArgs = function(args, fnName, lvlSet) {
            var args = Array.prototype.slice.call(args);
            args.push(lineNumber(fnName, lvlSet));
            return args;
        };

        window.console.debug = function() {
            consoleDebug.apply(window.console, appendArgs(arguments, 'console.debug'));
        };

        window.console.log = function() {
            consoleLog.apply(window.console, appendArgs(arguments, 'console.log'));
        };

        window.console.error = function() {
            consoleError.apply(window.console, appendArgs(arguments, 'console.error'));
        };

        window.console.info = function() {
            consoleInfo.apply(window.console, appendArgs(arguments, 'console.info'));
        };

        window.console.warn = function() {
            consoleWarn.apply(window.console, appendArgs(arguments, 'console.warn'));
        };

        window.console.Log = consoleLog.bind(window.console);

        window.console.DebugLog = function() {
            consoleLog.apply(window.console, appendArgs(arguments, 'debug'));
        }

    }

})(window);