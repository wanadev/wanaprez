const querystring = require("querystring");
const url = require("url");

const marked = require("marked");
const lodash = require("lodash");
const httpRequest = require("obsidian-http-request");
const highlightjs = require("highlightjs");
const Q = require("q");

const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;

let config = {
    url: "/",
    slide: 0,
};

function _downloadPrez(url="./prez.md") {
    return httpRequest.getText(url);
}

function _toHtml(markdown) {
    return marked(markdown);
}

function _prezify(html) {
    let tmpDiv = document.createElement("div");
    tmpDiv.innerHTML = html;
    let elements = Array.prototype.slice.call(tmpDiv.childNodes, 0);

    let prez = document.createDocumentFragment();
    let prezTitle = "Wanaprez";
    let slides = [];
    let slideIndex = -1;

    for (let i = 0 ; i < elements.length ; i++) {
        let slide = null;
        switch (elements[i].nodeName) {
            case "H1":
                slideIndex += 1;
                slide = {
                    type: "main-title",
                    title: elements[i].innerText,
                    slug: lodash.kebabCase(elements[i].innerText),
                    node: document.createElement("div"),
                };
                slide.node.id = `slide-${slide.slug}`;
                slide.node.className = `slide slide-type-${slide.type}`;
                prezTitle = slide.title;
                slides[slideIndex] = slide;
                prez.appendChild(slide.node);
                break;
            case "H2":
                slideIndex += 1;
                slide = {
                    type: "infill-title",
                    title: elements[i].innerText,
                    slug: lodash.kebabCase(elements[i].innerText),
                    node: document.createElement("div"),
                };
                slide.node.id = `slide-${slide.slug}`;
                slide.node.className = `slide slide-type-${slide.type}`;
                slides[slideIndex] = slide;
                prez.appendChild(slide.node);
                break;
            case "H3":
                slideIndex += 1;
                slide = {
                    type: "slide",
                    title: elements[i].innerText,
                    slug: lodash.kebabCase(elements[i].innerText),
                    node: document.createElement("div"),
                };
                slide.node.id = `slide-${slide.slug}`;
                slide.node.className = `slide slide-type-${slide.type}`;
                slides[slideIndex] = slide;
                prez.appendChild(slide.node);
                break;
        }
        if (slideIndex < 0) {
            continue;
        }
        slides[slideIndex].node.appendChild(elements[i]);
    }

    return {
        rootNode: prez,
        slides,
        title: prezTitle,
    };
}

function _highlight(prez) {
    let {rootNode} = prez;
    let code = rootNode.querySelectorAll("pre > code");
    for (let i = 0 ; i < code.length ; i++) {
        highlightjs.highlightBlock(code[i]);
    }
    return prez;
}

function _resolveUrls(prez) {
    let {rootNode} = prez;
    const rootPath = `${location.protocol}//${location.host}${location.pathname}`;

    let images = rootNode.querySelectorAll("img, video, audio");
    for (let i = 0 ; i < images.length ; i++) {
        let image = images[i];
        let imagePath = image.src;
        if (imagePath.indexOf(rootPath) === 0) {
            imagePath = imagePath.substring(rootPath.length);
        }
        image.src = url.resolve(config.url, imagePath);
    }

    return prez;
}

function _doPrez({rootNode, slides, title}) {

    function _updateSlides() {
        for (let i = 0 ; i < slides.length ; i++) {
            let slide = slides[i];
            slide.node.classList.remove("slide-flow-prev");
            slide.node.classList.remove("slide-flow-current");
            slide.node.classList.remove("slide-flow-next");

            if (i === config.slide - 1) slide.node.classList.add("slide-flow-prev");
            if (i === config.slide) slide.node.classList.add("slide-flow-current");
            if (i === config.slide + 1) slide.node.classList.add("slide-flow-next");
        }
    }

    function _updatePrez() {
        let slide = slides[config.slide];

        if (slide.type == "main-title") {
            document.title = title;
        } else {
            document.title = `${title} - ${slide.title}`;
        }

        document.body.className = `wanaprez-started on-type-${slide.type} on-slide-${slide.slug}`;
        location.hash = `#${querystring.stringify(config)}`;
    }

    function _goPrev() {
        config.slide = Math.max(0, config.slide - 1);
        _updatePrez();
        _updateSlides();
    }

    function _goNext() {
        config.slide = Math.min(slides.length - 1, config.slide + 1);
        _updatePrez();
        _updateSlides();
    }

    function _onKeydown(event) {
        switch (event.keyCode) {
            case KEY_UP:
            case KEY_LEFT:
                _goPrev();
                break;
            case KEY_DOWN:
            case KEY_RIGHT:
                _goNext();
                break;
        }
    }

    function _onMousewheel(event) {
        var wheelDelta = null;

        // Webkit
        if (event.wheelDeltaY !== undefined) {
            wheelDelta = event.wheelDeltaY;
        }
        // MSIE
        if (event.wheelDelta !== undefined) {
            wheelDelta = event.wheelDelta;
        }
        // Firefox
        if (event.axis !== undefined && event.detail !== undefined) {
            if (event.axis == 2) { // Y
                wheelDelta = -event.detail;
            }
        }

        if (wheelDelta !== null) {
            if (wheelDelta >= 0) {
                _goPrev();
            } else {
                _goNext();
            }
        }
    }

    document.body.appendChild(rootNode);
    document.addEventListener("keydown", _onKeydown);
    document.addEventListener("mousewheel", _onMousewheel);
    document.addEventListener("DOMMouseScroll", _onMousewheel);

    _updateSlides();
    _updatePrez();

}

function prezFromUrl(prezUrl) {
    config.url = prezUrl;
    _downloadPrez(config.url)
        .then(_toHtml)
        .then(_prezify)
        .then(_highlight)
        .then(_resolveUrls)
        .then(_doPrez)
        .catch(e => {
            console.error(e);
            alert(e);
        })
        .done();
}

function prezFromText(prezText) {
    Q(prezText)
        .then(_toHtml)
        .then(_prezify)
        .then(_highlight)
        .then(_resolveUrls)
        .then(_doPrez)
        .catch(e => {
            console.error(e);
            alert(e);
        })
        .done();
}

lodash.merge(config, querystring.parse(location.hash.substring(1)));
config.slide = parseFloat(config.slide);

module.exports = {
    config,
    prezFromUrl,
    prezFromText,
};
