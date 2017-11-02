(function(window) {

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
