var loggingOptions = {
    console: {
        hook: true,
        globalLogFn: 'Log',
        lineNumbers: true,
        mute: false
    },
    debugLib: {
        hook: true,
        hookConsole: true,
        enable: 'console:* app:*',
        colors: false
    },
    report: {
        onInit: true,
        onError: true,
        ajaxOptions: {
            method: 'POST',
            url: 'https://ssl.hivearts.io:8000/error',
            builtIn: true,
            sendJSON: true,
            synchronous: false
        },
        beforeUnload: {
            synchronous: true,
            delay: false
        },
        console: true,
        buffer: 60,
        fields: {
            url: true,
            errorText: true,
            errorName: true,
            errorStack: true,
            lineNumber: true,
            columnNumber: true,
            userAgent: true,
            browser: true,
            os: true,
            mobile: true
        }
    }
};

