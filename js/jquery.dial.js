/*

 Modified by Mesheven, repo url: https://github.com/mygoare/jquery.dial

 Optimize the plugin based on: http://www.websanova.com/blog/jquery/10-coding-tips-to-write-superior-jquery-plugins#.UwsRSUKSxgs

 */

(function($){

    function Dial(props, settings)
    {
        this.dial = null;
        this.dialTop = null;
        this.currentDeg = 0;
        this.v = 0;
        this.doc = $(document);

        this.$el = null;
        this.el = null;

        // moveOrientation horizontal or vertical
        this.pos = 0;

        if (typeof props == 'object')
        {
            settings = props;
        }

        this.options = $.extend({}, $.fn.dial.defaultSettings, settings || {});

        this.snap = this.options.angleArc / ( this.options.piece || (this.options.max - this.options.min) );

        //  rateLimit
        this.timer = null;
    }

    Dial.prototype =
    {
        generate: function(element)
        {
            this.$el = $(element);
            this.el  = element;
            var tpl = '<div class="dial">\
                           <div class="top"></div>\
                           <div class="base"></div>\
                       </div>';

            this.$el.append(tpl);
            this.dial = $('.dial', this.$el);
            this.dialTop = this.dial.find('.top');
            this.dial.addClass('dial-' + this.options.className);

            this.init(this.options.value);

            return this;
        },
        init: function(v)
        {
            if (typeof v !== 'number' && v < this.options.min && v > this.options.max)
            {
                return false;
            }

            // v calculate out d
            this.v = v;
            var d = (v - this.options.min) / (this.options.max - this.options.min) * this.options.angleArc + this.options.angleOffset;

            this.currentDeg = d; // init need
            this.rotate(d);

            // 给第三方初始化使用
            this.options.init(v / (this.options.max - this.options.min));
        },
        rotate: function(d)
        {
            if (d < 0)
            {
                d = d + 360;
            }

            this.dialTop.css('transform','rotate('+(d)+'deg)');
        },
        calVal: function()
        {
            this.v = (this.currentDeg - this.options.angleOffset) / this.options.angleArc * (this.options.max - this.options.min) + this.options.min;
            this.v = Math.round(this.v);
        },
        clickRotate: function(e, rad2deg, offset, endDeg)
        {
            e = (e.originalEvent.touches) ? e.originalEvent.touches[0] : e;

            var moveOrientation = this.options.moveOrientation,
                deg;
            if (moveOrientation === "rotate")
            {
                var a, b,
                    p = this.dial.offset(),  // need real time p and center value
                    center =
                    {
                        y: p.top + this.dial.height() / 2,
                        x: p.left + this.dial.width() / 2
                    };

                a = center.y - e.pageY;
                b = center.x - e.pageX;
                deg = Math.atan2(a,b)*rad2deg;  // -180 ~ 180 degree
//console.error(center, e.pageX, e.pageY, deg);

                var buffer = (360 - this.options.angleArc) / 2;
                // console.error(deg);
                if (deg > -180 && deg < endDeg - 360 + buffer)  // 加点buffer 给endDeg 边界 一些缓冲, 如果angleArc 为360，即全圆转圈时，buffer计算得出为 0
                {
                    deg = 180 + (180 - Math.abs(deg));
                }
            }
            else if (moveOrientation === "horizontal")
            {
                deg = this.currentDeg;
                deg += (e.pageX - this.pos) * this.snap / Math.abs(this.options.moveSensitivity);
                this.pos = e.pageX;
            }
            else if (moveOrientation === "vertical")
            {
                deg = this.currentDeg;
                console.log(this.currentDeg);
                deg += (e.pageY - this.pos) * this.snap / Math.abs(this.options.moveSensitivity);
                this.pos = e.pageY;
            }

            // handle with Boundary of two sides
            if (deg > endDeg)
            {
                deg = endDeg;
            }
            else if (deg < offset)
            {
                deg = offset;
            }

            this.currentDeg = deg;

            // rotate top decoration degree
            this.rotate(this.currentDeg);

            // calculate value
            this.calVal();
            var turn = function()
            {
                this.options.turn(this.v, this.currentDeg)
            };
            this.rate(turn.bind(this));
        },
        bind: function()
        {
            var _this = this;

            // define variables
            var rad2deg = 180 / Math.PI,
                offset = this.options.angleOffset,
                arc = this.options.angleArc,
                endDeg = offset + arc;

            this.dial.on('mousedown touchstart', function(e)
            {
                e.preventDefault();
                e = e.originalEvent.touches ? e.originalEvent.touches[0] : e;

                switch (_this.options.moveOrientation)
                {
                    case "rotate":
                        _this.clickRotate(e, rad2deg, offset, endDeg);
                        break;
                    case "horizontal":
                        _this.pos = e.pageX;
                        break;
                    case "vertical":
                        _this.pos = e.pageY;
                        break;
                }

                _this.doc.on('mousemove.rem touchmove.rem',function(e)
                {
                    _this.clickRotate(e, rad2deg, offset, endDeg);
                });

                _this.doc.on('mouseup.rem  touchend.rem',function()
                {
                    _this.doc.off('.rem');

                    _this.options.change(_this.v, _this.currentDeg);
                });

            });

            // mouse wheel support
            if (_this.options.mouseWheel === true)
            {
                this.dial.on("DOMMouseScroll mousewheel", function(e)
                {
                    e.preventDefault();
                    var snap = _this.snap;

                    if (e.originalEvent.detail > 0 || e.originalEvent.wheelDelta < 0)
                    {
                        _this.currentDeg -= snap;
                    }
                    else
                    {
                        _this.currentDeg += snap;
                    }

                    // handle with Boundary of two sides
                    if (_this.currentDeg > endDeg)
                    {
                        _this.currentDeg = endDeg;
                    }
                    else if (_this.currentDeg < offset)
                    {
                        _this.currentDeg = offset;
                    }

                    // rotate top decoration degree
                    _this.rotate(_this.currentDeg);

                    // calculate value
                    _this.calVal();
                    _this.options.turn(_this.v, _this.currentDeg);

                    _this.options.change(_this.v, _this.currentDeg);
                });
            }

        },
        rate: function(cb)
        {
            var _this = this,
                rateLimitValue = _this.options.rateLimit;

            if (!_this.timer)
            {
                _this.timer = setTimeout(function()
                {
                    cb();
                    _this.timer = null;
                }, rateLimitValue);
            }
        },
        destroy: function()
        {
            this.$el.empty().removeData('dial');
            // delete element.$el sign
            delete this.el.$el;
        }
    };

    $.fn.dial = function(props, settings)
    {
        return this.each(
            function(index, element)
            {
                var dial = new Dial(props, settings);

                if (!this.$el)
                {
                    this.$el = $(this);
                    dial.generate(this)
                        .bind();

                    this.$el.data('dial', dial);
                }
            }
        );
    };

    $.fn.dial.defaultSettings =
    {
        min             : 0,
        max             : 100,
        angleOffset     : 0,  // it is a value between -180 ~ 180
        angleArc        : 360,
        className       : "default",
        value           : 0,
        turn            : function (value, deg) {
        },
        change          : function (value, deg) {
        },
        init            : function (percent) {

        },  // do something third part needs
        moveOrientation : "rotate",  // horizontal, vertical
        mouseWheel      : true,
        rateLimit       : 400,
        moveSensitivity : 20  // number smaller, changes moved more sensitive, must greater than 0
    };

})(jQuery);
