define(['directives/directives'], function (directives) {

  directives.directive('document', [function () {
    return {
      restrict: 'AE',
      templateUrl: 'templates/document.html'
    }
  }]);
});
