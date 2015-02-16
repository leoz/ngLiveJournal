
(function(){
    'use strict';

    angular
        .module('app', ['ngLiveJournal'])
        .controller('MainController', MainController);


    function MainController($log, $scope, ngLJService) {

        ngLJService.set_config(true);

        var username = null;
        var authdata = null;
        var journal = 'lolcats';
        var count = 20;
        var date = null;
        ngLJService
            .get_events(username,authdata,journal,count,date)
            .then(function(response) {
        }, function(reason) {
        });
    }
})();
