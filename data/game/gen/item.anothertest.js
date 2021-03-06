//Generated file!
var world = require('./../../../lib/lei.world'),
		_tile = require('./../../../lib/lei.tile');

////////////////////////////////////////////////////////////////////////////////
// Called when using the item
function use(actor) {
	return true;
}

////////////////////////////////////////////////////////////////////////////////
// Called when getting the item
function get(actor) {
	return true;
}

////////////////////////////////////////////////////////////////////////////////
// Called when the item is dropped
function dropped() {
	return true;
}

////////////////////////////////////////////////////////////////////////////////
// Called when the item has decayed (i.e. used up and discarded)
function decayed() {
	return true;
}

////////////////////////////////////////////////////////////////////////////////
// Called when the item is equipped
function equipped(actor) {
	return true;
}

////////////////////////////////////////////////////////////////////////////////
// Called when the item is unequipped
function unequipped(actor) {
	return true;
}

module.exports = {
	use: typeof use === 'function' ? use : function() {return true;}
};
