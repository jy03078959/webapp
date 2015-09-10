/*
 *
 * 基础库
 * 继承
 * namespace
 * */
/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype


(function () {
    var initializing = false, fnTest = /xyz/.test(function () {
        xyz;
    }) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    this.Class = function () {
    };

    // Create a new Class that inherits from this class
    Class.extend = function (prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
            typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function (name, fn) {
                    return function () {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if (!initializing && this.ctor)
                this.ctor.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;

        return Class;
    };
})();

(function (ctx) {


    ctx.namespace = function () {
        var a = arguments, o = ctx, i = 0, j, d, arg;
        for (; i < a.length; i++) {
            // d = ('' + a[i]).split('.');
            arg = a[i];
            if (arg.indexOf('.')) {
                d = arg.split('.');
                for (j = 0; j < d.length; j++) {
                    o[d[j]] = o[d[j]] || {};
                    o = o[d[j]];
                }
            } else {
                o[arg] = o[arg] || {};
            }
        }
        return o;
    }

    Function.prototype.bind = function (scope) {
        var fn = this;
        return function () {
            return fn.apply(scope, arguments);
        }
    };

    Function.prototype.delay = function (s) {
        var f = this;
        //if(typeof s == 'number')
        if (!isNaN(s)) {
            setTimeout(f, s);
        }
    };


//限定此函数被调用的次数
    Function.prototype.only = function (i, cb) {
        var t = i;
        var f = this;

        function fc() {
            if (t > 0)
                f.apply(this, arguments);
            if (--t === 0 && cb)
                cb(fc);
        }

        return fc;
    };

    String.format = function () {
        if (arguments.length == 0)
            return null;
        var str = arguments[0];
        for (var i = 1; i < arguments.length; i++) {
            str = str.replace('{' + (i) + '}', arguments[i]);
        }
        return str;
    };

})(this)