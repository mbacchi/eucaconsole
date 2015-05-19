/**
 * @fileOverview Load Balander Listener Editor JS
 * @requires AngularJS
 *
 */
angular.module('ELBListenerEditor', ['EucaConsoleUtils'])
    .controller('ELBListenerEditorCtrl', function ($scope, $timeout, eucaHandleError, eucaUnescapeJson) {
        $scope.isListenerNotComplete = true;
        $scope.hasDuplicatedListener = false;
        $scope.hasDuplicatedFromPorts = false;
        $scope.listenerArray = []; 
        $scope.protocolList = []; 
        $scope.toProtocolList = []; 
        $scope.fromProtocol = undefined;
        $scope.toProtocol = undefined;
        $scope.fromPort = '';
        $scope.toPort = '';
        $scope.portRangePattern = '';
        $scope.isFromProtocolValid = false;
        $scope.classFromPortDiv = '';
        $scope.classToPortDiv = '';
        $scope.classDuplicatedFromPortDiv = '';
        $scope.classDuplicatedListenerDiv = '';
        $scope.classNoListenerWarningDiv = '';
        $scope.elbListenerTextarea = undefined;
        $scope.serverCertificateName = '';
        $scope.serverCertificateARN = '';
        $scope.serverCertificateARNBlock = {};
        $scope.addListenerButtonClass = 'disabled';
        $scope.initEditor = function (optionsJson) {
            var options = JSON.parse(eucaUnescapeJson(optionsJson));
            $scope.setInitialValues(options);
            $scope.setWatcher();
            // Workaround for the Bug in jQuery to prevent JS Uncaught TypeError
            // See http://stackoverflow.com/questions/27408501/ng-repeat-sorting-is-throwing-an-exception-in-jquery
            Object.getPrototypeOf(document.createComment('')).getAttribute = function() {};
        };
        $scope.setInitialValues = function (options) {
            if ($('#elb-listener').length > 0) {
                $scope.elbListenerTextarea = $('#elb-listener');
            }
            $scope.protocolList = []; 
            $scope.toProtocolList = []; 
            // insert the default object for placeholder display
            $scope.protocolList.push({'name': 'Select...', 'value': 'None', 'port': ''});
            // initialze the models using the default, placeholder object
            $scope.fromProtocol = $scope.protocolList[0];
            $scope.toProtocol = $scope.protocolList[0];
            $scope.fromPort = $scope.protocolList[0].port;
            $scope.toPort = $scope.protocolList[0].port;
            if (options.hasOwnProperty('protocol_list')) {
                if (options.protocol_list instanceof Array && options.protocol_list.length > 0) {
                    $scope.protocolList = $scope.protocolList.concat(options.protocol_list);
                }
            }
            if (options.hasOwnProperty('listener_list')) {
                if (options.listener_list instanceof Array && options.listener_list.length > 0) {
                    $scope.setInitialListenerArray(options.listener_list);
                    if ($scope.listenerArray.length > 0) {
                        $scope.elbListenerTextarea.val(JSON.stringify($scope.listenerArray));
                    }
                }
            }
            if (options.hasOwnProperty('port_range_pattern')) {
                $scope.portRangePattern = options.port_range_pattern;
            }
            $scope.isFromProtocolValid = false;
            // If serverCertificateName is empty, set it to the selected option name of the #certificates select list
            if ($scope.serverCertificateName === '' && $('#certificates option:selected').length > 0) {
                $scope.serverCertificateName = $('#certificates option:selected').text();
            }
        };
        $scope.setWatcher = function () {
            $scope.$watch('fromProtocol', function(){
                // set the 'fromPort' value to fromProtocol's default port
                // for instance, HTTP -> 80
                $scope.fromPort = parseInt($scope.fromProtocol.port);
                // activate or inactivate the add button
                $scope.checkAddListenerButtonCondition();
                // adjust the options for toProtocol select element based on the fromProtocol choice
                $scope.adjustToProtocolList();
            });
            $scope.$watch('toProtocol', function(){
                // set the 'toPort' value to toProtocol's default port
                $scope.toPort = parseInt($scope.toProtocol.port);
                $scope.checkAddListenerButtonCondition();
            });
            $scope.$watch('fromPort', function(){
                // check for duplicated port items in the listener list
                $scope.checkForDuplicatedFromPorts();
                $scope.checkAddListenerButtonCondition(); 
                // make sure that 'fromProtocol' value has been selected
                $scope.validateFromProtocol();
            });
            $scope.$watch('toPort', function(){
                $scope.checkAddListenerButtonCondition();
            });
            $scope.$watch('classToPortDiv', function () {
                // if 'toPort' is in valid, disable the add button
                if ($scope.classToPortDiv === 'error'){
                    $scope.isListenerNotComplete = true;
                }
            });
            $scope.$watch('classFromPortDiv', function () {
                // if 'fromPort' is in valid, disable the add button
                if ($scope.classFromPortDiv === 'error'){
                    $scope.isListenerNotComplete = true;
                }
            });
            $scope.$watch('isListenerNotComplete', function () {
                // if isListenerNotComplete flag is updated, check for the add button conditions
                $scope.setAddListenerButtonClass();
            });
            $scope.$watch('hasDuplicatedFromPort', function () {
                $scope.setAddListenerButtonClass(); 
                // clear the error class
                $scope.classDuplicatedFromPortDiv = '';
                // timeout is needed for the DOM update to complete
                $timeout(function () {
                    if ($scope.hasDuplicatedFromPort === true) {
                        $scope.classDuplicatedFromPortDiv = 'error';
                    }
                });
            });
            $scope.$watch('hasDuplicatedListener', function () {
                $scope.setAddListenerButtonClass(); 
                // clear the error class
                $scope.classDuplicatedListenerDiv = '';
                // timeout is needed for the DOM update to complete
                $timeout(function () {
                    if ($scope.hasDuplicatedListener === true) {
                        $scope.classDuplicatedListenerDiv = 'error';
                    }
                });
            });
            $scope.$watch('listenerArray', function () {
                // if one of more items in the list, clear the error class
                if ($scope.listenerArray.length > 0) {
                    $scope.classNoListenerWarningDiv = '';
                }
                // signal the update in the listener array to the parent controller
                $scope.$emit('eventUpdateListenerArray', $scope.listenerArray);
            }, true);
            // when SSL certificate name is updated, the parent controller broadcasts the event
            $scope.$on('eventUpdateCertificateName', function ($event, name) {
                $scope.serverCertificateName = name;
            });
            // when SSL certificate ARN is updated,
            // the parent controller broadcasts the event to inform the arn string
            // and the object that contains the listener's protocol and port information
            $scope.$on('eventUpdateCertificateARN', function ($event, arn, block) {
                $scope.serverCertificateARN = arn;
                $scope.serverCertificateARNBlock = block;
            });
            // this event occurs when the user clicks the certificate modal's 'use this certificate' button
            $scope.$on('eventUseThisCertificate', function ($event, arn, name) {
                $scope.serverCertificateARN = arn;
                $scope.serverCertificateName = name;
                $scope.handleEventUseThisCertificate();
            });
        };
        // In case of the duplicated listener or error in the input fields,
        // add the 'disabled' class to the button
        $scope.setAddListenerButtonClass = function () {
            if ($scope.isListenerNotComplete === true ||
                $scope.hasDuplicatedFromPort === true ||
                $scope.hasDuplicatedListener === true) {
                $scope.addListenerButtonClass = 'disabled';
            } else {
                $scope.addListenerButtonClass = '';
            }
        };
        // reset the protocol selection values and the flag
        // the port values will be automatically adjusted when the protocols are updated
        $scope.resetValues = function () {
            $scope.fromProtocol = $scope.protocolList[0];
            $scope.toProtocol = $scope.protocolList[0];
            $scope.isFromProtocolValid = false;
        };
        // go through the listener list and compare fromPort values
        // this operation is used to warn user from selecting
        // existing fromPort in early interaction stage
        $scope.checkForDuplicatedFromPorts = function () {
            $scope.hasDuplicatedFromPort = false;
            angular.forEach($scope.listenerArray, function (block) {
                if (block.fromPort === $scope.fromPort) {
                    $scope.hasDuplicatedFromPort = true;
                }
            });
            return;
        };
        // go through the listener list and check for the duplcated items
        $scope.checkForDuplicatedListeners = function () {
            $scope.hasDuplicatedListener = false;
            // Create a new array block based on the current user input on the panel
            var newBlock = $scope.createListenerArrayBlock();
            for(var i=0; i < $scope.listenerArray.length; i++){
                // Compare the new array block with the existing ones
                if( $scope.compareListeners(newBlock, $scope.listenerArray[i]) ){
                    $scope.hasDuplicatedListener = true;
                    return;
                }
            }
            return;
        };
        // a compare method used by checkForDuplicatedListeners above
        $scope.compareListeners = function (block1, block2) {
            if (block1.fromPort == block2.fromPort &&
                block1.toPort == block2.toPort &&
                block1.fromProtocol.value == block2.fromProtocol.value &&
                block1.toProtocol.value == block2.toProtocol.value) {
                return true;
            }
            return false;
        };
        // create a listener object using the current user selection and
        // SSL certificate information received from the parent controller
        $scope.createListenerArrayBlock = function () {
            var block = {
                'fromProtocol': $scope.fromProtocol.value,
                'fromPort': $scope.fromPort,
                'toProtocol': $scope.toProtocol.value,
                'toPort': $scope.toPort,
            };
            if (block.fromProtocol === 'HTTPS' || block.fromProtocol === 'SSL') {
                block.certificateARN = $scope.serverCertificateARN;
                block.certificateName = $scope.serverCertificateName;
            }
            return block;
        };
        // construct the listener array using JSON data from the server
        $scope.setInitialListenerArray = function (listener_list) {
            angular.forEach(listener_list, function (listener) {
                var block = {
                    'fromProtocol': listener.protocol,
                    'fromPort': listener.from_port,
                    'toProtocol': listener.protocol,
                    'toPort': listener.to_port,
                };
                $scope.listenerArray.push(block);
            });
        };
        // handle the add listener button's click event
        $scope.addListener = function ($event) {
            $event.preventDefault();
            $scope.checkAddListenerButtonCondition(); 
            // timeout is needed for all DOM updates and validations to be complete
            $timeout(function () {
                if ($scope.isListenerNotComplete === true ||
                    $scope.hasDuplicatedFromPort === true ||
                    $scope.hasDuplicatedListener === true) {
                    return false;
                }
                // Add the listener 
                $scope.listenerArray.push($scope.createListenerArrayBlock());
                $scope.syncListeners();
                // inform the newly updated listener array
                $scope.$emit('eventUpdateListenerArray', $scope.listenerArray);
            });
        };
        // handle the remove listener icon's click event
        $scope.removeListener = function (index) {
            // remove the item
            $scope.listenerArray.splice(index, 1);
            $scope.syncListeners();
            // inform the updated listener array
            $scope.$emit('eventUpdateListenerArray', $scope.listenerArray);
            // check for the case where there is no items in the list
            if ($scope.listenerArray.length === 0) {
                $scope.classNoListenerWarningDiv = 'error';
            }
        };
        // handle the cancel link's click event
        $scope.cancelListener = function ($event) {
            $event.preventDefault();
            // reset all values
            $scope.resetValues();
            $scope.classDuplicatedFromPortDiv = '';
            $scope.classDuplicatedListenerDiv = '';
            $scope.classNoListenerWarningDiv = '';
            $scope.addListenerButtonClass = 'disabled';
            // request the validation check to the parent controller
            // to clear out any existing error states on the parent scope
            $timeout(function () {
                $scope.$emit('requestValidationCheck');
            });
        };
        $scope.syncListeners = function () {
            // paste the listener array to the hidden input field to pass the data to the server
            $scope.elbListenerTextarea.val(JSON.stringify($scope.listenerArray));
            // clear the variables
            $scope.resetValues();
            $scope.checkAddListenerButtonCondition(); 
            // timeout is needed for all DOM updates and validations to complete
            $timeout(function () {
                // request the validation check to the parent controller
                // to clear out any existing error states on the parent scope
                $scope.$emit('requestValidationCheck');
            });
        };
        // go over various conditions to check for any errors before enabling the add button
        $scope.checkAddListenerButtonCondition = function () {
            if ($scope.fromProtocol.value === undefined || $scope.toProtocol.value === undefined) {
                // the protocol values cannot be undefined
                $scope.isListenerNotComplete = true;
            } else if ($scope.fromProtocol.value === 'None' || $scope.toProtocol.value === 'None') {
                // the protocol values cannot be the default, placeholder value 
                $scope.isListenerNotComplete = true;
            } else if ($scope.fromPort === '' || $scope.toPort === '') {
                // the port values cannot be empty
                $scope.isListenerNotComplete = true;
            } else {
                // or else, listener's values are ok
                $scope.isListenerNotComplete = false;
            }
            // check for more conditions if listener's values are valid
            if ($scope.isListenerNotComplete === false) {
                $scope.checkFromPortInputCondition();
                $scope.checkToPortInputCondition();
                $scope.checkForDuplicatedListeners();
            }
        };
        // Return the matching port given the protocol name
        $scope.getPortFromProtocolList = function (name) {
            var port = '';
            angular.forEach($scope.protocolList, function(protocol) {
                if (protocol.name === name) {
                    port = protocol.port;
                }
            });
            return port;
        };
        // make sure that the 'fromProtocol' values is selected by user, not the placeholder value
        $scope.validateFromProtocol = function () {
            if ($scope.fromProtocol.value !== undefined &&
                $scope.fromProtocol.value !== 'None' &&
                !isNaN($scope.fromPort)) {
                $scope.isFromProtocolValid = true;
            }
        }; 
        // when fromProtocol is selected, toProtocol select options need to be adjusted
        // for instance, when HTTP is selected for fromProtocol,
        // HTTP and HTTPS protocols are only acceptable for toProtocol selection
        $scope.adjustToProtocolList = function () {
            var newProtocolList = [];
            newProtocolList.push({'name': 'Select...', 'value': 'None', 'port': ''});
            $scope.toProtocol = $scope.protocolList[0];
            $scope.toPort = $scope.protocolList[0].port;
            if ($scope.fromProtocol.value === 'HTTP' || $scope.fromProtocol.value === 'HTTPS') {
                angular.forEach($scope.protocolList, function (protocol) {
                    if (protocol.value === 'HTTP' || protocol.value === 'HTTPS') {
                        newProtocolList.push(protocol);
                    }
                });
            } else if ($scope.fromProtocol.value === 'TCP' || $scope.fromProtocol.value === 'SSL') {
                angular.forEach($scope.protocolList, function (protocol) {
                    if (protocol.value === 'TCP' || protocol.value === 'SSL') {
                        newProtocolList.push(protocol);
                    }
                });
            }
            $scope.toProtocolList = newProtocolList;
        };
        // detect if fromPort input is valid and mark its div class with 'error'
        // to trigger Foundation's error display
        $scope.checkFromPortInputCondition = function () {
            $scope.classFromPortDiv = "";
            // timeout is needed for the update of the input element DOM to be completed
            $timeout(function () {
                if ($('#from-port-input').hasClass('ng-invalid-pattern')) {
                    $scope.classFromPortDiv = "error";
                }
            });
        }; 
        // detect if toPort input is valid and mark its div class with 'error'
        // to trigger Foundation's error display
        $scope.checkToPortInputCondition = function () {
            $scope.classToPortDiv = "";
            // timeout is needed for the update of the input element DOM to be completed
            $timeout(function () {
                if ($('#to-port-input').hasClass('ng-invalid-pattern')) {
                    $scope.classToPortDiv = "error";
                }
            });
        }; 
        // checks the user selected protocol and port values and
        // determines if the select certificate modal link to be displayed
        $scope.showSelectCertificateModalLink = function () {
            if ($scope.toPort === '' || $scope.fromPort === '') {
                return false;
            }
            if ($scope.fromProtocol.value === 'HTTPS' ||
                $scope.fromProtocol.value === 'SSL' ||
                $scope.toProtocol.value === 'HTTPS' ||
                $scope.toProtocol.value === 'SSL') {
                return true;
            }
            return false;
        };
        // checks the fromProtocol value and
        // determines if the certificate name link to be displayed for the table
        $scope.showServerCertificateNameLink = function (fromProtocol) {
            if (fromProtocol === 'HTTPS' || fromProtocol === 'SSL') { 
                return true;
            }
            return false;
        };
        // checks the fromProtocol and toProtcol values and
        // determines if the backend certificate link to be displayed for the table
        // the backend certificate is to be displayed
        // only when fromProtocol is not a secure connection, but the toProtocol is.
        $scope.showBackendCertificateLink = function (fromProtocol, toProtocol) {
            if (fromProtocol === 'HTTPS' || fromProtocol === 'SSL') {
                return false;
            } else if (toProtocol === 'HTTPS' || toProtocol === 'SSL') {
                return true;
            }
            return false;
        };
        // handle the opening of the certificate modal event
        $scope.openCertificateModal = function (fromProtocol, toProtocol, fromPort, toPort) {
            var certificateTab = 'SSL';
            // in case of the backend certficate only display
            if (fromProtocol !== 'HTTPS' && fromProtocol !== 'SSL') {
                certificateTab = 'BACKEND';
            }
            // send signal to the parent controller about the request to open up the certificate modal
            $scope.$emit('eventOpenSelectCertificateModal', fromProtocol, toProtocol, fromPort, toPort, certificateTab);
        };
        // handle the case where the user clicks the 'use this certificate' button on the certificate modal
        // find the matching listener item and update its certificate related attributes
        // the certificate related attributes contains the latest input field information the certficate modal,
        // which was received when 'eventUpdateCertificateARN' signal was detected above
        $scope.handleEventUseThisCertificate = function () {
            angular.forEach($scope.listenerArray, function (block) {
                // find the listener item that matches the certificate's port description
                if (block.fromPort === $scope.serverCertificateARNBlock.fromPort &&
                    block.toPort === $scope.serverCertificateARNBlock.toPort) {
                    // update the certificate attributes for this item
                    block.certificateARN = $scope.serverCertificateARN;
                    block.certificateName = $scope.serverCertificateName;
                    // update the hidden input field
                    $scope.elbListenerTextarea.val(JSON.stringify($scope.listenerArray));
                    // inform the updated listener array 
                    $scope.$emit('eventUpdateListenerArray', $scope.listenerArray);
                }
            });
        };
    })
;
