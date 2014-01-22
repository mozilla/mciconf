define(['directives/directives'], function (directives) {
  directives.directive('configPicker', ['$rootScope', function ($rootScope) {

    return {
      restrict: 'AE',
      templateUrl: 'templates/config-picker.html',
      controller: function ($scope, $rootScope) {
        $scope.fileNameChaged = function (aFile) {
          var reader = new FileReader();

          reader.onloadend = function(e) {
            var regex = {
              section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
              param: /^\s*([\w\.\-\_\#]+)\s*=\s*(.*?)\s*$/,
              comment: /^\s*;.*$/
            };

            if (e.target.readyState == FileReader.DONE) {
              var config = {};
              var lines = e.target.result.split(/\r\n|\r|\n/);
              var section = null;

              lines.forEach(function (line) {
                if(regex.comment.test(line)) {
                  return;
                } else if (regex.param.test(line)) {
                  var match = line.match(regex.param);
                  if (section) {
                    config[section][match[1]] = match[2];
                  } else {
                    config[match[1]] = match[2];
                  }
                } else if (regex.section.test(line)) {
                  var match = line.match(regex.section);
                  config[match[1]] = {};
                  section = match[1];
                } else if (line.length == 0 && section) {
                  section = null;
                };
              });

              $rootScope.clear();

              //START populating $rootScope.builds
              if (config.testrun) {
                $rootScope.testrun.script = config.testrun.script;
                $rootScope.testrun.name = config.testrun.script.charAt(0).toUpperCase() +
                                          config.testrun.script.slice(1);
                var dartboardScrap = config.testrun.report.split("/");
                $rootScope.dashboard = dartboardScrap[dartboardScrap.length - 1] ||
                                       dartboardScrap[dartboardScrap.length - 2];
                if (config.testrun['target-build-id']) {
                  $rootScope.target_build_id = config.testrun['target-build-id'];
                  $rootScope.updateChannel = config.testrun.channel;
                  if ($rootScope.updateChannels.indexOf(config.testrun.channel) === -1)
                    $rootScope.updateChannels.push(config.testrun.channel);
                  $rootScope.target_build_version = "";
                  $rootScope.target_build_number = "";
                }
                delete config.testrun;
              }


              for (var platform in config) {
                var versions =[];
                for (var version in config[platform]) {
                  if (version !== "platform") {
                    var name = $rootScope.firefoxVersions[$rootScope.firefoxVersions.indexOf(version.split("#")[0])];
                    if (!name)
                      $scope.$emit('notify', {type: 'error',
                                              message: 'Build ' + version + ' dose not exists'});

                    var v = {};
                    v.exists = (!name) ? STATE.NOT_FOUND : STATE.NOT_CHECKED;
                    v.name = name;
                    v.buildNumber = (version.indexOf("#") !== -1) ?  ("build" + version.split("#")[1]) : "final";
                    v.buildNumbers = [v.buildNumber];
                    v.locale = config[platform][version];
                    v.availableLocales = [];
                    versions.push(v);
                  }
                }

                var newEmptyBuild = {};
                newEmptyBuild.firefoxVersions = versions;
                newEmptyBuild.platform = $rootScope.platforms.filter(function(value) {
                  return !value.added && (value.labels.split(" ")[0] === platform.split(" ")[0]);
                })[0];
                newEmptyBuild.platformVersion =  newEmptyBuild.platform.versions.filter(notAdded)[0];
                newEmptyBuild.platformVersion.added = true;

                if (!newEmptyBuild.platform.versions.filter(notAdded).length) {
                  newEmptyBuild.platform.added = true;
                }

                $rootScope.builds.push(newEmptyBuild);

                newEmptyBuild.firefoxVersions.forEach(function (version, index) {
                  if (version.name) {
                    $rootScope.buildNumberChanged(index, ($rootScope.builds.length - 1));
                  }
                });

                $scope.$watch(function () {
                  return newEmptyBuild.platformVersion
                }, function (newVersion, oldVersion) {
                  oldVersion.added = false;
                  newVersion.added = true;
                });
              }
              if(!$rootScope.$$phase) {
                $rootScope.$digest();
              }

            }
          };

          reader.readAsBinaryString(aFile);
        }
        $scope.versionsExists = function () {
          return $rootScope.firefoxVersions.length;
        }
      }
    }
  }]);
});
