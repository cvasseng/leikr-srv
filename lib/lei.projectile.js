/*******************************************************************************

	Part of the Leikr project.

	Authored by Christer M. Vasseng, 2013. cvasseng@gmail.com

/******************************************************************************/

//Projectile object
var Projectile = function (origin, direction, decay, speed, ondone) {

	//The hit callback
	var _onDone = ondone;
	//World
	var _world = require('./lei.world');
	//Health of the projectile
	var _health = 100;

	//Position
	this.pos = {
		x: origin.x,
		y: origin.y
	};

	//Direction
	this.dir = {
		x: direction.x,
		y: direction.y
	};

	//Size
	this.size = {
		w: 20,
		h: 20
	};

	//BBox
	this.bbox = {
		x: 0,
		y: 0,
		w: 0,
		h: 0
	};

	//Speed 
	this.speed = speed;
	//Decay
	this.decay = decay;
	//ID
	this.id = _world.nextID();

	//Do the done callback
	function doDone() {
		if (typeof _onDone === 'function') {
			_onDone.apply(this, arguments);
		}
	}

	//////////////////////////////////////////////////////////////////////////////
	// Update the projectile
	this.update = function (timeMs, deltaTime) {

		this.pos.x += (this.dir.x * this.speed) * deltaTime;
		this.pos.y += (this.dir.y * this.speed) * deltaTime;

		this.bbox.x = this.pos.x + (this.size.w / 2);
		this.bbox.y = this.pos.y + (this.size.h / 2);

		_health -= decay * deltaTime;

		//Check if the projectile is dead
		if (_health <= 0) {
			doDone('decayed');
			return false;
		}

		//First check if it collides with the map
		if (_world.collision(this.bbox)) {
			doDone('wall', _world.toTileCoord(this.bbox.x), _world.toTileCoord(this.bbox.y));
			return false;
		}

		//No map collision, check against actors.
		//This is a bit complicated, because we have to go through the chunks..
		var chunk = _world.findChunkFromPixels(this.pos.x, this.pos.y), actor;

		if (typeof chunk !== 'undefined') {
			for (var i = 0; i < chunk.actors.length; i++) {
				actor = chunk.actors[i];
				if (actor.pointInActor(this.pos.x, this.pos.y)) {
					doDone('actor', actor);
					return false;
				}
			}
		}

		return true;
	}

};


module.exports = {
	create: function (origin, direction, decay, speed, ondone) {
		return new Projectile(origin, direction, decay, speed, ondone);
	}
}
