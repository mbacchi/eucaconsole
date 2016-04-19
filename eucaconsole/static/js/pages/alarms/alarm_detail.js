angular.module('AlarmDetailPage', [
    'AlarmsComponents', 'EucaChosenModule', 'ChartAPIModule', 'ChartServiceModule',
    'AlarmServiceModule', 'AlarmActionsModule', 'ModalModule', 'CreateAlarmModal', 'EucaRoutes'
])
.directive('alarmDetail', ['eucaRoutes', function (eucaRoutes) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            scope.alarm = JSON.parse(attrs.alarmDetail);
            scope.alarm.dimensions = JSON.stringify(scope.alarm.dimensions);

            eucaRoutes.getRouteDeferred('cloudwatch_alarms').then(function (path) {
                scope.redirectPath = path;
            });
        },
        controller: ['$scope', '$window', 'AlarmService', 'ModalService',
        function ($scope, $window, AlarmService, ModalService) {
            var csrf_token = $('#csrf_token').val();

            $scope.saveChanges = function (event) {
                $scope.alarm.dimensions = JSON.parse($scope.alarm.dimensions);
                if($scope.alarmUpdateForm.$invalid || $scope.alarmUpdateForm.$pristine) {
                    var $error = $scope.alarmUpdateForm.$error;
                    Object.keys($error).forEach(function (error) {
                        $error[error].forEach(function (current) {
                            current.$setTouched();
                        });
                    });
                    return;
                }

                AlarmService.updateAlarm($scope.alarm, csrf_token, true)
                    .then(function success (response) {
                        $window.location.href = $scope.redirectPath;
                    }, function error (response) {
                        $window.location.href = $scope.redirectPath;
                    });
            };

            $scope.delete = function (event) {
                event.preventDefault();

                var alarms = [{
                    name: $scope.alarm.name
                }];

                AlarmService.deleteAlarms(alarms, csrf_token, true)
                    .then(function success (response) {
                        $window.location.href = $scope.redirectPath;
                    }, function error (response) {
                        Notify.failure(response.data.message);
                    }); 
            };

            $scope.copyAlarm = function () {
                ModalService.openModal('copyAlarm');
            };
        }]
    };
}])
.directive('metricChart', function () {
    return {
        restrict: 'A',
        scope: {
            metric: '@',
            namespace: '@',
            duration: '=',
            statistic: '=',
            unit: '@',
            dimensions: '='
        },
        link: function (scope, element) {
            scope.target = element[0];
        },
        controller: ['$scope', 'CloudwatchAPI', 'ChartService',
        function ($scope, CloudwatchAPI, ChartService) {

            // ids and idtype comes from passed in dimensions
            // iterate over dimensions, will need a separate
            // chart line for each dimension
            //
            $scope.$watch('dimensions', function (x) {
                if(!x) {
                    return;
                }

                Object.keys($scope.dimensions).forEach(function (dimension) {
                    var ids = $scope.dimensions[dimension];

                    CloudwatchAPI.getChartData({
                        ids: ids,
                        idtype: dimension,
                        metric: $scope.metric,
                        namespace: $scope.namespace,
                        duration: $scope.duration,
                        statistic: $scope.statistic,
                        unit: $scope.unit
                    }).then(function(oData) {
                        var results = oData ? oData.results : '';
                        var chart = ChartService.renderChart($scope.target, results, {
                            unit: oData.unit || scope.unit
                        });
                    });
                });
            });

        }]
    };
});
