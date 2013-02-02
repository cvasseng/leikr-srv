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
	create: function (tileIndex, bgIndex, collision, health) {
	  var res = 0;
	  res = lei.tile.setBackground(res, bgIndex);
	  res = lei.tile.setTile(res, tileIndex);
	  res = lei.tile.setHealth(res, health);
	  res = lei.tile.setCollision(res, collision);
	  return res;
	},

	//////////////////////////////////////////////////////////////////////////////

	//Get the background for a tile
	background: function (tile) {
		return (tile & 0x0000FF00) >> 8;
	},

	//Get the tile index 
	tile: function (tile) {
		return (tile & 0x00FF0000) >> 16;
	},

		//Get the health of a tile
	health: function (tile) {
		return (tile & 0x0F000000) >> 24;
	},

	//Get the solid flag for a tile
	collision: function (tile) {
		return (tile & 0x10000000) >> 28;
	},

	//////////////////////////////////////////////////////////////////////////////

	//Set the background
	setBackground: function (tile, background) {
		background = clamp(background, 255);
		return (tile & 0xFFFF00FF) | (background << 8); 
	},

	//Set the tile index
	setTile: function (tile, index) {
		index = clamp(index, 255);
		return (tile & 0xFF00FFFF) | (index << 16); 
	},

	//Set the health
	setHealth: function (tile, health) {
		health = clamp(health, 15);
		return (tile & 0xF0FFFFFF) | (health << 24); 
	},

	//Set the solid flag
	setCollision: function (tile, solid) {
		solid = clamp(solid, 1);
		return (tile & 0xEFFFFFFF) | (solid << 28); 
	},

	//////////////////////////////////////////////////////////////////////////////

	//Get an object containing all the tile data
	getTileData: function(tile) {
		return {
			collision: lei.tile.collision(tile),
			tile: lei.tile.tile(tile),
			background: lei.tile.background(tile),
			health: lei.tile.health(tile)
		};	
	}
}
})();
