
(function(window) {
    if (window.debug && typeof window.debug === 'function' && window.debug.enable) {

        debug.log = console.DebugLog;

        console.debug = debug('console:debug');
        console.log = debug('console:log');
        console.error = debug('console:error');
        console.info = debug('console:info');

        debug.enable('console:* app:*');

    }
})(window);

var log = debug('app:test2');


log('test');

console.log('aaaaaa');


