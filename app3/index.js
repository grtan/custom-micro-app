window.appName = "app3";

module.exports = {
  mount({ container }) {
    container.innerHTML = "<h1>" + appName + "</h1>";
  },
  unmount({ container }) {
    container.innerHTML = "";
  },
};
