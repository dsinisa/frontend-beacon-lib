## Config options

console.hook (boolean) - override console.log with hook function (also debug,info,warn,error). default is true
console.globalLogFn (string) - globalLogFn = 'Log'  - export console.'Log' as the original console.log. default is 'Log'
console.lineNumbers (boolean) - print line number & filename before console output. default is true
console.mute (boolean) - do not output anything to browser console
debugLib.hook (boolean) - redirect all debug lib output into console.log, which can then be overriden if console.hook is enabled. default is true
debugLib.hookConsole (boolean) - override console.log (also debug,info,warn,error) with debug lib loggers: console:log, console:info etc... default is true
debugLib.enable (string) - does debug.enable(string). default is 'console:* app:*'
report.onError (boolean) - hook into window.onerror and send report to remote url
report.ajaxOptions (object) - {method: 'POST', url: '/error'}
report.url,errorText,errorName,errorStack,lineNumber,columnNumber,userAgent,browser,os,mobile - field to include in report
  

## License

(The MIT License)

Copyright (c) 2017 Dr. Sinisa;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
