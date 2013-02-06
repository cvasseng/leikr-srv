
lei.inventory = (function () {

	//The actual inventory
	var _inventory = [];
	//THe inventory container node
	var _inventoryContainer = document.createElement('div');
	//The inventory data node
	var _inventoryDataContainer = document.createElement('div');
		//Hint container
	var _tooltip = document.createElement('div');
	//Active hot slot
	var _active = -1;
	//Is the entire inventory visible?
	var _visible = false;

	//Show tooltip
	function buildTooltip(item) {
		if (typeof item.name !== 'undefined') {
			_tooltip.innerHTML = item.title;
		}
	}

	//////////////////////////////////////////////////////////////////////////////
	//Create an inventory slot
	function slot(itemStack, slot) {
		var s = document.createElement('li'), 
				item,
				count = document.createElement('span');

		s.id = 'slot' + slot;
		count.className = 'ui-inventory-count';

		if (typeof itemStack !== 'undefined' && itemStack.length > 0) {

			item = itemStack[0];

			count.innerHTML = itemStack.length;
			
			s.draggable = true;

			if (typeof item.inventoryIcon !== 'undefined') {
				s.style.backgroundImage = "url('img/" + item.inventoryIcon + "')";
			}

			s.title = item.title;



			s.onmouseover = function () {
				buildTooltip(item);
			}

			s.onmouseout = function () {
				_tooltip.innerHTML = '';
			}

			s.ondragstart = function (e) {
				e.dataTransfer.effectAllowed = "all";
				e.dataTransfer.setData('text/plain', 'item');
				e.dataTransfer.setData('item', JSON.stringify(itemStack));
				e.dataTransfer.setData('slot', slot);
			};

			if (item.maxStackSize > 1 && itemStack.length > 1) {
				s.appendChild(count);
			}
		}

		s.ondragenter = function (e) {

		}

		s.ondragover = function (e) {
			e.preventDefault();
		}

		s.ondrop = function (e) {
			var t = e.dataTransfer.getData('text/plain');
			
			if (t === 'item') {
				var sourceStack = JSON.parse(e.dataTransfer.getData('item')),
						index = parseInt(e.dataTransfer.getData('slot'));
				
				//Is there something in this slot?
				if (itemStack.length > 0) {
					//Ok. we need to switch places. with the other item.
					_inventory[index] = itemStack;

				} else {
					//Nope, we can just set the source to null.
					_inventory[index] = [];
				}

				//Set this slot to the data contained in the other slot
				_inventory[slot] = sourceStack;

				//Rebuild
				buildUI();

			}
		
			e.preventDefault();
		}

		if (slot < 9) {
			//This is a hotkey.
			var hotkey = document.createElement('span');
			hotkey.className = 'ui-inventory-hotkey';
			hotkey.innerHTML =  (slot + 1);
			s.appendChild(hotkey);

			s.onclick = function () {
				lei.inventory.setActiveHotSlot(slot + 1);
			}
		}

		if (_active === slot) {
			s.className = 'ui-inventory-hotkey-active';
		}

		return s;
	}

	//////////////////////////////////////////////////////////////////////////////
	//Build the visuals
	function buildUI() {
		_inventoryDataContainer.innerHTML = '';

		for (var i = 0; i < 50; i++) {

			if (typeof _inventory[i] !== 'undefined') {
				_inventoryDataContainer.appendChild(slot(_inventory[i], i));
			} else {
				_inventoryDataContainer.appendChild(slot([], i));
			}

			
		}
	}

	//////////////////////////////////////////////////////////////////////////////

	return {

		////////////////////////////////////////////////////////////////////////////
		// Init inventory
		init: function () {
			_inventoryContainer.className = 'ui-inventory-container';
			document.body.appendChild(_inventoryContainer);

		//	_inventoryContainer.innerHTML = '<div>Inventory</div>'
			_inventoryContainer.appendChild(_inventoryDataContainer);
			_inventoryContainer.appendChild(_tooltip);

			for (var i = 0; i < 50; i++) {
				//Init clean inventory
				_inventory.push([]);
			}

			buildUI();
		},

		////////////////////////////////////////////////////////////////////////////
		// Toggle
		toggle: function () {
			_visible = !_visible;

			var theight = _visible ? '240px' : '40px';

			$(_inventoryContainer).animate({height: theight});
		},

		////////////////////////////////////////////////////////////////////////////
		//Flush the inventory
		flush: function () {
			_inventory = [];
			for (var i = 0; i < 50; i++) {
				//Init clean inventory
				_inventory.push([]);
			}
		},

		////////////////////////////////////////////////////////////////////////////
		//Add item to inventory
		addItem: function (item) {
			var foundSlot = false;

			//Find an available slot
			_inventory.some(function (i) {
				if (i.length > 0) {
					if (i[0].name === item.name && i.length < item.maxStackSize) {
						i.push(item);
						foundSlot = true;
						return true;
					}
					return false;
				}
			});

			if (!foundSlot) {
				//Find first available
				_inventory.some(function (i, index) {
					if (_inventory[index].length === 0) {
						_inventory[index].push(item);
						return true;
					}
					return false;
				});
				
			}

			buildUI();
		},

		////////////////////////////////////////////////////////////////////////////
		// Set active hot slot
		setActiveHotSlot: function (slot) {
			_active = slot - 1;
			if (slot === 0) {
				_active = 9;
			}

			$(_inventoryDataContainer).children('.ui-inventory-hotkey-active').removeClass('ui-inventory-hotkey-active');

			$('#slot' + _active).addClass('ui-inventory-hotkey-active');
		},

		////////////////////////////////////////////////////////////////////////////
		// Get the ID of the item in a given hot slot
		getIDInActiveHotSlot: function () {
		
			if (_active >= 0 && _active < _inventory.length && (_inventory[_active]).length > 0) {
				return _inventory[_active][0].id;
			}
			return false;
		},

		////////////////////////////////////////////////////////////////////////////
		//Add multiple items to inventory
		addItems: function (items){
			items.forEach(function(item) {
				lei.inventory.addItem(item);
			});
		},

		////////////////////////////////////////////////////////////////////////////
		//Remove item from inventory
		remItem: function (id) {;

			_inventory.forEach( function (stack, index) {
				_inventory[index] = stack.filter(function (item) {
					return item.id !== id;
				});
			});

			//Remove it from the inventory
			//_inventory = _inventory.filter(function (stack, index) {
		//		return stack.length > 0;
			//});

			buildUI();

		}

	};

})();
