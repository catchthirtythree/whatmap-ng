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
		
	app.service('MapModel', function($http) {
		return {
			get: function(id) {
				return $http.get('../api/maps/' + id);
			},
			
			search: function(query) {
				return $http.get('../api/search/' + query);
			}
		}
	});
	
	app.controller('WhatMapController', function($location) {
		this.query = '';
		
		this.submit = function() {
			$location.path('/search/' + this.query);
			this.query = '';
		}
	});
	
	app.controller("MapController", function(MapModel, $http, $routeParams, $sce, $scope) {
		$scope.map = {};

		this.init = function() {
			MapModel.get($routeParams.id).then(this.success, this.error);
		}
			
		this.success = function(response) {
			var data = response.data;
			
			if (data.success) {
				var map = data.map;
				
				var searchName = map.name;
				[ /_v\d+/, /_final/, /_fix/ ].forEach(function(badEnd) {
					searchName = searchName.replace(badEnd, "");
				});

				var channel = "https://www.googleapis.com/youtube/v3/search?&forUsername=ksfrecords&q={0}&key=AIzaSyBAiqL_S3tVfpHNHix6sJ9vlcbIcw3X1VQ%20&part=snippet";
				var htmlVideo = "<iframe width=\"560\" height=\"315\" src=\"http://www.youtube.com/embed/{0}\" frameborder=\"0\" allowfullscreen></iframe>";
				var htmlNoVideo = "<h4 style=\"text-align:center\">No video was found, try going <a href=\"http://www.youtube.com/results?search_query={0}wr\" target=\"youtubes\">here</a>.</h4>";
				
				$http.get(channel.format(searchName + ' wr')).
				
					success(function(response) {
						console.log("Response:", response);
						
						var html;
						if (response.items.length > 0) {
							html = htmlVideo.format(findBestVideo(map.name, response).id.videoId);
						} else {
							html = htmlNoVideo.format(map.name.replace(/_/g, " "));
						}
						
						map.video = $sce.trustAsHtml(html);
						$scope.map = map;
					}).
					
					error(function(err) {
						$scope.error = err;
					});
			} else {
				$scope.error = data;
			}
		}
		
		this.error = function(response) {
			$scope.error = response.data;
		}
		
		this.init();
	});
	
	app.controller("SearchController", function(MapModel, $http, $location, $routeParams, $scope) {
		$scope.results = [];
		
		this.init = function() {
			MapModel.search($routeParams.query).then(this.success, this.error);
		}
		
		this.success = function(response) {
			var data = response.data;
			
			if (data.success) {
				if (data.map) {
					$location.path('/maps/' + response.map.id);
				} else {
					data.maps.forEach(function(map) {
						$scope.results.push(map);
					});
				}
			} else {
				$scope.error = data;
			}
		}
		
		this.error = function(response) {
			$scope.error = response.data;
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
	
	function findBestVideo(mapName, response) {		
		var channel = "ksfrecords";
		var keywords = [ mapName, mapName.replace(/_/g, " ") ];
		var video = response.items[0];
		
		var rankings = new Array(response.items.length);
		for (var i = 0; i < rankings.length; ++i) rankings[i] = 0;
		
		// Check if responses are from ksfrecords.
		for (var i = 0; i < response.items.length; ++i) {
			var item = response.items[i];
			if (item.snippet.channelTitle.search(new RegExp(channel, "i")) > -1) {
				video = item;
				rankings[i]++;
			}
		}
		
		// Check if response titles/descriptions contain keywords.
		keywords.forEach(function(keyword) {
			// Check if responses are from ksfrecords.
			for (var i = 0; i < response.items.length; ++i) {
				var item = response.items[i];
				var snippet = item.snippet;
				if (snippet.title.search(new RegExp(keyword, "i")) > -1
					|| snippet.description.search(new RegExp(keyword, "i")) > -1) {
						rankings[i]++;
				}
			}
		});
		
		console.log("Rankings:", rankings);
		
		return response.items[rankings.indexOf(Math.max.apply(Math, rankings))];
	}
})();