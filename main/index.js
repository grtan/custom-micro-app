const { register, start, load } = (function () {
  let config,
    // 记录子apps信息
    apps = {},
    // 是否已启动
    started = false;

  window.apps = apps;

  function onHashChange() {
    if (!started) {
      return;
    }

    const matchedApps = [];
    const unmatchedApps = [];

    // 根据hash匹配子app
    config.apps.forEach((app) => {
      apps[app.id] ??= {
        // 是否已激活
        active: false,
        // 模块导出
        exports: {},
        // 全局变量
        window: {},
      };

      if (
        new RegExp(
          `^${config.basePath}/${app.path}(/|$)`.replace(/\/+/g, "/")
        ).test(location.hash.slice(1))
      ) {
        matchedApps.push(app);
      } else {
        unmatchedApps.push(app);
      }
    });

    // 先处理未匹配的app
    unmatchedApps.forEach(async (app) => {
      // 卸载已挂载的子app
      if (apps[app.id].active) {
        apps[app.id].active = false;
        await apps[app.id].exports.unmount?.({
          container: app.container,
        });
      } else {
        apps[app.id].active = false;
      }
    });

    // 再处理匹配的app
    matchedApps.forEach(async (app) => {
      // 子app已挂载
      if (apps[app.id].active) {
        return;
      }

      apps[app.id].active = true;

      // 加载子app模块
      if (!apps[app.id].exports.mount) {
        apps[app.id].exports = await load(app);
      }

      // 挂载子app
      if (apps[app.id].active) {
        await apps[app.id].exports.mount({
          container: app.container,
        });
      }
    });
  }

  function register(cfg) {
    config = cfg;
  }

  function start() {
    started = true;
    onHashChange();
  }

  // 加载entry js
  // TODO: entry也可以是html
  async function load(app) {
    const res = await fetch(app.entry);
    const script = await res.text();
    const windowProxy = new Proxy(apps[app.id].window, {
      has(target, prop) {
        return Reflect.has(target, prop) || !window.hasOwnProperty(prop);
      },
      get(target, prop, receiver) {
        console.log("get", prop);
        if (["window", "self", "globalThis"].includes(prop)) {
          return windowProxy;
        }

        if (["top", "parent"].includes(prop)) {
          if (window === window.parent) {
            return windowProxy;
          }

          return window[prop];
        }

        // TODO: 其他细节处理

        // 优先从apps[app.id].window上取
        if (
          target.hasOwnProperty(prop) /*  || !window.hasOwnProperty(prop) */
        ) {
          return Reflect.get(target, prop, receiver);
        }

        // 从原始window上取
        return window[prop];
      },
      set(target, prop, value, receiver) {
        // TODO: 其他细节处理

        // 设置到apps[app.id].window上
        return Reflect.set(target, prop, value, receiver);
      },
    });
    // 执行entry js并代理window
    const module = new Function(
      "window",
      `
      with(window) {
        const module = {};
        
        (function(module) {
          ${script}
        })(module);

        return module;
      }
      `
    )(windowProxy);

    console.log(module.exports, windowProxy);

    return module.exports;
  }

  window.addEventListener("hashchange", onHashChange);

  return {
    register,
    start,
    load,
  };
})();

register({
  basePath: "/base",
  apps: [
    {
      id: "app1",
      path: "/app1and2",
      entry: "/app1/index.js",
      container: document.querySelector("#subapp1"),
    },
    {
      id: "app2",
      path: "/app1and2",
      entry: "/app2/index.js",
      container: document.querySelector("#subapp2"),
    },
    {
      id: "app3",
      path: "/app3",
      entry: "/app3/index.js",
      container: document.querySelector("#subapp1"),
    },
  ],
});
start();
