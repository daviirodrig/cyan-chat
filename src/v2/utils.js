function parseFlags(input, schema) {
  const parts = input.split(/\s+/);
  const flags = {};
  const rest = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('-')) {
      const flagName = part.replace(/^-+/, '');
      if (schema.hasOwnProperty(flagName)) {
        const flagType = schema[flagName];
        if (flagType === Boolean) {
          flags[flagName] = true;
        } else if (i + 1 < parts.length && !parts[i + 1].startsWith('-')) {
          flags[flagName] = convertType(parts[i + 1], flagType);
          i++; // Skip the next part as it's the value
        }
      }
    } else {
      rest.push(part);
    }
  }

  return { flags, rest: rest.join(' ') };
}

function convertType(value, type) {
  if (type === String) return value;
  if (type === Number) return Number(value);
  if (type === Boolean) return value.toLowerCase() === 'true';
  if (Array.isArray(type)) return [value]; // For simplicity, just wrap in array
  return value; // Default to string if type is not recognized
}

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

let timeoutID;

function SendInfoText(text) {
  var $infoText = $("#info_text");
  $infoText.css("opacity", "1");
  $infoText.html(text);

  if (timeoutID) {
    clearTimeout(timeoutID);
  }

  timeoutID = setTimeout(function () {
    $infoText.css("opacity", "0");
  }, 5000);
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

async function fileExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error("Error checking file existence:", error);
    return false;
  }
}

function findVideoFile(source) {
  const videoExtensions = [".mp4", ".webm", ".mov"];
  const mediaFolder = "../media"; // Path to media folder

  // Remove file extension from the source if present
  const baseName = source.replace(/\.[^/.]+$/, "");

  // Check media folder for the video file based on the source name and the extensions
  return new Promise(async (resolve) => {
    for (const extension of videoExtensions) {
      const fileName = `${baseName}${extension}`;
      const filePath = `${mediaFolder}/${fileName}`;

      // Check if the file exists
      if (await fileExists(filePath)) {
        resolve(fileName);  // Return just the filename with extension
        return;
      }
    }

    // If no matching video file is found, resolve with null
    resolve(null);
  });
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
    video.style.objectFit = "contain";
    video.style.zIndex = -100;
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
const COOLDOWN = 0;
// const API = "https://api.streamelements.com/kappa/v2/speech";
const API = "/api/tts";

function playTTSAudio(text, voice) {
  // if (cooldown > 0) {
  //   console.log(
  //     `Please wait ${cooldown} seconds before making another request.`
  //   );
  //   return;
  // }

  // cooldown = COOLDOWN;
  // const interval = setInterval(() => {
  //   cooldown -= 1;
  //   if (cooldown <= 0) {
  //     clearInterval(interval);
  //   }
  // }, 1000);

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

async function fixZeroWidthEmotes() {
  // Retry up to 8 times with a 50ms delay between attempts
  for (let attempt = 1; attempt <= 8; attempt++) {
    // Select all image elements with the class names 'emote', 'zero-width', and 'staging'
    const imgElements = Array.from(
      document.querySelectorAll("img.emote.zero-width.staging")
    );

    if (imgElements.length > 0) {
      const BATCH_SIZE = 50; // Process 50 elements at a time
      for (let i = 0; i < imgElements.length; i += BATCH_SIZE) {
        const batch = imgElements.slice(i, i + BATCH_SIZE);

        batch.forEach((imgElement) => {
          const stagingRect = imgElement.getBoundingClientRect();
          let stagingWidth = stagingRect.width;

          // Adjust width based on `Chat.info.size`
          let sub;
          switch (Chat.info.size) {
            case 3:
              sub = 10;
              break;
            case 2:
              sub = 7;
              break;
            default:
              sub = 4;
          }
          sub = 0;

          const parentElement = imgElement.parentElement;

          if (parentElement) {
            const siblingEmoteElement = parentElement.querySelector(
              "img.emote:not(.zero-width)"
            );

            if (siblingEmoteElement) {
              const siblingRect = siblingEmoteElement.getBoundingClientRect();
              let finalWidth = Math.max(stagingWidth, siblingRect.width) - sub;

              if (finalWidth > 0) {
                parentElement.style.width = `${finalWidth}px`;
              } else {
                console.log(
                  `Final width is zero or negative for one of the images.`
                );
              }
            } else {
              console.log(
                `No sibling emote found, removing staging class without resizing.`
              );
            }

            imgElement.classList.remove("staging");
          } else {
            console.log("Parent element not found for one of the images.");
          }
        });

        // Allow the browser to render updates
        await new Promise(requestAnimationFrame);
      }

      // Exit the retry loop after successful processing
      break;
    } else {
      // Wait for 100ms before trying again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Log failure message if no elements were found after all attempts
    if (attempt === 8) {
      console.log(
        "Failed to find image elements with the specified class names after 8 attempts."
      );
    }
  }
}

// #region Message Pruning

const intersectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const elementRect = entry.target.getBoundingClientRect();

    if (elementRect.top < 0 || elementRect.top >= window.innerHeight - elementRect.height) {
      handleChatLineRemoval(entry.target);
    }
  });
}, {
  root: null,
  rootMargin: '0px',
  threshold: [0, 1]
});

function startObservingChatContainerForLines() {
  const chatContainer = document.getElementById("chat_container");
  if (chatContainer) {
    const chatObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && node.classList.contains("chat_line")) {
              // Wait a bit to ensure the element is fully rendered
              setTimeout(() => {
                intersectionObserver.observe(node);
              }, 100);
            }
          }
        }
      }
    });

    chatObserver.observe(chatContainer, {
      childList: true,
      subtree: true,
    });
  } else {
    console.error('Element with id "chat_container" not found.');
  }
}

function handleChatLineRemoval(chatLine) {
  intersectionObserver.unobserve(chatLine);
  chatLine.remove();

  // Fading looked bad but may reimplement later
  // if (Chat.info.fade) {
  //   $(chatLine).fadeOut(() => {
  //     chatLine.remove();
  //   });
  // } else {
  //   // If fade is not enabled, remove immediately
  //   chatLine.remove();
  // }
}

function waitForChatContainerForLines(
  timeout = TIMEOUT_LIMIT,
  interval = POLL_INTERVAL
) {
  const start = Date.now();

  const poll = () => {
    const chatContainer = document.getElementById("chat_container");
    if (chatContainer) {
      startObservingChatContainerForLines();
    } else if (Date.now() - start < timeout) {
      setTimeout(poll, interval);
    } else {
      console.error(
        'Element with id "chat_container" not found within the timeout period.'
      );
    }
  };

  poll();
}

window.addEventListener("load", () => {
  if (!Chat.info.disablePruning) {
    waitForChatContainerForLines();
  }
});

// #endregion Message Pruning

// #region Active User Call

function makeActiveUserCall() {
  fetch(`/active?channel=${encodeURIComponent(Chat.info.channel)}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(data => {
      console.log('Active user call successful:', data);
    })
    .catch(error => {
      console.error('Error making active user call:', error);
    });
}

// Run immediately when connected
setTimeout(() => {
makeActiveUserCall();
}, 5000);

// Then run every 10 minutes
setInterval(makeActiveUserCall, 2 * 60 * 1000);

// #endregion Active User Call