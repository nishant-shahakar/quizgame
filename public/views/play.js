gameApp.controller('play', function($scope,$state,$rootScope,$http,$window) {	
	var obj =JSON.stringify({
		gameName:$rootScope.user.gameName
	});
	$scope.players =[];
	$scope.start = false;
	$scope.gameStatus = false;
	$scope.gameEnd = false;
	$scope.msg = "";
	$scope.winner="";
	$scope.crrQue = {};
	$scope.score = 0;

	socket.emit('players',obj);
	socket.on('Game:'+$rootScope.user.gameName,function(data){
		data = JSON.parse(data);
		switch(data.action) {
		    case 'joinRequest':
		        if($rootScope.user.host){
		        	if (confirm(data.user.username+' wants to join the game "'+data.gameName+'"')) {
		        		var obj = {gameName:data.gameName,user:data.user};
		        		socket.emit('allowGame',JSON.stringify(obj));
		        	}
		        	else{
						var obj = {gameName:data.gameName,user:data.user};
		        		socket.emit('rejectGame',JSON.stringify(obj));
		        	}
		        }
		        break;
		     case 'rejectGame':
		     if($rootScope.user.username === data.user.username){
		     	alert('Host player rejected you to play');
				$window.location.href="/game";
		     }   
		     break;
		     case 'allowGame':
		     if($rootScope.user.username === data.user.username){
				var req = {
							 method: 'POST',
							 url: '/game',
							 headers: {
							   'Content-Type': 'application/json'
							 },
							 data: { host: false,gameName:data.gameName}
						}
				$http(req)
					.success(function(response){
						if(response){
							$rootScope.user = response;
							var obj = {gameName:data.gameName,user:data.user};
							socket.emit('joinGame',JSON.stringify(obj));
						}
					}).error(function(data, status, headers, config) {
						alert("Something went wrong!");
					});
		     } 
		     break;
		     case 'players':
		     	$scope.$apply(function () {
					$scope.players = data.players;
					if($scope.players.length>1){
						$scope.start = true;
					}
		        });
		     break;
		     case 'gameCounter':
		     	$scope.$apply(function () {
					$scope.msg = data.msg;
		        });
		     break;
		     case 'startGame':
		     	$scope.$apply(function () {
					$scope.gameStatus=true;
					$scope.crrQue=data.que;
					$scope.crrQue.index=data.index;
		        });

		     break;
		    case 'score':
			    if(data.user.username == $rootScope.user.username){
					$scope.$apply(function () {
						$scope.score = data.score;
					});	
			   		
			    }

			break;
		    case 'next':
				$scope.$apply(function () {
					$scope.gameStatus=true;
					$scope.crrQue=data.que;
					$scope.crrQue.index=data.index;
		        });			    
			break;
			case 'endGame':
				$scope.$apply(function () {
					$scope.gameEnd = true;
					$scope.gameStatus=false;
					$scope.winner=data.winner.username+" wins with the score:"+data.winner.score;

		        });			    
			break;			
		    default:
		    	alert(data.msg);
				$window.location.href="/game";
			}
	});
	$scope.checkans =function(option){
		var obj =JSON.stringify({
			user:$rootScope.user,
			gameName:$rootScope.user.gameName,
			que:$scope.crrQue,
			option:option
		});
		socket.emit('checkans',obj)
	}
	$scope.startGame = function(){
		if(!$rootScope.user.host)return;
		var obj = {gameName:$rootScope.user.gameName,user:$rootScope.user};
		socket.emit('gameCounter',JSON.stringify(obj));
	};
	$scope.newgame =function(){
		//$window.location.href="/game";
		$state.go('dashboard');
	}

});	

