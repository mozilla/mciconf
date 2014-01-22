define(['directives/directives'], function (directives) {
  directives.directive('configSaver', ['$rootScope', function ($rootScope) {
    return {
      restrict: 'AE',
      templateUrl: 'templates/config-saver.html',
      controller: function ($scope) {
        $scope.save = function () {
          var link = document.getElementById("config-saver");
          var content = document.getElementsByTagName("pre")[0].textContent;
          link.href = URL.createObjectURL(new Blob([content], {type: "text/plain"}));
          link.download = "onDemandConfig.ini";
          link.click();
        }
      }
    }
  }]);
});
