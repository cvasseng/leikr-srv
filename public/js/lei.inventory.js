
lei.inventory = (function () {

	//The actual inventory
	var _inventory = [];
	//THe inventory container node
	var _inventoryContainer = document.createElement('div');
	//The inventory data node
	var _inventoryDataContainer = document.createElement('div');
		//Hint container
	var _tooltip = document.createElement('div');

	//Show tooltip
	function buildTooltip(item) {
		if (typeof item.name !== 'undefined') {
			_tooltip.innerHTML = item.title;
		}
	}

	//////////////////////////////////////////////////////////////////////////////
	//Create an inventory slot
	function slot(item) {
		var s = document.createElement('li');
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
			e.dataTransfer.setData('item', JSON.stringify(item));
		};

		return s;
	}

	//////////////////////////////////////////////////////////////////////////////
	//Build the visuals
	function buildUI() {
		_inventoryDataContainer.innerHTML = '';

		for (var i = 0; i < 48; i++) {

			if (typeof _inventory[i] !== 'undefined') {
				_inventoryDataContainer.appendChild(slot(_inventory[i]));
			} else {
				_inventoryDataContainer.appendChild(slot({}));
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

			_inventoryContainer.innerHTML = '<div>Inventory</div>'
			_inventoryContainer.appendChild(_inventoryDataContainer);
			_inventoryContainer.appendChild(_tooltip);

			buildUI();
		},

		////////////////////////////////////////////////////////////////////////////
		// Toggle
		toggle: function () {
			$(_inventoryContainer).animate({opacity: 'toggle'});
		},

		////////////////////////////////////////////////////////////////////////////
		//Flush the inventory
		flush: function () {
			_inventory = [];
		},

		////////////////////////////////////////////////////////////////////////////
		//Add item to inventory
		addItem: function (item) {
			_inventory.push(item);
			buildUI();
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
		remItem: function (id) {

		}

	};

})();
