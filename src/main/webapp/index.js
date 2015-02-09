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
