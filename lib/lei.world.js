/*******************************************************************************

	Part of the Leikr project.

	Authored by Christer M. Vasseng, 2013. cvasseng@gmail.com

/******************************************************************************/

/*

	This is the world. It contains the tilemap and all the actors and other
	tings interacting with the map.

	A map consists of several chunks.
	Each chunk is the home to [0..n] actors.
	An actor can live on several chunks at once. 
	The chunks themselves maintain lists of which actor is "on" it.

	There may only be one world active on each instance.
	This is because worlds are meant to be frikin' huge, and they should 
	contain sub-segments (e.g. bioms) to offer diversity.

*/

	  
var	colors = require('colors'),
		_tile = require('./lei.tile'),
		actorFactory = require('./lei.actor'),
		//Common
		common = require('./lei.common'),
		//The tilesize
		TILESIZE = 32,
		//The size of a chunk in tiles. Each chunk is a perfect square
		CHUNK_SIZE = 40,
		//The number of pixels that someone needs to be within the 
		//chunk for it to register as a visit
		CHUNK_VISIBILITY_THRESHOLD = (CHUNK_SIZE * TILESIZE),
		//The size of a chunk in pixels
		CHUNK_SIZE_PX = CHUNK_SIZE * TILESIZE,
		//The tick time for _chunks
		CHUNK_TICK = 1000,
		//The tick time for the world
		WORLD_TICK = 10,
		//Array of _chunks, indexed by coordinates x + y * width
		/*
			The data is ordered by x + y * width to make it easier to use 
			a common set/getTile function.
		*/
		_chunks = [],
		//The number of _chunks along X
		_chunkCountX = 0,
		//The number of _chunks along Y
		_chunkCountY = 0,
		//List of _chunks that are currently active
		_activeChunks = [],
		//The size of the map
		_mapSize = {w: 10, h: 10},
		//Event _listeners attached to the world
		_listeners = [],
		//Number of _listeners
		_listenerCount = 0
		//Actors
		_allActors = [],
		//When the _chunks where last updated
		_chunkLastUpdateTime = 0

		;

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//Emit an event
function emit (which) {
	var args = Array.prototype.slice.call(arguments);
	args.splice(0, 1);
	if (typeof _listeners[which] !== 'undefined') {
		_listeners[which].forEach(function(callback) {
			callback.fn.apply(callback.ctx, args);
		});
	}
}

////////////////////////////////////////////////////////////////////////////////
// Create a chunk
function createChunk () {

	var chunk = {
		//When was the chunk last seen?
		lastSeenMs: 0,
		//The data
		data: [],
		//Items in the chunk
		items: [],
		//Actors living on the chunk
		actors: [],
		//Actor map - for fast access to a given actor
		actorMap: []

	};

	return chunk;
}

////////////////////////////////////////////////////////////////////////////////
// Return true if the actor is in the given chunk

function inChunk (chunk, actor) {
	return findChunks(actor.viewport).filter(function(b) {
		return b.id === chunk.id;
	}).length > 0;
}


////////////////////////////////////////////////////////////////////////////////
// Update a chunk
/*
	This will go through all the actors in the chunk and check if they're
	still within range. If they're not, they'll be removed from it.
*/
function updateChunk (chunk) {
	//Is there still someone here_
	if (chunk.actors.length > 0) {
		//chunk.lastSeenMs = timeMS;
	}

	//Filter out actors that are no longer on the chunk
	chunk.actors = chunk.actors.filter(function (actor) {
		if (!inChunk(chunk, actor)) { //Actor is no longer in the chunk
			chunk.actorMap[actor.id] = undefined;
			actor.emit('leave_chunk', chunk);
			emit('actor_leave_chunk', actor, chunk);
			//Remove the chunk from the player
			actor.chunks = actor.chunks.filter(function (c) {
				return c.id !== chunk.id;
			});
			return false;
		}
		return true;
	});

	//If there are no actors left on the chunk, deactivate it.
	if (chunk.actors.length === 0) {
		emit('hibernate_chunk', chunk);
		return false;
	}
	return true;
}

////////////////////////////////////////////////////////////////////////////////
// Update all active chunks
/*
	This only updates chunks that had actors on it last update.
*/
function updateChunks () {
	//We use filter to update so that we can remove chunks that are hibernating
	_activeChunks = _activeChunks.filter(updateChunk);
}

////////////////////////////////////////////////////////////////////////////////
// Remove actor from a chunk
function removeActorFromChunk (actor, chunk) {
	chunk.actors = chunk.actors.filter(function (a) {
		if (a.id === actor.id) {
			chunk.actorMap[actor.id] = undefined;
			actor.emit('leave_chunk', chunk);
			emit('actor_leave_chunk', actor, chunk);
			return false;
		}	
		return true;
	});


}

