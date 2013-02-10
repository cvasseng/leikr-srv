var fs = require('fs');

function pureName (f) {
	return f.substr(0, f.lastIndexOf('.'));
}

////////////////////////////////////////////////////////////////////////////////
//Create a path for listing all the things
function list(app, path, restPath) {
	app.get(restPath, function (req, res) {
		fs.readdir(path, function (err, files) {
			
			if (!err) {

				var r = [];

				files.forEach(function (file) {
					if (file.indexOf('.json') > 0) {
						var properties = JSON.parse(fs.readFileSync(path + file, 'utf-8'));
						r.push({
							name: typeof properties.name === 'undefined' ? file.substr(0, file.lastIndexOf('.')) : properties.name,
							title: typeof properties.title === 'undefined' ? file.substr(0, file.lastIndexOf('.')) : properties.title,
							icon: properties.icon
						});
					}
				});

				res.send(r);

			} else {
				res.send({error:true});
			}
		});
	});
}

////////////////////////////////////////////////////////////////////////////////
//Create a path for getting a single thing
function single(app, path, restPath) {
	app.get(restPath + '/:name', function (req, res) {
		if (typeof req.params.name !== 'undefined' && req.params.name !== '') {

			if (fs.existsSync(path + req.params.name + '.json')) {

				var r = {
					properties: JSON.parse(fs.readFileSync(path + req.params.name + '.json')),
					script: ''
				};

				if (fs.existsSync(path + req.params.name + '.js')) {
					r.script = fs.readFileSync(path + req.params.name + '.js', 'utf-8');
				}

				res.send(r);

			} else {
				res.send({error:404, msg:path + req.params.name + '.json'});
			}

		}
	});
}

////////////////////////////////////////////////////////////////////////////////
//Create a path for updating a thing - will create it if it doesnt exist
function updateThing(app, path, restPath, template) {
	app.post(restPath + '/:name', function (req, res) {

		var name = req.params.name;

		if (typeof name !== 'undefined' && name !== '') {
			console.log('Updating thing');

			var item = {};

			if (fs.existsSync(path + name + '.json')) {
				//Update it.
				if (typeof req.body.properties !== 'undefined') {
					fs.writeFileSync(path + name + '.json', JSON.stringify(req.body.properties));	
				}

				if (typeof req.body.script !== 'undefined') {
					fs.writeFileSync(path + name + '.js', req.body.script);	
				}

				res.send('');

			} else {
				console.log('Creating new thing ' + name + ' from template ' + template);
				//Create it, which means "load from template"
				//if (fs.existsSync(path + '../templates/' + restPath + ))
				if (fs.existsSync(path + '../../templates/' + template + '.json')) {
					var o = JSON.parse(fs.readFileSync(path + '../../templates/' + template + '.json'));
					o.name = name;
					fs.writeFileSync(path + name + '.json', JSON.stringify(o));
				}

				if (fs.existsSync(path + '../../templates/' + template + '.js')) {
					//Copy the file to the path
					fs.writeFileSync(path + name + '.js', fs.readFileSync(path + '../../templates/' + template + '.js'));
				}

				res.send('');

			}
		}
	});
}

////////////////////////////////////////////////////////////////////////////////
//Create a path for setting up a new thing
function newThing(app, path, restPath) {

}

////////////////////////////////////////////////////////////////////////////////
//Create a path for deleting a thing
function deleteThing(app, path, restPath) {

}

////////////////////////////////////////////////////////////////////////////////
//Create a every path for a given path
function create(app, path, template) {
	var restPath = path.substr(path.lastIndexOf('/'));// + '/';
	path = path + '/';

	list(app, path, restPath);
	single(app, path, restPath);
	deleteThing(app, path, restPath);
	updateThing(app, path, restPath, template);

}

////////////////////////////////////////////////////////////////////////////////
module.exports = {
	setup: function (app) {

		create(app, __dirname + '/../data/game/sprites', 'sprite');
		create(app, __dirname + '/../data/game/items', 'item');
		create(app, __dirname + '/../data/game/tilesets', 'tileset');
		create(app, __dirname + '/../data/game/crafting', 'crafting');
		create(app, __dirname + '/../data/game/wildlife', 'wildlife');
		create(app, __dirname + '/../data/game/config');

	}
}
