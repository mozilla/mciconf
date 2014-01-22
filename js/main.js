require.config({
  paths: {
    angular: '../lib/angular/angular',
    domReady: '../lib/domReady'
  },
  shim: {
    angular: {
      exports: 'angular'
    }
  }
});

require([
  'angular',
  'domReady',
  'controllers/controllers',
  'directives/directives',
  'app'
], function (angular, domReady) {
  domReady(function () {
    angular.bootstrap(document, ['mciconf']);
  });
});