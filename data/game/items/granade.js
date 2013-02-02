
//Called when using the item
function use(user) {

	//Fire granade from the users position
	user.fireProjectile(140, 120, function (tp, a, b, c) {
		console.log(tp);
		if (tp === 'wall') {
			//If we hit a wall, blow it away
			console.log(a + ',' + b);
			world.setTile(a, b, _tile.create(0, 0, 0, 0));
		}
	});
}
