(function(win, app, undef) {

var MATRIX3D_REG = /^matrix3d\(\d+, \d+, \d+, \d+, \d+, \d+, \d+, \d+, \d+, \d+, \d+, \d+, ([-\d.]+), ([-\d.]+), [-\d.]+, \d+\)/,
	MATRIX_REG = /^matrix\(\d+, \d+, \d+, \d+, ([-\d.]+), ([-\d.]+)\)$/,
	TRANSFORM_REG = /^(translate|rotate|scale)(X|Y|Z|3d)?|(matrix)(3d)?|(perspective)|(skew)(X|Y)?$/i,

    isAndroid = (/android/gi).test(navigator.appVersion),
    isIOS = (/iphone|ipad/gi).test(navigator.appVersion),
    has3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix()
    ;

function addPx(v) {
	v += '';

	if (v.indexOf('px') < 0 && v.indexOf('%') < 0 && v !== '0') {
		v += 'px';
	}
	return v;
}

function addDeg(v) {
	v += '';

	if (v.indexOf('deg') < 0 & v !== '0') {
		v += 'deg';
	}

	return v;
}

function toCamelCase(str, sep) {
	sep || (sep = '-');

	str.replace(new RegExp(sep + '[a-z]', 'g'), function(v) {
		return v.split(sep)[1].toUpperCase();
	})

	return str;
}

function toDelimiterCase(str, sep) {
	sep || (sep = '-');

	return str.replace(/[a-z][A-Z]/g, '$1' + sep +'$2').toLowerCase();
}

var Animation = {
    translate: function(element, duration, timingFunction, delay, x, y, callback) {
	    this.doTransition(element, {
	    	translate: [x, y]
	    }, {
	    	duration: duration,
	    	timingFunction: timingFunction,
	    	delay: delay,
	    	callback: callback
	    });
    },

    doTransition: function(element, properties, options) {
    	var postfix = [options.duration, options.timingFunction || 'ease', options.delay || '0s'].join(' '),
    		matches, transform = '', transition = [], styles = {}
    		;

    	for (var p in properties) {
    		var v = properties[p];
    		if ((matches = p.match(TRANSFORM_REG))) {
	    		if (!(v instanceof Array)) {
	    			v = [v];
	    		}

    			var a = matches[1] || matches[3] || matches[5] || matches[6],
    				b = matches[2] || matches[4] || matches[7] || ''
    				;

    			if (a === 'translate' && b === '' && has3d) {
    				b = '3d';
    				v.push(0);
    			}
    			if (a === 'translate') {
    				v = v.map(addPx);
    			} else if (a === 'rotate' || a === 'skew') {
    				v = v.map(addDeg);
    			}
    			transform += a + b + '(' + v.join(',') + ')';
    		} else {
    			transition.push(toDelimiterCase(p) + ' ' + postfix);
    			styles[p] = v;
    		}

    		transform && transition.push('-webkit-transform ' + postfix);
    	}

    	options.callback && element.addEventListener('webkitTransitionEnd', function(e){
	    	element.removeEventListener('webkitTransitionEnd', arguments.callee, false);
	        if(e.srcElement !== element) return;
	        setTimeout(options.callback, 10);
	    }, false);

    	setTimeout(function() {
	    	element.style.webkitTransition = transition.join(', ');
	    	if (transform.length) {
	    		element.style.webkitTransform = transform;
	    	}
	    	for (var p in styles) {
	    		element.style[p] = styles[p];
	    	}
    	}, 10);
    },

    genCubicBezier: function(a, b) {
		return [[(a / 3 + (a + b) / 3 - a) / (b - a), (a * a / 3 + a * b * 2 / 3 - a * a) / (b * b - a * a)],
        	[(b / 3 + (a + b) / 3 - a) / (b - a), (b * b / 3 + a * b * 2 / 3 - a * a) / (b * b - a * a)]];
    },

    makeTranslateString: function(x, y) {
		x = addPx(x);
		y = addPx(y);

	    if (has3d) {
	        return 'translate3d(' + x + ', ' + y + ', 0)';
	    } else {
	        return 'translate(' + x + ', ' + y + ')';
	    }
    },

    getTransformOffset: function(el) {
	    var offset = {
	    		x: 0,
	    		y: 0
	    	}, 
	    	transform = getComputedStyle(el).webkitTransform, 
	    	matchs, reg;

	    if (transform !== 'none') {
	    	reg = transform.indexOf('matrix3d') > -1 ? MATRIX3D_REG : MATRIX_REG;
	        if((matchs = transform.match(reg))) {
	            offset.x = parseInt(matchs[1]) || 0;
	            offset.y = parseInt(matchs[2]) || 0;
	        }
	    }

	    return offset;
    }
}

app.module.Animation = Animation;

})(window, window['app']||(window['app']={module:{},plugin:{}}));
(function(win, app, undef) {


function Content(wrapEl, options) {
	options || (options = {});
	this._wrapEl = wrapEl;
	this._cacheLength = Math.max(options.cacheLength, 1);
	this._cacheIndex = 0;

	var html = '';
	for (var i = 0; i < this._cacheLength; i++) {
		html += '<div class="inactive"></div>';
	}
	this._wrapEl.innerHTML = '<div class="wrap">' + html + '</div>';

	this.setClassName();
}

var ContentProto = {
	setClassName: function() {
		this.getActive().className = 'active';
		if (this._cacheLength > 2) {
			this.getPrevious().className = 'inactive prev';
			this.getNext().className = 'inactive next';
		} else if (this._cacheLength > 1){
			this.getPrevious().className = 'inactive';
		}
	},

	getActive : function() {
		var index = this._cacheIndex;
		return this._wrapEl.querySelector('.wrap > div:nth-child(' + (index + 1) + ')');
	},

	getNext: function() {
		var index = (this._cacheIndex + 1) % this._cacheLength;
		return this._wrapEl.querySelector('.wrap > div:nth-child(' + (index + 1) + ')');
	},

	getPrevious: function() {
		var index = (this._cacheIndex - 1 + this._cacheLength) % this._cacheLength;
		return this._wrapEl.querySelector('.wrap > div:nth-child(' + (index + 1) + ')');
	},

	next: function() {
		if (this._cacheLength > 2) {
			this.getPrevious().className = 'inactive';
		}
		this._cacheIndex = (this._cacheIndex + 1) % this._cacheLength;
	},

	previous: function() {
		if (this._cacheLength > 2) {
			this.getNext().className = 'inactive';
		}
		this._cacheIndex = (this._cacheIndex - 1 + this._cacheLength) % this._cacheLength;
	},

	html: function(html) {
		this.getActive().innerHTML = html;
	}
}

for (var p in ContentProto) {
	Content.prototype[p] = ContentProto[p];
}

app.module.Content = Content;

})(window, window['app']||(window['app']={module:{},plugin:{}}));
(function(win, app, undef) {

var doc = win.document,
    docEl = doc.documentElement,
    slice = Array.prototype.slice,
    gestures = {}, lastTap = null
    ;

function getCommonAncestor (el1, el2) {
    var el = el1;
    while (el) {
        if (el.contains(el2) || el == el2) {
            return el;
        }
        el = el.parentNode;
    }    
    return null;
}

function fireEvent(element, type, extra) {
    var event = doc.createEvent('HTMLEvents');
    event.initEvent(type, false, true);

    if(typeof extra === 'object') {
        for(var p in extra) {
            event[p] = extra[p];
        }
    }

    while(event.cancelBubble === false && element) {
        element.dispatchEvent(event);
        element = element.parentNode;
    }
}

function calc(x1, y1, x2, y2, x3, y3, x4, y4) {
    var rotate = Math.atan2(y4 - y3, x4 - x3) - Math.atan2(y2 - y1, x2 - x1),
        scale = Math.sqrt((Math.pow(y4 - y3, 2) + Math.pow(x4 - x3, 2)) / (Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2))),
        translate = [x3 - scale * x1 * Math.cos(rotate) + scale * y1 * Math.sin(rotate), y3 - scale * y1 * Math.cos(rotate) - scale * x1 * Math.sin(rotate)]
        ;
    return {
        rotate: rotate,
        scale: scale,
        translate: translate,
        matrix: [
            [scale * Math.cos(rotate), -scale * Math.sin(rotate), translate[0]],
            [scale * Math.sin(rotate), scale * Math.cos(rotate), translate[1]],
            [0, 0, 1]
        ]
    }
}

function touchstartHandler(event) {

    if (Object.keys(gestures).length === 0) {
        docEl.addEventListener('touchmove', touchmoveHandler, false);
        docEl.addEventListener('touchend', touchendHandler, false);
        docEl.addEventListener('touchcancel', touchcancelHandler, false);
    }
    
    for(var i = 0 ; i < event.changedTouches.length ; i++ ) {
        var touch = event.changedTouches[i],
            touchRecord = {};

        for (var p in touch) {
            touchRecord[p] = touch[p];
        }

        var gesture = {
            startTouch: touchRecord,
            startTime: Date.now(),
            status: 'tapping',
            element: event.srcElement,
            pressingHandler: setTimeout(function(element) {
                return function () {
                    if (gesture.status === 'tapping') {
                        gesture.status = 'pressing';

                        fireEvent(element, 'press', {
                            touchEvent:event
                        });
                    }

                    clearTimeout(gesture.pressingHandler);
                    gesture.pressingHandler = null;
                }
            }(event.srcElement), 500)
        }
        gestures[touch.identifier] = gesture;
    }

    if (Object.keys(gestures).length == 2) {
        var elements = [];

        for(var p in gestures) {
            elements.push(gestures[p].element);
        }

        fireEvent(getCommonAncestor(elements[0], elements[1]), 'dualtouchstart', {
            touches: slice.call(event.touches),
            touchEvent: event
        });
    }
}


function touchmoveHandler() {

    for(var i = 0 ; i < event.changedTouches.length ; i++ ) {
        var touch = event.changedTouches[i],
            gesture = gestures[touch.identifier];

        if (!gesture) {
            return;
        }

        var displacementX = touch.clientX - gesture.startTouch.clientX,
            displacementY = touch.clientY - gesture.startTouch.clientY,
            distance = Math.sqrt(Math.pow(displacementX, 2) + Math.pow(displacementY, 2));

        // magic number 10: moving 10px means pan, not tap
        if (gesture.status === 'tapping' && distance > 10) {
            gesture.status = 'panning';
            fireEvent(gesture.element, 'panstart', {
                touch:touch,
                touchEvent:event
            });

            if(Math.abs(displacementX) > Math.abs(displacementY)) {
                fireEvent(gesture.element, 'horizontalpanstart', {
                    touch: touch,
                    touchEvent: event
                });
                gesture.isVertical = false;
            } else {
                fireEvent(gesture.element, 'verticalpanstart', {
                    touch: touch,
                    touchEvent: event
                });
                gesture.isVertical = true;
            }
        }

        if (gesture.status === 'panning') {
            gesture.panTime = Date.now();
            fireEvent(gesture.element, 'pan', {
                displacementX: displacementX,
                displacementY: displacementY,
                touch: touch,
                touchEvent: event
            });


            if(gesture.isVertical) {
                fireEvent(gesture.element, 'verticalpan',{
                    displacementY: displacementY,
                    touch: touch,
                    touchEvent: event
                });
            } else {
                fireEvent(gesture.element, 'horizontalpan',{
                    displacementX: displacementX,
                    touch: touch,
                    touchEvent: event
                });
            }
        }
    }

    if (Object.keys(gestures).length == 2) {
        var position = [],
            current = [],
            elements = [],
            transform
            ;
        
        for(var i = 0 ; i < event.touches.length ; i++ ) {
            var touch = event.touches[i];
            var gesture = gestures[touch.identifier];
            position.push([gesture.startTouch.clientX, gesture.startTouch.clientY]);
            current.push([touch.clientX, touch.clientY]);
        }

        for(var p in gestures) {
            elements.push(gestures[p].element);
        }

        transform = calc(position[0][0], position[0][1], position[1][0], position[1][1], current[0][0], current[0][1], current[1][0], current[1][1]);
        fireEvent(getCommonAncestor(elements[0], elements[1]), 'dualtouch',{
            transform : transform,
            touches : event.touches,
            touchEvent: event
        });
    }
}


function touchendHandler() {

    if (Object.keys(gestures).length == 2) {
        var elements = [];
        for(var p in gestures) {
            elements.push(gestures[p].element);
        }
        fireEvent(getCommonAncestor(elements[0], elements[1]), 'dualtouchend', {
            touches: slice.call(event.touches),
            touchEvent: event
        });
    }
    
    for (var i = 0; i < event.changedTouches.length; i++) {
        var touch = event.changedTouches[i],
            id = touch.identifier,
            gesture = gestures[id];

        if (!gesture) continue;

        if (gesture.pressingHandler) {
            clearTimeout(gesture.pressingHandler);
            gesture.pressingHandler = null;
        }

        if (gesture.status === 'tapping') {
            gesture.timestamp = Date.now();
            fireEvent(gesture.element, 'tap', {
                touch: touch,
                touchEvent: event
            });

            if(lastTap && gesture.timestamp - lastTap.timestamp < 300) {
                fireEvent(gesture.element, 'doubletap', {
                    touch: touch,
                    touchEvent: event
                });
            }

            this.lastTap = gesture;
        }

        if (gesture.status === 'panning') {
            fireEvent(gesture.element, 'panend', {
                touch: touch,
                touchEvent: event
            });

            var duration = Date.now() - gesture.startTime,
                velocityX = (touch.clientX - gesture.startTouch.clientX) / duration,
                velocityY = (touch.clientY - gesture.startTouch.clientY) / duration,
                displacementX = touch.clientX - gesture.startTouch.clientX,
                displacementY = touch.clientY - gesture.startTouch.clientY
                ;
            
            if (duration < 300) {
                fireEvent(gesture.element, 'flick', {
                    duration: duration,
                    velocityX: velocityX,
                    velocityY: velocityY,
                    displacementX: displacementX,
                    displacementY: displacementY,
                    touch: touch,
                    touchEvent: event
                });

                if(gesture.isVertical) {
                    fireEvent(gesture.element, 'verticalflick', {
                        duration: duration,
                        velocityY: velocityY,
                        displacementY: displacementY,
                        touch: touch,
                        touchEvent: event
                    });
                } else {
                    fireEvent(gesture.element, 'horizontalflick', {
                        duration: duration,
                        velocityX: velocityX,
                        displacementX: displacementX,
                        touch: touch,
                        touchEvent: event
                    });
                }
            }
        }

        if (gesture.status === 'pressing') {
            fireEvent(gesture.element, 'pressend', {
                touch: touch,
                touchEvent: event
            });
        }

        delete gestures[id];
    }

    if (Object.keys(gestures).length === 0) {
        docEl.removeEventListener('touchmove', touchmoveHandler, false);
        docEl.removeEventListener('touchend', touchendHandler, false);
        docEl.removeEventListener('touchcancel', touchcancelHandler, false);
    }
}

function touchcancelHandler() {

    if (Object.keys(gestures).length == 2) {
        var elements = [];
        for(var p in gestures) {
            elements.push(gestures[p].element);
        }
        fireEvent(getCommonAncestor(elements[0], elements[1]), 'dualtouchend', {
            touches: slice.call(event.touches),
            touchEvent: event
        });
    }

    for (var i = 0; i < event.changedTouches.length; i++) {
        if (gesture.status === 'panning') {
            fireEvent(gesture.element, 'panend', {
                touch: touch,
                touchEvent: event
            });
        }
        if (gesture.status === 'pressing') {
            fireEvent(gesture.element, 'pressend', {
                touch: touch,
                touchEvent: event
            });
        }
        delete gestures[event.changedTouches[i].identifier];
    }

    if (Object.keys(gestures).length === 0) {
        docEl.removeEventListener('touchmove', touchmoveHandler, false);
        docEl.removeEventListener('touchend', touchendHandler, false);
        docEl.removeEventListener('touchcancel', touchcancelHandler, false);
    }
}

docEl.addEventListener('touchstart', touchstartHandler, false);

})(window, window['app']||(window['app']={module:{},plugin:{}}));
(function(win, app, undef) {

function EventSource() {
	this._handlers = {};
}

var EventSourceProto = {
	addEventListener: function(type, handler) {
		var handlers = this._handlers, list;

		list = handlers[event] || (handlers[event] = []);
		list.push(handler);
	},

	removeEventListener: function(type, handler) {
		var handlers = this._handlers;

		if (!handlers[event]) return;

		handlers[event] = handlers[event].filter(function(h) {
			return h != handler;
		});

		if (!handlers[event].length) {
			delete handlers[event];
		}
	},

	dispatchEvent: function(e) {
		var handlers = this._handlers,
			type = e.type;

		handlers.hasOwnProperty(type)  &&
			handlers[type].forEach(function(handler) {
				handler(e);
			});

		this['on' + type] && this['on' + type](e);
	}
}

for (var p in EventSourceProto) {
	EventSource.prototype[p] = EventSourceProto[p];
} 

var SCOPES = {},
	SPLITER_REG = /\s+/
	;

function MessageScope(scope) {
	var that = this;

	this._scope = scope;
	this._source = new EventSource();
	this._cache = {};

	this._handler = function(e) {
		var type = e.type, args = e.args,
			list = that._cache[event]
			;

        for (var i = 0; i < list.length; i += 2) {
            list[i].apply(list[i + 1], args);
        }
	}

	SCOPES[scope] = this;
}

var MessageScopeProto = {
	on: function(events, callback, context) {
		var that = this,
			cache = that._cache,
			source = that._source,
			list
			;

		if (!callback) return that;

		events = events.split(SPLITER_REG);

        while (event = events.shift()) {
            list = cache[event] || (cache[event] = []);
            if (!list.length) {
            	source.addEventListener(event, this._handler);	
            }
            list.push(callback, context);
        }

        return that; 
	},

	off: function(events, callback, context) {
		var that = this,
			cache = that._cache,
			source = that._source,
			list
			;

        if (events) {
        	events = events.split(SPLITER_REG);
        } else {
        	events = Object.keys(cache);
        }

        while (event = events.shift()) {
        	!(callback || context) && (cache[event] = []);

        	list = cache[event];

            for (var i = list.length - 2; i >= 0; i -= 2) {
                if (!(callback && list[i] !== callback ||
                        context && list[i + 1] !== context)) {
                    list.splice(i, 2);
                }
            }

            if (!list.length) {
            	delete cache[event];
            	source.removeEventListener(event, this._handler);
        	}
        }

        return that;
	},

	once: function(events, callback, context) {
        var that = this
            ;

        function onceHandler() {
            callback.apply(this, arguments);
            that.off(events, onceHandler, context);
        }

        return that.on(events, onceHandler, context);
	},

	after: function(events, callback, context) {
		var that = this,
			state = {}
			;

		if (!callback) return that;

		function checkState() {
			for (var ev in state) {
				if (!state[ev]) return;
			}
			callback.apply(context);
		}

		events = events.split(SPLITER_REG);

		events.forEach(function(ev) {
			state[ev] = false;
			that.once(ev, function() {
				state[ev] = true;
				checkState();
			});
		});
	},

	trigger: function(events) {
		var that = this,
			cache = that._cache,
			source = that._source,
			args
			;

		events = events.split(SPLITER_REG);
		args = Array.prototype.slice.call(arguments, 1);

		while (event = events.shift()) {
			that.log(event, args);

			if (cache[event]) {
				source.dispatchEvent({
					type: event, 
					args: args
				});
			}
		}

		return that;
	},

    log : function(event, args) {
        console.log('[Message]', {scope:this._scope, event: event, args:args});
    }
}

for (var p in MessageScopeProto) {
	MessageScope.prototype[p] = MessageScopeProto[p];
}

MessageScope.mixto = function(obj, scope) {
	var context;

	if (typeof scope === 'string') {
		context = SCOPES[scope] || new MessageScope(scope);
	} else {
		context = scope;
	}

    obj.prototype && (obj = obj.prototype);

    for (var name in MessageScopeProto) {
		void function(func) {
			obj[name] = function() {
        		func.apply(context, arguments);
    		}
    	}(MessageScopeProto[name]);
    }
}

MessageScope.get = function(scope) {
	return SCOPES[scope] || (SCOPES[scope] = new MessageScope(scope));
}

app.module.EventSource = EventSource;
app.module.MessageScope = MessageScope;

})(window, window['app']||(window['app']={module:{},plugin:{}}));
(function(win, app, undef) {

var doc = win.document
	;

function _setButton(btn, options) {
	(options.id != null) && btn.setAttribute('id', options.id);
	(options['class'] != null) && (btn.className = options['class']);
	(options.text != null) && (btn.innerHTML = options.text);
	(options.bg != null) && (btn.style.background = options.bg);
	(options.icon != null) && (btn.innerHTML = '<img src="' + options.icon + '" border="0" />');
	(options.hide === true) ? (btn.style.display = 'none'):(btn.style.display = '');
	if (options.handler) {
		btn.handler && btn.removeEventListener('click', btn.handler, false);
		btn.addEventListener('click', (btn.handler = options.handler), false);
	}
}

function Navbar(wrapEl, options) {
	options || (options = {});

	this._wrapEl = wrapEl;
	this._animWrapEl = options.animWrapEl;
	this._backWrapEl = options.backWrapEl;
	this._funcWrapEl = options.funcWrapEl;
	this._titleWrapEl = options.titleWrapEl;
}

var NavbarProto = {
    setTitle: function(title) {
    	this._titleWrapEl && (this._titleWrapEl.innerHTML = title);
    },

    setButton: function(options) {
    	var wrap, btn;
    	if (options.type === 'back') {
    		wrap = this._backWrapEl;
    		btn = wrap.querySelector('button');
    	} else if (options.type === 'func') {
    		wrap = this._funcWrapEl;
    		btn = wrap.querySelector('#' + options.id);
    	} else if (options.id) {
    		btn = this._wrapEl.querySelector('#' + options.id);
    		btn && (wrap = btn.parentNode);
    	}

		if (!btn && wrap) {
			btn = doc.createElement('button');
			wrap.appendChild(btn);
		}
		_setButton(btn, options);
    },

    getButton: function(id) {
    	return this._funcWrapEl.querySelector('button#' + id);
    },

    removeButton: function(id) {
    	if (!id) {
    		var btns = this._funcWrapEl.querySelectorAll('button');
    		for (var i = 0; i < btns.length; i++) {
    			this.removeButton(btns[i]);
    		}
    	} else {
	    	if (typeof id === 'string') {
	    		var btn = this.getButton(id);
	    	} else if (id instanceof HTMLElement) {
	    		var btn = id;
	    	}
			if (btn) {
				btn.handler && btn.removeEventListener('click', btn.handler);
				btn.parentNode.removeChild(btn);
			}
		}
    }
}

for (var p in NavbarProto) {
	Navbar.prototype[p] = NavbarProto[p];
}

app.module.Navbar = Navbar;

})(window, window['app']||(window['app']={module:{},plugin:{}}));
(function(win, app, undef) {

function StateStack() {
	var that = this;

	that.move = null;
	that.transition = null;
	that.datas = null;

	that._states = [];
	that._stateIdx = 0;
	that._stateLimit = 100;
}

var StateStackProto = {
	reset: function() {
		var that = this;

		that.move = null;
		that.transition = null;
		that.datas = null;

		that._states = [];
		that._stateIdx = 0;
		that._stateLimit = 100;
	},

	pushState: function(name, fragment, params, args) {
		var that = this,				
			states = that._states,
			stateIdx = that._stateIdx,
			stateLimit = that._stateLimit,
			stateLen = states.length,
			move = that.move,
			transition = that.transition,
			datas = that.datas,

			prev = states[stateIdx - 1],
			next = states[stateIdx + 1],
			cur = {
				name : name,
				fragment : fragment,
				params : params || {},
				args : args || {},
				datas : datas || {}
			}
			;

		if (move == null) {
			if (!datas && StateStack.isEquals(prev, cur)) {
				transition = move = 'backward';
			} else {
				transition = move = 'forward';
			}
		}

		if (move === 'backward') {
			if (stateIdx === 0 && stateLen > 0) {
				states.unshift(cur);
			} else if (stateIdx > 0) {
				stateIdx--;
				cur = prev;
			}
		} else if (move === 'forward') {
			if (stateIdx === stateLimit - 1) {
				states.shift();
				states.push(cur);
			} else if (stateIdx === 0 && stateLen === 0) {
				states.push(cur);
			} else if (!datas && StateStack.isEquals(next, cur)){
				stateIdx++;
				cur = next;
			} else if (StateStack.isEquals(states[stateIdx], cur)){
				cur = states[stateIdx];
			} else {
				stateIdx++;
				states.splice(stateIdx);
				states.push(cur);
			}
		}

		cur.move = move;
		cur.transition = transition;

		that.move = null;
		that.transition = null;
		that.datas = null;
		that._stateIdx = stateIdx;

		return cur;
	},

	getState: function() {
		return this._states[this._stateIdx];
	},

	getIndex: function() {
		return this._stateIdx;
	}
}

for (var p in StateStackProto) {
	StateStack.prototype[p] = StateStackProto[p];
}

StateStack.isEquals = function(state1, state2) {
	if (!state1 || !state2) return false;

	if (state1.name !== state2.name || 
			state1.fragment !== state2.fragment)
		return false;

	return true;
}

var NAMED_REGEXP = /\:(\w\w*)/g,
	SPLAT_REGEXP = /\*(\w\w*)/g,
	PERL_REGEXP = /P\<(\w\w*?)\>/g,
	ARGS_SPLITER = '!',
	his = win.history,
	loc = win.location,
	Message = app.module.MessageScope
	;

function convertParams(routeText) {
	return routeText.replace(NAMED_REGEXP, '(P<$1>[^\\/]*?)')
				.replace(SPLAT_REGEXP, '(P<$1>.*?)');
}

function extractNames(routeText) {
	var matched = routeText.match(PERL_REGEXP),
		names = {}
		;


	matched && matched.forEach(function(name, i) {
		names[name.replace(PERL_REGEXP, '$1')] = i;
	});

	return names;
}

function extractArgs(args) {
	var split = args.split('&')
		;

	args = {};
	split.forEach(function(pair) {
		if (pair) {
			var s = pair.split('=')
				;

			args[s[0]] = s[1];
		}
	});

	return args;
}

function parseRoute(routeText) {
	routeText = routeText.replace(PERL_REGEXP, '');

	return new RegExp('^(' + routeText + ')(' + ARGS_SPLITER + '.*?)?$');
}


function getFragment() {
	return loc.hash.slice(1) || '';
}

function setFragment(fragment) {
	loc.hash = fragment;
}

function Navigation() {
	var that = this;

	that._started = false;
	that._routes = {};
	that._stack = new StateStack();

	Message.mixto(this, 'navigation');
}

var NavigationProto = {
	getStack: function() {
		return this._stack;
	},

	handleEvent: function() {
    	var that = this,
    		routes = that._routes,
    		route, fragment, 
    		unmatched = true
			;

		if (!that._started) return;

		fragment = getFragment();

		for (var name in routes) {
			route = routes[name];
			
			if(route.routeReg.test(fragment)) {
                unmatched = false;
				route.callback(fragment);
				if (route.last) break;
			}
		}

		unmatched && that.trigger('unmatched', fragment);
	},

	addRoute: function(name, routeText, options) {
		var that = this,
			routeNames, routeReg
			;

		if (arguments.length === 1) {
			options = arguments[0];
			name = null;
			routeText = null;
		}

		options || (options = {});

		function routeHandler(fragment, params, args) {
			var state = that._stack.pushState(name, fragment, params, args);
			options.callback && options.callback(state);

			that.trigger(state.move, state);
		}

		if (options['default']) {
			this.on('unmatched', routeHandler);
		} else if (name && routeText) {
			routeText = convertParams(routeText);
			routeNames = extractNames(routeText);
			routeReg = parseRoute(routeText);

			that._routes[name] = {
				routeReg: routeReg,
				callback: function(fragment) {
					var matched = fragment.match(routeReg).slice(2),
						args = extractArgs(matched.pop() || ''),
						params = {}
						;

					for (var name in routeNames) {
						params[name] = matched[routeNames[name]];
					}

					routeHandler(fragment, params, args);
				},
				last: !!options.last
			}
		}
	},

	removeRoute: function(name) {
		if (this._routes[name]) {
			delete this._routes[name];
		}
	},

	start: function() {
		if(this._started) return false;

		this._stack.reset();
	    this._started = true;

		win.addEventListener('hashchange', this, false);
		return true;
	},

	stop: function() {
    	if (!this._started) return false;
    	
    	this._routes = {};
    	this._started = false;
    	win.removeEventListener('hashchange', this, false);
    	return true;
	},

	push: function(fragment, options) {
		var that = this,
			stack = that._stack,
			state = stack.getState(),
			args = []
			;

		options || (options = {});
		stack.move = 'forward';
		stack.transition = 'forward';

		if (fragment) {
			if (!state || state.fragment !== fragment || 
					options.data) {

				options.type || (options.type = 'GET');
				options.data || (options.data = {});

				if (options.type.toUpperCase() === 'GET') {
					for (var key in options.data) {
						args.push(key + '=' + options.data[key]);
					}
				}

				if (options.type.toUpperCase() === 'POST') {
					stack.datas = options.data;
				}

				if (options.transition === 'backward') {
					stack.transition = 'backward';
				}

				setFragment(fragment + (args.length ? ARGS_SPLITER + args.join('&') : ''));
			}
		} else {
			his.forward();
		}
	},

	pop: function(options) {
		var that = this,
			stack = that._stack,
			stateIdx = stack.getIndex()
			;

		if (stateIdx === 0) return;

		stack.move = 'backward';
		stack.transition = 'backward';

		if (options && options.transition === 'forward') {
			stack.transition = 'forward';
		}

		his.back();
	}
}

for (var p in NavigationProto) {
	Navigation.prototype[p] = NavigationProto[p];
}

Navigation.instance = new Navigation();

app.module.StateStack = StateStack;
app.module.Navigation = Navigation;

})(window, window['app']||(window['app']={module:{},plugin:{}}));
//@reqiure message

