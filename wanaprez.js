const marked = require("marked");
const lodash = require("lodash");
const httpRequest = require("obsidian-http-request");

const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;

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

function _highlight(html) {
    return html;  // TODO
}

function _doPrez({rootNode, slides, title}) {

    let currentSlide = 0;

    function _updateSlides() {
        for (let i = 0 ; i < slides.length ; i++) {
            let slide = slides[i];
            slide.node.classList.remove("slide-flow-prev");
            slide.node.classList.remove("slide-flow-current");
            slide.node.classList.remove("slide-flow-next");

            if (i === currentSlide - 1) slide.node.classList.add("slide-flow-prev");
            if (i === currentSlide) slide.node.classList.add("slide-flow-current");
            if (i === currentSlide + 1) slide.node.classList.add("slide-flow-next");
        }
    }

    function _updatePrez() {
        let slide = slides[currentSlide];

        if (slide.type == "main-title") {
            document.title = title;
        } else {
            document.title = `${title} - ${slide.title}`;
        }
    }

    function _goPrev() {
        currentSlide = Math.max(0, currentSlide - 1);
        _updatePrez();
        _updateSlides();
    }

    function _goNext() {
        currentSlide = Math.min(slides.length - 1, currentSlide + 1);
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

_downloadPrez()
    .then(_toHtml)
    .then(_prezify)
    .then(_highlight)
    .then(_doPrez)
    .done();
