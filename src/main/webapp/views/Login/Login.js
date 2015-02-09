'use strict';

var LoginCtrl = function ($scope, $stateParams, AuthService, $state) {

  $scope.user = {
    username: '',
    password: ''
  };

  $scope.login = function () {
    var promise = AuthService.login($scope.user, $scope.rememberMe);
    promise.then(function () {
      $state.go('TimeEntries');
    }, function (response) {
      $scope.error = response.data.message;
    });
  };

};

module.exports = LoginCtrl;