(function(win, app, undef) {


var Message = app.module.MessageScope,
	pm = Message.get('page'),
	pages = {}
	;

function extend(target, properties) {
	for (var key in properties) {
		if (properties.hasOwnProperty(key)) {
			target[key] = properties[key];
		}
	}
}

function inherit(child, parent) {
	function Ctor() {}
	Ctor.prototype = parent.prototype;
	var proto = new Ctor();
	extend(proto, child.prototype);
	proto.constructor = child;
	child.prototype = proto;
}

function Page() {
}

var PageProto = {
	navigation: {
		push: function(fragment, options) {
			pm.trigger('navigation:push', fragment, options);
		},

		pop: function() {
			pm.trigger('navigation:pop');
		},

		getParameter: function(name) {
			var value;

			pm.once('navigation:getParameter:callback', function(v) {
				value = v;
			})
			pm.trigger('navigation:getParameter', name);
			return value;
		},

		getData: function(name) {
			var value;
			
			pm.once('navigation:getData:callback', function(v) {
				value = v;
			})
			pm.trigger('navigation:getData', name);	

			return value;
		},

		setData: function(name, value) {
			pm.trigger('navigation:setData', name, value);
		},

		setTitle: function(title) {
			pm.trigger('navigation:setTitle', title);	
		},

		setButton: function(options) {
			pm.trigger('navigation:setButton', options);
		}
	},

	content: {
		html: function(html) {
			pm.trigger('content:html', html);
		},
		el: null,
		$el: null
	},

	startup : function() {/*implement*/},
	teardown : function() {/*implement*/}	
}

for (var p in PageProto) {
	Page.prototype[p] = PageProto[p];
} 

Page.fn = {};

Page.define = function(properties) {
	function ChildPage() {
		Page.apply(this, arguments);
		this.initialize && this.initialize.apply(this, arguments);

		extend(this, Page.fn);
		extend(this, properties);
		Message.mixto(this, 'page.' + this.name);
	}
	inherit(ChildPage, Page);

	return (pages[properties.name] = new ChildPage());
}

Page.get = function(name) {
	return pages[name];
}

app.module.Page = Page;

})(window, window['app']||(window['app']={module:{},plugin:{}}));
(function(win, app, undef) {

var doc = win.document
	;

function Template(url) {
	this.url = url;
}

var TemplateProto = {
	load: function(url, callback) {
		// can overwrite
		var that = this,
			engine = app.config.templateEngine
			;

		if (arguments.length === 1) {
			callback = arguments[0];
			url = that.url;
		} else {
			that.url = url;
		}

		function loaded(text) {
			callback && callback(text);
		}

		if (engine && engine.load && typeof url === 'string') {
			engine.load(url, loaded);
		} else {
			loaded(url);
		}
	},

	compile: function(text) {
		// can overwrite
		var that = this,
			engine = app.config.templateEngine
			;

		that.originTemplate = text;

		if (engine && engine.compile && typeof text === 'string') {
			that.compiledTemplate = engine.compile(text);
		} else {
			that.compiledTemplate = text;
		}

		return that.compiledTemplate;
	},

	render: function(datas) {
		// can overwrite
		var that = this,
			engine = app.config.templateEngine,
			compiledTemplate = that.compiledTemplate
			;

		if (engine && engine.render && typeof datas === 'object' && compiledTemplate) {
			that.content = engine.render(compiledTemplate, datas);
		} else {
			that.content = compiledTemplate;
		}

		return that.content;
	}
}

for (var p in TemplateProto) {
	Template.prototype[p] = TemplateProto[p];
} 

app.module.Template = Template;

})(window, window['app']||(window['app']={module:{},plugin:{}}));
(function(win, app, undef) {

var doc = win.document
	;


function Toolbar(wrapEl, options) {
	options || (options = {});

	this._wrapEl = wrapEl;
	options.html && (this._wrapEl.innerHTML = options.html);
	options.height && (this._wrapEl.style.height = options.height + 'px');
}

var ToolbarProto = {
    show: function(html, options) {
    	options || (options = {});
		html && (this._wrapEl.innerHTML = html);
		options.height && (this._wrapEl.style.height = options.height + 'px');
    	this._wrapEl.style.display = '';
    	return this._wrapEl;
    },

    hide: function() {
    	this._wrapEl.style.display = 'none';
    	return this._wrapEl;
    }
}

for (var p in ToolbarProto) {
	Toolbar.prototype[p] = ToolbarProto[p];
}

app.module.Toolbar = Toolbar;

})(window, window['app']||(window['app']={module:{},plugin:{}}));
(function(win, app, undef) {

var doc = win.document,
	views = {}
	;

function extend(target, properties) {
	for (var key in properties) {
		if (properties.hasOwnProperty(key)) {
			target[key] = properties[key];
		}
	}
}

function inherit(child, parent) {
	function Ctor() {}
	Ctor.prototype = parent.prototype;
	var proto = new Ctor();
	extend(proto, child.prototype);
	proto.constructor = child;
	child.prototype = proto;
}
	
function View() {
	var el, $el, $ = win['$'];


	Object.defineProperty(this, 'el', {
		get: function() {
			return el;
		},

		set: function(element) {
			var $;

			if (typeof element === 'string') {
				el = doc.querySelector(element);
			} else if (element instanceof HTMLElement) {
				el = element;
			}

			$ && ($el = $(el));
		}
	});

	Object.defineProperty(this, '$el', {
		get: function() {
			return $el;
		},

		set: function(element) {
			if (typeof element === 'string' && $) {
				$el = $(element);
			} else {
				$el = element;
			}

			$el && (el = $el[0]);
		}
	});
}

var ViewProto = {
	render: function(callback) {/*implement*/},
	destory: function(callback) {/*implement*/}
}

for (var p in ViewProto) {
	View.prototype[p] = ViewProto[p];
} 

View.fn = {};

View.extend = function(properties) {
	function ChildView() {
		View.apply(this, arguments);
		this.initialize && this.initialize.apply(this, arguments);
		extend(this, View.fn);
		extend(this, properties);
	}
	inherit(ChildView, View);
	
	return (views[properties.name] = ChildView);
}

View.get = function(name) {
	return views[name];
}

app.module.View = View;

})(window, window['app']||(window['app']={module:{},plugin:{}}));


