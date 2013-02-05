
lei.hotbar = (function () {

	//The slots
	var _slots = [];
	//The main container
	var _container = document.createElement('ul');
	//The active slot
	var _activeSlot;


	//////////////////////////////////////////////////////////////////////////////
	// Create a hotbar slot
	function slot(num) {
		var s = document.createElement('li'),
		 		t = document.createElement('span'),
		 		stack = document.createElement('span'),
		 		slotdata = {
		 			node: s,
		 			stackCountNode: s,
		 			itemStack: []
				};

		stack.className = 'ui-hotbar-stack-count';

		t.innerHTML = num;
		s.appendChild(t);
		_slots[num] = slotdata;

		s.onclick = function () {
			lei.hotbar.setActive(num);
		}

		//Set up drop target
		s.ondragenter = function (e) {

		}

		s.ondragover = function (e) {
			e.preventDefault();
		}

		s.ondrop = function (e) {
			var t = e.dataTransfer.getData('text/plain');
			
			if (t === 'item') {
				var itemStack = JSON.parse(e.dataTransfer.getData('item')),
						item = itemStack[0];
				
				if (itemStack.length > 1) {
					stack.innerHTML = itemStack.length;
				}
				slotdata.itemStack = itemStack;
				slotdata.node.style.backgroundImage = 'url(img/' + item.inventoryIcon + ')';
			}
		
			e.preventDefault();
		}

		s.appendChild(stack);
		return s;
	}

	//////////////////////////////////////////////////////////////////////////////
	// Build the hotbar
	function build () {
		_container.appendChild(slot(1));
		_container.appendChild(slot(2));
		_container.appendChild(slot(3));
		_container.appendChild(slot(4));
		_container.appendChild(slot(5));
		_container.appendChild(slot(6));
		_container.appendChild(slot(7));
		_container.appendChild(slot(8));
		_container.appendChild(slot(9));
		_container.appendChild(slot(0));
	}

	//////////////////////////////////////////////////////////////////////////////

	return {

		////////////////////////////////////////////////////////////////////////////
		//Init the hotbar
		init: function () {
			_container.className = 'ui-hotbar';
			document.body.appendChild(_container);
			build();

		},

		////////////////////////////////////////////////////////////////////////////
		// Remove an item from the hotbar
		remItem: function (name, id) {
			_slots.forEach(function (slot) {

				slot.itemStack = slot.itemStack.filter(function (r) {
						if (r.id === id) {
							if (slot.itemStack.length === 1) {
								slot.node.style.backgroundImage = 'none';
							}
							if (slot.itemStack.length > 1) {
								slot.stackCountNode.innerHTML = slot.itemStack.length;
							} else {
								slot.stackCountNode.innerHTML = '';
							}
							return false;
						}
						return true;
				});
			});
		},

		////////////////////////////////////////////////////////////////////////////
		//Get the active items ID
		getActiveID: function () {
			var slot = typeof _activeSlot !== 'undefined' ? _activeSlot : false;
			if (slot && _slots[slot].itemStack.length > 0) {
				return _slots[_activeSlot].itemStack[0].id;
			}
			return false;
		},

		////////////////////////////////////////////////////////////////////////////
		//Set a slot to be the active one
		setActive: function (slot) {
			if (typeof _slots[slot] !== 'undefined') {
				$(_container).children('.ui-hotbar-selected').removeClass('ui-hotbar-selected');
				_slots[slot].node.className = 'ui-hotbar-selected';
				_activeSlot = slot;
				return true;
			}
			return false;
		},

		////////////////////////////////////////////////////////////////////////////
		//Get item ID of a given slot
		getID: function (slot) {
			return _slots[slot].item & _slots[slot].item.id;
		}
	}

})();
