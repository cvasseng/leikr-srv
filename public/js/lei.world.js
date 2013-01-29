lei.world = (function () {
	
	//Map data
	var _mapData = [];
	//_tilesize
	var _tilesize = 16;
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
	var _chunks = [];

	//Our background canvas
	var bgSurface = new lei.Surface(true);
	//Our foregraound surface
	var fgSurface = new lei.Surface(true);
	//Our main tile surface
	var tiSurface = new lei.Surface(true);
	//Our sprite layer
	var spSurface = new lei.Surface(true);
	//Main layer
	var mainSurface = new lei.Surface();
	//Text layer
	var txSurface = new lei.Surface(true);

	tiSurface.resize(5000, 5000);
	spSurface.resize(5000, 5000);
	//spSurface.resize(_mapSize.w * _tilesize, _mapSize.h * _tilesize);
	
	//The tilesets
	var tileset = new Image();
	tileset.src = 'img/tiles.png';

	//The player
	var _player = new lei.Sprite({});
	_sprites.push(_player);

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
	function processChunk (chunk) {
		var x, y, data, linesPerUpdate = 2;

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

		return chunk.currentY === chunk.ty + chunk.size;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Update
	function update () {
		var timeMs = (new Date()).getTime(), tx,ty, tile;
	//	mainSurface.clear();

		//Process chunks
		if (_chunks.length > 0) {
			if (processChunk(_chunks[0])) {
				_chunks.splice(0, 1);
				console.log('Chunk processed');
			}
		}

		spSurface.clear();

		//Update the sprites
		_sprites.forEach(function (sprite) {
			tx = Math.floor(sprite.properties.x / _tilesize);
			ty = Math.floor( (sprite.properties.y + sprite.properties.height) / _tilesize);

			tile = _mapData[tx, (ty + 1) * _mapSize.w];

			if (typeof tile !== 'undefined') {
				if (lei.tile.tile(tile) !== 3) {
				//	sprite.properties.y += 2;
				}
			}

			sprite.update(timeMs);
			sprite.draw(spSurface);
		});

		//Center the "camera" on the player
		var x = _player.properties.x - (mainSurface.width() / 2),
				y = _player.properties.y - (mainSurface.height() / 2);

		if (x < 0) x = 0;
		if (y < 0) y = 0;

		//console.log(x + ',' + y );

		//Combine the two surfaces
		mainSurface.blitImgSlice(tiSurface.canvas, x, y, mainSurface.width(), mainSurface.height(), 0, 0, mainSurface.width(), mainSurface.height());
		//mainSurface.blitImgSlice(tileset, 0, 0, 50, 50, 0, 0, 50, 50);
		mainSurface.blitImgSlice(spSurface.canvas, x, y, mainSurface.width(), mainSurface.height(), 0, 0, mainSurface.width(), mainSurface.height());
		//mainSurface.blitImg(spSurface.canvas, 0, 0, mainSurface.width(), mainSurface.height());

		webkitRequestAnimationFrame(update);
	}

	////////////////////////////////////////////////////////////////////////////



	//Return public stuff.
	return {

		//Flush
		flush: function () {
			_sprites.splice(0, _sprites.length - 1);
			_sprites.push(_player);
		},

		////////////////////////////////////////////////////////////////////////////
		// Set the player data
		setPlayerData: function (data) {
			_player.attr({
				id: data.id,
				x: data.pos.x,
				y: data.pos.y
			});
		},

		////////////////////////////////////////////////////////////////////////////
		//Update actor
		updateActor: function (data) {
			_sprites.forEach(function (actor) {
				if (actor.properties.id === data.id) {
					actor.properties.x = data.pos.x;
					actor.properties.y = data.pos.y;
					return;
				}
			});
		},

		////////////////////////////////////////////////////////////////////////////
		// Spawn
		spawn: function (data) {
			var sprite = new lei.Sprite({
				x: data.pos.x,
				y: data.pos.y,
				id: data.id
			});

			_sprites.push(sprite);
		},

		////////////////////////////////////////////////////////////////////////////
		// Despawn
		despawn: function (id) {
			_sprites = _sprites.filter(function (sprite) {
				return (id !== sprite.properties.id);
			});
		},

		////////////////////////////////////////////////////////////////////////////
		// Init
		init: function (target) {
			if (typeof target !== 'undefined') {
				if (typeof target.appendChild === 'function') {
					mainSurface.appendTo(target);
				}
			}

			mainSurface.resize(800, 600);
			tiSurface.clear('#333');

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
			_chunks.push(chunk);
		},

		////////////////////////////////////////////////////////////////////////////
		// Set tile
		setTile: function (tx, ty, tile) {
			_mapData[tx + ty * _mapSize.w] = tile;

			tiSurface.bg('#FFF');
			//tiSurface.clear();
			tiSurface.blitImgTile(tileset, lei.tile.tile(tile), tx * _tilesize, ty * _tilesize, _tilesize, _tilesize);
		},

		////////////////////////////////////////////////////////////////////////////
		// Clear
		clear: function () {
			//mainSurface.clear();
		},	

		////////////////////////////////////////////////////////////////////////////
		// Attach to node
		attachTo: function (other) {
			mainSurface.attachTo(other);
		}


	}

})();
