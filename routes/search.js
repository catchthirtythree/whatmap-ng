var express = require('express');
var router = express.Router();

var pg = require('pg');

/* GET search listing. */

router.get('/:query', function(req, res, next) {
	pg.connect(req.app.get('connectionString'), function(err, client, done) {
		if (err) {
			console.error('error fetching client from pool', err);
			return res.status(500).render('error', { 
				success: false,
				message: 'error fetching client from pool',
				error: err 
			});
		}
		
		client.query('SELECT * FROM "ng-maps" WHERE name ILIKE $1', ['%' + req.params.query + '%'], function(err, result) {
			if (err) {
				console.error('error running query', err);
				return res.status(500).render('error', { 
					success: false,
					message: err.error,
					error: err 
				});
			}
			
			/* If no map exists, the search was unsuccessful.
			 * If a single map exists, return the single map as the maps api would. 
			 * Otherwise, return all the maps.
			 */
			if (result.rowCount == 0) {
				console.log('search unsuccessful');
				return res.status(404).json({
					success: false,
					message: 'search term "' + req.params.query + '" unsuccessful',
					error: 'search term "' + req.params.query + '" unsuccessful'
				});
			} else if (result.rowCount == 1) {
				console.log('single map found');
				return res.status(200).json({
					success: true,
					map: result.rows[0]
				});
			} else {
				console.log('search successful');
				return res.status(200).json({ 
					success: true,
					maps: result.rows 
				});
			}
		});
			
		done();
	});
});

module.exports = router;
