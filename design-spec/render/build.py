"""Render a design spec as a single HTML page.

    python3 design-spec/render/build.py design-spec/shupp.spec.json out.html

Role colors come straight from the spec's tokens.color.role, one CSS block per
mode. The few extra variables below exist only for the reference page itself
(wireframe paper, code colors, pass/fail tints) and are not part of the spec.
"""
import base64
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent

spec_path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / "shupp.spec.json")
out_path = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else HERE / "index.html")

spec = json.loads(spec_path.read_text())
template = json.loads((HERE.parent / "template.spec.json").read_text())
tokens = spec["tokens"]


def lookup(path):
    node = tokens
    for key in path.split("."):
        node = node[key]
    return node


def resolve(value, mode):
    def sub(match):
        node = lookup(match.group(1))
        if isinstance(node, str):
            return resolve(node, mode)
        if "$value" in node:
            return resolve(node["$value"], mode)
        return resolve(node[mode], mode)

    return re.sub(r"\{([^}]+)\}", sub, value)


def mode_vars(mode):
    out = {}
    for name, b in tokens["color"]["brand"].items():
        out[b["css"]] = b["$value"]
    for name, r in tokens["color"]["role"].items():
        css = r.get("css") or "--" + re.sub(r"([A-Z])", r"-\1", name).lower()
        out[css] = resolve(r[mode], mode)
    out["--eyebrow"] = resolve(tokens["color"]["role"]["eyebrow"][mode], mode)
    out["--card-shadow"] = tokens["shadow"]["card"][mode]
    out["--focus-ring"] = tokens["shadow"]["focusRing"][mode]
    out["--heading-ink"] = resolve(tokens["color"]["gradient"]["headingInk"][mode], mode)

    btn = spec["components"]["button"]["variants"]
    out["--btn-primary-bg"] = resolve(btn["primary"][mode]["bg"], mode)
    out["--btn-primary-fg"] = resolve(btn["primary"][mode]["fg"], mode)
    out["--btn-secondary-bg"] = resolve(btn["secondary"][mode]["bg"], mode)
    out["--btn-secondary-fg"] = resolve(btn["secondary"][mode]["fg"], mode)
    out["--btn-secondary-border"] = resolve(btn["secondary"][mode]["border"].split(" ", 1)[1], mode)

    if mode == "light":
        out.update({
            "--btn-primary-hover": out["--color-dark"],
            "--btn-secondary-hover-fg": out["--color-light"],
            "--nav-frost": "rgba(255,255,255,0.92)",
            "--nav-text": out["--color-secondary"],
            "--nav-active": "linear-gradient(135deg, rgba(121,148,150,0.16), rgba(172,193,150,0.12))",
            "--hero-title": out["--color-secondary"],
            "--wf-bg": "#f4f5f3", "--wf-dot": "rgba(73,71,91,0.14)", "--wf-line": "#9aa3a4",
            "--wf-fill": "rgba(255,255,255,0.7)", "--wf-ink": "#49475B",
            "--code-bg": "#fbfbfa", "--code-fg": "#14080E", "--code-key": "#49475B",
            "--code-str": "#4f6b52", "--code-num": "#8a5a2b",
            "--ok": "#3f6136", "--ok-tint": "rgba(172,193,150,0.3)",
            "--warn": "#7a5d0b", "--warn-tint": "rgba(233,235,158,0.55)",
            "--bad": "#9b2f2f", "--bad-tint": "rgba(155,47,47,0.1)",
        })
    else:
        out.update({
            "--btn-primary-hover": out["--color-light"],
            "--btn-secondary-hover-fg": out["--color-dark"],
            "--nav-frost": "rgba(28,28,35,0.92)",
            "--nav-text": out["--text-muted"],
            "--nav-active": "linear-gradient(135deg, rgba(233,235,158,0.14), rgba(172,193,150,0.08))",
            "--hero-title": out["--color-accent"],
            "--wf-bg": "#1b1b22", "--wf-dot": "rgba(233,235,158,0.08)", "--wf-line": "#6d6d7c",
            "--wf-fill": "rgba(35,35,43,0.7)", "--wf-ink": "#a5a5b5",
            "--code-bg": "#1a1a22", "--code-fg": "#e6e7ea", "--code-key": "#E9EB9E",
            "--code-str": "#ACC196", "--code-num": "#e3b98a",
            "--ok": "#ACC196", "--ok-tint": "rgba(172,193,150,0.16)",
            "--warn": "#E9EB9E", "--warn-tint": "rgba(233,235,158,0.14)",
            "--bad": "#f0a3a3", "--bad-tint": "rgba(240,163,163,0.14)",
        })
    return out


def block(selector, values, scheme):
    lines = "".join(f"  {k}: {v};\n" for k, v in values.items())
    return f"{selector} {{\n{lines}  color-scheme: {scheme};\n}}\n"


light, dark = mode_vars("light"), mode_vars("dark")
root_css = (
    block(":root", light, "light")
    + "@media (prefers-color-scheme: dark) {\n"
    + block(':root:not([data-theme="light"])', dark, "dark")
    + "}\n"
    + block(':root[data-theme="dark"]', dark, "dark")
)

font = base64.b64encode((ROOT / "public/fonts/Shupp.otf").read_bytes()).decode()
page = (HERE / "page.template.html").read_text()
page = (
    page.replace("__ROOTCSS__", root_css)
    .replace("__FONT__", font)
    .replace("__SPEC__", spec_path.read_text().replace("</", "<\\/"))
    .replace("__TEMPLATE__", (HERE.parent / "template.spec.json").read_text().replace("</", "<\\/"))
)
out_path.write_text(page)
print(f"wrote {out_path} ({len(page) // 1024} KB)")
