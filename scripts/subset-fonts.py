# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "fonttools[woff]==4.68.0",
#   "uharfbuzz==0.57.0",
#   "playwright==1.64.1",
# ]
# ///
"""
@purpose 站点 Web 字体子集化:按全站实际用到的字符/字重/OpenType 特性,把 Space Grotesk 与 IBM Plex Mono
         裁成「core(预加载)+ extended(unicode-range 按需)」两份 woff2,产出提交进仓库。
@role    手动运行的 CLI(`pnpm fonts` = `uv run scripts/subset-fonts.py`),**不接入构建**。
         产物:public/fonts/*.woff2 + OFL 许可、src/styles/fonts.css(@font-face)、src/data/fonts.json(预加载清单+用量报告)。
@deps    uv(按上方 PEP 723 头自动装 fontTools / uharfbuzz / playwright);本机 Google Chrome(或 playwright 自带 Chromium);pnpm build
@gotcha  ① 「渲染不变」以迁出 Google Fonts 前的表现为准:只保留当时 Google 实际下发、且落在其 unicode-range 内的字符
         (GOOGLE_COVERAGE),→ ↗ 等当年就回退到系统字体的字符**不能**补进来,否则字形会变。
         ② Space Grotesk 的 4 个字重必须保持离散的 @font-face(400/500/600/700 同一文件),写成 `400 700` 区间会让
         font-[450] 从 500 变成 450。③ IBM Plex Mono 有 Reserved Font Name「Plex」,子集是修改版,内部名与 CSS 族名都改成
         Jade Mono。④ Plex Mono 默认保留 hinting:Google 给 Windows 下发的是带 hinting 版本,去掉会改变 Windows 渲染
         (--strip-hinting 可去,需确认)。⑤ 何时重跑:新增/修改文章或组件文案后出现新的非 ASCII 字符、新用到某个字重/
         font-variant 特性/hyphens:auto、或升级字体源。脚本末尾的校验失败即说明产物与站点不匹配。
"""

from __future__ import annotations

import argparse
import collections
import functools
import hashlib
import http.server
import io
import json
import re
import subprocess
import sys
import threading
import urllib.request
from pathlib import Path

import uharfbuzz as hb
from fontTools import subset
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUT_FONTS = ROOT / "public" / "fonts"
OUT_CSS = ROOT / "src" / "styles" / "fonts.css"
OUT_JSON = ROOT / "src" / "data" / "fonts.json"
CACHE = ROOT / "node_modules" / ".cache" / "subset-fonts"
URL_PREFIX = "/fonts/"

GF = "https://raw.githubusercontent.com/google/fonts"
# 字体源钉死到 google/fonts 的提交 + sha256。已核对:与 Google Fonts 下发文件的轮廓、步进、字偶距/整对排版结果一致,
# Plex 的 fpgm/prep/cvt 与逐字形指令与 Windows 下发版本逐字节相同。
FAMILIES = {
    "space-grotesk": {
        "css_family": "Space Grotesk",
        "variable": True,
        # 同一个可变字体文件服务 4 个离散字重(与 Google 原先的 @font-face 声明一致)
        "faces": {w: f"{GF}/00a38a53f92aef923b9353f40128e8f4552ddae4/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf" for w in (400, 500, 600, 700)},
        "sha256": {"SpaceGrotesk%5Bwght%5D.ttf": "acad6de1fc93436f5c0f1f4137751ef04f1aea3063e7036535970ffcfbd79f72"},
        "license": (f"{GF}/00a38a53f92aef923b9353f40128e8f4552ddae4/ofl/spacegrotesk/OFL.txt", "564ce565c371c5e5bbf286006565a7c9aa55a9f56e7ca58d56e05d649dd61a72"),
        "rename": None,  # OFL 未声明 Reserved Font Name
    },
    "jade-mono": {
        "css_family": "Jade Mono",
        "variable": False,
        "faces": {
            400: f"{GF}/01d5d9f05246fb7090a8403b81257535cb1a088b/ofl/ibmplexmono/IBMPlexMono-Regular.ttf",
            500: f"{GF}/01d5d9f05246fb7090a8403b81257535cb1a088b/ofl/ibmplexmono/IBMPlexMono-Medium.ttf",
            600: f"{GF}/01d5d9f05246fb7090a8403b81257535cb1a088b/ofl/ibmplexmono/IBMPlexMono-SemiBold.ttf",
        },
        "sha256": {
            "IBMPlexMono-Regular.ttf": "6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46",
            "IBMPlexMono-Medium.ttf": "a9b4c49bb299e05b5f6c481e7fb5e78943d2793249a0c8874ab574a2d1ea6755",
            "IBMPlexMono-SemiBold.ttf": "d3c38e55c78f5b0f28009fddba4834ec503278936a5986032424c9bd2d23aa46",
        },
        "license": (f"{GF}/01d5d9f05246fb7090a8403b81257535cb1a088b/ofl/ibmplexmono/OFL.txt", "7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da"),
        # Reserved Font Name "Plex":修改版不得再用这个名字
        "rename": {"family": "Jade Mono", "ps": "JadeMono", "styles": {400: "Regular", 500: "Medium", 600: "SemiBold"}},
    },
}
# 页面 CSS 里认这些名字 → 对应上面的家族(Plex 旧名留着,便于识别未改名的引用)
CSS_NAMES = {"space grotesk": "space-grotesk", "jade mono": "jade-mono", "ibm plex mono": "jade-mono"}

