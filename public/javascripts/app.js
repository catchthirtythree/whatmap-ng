(function() {
	
	'use strict';
	
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
			$location.path('/search/' + this.query);
		}
	});
	
	app.controller("MapController", function($http, $routeParams, $sce, $scope) {
		$scope.map = {};
		

		this.init = function() {
			// Query map api.
			$http.get('../api/maps/' + $routeParams.id).
		
				success(function(data) {
					if (data.success) {
						var map = data.map;
		
						var channel = "https://www.googleapis.com/youtube/v3/search?&forUsername=ksfrecords&q={0}&key=AIzaSyBAiqL_S3tVfpHNHix6sJ9vlcbIcw3X1VQ%20&part=snippet";
						// Search youtube for a video of the map.
						$http.get(channel.format(map.name.replace(/_/g, " ") + ' wr')).
						
							success(function(response) {
								// Log youtube response.
								console.log("Response:", response);
								
								var video;
								if (response.items.length > 0) {
									video = "<iframe width=\"560\" height=\"315\" src=\"http://www.youtube.com/embed/" + response.items[0].id.videoId + "\" frameborder=\"0\" allowfullscreen></iframe>";
								} else {
									video = "<h4 style=\"text-align:center\">No video was found, try going <a href=\"http://www.youtube.com/results?search_query=" + map.name.replace(/_/g, " ") + " wr\" target=\"youtubes\">here</a>.</h4>";
								}
								
								map.video = $sce.trustAsHtml(video);
								$scope.map = map;
							}).
							
							error(function(err) {
								$scope.error = err;
							});
					} else {
						$scope.error = data;
					}
				}).
				
				error(function(err) {
					$scope.error = err;
				});
		}
		
		this.init();
	});
	
	app.controller("SearchController", function($http, $location, $routeParams, $scope) {
		$scope.results = [];
		
		this.init = function() {
			// Query search api.
			$http.get('../api/search/' + $routeParams.query).
		
				success(function(data) {
					if (data.success) {
						if (data.map) {
							$location.path('/maps/' + data.map.id);
						} else {
							data.maps.forEach(function(map) {
								$scope.results.push(map);
							});
						}
					} else {
						console.log("Error data:", data);
						$scope.error = data;
					}
				}).
				
				error(function(err) {
					$scope.error = err;
				});
		}
		
		this.init();
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