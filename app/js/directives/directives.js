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
                                   buildNumber !== 'release';
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

      $scope.focused = false;
      $scope.focus = function () {
        $scope.focused = !$scope.focused;
      }
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
        $scope.alerts.push({type: aMessage.type, message: aMessage.message, uid: getNextUid()});
        $scope.alerts.reverse();
        if ($scope.alerts.length > 3)
          $scope.history.push($scope.alerts.pop());
        else
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

mciconf.directive('btnRadio', function () {

  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ngModelCtrl) {
      ngModelCtrl.$render = function () {
        element.toggleClass('active', angular.equals(ngModelCtrl.$modelValue, scope.$eval(attrs.btnRadio)));
      };

      element.bind('click', function () {
        if (!element.hasClass('active')) {
          scope.$apply(function () {
            ngModelCtrl.$setViewValue(scope.$eval(attrs.btnRadio));
            ngModelCtrl.$render();
          });
        }
      });
    }
  }
});

mciconf.directive('dropDownCheckBox', function () {

  return {
    restrict: 'AE',
    templateUrl: 'templates/drop-down-check-box.html',
    controller: function ($scope, $rootScope) {
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
      $scope.mouseleave = function () {
        $scope.focused = false;
      }
    }
  };
});

mciconf.directive('configPicker', function () {

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
                $rootScope.targetType = 'BuildId';
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
                  v.exists = STATE.NOT_CHECKED;
                  v.name = name;
                  v.buildNumber = (version.indexOf("#") !== -1) ?  ("build" + version.split("#")[1]) : "release";
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
  };
});
