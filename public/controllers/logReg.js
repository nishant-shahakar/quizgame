var myApp = angular.module('logReg',[]);

myApp.controller('signup', ['$scope','$http','$window', function($scope,$http,$window) {
	$scope.register = function(){
  	var req = {
				 method: 'POST',
				 url: '/users',
				 headers: {
				   'Content-Type': 'application/json'
				 },
				 data: { username: $scope.username,fullname:$scope.fullname,password: $scope.password,email:$scope.email}
			}

			$http(req)
				.success(function(response){
					if(response){
					$window.location.href="/game";
					}
				}).error(function(data, status, headers, config) {
					alert("Invalid credentials try with diffrent username");
				});
	};
	$scope.login = function(){
 	var req = {
				 method: 'POST',
				 url: '/login',
				 headers: {
				   'Content-Type': 'application/json'
				 },
				 data: { username: $scope.lusername,password: $scope.lpassword}
			}

			$http(req)
				.success(function(response){
					if(response){
					$window.location.href="/game";
					}
				}).error(function(data, status, headers, config) {
					alert("Invalid credentials.");
				});
	};	

}]);