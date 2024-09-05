// (function ($) {
//     // Thanks to BrunoLM (https://stackoverflow.com/a/3855394)
//     $.QueryString = (function (paramsArray) {
//       let params = {};

//       for (let i = 0; i < paramsArray.length; ++i) {
//         let param = paramsArray[i].split("=", 2);

//         if (param.length !== 2) continue;

//         params[param[0]] = decodeURIComponent(param[1].replace(/\+/g, " "));
//       }

//       return params;
//     })(window.location.search.substr(1).split("&"));

//     // Check if 'v' parameter exists
//     if (!$.QueryString.hasOwnProperty("v")) {
//       console.log("'v' parameter is not present.");
//       var currentUrl = window.location.href;
//       var newUrl = addRandomQueryString(currentUrl);
//       window.location.href = newUrl;
//     } else {
//       // Check if 'v' parameter is valid
//       if (Date.now() - $.QueryString.v > 10000) {
//         console.log("'v' parameter is not up to date.");
//         var currentUrl = window.location.href;
//         var cleanUrl = removeRandomQueryString(currentUrl);
//         var newUrl = addRandomQueryString(cleanUrl);
//         window.location.href = newUrl;
//       }
//     }
//   })(jQuery);

applyStyles("size", sizes[2]);

function fadeOption(event) {
    if ($fade_bool.is(":checked")) {
        $fade.removeClass("hidden");
        $fade_seconds.removeClass("hidden");
    } else {
        $fade.addClass("hidden");
        $fade_seconds.addClass("hidden");
    }
}

function sizeUpdate(event) {
    let scale = $emoteScale.val();
    let size;
    if (scale === "1") {
        size = sizes[Number($size.val()) - 1];
    } else if (scale === "2") {
        size = sizes_ES2[Number($size.val()) - 1];
    } else if (scale === "3") {
        size = sizes_ES3[Number($size.val()) - 1];
    } else {
        console.log("Invalid scale value:", scale);
    }
    applyStyles("size", size);
}

function heightUpdate(event) {
    let height = heights[Number($height.val())];
    let $chatline = $("#example .chat_line");
    $chatline.css("line-height", height);
}

function fontUpdate(event) {
    let font = fonts[Number($font.val())];
    console.log("Font:", font);
    if (font !== "Custom") {
        $custom_font.prop("disabled", true);
        $example.css("font-family", font);
    } else {
        $custom_font.prop("disabled", false);
        if ($custom_font.val() == "") {
            console.log("Custom font is empty");
            return;
        }
        console.log("Custom font is not empty");
        WebFont.load({
            google: {
                families: [$custom_font.val()],
            },
        });
        $example.css("font-family", $custom_font.val());
    }
}

function customFontUpdate(event) {
    if ($custom_font.val() == "") {
        $example.css("font-family", "");
        console.log("Custom font is empty");
        return;
    }
    console.log("Custom font is not empty");
    removeCSS("font");
    WebFont.load({
        google: {
            families: [$custom_font.val()],
        },
    });
    $example.css("font-family", $custom_font.val());
}

function strokeUpdate(event) {
    if ($stroke.val() == "0") removeStyles("stroke");
    else {
        let stroke = strokes[Number($stroke.val()) - 1];
        applyStyles("stroke", stroke);
    }
}

function shadowUpdate(event) {
    if ($shadow.val() == "0") {
        $example.css("filter", "unset");
    } else {
        let shadow = shadows[Number($shadow.val()) - 1];
        $example.css("filter", shadow);
    }
}

function badgesUpdate(event) {
    if ($badges.is(":checked")) {
        $('img[class="badge"]').addClass("hidden");
    } else {
        $('img[class="badge hidden"]').removeClass("hidden");
    }
}

