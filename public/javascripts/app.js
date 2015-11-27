(function() {
	
	'use strict';
	
	var channel = "https://www.googleapis.com/youtube/v3/search?&forUsername=ksfrecords&q={0}&key=AIzaSyBAiqL_S3tVfpHNHix6sJ9vlcbIcw3X1VQ%20&part=snippet";
	
	var app = angular.module('app', [ 'ngRoute', 'ngSanitize' ]).
	
		config(function($locationProvider, $routeProvider) {
			$locationProvider.html5Mode(true);
			
			$routeProvider.
				when('/', {
					templateUrl: 'welcome.html'
				}).
				
				when('/maps/:id', {
					templateUrl: 'map.html',
					controller: 'MapController'
				}).
				
				when('/search/:query', {
					templateUrl: 'search.html',
					controller: 'SearchController',
					controllerAs: 'search'
				}).
				
				otherwise({
					redirectTo: '/'
				});
		});
	
	app.controller('WhatmapController', function($location) {
		this.query = '';
		
		this.submit = function() {
			// Log the query in the console.
			console.log("Query:", this.query);
			
			// Send the user to the search controller.
			$location.path('/search/' + this.query);
		}
	});
	
	app.controller("MapController", function($http, $routeParams, $sce, $scope) {
		$scope.map = {};
		
		$http.get('../api/maps/' + $routeParams.id).
		
			success(function(data) {
				// Log data in console.
				console.log("Map Data:", data);
				
				if (data.success) {
					var map = data.map;
				
					// Search youtube for a video of the map.
					$http.get(channel.format(map.name)).
					
						success(function(response) {
							// Log youtube response.
							console.log("Response:", response);
							
							var video;
							if (response.items) {
								video = "<iframe width=\"560\" height=\"315\" src=\"http://www.youtube.com/embed/" + response.items[0].id.videoId + "\" frameborder=\"0\" allowfullscreen></iframe>";
							} else {
								video = "No video was found, try going <a href=\"http://www.youtube.com/results?search_query=" + map.name.replace(/_/g, " ") + " wr\" target=\"youtubes\">here</a>.";
							}
							
							// Attach video to scope.
							map.video = $sce.trustAsHtml(video);
						
							// Push map to scope.
							$scope.map = map;
						}).
						
						error(function(err) {
							// Log error in console.
							console.log("Error:", err);
							
							// Push error to scope.
							$scope.error = err;
						});
				} else {
					console.log("Error data:", data);
					$scope.error = data;
				}
			}).
			
			error(function(err) {
				// Log error in console.
				console.log("Error", err);
				
				// Push error to scope.
				$scope.error = err;
			});
	});
	
	app.controller("SearchController", function($http, $location, $routeParams, $scope) {
		$scope.results = [];
		
		$http.get('../api/search/' + $routeParams.query).
		
			success(function(data) {
				// Log data in console.
				console.log("Search Data:", data);
				
				// Check length of data.maps and send to maps if needed.
				if (data.success) {
					if (data.map) {
						$location.path('/maps/' + data.map.id);
					} else {
						// Push maps to scope.
						data.maps.forEach(function(map) {
							console.log("Map:", map);
							$scope.results.push(map);
						});
					}
				} else {
					console.log("Error data:", data);
					$scope.error = data;
				}
			}).
			
			error(function(err) {
				// Log error in console.
				console.log("Error", err);
				
				// Push error to scope.
				$scope.error = err;
			});
	});
	
	if (!String.prototype.format) {
		String.prototype.format = function() {
			var args = arguments;
			var sprintfRegex = /\{(\d+)\}/g;
		
			var sprintf = function(match, number) {
				return number in args ? args[number] : match;
			};
		
			return this.replace(sprintfRegex, sprintf);
		};
	}
})();