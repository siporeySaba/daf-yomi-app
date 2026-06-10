const API = "https://script.google.com/macros/s/AKfycbx3_uJqSu3qq79TvkqtIXt_8d8Opy9yQf8ysotWxxrh-c8Tm-_PXLc6OpP39rmdldUy/exec";

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
