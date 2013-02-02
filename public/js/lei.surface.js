
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

	this.context = context;

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
			context = canvas.getContext("2d");
			this.context = context;
			canvas.style['image-rendering'] = '-webkit-optimize-contrast'
			context.font = "15px Arial";
			context.webkitImageSmoothingEnabled = false;
			context.imageSmoothingEnabled = false;
		}
	};

	////////////////////////////////////////////////////////////////////////////
	//Clear the canvas
	this.clear = function (col) {
		if (typeof col !== 'undefined') {
			context.fillStyle = typeof col === 'undefined' ? 'black' : col;
			context.fillRect(0, 0, canvas.width, canvas.height);
		} else {
			context.clearRect(0, 0, canvas.width, canvas.height);
		}
		context.font = "15px 'Roboto Condensed'";
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
	this.blitImgTile = function (img, index, x, y, tileSizeX, tileSizeY, tWidth, tHeight) {

		if (typeof tileSizeY === 'undefined') {
			tileSizeY = tileSizeX;
		}

		if (typeof tWidth === 'undefined') tWidth = tileSizeX;
		if (typeof tHeight === 'undefined') tHeight = tileSizeY;

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
					x, y, tWidth, tHeight
				);
			}
		}
	};

	////////////////////////////////////////////////////////////////////////////
	//Blit text to the surface
	this.blitText = function (properties) {
		var def = {
			font: '12pt Calibri',
			x: typeof properties.x !== 'undefined' ? properties.x : 10,
			y: typeof properties.y !== 'undefined' ? properties.y : 10,
			str: properties.str,
			align: typeof properties.align !== 'undefined' ? properties.align : 'left',
			color: '#CCC'
		};

	//	context.font = def.font;
		//context.font = "15px 'Roboto Condensed'";
		context.textAlign = properties.align;
		context.fillStyle = def.color;
		context.strokeStyle = '#222';
		context.lineWidth = '2';

		context.strokeText(def.str, def.x, def.y);
		context.fillText(def.str, def.x, def.y);

		context.lineWidth = '1';
		
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
