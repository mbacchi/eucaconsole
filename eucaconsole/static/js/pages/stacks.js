/**
 * @fileOverview CloudFormations landing page JS
 * @requires AngularJS, jQuery
 *
 */

// Pull in common landing page module
angular.module('StacksPage', ['LandingPage', 'EucaConsoleUtils'])
    .controller('StacksPageCtrl', function ($scope, $http, $timeout, eucaHandleError) {
        $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        $scope.stackName = '';
        $scope.initController = function(delete_stack_url) {
            $scope.delete_stack_url = delete_stack_url;
        };
        $scope.revealModal = function (action, stack) {
            $scope.stackName = stack.name;
            var modal = $('#' + action + '-stack-modal');
            modal.foundation('reveal', 'open');
        };
        $scope.deleteStack = function($event) {
            $event.preventDefault();
            var form = $($event.target);
            var csrf_token = form.find('input[name="csrf_token"]').val();
            var data = "name=" + $scope.stackName + "&csrf_token=" + csrf_token;
            $http({method:'POST', url:$scope.delete_stack_url, data:data,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
              success(function(oData) {
                $('#delete-stack-modal').foundation('reveal', 'close');
                var results = oData ? oData.results : [];
                if (oData.error === undefined) {
                    $timeout(function() {
                        $scope.$broadcast('refresh');
                    }, 1000);
                    Notify.success(oData.message);
                } else {
                    Notify.failure(oData.message);
                }
            }).error(function (oData, status) {
                eucaHandleError(oData, status);
            });
        };
    });
