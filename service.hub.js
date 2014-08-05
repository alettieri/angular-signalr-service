(function ($, angular, document) {
	'use strict';

	function Hub() {

		var hubName = '',
			loggingEnabled = false,
			connectionPath = '.'
		;

		this.setHubName = function (name) {
			hubName = name;
		};

		this.setLoggin = function (enabled) {
			loggingEnabled = enabled;
		};

		this.setConnectionPath = function (path) {
			connectionPath = path;
		};


		this.$get = ['$rootScope', 'HubConnectionEvents', function ($rootScope, ConnectionEvents) {

			// Hub is either the instnace or 'this'
			var Hub = {};

			if (!hubName) {
				throw new Error('Hub name was not specified, be sure to use the setHubName method in the config');
				return Hub;
			}

			// Create Connection
			Hub.connection = $.hubConnection(connectionPath);

			// Create Hub Proxy
			Hub.proxy = Hub.connection.createHubProxy(hubName);

			// Set logging, either true or false
			Hub.connection.logging = loggingEnabled;

			/**
			 * Starts the hub connection
			 * @return {Promise}
			 */
			Hub.start = function () {
				return Hub.connection.start();
			};


			// Expose 'on' method
			Hub.on = function (evt, fn) {

				Hub.proxy.on(evt, function (response) {

					// Have angular run a digest
					$rootScope.$apply(function () {
						fn.call(fn, response);
					});

				});

				return Hub; // Return for chaining
			};

			// Expose 'off' method
			Hub.off = function () {
				Hub.proxy.off.apply(Hub.proxy, arguments);
			};


			// Expose 'invoke' or 'send' method
			// Method will ensure that a connection has been established before
			//		calling to the hub
			//
			Hub.send = Hub.invoke = function () {

				// Store the passed in arguments
				var args = arguments;

				// Resolve the invoke call
				function resolve() {
					Hub.proxy.invoke.apply(Hub.proxy, args);
				}

				// Resolve the method immediately if the connection is established
				if (Hub.connection.state === $.signalR.connectionState.connected) {
					resolve();
				}

				// In the event that we're disconnected
				if (Hub.connection.state === $.signalR.connectionState.disconnected) {

					// Start the connection, then resolve once we're connected
					Hub.start().done(function () {
						resolve();
					});
				}


				return Hub; // Return for chaining
			};

			/**
			 * Exposes the Hubs connection status
			 */
			Hub.status = {

				// Disconnected flag
				disconnected: false,

				// Reconnecting flag
				reconnecting: false,

				/**
				 * Determine if the hub is connected
				 * @return boolean
				 */
				isConnected: function () {
					return !this.disconnected && !this.reconnecting;
				},

				/**
				 * Is connection disconnected
				 */
				isDisconnected: function () {
					return this.disconnected;
				},

				/**
				 * Is Reconnecting
				 */
				isReconnecting: function () {
					return this.reconnecting;
				},

				/**
					* Determine if the hub connection is down
					* 
					* @return boolean
					*/
				isDown: function () {
					return this.disconnected || this.reconnecting;
				},

				/**
				 * Update the connection status
				 * @param {Boolean} reconnectVal
				 * @param {Boolean} disconnectVal
				 */
				setConnection: function (reconnectVal, disconnectVal) {

					var self = this;

					// Ask angular to udpate the digest
					$rootScope.$apply(function () {
						self.reconnecting = reconnectVal;
						self.disconnected = disconnectVal;
					});
				}
			};

			/**
			 * Uses rootScope to broadcast the desired connection event
			 */
			function broadcastConnectionEvent() {
				$rootScope.$broadcast.apply($rootScope, arguments);
			}

			/**
			 * Update the connection status on the hub, when the state changes
			 */
			function updateConnectionState(evt, state) {

				var reconnecting = state.newState === $.signalR.connectionState.reconnecting,
					disconnected = state.newState === $.signalR.connectionState.disconnected
				;

				Hub.status.setConnection(reconnecting, disconnected);

			};

			// Hoock into the change event
			$rootScope.$on(ConnectionEvents.change, updateConnectionState);

			//
			// Bind to the connection reconnecting event
			//
			Hub.connection.reconnecting(function () {
				broadcastConnectionEvent(ConnectionEvents.reconnecting);
			});

			// Bind to the connection reconnected event
			Hub.connection.reconnected(function () {
				broadcastConnectionEvent(ConnectionEvents.reconnected);
			});

			// Bind to the connection disconnected event
			Hub.connection.disconnected(function () {
				broadcastConnectionEvent(ConnectionEvents.disconnected);
			});

			// Bind to the connection error event
			Hub.connection.error(function (error, data) {
				broadcastConnectionEvent(ConnectionEvents.error, error, data);
			});

			// Bind to the connection change event
			Hub.connection.stateChanged(function (state) {
				broadcastConnectionEvent(ConnectionEvents.change, state);
			});

			//
			// Return Hub
			//
			return Hub;

		}];

		
	}

	angular.module('services.hub', [])
		// Hub Conncetion event object
		// This can be used throughout the application to hook into the $scope or $rootScope for connection events
		//
		.value('HubConnectionEvents', {
			change: 'hub:connection:change',
			error: 'hub:connection:error',
			disconnected: 'hub:connection:disconnected',
			reconnected: 'hub:connection:reconnected',
			reconnecting: 'hub:connection:reconnecting'
		})

		// Register the Hub
		.provider('Hub', Hub);

	

})(window.jQuery, window.angular, document);