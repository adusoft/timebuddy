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
