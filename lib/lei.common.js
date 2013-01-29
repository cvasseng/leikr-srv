
var colors = require('colors'),
		fs = require('fs'),
		ProgressBar = require('progress'),
		currentBar = 0,
		currentBarMessage = '';

//Module exports
module.exports = {

	//Clamp a number in [0..max] range
	clamp: function (num, max) {
		if (num < 0) return 0;
		if (num > max) return max;
		return num;
	},

	//Output a number as a binary string
	dec2Bin: function (dec)
	{

		var addSpaces = function(str) {
			var resstr = '';

			str = '0' + str;
		  for (var i = 0; i < str.length; i++) {
		  	if (i % 4 == 0) {
		  		resstr += ' ';
		  	}
		  	resstr += str[i];
		  }

		  return resstr;
		};

	  if(dec > 0) {
	      return (dec.toString(2));
	  }
	  else {
	      //make the number positive
	      dec = Math.abs(dec);
	      //get the first compliment
	      var res = dec ^ parseInt((new Array(dec.toString(2).length+1)).join("1"),2);
	      //get the second complimet
	      var str = (res+1).toString(2);
	      return addSpaces(str);
	  }
	},

	//Output a file
	printFile: function (fileName) {
		console.log(fs.readFileSync('./res/' + fileName, 'ascii').bold);
	},

	//Parse JSON, includes exception handling
	parseJSON: function (json, msg) {
		var obj = false, ex = undefined;
		try {
			obj = JSON.parse(json);
		} catch (e) {
			ex = e;
		}

		module.exports.log(typeof msg === 'undefined' ? 'Parsing JSON' : msg, obj !== false, ex);

		return obj;
	},

	//Override object
	override: function (target, source) {
		if (typeof source == 'undefined' || typeof target == 'undefined') {
			return false;
		}
		for (var prop_name in target) {
			if (target.hasOwnProperty(prop_name)) {
				if (typeof source[prop_name] !== 'undefined') {
					target[prop_name] = source[prop_name];
				}
			}
		}
		return target;
	},

	//Get active configuration
	getConfig: function (configFile, callback) {
		//This will load the defaults configuration and overwrite its
		//attributes with those of the requested one.

		//Make sure the callback is callable
		if (typeof callback !== 'function') {
			callback = function (succ) {};
		}

		fs.readFile('./conf/defaults.json', 'ascii', function (err, defaultData) {
			module.exports.log('Loading configuration defaults', !err);
			if (!err) {
				//Ok, now attempt to load the real config file
				defaultData = module.exports.parseJSON(defaultData, 'Parsing default data');
				if (defaultData) {
					fs.readFile('./conf/' + configFile, 'ascii', function (err, confData) {
						module.exports.log('Loading configuration', !err);
						if (!err) {
							confData = module.exports.parseJSON(confData, 'Parsing config data');
							if (confData) {
								//We're good to go.
								callback(module.exports.override(defaultData, confData));
							}
						} else {
							callback(false);
						}
					});
				}
			} else {
				callback(false);
			}
		});
	},

	//Pad a string
	pad: function (str, chars, c) {

		c = typeof c === 'undefined' ? ' ' : c;
		
		if (str.length < chars) {
			for (i = str.length; i < chars; i++) {
				str += c;
			}

			//str = str + ([].splice(0, 0, chars - str.length).join());

		}
		return str;
	},

	//Progress log
	progressLog: function (msg, max) {
		max = max;
		if (currentBarMessage !== msg) {
			currentBar = new ProgressBar(  module.exports.pad(msg, 74, '.') + '[:percent]', {
				total:max,
				complete: '.',
				incomplete: ' '

			});
			//currentBar.complete = '.';
			currentBarMessage = msg;
		}
		currentBar.tick();
		if (currentBar.complete) {
			console.log('');
			//console.log('[ ' + 'OK'.green + ' ]'.black);
		}

	},

	//Success/Failure log
	log: function (msg, ok, extendedMsg) {
		
		if (ok === true) {
			msg = module.exports.pad(msg, 74, '.');
			console.log(msg + '['.black + ' OK '.green + ']'.black);
		} else if (ok === false) {
			msg = module.exports.pad(msg, 74, '.');
			console.log(msg + '['.black + 'FAIL'.red + ']'.black);
		} else {
			console.log(msg);
		}

		if (typeof extendedMsg !== 'undefined') {
			extendedMsg = '  -> ' + extendedMsg;
			extendedMsg = (extendedMsg + '').replace('\n', '\n  -> ');
			console.log(extendedMsg);
		}
	}

};