(function(win, app, undef) {

var doc = win.document,
	anim = app.module.Animation,
	TYPE_XY = {
		'L': 'x',
		'R': 'x',
		'T': 'y',
		'B': 'y'
	},
	TYPE_IO = {
		'I': -1,
		'O': 1
	}
	;


var Transition = {
	TYPE : {
		LEFT_IN: 'LI',
		LEFT_OUT: 'LO',
		RIGHT_IN: 'RI',
		RIGHT_OUT: 'RO',
		TOP_IN: 'TI',
		TOP_OUT: 'TO',
		BOTTOM_IN: 'BI',
		BOTTOM_OUT: 'BO'
	},

	move: function(element, offsetX, offsetY, callback) {
		var offset = anim.getTransformOffset(element)
			;

		element.style.webkitBackfaceVisibility = 'hidden';
		element.style.webkitTransformStyle = 'preserve-3d';

		anim.translate(element,
			'0.4s', 'ease', '0s',
			offset.x + offsetX, offset.y + offsetY,
			function() {
				element.style.webkitBackfaceVisibility = 'initial';
				element.style.webkitTransformStyle = 'flat';
				callback && callback();
			}
		)
	},

	slide: function(element, type, offset, callback) {
		var TYPE = this.TYPE, xy, io,
			originXY = anim.getTransformOffset(element),
			newXY = {
				x: originXY.x,
				y: originXY.y
			}
			;

		type = type.split('');
		xy = TYPE_XY[type[0]];
		io = TYPE_IO[type[1]];

		if (type[1] === 'I') {
			originXY[xy] += io * offset;
		} else {
			newXY[xy] += io * offset;
		}

		element.style.webkitTransition = '';
		element.style.webkitTransform = anim.makeTranslateString(originXY.x, originXY.y);
		element.style.webkitBackfaceVisibility = 'hidden';
		element.style.webkitTransformStyle = 'preserve-3d';

		anim.translate(element,
			'0.4s', 'ease', '0s',
			newXY.x, newXY.y,
			function() {
				element.style.webkitBackfaceVisibility = 'initial';
				element.style.webkitTransformStyle = 'flat';
				callback && callback();
			}
		);		
	},

	float: function(element, type, offset, callback) {
		var TYPE = this.TYPE, xy, io,
			originXY = anim.getTransformOffset(element),
			newXY = {
				x: originXY.x,
				y: originXY.y
			},
			opacity
			;

		type = type.split('');
		xy = TYPE_XY[type[0]];
		io = TYPE_IO[type[1]];

		if (type[1] === 'I') {
			originXY[xy] += io * offset;
			opacity = 0;
		} else {
			newXY[xy] += io * offset;
			opacity = 1;
		}

		element.style.webkitTransition = '';
		element.style.webkitTransform = anim.makeTranslateString(originXY.x, originXY.y);
		element.style.opacity = opacity;
		element.style.webkitBackfaceVisibility = 'hidden';
		element.style.webkitTransformStyle = 'preserve-3d';

		anim.doTransition(element, {
			opacity: opacity === 1?0:1,
			translate: [newXY.x, newXY.y]
		}, {
			duration: '0.4s',
			timingFunction: 'ease',
			callback : function() {
				element.style.webkitBackfaceVisibility = 'initial';
				element.style.webkitTransformStyle = 'flat';
				callback && callback();
			}
		});
	},

	fadeIn: function(element, options) {
		
	},

	fadeOut: function(element, options) {

	},


	zoomIn: function(element, options) {

	},

	zoomOut: function(element, options) {

	}
}

app.module.Transition = Transition;

})(window, window['app']||(window['app']={module:{},plugin:{}}));



