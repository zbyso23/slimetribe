/* SlimeTribe Genesis Painter Alpha · non-destructive refactor of the four original modules.
 * Works with the original genesis-editor.html script order; no bundler required.
 */
(function (global) {
  'use strict';
  var FORMAT = 'slimetribe.genesis-painter';
  var VERSION = 1;
  var MAX_LAYERS = 32;
  var MAX_HISTORY = 12; // two RGBA snapshots per stroke; intentionally bounded
  var MAX_DIMENSION = 4096;

  function dimensions(value, fallback) {
    var n = Number(value);
    return Number.isInteger(n) && n >= 32 && n <= MAX_DIMENSION ? n : fallback;
  }
  function readImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function () { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Cannot decode the selected image.')); };
      image.src = url;
    });
  }
  function downloadBlob(content, name, mime) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    global.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  function imageDataEqual(a, b) {
    if (a.data.length !== b.data.length) return false;
    // Cheap memory comparison; snapshots are also used for immediate Undo/Redo.
    for (var i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) return false;
    return true;
  }

  global.Editor = function Editor() {
    var self = this;
    var gui, refs, screen, canvas;
    var width = 960, height = 640;
    var layers = [], selected = 0, past = [], future = [];
    var dirty = false, activePointer = null, beforeStroke = null;
    var drawPending = false, svgImage = null;
    var tool = { type: 'circle', size: 22, color: '#7adb83', alpha: 1, rotate: 0, eraser: false };

    function status(message) { gui.setStatus(message); }
    function draw() {
      if (drawPending) return;
      drawPending = true;
      global.requestAnimationFrame(function () {
        drawPending = false;
        screen.drawLayers(layers);
      });
    }
    function changed(message) {
      dirty = true;
      draw();
      if (message) status(message);
    }
    function updateHistoryButtons() {
      refs.undo.disabled = past.length === 0;
      refs.redo.disabled = future.length === 0;
    }
    function resetHistory() {
      past.length = 0;
      future.length = 0;
      updateHistoryButtons();
    }
    function commitPixels(index, before) {
      var after = layers[index].snapshot();
      if (imageDataEqual(before, after)) return;
      past.push({ index: index, before: before, after: after });
      if (past.length > MAX_HISTORY) past.shift();
      future.length = 0;
      updateHistoryButtons();
      changed('Stroke committed.');
    }
    function undo() {
      if (!past.length || activePointer !== null) return;
      var entry = past.pop();
      layers[entry.index].restore(entry.before);
      future.push(entry);
      changed('Undo.');
      updateHistoryButtons();
    }
    function redo() {
      if (!future.length || activePointer !== null) return;
      var entry = future.pop();
      layers[entry.index].restore(entry.after);
      past.push(entry);
      changed('Redo.');
      updateHistoryButtons();
    }
    function renderLayers() {
      gui.renderLayers(layers, selected);
      refs.up.disabled = selected >= layers.length - 1;
      refs.down.disabled = selected === 0;
      refs.delete.disabled = layers.length === 1;
      refs.add.disabled = layers.length >= MAX_LAYERS;
    }
    function addLayer() {
      if (layers.length >= MAX_LAYERS) return;
      var item = new FLayer(width, height, 'Layer ' + (layers.length + 1));
      layers.splice(selected + 1, 0, item);
      selected++;
      resetHistory(); // index changes invalidate pixel history
      changed('New layer added.');
      renderLayers();
    }
    function swapLayer(offset) {
      var dest = selected + offset;
      if (dest < 0 || dest >= layers.length) return;
      var item = layers[selected];
      layers[selected] = layers[dest];
      layers[dest] = item;
      selected = dest;
      resetHistory();
      changed('Layer order updated.');
      renderLayers();
    }
    function deleteLayer() {
      if (layers.length <= 1) return;
      if (!global.confirm('Delete selected layer? This cannot be undone.')) return;
      layers.splice(selected, 1);
      selected = Math.min(selected, layers.length - 1);
      resetHistory();
      changed('Layer deleted.');
      renderLayers();
    }
    function newProject(w, h) {
      if (activePointer !== null) finishStroke();
      width = w; height = h;
      layers = [new FLayer(width, height, 'Background')];
      selected = 0;
      screen.resize(width, height);
      refs.dimensions.textContent = width + ' × ' + height;
      resetHistory();
      renderLayers();
      dirty = false;
      draw();
      status('New transparent ' + width + ' × ' + height + ' canvas.');
    }
    function requestNew() {
      if (dirty && !global.confirm('Discard unsaved work and create a new canvas?')) return;
      var w = global.prompt('Canvas width (32–4096 px)', String(width));
      if (w === null) return;
      var h = global.prompt('Canvas height (32–4096 px)', String(height));
      if (h === null) return;
      if (dimensions(w, null) === null || dimensions(h, null) === null) {
        global.alert('Dimensions must be whole numbers between 32 and 4096.');
        return;
      }
      newProject(Number(w), Number(h));
    }
    function exportPNG() {
      var uri = screen.toPNG(layers);
      var b64 = uri.split(',')[1];
      var raw = global.atob(b64);
      var bytes = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      downloadBlob(new Blob([bytes], {type:'image/png'}), 'slimetribe-genesis.png', 'image/png');
      status('PNG exported (' + width + ' × ' + height + ').');
    }
    function saveProject() {
      var project = {
        format: FORMAT,
        version: VERSION,
        width: width,
        height: height,
        layers: layers.map(function (layer) {
          return { name: layer.name, visible: layer.visible, opacity: layer.opacity,
            blending: layer.blending, png: layer.toPNG() };
        })
      };
      downloadBlob(JSON.stringify(project), 'slimetribe-genesis.sgp.json', 'application/json');
      dirty = false;
      status('Project saved. Editable layers preserved.');
    }
    async function openProject(file) {
      if (!file) return;
      if (dirty && !global.confirm('Discard unsaved work and load another project?')) return;
      try {
        if (file.size > 100 * 1024 * 1024) throw new Error('Project file is too large.');
        var data = JSON.parse(await file.text());
        if (!data || data.format !== FORMAT || data.version !== VERSION) throw new Error('Unknown project format/version.');
        var w = dimensions(data.width, null), h = dimensions(data.height, null);
        if (w === null || h === null || !Array.isArray(data.layers) || !data.layers.length || data.layers.length > MAX_LAYERS) {
          throw new Error('Invalid canvas dimensions or layer count.');
        }
        var next = [];
        for (var i = 0; i < data.layers.length; i++) {
          var item = data.layers[i];
          if (!item || typeof item.png !== 'string' || typeof item.name !== 'string' || item.png.length > 100 * 1024 * 1024) {
            throw new Error('Malformed layer ' + (i + 1) + '.');
          }
          var layer = new FLayer(w, h, item.name);
          layer.setVisible(item.visible);
          layer.setOpacity(item.opacity);
          if (layer.setBlending(item.blending || 'source-over') === false) throw new Error('Unsupported layer blending.');
          await layer.loadPNG(item.png);
          next.push(layer);
        }
        // Commit only when all images have decoded successfully.
        if (activePointer !== null) finishStroke();
        layers = next; width = w; height = h; selected = next.length - 1;
        screen.resize(w, h);
        refs.dimensions.textContent = w + ' × ' + h;
        resetHistory();
        renderLayers();
        dirty = false;
        draw();
        status('Project loaded (' + next.length + ' layers).');
      } catch (error) { global.alert('Cannot open project: ' + error.message); }
    }
    async function importImage(file) {
      if (!file) return;
      try {
        if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Choose PNG, JPEG or WebP.');
        var image = await readImage(file);
        var layer = layers[selected];
        var before = layer.snapshot();
        layer.importImage(image);
        commitPixels(selected, before);
        status('Imported image to ' + layer.name + ' (fit inside canvas).');
      } catch (error) { global.alert('Cannot import image: ' + error.message); }
    }

    function updateSVGImage() {
      // The legacy HTML embeds an SVG brush. It is optional in the smoke test.
      var source = document.getElementById('brush_01');
      svgImage = null;
      if (!source || !global.XMLSerializer) return;
      try {
        var clone = source.cloneNode(true);
        clone.removeAttribute('id');
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.querySelectorAll('path').forEach(function (path) {
          path.style.fill = tool.color;
          path.style.fillOpacity = '1';
        });
        var markup = new XMLSerializer().serializeToString(clone);
        var img = new Image();
        img.onload = function () { svgImage = img; };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
      } catch (error) { console.warn('Legacy SVG unavailable:', error); }
    }
    function updateTool() {
      tool.type = refs.shape.value;
      tool.color = refs.color.value;
      tool.size = Number(refs.size.value);
      tool.alpha = Number(refs.alpha.value) / 100;
      tool.rotate = Number(refs.rotate.value);
      refs['size-out'].textContent = tool.size;
      refs['alpha-out'].textContent = Math.round(tool.alpha * 100) + '%';
      refs['rotate-out'].textContent = tool.rotate + '°';
      if (tool.type === 'svg') updateSVGImage();
    }
    function coordinates(e) {
      var box = canvas.getBoundingClientRect();
      return { x: (e.clientX - box.left) * width / box.width,
        y: (e.clientY - box.top) * height / box.height };
    }
    function startStroke(e) {
      if (activePointer !== null || e.button !== 0) return;
      var p = coordinates(e);
      if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height) return;
      activePointer = e.pointerId;
      beforeStroke = layers[selected].snapshot();
      canvas.setPointerCapture(e.pointerId);
      var config = Object.assign({}, tool, { svgImage: svgImage });
      layers[selected].beginStroke(p.x, p.y, config);
      draw();
      e.preventDefault();
    }
    function moveStroke(e) {
      var p = coordinates(e);
      refs.cursor.textContent = 'x: ' + Math.floor(p.x) + '  y: ' + Math.floor(p.y);
      if (activePointer !== e.pointerId) return;
      layers[selected].continueStroke(p.x, p.y, Object.assign({}, tool, { svgImage: svgImage }));
      draw();
      e.preventDefault();
    }
    function finishStroke(e) {
      if (activePointer === null || (e && e.pointerId !== activePointer)) return;
      layers[selected].endStroke();
      if (canvas.hasPointerCapture && canvas.hasPointerCapture(activePointer)) canvas.releasePointerCapture(activePointer);
      activePointer = null;
      var snapshot = beforeStroke;
      beforeStroke = null;
      if (snapshot) commitPixels(selected, snapshot);
    }
    function keyboard(e) {
      var target = e.target;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      var cmd = e.ctrlKey || e.metaKey;
      if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (cmd && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if (cmd && e.key.toLowerCase() === 's') { e.preventDefault(); saveProject(); }
      else if (e.key.toLowerCase() === 'e' && !cmd) {
        tool.eraser = !tool.eraser;
        refs.eraser.setAttribute('aria-pressed', String(tool.eraser));
      } else if (e.key === '[' || e.key === ']') {
        var size = Number(refs.size.value) + (e.key === '[' ? -1 : 1);
        refs.size.value = String(Math.min(140, Math.max(1, size)));
        updateTool();
      }
    }
    function bindUI() {
      refs.add.addEventListener('click', addLayer);
      refs.up.addEventListener('click', function () { swapLayer(1); });
      refs.down.addEventListener('click', function () { swapLayer(-1); });
      refs.delete.addEventListener('click', deleteLayer);
      refs.rename.addEventListener('click', function () {
        var name = global.prompt('Layer name', layers[selected].name);
        if (name !== null) { layers[selected].setName(name); changed('Layer renamed.'); renderLayers(); }
      });
      refs.layers.addEventListener('click', function (e) {
        var visible = e.target.closest('[data-visibility]');
        if (visible) {
          var index = Number(visible.dataset.visibility);
          layers[index].setVisible(!layers[index].visible);
          changed('Layer visibility changed.');
        } else {
          var item = e.target.closest('[data-index]');
          if (item) selected = Number(item.dataset.index);
        }
        renderLayers();
      });
      refs['layer-alpha'].addEventListener('input', function () {
        layers[selected].setOpacity(Number(this.value) / 100);
        changed('Layer opacity changed.');
        renderLayers();
      });
      refs.blend.addEventListener('change', function () {
        layers[selected].setBlending(this.value);
        changed('Layer blend changed.');
        renderLayers();
      });
      ['shape', 'size', 'color', 'alpha', 'rotate'].forEach(function (name) {
        refs[name].addEventListener('input', updateTool);
      });
      refs.eraser.addEventListener('click', function () {
        tool.eraser = !tool.eraser;
        this.setAttribute('aria-pressed', String(tool.eraser));
      });
      refs.undo.addEventListener('click', undo);
      refs.redo.addEventListener('click', redo);
      refs.new.addEventListener('click', requestNew);
      refs.export.addEventListener('click', exportPNG);
      refs.save.addEventListener('click', saveProject);
      refs.open.addEventListener('click', function () { refs['input-project'].click(); });
      refs.import.addEventListener('click', function () { refs['input-image'].click(); });
      refs['input-project'].addEventListener('change', function () {
        var file = this.files[0]; this.value = ''; openProject(file);
      });
      refs['input-image'].addEventListener('change', function () {
        var file = this.files[0]; this.value = ''; importImage(file);
      });
      canvas.addEventListener('pointerdown', startStroke);
      canvas.addEventListener('pointermove', moveStroke);
      canvas.addEventListener('pointerup', finishStroke);
      canvas.addEventListener('pointercancel', finishStroke);
      canvas.addEventListener('lostpointercapture', finishStroke);
      document.addEventListener('keydown', keyboard);
      global.addEventListener('beforeunload', function (e) {
        if (dirty) { e.preventDefault(); e.returnValue = ''; }
      });
    }
    this.run = function () {
      gui = new FGui();
      refs = gui.initialize();
      screen = new FScreen();
      canvas = screen.initialize('gp-canvas', width, height, refs.stage);
      newProject(width, height);
      bindUI();
      updateTool();
      updateHistoryButtons();
    };
    // Lightweight, read-only hooks for automated regression tests.
    this.getState = function () {
      return { width: width, height: height, layerCount: layers.length,
        selectedLayer: selected, undoCount: past.length, redoCount: future.length };
    };
  };
})(window);
