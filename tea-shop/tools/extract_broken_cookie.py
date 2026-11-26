"""Cut the broken fortune cookie (two pieces + crumbs) from the asset sheet as
three aligned layers of the same size: left piece, right piece, crumbs.
Usage: python3 extract_broken_cookie.py <sheet.png> <out_dir>"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

sheet, out = sys.argv[1], sys.argv[2]
X0, Y0, X1, Y1 = 972, 322, 1162, 478
src = np.array(Image.open(sheet).convert('RGB')).astype(np.float32)[Y0:Y1, X0:X1]
BG = np.array([250.2, 247.8, 245.0], np.float32)
d = np.sqrt(((src - BG) ** 2).sum(-1))
lab, n = ndi.label(d < 22)
border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
fg = ~np.isin(lab, border[border > 0])
flab, fn = ndi.label(fg)
sizes = ndi.sum(fg, flab, range(1, fn + 1))
edge = set(np.unique(np.concatenate([flab[0], flab[-1], flab[:, 0], flab[:, -1]]))) - {0}
main = int(np.argmax(sizes)) + 1
pieces = flab == main
crumbs = np.zeros_like(fg)
for i, s in enumerate(sizes, 1):
    if i != main and i not in edge and s >= 6:
        crumbs |= flab == i

# the crack between the two pieces (sheet coordinates, traced on a zoomed grid)
SEAM = [(330, 1093), (340, 1084), (355, 1079), (370, 1076), (382, 1072), (390, 1064), (398, 1052), (478, 1050)]
ys = np.array([p[0] for p in SEAM], float); xs = np.array([p[1] for p in SEAM], float)
yy, xx = np.mgrid[Y0:Y1, X0:X1]
seam_x = np.interp(yy, ys, xs)
cover_right = np.clip(xx + 0.5 - seam_x, 0, 1)  # anti-aliased split

def layer(alpha):
    a = np.array(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
    a = np.maximum(a * (alpha > 0), (ndi.binary_erosion(alpha > 0.5, iterations=1)).astype(np.float32))
    am = a[..., None]
    with np.errstate(divide='ignore', invalid='ignore'):
        un = (src - (1 - am) * BG) / np.maximum(am, 1e-3)
    rgb = np.where(am > 0.98, src, np.clip(un, 0, 255))
    im = Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8), 'RGBA')
    return im.resize((im.width * 2, im.height * 2), Image.LANCZOS)

core = ndi.binary_erosion(pieces, iterations=1).astype(np.float32)
os.makedirs(out, exist_ok=True)
for name, alpha in [('broken-left', core * (1 - cover_right)), ('broken-right', core * cover_right),
                    ('broken-crumbs', ndi.binary_erosion(crumbs, iterations=1).astype(np.float32) * 0 + crumbs.astype(np.float32))]:
    im = layer(alpha)
    im.save(os.path.join(out, f'cookie-{name}.webp'), 'WEBP', quality=90, method=6)
    print(name, im.size)
