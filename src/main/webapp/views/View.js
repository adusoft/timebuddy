module.exports = function ($scope, $state, AuthService, $localStorage) {

  $scope.username = function () {
    return $localStorage.username;
  }

  $scope.logout = function () {
    AuthService.logout();
  };

  $scope.isUserLoggedIn = function () {
    return AuthService.isUserLoggedIn();
  };

  $state.go('TimeEntries');

};
