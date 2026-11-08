"""Remove faint glyph/rune strokes from card art.
# usage: python3 tools/deglyph.py '{"src":"in.png","dst":"out.png","spec":[["ring",cx,cy,rin,rout]],"thr":8,"glow":62}'
# spec shapes: ring cx cy rin rout [yscale] | rect x0 y0 x1 y1 | ell x0 y0 x1 y1 | not x0 y0 x1 y1 (protect)

Finds thin strokes that are a bit lighter than their surroundings inside a
region mask, skips very bright pixels (lightning, stars, corona), and
inpaints only those stroke pixels with OpenCV.
"""
import sys, json
import cv2
import numpy as np


def region_mask(shape, spec):
    h, w = shape[:2]
    m = np.zeros((h, w), np.uint8)
    for r in spec:
        kind = r[0]
        if kind == 'ring':  # ring cx cy rin rout [sy]
            cx, cy, rin, rout = r[1:5]
            sy = r[5] if len(r) > 5 else 1.0
            yy, xx = np.mgrid[0:h, 0:w]
            d = np.sqrt((xx - cx) ** 2 + ((yy - cy) / sy) ** 2)
            m[(d >= rin) & (d <= rout)] = 255
        elif kind == 'rect':
            x0, y0, x1, y1 = r[1:5]
            m[y0:y1, x0:x1] = 255
        elif kind == 'ell':
            x0, y0, x1, y1 = r[1:5]
            cv2.ellipse(m, ((x0 + x1) / 2, (y0 + y1) / 2), ((x1 - x0) / 2, (y1 - y0) / 2), 0, 0, 360, 255, -1)
        elif kind == 'not':  # carve out a protected ellipse
            x0, y0, x1, y1 = r[1:5]
            cv2.ellipse(m, ((x0 + x1) / 2, (y0 + y1) / 2), ((x1 - x0) / 2, (y1 - y0) / 2), 0, 0, 360, 0, -1)
    return m


def run(src, dst, spec, thr=9, bright=150, ksize=21, grow=2, radius=5, maskout=None, glow=None, glowsig=9):
    img = cv2.imread(src, cv2.IMREAD_COLOR)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    L = lab[:, :, 0].astype(np.int16)
    med = cv2.medianBlur(lab[:, :, 0], ksize).astype(np.int16)
    reg = region_mask(img.shape, spec)
    stroke = ((L - med) > thr) & (L < bright) & (reg > 0)
    if glow is not None:  # leave glowing areas (corona, aura) alone
        g = cv2.GaussianBlur(lab[:, :, 0], (0, 0), glowsig).astype(np.int16)
        stroke &= g < glow
    # protect bright things (and a margin around them) so lightning keeps its edges
    prot = (L >= bright).astype(np.uint8) * 255
    prot = cv2.dilate(prot, np.ones((5, 5), np.uint8))
    m = (stroke.astype(np.uint8) * 255)
    m[prot > 0] = 0
    # drop isolated specks (tiny stars / noise); keep stroke-like blobs
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros_like(m)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= 6:
            keep[lbl == i] = 255
    if grow:
        keep = cv2.dilate(keep, np.ones((2 * grow + 1, 2 * grow + 1), np.uint8))
        keep[prot > 0] = 0
    out = cv2.inpaint(img, keep, radius, cv2.INPAINT_TELEA)
    cv2.imwrite(dst, out)
    if maskout:
        cv2.imwrite(maskout, keep)
    return int((keep > 0).sum())


if __name__ == '__main__':
    cfg = json.loads(sys.argv[1])
    print(run(**cfg))
