lei.Animation = function (attr) {

	var _frameCursor = 0;
	var _currentFrame = 0;
	var _lastSwitchTime = 0;
	var _paused = false;
	
	this.properties = {
		startFrame: 0,
		fps: 8,
		loop: true,
		frames: []
	};

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
	
	//Update the animation
	this.update = function (time) {
		//Update the animation
		if (!_paused && time - _lastSwitchTime > (1000 / this.properties.fps)) {
			
			if (_frameCursor < this.properties.frames.length - 1 )	{
				_frameCursor++;
			} else if (this.properties.loop) {
				_frameCursor = 0;
			}

			_currentFrame = this.properties.frames[_frameCursor];

			_lastSwitchTime = time;
		}
	};

	//Pause the animation
	this.pause = function (f) {
		if (cb.isNull(f)) {
			_paused = true;
			return;	
		}
 		_paused = f;
	};

	//Return the frame
	this.frame = function () {
		return _currentFrame;
	};

};

////////////////////////////////////////////////////////////////////////////////

lei.Sprite = function (attr) {
	
	//Constructor
	this.properties = {
		flip: false,
		spriteSheet: 'img/sprite.png',
		width: 32, 
		height: 48,
		x: 0, 
		y: 0,
		id: 0,
		animations: {}
	};

	
	//Add animation
	this.addAnimation = function (name, attr, set) {
		if (lei.isString(name) && lei.isNull(this.animations[name])) {
			this.animations[name] = new lei.Animation(attr);
			this.properties.animations[name] = attr;
			if (set === true) {
				this.setActiveAnimation(this.animations[name]);
			}
			return this.animations[name];
		}
		return false;
	};

	//Update
	this.update = function (time) {
		//Update active animation
		if (this._activeAnimation !== null) {
			this._activeAnimation.update(time);
		}
		
		//If position, flip or animation frame has changed, tag for redraw
		this.cullbox.x = this.properties.x;
		this.cullbox.y = this.properties.y;
	};

	//Draw
	this.draw = function (surface) {

		if (this._activeAnimation !== null) {
			surface.blitImgTile(this._spriteSheet, 
													this._activeAnimation.frame(), 
													this.properties.x, 
													this.properties.y,  
													this.properties.width, 
													this.properties.height
												);
		} else {
			surface.blitImgTile(this._spriteSheet, 
													0, 
													this.properties.x, 
													this.properties.y,  
													this.properties.width, 
													this.properties.height
												);
		}

		if (this._drawBoundingBox) {
			//surface.context.strokeStyle = '#EEEE33';
			//surface.context.strokeRect(this.properties.x, this.properties.y, this.properties.width, this.properties.height);
		}
	};

	//Set active animation
	this.setActiveAnimation = function (animation) {
		if (lei.isString(animation)) {
			if (this.animations.hasOwnProperty(animation)) {
				return this.setActiveAnimation(this.animations[animation]);
			}
		} else {
			this._activeAnimation = animation;
			return true;
		}
		return false;
	};

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

		for (var p in this.properties.animations) {
			this.addAnimation(p, this.properties.animations);
		}
	};

	this.attr(attr);

	//this.id = 0;

	this.animations = {};
	this.cullbox = {};//new cb.gfx.Box(this.properties.x, this.properties.y, 0, 0);
	this.cullbox.width = this.properties.width;
	this.cullbox.height = this.properties.height;

	var sheet = new Image();
	sheet.src = this.properties.spriteSheet;

	//Private declarations
	this._activeAnimation = null;
	this._spriteSheet = sheet;
	this._mouseOver = false;
	this._drawBoundingBox = true;


	this.addAnimation('up', [12, 13, 14, 15]);
	this.addAnimation('down', [0, 1, 2, 3]);
	this.addAnimation('left', [4, 5, 6, 7]);
	this.addAnimation('right', [8, 9, 10, 11]);
	this.addAnimation('idle', [0]);

	this.setActiveAnimation('right');

};
