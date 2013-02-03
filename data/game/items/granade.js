
//Called when using the item
function use(user) {

	//Fire grenade from the users position
	user.fireProjectile(140, 120, function (tp, a, b, c) {
    console.log(tp);
		if (tp === 'wall') {
			//If we hit a wall, blow it away!
			world.setTile(a, b, _tile.create(0, 0, 0, 0));
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











