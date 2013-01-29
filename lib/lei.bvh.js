

//Intersection test
function volumeInVolume (a, b) {
	return (a.x1 >= b.x1 && a.x2 <= b.x2 && a.y1 >= b.y1 && a.y2 <= b.y2);
}

//Our BVH tree object
var BVHNode = function () {

	//The bounding volume of this object
	this.volume = {
		x1: 0,
		y1: 0,
		x2: 200,
		y2: 200
	};

	//The children - this is other BVH nodes
	this.children = [];
	//The payload - this is the actual data associated with the volume. Only leafs have payloads.
	this.payload = 0;

	//////////////////////////////////////////////////////////////////////////////
	// Find hits
	this.query = function (volume, hits) {
		if (volumeInVolume(volume, this.volume)) {

			if (this.children.length === 0 && this.payload !== 0) {
				hits.push(this.payload);
			} else {
				this.children.forEach(function (child) {
					child.query(volume, hits);
				});
			}

			return true;
		}
		return false;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Insert object
	this.insert = function (volume, data) {
		if (volumeInVolume(volume, this.volume)) {
			if (this.children.length === 0 && this.payload !== 0) {

			}

		} else {
			//The object is outside of this volume, return false
			return false;
		}
		return true;
	};

	//////////////////////////////////////////////////////////////////////////////
	// Calculate the master bounding box
	/*
		This goes through all the children and updates the bounding volume 
		accordingly.
	*/
	this.calculateBoundingBox = function () {

	};

};


module.exports = {
	//Create a new Bounding Volume Hierarchy
	create: function (rootVolume) {
		return new BVHNode();
	}
};
