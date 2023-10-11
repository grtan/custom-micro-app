appName = "app2";
appNum = 0;

module.exports = {
  mount({ container }) {
    container.innerHTML =
      "<h1>" + window.appName + "</h1><div id='app2-num'>" + appNum + "</div>";
    document.querySelector("#app2-num").addEventListener("click", (e) => {
      appNum++;
      e.currentTarget.textContent = appNum;
    });
  },
  unmount({ container }) {
    container.innerHTML = "";
  },
};
