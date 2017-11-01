
(function(window) {

    var options = (window['loggingOptions'] || {}).debugLib;

    if (!options)
        return;

    if (window.debug && typeof window.debug === 'function' && window.debug.enable) {

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

var log = debug('app:test2');


log('test');

console.log('aaaaaa', {test: 1});


