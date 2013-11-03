'use strict';

function Ctrl ($scope, $http, $rootScope) {

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
        firefox_version: "",
        locale: ""
      };

    $scope.builds.push(newEmptyBuild);
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
  }
}


