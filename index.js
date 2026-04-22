// svg2pntr - convert SVG to pntr C drawing commands

import { DOMParser } from '@xmldom/xmldom'

// Arg counts for each SVG path command
const CMD_ARGS = {
  M:2, m:2, L:2, l:2, H:1, h:1, V:1, v:1,
  C:6, c:6, S:4, s:4, Q:4, q:4, T:2, t:2,
  A:7, a:7, Z:0, z:0
}

// CSS named colors
const NAMED_COLORS = {
  aliceblue:[240,248,255],antiquewhite:[250,235,215],aqua:[0,255,255],
  aquamarine:[127,255,212],azure:[240,255,255],beige:[245,245,220],
  bisque:[255,228,196],black:[0,0,0],blanchedalmond:[255,235,205],
  blue:[0,0,255],blueviolet:[138,43,226],brown:[165,42,42],
  burlywood:[222,184,135],cadetblue:[95,158,160],chartreuse:[127,255,0],
  chocolate:[210,105,30],coral:[255,127,80],cornflowerblue:[100,149,237],
  cornsilk:[255,248,220],crimson:[220,20,60],cyan:[0,255,255],
  darkblue:[0,0,139],darkcyan:[0,139,139],darkgoldenrod:[184,134,11],
  darkgray:[169,169,169],darkgreen:[0,100,0],darkgrey:[169,169,169],
  darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],
  darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],
  darksalmon:[233,150,122],darkseagreen:[143,188,143],darkslateblue:[72,61,139],
  darkslategray:[47,79,79],darkslategrey:[47,79,79],darkturquoise:[0,206,209],
  darkviolet:[148,0,211],deeppink:[255,20,147],deepskyblue:[0,191,255],
  dimgray:[105,105,105],dimgrey:[105,105,105],dodgerblue:[30,144,255],
  firebrick:[178,34,34],floralwhite:[255,250,240],forestgreen:[34,139,34],
  fuchsia:[255,0,255],gainsboro:[220,220,220],ghostwhite:[248,248,255],
  gold:[255,215,0],goldenrod:[218,165,32],gray:[128,128,128],
  green:[0,128,0],greenyellow:[173,255,47],grey:[128,128,128],
  honeydew:[240,255,240],hotpink:[255,105,180],indianred:[205,92,92],
  indigo:[75,0,130],ivory:[255,255,240],khaki:[240,230,140],
  lavender:[230,230,250],lavenderblush:[255,240,245],lawngreen:[124,252,0],
  lemonchiffon:[255,250,205],lightblue:[173,216,230],lightcoral:[240,128,128],
  lightcyan:[224,255,255],lightgoldenrodyellow:[250,250,210],lightgray:[211,211,211],
  lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],
  lightsalmon:[255,160,122],lightseagreen:[32,178,170],lightskyblue:[135,206,250],
  lightslategray:[119,136,153],lightslategrey:[119,136,153],lightsteelblue:[176,196,222],
  lightyellow:[255,255,224],lime:[0,255,0],limegreen:[50,205,50],
  linen:[250,240,230],magenta:[255,0,255],maroon:[128,0,0],
  mediumaquamarine:[102,205,170],mediumblue:[0,0,205],mediumorchid:[186,85,211],
  mediumpurple:[147,112,219],mediumseagreen:[60,179,113],mediumslateblue:[123,104,238],
  mediumspringgreen:[0,250,154],mediumturquoise:[72,209,204],mediumvioletred:[199,21,133],
  midnightblue:[25,25,112],mintcream:[245,255,250],mistyrose:[255,228,225],
  moccasin:[255,228,181],navajowhite:[255,222,173],navy:[0,0,128],
  oldlace:[253,245,230],olive:[128,128,0],olivedrab:[107,142,35],
  orange:[255,165,0],orangered:[255,69,0],orchid:[218,112,214],
  palegoldenrod:[238,232,170],palegreen:[152,251,152],paleturquoise:[175,238,238],
  palevioletred:[219,112,147],papayawhip:[255,239,213],peachpuff:[255,218,185],
  peru:[205,133,63],pink:[255,192,203],plum:[221,160,221],
  powderblue:[176,224,230],purple:[128,0,128],rebeccapurple:[102,51,153],
  red:[255,0,0],rosybrown:[188,143,143],royalblue:[65,105,225],
  saddlebrown:[139,69,19],salmon:[250,128,114],sandybrown:[244,164,96],
  seagreen:[46,139,87],seashell:[255,245,238],sienna:[160,82,45],
  silver:[192,192,192],skyblue:[135,206,235],slateblue:[106,90,205],
  slategray:[112,128,144],slategrey:[112,128,144],snow:[255,250,250],
  springgreen:[0,255,127],steelblue:[70,130,180],tan:[210,180,140],
  teal:[0,128,128],thistle:[216,191,216],tomato:[255,99,71],
  turquoise:[64,224,208],violet:[238,130,238],wheat:[245,222,179],
  white:[255,255,255],whitesmoke:[245,245,245],yellow:[255,255,0],
  yellowgreen:[154,205,50]
}

