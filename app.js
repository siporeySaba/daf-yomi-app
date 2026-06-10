const API = "https://script.google.com/macros/s/AKfycby1lozKAoUrxHMNpXVJxlqwmfgb0Iqd08lUm4jLpWutpvwUpHW-ZoYBv8By0v88EwX1/exec";

async function load() {
  try {
    const res = await fetch(`${API}?action=stats&username=test`);
    const data = await res.json();

    console.log("DATA:", data);

    document.getElementById("app").innerHTML = `
      <h1>נלמדו: ${data.learned}</h1>
      <h1>דולגו: ${data.skipped}</h1>
      <h1>סה״כ: ${data.total}</h1>
    `;
  } catch (e) {
    console.log("ERROR:", e);
    document.getElementById("app").innerHTML = "שגיאה בטעינה";
  }
}

load();
