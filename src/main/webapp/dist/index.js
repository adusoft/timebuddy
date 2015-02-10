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

  $scope.delete = function () {
    TimeEntriesService.delete($scope.timeEntry.id).then(refresh);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBhcHAgPSByZXF1aXJlKCcuL3ZpZXdzL2FwcCcpO1xudmFyIHJvdXRlciA9IHJlcXVpcmUoJy4vdmlld3MvYXBwLnJvdXRlcicpO1xudmFyIGF1dGggPSByZXF1aXJlKCcuL3ZpZXdzL2FwcC5hdXRoJyk7XG5cbmFwcC5jb250cm9sbGVyKCdWaWV3Q3RybCcsIHJlcXVpcmUoJy4vdmlld3MvVmlldycpKTtcblxuYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgcmVxdWlyZSgnLi92aWV3cy9Mb2dpbi9BdXRoU2VydmljZScpKTtcbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCByZXF1aXJlKCcuL3ZpZXdzL0xvZ2luL0xvZ2luJykpO1xuYXBwLmNvbnRyb2xsZXIoJ1NpZ251cEN0cmwnLCByZXF1aXJlKCcuL3ZpZXdzL0xvZ2luL1NpZ251cC9TaWdudXAnKSk7XG5cbmFwcC5jb250cm9sbGVyKCdUaW1lRW50cmllc0N0cmwnLCByZXF1aXJlKCcuL3ZpZXdzL1RpbWVFbnRyaWVzL1RpbWVFbnRyaWVzJykpO1xuYXBwLnNlcnZpY2UoJ1RpbWVFbnRyaWVzU2VydmljZScsIHJlcXVpcmUoJy4vdmlld3MvVGltZUVudHJpZXMvVGltZUVudHJpZXNTZXJ2aWNlJykpO1xuXG52YXIgbG9hZGluZyA9IHJlcXVpcmUoJy4vdmlld3MvbG9hZGluZycpO1xuXG59LHtcIi4vdmlld3MvTG9naW4vQXV0aFNlcnZpY2VcIjoyLFwiLi92aWV3cy9Mb2dpbi9Mb2dpblwiOjMsXCIuL3ZpZXdzL0xvZ2luL1NpZ251cC9TaWdudXBcIjo0LFwiLi92aWV3cy9UaW1lRW50cmllcy9UaW1lRW50cmllc1wiOjUsXCIuL3ZpZXdzL1RpbWVFbnRyaWVzL1RpbWVFbnRyaWVzU2VydmljZVwiOjYsXCIuL3ZpZXdzL1ZpZXdcIjo3LFwiLi92aWV3cy9hcHBcIjo5LFwiLi92aWV3cy9hcHAuYXV0aFwiOjgsXCIuL3ZpZXdzL2FwcC5yb3V0ZXJcIjoxMCxcIi4vdmlld3MvbG9hZGluZ1wiOjExfV0sMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgQXV0aFNlcnZpY2UgPSBmdW5jdGlvbiAoJHEsICRodHRwLCAkc3RhdGUsICRsb2NhbFN0b3JhZ2UpIHtcclxuXHJcbiAgcmV0dXJuIHtcclxuXHJcbiAgICBpc1VzZXJMb2dnZWRJbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gYW5ndWxhci5pc0RlZmluZWQoJGxvY2FsU3RvcmFnZS5hdXRoVG9rZW4pICYmICRsb2NhbFN0b3JhZ2UuYXV0aFRva2VuICE9IG51bGwgJiYgJGxvY2FsU3RvcmFnZS5hdXRoVG9rZW4gIT09ICcnO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaWdudXA6IGZ1bmN0aW9uICh1c2VyKSB7XHJcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXV0aC9yZWdpc3RlcicsIHVzZXIpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2dpbjogZnVuY3Rpb24gKHVzZXIpIHtcclxuICAgICAgdGhpcy5sb2dvdXQoKTtcclxuXHJcbiAgICAgIHZhciBwcm9taXNlID0gJGh0dHAucG9zdCgnL2F1dGgvbG9naW4nLCB1c2VyKTtcclxuXHJcbiAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAkbG9jYWxTdG9yYWdlLnVzZXJuYW1lID0gdXNlci51c2VybmFtZTtcclxuICAgICAgICAkbG9jYWxTdG9yYWdlLmF1dGhUb2tlbiA9IHJlc3BvbnNlLmRhdGEuYXV0aFRva2VuO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2dvdXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuICAgICAgJGxvY2FsU3RvcmFnZS51c2VybmFtZSA9IG51bGw7XHJcbiAgICAgICRsb2NhbFN0b3JhZ2UuYXV0aFRva2VuID0gbnVsbDtcclxuICAgICAgJHN0YXRlLmdvKCdMb2dpbicpO1xyXG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XHJcbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXV0aFNlcnZpY2U7XG59LHt9XSwzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBMb2dpbkN0cmwgPSBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcclxuXHJcbiAgJHNjb3BlLnVzZXIgPSB7XHJcbiAgICB1c2VybmFtZTogJycsXHJcbiAgICBwYXNzd29yZDogJydcclxuICB9O1xyXG5cclxuICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgcHJvbWlzZSA9IEF1dGhTZXJ2aWNlLmxvZ2luKCRzY29wZS51c2VyKTtcclxuICAgIHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICRzdGF0ZS5nbygnVGltZUVudHJpZXMnKTtcclxuICAgIH0sIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAkc2NvcGUuZXJyb3IgPSByZXNwb25zZS5kYXRhLm1lc3NhZ2U7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTG9naW5DdHJsO1xufSx7fV0sNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgU2lnbnVwQ3RybCA9IGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgQXV0aFNlcnZpY2UpIHtcclxuXHJcbiAgJHNjb3BlLnNpZ25lZFVwID0gZmFsc2U7XHJcblxyXG4gICRzY29wZS5zaWdudXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoJHNjb3BlLnVzZXIucGFzc3dvcmQxICE9PSAkc2NvcGUudXNlci5wYXNzd29yZDIpIHtcclxuICAgICAgJHNjb3BlLmVycm9yID0gXCJQYXNzd29yZHMgbXVzdCBtYXRjaFwiO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICAkc2NvcGUudXNlci5wYXNzd29yZCA9ICRzY29wZS51c2VyLnBhc3N3b3JkMTtcclxuICAgIHZhciBwcm9taXNlID0gQXV0aFNlcnZpY2Uuc2lnbnVwKCRzY29wZS51c2VyKTtcclxuICAgIHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICRzY29wZS5zaWduZWRVcCA9IHRydWU7XHJcbiAgICB9LCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgJHNjb3BlLmVycm9yID0gcmVzcG9uc2UuZGF0YS5tZXNzYWdlO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNpZ251cEN0cmw7XG59LHt9XSw1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCRzY29wZSwgJGludGVydmFsLCBUaW1lRW50cmllc1NlcnZpY2UpIHtcclxuXHJcbiAgdmFyIHNlY29uZHNJbnRlcnZhbCA9IG51bGw7XHJcbiAgdmFyIHRpY2tTZWNvbmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbSA9IG1vbWVudCgpO1xyXG4gICAgJHNjb3BlLnRpbWVFbnRyaWVzLmZvckVhY2goZnVuY3Rpb24gKHRpbWVFbnRyeSkge1xyXG4gICAgICAvL3RpbWVFbnRyeS50aW1lID0gbS51dGNPZmZzZXQodGltZUVudHJ5LmN1cnJlbnRUaW1lLnN1YnN0cmluZyh0aW1lRW50cnkuY3VycmVudFRpbWUubGVuZ3RoIC0gNikpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbTpzcycpO1xyXG4gICAgICB0aW1lRW50cnkudGltZSA9IG0udXRjT2Zmc2V0KHRpbWVFbnRyeS50aW1lem9uZSkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOm1tOnNzJyk7XHJcbiAgICB9KTtcclxuICB9O1xyXG4gICRzY29wZS4kb24oXCIkZGVzdHJveVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgJGludGVydmFsLmNhbmNlbChzZWNvbmRzSW50ZXJ2YWwpO1xyXG4gICAgfVxyXG4gICk7XHJcblxyXG4gICRzY29wZS50aW1lRW50cmllcyA9IFtdO1xyXG4gIHZhciByZWZyZXNoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgVGltZUVudHJpZXNTZXJ2aWNlLmxpc3QoKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAvLyRzY29wZS50aW1lRW50cmllcyA9IHJlc3BvbnNlLmRhdGE7XHJcblxyXG4gICAgICAkc2NvcGUudGltZUVudHJpZXMgPSByZXNwb25zZS5kYXRhLm1hcChmdW5jdGlvbiAodGltZUVudHJ5KSB7XHJcbiAgICAgICAgLy92YXIgbSA9IG1vbWVudCh0aW1lRW50cnkuY3VycmVudFRpbWUpO1xyXG4gICAgICAgIHZhciBtID0gbW9tZW50KCk7XHJcbiAgICAgICAgdGltZUVudHJ5LnRpbWUgPSBtLnV0Y09mZnNldCh0aW1lRW50cnkudGltZXpvbmUpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbTpzcycpO1xyXG4gICAgICAgIHJldHVybiB0aW1lRW50cnk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgJGludGVydmFsLmNhbmNlbChzZWNvbmRzSW50ZXJ2YWwpO1xyXG4gICAgICBzZWNvbmRzSW50ZXJ2YWwgPSAkaW50ZXJ2YWwodGlja1NlY29uZCwgMTAwMCk7XHJcbiAgICB9KTtcclxuICB9O1xyXG4gIHJlZnJlc2goKTtcclxuXHJcbiAgJHNjb3BlLmVkaXRNb2RlID0gZmFsc2U7XHJcbiAgJHNjb3BlLnRpbWVFbnRyeSA9IHt9O1xyXG4gICRzY29wZS50aW1lem9uZU9wdGlvbnMgPSB7XHJcbiAgICBzaWduOiAnKycsXHJcbiAgICBob3VyOiAnMDAnLFxyXG4gICAgbWludXRlOiAnMDAnLFxyXG4gICAgaG91cnM6IEFycmF5LmFwcGx5KG51bGwsIEFycmF5KDI1KSkubWFwKGZ1bmN0aW9uIChfLCBpKSB7XHJcbiAgICAgIHJldHVybiAoXCIwXCIgKyBpKS5zbGljZSgtMik7XHJcbiAgICB9KSxcclxuICAgIG1pbnV0ZXM6IFsnMDAnLCAnMzAnXVxyXG4gIH07XHJcblxyXG4gICRzY29wZS5zYXZlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJHNjb3BlLnRpbWVFbnRyeS50aW1lem9uZSA9ICRzY29wZS50aW1lem9uZU9wdGlvbnMuc2lnbiArICRzY29wZS50aW1lem9uZU9wdGlvbnMuaG91ciArIFwiOlwiICsgJHNjb3BlLnRpbWV6b25lT3B0aW9ucy5taW51dGU7XHJcbiAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoJHNjb3BlLnRpbWVFbnRyeS5pZCkpIHtcclxuICAgICAgVGltZUVudHJpZXNTZXJ2aWNlLnVwZGF0ZSgkc2NvcGUudGltZUVudHJ5KS50aGVuKHJlZnJlc2gpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgVGltZUVudHJpZXNTZXJ2aWNlLmNyZWF0ZSgkc2NvcGUudGltZUVudHJ5KS50aGVuKHJlZnJlc2gpO1xyXG4gICAgfVxyXG4gICAgJHNjb3BlLnRpbWVFbnRyeSA9IHt9O1xyXG4gICAgJHNjb3BlLmVkaXRNb2RlID0gZmFsc2U7XHJcbiAgfTtcclxuICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgYW5ndWxhci5jb3B5KHt9LCAkc2NvcGUudGltZUVudHJ5KTtcclxuICAgICRzY29wZS5lZGl0TW9kZSA9IGZhbHNlO1xyXG4gIH07XHJcblxyXG4gICRzY29wZS5kZWxldGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBUaW1lRW50cmllc1NlcnZpY2UuZGVsZXRlKCRzY29wZS50aW1lRW50cnkuaWQpLnRoZW4ocmVmcmVzaCk7XHJcbiAgICAkc2NvcGUudGltZUVudHJ5ID0ge307XHJcbiAgICAkc2NvcGUuZWRpdE1vZGUgPSBmYWxzZTtcclxuICB9O1xyXG5cclxuICAkc2NvcGUuZWRpdCA9IGZ1bmN0aW9uICh0aW1lRW50cnkpIHtcclxuICAgIGFuZ3VsYXIuY29weSh0aW1lRW50cnksICRzY29wZS50aW1lRW50cnkpO1xyXG4gICAgaWYgKCRzY29wZS50aW1lRW50cnkudGltZXpvbmUpIHtcclxuICAgICAgJHNjb3BlLnRpbWV6b25lT3B0aW9ucy5zaWduID0gJHNjb3BlLnRpbWVFbnRyeS50aW1lem9uZS5zdWJzdHJpbmcoMCwgMSk7XHJcbiAgICAgICRzY29wZS50aW1lem9uZU9wdGlvbnMuaG91ciA9ICRzY29wZS50aW1lRW50cnkudGltZXpvbmUuc3Vic3RyaW5nKDEsIDMpO1xyXG4gICAgICAkc2NvcGUudGltZXpvbmVPcHRpb25zLm1pbnV0ZSA9ICRzY29wZS50aW1lRW50cnkudGltZXpvbmUuc3Vic3RyaW5nKDQsIDYpO1xyXG4gICAgfVxyXG4gICAgJHNjb3BlLmVkaXRNb2RlID0gdHJ1ZTtcclxuICB9O1xyXG5cclxufVxyXG47XHJcblxufSx7fV0sNjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgkaHR0cCwgbG9hZGluZykge1xyXG5cclxuICByZXR1cm4ge1xyXG5cclxuICAgIGxpc3Q6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHByb21pc2UgPSAkaHR0cC5nZXQoJy90aW1lRW50cnknKTtcclxuICAgICAgbG9hZGluZyhwcm9taXNlKTtcclxuICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldDogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgIHZhciBwcm9taXNlID0gJGh0dHAuZ2V0KCcvdGltZUVudHJ5LycgKyBpZCk7XHJcbiAgICAgIGxvYWRpbmcocHJvbWlzZSk7XHJcbiAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBjcmVhdGU6IGZ1bmN0aW9uICh0aW1lRW50cnkpIHtcclxuICAgICAgdmFyIHByb21pc2UgPSAkaHR0cC5wb3N0KCcvdGltZUVudHJ5LycsIHRpbWVFbnRyeSk7XHJcbiAgICAgIGxvYWRpbmcocHJvbWlzZSk7XHJcbiAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgfSxcclxuXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uICh0aW1lRW50cnkpIHtcclxuICAgICAgdmFyIHByb21pc2UgPSAkaHR0cC5wdXQoJy90aW1lRW50cnkvJyArIHRpbWVFbnRyeS5pZCwgdGltZUVudHJ5KTtcclxuICAgICAgbG9hZGluZyhwcm9taXNlKTtcclxuICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGRlbGV0ZTogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgIHZhciBwcm9taXNlID0gJGh0dHAuZGVsZXRlKCcvdGltZUVudHJ5LycgKyBpZCk7XHJcbiAgICAgIGxvYWRpbmcocHJvbWlzZSk7XHJcbiAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxufTtcclxuXG59LHt9XSw3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBBdXRoU2VydmljZSwgJGxvY2FsU3RvcmFnZSkge1xyXG5cclxuICAkc2NvcGUudXNlcm5hbWUgPSAkbG9jYWxTdG9yYWdlLnVzZXJuYW1lO1xyXG5cclxuICAkc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgQXV0aFNlcnZpY2UubG9nb3V0KCk7XHJcbiAgfTtcclxuXHJcbiAgJHNjb3BlLmlzVXNlckxvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzVXNlckxvZ2dlZEluKCk7XHJcbiAgfTtcclxuXHJcbiAgJHN0YXRlLmdvKCdUaW1lRW50cmllcycpO1xyXG5cclxufTtcclxuXG59LHt9XSw4OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBhcHAgPSByZXF1aXJlKCcuL2FwcCcpO1xyXG5cclxuYXBwLmNvbmZpZyhbJyRodHRwUHJvdmlkZXInLCBmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xyXG4gICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goZnVuY3Rpb24gKCRxLCAkbG9jYXRpb24sICRsb2NhbFN0b3JhZ2UpIHtcclxuICAgIHJldHVybiB7XHJcblxyXG4gICAgICByZXF1ZXN0OiBmdW5jdGlvbiAoY29uZmlnKSB7XHJcbiAgICAgICAgY29uZmlnLmhlYWRlcnMuYXV0aFRva2VuID0gJGxvY2FsU3RvcmFnZS5hdXRoVG9rZW47XHJcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuICAgICAgfSxcclxuXHJcbiAgICAgIHJlc3BvbnNlOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzcG9uc2UgNDAxXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzcG9uc2UgfHwgJHEud2hlbihyZXNwb25zZSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZWplY3Rpb24pIHtcclxuICAgICAgICBpZiAocmVqZWN0aW9uLnN0YXR1cyA9PT0gNDAxKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc3BvbnNlIEVycm9yIDQwMVwiLCByZWplY3Rpb24pO1xyXG4gICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy9sb2dpbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlamVjdGlvbik7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG4gIH0pO1xyXG59XSlcclxuO1xyXG5cclxuYXBwLnJ1bihmdW5jdGlvbiAoUGVybWlzc2lvbiwgQXV0aFNlcnZpY2UpIHtcclxuICBQZXJtaXNzaW9uLmRlZmluZVJvbGUoJ2Fub255bW91cycsIGZ1bmN0aW9uIChzdGF0ZVBhcmFtcykge1xyXG4gICAgcmV0dXJuICFBdXRoU2VydmljZS5pc1VzZXJMb2dnZWRJbigpO1xyXG4gIH0pO1xyXG4gIFBlcm1pc3Npb24uZGVmaW5lUm9sZSgndXNlcicsIGZ1bmN0aW9uIChzdGF0ZVBhcmFtcykge1xyXG4gICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzVXNlckxvZ2dlZEluKCk7XHJcbiAgfSk7XHJcbn0pO1xufSx7XCIuL2FwcFwiOjl9XSw5OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBUFBfTkFNRSA9ICd0aW1lYnVkZHknO1xyXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoQVBQX05BTUUsIFsndWkucm91dGVyJywgJ25nU3RvcmFnZScsICdwZXJtaXNzaW9uJ10pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcHA7XG59LHt9XSwxMDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgYXBwID0gcmVxdWlyZSgnLi9hcHAnKTtcclxuXHJcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XHJcbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ1RpbWVFbnRyaWVzJywge1xyXG4gICAgdXJsOiAnLycsXHJcbiAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL1RpbWVFbnRyaWVzL1RpbWVFbnRyaWVzLmh0bWwnLFxyXG4gICAgY29udHJvbGxlcjogJ1RpbWVFbnRyaWVzQ3RybCcsXHJcbiAgICBkYXRhOiB7XHJcbiAgICAgIHBlcm1pc3Npb25zOiB7XHJcbiAgICAgICAgb25seTogWyd1c2VyJ10sXHJcbiAgICAgICAgcmVkaXJlY3RUbzogXCJMb2dpblwiXHJcbiAgICAgIH1cclxuICAgICAgLy9wZXJtaXNzaW9uczoge1xyXG4gICAgICAvLyAgZXhjZXB0OiBbJ2Fub255bW91cyddLFxyXG4gICAgICAvLyAgcmVkaXJlY3RUbzogXCJMb2dpblwiXHJcbiAgICAgIC8vfVxyXG4gICAgfVxyXG4gIH0pO1xyXG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdMb2dpbicsIHtcclxuICAgIHVybDogJy9sb2dpbicsXHJcbiAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL0xvZ2luL0xvZ2luLmh0bWwnLFxyXG4gICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcclxuICB9KTtcclxuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnU2lnbnVwJywge1xyXG4gICAgdXJsOiAnL3NpZ251cCcsXHJcbiAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL0xvZ2luL1NpZ251cC9TaWdudXAuaHRtbCcsXHJcbiAgICBjb250cm9sbGVyOiAnU2lnbnVwQ3RybCdcclxuICB9KTtcclxufSk7XHJcblxyXG5cbn0se1wiLi9hcHBcIjo5fV0sMTE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xudmFyIGFwcCA9IHJlcXVpcmUoJy4vYXBwJyk7XHJcblxyXG5hcHAuZmFjdG9yeSgnbG9hZGluZycsIGZ1bmN0aW9uICgkcm9vdFNjb3BlKSB7XHJcblxyXG4gIHZhciBsb2FkaW5nID0gZmFsc2U7XHJcblxyXG4gIHJldHVybiBmdW5jdGlvbiAocHJvbWlzZSkge1xyXG4gICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdsb2FkaW5nRXZlbnQnLCB0cnVlKTtcclxuICAgIGxvYWRpbmcgPSB0cnVlO1xyXG4gICAgcHJvbWlzZS5maW5hbGx5KGZ1bmN0aW9uICgpIHtcclxuICAgICAgbG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2xvYWRpbmdFdmVudCcsIGZhbHNlKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbn0pO1xyXG5cclxuYXBwLmRpcmVjdGl2ZSgnc3Bpbm5lcicsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHRlbXBsYXRlOiAnPGRpdiBuZy1pZj1cImxvYWRpbmdcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTsgcmlnaHQ6IDA7IHRvcDogMDsgd2lkdGg6IDIwMHB4OyBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwOyBjb2xvcjogI2ZmZjsgcGFkZGluZy1sZWZ0OiAxMHB4O1wiPkxvYWRpbmcuLi48L2Rpdj4nLFxyXG4gICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgIHNjb3BlOiB7fSxcclxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgc2NvcGUuJG9uKCdsb2FkaW5nRXZlbnQnLCBmdW5jdGlvbiAoZXZlbnQsIGxvYWRpbmcpIHtcclxuICAgICAgICBzY29wZS5sb2FkaW5nID0gbG9hZGluZztcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufSk7XHJcblxufSx7XCIuL2FwcFwiOjl9XX0se30sWzFdKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==