function parseColor(str) {
  if (!str || str === 'none' || str === 'transparent') return null
  str = str.trim().toLowerCase()
  if (str === 'currentcolor') return null
  if (str in NAMED_COLORS) {
    const [r, g, b] = NAMED_COLORS[str]
    return { r, g, b, a: 255 }
  }
  if (str.startsWith('#')) {
    let hex = str.slice(1)
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
    if (hex.length === 4) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3]
    if (hex.length === 6) hex += 'ff'
    const n = parseInt(hex, 16)
    return { r: (n>>24)&255, g: (n>>16)&255, b: (n>>8)&255, a: n&255 }
  }
  const rgbaM = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (rgbaM) {
    return {
      r: parseInt(rgbaM[1]), g: parseInt(rgbaM[2]), b: parseInt(rgbaM[3]),
      a: rgbaM[4] !== undefined ? Math.round(parseFloat(rgbaM[4]) * 255) : 255
    }
  }
  const prgbaM = str.match(/rgba?\(\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/)
  if (prgbaM) {
    return {
      r: Math.round(parseFloat(prgbaM[1]) * 2.55),
      g: Math.round(parseFloat(prgbaM[2]) * 2.55),
      b: Math.round(parseFloat(prgbaM[3]) * 2.55),
      a: prgbaM[4] !== undefined ? Math.round(parseFloat(prgbaM[4]) * 255) : 255
    }
  }
  return null
}

function colorToC(color) {
  return `pntr_new_color(${color.r}, ${color.g}, ${color.b}, ${color.a})`
}

// ---- 2D affine matrix [a,b,c,d,e,f]: x'=ax+cy+e, y'=bx+dy+f ----
const MAT_IDENTITY = [1, 0, 0, 1, 0, 0]

function matMul(m1, m2) {
  const [a1,b1,c1,d1,e1,f1] = m1
  const [a2,b2,c2,d2,e2,f2] = m2
  return [
    a1*a2 + c1*b2,
    b1*a2 + d1*b2,
    a1*c2 + c1*d2,
    b1*c2 + d1*d2,
    a1*e2 + c1*f2 + e1,
    b1*e2 + d1*f2 + f1
  ]
}

function matTransform(m, x, y) {
  const [a,b,c,d,e,f] = m
  return { x: a*x + c*y + e, y: b*x + d*y + f }
}

function parseTransform(str) {
  if (!str) return MAT_IDENTITY
  let m = MAT_IDENTITY
  const re = /(\w+)\s*\(([^)]+)\)/g
  let match
  while ((match = re.exec(str)) !== null) {
    const name = match[1]
    const args = match[2].trim().split(/[\s,]+/).map(Number)
    let t
    switch (name) {
      case 'matrix':
        t = [args[0], args[1], args[2], args[3], args[4], args[5]]
        break
      case 'translate':
        t = [1, 0, 0, 1, args[0], args[1] ?? 0]
        break
      case 'scale':
        t = [args[0], 0, 0, args[1] ?? args[0], 0, 0]
        break
      case 'rotate': {
        const rad = args[0] * Math.PI / 180
        const cos = Math.cos(rad), sin = Math.sin(rad)
        const cx = args[1] ?? 0, cy = args[2] ?? 0
        t = [cos, sin, -sin, cos, cx*(1-cos)+cy*sin, cy*(1-cos)-cx*sin]
        break
      }
      case 'skewX':
        t = [1, 0, Math.tan(args[0] * Math.PI / 180), 1, 0, 0]
        break
      case 'skewY':
        t = [1, Math.tan(args[0] * Math.PI / 180), 0, 1, 0, 0]
        break
      default: continue
    }
    m = matMul(m, t)
  }
  return m
}

