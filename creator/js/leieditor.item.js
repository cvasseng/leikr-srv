leieditor.items = (function () {

	function label(text) {
		var r = document.createElement('div');
		r.className = 'ui-editor-label';
		r.innerHTML = text;
		return r;
	}

	function icon (img) {
		var i = document.createElement('li');
		//i.style.backgroundImage = 'url(/creator/icons/' + img + ')';
		i.innerHTML = img;
		return i;
	}
	
	//The main container
	var _container = document.createElement('div');
	//The property container
	var _properties = document.createElement('div');
	//The property body
	var _propertyBody = document.createElement('div');
	//The script container
	var _script = document.createElement('div');
	//The dropdown for the selected item
	var _selectedScriptDD = document.createElement('select');
	//The code mirror editor
	var _codemirror;
	//The toolbar 
	var _toolbar = document.createElement('div');
	//Selected item
	var _selectedItem;
	//Selected properties
	var _selectedProperties = {};

	//////////////////////////////////////////////////////////////////////////////
	//Save the selected item
	function saveSelected() {
		if (typeof _selectedItem === 'undefined') {
			return;
		}

		$.ajax({
			url:'/items/' + _selectedItem,
			dataType:'json',
			type: 'POST',
			data: {source: _codemirror.getValue(), properties: _selectedProperties},
			success: function () {
				fetchItemList();
			}
		});
	}

	//////////////////////////////////////////////////////////////////////////////
	// Build the list of properties
	function buildPropertyList() {
		_propertyBody.innerHTML = '';
		for (var p in _selectedProperties) {
			if (p !== 'name') {

				var val = _selectedProperties[p], tp = 'input', node;

				_propertyBody.appendChild(label(p));

				if (p === 'type') {
					var options = [
						'weapon',
						'consumable',
						'armor piece'
					];

					tp = 'dd';
				}

				if (tp === 'dd') {
					var node = document.createElement('select');

					options.forEach(function (option) {
						var opt = document.createElement('option');
						opt.value = option;
						opt.innerHTML = option;
						if (option === val) {
							opt.selected = true;
						}
						node.appendChild(opt);
					});

					node.onchange = (function (p) {
						return function () {
								_selectedProperties[p] = node.options[node.selectedIndex].value;
						};
					})(p);

					_propertyBody.appendChild(node);

				} else {

					node = document.createElement('input');
					node.value = val;
					node.onchange = (function (p) {
						return function () {
							_selectedProperties[p] = this.value;
						};
					})(p);
					if (val === true || val === false) {
						node.type = 'checkbox';
					}
					_propertyBody.appendChild(node);
				}

			}
		}
	}

	//New item
	function newItem() {
		var name = prompt('Enter the internal name');

		$.ajax({
			url:'/items/' + name,
			dataType:'json',
			type: 'POST',
			data: {source: '', properties: {name:name}},
			success: function () {
				fetchItem(name);
				fetchItemList();

			}
		});
	}

	//////////////////////////////////////////////////////////////////////////////
	//Fetch an item
	function fetchItem(name) {
		$.ajax({
			url:'/items/' + name,
			dataType:'json',
			success: function (data) {
				_selectedItem = name;
				_codemirror.setValue(data.source);
				//Build the properties
				_selectedProperties = data.properties;
				buildPropertyList();
			}
		});
	}

	//////////////////////////////////////////////////////////////////////////////
	//Fetch item list
	function fetchItemList () {
		_selectedScriptDD.innerHTML = '';

		$.ajax({
			url:'/items/',
			dataType:'json',
			success: function (data) {

				data = data.sort(function (a, b) {
					return a.title.localeCompare(b.title) === 1;
				});

				data.forEach(function (item, index) {
					var o = document.createElement('option');
					o.innerHTML = item.title.length > 0 ? item.title + ' (' + item.name + ')' : item.name;
					o.value = item.name;

					_selectedScriptDD.appendChild(o);
					//Load the first item
					if (_selectedItem === item.name || typeof _selectedItem === 'undefined') {
						o.selected = true;
						fetchItem(item.name);
					}
				});
			}
		});

	}

	function constructor() {
		_container.className = 'ui-editor-item-container';
		_properties.className = 'ui-editor-item-properties';
		_script.className = 'ui-editor-item-editor';
		_toolbar.className = 'ui-editor-item-toolbar';

		var title = document.createElement('div');
		title.className = 'ui-editor-item-titlebar';
		title.innerHTML = 'Item Editor';
		_container.appendChild(title);

		_properties.appendChild(label('Selected item'));
		_properties.appendChild(_selectedScriptDD);
		_properties.appendChild(_propertyBody);

		var save = icon('Save');
		save.onclick = function () {
			saveSelected();
		};

		var newi = icon('New');
		newi.onclick = function () {
			newItem();
		};

		_toolbar.appendChild(icon('Delete'));
		_toolbar.appendChild(save);
		_toolbar.appendChild(newi);
		_toolbar.appendChild(icon('Give to player'));


		_container.appendChild(_toolbar);
		_container.appendChild(_properties);
		_container.appendChild(_script);
		document.body.appendChild(_container);

		_codemirror = CodeMirror(_script, {
			mode: 'javascript',
			lineNumbers: true,
			tabSize:2,
			height:'400px'
		});

		_selectedScriptDD.onchange = function () {
			fetchItem( _selectedScriptDD.options[_selectedScriptDD.selectedIndex].value );
		};

		fetchItemList();
	}


	constructor();

	return {
	
	}

})();
