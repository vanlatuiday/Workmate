import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { parseSeeker, parseSeekerProfile } from '../scripts/import-profiles-parse.mjs';

const sourceRoot = new URL('../../frontend/nguoi-tim-viec/', import.meta.url);
const directories = (await readdir(sourceRoot)).filter((name) => /^\d{2}-/.test(name)).sort();
const sources = await Promise.all(directories.map((name) => readFile(new URL(`${name}/thong-tin.txt`, sourceRoot), 'utf8')));
const fixture = sources[0];
const field = (text, label) => text.match(new RegExp(`^${label}: (.+)$`, 'm'))[1];
const withField = (label, value) => fixture.replace(new RegExp(`^${label}: .+$`, 'm'), `${label}: ${value}`);
const withSchedule = (lines) => fixture.replace(/Lịch rảnh theo từng ngày:[\s\S]*?(?=\nEmail:)/, `Lịch rảnh theo từng ngày:\n${lines}\n`);

test('all 20 source profiles preserve facts and produce only the Prisma profile fields', () => {
  assert.equal(sources.length, 20);
  const salaries = [28, 29, 27, 31, 40, 38, 45, 36, 26, 25, 35, 34, 34, 29, 30, 23, 28, 25, 28, 31];
  const districts = ['Hải Châu', 'Sơn Trà', 'Sơn Trà', 'Liên Chiểu', 'Liên Chiểu', 'Hải Châu', 'Liên Chiểu', 'Hòa Vang', 'Sơn Trà', 'Hải Châu', 'Liên Chiểu', 'Liên Chiểu', 'Liên Chiểu', 'Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Hải Châu', 'Ngũ Hành Sơn', 'Ngũ Hành Sơn', 'Cẩm Lệ'];
  sources.forEach((text, index) => {
    const { email, profile } = parseSeeker(text);
    assert.equal(email, field(text, 'Email'));
    assert.deepEqual(Object.keys(profile).sort(), ['fullName', 'phone', 'intro', 'about', 'area', 'salaryMinK', 'maxDistanceKm', 'jobTypes', 'skills', 'availability', 'headline', 'birthDate', 'hobbies'].sort());
    assert.equal(profile.fullName, field(text, 'Họ tên'));
    assert.equal(profile.phone, field(text, 'Số điện thoại'));
    assert.equal(profile.intro, field(text, 'Giới thiệu ngắn'));
    assert.equal(profile.headline, field(text, 'Công việc mong muốn'));
    assert.equal(profile.salaryMinK, salaries[index]);
    assert.equal(profile.area, `${districts[index]}, Đà Nẵng`);
    assert(profile.birthDate instanceof Date);
    assert.deepEqual(profile.hobbies, []);
    assert(profile.skills.length > 0);
    assert.equal(new Set(profile.skills).size, profile.skills.length);
    assert(profile.availability.every((key) => /^[0-6]-[0-3]$/.test(key)));
    assert.equal(new Set(profile.availability).size, profile.availability.length);
    for (const label of ['Khu vực sinh sống', 'Học vấn', 'Kỹ năng', 'Phương tiện đi lại']) {
      assert(profile.about.includes(field(text, label)), `${directories[index]} lost ${label}`);
    }
    const experience = text.match(/Kinh nghiệm làm việc:\n([\s\S]*?)\n\nCông việc mong muốn:/)[1];
    const schedule = text.match(/Lịch rảnh theo từng ngày:\n([\s\S]*?)\n\nEmail:/)[1];
    assert(profile.about.includes(experience));
    assert(profile.about.includes(schedule));
    for (const label of ['Email', 'Số điện thoại', 'Ngày sinh']) assert(!profile.about.includes(field(text, label)));
    assert(!/Email:|Số điện thoại:|Ngày sinh:/.test(profile.about));
    assert.deepEqual(parseSeekerProfile(text), profile);
  });
});

