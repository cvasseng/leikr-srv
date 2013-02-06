/*******************************************************************************

	Part of the Leikr project.

	Authored by Christer M. Vasseng, 2013. cvasseng@gmail.com

/******************************************************************************/

var Controller = function (actor) {
	//Time of last action
	var _lastActionTime = 0;

	//////////////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////////////
	//Update the controller
	this.update = function (time, delta) {
		//Roam 
		//actor.applyVelocity(1, 0);
		//console.log(actor.pos);
		this.doRoam(time);
	},

	//////////////////////////////////////////////////////////////////////////////
	// Roam mode
	this.doRoam = function (time) {

		if (time - _lastActionTime > 3000 + ( Math.floor(Math.random() * 2000 ))  ) {

			var dirX = Math.floor(Math.random() * 3) - 1;
			var dirY = Math.floor(Math.random() * 3) - 1;
			actor.applyVelocity(dirX, dirY);
			_lastActionTime = time;

		}
	};


	//////////////////////////////////////////////////////////////////////////////

	actor.movementSpeed = 60;
	actor.name = 'AI';

	actor.on('colliding', function () {
		_lastActionTime = 0;
	});

};

module.exports = {
	create: function (actor) {
		actor.attachController(new Controller(actor));
	}
};
