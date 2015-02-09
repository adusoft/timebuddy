module.exports = function ($scope, $state, AuthService, loggedUser) {

  $scope.loggedUser = loggedUser;

  $scope.logout = function () {
    AuthService.logout();
  };

  $scope.isUserLoggedIn = function () {
    return AuthService.isUserLoggedIn();
  };

  $state.go('TimeEntries');

};
