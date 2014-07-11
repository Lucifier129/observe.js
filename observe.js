//Javascript Document
;(function(window, undefined) {
	//严格模式
	'use strict';
	var head = document.getElementsByTagName('head')[0],
		observeMethod = {
			//在现代浏览器中，用Object.defineProperty实现属性侦听
			//为了跨浏览器一致性，不直接侦听原对象，而是返回添加过侦听事件的新对象
			//用__isVM属性来标示已被侦听过的对象
			addSetter: function(obj, prop, callback) {
				var value = obj[prop],
					_obj,
					key;
				if (!('__hasSetter' in obj)) {
					_obj = obj;
					obj = {};
					for (key in _obj) {
						_obj.hasOwnProperty(key) && (obj[key] = _obj[key]);
					}
					obj.__hasSetter = true;
				}
				return Object.defineProperty(obj, prop, {
					set: function(v) {
						value = v;
						callback.call(obj, v, prop);
					},
					get: function() {
						return value;
					}
				});
			},
			//在IE系列的落后浏览器中，用dom元素的onpropertychange事件来实现
			addEvent: function(obj, prop, callback) {
				//对象的nodeName属性就是天然的__hasSetter标示符
				if (!obj.nodeName) {
					var _obj = obj,
						key;
					obj = document.createElement('obj');
					head.appendChild(obj).parentNode.removeChild(obj);
					//IE6删除DOM元素后，事件无法触发
					navigator.userAgent.indexOf("MSIE 6.0") > 0 && head.appendChild(obj);
					for (key in _obj) {
						if (_obj.hasOwnProperty(key)) {
							obj[key] = _obj[key];
						}
					}
				}
				obj.__cache = obj.__cache || {};
				obj.__cache[prop] = callback;
				if (!obj.onpropertychange) {
					obj.onpropertychange = function(e) {
						var key = (e || window.event).propertyName;
						key in obj.__cache && obj.__cache[key].call(obj, obj[key], key);
					};
				}
				//返回的新对象是一个DOM对象
				return obj;
			}
		};
	function observe(obj, prop, callback) {
		var modern = false;
		try {
			obj = observeMethod.addSetter(obj, prop, callback);
			modern = true;
		} catch (e) {
			obj = observeMethod.addEvent(obj, prop, callback);
		}
		observe = modern ? observeMethod.addSetter : observeMethod.addEvent;
	}
	//测试一下，选中合适的方法
	observe(observeMethod, 'test', function() {});

	//如果页面jQuery库存在，则将observe挂靠在上面
	//否则，observe成为全剧函数
	if (jQuery) {
		jQuery.observe = observe;
	} else {
		window.observe = observe;
	}
})(window);
