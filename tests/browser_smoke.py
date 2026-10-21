"""Functional browser tests for Genesis Painter Alpha.
Requires: pip install playwright && playwright install chromium (or system Chromium).
Run from patch root: python tests/browser_smoke.py
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1480, 'height': 980}, accept_downloads=True)
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    # Restricted CI browsers block file:// and localhost navigation. Inject local assets directly.
    page.set_content('<html><body><svg id="brush_01" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" style="display:none"><circle cx="150" cy="150" r="125" fill="#000000"/></svg></body></html>')
    page.add_style_tag(content=(ROOT / 'slime-genesis/css/game-rpg-editor.css').read_text())
    for module in ('Editor.js', 'FScreen.js', 'FLayer.js', 'FGui.js'):
        page.add_script_tag(content=(ROOT / 'slime-genesis/js/game-rpg-editor' / module).read_text())
    page.evaluate('window.editor = new Editor(); editor.run()')
    page.locator('#gp-canvas').wait_for()
    assert page.evaluate('editor.getState().layerCount') == 1
    assert page.evaluate('editor.getState().width') == 960
    assert page.locator('#gp-layers .gp-layer').count() == 1
    canvas = page.locator('#gp-canvas')
    box = canvas.bounding_box()
    assert box
    page.mouse.move(box['x'] + 110, box['y'] + 120)
    page.mouse.down()
    page.mouse.move(box['x'] + 290, box['y'] + 120, steps=5)
    page.mouse.up()
    page.wait_for_timeout(50)
    assert page.evaluate('editor.getState().undoCount') == 1
    # Drawing reached mid-point even though browser delivered sparse mouse moves.
    alpha = page.evaluate("""() => document.querySelector('#gp-canvas').getContext('2d').getImageData(200, 120, 1, 1).data[3]""")
    assert alpha > 0, f'middle of brush stroke should be painted: {alpha}'
    page.click('#gp-undo')
    alpha = page.evaluate("""() => document.querySelector('#gp-canvas').getContext('2d').getImageData(200, 120, 1, 1).data[3]""")
    # Draw uses requestAnimationFrame; wait for next frame.
    page.wait_for_timeout(80)
    alpha = page.evaluate("""() => document.querySelector('#gp-canvas').getContext('2d').getImageData(200, 120, 1, 1).data[3]""")
    assert alpha == 0, 'Undo should clear the stroke'
    page.click('#gp-redo')
    page.wait_for_timeout(80)
    alpha = page.evaluate("""() => document.querySelector('#gp-canvas').getContext('2d').getImageData(200, 120, 1, 1).data[3]""")
    assert alpha > 0, 'Redo should restore stroke'
    page.click('#gp-add')
    assert page.evaluate('editor.getState().layerCount') == 2
    assert page.locator('#gp-layers .gp-layer').count() == 2
    page.fill('#gp-color', '#f59945')
    page.mouse.click(box['x'] + 410, box['y'] + 270)
    assert page.evaluate('editor.getState().undoCount') == 1
    # Test hidden layer does not show up in composited PNG.
    page.locator('[data-visibility="1"]').click()
    page.wait_for_timeout(80)
    alpha = page.evaluate("""() => document.querySelector('#gp-canvas').getContext('2d').getImageData(410, 270, 1, 1).data[3]""")
    assert alpha == 0
    page.locator('[data-visibility="1"]').click()
    # Native file format is JSON; decode PNG layers and assert content.
    with page.expect_download() as d:
        page.click('#gp-save')
    dl = d.value
    assert dl.suggested_filename == 'slimetribe-genesis.sgp.json'
    file = ROOT / 'tests' / '_smoke_project.json'
    dl.save_as(file)
    data = json.loads(file.read_text())
    assert data['format'] == 'slimetribe.genesis-painter'
    assert data['version'] == 1 and len(data['layers']) == 2
    assert all(x['png'].startswith('data:image/png;base64,') for x in data['layers'])
    with page.expect_download() as d:
        page.click('#gp-export')
    dl = d.value
    assert dl.suggested_filename == 'slimetribe-genesis.png'
    pngfile = ROOT / 'tests' / '_smoke_export.png'
    dl.save_as(pngfile)
    assert pngfile.read_bytes()[:8] == b'\x89PNG\r\n\x1a\n'
    # Test round-trip after mutating the live project.
    page.click('#gp-add')
    assert page.evaluate('editor.getState().layerCount') == 3
    page.on('dialog', lambda d: d.accept())
    page.locator('#gp-input-project').set_input_files(str(file))
    page.wait_for_timeout(200)
    assert page.evaluate('editor.getState().layerCount') == 2
    assert page.evaluate('editor.getState().width') == 960
    # Dark UI screenshot for visual inspection.
    page.screenshot(path=str(ROOT / 'tests' / 'genesis-preview.png'), full_page=True)
    assert not errors, errors
    print('PASS: painting, interpolation, undo/redo, layers, visibility, export PNG, native save/open, screenshot')
    browser.close()