// ---- Style resolution ----
function parseStyleAttr(str) {
  const result = {}
  if (!str) return result
  for (const part of str.split(';')) {
    const idx = part.indexOf(':')
    if (idx === -1) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    if (k) result[k] = v
  }
  return result
}

function resolveStyle(el, inherited) {
  const style = { ...inherited }
  const presentationAttrs = [
    'fill', 'stroke', 'stroke-width', 'opacity',
    'fill-opacity', 'stroke-opacity', 'fill-rule'
  ]
  for (const attr of presentationAttrs) {
    const val = el.getAttribute && el.getAttribute(attr)
    if (val) style[attr] = val
  }
  const styleStr = el.getAttribute && el.getAttribute('style')
  if (styleStr) Object.assign(style, parseStyleAttr(styleStr))
  return style
}

function getFillColor(style) {
  const c = parseColor(style.fill ?? 'black')
  if (!c) return null
  const op = parseFloat(style.opacity ?? 1) * parseFloat(style['fill-opacity'] ?? 1)
  c.a = Math.min(255, Math.round(c.a * op))
  return c
}

function getStrokeColor(style) {
  const c = parseColor(style.stroke ?? 'none')
  if (!c) return null
  const op = parseFloat(style.opacity ?? 1) * parseFloat(style['stroke-opacity'] ?? 1)
  c.a = Math.min(255, Math.round(c.a * op))
  return c
}