# 2026-10-30 站点从 Google Fonts(css2 API,Mac Chrome UA)加载时,真正由该字体绘制的码位 =
# ∪(各子集文件的 cmap ∩ 该子集的 unicode-range)。注意 Google 的子集文件并不包含 range 里的全部码位(如 U+2010、U+2192 都不在),
# 那些字符当时就回退到系统字体;为保持渲染不变,子集只能取这个范围内的字符。
GOOGLE_COVERAGE = {
    "space-grotesk": "0020-007E,00A0-0180,018F,0192,01A0-01A1,01AF-01B0,01C4-01DC,01E6-01E7,01EA-01EB,01FA-021B,022A-022D,0230-0233,0237,0243,0251,0259,02B9-02BC,02BE-02BF,02C6-02CC,02DA,02DC-02DD,0300-0301,0303-0304,0308-0309,0323,1E08-1E09,1E0C-1E0F,1E14-1E17,1E1C-1E1D,1E20-1E21,1E24-1E25,1E2A-1E2B,1E2E-1E2F,1E36-1E3B,1E42-1E49,1E4C-1E53,1E5A-1E69,1E6C-1E6F,1E78-1E7B,1E80-1E85,1E8E-1E8F,1E92-1E93,1E97,1E9E,1EA0-1EF9,2009,200B,2013-2014,2018-201A,201C-201E,2020,2022,2026,2032-2033,2039-203A,2044,20A1,20A3-20A4,20A6-20A7,20A9,20AB-20AD,20B1-20B2,20B5,20B9-20BA,20BC-20BD,20BF,2113,2122,2191,2193,2212,2215",
    "jade-mono": "0020-007E,00A0-017F,018F,0192,01A0-01A1,01AF-01B0,01CD-01DC,01FA-01FF,0218-021B,0237,0259,02BB-02BC,02C6-02C7,02DA,02DC-02DD,0300-0301,0303-0304,0308-0309,0323,0400-045F,0472-0473,0490-049D,04A0-04A5,04AA-04AB,04AE-04B3,04B6-04BB,04C0-04C2,04CF-04D9,04DC-04DF,04E2-04E9,04EE-04F5,04F8-04F9,1E80-1E85,1E9E,1EA0-1EF9,2013-2014,2018-201A,201C-201E,2020,2022,2026,2032-2033,2039-203A,2044,20A1,20A4,20A6,20A8-20AE,20B1-20B2,20B4-20B5,20B8-20BA,20BD,20BF,2113,2116,2122,2191,2193,2212,2215",
}
# Google 原来按子集拆文件:同一文件内的字符才互相排版(字偶距等)。校验「旧渲染」时按这个分段模拟。
# 顺序 = CSS 中声明的倒序(后声明者优先匹配)。
GOOGLE_SEGMENTS = [
    ("latin", "0000-00FF,0131,0152-0153,02BB-02BC,02C6,02DA,02DC,0304,0308,0329,2000-206F,20AC,2122,2191,2193,2212,2215,FEFF,FFFD"),
    ("latin-ext", "0100-02BA,02BD-02C5,02C7-02CC,02CE-02D7,02DD-02FF,0304,0308,0329,1D00-1DBF,1E00-1E9F,1EF2-1EFF,2020,20A0-20AB,20AD-20C4,2113,2C60-2C7F,A720-A7FF"),
    ("vietnamese", "0102-0103,0110-0111,0128-0129,0168-0169,01A0-01A1,01AF-01B0,0300-0301,0303-0304,0308-0309,0323,0329,1EA0-1EF9,20AB"),
    ("cyrillic", "0301,0400-045F,0490-0491,04B0-04B1,2116"),
    ("cyrillic-ext", "0460-052F,1C80-1C8A,20B4,2DE0-2DFF,A640-A69F,FE2E-FE2F"),
]

