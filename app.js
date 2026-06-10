const API = "https://script.google.com/macros/s/AKfycby1lozKAoUrxHMNpXVJxlqwmfgb0Iqd08lUm4jLpWutpvwUpHW-ZoYBv8By0v88EwX1/exec";

async function load() {
  try {
    const res = await fetch(`${API}?action=stats&username=test`);
    const data = await res.json();

    console.log("DATA:", data);

    document.getElementById("app").innerHTML = `
      <h2>נלמדו: ${data.learned}</h2>
      <h2>דולגו: ${data.skipped}</h2>
      <h2>סה״כ: ${data.total}</h2>
    `;
  } catch (err) {
    console.log("ERROR:", err);
    document.getElementById("app").innerHTML = "שגיאה בטעינה";
  }
}

load();