// ---- SVG path data parsing ----
function parsePathData(d) {
  const tokens = []
  const re = /([MmLlHhVvCcSsQqTtAaZz])|([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/g
  let m
  while ((m = re.exec(d)) !== null) {
    if (m[1]) tokens.push({ t: 'c', v: m[1] })
    else tokens.push({ t: 'n', v: parseFloat(m[2]) })
  }

  const cmds = []
  let i = 0
  while (i < tokens.length) {
    if (tokens[i].t !== 'c') { i++; continue }
    const cmd = tokens[i++].v
    const n = CMD_ARGS[cmd]
    if (n === 0) { cmds.push({ cmd, args: [] }); continue }

    let firstOfCmd = true
    while (i < tokens.length && tokens[i].t === 'n') {
      const args = []
      for (let j = 0; j < n && i < tokens.length && tokens[i].t === 'n'; j++) {
        args.push(tokens[i++].v)
      }
      if (args.length < n) break
      // Implicit lineto after moveto
      let effectiveCmd = cmd
      if (!firstOfCmd) {
        if (cmd === 'M') effectiveCmd = 'L'
        else if (cmd === 'm') effectiveCmd = 'l'
      }
      cmds.push({ cmd: effectiveCmd, args })
      firstOfCmd = false
    }
  }
  return cmds
}

// ---- Curve tessellation ----
function flattenCubic(x0, y0, x1, y1, x2, y2, x3, y3, pts, tol = 0.5) {
  const ux = 3*x1 - 2*x0 - x3, uy = 3*y1 - 2*y0 - y3
  const vx = 3*x2 - 2*x3 - x0, vy = 3*y2 - 2*y3 - y0
  if (Math.max(ux*ux+uy*uy, vx*vx+vy*vy) <= tol*tol*16) {
    pts.push({ x: x3, y: y3 })
    return
  }
  const x01=(x0+x1)/2, y01=(y0+y1)/2
  const x12=(x1+x2)/2, y12=(y1+y2)/2
  const x23=(x2+x3)/2, y23=(y2+y3)/2
  const x012=(x01+x12)/2, y012=(y01+y12)/2
  const x123=(x12+x23)/2, y123=(y12+y23)/2
  const xm=(x012+x123)/2, ym=(y012+y123)/2
  flattenCubic(x0,y0, x01,y01, x012,y012, xm,ym, pts, tol)
  flattenCubic(xm,ym, x123,y123, x23,y23, x3,y3, pts, tol)
}

function flattenQuadratic(x0, y0, x1, y1, x2, y2, pts, tol = 0.5) {
  // elevate to cubic
  flattenCubic(
    x0, y0,
    x0 + 2*(x1-x0)/3, y0 + 2*(y1-y0)/3,
    x2 + 2*(x1-x2)/3, y2 + 2*(y1-y2)/3,
    x2, y2,
    pts, tol
  )
}

function vecAngle(ux, uy, vx, vy) {
  const d = Math.sqrt(ux*ux+uy*uy) * Math.sqrt(vx*vx+vy*vy)
  let a = Math.acos(Math.max(-1, Math.min(1, (ux*vx+uy*vy)/d)))
  if (ux*vy - uy*vx < 0) a = -a
  return a
}

function flattenArc(x1, y1, rx, ry, xrot, largeArc, sweep, x2, y2, pts) {
  if (rx === 0 || ry === 0) { pts.push({ x: x2, y: y2 }); return }
  rx = Math.abs(rx); ry = Math.abs(ry)
  const phi = xrot * Math.PI / 180
  const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi)
  const dx = (x1-x2)/2, dy = (y1-y2)/2
  const x1p =  cosPhi*dx + sinPhi*dy
  const y1p = -sinPhi*dx + cosPhi*dy
  const lam = x1p*x1p/(rx*rx) + y1p*y1p/(ry*ry)
  if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s }
  const rx2=rx*rx, ry2=ry*ry, x1p2=x1p*x1p, y1p2=y1p*y1p
  let sq = (rx2*ry2 - rx2*y1p2 - ry2*x1p2) / (rx2*y1p2 + ry2*x1p2)
  sq = sq < 0 ? 0 : Math.sqrt(sq)
  const sign = largeArc === sweep ? -1 : 1
  const cxp = sign*sq*rx*y1p/ry
  const cyp = -sign*sq*ry*x1p/rx
  const cx = cosPhi*cxp - sinPhi*cyp + (x1+x2)/2
  const cy = sinPhi*cxp + cosPhi*cyp + (y1+y2)/2
  const theta1 = vecAngle(1, 0, (x1p-cxp)/rx, (y1p-cyp)/ry)
  let dtheta = vecAngle((x1p-cxp)/rx, (y1p-cyp)/ry, (-x1p-cxp)/rx, (-y1p-cyp)/ry)
  if (!sweep && dtheta > 0) dtheta -= 2*Math.PI
  if (sweep && dtheta < 0) dtheta += 2*Math.PI
  const steps = Math.max(4, Math.ceil(Math.abs(dtheta) * Math.max(rx,ry) / 0.5))
  for (let i = 1; i <= steps; i++) {
    const theta = theta1 + (i/steps)*dtheta
    pts.push({
      x: cosPhi*rx*Math.cos(theta) - sinPhi*ry*Math.sin(theta) + cx,
      y: sinPhi*rx*Math.cos(theta) + cosPhi*ry*Math.sin(theta) + cy
    })
  }
}

