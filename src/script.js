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
  let size = sizes[Number($size.val()) - 1];
  let scale = $emoteScale.val();
  removeCSS("size");
  removeCSS("emoteScale");
  appendCSS("size", size);
  appendCSS("emoteScale", size + "_" + scale);
}

function emoteScaleUpdate(event) {
  let size = sizes[Number($size.val()) - 1];
  let scale = $emoteScale.val();
  removeCSS("emoteScale");
  appendCSS("emoteScale", size + "_" + scale);
}

function fontUpdate(event) {
  let font = fonts[Number($font.val())];
  if (font !== "Custom") {
    $custom_font.prop("disabled", true);
    $example.css("font-family", "");
    removeCSS("font");
    appendCSS("font", font);
  } else {
    $custom_font.prop("disabled", false);
    if ($custom_font.val() == "") {
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
  removeCSS("stroke");
  if ($stroke.val() == "0") return;
  else {
    let stroke = strokes[Number($stroke.val()) - 1];
    appendCSS("stroke", stroke);
  }
}

function shadowUpdate(event) {
  removeCSS("shadow");
  if ($shadow.val() == "0") return;
  else {
    let shadow = shadows[Number($shadow.val()) - 1];
    appendCSS("shadow", shadow);
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

function capsUpdate(event) {
  if ($small_caps.is(":checked")) {
    appendCSS("variant", "SmallCaps");
  } else {
    removeCSS("variant", "SmallCaps");
  }
}

function centerUpdate(event) {
  if ($center.is(":checked")) {
    appendCSS("variant", "center");
  } else {
    removeCSS("variant", "center");
  }
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
    stroke: $stroke.val() != "0" ? $stroke.val() : false,
    shadow: $shadow.val() != "0" ? $shadow.val() : false,
    bots: $bots.is(":checked"),
    hide_commands: $commands.is(":checked"),
    hide_badges: $badges.is(":checked"),
    hide_paints: $paints.is(":checked"),
    animate: $animate.is(":checked"),
    fade: $fade_bool.is(":checked") ? $fade.val() : false,
    small_caps: $small_caps.is(":checked"),
    invert: $invert.is(":checked"),
    center: $center.is(":checked"),
    readable: $readable.is(":checked"),
    block: $blockedUsers.val().replace(/\s+/g, ''),
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
  $regex.val("");
  $blockedUsers.val("");
  $size.val("3");
  $emoteScale.val("1");
  $font.val("0");
  $stroke.val("0");
  $shadow.val("0");
  $bots.prop("checked", false);
  $commands.prop("checked", false);
  $badges.prop("checked", false);
  $paints.prop("checked", false);
  $animate.prop("checked", false);
  $fade_bool.prop("checked", false);
  $fade.addClass("hidden");
  $fade_seconds.addClass("hidden");
  $fade.val("30");
  $small_caps.prop("checked", false);
  $invert.prop("checked", false);
  $center.prop("checked", false);
  $readable.prop("checked", true);
  $custom_font.prop("disabled", true);

  sizeUpdate();
  fontUpdate();
  strokeUpdate();
  shadowUpdate();
  badgesUpdate();
  paintsUpdate();
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
}

const $generator = $("form[name='generator']");
const $channel = $('input[name="channel"]');
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
const $badges = $("input[name='badges']");
const $paints = $("input[name='paints']");
const $size = $("select[name='size']");
const $emoteScale = $("select[name='emote_scale']");
const $font = $("select[name='font']");
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
$emoteScale.change(emoteScaleUpdate);
$font.change(fontUpdate);
$custom_font.change(customFontUpdate);
$stroke.change(strokeUpdate);
$shadow.change(shadowUpdate);
$small_caps.change(capsUpdate);
$center.change(centerUpdate);
$badges.change(badgesUpdate);
$paints.change(paintsUpdate);
$generator.submit(generateURL);
$brightness.click(changePreview);
$url.click(copyUrl);
$alert.click(showUrl);
$reset.click(resetForm);
$goBack.click(backToForm);
