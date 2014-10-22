/*global angular:true, browser:true */

/**
 * @license LiveJournal API Module for AngularJS
 * (c) 2014 Leonid Zolotarev
 * License: MIT
 */
(function () {
	'use strict';
	
	angular.module('ngLiveJournal', [])
	.factory('ngLJService', ['$http','$q',function($http,$q) {

		var x2js = new X2JS();

		var URL = 'http://www.livejournal.com/interface/xmlrpc';
		
		function postCall(params,cbGood,cbFail,context) {
			$http({
				method: 'POST',
				url: URL,
				data: params,
				headers: {
					'Content-Type': 'text/xml'
				}
			}).
			success(function(data, status) {
				var xmlDoc = x2js.parseXmlString(data);
			
				var response;
			
				try {
					response = XMLRPC.parseDocument(xmlDoc);
					cbGood(response,context);
				}
				catch(err) {
					cbFail(context);
				}				
			
			}).
			error(function(data, status) {
			});
		};
		
		function prepareCall(method,params) {
			var xmlDoc = XMLRPC.document(method, [params]);
			var data;
			if ("XMLSerializer" in window) {
				data = new window.XMLSerializer().serializeToString(xmlDoc);
			} else {
				// IE does not have XMLSerializer
				data = xmlDoc.xml;
			}
			return data;
		};
		
		function arrayBufferToString(buf) {
			var d = $q.defer();
			var bb = new Blob([buf]);
			var f = new FileReader();
			f.onload = function(e) {
				d.resolve(e.target.result);
			}
			f.readAsText(bb);
			return d.promise;
		};
		
		function getUserpics(user,cbGood,cbFail,context) {
			var method = 'LJ.XMLRPC.getuserpics';
			var params = {
				'ver'        : '1',
				'usejournal' : user
			};        
			var param = prepareCall(method,params);         
			postCall(param,cbGood,cbFail,context);
		};
		
		function getEvents(count,journal,last_date,cbGood,cbFail,context) {
			var method = 'LJ.XMLRPC.getevents';
			var params = {
					'ver'        : '1',
					'selecttype' : 'lastn',
					'howmany'    : count,
					'usejournal' : journal
			};
			if (last_date) {
				params['beforedate'] = last_date;
			}   
			var param = prepareCall(method,params);         
			postCall(param,cbGood,cbFail,context);     
		};
		
		function getEvent(journal,itemid,cbGood,cbFail,context) {
			var method = 'LJ.XMLRPC.getevents';
			var params = {
					'ver'        : '1',
					'selecttype' : 'one',
					'itemid'     : itemid,
					'usejournal' : journal
			};
			var param = prepareCall(method,params);         
			postCall(param,cbGood,cbFail,context);     
		};
		
		function getComments(itemid,anum,journal,cbGood,cbFail,context) {
			var method = 'LJ.XMLRPC.getcomments';
			var ditemid = itemid * 256 + anum;
			var params = {
				'ver'     : '1',
				'journal' : journal,
				'ditemid' : ditemid
			};  
			var param = prepareCall(method,params);         
			postCall(param,cbGood,cbFail,context);     
		};

		return {
			array_buffer_to_string : arrayBufferToString,
			get_userpics           : getUserpics,
			get_events             : getEvents,
			get_event              : getEvent,
			get_comments           : getComments
		};
	}]);
})();

