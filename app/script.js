const PLATFORM_FRAGMENTS = {
  linux: 'linux-i686',
  linux64: 'linux-x86_64',
  mac: 'mac',
  mac64: 'mac64',
  win32: 'win32',
  win64: 'win64-x86_64'
};
var mciconf = angular.module('mciconf', []);

mciconf.controller('mainController', ['$scope', '$http', '$timeout',
  function mciconf($scope, $http, $timeout) {
    $scope.builds = [];
    $scope.iconClasses = ["icon-question-sign", "icon-ok", "icon-remove"];
    $scope.buttonClasses = ["btn-warning", "btn-success", "btn-danger"];

    //START Retrieving data
    $http.get('data/dashboards.json').then(function (res){
      $scope.dashboards = res.data.dashboards;
      $scope.dashboards_url = res.data.dashboards_url;
      $scope.dashboard = $scope.dashboards[0];
    });

    $http.get('data/locales.json').then(function (res){
      $scope.locales = res.data;
    });

    $http.get('data/platforms.json').then(function (res){
      $scope.platforms = res.data;
      $scope.platform = $scope.platforms[0];

      $scope.initForm();
    });

    $http.get('data/testruns.json').then(function (res){
      $scope.testruns = res.data;
      $scope.testrun = $scope.testruns[2];
    });
    //END Retrieving data

    $scope.addBuild = function () {
      var newEmptyBuild = {
          platform: $scope.platforms[0],
          platform_version: $scope.platform.versions[0],
          firefox_versions: [{name: "",
                              locale: "",
                              buildsFound: 0}]
        };

      $scope.builds.push(newEmptyBuild);
      $scope.updateLast(0, newEmptyBuild);
    };

    $scope.addVersion = function (aIndex) {
      $scope.builds[aIndex].firefox_versions.push({buildsFound: 0});
    };

    $scope.checkAll = function () {
      $scope.builds.forEach(function (build, buildIndex) {
        build.firefox_versions.forEach(function (version, versionIndex) {
          $scope.checkBuild(versionIndex, buildIndex);
        });
      });
    }

    $scope.checkAllBuilds = function () {
      var returnValue = 1;
      $scope.builds.forEach(function (build) {
        build.firefox_versions.forEach(function (version) {
          if (version.buildsFound === 2)
            returnValue = 2;
          else if (version.buildsFound === 0)
            returnValue = 0;
        });
      });
      return returnValue;
    };

    $scope.checkBuild = function (aVersionIndex, aBuildIndex) {
      // If there is no version and locales then we have to invalidate the build and return early
      if (!$scope.builds[aBuildIndex].firefox_versions[aVersionIndex].name &&
          !$scope.builds[aBuildIndex].firefox_versions[aVersionIndex].locale) {
        $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].buildsFound = 2;
        return;
      }

      var candidate = $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].name.indexOf("#") !== -1;

      var build = (candidate) ? $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].name.split("#")[1] : undefined;
      var foundBuilds = 0;
      var locales = $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].locale.split(" ");
      var url = "/ftp/";
      var version = $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].name.split("#")[0];

      url += (candidate) ? "candidates/" : "releases/";
      url += version + ((candidate) ? "-candidates/build" + build + "/" : "/");
      url += PLATFORM_FRAGMENTS[$scope.builds[aBuildIndex].platform_version.platform ||
                                      $scope.builds[aBuildIndex].platform.platform] + "/";
      locales.forEach(function (locale) {
        var _url = url + locale + "/";
        switch ($scope.builds[aBuildIndex].platform.platform) {
          case "linux":
            _url += "firefox-";
            _url += version;
            _url += ".tar.bz2";
            break;
          case "mac":
            _url += "Firefox%20";
            _url += version;
            _url += ".dmg";
            break;
          case "win32":
            _url += "Firefox%20Setup%20";
            _url += version;
            _url += ".exe";
            break;
        }

        var x = new XMLHttpRequest();
        x.open("GET", _url);
        x.onreadystatechange = function () {
          if (x.readyState === 2 && x.status === 200) {
            foundBuilds += 1;
            if (foundBuilds === locales.length) {
              $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].buildsFound = 1;

              // Because we change this outside angular world we have to call the apply function to check models
              if (!$scope.$$phase)
                $scope.$apply();
            }
            x.abort();
          } else if (x.readyState == 2 && x.status === 404) {
            $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].buildsFound = 2;

            // Because we change this outside angular world we have to call the apply function to check models
            if (!$scope.$$phase)
              $scope.$apply();
          }
        };
        x.send();
      });
    };

    $scope.checkDuplicates = function (aRemoveDuplicate) {
      for (var i = 0; i < $scope.builds.length; i +=1) {
        var buildString = $scope.builds[i].platform.labels + $scope.builds[i].platform_version.labels;
        for (var ii = i + 1; ii < $scope.builds.length; ii += 1) {
          var localBuildString = $scope.builds[ii].platform.labels + $scope.builds[ii].platform_version.labels;
          if (buildString === localBuildString && aRemoveDuplicate) {
            $scope.builds[ii].firefox_versions.forEach(function (item) {
              $scope.builds[i].firefox_versions.push(item);
            });
            $scope.builds.splice(ii, 1);
          }
          else if (buildString === localBuildString)
            return true;
        }
      }
    };

    $scope.checkLocales = function (aVersionIndex, aBuildIndex) {
      $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].buildsFound = 0;
      $timeout.cancel($scope.checker);
      var locales = $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].locale.split(" ");
      $scope.checker = $timeout(function() {
        for (var i = 0; i < locales.length; i += 1) {
          if ($scope.locales.indexOf(locales[i]) === -1) {
            locales.splice(i, 1);
            i -= 1; // If we remove one item the next one will be on the same index
          }
        }
        $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].locale = locales.join(" ");
      }, 3000, true);
    };

    $scope.checkVersion = function (aVersionIndex, aBuildIndex) {
      $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].buildsFound = 0;
    };

    $scope.clear = function () {
      $scope.testrun = $scope.testruns[0];
      $scope.dashboard = $scope.dashboards[0];
      $scope.target_build_id = "";
      $scope.update_channel = "";
      $scope.builds = [];
    }

    $scope.initForm = function () {
      if ($scope.builds.length < 1) {
        $scope.addBuild();
      }
    };

    $scope.isUpdate = function () {
      if ($scope.testrun)
        return $scope.testrun.script === 'update';
      else return false;
    };

    $scope.removeBuild = function(index) {
      $scope.builds.splice(index, 1);
    };

    $scope.removeVersion = function (aVersionIndex, aBuildIndex) {
      $scope.builds[aBuildIndex].firefox_versions.splice(aVersionIndex, 1);
    };

    $scope.updateLast = function (i, newEmptyBuild) {
      if ($scope.checkDuplicates(false)) {
        newEmptyBuild.platform_version = $scope.platform.versions[i];
        $scope.updateLast(i += 1, newEmptyBuild);
      }
    };

    $scope.updatePlatformVersion = function (aIndex) {
      $scope.builds[aIndex].platform_version = $scope.builds[aIndex].platform.versions[0];
      $scope.checkDuplicates(true);
    };

    $scope.versionsLength = function (aVersionIndex, aBuildIndex) {
      return $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].length > 1;
    };
  }
]);

mciconf.directive('build', function () {
  return {
    restrict: 'AE',
    templateUrl: 'templates/build.html'
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
    templateUrl: 'templates/form.html'
  }
});
