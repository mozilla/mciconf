define(['directives/directives'], function (directives) {
  directives.directive('btnRadio', [function () {

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
  }]);
});
