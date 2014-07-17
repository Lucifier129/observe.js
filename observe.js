/*==================================================
 Copyright 2014 Jade Gu
 http://weibo.com/islucifier
 Released under the MIT license
 refresh.js 2014.7.17
 ==================================================*/
;(function(window, document, undefined) {
	//严格模式
	'use strict';
	var head = document.getElementsByTagName('head')[0],
		observe,
		method = {
			//初始化，判断是否为现代浏览器
			//将对象的属性拷贝到新对象上
			//IE低版本浏览器，新对象为DOM对象
			init: (function() {
				var init;
				if ('create' in Object) {
					observe = addSetter;
					addEvent = null;
					init = function(obj) {
						var _obj,
							_old,
							key;
						//对象的__hasSetter属性拥有被侦听属性的同名属性
						//该同名属性将保存该属性变化时的callback值
						if (!('__hasSetter' in obj)) {
							_old = {};
							_obj = obj;
							obj = Object.create(proto);
							for (key in _obj) {
								_obj.hasOwnProperty(key) && (obj[key] = _old[key] = _obj[key]);
							}
							obj._old = _old;
							obj.__hasSetter = {};
						}
						return obj;
					};
				} else if ('onpropertychange' in head) {
					observe = addEvent;
					addSetter = null;
					var isIE6 = navigator.userAgent.indexOf("MSIE 6.0") > 0;
					init = function(obj) {
						var _obj,
							_old,
							key;
						if (!('__hasSetter' in obj)) {
							_old = {};
							_obj = obj;
							obj = document.createElement('obj');
							head.appendChild(obj).parentNode.removeChild(obj);
							//IE6删除DOM元素后，事件无法触发
							isIE6 && head.appendChild(obj);
							//拷贝参数对象中的属性
							for (key in _obj) {
								if (_obj.hasOwnProperty(key)) {
									obj[key] = _old[key] = _obj[key];
								}
							}
							//拷贝「原型」中的方法
							for (key in proto) {
								if (proto.hasOwnProperty(key)) {
									obj[key] = proto[key];
								}
							}
							obj._old = _old;
							obj.__hasSetter = {};
						}
						return obj;
					};
				}
				return init;
			})(),
			//检查参数类型并返回类型值
			type: function(obj) {
				if (obj == null) {
					return String(obj);
				}
				return typeof obj === "object" || typeof obj === "function" ?
					class2type[core_toString.call(obj)] || "object" :
					typeof obj;
			},
			getRandomStr: function() {
				return Math.random().toString(36).substr(2);
			}
		},
		//被观察对象的原型
		proto = {
			//添加属性，_old属性与其同步更新
			add: function(key, value) {
				this[key] = this._old[key] = value || 'default value';
				return this;
			},
			//删除属性，处理了兼容性
			remove: (function() {
				return observe === addSetter ? function(key) {
					delete this[key];
					delete this._old[key];
					delete this.__hasSetter[key];
					return this;
				} : function(key) {
					this.removeAttribute(key);
					delete this._old[key];
					delete this.__hasSetter[key];
					return this;
				};
			})(),
			//遍历，简单循环
			each: function(callback) {
				for (var key in this._old) {
					callback.call(this, key, this[key]);
				}
				return this;
			},
			//合并，循环调用add方法
			extend: function(src) {
				for (var key in src) {
					this.add(key, src[key]);
				}
				return this;
			},
			//添加属性侦听器，属性不存在则add一个
			on: function() {
				var args = arguments,
					type = method.type(args[0]),
					callback,
					key;
				if (args.length === 1) {
					if (type === 'object') {
						args = args[0];
						for (key in args) {
							callback = args[key];
							if (typeof callback === 'function') {
								if (!(key in this) && !(key.split('.')[0] in this)) {
									this.add(key);
								}
								observe(this, key, callback);
							}
						}
					} else if (type === 'function') {
						callback = args[0];
						for (key in this._old) {
							observe(this, key, callback);
						}
					}
				} else if (args.length === 2) {
					key = args[0];
					callback = args[1];
					if (type === 'string' && typeof callback === 'function') {
						if (!(key in this) && !(key.split('.')[0] in this)) {
							this.add(key);
						}
						observe(this, key, callback);
					}
				}
				return this;
			},
			//解除属性侦听器，如果不传参数，则解除所有
			off: function() {
				var args = arguments,
					key,
					len,
					i;
				if (!args.length) {
					this.__hasSetter = {};
				} else {
					for (i = 0, len = args.length; i < len; i += 1) {
						key = args[i];
						if (typeof key === 'string') {
							if (key.indexOf('.') !== -1) {
								if (key.indexOf('.') === 0) {
									key = key.replace(/\./g, '');
									for (var prop in this.__hasSetter) {
										key in this.__hasSetter[prop] && delete this.__hasSetter[prop][key];
									}
								} else {
									key = key.split('.');
									key[1] in this.__hasSetter[key[0]] && delete this.__hasSetter[key[0]][key[1]];
								}
							} else if (key in this.__hasSetter) {
								delete this.__hasSetter[key];
							}
						}
					}
				}
				return this;
			}
		},
		class2type = {},
		core_toString = class2type.toString;
	"Boolean Number String Function Array Date RegExp Object Error".replace(/[^ ]+/g, function(name) {
		class2type["[object " + name + "]"] = name.toLowerCase();
	});


	//在现代浏览器中，用Object.defineProperty实现属性侦听
	function addSetter(obj, prop, callback) {
		var name = prop.split('.'),
			value;
		prop = name[0];
		name = name[1];
		if (!(prop in obj.__hasSetter)) {
			value = obj[prop];
			obj.__hasSetter[prop] = {};
			Object.defineProperty(obj, prop, {
				set: function(v) {
					value = v;
					if (prop in this.__hasSetter) {
						for (var key in this.__hasSetter[prop]) {
							this.__hasSetter[prop][key].call(this, prop, v);
						}
					}
				},
				get: function() {
					return value;
				}
			});
		}
		obj.__hasSetter[prop][name || 'observe-' + method.getRandomStr()] = callback;
		return obj;

	}
	//在IE系列的落后浏览器中，用dom元素的onpropertychange事件来实现
	function addEvent(obj, prop, callback) {
		var name = prop.split('.');
		prop = name[0];
		name = name[1];
		prop in obj.__hasSetter || (obj.__hasSetter[prop] = {});
		obj.__hasSetter[prop][name || 'observe-' + method.getRandomStr()] = callback;
		if (!obj.onpropertychange) {
			obj.onpropertychange = function(e) {
				var prop = (e || window.event).propertyName;
				if (prop in this.__hasSetter) {
					for (var key in this.__hasSetter[prop]) {
						this.__hasSetter[prop][key].call(this, prop, this[prop]);
					}
				}
			};
		}
		//返回的新对象是一个DOM对象
		return obj;
	}
	window.observe = method.init;
}(window, document));
