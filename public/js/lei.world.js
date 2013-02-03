lei.world = (function () {
	
	//FPS
	var _fps = 0;
	//Last frame time
	var _lastFrameTime = 0;
	//Frame counter
	var _frameCounter = 0;
	//FPS timer
	var _frameTimer = 0;
	//Delta time
	var _deltaTime = 0;
	//Map data
	var _mapData = [];
	//_tilesize
	var _tilesize = 32;
	//Map size
	var _mapSize = {
		w: 1000,
		h: 500
	};
	//Sprites currently in play
	var _sprites = [];
	//Stack of chunks that are currently loading
	/*
		We load one line each frame to spread the load.
	*/
	var _pendingChunks = [];
	//Stack of chunk
	var _chunks = [];
	//SIze of chunks, we assume they all have the same size
	var _chunkSize = 0;
	//Projectiles
	var _projectiles = [];

	//Our background canvas
	var bgSurface = new lei.Surface(true);
	//Our foregraound surface
	var fgSurface = new lei.Surface(true);
	//Our main tile surface
	var tiSurface = new lei.Surface(true);
	//Our sprite layer
	var spSurface = new lei.Surface(true);
	//Text layer
	var txSurface = new lei.Surface(true);

	//The active surface buffer
	var _activeSurfaceBuffer = null;
	//The active surface buffer index
	var _activeSurfaceBufferIndex = 0;
	//Draw buffers
	var _drawBuffers = [
		new lei.Surface(),
		new lei.Surface()
	];
	//Camera
	var _cam = {
		position: {
			x:0,
			y:0
		},
		zoom: 3.5
	};

	
	//spSurface.resize(_mapSize.w * _tilesize, _mapSize.h * _tilesize);
	
	//The tilesets
	var tileset = new Image();
	tileset.src = 'img/terrain_tileset.png';

	//The player
	var _player = new lei.Sprite({});
	//_sprites.push(_player);

	////////////////////////////////////////////////////////////////////////////
	// Flip the buffer
	function flipBuffer() {

		if (_activeSurfaceBuffer !== null) {
			_activeSurfaceBuffer.canvas.style.display = 'block';
		}

		_activeSurfaceBufferIndex++;
		if (_drawBuffers.length <= _activeSurfaceBufferIndex) {
			_activeSurfaceBufferIndex = 0;
		}

		//Set the _activeSurfaceBuffer to the new one
		_activeSurfaceBuffer = _drawBuffers[_activeSurfaceBufferIndex];
		_activeSurfaceBuffer.canvas.style.display = 'none';
		_activeSurfaceBuffer.context.webkitImageSmoothingEnabled = false;
		spSurface.context.webkitImageSmoothingEnabled = false;
		tiSurface.context.webkitImageSmoothingEnabled = false;

	};

	////////////////////////////////////////////////////////////////////////////
	// Fix the edges of a chunk
	function fixEdges (chunk) {

		if (typeof chunk === 'undefined') {
			return;
		}

		console.log('Fixing chunk at ' + chunk.tx + ' ' + chunk.ty);
		chunk = chunk.data;


		var x, y, ox = chunk.tx, oy = chunk.ty;

		//Fix top
		for (x = 0; x < chunk.size; x++) {
			lei.world.setTile(x + ox, oy, chunk.data[x]);
		}

		//Fix bottom
		for (x = 0; x < chunk.size; x++) {
			y = chunk.size - 1;
			lei.world.setTile(x + ox, y + oy, chunk.data[x + y * chunk.size]);
		}

		//Fix right
		for (y = 0; y < chunk.size; y++) {
			x = chunk.size - 1;
			lei.world.setTile(x + ox, y + oy, chunk.data[x + y * chunk.size]);
		}

		//Fix left
		for (y = 0; y < chunk.size; y++) {
			lei.world.setTile(ox, y + oy, chunk.data[y * chunk.size]);
		}

	}

	////////////////////////////////////////////////////////////////////////////
	// Process an entire chunk
	function processEntireChunk (chunk) {
		//Copy the chunk data to the _mapData
		for (y = chunk.ty; y < chunk.ty + chunk.size; y++) {
			for (x = chunk.tx; x < chunk.tx + chunk.size; x++) {
				data = chunk.data[ (x - chunk.tx) + ((y - chunk.ty) * chunk.size)];
				if (typeof data ==='undefined') {
					data = lei.tile.create(20, 0, 0, 0, 0);
				}

				_mapData[x + y * _mapSize.w] = data;
				//Process right away
				lei.world.setTile(x, y, data)
			}
		}
	};

	////////////////////////////////////////////////////////////////////////////
	// Process part of a chunk
	/*
		In order to not freeze the game while chunks are streamed,
		they are processed line-by-line in the update loop.

	*/
	function processChunk (chunk) {
		var x, y, data, linesPerUpdate = 2, done = false;

		if (typeof chunk.currentY === 'undefined') {
			chunk.currentY = chunk.ty;
		}

		for (y = chunk.currentY; y < chunk.currentY + linesPerUpdate; y++) {
			for (x = chunk.tx; x < chunk.tx + chunk.size; x++) {
				data = chunk.data[ (x - chunk.tx) + ((y- chunk.ty) * chunk.size)];
				lei.world.setTile(x, y, data);
			}
		}

		chunk.currentY += linesPerUpdate;

		done = chunk.currentY === chunk.ty + chunk.size;

		if (done) {
			var tx = Math.floor( (chunk.tx ) / chunk.size ),
					ty = Math.floor( (chunk.ty ) / chunk.size );

			console.log('Attempting to fix chunk, current chunk is ' + tx + ' ' + ty);

			//Fix edges of adjacent chunks
			fixEdges(chunkAt(tx, ty - 1));
			fixEdges(chunkAt(tx, ty + 1));
			fixEdges(chunkAt(tx - 1, ty));
			fixEdges(chunkAt(tx + 1, ty));

		}

		return done;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Get chunk at
	function chunkAt (tx, ty) {
		if (typeof _chunks[ty] === 'undefined') {
			return undefined;
		}
		return _chunks[ty][tx];
	}


	//////////////////////////////////////////////////////////////////////////////
	// Update
	function update () {
		var timeMs = (new Date()).getTime(), tx,ty, tile;

		if (timeMs - _frameTimer >= 1000) {
			_fps = _frameCounter;
			_frameCounter = 0;
			_frameTimer = timeMs;
		}

		_deltaTime = (timeMs - _lastFrameTime) / 1000;

		_activeSurfaceBuffer.clear('black');

		//Process chunks
		if (_pendingChunks.length > 0) {
			if (processChunk(_pendingChunks[0])) {
				//Done processing the top chunk, remove it from the queue
				console.log('Chunk processed ' + _pendingChunks[0].tx + ',' + _pendingChunks[0].ty);
				_pendingChunks.splice(0, 1);
			}
		}

		//Center the "camera" on the player
		_cam.position.x = (_player.pos.x * _cam.zoom) - ( (_activeSurfaceBuffer.width() / 2)  ),
		_cam.position.y = (_player.pos.y * _cam.zoom) - ( (_activeSurfaceBuffer.height()  / 2) );

		//Clamp "camera"
		if (_cam.position.x < 0) _cam.position.x = 0;
		if (_cam.position.y < 0) _cam.position.y = 0;

		//console.log(JSON.stringify(_cam.position));

		var csp = _chunkSize,
				vpwidth = Math.floor(_activeSurfaceBuffer.width() / csp ) + 2,
				vpheight = Math.floor(_activeSurfaceBuffer.height() / csp) + 2,
				fx = Math.floor( (_player.pos.x + (_activeSurfaceBuffer.width() / 2)) / csp) - 2,
				fy = Math.floor( (_player.pos.y + (_activeSurfaceBuffer.height() / 2)) /csp) - 2
				;

		if (fx < 0) fx = 0;
		if (fy < 0) fy = 0;

		//console.log('Cullbox: ' + fx + ',' + fy + ' to ' + (fx + vpwidth) + ',' + (fy + vpheight));

		//Copy chunks to the tiSurface
		if (!isFinite(vpwidth) || !isFinite(vpheight)) {
			if (typeof webkitRequestAnimationFrame === 'function') {
				webkitRequestAnimationFrame(update);
			} else if (typeof requestAnimationFrame === 'function') {
				requestAnimationFrame(update);
			} else {
				alert('You\'r browser doesn\'t support animation frames...');
			}
			return;
		}
		
		//Blit the culled chunk caches to the active buffer
		for (var ty = fy; ty < fy + vpheight; ty++) {
			for (var tx = fx; tx < fx + vpwidth; tx++) {
				if (typeof _chunks[ty] !== 'undefined' && typeof _chunks[ty][tx] !== 'undefined') {
					var s = _chunks[ty][tx].surface.canvas;

					_activeSurfaceBuffer.blitImgSlice(
																						s, 
																						0, 
																						0, 
																						_chunkSize, 
																						_chunkSize, 
																						((tx * _chunkSize) * _cam.zoom) - _cam.position.x, 
																						((ty * _chunkSize) * _cam.zoom)- _cam.position.y, 
																						_chunkSize * _cam.zoom, 
																						_chunkSize * _cam.zoom
																					);
				} else {
				//	console.log('Missing chunk [' + tx + ',' + ty + ']');
				}
			}
		}//*/

		//Blit FPS to spSurface
		_activeSurfaceBuffer.blitText({str: 'FPS: ' + _fps, x:20, y:20});

		//Combine the two surfaces
		//_activeSurfaceBuffer.blitImgSlice(tiSurface.canvas, 0, 0, tiSurface.width(), tiSurface.height(), 0, 0, tiSurface.width() * _cam.zoom, tiSurface.height() * _cam.zoom);

		//Update the sprites
		_sprites.forEach(function (sprite) {
			sprite.update(timeMs, _deltaTime);
			sprite.draw(_activeSurfaceBuffer, _cam.position, _cam.zoom);
		});

		//Update projectiles
		_projectiles.forEach(function (projectile) {
			projectile.update(timeMs, _deltaTime);
			projectile.draw(_activeSurfaceBuffer, _cam.position, _cam.zoom);
		});

		//_activeSurfaceBuffer.blitImgSlice(spSurface.canvas, 0, 0, _activeSurfaceBuffer.width(), _activeSurfaceBuffer.height(), 0, 0, _activeSurfaceBuffer.width() * _cam.zoom, _activeSurfaceBuffer.height() * _cam.zoom);
		
		//Flip 
		flipBuffer();

		_lastFrameTime = timeMs;
		_frameCounter++;

		//Do next frame
		if (typeof webkitRequestAnimationFrame === 'function') {
			webkitRequestAnimationFrame(update);
		} else if (typeof requestAnimationFrame === 'function') {
			requestAnimationFrame(update);
		} else {
			alert('You\'r browser doesn\'t support animation frames...');
		}
	}

	////////////////////////////////////////////////////////////////////////////

	function spriteExists(id) {
		return _sprites.filter(function(s) {
			return s.id === id;
		}).length > 0;
	}


	//Return public stuff.
	return {

		////////////////////////////////////////////////////////////////////////////
		//Set the zoom factor for the camera
		setZoomFactor: function (fac) {
			if (fac < 1) {
				fac = 1;
			}
			_cam.zoom = fac / 10;


		},	

		////////////////////////////////////////////////////////////////////////////
		//Get the player
		player: function () {
			return _player;
		},

		////////////////////////////////////////////////////////////////////////////
		//Flush
		flush: function () {
			_sprites.splice(0, _sprites.length);
			_sprites.push(_player);
			_mapData = [];
			_chunks = [];
		},

		////////////////////////////////////////////////////////////////////////////
		// Fire projectile
		fireProjectile: function (data) {
			//Add a new projectile. We're using sprites.
			var projectile = new lei.Sprite();
			projectile.id = data.id;
			projectile.applyVelocity(data.dir.x, data.dir.y);
			projectile.move(data.pos.x, data.pos.y);
			projectile.collisionCheck = false;
			projectile.moveSpeed = data.speed;
			projectile.showName = false;
			projectile.loadSheet('img/dynamite.png');
			projectile.flushAnimations();
			projectile.addAnimation('idle', [0, 1, 2, 1]);
			projectile.setActiveAnimation('idle');
		//	projectile.size = data.size;
			_projectiles.push(projectile);
		},

		////////////////////////////////////////////////////////////////////////////
		// Kill projectile
		killProjectile: function (id) {
			console.log('Killing projectile ' + id);
			_projectiles = _projectiles.filter(function (projectile) {
				return projectile.id !== id;
			});
		},

		////////////////////////////////////////////////////////////////////////////
		// Get tile at
		getTile: function (tx, ty) {

		},

		////////////////////////////////////////////////////////////////////////////
		// Set the player data
		setPlayerData: function (data) {
			_player.attr({
				id: data.id,
				x: data.pos.x,
				y: data.pos.y
			});

			_player.id = data.id;
			_player.moveSpeed = data.movespeed;
			_player.move(data.pos.x, data.pos.y);
			_player.bbox = data.bbox;

			console.log('Player movespeed is ' + data.movespeed + ' ID is ' + data.id);
		},

		////////////////////////////////////////////////////////////////////////////
		//Update actor
		updateActor: function (data) {
			if (data.id === _player.id) {
				return;
			}

			console.log('Updating actor: ' + JSON.stringify(data));
			_sprites.forEach(function (actor) {
				if (actor.id === data.id) {
					actor.move(data.pos.x, data.pos.y);
					actor.applyVelocity(data.velocity.x, data.velocity.y);
					actor.moveSpeed = data.movespeed;

					return true;
				}
			});
		},

		////////////////////////////////////////////////////////////////////////////
		// Spawn
		spawn: function (data) {

			console.log('Spawn request for ' + data.id);
			if (data.id === _player.id || spriteExists(data.id)) {
				return;
			}

			console.log('Spawning ' + data.id);

			var sprite = new lei.Sprite({
				x: data.pos.x,
				y: data.pos.y,
				id: data.id
			});

			sprite.id = data.id;
			sprite.move(data.pos.x, data.pos.y);
			sprite.applyVelocity(data.velocity.x, data.velocity.y);
			sprite.bbox = data.bbox;
			sprite.name = data.name;

			_sprites.push(sprite);

			//console.log('Received spawn message: ' + JSON.stringify(data));
		},

		////////////////////////////////////////////////////////////////////////////
		// Check for collision on a given tile
		/*
			We also need a way to check a bounding box.
			If we're checking a bbox, we need to check each of the 4 corners.
			If either returns a collision, it should register.

			We also need to be able to deduce in which direction the collision was.
			This is so that we can keep moving in the direction where there's no
			collision.
		*/
		collision: function (tx, ty) {


			if (tx >= 0 && tx < _mapSize.w && ty >= 0 && ty < _mapSize.h) {
				return lei.tile.collision( _mapData[tx + ty * _mapSize.w] );
			}	
			return true;
		},

		toTileCoord: function (c) {
			return Math.floor(c / _tilesize);
		},

		bboxCollides: function (bbox) {
			//We need to check all four corners of the bounding box
			var tx1 = lei.world.toTileCoord(bbox.x),
					ty1 = lei.world.toTileCoord(bbox.y),
					tx2 = lei.world.toTileCoord(bbox.x + bbox.w),
					ty2 = lei.world.toTileCoord(bbox.y + bbox.h),
					collision = false;

			//Top-left
			if (lei.world.collision(tx1, ty1)) {
				collision = true;
			}		
			//Top-right
			if (lei.world.collision(tx2, ty1)) {
				collision = true;
			}
			//Bottom-left
			if (lei.world.collision(tx1, ty2)) {
				collision = true;
			}
			//Bottom-right
			if (lei.world.collision(tx2, ty2)) {
				collision = true;
			}

			return collision;

		},

		////////////////////////////////////////////////////////////////////////////
		// Get the tilesize
		tilesize: function () {
			return _tilesize;
		},

		////////////////////////////////////////////////////////////////////////////
		// Despawn
		despawn: function (id) {
			if (id === _player.id) {
				return;
			}

			_sprites = _sprites.filter(function (sprite) {
				return (id !== sprite.id);
			});
		},

		////////////////////////////////////////////////////////////////////////////
		// Resize
		resize: function () {
			var w = $(window).width(),
					h = $(window).height();

			tiSurface.resize(w, h);
			spSurface.resize(w, h);
			_drawBuffers.forEach(function (buffer) {
				buffer.resize(w, h);
			});
		},

		////////////////////////////////////////////////////////////////////////////
		// Init
		init: function (target) {
			if (typeof target !== 'undefined') {
				if (typeof target.appendChild === 'function') {
					_drawBuffers.forEach(function (buffer) {
						buffer.appendTo(target);
					});
				}
			}

			//Resize 
			lei.world.resize();

			//Flip
			flipBuffer();

			//Start the main loop
			update();
		},

		////////////////////////////////////////////////////////////////////////////
		// Apply a chunk to the map
		/*
			{
				id num
				size: num
				tx: num
				ty: num
				data: []
			}
		*/
		applyChunk: function (chunk) {
			//We also need to create a surface for the chunk
			var chu = {
				surface: new lei.Surface(true),
				data: chunk,
				tx: Math.floor( (chunk.tx * _tilesize) / (chunk.size * _tilesize)),
				ty: Math.floor( (chunk.ty * _tilesize) / (chunk.size * _tilesize))
			};

			_chunkSize = chunk.size * _tilesize;

			chu.surface.resize(_chunkSize, _chunkSize);

			//We're using a 2d array for chunks since we don't know how many there are.
			if (typeof _chunks[chu.ty] === 'undefined') {
				_chunks[chu.ty] = [];
				console.log('Cleared ' + chu.ty);
			}

			_chunks[chu.ty][chu.tx] = chu;

			_pendingChunks.push(chunk);
		},

		////////////////////////////////////////////////////////////////////////////
		// Set tile
		setTile: function (tx, ty, tile) {

			//Read a tile index - falls back to _mapData if out of bounds
			function rt(chunk, tx_, ty_) {
				if (tx_ < 0 || ty_ < 0 || tx_ >= chunk.data.size || ty_ >= chunk.data.size) {
					tx_ += chunk.data.tx;
					ty_ += chunk.data.ty;
					return lei.tile.tile(_mapData[tx_ + ty_ * _mapSize.w]);
				}

				return lei.tile.tile( chunk.data.data[tx_ + ty_ * chunk.data.size] );
			}
			
			var ctx = Math.floor((tx * _tilesize) / _chunkSize),
		 			cty = Math.floor((ty * _tilesize) / _chunkSize),
					chunk,
					tileRow,
					tileInd,
					ta = false,
					tb = false,
					tadd = 0;// = _chunks[cty][ctx];

			if (typeof _chunks[cty] === 'undefined') {
				//Whops.
				return;
			}

			chunk = _chunks[cty][ctx];

			if (typeof chunk !== 'undefined') {

				ctx = tx - chunk.data.tx;
				cty = ty - chunk.data.ty;

				//The tile here isn't the one we're really after. We need to calculate it.
				//The tile is the row in the tileset, variations are at x
				tileRow = lei.tile.tile(tile);
				tileInd = (tileRow * 31);

				//Now we need to figure out what variation we need. 
				//This should be read from the chunk data, unless it's out of bounds.

				if (rt(chunk, ctx, cty - 1) === tileRow) {
					tadd += 1;
				}

				if (rt(chunk, ctx, cty + 1) === tileRow) {
					tadd += 8;
				}

				if (rt(chunk, ctx - 1, cty) === tileRow) {
					tadd += 2;
				}

				if (rt(chunk, ctx + 1, cty) === tileRow) {
					tadd += 4;
				}

				if (tadd === 15) {
					if (rt(chunk, ctx - 1, cty - 1) === tileRow) {
						tadd += 1;
					}
					if (rt(chunk, ctx + 1, cty - 1) === tileRow) {
						tadd += 2;
					}
					if (rt(chunk, ctx - 1, cty + 1) === tileRow) {
						tadd += 4;
					}
					if (rt(chunk, ctx + 1, cty + 1) === tileRow) {
						tadd += 8;
					}
				}

				tileInd += tadd;

				chunk.data.data[ctx + cty * chunk.data.size] = tile;

				chunk.surface.blitImgTile(tileset, tileInd, ctx * _tilesize, cty * _tilesize, _tilesize, _tilesize);
				
			}

			_mapData[tx + ty * _mapSize.w] = tile;

			//Here we need to figure out what the correct chunk is, and
			//set it with relative positions..


			//tiSurface.bg('#FFF');
			//tiSurface.clear();
			//tiSurface.blitImgTile(tileset, lei.tile.tile(tile), tx * _tilesize, ty * _tilesize, _tilesize, _tilesize);
		},

		//Update surrounding tiles
		updateSurrounding: function (tx, ty) {
			lei.world.setTile(tx - 1, ty, _mapData[(tx - 1) + ty * _mapSize.w]  );
			lei.world.setTile(tx + 1, ty, _mapData[(tx + 1) + ty * _mapSize.w]  );
			lei.world.setTile(tx , ty - 1, _mapData[tx + (ty - 1) * _mapSize.w]  );
			lei.world.setTile(tx , ty + 1, _mapData[tx + (ty + 1) * _mapSize.w]  );

			lei.world.setTile(tx - 1, ty - 1, _mapData[(tx - 1) + (ty - 1) * _mapSize.w]  );
			lei.world.setTile(tx + 1, ty - 1, _mapData[(tx + 1) + (ty - 1) * _mapSize.w]  );
			lei.world.setTile(tx + 1, ty + 1, _mapData[(tx + 1) + (ty + 1) * _mapSize.w]  );
			lei.world.setTile(tx - 1, ty + 1, _mapData[(tx - 1) + (ty + 1) * _mapSize.w]  );

		},

		////////////////////////////////////////////////////////////////////////////
		// Clear
		clear: function () {
			//mainSurface.clear();
			_drawBuffers.forEach(function (buffer) {
				buffer.clear('black');
			});
		},	

		////////////////////////////////////////////////////////////////////////////
		// Attach to node
		attachTo: function (other) {
			mainSurface.attachTo(other);
		}


	}

})();
