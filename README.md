observe.js
==========

观察对象的属性，当它变化时，调用指定函数。

<code>var test = observe({ background: '#000'});</code>

<code>test.on('background', function(key, value) {
  document.body.style[key] = value;
});</code>

<code>setTimeout(function() {
  test.background = '#f00';
}, 1000);</code>

document.body的背景颜色，将在一秒后变成#f00.

observe.js提供的API有on off add remove each extend。欲知具体用法，可看DEMO页面和源码：)

使用jPlus.js，便可以在jQuery库中使用observe.js。

用法非常方便，将修改上述的示例代码的第一句即可。

<code>var test = $({ background: '#000'});</code>

你没有看错。observe.js载入到jQuery中后，相当于为$函数提供了新的有意义的参数，即朴素的js对象。

$函数的其他用法完全不变，仅仅是增加了侦听朴素js对象的属性变化-调用指定函数的功能。
