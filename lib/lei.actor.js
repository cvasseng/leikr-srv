/*******************************************************************************

	Part of the Leikr project.

	Authored by Christer M. Vasseng, 2013. cvasseng@gmail.com

/******************************************************************************/

var actorUID = 0,
		math = require('./lei.math');

//Our Actor object
var Actor = function () {

	//////////////////////////////////////////////////////////////////////////////
	// Private properties

	//Time of last update - used to calculate FPS and delta locally
	var lastUpdateTime = 0;
	//Delta time - used to determine physics related stuff (like moving/jumping)
	var deltaTime = 0; 
	//Listeners
	var listeners = [];
	//The number of listeners
	var listenerCount = 0;
	//Is moving?
	var isMoving = false;

	//////////////////////////////////////////////////////////////////////////////
	// Public properties
	
	//The viewport
	this.viewport = {
		x1: 0,
		x2: 0,
		y1: 0,
		y2: 0
	};

	//The actor position
	this.pos = {
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

	//////////////////////////////////////////////////////////////////////////////
	// Emit a signal
	this.emit = function (which) {
		var args = Array.prototype.slice.call(arguments);
		args.splice(0, 1);
		if (typeof listeners[which] !== 'undefined') {
			listeners[which].forEach(function(callback) {
				callback.fn.apply(callback.ctx, args);
			});
		}
	};

	//////////////////////////////////////////////////////////////////////////////
	// Attach listener
	this.on = function (evnt, ctx, fn) {
		var id = listenerCount;

		if (typeof listeners[evnt] === 'undefined') {
			listeners[evnt] = [];
		}

		if (typeof ctx === 'function') {
			fn = ctx;
			ctx = this;
		}

		//Register callback
		listeners[evnt].push({
			ctx: ctx,
			fn: fn,
		});

		listenerCount++;

		//Return a function that will unbind the event
		return function () {
			listeners[evnt] = listeners[evnt].filter(function (callback) {
				return callback.id !== id;
			});
		};

	};

	//////////////////////////////////////////////////////////////////////////////
	// Stop moving
	this.stopMoving = function () {
		this.velocity.x = 0;
		this.velocity.y = 0;
		isMoving = false;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Start moving
	this.startMoving = function (force) {
		this.velocity.x = force.x;
		this.velocity.y = force.y;
		isMoving = true;
	};

	//////////////////////////////////////////////////////////////////////////////
	//Apply velocity to the actor
	this.applyVelocity = function (x, y) {
		this.velocity.x = x;
		this.velocity.y = y;

		//Normalize velocity
		this.velocity = math.normalize(this.velocity);
	};

	//////////////////////////////////////////////////////////////////////////////
	// Create a packet for the actor
	this.createSmallPacket = function () {
		return {
			id: this.id,
			pos: this.pos,
			velocity: this.velocity,
			movespeed: this.movementSpeed,
			maxspeed: this.maxVelocity
		};
	};

	//////////////////////////////////////////////////////////////////////////////
	// Tick
	/*
		This will update the Actor.
	*/
	this.update = function (timeMS) {

		if (lastUpdateTime !== 0) {
			//Find the delta
			deltaTime = (timeMS - lastUpdateTime) / 1000;

			//Apply velocity
			this.pos.x += this.velocity.x * (this.movementSpeed * deltaTime);
			this.pos.y += this.velocity.y * (this.movementSpeed * deltaTime);

		}

		//Update the last update time
		lastUpdateTime = timeMS;

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
		var width = 800, height = 800;


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
