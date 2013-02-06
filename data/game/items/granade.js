
//Called when using the item
function use(user) {

	//Fire grenade from the users position
	user.fireProjectile(140, 120, this.properties.tileset, function (tp, a, b, c) {
		if (tp === 'wall') {
			//If we hit a wall, blow it away!
			user.mineTile(a, b, 3);
    } else if (tp === 'actor') {
     	//We hit another actor 
      
    }
	});
  return true;
}

//Called when picked up
function get(getter) {
  
}

//Called when dropped
function drop(dropper) {
  
}











