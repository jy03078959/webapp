$(function(){

    var app = Class.extend({
        ctor:function(){
            var me = this;
            //this.config
            requirejs.config({
                //By default load any module IDs from js/lib
                baseUrl: 'js/lib',
                //except, if the module ID starts with "app",
                //load it from the js/app directory. paths
                //config is relative to the baseUrl, and
                //never includes a ".js" extension since
                //the paths config could be for a directory.
                paths: {
                    view: '../view',
                    config: '../config'
                }
            });
            var baseJsLib = [
                "config",
                "q",
                //"bootstrap.min",
                "underscore",
                "eventManager",
                "mvc"
            ];
            requirejs(baseJsLib,
                function () {

                    me._initEvent();

                    view.setConfig({
                        pageContainer: "#page"
                    })

                    Q.reg("page",function(method,pageName,data){
                        console.log(pageName,method,data);
                        if(data){
                            data = JSON.parse(decodeURIComponent(data));
                        }
                        if(method=="push"){
                            view.pageViewMg.pushPage(pageName,data)
                        }else if(method=="show"){
                            view.pageViewMg.showPage(pageName,data)
                        }else{
                            console.warn("url不存在打开方法。请查看");
                        }
                    });

                    Q.init({
                        key:'!',
                        index:'page/show/f_home'/* 首页地址 */
                    });
                });

        },
        _initEvent:function(){
            var me = this;
            EMA.bind(EVENT.COMMON.VIEWCHANGE,me.firstPageLoadEnd.bind(this));
        },
        pushPage:function(pageName,data){
            location.hash=String.format("#!page/push/{1}/{2}",pageName,encodeURIComponent(JSON.stringify(data)||""));
        },
        showPage:function(pageName,data){
            location.hash=String.format("#!page/show/{1}/{2}",pageName,encodeURIComponent(JSON.stringify(data)||""));
        },
        backPage:function(){
            history.back();
        },
        firstPageLoadEnd:function(){
            var me = this;
            if(!me._firstPageLoadEnd){
                $("#page").show();
                $("#welcome").fadeOut();
                me._firstPageLoadEnd = true;
            }
        }
    })
    window.app = new app();


})