function paintsUpdate(event) {
    if ($paints.is(":checked")) {
        $('span[class="nick paint"]').addClass("nopaint");
        $('span[class="mention paint"]').addClass("nopaint");
    } else {
        $('span[class="nick paint nopaint"]').removeClass("nopaint");
        $('span[class="mention paint nopaint"]').removeClass("nopaint");
    }
}

function colonUpdate(event) {
    if ($center.is(":checked")) {
        $('span[class="nick paint colon"]').removeClass("colon");
        $('span[class="nick colon"]').removeClass("colon");
        $('span[class="colon"]').css("display", "none");
        return;
    }
    if ($colon.is(":checked")) {
        $('span[class="colon"]').css("display", "none");
        $('span[class="nick paint"]').addClass("colon");
        $('span[class="nick"]').addClass("colon");
    } else {
        $('span[class="colon"]').css("display", "inline");
        $('span[class="nick paint colon"]').removeClass("colon");
        $('span[class="nick colon"]').removeClass("colon");
    }
}

function capsUpdate(event) {
    if ($small_caps.is(":checked")) {
        $example.css("font-variant", "small-caps");
    } else {
        $example.css("font-variant", "normal");
    }
}

function centerUpdate(event) {
    if ($center.is(":checked")) {
        colonUpdate();
        $('span[class="colon"]').css("display", "none");
        appendCSS("variant", "center");
    } else {
        removeCSS("variant", "center");
        $('span[class="colon"]').css("display", "inline");
        colonUpdate();
    }
}

function syncUpdate(event) {
    if (!$sync.is(":checked")) {
        showPopup();
    }
}

function showPopup() {
    document.getElementById("emotePopup").style.display = "block";
    document.getElementById("popupBackground").style.display = "block";
}

function closePopup() {
    document.getElementById("emotePopup").style.display = "none";
    document.getElementById("popupBackground").style.display = "none";
}

function generateURL(event) {
    event.preventDefault();

    const baseUrl = window.location.href;
    const url = new URL(baseUrl);
    let currentUrl = url.origin + url.pathname;
    currentUrl = currentUrl.replace(/\/+$/, "");

    var generatedUrl = "";
    if ($regex.val() == "") {
        generatedUrl = currentUrl + "/v2/?channel=" + $channel.val();
    } else {
        generatedUrl =
            currentUrl +
            "/v2/?channel=" +
            $channel.val() +
            "&regex=" +
            encodeURIComponent($regex.val());
    }

    var selectedFont;
    if (fonts[Number($font.val())] == "Custom") {
        selectedFont = $custom_font.val();
    } else {
        selectedFont = $font.val();
    }

    let data = {
        size: $size.val(),
        emoteScale: $emoteScale.val(),
        font: selectedFont,
        height: $height.val(),
        stroke: $stroke.val() != "0" ? $stroke.val() : false,
        shadow: $shadow.val() != "0" ? $shadow.val() : false,
        bots: $bots.is(":checked"),
        hide_commands: $commands.is(":checked"),
        hide_badges: $badges.is(":checked"),
        hide_paints: $paints.is(":checked"),
        hide_colon: $colon.is(":checked"),
        animate: $animate.is(":checked"),
        fade: $fade_bool.is(":checked") ? $fade.val() : false,
        small_caps: $small_caps.is(":checked"),
        invert: $invert.is(":checked"),
        center: $center.is(":checked"),
        readable: $readable.is(":checked"),
        disable_sync: $sync.is(":checked"),
        disable_pruning: $pruning.is(":checked"),
        block: $blockedUsers.val().replace(/\s+/g, ""),
        yt: $ytChannel.val().replace('@', ''),
    };

    const params = encodeQueryData(data);

    $url.val(generatedUrl + "&" + params);

    $generator.addClass("hidden");
    $result.removeClass("hidden");
}

function changePreview(event) {
    if ($example.hasClass("white")) {
        $example.removeClass("white");
        $brightness.attr("src", "img/light.png");
    } else {
        $example.addClass("white");
        $brightness.attr("src", "img/dark.png");
    }
}