// ---- Path flattening: commands → subpaths of {x,y} points ----
function flattenPath(commands, matrix) {
  const subpaths = []
  let pts = []
  let cx = 0, cy = 0
  let mx = 0, my = 0       // last moveto (for Z)
  let lcx = 0, lcy = 0    // last cubic control point (for S/s)
  let lqx = 0, lqy = 0    // last quadratic control point (for T/t)
  let lastCmd = ''

  function addRaw(x, y) {
    const p = matTransform(matrix, x, y)
    pts.push(p)
  }

  function addSeg(seg) {
    for (const p of seg) {
      const t = matTransform(matrix, p.x, p.y)
      pts.push(t)
    }
  }

  function flush(closed) {
    if (pts.length > 1) subpaths.push({ pts: [...pts], closed })
    pts = []
  }

  for (const { cmd, args } of commands) {
    switch (cmd) {
      case 'M': flush(false); addRaw(args[0],args[1]); cx=args[0]; cy=args[1]; mx=cx; my=cy; break
      case 'm': flush(false); cx+=args[0]; cy+=args[1]; addRaw(cx,cy); mx=cx; my=cy; break
      case 'L': addRaw(args[0],args[1]); cx=args[0]; cy=args[1]; break
      case 'l': cx+=args[0]; cy+=args[1]; addRaw(cx,cy); break
      case 'H': cx=args[0]; addRaw(cx,cy); break
      case 'h': cx+=args[0]; addRaw(cx,cy); break
      case 'V': cy=args[0]; addRaw(cx,cy); break
      case 'v': cy+=args[0]; addRaw(cx,cy); break
      case 'Z': case 'z': flush(true); cx=mx; cy=my; break
      case 'C': {
        const [x1,y1,x2,y2,x3,y3] = args
        const seg = []; flattenCubic(cx,cy,x1,y1,x2,y2,x3,y3,seg)
        addSeg(seg); lcx=x2; lcy=y2; cx=x3; cy=y3; break
      }
      case 'c': {
        const [dx1,dy1,dx2,dy2,dx3,dy3] = args
        const [x1,y1,x2,y2,x3,y3] = [cx+dx1,cy+dy1,cx+dx2,cy+dy2,cx+dx3,cy+dy3]
        const seg = []; flattenCubic(cx,cy,x1,y1,x2,y2,x3,y3,seg)
        addSeg(seg); lcx=x2; lcy=y2; cx=x3; cy=y3; break
      }
      case 'S': {
        const x1 = /[CcSs]/.test(lastCmd) ? 2*cx-lcx : cx
        const y1 = /[CcSs]/.test(lastCmd) ? 2*cy-lcy : cy
        const [x2,y2,x3,y3] = args
        const seg = []; flattenCubic(cx,cy,x1,y1,x2,y2,x3,y3,seg)
        addSeg(seg); lcx=x2; lcy=y2; cx=x3; cy=y3; break
      }
      case 's': {
        const x1 = /[CcSs]/.test(lastCmd) ? 2*cx-lcx : cx
        const y1 = /[CcSs]/.test(lastCmd) ? 2*cy-lcy : cy
        const [dx2,dy2,dx3,dy3] = args
        const [x2,y2,x3,y3] = [cx+dx2,cy+dy2,cx+dx3,cy+dy3]
        const seg = []; flattenCubic(cx,cy,x1,y1,x2,y2,x3,y3,seg)
        addSeg(seg); lcx=x2; lcy=y2; cx=x3; cy=y3; break
      }
      case 'Q': {
        const [x1,y1,x2,y2] = args
        const seg = []; flattenQuadratic(cx,cy,x1,y1,x2,y2,seg)
        addSeg(seg); lqx=x1; lqy=y1; cx=x2; cy=y2; break
      }
      case 'q': {
        const [dx1,dy1,dx2,dy2] = args
        const [x1,y1,x2,y2] = [cx+dx1,cy+dy1,cx+dx2,cy+dy2]
        const seg = []; flattenQuadratic(cx,cy,x1,y1,x2,y2,seg)
        addSeg(seg); lqx=x1; lqy=y1; cx=x2; cy=y2; break
      }
      case 'T': {
        const x1 = /[QqTt]/.test(lastCmd) ? 2*cx-lqx : cx
        const y1 = /[QqTt]/.test(lastCmd) ? 2*cy-lqy : cy
        const [x2,y2] = args
        const seg = []; flattenQuadratic(cx,cy,x1,y1,x2,y2,seg)
        addSeg(seg); lqx=x1; lqy=y1; cx=x2; cy=y2; break
      }
      case 't': {
        const x1 = /[QqTt]/.test(lastCmd) ? 2*cx-lqx : cx
        const y1 = /[QqTt]/.test(lastCmd) ? 2*cy-lqy : cy
        const [dx2,dy2] = args
        const [x2,y2] = [cx+dx2,cy+dy2]
        const seg = []; flattenQuadratic(cx,cy,x1,y1,x2,y2,seg)
        addSeg(seg); lqx=x1; lqy=y1; cx=x2; cy=y2; break
      }
      case 'A': {
        const [rx,ry,xr,la,sw,x2,y2] = args
        const seg = []; flattenArc(cx,cy,rx,ry,xr,la,sw,x2,y2,seg)
        addSeg(seg); cx=x2; cy=y2; break
      }
      case 'a': {
        const [rx,ry,xr,la,sw,dx,dy] = args
        const [x2,y2] = [cx+dx,cy+dy]
        const seg = []; flattenArc(cx,cy,rx,ry,xr,la,sw,x2,y2,seg)
        addSeg(seg); cx=x2; cy=y2; break
      }
    }
    lastCmd = cmd
  }
  flush(false)
  return subpaths
}

