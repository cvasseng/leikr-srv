lei.Animation = function (attr) {


	//////////////////////////////////////////////////////////////////////////////

	var _frameCursor = 0;
	var _currentFrame = 0;
	var _lastSwitchTime = 0;
	var _paused = false;
	var _finished = false;

	//////////////////////////////////////////////////////////////////////////////
	
	//Animation properties
	this.properties = {
		startFrame: 0,
		fps: 8,
		loop: true,
		frames: [],
		forceFinish: false
	};

	//////////////////////////////////////////////////////////////////////////////
	//Update the animation
	this.update = function (time) {
		//Update the animation
		if (!_paused && time - _lastSwitchTime > (1000 / this.properties.fps)) {
			
			if (_frameCursor < this.properties.frames.length - 1 )	{
				_frameCursor++;
				_finished = false;
			} else if (this.properties.loop) {
				_frameCursor = 0;
			} else {
				_finished = true;
			}

			_currentFrame = this.properties.frames[_frameCursor];

			_lastSwitchTime = time;
		}
	};

	//////////////////////////////////////////////////////////////////////////////
	//Reset the animation
	this.reset = function () {
		_finished = false;
		_currentFrame = this.properties.frames[0];
		_frameCursor = 0;
		_paused = false;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Go to frame
	this.gotoFrame = function (f) {
		if (lei.isString(f)) {
			if (f === 'first') {
				_currentFrame = this.properties.frames[0];
			}
			if (f === 'last') {
				_currentFrame = this.properties.frames[this.properties.frames.length - 1];
			}
			return;
		}
		_currentFrame = f % this.properties.frames.length;
	};

	//////////////////////////////////////////////////////////////////////////////
	//Pause the animation
	this.pause = function (f) {
		if (lei.isNull(f)) {
			_paused = true;
			return;	
		}
 		_paused = f;
	};

	this.finished = function () {
		if (this.properties.loop) {
			return false;
		}
		return _finished;
	};

	//////////////////////////////////////////////////////////////////////////////
	//Return the frame
	this.frame = function () {
		return _currentFrame;
	};

	//////////////////////////////////////////////////////////////////////////////
	//Apply properties
	if (typeof attr !== 'undefined') {
		for (var p in this.properties) {
			if (typeof attr[p] !== 'undefined') {
				this.properties[p] = attr[p];
			}
		}
	}

	if (lei.isArray(attr)) {
		this.properties.frames = attr;
	}

	_currentFrame = this.properties.startFrame;

};

////////////////////////////////////////////////////////////////////////////////

lei.Sprite = function (attr) {
	
	//Sprite sheet
	var _spriteSheet = new Image();
	//Active animation
	var _activeAnimation = null;
	//Draw bounding box?
	var _drawBoundingBox = false;
	//The animation that was active before the currently active one
	var _lastAnimation;
	//The direction of the sprite
	var _direction = 'left';
	//Private declarations
	this._mouseOver = false;

	//////////////////////////////////////////////////////////////////////////////

	//ID
	this.id = -1;
	//Move speed 
	this.moveSpeed = 90;
	//Flip?
	this.flip = false;
	//Name
	this.name = 'No name';
	//Check collisions?
	this.collisionCheck = true;
	//SHow name?
	this.showName = true;
	//Is the sprie alive?
	this.dead = false;
	//Animations
	this.animations = {};

	//Sprite velocity
	this.velocity = {
		x: 0,
		y: 0
	};

	//Sprite position
	this.pos = {
		x: 0,
		y: 0
	};

	//Sprite size
	this.size = {
		w: 32,
		h: 32
	};

	//The cullbox
	this.cullbox = {
		x: 0,
		y: 0,
		w: this.size.w,
		h: this.size.h
	};

	//The bounding box
	this.bbox = {
		offsetX: 10,
		offsetY: 5,
		w: 12,
		h: 20
	};

	//////////////////////////////////////////////////////////////////////////////
	//Apply velocity
	this.applyVelocity = function (x, y) {
		this.velocity.x = x;
		this.velocity.y = y;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Move the sprite
	this.move = function (x, y) {
		this.pos.x = x;
		this.pos.y = y;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Resize the sprite
	this.resize = function (w, h) {
		this.size.w = w;
		this.size.h = h;
	};
	
	//////////////////////////////////////////////////////////////////////////////
	// Add animation
	this.addAnimation = function (name, attr, set) {
		if (lei.isString(name) && lei.isNull(this.animations[name])) {
			this.animations[name] = new lei.Animation(attr);
			if (set === true) {
				this.setActiveAnimation(this.animations[name]);
			}
			return this.animations[name];
		}
		return false;
	};

	//////////////////////////////////////////////////////////////////////////////
	//Flush animations
	this.flushAnimations = function () {
		this.animations = {};
		_activeAnimation = null;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Update
	this.update = function (time, deltaTime) {

		function c2tile (c) {
			return Math.floor(c / lei.world.tilesize());
		}

		if (_activeAnimation !== null) {
			_activeAnimation.update(time);
		}

		if (!this.dead) {

			var newPos = {
				x: this.pos.x + (this.velocity.x * this.moveSpeed) * deltaTime,
				y: this.pos.y + (this.velocity.y * this.moveSpeed) * deltaTime
			};

			this.bbox.x = newPos.x + this.bbox.offsetX;
			this.bbox.y = newPos.y + this.bbox.offsetY;

			if (!lei.world.bboxCollides(this.bbox) || !this.collisionCheck) {
				this.pos.x = newPos.x;
				this.pos.y = newPos.y;
			} else {
				this.velocity.x = 0;
				this.velocity.y = 0;
			}

			if (_activeAnimation !== null ) {

				if (_activeAnimation.properties.forceFinish && !_activeAnimation.finished()) {

				}  else if (_activeAnimation.properties.forceFinish && _activeAnimation.finished()) {
					this.setActiveAnimation(_direction);
				} else {
					if (this.velocity.x > 0) {
						this.setActiveAnimation('right');
						_direction = 'right';
					} else if (this.velocity.x < 0) {
						this.setActiveAnimation('left');
						_direction = 'left';
					} else if (this.velocity.y > 0) {
						_direction = 'down';
						this.setActiveAnimation('down');
					} else if (this.velocity.y < 0) {
						this.setActiveAnimation('up');
						_direction = 'up';
					} else {
						_activeAnimation.gotoFrame('first');
						_activeAnimation.pause();
					}
				}

			}

			//If position, flip or animation frame has changed, tag for redraw
			this.cullbox.x = this.pos.x;
			this.cullbox.y = this.pos.y;
		}
	};

	//////////////////////////////////////////////////////////////////////////////
	// Draw
	this.draw = function (surface, scroll, zoom) {
		var frame = _activeAnimation.frame() === null ? 0 : _activeAnimation.frame();

		if (typeof scroll === 'undefined') {
			scroll = {
				x: 0,
				y: 0
			}
		}

		surface.blitImgTile(_spriteSheet, 
												frame, 
												(this.pos.x * zoom) - scroll.x, 
												(this.pos.y * zoom) - scroll.y,  
												this.size.w, 
												this.size.h,
												this.size.w * zoom,
												this.size.h * zoom
											);

		if (this.showName && !this.dead) {
			surface.blitText({
												x:( (this.pos.x  + (this.size.w / 2)) * zoom) - scroll.x, 
												y:(this.pos.y * zoom) - scroll.y, 
												str: this.name, 
												align:'center'
											});
		}
	
		if (_drawBoundingBox) {
			surface.context.strokeStyle = '#EEEE33';
			
			surface.context.strokeRect(this.pos.x + this.bbox.offsetX, this.pos.y + this.bbox.offsetY, this.bbox.w, this.bbox.h);
		}
	};

	//////////////////////////////////////////////////////////////////////////////
	// Set active animation
	this.setActiveAnimation = function (animation) {
		_lastAnimation = _activeAnimation;
		if (lei.isString(animation)) {
			if (this.animations.hasOwnProperty(animation)) {
				this.animations[animation].pause(false);
				return this.setActiveAnimation(this.animations[animation]);
			}
		} else {
			_activeAnimation = animation;
			animation.pause(false);
			return true;
		}
		return false;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Get the active animation
	this.getActiveAnimation = function () {
		return typeof _activeAnimation !== 'undefined' ? _activeAnimation : false;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Set the current sprite sheet
	this.loadSheet = function (url) {
		//var _spriteSheet = new Image();
		console.log('Loading sprite sheet ' + url);
		_spriteSheet.src = url;
	};

	//////////////////////////////////////////////////////////////////////////////
	//Set attrs
	this.attr = function (attr) {
		//Apply properties
		if (typeof attr !== 'undefined') {
			for (var p in this.properties) {
				if (typeof attr[p] !== 'undefined') {
					this.properties[p] = attr[p];
				}
			}
		}

		for (var p in this.animations) {
			this.addAnimation(p, this.animations);
		}
	};

	this.attr(attr);

	this.loadSheet('img/player_tileset.png');

	this.addAnimation('up', [6, 7, 8, 7]);
	this.addAnimation('down', [0, 1, 2, 1]);
	this.addAnimation('left', {flip:true, frames:[11, 12, 13, 12]});
	this.addAnimation('right', [3, 4, 5, 4]);
	this.addAnimation('idle', [0]);
	this.addAnimation('hit', {frames:[9, 50, 51], forceFinish: true, loop:false});
	this.addAnimation('die', {frames:[48, 49, 50, 51, 52, 53, 54], forceFinish: true, loop:false});

	this.setActiveAnimation('right');

};
