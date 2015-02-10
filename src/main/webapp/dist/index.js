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
},{}],3:[function(require,module,exports){
'use strict';

var LoginCtrl = function ($scope, $stateParams, AuthService, $state) {

  $scope.user = {
    username: '',
    password: ''
  };

  $scope.login = function () {
    var promise = AuthService.login($scope.user);
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
module.exports = function ($scope, $state, AuthService, $localStorage) {

  $scope.username = $localStorage.username;

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

app.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push(function ($q, $location, $localStorage) {
    return {

      request: function (config) {
        config.headers.authToken = $localStorage.authToken;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBhcHAgPSByZXF1aXJlKCcuL3ZpZXdzL2FwcCcpO1xudmFyIHJvdXRlciA9IHJlcXVpcmUoJy4vdmlld3MvYXBwLnJvdXRlcicpO1xudmFyIGF1dGggPSByZXF1aXJlKCcuL3ZpZXdzL2FwcC5hdXRoJyk7XG5cbmFwcC5jb250cm9sbGVyKCdWaWV3Q3RybCcsIHJlcXVpcmUoJy4vdmlld3MvVmlldycpKTtcblxuYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgcmVxdWlyZSgnLi92aWV3cy9Mb2dpbi9BdXRoU2VydmljZScpKTtcbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCByZXF1aXJlKCcuL3ZpZXdzL0xvZ2luL0xvZ2luJykpO1xuYXBwLmNvbnRyb2xsZXIoJ1NpZ251cEN0cmwnLCByZXF1aXJlKCcuL3ZpZXdzL0xvZ2luL1NpZ251cC9TaWdudXAnKSk7XG5cbmFwcC5jb250cm9sbGVyKCdUaW1lRW50cmllc0N0cmwnLCByZXF1aXJlKCcuL3ZpZXdzL1RpbWVFbnRyaWVzL1RpbWVFbnRyaWVzJykpO1xuYXBwLnNlcnZpY2UoJ1RpbWVFbnRyaWVzU2VydmljZScsIHJlcXVpcmUoJy4vdmlld3MvVGltZUVudHJpZXMvVGltZUVudHJpZXNTZXJ2aWNlJykpO1xuXG52YXIgbG9hZGluZyA9IHJlcXVpcmUoJy4vdmlld3MvbG9hZGluZycpO1xuXG59LHtcIi4vdmlld3MvTG9naW4vQXV0aFNlcnZpY2VcIjoyLFwiLi92aWV3cy9Mb2dpbi9Mb2dpblwiOjMsXCIuL3ZpZXdzL0xvZ2luL1NpZ251cC9TaWdudXBcIjo0LFwiLi92aWV3cy9UaW1lRW50cmllcy9UaW1lRW50cmllc1wiOjUsXCIuL3ZpZXdzL1RpbWVFbnRyaWVzL1RpbWVFbnRyaWVzU2VydmljZVwiOjYsXCIuL3ZpZXdzL1ZpZXdcIjo3LFwiLi92aWV3cy9hcHBcIjo5LFwiLi92aWV3cy9hcHAuYXV0aFwiOjgsXCIuL3ZpZXdzL2FwcC5yb3V0ZXJcIjoxMCxcIi4vdmlld3MvbG9hZGluZ1wiOjExfV0sMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgQXV0aFNlcnZpY2UgPSBmdW5jdGlvbiAoJHEsICRodHRwLCAkc3RhdGUsICRsb2NhbFN0b3JhZ2UpIHtcclxuXHJcbiAgcmV0dXJuIHtcclxuXHJcbiAgICBpc1VzZXJMb2dnZWRJbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gYW5ndWxhci5pc0RlZmluZWQoJGxvY2FsU3RvcmFnZS5hdXRoVG9rZW4pICYmICRsb2NhbFN0b3JhZ2UuYXV0aFRva2VuICE9IG51bGwgJiYgJGxvY2FsU3RvcmFnZS5hdXRoVG9rZW4gIT09ICcnO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaWdudXA6IGZ1bmN0aW9uICh1c2VyKSB7XHJcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXV0aC9yZWdpc3RlcicsIHVzZXIpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2dpbjogZnVuY3Rpb24gKHVzZXIpIHtcclxuICAgICAgdGhpcy5sb2dvdXQoKTtcclxuXHJcbiAgICAgIHZhciBwcm9taXNlID0gJGh0dHAucG9zdCgnL2F1dGgvbG9naW4nLCB1c2VyKTtcclxuXHJcbiAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAkbG9jYWxTdG9yYWdlLnVzZXJuYW1lID0gdXNlci51c2VybmFtZTtcclxuICAgICAgICAkbG9jYWxTdG9yYWdlLmF1dGhUb2tlbiA9IHJlc3BvbnNlLmRhdGEuYXV0aFRva2VuO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2dvdXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuICAgICAgJGxvY2FsU3RvcmFnZS51c2VybmFtZSA9IG51bGw7XHJcbiAgICAgICRsb2NhbFN0b3JhZ2UuYXV0aFRva2VuID0gbnVsbDtcclxuICAgICAgJHN0YXRlLmdvKCdMb2dpbicpO1xyXG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XHJcbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXV0aFNlcnZpY2U7XG59LHt9XSwzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBMb2dpbkN0cmwgPSBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcclxuXHJcbiAgJHNjb3BlLnVzZXIgPSB7XHJcbiAgICB1c2VybmFtZTogJycsXHJcbiAgICBwYXNzd29yZDogJydcclxuICB9O1xyXG5cclxuICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgcHJvbWlzZSA9IEF1dGhTZXJ2aWNlLmxvZ2luKCRzY29wZS51c2VyKTtcclxuICAgIHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICRzdGF0ZS5nbygnVGltZUVudHJpZXMnKTtcclxuICAgIH0sIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAkc2NvcGUuZXJyb3IgPSByZXNwb25zZS5kYXRhLm1lc3NhZ2U7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTG9naW5DdHJsO1xufSx7fV0sNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgU2lnbnVwQ3RybCA9IGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgQXV0aFNlcnZpY2UpIHtcclxuXHJcbiAgJHNjb3BlLnNpZ25lZFVwID0gZmFsc2U7XHJcblxyXG4gICRzY29wZS5zaWdudXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoJHNjb3BlLnVzZXIucGFzc3dvcmQxICE9PSAkc2NvcGUudXNlci5wYXNzd29yZDIpIHtcclxuICAgICAgJHNjb3BlLmVycm9yID0gXCJQYXNzd29yZHMgbXVzdCBtYXRjaFwiO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICAkc2NvcGUudXNlci5wYXNzd29yZCA9ICRzY29wZS51c2VyLnBhc3N3b3JkMTtcclxuICAgIHZhciBwcm9taXNlID0gQXV0aFNlcnZpY2Uuc2lnbnVwKCRzY29wZS51c2VyKTtcclxuICAgIHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICRzY29wZS5zaWduZWRVcCA9IHRydWU7XHJcbiAgICB9LCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgJHNjb3BlLmVycm9yID0gcmVzcG9uc2UuZGF0YS5tZXNzYWdlO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNpZ251cEN0cmw7XG59LHt9XSw1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCRzY29wZSwgJGludGVydmFsLCBUaW1lRW50cmllc1NlcnZpY2UpIHtcclxuXHJcbiAgdmFyIHNlY29uZHNJbnRlcnZhbCA9IG51bGw7XHJcbiAgdmFyIHRpY2tTZWNvbmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbSA9IG1vbWVudCgpO1xyXG4gICAgJHNjb3BlLnRpbWVFbnRyaWVzLmZvckVhY2goZnVuY3Rpb24gKHRpbWVFbnRyeSkge1xyXG4gICAgICAvL3RpbWVFbnRyeS50aW1lID0gbS51dGNPZmZzZXQodGltZUVudHJ5LmN1cnJlbnRUaW1lLnN1YnN0cmluZyh0aW1lRW50cnkuY3VycmVudFRpbWUubGVuZ3RoIC0gNikpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbTpzcycpO1xyXG4gICAgICB0aW1lRW50cnkudGltZSA9IG0udXRjT2Zmc2V0KHRpbWVFbnRyeS50aW1lem9uZSkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOm1tOnNzJyk7XHJcbiAgICB9KTtcclxuICB9O1xyXG4gICRzY29wZS4kb24oXCIkZGVzdHJveVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgJGludGVydmFsLmNhbmNlbChzZWNvbmRzSW50ZXJ2YWwpO1xyXG4gICAgfVxyXG4gICk7XHJcblxyXG4gICRzY29wZS50aW1lRW50cmllcyA9IFtdO1xyXG4gIHZhciByZWZyZXNoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgVGltZUVudHJpZXNTZXJ2aWNlLmxpc3QoKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAvLyRzY29wZS50aW1lRW50cmllcyA9IHJlc3BvbnNlLmRhdGE7XHJcblxyXG4gICAgICAkc2NvcGUudGltZUVudHJpZXMgPSByZXNwb25zZS5kYXRhLm1hcChmdW5jdGlvbiAodGltZUVudHJ5KSB7XHJcbiAgICAgICAgLy92YXIgbSA9IG1vbWVudCh0aW1lRW50cnkuY3VycmVudFRpbWUpO1xyXG4gICAgICAgIHZhciBtID0gbW9tZW50KCk7XHJcbiAgICAgICAgdGltZUVudHJ5LnRpbWUgPSBtLnV0Y09mZnNldCh0aW1lRW50cnkudGltZXpvbmUpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbTpzcycpO1xyXG4gICAgICAgIHJldHVybiB0aW1lRW50cnk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgJGludGVydmFsLmNhbmNlbChzZWNvbmRzSW50ZXJ2YWwpO1xyXG4gICAgICBzZWNvbmRzSW50ZXJ2YWwgPSAkaW50ZXJ2YWwodGlja1NlY29uZCwgMTAwMCk7XHJcbiAgICB9KTtcclxuICB9O1xyXG4gIHJlZnJlc2goKTtcclxuXHJcbiAgJHNjb3BlLmVkaXRNb2RlID0gZmFsc2U7XHJcbiAgJHNjb3BlLnRpbWVFbnRyeSA9IHt9O1xyXG4gICRzY29wZS50aW1lem9uZU9wdGlvbnMgPSB7XHJcbiAgICBzaWduOiAnKycsXHJcbiAgICBob3VyOiAnMDAnLFxyXG4gICAgbWludXRlOiAnMDAnLFxyXG4gICAgaG91cnM6IEFycmF5LmFwcGx5KG51bGwsIEFycmF5KDI1KSkubWFwKGZ1bmN0aW9uIChfLCBpKSB7XHJcbiAgICAgIHJldHVybiAoXCIwXCIgKyBpKS5zbGljZSgtMik7XHJcbiAgICB9KSxcclxuICAgIG1pbnV0ZXM6IFsnMDAnLCAnMzAnXVxyXG4gIH07XHJcblxyXG4gICRzY29wZS5zYXZlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJHNjb3BlLnRpbWVFbnRyeS50aW1lem9uZSA9ICRzY29wZS50aW1lem9uZU9wdGlvbnMuc2lnbiArICRzY29wZS50aW1lem9uZU9wdGlvbnMuaG91ciArIFwiOlwiICsgJHNjb3BlLnRpbWV6b25lT3B0aW9ucy5taW51dGU7XHJcbiAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoJHNjb3BlLnRpbWVFbnRyeS5pZCkpIHtcclxuICAgICAgVGltZUVudHJpZXNTZXJ2aWNlLnVwZGF0ZSgkc2NvcGUudGltZUVudHJ5KS50aGVuKHJlZnJlc2gpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgVGltZUVudHJpZXNTZXJ2aWNlLmNyZWF0ZSgkc2NvcGUudGltZUVudHJ5KS50aGVuKHJlZnJlc2gpO1xyXG4gICAgfVxyXG4gICAgJHNjb3BlLnRpbWVFbnRyeSA9IHt9O1xyXG4gICAgJHNjb3BlLmVkaXRNb2RlID0gZmFsc2U7XHJcbiAgfTtcclxuICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgYW5ndWxhci5jb3B5KHt9LCAkc2NvcGUudGltZUVudHJ5KTtcclxuICAgICRzY29wZS5lZGl0TW9kZSA9IGZhbHNlO1xyXG4gIH07XHJcblxyXG4gICRzY29wZS5kZWxldGUgPSBmdW5jdGlvbiAodGltZUVudHJ5KSB7XHJcbiAgICBUaW1lRW50cmllc1NlcnZpY2UuZGVsZXRlKHRpbWVFbnRyeS5pZCkudGhlbihyZWZyZXNoKTtcclxuICAgICRzY29wZS50aW1lRW50cnkgPSB7fTtcclxuICAgICRzY29wZS5lZGl0TW9kZSA9IGZhbHNlO1xyXG4gIH07XHJcblxyXG4gICRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKHRpbWVFbnRyeSkge1xyXG4gICAgYW5ndWxhci5jb3B5KHRpbWVFbnRyeSwgJHNjb3BlLnRpbWVFbnRyeSk7XHJcbiAgICBpZiAoJHNjb3BlLnRpbWVFbnRyeS50aW1lem9uZSkge1xyXG4gICAgICAkc2NvcGUudGltZXpvbmVPcHRpb25zLnNpZ24gPSAkc2NvcGUudGltZUVudHJ5LnRpbWV6b25lLnN1YnN0cmluZygwLCAxKTtcclxuICAgICAgJHNjb3BlLnRpbWV6b25lT3B0aW9ucy5ob3VyID0gJHNjb3BlLnRpbWVFbnRyeS50aW1lem9uZS5zdWJzdHJpbmcoMSwgMyk7XHJcbiAgICAgICRzY29wZS50aW1lem9uZU9wdGlvbnMubWludXRlID0gJHNjb3BlLnRpbWVFbnRyeS50aW1lem9uZS5zdWJzdHJpbmcoNCwgNik7XHJcbiAgICB9XHJcbiAgICAkc2NvcGUuZWRpdE1vZGUgPSB0cnVlO1xyXG4gIH07XHJcblxyXG59XHJcbjtcclxuXG59LHt9XSw2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCRodHRwLCBsb2FkaW5nKSB7XHJcblxyXG4gIHJldHVybiB7XHJcblxyXG4gICAgbGlzdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgcHJvbWlzZSA9ICRodHRwLmdldCgnL3RpbWVFbnRyeScpO1xyXG4gICAgICBsb2FkaW5nKHByb21pc2UpO1xyXG4gICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0OiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgdmFyIHByb21pc2UgPSAkaHR0cC5nZXQoJy90aW1lRW50cnkvJyArIGlkKTtcclxuICAgICAgbG9hZGluZyhwcm9taXNlKTtcclxuICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGNyZWF0ZTogZnVuY3Rpb24gKHRpbWVFbnRyeSkge1xyXG4gICAgICB2YXIgcHJvbWlzZSA9ICRodHRwLnBvc3QoJy90aW1lRW50cnkvJywgdGltZUVudHJ5KTtcclxuICAgICAgbG9hZGluZyhwcm9taXNlKTtcclxuICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIHVwZGF0ZTogZnVuY3Rpb24gKHRpbWVFbnRyeSkge1xyXG4gICAgICB2YXIgcHJvbWlzZSA9ICRodHRwLnB1dCgnL3RpbWVFbnRyeS8nICsgdGltZUVudHJ5LmlkLCB0aW1lRW50cnkpO1xyXG4gICAgICBsb2FkaW5nKHByb21pc2UpO1xyXG4gICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgIH0sXHJcblxyXG4gICAgZGVsZXRlOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgdmFyIHByb21pc2UgPSAkaHR0cC5kZWxldGUoJy90aW1lRW50cnkvJyArIGlkKTtcclxuICAgICAgbG9hZGluZyhwcm9taXNlKTtcclxuICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG59O1xyXG5cbn0se31dLDc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlLCAkbG9jYWxTdG9yYWdlKSB7XHJcblxyXG4gICRzY29wZS51c2VybmFtZSA9ICRsb2NhbFN0b3JhZ2UudXNlcm5hbWU7XHJcblxyXG4gICRzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBBdXRoU2VydmljZS5sb2dvdXQoKTtcclxuICB9O1xyXG5cclxuICAkc2NvcGUuaXNVc2VyTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNVc2VyTG9nZ2VkSW4oKTtcclxuICB9O1xyXG5cclxuICAkc3RhdGUuZ28oJ1RpbWVFbnRyaWVzJyk7XHJcblxyXG59O1xyXG5cbn0se31dLDg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGFwcCA9IHJlcXVpcmUoJy4vYXBwJyk7XHJcblxyXG5hcHAuY29uZmlnKFsnJGh0dHBQcm92aWRlcicsIGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XHJcbiAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChmdW5jdGlvbiAoJHEsICRsb2NhdGlvbiwgJGxvY2FsU3RvcmFnZSkge1xyXG4gICAgcmV0dXJuIHtcclxuXHJcbiAgICAgIHJlcXVlc3Q6IGZ1bmN0aW9uIChjb25maWcpIHtcclxuICAgICAgICBjb25maWcuaGVhZGVycy5hdXRoVG9rZW4gPSAkbG9jYWxTdG9yYWdlLmF1dGhUb2tlbjtcclxuICAgICAgICByZXR1cm4gY29uZmlnO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgcmVzcG9uc2U6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJSZXNwb25zZSA0MDFcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXNwb25zZSB8fCAkcS53aGVuKHJlc3BvbnNlKTtcclxuICAgICAgfSxcclxuICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlamVjdGlvbikge1xyXG4gICAgICAgIGlmIChyZWplY3Rpb24uc3RhdHVzID09PSA0MDEpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzcG9uc2UgRXJyb3IgNDAxXCIsIHJlamVjdGlvbik7XHJcbiAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnL2xvZ2luJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAkcS5yZWplY3QocmVqZWN0aW9uKTtcclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcbiAgfSk7XHJcbn1dKVxyXG47XHJcblxyXG5hcHAucnVuKGZ1bmN0aW9uIChQZXJtaXNzaW9uLCBBdXRoU2VydmljZSkge1xyXG4gIFBlcm1pc3Npb24uZGVmaW5lUm9sZSgnYW5vbnltb3VzJywgZnVuY3Rpb24gKHN0YXRlUGFyYW1zKSB7XHJcbiAgICByZXR1cm4gIUF1dGhTZXJ2aWNlLmlzVXNlckxvZ2dlZEluKCk7XHJcbiAgfSk7XHJcbiAgUGVybWlzc2lvbi5kZWZpbmVSb2xlKCd1c2VyJywgZnVuY3Rpb24gKHN0YXRlUGFyYW1zKSB7XHJcbiAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNVc2VyTG9nZ2VkSW4oKTtcclxuICB9KTtcclxufSk7XG59LHtcIi4vYXBwXCI6OX1dLDk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFQUF9OQU1FID0gJ3RpbWVidWRkeSc7XHJcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZShBUFBfTkFNRSwgWyd1aS5yb3V0ZXInLCAnbmdTdG9yYWdlJywgJ3Blcm1pc3Npb24nXSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFwcDtcbn0se31dLDEwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKCcuL2FwcCcpO1xyXG5cclxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnVGltZUVudHJpZXMnLCB7XHJcbiAgICB1cmw6ICcvJyxcclxuICAgIHRlbXBsYXRlVXJsOiAndmlld3MvVGltZUVudHJpZXMvVGltZUVudHJpZXMuaHRtbCcsXHJcbiAgICBjb250cm9sbGVyOiAnVGltZUVudHJpZXNDdHJsJyxcclxuICAgIGRhdGE6IHtcclxuICAgICAgcGVybWlzc2lvbnM6IHtcclxuICAgICAgICBvbmx5OiBbJ3VzZXInXSxcclxuICAgICAgICByZWRpcmVjdFRvOiBcIkxvZ2luXCJcclxuICAgICAgfVxyXG4gICAgICAvL3Blcm1pc3Npb25zOiB7XHJcbiAgICAgIC8vICBleGNlcHQ6IFsnYW5vbnltb3VzJ10sXHJcbiAgICAgIC8vICByZWRpcmVjdFRvOiBcIkxvZ2luXCJcclxuICAgICAgLy99XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ0xvZ2luJywge1xyXG4gICAgdXJsOiAnL2xvZ2luJyxcclxuICAgIHRlbXBsYXRlVXJsOiAndmlld3MvTG9naW4vTG9naW4uaHRtbCcsXHJcbiAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xyXG4gIH0pO1xyXG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdTaWdudXAnLCB7XHJcbiAgICB1cmw6ICcvc2lnbnVwJyxcclxuICAgIHRlbXBsYXRlVXJsOiAndmlld3MvTG9naW4vU2lnbnVwL1NpZ251cC5odG1sJyxcclxuICAgIGNvbnRyb2xsZXI6ICdTaWdudXBDdHJsJ1xyXG4gIH0pO1xyXG59KTtcclxuXHJcblxufSx7XCIuL2FwcFwiOjl9XSwxMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgYXBwID0gcmVxdWlyZSgnLi9hcHAnKTtcclxuXHJcbmFwcC5mYWN0b3J5KCdsb2FkaW5nJywgZnVuY3Rpb24gKCRyb290U2NvcGUpIHtcclxuXHJcbiAgdmFyIGxvYWRpbmcgPSBmYWxzZTtcclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uIChwcm9taXNlKSB7XHJcbiAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2xvYWRpbmdFdmVudCcsIHRydWUpO1xyXG4gICAgbG9hZGluZyA9IHRydWU7XHJcbiAgICBwcm9taXNlLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICBsb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnbG9hZGluZ0V2ZW50JywgZmFsc2UpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxufSk7XHJcblxyXG5hcHAuZGlyZWN0aXZlKCdzcGlubmVyJywgZnVuY3Rpb24gKCkge1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgdGVtcGxhdGU6ICc8ZGl2IG5nLWlmPVwibG9hZGluZ1wiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyByaWdodDogMDsgdG9wOiAwOyB3aWR0aDogMjAwcHg7IGJhY2tncm91bmQtY29sb3I6ICMwMDA7IGNvbG9yOiAjZmZmOyBwYWRkaW5nLWxlZnQ6IDEwcHg7XCI+TG9hZGluZy4uLjwvZGl2PicsXHJcbiAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgc2NvcGU6IHt9LFxyXG4gICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICBzY29wZS4kb24oJ2xvYWRpbmdFdmVudCcsIGZ1bmN0aW9uIChldmVudCwgbG9hZGluZykge1xyXG4gICAgICAgIHNjb3BlLmxvYWRpbmcgPSBsb2FkaW5nO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG59KTtcclxuXG59LHtcIi4vYXBwXCI6OX1dfSx7fSxbMV0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9