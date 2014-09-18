/**
 * @fileOverview Instance Types page JS
 * @requires AngularJS
 *
 */

angular.module('InstanceTypesPage', [])
    .directive('onFinishRender', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$emit('ngRepeatFinished');
                    }, 1);
                }
            }
        }
    })
    .controller('InstanceTypesCtrl', function ($scope, $http, $timeout) {
        $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        $scope.items = [];
        $scope.cpuList = [];
        $scope.memoryList = [];
        $scope.diskList = [];
        $scope.cpuSelected = {};
        $scope.memorySelected = {};
        $scope.diskSelected = {};
        $scope.updatedItemList = [];
        $scope.itemsLoading = true;
        $scope.isNotChanged = true;
        $scope.jsonEndpoint = '';
        $scope.submitEndpoint = '';
        $scope.pageResource = '';
        $scope.initController = function (pageResource, jsonItemsEndpoint, submitEndpoint) {
            pageResource = pageResource || window.location.pathname.split('/')[0];
            $scope.jsonEndpoint = jsonItemsEndpoint;
            $scope.submitEndpoint = submitEndpoint;
            $scope.getItems();
            $scope.setWatch();
            $scope.setFocus();
        };
        $scope.initChosenWidgets = function () {
            angular.forEach($scope.items, function(item){
                $scope.initChosen('#select-cpu-'+item.name.replace(".", "\\."))
            });
            angular.forEach($scope.items, function(item){
                $scope.initChosen('#select-memory-'+item.name.replace(".", "\\."))
            });
            angular.forEach($scope.items, function(item){
                $scope.initChosen('#select-disk-'+item.name.replace(".", "\\."))
            });
        };
        $scope.initChosen = function(selector){
            $(selector).chosen({
                width: '80%', search_contains: true, create_option: function(term){
                    var chosen = this;
                    var new_value = term;
                    $timeout(function() {
                        chosen.append_option({
                            value: new_value,
                            text: new_value 
                        });
                    });
                },
                create_option_text: 'Insert a new value',
            });
        }; 
        $scope.setWatch = function () {
            $scope.$on('itemsLoaded', function () {
                $scope.getCPUList();
                $scope.getMemoryList();
                $scope.getDiskList();
            });
            $scope.$on('ngRepeatFinished', function () {
                $scope.initChosenWidgets();
            });
            $scope.$watch('cpuSelected', function () {
                if ($scope.checkForUpdatedCPUList() > 0) {
                    $scope.isNotChanged = false;
                }
            }, true);
            $scope.$watch('memorySelected', function () {
                if ($scope.checkForUpdatedMemoryList() > 0) {
                    $scope.isNotChanged = false;
                }
            }, true);
            $scope.$watch('diskSelected', function () {
                if ($scope.checkForUpdatedDiskList() > 0) {
                    $scope.isNotChanged = false;
                }
            }, true);
        };
        $scope.setFocus = function () {
        };
        $scope.getItems = function () {
            var csrf_token = $('#csrf_token').val();
            var data = "csrf_token="+csrf_token;
            $http({method:'POST', url:$scope.jsonEndpoint, data:data,
                   headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
              success(function(oData) {
                var results = oData ? oData.results : [];
                $scope.itemsLoading = false;
                $scope.items = results;
                $scope.$emit('itemsLoaded', $scope.items);
            }).error(function (oData, status) {
                var errorMsg = oData['message'] || null;
                if (errorMsg) {
                    if (status === 403 || status === 400) {  // S3 token expiration responses return a 400
                        $('#timed-out-modal').foundation('reveal', 'open');
                    } else {
                        Notify.failure(errorMsg);
                    }
                }
            });
        };
        $scope.getCPUList = function () {
            angular.forEach($scope.items, function(item){
                var isDup = false;
                angular.forEach($scope.cpuList, function(cpu){
                    if (cpu == item.cpu) {
                        isDup = true;
                    }
                });
                if (!isDup ) {
                    $scope.cpuList.push(item.cpu);
                }
            });
            $scope.cpuList.sort(function(a,b){
                return a - b;
            });
        };
        $scope.getMemoryList = function () {
            angular.forEach($scope.items, function(item){
                var isDup = false;
                angular.forEach($scope.memoryList, function(memory){
                    if (memory == item.memory) {
                        isDup = true;
                    }
                });
                if (!isDup ) {
                    $scope.memoryList.push(item.memory);
                }
            });
            $scope.memoryList.sort(function(a,b){
                return a - b;
            });
        };
        $scope.getDiskList = function () {
            angular.forEach($scope.items, function(item){
                var isDup = false;
                angular.forEach($scope.diskList, function(disk){
                    if (disk == item.disk) {
                        isDup = true;
                    }
                });
                if (!isDup ) {
                    $scope.diskList.push(item.disk);
                }
            });
            $scope.diskList.sort(function(a,b){
                return a - b;
            });
        };
        $scope.checkForUpdatedCPUList = function () {
            var count = 0;
            angular.forEach($scope.items, function(item){
                if ($scope.cpuSelected[item.name] != item.cpu) {
                    $scope.updatedItemList[item.name] = true;
                    count++;
                } 
            });
            return count;
        };
        $scope.checkForUpdatedMemoryList = function () {
            var count = 0;
            angular.forEach($scope.items, function(item){
                if ($scope.memorySelected[item.name] != item.memory) {
                    $scope.updatedItemList[item.name] = true;
                    count++;
                } 
            });
            return count;
        };
        $scope.checkForUpdatedDiskList = function () {
            var count = 0;
            angular.forEach($scope.items, function(item){
                if ($scope.diskSelected[item.name] != item.disk) {
                    $scope.updatedItemList[item.name] = true;
                    count++;
                } 
            });
            return count;
        };
        $scope.checkForUpdatedItems = function () {
            var count = 0;
            count += $scope.checkForUpdatedCPUList();
            count += $scope.checkForUpdatedMemoryList();
            count += $scope.checkForUpdatedDiskList();
            return count;
        };
        $scope.buildUpdateObject = function () {
            var update = [];
            for (key in $scope.updatedItemList) {
                var name = key;
                var cpu = $scope.cpuSelected[name];
                var memory = $scope.memorySelected[name];
                var disk = $scope.diskSelected[name];
                // Handle the cases where the input was typed rather than selected
                if (cpu == undefined) {
                    var selector = '#select_cpu_'+name.replace(".", "_")+'_chosen';
                    cpu = $(selector).find('.chosen-single').text();
                }
                if (memory == undefined) {
                    var selector = '#select_memory_'+name.replace(".", "_")+'_chosen';
                    memory = $(selector).find('.chosen-single').text();
                }
                if (disk == undefined) {
                    var selector = '#select_disk_'+name.replace(".", "_")+'_chosen';
                    disk = $(selector).find('.chosen-single').text();
                }
                update.push({name: name, cpu: cpu, memory: memory, disk: disk}); 
            }
            return update;
        };
        $scope.submit = function($event) {
            if (!$scope.isNotChanged) {
                var form = $($event.target);
                var update = $scope.buildUpdateObject();
                var csrf_token = form.find('input[name="csrf_token"]').val();
                $http({method:'POST', url:$scope.submitEndpoint,
                       data: $.param({'csrf_token': csrf_token, update: update}),
                       headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
                    success(function(oData) {
                        var results = oData ? oData.results : [];
                        Notify.success(oData.message);
                        $scope.submitCompleted();
                    }).error(function (oData, status) {
                        var errorMsg = oData['message'] || '';
                        if (errorMsg && status === 403) {
                            $('#timed-out-modal').foundation('reveal', 'open');
                        }
                        Notify.failure(errorMsg);
                    });
            } 
        };
        $scope.submitCompleted = function () {
            $scope.updatedItemList = [];
            $scope.isNotChanged = true;
            $scope.getItems();
        };
    })
;
