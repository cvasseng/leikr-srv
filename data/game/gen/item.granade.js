//Generated file!
var world = require('./../../../lib/lei.world'),
		_tile = require('./../../../lib/lei.tile');


//Called when using the item
function use(user) {

	//Fire grenade from the users position
	user.fireProjectile(140, 120, this.properties.tileset, function (tp, a, b, c) {
		if (tp === 'wall') {
			//If we hit a wall, blow it away!
			user.setTile(a, b, _tile.create(0, 0, 0, 0));
    } else if (tp === 'actor') {
     	//We hit another actor 
      
    }
	});
}

//Called when picked up
function get(getter) {
  
}

//Called when dropped
function drop(dropper) {
  
}












module.exports = {
	use: typeof use === 'function' ? use : function() {return true;}
};
