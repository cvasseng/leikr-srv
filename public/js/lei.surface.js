
lei.Surface = function (offscreen) {

	//Our canvas
	var canvas = document.createElement('canvas');
	//Context
	var context = canvas.getContext("2d");

	//The size of the canvas
	var size = {
		w: 2000,
		h: 2000
	}

	////////////////////////////////////////////////////////////////////////////
	//Resize the canvas
	this.resize = function (width, height) {
		canvas.width = width;
		canvas.height = height;
		if (typeof canvas.parentNode !== 'undefined') {
			//canvas.parentNode.style.width = width + 'px';
			//canvas.parentNode.style.height = height + 'px';
		}
		size.w = width;
		size.h = height;
	};

	this.width = function () {
		return size.w;
	};

	this.height = function () {
		return size.h;
	};

	//this.canvas = function () {
	//	return canvas;
	//};
	this.canvas = canvas;

	////////////////////////////////////////////////////////////////////////////
	//Attach to a DOM node
	this.appendTo = function (other) {
		if (typeof other !== 'undefined' && typeof other.appendChild === 'function') {
			other.appendChild(canvas);
		}
	};

	////////////////////////////////////////////////////////////////////////////
	//Clear the canvas
	this.clear = function (col) {
		if (typeof col !== 'undefined') {
			context.fillStyle = col;
			context.fillRect(0, 0, canvas.width, canvas.height);
		} else {
			context.clearRect(0, 0, canvas.width, canvas.height);
		}
	};


	////////////////////////////////////////////////////////////////////////////
	//Blit an image to the surface
	this.blitImg = function (img, x, y, width, height) {
		context.drawImage(img, x, y, width, height);
	};

	////////////////////////////////////////////////////////////////////////////
	//Blit an image to the the surface
	this.blitImgSlice = function (img, sx, sy, sw, sh, tx, ty, tw, th) {
		context.drawImage(  
					img, 
					sx, sy, sw, sh, 
					tx, ty, tw, th
				);
	};

	////////////////////////////////////////////////////////////////////////////
	//Blit a sub-image to the surface
	this.blitImgTile = function (img, index, x, y, tileSizeX, tileSizeY) {

		if (typeof tileSizeY === 'undefined') {
			tileSizeY = tileSizeX;
		}

		if (img instanceof Image) {
			var tw = Math.floor(img.width / tileSizeX);
			var sy = Math.floor(index / tw);
			var sx = index - (sy * tw);
			
			sx = sx * tileSizeX;
			sy = sy * tileSizeY;
			
			if (sy < img.height && sx < img.width && sx >= 0 && sy >= 0) {
				context.drawImage(  
					img, 
					sx, sy, tileSizeX, tileSizeY, 
					x, y, tileSizeX, tileSizeY
				);
			}
		}
	};

	////////////////////////////////////////////////////////////////////////////
	//Blit text to the surface
	this.blitText = function (properties) {
		var def = {
			font: '10pt Calibri',
			x: 10,
			y: 10,
			str: properties.str,
			color: 'red'
		};

		context.font = def.font;
		context.fillStyle = def.color;
		context.fillText(def.str, def.x, def.y);
	};

	//Set background
	this.bg = function (col) {
		context.fillStyle = col;
	};

	////////////////////////////////////////////////////////////////////////////
	// Blit a rectangle
	this.blitRect = function (x, y, width, height) {
		//context.fillStyle = '#FFF';
		context.fillRect(x, y, width, height);
	};

	if (offscreen === true) {
		document.body.appendChild(canvas);
		canvas.style.display = 'none';
	}

};
