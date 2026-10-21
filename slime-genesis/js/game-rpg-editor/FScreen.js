/* Genesis Painter Alpha — canvas compositor. */
(function (global) {
  'use strict';
  global.FScreen = function FScreen() {
    var canvas, ctx;
    this.initialize = function (id, width, height, host) {
      canvas = document.createElement('canvas');
      canvas.id = id;
      canvas.className = 'gp-canvas';
      canvas.width = width || global.innerWidth;
      canvas.height = height || global.innerHeight;
      (host || document.body).appendChild(canvas);
      ctx = canvas.getContext('2d');
      return canvas;
    };
    this.get = function () { return canvas; };
    this.resize = function (width, height) {
      canvas.width = width;
      canvas.height = height;
    };
    this.clear = function () { ctx.clearRect(0, 0, canvas.width, canvas.height); };
    this.drawLayers = function (layers) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (!layer.visible) continue;
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blending;
        ctx.drawImage(layer.get(), 0, 0);
        ctx.restore();
      }
    };
    this.toPNG = function (layers) {
      this.drawLayers(layers);
      return canvas.toDataURL('image/png');
    };
  };
})(window);
