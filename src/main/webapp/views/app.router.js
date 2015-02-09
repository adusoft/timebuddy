'use strict';

var app = require('./app');

app.config(function ($stateProvider) {
  $stateProvider.state('TimeEntries', {
    url: '/',
    templateUrl: 'views/TimeEntries/TimeEntries.html',
    controller: 'TimeEntriesCtrl',
    data: {
      permissions: {
        only: ['user'],
        redirectTo: "Login"
      }
      //permissions: {
      //  except: ['anonymous'],
      //  redirectTo: "Login"
      //}
    }
  });
  $stateProvider.state('Login', {
    url: '/login',
    templateUrl: 'views/Login/Login.html',
    controller: 'LoginCtrl'
  });
  $stateProvider.state('Signup', {
    url: '/signup',
    templateUrl: 'views/Login/Signup/Signup.html',
    controller: 'SignupCtrl'
  });
});

