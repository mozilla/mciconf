define(['directives/directives'], function (directives) {
  directives.directive('notification', ['$rootScope', '$timeout', function ($rootScope, $timeout) {

    return {
      restrict: 'AE',
      templateUrl: 'templates/logger.html',
      controller: function ($scope, $rootScope, $timeout) {
        $scope.alerts = [];
        $scope.history = [];

        $scope.focused = false;
        $scope.focus = function () {
          $scope.focused = !$scope.focused;
        }
        /**
         * Method for closing the notification at index
         *
         * @param {number} aIndex
         *        Index of notification we close
         */
        $scope.closeAlert = function (aIndex) {
          $scope.alerts.splice(aIndex, 1);
        }

        // Listener to add an notification at the firs index and to remove the last
        // if the queue is bigger then 3
        $rootScope.$on('notify', function (aEvent, aMessage) {
          $scope.alerts.reverse();
          $scope.alerts.push({type: aMessage.type, message: aMessage.message, uid: getNextUid()});
          $scope.alerts.reverse();
          if ($scope.alerts.length > 3)
            $scope.history.push($scope.alerts.pop());
          else
            $timeout(function () {
              $scope.history.push($scope.alerts.pop());
              if(!$scope.$$phase) {
                $scope.$digest();
              }
            }, TIMEOUT_NOTIFICATION_DISPLAYED, false);
        });
      }
    }
  }]);
});
