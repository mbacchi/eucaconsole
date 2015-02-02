/**
 * @fileOverview Jasmine Unittest for Scalinggroup JS 
 * @requires Jasmine, AngularJS mock
 *
 */

describe("ScalingGroupPage", function() {

    beforeEach(angular.mock.module('ScalingGroupPage'));

    var scope, ctrl;
    // inject the $controller and $rootScope services
    // in the beforeEach block
    beforeEach(angular.mock.inject(function($controller, $rootScope, _$timeout_) {
        // Create a new scope that's a child of the $rootScope
        scope = $rootScope.$new();
        $timeout = _$timeout_;
        // Create the controller
        ctrl = $controller('ScalingGroupPageCtrl', {
            $scope: scope
        });
    }));

    beforeEach(function() {
        var template = window.__html__['templates/scalinggroups/scalinggroup_view.pt'];
        // remove <script src> and <link> tags to avoid phantomJS error
        template = template.replace(/script src/g, "script ignore_src"); 
        template = template.replace(/\<link/g, "\<ignore_link"); 
        setFixtures(template);
    });

    describe("Initial Values Test", function() {

        it("Initial value of minSize is 1", function() {
            expect(scope.minSize).toEqual(1);
        });

        it("Initial value of desiredCapacity is 1", function() {
            expect(scope.desiredCapacity).toEqual(1);
        });

        it("Initial value of maxSize is 1", function() {
            expect(scope.maxSize).toEqual(1);
        });

        it("Initial value of isNotChanged is true", function() {
            expect(scope.isNotChanged).toBeTruthy();
        });

        it("Initial value of isSubmitted is false", function() {
            expect(scope.isSubmitted).not.toBeTruthy();
        });

        it("Initial value of pendingModalID is empty", function() {
            expect(scope.pendingModalID).toEqual('');
        });
    });

    describe("Function initController() Test", function() {

        it("Should call setInitialValues() when initController() is called", function() {
            spyOn(scope, 'setInitialValues');
            scope.initController('{}');
            expect(scope.setInitialValues).toHaveBeenCalled();
        });

        it("Should set policiesCount when initController() is called and policiies_count JSON is passed", function() {
            scope.policiesCount = 0;
            scope.initController('{"policies_count": 3}');
            expect(scope.policiesCount).toEqual(3);
        });
    });

    describe("Function setInitialValues Test", function() {

        beforeEach(function() {
            setFixtures('<select id="termination_policies"></select>');
        });

        it("Should call rearrangeTerminationPoliciesOptions when setInitialValues is called", function() {
            spyOn(scope, 'rearrangeTerminationPoliciesOptions');
            scope.setInitialValues();
            expect(scope.rearrangeTerminationPoliciesOptions).toHaveBeenCalled();
        });
    });

    describe("Function updateTerminationPoliciesOrder Test", function() {

        beforeEach(function() {
            setFixtures('<select id="termination_policies"></select>');
        });

        it("Should call rearrangeTerminationPoliciesOptions when updateTerminationPoliciesOrder is called", function() {
            spyOn(scope, 'rearrangeTerminationPoliciesOptions');
            scope.updateTerminationPoliciesOrder();
            expect(scope.rearrangeTerminationPoliciesOptions).toHaveBeenCalled();
        });
    });

    describe("Watch terminationPolicies Test", function() {

        beforeEach(function() {
            setFixtures('<select id="termination_policies"></select>');
        });

        it("Should call rearrangeTerminationPoliciesOptions when terminationPolicies is updated", function() {
            spyOn(scope, 'rearrangeTerminationPoliciesOptions');
            scope.setWatch();
            scope.terminationPolicies = ['NewestInstance', 'ClosestToNextInstanceHour'];
            scope.$apply();
            $timeout.flush();
            expect(scope.rearrangeTerminationPoliciesOptions).toHaveBeenCalled();
        });
    });
});
