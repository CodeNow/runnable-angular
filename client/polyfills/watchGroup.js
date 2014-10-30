 require('app')
   .run('polyfillWatchGroup', polyfillWatchGroup);
/**
 * @ngInject
 */
function polyfillWatchGroup (
  $rootScope
) {
  /**
   * @ngdoc method
   * @name $rootScope.Scope#$watchGroup
   * @kind function
   *
   * @description
   * A variant of {@link ng.$rootScope.Scope#$watch $watch()} where it watches an array of `watchExpressions`.
   * If any one expression in the collection changes the `listener` is executed.
   *
   * - The items in the `watchExpressions` array are observed via standard $watch operation and are examined on every
   *   call to $digest() to see if any items changes.
   * - The `listener` is called whenever any expression in the `watchExpressions` array changes.
   *
   * @param {Array.<string|Function(scope)>} watchExpressions Array of expressions that will be individually
   * watched using {@link ng.$rootScope.Scope#$watch $watch()}
   *
   * @param {function(newValues, oldValues, scope)} listener Callback called whenever the return value of any
   *    expression in `watchExpressions` changes
   *    The `newValues` array contains the current values of the `watchExpressions`, with the indexes matching
   *    those of `watchExpression`
   *    and the `oldValues` array contains the previous values of the `watchExpressions`, with the indexes matching
   *    those of `watchExpression`
   *    The `scope` refers to the current scope.
   * @returns {function()} Returns a de-registration function for all listeners.
   */
  $rootScope.$watchGroup = $rootScope.$watchGroup || function(watchExpressions, listener) {
    var oldValues = new Array(watchExpressions.length);
    var newValues = new Array(watchExpressions.length);
    var deregisterFns = [];
    var self = this;
    var changeReactionScheduled = false;
    var firstRun = true;

    if (!watchExpressions.length) {
      // No expressions means we call the listener ASAP
      var shouldCall = true;
      self.$evalAsync(function() {
        if (shouldCall) listener(newValues, newValues, self);
      });
      return function deregisterWatchGroup() {
        shouldCall = false;
      };
    }

    if (watchExpressions.length === 1) {
      // Special case size of one
      return this.$watch(watchExpressions[0], function watchGroupAction(value, oldValue, scope) {
        newValues[0] = value;
        oldValues[0] = oldValue;
        listener(newValues, (value === oldValue) ? newValues : oldValues, scope);
      });
    }

    watchExpressions.each(function(expr, i) {
      var unwatchFn = self.$watch(expr, function watchGroupSubAction(value, oldValue) {
        newValues[i] = value;
        oldValues[i] = oldValue;
        if (!changeReactionScheduled) {
          changeReactionScheduled = true;
          self.$evalAsync(watchGroupAction);
        }
      });
      deregisterFns.push(unwatchFn);
    });

    function watchGroupAction() {
      changeReactionScheduled = false;

      if (firstRun) {
        firstRun = false;
        listener(newValues, newValues, self);
      } else {
        listener(newValues, oldValues, self);
      }
    }

    return function deregisterWatchGroup() {
      while (deregisterFns.length) {
        deregisterFns.shift()();
      }
    };
  };
}
