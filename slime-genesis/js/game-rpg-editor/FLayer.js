/* SlimeTribe Genesis Painter Alpha — bitmap layer.
 * Replacement for the original FLayer, preserving the public constructor.
 */
(function (global) {
  'use strict';
  var BLENDS = ['source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
    'exclusion', 'hue', 'saturation', 'color', 'luminosity', 'lighter'];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  global.FLayer = function FLayer(width, height, name) {
    var canvas = document.createElement('canvas');
    canvas.width = width || global.innerWidth;
    canvas.height = height || global.innerHeight;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var self = this;
    var lastPoint = null;
    this.name = name || 'Layer';
    this.visible = true;
    this.opacity = 1;
    this.blending = 'source-over';
    this.get = function () { return canvas; };
    this.getContext = function () { return ctx; };
    this.setName = function (value) { self.name = String(value).trim().slice(0, 80) || 'Layer'; };
    this.setVisible = function (value) { self.visible = !!value; };
    this.setOpacity = function (value) { self.opacity = clamp(value, 0, 1); };
    this.setBlending = function (name) {
      if (name === 'normal') name = 'source-over';
      if (BLENDS.indexOf(name) === -1) return false;
      self.blending = name;
      return true;
    };
    this.clear = function () { ctx.clearRect(0, 0, canvas.width, canvas.height); };
    this.snapshot = function () { return ctx.getImageData(0, 0, canvas.width, canvas.height); };
    this.restore = function (pixels) {
      if (pixels.width !== canvas.width || pixels.height !== canvas.height) {
        throw new Error('Snapshot dimension mismatch');
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(pixels, 0, 0);
    };
    this.toPNG = function () { return canvas.toDataURL('image/png'); };
    this.loadPNG = function (url) {
      return new Promise(function (resolve, reject) {
        if (!/^data:image\/png;base64,/i.test(url)) return reject(new Error('Expected PNG data URL'));
        var image = new Image();
        image.onload = function () {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve();
        };
        image.onerror = function () { reject(new Error('Invalid PNG layer')); };
        image.src = url;
      });
    };
    this.importImage = function (image) {
      // Contain: preserve aspect ratio; never silently crop imported artwork.
      var ratio = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      var w = image.naturalWidth * ratio, h = image.naturalHeight * ratio;
      ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    };

    function stamp(x, y, tool) {
      var size = clamp(tool.size, 1, 200);
      ctx.save();
      ctx.globalAlpha = clamp(tool.alpha, 0, 1);
      ctx.globalCompositeOperation = tool.eraser ? 'destination-out' : 'source-over';
      ctx.fillStyle = tool.color || '#000000';
      if (tool.type === 'svg' && tool.svgImage && tool.svgImage.complete && tool.svgImage.naturalWidth) {
        ctx.translate(x, y);
        ctx.rotate((Number(tool.rotate) || 0) * Math.PI / 180);
        ctx.drawImage(tool.svgImage, -size * 1.5, -size * 1.5, size * 3, size * 3);
      } else if (tool.type === 'pixel') {
        ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    this.beginStroke = function (x, y, tool) {
      lastPoint = { x: x, y: y };
      stamp(x, y, tool);
    };
    this.continueStroke = function (x, y, tool) {
      if (!lastPoint) { self.beginStroke(x, y, tool); return; }
      var dx = x - lastPoint.x, dy = y - lastPoint.y;
      var distance = Math.hypot(dx, dy);
      // Interpolate samples: pointer move frequency must not leave brush gaps.
      var spacing = Math.max(1, Math.min(12, Number(tool.size) / 5));
      var steps = Math.ceil(distance / spacing);
      var from = lastPoint;
      for (var i = 1; i <= steps; i++) stamp(from.x + dx * i / steps, from.y + dy * i / steps, tool);
      lastPoint = { x: x, y: y };
    };
    this.endStroke = function () { lastPoint = null; };

    // Backwards-compatible methods used by earlier Genesis experiments.
    this.brush = function (x, y, tool) { stamp(x, y, tool || { size: 20, color: '#000' }); };
    this.pencil = function (x, y, size) { stamp(x, y, { type: 'pixel', size: size || 1, color: '#000' }); };
    this.circle = function (x, y, size) { stamp(x, y, { type: 'circle', size: size || 1, color: '#000' }); };
    this.setColor = function (color) { ctx.fillStyle = color; };
    this.setAlpha = function (alpha) { ctx.globalAlpha = clamp(alpha, 0, 1); };
    this.updateBrush = function () {};
  };
})(window);
