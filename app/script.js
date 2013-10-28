'use strict';

function Ctrl($scope) {

  $scope.builds = [];

  $scope.dashboards = ['mozmill-release'];
  $scope.dashboards_url = 'http://mozauto.iriscouch.com/';

  $scope.locales = ['en-US', 'en-GB'];

  $scope.platforms = [
    {name:'Mac OS X', labels:'mac', platform:'mac', versions:[
      {name:'10.6', labels:'10.6 64bit'},
      {name:'10.7', labels:'10.7 64bit'},
      {name:'10.8', labels:'10.8 64bit'},
      {name:'10.9', labels:'10.9 64bit'}
    ]},
    {name:'Ubuntu', labels:'linux ubuntu', platform:'linux', versions:[
      {name:'12.04 (32bit)', labels:'12.04 32bit'},
      {name:'12.04 (64bit)', labels:'12.04 64bit', platform:'linux64'},
      {name:'13.04 (32bit)', labels:'13.04 32bit'},
      {name:'13.04 (64bit)', labels:'13.04 64bit', platform:'linux64'}
    ]},
    {name:'Windows', labels:'windows', platform:'mac', versions:[
      {name:'XP', labels:'xp 32bit'},
      {name:'Vista', labels:'vista 32bit'},
      {name:'7', labels:'7 32bit'},
      {name:'8 (32bit)', labels:'8 32bit'},
      {name:'8 (64bit)', labels:'8 64bit'},
      {name:'8.1 (32bit)', labels:'8.1 32bit'},
      {name:'8.1 (64bit)', labels:'8.1 64bit'},
    ]}
  ];
  $scope.platform = $scope.platforms[0];

  $scope.testruns = [
    {name:'Addons', script:'addons'},
    {name:'Endurance', script:'endurance'},
    {name:'Functional', script:'functional'},
    {name:'Remote', script:'remote'},
    {name:'Update', script:'update'}
  ];

  $scope.clear = function() {
    $scope.testrun = $scope.testruns[0];
    $scope.dashboard = $scope.dashboards[0];
    $scope.target_build_id = "";
    $scope.update_channel = "";
    $scope.builds = [];
  }

  $scope.addBuild = function() {
    var newEmptyBuild = {
      platform: $scope.platform,
      platform_version: $scope.platform.versions[0],
      firefox_version: "",
      locale: ""};
    $scope.builds.push(newEmptyBuild);
  }

  $scope.removeBuild = function(index) {
    $scope.builds.splice(index, 1);
  }

  $scope.isUpdate = function() { return $scope.testrun.script === 'update'; };

  $scope.updatePlatformVersion = function(platform) {
    $scope.platform_version = platform.versions[0];
  }

  $scope.initForm = function() {
    if ($scope.builds.length < 1) {
      $scope.addBuild();
    }
    $scope.testrun = $scope.testruns[2];
    $scope.dashboard = $scope.dashboards[0];
    $scope.platform = $scope.platforms[0];
    $scope.platform_version = $scope.platform.versions[0]
  }

  $scope.initForm();

}