// ---- C code emission ----
function ptsToC(pts) {
  return pts.map(p => `{${Math.round(p.x)},${Math.round(p.y)}}`).join(',')
}

function emitSubpath(lines, subpath, fill, stroke, idx, id) {
  const { pts, closed } = subpath
  if (pts.length < 2) return
  const n = pts.length
  lines.push(`    {${id ? ` // #${id}` : ''}`)
  lines.push(`        pntr_vector _p${idx}[] = {${ptsToC(pts)}};`)
  if (fill)   lines.push(`        pntr_draw_polygon_fill(dst, _p${idx}, ${n}, ${colorToC(fill)});`)
  if (stroke) lines.push(`        pntr_draw_${closed ? 'polygon' : 'polyline'}(dst, _p${idx}, ${n}, ${colorToC(stroke)});`)
  lines.push(`    }`)
}

function ptsFromPointsAttr(str, matrix) {
  const nums = str.trim().split(/[\s,]+/).map(Number)
  const pts = []
  for (let i = 0; i+1 < nums.length; i += 2) {
    pts.push(matTransform(matrix, nums[i], nums[i+1]))
  }
  return pts
}

function processElement(el, matrix, inheritedStyle, lines, counter) {
  if (!el.tagName) return
  const tag = el.tagName.replace(/^[^:]*:/, '')
  const localMatrix = matMul(matrix, parseTransform(el.getAttribute && el.getAttribute('transform')))
  const style = resolveStyle(el, inheritedStyle)
  const fill = getFillColor(style)
  const stroke = getStrokeColor(style)
  const num = name => parseFloat((el.getAttribute && el.getAttribute(name)) || '0') || 0
  const id = el.getAttribute && el.getAttribute('id')

  switch (tag) {
    case 'path': {
      const d = el.getAttribute('d')
      if (!d) break
      let first = true
      for (const sp of flattenPath(parsePathData(d), localMatrix)) {
        emitSubpath(lines, sp, fill, stroke, counter.i++, first ? id : null)
        first = false
      }
      break
    }
    case 'rect': {
      const x=num('x'), y=num('y'), w=num('width'), h=num('height')
      if (w <= 0 || h <= 0) break
      const rx = Math.min((num('rx') || num('ry') || 0), w/2)
      const ry = Math.min((num('ry') || num('rx') || 0), h/2)
      let pts
      if (rx > 0 || ry > 0) {
        pts = []
        const steps = 8
        function arcCorner(acx, acy, arx, ary, startDeg, endDeg) {
          for (let i = 0; i <= steps; i++) {
            const t = (startDeg + (endDeg-startDeg)*i/steps) * Math.PI/180
            pts.push(matTransform(localMatrix, acx+arx*Math.cos(t), acy+ary*Math.sin(t)))
          }
        }
        arcCorner(x+w-rx, y+ry,   rx, ry, -90, 0)
        arcCorner(x+w-rx, y+h-ry, rx, ry,   0, 90)
        arcCorner(x+rx,   y+h-ry, rx, ry,  90, 180)
        arcCorner(x+rx,   y+ry,   rx, ry, 180, 270)
      } else {
        pts = [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([px,py]) => matTransform(localMatrix,px,py))
      }
      emitSubpath(lines, { pts, closed: true }, fill, stroke, counter.i++, id)
      break
    }
    case 'circle': {
      const cx=num('cx'), cy=num('cy'), r=num('r')
      if (r <= 0) break
      const c = matTransform(localMatrix, cx, cy)
      const [a,b] = localMatrix
      const cr = Math.round(r * Math.sqrt(a*a+b*b))
      lines.push(`    {${id ? ` // #${id}` : ''}`)
      if (fill)   lines.push(`        pntr_draw_circle_fill(dst, ${Math.round(c.x)}, ${Math.round(c.y)}, ${cr}, ${colorToC(fill)});`)
      if (stroke) lines.push(`        pntr_draw_circle(dst, ${Math.round(c.x)}, ${Math.round(c.y)}, ${cr}, ${colorToC(stroke)});`)
      lines.push(`    }`)
      break
    }
    case 'ellipse': {
      const cx=num('cx'), cy=num('cy'), rx=num('rx'), ry=num('ry')
      if (rx <= 0 || ry <= 0) break
      const c = matTransform(localMatrix, cx, cy)
      const [a,b,cc,d] = localMatrix
      const erx = Math.round(rx * Math.sqrt(a*a+b*b))
      const ery = Math.round(ry * Math.sqrt(cc*cc+d*d))
      lines.push(`    {${id ? ` // #${id}` : ''}`)
      if (fill)   lines.push(`        pntr_draw_ellipse_fill(dst, ${Math.round(c.x)}, ${Math.round(c.y)}, ${erx}, ${ery}, ${colorToC(fill)});`)
      if (stroke) lines.push(`        pntr_draw_ellipse(dst, ${Math.round(c.x)}, ${Math.round(c.y)}, ${erx}, ${ery}, ${colorToC(stroke)});`)
      lines.push(`    }`)
      break
    }
    case 'line': {
      const p1=matTransform(localMatrix,num('x1'),num('y1'))
      const p2=matTransform(localMatrix,num('x2'),num('y2'))
      const c = stroke || fill
      if (c) lines.push(`    pntr_draw_line(dst, ${Math.round(p1.x)}, ${Math.round(p1.y)}, ${Math.round(p2.x)}, ${Math.round(p2.y)}, ${colorToC(c)});${id ? ` // #${id}` : ''}`)
      break
    }
    case 'polyline': {
      const pts = ptsFromPointsAttr(el.getAttribute('points') || '', localMatrix)
      if (pts.length >= 2) emitSubpath(lines, { pts, closed: false }, fill, stroke, counter.i++, id)
      break
    }
    case 'polygon': {
      const pts = ptsFromPointsAttr(el.getAttribute('points') || '', localMatrix)
      if (pts.length >= 2) emitSubpath(lines, { pts, closed: true }, fill, stroke, counter.i++, id)
      break
    }
    case 'g':
    case 'svg': {
      const children = el.childNodes
      for (let i = 0; i < children.length; i++) {
        processElement(children[i], localMatrix, style, lines, counter)
      }
      break
    }
    // defs, title, desc, metadata, symbol, use, etc. intentionally skipped
  }
}

/**
 * Convert an SVG string to a C header with pntr drawing commands.
 * @param {string} svgContent  - SVG source
 * @param {string} funcName    - Name of the generated C function (e.g. "draw_tiger")
 * @returns {string} C header source
 */
export function svgToPntr(svgContent, funcName = 'draw_svg') {
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml')
  const svg = doc.documentElement

  const vb = svg.getAttribute('viewBox')
  let vbComment = ''
  if (vb) {
    const [vx, vy, vw, vh] = vb.trim().split(/[\s,]+/).map(Number)
    vbComment = `// viewBox: ${vx} ${vy} ${vw} ${vh} — create image at least ${Math.ceil(vw)}x${Math.ceil(vh)}`
  }

  const defaultStyle = {
    fill: 'black', stroke: 'none', opacity: '1',
    'fill-opacity': '1', 'stroke-opacity': '1'
  }
  const lines = []
  const counter = { i: 0 }
  processElement(svg, MAT_IDENTITY, defaultStyle, lines, counter)

  const guard = funcName.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_H'
  return [
    `#ifndef ${guard}`,
    `#define ${guard}`,
    ``,
    `#include "pntr.h"`,
    ``,
    vbComment,
    `static inline void ${funcName}(pntr_image* dst) {`,
    ...lines,
    `}`,
    ``,
    `#endif // ${guard}`,
    ``
  ].join('\n')
}

export default svgToPntr
