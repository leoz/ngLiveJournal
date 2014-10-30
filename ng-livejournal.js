/*global angular:true, browser:true */

/**
 * @license LiveJournal API Module for AngularJS
 * (c) 2014 Leonid Zolotarev
 * License: MIT
 */
(function () {
	'use strict';
	
	angular.module('ngLiveJournal', ['angular-md5'])
	.factory('ngLJService', ['$http','md5',function($http,md5) {

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
				cbFail(data);
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
		
		function makeCall(method,params,cbGood,cbFail,context,username,password) {
		
			params['ver'] = '1';

		    if (username) {
				getChallenge(
					function(data,dummy){

						if (data && data[0] && data[0].challenge) {
							var challenge = data[0].challenge;

							var response = null;			    
							try {			    
								response = md5.createHash(challenge + md5.createHash(password));
							}
							catch(err) {
								cbFail(err);
								return;
							}

							params['auth_method'   ] = 'challenge';
							params['auth_response' ] = response;
							params['username'      ] = username;
							params['auth_challenge'] = challenge;

							var param = prepareCall(method,params);         
							postCall(param,cbGood,cbFail,context);     

						}
					},
					function(dummy) {
						return;
					}
				);
			}
			else {
				var param = prepareCall(method,params);         
				postCall(param,cbGood,cbFail,context);     
			}
		};
		
		function decodeArrayBuffer(buf) {
		    if (buf.constructor == String) {
		        return buf;
		    }
            var uintArray = new Uint8Array(buf);
            var encodedString = String.fromCharCode.apply(null, uintArray);
            var decodedString = decodeURIComponent(escape(encodedString));            
			return decodedString;
		};
				
		// LiveJournal API

		function getChallenge(cbGood,cbFail) {
			var method = 'LJ.XMLRPC.getchallenge';      
			var param = prepareCall(method,null);         
			postCall(param,cbGood,cbFail,null);
		};

		function doLogin(username,password,cbGood,cbFail) {
		    
			var method = 'LJ.XMLRPC.login';
			var params = {
				'getpickws'    : '1',
				'getpickwurls' : '1'
			};
						
			makeCall(method,params,cbGood,cbFail,null,username,password);
		};

		function getFriends(username,password,cbGood,cbFail) {

			var method = 'LJ.XMLRPC.getfriends';
			var params = {};

			makeCall(method,params,cbGood,cbFail,null,username,password);
		};

		function getUserpics(user,cbGood,cbFail,context,username,password) {

			var method = 'LJ.XMLRPC.getuserpics';
			var params = {
				'usejournal' : user
			};

			makeCall(method,params,cbGood,cbFail,context,username,password);
		};

		function getEvents(count,journal,last_date,cbGood,cbFail,context,username,password) {

			var method = 'LJ.XMLRPC.getevents';
			var params = {
					'selecttype' : 'lastn',
					'howmany'    : count,
					'usejournal' : journal
			};
			if (last_date) {
				params['beforedate'] = last_date;
			}

			makeCall(method,params,cbGood,cbFail,context,username,password);
		};
		
		function getEvent(journal,itemid,cbGood,cbFail,context,username,password) {

			var method = 'LJ.XMLRPC.getevents';
			var params = {
					'selecttype' : 'one',
					'itemid'     : itemid,
					'usejournal' : journal
			};

			makeCall(method,params,cbGood,cbFail,context,username,password);
		};
		
		function getComments(itemid,anum,journal,cbGood,cbFail,context,username,password) {

			var method = 'LJ.XMLRPC.getcomments';
			var ditemid = itemid * 256 + anum;
			var params = {
				'journal' : journal,
				'ditemid' : ditemid
			};  

			makeCall(method,params,cbGood,cbFail,context,username,password);
		};

		return {
			decode_array_buffer : decodeArrayBuffer,
			do_login            : doLogin,
			get_friends         : getFriends,
			get_userpics        : getUserpics,
			get_events          : getEvents,
			get_event           : getEvent,
			get_comments        : getComments
		};
	}]);
})();

