/*******************************************************************************

	Part of the Leikr project.

	Authored by Christer M. Vasseng, 2013. cvasseng@gmail.com

/******************************************************************************/


/*******************************************************************************

	The tilesystem is based on a bit packing system, which allows all the tile
	data to be tightly packed in a 32-bit integer. This is cool because
	it allows us to use very large maps without using a lot of memory.
	It's also highly efficient since layers aren't needed.


	Tiles are encoded as such:


	         10     1     4      5         8       4    
	 |------------|---|------|-------|----------|------|
	 | 0000000000 | 0 | 0000 | 00000 | 00000000 | 0000 |
	 |------------|---|------|-------|----------|------|
	 |            | S |   TP |   BI  |    TI    |  H   |
	 ---------------------------------------------------

		H = Health [0..15]		
		S = Solid [0 || 1]
		TI = tile index [0..255]
		BI = background index [0..31]
		TP = type [0..31]

		The 10 first bits are reserved for future use.

/******************************************************************************/

//Clamp a number in [0..max] range
function clamp (num, max) {
	if (num < 0) return 0;
	if (num > max) return max;
	return num;
}

//Export functions relating to tiles
module.exports = {
	
	//Create a new tile
	create: function (tileIndex, bgIndex, tp, solid, health) {
	  var res = 0;
	  res = module.exports.setType(res, tp);
	  res = module.exports.setBackground(res, bgIndex);
	  res = module.exports.setTile(res, tileIndex);
	  res = module.exports.setHealth(res, health);
	  res = module.exports.setSolid(res, solid);
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
			solid: module.exports.solid(tile),
			tile: module.exports.tile(tile),
			background: module.exports.background(tile),
			type: module.exports.type(tile),
			health: module.exports.health(tile)
		};	
	}

};
