//Generated file!

		_tile = require('./../../../lib/lei.tile');



//Called when using the item
function use (user) {
	return true
}

module.exports = {
	use: typeof use === 'function' ? use : function() {return true;}
};