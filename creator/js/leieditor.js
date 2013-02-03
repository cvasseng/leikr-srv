

var leieditor = (function () {

	//Include a script
	function includeScript (f) {
		var s = document.createElement('script');
		document.head.appendChild(s);
		s.src = '/creator/js/' + f;
	}

	//Include a css file
	function includeCSS (f) {
		var s = document.createElement('link');
		s.rel = 'stylesheet';
		s.href = '/creator/css/' + f;
		document.head.appendChild(s);
	}

	//Include the creator stuff
	var _css = [
		'item.css'
	];

	var _js = [
		'leieditor.item.js'
	];

	_css.forEach(function (css) {
		includeCSS(css);
	});

	_js.forEach(function (js) {
		includeScript(js);
	});
	
	return {

	}

})();
