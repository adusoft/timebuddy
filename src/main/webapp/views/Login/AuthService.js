var AuthService = function ($q, $http, $state, $localStorage) {

  return {

    isUserLoggedIn: function () {
      return angular.isDefined($localStorage.authToken) && $localStorage.authToken != null && $localStorage.authToken !== '';
    },

    signup: function (user) {
      return $http.post('/auth/register', user);
    },

    login: function (user) {
      this.logout();

      var promise = $http.post('/auth/login', user);

      promise.then(function (response) {
        $localStorage.username = user.username;
        $localStorage.authToken = response.data.authToken;
      });

      return promise;
    },

    logout: function () {
      var deferred = $q.defer();
      $localStorage.username = null;
      $localStorage.authToken = null;
      $state.go('Login');
      deferred.resolve();
      return deferred.promise;
    }
  }
};

module.exports = AuthService;