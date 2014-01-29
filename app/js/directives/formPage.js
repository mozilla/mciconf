define(['directives/directives'], function (directives) {
  directives.directive('formPage', ['$rootScope', function ($rootScope) {

    return {
      restrict: 'AE',
      templateUrl: 'templates/form.html',
      controller: function ($scope, $rootScope) {

        /**
         * Checks all builds and return the worst state found
         * used to set the checkAllBuilds button state
         *
         * @returns {number}
         *          The worst state found
         */
        $rootScope.checkAllBuilds = function () {
          var returnValue = STATE.FOUND;
          $rootScope.builds.some(function (build) {
            build.firefoxVersions.some(function (version) {
              if (version.exists === STATE.NOT_FOUND)
                returnValue = STATE.NOT_FOUND;
              else if (version.exists === STATE.NOT_CHECKED)
                returnValue = STATE.NOT_CHECKED;
              return returnValue === STATE.NOT_FOUND
            });
            return returnValue === STATE.NOT_FOUND;
          });
          return returnValue;
        }

        /**
         * Number of the left platforms that have been not added
         *
         * @returns {number}
         */
        $scope.platformsLeft = function () {
          if (!$rootScope.platforms)
            return 0;
          return $rootScope.platforms.filter(notAdded).length
        }
      }
    }
  }]);
});
