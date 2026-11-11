"""Chuyển prisma/schema.prisma sang DBML (dbdiagram.io). Chạy trong backend/: python3 scripts/prisma-to-dbml.py prisma/schema.prisma docs/database-diagram.txt"""
import re
import sys

src = open(sys.argv[1], encoding='utf-8').read()
lines = src.splitlines()

SCALAR = {'String': 'varchar', 'Int': 'int', 'Float': 'float', 'Boolean': 'boolean',
          'DateTime': 'timestamp', 'Json': 'jsonb', 'BigInt': 'bigint', 'Decimal': 'decimal', 'Bytes': 'bytea'}

models, enums, order = {}, {}, []
i = 0
while i < len(lines):
    m = re.match(r'^(model|enum)\s+(\w+)\s*\{', lines[i])
    if not m:
        i += 1
        continue
    kind, name = m.groups()
    body, doc = [], []
    # comment /// ngay trên model
    j = i - 1
    while j >= 0 and lines[j].strip().startswith('///'):
        doc.insert(0, lines[j].strip()[3:].strip())
        j -= 1
    i += 1
    while not lines[i].startswith('}'):
        body.append(lines[i])
        i += 1
    (models if kind == 'model' else enums)[name] = (body, doc)
    order.append((kind, name))
    i += 1

def q(s):
    return s.replace("'", "\\'")

out = ['// Workmate — sơ đồ database (sinh tự động từ backend/prisma/schema.prisma)',
       '// Dán toàn bộ nội dung vào https://dbdiagram.io/d để xem sơ đồ.', '']
refs = []

for kind, name in order:
    if kind != 'enum':
        continue
    body, doc = enums[name]
    out.append(f'Enum {name} {{')
    pending = []
    for raw in body:
        s = raw.strip()
        if s.startswith('///'):
            pending.append(s[3:].strip())
            continue
        if not s or s.startswith('//'):
            continue
        val = s.split()[0]
        note = f" [note: '{q(' '.join(pending))}']" if pending else ''
        out.append(f'  {val}{note}')
        pending = []
    out.append('}')
    out.append('')

for kind, name in order:
    if kind != 'model':
        continue
    body, doc = models[name]
    cols, idx, pending = [], [], []
    for raw in body:
        s = raw.strip()
        if s.startswith('///'):
            pending.append(s[3:].strip())
            continue
        if not s or s.startswith('//'):
            continue
        if s.startswith('@@'):
            m = re.match(r'@@(id|index|unique)\(\[([^\]]*)\]', s)
            if m:
                k, fields = m.groups()
                fs = ', '.join(f.strip() for f in fields.split(','))
                opt = {'id': ' [pk]', 'unique': ' [unique]', 'index': ''}[k]
                idx.append(f'    ({fs}){opt}')
            continue
        parts = s.split(None, 2)
        fname, ftype = parts[0], parts[1]
        attrs = parts[2] if len(parts) > 2 else ''
        base = ftype.rstrip('?').rstrip('[]')
        is_list = ftype.endswith('[]')
        optional = ftype.endswith('?')
        rel = re.search(r'@relation\(([^)]*)\)', attrs)
        if base not in SCALAR and base not in enums:
            # Trường quan hệ: chỉ phía có fields/references mới sinh Ref
            if rel and 'fields:' in rel.group(1):
                fm = re.search(r'fields:\s*\[([^\]]*)\]', rel.group(1)).group(1).split(',')
                rm = re.search(r'references:\s*\[([^\]]*)\]', rel.group(1)).group(1).split(',')
                od = re.search(r'onDelete:\s*(\w+)', rel.group(1))
                action = {'Cascade': 'cascade', 'SetNull': 'set null', 'Restrict': 'restrict', 'NoAction': 'no action'}.get(od.group(1) if od else '', '')
                setting = f' [delete: {action}]' if action else ''
                if len(fm) == 1:
                    # Khóa ngoại cũng là @id/@unique của bảng này → quan hệ 1–1
                    fk = fm[0].strip()
                    fk_line = next((l.strip() for l in body if l.strip().split()[:1] == [fk]), '')
                    op = '-' if re.search(r'(^|\s)@(id|unique)\b', fk_line) else '>'
                    refs.append(f'Ref: {name}.{fk} {op} {base}.{rm[0].strip()}{setting}')
                else:
                    refs.append(f"Ref: {name}.({', '.join(f.strip() for f in fm)}) > {base}.({', '.join(r.strip() for r in rm)}){setting}")
            pending = []
            continue
        if base in enums:
            t = base
        elif '@db.Date' in attrs:
            t = 'date'
        else:
            t = SCALAR[base]
        if is_list:
            t = f'"{t}[]"'
        settings = []
        if '@id' in attrs.split('@relation')[0] and not attrs.startswith('@@'):
            if re.search(r'(^|\s)@id\b', attrs):
                settings.append('pk')
        if re.search(r'(^|\s)@unique\b', attrs):
            settings.append('unique')
        if not optional and not is_list and 'pk' not in settings:
            settings.append('not null')
        d = re.search(r'@default\(((?:[^()]|\([^()]*\))*)\)', attrs)
        if d:
            v = d.group(1)
            if v in ('now()',):
                settings.append('default: `now()`')
            elif v in ('cuid()', 'uuid()', 'autoincrement()'):
                settings.append(f"note: 'mặc định {v}'" if not pending else '')
            elif v.startswith('"'):
                settings.append(f"default: '{q(v.strip(chr(34)))}'")
            elif re.fullmatch(r'-?[\d.]+|true|false', v):
                settings.append(f'default: {v}')
            elif re.fullmatch(r'\w+', v):
                settings.append(f"default: '{v}'")
            # danh sách rỗng [] bỏ qua
        if '@updatedAt' in attrs:
            settings.append("note: 'tự cập nhật khi sửa'" if not pending else '')
        if pending:
            settings.append(f"note: '{q(' '.join(pending))}'")
        settings = [x for x in settings if x]
        sset = f" [{', '.join(settings)}]" if settings else ''
        cols.append(f'  {fname} {t}{sset}')
        pending = []
    out.append(f'Table {name} {{')
    out.extend(cols)
    if idx:
        out.append('')
        out.append('  indexes {')
        out.extend(idx)
        out.append('  }')
    if doc:
        out.append('')
        out.append(f"  Note: '{q(' '.join(doc))}'")
    out.append('}')
    out.append('')

out.append('// ───── Quan hệ (khóa ngoại) ─────')
out.extend(refs)
open(sys.argv[2], 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(f'{sum(1 for k, _ in order if k == "model")} bảng, {len(enums)} enum, {len(refs)} quan hệ')
