function fadeOption(event) {
    if ($fade_bool.is(':checked')) {
        $fade.removeClass('hidden');
        $fade_seconds.removeClass('hidden');
    } else {
        $fade.addClass('hidden');
        $fade_seconds.addClass('hidden');
    }
}

function sizeUpdate(event) {
    let size = sizes[Number($size.val()) - 1];
    let scale = $emoteScale.val();
    removeCSS('size');
    removeCSS('emoteScale');
    appendCSS('size', size);
    appendCSS('emoteScale', size+"_"+scale);
}

function emoteScaleUpdate(event) {
    let size = sizes[Number($size.val()) - 1];
    let scale = $emoteScale.val();
    removeCSS('emoteScale');
    appendCSS('emoteScale', size+"_"+scale);
}

function fontUpdate(event) {
    let font = fonts[Number($font.val())];
    if (font !== "Custom") {
        $custom_font.prop('disabled', true);
        $example.css('font-family', "");
        removeCSS('font');
        appendCSS('font', font);
    } else {
        $custom_font.prop('disabled', false);
        if ($custom_font.val() == "") {
            console.log("Custom font is empty")
            return;
        }
        console.log("Custom font is not empty")
        removeCSS('font');
        WebFont.load({
            google: {
                families: [
                    $custom_font.val()
                ]
            }
        })
        $example.css('font-family', $custom_font.val());
    }
}

function customFontUpdate(event) {
    if ($custom_font.val() == "") {
        $example.css('font-family', "");
        console.log("Custom font is empty")
        return;
    }
    console.log("Custom font is not empty")
    removeCSS('font');
    WebFont.load({
        google: {
            families: [
                $custom_font.val()
            ]
        }
    })
    $example.css('font-family', $custom_font.val());
}

function strokeUpdate(event) {
    removeCSS('stroke');
    if ($stroke.val() == "0")
        return;
    else {
        let stroke = strokes[Number($stroke.val()) - 1];
        appendCSS('stroke', stroke);
    }
}

function shadowUpdate(event) {
    removeCSS('shadow');
    if ($shadow.val() == "0")
        return;
    else {
        let shadow = shadows[Number($shadow.val()) - 1];
        appendCSS('shadow', shadow);
    }
}

function badgesUpdate(event) {
    if ($badges.is(':checked')) {
        $('img[class="badge special"]').addClass('hidden');
    } else {
        $('img[class="badge special hidden"]').removeClass('hidden');
    }
}

function capsUpdate(event) {
    if ($small_caps.is(':checked')) {
        appendCSS('variant', 'SmallCaps');
    } else {
        removeCSS('variant', 'SmallCaps');
    }
}

function centerUpdate(event) {
    if ($center.is(':checked')) {
        appendCSS('variant', 'center');
    } else {
        removeCSS('variant', 'center');
    }
}

function generateURL(event) {
    event.preventDefault();

    const baseUrl = window.location.href;
    const url = new URL(baseUrl);
    let currentUrl = url.origin + url.pathname;
    currentUrl = currentUrl.replace(/\/+$/, '');

    var generatedUrl = ''
    if ($regex.val() == '') {
        generatedUrl = currentUrl + '/v2/?channel=' + $channel.val();
    } else {
       generatedUrl = currentUrl + '/v2/?channel=' + $channel.val() + '&regex=' + encodeURIComponent($regex.val());
    }

    var selectedFont
    if (fonts[Number($font.val())] == "Custom") {
        selectedFont = $custom_font.val();
    } else {
        selectedFont = $font.val();
    }

    let data = {
        size: $size.val(),
        emoteScale: $emoteScale.val(),
        font: selectedFont,
        stroke: ($stroke.val() != '0' ? $stroke.val() : false),
        shadow: ($shadow.val() != '0' ? $shadow.val() : false),
        bots: $bots.is(':checked'),
        hide_commands: $commands.is(':checked'),
        hide_badges: $badges.is(':checked'),
        animate: $animate.is(':checked'),
        fade: ($fade_bool.is(':checked') ? $fade.val() : false),
        small_caps: $small_caps.is(':checked'),
        invert: $invert.is(':checked'),
        center: $center.is(':checked')
    };

    const params = encodeQueryData(data);

    $url.val(generatedUrl + '&' + params);

    $generator.addClass('hidden');
    $result.removeClass('hidden');
}

function changePreview(event) {
    if ($example.hasClass("white")) {
        $example.removeClass("white");
        $brightness.attr('src', "img/light.png");
    } else {
        $example.addClass("white");
        $brightness.attr('src', "img/dark.png");
    }
}

function copyUrl(event) {
    navigator.clipboard.writeText($url.val());

    $alert.css('visibility', 'visible');
    $alert.css('opacity', '1');
}

function showUrl(event) {
    $alert.css('opacity', '0');
    setTimeout(function() {
        $alert.css('visibility', 'hidden');
    }, 200);
}

function resetForm(event) {
    $channel.val('');
    $regex.val('');
    $size.val('3');
    $emoteScale.val('1');
    $font.val('0');
    $stroke.val('0');
    $shadow.val('0');
    $bots.prop('checked', false);
    $commands.prop('checked', false);
    $badges.prop('checked', false);
    $animate.prop('checked', false);
    $fade_bool.prop('checked', false);
    $fade.addClass('hidden');
    $fade_seconds.addClass('hidden');
    $fade.val("30");
    $small_caps.prop('checked', false);
    $invert.prop('checked', false);
    $center.prop('checked', false);
    $custom_font.prop('disabled', true);

    sizeUpdate();
    fontUpdate();
    strokeUpdate();
    shadowUpdate();
    badgesUpdate();
    capsUpdate();
    centerUpdate();
    if ($example.hasClass("white"))
        changePreview();

    $result.addClass('hidden');
    $generator.removeClass('hidden');
    showUrl();
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
const $badges = $("input[name='badges']");
const $size = $("select[name='size']");
const $emoteScale = $("select[name='emote_scale']");
const $font = $("select[name='font']");
const $custom_font = $("input[name='custom_font']");
const $stroke = $("select[name='stroke']");
const $shadow = $("select[name='shadow']");
const $brightness = $("#brightness");
const $example = $('#example');
const $result = $("#result");
const $url = $('#url');
const $alert = $("#alert");
const $reset = $("#reset");
const $regex = $('input[name="regex"]');

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
$generator.submit(generateURL);
$brightness.click(changePreview);
$url.click(copyUrl);
$alert.click(showUrl);
$reset.click(resetForm);