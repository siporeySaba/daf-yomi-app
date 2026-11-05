// -------------------------------
// 📅 DAF YOMI SCHEDULE
// -------------------------------
import { toGemaraDaf } from "./gemaraRenderer.js";

// Order of the Daf Yomi cycle. first/last = daf numbers studied.
// קינים, תמיד ומידות נלמדים אחרי מעילה וממשיכים את מספור הדפים שלה.
export const MASECHTOT = [
  { name: "ברכות", en: "Berakhot", seder: "זרעים", first: 2, last: 64 },
  { name: "שבת", en: "Shabbat", seder: "מועד", first: 2, last: 157 },
  { name: "עירובין", en: "Eruvin", seder: "מועד", first: 2, last: 105 },
  { name: "פסחים", en: "Pesachim", seder: "מועד", first: 2, last: 121 },
  { name: "שקלים", en: "Shekalim", seder: "מועד", first: 2, last: 22 },
  { name: "יומא", en: "Yoma", seder: "מועד", first: 2, last: 88 },
  { name: "סוכה", en: "Sukkah", seder: "מועד", first: 2, last: 56 },
  { name: "ביצה", en: "Beitzah", seder: "מועד", first: 2, last: 40 },
  { name: "ראש השנה", en: "Rosh_Hashanah", seder: "מועד", first: 2, last: 35 },
  { name: "תענית", en: "Taanit", seder: "מועד", first: 2, last: 31 },
  { name: "מגילה", en: "Megillah", seder: "מועד", first: 2, last: 32 },
  { name: "מועד קטן", en: "Moed_Katan", seder: "מועד", first: 2, last: 29 },
  { name: "חגיגה", en: "Chagigah", seder: "מועד", first: 2, last: 27 },
  { name: "יבמות", en: "Yevamot", seder: "נשים", first: 2, last: 122 },
  { name: "כתובות", en: "Ketubot", seder: "נשים", first: 2, last: 112 },
  { name: "נדרים", en: "Nedarim", seder: "נשים", first: 2, last: 91 },
  { name: "נזיר", en: "Nazir", seder: "נשים", first: 2, last: 66 },
  { name: "סוטה", en: "Sotah", seder: "נשים", first: 2, last: 49 },
  { name: "גיטין", en: "Gittin", seder: "נשים", first: 2, last: 90 },
  { name: "קידושין", en: "Kiddushin", seder: "נשים", first: 2, last: 82 },
  { name: "בבא קמא", en: "Bava_Kamma", seder: "נזיקין", first: 2, last: 119 },
  { name: "בבא מציעא", en: "Bava_Metzia", seder: "נזיקין", first: 2, last: 119 },
  { name: "בבא בתרא", en: "Bava_Batra", seder: "נזיקין", first: 2, last: 176 },
  { name: "סנהדרין", en: "Sanhedrin", seder: "נזיקין", first: 2, last: 113 },
  { name: "מכות", en: "Makkot", seder: "נזיקין", first: 2, last: 24 },
  { name: "שבועות", en: "Shevuot", seder: "נזיקין", first: 2, last: 49 },
  { name: "עבודה זרה", en: "Avodah_Zarah", seder: "נזיקין", first: 2, last: 76 },
  { name: "הוריות", en: "Horayot", seder: "נזיקין", first: 2, last: 14 },
  { name: "זבחים", en: "Zevachim", seder: "קדשים", first: 2, last: 120 },
  { name: "מנחות", en: "Menachot", seder: "קדשים", first: 2, last: 110 },
  { name: "חולין", en: "Chullin", seder: "קדשים", first: 2, last: 142 },
  { name: "בכורות", en: "Bekhorot", seder: "קדשים", first: 2, last: 61 },
  { name: "ערכין", en: "Arakhin", seder: "קדשים", first: 2, last: 34 },
  { name: "תמורה", en: "Temurah", seder: "קדשים", first: 2, last: 34 },
  { name: "כריתות", en: "Keritot", seder: "קדשים", first: 2, last: 28 },
  { name: "מעילה", en: "Meilah", seder: "קדשים", first: 2, last: 22 },
  { name: "קינים", en: "Kinnim", seder: "קדשים", first: 23, last: 25 },
  { name: "תמיד", en: "Tamid", seder: "קדשים", first: 26, last: 33 },
  { name: "מידות", en: "Middot", seder: "קדשים", first: 34, last: 37 },
  { name: "נדה", en: "Niddah", seder: "טהרות", first: 2, last: 73 },
];

export const SEDARIM = ["זרעים", "מועד", "נשים", "נזיקין", "קדשים", "טהרות"];

export const BY_NAME = Object.fromEntries(MASECHTOT.map(m => [m.name, m]));

export function dafCount(m) {
  return m.last - m.first + 1;
}

export function dafList(m) {
  return Array.from({ length: dafCount(m) }, (_, i) => {
    const num = m.first + i;
    return { num, str: toGemaraDaf(num) };
  });
}

// מחזור 14 התחיל בברכות ב׳ ב-5.1.2020. כל מחזור = 2711 ימים.
const CYCLE_START_UTC = Date.UTC(2020, 0, 5);
const CYCLE_DAYS = MASECHTOT.reduce((s, m) => s + dafCount(m), 0);
const DAY_MS = 24 * 60 * 60 * 1000;

// מספר ימים לפי התאריך המקומי (שעון המכשיר), לא UTC
function localDayNumber(date) {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function dafYomiFor(date = new Date()) {
  const days = localDayNumber(date) - CYCLE_START_UTC / DAY_MS;
  let idx = ((days % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS;
  for (const m of MASECHTOT) {
    const n = dafCount(m);
    if (idx < n) {
      const num = m.first + idx;
      return { masechet: m.name, num, str: toGemaraDaf(num) };
    }
    idx -= n;
  }
  throw new Error("schedule overflow");
}

export function sefariaUrl(masechet, dafNum) {
  const m = BY_NAME[masechet];
  if (!m) return null;
  return `https://www.sefaria.org/${m.en}.${dafNum}a?lang=he`;
}

// -------------------------------
// 🔢 Hebrew numerals + Hebrew date
// -------------------------------
const H_UNITS = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const H_TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
const H_HUNDREDS = ["", "ק", "ר", "ש", "ת"];

export function hebNumeral(n) {
  let s = "";
  let h = Math.floor(n / 100);
  while (h > 4) { s += "ת"; h -= 4; }
  s += H_HUNDREDS[h];
  const rest = n % 100;
  if (rest === 15) s += "טו";
  else if (rest === 16) s += "טז";
  else s += H_TENS[Math.floor(rest / 10)] + H_UNITS[rest % 10];
  return s.length === 1 ? s + "׳" : s.slice(0, -1) + "״" + s.slice(-1);
}

export function hebrewDate(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("he-u-ca-hebrew", {
      day: "numeric", month: "long", year: "numeric"
    }).formatToParts(date);
    const get = t => parts.find(p => p.type === t)?.value;
    const day = parseInt(get("day"), 10);
    const year = parseInt(get("year"), 10);
    const month = get("month");
    if (!day || !year || !month) return "";
    return `${hebNumeral(day)} ${month} ${hebNumeral(year % 1000)}`;
  } catch {
    return "";
  }
}
