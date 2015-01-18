/*global angular:true, browser:true */

/**
 * @license LiveJournal API Module for AngularJS
 * (c) 2014 Leonid Zolotarev
 * License: MIT
 */
(function () {
	'use strict';

	angular.module('ngLiveJournal', ['angular-md5'])
	.factory('ngLJService', ['$http','$q','md5',function($http,$q,md5) {

		var x2js = new X2JS();

		var URL = 'http://www.livejournal.com/interface/xmlrpc';

		function newCall(params) {
            var q = $q.defer();
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

				try {
					var response = XMLRPC.parseDocument(xmlDoc);
					console.log(response);
					q.resolve(response);
				}
				catch(err) {
					console.log(err);
					q.reject(err);
				}

			}).
			error(function(data, status) {
				console.log(data, status);
				q.reject(data);
			});
            return q.promise;
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

		function getChallenge() {

			var method = 'LJ.XMLRPC.getchallenge';

			var param = prepareCall(method,null);
			return newCall(param);
		};

		function makeCall(username,password,method,params) {
			if(username) {
				return getChallenge().then(function(response){
					var challenge = response[0].challenge;
					var response = null;
					try {
						response = md5.createHash(challenge + md5.createHash(password));
					}
					catch(err) {
						return null;
					}
					params['auth_method'   ] = 'challenge';
					params['auth_response' ] = response;
					params['username'      ] = username;
					params['auth_challenge'] = challenge;
					var param = prepareCall(method,params);
					return newCall(param);
				},{});
			}
			else {
				var param = prepareCall(method,params);
				return newCall(param);
			}
		};

		// LiveJournal API

		function addComment(username,password,journal,ditemid,parent,body,subject) {

			var method = 'LJ.XMLRPC.addcomment';
			var params = {
				'ver'     : '1',
				'journal' : journal,
				'ditemid' : ditemid,
				'parent'  : parent,
				'body'    : body,
				'subject' : subject
			};

			return makeCall(username,password,method,params);
		};

		function doLogin(username,password) {

			var method = 'LJ.XMLRPC.login';
			var params = {
				'ver'          : '1',
				'getpickws'    : '1',
				'getpickwurls' : '1'
			};

			return makeCall(username,password,method,params);
		};

		function getFriends(username,password) {

			var method = 'LJ.XMLRPC.getfriends';
			var params = {
				'ver' : '1'
			};

			return makeCall(username,password,method,params);
		};

		function getUserpics(username,password,journal) {

			var method = 'LJ.XMLRPC.getuserpics';
			var params = {
				'ver'        : '1',
				'usejournal' : journal
			};

			return makeCall(username,password,method,params);
		};

		function getEvent(username,password,journal,itemid) {

			var method = 'LJ.XMLRPC.getevents';
			var params = {
				'ver'        : '1',
				'selecttype' : 'one',
				'itemid'     : itemid,
				'usejournal' : journal
			};

			return makeCall(username,password,method,params);
		};

		function getEvents(username,password,journal,count,last_date) {

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

			return makeCall(username,password,method,params);
		};

		function getComments(username,password,journal,itemid) {

			var method = 'LJ.XMLRPC.getcomments';
			var ditemid = itemid * 256;
			var params = {
				'ver'     : '1',
				'journal' : journal,
				'ditemid' : ditemid
			};

			return makeCall(username,password,method,params);
		};

		// Utilities API

		function decodeArrayBuffer(buf) {
			if (!buf) {
				return ' ';
			}
			if (buf.constructor == String) {
				return buf;
			}
			var uintArray = new Uint8Array(buf);
			var encodedString = String.fromCharCode.apply(null, uintArray);
			var decodedString = decodeURIComponent(escape(encodedString));
			return decodedString;
		};

		return {
			add_comment         : addComment,
			do_login            : doLogin,
			get_friends         : getFriends,
			get_userpics        : getUserpics,
			get_event           : getEvent,
			get_events          : getEvents,
			get_comments        : getComments,
			decode_array_buffer : decodeArrayBuffer
		};
	}]);
})();