ASCII = set(range(0x20, 0x7F))
# 用户指定:core 里放大多数页面都会出现的标点
CORE_PUNCT = {ord(c) for c in "‘’“”–—…"}
LATIN1_EXT_A = set(range(0xA0, 0x180))
# Chrome/HarfBuzz 对拉丁文默认开启的特性;其余特性只有 CSS 显式打开才保留
DEFAULT_FEATURES = {"ccmp", "locl", "mark", "mkmk", "rlig", "calt", "clig", "curs", "dist", "kern", "liga", "rclt"}
NUMERIC = {"tabular-nums": "tnum", "proportional-nums": "pnum", "oldstyle-nums": "onum", "lining-nums": "lnum",
           "slashed-zero": "zero", "ordinal": "ordn", "diagonal-fractions": "frac", "stacked-fractions": "afrc"}
# 页面 lang → OpenType 语言标签(只用于判断 locl 是否会被触发;未知语言保守保留 locl)
OT_LANG = {"en": "ENG", "zh": "ZHS", "zh-cn": "ZHS", "zh-hans": "ZHS", "": "dflt"}


def parse_ranges(spec: str) -> set[int]:
    out: set[int] = set()
    for part in spec.split(","):
        a, _, z = part.strip().partition("-")
        out |= set(range(int(a, 16), int(z or a, 16) + 1))
    return out


def format_unicode_range(cps: set[int]) -> str:
    s, out, i = sorted(cps), [], 0
    while i < len(s):
        j = i
        while j + 1 < len(s) and s[j + 1] == s[j] + 1:
            j += 1
        out.append(f"U+{s[i]:X}" if i == j else f"U+{s[i]:X}-{s[j]:X}")
        i = j + 1
    return ", ".join(out)


# ---------------- 1. 抓全站实际用量 ----------------

COLLECT_JS = r"""
() => {
  // 以每个文本节点的计算样式为准(含组件内联 style、Tailwind 任意值、伪元素 content、列表标记、占位符)
  const groups = new Map();
  const add = (cs, text, el) => {
    if (!text) return;
    if (cs.textTransform === "uppercase") text = text.toUpperCase();
    else if (cs.textTransform === "lowercase") text = text.toLowerCase();
    else if (cs.textTransform === "capitalize") text = text + " " + text.toUpperCase();
    text = text.replace(/[\n\r\t]+/g, " ");
    const lang = (el.closest("[lang]")?.getAttribute("lang") || "").toLowerCase();
    const extra = [];
    if (cs.textOverflow === "ellipsis" || (cs.webkitLineClamp && cs.webkitLineClamp !== "none")) extra.push("…");
    if (cs.hyphens === "auto" || text.includes("­")) extra.push("‐-");
    const key = JSON.stringify([cs.fontFamily, cs.fontWeight, cs.fontStyle, cs.fontFeatureSettings, cs.fontVariantNumeric,
      cs.fontVariantLigatures, cs.fontVariantCaps, cs.fontKerning, cs.fontVariationSettings, cs.hyphens, lang]);
    let g = groups.get(key);
    if (!g) groups.set(key, (g = { key, texts: new Set() }));
    g.texts.add(text);
    for (const e of extra) g.texts.add(e);
  };
  const visit = (root) => {
    for (const el of root.querySelectorAll("*")) {
      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "TITLE", "META", "LINK"].includes(el.tagName)) continue;
      const cs = getComputedStyle(el);
      for (const n of el.childNodes) if (n.nodeType === 3 && n.data.trim()) add(cs, n.data, el);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") add(cs, `${el.value || ""} ${el.placeholder || ""}`, el);
      for (const pseudo of ["::before", "::after", "::marker"]) {
        const ps = getComputedStyle(el, pseudo);
        const c = ps.content;
        if (c && c !== "none" && c !== "normal") {
          const lit = [...c.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]).join("");
          if (lit) add(ps, lit, el);
          if (/open-quote|close-quote/.test(c)) add(ps, ps.quotes.replace(/["\s]/g, ""), el);
        }
      }
      if (cs.display === "list-item" && cs.listStyleType !== "none") {
        const t = cs.listStyleType;
        add(getComputedStyle(el, "::marker"), /decimal|alpha|roman|latin/.test(t) ? "0123456789. " : ({ disc: "• ", circle: "◦ ", square: "▪ " }[t] || ""), el);
      }
      if (el.tagName === "Q") add(cs, cs.quotes.replace(/["\s]/g, ""), el);
      if (el.shadowRoot) visit(el.shadowRoot);
    }
  };
  visit(document);
  return [...groups.values()].map((g) => ({ key: g.key, texts: [...g.texts] }));
}
"""


