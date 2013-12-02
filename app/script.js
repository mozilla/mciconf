const PLATFORM_FRAGMENTS = {
  linux: 'linux-i686',
  linux64: 'linux-x86_64',
  mac: 'mac',
  mac64: 'mac64',
  win32: 'win32',
  win64: 'win64-x86_64'
};
const STATE = {
  NOT_CHECKED: 0,
  FOUND: 1,
  NOT_FOUND: 2
}

const TIMEOUT_CHECKING_LOCALES = 3000;
const TIMEOUT_NOTIFICATION_DISPLAYED = 3000;

// Helper callback used to filter platforms
function notAdded(value) {
  return !value.added;
}

var mciconf = angular.module('mciconf', []);

mciconf.controller('mainController', ['$scope', '$rootScope', '$http', function mciconf($scope, $rootScope, $http) {
  $rootScope.builds = [];
  $rootScope.buttonClasses = ["btn-primary", "btn-success", "btn-warning"];
  $rootScope.firefoxVersions = [];
  $rootScope.firefoxVersionsTypes = [];
  $rootScope.iconClasses = ["icon-question-sign", "icon-ok", "icon-remove"];
  $rootScope.locales = ["en-US"];
  $rootScope.updateChannels = ["default", "release", "esr", "beta", "aurora", "nightly"];
  $rootScope.updateChannel = "default";
  $rootScope.target_build_id = "";

  /**
   * Helper function to load ftp and parse it's elements with a filter callback
   * @param {string} aAddress
   *        Url of ftp directory in which to search
   * @param {string} aTag
   *        Tag of the elements to retrieve
   * @param {function} aCallbackFilter
   *        A function to be applied on each element, takes as the parameter the element
   * @param aFinalCallback
   *        A final callback to be called after the the parsing is done
   */
  $rootScope.parseAtAddress = function (aAddress, aTag, aCallbackFilter, aFinalCallback, aErrorCallback) {
    $http({method: 'GET', url: aAddress}).success(function (data){
      var doc = document.createElement('div');
      doc.innerHTML = data.split('<table>')[1].split('</table>')[0];
      doc.innerHTML = data.split('<table>')[1].split('</table>')[0];
      var elements = doc.getElementsByTagName(aTag);
      for (var element in elements) {
        if (aCallbackFilter(elements[element]))
          break;
      }
      if (aFinalCallback)
        aFinalCallback();
    }).error(function() {
      if (aErrorCallback)
        aErrorCallback();
    });
  }

  //START Retrieving data
  $http.get('data/dashboards.json').then(function (res){
    $rootScope.dashboards = res.data.dashboards;
    $rootScope.dashboards_url = res.data.dashboards_url;
    $rootScope.dashboard = $scope.dashboards[0];
  });
  $rootScope.parseAtAddress('http://ftp.mozilla.org/pub/mozilla.org/firefox/candidates/', 'a',
    function (link) {
      console.log(link);
      if (link.innerHTML && link.innerHTML.indexOf('-candidates') !== -1) {
        $rootScope.firefoxVersions.push(link.innerHTML.split('-candidates/')[0]);
      }
    },
    function () {
      $rootScope.firefoxVersions.sort(function(a,b){
        return parseInt(b)-parseInt(a);
      });

      $rootScope.parseAtAddress('http://ftp.mozilla.org/pub/mozilla.org/firefox/releases/', 'a',
        function (link) {
          if (link.innerHTML){
            var v = link.innerHTML.split('/')[0];
            if($rootScope.firefoxVersions.indexOf(v) !== -1) {
              $rootScope.firefoxVersionsTypes[$rootScope.firefoxVersions.indexOf(v)] = 'release';
            }
          }
        },
        function () {
          $rootScope.builds.forEach(function (build, buildIndex) {
            build.firefoxVersions.forEach(function (version, versionIndex) {
              if (!version.name){
                version.name = $rootScope.firefoxVersions[0];
                version.type = 'release';
                $rootScope.$emit('versionChanged', {versionIndex: versionIndex,
                  buildIndex: buildIndex});
              }
            });
          });
        });
    });

  $http.get('https://l10n.mozilla.org/shipping/api/status?tree=fx_beta').then(function (res){
    res.data.items.forEach(function (locale) {
      if (locale.type === "Build")
        $rootScope.locales.push(locale.locale);
    });
  });

  $http.get('data/platforms.json').then(function (res){
    $rootScope.platforms = res.data;

    $scope.initForm();
  });

  $http.get('data/testruns.json').then(function (res){
    $rootScope.testruns = res.data;
    $rootScope.testrun = $rootScope.testruns[2];
  });
  //END Retrieving data

  /**
   * Adds a new empty build
   */
  $scope.addBuild = function () {
    var build = {};
    build.exists = STATE.NOT_CHECKED;
    build.name = ($rootScope.firefoxVersions.length) ? $rootScope.firefoxVersions[0] : "";
    build.type = $rootScope.firefoxVersionsTypes[0];
    build.locale = "";
    build.availableLocales = [];
    var newEmptyBuild = {};
    newEmptyBuild.firefoxVersions = [build];
    newEmptyBuild.platform = $rootScope.platforms.filter(notAdded)[0];
    newEmptyBuild.platformVersion =  newEmptyBuild.platform.versions.filter(notAdded)[0];
    newEmptyBuild.platformVersion.added = true;
    if (!newEmptyBuild.platform.versions.filter(notAdded).length) {
      newEmptyBuild.platform.added = true;
    }
    $rootScope.builds.push(newEmptyBuild);

    // Watch when the platform version changes and it changes the "added" flag
    // which prevents us from adding the same platform version twice
    $scope.$watch(function () {
      return newEmptyBuild.platformVersion
    }, function (newVersion, oldVersion) {
      oldVersion.added = false;
      newVersion.added = true;
    });

    // Watch when the platform changes and it changes the "added" flag
    // which prevents us from adding the same platform twice
    $scope.$watch(function () {
      return newEmptyBuild.platform
    }, function (newVersion, oldVersion) {
      oldVersion.added = false;
      if (!newVersion.versions.filter(notAdded).length) {
        newVersion.added = true;
      }
    });
    $rootScope.$emit('versionChanged', {versionIndex: 0,
      buildIndex: ($rootScope.builds.length -1)});
  }

  /**
   * Helper function to broadcast 'checkAll' so build directive can update itself
   */
  $scope.checkAll = function () {
    if ($rootScope.isUpdate()) {
      if ($rootScope.target_build_id.length !== 14) {
        $scope.$emit('notify', {type: 'error',
                      message: "Target build-id is not of a correct length"});
      } else if (/[0-9]?/.test($rootScope.target_build_id)) {
        $scope.$emit('notify', {type: 'error',
                      message: "Target build-id is not a number"});
      }
    }
    $rootScope.$broadcast('checkAll');
  }

  /**
   * Clears all changes
   */
  $scope.clear = function () {
    $rootScope.testrun = $rootScope.testruns[0];
    $rootScope.dashboard = $rootScope.dashboards[0];
    $rootScope.target_build_id = "";
    $rootScope.updateChannel = "";
    $rootScope.platforms.forEach(function (platform) {
      platform.versions.forEach(function (version) {
        version.added = false
      });
      platform.added = false;
    });
    $rootScope.builds = [];
  }

  /**
   * Bootstrap the application by adding an new empty build
   */
  $scope.initForm = function () {
    if ($rootScope.builds.length < 1) {
      $scope.addBuild();
    }
  }

  /**
   * Checks if the current testrun is of an update type
   *
   * @returns {boolean}
   */
  $rootScope.isUpdate = function () {
    if ($rootScope.testrun)
      return $rootScope.testrun.script === 'update';
    else return false;
  }
}]);

