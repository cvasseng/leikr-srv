/*******************************************************************************

	Part of the Leikr project.

	Authored by Christer M. Vasseng, 2013. cvasseng@gmail.com

/******************************************************************************/

var actorUID = 0,
		math = require('./lei.math'),
		_tile = require('./lei.tile'),
		_item = require('./lei.item');

//Our Actor object
var Actor = function () {

	//////////////////////////////////////////////////////////////////////////////
	// Private properties

	//Time of last update - used to calculate FPS and delta locally
	var _lastUpdateTime = 0;
	//Delta time - used to determine physics related stuff (like moving/jumping)
	var _deltaTime = 0; 
	//_listeners
	var _listeners = [];
	//The number of _listeners
	var _listenerCount = 0;
	//Is moving?
	var _isMoving = false;
	//_world
	var _world = require('./lei.world');
	//Is the actor colliding?
	var _colliding = false;
	//Flat inventory
	var _inventoryFlat = [];
	//Controller
	var _controller = null;

	var nextPos;

	var _stats = {
		health:100,
		food: 100,
		water: 100
	};


	//////////////////////////////////////////////////////////////////////////////
	// Public properties
	
	//The viewport
	this.viewport = {
		x1: 0,
		x2: 0,
		y1: 0,
		y2: 0
	};

	//The bounding box
	this.bbox = {
		offsetX: 10,
		offsetY: 15,
		w: 12,
		h: 10
	};

	//The size
	this.size = {
		w: 12,
		h: 24
	};

	//The actor position
	this.pos = {
		x: 0,
		y: 0
	};

	//The actor tile position
	this.tilePos = {
		x: 0,
		y: 0
	};

	//The actor velocity
	this.velocity = {
		x: 0,
		y: 0
	};

	//The direction of the actor
	this.direction = {
		x: 0,
		y: 0
	};

	//The ID of the actor
	this.id = actorUID; actorUID++;
	//The base movement speed for the actor
	this.movementSpeed = 90;
	//The maximum speed of the actor
	this.maxVelocity = 40;
	//The name of the actor
	this.name = 'Askeladden';
	//Chunks that this actor belongs to
	this.chunks = [];
	//The inventory
	this.inventory = [];

	//Is the given point inside the actor?
	this.pointInActor = function (x, y) {
		return (x > this.pos.x && x < this.pos.x + this.size.w && y > this.pos.y && y < this.pos.y + this.size.h);
	},

	//////////////////////////////////////////////////////////////////////////////
	// Emit a signal
	this.emit = function (which) {
		var args = Array.prototype.slice.call(arguments);
		args.splice(0, 1);
		if (typeof _listeners[which] !== 'undefined') {
			_listeners[which].forEach(function(callback) {
				callback.fn.apply(callback.ctx, args);
			});
		}
	};

	//////////////////////////////////////////////////////////////////////////////
	// Attach listener
	this.on = function (evnt, ctx, fn) {
		var id = _listenerCount;

		if (typeof _listeners[evnt] === 'undefined') {
			_listeners[evnt] = [];
		}

		if (typeof ctx === 'function') {
			fn = ctx;
			ctx = this;
		}

		//Register callback
		_listeners[evnt].push({
			ctx: ctx,
			fn: fn,
		});

		_listenerCount++;

		//Return a function that will unbind the event
		return function () {
			_listeners[evnt] = _listeners[evnt].filter(function (callback) {
				return callback.id !== id;
			});
		};

	};

	//////////////////////////////////////////////////////////////////////////////
	// Stop moving
	this.stopMoving = function () {
		this.velocity.x = 0;
		this.velocity.y = 0;
		_isMoving = false;
		this.emit('move', this.createSmallPacket());
	};

	//////////////////////////////////////////////////////////////////////////////
	//Apply velocity to the actor
	this.applyVelocity = function (x, y) {
		this.velocity.x = x;
		this.velocity.y = y;

		if (this.velocity.x !== 0 || this.velocity.y !== 0) {
			_isMoving = true;
			this.emit('move', this.createSmallPacket());
		} else {
			_isMoving = false;
			this.emit('move', this.createSmallPacket());
		}

		//Normalize velocity
		//this.velocity = math.normalize(this.velocity);
	};

	//////////////////////////////////////////////////////////////////////////////
	// Attach a controller
	this.attachController = function (controller) {
		_controller = controller;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Create an update object
	this.createSmallPacket = function () {
		return {
			id: this.id,
			pos: this.pos,
			velocity: this.velocity,
			movespeed: this.movementSpeed,
			maxspeed: this.maxVelocity
			//viewport: this.viewport
		};
	};

	//////////////////////////////////////////////////////////////////////////////
	// Create a full update object
	this.createFullUpdateObject = function () {
		return {
			id: this.id,
			name: this.name,
			pos: this.pos,
			velocity: this.velocity,
			movespeed: this.movementSpeed,
			maxspeed: this.maxVelocity,
			bbox: this.bbox,
			stats: _stats
		};
	};

	//////////////////////////////////////////////////////////////////////////////
	// Decrement stat
	this.decStat = function (stat, delta) {
		if (typeof _stats[stat] !== 'undefined') {
			var before = _stats[stat];
			_stats[stat] -= delta;
			if (_stats[stat] < 0) {
				_stats[stat] = 0;	
			}
			this.emit('stat_change', {name: stat, value: _stats[stat], oldValue: before});
		}
	},

	//////////////////////////////////////////////////////////////////////////////
	// Increment stat
	this.incStat = function (stat, delta) {
		if (typeof _stats[stat] !== 'undefined') {
			var before = _stats[stat];
			_stats[stat] += delta;
			if (_stats[stat] > 100) {
				_stats[stat] = 100;	
			}
			this.emit('stat_change', {name: stat, value: _stats[stat], oldValue: before});
		}
	},

	//////////////////////////////////////////////////////////////////////////////
	// Give an item to the actor
	this.giveItem = function (item, count) {

		count = typeof count === 'undefined' ? 1 : count;

		for (var k = 0; k < count; k++) {
			var itm = _item.create(this, item), foundStack = false;
			if (itm) {

				//Check if there is already an item of the same type, and if 
				//there's an available slot for it.
				this.inventory.some(function (i) {
					if (i[0].name === item && i.length < item.maxStackSize) {
						i.push(item);
						foundStack = true;
						return true;
					}
					return false;
				}, this);

				if (!foundStack) {
					this.inventory.push([itm]);
				}

				_inventoryFlat.push(itm);

				this.emit('item_get', itm);
			}
		}
	};

	//////////////////////////////////////////////////////////////////////////////
	// Take an item from the actor
	this.takeItem = function (itemID) {
			//Find in the flat inventory
		_inventoryFlat = _inventoryFlat.filter(function (item) {
			if (item.id == itemID) {
				//Found it. Now find it in the stacked inventory
				this.inventory.some(function (sitem) {
					if (sitem[0].name === item.name) {
						//Now filter it out of the stack
						sitem = sitem.filter(function (i) {
							return i.id !== itemID;
						});
					}
				}, this);
				//EMit loose item
				this.emit('item_loose', itemID);
				return false;
			}
			return true;
		}, this);
	};

	//////////////////////////////////////////////////////////////////////////////
	// Use an item.
	/*
		An item can be a one use (e.g. consumable) or a multiple-use (e.g. weapon)
	*/
	this.use = function (itemID, tx, ty) {

		//Find in the flat inventory
		_inventoryFlat.some(function (item) {
			if (item.id == itemID) {

				//Use the item
				item.use(tx, ty);

				//If the item needs to be removed from the inventory call this.takeItem.
				if (item.decayed()) {
					this.takeItem(itemID);
				}
				return true;
			}
			return false;
		}, this);
	};

	//////////////////////////////////////////////////////////////////////////////
	// Set tile wrapper
	this.setTile = function (tx, ty, tile) {
		_world.setTile(tx, ty, tile, this);
	};

	//////////////////////////////////////////////////////////////////////////////
	// Mine a tile
	this.mineTile = function (tx, ty, force) {
		_world.mineTile(tx, ty, this, force);
	};


	//////////////////////////////////////////////////////////////////////////////
	// Interact with the tile the actor is standing on
	this.interact = function () {
		var t = _world.getTile(this.tilePos.x, this.tilePos.y);
		if (t) {
			//Ok. Let's see what we have here.

			//1. Check if there's a trigger here. Execute it if there is.
			//2. Check if there's an item here. Retrieve it if there is.
			//3. Check if there's a mineable resource here. 
			//	3b. Check if the right mining tool was used. Mine it if it was.

		}

		//Now check the tile in front of the player. 
		//There could be a solid mineable there.

	};

	//////////////////////////////////////////////////////////////////////////////
	//Fire a projectile eminating from the actor
	this.fireProjectile = function (speed, decay, spritesheet, onhit) {
		_world.fireProjectile({
			origin: {
		 		x: this.pos.x + (this.size.w / 2),
		 		y: this.pos.y + (this.size.h / 2)
		 	},
			direction: this.direction,
			speed: speed,
			decay: decay,
			onhit: onhit,
			originator: this,
			spritesheet: spritesheet
		});
	};

	//////////////////////////////////////////////////////////////////////////////
	// Tick
	/*
		This will update the Actor.
	*/
	this.update = function (timeMS) {

		function toTileCoord(c) {
			return Math.floor(c / _world.tilesize());
		}

		if (_lastUpdateTime !== 0) {
			//Find the delta
			_deltaTime = (timeMS - _lastUpdateTime) / 1000;

			//Cast ray to check collision. If there's a collision, keep the velocity
			//but don't update the position. 

			if (this.velocity.y !== 0 || this.velocity.x !== 0) {
				this.direction.x = this.velocity.x;
				this.direction.y = this.velocity.y;
			}

			nextPos = {
				x: this.pos.x + (this.velocity.x * this.movementSpeed) * _deltaTime, 
				y: this.pos.y + (this.velocity.y * this.movementSpeed) * _deltaTime
			};

			//Update bounding box
			this.bbox.x = nextPos.x + this.bbox.offsetX;
			this.bbox.y = nextPos.y + this.bbox.offsetY;

			//Check for collision
			if (_world.collision(this.bbox)) {
				if (!_colliding) {
					this.emit('colliding');
				}
				_colliding = true;
				this.velocity.x = 0;
				this.velocity.y = 0;
			} else {

				if (_colliding) {
					this.emit('done_colliding');
				//	this.velocity.x = 0;
				//	this.velocity.y = 0;
					_colliding = false;
				}

				//Apply velocity
				this.pos.x = nextPos.x;
				this.pos.y = nextPos.y;

				//Calculate tile position
				this.tilePos.x = Math.floor(this.pos.x / _world.tilesize());
				this.tilePos.y = Math.floor(this.pos.y / _world.tilesize());

			}

		}

		//Update controller if applicable
		if (_controller !== null) {
			_controller.update(timeMS, _deltaTime);
		}

		//Update the last update time
		_lastUpdateTime = timeMS;

		//Finally, update the viewport
		this.updateViewport();
	};

	//////////////////////////////////////////////////////////////////////////////
	// Create the viewport volume
	/*
		The values are largely dependant on the clients resolution.
		To avoid cheating, the maximum resolution is 1920x1080.
	*/
	this.updateViewport = function () {
		var width = 400, height = 400;


		this.viewport.x1 = this.pos.x - width;
		this.viewport.y1 = this.pos.y - height;

		this.viewport.x2 = this.pos.x + width;
		this.viewport.y2 = this.pos.y + height;

		if (this.viewport.x1 < 0) this.viewport.x1 = 0;
		if (this.viewport.y1 < 0) this.viewport.y1 = 0;


	};

};

//Exports
module.exports = {
	//Create a new actor
	create: function (attr) {
		return new Actor(attr);
	}

};
