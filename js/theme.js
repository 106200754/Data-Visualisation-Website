// Light / dark theme: runs in <head> to avoid a flash, then wires up the dropdown
(function () {
  const KEY = "theme";
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);

  document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("theme-select");
    if (!select) return;
    select.value = theme;
    select.addEventListener("change", () => {
      document.documentElement.setAttribute("data-theme", select.value);
      try { localStorage.setItem(KEY, select.value); } catch (e) {}
    });
  });
})();