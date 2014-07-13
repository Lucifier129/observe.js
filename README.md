observe.js
==========

观察对象的属性，当它变化时，调用指定函数。

var test = observe({ background: '#000'});

test.on('background', function(key, value) {
  document.body.style[key] = value;
}

setTimeout(function() {
  test.background = '#f00';
}, 1000);

document.body的背景颜色，将在一秒后变成#f00.

observe.js提供的API有on off add remove each extend。欲知具体用法，请看源码：）；
