//Generated file!
var world = require('./../../../lib/lei.world'),
		_tile = require('./../../../lib/lei.tile');

//Called when using the item
function use (user) {
  //Fire a projectile
  user.fireProjectile(140, 120, function (tp, a, b, c) {
    
  });
}
module.exports = {
	use: typeof use === 'function' ? use : false
};
