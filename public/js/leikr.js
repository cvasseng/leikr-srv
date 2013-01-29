
var lei = {
	
	//Is n a number? Returns true/false
	isNumber: function (n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	},
	//Is null?
	isNull: function (what) {
		return (typeof what === 'undefined' || what == null);
	},
	//Is string?
	isString: function (v) {
		return (typeof v === 'string' || v instanceof String);
	},
	//Is array?
	isArray: function (obj) {
   if (!lei.isNull(obj) && obj.constructor.toString().indexOf("Array") == -1)
      return false;
   else
      return true;
	}

};
