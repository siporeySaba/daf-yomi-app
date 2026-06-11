// -------------------------------
// 📜 GEMARA DAF RENDERER (REALISTIC)
// -------------------------------

// יחידות
const units = [
  "", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"
];

// עשרות
const tens = [
  "", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"
];

// מאות
const hundreds = [
  "", "ק", "ר", "ש", "ת"
];

// חריגים (חובה בגמרא)
const special = {
  15: "ט״ו",
  16: "ט״ז"
};

export function toGemaraDaf(num) {
  if (special[num]) return special[num] + "׳";

  let result = "";

  let h = Math.floor(num / 100);
  let t = Math.floor((num % 100) / 10);
  let u = num % 10;

  if (h > 0) {
    result += hundreds[h];
  }

  // טיפול בעשרות 15–16 כבר טופל למעלה
  if (t > 0) {
    result += tens[t];
  }

  if (u > 0) {
    result += units[u];
  }

  return result + "׳";
}
