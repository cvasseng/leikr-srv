lei.tile = (function () {

	//Clamp a number in [0..max] range
	function clamp (num, max) {
		if (num < 0) return 0;
		if (num > max) return max;
		return num;
	}

	//Export functions relating to tiles
	return {
		
		//Create a new tile
		create: function (tileIndex, bgIndex, tp, solid, health) {
		  var res = 0;
		  res = lei.tile.setType(res, tp);
		  res = lei.tile.setBackground(res, bgIndex);
		  res = lei.tile.setTile(res, tileIndex);
		  res = lei.tile.setHealth(res, health);
		  res = lei.tile.setSolid(res, solid);
		  return res;
		},

		//////////////////////////////////////////////////////////////////////////////

		//Get the health of a tile
		health: function (tile) {
			return (tile & 0x0000000F);
		},

		//Get the type of a block
		type: function (tile) {
			return (tile & 0x001E0000) >> 17;
		},

		//Get the background for a tile
		background: function (tile) {
			return (tile & 0x0001F000) >> 12;
		},

		//Get the foreground of a tile
		foreground: function (tile) {
			return false;
		},

		//Get the tile index 
		tile: function (tile) {
			return (tile & 0x00000FF0) >> 4;
		},

		//Get the solid flag for a tile
		solid: function (tile) {
			return (tile & 0x00200000) >> 21;
		},

		//////////////////////////////////////////////////////////////////////////////

		//Set the health
		setHealth: function (tile, health) {
			health = clamp(health, 15);
			return (tile & 0xFFFFFFF0) | (health); 
		},

		//Set the type
		setType: function (tile, tp) {
			tp = clamp(tp, 31);
			return (tile & 0xFFE1FFFF) | (tp << 17); 
		},

		//Set the background
		setBackground: function (tile, background) {
			background = clamp(background, 31);
			return (tile & 0xFFFE0FFF) | (background << 12); 
		},

		//Set the tile index
		setTile: function (tile, index) {
			index = clamp(index, 255);
			return (tile & 0xFFFFF00F) | (index << 4); 
		},

		//Set the solid flag
		setSolid: function (tile, solid) {
			solid = clamp(solid, 1);
			return (tile & 0xFFDFFFFF) | (solid << 21); 
		},

		//////////////////////////////////////////////////////////////////////////////

		//Get an object containing all the tile data
		getTileData: function(tile) {
			return {
				solid: lei.tile.solid(tile),
				tile: lei.tile.tile(tile),
				background: lei.tile.background(tile),
				type: lei.tile.type(tile),
				health: lei.tile.health(tile)
			};	
		}
	};
})();