////////////////////////////////////////////////////////////////////////////////
// Update the chunks that the actor is on
/*
	This function is responsible for *adding* the actor to chunks only.
	The removing of chunk/actor ties is done in updateChunks.
*/
function updateActorChunks(actor) {
	var a_chunks = findChunks(actor.viewport);
	a_chunks.forEach(function (chunk) {
		//Is the actor already there?
		if (typeof chunk.actorMap[actor.id] === 'undefined') {
			if (chunk.actors.length === 0) {
				_activeChunks.push(chunk);
			}

			//Add the chunk to the actors chunk list
			actor.chunks.push(chunk);

			//Note that the emits happen before adding the actor.
			//This is to avoid the actor receiving a reference to itself 
			//when sending packets (e.g. from a resulting spawn event)
			emit('actor_enter_chunk', actor, chunk);
			actor.emit('enter_chunk', chunk);

			chunk.actors.push(actor);
			chunk.actorMap[actor.id] = actor;

		} else {
			//emit('actor_enter_chunk', 'Actor already on the chunk', actor, chunk);
		}
	});
}

////////////////////////////////////////////////////////////////////////////////
// Find the chunk at a given pixel
function findChunkFromPixels (x, y, target) {
	var tx = Math.round(x / CHUNK_SIZE_PX),
			ty = Math.round(y / CHUNK_SIZE_PX),
			index = tx + ty * _chunkCountX,
			chunk = _chunks[index];

	if (typeof target !== 'undefined' && typeof chunk !== 'undefined') {
		target.push(chunk);
	}

	return typeof chunk !== 'undefined' ? chunk : false;
}

////////////////////////////////////////////////////////////////////////////////
// Find all chunks within range of a given volume
/*
	Note that this function accepts pixel coordinates and not tile coordinates.
	This is because actors use pixel coordinates for their positions,
	and actors are the only ones that needs to know which _chunks are within range.

	The volume is an object containing x1, x2, y1, y2.

	We access the chunk array directly.
*/
function findChunks (volume) {	
	var res = [], chunk;

	//Calculate a new volume in tile coordinates using visibility
	
	var tx1 = Math.floor((volume.x1 - CHUNK_VISIBILITY_THRESHOLD) / CHUNK_SIZE_PX),
			tx2 = Math.floor((volume.x2 + CHUNK_VISIBILITY_THRESHOLD) / CHUNK_SIZE_PX), 
	 		ty1 = Math.floor((volume.y1 - CHUNK_VISIBILITY_THRESHOLD) / CHUNK_SIZE_PX), 
			ty2 = Math.floor((volume.y2 + CHUNK_VISIBILITY_THRESHOLD) / CHUNK_SIZE_PX); 
	//*/
/*
	var tx1 = Math.floor((volume.x1) / CHUNK_SIZE_PX),
			tx2 = Math.floor((volume.x2) / CHUNK_SIZE_PX), 
	 		ty1 = Math.floor((volume.y1) / CHUNK_SIZE_PX), 
			ty2 = Math.floor((volume.y2) / CHUNK_SIZE_PX); 
//*/
//	console.log(JSON.stringify(volume));

	//Preform some clamping
	if (tx1 < 0) tx1 = 0;
	if (tx2 < 0) tx2 = 0;
	if (ty1 < 0) ty1 = 0;
	if (ty2 < 0) ty2 = 0;

	//Always check at least one chunk
	if (tx1 === tx2) tx2++;
	if (ty1 === ty2) ty2++;

	//Retrieve the chunks - this needs some optimizing, it adds the same chunks
	//several times...
	for (y = ty1; y < ty2; y++) {
		for (x = tx1; x < tx2; x++) {
			chunk = _chunks[x + y * _chunkCountX];
			if (typeof chunk !== 'undefined') {
				res.push(chunk);
			}
		}
	}

	return res;
}

////////////////////////////////////////////////////////////////////////////////
// Preform an action for a specific coordinate
/*
	Resolve world coordinates to local chunk coordinates 
	and execute a callback with the signature:
	
		function (chunk, index)
	
	for the coordinate.

*/
function doForTileAt(tx, ty, fn) {
	var ctx = Math.floor((tx * TILESIZE) / CHUNK_SIZE_PX),
 		cty = Math.floor((ty * TILESIZE) / CHUNK_SIZE_PX),
 		index = ctx + cty * _chunkCountX,
		chunk = _chunks[index];

	if (typeof chunk !== 'undefined') {

		ctx = tx - chunk.pos.tx;
		cty = ty - chunk.pos.ty;

		if (ctx >= 0 && ctx < CHUNK_SIZE && cty >= 0 && cty < CHUNK_SIZE) {
			if (typeof fn === 'function') {
				return fn(chunk, ctx + cty * CHUNK_SIZE);
			}
		} 
	}
	return false;
};

