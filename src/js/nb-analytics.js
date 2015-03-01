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
			trackingId: undefined, // {String} Tracking ID. This is a required parameter. UA-xxxxxxxx-x
			create: undefined, // {String|Object} https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#create
			prependPageViewUrl: false, // {Boolean|String} Base path prepended to tracking URLs. Set to TRUE to auto-detect base path, FALSE not to prepend, or a string path.
			excludePageView: [] // {Array} String or RegExp that should not be tracked.
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

	nbAnalytics.$inject = ['$rootScope', '$window', '$location', '$q', '$timeout', '$interval', 'nbAnalyticsConfig', '_'];
	function nbAnalytics ($rootScope, $window, $location, $q, $timeout, $interval, nbAnalyticsConfig, _) {
		/* jshint validthis: true */
		var self = this;
		var flags = {
			initialized: false, // Whether init() has been executed.
			ready: false
		};
		var deferredInit;
		var prependPageViewUrl = ''; // {String} Base path prepended to tracking URLs.

		if (nbAnalyticsConfig.prependPageViewUrl === true) {
			// Find base path. Example: if $location.absUrl() is
			// http://example.com/path/to/#!/app/ then base path is /path/to
			var absUrl = $location.absUrl();
			var offset = ($location.protocol() + '://').length;
			offset = absUrl.indexOf('/', offset);

			prependPageViewUrl = absUrl.slice(offset);
			offset = prependPageViewUrl.indexOf('#');

			if (offset > -1) {
				prependPageViewUrl = prependPageViewUrl.slice(0, offset);
			}

			prependPageViewUrl = _.trimRight(prependPageViewUrl, '/');
		}
		else if (nbAnalyticsConfig.prependPageViewUrl !== false) {
			prependPageViewUrl = '' + nbAnalyticsConfig.prependPageViewUrl;
		}

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

				if (nbAnalyticsConfig.trackingId) {
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
				else {
					flags.ready = false;
					deferredInit.reject('Tracking ID not given');
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
			var exclude = false;

			_.forEach(nbAnalyticsConfig.excludePageView, function (pattern) {
				if (_.isString(pattern)) {
					if (pattern === url) {
						exclude = true;
						return false;
					}
				}
				else if (_.isRegExp(pattern)) {
					if (pattern.test(url)) {
						exclude = true;
						return false;
					}
				}
			});

			if (!exclude) {
				this.init()
					.then(function () {
						window.ga('set', 'page', prependPageViewUrl + url);
						window.ga('send', 'pageview', prependPageViewUrl + url);
					});
			}
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
		 * @param {String} url
		 * @param {Object} value Optional. {'page': ''}
		 */
		this.trackSocial = function (network, action, url, value) {
			this.init()
				.then(function () {
					window.ga('send', 'social', network, action, url, value);
				});
		};
	}
})(window, window.angular);
