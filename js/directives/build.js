define(['directives/directives'], function (directives) {
  directives.directive('build', ['$rootScope', '$timeout', function ($rootScope, $timeout) {

    return {
      restrict: 'AE',
      templateUrl: 'templates/build.html',
      controller: function ($scope, $rootScope, $timeout) {

        /**
         * Adds an new empty version for the build at index
         *
         * @param {number} aIndex
         *        Index of build on which we append an empty version
         */
        $scope.addVersion = function (aIndex) {
          var build = {};
          build.exists = STATE.NOT_CHECKED;
          build.name = ($rootScope.firefoxVersions.length) ? $rootScope.firefoxVersions[0] : "";
          build.type = $rootScope.firefoxVersionsTypes[0];
          build.locale = "";
          build.availableLocales = [];
          $rootScope.builds[aIndex].firefoxVersions.push(build);
          $scope.versionChanged($rootScope.builds[aIndex].firefoxVersions.length - 1, aIndex);
        }

        /**
         * Helper function to be called when the build number changes so it will
         * search for available locales of the given build
         *
         * @param {number} aVersionIndex
         *        Index of version
         * @param {number} aBuildIndex
         *        Index of the build
         */
        $rootScope.buildNumberChanged = function (aVersionIndex, aBuildIndex) {
          var url = "http://ftp.mozilla.org/pub/mozilla.org/firefox/";
          var version = $rootScope.builds[aBuildIndex].
                                   firefoxVersions[aVersionIndex].
                                   name.split("#")[0];
          var candidate = $rootScope.builds[aBuildIndex].
                                     firefoxVersions[aVersionIndex].
                                     buildNumber !== 'final';

          url += (candidate) ? "candidates/" : "releases/";
          url += version + ((candidate) ? "-candidates/" : "");
          url += (candidate) ? $rootScope.builds[aBuildIndex].
                                          firefoxVersions[aVersionIndex].
                                          buildNumber + "/" : "/";
          url += PLATFORM_FRAGMENTS[$rootScope.builds[aBuildIndex].platformVersion.platform ||
                                    $rootScope.builds[aBuildIndex].platform.platform] + "/";


          // Parsing the ftp directory of the current build to retrieve
          // the current build locals
          $rootScope.parseAtAddress(url, "a", function () {
            // Clear the available locales of the current build
            $rootScope.builds[aBuildIndex].
                       firefoxVersions[aVersionIndex].
                       availableLocales = [];
            $scope.unCheck(aVersionIndex, aBuildIndex);
          }, function (link) {
            if (link.href && link.href.indexOf(link.innerHTML) !== -1) {
              var locale = $rootScope.builds[aBuildIndex].firefoxVersions[aVersionIndex].locale;
              $rootScope.builds[aBuildIndex].
                         firefoxVersions[aVersionIndex].
                         availableLocales.push({ locale: link.innerHTML.split('/')[0],
                                                 added: (locale && locale.indexOf(link.innerHTML.split('/')[0]) !== -1) ? true : false });
            }
          });
        }
        $scope.checkBuild = function (aVersionIndex, aBuildIndex) {
          // If there is no version and locales then we have to invalidate the build and return early
          if ( !$rootScope.builds[aBuildIndex].firefoxVersions[aVersionIndex].locale) {
            $rootScope.builds[aBuildIndex].
                       firefoxVersions[aVersionIndex].
                       exists = STATE.NOT_FOUND;
            $scope.$emit('notify', {type: 'error',
                                    message: 'A localization must be given'});
            return;
          }

          var candidate = $rootScope.builds[aBuildIndex].
                                     firefoxVersions[aVersionIndex].
                                     buildNumber !== 'final';
          var file = "";
          var foundBuilds = 0;
          var responseReceived = 0;


          var locales = $rootScope.builds[aBuildIndex].
                                   firefoxVersions[aVersionIndex].
                                   locale.split(" ");
          var url = "http://ftp.mozilla.org/pub/mozilla.org/firefox/";
          if (!$rootScope.builds[aBuildIndex].firefoxVersions[aVersionIndex].name) {
            $rootScope.builds[aBuildIndex].firefoxVersions[aVersionIndex].exists =  STATE.NOT_FOUND;
            $rootScope.$emit('notify', {type: 'error',
                                        message: 'A build version must be given'});

            return;
          }
          var version = $rootScope.builds[aBuildIndex].
                                   firefoxVersions[aVersionIndex].
                                   name.split("#")[0];
          url += (candidate) ? "candidates/" : "releases/";
          url += version + ((candidate) ? "-candidates/" : "");
          url += (candidate) ? $rootScope.builds[aBuildIndex].
                                          firefoxVersions[aVersionIndex].
                                          buildNumber + "/" : "/";
          url += PLATFORM_FRAGMENTS[$rootScope.builds[aBuildIndex].platformVersion.platform ||
                                    $rootScope.builds[aBuildIndex].platform.platform] + "/";

          // Depending o platform we are we create the string of the file we should
          // see on ftp directory
          switch ($rootScope.builds[aBuildIndex].platform.platform) {
            case "linux":
              file += "firefox-";
              file += version;
              file += ".tar.bz2";
              break;
            case "mac":
              file += "Firefox%20";
              file += version;
              file += ".dmg";
              break;
            case "win32":
              file += "Firefox%20Setup%20";
              file += version;
              file += ".exe";
              break;
          }

          locales.forEach(function (locale, index) {
            $rootScope.parseAtAddress(url + locale + "/", "a", undefined, function (link) {
                responseReceived += 1;
              if (link.innerHTML && link.innerHTML.indexOf(file)) {
                foundBuilds += 1;
                // If we found all the locales we would stop and notify the
                // 'notify' directive
                if (foundBuilds === locales.length) {
                  $rootScope.builds[aBuildIndex].
                             firefoxVersions[aVersionIndex].
                             exists = STATE.FOUND;
                  $scope.$emit('notify', {type: 'success',
                                          message: 'Builds "' + locales.join('"', "'") + '" exists.'});
                }
              }
            }, function () {
              // After the last locale check if enough locales where found
              if (locales.length === responseReceived && locales.length !== foundBuilds) {
                $rootScope.builds[aBuildIndex].
                           firefoxVersions[aVersionIndex].
                           exists =  STATE.NOT_FOUND;
                $scope.$emit('notify', {type: 'error',
                                        message: 'Build was not found'});
              }
            }, function () {
              $rootScope.builds[aBuildIndex].
                         firefoxVersions[aVersionIndex].
                         exists =  STATE.NOT_FOUND;
              $scope.$emit('notify', {type: 'error',
                                      message: 'Build was not found'});
            });
          });
        };

        /**
         * Sets the state of the given version to not checked
         *
         * @param {number} aVersionIndex
         *        Index of version
         * @param {number} aBuildIndex
         *        Index of the build
         */
        $scope.unCheck = function (aVersionIndex, aBuildIndex) {
          $rootScope.builds[aBuildIndex].
                     firefoxVersions[aVersionIndex].
                     exists = STATE.NOT_CHECKED;
        };

        /**
         * Updates the platform of a given build
         *
         * @param {number} aIndex
         *        Index of build of whom we update the platform
         */
        $scope.updatePlatformVersion = function (aIndex) {
          $rootScope.builds[aIndex].
                     platformVersion = $rootScope.builds[aIndex].
                                                  platform.versions.filter(notAdded)[0];
        };

        /**
         * Removes the build and sets the platform added flag to false so
         * it will appear as option for other platforms
         *
         * @param {number} aIndex
         *        Index of build of whom we remove the platform
         */
        $scope.removeBuild = function(aIndex) {
          $rootScope.builds[aIndex].platform.added = false;
          $rootScope.builds[aIndex].platformVersion.added = false;
          $rootScope.builds.splice(aIndex, 1);
        };

        /**
         * Removes a version from a build
         *
         * @param {number} aVersionIndex
         *        Index of version being removed
         * @param {number} aBuildIndex
         *        Index of the build
         */
        $scope.removeVersion = function (aVersionIndex, aBuildIndex) {
          $rootScope.builds[aBuildIndex].firefoxVersions.splice(aVersionIndex, 1);
        };

        /**
         * Hellper function to
         *
         * @param aVersionIndex
         * @param aBuildIndex
         */
        $scope.versionChanged = function (aVersionIndex, aBuildIndex) {
          var indexOfVersion = $rootScope.firefoxVersions. indexOf($rootScope.builds[aBuildIndex].
                                                                              firefoxVersions[aVersionIndex].
                                                                              name);
          var isRelease = $rootScope.firefoxVersionsTypes[indexOfVersion];
          var versionName = $rootScope.builds[aBuildIndex].
                                   firefoxVersions[aVersionIndex].
                                   name + "-candidates/";
          var address = "http://ftp.mozilla.org/pub/mozilla.org/firefox/candidates/" + versionName;

          $rootScope.parseAtAddress(address, 'a', function () {
            // If the build has a release version we will set it as default in build numbers array
            $rootScope.builds[aBuildIndex].
                       firefoxVersions[aVersionIndex].
                       buildNumbers = (isRelease) ? ['final'] : [];
          },
          function (link) {
            if (link.innerHTML && link.innerHTML.indexOf('build') !== -1) {
              $rootScope.builds[aBuildIndex].
                         firefoxVersions[aVersionIndex].
                         buildNumbers.push(link.innerHTML.split('/')[0]);
            }
          },
          function () {
            // Sets the default build number the first from build numbers array
            $rootScope.builds[aBuildIndex].
                       firefoxVersions[aVersionIndex].
                       buildNumber = $rootScope.builds[aBuildIndex].
                                                firefoxVersions[aVersionIndex].
                                                buildNumbers[0];
            $scope.buildNumberChanged(aVersionIndex, aBuildIndex);
          });
          $scope.unCheck(aVersionIndex, aBuildIndex);
        }

        // Event listener on version change so we can update the version
        $rootScope.$on('versionChanged', function (event, message) {
          $scope.versionChanged(message.versionIndex, message.buildIndex);
        });

        //  Event listener to check all version from the current build
        $scope.$on('checkAll', function () {
          var length = $scope.this.build.firefoxVersions.length;
          for (var i = 0; i < length; i += 1) {
            if ($scope.this.build.firefoxVersions[i].exists !== STATE.FOUND)
              $scope.checkBuild(i, $scope.$index);
          }
        });
      }
    }
  }]);
});
