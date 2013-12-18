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

const TIMEOUT_CHECKING_LOCALES = 5000;
const TIMEOUT_NOTIFICATION_DISPLAYED = 3000;

// Helper callback used to filter platforms
function notAdded(value) {
  return !value.added;
}
// Helper function to get unique ids
var getNextUid = function getNextUid() {
  var counter = 0;

  return function () {
    return counter += 1;
  }
}();

var mciconf = angular.module('mciconf', []);


