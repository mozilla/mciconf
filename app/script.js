'use strict';

function Ctrl ($scope, $http, $timeout) {

  $scope.builds = [];

  //START Retrieving data
  $http.get('data/platforms.json').then(function (res){
    $scope.platforms = res.data;
    $scope.platform = $scope.platforms[0];

    $scope.initForm();
  });

  $http.get('data/dashboards.json').then(function (res){
    $scope.dashboards = res.data.dashboards;
    $scope.dashboards_url = res.data.dashboards_url;
    $scope.dashboard = $scope.dashboards[0];
  });

  $http.get('data/locales.json').then(function (res){
    $scope.locales = res.data;
  });

  $http.get('data/testruns.json').then(function (res){
    $scope.testruns = res.data;
    $scope.testrun = $scope.testruns[2];
  });
  //END Retrieving data


  $scope.clear = function () {
    $scope.testrun = $scope.testruns[0];
    $scope.dashboard = $scope.dashboards[0];
    $scope.target_build_id = "";
    $scope.update_channel = "";
    $scope.builds = [];
  }

  $scope.addBuild = function () {
    var newEmptyBuild = {
        platform: $scope.platforms[0],
        platform_version: $scope.platform.versions[0],
        firefox_versions: [{name: "", locale: ""}]
      };

    $scope.builds.push(newEmptyBuild);
    $scope.updateLast(0, newEmptyBuild)
  }

  $scope.updateLast = function (i, newEmptyBuild) {
    if ($scope.checkDuplicates(false)) {
      newEmptyBuild.platform_version = $scope.platform.versions[i];
      $scope.updateLast(i += 1, newEmptyBuild);
    }
  }

  $scope.removeBuild = function(index) {
    $scope.builds.splice(index, 1);
  }

  $scope.isUpdate = function () {
    if ($scope.testrun)
      return $scope.testrun.script === 'update';
    else return false;
  };


  $scope.initForm = function () {
    if ($scope.builds.length < 1) {
      $scope.addBuild();
    }
  }

  $scope.updatePlatformVersion = function (aIndex) {
    $scope.builds[aIndex].platform_version = $scope.builds[aIndex].platform.versions[0];
    $scope.checkDuplicates(true);
  }

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
  }

  $scope.checkLocales = function (aVersionIndex, aBuildIndex) {
    $timeout.cancel($scope.checker);
    var locales = $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].locale.split(" ");
    $scope.checker = $timeout(function() {
      for (var i = 0; i < locales.length; i += 1) {
        if ($scope.locales.indexOf(locales[i]) === -1) {
          locales.splice(i, 1);
          i -= 1; // If we remove one item the next one will be on the same index
        }
      }
      $scope.builds[aBuildIndex].firefox_versions[aVersionIndex].locale = locales.join(" ") + " ";
    }, 2000, true);
  }

  $scope.addVersion = function (aIndex) {
    $scope.builds[aIndex].firefox_versions.push({});
  }

  $scope.removeVersion = function (aVersionIndex, aBuildIndex) {
    $scope.builds[aBuildIndex].firefox_versions.splice(aVersionIndex, 1);
  }
}