test('salary is converted from whole dong to thousands without accepting malformed values', () => {
  for (const salary of ['28,000 VNĐ/giờ', '28.000 VNĐ/giờ', '28000 VNĐ/giờ']) {
    assert.equal(parseSeekerProfile(withField('Mức lương mong muốn', salary)).salaryMinK, 28);
  }
  for (const salary of ['28,00 VNĐ/giờ', '28,500 VNĐ/giờ', '-28000 VNĐ/giờ', '0 VNĐ/giờ', '28000 VNĐ/tháng']) {
    assert.throws(() => parseSeekerProfile(withField('Mức lương mong muốn', salary)), /lương/i);
  }
});

test('birth dates use strict DD/MM/YYYY calendar validation at UTC midnight', () => {
  assert.equal(parseSeekerProfile(withField('Ngày sinh', '29/02/2004')).birthDate.toISOString(), '2004-02-29T00:00:00.000Z');
  for (const date of ['29/02/2003', '31/04/2005', '00/12/2005', '18/13/2005', '2005-03-18', '1/3/2005']) {
    assert.throws(() => parseSeekerProfile(withField('Ngày sinh', date)), /ngày sinh/i);
  }
});

test('canonical aliases match existing skill names without inventing software expertise', () => {
  const first = parseSeekerProfile(fixture);
  assert(first.skills.includes('Tiếng Anh giao tiếp'));
  assert(first.skills.includes('Làm việc nhóm'));
  const second = parseSeekerProfile(sources[1]);
  assert(second.skills.includes('Google Sheets'));
  assert(!second.skills.includes('Excel'));
  assert(first.about.includes('Chưa có kinh nghiệm chính thức'));
  assert(!first.about.includes('Công ty/đơn vị:'));
  assert(parseSeekerProfile(sources[7]).skills.includes('Sơ chế thực phẩm'));
});

test('job types come only from the explicitly requested form of work', () => {
  assert.deepEqual(parseSeekerProfile(fixture).jobTypes, ['part_time']);
  assert.deepEqual(parseSeekerProfile(sources[2]).jobTypes, ['shift', 'flexible']);
  assert.deepEqual(parseSeekerProfile(sources[3]).jobTypes, ['part_time', 'shift']);
  assert.deepEqual(parseSeekerProfile(sources[13]).jobTypes, ['seasonal']);
  assert.deepEqual(parseSeekerProfile(sources[15]).jobTypes, ['part_time']);
});

test('slots require full coverage and merge overlapping or adjacent source intervals', () => {
  assert.deepEqual(parseSeekerProfile(fixture).availability, ['4-2', '6-2']);
  assert.deepEqual(parseSeekerProfile(withSchedule(`- Thứ 2: 08:00–12:00
- Thứ 3: 07:00–11:30; 11:30–12:00
- Thứ 4: 06:00–10:00; 08:00–12:00
- Thứ 5: 13:00–15:00; 15:01–17:00
- Thứ 6: 13:00–17:00
- Thứ 7: 14:00–19:00; 18:00–22:30
- Chủ nhật: 07:00–11:59`)).availability, ['1-0', '2-0', '4-1', '5-2']);
});

test('overnight slots merge coverage from the following day and wrap Sunday to Monday', () => {
  assert.deepEqual(parseSeekerProfile(withSchedule(`- Thứ 2: 00:00–06:00
- Thứ 3: 22:00–02:00
- Thứ 4: 02:00–06:00
- Thứ 5: 22:00–05:59
- Thứ 6: 22:00–06:00
- Thứ 7: Không đăng ký ca
- Chủ nhật: 22:00–24:00`)).availability, ['1-3', '4-3', '6-3']);
});

test('invalid or incomplete source data fails before any import can use it', () => {
  assert.throws(() => parseSeeker(fixture.replace(/^Email:.+\n?/m, '')), /email/i);
  assert.throws(() => parseSeeker(withField('Email', 'broken-address')), /email/i);
  assert.throws(() => parseSeekerProfile(withField('Khoảng cách đi làm', 'Tối đa -3 km')), /khoảng cách/i);
  assert.throws(() => parseSeekerProfile(withSchedule('- Thứ 2: 25:00–26:00')), /lịch|giờ/i);
  assert.throws(() => parseSeekerProfile(withSchedule('- Thứ 2: 10:00–10:00')), /lịch|giờ/i);
  assert.throws(() => parseSeekerProfile(withField('Hình thức mong muốn', 'Tùy ý')), /hình thức/i);
});
