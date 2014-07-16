//Javascript Document
;(function($, window, document, undefined) {
	//严格模式
	'use strict';
	var head = document.getElementsByTagName('head')[0],
		observe,
		//初始化，判断是否为现代浏览器
		//将对象的属性拷贝到新对象上
		//IE低版本浏览器，新对象为DOM对象
		observe_init = (function() {
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
					callback.call(this[key], key, this[key]);
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
					type = $.type(args[0]),
					callback,
					key;
				if (args.length === 1) {
					if (type === 'object') {
						args = args[0];
						for (key in args) {
							callback = args[key];
							if (typeof callback === 'function') {
								if (!(key in this)) {
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
						if (!(key in this)) {
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
					args = Array.prototype.slice.call(args);
					for (i = 0, len = args.length; i < len; i += 1) {
						key = args[i];
						typeof key === 'string' && key in this.__hasSetter && delete this.__hasSetter[key];
					}
				}
				return this;
			}
		};

	//在现代浏览器中，用Object.defineProperty实现属性侦听
	function addSetter(obj, prop, callback) {
		if (prop in obj.__hasSetter) {
			obj.__hasSetter[prop] = callback;
			return obj;
		}
		var value = obj[prop];
		obj.__hasSetter[prop] = callback;
		return Object.defineProperty(obj, prop, {
			set: function(v) {
				value = v;
				prop in obj.__hasSetter && obj.__hasSetter[prop].call(obj, prop, v);
			},
			get: function() {
				return value;
			}
		});
	}
	//在IE系列的落后浏览器中，用dom元素的onpropertychange事件来实现
	function addEvent(obj, prop, callback) {
		obj.__hasSetter[prop] = callback;
		if (!obj.onpropertychange) {
			var e = window.event;
			obj.onpropertychange = function() {
				var key = e.propertyName;
				key in obj.__hasSetter && obj.__hasSetter[key].call(obj, key, obj[key]);
			};
		}
		//返回的新对象是一个DOM对象
		return obj;
	}
	//增强$函数，如果参数唯一，而且是朴素的js对象，则调用observe_init
	//否则，调用jQuery的$函数
	var _$ = $;
	window.$ = function() {
		var args = arguments;
		return args.length === 1 && _$.isPlainObject(args[0]) ? observe_init.apply(null, args) : _$.apply(null, args);
	};
	_$.extend(true, window.$, _$);
})(jQuery, window, document);
