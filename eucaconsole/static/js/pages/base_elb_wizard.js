/**
 * @fileOverview Base ELB Wizard JS
 * @requires AngularJS
 *
 */

angular.module('BaseELBWizard', ['EucaConsoleUtils', 'MagicSearch', 'TagEditor', 'ELBListenerEditor'])
    .controller('BaseELBWizardCtrl', function ($scope, $http, $timeout, eucaHandleError, eucaUnescapeJson) {
        $scope.thisForm = undefined;
        $scope.urlParams = undefined;
        $scope.resourceName  = '';
        $scope.totalSteps = 0;
        $scope.currentStepIndex = 0;
        $scope.isValidationError = true;
        $scope.tabList = [];
        $scope.invalidSteps = [];
        $scope.stepClasses = [];
        $scope.summaryDisplays = [];
        $scope.initController = function (optionsJson) {
            var options = JSON.parse(eucaUnescapeJson(optionsJson));
            $scope.setInitialValues(options);
            $scope.setWatcher();
            $scope.setFocus();
        };
        $scope.setInitialValues = function (options) {
            // retrieve the resource name for this wizard
            if (options.hasOwnProperty('resource_name')) {
                $scope.resourceName = options.resource_name;
            }
            // retrieve the navigation tab list for this wizard
            if (options.hasOwnProperty('wizard_tab_list')) {
                $scope.tabList = options.wizard_tab_list;
            }
            // retrieve the total navigation tab count for this page
            $scope.totalSteps = $scope.tabList.length;
            // retrieve the form object using the resource name above
            $scope.thisForm = $('#' + $scope.resourceName + '-form');
            $scope.urlParams = $.url().param();
            // set the current tab display index to be 0
            $scope.currentStepIndex = 0;
            // set the default validation error to be true, thus disabling the next button by default
            $scope.isValidationError = true;
            // create an array to maintain invalid step flags
            // set all steps to be invalid at first, except the first tab page
            $scope.invalidSteps = Array.apply(undefined, Array($scope.totalSteps));
            angular.forEach($scope.invalidSteps, function(a, index){
                $scope.invalidSteps[index] = true;
            });
            $scope.invalidSteps[0] = false;
            // create an array to maintain each step's active class
            // set the first tab to be 'active'
            $scope.stepClasss = Array.apply(undefined, Array($scope.totalSteps));
            angular.forEach($scope.stepClasses, function(a, index){
                $scope.stepClasses[index] = '';
            });
            $scope.stepClasses[$scope.currentStepIndex] = 'active';
            // create an array to maintain the summary panel display flags
            // set the first section of the summary panel to be visible
            $scope.summaryDisplays = Array.apply(undefined, Array($scope.totalSteps));
            angular.forEach($scope.summaryDisplays, function(a, index){
                $scope.summaryDisplays[index] = false;
            });
            $scope.summaryDisplays[$scope.currentStepIndex] = true;
        };
        $scope.setWatcher = function (){
            $scope.$watch('currentStepIndex', function(){
                if( $scope.currentStepIndex !== 0 ){
                    // adjust the focus on the wizard
                    $scope.setWizardFocus($scope.currentStepIndex);
                }
                // inform the child controllers about the navigation tab update
                $scope.$broadcast('currentStepIndexUpdate', $scope.currentStepIndex);
            });
            // handle the visit next step request from the child controllers
            $scope.$on('eventProcessVisitNextStep', function($event, nextStep) {
                $scope.processVisitNextStep(nextStep);
            });
            // handle the validation error flag set request from the child controllers
            $scope.$on('updateValidationErrorStatus', function($event, flag) {
                $scope.isValidationError = flag;
            });
            // handle the validation check request from the child controllers
            $scope.$on('requestValidationCheck', function($event) {
                var currentStepID = $scope.currentStepIndex + 1;
                $scope.existInvalidFields(currentStepID);
            });
            // handle the opening of a modal on the wizard
            $(document).on('open.fndtn.reveal', '[data-reveal]', function () {
                // When a dialog opens, reset the progress button status
                $(this).find('.dialog-submit-button').css('display', 'block');
                $(this).find('.dialog-progress-display').css('display', 'none');
                // Broadcast initModal signal to trigger the modal initialization
                $scope.$broadcast('initModal');
            });
            // handle the submit event from a modal on the wizard
            $(document).on('submit', '[data-reveal] form', function () {
                // When a dialog is submitted, display the progress button status
                $(this).find('.dialog-submit-button').css('display', 'none');
                $(this).find('.dialog-progress-display').css('display', 'block');
            });
            // handle the closing of a modal on the wizard
            $(document).on('closed.fndtn.reveal', '[data-reveal]', function () {
                var modal = $(this);
                modal.find('input[type="text"]').val('');
                modal.find('input[type="number"]').val('');
                modal.find('input:checked').attr('checked', false);
                modal.find('textarea').val('');
                modal.find('div.error').removeClass('error');
                var chosenSelect = modal.find('select');
                if (chosenSelect.length > 0 && chosenSelect.attr('multiple') === undefined) {
                    chosenSelect.prop('selectedIndex', 0);
                    chosenSelect.trigger("chosen:updated");
                }
            });
        };
        $scope.setFocus = function () {
            // adjust the focus to the opened modal
            $(document).on('opened.fndtn.reveal', '[data-reveal]', function () {
                var modal = $(this);
                var modalID = $(this).attr('id');
                if( modalID.match(/terminate/)  || modalID.match(/delete/) || modalID.match(/release/) ){
                    var closeMark = modal.find('.close-reveal-modal');
                    if(!!closeMark){
                        closeMark.focus();
                    }
                }else{
                    var inputElement = modal.find('input[type!=hidden]').get(0);
                    var modalButton = modal.find('button').get(0);
                    if (!!inputElement && inputElement.value === '') {
                        inputElement.focus();
                    } else if (!!modalButton) {
                        modalButton.focus();
                    }
               }
            });
        };
        // set the focus to the current tab on the wizard
        $scope.setWizardFocus = function (stepIdx) {
            var tabElement = $(document).find('#tabStep'+(stepIdx+1)).get(0);
            if (!!tabElement) {
                tabElement.focus();
            }
        };
        // return true if exists invalid input fields on 'step' page
        // also set the focus on the invalid field
        $scope.existInvalidFields = function(step) {
            if ($scope.thisForm === undefined) {
                return true;
            }
            $scope.thisForm.trigger('validate');
            var tabContent = $scope.thisForm.find('#step' + step);
            var invalidFields = tabContent.find('[data-invalid]');
            invalidFields.focus();
            if (invalidFields.length > 0 || $('#step' + step).find('div.error').length > 0) {
                $scope.isValidationError = true;
            } else {
                $scope.isValidationError = false;
            }
            return $scope.isValidationError;
        };
        // handle the clicking of the next step visit link from the template
        $scope.visitStep = function($event, step) {
            $event.preventDefault();
            var nextStep = step;
            // In case of non-rendered step, jump forward
            if ($scope.tabList[step].render === false) {
                nextStep = step + 1;
            }
            // broadcast the vist next step event to the child controllers
            // so that they can perform proper procedures per tab section
            // inform the current step index and the intended next step
            $scope.$broadcast('eventClickVisitNextStep', $scope.currentStepIndex+1, nextStep);
        };
        // handle the vist next step request
        // after sending out the 'eventClickVisitNextStep',
        // the child controllers would confirm the event by replying with 'eventProcessVisitNextStep',
        // which triggers this function call
        $scope.processVisitNextStep = function(nextStep) {
            // Check for form validation before proceeding to next step
            var currentStepID = $scope.currentStepIndex + 1;
            if (nextStep < $scope.currentStepIndex) {
                // Case of clicking the tab direct to go backward step
                // No validation check is needed when stepping back
                $timeout(function() {
                    $scope.updateStep(nextStep);
                    $scope.$broadcast('currentStepIndexUpdate', $scope.currentStepIndex);
                });
            } else if ($scope.isValidationError === true || $scope.existInvalidFields(currentStepID)) {
                // NOT OK TO CHANGE TO NEXT STEP
                // NOTE: Need to handle the case where the tab was clicked to visit the previous step
                //
                // Broadcast signal to trigger input field check on the currentStepIndex page 
                $scope.$broadcast('currentStepIndexUpdate', $scope.currentStepIndex);
            } else { // OK to switch
                // Since the operations above affects DOM,
                // need to wait after Foundation's update for Angular to process 
                $timeout(function() {
                    // clear the invalidSteps flag
                    if ($scope.invalidSteps[nextStep]) {
                        $scope.clearErrors(nextStep);
                        $scope.invalidSteps[nextStep] = false;
                    }
                    $scope.updateStep(nextStep);
                    // Broadcast signal to trigger input field check on the currentStepIndex page 
                    $scope.$broadcast('currentStepIndexUpdate', $scope.currentStepIndex);
                });
            }
        };
        // a method to trigger the tab update on the wizard,
        // rather than relying the actual click event, which is processed by Foundaiton
        $scope.updateStep = function(step) {
            // Adjust the tab classes to match Foundation's display 
            $("#wizard-tabs").children("dd").each(function() {
                // Clear 'active' class from all tabs
                $(this).removeClass("active");
                // Set 'active' class on the current tab
                var hash = "step" + (step+1) ;
                var link = $(this).find("a");
                if (link.length > 0) {
                    var id = link.attr("href").substring(1);
                    if (id == hash) {
                        $(this).addClass("active");
                    }
                }
            });
            // Clear all step classes
            angular.forEach($scope.stepClasses, function(a, index){
                $scope.stepClasses[index] = '';
            });
            // Activate the target step class
            $scope.stepClasses[step] = 'active';
            // Display the summary section 
            $scope.showSummarySecton(step); 
            // Update the current step index
            $scope.currentStepIndex = step;
        };
        // Display appropriate step in summary
        $scope.showSummarySecton = function(step) {
            $scope.summaryDisplays[step] = true;
        };
        // clear all 'error' classes set by Foundation's valdation
        $scope.clearErrors = function(step) {
            $('#step'+step).find('div.error').each(function(idx, val) {
                $(val).removeClass('error');
            });
        };
    })
;
angular.module('BaseELBWizard');
