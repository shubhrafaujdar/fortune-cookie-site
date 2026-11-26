"""Cut individual illustrations out of the watercolor asset sheet.

Usage: python3 extract_assets.py <sheet.png> <out_public_assets_dir>

Background removal: pixels close to the sheet's paper colour that are
connected to the crop border are treated as background; everything else is
kept untouched (original watercolor pixels). Edges get a soft alpha ramp and
colour decontamination so no cream halo remains.
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

SHEET, OUT = sys.argv[1], sys.argv[2]
src = np.array(Image.open(SHEET).convert("RGB")).astype(np.float32)
BG = np.array([250.2, 247.8, 245.0], dtype=np.float32)


def drop_border_specks(fg, keep):
    flab, fn = ndi.label(fg)
    if not fn:
        return fg
    sizes = ndi.sum(fg, flab, range(1, fn + 1))
    edge = set(np.unique(np.concatenate([flab[0], flab[-1], flab[:, 0], flab[:, -1]]))) - {0}
    big = sizes.max()
    ok = []
    for i, sz in enumerate(sizes, start=1):
        if i in edge and sz < big:
            continue  # sliver of a neighbouring illustration
        if keep == "largest" and sz < max(40, big * 0.08):
            continue
        if keep == "all" and sz < keep_min[0]:
            continue
        ok.append(i)
    return np.isin(flab, ok)


keep_min = [40]


def cutout(box, *, T=22.0, keep="largest", min_area=40, blank=None, holes=False):
    x0, y0, x1, y1 = box
    rgb = src[y0:y1, x0:x1].copy()
    if blank:
        for bx0, by0, bx1, by1 in blank:
            rgb[by0 - y0:by1 - y0, bx0 - x0:bx1 - x0] = BG
    d = np.sqrt(((rgb - BG) ** 2).sum(-1))
    bglike = d < T
    lab, n = ndi.label(bglike)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    if holes:
        # enclosed paper-coloured gaps (teapot handle, torii, fan ribs...)
        sizes = ndi.sum(bglike, lab, range(1, n + 1))
        for i, sz in enumerate(sizes, start=1):
            if sz > 60 and d[lab == i].mean() < 9:
                bg |= lab == i
    keep_min[0] = min_area
    fg = drop_border_specks(~bg, keep)
    return finish(rgb, soft_alpha(fg))


def soft_alpha(fg):
    core = ndi.binary_erosion(fg, iterations=1)
    a = Image.fromarray((core * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.75))
    a = np.array(a).astype(np.float32) / 255
    a = np.maximum(a, ndi.binary_erosion(core, iterations=1).astype(np.float32))
    return a * fg


def finish(rgb, alpha):
    a = alpha[..., None]
    with np.errstate(divide="ignore", invalid="ignore"):
        un = (rgb - (1 - a) * BG) / np.maximum(a, 1e-3)
    out = np.where(a > 0.98, rgb, np.clip(un, 0, 255))
    rgba = np.dstack([out, alpha * 255]).astype(np.uint8)
    ys, xs = np.where(alpha > 0.02)
    pad = 2
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, rgba.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, rgba.shape[1])
    return Image.fromarray(rgba[y0:y1, x0:x1], "RGBA")


def save(img, rel, scale=1.0, q=90):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if scale != 1.0:
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    img.save(path, "WEBP", quality=q, method=6)
    print(f"{rel:38s} {img.size}  {os.path.getsize(path)//1024}KB")


# ---------------------------------------------------------------- scene
def scene():
    im = Image.fromarray(src[0:464, 0:706].astype(np.uint8))
    big = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=1.6, percent=40, threshold=2))
    save(big.convert("RGBA"), "scene/shop-interior.webp", q=86)


# ---------------------------------------------------------------- jar
# The jar overlaps the right edge of the shop painting (x < 731). There the
# jar is painted on top of the scene, so we keep those pixels and cut along
# the jar's own left outline (traced by hand from a zoomed grid).
JAR_LEFT = [(127, 731), (140, 724), (150, 720), (170, 715), (200, 712), (240, 712),
            (260, 714), (272, 717), (290, 723), (300, 726), (312, 731)]


def jar():
    x0, y0, x1, y1 = 700, 6, 1006, 450
    sceneedge = 731

    def pre(rgb, ox, oy):
        r = rgb.copy()
        r[:, : sceneedge - ox] = BG  # hide scene for flood fill
        return r

    rgb = src[y0:y1, x0:x1].copy()
    hidden = pre(rgb, x0, y0)
    d = np.sqrt(((hidden - BG) ** 2).sum(-1))
    lab, _ = ndi.label(d < 22)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    fg = ~np.isin(lab, border[border > 0])
    fg = drop_border_specks(fg, "largest")
    flab, fn = ndi.label(fg)
    sizes = ndi.sum(fg, flab, range(1, fn + 1))
    fg = soft_alpha(flab == (np.argmax(sizes) + 1))
    # add the jar sliver over the scene, anti-aliased
    ys = np.array([p[0] for p in JAR_LEFT], float)
    xs = np.array([p[1] for p in JAR_LEFT], float)
    alpha = fg.astype(np.float32)
    for yy in range(int(ys.min()), int(ys.max()) + 1):
        edge = np.interp(yy, ys, xs)
        for xx in range(int(edge) - 1, sceneedge):
            cov = np.clip(xx + 1 - edge, 0, 1)
            alpha[yy - y0, xx - x0] = max(alpha[yy - y0, xx - x0], cov)
    alpha = ndi.binary_fill_holes(alpha > 0.5).astype(np.float32) * np.maximum(alpha, 0.0) + (ndi.binary_fill_holes(alpha > 0.5) & (alpha < 0.5)) * 1.0
    alpha = np.clip(alpha, 0, 1)
    alpha = np.array(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))).astype(np.float32) / 255
    img = finish(rgb, alpha)
    save(img, "objects/fortune-jar.webp", scale=1.6, q=90)


# ---------------------------------------------------------------- the rest
def blank_button(box, name):
    """Remove painted lettering from a button so we can set our own text."""
    img = cutout(box)
    arr = np.array(img)
    rgb, a = arr[..., :3].copy(), arr[..., 3]
    h, w = a.shape
    inner = ndi.binary_erosion(a > 200, iterations=9)
    lum = rgb.mean(-1)
    text = inner & (lum < 175)
    text = ndi.binary_dilation(text, iterations=2) & inner
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    fixed = cv2.inpaint(bgr, text.astype(np.uint8) * 255, 6, cv2.INPAINT_TELEA)
    fixed = cv2.cvtColor(fixed, cv2.COLOR_BGR2RGB)
    # put a little paper grain back into the inpainted area
    rng = np.random.default_rng(3)
    grain = rng.normal(0, 3.2, fixed.shape)
    grain = cv2.GaussianBlur(grain.astype(np.float32), (0, 0), 0.8)
    fixed = np.where(text[..., None], np.clip(fixed + grain, 0, 255), fixed).astype(np.uint8)
    out = Image.fromarray(np.dstack([fixed, a]), "RGBA")
    save(out, f"ui/{name}.webp", scale=2.0)


JOBS = {
    # cookies
    "cookies/cookie-whole.webp": dict(box=(1000, 12, 1170, 158)),
    "cookies/cookie-half-left.webp": dict(box=(1172, 12, 1314, 156)),
    "cookies/cookie-half-right.webp": dict(box=(1314, 14, 1468, 154)),
    "cookies/crumbs.webp": dict(box=(1288, 112, 1348, 168), keep="all", min_area=6),
    # papers
    "paper/slip-sakura.webp": dict(box=(1322, 158, 1512, 242)),
    "paper/slip-plain.webp": dict(box=(1324, 242, 1520, 322)),
    "paper/scroll-long.webp": dict(box=(1176, 318, 1518, 414)),
    "paper/slip-branch.webp": dict(box=(1268, 414, 1528, 502)),
    "paper/slip-waves.webp": dict(box=(1282, 508, 1528, 598)),
    "paper/daily-card.webp": dict(box=(1278, 600, 1536, 864)),
    "paper/banner-knot.webp": dict(box=(910, 838, 1396, 1014), holes=True),
    # props
    "objects/teacup.webp": dict(box=(8, 528, 216, 708), blank=[(8, 528, 216, 535)]),
    "objects/teapot-set.webp": dict(box=(210, 474, 570, 704), blank=[(296, 486, 356, 601)], holes=True),
    "objects/flower-vase.webp": dict(box=(560, 469, 700, 706)),
    "objects/paper-lantern.webp": dict(box=(694, 450, 784, 708), holes=True),
    "objects/fortune-journal.webp": dict(box=(1034, 474, 1286, 754), blank=[(1160, 474, 1286, 487)], holes=True),
    "objects/lucky-cat.webp": dict(box=(1410, 850, 1536, 1014)),
    "objects/folding-fan.webp": dict(box=(236, 850, 454, 1006), keep="all", min_area=40, holes=True),
    "objects/stone-lantern.webp": dict(box=(450, 860, 568, 1008), holes=True),
    "objects/torii.webp": dict(box=(572, 874, 754, 1014), holes=True),
    "decor/cherry-branch.webp": dict(box=(0, 848, 250, 1020), keep="all", min_area=25, holes=True),
    "decor/gold-cloud.webp": dict(box=(766, 860, 914, 942)),
    "decor/waves-clouds.webp": dict(box=(722, 928, 918, 1014), keep="all", min_area=40),
    "decor/pressed-flower.webp": dict(box=(1168, 414, 1264, 483), keep="all", min_area=30),
    # ui
    "ui/sound-on.webp": dict(box=(978, 730, 1058, 808)),
    "ui/sound-off.webp": dict(box=(1072, 764, 1152, 842)),
    "ui/settings.webp": dict(box=(1190, 784, 1270, 864)),
    # category tags
    "tags/luck.webp": dict(box=(6, 704, 124, 850)),
    "tags/love.webp": dict(box=(126, 704, 248, 850)),
    "tags/friendship.webp": dict(box=(248, 704, 370, 850)),
    "tags/courage.webp": dict(box=(370, 704, 488, 850)),
    "tags/creativity.webp": dict(box=(488, 704, 604, 850)),
    "tags/wisdom.webp": dict(box=(604, 704, 718, 850)),
    "tags/new-beginnings.webp": dict(box=(718, 704, 834, 850)),
    "tags/surprises.webp": dict(box=(834, 704, 950, 850), blank=[(834, 704, 879, 727), (899, 704, 950, 727)]),
}
SCALE = {"paper/": 2.0, "cookies/": 2.0, "tags/": 1.5, "ui/sound": 1.5, "ui/settings": 1.5}

if __name__ == "__main__":
    scene()
    jar()
    for rel, kw in JOBS.items():
        sc = next((v for k, v in SCALE.items() if rel.startswith(k)), 1.6)
        save(cutout(**kw), rel, scale=sc)
    blank_button((798, 468, 1016, 536), "button-blank")
    blank_button((804, 536, 1020, 606), "button-blank-2")