(function(win, app, undef) {

var doc = win.document,
	docEl = doc.documentElement,
	anim = app.module.Animation,
	element, offset, minScrollTop, maxScrollTop,
	panFixRatio = 2,
	cancelScrollEnd = false,
	stopBounce = false,
	prevented = false
	;

function getMinScrollTop(el) {
	return 0 - (el.bounceTop || 0);
}

function getMaxScrollTop(el) {
    // var parentStyle = getComputedStyle(el.parentNode),
    //     maxTop = 0 - el.offsetHeight + parseInt(parentStyle.height) - 
    //             parseInt(parentStyle.paddingTop) - 
    //             parseInt(parentStyle.paddingBottom);

    var rect = el.getBoundingClientRect(),
    	pRect = el.parentNode.getBoundingClientRect(),
    	maxTop = 0 - rect.height + pRect.height
    	;

    if (maxTop > 0) maxTop = 0;

    return maxTop + (el.bounceBottom || 0);
}

function fireEvent(element, eventName, extra) {
	var event = doc.createEvent('HTMLEvents');
	event.initEvent(eventName, false, true);
	for (var p in extra) {
		event[p] = extra[p];
	}
    element.dispatchEvent(event);
}

function touchstartHandler(e) {
	if (stopBounce) return;

	var parentElement = e.srcElement;

	while (!parentElement.boundScrollEvent) {
		parentElement = parentElement.parentNode || parentElement.offsetParent;
	}

	element = parentElement.boundScrollElement;

	if (!element) return;

	element.style.webkitTransition = '';
	element.style.webkitTransform = getComputedStyle(element).webkitTransform;
}

function touchmoveHandler(e) {
	e.preventDefault();
	return false;
}

function touchendHandler(e) {
	// TODO
}

function panstartHandler(e) {
	if (stopBounce || !element) return;

	offset = anim.getTransformOffset(element);
	minScrollTop = getMinScrollTop(element);
	maxScrollTop = getMaxScrollTop(element);
	panFixRatio = 2.5;
	stopBounce = false;
	cancelScrollEnd = false;
}

function panHandler(e) {
	if (stopBounce || !element) return;

    var y = offset.y + e.displacementY
        ;

    if(y > minScrollTop) {
    	y = minScrollTop + (y - minScrollTop) / panFixRatio;
    	panFixRatio *= 1.003;
    	if (panFixRatio > 4) panFixRatio = 4;
    } else if(y < maxScrollTop) {
    	y = maxScrollTop - (maxScrollTop - y) / panFixRatio;
    	panFixRatio *= 1.003;
    	if (panFixRatio > 4) panFixRatio = 4;
    }

    if ((getBoundaryOffset(y))) {
    	if (y > minScrollTop) {
    		var name = 'pulldown';
    	} else if (y < maxScrollTop) {
    		var name = 'pullup';
    	}
    	fireEvent(element, name);
    }

    element.style.webkitTransition = '';
    element.style.webkitTransform = anim.makeTranslateString(offset.x, y);
}

function panendHandler(e) {
	if (stopBounce || !element) return;

	var y = anim.getTransformOffset(element).y
	if (getBoundaryOffset(y)) {
		bounceEnd();
	} else {
		scrollEnd();
	}
}

function getBoundaryOffset(y) {
	if(y > minScrollTop) {
        return y - minScrollTop;
    } else if (y < maxScrollTop){
        return maxScrollTop - y;
    }
}

function touchBoundary(y) {
	if (y > minScrollTop) {
		y = minScrollTop;
	} else if (y < maxScrollTop) {
		y = maxScrollTop;
	}

	return y;
}

function bounceStart(v) {
	if (stopBounce || !element) return;

    var s0 = anim.getTransformOffset(element).y,
    	a = 0.008 * ( v / Math.abs(v));
    	t = v / a;
    	s = s0 + t * v / 2
    	;

    fireEvent(element, 'bouncestart');

    anim.translate(element, 
    	t.toFixed(0) + 'ms', 'cubic-bezier(' + anim.genCubicBezier(-t, 0) + ')', '0s', 
    	offset.x, s.toFixed(0),
		bounceEnd
    );
}

function bounceEnd() {
	if (stopBounce || !element) return;

	var y = anim.getTransformOffset(element).y;
	y = touchBoundary(y);

    anim.translate(element, 
    	'0.4s', 'ease-in-out', '0s', 
    	offset.x, y,
    	function() {
    		fireEvent(element, 'bounceend');
    		scrollEnd();
    	}
    );
}

function flickHandler(e) {
	if (stopBounce || !element) return;
	
    var s0 = anim.getTransformOffset(element).y,
        v, a, t, s,
        _v, _s, _t
        ;

    cancelScrollEnd = true;

    if(s0 > minScrollTop || s0 < maxScrollTop) {
    	bounceStart(v);
    } else {
    	v = e.velocityY;
        if (v > 1.5) v = 1.5;
        if (v < -1.5) v = -1.5;
        a = 0.0015 * ( v / Math.abs(v));
		t = v / a;
        s = s0 + t * v / 2;

        if (s > minScrollTop) {
    	    _s = minScrollTop - s0;
            _t = (v - Math.sqrt(-2 * a *_s + v * v)) / a;
            _v = v - a * _t;

	        anim.translate(element, 
	        	_t.toFixed(0) + 'ms', 'cubic-bezier(' + anim.genCubicBezier(-t, -t + _t) + ')', '0s', 
	        	offset.x, minScrollTop,
	        	function() {
	        		bounceStart(_v)
	        	}
	        );
            
        } else if (s < maxScrollTop) {
            _s = maxScrollTop - s0;
            _t = (v + Math.sqrt(-2 * a * _s + v * v)) / a;
            _v = v - a * _t;

	        anim.translate(element, 
	        	_t.toFixed(0) + 'ms', 'cubic-bezier(' + anim.genCubicBezier(-t, -t + _t) + ')', '0s', 
	        	offset.x, maxScrollTop,
	        	function() {
	        		bounceStart(_v)
	        	}
	        );
        } else {
	        anim.translate(element, 
	        	t.toFixed(0) + 'ms', 'cubic-bezier(' + anim.genCubicBezier(-t, 0) + ')', '0s', 
	        	offset.x, s.toFixed(0),
	        	scrollEnd
	        );
        }
	}
}

function scrollEnd() {
	if (stopBounce || !element) return;
	
	cancelScrollEnd = false;

	setTimeout(function() {
		if (!cancelScrollEnd) {
			fireEvent(element, 'scrollend');
		}
	}, 10);
}

var Scroll = {
	enable: function(element, options) {
		var parentElement = element.parentNode || element.offsetParent
			;

	    if (!prevented) {
	    	prevented = true;
	    	docEl.addEventListener('touchmove', touchmoveHandler, false);
	    }

	    if (!parentElement.boundScrollEvent) {
	    	parentElement.boundScrollEvent = true;
			parentElement.addEventListener('touchstart', touchstartHandler, false);
			parentElement.addEventListener('touchend', touchendHandler, false);
		    parentElement.addEventListener('panstart', panstartHandler, false);
		    parentElement.addEventListener('pan', panHandler, false);
		    parentElement.addEventListener('panend', panendHandler, false);
		    parentElement.addEventListener('flick', flickHandler, false);
	    }
	    parentElement.boundScrollElement = element;

	    if (!element.refresh) {
	    	element.getScrollHeight = function() {
	    		return element.scrollHeight - (element.bounceTop||0) - (element.bounceBottom||0);
	    	}

		    element.getScrollTop = function() {
		    	var offset = anim.getTransformOffset(element);
	    		return -(offset.y + (element.bounceTop||0));
	    	}

		    element.refresh = function() {
		        element.style.height = 'auto';
		        element.style.height = element.offsetHeight + 'px';
		    }

		    element.scrollTo = function(y) {
		    	var x = anim.getTransformOffset(element).x;
		    	y = touchBoundary(-y - (element.bounceTop || 0));
				element.style.webkitTransition = '';
		        element.style.webkitTransform = anim.makeTranslateString(x, y);
		    }

		    element.scollToElement = function(el) {
		    	
		    }

		    element.getBoundaryOffset = function() {
			    var y = anim.getTransformOffset(element).y;
			    return getBoundaryOffset(y);
		    }

		    element.getViewHeight = function() {
		    	return getMinScrollTop(element) - getMaxScrollTop(element);
		    }

		    element.stopBounce = function() {
		    	stopBounce = true;

		    	var y = anim.getTransformOffset(element).y,
		    		minScrollTop = getMinScrollTop(element),
		    		maxScrollTop = getMaxScrollTop(element),
		    		_y
		    		;

		    	if (y > minScrollTop + (element.bounceTop||0)) {
		    		_y = minScrollTop + (element.bounceTop||0);
		    	} else if (y < maxScrollTop - (element.bounceBottom||0)) {
		    		_y = maxScrollTop - (element.bounceBottom||0);
		    	}

		    	if (_y != null) {
		    		anim.translate(element,
		    			'0.4s', 'ease-in-out', '0s',
		    			offset.x, _y);
		    	}
		    }

		    element.resumeBounce = function() {
		    	stopBounce = false;

		    	var y = anim.getTransformOffset(element).y,
		    		minScrollTop = getMinScrollTop(element),
		    		maxScrollTop = getMaxScrollTop(element),
		    		_y
		    		;

		    	if (y > minScrollTop) {
		    		_y = minScrollTop;
		    	} else if (y < maxScrollTop){
		    		_y = maxScrollTop;
		    	}

		    	if (_y != null) {
		    		anim.translate(element,
		    			'0.4s', 'ease-in-out', '0s',
		    			offset.x, _y);
		    	}
		    }
		}

		if (options) {
			element.bounceTop = options.bounceTop;
			element.bounceBottom = options.bounceBottom;
		}
		element.scrollTo(0);

	    return element;
	},

	disable: function(element) {
		var parentElement = element.parentNode || element.offsetParent;

		if (parentElement.boundScrollElement === element) {
			parentElement.boundScrollElement = null;
		}
	}
}

app.module.Scroll = Scroll;

})(window, window['app']||(window['app']={module:{},plugin:{}}));


