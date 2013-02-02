/*******************************************************************************

	Part of the Leikr project.

	Authored by Christer M. Vasseng, 2013. cvasseng@gmail.com

/******************************************************************************/

var actorUID = 0,
		math = require('./lei.math'),
		_tile = require('./lei.tile');

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

	var nextPos;


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
			bbox: this.bbox
		};
	};

	//////////////////////////////////////////////////////////////////////////////
	// Give an item to the actor
	this.giveItem = function (item) {

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
	// Use an item.
	/*
		An item can be a one use (e.g. consumable) or a multiple-use (e.g. weapon)
	*/
	this.use = function () {

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