function copyUrl(event) {
    navigator.clipboard.writeText($url.val());

    $alert.css("visibility", "visible");
    $alert.css("opacity", "1");
}

function showUrl(event) {
    $alert.css("opacity", "0");
    setTimeout(function () {
        $alert.css("visibility", "hidden");
    }, 200);
}

function resetForm(event) {
    $channel.val("");
    $ytChannel.val("");
    $regex.val("");
    $blockedUsers.val("");
    $size.val("3");
    $emoteScale.val("1");
    $font.val("0");
    $height.val("4");
    $stroke.val("0");
    $shadow.val("0");
    $bots.prop("checked", false);
    $commands.prop("checked", false);
    $badges.prop("checked", false);
    $paints.prop("checked", false);
    $colon.prop("checked", false);
    $animate.prop("checked", true);
    $fade_bool.prop("checked", false);
    $fade.addClass("hidden");
    $fade_seconds.addClass("hidden");
    $fade.val("30");
    $small_caps.prop("checked", false);
    $invert.prop("checked", false);
    $center.prop("checked", false);
    $readable.prop("checked", true);
    $sync.prop("checked", false);
    $pruning.prop("checked", false);
    $custom_font.prop("disabled", true);

    sizeUpdate();
    fontUpdate();
    heightUpdate();
    strokeUpdate();
    shadowUpdate();
    badgesUpdate();
    paintsUpdate();
    colonUpdate();
    capsUpdate();
    centerUpdate();
    if ($example.hasClass("white")) changePreview();

    $result.addClass("hidden");
    $generator.removeClass("hidden");
    showUrl();
}

function backToForm(event) {
    $result.addClass("hidden");
    $generator.removeClass("hidden");
    $alert.css("visibility", "hidden");
}

const $generator = $("form[name='generator']");
const $channel = $('input[name="channel"]');
const $ytChannel = $('input[name="yt-channel"]');
const $animate = $('input[name="animate"]');
const $bots = $('input[name="bots"]');
const $fade_bool = $("input[name='fade_bool']");
const $fade = $("input[name='fade']");
const $fade_seconds = $("#fade_seconds");
const $commands = $("input[name='commands']");
const $small_caps = $("input[name='small_caps']");
const $invert = $('input[name="invert"]');
const $center = $('input[name="center"]');
const $readable = $('input[name="readable"]');
const $sync = $('input[name="sync"]');
const $pruning = $('input[name="pruning"]');
const $badges = $("input[name='badges']");
const $paints = $("input[name='paints']");
const $colon = $("input[name='colon']");
const $size = $("select[name='size']");
const $emoteScale = $("select[name='emote_scale']");
const $font = $("select[name='font']");
const $height = $("select[name='height']");
const $custom_font = $("input[name='custom_font']");
const $stroke = $("select[name='stroke']");
const $shadow = $("select[name='shadow']");
const $brightness = $("#brightness");
const $example = $("#example");
const $result = $("#result");
const $url = $("#url");
const $alert = $("#alert");
const $reset = $("#reset");
const $goBack = $("#go-back");
const $regex = $('input[name="regex"]');
const $blockedUsers = $('input[name="blocked_users"]');

$fade_bool.change(fadeOption);
$size.change(sizeUpdate);
$emoteScale.change(sizeUpdate);
$font.change(fontUpdate);
$height.change(heightUpdate);
$custom_font.change(customFontUpdate);
$stroke.change(strokeUpdate);
$shadow.change(shadowUpdate);
$small_caps.change(capsUpdate);
$center.change(centerUpdate);
$badges.change(badgesUpdate);
$paints.change(paintsUpdate);
$colon.change(colonUpdate);
$generator.submit(generateURL);
$brightness.click(changePreview);
$url.click(copyUrl);
$alert.click(showUrl);
$reset.click(resetForm);
$goBack.click(backToForm);
// $sync.change(syncUpdate);
