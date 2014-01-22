define(['directives/directives'], function (directives) {
  directives.directive('dropDownCheckBox', ['$rootScope', function ($rootScope) {

    return {
      restrict: 'AE',
      templateUrl: 'templates/drop-down-check-box.html',
      controller: function ($scope, $rootScope) {
        $scope.allChecked = false;
        $scope.focused = false;
        $scope.focus = function () {
          $scope.focused = !$scope.focused;
        }
        /**
         * Callback function to check and add locales
         * @param aVersionIndex
         * @param aBuildIndex
         * @param added
         * @param locale
         */
        $scope.checkMe = function (aVersionIndex, aBuildIndex, added, locale) {
          if (added) {
            var l = $rootScope.builds[aBuildIndex].
                               firefoxVersions[aVersionIndex].locale.length;
            $rootScope.builds[aBuildIndex].firefoxVersions[aVersionIndex].exists = STATE.NOT_CHECKED;
            $rootScope.builds[aBuildIndex].
                       firefoxVersions[aVersionIndex].locale += (!l) ? locale : " " + locale;
          } else {
            var locales = $rootScope.builds[aBuildIndex].
                          firefoxVersions[aVersionIndex].locale.split(" ");
            locales.pop(locale);
            $rootScope.builds[aBuildIndex].
                       firefoxVersions[aVersionIndex].locale = locales.join(" ");
          }
        }
        $scope.checkAll = function (aVersionIndex, aBuildIndex) {
          if (!$scope.allChecked) {
            $rootScope.builds[aBuildIndex].firefoxVersions[aVersionIndex].availableLocales.forEach(function (locale) {
              locale.added = false;
            });
            $rootScope.builds[aBuildIndex].
                       firefoxVersions[aVersionIndex].
                       locale = "";
          } else {
            $rootScope.builds[aBuildIndex].firefoxVersions[aVersionIndex].availableLocales.forEach(function (locale) {
              if (!locale.added) {
                var l = $rootScope.builds[aBuildIndex].
                                   firefoxVersions[aVersionIndex].
                                   locale.length;
                $rootScope.builds[aBuildIndex].
                           firefoxVersions[aVersionIndex].
                           locale += ((!l) ? locale.locale : " " + locale.locale);
                locale.added = true;
              }
            });
          }
        }
        $scope.mouseleave = function () {
          $scope.focused = false;
        }
      }
    };
  }]);
});
