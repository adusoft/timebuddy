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
