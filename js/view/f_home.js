/**
 * Created with JetBrains WebStorm.
 * User: stoneship
 * Email:258137678@qq.com
 * Date: 15/7/12
 * Time: 下午4:28
 * To change this template use File | Settings | File Templates.
 */
view.definePage("f_home",function () {
    "use strict";
    return {
        ctor: function (data) {
            var me = this;
            this._super(data);
            console.log("view.f_home.ctor");
        },
        executeOne: function (data) {
            var me = this;
            this._super(data);
            console.log("executeOne",data);

        },
        reloadPage: function (data) {
            var me = this;
            this._super(data);


        },
        show:function(){
            this._super();
        }

    }
});