(function(win, app, undef) {

var Message = app.module.MessageScope,
	mid = 0, cid = 0;

function Model(data) {
	var that = this,
		initializing  = true,
		children = {}
		;

	Message.mixto(that, 'model-' + mid++);

	that.addProperty = function(key, value) {
		Object.defineProperty(that, key, {
			get: function() {
				return children[key] || data[key];
			},
			set: function(value) {
				if (children[key]) {
					children[key].destory();
					delete children[key];
				}

				if (value != null) {
					data[key] = value;
					if (typeof value === 'object') {
						children[key] = new Model(value);
						children[key].on('propertyChange',  function(e) {
							that.trigger('propertyChange', {
								target: e.target,
								value: e.value,
								name: e.name,
								path: key + '.' + e.path
							});
						});
					}
				}

				!initializing && that.trigger('propertyChange', {
					target: that,
					value: children[key] || data[key],
					name: key,
					path: key
				});
			}
		});

		that[key] = value;
	}

	that.update = function(data) {
		if (data instanceof Array) {
			for (var i = 0; i < data.length; i++) {
				if (!(data[i] instanceof Model)) {
					this.addProperty(i, data[i]);
				}
			}
		} else {
			for (var key in data) {
				if (that.hasOwnProperty(key)) {
					throw new Error('property conflict "' + key + '"');
				}

				if (data.hasOwnProperty(key) && !(data[key] instanceof Model)) {
					this.addProperty(key, data[key]);
				}
			}
		}
	}

	that.destory = function() {
		for (var key in children) {
			children[key].destory();
		}
		that.off();
	}

	that.on('propertyChange', function(e) {
		that.trigger('change:' + e.path, e.value);
	});

	that.update(data);

	initializing = false;
}

function Collection(data) {
	var that = this
		;

	if (!data instanceof Array) return;

	that.length = data.length;

	that.push = function(value) {
		data.push(value);
		that.length = data.length;
		that.addProperty(data.length - 1, value);
	}

	that.pop = function() {
		var value = data.pop();
		that.length = data.length;
		that[data.length] = null;
		return value;
	}

	Model.call(that, data);
}

app.module.Model = Model;
app.module.Collection = Collection;


})(window, window['app']||(window['app']={module:{},plugin:{}}));












