"""Make private test copies of the game for feature agents.

Usage:  python3 dev/make_test_copies.py <TEST-folder> salen sal1 rum ude vinter
Creates <TEST>/ag_<name>/index.html (+ index_original.html) with three.js loaded from
<TEST>/node_modules (run `npm install three@0.160.0` in <TEST> once) and debug hooks:
window.__scene, window.__THREE, window.__camOverride (free camera), window.__dbg.
"""
import os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
test, names = sys.argv[1], sys.argv[2:]
s = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
s = s.replace('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', '../node_modules/three/build/three.module.js')
s = s.replace('const scene = new THREE.Scene();', 'const scene = new THREE.Scene(); window.__scene = scene; window.__THREE = THREE;', 1)
s = s.replace('function updCamera(dt, t) {', 'function updCamera(dt, t) { if (window.__camOverride) { window.__camOverride(camera); return; }', 1)
s = s.replace('window.__duevej = {', 'window.__jump = () => { jumpReq = true; }; window.__dbg = { updPlayer, keys, cols, groundAt, topAt, animals, found, discover, WEATHER, offerAction, runAction, ACT, HOOKS, FX, P, kid }; window.__duevej = {', 1)
for n in names:
    d = os.path.join(test, 'ag_' + n); os.makedirs(d, exist_ok=True)
    for f in ('index.html', 'index_original.html'):
        open(os.path.join(d, f), 'w', encoding='utf-8').write(s)
    print('made', d)
