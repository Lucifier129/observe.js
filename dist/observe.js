/**
 *File: observe.js
 *Author: Jade
 *Date: 2014.12.20
 */
;(function(global, undefined) {
//base
function calling(fn) {
	return function() {
		return Function.prototype.call.apply(fn, arguments)
	}
}

var objProto = Object.prototype
var toStr = calling(objProto.toString)
var hasOwn = calling(objProto.hasOwnProperty)
var slice = calling(Array.prototype.slice)

function isType(type) {
	return function(obj) {
		return obj == null ? obj : toStr(obj) === '[object ' + type + ']'
	}
}

var isObj = isType('Object')
var isStr = isType('String')
var isFn = isType('Function')
var isArr = Array.isArray || isType('Array')

var _ = {
	keys: Object.keys || function(obj) {
		var keys = []
		if (!isObj(obj)) {
			return keys
		}
		for (var key in obj) {
			if (hasOwn(obj, key)) {
				keys.push(key)
			}
		}
		return keys
	}
}

function each(obj, fn, context) {
	if (obj == undefined || !isFn(fn)) {
		return obj
	}
	var len = obj.length
	var i = 0
	var ret

	if (len === +len && len > 0) {
		for (; i < len; i += 1) {
			ret = fn.call(context || global, obj[i], i)
			if (ret !== undefined) {
				return ret
			}
		}
		return obj
	}
	var keys = _.keys(obj)
	var key
	len = keys.length
	for (; i < len; i += 1) {
		key = keys[i]
		ret = fn.call(context || global, obj[key], key)
		if (ret !== undefined) {
			return ret
		}
	}
	return obj
}

function extend() {
	var target = arguments[0]
	var deep

	if (typeof target === 'boolean') {
		deep = target
		target = arguments[1]
	}

	if (typeof target !== 'object' && !isFn(target)) {
		return target
	}
	var sourceList = slice(arguments, deep ? 2 : 1)

	each(sourceList, function(source) {

		if (typeof source !== 'object') {
			return
		}

		each(source, function(value, key) {

			if (deep && typeof value === 'object') {
				var oldValue = target[key]

				target[key] = typeof oldValue === 'object' ? oldValue : {}

				return extend(deep, target[key], value)
			}

			target[key] = value
		})
	})

	return target

}
//observe.js

function randomStr(prefix) {
	return prefix + Math.random().toString(36).substr(2)
}

var nextTick = typeof process !== 'undefined' && process.nextTick || function(fn) {
	setTimeout(fn, 0)
}

function clone(obj) {
	var newObj
	if (isObj(obj)) {
		newObj = extend(true, {}, obj)
	} else if (isArr(obj)) {
		newObj = []
		each(obj, function(value, index) {
			newObj[index] = clone(value)
		})
	} else {
		newObj = obj
	}
	return newObj
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(value) {
		for (var i = this.length - 1; i >= 0; i--) {
			if (this[i] === value) {
				return i
			}
		}
		return -1
	}
}

//refer to underscore
// Internal recursive comparison function for `isEqual`.
var eq = function(a, b, aStack, bStack) {
	// Identical objects are equal. `0 === -0`, but they aren't identical.
	// See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
	if (a === b) return a !== 0 || 1 / a === 1 / b
		// A strict comparison is necessary because `null == undefined`.
	if (a == null || b == null) return a === b
		// Unwrap any wrapped objects.
		// Compare `[[Class]]` names.
	var className = toStr(a)
	if (className !== toStr(b)) return false
	switch (className) {
		// Strings, numbers, regular expressions, dates, and booleans are compared by value.
		case '[object RegExp]':
			// RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
		case '[object String]':
			// Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
			// equivalent to `new String("5")`.
			return '' + a === '' + b
		case '[object Number]':
			// `NaN`s are equivalent, but non-reflexive.
			// Object(NaN) is equivalent to NaN
			if (+a !== +a) return +b !== +b
				// An `egal` comparison is performed for other numeric values.
			return +a === 0 ? 1 / +a === 1 / b : +a === +b
		case '[object Date]':
		case '[object Boolean]':
			// Coerce dates and booleans to numeric primitive values. Dates are compared by their
			// millisecond representations. Note that invalid dates with millisecond representations
			// of `NaN` are not equivalent.
			return +a === +b
	}

	var areArrays = className === '[object Array]'
	if (!areArrays) {
		if (typeof a != 'object' || typeof b != 'object') return false

		// Objects with different constructors are not equivalent, but `Object`s or `Array`s
		// from different frames are.
		var aCtor = a.constructor
		var bCtor = b.constructor
		if (aCtor !== bCtor && !(isFn(aCtor) && aCtor instanceof aCtor &&
				isFn(bCtor) && bCtor instanceof bCtor) && ('constructor' in a && 'constructor' in b)) {
			return false
		}
	}
	// Assume equality for cyclic structures. The algorithm for detecting cyclic
	// structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
	var length = aStack.length
	while (length--) {
		// Linear search. Performance is inversely proportional to the number of
		// unique nested structures.
		if (aStack[length] === a) return bStack[length] === b
	}

	// Add the first object to the stack of traversed objects.
	aStack.push(a)
	bStack.push(b)
	var size, result
		// Recursively compare objects and arrays.
	if (areArrays) {
		// Compare array lengths to determine if a deep comparison is necessary.
		size = a.length
		result = size === b.length
		if (result) {
			// Deep compare the contents, ignoring non-numeric properties.
			while (size--) {
				if (!(result = eq(a[size], b[size], aStack, bStack))) break
			}
		}
	} else {
		// Deep compare objects.
		var keys = _.keys(a)
		var key
		size = keys.length
			// Ensure that both objects contain the same number of properties before comparing deep equality.
		result = _.keys(b).length === size
		if (result) {
			while (size--) {
				// Deep compare each member
				key = keys[size]
				if (!(result = hasOwn(b, key) && eq(a[key], b[key], aStack, bStack))) break
			}
		}
	}
	// Remove the first object from the stack of traversed objects.
	aStack.pop()
	bStack.pop()
	return result
};

// Perform a deep comparison to check if two objects are equal.
_.isEqual = function(a, b) {
	return eq(a, b, [], [])
}


var NATIVE_RE = /\[native code\]/
var defineProperty

if (NATIVE_RE.test(Object.defineProperty) && NATIVE_RE.test(Object.create)) {
	defineProperty = Object.defineProperty
} else if (NATIVE_RE.test(Object.prototype.__defineSetter__)) {
	defineProperty = function(obj, propName, descriptor) {
		obj.__defineGetter__(propName, descriptor.get)
		obj.__defineSetter__(propName, descriptor.set)
	}
}

if (!defineProperty) {
	throw new Error('Object.defineProperty is undefined')
}

var observeProperty = function(obj, propName) {
	if (propName in obj.__events__) {
		return
	}
	var value = obj[propName]
	var oldValue = clone(value)
	var holding

	function trigger() {
		holding = false
		each(obj.__events__[propName], function(callbacks) {
			each(callbacks, function(callback) {
				callback.call(obj, value, propName, oldValue)
			})
		})
		oldValue = clone(value)
	}

	defineProperty(obj, propName, {
		get: function() {
			return value
		},
		set: function(v) {
			value = v
			if (holding || _.isEqual(v, oldValue)) {
				return
			}
			holding = true
			nextTick(trigger)
		}
	})
}

var observer = {
	_add: function(prop, callback, name) {
		observeProperty(this, prop)
		name = name || randomStr('observer')
		var events = this.__events__[prop] = this.__events__[prop] || {}
		events[name] = events[name] || []
		events[name].push(callback)
		return this
	},
	on: function() {
		var that = this
		var args = slice(arguments)
		var argsLen = args.length
		var arg

		if (argsLen === 1) {
			if (isObj(arg = args[0])) {
				each(arg, function(callback, prop) {
					that.on(prop, callback)
				})
			} else if (isFn(arg)) {
				this.each(function(value, prop) {
					that._add(prop, arg, '__all__')
				})
			}
		} else if (argsLen === 2) {
			if (!isFn(args[1])) {
				return this
			}
			if (isStr(arg = args[0])) {
				var index = arg.indexOf('.')
				if (index <= 0) {
					this._add(arg, args[1])
				} else {
					this._add(arg.substr(0, index), args[1], arg.substr(index + 1))
				}
			} else if (isArr(arg)) {
				each(arg, function(prop) {
					that.on(prop, args[1])
				})
			}
		}
		return this
	},

	_bang: function(prop, data, name) {
		var that = this
		var currentValue = that[prop]
		each(this.__events__[prop][name], function(callback) {
			callback.call(that, data, prop, currentValue)
		})
	},

	trigger: function(props, data) {
		var that = this
		var index, name, arg

		if (!props) {
			return this
		}

		if (isStr(props)) {
			index = props.indexOf('.')
			if (index > 0) {
				this._bang(props.substr(0, index), data, props.substr(index + 1))
			} else if (!index) {
				props = props.substr(1)
				each(this.__events__, function(eventsList, prop) {
					each(eventsList, function(callbacks, name) {
						if (name === props) {
							that._bang(prop, data, name)
						}
					})
				})
			} else {
				each(this.__events__[props] || [], function(callbacks, name) {
					that._bang(props, data, name)
				})
			}
		} else if (isArr(props)) {
			each(props, function(prop) {
				that.trigger(prop, data)
			})
		}

		return this
	},

	_remove: function(prop, callback, name) {
		var callbacks = this.__events__[prop][name] || []
		var index = callbacks.indexOf(callback)
		if (index !== -1) {
			callbacks.splice(index, 1)
		}
		return this
	},

	off: function() {
		var that = this
		var args = slice(arguments)
		var argsLen = args.length
		var arg
		var index

		if (!argsLen) {
			this.__events__ = {}
		} else if (argsLen === 1) {
			if (isFn(arg = args[0])) {
				each(this.__events__, function(eventsList, prop) {
					each(eventsList, function(callbacks, name) {
						that._remove(prop, arg, name)
					})
				})
			} else if (isStr(arg)) {
				index = arg.indexOf('.')
				if (index <= 0) {
					this.__events__[arg] = {}
				} else {
					delete this.__events__[arg.substr(0, index)][arg.substr(index + 1)]
				}
			}
		} else if (argsLen === 2) {
			if (!isFn(args[1])) {
				this.off(args[0])
				return this
			}
			if (isStr(arg = args[0])) {
				index = arg.indexOf('.')
				if (index <= 0) {
					each(this.__events__[arg], function(callbacks, name) {
						that._remove(arg, args[1], name)
					})
				} else {
					this._remove(arg.substr(0, index), args[1], arg.substr(index + 1))
				}
			} else if (isArr(arg)) {
				each(arg, function(prop) {
					that.off(prop, args[1])
				})
			}
		}

		return this
	},

	offAll: function() {
		var that = this
		each(this.__events__, function(eventsList, prop) {
			that.off([prop, '__all__'].join('.'))
		})
		return this
	},

	each: function(fn) {
		var that = this
		each(this, function(value, prop) {
			if (that.filter.indexOf(prop) === -1) {
				fn.call(that, value, prop)
			}
		})
		return this
	},

	extend: function() {
		return extend.apply(global, [this].concat(slice(arguments)))
	},

	once: function(prop, callback) {
		var that = this
		prop += ".once"

		function wrapper() {
			callback.apply(that, arguments)
			that.off(wrapper)
		}
		return this.on(prop, wrapper)
	},

	tie: function(props, callback) {
		if (!isFn(callback)) {
			return this
		}

		if (isArr(props)) {
			var that = this
			var total = props.length
			var cache = []
			var data = []
			var wrapper = function(value, key) {
				if (cache.indexOf(key) < 0) {
					cache.push(key)
					if (cache.length === total) {
						each(props, function(prop, index) {
							prop = prop.split('.')[0]
							data[index] = that[prop]
						})
						callback.apply(that, data)
					}
				} else if (cache.length >= total) {
					cache.length = 0
					cache.push(key)
				}
			}
			return this.on(props, wrapper)
		} else if (isStr(props)) {
			props = props.split(' ')
			return props.length > 1 ? this.tie(props, callback) : this.on(props[0], callback)
		}
		return this
	},

	collect: function(prop, total, callback) {
		var that = this
		var dataList = []

		function wrapper(data) {
			dataList.push(data)
			if (dataList.length === total) {
				callback.apply(that, dataList)
				that.off(wrapper)
			}
		}
		return this.on(prop, wrapper)
	},

	hold: function(prop, total, callback) {
		var that = this
		var count = 0

		function wrapper(data) {
			if (++count === total) {
				callback.call(that, data)
				that.off(wrapper)
			}
		}
		return this.on(prop, wrapper)
	}
}

observer.bind = observer.on
observer.unbind = observer.off
observer.fire = observer.trigger
observer.filter = _.keys(observer).concat(['__events__', 'filter'])

function Observer(source) {
	extend(this, source)
}

Observer.prototype = observer

function createObserver(source, setters) {
	if (!isObj(source)) {
		return source
	}
	var result = extend(new Observer(source), {
		__events__: {}
	})
	return isObj(setters) || isFn(setters) ? result.on(setters) : result
}

createObserver.fn = observer

if (typeof module !== 'undefined' && typeof exports === 'object') {
	module.exports = createObserver
} else if (typeof define === 'function' && (define.amd || define.cmd)) {
	define(function() {
		return createObserver
	})
} else {
	global.observe = createObserver
}

})(this);