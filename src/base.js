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