////////////////////////////////////////////////////////////////////////////////


module.exports = (function () {

	//Start main loop

	return {

		////////////////////////////////////////////////////////////////////////////
		//Listen to event
		on: function (evnt, ctx, fn) {
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

		},

		////////////////////////////////////////////////////////////////////////////
		//Init map
		init: function (attr) {
			var chunkCount, chunk, ptext, status = true, pmsg = 'Creating chunks';

			//emit('log', false, 'Initing game world..'.black.bold);

			if (typeof attr !== 'undefined') {
				_mapSize.w = typeof attr.width === 'undefined' ? 100 : attr.width;
				_mapSize.h = typeof attr.height === 'undefined' ? 100 : attr.height;
			}

			//Make sure that there's at least one chunk
			if (_mapSize.w * TILESIZE < CHUNK_SIZE_PX) {
				_mapSize.w = CHUNK_SIZE_PX / TILESIZE;
				emit('log', false, 'Map width too small, resized to ' + _mapSize.w);
			}
			if (_mapSize.h * TILESIZE < CHUNK_SIZE_PX) {
				_mapSize.h = CHUNK_SIZE_PX / TILESIZE;
				emit('log', false, 'Map height too small, resized to ' + _mapSize.h);
			}

			//Create _chunks
			_chunkCountX = Math.floor((_mapSize.w * TILESIZE) / CHUNK_SIZE_PX);
			_chunkCountY = Math.floor((_mapSize.h * TILESIZE) / CHUNK_SIZE_PX);

			var chunkCount = _chunkCountX * _chunkCountY;
		
			//Instance the _chunks
			emit('progress', false, pmsg, chunkCount);

			for (y = 0; y < _chunkCountY; y++) {
				for (x = 0; x < _chunkCountX; x++) {
					chunk = createChunk();
					chunk.id = '[' + x + ',' + y + ']';
					chunk.size = CHUNK_SIZE;
					chunk.pos = {
						tx: Math.floor((x * CHUNK_SIZE_PX) / TILESIZE),		
						ty: Math.floor((y * CHUNK_SIZE_PX) / TILESIZE)		
					};

					//Set the chunk data
					for (var i = 0; i < CHUNK_SIZE * CHUNK_SIZE; i++) {
						chunk.data[i] = _tile.create(0, 0, 0, 0, 0);
					}

					_chunks[x + y * _chunkCountX] = chunk;	

					emit('progress', false, pmsg, chunkCount);
				}
			}

			emit('log', !status, 'Creating a world with ' + (_mapSize.w * _mapSize.h) + ' tiles');

			setInterval(module.exports.tick, WORLD_TICK);

			return status;
		},

		////////////////////////////////////////////////////////////////////////////
		//Get the width of the world
		width: function () {
			return _mapSize.w;
		},

		////////////////////////////////////////////////////////////////////////////
		//Get the height of the world
		height: function () {
			return _mapSize.h;
		},

		////////////////////////////////////////////////////////////////////////////
		// Get the tilesze
		tilesize: function () {
			return TILESIZE;
		},

		////////////////////////////////////////////////////////////////////////////
		//Save world
		save: function () {
			emit('progress', 'Saving world', 0);
		},

		////////////////////////////////////////////////////////////////////////////
		// Convert a pixel coordinate to a tile coordinate
		toTileCoord: function (c) {
			return Math.floor(c / TILESIZE);
		},

		////////////////////////////////////////////////////////////////////////////
		// Check if there's a collision at a given coordinate
		collision: function (tx, ty) {

			if (typeof ty === 'undefined') {
				//tx is a bbox
				//We need to check all four corners of the bounding box
				var bbox = tx,
						w = module.exports,
						tx1 = w.toTileCoord(bbox.x),
						ty1 = w.toTileCoord(bbox.y),
						tx2 = w.toTileCoord(bbox.x + bbox.w),
						ty2 = w.toTileCoord(bbox.y + bbox.h),
						collision = false;

				//Top-left
				if (w.collision(tx1, ty1)) {
					collision = true;
				}		
				//Top-right
				if (w.collision(tx2, ty1)) {
					collision = true;
				}
				//Bottom-left
				if (w.collision(tx1, ty2)) {
					collision = true;
				}
				//Bottom-right
				if (w.collision(tx2, ty2)) {
					collision = true;
				}

				return collision;

			}

			var t = module.exports.getTile(tx, ty);

			return _tile.collision(t) || t === false;
		},
		
		////////////////////////////////////////////////////////////////////////////
		//Set the tile at a given coord
		/*
			This will translate world tile coordinates into local chunk
			coordinates after deducing which chunk owns the coordinates.
		*/
		setTile: function (tx, ty, tile) {
			doForTileAt(tx, ty, function (chunk, index) {
				chunk.data[index] = tile;

				emit('tile_change', chunk, Math.floor(tx), Math.floor(ty), tile);
			});
		},

		////////////////////////////////////////////////////////////////////////////
		//Get the tile at a given coordinate
		getTile: function (tx, ty) {
			return doForTileAt(tx, ty, function (chunk, index) {
				var tile = chunk.data[index];
				//console.log(tile + ' ' + index);
				return typeof tile === 'undefined' ? false : tile;
			});
		},

		////////////////////////////////////////////////////////////////////////////
		//Find _chunks adjacent to an actor
		getAdjecentChunks: function (actor) {
			return findChunks(actor.viewport);
		},

		////////////////////////////////////////////////////////////////////////////
		// Spawn item to the world
		spawnItem: function (item, tx, ty) {
			return doForTileAt(tx, ty, function (chunk, index) {
				if (typeof chunk.items[actualIndex] === 'undefined') {
					emit('spawn_item', chunk, item, tx, ty);
					return true;
				}
				return false;
			});
		},

		////////////////////////////////////////////////////////////////////////////
		// Despawn item - returns the discarded item or false
		despawnItem: function (tx, ty) {
			return doForTileAt(tx, ty, function (chunk, index) {
				var item = chunk.items[actualIndex];
				if (typeof item !== 'undefined') {
					//The tile is empty, so we can spawn it there.
					emit('despawn_item', chunk, item, tx, ty);
					return item;
				}
				return false;
			});
		},

		////////////////////////////////////////////////////////////////////////////
		//Add an actor to the map - an actor can be either an AI or a player.
		addActor: function (actor) {
			//Update the actor viewport
			actor.updateViewport();

			//Figure out which chunk the actor is in, and which _chunks are 
			//close enough that they need to be activated
			updateActorChunks(actor);

			_allActors.push(actor);

			emit('add_actor', actor);

			//The chunks will emit enter_chunk and leave chunk, 
					//so that's what should initiate the spawn. 
					//Otherwise, the actor will spawn everywhere..
			//emit('spawn', actor);
		},

		////////////////////////////////////////////////////////////////////////////
		//Remove an actor
		remActor: function (actorID) {
			_allActors = _allActors.filter(function(actor) {
				if (actor.id === actorID) {

					actor.chunks.forEach(function (chunk) {
						//Need to remove the actor from chunks
						removeActorFromChunk(actor, chunk);
					});

					//emit('despawn', actor);
					//The chunks will emit enter_chunk and leave chunk, 
					//so that's what should initiate the spawn. 
					//Otherwise, the actor will spawn everywhere..
					emit('rem_actor', actor);
					return false;
				}
				return true;
			});

			//console.log('There are now ' + _allActors.length + ' active actors');
		},	

		////////////////////////////////////////////////////////////////////////////
		//Preform a tick
		tick: function () {
			var timeMs = (new Date()).getTime();

			_allActors.forEach(function (actor) {
				actor.update(timeMs);
				updateActorChunks(actor);
			});

			if (timeMs - _chunkLastUpdateTime > CHUNK_TICK) {
				updateChunks();
				_chunkLastUpdateTime = timeMs;
				//console.log('Updating _chunks');
			}

		},

		////////////////////////////////////////////////////////////////////////////
		//Call to add a player to the world
		playerEnterWorld: function (player) {
			if (typeof player === 'undefined') {
				//Generate a new ID
			} else {
				//Load the player
			}
			/*
			var player = new actorFactory.create({});
			player.socket = socket;

			

			//Send the adjacent map _chunks to the player
			
			var chunks = module.exports.getAdjecentChunks(player);
			chunks.forEach(function (chunk) {
				player.socket.emit('chunk', {
					tx: chunk.pos.tx,
					ty: chunk.pos.ty,
					data: chunk.data,
					size: chunk.size
				});
			});
			//*/

			//Add the player to the world
			module.exports.addActor(player);

			return player;
		},

		////////////////////////////////////////////////////////////////////////////
		//Call when a player leaves the world
		playerLeaveWorld: function (player) {	
			common.log('Player ' + player.id + ' left the world', true);
			module.exports.remActor(player.id);
			
		},

		////////////////////////////////////////////////////////////////////////////
		//Find an actor 
		findActor: function (id) {
			return _allActors.filter(function (actor) {
				return actor.id === id;
			})[0];
		},

	};
})();