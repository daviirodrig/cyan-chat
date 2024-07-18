function encodeQueryData(data) { // https://stackoverflow.com/questions/111529/how-to-create-query-parameters-in-javascript
    const ret = [];
    for (let d in data) {
        if (data[d])
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    }
    return ret.join('&');
}

function appendCSS(type, name) {
    $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        class: `preview_${type}_${name}`,
        href: `styles/${type}_${name}.css`
    }).appendTo("head");
}

function removeCSS(type, name) {
    if (name) {
        $(`link[class="preview_${type}_${name}"]`).remove();
    } else {
        $(`link[class^="preview_${type}"]`).remove();
    }
}

function addRandomQueryString(url) {
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + "v=" + Date.now();
  }
  
  function removeRandomQueryString(url) {
    return url.replace(/[?&]v=[^&]+/, "");
  }