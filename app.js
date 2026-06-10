async function api(action, params = {}) {
  const url = new URL("https://script.google.com/macros/s/AKfycby1lozKAoUrxHMNpXVJxlqwmfgb0Iqd08lUm4jLpWutpvwUpHW-ZoYBv8By0v88EwX1/exec");

  url.searchParams.append("action", action);

  Object.keys(params).forEach(k => {
    url.searchParams.append(k, params[k]);
  });

  const res = await fetch(url.toString(), {
    method: "GET",
    mode: "cors"
  });

  return await res.json();
}
