
module.exports = {
  title: "axios源码深入解读",
  description: "逐行剖析 axios 源码",
  plugins: {
    "@vuepress/back-to-top": true,
    "@vuepress/pwa": {
      serviceWorker: true,
      updatePopup: {
        "/": {
          message: "发现新内容可用",
          buttonText: "刷新"
        }
      }
    }
  },
  // head: [["link", { rel: "icon", href: `/images/wxlogo.png` }]],
  themeConfig: {
    repo: "c10342/axios-analysis",
    editLinks: true,
    docsDir: "docs",
    editLinkText: "帮助我们改善此页面！",
    nav: [
      { text: "首页", link: "/" },
      { text: "源码分析", link: "/analysis/01-prepare" },
      { text: "进阶", link: "/wx-axios/01-prepare" },
      {
        text: "其他",
        items: [
          { text: "vue2组件库", link: "http://ui.linjiafu.top/" },
          { text: "视频播放器", link: "http://player.linjiafu.top/" },
          { text: "微信小程序组件库", link: "http://wxui.linjiafu.top/" }
        ]
      }
    ],
    displayAllHeaders: true,
    sidebar: {
      '/analysis/': [
        '01-prepare',  
        '02-instance-create',  
        '03-axios-form',  
        '04-buildURL',  
        '05-request',  
        '06-interceptors',  
        '07-dispatchRequest',  
        '08-transformData',  
        '09-xhr',  
        '10-authentication',  
        '11-XSRF',  
        '12-isURLSameOrigin',  
        '13-cancel-request',  
        '14-http',  
        '15-createError',  
        '16-config',  
        '17-summary',  
      ],
      '/wx-axios/': [
        '01-prepare',  
        '02-instance-create',  
      ]
    }
  }
};
