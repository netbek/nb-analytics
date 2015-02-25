/**
 * AngularJS service for Google Analytics
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
	'use strict';

	angular
		.module('nb.analytics', [])
		.provider('nbAnalyticsConfig', nbAnalyticsConfig)
		.service('nbAnalytics', nbAnalytics);

	function nbAnalyticsConfig () {
		var config = {
//			prependPageViewUrl: '', // {String} String to prepend to page view URL. Used if app is in a subdirectory.
			trackingId: undefined, // {String} Tracking ID. This is a required parameter. UA-xxxxxxxx-x
			create: undefined // {String|Object} https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#create
		};
		return {
			set: function (values) {
				_.merge(config, values);
			},
			$get: function () {
				return config;
			}
		};
	}

	nbAnalytics.$inject = ['$rootScope', '$window', '$q', '$timeout', '$interval', 'nbAnalyticsConfig'];
	function nbAnalytics ($rootScope, $window, $q, $timeout, $interval, nbAnalyticsConfig) {
		/* jshint validthis: true */
		var self = this;
		var flags = {
			initialized: false, // Whether init() has been executed.
			ready: false
		};
		var deferredInit;

		/**
		 *
		 * https://developers.google.com/analytics/devguides/collection/analyticsjs/advanced
		 *
		 * @returns {Promise}
		 */
		this.init = function () {
			if (!flags.initialized) {
				flags.initialized = true;

				deferredInit = $q.defer();

				var interval = $interval(function () {
					if (window.ga) {
						$interval.cancel(interval);

						window.ga('create', nbAnalyticsConfig.trackingId, angular.isDefined(nbAnalyticsConfig.create) ? nbAnalyticsConfig.create : 'auto');

						flags.ready = true;
						deferredInit.resolve(window.ga);
					}
				}, 100);

				// Inject SDK script element.
				var id = 'ga-js';
				var js = document.getElementById(id);
				if (js) {
					// @todo If there's already a script with this ID...
				}
				else {
					var src = '//www.google-analytics.com/analytics.js';
					js = document.createElement('script');
					js.id = id;
					js.async = true;
					js.src = src;
					var gajs = document.getElementsByTagName('script')[0];
					gajs.parentNode.insertBefore(js, gajs);
				}
			}

			return deferredInit.promise;
		};

		/**
		 * https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications
		 *
		 * @param {String} url
		 */
		this.trackPageView = function (url) {
			this.init()
				.then(function () {
					window.ga('set', 'page', url);
					window.ga('send', 'pageview', url);
				});
		};

		/**
		 * https://developers.google.com/analytics/devguides/collection/analyticsjs/events
		 *
		 * @param {String} category
		 * @param {String} action
		 * @param {String} label
		 * @param {String} value
		 */
		this.trackEvent = function (category, action, label, value) {
			this.init()
				.then(function () {
					window.ga('send', 'event', category, action, label, value);
				});
		};

		/**
		 * https://developers.google.com/analytics/devguides/collection/analyticsjs/social-interactions
		 *
		 * @param {String} network 'facebook'
		 * @param {String} action 'like'
		 * @param {String} targetUrl
		 * @param {Object} value Optional. {'page': ''}
		 */
		this.trackSocial = function (network, action, targetUrl, value) {
			this.init()
				.then(function () {
					window.ga('send', 'social', network, action, targetUrl, value);
				});
		};
	}
})(window, window.angular);
