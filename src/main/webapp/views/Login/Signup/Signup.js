'use strict';

var SignupCtrl = function ($scope, $stateParams, AuthService) {

  $scope.signedUp = false;

  $scope.signup = function () {
    if ($scope.user.password1 !== $scope.user.password2) {
      $scope.error = "Passwords must match";
      return;
    }
    $scope.user.password = $scope.user.password1;
    var promise = AuthService.signup($scope.user);
    promise.then(function () {
      $scope.signedUp = true;
    }, function (response) {
      $scope.error = response.data.message;
    });
  };

};

module.exports = SignupCtrl;