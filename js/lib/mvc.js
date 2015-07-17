(function (ctx) {
    "use strict";
    var view = {};
    view.__pages = {};
    view.__pagesHtml = {};
    view.config = {
        pageContainer: "#page"
    }
    view.setConfig = function (data) {
        $.extend(view.config, data)
    }
    var _pageViewMg = {};

    var createPage = function (name, data, cb) {
        var me = this;
        var pageExt = view.__pages[name];
        var deal = function (pageExt, cb) {
            var pageObject = null;
            if (typeof pageExt === "function") {
                pageExt = pageExt();
            }
            if (pageExt != null) {
                var pageClass = view.page.extend(pageExt);
                pageObject = new pageClass(data);
            }
            pageObject.setViewName(name);
            cb(pageObject);
        }

        if (!view.__pages[name]) {
            require(["js/view/" + name + ".js"], function (js,page) {
                view.htmlMg.getTemplate(name, function (html) {
                    pageExt = view.__pages[name];
                    deal(pageExt, cb);
                });
            }, function () {
                console.warn("加载的" + name + ".js文件必须存在");
            })
            console.log("加载" + name);
        } else {
            deal(pageExt, cb);
        }

    }

    /**
     *
     * @param v  试图
     * @param c 控制器
     * @param m 数据模型
     * @returns {control}
     */
    view.definePage = function (name, obj) {
        view.__pages[name] = obj;
    }
    view._htmlView = Class.extend({
        _html:"",
        _name:"",
        ctor: function (data,name) {
            var me = this;
            me._html=$(data);
            me._name=name;
        },
        getContent: function () {
            var me = this;
            if (!me._content) {
                me._content = $(me._html).find("[tid=pageContent]");
            }
            return me._content.clone();
        },

        getTemplate: function (id) {
            var me = this;
            if (!me._template) {
                me._template = $(me._html).find("[tid=template]");
                me._templates = {}
            }
            if (!me._templates[id]) {
                me._templates[id] = me._template.find("[tid="+id+"]");
            }
            return me._templates[id].clone();
        }
    });
    view._htmlMg = Class.extend({
        __pagesHtml : {},
        getTemplate: function (name,fn) {
            var me = this;
            if (view.__pagesHtml[name]) {
                if ($.isFunction(fn)) {
                    fn(view.__pagesHtml[name]);
                }
                return view.__pagesHtml[name];
            }else{
                $.get("page/"+name+".html", function(data) {
                    view.__pagesHtml[name]=new view._htmlView(data,name);
                    if ($.isFunction(fn)) {
                        fn(view.__pagesHtml[name]);
                    }
                    return view.__pagesHtml[name];
                });
            }
        }
    })

    /**
     * 基础试图
     */
    view.view = Class.extend({
        params: null,
        node: null,
        ema: null,
        cachePage: false,//是否缓存页面
        ctor: function (param) {
            var me = this;
            me._disposed = false;
            me.viewName = "view";
            var node = $('<div class="pageBase"></div>');
            me.setNode(node);

            me.ema = EMA.getProxy();
            me.params = param || {}
            console.log("view.ctor");
        },
        setManger: function (mg) {
            var me = this;
            me.manger = mg
        },
        dispose: function () {
            var me = this;
            if (me._disposed) {
                return;
            }
            me._disposed = true;
            me.hide()
            me.ema.dispose();
            me.getNode().remove()
        },
        hide: function () {
            var me = this;
            me.getNode().hide()
        },
        show: function () {
            var me = this;
            EMA.fire(EVENT.COMMON.VIEWCHANGE);
            me.getNode().show();
        },
        setParams: function (data) {
            var me = this;
            me.params = data;
        },
        getParams: function () {
            var me = this;
            return me.params;
        },
        getNode: function () {
            var me = this;
            return me.node;
        },
        setNode: function (node) {
            var me = this;
            me.node = node;
        },
        getViewName: function () {
            var me = this;
            return me.viewName;
        },
        setViewName: function (viewName) {
            var me = this;
            me.viewName = viewName;
            me.node.attr("id",viewName);
        }

    });
    /**
     * 页面视图
     * */
    view.page = view.view.extend({
        ctor: function () {
            this._super()
            var me = this;
            me.cachePage = false; //设置该页面缓存不释放
            me.basePage = false; //设置该页面是基础页面。page的最基本页面
            console.log("view.page.ctor");
        },
        init: function () {
            var me = this;
            if (me.disposed) {
                return
            }
            me.onInit(me.getParams())
        },
        onInit: function (data) {

        },
        executeOne: function (data) {
            console.log("view.page.executeOne");

        },
        isCachePage: function (data) {
            var me = this;
            return me.cachePage
        },
        isBasePage: function (data) {
            var me = this;
            return me.basePage
        },
        hideBefore: function () {
            return true
        },
        reloadPage: function (data) {
            console.log("view.page.reloadPage");
            var me = this;
            view.pageViewMg.setCurrentPage(me);
            me.setParams(data);
            if (!me._executeOneEd) {
                me.executeOne(data);
                me._executeOneEd = true;
            }
        }
    });

    view.viewMg = Class.extend({
        ctor: function () {
            var me = this;

        },
        back: function () {
            var me = this;

        },
        getContainer: function () {
            var me = this;

        },
        createPage: function (pagename, data, fn) {
            var me = this;
            createPage(pagename, data, function (page) {
                var pageNode = page.getNode();
                var container = me.getContainer();
                container.append(pageNode);
                page.init(data);
                page.setManger(me);
                fn(pagename, page, data);
            })
        }
    });

    view._pageViewMg = view.viewMg.extend({
        pageList : [],
        currentPage:null,
        _pageContainer:null,
        oldPageName:"",
        ctor: function () {
            var me = this;
        },
        setCurrentPage: function (page) {
            var me = this;
            me.currentPage = page;
        },
        getCurrentPage: function (page) {
            var me = this;
            return me.currentPage;
        },
        getCurrentPageName: function (page) {
            var me = this;
            if (me.currentPage) {
                return me.currentPage.getViewName();
            }
        },
        getContainer: function () {
            var me = this;
            if (!me._pageContainer) {
                me._pageContainer = $(view.config.pageContainer);
            }
            return me._pageContainer
        },
        hasPage: function (name) {
            var me = this;
            for (var currPageCache in me.pageList) {
                var page = currPageCache.page;
                if (name == currPageCache.pagename) {
                    return true;
                }
            }
            return false;
        },
        showLastPage: function (data) {
            var me = this;
            me.oldPageName = me.getCurrentPageName();
            var length = me.pageList.length;
            var lock = false;
            var showPageData = null;
            for (var k = length - 1; k >= 0; k--) {
                var currPageCache = me.pageList[k];
                var page = currPageCache.page;
                if (!currPageCache.hide && !lock) {
                    currPageCache.data = data || currPageCache.data;
                    me._pushPageName = currPageCache.pagename;
                    showPageData = currPageCache;
                    lock = true;
                    currPageCache.hide = null;
                } else {
                    page.hide()
                }
            }
            if (showPageData) {
                var page = showPageData.page;
                page.show();
                page.setParams(showPageData.data);
                page.reloadPage(showPageData.data);
            }

            if (me.oldPageName != me.getCurrentPageName()) {
                EMA.fire(EVENT.COMMON.PAGECHANGE, me.getCurrentPageName(), me.oldPageName)
            }
        },
        getOldPageName: function () {
            var me = this;
            return me.oldPageName || "";
        },
        clearPage: function (name) {
            var me = this;
            var length = me.pageList.length;

            for (var i = length - 1; i >= 0; i--) {
                var currPageCache = me.pageList[i];
                var page = currPageCache.page;
                var pageName = currPageCache.pagename;
                if (name == pageName) {
                    page.dispose();
                    me.pageList.splice(i, 1)
                    break
                }
            }
            me.showLastPage();
        },
        clearAll: function () {
            var me = this;
            for (var currPageCache in me.pageList) {
                var page = currPageCache.page;
                var pageName = currPageCache.pagename;
                page.dispose();
            }
            me.pageList = {}
            me._pushPageName = ""
        },
        showPage: function (pageName, data) {
            var me = this;
            console.log("showPage////->", pageName, data)
            if (pageName == me._pushPageName) {
                return
            }
            if (!me._isAbleChangePage()) {
                return
            }
            me._pushPageName = pageName
            console.log("_pageViewMg.showPage->" + pageName)


            var isOld = false //是否是老页面

            for (var k = me.pageList.length - 1; k >= 0; k--) {

                var currPageCache = me.pageList[k]
                var currPage = currPageCache.page
                if (currPage) {
                    if (currPage.getViewName() == pageName) {
                        isOld = true
                    }
                    if (currPage.isCachePage() && !currPage.isBasePage()) {
                        currPageCache.hide = true
                    }
                    //如果缓存页面，以及同名页面隐藏该页面不用销毁
                    if (currPage.isCachePage() || currPage.isBasePage() || currPage.getViewName() == pageName) {
                        currPage.hide()
                    } else {
                        //销毁该页面
                        currPage.dispose()
                        me.pageList.splice(k, 1)

                    }
                }
            }

            //如果是老页面。把该页面置顶
            if (isOld) {
                for (var i = me.pageList.length - 1; i >= 0; i--) {

                    var currPage = currPageCache.page
                    if (currPage.getViewName() == pageName) {
                        currPageCache.hide = null
                        me.pageList.splice(i, 1)
                        me.pageList[me.pageList.length] = currPageCache
                        break
                    }
                }
                me.showLastPage(data)

            } else {
                //如果不是老页面 创建新页面 加入pagelist
                me.createPage(pageName, data, function (pagename, page, data) {
                    var pageCache = {}
                    pageCache.page = page
                    pageCache.pagename = pagename
                    pageCache.data = data
                    me.pageList[me.pageList.length] = pageCache
                    me.showLastPage(data)
                })
            }

        },
        pushPage: function (pageName, data) {
            var me = this;
            console.log("pushPage////>", pageName, data)
            if (pageName == me._pushPageName) {
                return
            }
            if (!me._isAbleChangePage()) {
                return
            }
            me._pushPageName = pageName

            console.log("_pageViewMg.pushPage->" + pageName)

            var isOld = false //是否是老页面
            for (var i = me.pageList.length - 1; i >= 0; i--) {
                var currPageCache = me.pageList[i]
                var currPage = currPageCache.page;
                if (currPage.getViewName() == pageName) {
                    isOld = true
                    break
                }
            }
            if (isOld) {
                for (var k = me.pageList.length - 1; k >= 0; k--) {

                    var currPageCache = me.pageList[k];
                    var currPage = currPageCache.page;
                    if (currPage) {
                        //如果找到要显示的页面在缓存中，把该页面置顶然后，结束查找，
                        if (currPage.getViewName() == pageName) {

                            me.pageList.splice(k, 1);

                            if (currPage.isCachePage() && !currPage.isBasePage()) {
                                currPageCache.hide = null
                                me.pageList[me.pageList.length] = currPageCache
                            } else {
                                currPage.dispose()
                                me.createPage(pageName, data, function (pagename, page, data) {
                                    var pageCache = {}
                                    pageCache.page = page
                                    pageCache.pagename = pagename
                                    pageCache.data = data
                                    me.pageList[me.pageList.length] = pageCache
                                })
                            }

                            break
                        }

                    }
                }
                me.showLastPage(data)

            } else {
                //如果不是老页面 创建新页面 加入pagelist
                me.createPage(pageName, data, function (pagename, page, data) {
                    var pageCache = {};
                    pageCache.page = page;
                    pageCache.pagename = pagename;
                    pageCache.data = data;
                    me.pageList[me.pageList.length] = pageCache;
                    me.showLastPage(data)
                })
            }

        },
        getLastPageCacheData: function () {
            var me = this;
            var length = me.pageList.length;
            var lockIndex = length;
            for (var k = me.pageList.length - 1; k >= 0; k--) {

                var currPageCache = me.pageList[k];
                if (currPageCache.pagename == me.getCurrentPageName()) {
                    lockIndex = k
                }
            }
            return {page: me.pageList[lockIndex], index: lockIndex}
        },
        backPage: function (data) {
            var me = this;
            if (!me._isAbleChangePage()) {
                return
            }
            this._super(data);
            var lastPageCacheData = me.getLastPageCacheData();
            var lastPageCache = lastPageCacheData.page, index=lastPageCacheData.index;
            var lastPage = lastPageCache.page;
            if (!lastPage.hideBefore()) {
                return
            }

            //[[如果是基本页面提示不能退出，或者提示退出游戏]]
            if (lastPage.isBasePage()) {
                console.log("基本页面不能退出")
            } else {
                if (lastPage.isCachePage()) {
                    //缓存页面直接隐藏该页面并放到底部
                    lastPage.hide();
                    lastPageCache.hide = true

                } else {
                    lastPage.dispose();
                    me.pageList.splice(index, 1)
                }
            }


            me.showLastPage(data)
        },
        _isAbleChangePage: function () {
            var me = this;
            var lastPageCache = me.pageList[me.pageList.length - 1];
            if (lastPageCache) {
                var lastPage = lastPageCache.page;
                if (lastPage.hideBefore()) {
                    return true
                } else {
                    return false
                }
            } else {
                return true
            }
        }

    });

    view.pageViewMg = new view._pageViewMg();
    view.htmlMg = new view._htmlMg();
    ctx.view = view
})(this);
