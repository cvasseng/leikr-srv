//Called when using the item
function use (user) {
  //Fire a projectile
  user.fireProjectile(240, 120, function (tp, a, b, c) {
    if (tp === 'actor') {
      console.log('Adjusting health of ' + a.id);
     a.decStat('health', 5); 
    }
  });
}