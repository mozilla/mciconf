define(['directives/directives'], function (directives) {
  directives.directive('channel', ['$rootScope', function ($rootScope) {

    return {
      restrict: 'AE',
      templateUrl: 'templates/channel.html',
      controller: function ($scope, $rootScope) {
        $scope.channel = "default";
        $scope.change = function () {
          $rootScope.updateChannel = $scope.channel;
        }
      }
    }
  }]);
});