def routes_in(dist: Path) -> list[str]:
    out = []
    for p in sorted(dist.rglob("index.html")):
        rel = p.parent.relative_to(dist).as_posix()
        out.append("/" if rel == "." else f"/{rel}/")
    return out


def crawl(dist: Path) -> dict:
    from playwright.sync_api import sync_playwright

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(dist)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_address[1]}"
    pages = {}
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(channel="chrome")
        except Exception:
            browser = p.chromium.launch()
        for r in routes_in(dist):
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            # 只放行本地请求:文本全部来自构建产物,外站图片/视频/嵌入只会拖慢甚至卡住 networkidle
            page.route("**/*", lambda route: route.continue_() if route.request.url.startswith(base) else route.abort())
            page.goto(base + r, wait_until="networkidle")
            page.evaluate("document.fonts.ready.then(() => 0)")
            page.wait_for_timeout(300)  # 等 React 岛水合后的文案
            pages[r] = page.evaluate(COLLECT_JS)
            page.close()
            print(".", end="", flush=True)
        browser.close()
    server.shutdown()
    print(f" {len(pages)} 页")
    return pages


def first_family(css_list: str) -> str:
    return css_list.split(",")[0].strip().strip("\"'").lower()


def source_chars() -> set[int]:
    """源码里出现过的字符(交互后才出现的文案,如复制成功提示)。只进 extended,不影响 core。"""
    out: set[int] = set()
    for p in (ROOT / "src").rglob("*"):
        if p.is_file() and p.suffix in {".mdx", ".md", ".astro", ".tsx", ".ts", ".json"} and "components/ui" not in p.as_posix():
            out |= {ord(c) for c in p.read_text(errors="ignore")}
    return out


def match_face(weight: int, faces: list[int]) -> int:
    """CSS Fonts 4 字重匹配(离散 @font-face)。"""
    faces = sorted(faces)
    if weight in faces:
        return weight
    if 400 <= weight <= 500:
        up = [f for f in faces if weight < f <= 500]
        if up:
            return up[0]
        down = [f for f in faces if f < weight]
        return down[-1] if down else [f for f in faces if f > weight][0]
    if weight < 400:
        down = [f for f in faces if f < weight]
        return down[-1] if down else faces[0]
    up = [f for f in faces if f > weight]
    return up[0] if up else faces[-1]


def analyse(pages: dict) -> dict:
    usage = {k: {"pages": collections.Counter(), "page_count": 0, "faces": collections.Counter(), "styles": set(),
                 "features": set(), "langs": set(), "hyphens_auto": False, "runs": []} for k in FAMILIES}
    unknown = collections.Counter()
    for route, groups in pages.items():
        seen = collections.defaultdict(set)
        for g in groups:
            fam_css, weight, style, ffs, fvn, fvl, fvc, fk, fvs, hyph, lang = json.loads(g["key"])
            key = CSS_NAMES.get(first_family(fam_css))
            text = "".join(g["texts"])
            if key is None:
                if any(n.strip().strip("\"'").lower() in CSS_NAMES for n in fam_css.split(",")[1:]):
                    unknown[fam_css] += 1
                continue
            u = usage[key]
            face = match_face(int(float(weight)), list(FAMILIES[key]["faces"]))
            feats = set()
            for tok in fvn.split():
                if tok in NUMERIC:
                    feats.add(NUMERIC[tok])
            for m in re.finditer(r'"(\w{4})"\s*(on|off|\d+)?', ffs):
                if m.group(2) != "off" and m.group(2) != "0":
                    feats.add(m.group(1))
            if fvc != "normal":
                feats |= {"smcp", "c2sc"}
            disabled = set()
            if fk == "none":
                disabled.add("kern")
            if "no-common-ligatures" in fvl or fvl == "none":
                disabled |= {"liga", "clig"}
            if fvs != "normal":
                sys.exit(f"✗ {route} 用到 font-variation-settings: {fvs},脚本尚未处理,请先确认轴范围")
            u["faces"][face] += 1
            u["styles"].add(style)
            u["features"] |= feats
            u["langs"].add(lang)
            u["hyphens_auto"] |= hyph == "auto"
            u["runs"].append({"face": face, "features": sorted(feats), "disabled": sorted(disabled), "lang": lang, "texts": g["texts"]})
            seen[key] |= {ord(c) for c in text}
        for key, cps in seen.items():
            usage[key]["page_count"] += 1
            usage[key]["pages"].update(cps)
    if unknown:
        print("⚠️ 以下字体栈把本站字体放在第二位以后,未计入:", dict(unknown))
    usage["_total"] = len(pages)
    return usage


