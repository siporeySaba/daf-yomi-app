const API = "https://script.google.com/macros/s/AKfycbxBNwHyTrVeKnaUESgOGWke_HepmOKSfsQHVcTbXkXM6uremVdiZNrGtkfdwMdmnlLW/exec";

async function api(action, params = {}) {
  const url = new URL(API);
  url.searchParams.append("action", action);

  Object.keys(params).forEach(k => {
    url.searchParams.append(k, params[k]);
  });

  const res = await fetch(url);
  return await res.json();
}
api("stats", { username: "test" }).then(res => {
  console.log("TEST RESPONSE:", res);
});
