

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

var ansi_up = new AnsiUp;
var lastLength;
var url = '/admin/logs/' + getURLParameter('view');

function checkTail() {
    $.ajax({
        url: url,
        type: "HEAD",
        success: function(data, arg, xhr) {
            var newLength = parseInt(xhr.getResponseHeader('content-length'), 10);
            if (lastLength < newLength) {
                appendTail(lastLength, newLength);
                lastLength = newLength;
            }
        }});
}

function appendTail(from, to) {
    $.ajax({
       url: url,
       headers: {Range: "bytes=" + from + '-' + to},
       success: function(txt) {
           var html = ansi_up.ansi_to_html("\033[1;29;40m" + txt);

           var cdiv = $('<pre>' + html + '</pre>');
           $('body').append(cdiv);

           scrollToBottom();
       }
    });
}

function scrollToBottom() {
    setTimeout(function() {
        window.scrollTo(0,document.body.scrollHeight);
    }, 500);
}

$.ajax(
    {
        url: url,
        success: function(txt, arg, xhr) {
            lastLength = parseInt(xhr.getResponseHeader('content-length'), 10);

            var html = ansi_up.ansi_to_html("\033[1;29;40m" + txt);

            var cdiv = document.getElementById("console");

            cdiv.innerHTML = html;

            scrollToBottom();
            setInterval(checkTail, 10000);
        }
});
