//Generated file!

		_tile = require('./../../../lib/lei.tile');


function use (user) {
  //Fire a projectile
  user.fireProjectile(240, 120, this.properties.tileset, function (tp, a, b, c) {
    if (tp === 'actor') {
      console.log('Adjusting health of ' + a.id);
     a.decStat('health', 5); 
    }
  });
}
module.exports = {
	use: typeof use === 'function' ? use : function() {return true;}
};