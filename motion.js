// Общие анимации: появление при прокрутке, волна от нажатия, тень у прилипших вкладок.
(function () {
  var reduced = matchMedia("(prefers-reduced-motion: reduce)");

  // Появление при прокрутке. Блок, видимый сразу, не прячем: анимируются только те, что ниже экрана.
  var SEL = ".wrap .box, .prog, .news, .g";
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting) {
          if (el.classList.contains("rv")) {
            el.style.setProperty("--ri", n++);
            el.classList.add("in");
            // После появления снимаем классы, чтобы вернулись собственные переходы блока (ховер карточки)
            setTimeout(function () { el.classList.remove("rv", "in"); el.style.removeProperty("--ri"); }, 900);
          }
          io.unobserve(el);
        } else if (!reduced.matches && e.boundingClientRect.height > 0 && e.boundingClientRect.top > 0) {
          el.classList.add("rv");
        }
      });
    }, { rootMargin: "0px 0px -40px 0px" });
    var watch = function (root) {
      if (root.nodeType !== 1) return;
      if (root.matches(SEL)) io.observe(root);
      root.querySelectorAll(SEL).forEach(function (el) { io.observe(el); });
    };
    watch(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { m.addedNodes.forEach(watch); });
    }).observe(document.body, { childList: true, subtree: true });
  }

  // Волна от точки нажатия
  document.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(".btn, .toggle, .chip, .refresh, .install, .opt, .choice");
    if (!b || b.disabled || reduced.matches) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, w = document.createElement("span");
    w.className = "rp";
    w.style.cssText = "width:" + s + "px;height:" + s + "px;left:" + (e.clientX - r.left - s / 2) + "px;top:" + (e.clientY - r.top - s / 2) + "px";
    b.classList.add("rp-host");
    b.appendChild(w);
    w.addEventListener("animationend", function () { w.remove(); });
  });

  // Тень под вкладками, когда шапка ушла за верх экрана
  var hero = document.querySelector(".hero"), bar = document.querySelector(".navbar");
  if (hero && bar && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { bar.classList.toggle("stuck", !es[0].isIntersecting); }).observe(hero);
  }
})();