mciconf.directive('build', function () {
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
      $scope.buildNumberChanged = function (aVersionIndex, aBuildIndex) {
        var url = "http://ftp.mozilla.org/pub/mozilla.org/firefox/";
        var version = $rootScope.builds[aBuildIndex].
                                 firefoxVersions[aVersionIndex].
                                 name.split("#")[0];
        var candidate = $rootScope.builds[aBuildIndex].
                                   firefoxVersions[aVersionIndex].
                                   buildNumber !== 'release';

        url += (candidate) ? "candidates/" : "releases/";
        url += version + ((candidate) ? "-candidates/" : "");
        url += (candidate) ? $rootScope.builds[aBuildIndex].
                                        firefoxVersions[aVersionIndex].
                                        buildNumber + "/" : "/";
        url += PLATFORM_FRAGMENTS[$rootScope.builds[aBuildIndex].platformVersion.platform ||
                                  $rootScope.builds[aBuildIndex].platform.platform] + "/";

        // Clear the available locales of the current build
        $rootScope.builds[aBuildIndex].
                   firefoxVersions[aVersionIndex].
                   availableLocales = [];
        $scope.unCheck(aVersionIndex, aBuildIndex);

        // Parsing the ftp directory of the current build to retrieve
        // the current build locals
        $rootScope.parseAtAddress(url, "a", function (link) {
          if (link.href && link.href.indexOf(link.innerHTML) !== -1) {
            $rootScope.builds[aBuildIndex].
                       firefoxVersions[aVersionIndex].
                       availableLocales.push(link.innerHTML.split('/')[0]);
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
                                   buildNumber !== 'release';
        var file = "";
        var foundBuilds = 0;
        var responseReceived = 0;


        var locales = $rootScope.builds[aBuildIndex].
                                 firefoxVersions[aVersionIndex].
                                 locale.split(" ");
        var url = "http://ftp.mozilla.org/pub/mozilla.org/firefox/";
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
          $rootScope.parseAtAddress(url + locale + "/", "a", function (link) {
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
       * Checks if the tipped locales are supported, if not it will get removed
       *
       * @param {number} aVersionIndex
       *        Index of version
       * @param {number} aBuildIndex
       *        Index of the build
       */
      $scope.checkLocales = function (aVersionIndex, aBuildIndex) {
        $rootScope.builds[aBuildIndex].
                   firefoxVersions[aVersionIndex].
                   exists = STATE.NOT_CHECKED;

        // Cancels the previous timeout handler
        $timeout.cancel($scope.checker);
        var locales = $rootScope.builds[aBuildIndex].
                                 firefoxVersions[aVersionIndex].
                                 locale.split(" ");
        var availableLocales = ($rootScope.builds[aBuildIndex].firefoxVersions[aVersionIndex].availableLocales.length) ?
                                $rootScope.builds[aBuildIndex].firefoxVersions[aVersionIndex].availableLocales :
                                $rootScope.locales;

        // Setting a timeout handler to check the locales
        $scope.checker = $timeout(function() {
          var availableL = availableLocales.toString().toLowerCase().split(",");
          for (var i = 0; i < locales.length; i += 1) {
            if (availableL.indexOf(locales[i].toLowerCase()) === -1) {
              $rootScope.builds[aBuildIndex].
                         firefoxVersions[aVersionIndex].
                         exists =  STATE.NOT_FOUND;
              $scope.$emit('notify', {type: 'error',
                                      message: "Locale '" + locales[i] + "' it's not supported!"});
              locales.splice(i, 1);
              i -= 1; // If we remove one item the next one will be on the same index
            } else {
              locales[i] = availableLocales[availableL.indexOf(locales[i].toLowerCase())];
            }
          }
          $rootScope.builds[aBuildIndex].firefoxVersions[aVersionIndex].locale = locales.join(" ");
        }, TIMEOUT_CHECKING_LOCALES, true);
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
        $rootScope.builds.splice(index, 1);
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

        // If the build has a release version we will set it as default in build numbers array
        $rootScope.builds[aBuildIndex].
                   firefoxVersions[aVersionIndex].
                   buildNumbers = (isRelease) ? ['release'] : [];
        var versionName = $rootScope.builds[aBuildIndex].
                                 firefoxVersions[aVersionIndex].
                                 name + "-candidates/";
        var address = "http://ftp.mozilla.org/pub/mozilla.org/firefox/candidates/" + versionName;

        $rootScope.parseAtAddress(address, 'a', function (link) {
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
});

mciconf.directive('document', function () {
  return {
    restrict: 'AE',
    templateUrl: 'templates/document.html'
  }
});

mciconf.directive('formPage', function () {
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
      $scope.checkAllBuilds = function () {
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
});

mciconf.directive('notification', function () {
  return {
    restrict: 'AE',
    templateUrl: 'templates/logger.html',
    controller: function ($scope, $rootScope, $timeout) {
      $scope.alerts = [];
      $scope.history = [];

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
        $scope.alerts.push({type: aMessage.type, message: aMessage.message});
        $scope.alerts.reverse();
        if ($scope.alerts.length > 3)
          $scope.history.push($scope.alerts.pop());
        $timeout(function () {
          $scope.history.push($scope.alerts.pop());
          if(!$scope.$$phase) {
            $scope.$digest();
          }
        }, TIMEOUT_NOTIFICATION_DISPLAYED, false);
      });
    }
  }
});

/*
 * This filter should return all elements that are not already added
 * including the current element
 */
mciconf.filter('added', function(){

  return function (items, current) {
    var filteredArray = [];
    items.forEach(function (item) {
      if (!item.added || angular.equals(item, current))
        filteredArray.push(item);
    });

    return filteredArray;
  };
});
