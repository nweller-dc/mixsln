define("#mix/sln/0.1.0/components/xTitlebar-debug", [ "mix/core/0.3.0/base/reset-debug", "mix/core/0.3.0/base/class-debug", "mix/core/0.3.0/url/navigate-debug", "mix/core/0.3.0/base/util-debug", "mix/sln/0.1.0/components/xBase-debug", "mix/sln/0.1.0/components/xBack-debug" ], function(require, exports, module) {
    TEMPLATE = [ "<div>", '<section class="center"></section>', '<section class="left"></section>', '<section class="right"></section>', "</div>" ].join("");
    require("mix/core/0.3.0/base/reset-debug");
    var win = window, doc = win.document, Class = require("mix/core/0.3.0/base/class-debug"), navigate = require("mix/core/0.3.0/url/navigate-debug").singleton, util = require("mix/core/0.3.0/base/util-debug").singleton, xBase = require("mix/sln/0.1.0/components/xBase-debug"), xBack = require("mix/sln/0.1.0/components/xBack-debug"), xName = "x-titlebar", className = xName, xTitlebar = xBase.create(xName, className, {
        init: function() {
            var that = this, module = that._module, wrap, center, left, right, button;
            wrap = doc.createElement("div");
            center = doc.createElement("section");
            left = doc.createElement("section");
            right = doc.createElement("section");
            button = doc.createElement("button");
            left.appendChild(button);
            wrap.appendChild(center);
            wrap.appendChild(left);
            wrap.appendChild(right);
            module.appendChild(wrap);
        },
        enable: function() {
            var that = this, module = that._module, button = module.querySelector("div > section:nth-child(2) button");
            that.xback = xBack.create(button);
            that.xback.enable();
        },
        disable: function() {
            var that = this;
            that.xback.disable();
        },
        _setContent: function(el, content) {
            if (content != null) {
                var isType = Object.isTypeof(content);
                if (isType === "string") {
                    el.innerHTML = content;
                } else {
                    if (isType !== "array") {
                        content = [ content ];
                    }
                    el.innerHTML = "";
                    Object.each(content, function(item) {
                        el.appendChild(item);
                    });
                }
            }
        },
        change: function(contents, movement) {
            var that = this, isEnabled = that._isEnabled, module = that._module, wrap = module.querySelector("div");
            if (isEnabled) {
                function handler(e) {
                    wrap.className = "";
                    wrap.removeEventListener("webkitTransitionEnd", handler);
                }
                wrap.className = movement;
                that.set(contents);
                setTimeout(function() {
                    wrap.className += " transition";
                    wrap.addEventListener("webkitTransitionEnd", handler, false);
                }, 1);
            }
        },
        set: function(contents) {
            var that = this, isEnabled = that._isEnabled, module = that._module, center = module.querySelector("div > section:first-child"), left = module.querySelector("div > section:nth-child(2)"), right = module.querySelector("div > section:last-child");
            if (isEnabled) {
                that._setContent(center, contents.center);
                that._setContent(left, contents.left);
                that._setContent(right, contents.right);
            }
        }
    });
    return xTitlebar;
});