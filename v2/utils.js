function appendCSS(type, name) {
    $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        class: `chat_${type}`,
        href: `styles/${type}_${name}.css`
    }).appendTo("head");
}

function escapeRegExp(string) { // Thanks to coolaj86 and Darren Cook (https://stackoverflow.com/a/6969486)
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(message) {
    return message
        .replace(/&/g, "&amp;")
        .replace(/(<)(?!3)/g, "&lt;")
        .replace(/(>)(?!\()/g, "&gt;");
}

// function TwitchOAuth() {
//     return $.ajax({
//         type: "GET", 
//         url: "https://id.twitch.tv/oauth2/validate", 
//         dataType: "json",
//         headers: {'Authorization': 'Bearer ' + credentials},
//         success : function(result) { 
//             //set your variable to the result
//             console.log('jChat: helix json aquired user_id');
//             // console.log(url)
//             // console.log(result)
//         },
//         error : function(result) {
//             // this *should* show up when the token expires
//             var $chatLine = $('<div style="color: red;">Twitch OAuth invalid</div>');
//             Chat.info.lines.push($chatLine.wrap('<div>').parent().html());
//         }
//     });
// }

// function TwitchAPI(url) {
//     return $.ajax({
//         type: "GET", 
//         url: "https://api.twitch.tv/helix" + url, 
//         dataType: "json",
//         headers: {'Authorization': 'Bearer ' + credentials,
//                   'Client-Id': client_id},
// 			success : function() {
// 				console.log('jChat: GET ' + url);
// 			},
// 			error : function(result) {
// 				var $chatLine = $('<div style="color: red;">Twitch API Error</div>');
// 				console.log(result)
// 				Chat.info.lines.push($chatLine.wrap('<div>').parent().html());
// 			}
//     });
// }

function TwitchOAuth() {
    return $.ajax({
        type: "GET",
        url: "/twitch/oauth", // Relative URL
        dataType: "json",
        success: function(result) {
            // Set your variable to the result
            console.log('Cyan Chat: helix json acquired user_id');
            // console.log(url)
            // console.log(result)
        },
        error: function(result) {
            // This should show up when the token expires
            var $chatLine = $('<div style="color: red;">Twitch OAuth invalid</div>');
            Chat.info.lines.push($chatLine.wrap('<div>').parent().html());
        }
    });
}

function TwitchAPI(url) {
    return $.ajax({
        type: "GET",
        url: `/twitch/api?url=${encodeURIComponent(url)}`, // Relative URL
        dataType: "json",
        success: function() {
            console.log('Cyan Chat: GET ' + url);
        },
        error: function(result) {
            var $chatLine = $('<div style="color: red;">Twitch API Error</div>');
            console.log(result)
            Chat.info.lines.push($chatLine.wrap('<div>').parent().html());
        }
    });
}

function SendInfoText(text) {
    var $infoText = $("#info_text");
    $infoText.css("opacity", "1");
    $infoText.html(text);
    setTimeout(function() {
        $infoText.css("opacity", "0");
    }, 3000);
}