(function(win, app, undef) {

var doc = win.document,
	$ = win['$']
	;

var Message = app.module.Message,
	Navigation = app.module.Navigation,
	Template = app.module.Template,
	View = app.module.View,
	Page = app.module.Page,
	Navbar = app.module.Navbar,
	Toolbar = app.module.Toolbar,
	Content = app.module.Content,
	Scroll = app.module.Scroll,
	Transition = app.module.Transition
	;

var hooks = {
	extendView: [],
	definePage: [],
	switchNavigation: []
};

app.config = {
	viewport : null,
	enableNavbar : false,
	enableToolbar : false,
	enableContent: true,
	enableScroll : false,
	enableTransition : false,
	templateEngine : null
}

function q(selector, el) {
	el || (el = doc);
	return el.querySelector(selector);
}

var ConfigInitial = (function () {
	return function() {
		var config = app.config;

		Navbar || (config.enableNavbar = false);
		Toolbar || (config.enableToolbar = false);
		Scroll || (config.enableScroll = false);
		Transition || (config.enableTransition = false);

		config.enableNavbar === true && (config.enableNavbar = {});
		config.enableToolbar === true && (config.enableToolbar = {});
		config.enableScroll === true && (config.enableScroll = {});
		config.enableTransition === true && (config.enableTransition = {});
		typeof config.enableContent !== 'object' && (config.enableContent = {});

	}
})();

var MessageInitial = (function () {
	return function() {

	}
})();

var NavigationInitial = (function() {
	var H_definePage = hooks.definePage,
		H_switchNavigation = hooks.switchNavigation,
		navigation = Navigation.instance;

	H_definePage.push(function(page) {
		name = page.name;
		route = page.route;

		if (!route) {
			route = {name: name, 'default': true}
		} else if (typeof route === 'string') {
			route = {name: name, text: route}
		}

		navigation.instance.addRoute(route.name, route.text, {
			'default': route['default'],
			callback: route.callback,
			last: route.last
		});
	});

	return function() {
		navigation.on('forward backward', function(state) {
			var page = Page.get(state.name);
			H_switchNavigation.forEach(function(func) {
				func(state, page);
			});
		});
	}
})();

var UIInitial = (function () {
	var H_switchNavigation = hooks.switchNavigation;

	H_switchNavigation.push(function(state, page){
		var config = app.config,
			c_navbar = config.enableNavbar,
			c_toolbar = config.enableToolbar
			;

		if (c_navbar) {
			var i_navbar = c_navbar.instance;

			i_navbar.setTitle(page.title);
			i_navbar.removeButton();

			if (page.buttons) {
				page.buttons.forEach(function(button) {
					i_navbar.setButton(button);
				});
			}

			if (c_navbar.titleWrapEl.parentNode === c_navbar.backWrapEl.parentNode && 
					c_navbar.titleWrapEl.parentNode === c_navbar.funcWrapEl.parentNode) {
				Transition.float(c_navbar.titleWrapEl.parentNode, transition === 'backward' ? 'RI' : 'LI', 50);
			}
		}

		if (c_toolbar && page.toolbar) {
			i_navbar.show(page.toolbar);
		} else {
			i_navbar.hide();
		}
	});

	return function() {
		var config = app.config,
			c_navbar = config.enableNavbar,
			c_toolbar = config.enableToolbar,
			c_content = config.enableContent
			;

		config.viewport || (config.viewport = q('.viewport'));

		if (c_navbar) {
			c_navbar.wrapEl || (c_navbar.wrapEl = q('header.navbar', config.viewport));
			c_navbar.titleWrapEl || (c_navbar.titleWrapEl = q('header.navbar > ul > li:nth-child(2)', config.viewport));
			c_navbar.backWrapEl || (c_navbar.backWrapEl = q('header.navbar > ul > li:nth-child(2)', config.viewport));
			c_navbar.funcWrapEl || (c_navbar.funcWrapEl = q('header.navbar > ul > li:last-child', config.viewport));
			c_navbar.instance = new Navbar(c_navbar.wrapEl, c_navbar);
		}

		if (c_toolbar) {
			c_toolbar.wrapEl || (c_toolbar.wrapEl = q('footer.toolbar', config.viewport));
			c_toolbar.instance = new Toolbar(c_toolbar.wrapEl, c_toolbar);
		}

		c_content.wrapEl || (c_content.wrapEl = q('section.content', config.viewport));	
		c_content.cacheLength || (c_content.cacheLength = 3);
		c_content.instance = new Content(c_content.wrapEl, {
			cacheLength: c_content.cacheLength
		});
	}
})();

var AnimInitial = (function () {
	var H_switchNavigation = hooks.switchNavigation;

	H_switchNavigation.push(function(state, page){
		var config = app.config,
			i_content = config.enableContent.instance,
			c_transition = config.enableTransition,
			c_scroll = config.enableScroll,
			move = state.move,
			transition = state.transition
			;

		move === 'backward' ? i_content.previous() : i_content.next();

		if (c_scroll) {
			Scroll.disable(c_scroll.wrapEl);
			c_scroll.wrapEl = i_content.getActive();
			Scroll.enable(c_scroll.wrapEl, page.scroll);
		}

		if (c_transition) {
			var offsetX = c_transition.wrapEl.offsetWidth * (transition === 'backward'?1:-1),
				className = c_transition.wrapEl.className += ' ' + transition
				;

			Transition.move(c_transition.wrapEl, offsetX, 0, function() {
				c_transition.wrapEl.className = className.replace(' ' + transition, '');
				i_content.setClassName();
			});
		} else {
			i_content.setClassName();
		}

	});

	return function() {
		var config = app.config,
			i_content = config.enableContent.instance,
			c_transition = config.enableTransition,
			c_scroll = config.enableScroll
			;

		if (c_scroll) {
			c_scroll.wrapEl = i_content.getActive();
		}

		if (c_transition) {
			c_transition.wrapEl = i_content.getActive().parentNode;
		}
	}
})();

var TemplateInitial = (function () {
	return function() {
		
	}
})();

var ViewIntial = (function () {
	return function() {
		
	}
})();

var PageInitial = (function () {
	var H_switchNavigation = hooks.switchNavigation,

		config = app.config,
		i_content = config.enableContent.instance,
		c_navbar = config.enableNavbar,
		c_toolbar = config.enableNavbar,
		navigation = Navigation.instance,

		protoExtension = {
			navigation: {
				push: function(fragment, options) {
					navigation.push(fragment, options);
				},

				pop: function() {
					navigation.pop();
				},

				getParameter: function(name) {
					var stack = navigation.getStack(),
						state = stack.getState();

					return state.params[name] || state.args[name] || state.datas[name];
				},

				getData: function(name) {
					var stack = navigation.getStack(),
						state = stack.getState();

					return state.datas[name];
				},

				setData: function(name, value) {
					var stack = navigation.getStack(),
						state = stack.getState();

					state.datas[name] = value;

				},

				setTitle: function(title) {
					if (c_navbar) {
						c_navbar.instance.setTitle(title);
					}
				},

				setButton: function(options) {
					if (c_navbar) {
						c_navbar.instance.setButton(options);
					}
				}
			},

			content: {
				html: function(html) {
					i_content.html(html);
				}
			}
		}

	Object.defineProperty(protoExtension.content, 'el', {
		get: function() {
			return i_content.getActive();
		}
	});

	if ($) {
		Object.defineProperty(protoExtension.content, '$el', {
			get: function() {
				return $(i_content.getActive());
			}
		});
	}

	for (var p in protoExtension) {
		Page.prototype[p] = protoExtension[p];
	}

	H_switchNavigation.push(function(state, page) {
		page.startup();
	});

	return function() {
		
	}
})();

var PluginInitial = (function () {
	return function() {
		
	}
})();

app.start = function() {}

app.extendView = function(properties) {
	var view = View.extend(properties);

	hooks.extendView.forEach(function(func) {
		func(view);
	})

	return view;
}

app.definePage = function(properties) {
	var page = Page.define(properties);

	hooks.definePage.forEach(function(func) {
		func(page);
	});

	return page;
}

})(window, window['app']||(window['app']={module:{},plugin:{}}));