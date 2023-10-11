appName = "app1";
appNum = 0;

module.exports = {
  mount({ container }) {
    container.innerHTML =
      "<h1>" + appName + "</h1><div id='app1-num'>" + appNum + "</div>";

    document.querySelector("#app1-num").addEventListener("click", (e) => {
      appNum++;
      e.currentTarget.textContent = appNum;
    });
  },
  unmount({ container }) {
    container.innerHTML = "";
  },
};
