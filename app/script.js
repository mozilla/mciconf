'use strict';

function Ctrl($scope, $http, $rootScope) {

  $rootScope.builds = [];

  //START Retrieving data
  $http.get('data/platforms.json').then(function(res){
    $scope.platforms = res.data;
    $scope.platform = $scope.platforms[0];

    $scope.initForm();
  });

  $http.get('data/dash_boards.json').then(function(res){
    $scope.dashboards = res.data.dashboards;
    $scope.dashboards_url = res.data.dashboards_url;
    $scope.dashboard = $scope.dashboards[0];
  });

  $http.get('data/locales.json').then(function(res){
    $scope.locales = res.data;
  });

  $http.get('data/testruns.json').then(function(res){
    $scope.testruns = res.data;
    $scope.testrun = $scope.testruns[2];
  });
  //END Retrieving data


  $scope.clear = function() {
    $scope.testrun = $scope.testruns[0];
    $scope.dashboard = $scope.dashboards[0];
    $scope.target_build_id = "";
    $scope.update_channel = "";
    $rootScope.builds = [];
  }

  $scope.addBuild = function() {
    var n = $rootScope.$new();

    n.platform = $scope.platforms[0];
    n.platform_version = n.platform.versions[0];
    n.firefox_version = "";
    n.locale = "";

    $rootScope.builds.push(n);
  }

  $scope.removeBuild = function(index) {
    $scope.builds.splice(index, 1);
  }

  $scope.isUpdate = function() {
    if ($scope.testrun)
      return $scope.testrun.script === 'update';
    else return false;
  };


  $scope.initForm = function() {
    if ($scope.builds.length < 1) {
      $scope.addBuild();
    }
  }
}