# ---------------- 2. 子集化 ----------------


def fetch(url: str, sha: str) -> bytes:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / sha
    if not path.exists():
        print(f"  下载 {url}")
        data = urllib.request.urlopen(url, timeout=120).read()
        path.write_bytes(data)
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != sha:
        path.unlink()
        sys.exit(f"✗ sha256 不符:{url}")
    return data


def rename_font(font: TTFont, rename: dict, weight: int) -> None:
    style = rename["styles"][weight]
    ribbi = style in ("Regular", "Bold")
    name = font["name"]
    for rec in list(name.names):
        if rec.nameID in (1, 2, 3, 4, 6, 16, 17):
            name.removeNames(nameID=rec.nameID)
    name.setName(rename["family"] if ribbi else f"{rename['family']} {style}", 1, 3, 1, 0x409)
    name.setName("Regular" if not ribbi else style, 2, 3, 1, 0x409)
    name.setName(f"{rename['family']} {style}", 4, 3, 1, 0x409)
    name.setName(f"{rename['ps']}-{style}", 6, 3, 1, 0x409)
    name.setName(f"{name.getDebugName(5)};{rename['ps']}-{style};subset", 3, 3, 1, 0x409)
    if not ribbi:
        name.setName(rename["family"], 16, 3, 1, 0x409)
        name.setName(style, 17, 3, 1, 0x409)


def build_font(src: bytes, unicodes: set[int], features: list[str], keep_hinting: bool, axis_limits: dict | None,
               rename: dict | None, weight: int) -> TTFont:
    font = TTFont(io.BytesIO(src))
    opts = subset.Options()
    opts.layout_features = features
    opts.hinting = keep_hinting
    opts.notdef_outline = True  # 与 Google 下发版本一致
    # 实测(macOS Chrome / CoreText):去掉字形名(post format 3)或重算 head 的整体 bbox,Plex Mono 小字号的抗锯齿就会变浅,
    # 像素对比全站 mono 文字都有差异。Google 下发版本两者都保留原样,这里也保留(bbox 见 recalcBBoxes=False)。
    opts.glyph_names = True
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
    opts.name_languages = [0x409]
    opts.drop_tables += ["DSIG", "STAT", "meta"]
    opts.layout_scripts = ["DFLT", "latn", "cyrl"]
    opts.flavor = "woff2"
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=unicodes)
    sub.subset(font)
    if axis_limits:
        # 先子集化再收窄轴:反过来 instancer 改写后的字形名会让 subsetter 报 KeyError(fontTools 4.68 实测)
        font = instancer.instantiateVariableFont(font, axis_limits)
    font.recalcBBoxes = False  # head/hhea 的 bbox 与极值保持源字体的值,见上
    # 特性全被裁掉后 fontTools 仍会留下空的 GSUB/GPOS(以及只为它们服务的 GDEF),手动去掉
    for tag in ("GSUB", "GPOS"):
        if tag in font and not (font[tag].table.FeatureList and font[tag].table.FeatureList.FeatureRecord):
            del font[tag]
    if "GDEF" in font and "GSUB" not in font and "GPOS" not in font:
        del font["GDEF"]
    if rename:
        rename_font(font, rename, weight)
    return font


def font_features(src: bytes) -> set[str]:
    f = TTFont(io.BytesIO(src))
    return {fr.FeatureTag for t in ("GSUB", "GPOS") if t in f and f[t].table.FeatureList for fr in f[t].table.FeatureList.FeatureRecord}


def locl_langs(src: bytes) -> set[str]:
    f = TTFont(io.BytesIO(src))
    out = set()
    for t in ("GSUB", "GPOS"):
        if t not in f or not f[t].table.ScriptList:
            continue
        feats = f[t].table.FeatureList.FeatureRecord
        for sr in f[t].table.ScriptList.ScriptRecord:
            for ls in sr.Script.LangSysRecord:
                if any(feats[i].FeatureTag == "locl" for i in ls.LangSys.FeatureIndex):
                    out.add(ls.LangSysTag.strip())
    return out


def to_bytes(font: TTFont, flavor: str | None = None) -> bytes:
    buf = io.BytesIO()
    # 保存时默认会把 head.modified 改成当前时间,产物(和带哈希的文件名)每次都变;保留源字体的时间戳
    font.recalcTimestamp = False
    old = font.flavor
    font.flavor = flavor
    font.save(buf)
    font.flavor = old
    return buf.getvalue()


