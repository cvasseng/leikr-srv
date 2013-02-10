leieditor.ide = (function () {
	
	//The container
	var _container = document.createElement('div');
	//The resource panel
	var _resourcePanel = document.createElement('div');
	//Item resources
	var _itemResourceNode = document.createElement('ul');
	//Config resources
	var _configResourceNode = document.createElement('ul');
	//Tileset resources
	var _tilesetResourceNode = document.createElement('ul');
	//Sprite resources
	var _spriteResourceNode = document.createElement('ul');
	//Wildlife resources
	var _wildlifeResouceNode = document.createElement('ul');
	//Crafting resources
	var _craftingResourceNode = document.createElement('ul');
	//Json editor node
	var _jsonEditorNode = document.createElement('div');
	//Script editor node
	var _scriptEditorNode = document.createElement('div');
	//Output window
	var _outputWindow = document.createElement('div');
	//Toolbar
	var _toolbar = document.createElement('div');
	//Image panel
	var _imagePanel = document.createElement('div');
	//Tileset image
	var _tilesetImage = new lei.Surface(false); 

	//JSON editor
	var _jsonEditor;
	//JS editor
	var _jsEditor;
	//Active data
	var _activeResource;
	//Syntax errors?
	var _syntaxErrorsJson = false;
	var _syntaxErrorsJs = false;

	//Load json
	function loadJSON(url) {
		$.ajax({
			url:url,
			dataType:'json',
			success: function (data) {
				_jsonEditor.setValue((JSON.stringify(data.properties, null, 2)));

				previewTileSheet(data.properties.tileset);
			}
		});
	}

	//Load Script
	function loadScript(url) {
		$.ajax({
			url:url,
			dataType:'json',
			success: function (data) {
				_jsEditor.setValue(data.script);
			}
		});
	}


	function newThing(path) {
		var name = prompt('Enter the internal name');

		$.ajax({
			url:path + name,
			dataType:'json',
			type: 'POST',
			data: {name:name},
			success: function () {
				buildResourcePanel();
				_outputWindow.innerHTML = 'The new thing was added.';
			}
		});
	}

	//////////////////////////////////////////////////////////////////////////////
	// Save selected resource
	function save() {
		if (_syntaxErrorsJson || _syntaxErrorsJs) {
			alert('You have syntax errors in your script and/or JSON. Fix them first!');
			return;
		}

		if (typeof _activeResource !== 'undefined') {

			$.ajax({
				url:_activeResource.path + _activeResource.name,
				dataType:'json',
				type: 'POST',
				data: {name:_activeResource.name, script: _jsEditor.getValue(), properties: JSON.parse(_jsonEditor.getValue())},
				success: function () {
					buildResourcePanel();
					_outputWindow.innerHTML = 'The item was saved.';
				}
			});

		}
	}

	//////////////////////////////////////////////////////////////////////////////
	// Preview animation
	function previewAnimation(animation) {

	}

	//////////////////////////////////////////////////////////////////////////////
	// Preview tilesheet
	function previewTileSheet(tilesheet) {
		_tilesetImage.clear('#222');

		var img = new Image();
		img.src = 'img/' + tilesheet;
		img.onload = function () {
			_tilesetImage.context.webkitImageSmoothingEnabled = false;
			_tilesetImage.context.mozImageSmoothingEnabled = false;
			_tilesetImage.blitImg(img, 0, 0, _tilesetImage.width(), _tilesetImage.height());
		};

	}

	//////////////////////////////////////////////////////////////////////////////
	// Build the image panel
	function buildImagePanel() {
		_imagePanel.innerHTML = '';

		var dropBox = document.createElement('div');
		dropBox.className = 'ui-leikr-dropbox';
		dropBox.innerHTML = 'drop image files here';

		_tilesetImage.appendTo(_imagePanel);

		_imagePanel.appendChild(dropBox);
	}

	//////////////////////////////////////////////////////////////////////////////
	// Build resource panel
	function buildResourcePanel() {
		var children, 
				icnexp = "url('/creator/icons/subitem2.png')",
				icncol = "url('/creator/icons/subitem.png')";

		_itemResourceNode.innerHTML = '';
		_spriteResourceNode.innerHTML = '';
		_wildlifeResouceNode.innerHTML = '';
		_craftingResourceNode.innerHTML = '';
		_tilesetResourceNode.innerHTML = '';
		_configResourceNode.innerHTML = '';
		
		////////////////////////////////////////////////////////////////////////////
		//Create a label
		function lbl(txt, fn, path) {
			var s = document.createElement('div');
			s.onclick = fn;
			s.innerText = txt;
			s.className = 'ui-leikr-ide-label';
			var i = document.createElement('span');
		//	i.onclick = fnnew;
			i.onclick = function () {
				newThing(path);
			}
			s.appendChild(i);

			return s;
		}

		////////////////////////////////////////////////////////////////////////////
		//Create a li
		function li(txt, icon, fn) {
			var s = document.createElement('li');
			s.innerHTML = txt;
			s.style.backgroundImage = typeof icon !== 'undefined' ? 'url(img/' + icon + ')' : '';
			s.onclick = function () {
				if (typeof fn === 'function') {
					fn();
				}
				$('.ui-leikr-ide-resourcepanel-sel').removeClass('ui-leikr-ide-resourcepanel-sel');
				s.className = 'ui-leikr-ide-resourcepanel-sel';
			};
			return s;
		}

		////////////////////////////////////////////////////////////////////////////
		//Span
		function sp(txt) {
			var s = document.createElement('span');
			s.innerHTML = txt;
			return s;
		}

		//Fetcher
		function fetcher(path, targetNode) {
			$.ajax({
				url:path,
				dataType:'json',
				success: function (data) {

					data = data.sort(function (a, b) {
						return a.title.localeCompare(b.title) === 1;
					});

					data.forEach(function (item, index) {
						var l = li(item.title, item.icon, function () {

							_activeResource = {
								path: path,
								name: item.name
							};

							//Load the json into the json editor
							loadScript(path + item.name);
							loadJSON(path + item.name);		
						})

						l.appendChild(sp(item.name));

						targetNode.appendChild(l);
					});
			}});
		}

		//Child
		function ch() {
			var d = document.createElement('div');
			d.style.display = 'none';
			return d;
		}

		////////////////////////////////////////////////////////////////////////////
		//Create items list
		var itemList = ch();
		_itemResourceNode.appendChild(lbl('Items', function () {
			$(itemList).animate({height:'toggle'}, function () {
				this.parentNode.children[0].style.backgroundImage = this.style.display === 'none' ? icncol : icnexp;
			});
			
		}, '/items/'));
		_itemResourceNode.appendChild(itemList);
		fetcher('/items/', itemList);

		////////////////////////////////////////////////////////////////////////////
		//Create sprite list
		var spriteList = ch();
		_spriteResourceNode.appendChild(lbl('Sprites', function () {
			$(spriteList).animate({height:'toggle'}, function () {
				this.parentNode.children[0].style.backgroundImage = this.style.display === 'none' ? icncol : icnexp;
			});
		}, '/sprites/'));
		_spriteResourceNode.appendChild(spriteList);
		fetcher('/sprites/', spriteList);

		////////////////////////////////////////////////////////////////////////////
		//Create tileset list
		var tilesetList = ch();
		_tilesetResourceNode.appendChild(lbl('Tilesets', function () {
			$(tilesetList).animate({height:'toggle'}, function () {
				this.parentNode.children[0].style.backgroundImage = this.style.display === 'none' ? icncol : icnexp;
			});
		}, '/tilesets/'));
		_tilesetResourceNode.appendChild(tilesetList);
		fetcher('/tilesets/', tilesetList);

		////////////////////////////////////////////////////////////////////////////
		//Create config list
		var configList = ch();
		_configResourceNode.appendChild(lbl('General Config', function () {
			$(configList).animate({height:'toggle'}, function () {
				this.parentNode.children[0].style.backgroundImage = this.style.display === 'none' ? icncol : icnexp;
			});
		}, '/config/'));
		_configResourceNode.appendChild(configList);
		fetcher('/config/', configList);

		////////////////////////////////////////////////////////////////////////////
		//Create crafting list
		var craftingList = ch();
		_craftingResourceNode.appendChild(lbl('Crafting', function () {
			$(craftingList).animate({height:'toggle'}, function () {
				this.parentNode.children[0].style.backgroundImage = this.style.display === 'none' ? icncol : icnexp;
			});
		}, '/crafting/'));
		_craftingResourceNode.appendChild(craftingList);
		fetcher('/crafting/', craftingList);

		////////////////////////////////////////////////////////////////////////////
		//Create wildlife list
		var wildlifeList = ch();
		_wildlifeResouceNode.appendChild(lbl('Wildlife', function () {
			$(wildlifeList).animate({height:'toggle'}, function () {
				this.parentNode.children[0].style.backgroundImage = this.style.display === 'none' ? icncol : icnexp;
			});
		}, '/wildlife/'));
		_wildlifeResouceNode.appendChild(wildlifeList);
		fetcher('/wildlife/', wildlifeList);

	}

	//////////////////////////////////////////////////////////////////////////////
	// Resize everything
	function resize () {
		var wh = $(window).height(),
				ww = $(window).width(),			
				rpwidth = $(_resourcePanel).outerWidth(true),
				tbh = $(_toolbar).outerHeight(true),
				ipw = $(_imagePanel).outerWidth(true),
				tbw = $(_toolbar).outerWidth(true),
				edw = (ww - rpwidth - ipw) / 2,
				obh = $(_outputWindow).outerHeight(true);

		if (edw === 0) {
			edw = 100;
		}

		_resourcePanel.style.height = wh + 'px';

		_toolbar.style.left = rpwidth + 'px';
		_toolbar.style.width = ww - rpwidth + 'px';

		_jsonEditorNode.style.top = tbh + 'px';
		_jsonEditorNode.style.left = rpwidth + 'px';
		_jsonEditorNode.style.width = edw + 'px';
		_jsonEditorNode.style.height = (wh - tbh - obh) + 'px';

		_scriptEditorNode.style.top = tbh + 'px';
		_scriptEditorNode.style.left = (edw + rpwidth) + 'px';
		_scriptEditorNode.style.height = (wh - tbh - obh) + 'px';
		_scriptEditorNode.style.width = edw + 'px';

	  _outputWindow.style.left = rpwidth + 'px';
		_outputWindow.style.width = ww - rpwidth + 'px';

		_imagePanel.style.height = wh - tbh - obh + 'px';
		_imagePanel.style.top = tbh + 'px';

	}

	//////////////////////////////////////////////////////////////////////////////
	// Constructor
	function construct () {

		_resourcePanel.className = 'ui-leikr-ide-resourcepanel';
		_resourcePanel.appendChild(_itemResourceNode);
		_resourcePanel.appendChild(_spriteResourceNode);
		_resourcePanel.appendChild(_wildlifeResouceNode);
		_resourcePanel.appendChild(_craftingResourceNode);
		_resourcePanel.appendChild(_tilesetResourceNode);
		_resourcePanel.appendChild(_configResourceNode);

		_jsonEditorNode.className = 'ui-leikr-ide-jsoneditor';
		_scriptEditorNode.className = 'ui-leikr-ide-jsoneditor';
		_toolbar.className = 'ui-leikr-ide-toolbar';
		_outputWindow.className = 'ui-leikr-ide-output';
		_imagePanel.className = 'ui-leikr-ide-imagepanel';
	
		_container.appendChild(_imagePanel);
		_container.appendChild(_resourcePanel);
		_container.appendChild(_jsonEditorNode);
		_container.appendChild(_scriptEditorNode);
		_container.appendChild(_toolbar);
		_container.appendChild(_outputWindow);

		_container.className = 'ui-leikr-ide';
		document.body.appendChild(_container);

		
		buildResourcePanel();
		buildImagePanel();

		_tilesetImage.resize(395, 395);

		_jsonEditor = CodeMirror(_jsonEditorNode, {
			mode: 'javascript',
			lineNumbers: true,
			tabSize:2
		});

		_jsEditor = CodeMirror(_scriptEditorNode, {
			mode: 'javascript',
			lineNumbers: true,
			tabSize:2
		});

		//Debug script
		_jsEditor.on('change', function (inst, obj) {
			//Debug the JSON
			try {
				var o = eval(_jsEditor.getValue());
				_outputWindow.innerHTML = 'No detectable syntax errors in your script! Good for you.';

					_syntaxErrorsJs = false;
				
			} catch (e) {
				_outputWindow.innerHTML = e + '<br/>';
				_syntaxErrorsJs = true;
			}
		});

		_jsonEditor.on('change', function (inst, obj) {
			//Debug the JSON
			try {
				var o = JSON.parse(_jsonEditor.getValue());
				_outputWindow.innerHTML = 'No errors in your JSON! Good for you.';
				_syntaxErrorsJson = false;
			} catch (e) {
				_outputWindow.innerHTML = e + '<br/>';
				_syntaxErrorsJson = true;
			}
		});

		function icon(icon, fn) {
			var s = document.createElement('li');
			s.onclick = fn;
			s.style.backgroundImage = 'url(/creator/icons/' + icon + ')';
			return s;
		}

		_toolbar.appendChild(icon('disk.png', save));
	}

	//Call constructor
	construct();

	return {

		//Load JSON into the JSON editor
		loadJSON: function (url) {

		},

		//Load script into the script editor
		loadScript: function (url) {

		},
		toggle: function () {
			$(_container).animate({opacity:'toggle'});
			resize();
		}

	};

})();
