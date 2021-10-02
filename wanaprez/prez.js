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
const KEY_F = 70;

let config = {
	url: "/",
	slide: 0,
};

function toggleFullscreen() {
	const elem = document.documentElement;
	if (!document.fullscreenElement) {
		elem.requestFullscreen().catch((err) => {
			alert(
				`Error attempting to enable full-screen mode: ${err.message} (${err.name})`
			);
		});
	} else {
		document.exitFullscreen();
	}
}

function _downloadPrez(url = "./prez.md") {
	return httpRequest.getText(url);
}

function _toHtml(markdown) {
	return marked(markdown);
}

function _prezify(html) {
	let tmpDiv = document.createElement("div");
	tmpDiv.innerHTML = html;
	let elements = Array.prototype.slice.call(tmpDiv.childNodes, 0);

	let prez = document.createElement("div");
	prez.id = "wanaprez";
	let prezTitle = "Wanaprez";
	let slides = [];
	let slideIndex = -1;

	for (let i = 0; i < elements.length; i++) {
		const slide = {
			type: undefined,
			title: undefined,
			slug: undefined,
			node: undefined,
		};
		const nodeName = elements[i].nodeName;
		if ("H1 H2 H3 HR".includes(nodeName)) {
			slideIndex += 1;
			slide.node = document.createElement("div");
			slide.title = elements[i].innerText;
			slide.slug = lodash.kebabCase(elements[i].innerText);
			slide.type = "slide";
			switch (nodeName) {
				case "H1":
					slide.type = "main-title";
					break;
				case "H2":
					slide.type = "infill-title";
					break;
				case "HR":
					slide.slug = `break-${slideIndex}`;
					break;
				default:
					break;
			}
			slide.node.id = `slide-${slide.slug}`;
			slide.node.className = `slide slide-type-${slide.type}`;
			prezTitle = slide.title;
			slides[slideIndex] = slide;
			prez.appendChild(slide.node);
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
	let { rootNode } = prez;
	let code = rootNode.querySelectorAll("pre > code");
	for (let i = 0; i < code.length; i++) {
		highlightjs.highlightBlock(code[i]);
	}
	return prez;
}

function _resolveUrls(prez) {
	let { rootNode } = prez;
	const rootPath = `${location.protocol}//${location.host}${location.pathname}`;

	let images = rootNode.querySelectorAll("img, video, audio");
	for (let i = 0; i < images.length; i++) {
		let image = images[i];
		let imagePath = image.src;
		if (imagePath.indexOf(rootPath) === 0) {
			imagePath = imagePath.substring(rootPath.length);
		}
		function resolve(from, to) {
			const resolvedUrl = new URL(to, new URL(from, "resolve://"));
			if (resolvedUrl.protocol === "resolve:") {
				// `from` is a relative URL.
				const { pathname, search, hash } = resolvedUrl;
				return pathname + search + hash;
			}
			return resolvedUrl.toString();
		}
		image.src = resolve(config.url, imagePath);
	}

	return prez;
}

function _doPrez({ rootNode, slides, title }) {
	const SLIDES_WIDTH = 1024;
	const SLIDES_HEIGHT = 768;
	const DRAG_THRESHOLD = 50;
	let touchDrag = false;

	function _scalePrez() {
		const wDelta = (window.innerWidth - 20) / SLIDES_WIDTH;
		const hDelta = (window.innerHeight - 20) / SLIDES_HEIGHT;
		const scale = Math.min(wDelta, hDelta);

		if (scale < 1 || scale > 1.5) {
			rootNode.style.transform = `scale(${scale})`;
		} else {
			rootNode.style.transform = "";
		}
	}

	function _updateSlides() {
		for (let i = 0; i < slides.length; i++) {
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
			case KEY_F:
				toggleFullscreen();
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
			if (event.axis == 2) {
				// Y
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

	function _onTouchStart(event) {
		console.log(event);
		if (event.touches.length !== 1) return;

		touchDrag = event.touches[0].screenY;
	}

	function _onTouchMove(event) {
		if (event.touches.length !== 1) return;
		if (touchDrag === null) return;

		let delta = event.touches[0].screenY - touchDrag;

		if (Math.abs(delta) > DRAG_THRESHOLD) {
			if (delta > 0) {
				_goPrev();
			} else {
				_goNext();
			}
			touchDrag = null;
		}
	}

	function _onTouchEnd(event) {
		if (event.touches.length !== 1) return;

		touchDrag = null;
	}

	document.body.appendChild(rootNode);
	document.addEventListener("keydown", _onKeydown);
	document.addEventListener("mousewheel", _onMousewheel);
	document.addEventListener("DOMMouseScroll", _onMousewheel);
	document.addEventListener("touchstart", _onTouchStart);
	document.addEventListener("touchmove", _onTouchMove);
	document.addEventListener("touchend", _onTouchEnd);
	window.addEventListener("resize", _scalePrez);

	_scalePrez();
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
		.catch((e) => {
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
		.catch((e) => {
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
