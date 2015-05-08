/**
 * observe.js
 * Create by Jade
 * https://github.com/Lucifier129/observe.js
 */

void function(factory) {
	if (typeof module !== 'undefined' && typeof exports !== 'undefined') {
		module.exports = factory()
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		define('observe', [], factory)
	} else {
		window.observe = factory()
	}
}(function() {

	//base
	function unCurring(fn) {
		return function() {
			return Function.prototype.call.apply(fn, arguments)
		}
	}

	var toStr = unCurring(Object.prototype.toString)
	var hasOwn = unCurring(Object.prototype.hasOwnProperty)
	var slice = unCurring(Array.prototype.slice)
	var indexOf = unCurring(Array.prototype.indexOf)


	function isType(type) {
		type = '[object ' + type + ']'
		return function(obj) {
			if (obj == null) {
				return obj
			} else {
				return toStr(obj) === type
			}
		}
	}

	var isObj = isType('Object')
	var isStr = isType('String')
	var isFn = isType('Function')
	var isNum = isType('Number')
	var isArr = Array.isArray || isType('Array')

	//简洁实现
	var each = function(obj, callback) {
		if (isArr(obj)) {
			for (var i = 0, len = obj.length; i < len; i += 1) {
				callback(obj[i], i)
			}
		} else if (isObj(obj)) {
			for (var key in obj) {
				if (hasOwn(obj, key)) {
					callback(obj[key], key)
				}
			}
		}
		return obj
	}


	function parseChain(chain) {
		if (isArr(chain)) {
			return chain
		} else if (isStr(chain)) {
			return chain.replace(/\[\d+\]/g, function(propName) {
				return '.' + propName.replace(/\[|\]/g, '')
			}).split('.')
		} else {
			return []
		}
	}

	function get(obj, propChain, callback) {

		if (!propChain) {
			return obj
		}

		var result = obj
		var props = parseChain(propChain)
		var prop

		if (isFn(callback)) {
			for (var i = 0, len = props.length; i < len; i += 1) {
				prop = props[i]
				callback(result, prop, i)
				result = result[prop]
				if (result === undefined) {
					break
				}
			}
		} else {
			for (var i = 0, len = props.length; i < len; i += 1) {
				result = result[props[i]]
				if (result === undefined) {
					break
				}
			}
		}
		return result
	}

	function set(obj, propChain, val) {

		if (isObj(propChain)) {
			each(propChain, function(value, chain) {
				set(obj, chain, value)
			})
			return obj
		}

		var props = parseChain(propChain)
		var len = props.length
		if (len === 1) {
			obj[props[0]] = val
		} else if (len > 1) {
			var lastIndex = len - 1
			var propName = props[lastIndex]
			var targetObj = get(obj, props.slice(0, lastIndex), function(currentObj, currentPropName, index) {
				if (currentObj[currentPropName] == null) {
					var nextPropName = props[index + 1]
					currentObj[currentPropName] = /\D/.test(nextPropName) ? {} : []
				}
			})
			targetObj[propName] = val
		}

		return obj
	}

	var observe = {

		get: function(prop, callback) {
			return get(this, prop, callback)
		},

		set: function(prop, value) {
			set(this, prop, value)
			return this
		},

		assignTo: function(obj) {
			for (var key in observe) {
				if (hasOwn(observe, key)) {
					obj[key] = observe[key]
				}
			}
			return obj
		},

		define: function(prop, descriptor) {
			if (isObj(prop)) {
				var descriptors = prop
				Object.defineProperties(this, descriptors)
			} else {
				Object.defineProperty(this, prop, descriptor)
			}
			return this
		},

		on: function(prop, lifeCycle) {
			var that = this
			var curValue = that.get(prop)
			var lastIndex = prop.lastIndexOf('.')
			var chain = prop.substr(0, lastIndex)
			var obj = that.get(chain)

			if (!isObj(obj)) {
				throw new Error('The chain ' + prop + ' is not an object')
			}

			if (isFn(lifeCycle)) {
				lifeCycle = {
					didSet: lifeCycle
				}
			}

			function handleSet(newValue) {
				var skip
				if (isFn(lifeCycle['willSet'])) {
					var skip = lifeCycle.willSet.call(that, newValue, curValue, prop)
					if (skip === false) {
						return
					}
				}
				curValue = newValue
				if (isFn(lifeCycle['didSet'])) {
					lifeCycle.didSet.call(that, curValue, prop)
				}
			}

			if (!hasOwn(obj, 'define')) {
				obj.define = that.define
				setTimeout(function() {
					delete obj.define
				}, 0)
			}

			var timer

			obj.define(prop.substr(lastIndex + 1), {
				get: function() {
					if (isFn(lifeCycle['willGet'])) {
						curValue = lifeCycle.willGet.call(that, curValue, prop)
					}
					return curValue
				},
				set: function(newValue) {
					clearTimeout(timer)
					timer = setTimeout(handleSet.bind(that, newValue), 0)
				}
			})

			return this
		},

		off: function(prop) {
			var curValue = this.get(prop)
			var lastIndex = prop.lastIndexOf('.')
			var obj = this.get(prop.substr(0, lastIndex))

			if (!isObj(obj)) {
				throw new Error('The chain ' + prop + ' is not an object')
			}

			if (!hasOwn(obj, 'define')) {
				obj.define = this.define
				setTimeout(function() {
					delete obj.define
				}, 0)
			}

			obj.define(prop.substr(lastIndex + 1), {
				value: value
			})

			return this
		}
	}

	return observe

})