gameApp.controller('dashboard', function($scope,$state,$rootScope,$http,$window) {
	$scope.quiz = {};
	$scope.quiz.games = [];
	socket.emit('join',JSON.stringify($rootScope.user));
	var init = function(){
			var req = {
					 method: 'GET',
					 url: '/users',
					 }
				$http(req)
					.success(function(response){
						if(response){	
						$rootScope.user = response;
						}
					}).error(function(data, status, headers, config) {
					
					});
		};
	init();

	$scope.createGame = function(){

		var obj = {gameName:$scope.gameName,user:$rootScope.user};
		if($scope.quiz.games.indexOf("Game:"+$scope.gameName)> -1){
			alert("game already exist.")
			return;
		}
		var req = {
				 method: 'POST',
				 url: '/game',
				 headers: {
				   'Content-Type': 'application/json'
				 },
				 data: { host: true,gameName:$scope.gameName}
			}
			$http(req)
				.success(function(response){
					if(response){
						socket.emit('createGame',JSON.stringify(obj));
						$rootScope.user = response;
						$state.go('play');
					}
				}).error(function(data, status, headers, config) {
					alert("Something went wrong!");
				});
	}
	socket.on('quiz',function(data){
		data = JSON.parse(data);
		 $scope.$apply(function () {
			$scope.quiz.games = data;
        });
	});

	$scope.gameSelect =function(game){
	if (confirm('Are you sure you want to join '+game)) {

		var obj = {gameName:game,user:$rootScope.user}
		socket.emit('reqGame',JSON.stringify(obj));
		$rootScope.user.gameName = game;
		$state.go('play');
		} else {
		}		

	}
});