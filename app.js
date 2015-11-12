"use strict"
var data;
var songs;
var listSongs = new Array();
var removeCount = 0;
var toDelete = [];
var baseUrl = 'https://api.spotify.com/v1/users/'
var PLAYLIST_ID;
var USER_ID;
var USER_CODE;
var auth_token;
var playlist_count;
var auth = false;
$(document).ready(function(e) {
    //var token = $.urlParam('access_token');
	$("#playButton").disabled = !(auth);
	if(!(auth)){
		$("#playButton").addClass("dis");
	} else {
		$("#playButton").removeClass("dis");
	}
	//checks if logged in
	var hash = window.location.hash;
	if(window.location.search.substring(1).indexOf("error") !== -1 && localStorage.getItem('spotify-token') == null){
		var auth = false;
	} else if (hash){
		var auth = true;
		$("#playButton").removeClass("dis");
		auth_token = window.location.hash.split('&')[0].split('=')[1];
		localStorage.setItem('spotify-token', auth_token);
		window.close();
		location.reload();
	}else if(localStorage.getItem('spotify-token') != null){
				var auth = true;
		auth_token = localStorage.getItem('spotify-token');
	}
});
//sets up angular module
angular
  .module('spotApp', ['spotify'])
  .config(function (SpotifyProvider) {
    SpotifyProvider.setClientId('7c5f39aa3859409e83eb7c5611e50621');
    SpotifyProvider.setRedirectUri('http://students.washington.edu/mikhail3/info343/spotify/spotify-template/index.html');
    SpotifyProvider.setScope('playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private');
	SpotifyProvider.setAuthToken(localStorage.getItem('spotify-token'));
  })
  //sets up angular controller
  .controller('spotCtrl', ['$scope', 'Spotify', function ($scope, Spotify) {
		$scope.login = function () {
			Spotify.login().then(function (data) {
				console.log(data);
			})
		};
		//loads and displays user's playlists
		$scope.displayLists = function () {
			Spotify.getCurrentUser().then(function (user_response) {
  				Spotify.getUserPlaylists(user_response.id, {limit:50}).then(function (list_response) {
  					data = $scope.playlists = list_response.items;
				})
			}), (function (error) {
				alert('Log in!');
			})
		};
		$scope.disp = function() {
			return !auth;
		};
		//scans list adn deletes duplicates
		$scope.optimize = function(listId, length) {
			var unique = new Array();
			PLAYLIST_ID = listId
			Spotify.getCurrentUser()
				.then(function (user_response) {
					USER_ID = user_response.id;
					//var totalList = makeListOfSongs(USER_ID, PLAYLIST_ID, length);
					//listSongs = makeListOfSongs(USER_ID, PLAYLIST_ID, [], length, 0);
					makeListOfSongs(USER_ID, PLAYLIST_ID, [], length, 0);
					setTimeout(function() { //has to wait for stuff to load
					    funct1(unique);
					}, (length * 6));
					//userId, playlistId, result, length, current_offset
//						Spotify.getPlaylistTracks(USER_ID, PLAYLIST_ID, {offset:n}).then(function (playlist) {
//							for(var m = 0; m <playlist.items.length; m++){
//								listSongs.push(playlist.items[m]);
//							}
//						Spotify.getPlaylistTracksAll(USER_ID, PLAYLIST_ID, length).then(function (listSongs) {

						});
//				});
			};
			//removes duplicate tracks
		var deleteTracks = function(unique){
				var uniqueTracks = new Array();
				for(var i = 0; i < unique.length; i++){
					uniqueTracks.push(unique[i].id);
				}
				console.log(toDelete);
				console.log(USER_ID);
				console.log(PLAYLIST_ID);
				if(uniqueTracks.length < 100){
					Spotify
						.replacePlaylistTracks(USER_ID, PLAYLIST_ID, uniqueTracks)
						.then(function (data) {
							console.log('tracks removed from playlist');
							removeCount += toDelete.length;
							toDelete = [];
							unique = [];
							//$scope.displayLists();
							location.reload();
							alert("Your playlist is ready! " + removeCount + " songs have been deleted");
					});
				} else { //if more than 100 to be deleted, different method has to be used
					longDelete(USER_ID, PLAYLIST_ID, toDelete, toDelete.length);
				}
		};
		//main body of optimize function, decides what to delete
		var funct1  = function(unique){
			console.log(listSongs);
			console.log('1');
			for(var i = 0; i < listSongs.length; i++){
				var title = listSongs[i].track.name;
				var songId = listSongs[i].track.id;
				var arts = listSongs[i].track.artists;
				var artArray = new Array();
				for(var j = 0; j < arts.length; j++){
					artArray.push(arts[j].name);
				}
				var songObj = {
					id:songId,
					name:title,
					artists:artArray
				};
				var arrRepeatTitles = arrayContainsTitle(unique, title);
				if(arrRepeatTitles.length !== 0){
					if(arrayMatchesArtists(arrRepeatTitles, artArray)){
						toDelete.push(songObj.id);
					} else {
						unique.push(songObj);
					}
				} else {
					unique.push(songObj);
				}
			}
			console.log(unique);
			deleteTracks(unique);
		};
		// var makeListOfSongs = function(userId, playlistId, length){
		// 	var result = new Array();
		// 	return mLOSHelper(userId, playlistId, result, length, 0);
		// };
		//loads songs for playlist to be scanned. Uses recurssion to deal with 100+ tracks since calls limited to 100
		var makeListOfSongs = function(userId, playlistId, result, length, current_offset){
			var resultNew = new Array();
			console.log(current_offset);
			resultNew = result;
			Spotify.getPlaylistTracks(userId, playlistId, {offset:current_offset}).then(function (playlist) {
				for(var j = 0; j <playlist.items.length; j++){
					resultNew.push(playlist.items[j]);
				}
				if((current_offset) >= length){
					console.log('final');
					console.log(resultNew);
					//return resultNew;
					listSongs = resultNew;
				} else {
					//return makeListOfSongs(userId, playlistId, resultNew, length, (current_offset + 100));
					makeListOfSongs(userId, playlistId, resultNew, length, (current_offset + 100));
				}
			});
		};
		//recursive delete method when over 100 items to be deleted
		var longDelete = function(userId, playlistId, delArray, count){
			var totalDelete = delArray;
			var toBeRemoved = new Array();
			for(var i = 0; i < 99; i++){
				if(totalDelete !== [] &&  totalDelete[i] !== undefined && totalDelete.length !== 0){
					toBeRemoved.push(totalDelete.shift());
					console.log(totalDelete.length);
				}
			}
			Spotify
				.removePlaylistTracks(userId, playlistId, toBeRemoved)
				.then(function (data) {
					console.log('tracks removed from playlist');
					console.log(totalDelete.length);
					if(totalDelete == [] || totalDelete == undefined || totalDelete.length == 0){
						toDelete = [];
						location.reload();
						alert("Your playlist is ready! " + count + " songs have been deleted");
					} else {
						longDelete(userId, playlistId, totalDelete, count);
					}
			});
		};



		
}]);

//checks if 2 arrays equal, used to see if artists match
var arraysEqual = function (a1, a2) {
    if(a1 == null || a2 == null || a1.length != a2.length){
		return false;
	} else {
		for(var i = 0; i < a1.length; i++){
			if(a2.indexOf(a1[i]) == -1){
				return false
			}
		}
		return true;
	}
};

//checks if song names are same, to then be checked for artist match to determine deletion
var arrayMatchesArtists = function (a1, aArt) {
    if(a1 == null || aArt == null){
		return false;
	} else {
		for(var i = 0; i < a1.length; i++){
			var art = a1[i].artists;
			if(art == null || art.length != aArt.length){
				return false;
			}
			for(var j = 0; j < aArt.length; j++){
					if(art.indexOf(aArt[j]) == -1){
						return false
					}
			}
		}
		return true;
	}
};

//checks if title of song is in array, returns array of things that repeat
var arrayContainsTitle = function (array, key) {
	var results = new Array();
	for(var i = 0; i < array.length; i++){
		if(array[i].name.toLowerCase() == key.toLowerCase()){
			results.push(array[i]);
		}
	}
	return results;
};



// Add tool tips to anything with a title property
$('body').tooltip({
    selector: '[title]'
});


