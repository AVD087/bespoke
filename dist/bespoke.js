/*!
 * Bespoke.js v0.2.2
 *
 * Copyright 2013, Mark Dalgleish
 * This content is released under the MIT license
 * http://mit-license.org/markdalgleish
 */

(function(moduleName, window, document) {
	var from = function(selector, selectedPlugins) {
			var parent = document.querySelector(selector),
				slides = [].slice.call(parent.children, 0),
				activeSlide = slides[0],
				listeners = {},

				activate = function(index, customData) {
					if (!slides[index]) {
						return;
					}

					fire('deactivate', createEventData(activeSlide, customData));

					activeSlide = slides[index];

					slides.map(deactivate);

					fire('activate', createEventData(activeSlide, customData));

					addClass(activeSlide, 'active');
					removeClass(activeSlide, 'inactive');
				},

				deactivate = function(slide, index) {
					var offset = index - slides.indexOf(activeSlide),
						offsetClass = offset > 0 ? 'after' : 'before';

					['before(-\\d+)?', 'after(-\\d+)?', 'active', 'inactive'].map(removeClass.bind(null, slide));

					slide !== activeSlide &&
						['inactive', offsetClass, offsetClass + '-' + Math.abs(offset)].map(addClass.bind(null, slide));
				},

				slide = function(index, customData) {
					fire('slide', createEventData(slides[index], customData)) && activate(index, customData);
				},

				next = function(customData) {
					var nextSlideIndex = slides.indexOf(activeSlide) + 1;

					fire('next', createEventData(activeSlide, customData)) && activate(nextSlideIndex, customData);
				},

				prev = function(customData) {
					var prevSlideIndex = slides.indexOf(activeSlide) - 1;

					fire('prev', createEventData(activeSlide, customData)) && activate(prevSlideIndex, customData);
				},

				on = function(eventName, callback) {
					(listeners[eventName] || (listeners[eventName] = [])).push(callback);

					return function() {
						listeners[eventName] = listeners[eventName].filter(function(listener) {
							return listener !== callback;
						});
					};
				},

				fire = function(eventName, eventData) {
					return (listeners[eventName] || [])
						.reduce(function(notCancelled, callback) {
							return notCancelled && callback(eventData) !== false;
						}, true);
				},

				createEventData = function(slide, eventData) {
					eventData = eventData || {};
					eventData.index = slides.indexOf(slide);
					eventData.slide = slide;
					return eventData;
				},

				deck = {
					on: on,
					fire: fire,
					slide: slide,
					next: next,
					prev: prev,
					parent: parent,
					slides: slides
				};

			addClass(parent, 'parent');

			slides.map(function(slide) {
				addClass(slide, 'slide');
			});

			Object.keys(selectedPlugins || {}).map(function(pluginName) {
				plugins[pluginName](deck, selectedPlugins[pluginName]);
			});

			activate(0);

			decks.push(deck);

			return deck;
		},

		decks = [],

		addClass = function(el, cls) {
			el.classList.add(moduleName + '-' + cls);
		},

		removeClass = function(el, cls) {
			el.className = el.className
				.replace(new RegExp(moduleName + '-' + cls +'(\\s|$)', 'g'), ' ')
				.replace(/^\s+|\s+$/g, '');
		},

		callOnAllInstances = function(method) {
			return function(arg) {
				decks.map(function(deck) {
					deck[method](arg);
				});
			};
		},

		bindPlugin = function(pluginName) {
			return {
				from: function(selector, selectedPlugins) {
					(selectedPlugins = selectedPlugins || {})[pluginName] = true;
					return from(selector, selectedPlugins);
				}
			};
		},

		makePluginForAxis = function(axis) {
			return function(deck) {
				var startPosition,
					delta;

				document.addEventListener('keydown', function(e) {
					var key = e.which;

					(
						key === 34 || // PAGE DOWN
						key === 32 || // SPACE
						axis === 'X' && key === 39 || // RIGHT
						axis === 'Y' && key === 40 // BOTTOM
					) && deck.next();
					(
						key === 33 || // PAGE UP
						axis === 'X' && key === 37 || // LEFT
						axis === 'Y' && key === 38 // TOP
					) && deck.prev();
				});

				deck.parent.addEventListener('touchstart', function(e) {
					if (e.touches.length) {
						startPosition = e.touches[0]['page' + axis];
						delta = 0;
					}
				});

				deck.parent.addEventListener('touchmove', function(e) {
					if (e.touches.length) {
						e.preventDefault();
						delta = e.touches[0]['page' + axis] - startPosition;
					}
				});

				deck.parent.addEventListener('touchend', function() {
					Math.abs(delta) > 50 && (delta > 0 ? deck.prev() : deck.next());
				});
			};
		},

		plugins = {
			horizontal: makePluginForAxis('X'),
			vertical: makePluginForAxis('Y')
		};

	window[moduleName] = {
		from: from,
		slide: callOnAllInstances('slide'),
		next: callOnAllInstances('next'),
		prev: callOnAllInstances('prev'),
		horizontal: bindPlugin('horizontal'),
		vertical: bindPlugin('vertical'),
		plugins: plugins
	};

}('bespoke', this, document));