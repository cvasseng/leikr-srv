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

	--------------------------------------------------------------
	| 0 | 0 | 0 | 0 | 0000 | 0000 0000 | 0000 0000 | 0000 | 0000 |
	|------------------------------------------------------------|
  | T | I | D | C |  HE  |    TILE   |     BG    |  TS  |  BS  |
  --------------------------------------------------------------

  D - Destructable (bool)
  C - Collision (bool)
  T - Trigger (bool)
  I - Item (bool)
  HE - Health
  TILE - Tile index
  BG - Background tile index
  TS - Main tileset
  BS - Background tileset 

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
	create: function (tileIndex, bgIndex, collision, health) {
	  var res = 0;
	  res = module.exports.setBackground(res, bgIndex);
	  res = module.exports.setTile(res, tileIndex);
	  res = module.exports.setHealth(res, health);
	  res = module.exports.setCollision(res, collision);
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
		return ((tile & 0x10000000) >> 28) === 1;
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
		if (solid === true || solid === 1) solid = 1; else solid = 0;
		solid = clamp(solid, 1);
		return (tile & 0xEFFFFFFF) | (solid << 28); 
	},

	//////////////////////////////////////////////////////////////////////////////

	//Get an object containing all the tile data
	getTileData: function(tile) {
		return {
			collision: module.exports.collision(tile),
			tile: module.exports.tile(tile),
			background: module.exports.background(tile),
			health: module.exports.health(tile)
		};	
	}

};
