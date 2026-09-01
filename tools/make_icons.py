#!/usr/bin/env python3
"""Gera os ícones PNG do PWA sem dependências externas.
Uso: python3 tools/make_icons.py   (roda a partir da raiz do projeto)"""
import math, os, struct, zlib

INK   = (0x2B, 0x28, 0x24, 255)   # fundo
CREAM = (0xFA, 0xF6, 0xF0, 255)   # prato
SKY   = (0x38, 0xBD, 0xF8, 255)   # gota
CLEAR = (0, 0, 0, 0)

SS = 3  # supersampling por eixo


def rounded_rect(x, y, r):
    """Cobertura do quadrado 0..1 com cantos arredondados de raio r."""
    cx = min(max(x, r), 1 - r)
    cy = min(max(y, r), 1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def droplet(x, y, cx, cy, rad):
    if (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad:
        return True
    ang = math.radians(52)
    ax, ay = cx, cy - rad * 2.55
    lx, ly = cx - rad * math.sin(ang), cy - rad * math.cos(ang)
    rx, ry = cx + rad * math.sin(ang), cy - rad * math.cos(ang)

    def side(px, py, x1, y1, x2, y2):
        return (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1)

    d1 = side(x, y, ax, ay, lx, ly)
    d2 = side(x, y, lx, ly, rx, ry)
    d3 = side(x, y, rx, ry, ax, ay)
    return (d1 >= 0 and d2 >= 0 and d3 >= 0) or (d1 <= 0 and d2 <= 0 and d3 <= 0)


def sample(x, y, shape):
    """Cor do ponto (x, y) em coordenadas normalizadas 0..1.
    shape: 'rounded' (padrão), 'circle' (launcher redondo) ou 'full' (maskable)."""
    if shape == 'full':
        bg_ok = True                      # ícone maskable preenche tudo
        s, off = 0.60, 0.20               # conteúdo dentro da zona segura
    elif shape == 'circle':
        bg_ok = (x - 0.5) ** 2 + (y - 0.5) ** 2 <= 0.5 ** 2
        s, off = 1.0, 0.0
    else:
        bg_ok = rounded_rect(x, y, 0.22)
        s, off = 1.0, 0.0
    if not bg_ok:
        return CLEAR

    u, v = (x - off) / s, (y - off) / s   # coords do conteúdo
    d2 = (u - 0.5) ** 2 + (v - 0.52) ** 2
    if 0.245 ** 2 <= d2 <= 0.305 ** 2:    # anel do prato
        return CREAM
    if droplet(u, v, 0.5, 0.575, 0.105):  # gota d'água
        return SKY
    return INK


def render(size, shape='rounded'):
    px = bytearray(size * size * 4)
    step = 1.0 / (size * SS)
    for py in range(size):
        for pxi in range(size):
            r = g = b = a = 0
            for sy in range(SS):
                y = (py * SS + sy + 0.5) * step
                for sx in range(SS):
                    x = (pxi * SS + sx + 0.5) * step
                    c = sample(x, y, shape)
                    r += c[0] * c[3]; g += c[1] * c[3]; b += c[2] * c[3]; a += c[3]
            n = SS * SS
            i = (py * size + pxi) * 4
            if a:
                px[i] = int(r / a); px[i + 1] = int(g / a); px[i + 2] = int(b / a)
            px[i + 3] = a // n
    return bytes(px)


def write_png(path, size, data):
    raw = b''.join(b'\x00' + data[y * size * 4:(y + 1) * size * 4] for y in range(size))

    def chunk(tag, payload):
        return (struct.pack('>I', len(payload)) + tag + payload +
                struct.pack('>I', zlib.crc32(tag + payload) & 0xFFFFFFFF))

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(raw, 9))
           + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)
    print(f'{path}  {size}x{size}  {len(png) / 1024:.1f} KB')


# densidades do Android: pasta -> lado do ícone em px
ANDROID_DPI = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}

if __name__ == '__main__':
    os.makedirs('icons', exist_ok=True)
    for size, name, shape in [(192, 'icon-192.png', 'rounded'), (512, 'icon-512.png', 'rounded'),
                              (512, 'icon-512-maskable.png', 'full'), (180, 'apple-touch-icon.png', 'rounded')]:
        write_png(os.path.join('icons', name), size, render(size, shape))

    # ícones do app Android (usados pelo build do APK)
    for dpi, size in ANDROID_DPI.items():
        folder = os.path.join('branding', 'android', 'mipmap-' + dpi)
        os.makedirs(folder, exist_ok=True)
        write_png(os.path.join(folder, 'ic_launcher.png'), size, render(size, 'rounded'))
        write_png(os.path.join(folder, 'ic_launcher_round.png'), size, render(size, 'circle'))
