$(function(){
    requirejs.config({
        //By default load any module IDs from js/lib
        baseUrl: 'js/lib',
        //except, if the module ID starts with "app",
        //load it from the js/app directory. paths
        //config is relative to the baseUrl, and
        //never includes a ".js" extension since
        //the paths config could be for a directory.
        paths: {
            view: '../view'
        }
    });
    var baseJsLib = [
        "q",
        "underscore",
        "base",
        "eventManager",
        "mvc"
    ];
    requirejs(baseJsLib,
        function () {
            Q.reg("page",function(pageName,data){
                console.log(pageName,data);
            });

            Q.init({
                key:'!',
                index:'page/home'/* 首页地址 */
            });
        });
})