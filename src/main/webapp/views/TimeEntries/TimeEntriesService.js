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
