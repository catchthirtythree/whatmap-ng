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
		
	app.service('WMApi', function($http, $q) {
		return {
			get: function(id) {
				return $http.get('../api/maps/' + id).
					then(function(res) {
						return res.data
					}).
					
					catch(function(res) {
						return $q.reject(res.data);
					});
			},
			
			search: function(query) {
				return $http.get('../api/search/' + query).
					then(function(res) {
						return res.data
					}).
					
					catch(function(res) {
						return $q.reject(res.data);
					});
			}
		};
	});
	
	app.controller('WhatmapController', function($location) {
		this.query = '';
		
		this.submit = function() {
			$location.path('/search/' + this.query);
		}
	});
	
	app.controller("MapController", function(WMApi, $http, $routeParams, $sce, $scope) {
		$scope.map = {};

		this.init = function() {
			// Query map api.
			WMApi.get($routeParams.id).
				then(function(data) {
					if (data.success) {
						var map = data.map;
						
						// Remove bad map endings from the name
						var searchName = map.name;
						[ /_v\d+/, /_final/, /_fix/ ].forEach(function(badEnd) {
							searchName = searchName.replace(badEnd, "");
						});
		
						var channel = "https://www.googleapis.com/youtube/v3/search?&forUsername=ksfrecords&q={0}&key=AIzaSyBAiqL_S3tVfpHNHix6sJ9vlcbIcw3X1VQ%20&part=snippet";
						// Search youtube for a video of the map.
						$http.get(channel.format(searchName + ' wr')).
						
							success(function(response) {
								// Log youtube response.
								console.log("Response:", response);
								
								var video;
								if (response.items.length > 0) {
									video = "<iframe width=\"560\" height=\"315\" src=\"http://www.youtube.com/embed/" + findBestVideo(map.name, response).id.videoId + "\" frameborder=\"0\" allowfullscreen></iframe>";
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
				
				catch(function(err) {
					$scope.error = err;
				});
		}
		
		this.init();
	});
	
	app.controller("SearchController", function(WMApi, $http, $location, $routeParams, $scope) {
		$scope.results = [];
		
		this.init = function() {
			// Query search api.
			WMApi.search($routeParams.query).
		
				then(function(data) {
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
				
				catch(function(err) {
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
	
	function findBestVideo(mapName, response) {		
		var channel = "ksfrecords";
		var keywords = [mapName, mapName.replace(/_/g, " ")];
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
						rankings[i] += 2;
				}
			}
		});
		
		console.log("Rankings:", rankings);
		
		return response.items[rankings.indexOf(Math.max.apply(Math, rankings))];
	}
})();