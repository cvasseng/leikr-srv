/*******************************************************************************

	Part of the Leikr project.

	Authored by Christer M. Vasseng, 2013. cvasseng@gmail.com

/******************************************************************************/

var fs = require('fs'),
		_availableItems = [],
		colors = require('colors');

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
		//Is it a projectile?
		projectile: false
		
	};

	if (typeof properties !== 'undefined') {
		for (var p in this.properties) {
			if (typeof properties[p] !== 'undefined') {
				this.properties[p] = properties[p];
			}
		}
	}

	if (this.properties.name !== '') {
		//Try to load the item module
		try {
			_funcModule = require('./../data/game/gen/item.' + this.properties.name + '.js');
		} catch (e) {

		}
	} 

	if (typeof _funcModule === 'undefined') {
		console.log('Warning: No module found for item ' + this.properties.name);
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

	//Load the available items
	fetchAvailable: function () {
		var path = __dirname + '/../data/game/items/';

		fs.readdir(path, function (err, files) {
			files.forEach(function (file) {
				fs.readFile(path + file, 'utf-8', function (err, data) {

					if (file.indexOf('.json') > 0) {
						//This is the properties. Parse it
						var def = JSON.parse(data);
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