# ---------------- 3. 校验 ----------------


def hb_font(data: bytes, wght: int | None):
    f = hb.Font(hb.Face(hb.Blob(data)))
    if wght is not None:
        f.set_variations({"wght": wght})
    return f


def shape(font, text: str, features: dict, lang: str):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    if lang:
        buf.language = lang
    hb.shape(font, buf, features)
    return [(i.codepoint, p.x_advance, p.x_offset, p.y_offset) for i, p in zip(buf.glyph_infos, buf.glyph_positions)]


def segments(text: str, assign) -> list[tuple[str, str]]:
    """按「哪个字体文件负责这个字符」切段,Chrome 对每段单独排版。"""
    out: list[tuple[str, str]] = []
    for ch in text:
        k = assign(ord(ch))
        if out and out[-1][0] == k:
            out[-1] = (k, out[-1][1] + ch)
        else:
            out.append((k, ch))
    return out


def assigners(coverage: set[int], core: set[int], ext: set[int]):
    """旧:Google 按子集拆的文件;新:core / ext。返回「码位 → 由哪个文件绘制」的两个函数。"""
    google = [(name, parse_ranges(r)) for name, r in GOOGLE_SEGMENTS]

    def old_assign(cp):
        if cp not in coverage:
            return "fallback"
        for name, r in google:
            if cp in r:
                return name
        return "fallback"

    def new_assign(cp):
        return "core" if cp in core else "ext" if cp in ext else "fallback"

    return old_assign, new_assign


def verify(key: str, cfg: dict, src_by_face: dict, outputs: dict, usage: dict, coverage: set[int], core: set[int], ext: set[int]):
    problems = []
    old_assign, new_assign = assigners(coverage, core, ext)

    for face, parts in outputs.items():
        src = src_by_face[face]
        wght = face if cfg["variable"] else None
        ref = hb_font(src, wght)
        news = {part: hb_font(to_bytes(font), wght) for part, font in parts.items()}
        # (a) cmap 恰好等于计划的字符集
        for part, want in (("core", core), ("ext", ext)):
            got = set(parts[part].getBestCmap())
            if got != want:
                problems.append(f"{face} {part}: cmap 多 {sorted(got - want)[:5]} 少 {sorted(want - got)[:5]}")
        # (b) 垂直度量不变(决定行高)
        s = TTFont(io.BytesIO(src))
        for part, font in parts.items():
            for t, attrs in (("hhea", ("ascent", "descent", "lineGap", "advanceWidthMax", "minLeftSideBearing", "minRightSideBearing", "xMaxExtent")),
                             ("OS/2", ("sTypoAscender", "sTypoDescender", "sTypoLineGap", "usWinAscent", "usWinDescent", "fsSelection")),
                             ("head", ("unitsPerEm", "xMin", "yMin", "xMax", "yMax")), ("post", ("formatType",))):
                for a in attrs:
                    if getattr(font[t], a) != getattr(s[t], a):
                        problems.append(f"{face} {part}: {t}.{a} {getattr(s[t], a)} → {getattr(font[t], a)}")
        # (c) 轮廓与步进在实际使用的字重上一致
        src_inst = instancer.instantiateVariableFont(TTFont(io.BytesIO(src)), {"wght": face}) if wght else s
        for part, font in parts.items():
            out_inst = instancer.instantiateVariableFont(TTFont(io.BytesIO(to_bytes(font))), {"wght": face}) if wght else font
            gs_src, gs_out = src_inst.getGlyphSet(), out_inst.getGlyphSet()
            cm_src, cm_out = src_inst.getBestCmap(), out_inst.getBestCmap()
            for cp, gname in cm_out.items():
                a, b = DecomposingRecordingPen(gs_src), DecomposingRecordingPen(gs_out)
                gs_src[cm_src[cp]].draw(a)
                gs_out[gname].draw(b)
                if a.value != b.value or gs_src[cm_src[cp]].width != gs_out[gname].width:
                    problems.append(f"{face} {part}: U+{cp:04X} 轮廓/步进与源字体不同")
        # (d) 全站文本排版结果一致:旧 = 源字体按 Google 子集分段;新 = 产物按 core/ext 分段
        for run in usage["runs"]:
            if run["face"] != face:
                continue
            feats = {f: True for f in run["features"]} | {f: False for f in run["disabled"]}
            for text in run["texts"]:
                for word in text.split(" "):
                    old = [g for k, seg in segments(word, old_assign) if k != "fallback" for g in shape(ref, seg, feats, run["lang"])]
                    new = [g for k, seg in segments(word, new_assign) if k != "fallback" for g in shape(news[k], seg, feats, run["lang"])]
                    if [g[1:] for g in old] != [g[1:] for g in new] or len(old) != len(new):
                        problems.append(f"{face}: 「{word[:40]}」排版结果变化")
                        break
    return problems


