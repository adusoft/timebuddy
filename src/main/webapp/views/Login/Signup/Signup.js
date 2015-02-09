'use strict';

var SignupCtrl = function ($scope, $stateParams, AuthService, $location) {

  $scope.signup = function () {
    if ($scope.user.password1 !== $scope.user.password2) {
      $scope.error = "Passwords must match";
      return;
    }
    $scope.user.password = $scope.user.password1;
    var promise = AuthService.signup($scope.user);
    promise.then(function () {
      $location.path('/login');
    }, function (response) {
      $scope.error = response.data.message;
    });
  };

};

module.exports = SignupCtrl;