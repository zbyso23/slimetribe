/* Genesis Painter Alpha — UI, separate from painting and file handling. */
(function (global) {
  'use strict';
  global.FGui = function FGui() {
    var root, refs = {};
    this.initialize = function () {
      root = document.createElement('div');
      root.className = 'gp-root';
      root.innerHTML = '\
        <header class="gp-header">\
          <div class="gp-brand"><span class="gp-mark">◉</span><div><strong>SlimeTribe</strong><small>GENESIS PAINTER · ALPHA</small></div></div>\
          <div class="gp-actions">\
            <button id="gp-new" title="New canvas">New</button>\
            <button id="gp-open" title="Open .sgp.json">Open project</button>\
            <button id="gp-import" title="Import PNG/JPG into selected layer">Import image</button>\
            <button id="gp-save" class="gp-primary" title="Save editable project · Ctrl+S">Save project</button>\
            <button id="gp-export" title="Export flattened transparent PNG">Export PNG</button>\
          </div>\
        </header>\
        <div class="gp-tools">\
          <label>Brush<select id="gp-shape"><option value="circle">Round</option><option value="pixel">Square</option><option value="svg">Legacy SVG stamp</option></select></label>\
          <label>Color<input id="gp-color" type="color" value="#7adb83" /></label>\
          <label>Size <output id="gp-size-out">22</output><input id="gp-size" type="range" min="1" max="140" value="22" /></label>\
          <label>Opacity <output id="gp-alpha-out">100%</output><input id="gp-alpha" type="range" min="1" max="100" value="100" /></label>\
          <label>Rotation <output id="gp-rotate-out">0°</output><input id="gp-rotate" type="range" min="0" max="360" value="0" /></label>\
          <button id="gp-eraser" aria-pressed="false" title="Toggle eraser (E)">Eraser</button>\
          <span class="gp-separator"></span>\
          <button id="gp-undo" title="Undo stroke · Ctrl+Z">↶ Undo</button>\
          <button id="gp-redo" title="Redo stroke · Ctrl+Y">↷ Redo</button>\
        </div>\
        <main class="gp-main">\
          <section id="gp-stage" class="gp-stage" aria-label="Painting canvas"></section>\
          <aside class="gp-sidebar">\
            <div class="gp-panel-head"><span>Layers</span><button id="gp-add" title="Add layer">+ Layer</button></div>\
            <div id="gp-layers" class="gp-layers" aria-label="Layer stack"></div>\
            <div class="gp-layer-actions">\
              <button id="gp-up" title="Move selected layer up">↑</button>\
              <button id="gp-down" title="Move selected layer down">↓</button>\
              <button id="gp-rename" title="Rename selected layer">Rename</button>\
              <button id="gp-delete" title="Delete selected layer">Delete</button>\
            </div>\
            <label class="gp-side-label">Layer opacity <output id="gp-layer-alpha-out">100%</output><input id="gp-layer-alpha" type="range" min="0" max="100" value="100" /></label>\
            <label class="gp-side-label">Layer blending<select id="gp-blend">\
              <option value="source-over">Normal</option><option value="multiply">Multiply</option><option value="screen">Screen</option><option value="overlay">Overlay</option><option value="darken">Darken</option><option value="lighten">Lighten</option><option value="color-dodge">Color dodge</option><option value="difference">Difference</option>\
            </select></label>\
            <div class="gp-note">Native <b>.sgp.json</b> saves editable PNG layers. Export PNG creates one composited image, with transparency.</div>\
          </aside>\
        </main>\
        <footer class="gp-status"><span id="gp-status">Ready.</span><span id="gp-dimensions">960 × 640</span><span id="gp-cursor">x: —  y: —</span></footer>\
        <input id="gp-input-project" type="file" accept=".json,.sgp.json,application/json" hidden />\
        <input id="gp-input-image" type="file" accept="image/png,image/jpeg,image/webp" hidden />';
      document.body.appendChild(root);
      Array.prototype.forEach.call(root.querySelectorAll('[id]'), function (el) { refs[el.id.slice(3)] = el; });
      return refs;
    };
    this.getElements = function () { return refs; };
    this.setStatus = function (message) { refs.status.textContent = message; };
    this.renderLayers = function (layers, selected) {
      var host = refs.layers;
      host.textContent = '';
      for (var i = layers.length - 1; i >= 0; i--) {
        var item = document.createElement('div');
        item.className = 'gp-layer' + (i === selected ? ' gp-selected' : '');
        item.dataset.index = i;
        var visible = document.createElement('button');
        visible.type = 'button';
        visible.className = 'gp-eye';
        visible.dataset.visibility = i;
        visible.textContent = layers[i].visible ? '◉' : '○';
        visible.title = layers[i].visible ? 'Hide layer' : 'Show layer';
        var name = document.createElement('span');
        name.className = 'gp-layer-name';
        name.textContent = layers[i].name;
        var pct = document.createElement('small');
        pct.textContent = Math.round(layers[i].opacity * 100) + '%';
        item.appendChild(visible);
        item.appendChild(name);
        item.appendChild(pct);
        host.appendChild(item);
      }
      refs['layer-alpha'].value = Math.round(layers[selected].opacity * 100);
      refs['layer-alpha-out'].textContent = Math.round(layers[selected].opacity * 100) + '%';
      refs.blend.value = layers[selected].blending;
    };
  };
})(window);
