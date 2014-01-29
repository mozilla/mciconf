/*
 * This filter should return all elements that are not already added
 * including the current element
 */
define(['filters/filters'], function (filters) {
  filters.filter('added', function () {

    return function (items, current) {
      var filteredArray = [];
      items.forEach(function (item) {
        if (!item.added || angular.equals(item, current))
          filteredArray.push(item);
      });

      return filteredArray;
    };
  });
});