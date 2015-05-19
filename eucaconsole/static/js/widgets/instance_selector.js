/**
 * @fileOverview Instance Selector Directive JS
 * @requires AngularJS
 *
 */

angular.module('EucaConsoleUtils').directive('instanceSelector', function() {
    return {
        restrict: 'E',
        scope: {
            option_json: '@options'
        },
        templateUrl: function (scope, elem) {
            return elem.template;
        },
        controller: function ($scope, $http, $timeout, eucaHandleError, eucaUnescapeJson) {
            $scope.allInstanceList = [];
            $scope.instanceList = [];
            $scope.selectedInstanceList = [];
            $scope.instancesJsonEndpoint = '';
            $scope.isVPCSupported = false;
            $scope.vpcNetwork = 'None';
            $scope.vpcSubnets = [];
            $scope.availabilityZones = [];
            $scope.searchQueryURL = '';
            $scope.searchFilter = '';
            $scope.filterKeys = [];
            $scope.tableText = {};
            $scope.initSelector = function () {
                var options = JSON.parse(eucaUnescapeJson($scope.option_json));
                $scope.setInitialValues(options);
                $scope.setWatcher();
                if ($scope.instancesJsonEndpoint !== '') {
                    $scope.getAllInstanceList();
                }
                // Workaround for the Bug in jQuery to prevent JS Uncaught TypeError
                // See http://stackoverflow.com/questions/27408501/ng-repeat-sorting-is-throwing-an-exception-in-jquery
                Object.getPrototypeOf(document.createComment('')).getAttribute = function() {};
            };
            $scope.setInitialValues = function (options) {
                $scope.allInstanceList = [];
                $scope.instanceList = [];
                $scope.selectedInstanceList = [];
                $scope.vpcNetwork = 'None';
                $scope.vpcSubnets = [];
                $scope.availabilityZones = [];
                $scope.isVPCSupported = false;
                $scope.searchQueryURL = '';
                $scope.searchFilter = '';
                $scope.filterKeys = [];
                if (options.hasOwnProperty('is_vpc_supported')) {
                    $scope.isVPCSupported = options.is_vpc_supported;
                }
                if (options.hasOwnProperty('instance_selector_text')) {
                    $scope.tableText = options.instance_selector_text;
                }
                if (options.hasOwnProperty('instances_json_endpoint')) {
                    $scope.instancesJsonEndpoint = options.instances_json_endpoint;
                }
                if (options.hasOwnProperty('all_instance_list')) {
                    $scope.allInstanceList = options.allInstance_list;
                }
            };
            $scope.setWatcher = function () {
                $scope.$watch('allInstanceList', function () {
                    // when all instance list is updated,
                    // make sure the filtered, displayed instance list is also updated
                    $scope.updateInstanceList();
                }, true);
                $scope.$watch('selectedInstanceList', function () {
                    // Timeout is needed for the ng-repeat's table to update
                    $timeout(function() {
                        // adjust the checkboxes when selected instance list is updated
                        $scope.checkInstanceAllCheckbox();
                        $scope.matchInstanceCheckboxes();
                        // when an instance is added or removed,
                        // adjust the instance zone list, or the instance vpc subnet list
                        if ($scope.vpcNetwork === 'None') { 
                            $scope.updateInstanceAvailabilityZones();
                        } else {
                            $scope.updateInstanceVPCSubnets();
                        }
                    });
                    // inform the updated selected instance list
                    $scope.$emit('eventUpdateSelectedInstanceList', $scope.selectedInstanceList);
                }, true);
                $scope.$watch('availabilityZones', function () {
                    // inform the updated instance zone list
                    $scope.$emit('eventUpdateAvailabilityZones', $scope.availabilityZones);
                }, true);
                $scope.$watch('vpcSubnets', function () {
                    // inform the updated vpc subnet list
                    $scope.$emit('eventUpdateVPCSubnets', $scope.vpcSubnets);
                }, true);
                $scope.$watch('vpcNetwork', function () {
                    // when VPV network is updated, re-filter through the instance list for display
                    $scope.updateInstanceList();
                });
                // magic-search signal
                $scope.$on('eventQuerySearch', function ($event, query) {
                    $scope.searchQueryURL = '';
                    if (query.length > 0) {
                       $scope.searchQueryURL = query;
                    }
                    $scope.getAllInstanceList();
                });
                // magic-search signal
                $scope.$on('eventTextSearch', function ($event, text, filterKeys) {
                    $scope.searchFilter = text;
                    $timeout(function () {
                        $scope.searchFilterItems(filterKeys);
                    });
                });
                // handle the checkbox click event
                $('#instance_selector').on('click', 'input:checkbox', function () {
                    var instanceID = $(this).val();
                    if (instanceID === '_all') {
                        // Clicked all checkbox
                        if ($(this).prop("checked") === true){
                            // in case of 'select all'
                            $scope.selectedInstanceList = [];
                            // add all instances from the instance list to the selected instance list
                            angular.forEach($scope.instanceList, function(instance) {
                                $scope.selectedInstanceList.push(instance);
                            });
                            // make sure all checkboxes are visually checked
                            $('#instance_selector input:checkbox').not(this).prop('checked', true);
                        } else {
                            // in case of 'de-selected all'
                            // clear the selected instance list
                            $scope.selectedInstanceList = [];
                            // make sure all checkboxes are visually un-checked
                            $('#instance_selector input:checkbox').not(this).prop('checked', false);
                        }
                    } else {
                        // Click instance checkbox
                        // un-checked the 'check all' checkbox
                        $('#instance-all-checkbox').prop('checked', false);
                        if ($(this).prop("checked") === true){
                            // in case of 'select'
                            var itemExists = false;
                            angular.forEach($scope.selectedInstanceList, function(instance, $index) {
                                if (instance.id === instanceID) {
                                    itemExists = true;
                                }
                            });
                            if (itemExists === false) {
                                angular.forEach($scope.instanceList, function(instance) {
                                    if (instance.id === instanceID) {
                                        $scope.selectedInstanceList.push(instance);
                                    }
                                });
                            }
                        } else {
                            // in case of 'un-select'
                            angular.forEach($scope.selectedInstanceList, function(instance, $index) {
                                if (instance.id === instanceID) {
                                    $scope.selectedInstanceList.splice($index, 1);
                                } 
                            });
                        }
                    }
                    $scope.$apply();
                });
                // receive signal that informs the availability zone list update
                $scope.$on('eventWizardUpdateAvailabilityZones', function ($event, availabilityZones) {
                    $scope.availabilityZones = availabilityZones;
                    // update the selected instance list to ensure that the selected instances belong to the new zones
                    $scope.updateSelectedInstanceListForAvailabilityZones();
                    // adjust the checkboxes accoridng to the updated selected instance list
                    $timeout(function() {
                        $scope.clearInstanceCheckboxes();
                        $scope.matchInstanceCheckboxes();
                    });
                });
                // receive signal that informs the VPC subnet list update
                $scope.$on('eventWizardUpdateVPCSubnets', function ($event, vpcSubnets) {
                    $scope.vpcSubnets = vpcSubnets;
                    // update the selected instance list to ensure that the selected instances belong to the new VPC subnets
                    $scope.updateSelectedInstanceListForVPCSubnets();
                    // adjust the checkboxes accoridng to the updated selected instance list
                    $timeout(function() {
                        $scope.clearInstanceCheckboxes();
                        $scope.matchInstanceCheckboxes();
                    });
                });
                // receive signal that informs the VPC network update
                $scope.$on('eventWizardUpdateVPCNetwork', function ($event, vpcNetwork) {
                    $scope.vpcNetwork = vpcNetwork;
                });
                // receive signal that informs a new set of selected instances
                $scope.$on('eventInitSelectedInstances', function ($event, newSelectedInstances) {
                    $scope.initSelectedInstances(newSelectedInstances);
                });
            };
            // AJAX call to receive all instance list from the server
            $scope.getAllInstanceList = function () {
                var csrf_token = $('#csrf_token').val();
                var data = "csrf_token=" + csrf_token;
                if ($scope.searchQueryURL !== '') {
                    data = data + "&" + $scope.searchQueryURL;
                }
                $http({
                    method:'POST', url:$scope.instancesJsonEndpoint, data:data,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success(function(oData) {
                    var results = oData ? oData.results : [];
                    $scope.allInstanceList = results;
                }).error(function (oData) {
                    eucaHandleError(oData, status);
                });
            };
            // filter through the all instance list and pick the instances that belong to this VPC network
            $scope.updateInstanceList = function () {
                var tempInstanceArray = [];
                angular.forEach($scope.allInstanceList, function (instance) {
                    if ($scope.vpcNetwork === 'None') {
                        if (instance.vpc_name === '') {
                            tempInstanceArray.push(instance);
                        }
                    } else {
                        if (instance.vpc_name !== '') {
                            tempInstanceArray.push(instance);
                        }
                    }
                });
                angular.copy(tempInstanceArray, $scope.instanceList);
                $scope.updateSelectedInstanceList();
                // Update the instance checkboxes to ensure the checked values are matched
                // timeout is needed for the table's display update to complete
                $timeout(function() {
                    $scope.matchInstanceCheckboxes();
                });
            };
            // Only keep the selected instances that are in the current instanceList
            $scope.updateSelectedInstanceList = function () {
                var dupList = $scope.selectedInstanceList.slice(0);
                $scope.selectedInstanceList = [];
                angular.forEach(dupList, function (selectedInstance, $index) {
                    angular.forEach($scope.instanceList, function (instance) {
                        if (selectedInstance.id === instance.id) {
                            $scope.selectedInstanceList.push(selectedInstance);
                        } 
                    });
                });
            };
            // initialize the select instansce list values
            $scope.initSelectedInstances = function (newSelectedInstances) {
                var newList = [];
                angular.forEach(newSelectedInstances, function (instanceID) {
                    angular.forEach($scope.allInstanceList, function (instance) {
                        if (instance.id === instanceID) {
                            newList.push(instance);
                        } 
                    });
                });
                $scope.selectedInstanceList = newList;
            };
            // adjust the selected instance list to ensure that selected instances belong to the availiablie zone list
            $scope.updateSelectedInstanceListForAvailabilityZones = function () {
                var dupList = $scope.selectedInstanceList.slice(0);
                $scope.selectedInstanceList = [];
                angular.forEach(dupList, function (selectedInstance) {
                    angular.forEach($scope.instanceList, function (instance) {
                        if (selectedInstance.id === instance.id) {
                            var includesZone = false;
                            angular.forEach($scope.availabilityZones, function(zone) {
                                if (zone === instance.placement) {
                                    includesZone = true;
                                }
                            });
                            if (includesZone === true) {
                                $scope.selectedInstanceList.push(selectedInstance);
                            }
                        } 
                    });
                });
            };
            // adjust the selected instance list to ensure that selected instances belong to the VPC subnet list
            $scope.updateSelectedInstanceListForVPCSubnets = function () {
                var dupList = $scope.selectedInstanceList.slice(0);
                $scope.selectedInstanceList = [];
                angular.forEach(dupList, function (selectedInstance) {
                    angular.forEach($scope.instanceList, function (instance) {
                        if (selectedInstance.id === instance.id) {
                            var includesSubnet = false;
                            angular.forEach($scope.vpcSubnets, function(subnet) {
                                if (subnet === instance.subnet_id) {
                                    includesSubnet = true;
                                }
                            });
                            if (includesSubnet === true) {
                                $scope.selectedInstanceList.push(selectedInstance);
                            }
                        } 
                    });
                });
            };
            // adjust the availability zone list to include the selected instances' zones
            $scope.updateInstanceAvailabilityZones = function () {
                $scope.availabilityZones = [];
                angular.forEach($scope.selectedInstanceList, function (selectedInstance) {
                    angular.forEach($scope.instanceList, function (instance) {
                        if (selectedInstance.id === instance.id) {
                            var existsZone = false;
                            angular.forEach($scope.availabilityZones, function (zone) {
                                if (zone == instance.placement) {
                                    existsZone = true;
                                }
                            });
                            if (existsZone === false) {
                                $scope.availabilityZones.push(instance.placement);
                            }
                        } 
                    });
                });
            };
            // adjust the VPC subnet list to include the selected instances' VPC subnets
            $scope.updateInstanceVPCSubnets = function () {
                $scope.vpcSubnets = [];
                angular.forEach($scope.selectedInstanceList, function (selectedInstance) {
                    angular.forEach($scope.instanceList, function (instance) {
                        if (selectedInstance.id === instance.id) {
                            var existsSubnet = false;
                            angular.forEach($scope.vpcSubnets, function (subnet) {
                                if (subnet == instance.subnet_id) {
                                    existsSubnet = true;
                                }
                            });
                            if (existsSubnet === false) {
                                $scope.vpcSubnets.push(instance.subnet_id);
                            }
                        } 
                    });
                });
            };
            // taken from magic-search's implementation
            /*  Filter items client side based on search criteria.
             *  @param {array} filterProps Array of properties to filter items on
             */
            $scope.searchFilterItems = function(filterProps) {
                var filterText = ($scope.searchFilter || '').toLowerCase();
                if (filterProps !== '' && filterProps !== undefined){
                    // Store the filterProps input for later use as well
                    $scope.filterKeys = filterProps;
                }
                if (filterText === '') {
                    // If the search filter is empty, skip the filtering
                    $scope.instanceList = $scope.allInstanceList;
                    return;
                }
                // Leverage Array.prototype.filter (ECMAScript 5)
                var filteredItems = $scope.allInstanceList.filter(function(item) {
                    for (var i=0; i < $scope.filterKeys.length; i++) {  // Can't use $.each or Array.prototype.forEach here
                        var propName = $scope.filterKeys[i];
                        var itemProp = item.hasOwnProperty(propName) && item[propName];
                        if (itemProp && typeof itemProp === "string" && 
                            itemProp.toLowerCase().indexOf(filterText) !== -1) {
                                return item;
                        } else if (itemProp && typeof itemProp === "object") {
                            // In case of mutiple values, create a flat string and perform search
                            var flatString = $scope.getItemNamesInFlatString(itemProp);
                            if (flatString.toLowerCase().indexOf(filterText) !== -1) {
                                return item;
                            }
                        }
                    }
                });
                // Update the items[] with the filtered items
                $scope.instanceList = filteredItems;
            };
            // un-check the 'check all' box if there is no selected instances
            $scope.checkInstanceAllCheckbox = function () {
                // When selectedInstanceList is empty and the select all checkbox is clicked, clear the checkbox
                if ($scope.selectedInstanceList.length === 0 && 
                    $('#instance-all-checkbox').prop('checked') === true) {
                    $('#instance-all-checkbox').prop('checked', false);
                }
            };
            // clear all instance checkboxes on the table
            $scope.clearInstanceCheckboxes = function () {
                angular.forEach($scope.allInstanceList, function(instance) {
                    var checkbox = $('#instance-checkbox-' + instance.id);
                    checkbox.prop("checked", false);
                });
            };
            // Ensure that the selectedInstanceList's items are checked when the table updates
            $scope.matchInstanceCheckboxes = function () {
                angular.forEach($scope.selectedInstanceList, function(instance) {
                    var checkbox = $('#instance-checkbox-' + instance.id);
                    if (checkbox.length > 0 && checkbox.prop("checked") === false){
                        checkbox.prop("checked", true);
                    }
                });
            };
            // init function call for the directive
            $scope.initSelector();
        }
    };
})
;
