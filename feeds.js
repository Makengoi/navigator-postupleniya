// Ленты новостей. Общий список для index.html (запасная загрузка через прокси) и update-news.mjs (основная).
// cat: adm — поступление, edu — учёба, sci — наука и открытия
var NEWS_FEEDS = (function () {
  var gn = function (q) { return "https://news.google.com/rss/search?q=" + encodeURIComponent(q) + "&hl=ru&gl=KZ&ceid=KZ:ru"; };
  return [
    { cat: "adm", url: gn("ЕНТ OR \"грант на обучение\" OR абитуриенты OR \"приёмная кампания\" Казахстан when:14d") },
    { cat: "adm", url: gn("стипендия \"обучение за рубежом\" OR Болашак OR \"Назарбаев Университет\" when:30d") },
    { cat: "edu", url: gn("школьники OR олимпиада OR \"система образования\" Казахстан when:14d") },
    { cat: "sci", url: "https://nplus1.ru/rss" },
    { cat: "sci", url: gn("учёные открытие OR \"впервые в мире\" OR исследование when:7d") }
  ];
})();
if (typeof module !== "undefined") module.exports = NEWS_FEEDS;
