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

function notAdded(value) {
  return !value.added;
}

var mciconf = angular.module('mciconf', []);

mciconf.controller('mainController', ['$scope', '$rootScope', '$http',
  function mciconf($scope, $rootScope, $http) {
    $rootScope.builds = [];
    $rootScope.iconClasses = ["icon-question-sign", "icon-ok", "icon-remove"];
    $rootScope.buttonClasses = ["btn-warning", "btn-success", "btn-danger"];
    $rootScope.locales = ["en-US"];
    $rootScope.ff_versions = [];
    $rootScope.updateChannels = ["default", "release", "esr", "beta", "aurora", "nightly"];
    $rootScope.update_channel = "default";

    $rootScope.parseAtAddress = function (aAddress, aTag, aCallbackFilter, aFinalCallback) {
      $http.get(aAddress).then(function (res){
        var doc = document.createElement('div');
        doc.innerHTML = res.data.split('<table>')[1].split('</table>')[0];
        doc.innerHTML = res.data.split('<table>')[1].split('</table>')[0];
        var elements = doc.getElementsByTagName(aTag);
        for (var element in elements)
          aCallbackFilter(elements[element]);
        if (aFinalCallback)
          aFinalCallback();
      });
    }

    //START Retrieving data
    $http.get('data/dashboards.json').then(function (res){
      $rootScope.dashboards = res.data.dashboards;
      $rootScope.dashboardsbuildUrl = res.data.dashboardsbuildUrl;
      $rootScope.dashboard = $scope.dashboards[0];
    });

    $rootScope.parseAtAddress('http://ftp.mozilla.org/pub/mozilla.org/firefox/nightly/', 'a',
      function (link) {
        if (link.innerText && link.innerText.indexOf('-candidates') !== -1) {
          $rootScope.ff_versions.push(link.innerText.split('-candidates/')[0]);
        }
      },
      function () {
        $rootScope.ff_versions.sort(function(a,b){
          return parseInt(b)-parseInt(a);
        });
        $rootScope.builds.forEach(function (build, buildIndex) {
          build.firefox_versions.forEach(function (version, versionIndex) {
            if (!version.name){
              version.name = $rootScope.ff_versions[0];
              $rootScope.$emit('versionChanged', {versionIndex: versionIndex,
                                                  buildIndex: buildIndex});
            }
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

    $scope.addBuild = function () {
      var build = {};
      build.exists = STATE.NOT_CHECKED;
      build.name = ($rootScope.ff_versions.length) ? $rootScope.ff_versions[0] : "";
      build.locale = "";
      build.buildNumber = "release";
      build.buildNumbers = ["release"];
      var newEmptyBuild = {};
      newEmptyBuild.firefox_versions = [build];
      newEmptyBuild.platform = $rootScope.platforms.filter(notAdded)[0];
      newEmptyBuild.platform_version =  newEmptyBuild.platform.versions.filter(notAdded)[0];
      newEmptyBuild.platform_version.added = true;
      if (!newEmptyBuild.platform.versions.filter(notAdded).length) {
        newEmptyBuild.platform.added = true;
      }
      $rootScope.builds.push(newEmptyBuild);


      $scope.$watch(function () {
        return newEmptyBuild.platform_version
      }, function (newVersion, oldVersion) {
        oldVersion.added = false;
        newVersion.added = true;
      });
      $scope.$watch(function () {
        return newEmptyBuild.platform
      }, function (newVersion, oldVersion) {
        oldVersion.added = false;
        if (!newVersion.versions.filter(notAdded).length) {
          newVersion.added = true;
        }
      });
    };

    $scope.checkAll = function () {
      $rootScope.$broadcast('checkAll');
    }

    $scope.clear = function () {
      $rootScope.testrun = $rootScope.testruns[0];
      $rootScope.dashboard = $rootScope.dashboards[0];
      $rootScope.target_build_id = "";
      $rootScope.update_channel = "";
      $rootScope.builds = [];
    }

    $scope.initForm = function () {
      if ($rootScope.builds.length < 1) {
        $scope.addBuild();
      }
    };

    $scope.isUpdate = function () {
      if ($rootScope.testrun)
        return $rootScope.testrun.script === 'update';
      else return false;
    };
  }
]);

mciconf.directive('build', function () {
  return {
    restrict: 'AE',
    templateUrl: 'templates/build.html',
    controller: function ($scope, $rootScope, $timeout) {
      $scope.addVersion = function (aIndex) {
        var build = {};
        build.exists = STATE.NOT_CHECKED;
        build.name = ($rootScope.ff_versions.length) ? $rootScope.ff_versions[0] : "";
        $rootScope.builds[aIndex].firefox_versions.push(build);
        $scope.versionChanged($rootScope.builds[aIndex].firefox_versions.length - 1, aIndex);
      };

      $scope.checkBuild = function (aVersionIndex, aBuildIndex) {
        // If there is no version and locales then we have to invalidate the build and return early
        if ( !$rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].locale) {
          $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].exists = STATE.NOT_FOUND;
          $scope.$emit('notify', {type: 'error',
                                  message: 'A localization must be given'});
          return;
        }

        var candidate = $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].buildNumber !== 'release';

        var foundBuilds = 0;
        var locales = $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].locale.split(" ");
        var url = "http://ftp.mozilla.org/pub/mozilla.org/firefox/";
        var version = $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].name.split("#")[0];
        var file = "";

        url += (candidate) ? "candidates/" : "releases/";
        url += version + ((candidate) ? "-candidates/" + $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].buildNumber + "/" : "/");
        url += PLATFORM_FRAGMENTS[$rootScope.builds[aBuildIndex].platform_version.platform ||
                                  $rootScope.builds[aBuildIndex].platform.platform] + "/";

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

        locales.forEach(function (locale) {
          var localeFound = false;
          $rootScope.parseAtAddress(url + locale + "/", "a", function (link) {
            if (link.innerHTML && link.innerHTML.indexOf(file)) {
              localeFound = true;
              foundBuilds += 1;
              if (foundBuilds === locales.length) {
                $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].exists = STATE.FOUND;
                $scope.$emit('notify', {type: 'success',
                                        message: 'Builds "' + locales.join('"', "'") + '" exists.'});
              }
            }
          },
          function () {
            if (!localeFound) {
              $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].exists = STATE.NOT_FOUND;
              $scope.$emit('notify', {type: 'error',
                                      message: 'No Build was found at ' + file});
            }
          });
        });
      };

      $scope.checkLocales = function (aVersionIndex, aBuildIndex) {
        $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].exists = STATE.NOT_CHECKED;
        $timeout.cancel($scope.checker);
        var locales = $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].locale.split(" ");
        $scope.checker = $timeout(function() {
          for (var i = 0; i < locales.length; i += 1) {
            if ($rootScope.locales.indexOf(locales[i]) === -1) {
              $scope.$emit('notify', {type: 'error',
                                      message: 'Locales "' + locales.join('", "') + '" were not found!'});
              locales.splice(i, 1);
              i -= 1; // If we remove one item the next one will be on the same index
            }
          }
          $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].locale = locales.join(" ");
          $scope.checkBuild(aVersionIndex, aBuildIndex);
        }, 3000, true);
      };

      $scope.unCheck = function (aVersionIndex, aBuildIndex) {
        $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].exists = STATE.NOT_CHECKED;
      };

      $scope.updatePlatformVersion = function (aIndex) {
        $rootScope.builds[aIndex].platform_version = $rootScope.builds[aIndex].platform.versions.filter(notAdded)[0];
      };

      $scope.removeBuild = function(index) {
        $rootScope.builds[index].platform.added = false;
        $rootScope.builds[index].platform_version.added = false;
        $rootScope.builds.splice(index, 1);
      };

      $scope.removeVersion = function (aVersionIndex, aBuildIndex) {
        $rootScope.builds[aBuildIndex].firefox_versions.splice(aVersionIndex, 1);
      };

      $scope.versionChanged = function (aVersionIndex, aBuildIndex) {
        $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].buildNumbers = ['release'];
        var version = $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].name + "-candidates/";
        $rootScope.parseAtAddress("http://ftp.mozilla.org/pub/mozilla.org/firefox/nightly/" + version, 'a', function (link) {
          if (link.innerHTML && link.innerHTML.indexOf('build') !== -1) {
            $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].buildNumbers.push(link.innerHTML.split('/')[0]);
          }
        },
        function () {
          $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].buildNumber = $rootScope.builds[aBuildIndex].firefox_versions[aVersionIndex].buildNumbers[0];
        });
        $scope.unCheck(aVersionIndex, aBuildIndex);
      }
      $rootScope.$on('versionChanged', function (event, message) {
        $scope.versionChanged(message.versionIndex, message.buildIndex);
      });
      $scope.$on('checkAll', function () {
        var length = $scope.this.build.firefox_versions.length;
        for (var i = 0; i < length; i += 1) {
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
      $scope.checkAllBuilds = function () {
        var returnValue = STATE.FOUND;
        $rootScope.builds.some(function (build) {
          build.firefox_versions.some(function (version) {
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

      $scope.platformsLeft = function () {
        if (!$rootScope.platforms)
          return false;
        return $rootScope.platforms.filter(notAdded).length
      }
    }
  }
});

mciconf.directive('notification', function () {
  return {
    restrict: 'AE',
    templateUrl: 'templates/logger.html',
    controller: function ($scope, $rootScope) {
      $scope.alerts = [];
      $scope.history = [];
      $scope.closeAlert = function (aIndex) {
        $scope.alerts.splice(aIndex, 1);
      }
      $rootScope.$on('notify', function (aEvent, aMessage) {
        $scope.alerts.reverse();
        $scope.alerts.push({type: aMessage.type, message: aMessage.message});
        $scope.alerts.reverse();
        if ($scope.alerts.length > 3)
          $scope.history.push($scope.alerts.pop());
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