# ---------------- 主流程 ----------------


def main():
    ap = argparse.ArgumentParser(description="按全站实际用量子集化 Web 字体")
    ap.add_argument("--no-build", action="store_true", help="跳过 pnpm build,直接抓现有 dist/")
    ap.add_argument("--strip-hinting", action="store_true", help="去掉 Plex Mono 的 TrueType hinting(会改变 Windows 渲染)")
    ap.add_argument("--limit-axes", action="store_true", help="把 wght 轴收窄到实际用到的范围(省约 0.25 KB,轮廓有 ±1 单位取整误差)")
    args = ap.parse_args()

    if not args.no_build:
        print("▸ pnpm build")
        subprocess.run(["pnpm", "build"], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
    print("▸ 抓取全站用量", end=" ")
    usage = analyse(crawl(DIST))
    extra_chars = source_chars()

    OUT_FONTS.mkdir(parents=True, exist_ok=True)
    css = ["/* 由 scripts/subset-fonts.py 生成,勿手改。何时重跑见脚本文件头。 */"]
    report: dict = {"generatedBy": "scripts/subset-fonts.py", "preload": [], "families": {}}
    written: set[str] = set()
    all_problems = []

    for key, cfg in FAMILIES.items():
        u = usage[key]
        coverage = parse_ranges(GOOGLE_COVERAGE[key])
        used = set(u["pages"])
        # 当前页面实际绘制、且原先与 ASCII 同在 Google latin 文件里的字符都进 core,而不只是「多数页面」用到的:
        # ① 不同文件的字符会被切成不同排版段,ext 里的 × / •(列表标记)即使字形相同也有亚像素级差异(实测),
        #    原先同文件的字偶距(如 T–é)也会丢;② 也更省:一个字形约 60–100 B,留在 ext 会让用到它的页面多下 ~15 KB。
        # 反过来,原先在 latin-ext 等文件里的字符(如 ť)本来就不与 ASCII 互相排版,并进 core 反而会多出字偶距 → 留在 ext。
        latin_file = parse_ranges(GOOGLE_SEGMENTS[0][1])
        core = (ASCII | CORE_PUNCT | (used & latin_file)) & coverage
        # 用户要求的 Latin-1 + Latin Extended-A,外加原 Google latin 文件里的常用符号(€ ™ „ ‹ › † ′ ″ 等),
        # 后者只多约 1 KB 且只在用到时下载,保证新文章用到它们时仍由本字体绘制
        wanted_ext = LATIN1_EXT_A | latin_file | used | (extra_chars & coverage)
        if u["hyphens_auto"]:
            wanted_ext |= {0x2010, 0x2D}
        ext = (wanted_ext & coverage) - core
        sources = {face: fetch(url, cfg["sha256"][url.rsplit("/", 1)[1]]) for face, url in cfg["faces"].items()}
        dropped_used = sorted(cp for cp in used if cp not in coverage and cp > 0x7F and not 0x2E80 <= cp <= 0xFFEF)

        served = font_features(next(iter(sources.values())))
        on = DEFAULT_FEATURES | u["features"]
        page_langs = {OT_LANG.get(lang, "?") for lang in u["langs"]}
        if "locl" in served and not (locl_langs(next(iter(sources.values()))) & page_langs) and "?" not in page_langs:
            on.discard("locl")
        # Google 下发版本已去掉的特性不能「加回来」,否则同样会改变渲染
        google_served = {"space-grotesk": {"ccmp", "dnom", "frac", "kern", "liga", "locl", "mark", "mkmk", "numr", "pnum", "tnum"},
                         "jade-mono": {"ccmp", "dnom", "frac", "mark", "numr"}}[key]
        features = sorted(served & google_served & on)

        used_faces = sorted(u["faces"])
        axis = None
        if cfg["variable"]:
            # 只有离散字重会被请求,可把轴收窄到实际用到的最小~最大(只用一个字重时才固定)。
            # 但默认值 300 不在 400–700 内,收窄会重建默认母版并把坐标取整,轮廓偏差 ±1 单位(15px 下 0.015px),
            # 只省约 0.25 KB → 默认不做,需 --limit-axes 显式开启(校验会报告轮廓差异)。
            lo, hi = min(used_faces), max(used_faces)
            axis = {"wght": lo if lo == hi else (lo, hi)} if args.limit_axes else None
            faces_to_build = {"var": sources[used_faces[0]]}
        else:
            faces_to_build = {face: sources[face] for face in cfg["faces"]}

        keep_hinting = not args.strip_hinting
        outputs, files = {}, {}
        for face, data in faces_to_build.items():
            w = face if face != "var" else 400
            parts = {part: build_font(data, cps, features, keep_hinting, axis, cfg["rename"], w) for part, cps in (("core", core), ("ext", ext))}
            for part, font in parts.items():
                blob = to_bytes(font, "woff2")
                name = f"{key}{'' if face == 'var' else f'-{face}'}-{part}.{hashlib.sha256(blob).hexdigest()[:8]}.woff2"
                (OUT_FONTS / name).write_bytes(blob)
                written.add(name)
                files[(face, part)] = (name, blob, set(font.getBestCmap()))
            if face == "var":
                for f in used_faces:
                    outputs[f] = parts
            else:
                outputs[face] = parts
        if cfg["rename"]:
            for (face, part), (name, blob, _) in files.items():
                f = TTFont(io.BytesIO(blob))
                bad = [str(r) for r in f["name"].names if "plex" in str(r).lower()]
                if bad:
                    all_problems.append(f"{name}: 名称表仍含 Reserved Font Name: {bad}")

        # 校验时「源」用未收窄轴、未子集化的原文件
        src_by_face = {f: sources[f] for f in outputs}
        all_problems += [f"{key} {p}" for p in verify(key, cfg, src_by_face, outputs, u, coverage, core, ext)]

        # CSS:每个字重一条 core + 一条 ext,unicode-range 取自产物实际 cmap
        lic_url, lic_sha = cfg["license"]
        lic_name = f"OFL-{key}.txt"
        (OUT_FONTS / lic_name).write_bytes(fetch(lic_url, lic_sha))
        written.add(lic_name)
        fam_report = {"cssFamily": cfg["css_family"], "pagesUsing": u["page_count"], "faces": {}, "features": features,
                      "axis": axis, "hinting": keep_hinting, "fellBackBeforeToo": "".join(map(chr, dropped_used)), "files": {}}
        for face in cfg["faces"]:
            src_face = "var" if cfg["variable"] else face
            for part in ("core", "ext"):
                name, blob, cps = files[(src_face, part)]
                css.append(
                    "@font-face {\n"
                    f'  font-family: "{cfg["css_family"]}";\n'
                    "  font-style: normal;\n"
                    f"  font-weight: {face};\n"
                    "  font-display: swap;\n"
                    f'  src: url("{URL_PREFIX}{name}") format("woff2");\n'
                    f"  unicode-range: {format_unicode_range(cps)};\n"
                    "}"
                )
                fam_report["files"][name] = {"bytes": len(blob), "glyphs": TTFont(io.BytesIO(blob))["maxp"].numGlyphs, "chars": len(cps)}
            fam_report["faces"][face] = u["faces"].get(face, 0)
        # 预加载:每个被抓取页面都用到的字重,预加载它的 core
        for face in cfg["faces"]:
            src_face = "var" if cfg["variable"] else face
            href = URL_PREFIX + files[(src_face, "core")][0]
            if u["page_count"] == usage["_total"] and face in used_faces and href not in report["preload"]:
                report["preload"].append(href)
        report["families"][key] = fam_report

    for old in OUT_FONTS.iterdir():
        if old.name not in written:
            old.unlink()
    OUT_CSS.write_text("\n".join(css) + "\n")
    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    # 与 `pnpm check` 的 oxfmt 保持一致,否则每次重跑都会出现纯格式差异
    subprocess.run(["pnpm", "exec", "oxfmt", str(OUT_CSS), str(OUT_JSON)], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)

    print("\n▸ 产物")
    for fam in report["families"].values():
        for name, meta in fam["files"].items():
            print(f"  {name:48} {meta['bytes']:>7} B  {meta['glyphs']:>4} glyphs  {meta['chars']:>4} chars")
    print("  preload:", ", ".join(report["preload"]))
    if all_problems:
        print("\n✗ 校验失败:")
        for p in all_problems[:40]:
            print("  ", p)
        sys.exit(1)
    print("✓ 校验通过:cmap、垂直度量、轮廓/步进、全站文本排版与原 Google Fonts 一致")


if __name__ == "__main__":
    main()
