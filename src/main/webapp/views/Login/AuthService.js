var AuthService = function ($q, $http, loggedUser, $state, $localStorage) {

  // remember me option - retrieve token from local storage
  if (angular.isDefined($localStorage.authToken) && $localStorage.authToken != null && $localStorage.authToken !== '') {
    loggedUser.username = $localStorage.username;
    loggedUser.authToken = $localStorage.authToken;
  }

  return {

    isUserLoggedIn: function () {
      return angular.isDefined(loggedUser.authToken) && loggedUser.authToken != null && loggedUser.authToken !== '';
    },

    signup: function (user) {
      return $http.post('/auth/register', user);
    },

    login: function (user, rememberMe) {
      this.logout();

      var promise = $http.post('/auth/login', user);

      promise.then(function (response) {
        loggedUser.username = user.username;
        loggedUser.authToken = response.data.authToken;

        if (rememberMe) {
          $localStorage.username = loggedUser.username;
          $localStorage.authToken = loggedUser.authToken;
        }
      });

      return promise;
    },

    logout: function () {
      var deferred = $q.defer();
      loggedUser.username = null;
      loggedUser.authToken = null;
      $localStorage.username = null;
      $localStorage.authToken = null;
      $state.go('Login');
      deferred.resolve();
      return deferred.promise;
    }
  }
};

module.exports = AuthService;