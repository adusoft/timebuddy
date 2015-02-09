(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var app = require('./views/app');
var router = require('./views/app.router');
var auth = require('./views/app.auth');

app.controller('ViewCtrl', require('./views/View'));

app.service('AuthService', require('./views/Login/AuthService'));
app.controller('LoginCtrl', require('./views/Login/Login'));
app.controller('SignupCtrl', require('./views/Login/Signup/Signup'));

app.controller('TimeEntriesCtrl', require('./views/TimeEntries/TimeEntries'));
app.service('TimeEntriesService', require('./views/TimeEntries/TimeEntriesService'));

var loading = require('./views/loading');

},{"./views/Login/AuthService":2,"./views/Login/Login":3,"./views/Login/Signup/Signup":4,"./views/TimeEntries/TimeEntries":5,"./views/TimeEntries/TimeEntriesService":6,"./views/View":7,"./views/app":9,"./views/app.auth":8,"./views/app.router":10,"./views/loading":11}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
'use strict';

module.exports = function ($scope, $interval, TimeEntriesService) {

  var secondsInterval = null;
  var tickSecond = function () {
    var m = moment();
    $scope.timeEntries.forEach(function (timeEntry) {
      //timeEntry.time = m.utcOffset(timeEntry.currentTime.substring(timeEntry.currentTime.length - 6)).format('YYYY-MM-DD HH:mm:ss');
      timeEntry.time = m.utcOffset(timeEntry.timezone).format('YYYY-MM-DD HH:mm:ss');
    });
  };
  $scope.$on("$destroy", function (event) {
      $interval.cancel(secondsInterval);
    }
  );

  $scope.timeEntries = [];
  var refresh = function () {
    TimeEntriesService.list().then(function (response) {
      //$scope.timeEntries = response.data;

      $scope.timeEntries = response.data.map(function (timeEntry) {
        //var m = moment(timeEntry.currentTime);
        var m = moment();
        timeEntry.time = m.utcOffset(timeEntry.timezone).format('YYYY-MM-DD HH:mm:ss');
        return timeEntry;
      });

      $interval.cancel(secondsInterval);
      secondsInterval = $interval(tickSecond, 1000);
    });
  };
  refresh();

  $scope.editMode = false;
  $scope.timeEntry = {};
  $scope.timezoneOptions = {
    sign: '+',
    hour: '00',
    minute: '00',
    hours: Array.apply(null, Array(25)).map(function (_, i) {
      return ("0" + i).slice(-2);
    }),
    minutes: ['00', '30']
  };

  $scope.save = function () {
    $scope.timeEntry.timezone = $scope.timezoneOptions.sign + $scope.timezoneOptions.hour + ":" + $scope.timezoneOptions.minute;
    if (angular.isDefined($scope.timeEntry.id)) {
      TimeEntriesService.update($scope.timeEntry).then(refresh);
    } else {
      TimeEntriesService.create($scope.timeEntry).then(refresh);
    }
    $scope.timeEntry = {};
    $scope.editMode = false;
  };
  $scope.cancel = function () {
    angular.copy({}, $scope.timeEntry);
    $scope.editMode = false;
  };

  $scope.delete = function (timeEntry) {
    TimeEntriesService.delete(timeEntry.id).then(refresh);
    $scope.timeEntry = {};
    $scope.editMode = false;
  };

  $scope.edit = function (timeEntry) {
    angular.copy(timeEntry, $scope.timeEntry);
    if ($scope.timeEntry.timezone) {
      $scope.timezoneOptions.sign = $scope.timeEntry.timezone.substring(0, 1);
      $scope.timezoneOptions.hour = $scope.timeEntry.timezone.substring(1, 3);
      $scope.timezoneOptions.minute = $scope.timeEntry.timezone.substring(4, 6);
    }
    $scope.editMode = true;
  };

}
;

},{}],6:[function(require,module,exports){
'use strict';

module.exports = function ($http, loading) {

  return {

    list: function () {
      var promise = $http.get('/timeEntry');
      loading(promise);
      return promise;
    },

    get: function (id) {
      var promise = $http.get('/timeEntry/' + id);
      loading(promise);
      return promise;
    },

    create: function (timeEntry) {
      var promise = $http.post('/timeEntry/', timeEntry);
      loading(promise);
      return promise;
    },

    update: function (timeEntry) {
      var promise = $http.put('/timeEntry/' + timeEntry.id, timeEntry);
      loading(promise);
      return promise;
    },

    delete: function (id) {
      var promise = $http.delete('/timeEntry/' + id);
      loading(promise);
      return promise;
    }

  };

};

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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
},{"./app":9}],9:[function(require,module,exports){
'use strict';

var APP_NAME = 'timebuddy';
var app = angular.module(APP_NAME, ['ui.router', 'ngStorage', 'permission']);

module.exports = app;
},{}],10:[function(require,module,exports){
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


},{"./app":9}],11:[function(require,module,exports){
var app = require('./app');

app.factory('loading', function ($rootScope) {

  var loading = false;

  return function (promise) {
    $rootScope.$broadcast('loadingEvent', true);
    loading = true;
    promise.finally(function () {
      loading = false;
      $rootScope.$broadcast('loadingEvent', false);
    });
  }

});

app.directive('spinner', function () {

  return {
    template: '<div ng-if="loading" style="position: absolute; right: 0; top: 0; width: 200px; background-color: #000; color: #fff; padding-left: 10px;">Loading...</div>',
    replace: true,
    scope: {},
    link: function (scope, element, attrs) {
      scope.$on('loadingEvent', function (event, loading) {
        scope.loading = loading;
      });
    }
  }

});

},{"./app":9}]},{},[1]);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBhcHAgPSByZXF1aXJlKCcuL3ZpZXdzL2FwcCcpO1xudmFyIHJvdXRlciA9IHJlcXVpcmUoJy4vdmlld3MvYXBwLnJvdXRlcicpO1xudmFyIGF1dGggPSByZXF1aXJlKCcuL3ZpZXdzL2FwcC5hdXRoJyk7XG5cbmFwcC5jb250cm9sbGVyKCdWaWV3Q3RybCcsIHJlcXVpcmUoJy4vdmlld3MvVmlldycpKTtcblxuYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgcmVxdWlyZSgnLi92aWV3cy9Mb2dpbi9BdXRoU2VydmljZScpKTtcbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCByZXF1aXJlKCcuL3ZpZXdzL0xvZ2luL0xvZ2luJykpO1xuYXBwLmNvbnRyb2xsZXIoJ1NpZ251cEN0cmwnLCByZXF1aXJlKCcuL3ZpZXdzL0xvZ2luL1NpZ251cC9TaWdudXAnKSk7XG5cbmFwcC5jb250cm9sbGVyKCdUaW1lRW50cmllc0N0cmwnLCByZXF1aXJlKCcuL3ZpZXdzL1RpbWVFbnRyaWVzL1RpbWVFbnRyaWVzJykpO1xuYXBwLnNlcnZpY2UoJ1RpbWVFbnRyaWVzU2VydmljZScsIHJlcXVpcmUoJy4vdmlld3MvVGltZUVudHJpZXMvVGltZUVudHJpZXNTZXJ2aWNlJykpO1xuXG52YXIgbG9hZGluZyA9IHJlcXVpcmUoJy4vdmlld3MvbG9hZGluZycpO1xuXG59LHtcIi4vdmlld3MvTG9naW4vQXV0aFNlcnZpY2VcIjoyLFwiLi92aWV3cy9Mb2dpbi9Mb2dpblwiOjMsXCIuL3ZpZXdzL0xvZ2luL1NpZ251cC9TaWdudXBcIjo0LFwiLi92aWV3cy9UaW1lRW50cmllcy9UaW1lRW50cmllc1wiOjUsXCIuL3ZpZXdzL1RpbWVFbnRyaWVzL1RpbWVFbnRyaWVzU2VydmljZVwiOjYsXCIuL3ZpZXdzL1ZpZXdcIjo3LFwiLi92aWV3cy9hcHBcIjo5LFwiLi92aWV3cy9hcHAuYXV0aFwiOjgsXCIuL3ZpZXdzL2FwcC5yb3V0ZXJcIjoxMCxcIi4vdmlld3MvbG9hZGluZ1wiOjExfV0sMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgQXV0aFNlcnZpY2UgPSBmdW5jdGlvbiAoJHEsICRodHRwLCBsb2dnZWRVc2VyLCAkc3RhdGUsICRsb2NhbFN0b3JhZ2UpIHtcclxuXHJcbiAgLy8gcmVtZW1iZXIgbWUgb3B0aW9uIC0gcmV0cmlldmUgdG9rZW4gZnJvbSBsb2NhbCBzdG9yYWdlXHJcbiAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKCRsb2NhbFN0b3JhZ2UuYXV0aFRva2VuKSAmJiAkbG9jYWxTdG9yYWdlLmF1dGhUb2tlbiAhPSBudWxsICYmICRsb2NhbFN0b3JhZ2UuYXV0aFRva2VuICE9PSAnJykge1xyXG4gICAgbG9nZ2VkVXNlci51c2VybmFtZSA9ICRsb2NhbFN0b3JhZ2UudXNlcm5hbWU7XHJcbiAgICBsb2dnZWRVc2VyLmF1dGhUb2tlbiA9ICRsb2NhbFN0b3JhZ2UuYXV0aFRva2VuO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuXHJcbiAgICBpc1VzZXJMb2dnZWRJbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gYW5ndWxhci5pc0RlZmluZWQobG9nZ2VkVXNlci5hdXRoVG9rZW4pICYmIGxvZ2dlZFVzZXIuYXV0aFRva2VuICE9IG51bGwgJiYgbG9nZ2VkVXNlci5hdXRoVG9rZW4gIT09ICcnO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaWdudXA6IGZ1bmN0aW9uICh1c2VyKSB7XHJcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXV0aC9yZWdpc3RlcicsIHVzZXIpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2dpbjogZnVuY3Rpb24gKHVzZXIsIHJlbWVtYmVyTWUpIHtcclxuICAgICAgdGhpcy5sb2dvdXQoKTtcclxuXHJcbiAgICAgIHZhciBwcm9taXNlID0gJGh0dHAucG9zdCgnL2F1dGgvbG9naW4nLCB1c2VyKTtcclxuXHJcbiAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICBsb2dnZWRVc2VyLnVzZXJuYW1lID0gdXNlci51c2VybmFtZTtcclxuICAgICAgICBsb2dnZWRVc2VyLmF1dGhUb2tlbiA9IHJlc3BvbnNlLmRhdGEuYXV0aFRva2VuO1xyXG5cclxuICAgICAgICBpZiAocmVtZW1iZXJNZSkge1xyXG4gICAgICAgICAgJGxvY2FsU3RvcmFnZS51c2VybmFtZSA9IGxvZ2dlZFVzZXIudXNlcm5hbWU7XHJcbiAgICAgICAgICAkbG9jYWxTdG9yYWdlLmF1dGhUb2tlbiA9IGxvZ2dlZFVzZXIuYXV0aFRva2VuO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9nb3V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcbiAgICAgIGxvZ2dlZFVzZXIudXNlcm5hbWUgPSBudWxsO1xyXG4gICAgICBsb2dnZWRVc2VyLmF1dGhUb2tlbiA9IG51bGw7XHJcbiAgICAgICRsb2NhbFN0b3JhZ2UudXNlcm5hbWUgPSBudWxsO1xyXG4gICAgICAkbG9jYWxTdG9yYWdlLmF1dGhUb2tlbiA9IG51bGw7XHJcbiAgICAgICRzdGF0ZS5nbygnTG9naW4nKTtcclxuICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xyXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEF1dGhTZXJ2aWNlO1xufSx7fV0sMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTG9naW5DdHJsID0gZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XHJcblxyXG4gICRzY29wZS51c2VyID0ge1xyXG4gICAgdXNlcm5hbWU6ICcnLFxyXG4gICAgcGFzc3dvcmQ6ICcnXHJcbiAgfTtcclxuXHJcbiAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHByb21pc2UgPSBBdXRoU2VydmljZS5sb2dpbigkc2NvcGUudXNlciwgJHNjb3BlLnJlbWVtYmVyTWUpO1xyXG4gICAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgJHN0YXRlLmdvKCdUaW1lRW50cmllcycpO1xyXG4gICAgfSwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICRzY29wZS5lcnJvciA9IHJlc3BvbnNlLmRhdGEubWVzc2FnZTtcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2dpbkN0cmw7XG59LHt9XSw0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBTaWdudXBDdHJsID0gZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zLCBBdXRoU2VydmljZSwgJGxvY2F0aW9uKSB7XHJcblxyXG4gICRzY29wZS5zaWdudXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoJHNjb3BlLnVzZXIucGFzc3dvcmQxICE9PSAkc2NvcGUudXNlci5wYXNzd29yZDIpIHtcclxuICAgICAgJHNjb3BlLmVycm9yID0gXCJQYXNzd29yZHMgbXVzdCBtYXRjaFwiO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICAkc2NvcGUudXNlci5wYXNzd29yZCA9ICRzY29wZS51c2VyLnBhc3N3b3JkMTtcclxuICAgIHZhciBwcm9taXNlID0gQXV0aFNlcnZpY2Uuc2lnbnVwKCRzY29wZS51c2VyKTtcclxuICAgIHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICRsb2NhdGlvbi5wYXRoKCcvbG9naW4nKTtcclxuICAgIH0sIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAkc2NvcGUuZXJyb3IgPSByZXNwb25zZS5kYXRhLm1lc3NhZ2U7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2lnbnVwQ3RybDtcbn0se31dLDU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoJHNjb3BlLCAkaW50ZXJ2YWwsIFRpbWVFbnRyaWVzU2VydmljZSkge1xyXG5cclxuICB2YXIgc2Vjb25kc0ludGVydmFsID0gbnVsbDtcclxuICB2YXIgdGlja1NlY29uZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBtID0gbW9tZW50KCk7XHJcbiAgICAkc2NvcGUudGltZUVudHJpZXMuZm9yRWFjaChmdW5jdGlvbiAodGltZUVudHJ5KSB7XHJcbiAgICAgIC8vdGltZUVudHJ5LnRpbWUgPSBtLnV0Y09mZnNldCh0aW1lRW50cnkuY3VycmVudFRpbWUuc3Vic3RyaW5nKHRpbWVFbnRyeS5jdXJyZW50VGltZS5sZW5ndGggLSA2KSkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOm1tOnNzJyk7XHJcbiAgICAgIHRpbWVFbnRyeS50aW1lID0gbS51dGNPZmZzZXQodGltZUVudHJ5LnRpbWV6b25lKS5mb3JtYXQoJ1lZWVktTU0tREQgSEg6bW06c3MnKTtcclxuICAgIH0pO1xyXG4gIH07XHJcbiAgJHNjb3BlLiRvbihcIiRkZXN0cm95XCIsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHNlY29uZHNJbnRlcnZhbCk7XHJcbiAgICB9XHJcbiAgKTtcclxuXHJcbiAgJHNjb3BlLnRpbWVFbnRyaWVzID0gW107XHJcbiAgdmFyIHJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBUaW1lRW50cmllc1NlcnZpY2UubGlzdCgpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgIC8vJHNjb3BlLnRpbWVFbnRyaWVzID0gcmVzcG9uc2UuZGF0YTtcclxuXHJcbiAgICAgICRzY29wZS50aW1lRW50cmllcyA9IHJlc3BvbnNlLmRhdGEubWFwKGZ1bmN0aW9uICh0aW1lRW50cnkpIHtcclxuICAgICAgICAvL3ZhciBtID0gbW9tZW50KHRpbWVFbnRyeS5jdXJyZW50VGltZSk7XHJcbiAgICAgICAgdmFyIG0gPSBtb21lbnQoKTtcclxuICAgICAgICB0aW1lRW50cnkudGltZSA9IG0udXRjT2Zmc2V0KHRpbWVFbnRyeS50aW1lem9uZSkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOm1tOnNzJyk7XHJcbiAgICAgICAgcmV0dXJuIHRpbWVFbnRyeTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAkaW50ZXJ2YWwuY2FuY2VsKHNlY29uZHNJbnRlcnZhbCk7XHJcbiAgICAgIHNlY29uZHNJbnRlcnZhbCA9ICRpbnRlcnZhbCh0aWNrU2Vjb25kLCAxMDAwKTtcclxuICAgIH0pO1xyXG4gIH07XHJcbiAgcmVmcmVzaCgpO1xyXG5cclxuICAkc2NvcGUuZWRpdE1vZGUgPSBmYWxzZTtcclxuICAkc2NvcGUudGltZUVudHJ5ID0ge307XHJcbiAgJHNjb3BlLnRpbWV6b25lT3B0aW9ucyA9IHtcclxuICAgIHNpZ246ICcrJyxcclxuICAgIGhvdXI6ICcwMCcsXHJcbiAgICBtaW51dGU6ICcwMCcsXHJcbiAgICBob3VyczogQXJyYXkuYXBwbHkobnVsbCwgQXJyYXkoMjUpKS5tYXAoZnVuY3Rpb24gKF8sIGkpIHtcclxuICAgICAgcmV0dXJuIChcIjBcIiArIGkpLnNsaWNlKC0yKTtcclxuICAgIH0pLFxyXG4gICAgbWludXRlczogWycwMCcsICczMCddXHJcbiAgfTtcclxuXHJcbiAgJHNjb3BlLnNhdmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkc2NvcGUudGltZUVudHJ5LnRpbWV6b25lID0gJHNjb3BlLnRpbWV6b25lT3B0aW9ucy5zaWduICsgJHNjb3BlLnRpbWV6b25lT3B0aW9ucy5ob3VyICsgXCI6XCIgKyAkc2NvcGUudGltZXpvbmVPcHRpb25zLm1pbnV0ZTtcclxuICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCgkc2NvcGUudGltZUVudHJ5LmlkKSkge1xyXG4gICAgICBUaW1lRW50cmllc1NlcnZpY2UudXBkYXRlKCRzY29wZS50aW1lRW50cnkpLnRoZW4ocmVmcmVzaCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBUaW1lRW50cmllc1NlcnZpY2UuY3JlYXRlKCRzY29wZS50aW1lRW50cnkpLnRoZW4ocmVmcmVzaCk7XHJcbiAgICB9XHJcbiAgICAkc2NvcGUudGltZUVudHJ5ID0ge307XHJcbiAgICAkc2NvcGUuZWRpdE1vZGUgPSBmYWxzZTtcclxuICB9O1xyXG4gICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBhbmd1bGFyLmNvcHkoe30sICRzY29wZS50aW1lRW50cnkpO1xyXG4gICAgJHNjb3BlLmVkaXRNb2RlID0gZmFsc2U7XHJcbiAgfTtcclxuXHJcbiAgJHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uICh0aW1lRW50cnkpIHtcclxuICAgIFRpbWVFbnRyaWVzU2VydmljZS5kZWxldGUodGltZUVudHJ5LmlkKS50aGVuKHJlZnJlc2gpO1xyXG4gICAgJHNjb3BlLnRpbWVFbnRyeSA9IHt9O1xyXG4gICAgJHNjb3BlLmVkaXRNb2RlID0gZmFsc2U7XHJcbiAgfTtcclxuXHJcbiAgJHNjb3BlLmVkaXQgPSBmdW5jdGlvbiAodGltZUVudHJ5KSB7XHJcbiAgICBhbmd1bGFyLmNvcHkodGltZUVudHJ5LCAkc2NvcGUudGltZUVudHJ5KTtcclxuICAgIGlmICgkc2NvcGUudGltZUVudHJ5LnRpbWV6b25lKSB7XHJcbiAgICAgICRzY29wZS50aW1lem9uZU9wdGlvbnMuc2lnbiA9ICRzY29wZS50aW1lRW50cnkudGltZXpvbmUuc3Vic3RyaW5nKDAsIDEpO1xyXG4gICAgICAkc2NvcGUudGltZXpvbmVPcHRpb25zLmhvdXIgPSAkc2NvcGUudGltZUVudHJ5LnRpbWV6b25lLnN1YnN0cmluZygxLCAzKTtcclxuICAgICAgJHNjb3BlLnRpbWV6b25lT3B0aW9ucy5taW51dGUgPSAkc2NvcGUudGltZUVudHJ5LnRpbWV6b25lLnN1YnN0cmluZyg0LCA2KTtcclxuICAgIH1cclxuICAgICRzY29wZS5lZGl0TW9kZSA9IHRydWU7XHJcbiAgfTtcclxuXHJcbn1cclxuO1xyXG5cbn0se31dLDY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoJGh0dHAsIGxvYWRpbmcpIHtcclxuXHJcbiAgcmV0dXJuIHtcclxuXHJcbiAgICBsaXN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBwcm9taXNlID0gJGh0dHAuZ2V0KCcvdGltZUVudHJ5Jyk7XHJcbiAgICAgIGxvYWRpbmcocHJvbWlzZSk7XHJcbiAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXQ6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICB2YXIgcHJvbWlzZSA9ICRodHRwLmdldCgnL3RpbWVFbnRyeS8nICsgaWQpO1xyXG4gICAgICBsb2FkaW5nKHByb21pc2UpO1xyXG4gICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgIH0sXHJcblxyXG4gICAgY3JlYXRlOiBmdW5jdGlvbiAodGltZUVudHJ5KSB7XHJcbiAgICAgIHZhciBwcm9taXNlID0gJGh0dHAucG9zdCgnL3RpbWVFbnRyeS8nLCB0aW1lRW50cnkpO1xyXG4gICAgICBsb2FkaW5nKHByb21pc2UpO1xyXG4gICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgIH0sXHJcblxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAodGltZUVudHJ5KSB7XHJcbiAgICAgIHZhciBwcm9taXNlID0gJGh0dHAucHV0KCcvdGltZUVudHJ5LycgKyB0aW1lRW50cnkuaWQsIHRpbWVFbnRyeSk7XHJcbiAgICAgIGxvYWRpbmcocHJvbWlzZSk7XHJcbiAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZWxldGU6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICB2YXIgcHJvbWlzZSA9ICRodHRwLmRlbGV0ZSgnL3RpbWVFbnRyeS8nICsgaWQpO1xyXG4gICAgICBsb2FkaW5nKHByb21pc2UpO1xyXG4gICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbn07XHJcblxufSx7fV0sNzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UsIGxvZ2dlZFVzZXIpIHtcclxuXHJcbiAgJHNjb3BlLmxvZ2dlZFVzZXIgPSBsb2dnZWRVc2VyO1xyXG5cclxuICAkc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgQXV0aFNlcnZpY2UubG9nb3V0KCk7XHJcbiAgfTtcclxuXHJcbiAgJHNjb3BlLmlzVXNlckxvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzVXNlckxvZ2dlZEluKCk7XHJcbiAgfTtcclxuXHJcbiAgJHN0YXRlLmdvKCdUaW1lRW50cmllcycpO1xyXG5cclxufTtcclxuXG59LHt9XSw4OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKCcuL2FwcCcpO1xyXG5cclxuYXBwLnZhbHVlKCdsb2dnZWRVc2VyJywge1xyXG4gIHVzZXJuYW1lOiAnJ1xyXG59KTtcclxuXHJcbmFwcC5jb25maWcoWyckaHR0cFByb3ZpZGVyJywgZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcclxuICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKGZ1bmN0aW9uICgkcSwgJGxvY2F0aW9uLCBsb2dnZWRVc2VyKSB7XHJcbiAgICByZXR1cm4ge1xyXG5cclxuICAgICAgcmVxdWVzdDogZnVuY3Rpb24gKGNvbmZpZykge1xyXG4gICAgICAgIGNvbmZpZy5oZWFkZXJzLmF1dGhUb2tlbiA9IGxvZ2dlZFVzZXIuYXV0aFRva2VuO1xyXG4gICAgICAgIHJldHVybiBjb25maWc7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICByZXNwb25zZTogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc3BvbnNlIDQwMVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlIHx8ICRxLndoZW4ocmVzcG9uc2UpO1xyXG4gICAgICB9LFxyXG4gICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVqZWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKHJlamVjdGlvbi5zdGF0dXMgPT09IDQwMSkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJSZXNwb25zZSBFcnJvciA0MDFcIiwgcmVqZWN0aW9uKTtcclxuICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvbG9naW4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZWplY3Rpb24pO1xyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuICB9KTtcclxufV0pXHJcbjtcclxuXHJcbmFwcC5ydW4oZnVuY3Rpb24gKFBlcm1pc3Npb24sIEF1dGhTZXJ2aWNlKSB7XHJcbiAgUGVybWlzc2lvbi5kZWZpbmVSb2xlKCdhbm9ueW1vdXMnLCBmdW5jdGlvbiAoc3RhdGVQYXJhbXMpIHtcclxuICAgIHJldHVybiAhQXV0aFNlcnZpY2UuaXNVc2VyTG9nZ2VkSW4oKTtcclxuICB9KTtcclxuICBQZXJtaXNzaW9uLmRlZmluZVJvbGUoJ3VzZXInLCBmdW5jdGlvbiAoc3RhdGVQYXJhbXMpIHtcclxuICAgIHJldHVybiBBdXRoU2VydmljZS5pc1VzZXJMb2dnZWRJbigpO1xyXG4gIH0pO1xyXG59KTtcbn0se1wiLi9hcHBcIjo5fV0sOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQVBQX05BTUUgPSAndGltZWJ1ZGR5JztcclxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKEFQUF9OQU1FLCBbJ3VpLnJvdXRlcicsICduZ1N0b3JhZ2UnLCAncGVybWlzc2lvbiddKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXBwO1xufSx7fV0sMTA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoJy4vYXBwJyk7XHJcblxyXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdUaW1lRW50cmllcycsIHtcclxuICAgIHVybDogJy8nLFxyXG4gICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9UaW1lRW50cmllcy9UaW1lRW50cmllcy5odG1sJyxcclxuICAgIGNvbnRyb2xsZXI6ICdUaW1lRW50cmllc0N0cmwnLFxyXG4gICAgZGF0YToge1xyXG4gICAgICBwZXJtaXNzaW9uczoge1xyXG4gICAgICAgIG9ubHk6IFsndXNlciddLFxyXG4gICAgICAgIHJlZGlyZWN0VG86IFwiTG9naW5cIlxyXG4gICAgICB9XHJcbiAgICAgIC8vcGVybWlzc2lvbnM6IHtcclxuICAgICAgLy8gIGV4Y2VwdDogWydhbm9ueW1vdXMnXSxcclxuICAgICAgLy8gIHJlZGlyZWN0VG86IFwiTG9naW5cIlxyXG4gICAgICAvL31cclxuICAgIH1cclxuICB9KTtcclxuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnTG9naW4nLCB7XHJcbiAgICB1cmw6ICcvbG9naW4nLFxyXG4gICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9Mb2dpbi9Mb2dpbi5odG1sJyxcclxuICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXHJcbiAgfSk7XHJcbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ1NpZ251cCcsIHtcclxuICAgIHVybDogJy9zaWdudXAnLFxyXG4gICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9Mb2dpbi9TaWdudXAvU2lnbnVwLmh0bWwnLFxyXG4gICAgY29udHJvbGxlcjogJ1NpZ251cEN0cmwnXHJcbiAgfSk7XHJcbn0pO1xyXG5cclxuXG59LHtcIi4vYXBwXCI6OX1dLDExOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbnZhciBhcHAgPSByZXF1aXJlKCcuL2FwcCcpO1xyXG5cclxuYXBwLmZhY3RvcnkoJ2xvYWRpbmcnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSkge1xyXG5cclxuICB2YXIgbG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICByZXR1cm4gZnVuY3Rpb24gKHByb21pc2UpIHtcclxuICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnbG9hZGluZ0V2ZW50JywgdHJ1ZSk7XHJcbiAgICBsb2FkaW5nID0gdHJ1ZTtcclxuICAgIHByb21pc2UuZmluYWxseShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGxvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdsb2FkaW5nRXZlbnQnLCBmYWxzZSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG59KTtcclxuXHJcbmFwcC5kaXJlY3RpdmUoJ3NwaW5uZXInLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICB0ZW1wbGF0ZTogJzxkaXYgbmctaWY9XCJsb2FkaW5nXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7IHJpZ2h0OiAwOyB0b3A6IDA7IHdpZHRoOiAyMDBweDsgYmFja2dyb3VuZC1jb2xvcjogIzAwMDsgY29sb3I6ICNmZmY7IHBhZGRpbmctbGVmdDogMTBweDtcIj5Mb2FkaW5nLi4uPC9kaXY+JyxcclxuICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICBzY29wZToge30sXHJcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgIHNjb3BlLiRvbignbG9hZGluZ0V2ZW50JywgZnVuY3Rpb24gKGV2ZW50LCBsb2FkaW5nKSB7XHJcbiAgICAgICAgc2NvcGUubG9hZGluZyA9IGxvYWRpbmc7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbn0pO1xyXG5cbn0se1wiLi9hcHBcIjo5fV19LHt9LFsxXSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=