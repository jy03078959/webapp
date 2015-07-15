(function (ctx) {

    var view = {};
    view.__pages = {};
    view.config = {
        pageContainer: "#page"
    }
    view.setConfig = function (data) {
        $.extend(view.config, data)
    }
    var _pageViewMg = {}

    var createPage = function (name, data, cb) {
        var me = this;
        var pageExt = view.__pages[name];
        var deal = function (pageExt, cb) {
            var pageObject = null;
            if (typeof pageExt === "function") {
                pageExt = pageExt();
            }
            if (pageExt != null) {
                var pageClass = view.Page.extend(pageExt);
                pageObject = new pageClass(data);

            }
            pageObject.setViewName(name);
            cb(pageObject);
        }

        if (!view.__pages[name]) {
            requirejs(["js/view/" + name + ".js"], function () {
                pageExt = view.__pages[name];
                deal(pageExt, cb);
            }, function () {
                $.warn("加载的" + name + ".js文件必须存在");
            })
            $.log("加载" + name);
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
    view._currentPage = "f_main";

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
            var node = $("div");
            node.css("pageBase");
            me.setNode(node);

            me.ema = EMA.getProxy();
            me.params = param || {}
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
            $(me.getNode()).hide()
        },
        show: function () {
            var me = this;
            EMA:fire(EVENT.COMMON.VIEWCHANGE)
            $(me.getNode()).show()
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
        }

    });

    /*
     * 页面视图
     * */
    view.page = view.view.extend({
        ctor: function () {
            this._super()
            var me = this;
            me.cachePage = false; //设置该页面缓存不释放
            me.basePage = false; //设置该页面是基础页面。page的最基本页面
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
            this._super(data)
            var me = this;
            _pageViewMg.setCurrentPage(me)
            me.setParams(data);
            if (me._executeOneEd) {
                me.executeOne(data)
                me._executeOneEd = true
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

    view.pageViewMg = view.viewMg.extend({
        ctor: function () {
            var me = this;
            me.pageList = [];
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
            return me.currentPage.getViewName();
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
            for (var k = length - 1; k < 0; k--) {
                var currPageCache = me.pageList[k];
                var page = currPageCache.page;
                if (!currPageCache.hide && !lock) {
                    currPageCache.data = data || currPageCache.data;
                    me._pushPageName = currPageCache.pagename;
                    showPageData = currPageCache;
                    lock = true;
                    currPageCache.hide = null;
                } else {
                    page:hide()
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
            for (var currPageCache in me.pageList) {
                var page = currPageCache.page;
                var pageName = currPageCache.pagename;
                if (name == pageName) {
                    page.dispose();
                    table.remove(self.pageList, k);
                    break
                }
            }
            me.showLastPage()
        },
        clearAll: function (name) {
            var me = this;
            for (var currPageCache in me.pageList) {
                var page = currPageCache.page;
                var pageName = currPageCache.pagename;
                    page.dispose();
            }
            me.pageList = {}
            me._pushPageName = ""
        }
        
    })


    ctx.view = view
})(this)


view.loadPage = function () {

}

view.pageMg = {
    pageList: [],
    /**
     * 得到当前页面
     * @returns {string}
     */
    getCurrentPage: function () {
        var me = this;
        return view._currentPage;
    },
    /**
     * 显示一个页面。
     * @param pagename 显示页面的名称。如果没传。显示最上层页面
     */
    showPage: function (pagename) {
        var me = this;
        var length = me.pageList.length;
        if (pagename == undefined && me.pageList[length - 1]) {
            pagename = me.pageList[length - 1].pagename;
        }
        for (var i = length - 1; i >= 0; i--) {
            var page = me.pageList[i];
            if (page.pagename == pagename) {
                page.page.show();
                break;
            } else {
                if (page.pagename != "f_main") {
                    page.page.close();
                    me.pageList.pop();
                }
            }
        }

        page.page.setParams(page.data);
        //判断是否需要全屏显示内容
        me.refreshContainerSize(page.page.isFullScreen);
        /*  pageContainer.runAction($.animation.bounceIn(.3,function(){
         if( page.page.resPreload ){
         page.page.reloadPage(page.data);
         }else{
         page.page.transitiondidFinish();
         }
         }));*/

        if (page.page.resPreload) {
            page.page.reloadPage(page.data);
        } else {
            page.page.transitiondidFinish();
        }
    },
    loadPage: function (pagename, data) {
        var me = this;
        var length = me.pageList.length;
        for (var i = length - 1; i > 0; i--) {
            var page = me.pageList.pop();
            page.page.close();
        }
        me.pushPage(pagename, data);
    },
    clearAllPage: function () {
        var me = this;
        me._closeAllPage();
    },
    pushPage: function (pagename, data) {
        var me = this;
        var oldpage = _.find(me.pageList, function (value) {
            return pagename == value.pagename;
        })
        if (!oldpage) {
            me.createPage(pagename, data, function (pagename, page, data) {
                //设置原来页面隐藏
                var prePage = me.pageList[me.pageList.length - 1];
                if (prePage) {
                    prePage.page.hide();
                }
                //添加当前页面
                me.pageList.push({
                    pagename: pagename,
                    page: page,
                    data: data
                })
                //调用显示当前页面
                me.showPage(pagename);
            })
        } else {
            oldpage.data = data;
            me.showPage(pagename);
        }
    },
    createPage: function (pagename, data, fn) {
        var me = this;
        view.createPage(pagename, function (page) {
            me._currentPage = page;
            var pageNode = page.getNode();
            pageNode.setHitTestMode(pageNode.getHitTestMode() | TP_HITTESTMODE_ENABLE_TOUCH);
            pageContainer.addChild(pageNode)
            pageNode.setAnchorPoint(cc.p(0, 0));
            pageNode.setPosition(cc.p(0, 0));

            pageNode.__name__ = pagename;
            me.refreshContainerSize(page.isFullScreen);
            pageNode.setContentSize(pageContainer.getContentSize());
            pageNode.setVisible(false);
            page.init();
            typeof fn == "function" && fn(pagename, page, data);

        }, data)
    },
    /**
     * 移除最上层页面
     */
    popPage: function (data) {
        var me = this;
        var page = me.pageList.pop();
        var pageName = page.pagename;
        //f_main 页面常驻。不被移除
        if (pageName != "f_main") {
            page.page.close();
            me.showPage();
        }
    },
    /**
     * 关闭所有页面
     */
    closeAllPage: function () {
        var me = this;
        var length = me.pageList.length;
        for (var i = length - 1; i >= 0; i--) {
            var page = me.pageList[i];
            page.page.close();
        }
        me.pageList = [];
    },
    refreshContainerSize: function (isFullScreen) {
        var menuHight = 78;
        var director = cc.Director.getInstance();
        var winSize = director.getWinSize();

        if (!isFullScreen) {
            var pagesize = cc.size(winSize.width, winSize.height - menuHight);
            pageContainer.setContentSize(pagesize);
        } else {
            pageContainer.setContentSize(winSize);
        }

    }
}

view.loadPage = view.showPage = function (pagename, data) {
    $.log(pagename, data);
    try {
        view.pageMg.loadPage(pagename, data);
    } catch (et) {
        $.log(pagename + "------load this page error");
        $.log("description", et.toString());
        $.log("errormessage", et.message);
        $.log("stack trace:")
        var errinfo = et.stack.match(/.*\n/g);
        _.each(errinfo, function (value) {
            $.log(value);
        });
    } finally {
    }
}
view.pushPage = function (pagename, data) {
    $.log(pagename, data);
    try {
        view.pageMg.pushPage(pagename, data);
    } catch (et) {
        $.log(pagename + "------load this page error");
        $.log("description", et.toString());
        $.log("errormessage", et.message);
        $.log("stack trace:")
        var errinfo = et.stack.match(/.*\n/g);
        _.each(errinfo, function (value) {
            $.log(value);
        });
    } finally {
    }
}
view.backPage = function (pagename, data) {
    $.log(pagename, data);
    try {
        view.pageMg.popPage(pagename, data);
    } catch (et) {
        $.log(pagename + "------load this page error");
        $.log("description", et.toString());
        $.log("errormessage", et.message);
        $.log("stack trace:")
        var errinfo = et.stack.match(/.*\n/g);
        _.each(errinfo, function (value) {
            $.log(value);
        });
    } finally {
    }
}