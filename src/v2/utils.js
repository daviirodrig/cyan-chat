function appendCSS(type, name) {
  $("<link/>", {
    rel: "stylesheet",
    type: "text/css",
    class: `chat_${type}`,
    href: addRandomQueryString(`styles/${type}_${name}.css`),
  }).appendTo("head");
}

function loadCustomFont(name) {
  const $chat_container = $("#chat_container");
  WebFont.load({
    google: {
      families: [name],
    },
  });
  $chat_container.css("font-family", name);
}

function escapeRegExp(string) {
  // Thanks to coolaj86 and Darren Cook (https://stackoverflow.com/a/6969486)
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    success: function (result) {
      // Set your variable to the result
      console.log("Cyan Chat: helix json acquired user_id");
      // console.log(url)
      // console.log(result)
    },
    error: function (result) {
      // This should show up when the token expires
      var $chatLine = $('<div style="color: red;">Twitch OAuth invalid</div>');
      Chat.info.lines.push($chatLine.wrap("<div>").parent().html());
    },
  });
}

function TwitchAPI(url) {
  return $.ajax({
    type: "GET",
    url: `/twitch/api?url=${encodeURIComponent(url)}`, // Relative URL
    dataType: "json",
    success: function () {
      console.log("Cyan Chat: GET " + url);
    },
    error: function (result) {
      var $chatLine = $('<div style="color: red;">Twitch API Error</div>');
      console.log(result);
      Chat.info.lines.push($chatLine.wrap("<div>").parent().html());
    },
  });
}

function GetTwitchUserID(username) {
  return $.ajax({
    type: "GET",
    url: "/twitch/get_id?username=" + username,
    dataType: "json",
    success: function () {
      // Set your variable to the result
      console.log("Cyan Chat: helix json acquired user_id");
    },
    error: function (result) {
      // This should show up when the token expires
      var $chatLine = $('<div style="color: red;">Twitch OAuth invalid</div>');
      console.log(result);
      Chat.info.lines.push($chatLine.wrap("<div>").parent().html());
      return null;
    },
  });
}

function SendInfoText(text) {
  var $infoText = $("#info_text");
  $infoText.css("opacity", "1");
  $infoText.html(text);
  setTimeout(function () {
    $infoText.css("opacity", "0");
  }, 3000);
}

function doesStringMatchPattern(stringToTest, info) {
  // Ensure regexPattern is defined and is a RegExp object
  if (info.regex instanceof RegExp) {
    return info.regex.test(stringToTest);
  } else {
    console.error("No valid regex pattern defined in info object.");
    return false;
  }
}

function addRandomQueryString(url) {
  return url + (url.indexOf("?") >= 0 ? "&" : "?") + "v=" + Date.now();
}

function removeRandomQueryString(url) {
  return url.replace(/[?&]v=[^&]+/, "");
}

function appendMedia(mediaType, source) {
  // Check if any video or audio element is already playing
  const existingMedia = document.querySelector("video, audio");

  if (existingMedia) {
    console.log("A media file is already playing.");
    return;
  }

  if (mediaType === "video") {
    const video = document.createElement("video");
    video.src = source;
    video.style.position = "absolute";
    video.style.top = "50%";
    video.style.left = "50%";
    video.style.transform = "translate(-50%, -50%)";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.zIndex = -1;
    video.autoplay = true;
    video.muted = false;
    video.onended = function () {
      video.remove();
    };

    document.body.appendChild(video);
  } else if (mediaType === "audio") {
    const audio = document.createElement("audio");
    audio.src = source;
    audio.autoplay = true;
    audio.onended = function () {
      audio.remove();
    };

    document.body.appendChild(audio);
  }
}

let cooldown = 0;
const COOLDOWN = 5;
const API = "https://api.streamelements.com/kappa/v2/speech";

function playTTSAudio(text, voice) {
  if (cooldown > 0) {
    console.log(
      `Please wait ${cooldown} seconds before making another request.`
    );
    return;
  }

  cooldown = COOLDOWN;
  const interval = setInterval(() => {
    cooldown -= 1;
    if (cooldown <= 0) {
      clearInterval(interval);
    }
  }, 1000);

  fetch(`${API}?voice=${voice}&text=${encodeURIComponent(text)}`)
    .then((response) => response.blob())
    .then((blob) => {
      if (!blob || !blob.size) {
        throw new Error("No audio received");
      }

      const audioUrl = URL.createObjectURL(blob);
      appendMedia("audio", audioUrl);
    })
    .catch((error) => {
      console.log(`Error: ${error}`);
      cooldown += COOLDOWN;
    });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        // The element is off screen
        entry.target.style.display = "none";
      }
    });
  },
  {
    root: null, // Use the viewport as the root
    rootMargin: "0px",
    threshold: 0, // Trigger as soon as any part of the element is out of view
  }
);
