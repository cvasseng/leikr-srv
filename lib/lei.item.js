/*******************************************************************************

	Part of the Leikr project.

	Authored by Christer M. Vasseng, 2013. cvasseng@gmail.com

/******************************************************************************/

var fs = require('fs'),
		_availableItems = [],
		colors = require('colors'),
		_defaults = {
				//Item title
			title: '',
			//Item description
			description: '',
			//Item name - used internally
			name: '',
			//Use cooldown in MS
			useCooldown: 1000,
			//Decay - 0 is infinte 
			decay: 0,
			//Tileset
			tileset: '',
			//Found in the world?
			foundInWorld: false,
			//Inventory icon
			inventoryIcon: '',
			//Type
			type: ''
		};

var Item = function (owner, properties) {

	//Time of last use
	var _lastUseTime = 0;
	//The callback module
	var _funcModule;

	//////////////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////////////
	// The exported properties
	/*
		This is to make it easier to load the item
	*/
	this.properties = {
		
	};

	//Load defaults
	for (var p in _defaults) {
		this.properties[p] = _defaults[p];
	}

	if (typeof properties !== 'undefined') {
		for (var p in this.properties) {
			if (typeof properties[p] !== 'undefined') {
				this.properties[p] = properties[p];
			}
		}
	}

	function fetchModule() {
		if (this.properties.name !== '') {
			//Try to load the item module
			try {
				var mn = './../data/game/gen/item.' + this.properties.name + '.js';
				_funcModule = require(mn);
				delete require.cache[require.resolve(mn)];
			} catch (e) {

			}
		} 

		if (typeof _funcModule === 'undefined') {
			console.log('Warning: No module found for item ' + this.properties.name);
		}
	}

	//////////////////////////////////////////////////////////////////////////////
	// Call when using
	/*
		Targets will be an array with the actors close to the user.

		example of projectile weapon:

		owner.fireProjectile(speed, decay, function (target) {
			target.stats.health -= 10;
		});

	*/
	this.use = function (closeByActors) {
		var t = (new Date()).getTime();

		if (t - _lastUseTime > this.properties.useCooldown) {

			//Item can be used.
			if (this.properties.projectile) {

			}

			fetchModule.call(this);
			if (typeof _funcModule !== 'undefined') {
				_funcModule.use.apply(this, [owner]);
			}

			_lastUseTime = t;
			return true;
		}

		return false;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Call when dropping the item
	this.drop = function (closeByActors) {

	};

	//////////////////////////////////////////////////////////////////////////////
	// Call when getting the item
	this.get = function (closeByActors) {

	};

	//////////////////////////////////////////////////////////////////////////////
	// On equip 
	this.equip = function (closeByActors) {

	};

	//////////////////////////////////////////////////////////////////////////////
	// On un-equip 
	this.unequip = function (closeByActors) {

	};

};

//Create the module containing the the item callbacks
/*
	Modules are stored as item.itemname.mod in data/game/gen/
*/
function createCallbackModule (itemName) {

	var head = fs.readFileSync(__dirname + '/../data/templates/item.head', 'utf-8');
	var stub = fs.readFileSync(__dirname + '/../data/templates/item.stub', 'utf-8');

	fs.readFile(__dirname + '/../data/game/items/' + itemName + '.js', 'utf-8', function (err, data) {
		if (!err) {
			var module = '//Generated file!\n\r' + head + '\n\r' + data + '\n' + stub;
			//Write the module
			fs.writeFile(__dirname + '/../data/game/gen/item.' + itemName + '.js', module);
		} else {
			fs.writeFile(__dirname + '/../data/game/gen/item.' + itemName + '.js', stub);
		}
	});
}

//Export
module.exports = {
	//Create an item
	create: function (owner, name) {
		for (var i = 0; i < _availableItems.length; i++) {
			if (_availableItems[i].properties.name === name) {
				return new Item(owner, _availableItems[i].properties);
			}
		};
		return false;
	},

	//Get a list of all the available
	getAvailable: function () {
		var res = [];

		_availableItems.forEach(function(item) {
			res.push({
				name: item.properties.name,
				title: item.properties.title
			});
		});

		return res;
	},

	//Create module for item
	createModuleForItem: createCallbackModule,

	//Get meta of a single item
	getSingleMeta: function (name) {
		for (var i = 0; i < _availableItems.length; i++) {
			if (_availableItems[i].properties.name === name) {
				return _availableItems[i].properties;
			}
		};
		return false;
	},

	//Load the available items
	fetchAvailable: function () {
		var path = __dirname + '/../data/game/items/';

		_availableItems = [];

		fs.readdir(path, function (err, files) {
			files.forEach(function (file) {
				fs.readFile(path + file, 'utf-8', function (err, data) {

					if (file.indexOf('.json') > 0) {
						//This is the properties. Parse it
						var def = JSON.parse(data);

						//SUpplement with defaults
						for (var p in _defaults) {
							if (typeof def[p] === 'undefined') {
								def[p] = _defaults[p];
							}
						}

						if (typeof def.name !== 'undefined') {
							console.log('Added awesome item ' + def.name.blue + ' to library..');
							_availableItems.push({
								properties: def,
								filename: path + file
							});
							//Create the module containing the callbacks
							createCallbackModule(def.name);
						}
					} 

				});
			});
		});
	}
};
