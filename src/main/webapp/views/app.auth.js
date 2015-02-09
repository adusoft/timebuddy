'use strict';

var app = require('./app');

app.value('loggedUser', {
  username: ''
});

app.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push(function ($q, $location, loggedUser) {
    return {

      request: function (config) {
        config.headers.authToken = loggedUser.authToken;
        return config;
      },

      response: function (response) {
        if (response.status === 401) {
          console.log("Response 401");
        }
        return response || $q.when(response);
      },
      responseError: function (rejection) {
        if (rejection.status === 401) {
          console.log("Response Error 401", rejection);
          $location.path('/login');
        }
        return $q.reject(rejection);
      }

    };
  });
}])
;

app.run(function (Permission, AuthService) {
  Permission.defineRole('anonymous', function (stateParams) {
    return !AuthService.isUserLoggedIn();
  });
  Permission.defineRole('user', function (stateParams) {
    return AuthService.isUserLoggedIn();
  });
});