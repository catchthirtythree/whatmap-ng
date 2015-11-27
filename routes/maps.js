var express = require('express');
var router = express.Router();

var pg = require('pg');

/* GET map listing. */

router.route('/:id')
	.get(function(req, res, next) {
		pg.connect(req.app.get('connectionString'), function(err, client, done) {
			if (err) {
				console.error('error fetching client from pool', err);
				return res.status(500).json({
					success: false,
					message: 'error fetching client from pool',
					error: err
				});
			}	
			
			client.query('SELECT * FROM "ng-maps" WHERE id = $1', [req.params.id], function(err, result) {
				if (err) {
					console.error('error running query', err);
					return res.status(500).json({
						success: false,
						message: 'error running query',
						error: err
					});
				}
				
				/* If a map exists, return the map. */
				if (result.rowCount == 1) {
					console.log('map found', result.rows[0]);
					return res.status(200).json({
						success: true,
						map: result.rows[0]
					});
				} else {
					console.log('map not found');
					return res.status(404).json({
						success: false,
						message: 'map does not exist',
						error: 'map does not exist',
					});
				}
			});
			
			done();
		});
	});

module.exports = router;
