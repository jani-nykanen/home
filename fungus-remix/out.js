var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
window.onload = function () {
    (new Core((new Config()).push("canvas_width", "256")
        .push("canvas_height", "192")
        .push("framerate", "60")
        .push("asset_path", "assets/assets.json"), (new Controller()).addButton("fire1", "KeyZ", 0)
        .addButton("fire2", "KeyX", 1)
        .addButton("fire3", "KeyC", 2)
        .addButton("start", "Enter", 9, 7)
        .addButton("back", "Escape", 8, 6)
        .addButton("left", "ArrowLeft", 14)
        .addButton("up", "ArrowUp", 12)
        .addButton("right", "ArrowRight", 15)
        .addButton("down", "ArrowDown", 13))).run(new AudioIntroScene());
};
var AssetPack = (function () {
    function AssetPack(path) {
        this.bitmaps = new Array();
        this.sounds = new Array();
        this.total = 1;
        this.loaded = 0;
        this.loadListFile(path);
    }
    AssetPack.prototype.loadListFile = function (path) {
        var _this = this;
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("text/json");
        xobj.open("GET", path, true);
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4) {
                if (String(xobj.status) == "200") {
                    _this.parseAssetList(JSON.parse(xobj.responseText));
                }
                ++_this.loaded;
            }
        };
        xobj.send(null);
    };
    AssetPack.prototype.loadBitmap = function (name, path) {
        var _this = this;
        ++this.total;
        var image = new Image();
        image.onload = function () {
            ++_this.loaded;
            _this.bitmaps.push(new KeyValuePair(name, new Bitmap(image)));
        };
        image.src = path;
    };
    AssetPack.prototype.loadSample = function (name, path) {
        var _this = this;
        ++this.total;
        this.sounds.push(new KeyValuePair(name, new Howl({
            src: [path],
            onload: function () {
                ++_this.loaded;
            }
        })));
    };
    AssetPack.prototype.parseAssetList = function (data) {
        var bitmapPath = data.bitmapPath;
        for (var _i = 0, _a = data.bitmaps; _i < _a.length; _i++) {
            var b = _a[_i];
            this.loadBitmap(b.name, bitmapPath + b.path);
        }
        var soundPath = data.soundPath;
        for (var _b = 0, _c = data.sounds; _b < _c.length; _b++) {
            var b = _c[_b];
            this.loadSample(b.name, soundPath + b.path);
        }
    };
    AssetPack.prototype.hasLoaded = function () {
        return this.loaded >= this.total;
    };
    AssetPack.prototype.getLoadingRatio = function () {
        return (this.total == 0 ? 1 : this.loaded / this.total);
    };
    AssetPack.prototype.getBitmap = function (name) {
        for (var _i = 0, _a = this.bitmaps; _i < _a.length; _i++) {
            var b = _a[_i];
            if (b.key == name)
                return b.value;
        }
        return null;
    };
    AssetPack.prototype.getSound = function (name) {
        for (var _i = 0, _a = this.sounds; _i < _a.length; _i++) {
            var b = _a[_i];
            if (b.key == name)
                return b.value;
        }
        return null;
    };
    return AssetPack;
}());
var AudioPlayer = (function () {
    function AudioPlayer() {
        var DEFAULT_VOL = 1.0;
        this.enabled = true;
        this.sampleVol = DEFAULT_VOL;
        this.musicVol = DEFAULT_VOL;
        this.musicID = null;
        this.musicSound = null;
        this.volCache = 0.0;
        this.paused = false;
    }
    AudioPlayer.prototype.setGlobalSampleVolume = function (vol) {
        if (vol === void 0) { vol = 1.0; }
        vol = clamp(vol, 0.0, 1.0);
        this.sampleVol = vol;
    };
    AudioPlayer.prototype.toggle = function (state) {
        this.enabled = state;
        if (!state) {
            if (this.musicSound != null &&
                this.musicID != null) {
                this.musicSound.volume(0.0, this.musicID);
            }
        }
        else {
            if (this.musicSound != null &&
                this.musicID != null) {
                this.musicSound.volume(this.volCache, this.musicID);
            }
        }
    };
    AudioPlayer.prototype.fadeInMusic = function (sound, vol, time) {
        if (vol === void 0) { vol = 1.0; }
        if (time === void 0) { time = 1000; }
        if (!this.enabled)
            return;
        if (this.musicID == null) {
            this.musicID = sound.play();
            this.musicSound = sound;
        }
        this.volCache = vol * this.musicVol;
        sound.volume(vol * this.musicVol, sound);
        sound.loop(true, this.musicID);
        if (!this.enabled)
            vol = 0.0;
        sound.fade(0.0, vol * this.musicVol, time, this.musicID);
    };
    AudioPlayer.prototype.fadeOutMusic = function (sound, vol, time) {
        if (vol === void 0) { vol = 0.0; }
        if (time === void 0) { time = 1000; }
        if (!this.enabled)
            return;
        if (this.musicID == null) {
            this.musicID = sound.play();
            this.musicSound = sound;
        }
        sound.volume(vol * this.musicVol, sound);
        sound.loop(true, this.musicID);
        if (!this.enabled)
            vol = 0.0;
        sound.fade(vol, 0.0, time, this.musicID);
    };
    AudioPlayer.prototype.stopMusic = function () {
        if (!this.enabled)
            return;
        if (this.musicSound == null || this.musicID == null)
            return;
        this.musicSound.stop(this.musicID);
        this.musicID = null;
        this.musicSound = null;
    };
    AudioPlayer.prototype.pauseMusic = function () {
        if (!this.enabled)
            return;
        if (this.paused)
            return;
        if (this.musicSound == undefined ||
            this.musicID == undefined)
            return;
        this.musicSound.pause(this.musicID);
        this.paused = true;
    };
    AudioPlayer.prototype.resumeMusic = function () {
        if (!this.enabled)
            return;
        if (!this.paused)
            return;
        this.paused = false;
        this.musicSound.play(this.musicID);
    };
    AudioPlayer.prototype.setMusicVolume = function (v) {
        if (!this.enabled)
            return;
        this.musicSound.volume(v == undefined ? this.volCache : this.volCache * v);
    };
    AudioPlayer.prototype.playSample = function (sound, vol) {
        if (vol === void 0) { vol = 1.0; }
        if (!this.enabled)
            return;
        vol *= this.sampleVol;
        if (!sound.playID) {
            sound.playID = sound.play();
            sound.volume(vol, sound.playID);
            sound.loop(false, sound.playID);
        }
        else {
            sound.stop(sound.playID);
            sound.volume(vol, sound.playID);
            sound.loop(false, sound.playID);
            sound.play(sound.playID);
        }
    };
    return AudioPlayer;
}());
var Bitmap = (function () {
    function Bitmap(img) {
        this.img = img;
        this.width = img.width;
        this.height = img.height;
    }
    return Bitmap;
}());
function createFilledBitmap(bmp, w, h) {
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var c = canvas.getContext("2d");
    for (var y = 0; y < Math.floor(h / bmp.height) + 1; ++y) {
        for (var x = 0; x < Math.floor(w / bmp.width) + 1; ++x) {
            c.drawImage(bmp.img, x * bmp.width, y * bmp.height);
        }
    }
    return new Bitmap(canvas);
}
var Canvas = (function () {
    function Canvas(w, h, ap) {
        this.canvas = null;
        this.ctx = null;
        this.width = w;
        this.height = h;
        this.assets = ap;
        this.tr = new Vector2();
        this.createHtml5Canvas(w, h);
        this.clear(0, 0, 0);
        this.resize(window.innerWidth, window.innerHeight);
    }
    Canvas.prototype.createHtml5Canvas = function (w, h) {
        var cdiv = document.createElement("div");
        cdiv.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1");
        this.canvas = document.createElement("canvas");
        this.canvas.width = w;
        this.canvas.height = h;
        this.canvasBuffer = document.createElement("canvas");
        this.canvasBuffer.width = w;
        this.canvasBuffer.height = h;
        this.canvas.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;" +
            "image-rendering: optimizeSpeed;" +
            "image-rendering: pixelated;" +
            "image-rendering: -moz-crisp-edges;");
        cdiv.appendChild(this.canvas);
        document.body.appendChild(cdiv);
        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;
    };
    Canvas.prototype.resize = function (w, h) {
        var c = this.canvas;
        var x, y;
        var width, height;
        var mul = Math.min((w / c.width) | 0, (h / c.height) | 0);
        width = c.width * mul;
        height = c.height * mul;
        x = w / 2 - width / 2;
        y = h / 2 - height / 2;
        var top = String(y | 0) + "px";
        var left = String(x | 0) + "px";
        c.style.height = String(height | 0) + "px";
        c.style.width = String(width | 0) + "px";
        c.style.top = top;
        c.style.left = left;
    };
    Canvas.prototype.setColor = function (r, g, b, a) {
        if (r === void 0) { r = 255; }
        if (a === void 0) { a = 1.0; }
        if (r == undefined)
            r = 255;
        if (g == undefined)
            g = r;
        if (b == undefined)
            b = g;
        var s = getColorString(r, g, b, a);
        this.ctx.fillStyle = s;
        this.ctx.strokeStyle = s;
    };
    Canvas.prototype.clear = function (r, g, b, a) {
        this.setColor(r, g, b, a);
        this.fillRect(0, 0, this.width, this.height);
    };
    Canvas.prototype.fillRect = function (x, y, w, h) {
        var c = this.ctx;
        x += this.tr.x;
        y += this.tr.y;
        c.fillRect(x, y, w, h);
    };
    Canvas.prototype.drawBitmap = function (bmp, dx, dy, flip) {
        this.drawBitmapRegion(bmp, 0, 0, bmp.width, bmp.height, dx, dy, flip);
    };
    Canvas.prototype.drawScaledBitmap = function (bmp, dx, dy, dw, dh, flip) {
        this.drawScaledBitmapRegion(bmp, 0, 0, bmp.width, bmp.height, dx, dy, dw, dh, flip);
    };
    Canvas.prototype.drawBitmapRegion = function (bmp, sx, sy, sw, sh, dx, dy, flip) {
        this.drawScaledBitmapRegion(bmp, sx, sy, sw, sh, dx, dy, sw, sh, flip);
    };
    Canvas.prototype.drawScaledBitmapRegion = function (bmp, sx, sy, sw, sh, dx, dy, dw, dh, flip) {
        if (sw <= 0 || sh <= 0)
            return;
        var c = this.ctx;
        dx += this.tr.x;
        dy += this.tr.y;
        sx |= 0;
        sy |= 0;
        sw |= 0;
        sh |= 0;
        dx |= 0;
        dy |= 0;
        if (flip) {
            c.save();
            c.translate(dw, 0);
            c.scale(-1, 1);
            dx *= -1;
        }
        c.drawImage(bmp.img, sx, sy, sw, sh, dx, dy, dw, dh);
        if (flip) {
            c.restore();
        }
    };
    Canvas.prototype.drawText = function (font, str, dx, dy, xoff, yoff, center) {
        var cw = font.width / 16;
        var ch = cw;
        var x = dx;
        var y = dy;
        var c;
        if (center) {
            dx -= (str.length * (cw + xoff)) / 2.0;
            dx |= 0;
            x = dx;
        }
        for (var i = 0; i < str.length; ++i) {
            c = str.charCodeAt(i);
            if (c == '\n'.charCodeAt(0)) {
                x = dx;
                y += ch + yoff;
                continue;
            }
            this.drawBitmapRegion(font, (c % 16) * cw, ((c / 16) | 0) * ch, cw, ch, x, y, false);
            x += cw + xoff;
        }
    };
    Canvas.prototype.draw3DFloor = function (bmp, dy, h, shift, angle, width, midy, eps) {
        var EPS = 8;
        if (width == undefined) {
            width = bmp.width;
        }
        var w = width;
        var x = this.width / 2 - w / 2;
        var xstep = angle;
        var sy = bmp.height - 1;
        var z;
        if (midy == undefined) {
            midy = this.height / 2;
        }
        else {
            midy = 192 - midy;
        }
        if (eps == undefined) {
            eps = EPS;
        }
        w += h * xstep * 2;
        x -= h * xstep;
        for (var y = 0; y < h; ++y) {
            z = Math.log(1 /
                ((y + eps) / midy))
                / Math.LN2;
            sy = bmp.height / z;
            sy = negMod(sy, bmp.height);
            this.ctx.drawImage(bmp.img, shift, bmp.height - 1 - (sy | 0), width, 1, x | 0, dy + (h - 1 - y), w | 0, 1);
            x += xstep;
            w -= xstep * 2;
        }
    };
    Canvas.prototype.drawSpriteFrame = function (spr, bmp, frame, row, x, y, flip) {
        spr.drawFrame(this, bmp, frame, row, x, y, flip);
    };
    Canvas.prototype.drawSprite = function (spr, bmp, x, y, flip) {
        spr.draw(this, bmp, x, y, flip);
    };
    Canvas.prototype.setAlpha = function (alpha) {
        if (alpha == undefined)
            alpha = 1.0;
        this.ctx.globalAlpha = clamp(alpha, 0, 1);
    };
    Canvas.prototype.move = function (x, y) {
        this.tr.x = x;
        this.tr.y = y;
    };
    Canvas.prototype.moveTo = function (x, y) {
        this.tr.x = x == undefined ? 0 : x;
        this.tr.y = y == undefined ? 0 : y;
    };
    Canvas.prototype.getBitmap = function (name) {
        return this.assets.getBitmap(name);
    };
    Canvas.prototype.copyToBuffer = function () {
        var ctx = this.canvasBuffer.getContext("2d");
        ctx.globalAlpha = 1.0;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.canvas, 0, 0);
    };
    Canvas.prototype.getCanvasBuffer = function () {
        return new Bitmap(this.canvasBuffer);
    };
    Canvas.prototype.fillCircleOutside = function (r, cx, cy) {
        if (r <= 0) {
            this.fillRect(0, 0, this.width, this.height);
            return;
        }
        else if (r * r >= this.width * this.width + this.height * this.height) {
            return;
        }
        if (cx == null)
            cx = this.width / 2;
        if (cy == null)
            cy = this.height / 2;
        var start = Math.max(0, cy - r) | 0;
        var end = Math.min(this.height, cy + r) | 0;
        if (start > 0)
            this.fillRect(0, 0, this.width, start);
        if (end < this.height)
            this.fillRect(0, end, this.width, this.height - end);
        var dy;
        var px1, px2;
        for (var y = start; y < end; ++y) {
            dy = y - cy;
            if (Math.abs(dy) >= r) {
                this.fillRect(0, y, this.width, 1);
                continue;
            }
            px1 = cx - Math.sqrt(r * r - dy * dy);
            px2 = cx + Math.sqrt(r * r - dy * dy);
            px1 |= 0;
            px2 |= 0;
            if (px1 > 0)
                this.fillRect(0, y, px1, 1);
            if (px2 < this.width)
                this.fillRect(px2, y, this.width - px1, 1);
        }
    };
    return Canvas;
}());
var Config = (function () {
    function Config() {
        this.params = new Array();
    }
    Config.prototype.push = function (key, value) {
        this.params.push(new KeyValuePair(key, value));
        return this;
    };
    Config.prototype.getParam = function (name, def) {
        for (var _i = 0, _a = this.params; _i < _a.length; _i++) {
            var p = _a[_i];
            if (p.key == name) {
                return p.value;
            }
        }
        return def;
    };
    return Config;
}());
var ControllerButton = (function () {
    function ControllerButton(name, key, jbutton, jbutton2) {
        this.name = name;
        this.key = key;
        this.jbutton = jbutton;
        this.jbutton2 = jbutton2;
        this.state = State.Up;
    }
    return ControllerButton;
}());
var Controller = (function () {
    function Controller() {
        var _this = this;
        this.getStick = function () { return _this.stick.clone(); };
        this.stick = new Vector2();
        this.buttons = new Array();
        this.forceStickReturn = false;
    }
    Controller.prototype.addButton = function (name, key, jbutton, jbutton2) {
        this.buttons.push(new ControllerButton(name, key, jbutton, jbutton2));
        return this;
    };
    Controller.prototype.initialize = function (input) {
        for (var _i = 0, _a = this.buttons; _i < _a.length; _i++) {
            var b = _a[_i];
            input.preventDefault(b.key);
        }
    };
    Controller.prototype.updateButtons = function (input) {
        var EPS = 0.01;
        for (var _i = 0, _a = this.buttons; _i < _a.length; _i++) {
            var b = _a[_i];
            b.state = input.getKeyState(b.key);
            if (b.state == State.Up) {
                b.state = input.getButtonState(b.jbutton);
                if (b.jbutton2 != undefined && b.state == State.Up) {
                    b.state = input.getButtonState(b.jbutton2);
                }
            }
        }
        this.stick = new Vector2();
        if (this.getButtonState("left") == State.Down) {
            this.stick.x = -1.0;
        }
        else if (this.getButtonState("right") == State.Down) {
            this.stick.x = 1.0;
        }
        if (this.getButtonState("up") == State.Down) {
            this.stick.y = -1.0;
        }
        else if (this.getButtonState("down") == State.Down) {
            this.stick.y = 1.0;
        }
        this.stick.normalize();
        var padStick = input.getGamepadStick();
        if (hypot(this.stick.x, this.stick.y) < EPS &&
            hypot(padStick.x, padStick.y) > EPS) {
            this.stick.x = padStick.x;
            this.stick.y = padStick.y;
        }
        if (this.forceStickReturn) {
            if (hypot(this.stick.x, this.stick.y) <= EPS) {
                this.forceStickReturn = false;
            }
            this.stick.zeroes();
        }
    };
    Controller.prototype.getButtonState = function (name) {
        for (var _i = 0, _a = this.buttons; _i < _a.length; _i++) {
            var b = _a[_i];
            if (b.name == name) {
                return b.state;
            }
        }
        return State.Up;
    };
    Controller.prototype.forceStickReturnToOrigin = function () {
        this.forceStickReturn = true;
    };
    return Controller;
}());
var Core = (function () {
    function Core(conf, gamepad) {
        var _this = this;
        this.assets = new AssetPack(conf.getParam("asset_path", "null"));
        this.canvas = new Canvas(Number(conf.getParam("canvas_width", "320")), Number(conf.getParam("canvas_height", "240")), this.assets);
        this.input = new InputManager();
        this.gamepad = gamepad;
        this.gamepad.initialize(this.input);
        window.addEventListener("resize", function (e) {
            _this.canvas.resize(window.innerWidth, window.innerHeight);
        });
        this.tr = new Transition();
        this.audio = new AudioPlayer();
        this.ev = new CoreEvent(Number(conf.getParam("framerate", "60")), this.assets, this.input, this.gamepad, this.tr, this.audio, this);
        this.initialized = false;
    }
    Core.prototype.drawLoadingScreen = function (c) {
        var barWidth = c.width / 4;
        var barHeight = barWidth / 8;
        c.clear(0);
        var t = this.assets.getLoadingRatio();
        var x = c.width / 2 - barWidth / 2;
        var y = c.height / 2 - barHeight / 2;
        x |= 0;
        y |= 0;
        c.setColor(255);
        c.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
        c.setColor(0);
        c.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
        var w = (barWidth * t) | 0;
        c.setColor(255);
        c.fillRect(x, y, w, barHeight);
    };
    Core.prototype.loop = function (ts) {
        var _this = this;
        var MAX_REFRESH = 5;
        var TARGET = 17 / this.ev.step;
        this.timeSum += ts - this.oldTime;
        var loopCount = Math.floor(this.timeSum / TARGET) | 0;
        if (loopCount > MAX_REFRESH) {
            this.timeSum = MAX_REFRESH * TARGET;
            loopCount = MAX_REFRESH;
        }
        var redraw = loopCount > 0;
        while ((loopCount--) > 0) {
            if (this.assets.hasLoaded()) {
                if (!this.initialized) {
                    this.activeScene.activate(null, this.ev);
                    this.initialized = true;
                }
                this.activeScene.update(this.ev);
                this.tr.update(this.ev);
            }
            if (this.gamepad != undefined) {
                this.gamepad.updateButtons(this.input);
            }
            this.input.updateStates();
            this.timeSum -= TARGET;
            redraw = true;
        }
        if (redraw) {
            if (this.assets.hasLoaded()) {
                this.activeScene.draw(this.canvas);
            }
            else {
                this.drawLoadingScreen(this.canvas);
            }
            this.tr.draw(this.canvas);
        }
        this.oldTime = ts;
        window.requestAnimationFrame(function (ts) { return _this.loop(ts); });
    };
    Core.prototype.run = function (initialScene) {
        this.activeScene = initialScene;
        this.oldTime = 0;
        this.timeSum = 0;
        this.loop(0);
    };
    Core.prototype.changeScene = function (s) {
        this.activeScene = s;
    };
    return Core;
}());
var CoreEvent = (function () {
    function CoreEvent(framerate, ap, input, gamepad, tr, audio, core) {
        this.step = 60.0 / framerate;
        this.assets = ap;
        this.input = input;
        this.gamepad = gamepad;
        this.tr = tr;
        this.audio = audio;
        this.core = core;
    }
    CoreEvent.prototype.changeScene = function (s) {
        var ret = null;
        if (s.deactivate != undefined) {
            ret = s.deactivate();
        }
        s.activate(ret, this);
        this.core.changeScene(s);
    };
    return CoreEvent;
}());
var GamePad = (function () {
    function GamePad() {
        var _this = this;
        this.getStick = function () { return _this.stick.clone(); };
        this.stick = new Vector2();
        this.buttons = new Array();
        this.pad = null;
        this.index = 0;
        window.addEventListener("gamepadconnected", function (ev) {
            var e = ev;
            var n = navigator;
            var func = n.getGamepads ?
                n.getGamepads :
                n.webkitGetGamepad;
            if (func == null)
                return;
            var gp = n.getGamepads()[e.gamepad.index];
            _this.index = e.gamepad.index;
            _this.pad = gp;
            _this.updateGamepad(_this.pad);
        });
    }
    GamePad.prototype.pollGamepads = function () {
        var n = navigator;
        if (n == null)
            return null;
        return n.getGamepads ?
            n.getGamepads() :
            (n.webkitGetGamepads ?
                n.webkitGetGamepads :
                null);
    };
    GamePad.prototype.updateButtons = function (pad) {
        if (pad == null) {
            for (var i = 0; i < this.buttons.length; ++i) {
                this.buttons[i] = State.Up;
            }
            return;
        }
        for (var i = 0; i < pad.buttons.length; ++i) {
            if (i >= this.buttons.length) {
                for (var j = 0; j < i - this.buttons.length; ++j) {
                    this.buttons.push(State.Up);
                }
            }
            if (pad.buttons[i].pressed) {
                if (this.buttons[i] == State.Up ||
                    this.buttons[i] == State.Released) {
                    this.buttons[i] = State.Pressed;
                }
                else {
                    this.buttons[i] = State.Down;
                }
            }
            else {
                if (this.buttons[i] == State.Down ||
                    this.buttons[i] == State.Pressed) {
                    this.buttons[i] = State.Released;
                }
                else {
                    this.buttons[i] = State.Up;
                }
            }
        }
    };
    GamePad.prototype.updateStick = function (pad) {
        var EPS1 = 0.1;
        var EPS2 = 0.05;
        if (pad != null) {
            this.stick.x = 0;
            this.stick.y = 0;
            if (hypot(pad.axes[0], pad.axes[1]) > EPS2) {
                this.stick.x = pad.axes[0];
                this.stick.y = pad.axes[1];
            }
            if (pad.axes.length >= 8 &&
                hypot(this.stick.x, this.stick.y) < EPS1 &&
                hypot(pad.axes[6], pad.axes[7]) > EPS2) {
                this.stick.x = pad.axes[6];
                this.stick.y = pad.axes[7];
            }
        }
    };
    GamePad.prototype.updateGamepad = function (pad) {
        this.updateStick(pad);
        this.updateButtons(pad);
    };
    GamePad.prototype.refresh = function () {
        if (this.pad == null)
            return;
        var pads = this.pollGamepads();
        if (pads == null)
            return;
        this.pad = pads[this.index];
    };
    GamePad.prototype.update = function () {
        this.stick.x = 0.0;
        this.stick.y = 0.0;
        this.refresh();
        this.updateGamepad(this.pad);
    };
    GamePad.prototype.getButtonState = function (id) {
        if (id < 0 || id >= this.buttons.length)
            return State.Up;
        return this.buttons[id];
    };
    return GamePad;
}());
var State;
(function (State) {
    State[State["Up"] = 0] = "Up";
    State[State["Down"] = 1] = "Down";
    State[State["Pressed"] = 2] = "Pressed";
    State[State["Released"] = 3] = "Released";
})(State || (State = {}));
var InputManager = (function () {
    function InputManager() {
        var _this = this;
        this.isAnyPressed = function () { return _this.anyPressed; };
        this.getKeyState = function (key) {
            return _this.keyStates[key] | State.Up;
        };
        this.getButtonState = function (button) {
            return _this.gamepad.getButtonState(button);
        };
        this.getGamepadStick = function () { return _this.gamepad.getStick(); };
        this.keyStates = new Array();
        this.prevent = new Array();
        this.anyPressed = false;
        window.addEventListener("keydown", function (e) {
            if (_this.keyPressed(e.code))
                e.preventDefault();
        });
        window.addEventListener("keyup", function (e) {
            if (_this.keyReleased(e.code))
                e.preventDefault();
        });
        window.addEventListener("mousemove", function (e) {
            window.focus();
        });
        window.addEventListener("mousedown", function (e) {
            window.focus();
        });
        window.addEventListener("contextmenu", function (e) {
            e.preventDefault();
        });
        this.gamepad = new GamePad();
    }
    InputManager.prototype.keyPressed = function (key) {
        if (this.keyStates[key] != State.Down) {
            this.anyPressed = true;
            this.keyStates[key] = State.Pressed;
        }
        return this.prevent[key];
    };
    InputManager.prototype.keyReleased = function (key) {
        if (this.keyStates[key] != State.Up)
            this.keyStates[key] = State.Released;
        return this.prevent[key];
    };
    InputManager.prototype.updateStates = function () {
        for (var k in this.keyStates) {
            if (this.keyStates[k] == State.Pressed)
                this.keyStates[k] = State.Down;
            else if (this.keyStates[k] == State.Released)
                this.keyStates[k] = State.Up;
        }
        this.anyPressed = false;
        this.gamepad.update();
    };
    InputManager.prototype.preventDefault = function (key) {
        this.prevent[key] = true;
    };
    return InputManager;
}());
var Sprite = (function () {
    function Sprite(width, height) {
        var _this = this;
        this.getFrame = function () { return _this.frame; };
        this.getRow = function () { return _this.row; };
        this.width = width;
        this.height = height;
        this.frame = 0;
        this.row = 0;
        this.count = 0.0;
    }
    Sprite.prototype.animate = function (row, start, end, speed, step) {
        speed |= 0;
        if (start == end) {
            this.count = 0;
            this.frame = start;
            this.row = row;
            return;
        }
        if (this.row != row) {
            this.count = 0;
            this.frame = end > start ? start : end;
            this.row = row;
        }
        if (start < end &&
            (this.frame < start || this.frame > end)) {
            this.frame = start;
            this.count = 0;
        }
        else if (end < start &&
            (this.frame < end || this.frame > start)) {
            this.frame = end;
            this.count = 0;
        }
        this.count += 1.0 * step;
        if (this.count > speed) {
            if (start < end) {
                if (++this.frame > end) {
                    this.frame = start;
                }
                if (speed < 0) {
                    this.frame = Math.min(this.frame - speed, end);
                }
            }
            else {
                if (--this.frame < end) {
                    this.frame = start;
                }
                if (speed < 0) {
                    this.frame = Math.max(this.frame + speed, start);
                }
            }
            this.count -= speed;
        }
    };
    Sprite.prototype.setFrame = function (row, frame) {
        if (frame == undefined) {
            this.frame = row;
            return;
        }
        this.row = row;
        this.frame = frame;
        this.count = 0;
    };
    Sprite.prototype.setRow = function (row) {
        this.row = row;
    };
    Sprite.prototype.drawFrame = function (c, bmp, frame, row, dx, dy, flip) {
        c.drawBitmapRegion(bmp, this.width * frame, this.height * row, this.width, this.height, dx, dy, flip);
    };
    Sprite.prototype.draw = function (c, bmp, dx, dy, flip) {
        this.drawFrame(c, bmp, this.frame, this.row, dx, dy, flip);
    };
    return Sprite;
}());
var TransitionType;
(function (TransitionType) {
    TransitionType[TransitionType["Fade"] = 0] = "Fade";
    TransitionType[TransitionType["CircleOutside"] = 1] = "CircleOutside";
})(TransitionType || (TransitionType = {}));
var Transition = (function () {
    function Transition() {
        var _this = this;
        this.TRANSITION_TIME = 60;
        this.isActive = function () { return _this.active; };
        this.active = false;
    }
    Transition.prototype.activate = function (fadeIn, speed, type, param, cb) {
        if (fadeIn === void 0) { fadeIn = false; }
        if (speed === void 0) { speed = 1.0; }
        if (type === void 0) { type = TransitionType.Fade; }
        if (param === void 0) { param = 0; }
        this.fadeIn = fadeIn;
        this.speed = speed;
        this.type = type;
        this.param = param;
        this.timer = this.TRANSITION_TIME;
        this.cb = cb;
        this.active = true;
    };
    Transition.prototype.update = function (ev) {
        if (!this.active)
            return;
        if ((this.timer -= this.speed * ev.step) <= 0) {
            if ((this.fadeIn = !this.fadeIn) == false) {
                if (this.cb != undefined)
                    this.cb(ev);
                this.timer += this.TRANSITION_TIME;
            }
            else {
                this.active = false;
                this.timer = 0;
            }
        }
    };
    Transition.prototype.draw = function (c) {
        if (!this.active)
            return;
        var t = this.getScaledTime();
        var r;
        var cx = c.width / 2;
        var cy = c.height / 2;
        var maxRadius = Math.max(hypot(cx, cy), hypot(c.width - cx, cy), hypot(c.width - cx, c.height - cy), hypot(cx, c.height - cy));
        switch (this.type) {
            case TransitionType.Fade:
                if (this.param > 0) {
                    t = Math.round(t * this.param) / this.param;
                }
                c.setColor(0, 0, 0, t);
                c.fillRect(0, 0, c.width, c.height);
                break;
            case TransitionType.CircleOutside:
                r = (1 - t) * maxRadius;
                c.setColor(0);
                c.fillCircleOutside(r, cx, cy);
                break;
            default:
                break;
        }
    };
    Transition.prototype.changeTransitionType = function (type) {
        if (type === void 0) { type = TransitionType.Fade; }
        this.type = type;
    };
    Transition.prototype.getScaledTime = function () {
        var t = this.timer / this.TRANSITION_TIME;
        if (this.fadeIn)
            t = 1.0 - t;
        return t;
    };
    return Transition;
}());
function negMod(m, n) {
    if (m < 0) {
        return n - (-m % n);
    }
    return m % n;
}
function clamp(x, min, max) {
    return Math.max(min, Math.min(x, max));
}
function updateSpeedAxis(speed, target, d) {
    if (speed < target) {
        speed = Math.min(speed + d, target);
    }
    else if (speed > target) {
        speed = Math.max(speed - d, target);
    }
    return speed;
}
function getColorString(r, g, b, a) {
    if (r == null)
        r = 255;
    if (g == null)
        g = r;
    if (b == null)
        b = g;
    if (a == null)
        a = 1.0;
    return "rgba("
        + String(r | 0) + ","
        + String(g | 0) + ","
        + String(b | 0) + ","
        + String(a) + ")";
}
var KeyValuePair = (function () {
    function KeyValuePair(key, value) {
        this.key = key;
        this.value = value;
    }
    return KeyValuePair;
}());
var hypot = function (x, y) {
    return Math.sqrt(x * x + y * y);
};
var drawBoxWithBorders = function (c, x, y, w, h, colors) {
    if (colors === void 0) { colors = [[255, 255, 255], [0, 0, 0], [109, 109, 85]]; }
    var len = colors.length - 1;
    for (var i = len; i >= 0; --i) {
        c.setColor(colors[len - i][0], colors[len - i][1], colors[len - i][2]);
        c.fillRect(x - i, y - i, w + i * 2, h + i * 2);
    }
};
var Vector2 = (function () {
    function Vector2(x, y) {
        var _this = this;
        this.len = function () { return Math.sqrt(_this.x * _this.x + _this.y * _this.y); };
        this.x = x == undefined ? 0 : x;
        this.y = y == undefined ? 0 : y;
    }
    Vector2.prototype.normalize = function () {
        var EPS = 0.001;
        var len = this.len();
        if (len < EPS)
            return this.clone();
        this.x /= len;
        this.y /= len;
        return this.clone();
    };
    Vector2.prototype.clone = function () {
        return new Vector2(this.x, this.y);
    };
    Vector2.prototype.zeroes = function () {
        this.x = 0;
        this.y = 0;
    };
    return Vector2;
}());
var EndingScene = (function () {
    function EndingScene() {
    }
    EndingScene.prototype.activate = function (param, ev) {
    };
    EndingScene.prototype.update = function (ev) {
    };
    EndingScene.prototype.draw = function (c) {
        var TITLE_Y = 80;
        var TITLE_OFF = 16;
        c.clear(0, 0, 0);
        c.drawText(c.getBitmap("fontBig"), "THANK YOU", c.width / 2, TITLE_Y, -4, 0, true);
        c.drawText(c.getBitmap("fontBig"), "FOR PLAYING!", c.width / 2, TITLE_Y + TITLE_OFF, -4, 0, true);
    };
    EndingScene.prototype.deactivate = function () {
    };
    return EndingScene;
}());
var AIComponent = (function () {
    function AIComponent(base) {
        this.base = base;
    }
    return AIComponent;
}());
var Entity = (function () {
    function Entity(x, y) {
        var _this = this;
        this.doesExist = function () { return _this.base.exist; };
        this.getPower = function () { return _this.base.power; };
        this.getPos = function () { return _this.base.pos.clone(); };
        this.getSpeed = function () { return _this.base.speed.clone(); };
        this.getHitbox = function () { return _this.base.hitbox.clone(); };
        this.isDying = function () { return _this.base.dying; };
        this.getOffset = function () { return _this.offset.clone(); };
        this.getHealth = function () { return _this.base.health; };
        this.getMaxHealth = function () { return _this.base.maxHealth; };
        this.getSpriteRow = function () { return _this.renderComp.getSpriteRow(); };
        this.base = new EntityBase(x, y);
        this.offset = new Vector2();
        this.immune = false;
    }
    Entity.prototype.update = function (ev) {
        if (!this.base.exist)
            return;
        if (this.refresh != undefined) {
            this.refresh(ev);
        }
        if (this.base.dying) {
            if (this.renderComp.animateDeath(ev)) {
                this.base.exist = false;
            }
            return;
        }
        if (this.ai != undefined &&
            this.ai.update != undefined) {
            this.ai.update(ev);
        }
        if (this.renderComp != undefined &&
            this.renderComp.update != undefined) {
            this.renderComp.update(ev);
        }
        this.base.update(ev);
    };
    Entity.prototype.drawShadow = function (c) {
        if (!this.base.exist || this.base.dying)
            return;
        if (this.renderComp != undefined) {
            this.renderComp.drawShadow(c);
        }
    };
    Entity.prototype.drawBackLayer = function (c) {
        if (!this.base.exist)
            return;
        if (this.renderComp != undefined &&
            this.renderComp.drawBefore != undefined) {
            this.renderComp.drawBefore(c);
        }
    };
    Entity.prototype.draw = function (c, bmp) {
        if (!this.base.exist)
            return;
        if (!this.base.dying &&
            this.renderComp.flickerTime > 0 &&
            Math.floor(this.renderComp.flickerTime / 4) % 2 == 0)
            return;
        if (this.renderComp != undefined) {
            this.renderComp.draw(c, bmp);
        }
    };
    Entity.prototype.entityCollision = function (e, hostile, kill, ev) {
        if (kill === void 0) { kill = true; }
        if (!e.doesExist() || !this.base.exist ||
            e.isDying() || this.base.dying)
            return;
        var off = this.getOffset();
        var poff = e.getOffset();
        var p = this.base.pos.clone();
        p.x += off.x;
        p.y += off.y;
        var ep = e.getPos();
        ep.x += poff.x;
        p.y += poff.y;
        var h = this.base.hitbox;
        var eh = e.getHitbox();
        var collide = p.x + h.x / 2 >= ep.x - eh.x / 2 &&
            p.y + h.y / 2 >= ep.y - eh.y / 2 &&
            p.x - h.x / 2 <= ep.x + eh.x / 2 &&
            p.y - h.y / 2 <= ep.y + eh.y / 2;
        if (hostile && collide &&
            this.hostileCollision != undefined) {
            this.hostileCollision(e, kill, ev);
            return this.immune ? 0 : e.getPower();
        }
        return 0;
    };
    Entity.prototype.kill = function (hardDeath, deathEvent) {
        if (hardDeath === void 0) { hardDeath = false; }
        if (deathEvent === void 0) { deathEvent = true; }
        if (!this.base.exist)
            return;
        if (hardDeath) {
            this.base.exist = false;
            this.base.dying = false;
            return;
        }
        this.base.die(deathEvent);
    };
    Entity.prototype.flicker = function (time) {
        var remainder = (this.renderComp.flickerTime | 0) % 2;
        if ((time % 2) != remainder) {
            time += remainder;
        }
        this.renderComp.flickerTime = time;
    };
    Entity.prototype.reduceHealth = function (delta) {
        this.base.health -= delta;
        if (this.base.health <= 0) {
            if (this.triggerDeath != undefined)
                this.triggerDeath();
            this.kill();
        }
    };
    Entity.prototype.addHealth = function (amount) {
        this.base.health = Math.min(this.base.maxHealth, this.base.health + amount);
    };
    Entity.prototype.getXP = function (dmg) {
        if (dmg === void 0) { dmg = 0; }
        var c = 0;
        if (this.base.health >= 0)
            c = dmg;
        else {
            c = this.base.health + dmg;
        }
        return c;
    };
    return Entity;
}());
var EntityBase = (function () {
    function EntityBase(x, y) {
        this.pos = new Vector2(x, y);
        this.startPos = this.pos.clone();
        this.speed = new Vector2();
        this.target = new Vector2();
        this.acc = new Vector2(1, 1);
        this.hitbox = new Vector2(1, 1);
        this.dying = false;
        this.exist = false;
        this.power = 1;
        this.xp = 0;
        this.maxHealth = 1;
        this.health = this.maxHealth;
        this.flip = false;
        this.moveStartPos = false;
    }
    EntityBase.prototype.update = function (ev) {
        var p = this.pos;
        if (this.moveStartPos)
            p = this.startPos;
        this.speed.x = updateSpeedAxis(this.speed.x, this.target.x, this.acc.x);
        this.speed.y = updateSpeedAxis(this.speed.y, this.target.y, this.acc.y);
        p.x += this.speed.x * ev.step;
        p.y += this.speed.y * ev.step;
    };
    EntityBase.prototype.die = function (deathEvent) {
        if (deathEvent === void 0) { deathEvent = true; }
        if (!this.exist && this.dying)
            return;
        if (deathEvent &&
            this.killCB != undefined) {
            this.killCB();
        }
        this.dying = true;
        this.speed.zeroes();
        this.target.zeroes();
    };
    EntityBase.prototype.setInitialHealth = function (amount) {
        this.maxHealth = amount;
        this.health = amount;
    };
    return EntityBase;
}());
var RenderComponent = (function () {
    function RenderComponent(base, width, height) {
        var _this = this;
        this.getSpriteRow = function () { return _this.spr.getRow(); };
        this.base = base;
        this.spr = new Sprite(width, height);
        this.flip = false;
        this.shadowSize = new Vector2();
        this.shadowSize.x = width * 0.75;
        this.shadowSize.y = this.shadowSize.x / 4;
        this.flickerTime = 0.0;
    }
    RenderComponent.prototype.animateDeath = function (ev) {
        return true;
    };
    RenderComponent.prototype.draw = function (c, bmp) {
        var x = Math.round(this.base.pos.x - this.spr.width / 2);
        var y = Math.round(this.base.pos.y - this.spr.width / 2);
        if (bmp != null) {
            c.drawSprite(this.spr, bmp, x, y, this.flip);
        }
        else {
            c.fillRect(x, y, this.spr.width, this.spr.height);
        }
    };
    RenderComponent.prototype.drawShadow = function (c) {
        var SHADOW_ALPHA = 0.67;
        var SCALE_FACTOR = 0.5;
        var FLOOR_Y = 192 - 16;
        var scale = 1.0 - SCALE_FACTOR *
            Math.max(0, c.height - this.base.pos.y) / c.height;
        var w = (scale * this.shadowSize.x) | 0;
        var h = (scale * this.shadowSize.y) | 0;
        var x = (this.base.pos.x - w / 2) | 0;
        var y = (FLOOR_Y - h / 2) | 0;
        c.setAlpha(SHADOW_ALPHA);
        c.drawScaledBitmap(c.getBitmap("shadow"), x, y, w, h);
        c.setAlpha();
    };
    RenderComponent.prototype.update = function (ev) {
        this.flip = this.base.flip;
        if (this.flickerTime > 0.0) {
            this.flickerTime -= ev.step;
        }
        if (this.animate != undefined) {
            this.animate(ev);
        }
    };
    return RenderComponent;
}());
var BulletAI = (function (_super) {
    __extends(BulletAI, _super);
    function BulletAI(base) {
        return _super.call(this, base) || this;
    }
    BulletAI.prototype.reset = function (speed) {
        this.base.speed = speed.clone();
        this.base.target = speed.clone();
        this.base.dying = false;
    };
    BulletAI.prototype.update = function (ev) {
        var MIN_Y = 192 - 22;
        if (this.base.pos.y > MIN_Y) {
            this.base.die();
        }
        if (this.base.pos.y < -16 ||
            this.base.pos.x > 256 + 16 ||
            this.base.pos.x < -16)
            this.base.exist = false;
    };
    return BulletAI;
}(AIComponent));
var BulletRenderComponent = (function (_super) {
    __extends(BulletRenderComponent, _super);
    function BulletRenderComponent(base) {
        var _this = _super.call(this, base, 16, 16) || this;
        _this.deathPlayed = false;
        return _this;
    }
    BulletRenderComponent.prototype.reset = function (row) {
        this.spr.setFrame(row, 0);
        this.deathPlayed = false;
    };
    BulletRenderComponent.prototype.animate = function (ev) {
        var APPEAR_SPEED = 3;
        if (this.spr.getFrame() < 2) {
            this.spr.animate(this.spr.getRow(), 0, 2, APPEAR_SPEED, ev.step);
        }
    };
    BulletRenderComponent.prototype.animateDeath = function (ev) {
        var DEATH_SPEED = 4;
        if (!this.deathPlayed) {
            ev.audio.playSample(ev.assets.getSound("hit"), 0.40);
            this.deathPlayed = true;
        }
        this.spr.animate(this.spr.getRow(), 3, 7, DEATH_SPEED, ev.step);
        return this.spr.getFrame() == 7;
    };
    return BulletRenderComponent;
}(RenderComponent));
var Bullet = (function (_super) {
    __extends(Bullet, _super);
    function Bullet() {
        var _this = _super.call(this) || this;
        _this.isFriendly = function () { return _this.friendly; };
        _this.getRow = function () { return _this.renderComp.getSpriteRow(); };
        _this.renderComp = new BulletRenderComponent(_this.base);
        _this.ai = new BulletAI(_this.base);
        _this.base.exist = false;
        _this.base.hitbox = new Vector2(6, 6);
        return _this;
    }
    Bullet.prototype.spawn = function (row, pos, speed, friendly, power) {
        if (power === void 0) { power = 1; }
        var HITBOX_SIZE = [6, 6, 12, 12];
        this.base.exist = true;
        this.base.dying = false;
        this.base.pos = pos.clone();
        this.ai.reset(speed);
        this.renderComp.reset(row);
        this.friendly = friendly;
        this.base.power = power;
        this.base.hitbox.x = HITBOX_SIZE[row];
        this.base.hitbox.y = this.base.hitbox.x;
    };
    Bullet.prototype.hostileCollision = function (e, kill) {
        if (kill === void 0) { kill = true; }
        this.kill();
        if (kill)
            e.kill();
    };
    return Bullet;
}(Entity));
var DustAI = (function (_super) {
    __extends(DustAI, _super);
    function DustAI(base) {
        return _super.call(this, base) || this;
    }
    DustAI.prototype.reset = function (speed, target, acc) {
        this.base.speed = speed.clone();
        if (target == undefined) {
            this.base.target = speed.clone();
        }
        else {
            this.base.target = target.clone();
        }
        var BASE_ACC = 0.1;
        if (acc == undefined) {
            this.base.acc.x = BASE_ACC;
            this.base.acc.y = BASE_ACC;
        }
        else {
            this.base.acc = acc.clone();
        }
    };
    DustAI.prototype.update = function (ev) {
        var MIN_Y = 192 - 22;
        this.base.pos.y = Math.min(MIN_Y, this.base.pos.y);
    };
    return DustAI;
}(AIComponent));
var DustRenderComponent = (function (_super) {
    __extends(DustRenderComponent, _super);
    function DustRenderComponent(base) {
        var _this = _super.call(this, base, 16, 16) || this;
        _this.speed = 0.0;
        return _this;
    }
    DustRenderComponent.prototype.reset = function (row, speed) {
        this.speed = speed;
        this.spr.setFrame(row, 0);
    };
    DustRenderComponent.prototype.animate = function (ev) {
        var END_FRAME = [6];
        var end = END_FRAME[clamp(this.spr.getRow(), 0, END_FRAME.length) | 0];
        this.spr.animate(this.spr.getRow(), 0, end, this.speed, ev.step);
        if (this.spr.getFrame() == end) {
            this.base.exist = false;
        }
    };
    return DustRenderComponent;
}(RenderComponent));
var Dust = (function (_super) {
    __extends(Dust, _super);
    function Dust() {
        var _this = _super.call(this) || this;
        _this.renderComp = new DustRenderComponent(_this.base);
        _this.ai = new DustAI(_this.base);
        _this.base.exist = false;
        return _this;
    }
    Dust.prototype.spawn = function (row, animSpeed, pos, speed, target, acc) {
        this.base.exist = true;
        this.base.pos = pos.clone();
        this.ai.reset(speed, target, acc);
        this.renderComp.reset(row, animSpeed);
    };
    return Dust;
}(Entity));
var EnemyType;
(function (EnemyType) {
    EnemyType[EnemyType["Fly"] = 0] = "Fly";
    EnemyType[EnemyType["Slime"] = 1] = "Slime";
    EnemyType[EnemyType["Bee"] = 2] = "Bee";
    EnemyType[EnemyType["Cloud"] = 3] = "Cloud";
    EnemyType[EnemyType["Kamikaze"] = 4] = "Kamikaze";
    EnemyType[EnemyType["FleeingFly"] = -1] = "FleeingFly";
    EnemyType[EnemyType["FleeingSlime"] = -2] = "FleeingSlime";
})(EnemyType || (EnemyType = {}));
var MovementLogic = (function () {
    function MovementLogic(base) {
        this.base = base;
    }
    return MovementLogic;
}());
var ShootingLogic = (function () {
    function ShootingLogic(base, animCB, shootCB) {
        this.base = base;
        this.timer = 0;
        this.animCB = animCB;
        this.shootCB = shootCB;
    }
    return ShootingLogic;
}());
var EnemyRenderer = (function (_super) {
    __extends(EnemyRenderer, _super);
    function EnemyRenderer(base) {
        var _this = _super.call(this, base, 24, 24) || this;
        _this.deathPlayed = false;
        _this.shootPlayed = false;
        return _this;
    }
    EnemyRenderer.prototype.reset = function (row, speed, speedMod) {
        if (row === void 0) { row = 0; }
        if (speed === void 0) { speed = 0; }
        if (speedMod === void 0) { speedMod = 0; }
        this.spr.setFrame(row + 1, (Math.random() * 4) | 0);
        this.animSpeed = speed;
        this.speedMod = speedMod;
        this.flickerTime = 0.0;
        this.deathPlayed = false;
        this.shootPlayed = false;
    };
    EnemyRenderer.prototype.animate = function (ev) {
        var start = 0;
        if (this.shootTimer > 0) {
            if (!this.shootPlayed) {
                ev.audio.playSample(ev.assets.getSound("enemyShoot"), 0.50);
                this.shootPlayed = true;
            }
            this.shootTimer -= ev.step;
            if (this.shootTimer <= 0) {
                this.spr.setFrame(this.spr.getRow(), this.spr.getFrame() - 4);
            }
            else {
                start += 4;
            }
        }
        var speed = this.animSpeed;
        if (this.speedMod > 0) {
            speed = this.animSpeed - Math.abs(this.base.speed.x) / this.speedMod;
        }
        this.spr.animate(this.spr.getRow(), start, start + 3, speed, ev.step);
    };
    EnemyRenderer.prototype.animateShooting = function (time) {
        if (this.shootTimer <= 0) {
            this.spr.setFrame(this.spr.getRow(), this.spr.getFrame() + 4);
            this.shootPlayed = false;
        }
        this.shootTimer = time;
    };
    EnemyRenderer.prototype.animateDeath = function (ev) {
        var DEATH_SPEED = 4;
        if (!this.deathPlayed) {
            ev.audio.playSample(ev.assets.getSound("hurtEnemy"), 0.40);
            this.deathPlayed = true;
        }
        this.spr.animate(0, 0, 6, DEATH_SPEED, ev.step);
        return this.spr.getFrame() == 6;
    };
    return EnemyRenderer;
}(RenderComponent));
var BaseEnemyAI = (function (_super) {
    __extends(BaseEnemyAI, _super);
    function BaseEnemyAI(base, rendComp) {
        var _this = _super.call(this, base) || this;
        _this.rendComp = rendComp;
        return _this;
    }
    BaseEnemyAI.prototype.update = function (ev) {
        if (this.moveComp != undefined &&
            this.moveComp.move != undefined) {
            this.moveComp.move(ev);
        }
        if (this.base.pos.x < 256 - this.rendComp.spr.width / 2 &&
            this.shootComp != undefined &&
            this.shootComp.update != undefined) {
            this.shootComp.update(ev);
        }
        if (this.base.pos.x < -12)
            this.base.exist = false;
    };
    BaseEnemyAI.prototype.animateShooting = function () {
        var SHOOT_TIME = 30;
        this.rendComp.animateShooting(SHOOT_TIME);
    };
    return BaseEnemyAI;
}(AIComponent));
var Enemy = (function (_super) {
    __extends(Enemy, _super);
    function Enemy(x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.getHurtIndex = function () { return _this.hurtIndex; };
        _this.base.acc.x = 0.25;
        _this.base.acc.y = 0.25;
        _this.base.exist = false;
        _this.base.hitbox = new Vector2(16, 16);
        _this.rendRef = new EnemyRenderer(_this.base);
        _this.renderComp = _this.rendRef;
        _this.hurtIndex = 0;
        _this.isStatic = false;
        return _this;
    }
    Enemy.prototype.spawn = function (pos, index, params, shootCB) {
        this.base.exist = true;
        this.base.dying = false;
        this.base.pos = pos.clone();
        this.base.startPos = pos.clone();
        this.base.flip = false;
        this.base.moveStartPos = false;
        this.offset = new Vector2();
        this.hurtIndex = 0;
        this.base.killCB = undefined;
        if (index != EnemyType.Slime) {
            this.rendRef = new EnemyRenderer(this.base);
        }
        switch (index) {
            case EnemyType.Fly:
                this.ai = new FlyAI(this.base, this.rendRef, params, shootCB);
                this.rendRef.reset(0, 4);
                this.offset.y = 3;
                break;
            case EnemyType.FleeingSlime:
            case EnemyType.Slime:
                this.ai = new SlimeAI(this.base, this.rendRef, params, shootCB);
                this.rendRef = new SlimeRenderer(this.base);
                this.rendRef.reset(1, index == EnemyType.FleeingSlime ? 4 : 0);
                this.rendRef.shadowSize = new Vector2(24, 6);
                break;
            case EnemyType.FleeingFly:
                this.ai = new FleeingFlyAI(this.base, this.rendRef, params, shootCB);
                this.rendRef.reset(2, 4);
                this.offset.y = 3;
                break;
            case EnemyType.Cloud:
                this.ai = new CloudAI(this.base, this.rendRef, params, shootCB);
                this.rendRef.reset(3, 8);
                break;
            case EnemyType.Bee:
                this.ai = new BeeAI(this.base, this.rendRef, params, shootCB);
                this.rendRef.reset(4, 4);
                break;
            case EnemyType.Kamikaze:
                this.ai = new KamikazeAI(this.base, this.rendRef, params, shootCB);
                this.rendRef.reset(5, 10, 0.5);
                break;
            default:
                break;
        }
        this.renderComp = this.rendRef;
    };
    Enemy.prototype.hostileCollision = function (e, kill) {
        if (kill === void 0) { kill = true; }
        this.flicker(30);
        if (!this.isStatic)
            this.base.speed.x = e.getSpeed().x;
        this.reduceHealth(e.getPower());
        if (kill)
            e.kill();
    };
    Enemy.prototype.setHurtIndex = function (i) {
        if (this.hurtIndex < i)
            this.hurtIndex = i;
    };
    return Enemy;
}(Entity));
var OrbiterAI = (function (_super) {
    __extends(OrbiterAI, _super);
    function OrbiterAI(base, center, radius, speed, angle) {
        if (speed === void 0) { speed = 1.0; }
        if (angle === void 0) { angle = 0; }
        var _this = _super.call(this, base) || this;
        _this.center = center;
        _this.angle = angle;
        _this.speed = speed;
        _this.radius = radius;
        return _this;
    }
    OrbiterAI.prototype.update = function (ev) {
        var SPEED_MUL = 0.033;
        var MIN_Y = 192 - 16;
        this.angle = (this.angle + SPEED_MUL * this.speed * ev.step) % (Math.PI * 2);
        this.base.pos.x = this.center.x +
            Math.cos(this.angle) * this.radius;
        this.base.pos.y = this.center.y +
            Math.sin(this.angle) * this.radius;
        this.base.pos.y = Math.min(MIN_Y - this.base.hitbox.y / 2, this.base.pos.y);
    };
    OrbiterAI.prototype.setSpeed = function (s) {
        this.speed = s;
    };
    OrbiterAI.prototype.setRadius = function (r) {
        this.radius = r;
    };
    return OrbiterAI;
}(AIComponent));
var Orbiter = (function (_super) {
    __extends(Orbiter, _super);
    function Orbiter(center, radius, speed, angle) {
        if (speed === void 0) { speed = 1.0; }
        if (angle === void 0) { angle = 0; }
        var _this = _super.call(this) || this;
        _this.setSpeed = function (s) { return _this.aiRef.setSpeed(s); };
        _this.setRadius = function (s) { return _this.aiRef.setRadius(s); };
        _this.aiRef = new OrbiterAI(_this.base, center, radius, speed, angle);
        _this.base.power = 100;
        _this.base.hitbox = new Vector2(18, 18);
        _this.base.exist = true;
        _this.base.dying = false;
        _this.renderComp = new RenderComponent(_this.base, 32, 32);
        _this.ai = _this.aiRef;
        _this.immune = true;
        return _this;
    }
    Orbiter.prototype.hostileCollision = function (e, kill) {
        if (kill === void 0) { kill = true; }
        if (kill)
            e.kill();
    };
    return Orbiter;
}(Entity));
var BossAI = (function (_super) {
    __extends(BossAI, _super);
    function BossAI(base, rendComp, shootCB) {
        var _this = _super.call(this, base) || this;
        _this.MOUTH_WAIT_MIN = 180;
        _this.MOUTH_WAIT_VARY = 60;
        _this.EYE_WAIT_MIN = 120;
        _this.EYE_WAIT_VARY = 60;
        _this.RUSH_TIME_MIN = 180;
        _this.RUSH_TIME_VARY = 180;
        _this.getSpeedMod = function () { return _this.speedMod; };
        _this.rendComp = rendComp;
        _this.ready = false;
        _this.shootCB = shootCB;
        _this.mouthWait = 0;
        _this.eyeWait = _this.EYE_WAIT_MIN;
        _this.rushTime = _this.RUSH_TIME_MIN + _this.RUSH_TIME_VARY;
        _this.rushing = 0;
        _this.base.acc.x = 0.1;
        _this.base.acc.y = 0.1;
        _this.speedMod = 1.0;
        return _this;
    }
    BossAI.prototype.openMouth = function (ev) {
        var MOUTH_TIME = 30;
        var SPEED_MIN = 2.0;
        var SPEED_VARY = 1.0;
        ev.audio.playSample(ev.assets.getSound("enemyShoot2"), 0.50);
        var bulletCount = 3 +
            2 * Math.floor(3 * (1 - this.base.health / this.base.maxHealth));
        var bAngle = Math.PI / 3 / bulletCount;
        this.rendComp.animateMouth(MOUTH_TIME);
        this.mouthWait = this.MOUTH_WAIT_MIN +
            (Math.random() * this.MOUTH_WAIT_VARY) | 0;
        var angle = 0;
        var speed = 0;
        for (var i = -Math.floor(bulletCount / 2); i <= Math.floor(bulletCount / 2); ++i) {
            angle = i * bAngle;
            speed = SPEED_MIN + Math.random() * SPEED_VARY *
                this.speedMod;
            this.shootCB(new Vector2(this.base.pos.x - 8, this.base.pos.y + 8), new Vector2(-Math.cos(angle) * speed, Math.sin(angle) * speed), 60, 3);
        }
    };
    BossAI.prototype.openEye = function (ev) {
        var COUNT_1 = 3;
        var EYE_TIME = 30;
        var SPEED_1 = 4.0;
        var SPEED_2 = 3.0;
        var SPEED_REDUCE = 0.5;
        var ANGLE = Math.PI / 12.0;
        ev.audio.playSample(ev.assets.getSound("enemyShoot"), 0.50);
        this.rendComp.animateEye(EYE_TIME);
        this.eyeWait = this.EYE_WAIT_MIN +
            (Math.random() * this.EYE_WAIT_VARY) | 0;
        var mode = (Math.random() * 2) | 0;
        var pos = new Vector2(this.base.pos.x - 8, this.base.pos.y - 8);
        var bonus = Math.floor(3 * (1 - this.base.health / this.base.maxHealth));
        var angle = 0;
        var speed = 0;
        switch (mode) {
            case 0:
                for (var i = 0; i < COUNT_1 + bonus; ++i) {
                    this.shootCB(pos, new Vector2(-SPEED_1 + SPEED_REDUCE * i - (this.speedMod - 1.0), -this.base.speed.y / 4), 30);
                }
                break;
            case 1:
                speed = SPEED_2 + (this.speedMod - 1.0);
                for (var i = -1 - bonus; i <= 1 + bonus; ++i) {
                    angle = ANGLE * i;
                    this.shootCB(pos, new Vector2(-Math.cos(angle) * speed, Math.sin(angle) * speed), 30);
                }
                break;
            default:
                break;
        }
    };
    BossAI.prototype.update = function (ev) {
        var APPEAR_SPEED = 1.0;
        var APPEAR_LIMIT = 256 - 40;
        var TOP = 56;
        var BOTTOM = 192 - 64;
        var LEFT = 48;
        var RIGHT = 48;
        var VERTICAL_SPEED = 1.0;
        var RUSH_SPEED = 2.0;
        var RUSH_MOD = 1.0;
        var SPEED_MOD = 0.5;
        this.speedMod = 1.0 + SPEED_MOD *
            Math.floor(3 * (1 - this.base.health / this.base.maxHealth));
        if (!this.ready) {
            this.base.target.x = -APPEAR_SPEED;
            this.base.speed.x = -APPEAR_SPEED;
            if (this.base.pos.x < APPEAR_LIMIT) {
                this.base.target.x = 0;
                this.ready = true;
                this.base.target.y = VERTICAL_SPEED;
            }
            return;
        }
        if (this.rushing == 0) {
            if ((this.mouthWait -= ev.step * this.speedMod) <= 0) {
                this.openMouth(ev);
            }
            if ((this.eyeWait -= ev.step * this.speedMod) <= 0) {
                this.openEye(ev);
            }
            if ((this.rushTime -= ev.step * this.speedMod) <= 0) {
                this.base.target.x = -RUSH_SPEED -
                    (this.speedMod - 1.0) * RUSH_MOD;
                this.rushing = 1;
            }
        }
        else {
            if (this.rushing == 1 &&
                this.base.target.x < 0 &&
                this.base.pos.x < LEFT * this.speedMod) {
                this.base.target.x *= -1;
                this.rushing = 2;
            }
            else if (this.rushing == 2 &&
                this.base.target.x > 0 &&
                this.base.pos.x > 256 - RIGHT * this.speedMod) {
                this.base.target.x = 0;
                this.rushing = 0;
                this.rushTime = this.RUSH_TIME_MIN +
                    (Math.random() * this.RUSH_TIME_VARY) | 0;
            }
        }
        if ((this.base.target.y < 0 &&
            this.base.pos.y < TOP) ||
            (this.base.target.y > 0 &&
                this.base.pos.y > BOTTOM)) {
            this.base.target.y *= -1;
        }
    };
    return BossAI;
}(AIComponent));
var BossRenderer = (function (_super) {
    __extends(BossRenderer, _super);
    function BossRenderer(base, endCB) {
        var _this = _super.call(this, base, 64, 64) || this;
        _this.DEATH_TIME1 = 60;
        _this.DEATH_TIME2 = 60;
        _this.animateMouth = function (time) { _this.mouthTimer = time; };
        _this.animateEye = function (time) { _this.eyeTimer = time; };
        _this.spr.setFrame(0, 0);
        _this.sprPropeller = new Sprite(48, 16);
        _this.sprPropeller.setFrame(4, 0);
        _this.sprMouth = new Sprite(64, 32);
        _this.sprMouth.setFrame(0, 1);
        _this.sprEye = new Sprite(64, 32);
        _this.sprEye.setFrame(0, 2);
        _this.shadowSize.x = 56;
        _this.shadowSize.y = _this.shadowSize.x / 4;
        _this.deathTimer = _this.DEATH_TIME1 + _this.DEATH_TIME2;
        _this.mouthTimer = 0;
        _this.eyeTimer = 0;
        _this.endCB = endCB;
        _this.musicStopped = false;
        return _this;
    }
    BossRenderer.prototype.animate = function (ev) {
        var PROPELLER_SPEED = 4;
        this.sprPropeller.animate(4, 0, 3, PROPELLER_SPEED, ev.step);
        this.sprMouth.setFrame(this.mouthTimer > 0 ? 1 : 0, 1);
        this.sprEye.setFrame(this.eyeTimer > 0 ? 1 : 0, 2);
        if (this.mouthTimer > 0)
            this.mouthTimer -= ev.step;
        if (this.eyeTimer > 0)
            this.eyeTimer -= ev.step;
    };
    BossRenderer.prototype.animateDeath = function (ev) {
        var oldTime = this.deathTimer;
        this.deathTimer -= ev.step;
        if (!this.musicStopped) {
            ev.audio.playSample(ev.assets.getSound("explode"), 0.40);
            ev.audio.stopMusic();
            this.musicStopped = true;
        }
        if (this.endCB != undefined &&
            oldTime > this.DEATH_TIME2 &&
            this.deathTimer <= this.DEATH_TIME2) {
            this.endCB();
        }
        return this.deathTimer <= 0.0;
    };
    BossRenderer.prototype.drawBase = function (c, jump1, jump2, jump3) {
        if (jump1 === void 0) { jump1 = 0; }
        if (jump2 === void 0) { jump2 = 0; }
        if (jump3 === void 0) { jump3 = 0; }
        var x = Math.round(this.base.pos.x - 32);
        var y = Math.round(this.base.pos.y - 32);
        var bmp = c.getBitmap("boss");
        c.drawSpriteFrame(this.sprPropeller, bmp, this.sprPropeller.getFrame(), this.sprPropeller.getRow() + jump2, x + 8, y + 56);
        c.drawSpriteFrame(this.spr, bmp, this.spr.getFrame(), this.spr.getRow() + jump1, x, y);
        c.drawSpriteFrame(this.sprMouth, bmp, this.sprMouth.getFrame(), this.sprMouth.getRow() + jump3, x, y + 32);
        c.drawSpriteFrame(this.sprEye, bmp, this.sprEye.getFrame(), this.sprEye.getRow() + jump3, x, y + 16);
    };
    BossRenderer.prototype.drawDying = function (c) {
        var x = Math.round(this.base.pos.x);
        var y = Math.round(this.base.pos.y);
        var w, h;
        var t;
        if (this.deathTimer >= this.DEATH_TIME2) {
            t = 1.0 - (this.deathTimer - this.DEATH_TIME2) / this.DEATH_TIME1;
            w = Math.floor(256 * t);
            h = Math.floor(192 * t);
            c.setColor(255, 255, 255);
            c.fillRect(x - w / 2, 0, w, 192);
            c.fillRect(0, y - h / 2, 256, h);
        }
        else {
            c.setColor(255, 255, 255, Math.floor(this.deathTimer / this.DEATH_TIME2 * 4) / 4);
            c.fillRect(0, 0, c.width, c.height);
        }
    };
    BossRenderer.prototype.draw = function (c, bmp) {
        if (!this.base.dying ||
            this.deathTimer > this.DEATH_TIME2) {
            this.drawBase(c, 2, 8, 4);
            this.drawBase(c);
        }
        if (this.base.dying) {
            this.drawDying(c);
            return;
        }
    };
    return BossRenderer;
}(RenderComponent));
var Boss = (function (_super) {
    __extends(Boss, _super);
    function Boss(x, y, shootCB, endCB) {
        var _this = _super.call(this, x, y) || this;
        var HEALTH = 2400;
        var ORBITER_RADIUS = 56;
        _this.base.exist = true;
        _this.base.dying = false;
        _this.base.hitbox = new Vector2(48, 48);
        _this.rendRef = new BossRenderer(_this.base, endCB);
        _this.renderComp = _this.rendRef;
        _this.aiRef = new BossAI(_this.base, _this.rendRef, shootCB);
        _this.ai = _this.aiRef;
        _this.hurtIndex = 0;
        _this.base.power = 100;
        _this.base.xp = 1000;
        _this.base.maxHealth = HEALTH;
        _this.base.health = HEALTH;
        _this.isStatic = true;
        _this.orbiter = new Orbiter(_this.base.pos, ORBITER_RADIUS, 1.0, 0.0);
        return _this;
    }
    Boss.prototype.refresh = function (ev) {
        if (!this.doesExist())
            return;
        if (this.isDying())
            this.orbiter.kill();
        this.orbiter.setSpeed(this.aiRef.getSpeedMod());
    };
    Boss.prototype.getOrbiter = function () {
        return this.orbiter;
    };
    return Boss;
}(Enemy));
var EnemyGenerator = (function () {
    function EnemyGenerator(shootCB) {
        var TIMER_COUNT = 3;
        this.enemies = new Array();
        this.shootCB = shootCB;
        this.timers = new Array(TIMER_COUNT);
        this.lastIndices = new Array(TIMER_COUNT);
        this.initTimers();
        this.bossBegun = false;
        this.boss = null;
    }
    EnemyGenerator.prototype.initTimers = function () {
        for (var i = 0; i < this.timers.length; ++i) {
            this.timers[i] = 60.0 + i * 30.0;
            this.lastIndices[i] = -1;
        }
    };
    EnemyGenerator.prototype.spawnFlies = function (count, fleeing) {
        if (fleeing === void 0) { fleeing = false; }
        var MIN_Y = 32;
        var MAX_Y = 160;
        var AMPLITUDE_MIN = 12.0;
        var AMPLITUDE_MAX = 32.0;
        var COUNT_MODIF = 1.0;
        var LATITUDE_BASE = 0.033;
        var BODY_OFF = 32;
        var FLEEING_SPEED = 0.5;
        var maxAmpl = AMPLITUDE_MAX - COUNT_MODIF;
        var ampl = AMPLITUDE_MIN +
            Math.floor(Math.random() * (maxAmpl - AMPLITUDE_MIN));
        var lat = LATITUDE_BASE /
            (1 + (ampl - AMPLITUDE_MIN) / (maxAmpl - AMPLITUDE_MIN));
        var x = 256 + 12;
        var y = MIN_Y + ampl +
            Math.floor(Math.random() * (MAX_Y - MIN_Y - 2 * ampl));
        var start = Math.random() * (Math.PI);
        for (var i = 0; i < count; ++i) {
            this.getNextEnemy().spawn(new Vector2(x + i * BODY_OFF, y), fleeing ? EnemyType.FleeingFly : EnemyType.Fly, [ampl, lat,
                fleeing ? FLEEING_SPEED : 1.0,
                start + Math.PI / count * i], this.shootCB);
        }
    };
    EnemyGenerator.prototype.spawnSlimes = function (count, flip) {
        if (flip === void 0) { flip = false; }
        var BODY_OFF = 32;
        var JUMP_MIN = 2.5;
        var JUMP_VARY = 2.0;
        var JUMP_WAIT_MIN = 30;
        var JUMP_WAIT_VARY = 60;
        var x = 256 + 12;
        var y = 192 - 16;
        var jumpWait = JUMP_WAIT_MIN + (Math.random() * JUMP_WAIT_VARY) | 0;
        var initialWait = (Math.random() * jumpWait) | 0;
        for (var i = 0; i < count; ++i) {
            this.getNextEnemy().spawn(new Vector2(x + i * BODY_OFF, y), flip ? EnemyType.FleeingSlime : EnemyType.Slime, [jumpWait,
                JUMP_MIN + Math.random() * JUMP_VARY,
                initialWait, 1.0,
                flip ? 1 : 0], this.shootCB);
        }
    };
    EnemyGenerator.prototype.spawnClouds = function (count) {
        var MIN_Y = 48;
        var MAX_Y = 192 - 48;
        var SPEED_X_MIN = 0.25;
        var SPEED_X_VARY = 0.25;
        var SPEED_Y_MIN = 0.5;
        var SPEED_Y_VARY = 0.5;
        var BODY_OFF = 32;
        var LATITUDE_MIN = 0.025;
        var LATITUDE_VARY = 0.025;
        var x = 256 + 12;
        var y = (MIN_Y + Math.random() * (MAX_Y - MIN_Y)) | 0;
        var dir = Math.random() <= 0.5 ? 1 : -1;
        var speedx, speedy, lat;
        for (var i = 0; i < count; ++i) {
            speedx = SPEED_X_MIN + Math.random() * SPEED_X_VARY;
            speedy = SPEED_Y_MIN + Math.random() * SPEED_Y_VARY;
            lat = LATITUDE_MIN + Math.random() * LATITUDE_VARY;
            this.getNextEnemy().spawn(new Vector2(x + i * BODY_OFF, y), EnemyType.Cloud, [speedx, speedy * dir, lat], this.shootCB);
            dir = dir == 1 ? -1 : 1;
        }
    };
    EnemyGenerator.prototype.spawnBees = function (count) {
        if (count === void 0) { count = 4; }
        var DIST_MIN = 32;
        var DIST_VARY = 32;
        var ANGLE_SPEED_BASE = 0.033;
        var ANGLE_SPEED_COMPARE = DIST_MIN;
        var startAngle = Math.random() * (Math.PI * 2);
        var angleStep = Math.PI * 2 / count;
        var dist = DIST_MIN + Math.random() * DIST_VARY;
        var midx = 256 + 12 + dist;
        var midy = 32 + dist + (128 - dist * 2) * Math.random();
        var angleSpeed = ANGLE_SPEED_BASE / (dist / ANGLE_SPEED_COMPARE);
        var dir = Math.random() <= 0.5 ? 1 : -1;
        var angle;
        for (var i = 0; i < count; ++i) {
            angle = startAngle + i * angleStep;
            angle %= (Math.PI * 2);
            this.getNextEnemy().spawn(new Vector2(midx, midy), EnemyType.Bee, [dist, angleSpeed * dir, 1.0, angle], this.shootCB);
        }
    };
    EnemyGenerator.prototype.spawnKamikaze = function (count) {
        var ACC = 0.1;
        var TARGET_SPEED = 4.0;
        var INITIAL_SPEED = 0.5;
        var BODY_OFF = 32;
        var MIN_Y = 20 + 12;
        var MAX_Y = 192 - 16 - 12;
        var DELTA_MIN = 32;
        var DELTA_VARY = 64;
        var delta = DELTA_MIN + DELTA_VARY * Math.random();
        delta *= (Math.random() <= 0.5 ? -1 : 1);
        var x = 256 + 12;
        var y = MIN_Y + ((Math.random() * (MAX_Y - MIN_Y)) | 0);
        for (var i = 0; i < count; ++i) {
            this.getNextEnemy().spawn(new Vector2(x + i * BODY_OFF, y), EnemyType.Kamikaze, [ACC, TARGET_SPEED, INITIAL_SPEED], this.shootCB);
            y += delta;
            if (y < MIN_Y)
                y = MAX_Y - (MIN_Y - y);
            else if (y > MAX_Y)
                y = MIN_Y + (y - MAX_Y);
        }
    };
    EnemyGenerator.prototype.getNextEnemy = function () {
        var enemy;
        for (var _i = 0, _a = this.enemies; _i < _a.length; _i++) {
            var e = _a[_i];
            if (!e.doesExist()) {
                enemy = e;
                break;
            }
        }
        if (enemy == null) {
            enemy = new Enemy();
            this.enemies.push(enemy);
        }
        return enemy;
    };
    EnemyGenerator.prototype.randomizeEnemyType = function (t) {
        if (t >= 3.0)
            return [0, false, 0, 0];
        var CAP = [
            3, 4, 5, 5
        ];
        var PROBABILITIES = [
            [0.40, 0.35, 0.25, 0.00, 0.00],
            [0.30, 0.25, 0.20, 0.25, 0.00],
            [0.25, 0.20, 0.15, 0.30, 0.10],
            [0.20, 0.20, 0.15, 0.25, 0.20],
            [0.20, 0.20, 0.15, 0.25, 0.20],
        ];
        var FLIP_PROBABILITY = [
            [0.75, 0.5, 0, 0, 0],
            [0.5, 0.25, 0, 0, 0],
            [0.25, 0.1, 0, 0, 0],
            [0.0, 0.0, 0, 0, 0],
            [0.0, 0.0, 0, 0, 0],
        ];
        var MAX_AMOUNT = [
            [2, 2, 1, 0, 0],
            [3, 3, 1, 2, 0],
            [4, 3, 1, 3, 2],
            [4, 3, 1, 4, 4],
            [4, 3, 1, 4, 4],
        ];
        var p = Math.random();
        var type = EnemyType.Fly;
        var totalProb = 0.0;
        var q;
        var s = t % 1.0;
        for (var i = 0; i < 5; ++i) {
            q = (1 - s) * PROBABILITIES[Math.floor(t)][i] +
                s * PROBABILITIES[Math.floor(t) + 1][i];
            totalProb += q;
            if (p < totalProb) {
                type = i;
                break;
            }
        }
        var amount = MAX_AMOUNT[Math.round(t) | 0][type];
        var flip = Math.random() <
            (1 - s) * FLIP_PROBABILITY[Math.floor(t)][type] +
                s * FLIP_PROBABILITY[Math.floor(t) + 1][type];
        return [type, flip, amount, CAP[Math.floor(t)]];
    };
    EnemyGenerator.prototype.spawnEnemy = function (index, t) {
        var WAIT_BASE = 30;
        var WAIT_MOD = [
            45, 45, 75, 60, 60
        ];
        var out = this.randomizeEnemyType(t);
        var count = 1 + Math.floor(Math.random() * out[2]);
        var type = out[0];
        if (type == this.lastIndices[index]) {
            type = (type + 1) % out[3];
        }
        this.lastIndices[index] = type;
        var flip = out[1];
        switch (type) {
            case EnemyType.Fly:
                this.spawnFlies(count, flip);
                break;
            case EnemyType.Slime:
                if (flip)
                    count = 1;
                this.spawnSlimes(count, flip);
                break;
            case EnemyType.Cloud:
                this.spawnClouds(count);
                break;
            case EnemyType.Bee:
                this.spawnBees();
                break;
            case EnemyType.Kamikaze:
                this.spawnKamikaze(count);
                break;
            default:
                break;
        }
        return WAIT_BASE + count * WAIT_MOD[type];
    };
    EnemyGenerator.prototype.spawnDamageText = function (texts, dmg, pos) {
        var text;
        for (var _i = 0, texts_1 = texts; _i < texts_1.length; _i++) {
            var t = texts_1[_i];
            if (!t.doesExist()) {
                text = t;
                break;
            }
        }
        if (text == null) {
            text = new FlyingText();
            texts.push(text);
        }
        text.spawn("-" + String(dmg), pos, 2, 10, 30, FontColor.Red);
    };
    EnemyGenerator.prototype.spawnPickUp = function (lstate, pickups, pos, ev) {
        var LIFE_CHANCE = 0.125;
        var COIN_CHANCE = 0.25;
        var SPEED_X = 1.0;
        var SPEED_Y = -1.0;
        var id = 4;
        if (Math.random() > LIFE_CHANCE) {
            if (Math.random() <= COIN_CHANCE)
                id = (Math.random() * 4) | 0;
            else
                return;
        }
        var pickup;
        for (var _i = 0, pickups_1 = pickups; _i < pickups_1.length; _i++) {
            var p = pickups_1[_i];
            if (!p.doesExist()) {
                pickup = p;
                break;
            }
        }
        if (pickup == null) {
            pickup = new PickUp(lstate);
            pickups.push(pickup);
        }
        pickup.spawn(pos, new Vector2(SPEED_X, SPEED_Y), id);
    };
    EnemyGenerator.prototype.updateTimers = function (lstate, ev) {
        var TIMER_SPEEDS = [
            [1.0, 0.0, 0.0, 0.0],
            [1.0, 0.5, 0.0, 0.0],
            [1.0, 1.0, 0.5, 0.0],
            [1.0, 1.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 0.0]
        ];
        var t = lstate.getPower();
        if (t >= 3.0 || Math.floor(t) + 1 >= TIMER_SPEEDS.length)
            return;
        var index = (t | 0);
        var s = t % 1.0;
        var speed = 0.0;
        for (var i = 0; i < this.timers.length; ++i) {
            speed = (1 - s) * TIMER_SPEEDS[index][i]
                + s * TIMER_SPEEDS[index + 1][i];
            if ((this.timers[i] -= speed * ev.step) <= 0.0) {
                this.timers[i] += this.spawnEnemy(i, t);
            }
        }
    };
    EnemyGenerator.prototype.updateEnemy = function (e, bullets, text, pickups, player, lstate, ev) {
        var dmg;
        var blade = player.getBlade();
        e.update(ev);
        if (e.doesExist() && !e.isDying()) {
            if (player.entityCollision(e, true, false, ev) > 0) {
                lstate.resetMultiplier();
            }
            if (blade != null &&
                e.getHurtIndex != undefined &&
                e.getHurtIndex() < blade.getAttackIndex()) {
                dmg = e.entityCollision(blade, true, false);
                if (dmg > 0) {
                    this.spawnDamageText(text, dmg, blade.getPos());
                    e.setHurtIndex(blade.getAttackIndex());
                    lstate.addExperience(e.getXP(dmg));
                    ev.audio.playSample(ev.assets.getSound("hurtEnemy"), 0.50);
                }
            }
            for (var _i = 0, bullets_1 = bullets; _i < bullets_1.length; _i++) {
                var b = bullets_1[_i];
                if (!b.isFriendly())
                    continue;
                dmg = e.entityCollision(b, true);
                if (dmg > 0) {
                    this.spawnDamageText(text, dmg, b.getPos());
                    lstate.addExperience(e.getXP(dmg));
                }
            }
            if (e.isDying()) {
                lstate.increaseMultiplier();
                this.spawnPickUp(lstate, pickups, e.getPos(), ev);
            }
        }
    };
    EnemyGenerator.prototype.update = function (bullets, text, pickups, player, lstate, ev) {
        if (!this.bossBegun)
            this.updateTimers(lstate, ev);
        else {
            this.updateEnemy(this.boss, bullets, text, pickups, player, lstate, ev);
            this.updateEnemy(this.boss.getOrbiter(), bullets, text, pickups, player, lstate, ev);
            lstate.setPower(this.boss.getHealth() /
                this.boss.getMaxHealth() * 3.0);
        }
        for (var _i = 0, _a = this.enemies; _i < _a.length; _i++) {
            var e = _a[_i];
            this.updateEnemy(e, bullets, text, pickups, player, lstate, ev);
        }
    };
    EnemyGenerator.prototype.drawShadows = function (c) {
        for (var _i = 0, _a = this.enemies; _i < _a.length; _i++) {
            var e = _a[_i];
            e.drawShadow(c);
        }
        if (this.bossBegun) {
            this.boss.getOrbiter().drawShadow(c);
            this.boss.drawShadow(c);
        }
    };
    EnemyGenerator.prototype.draw = function (c) {
        for (var _i = 0, _a = this.enemies; _i < _a.length; _i++) {
            var e = _a[_i];
            e.draw(c, c.getBitmap("enemies"));
        }
        if (this.bossBegun) {
            this.boss.getOrbiter().draw(c, c.getBitmap("spikeball"));
            this.boss.draw(c);
        }
    };
    EnemyGenerator.prototype.reset = function () {
        for (var _i = 0, _a = this.enemies; _i < _a.length; _i++) {
            var e = _a[_i];
            e.kill(true);
        }
        this.initTimers();
        this.bossBegun = false;
        this.boss = null;
    };
    EnemyGenerator.prototype.startBossBattle = function (stage) {
        var BOSS_X = 96;
        if (this.bossBegun)
            return;
        for (var _i = 0, _a = this.enemies; _i < _a.length; _i++) {
            var e = _a[_i];
            e.kill(false, false);
        }
        this.bossBegun = true;
        this.boss = new Boss(256 + BOSS_X, 96, this.shootCB, function () {
            stage.toggleSkyShift(false);
        });
    };
    EnemyGenerator.prototype.bossDead = function () {
        return this.boss != null &&
            !this.boss.doesExist();
    };
    return EnemyGenerator;
}());
var WaveMovement = (function (_super) {
    __extends(WaveMovement, _super);
    function WaveMovement(base, amplitude, latitude, speed, start) {
        if (start === void 0) { start = 0.0; }
        var _this = _super.call(this, base) || this;
        _this.amplitude = amplitude;
        _this.latitude = latitude;
        _this.waveTime = negMod(start, Math.PI * 2);
        _this.base.speed.y = 0.0;
        _this.base.speed.x = speed;
        _this.base.target = _this.base.speed.clone();
        return _this;
    }
    WaveMovement.prototype.move = function (ev) {
        this.waveTime += this.latitude * ev.step;
        this.waveTime %= Math.PI * 2;
        this.base.pos.y = this.base.startPos.y +
            Math.sin(this.waveTime) * this.amplitude;
    };
    return WaveMovement;
}(MovementLogic));
var DirectMovement = (function (_super) {
    __extends(DirectMovement, _super);
    function DirectMovement(base, acc, speed, initialSpeed) {
        var _this = _super.call(this, base) || this;
        _this.base.acc.x = acc;
        _this.launchSpeed = speed;
        _this.initialSpeed = initialSpeed;
        _this.base.speed.x = initialSpeed;
        _this.base.speed.y = 0;
        _this.base.target.x = initialSpeed;
        _this.base.target.y = 0;
        _this.speedReset = false;
        return _this;
    }
    DirectMovement.prototype.move = function (ev) {
        if (this.base.pos.x > 256 - 12) {
            this.base.target.x = this.initialSpeed;
            this.base.speed.x = this.initialSpeed;
        }
        else {
            this.base.target.x = this.launchSpeed;
            if (!this.speedReset) {
                this.base.speed.x = 0;
                this.speedReset = true;
            }
        }
    };
    return DirectMovement;
}(MovementLogic));
var JumpMovement = (function (_super) {
    __extends(JumpMovement, _super);
    function JumpMovement(base, waitTime, jumpHeight, initialWait, speed) {
        var _this = _super.call(this, base) || this;
        _this.waitTime = initialWait;
        _this.baseWaitTime = waitTime;
        _this.jumpHeight = jumpHeight;
        _this.base.speed.y = 0.0;
        _this.base.speed.x = speed;
        _this.base.target.x = speed;
        _this.initialSpeed = speed;
        _this.base.acc.y = 0.10;
        return _this;
    }
    JumpMovement.prototype.move = function (ev) {
        var GRAVITY = 3.0;
        var BOTTOM = 192 - 16 - 10;
        var JUMP_SPEED_X_FORWARDS = -0.5;
        var JUMP_SPEED_X_BACKWARDS = 0.5;
        var JUMP_MUL_FORWARDS = 1.25;
        var JUMP_MUL_BACKWARDS = 1.05;
        this.base.target.y = GRAVITY;
        if (this.canJump)
            this.base.target.x = this.initialSpeed;
        if (this.canJump && this.base.pos.x < 256 - 12) {
            this.waitTime -= ev.step;
            if (this.waitTime <= 0) {
                this.waitTime += this.baseWaitTime;
                this.base.speed.y = -this.jumpHeight;
                if (this.base.flip) {
                    this.base.target.x = this.initialSpeed +
                        JUMP_SPEED_X_BACKWARDS;
                    this.jumpHeight *= JUMP_MUL_BACKWARDS;
                }
                else {
                    this.base.target.x = this.initialSpeed +
                        JUMP_SPEED_X_FORWARDS;
                    this.jumpHeight *= JUMP_MUL_FORWARDS;
                }
                ev.audio.playSample(ev.assets.getSound("jump"), 0.40);
            }
        }
        this.canJump = false;
        if (this.base.speed.y > 0.0 &&
            this.base.pos.y >= BOTTOM) {
            this.base.pos.y = BOTTOM;
            this.base.speed.y = 0.0;
            this.canJump = true;
        }
    };
    return JumpMovement;
}(MovementLogic));
var UpDownMovement = (function (_super) {
    __extends(UpDownMovement, _super);
    function UpDownMovement(base, speedx, speedy, lat) {
        var _this = _super.call(this, base) || this;
        _this.base.speed.x = -1.0;
        _this.base.speed.y = speedy;
        _this.ampl = speedx;
        _this.lat = lat;
        _this.wave = 0.0;
        _this.base.target = _this.base.speed.clone();
        _this.base.acc.y = 0.025;
        return _this;
    }
    UpDownMovement.prototype.move = function (ev) {
        var TOP = 20 + 40;
        var BOTTOM = 192 - 16 - 48;
        this.wave = (this.wave + this.lat * ev.step) % (Math.PI * 2);
        this.base.target.x = -1.0 + Math.sin(this.wave) * this.ampl;
        if ((this.base.target.y > 0 && this.base.pos.y > BOTTOM) ||
            (this.base.target.y < 0 && this.base.pos.y < TOP)) {
            this.base.target.y *= -1;
        }
    };
    return UpDownMovement;
}(MovementLogic));
var CircleMovement = (function (_super) {
    __extends(CircleMovement, _super);
    function CircleMovement(base, distance, angleSpeed, speed, angle) {
        if (angle === void 0) { angle = 0; }
        var _this = _super.call(this, base) || this;
        _this.baseSpeed = speed;
        _this.angleSpeed = angleSpeed;
        _this.distance = distance;
        _this.angle = angle;
        _this.base.speed.x = 0.0;
        _this.base.speed.y = 0.0;
        _this.base.target = _this.base.speed.clone();
        _this.base.moveStartPos = true;
        return _this;
    }
    CircleMovement.prototype.move = function (ev) {
        this.angle = (this.angle + this.angleSpeed * ev.step) % (Math.PI * 2);
        this.base.pos.x = this.base.startPos.x +
            Math.cos(this.angle) * this.distance;
        this.base.pos.y = this.base.startPos.y +
            Math.sin(this.angle) * this.distance;
        this.base.startPos.x += this.baseSpeed * ev.step;
    };
    return CircleMovement;
}(MovementLogic));
var SlimeRenderer = (function (_super) {
    __extends(SlimeRenderer, _super);
    function SlimeRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SlimeRenderer.prototype.reset = function (row, skip) {
        if (row === void 0) { row = 0; }
        if (skip === void 0) { skip = 0; }
        this.skip = skip;
        this.spr.setFrame(row + 1, skip);
    };
    SlimeRenderer.prototype.animate = function (ev) {
        var EPS = 0.5;
        this.spr.setFrame(this.spr.getRow(), this.skip);
        if (this.base.speed.y < -EPS) {
            this.spr.setFrame(this.spr.getRow(), this.skip + 1);
        }
        else if (this.base.speed.y > EPS) {
            this.spr.setFrame(this.spr.getRow(), this.skip + 2);
        }
    };
    return SlimeRenderer;
}(EnemyRenderer));
var PeriodicShot = (function (_super) {
    __extends(PeriodicShot, _super);
    function PeriodicShot(base, period, delay, speed, angleStart, angleStep, count, animCB, shootCB) {
        var _this = _super.call(this, base, animCB, shootCB) || this;
        _this.period = period;
        _this.speed = speed;
        _this.angleStart = angleStart;
        _this.angleStep = angleStep;
        _this.count = count;
        _this.timer = period * (1 - delay);
        return _this;
    }
    PeriodicShot.prototype.shoot = function () {
        var angle;
        for (var i = 0; i < this.count; ++i) {
            angle = this.angleStart + i * this.angleStep;
            this.shootCB(new Vector2(this.base.pos.x - 8, this.base.pos.y + 4), new Vector2(-Math.cos(angle) * this.speed, -Math.sin(angle) * this.speed), 30);
        }
    };
    PeriodicShot.prototype.update = function (ev) {
        this.timer += ev.step;
        if (this.timer >= this.period) {
            this.timer -= this.period;
            if (this.animCB != undefined) {
                this.animCB();
            }
            if (this.shootCB != undefined) {
                this.shoot();
            }
        }
    };
    return PeriodicShot;
}(ShootingLogic));
var FlyAI = (function (_super) {
    __extends(FlyAI, _super);
    function FlyAI(base, rendComp, params, shootCB) {
        var _this = _super.call(this, base, rendComp) || this;
        _this.moveComp = new WaveMovement(base, params[0], params[1], -params[2], params[3]);
        _this.shootComp = new PeriodicShot(base, Math.PI * 2 / params[1], params[3] / (Math.PI * 2), 3.0, 0, 0, 1, function () {
            _this.animateShooting();
        }, shootCB);
        _this.base.setInitialHealth(15);
        _this.base.power = 50;
        _this.base.xp = 20;
        _this.base.hitbox = new Vector2(16, 16);
        return _this;
    }
    return FlyAI;
}(BaseEnemyAI));
var SlimeAI = (function (_super) {
    __extends(SlimeAI, _super);
    function SlimeAI(base, rendComp, params, shootCB) {
        var _this = _super.call(this, base, rendComp) || this;
        _this.moveComp = new JumpMovement(base, params[0], params[1], params[2], -params[3]);
        _this.shootComp = undefined;
        _this.base.setInitialHealth(10);
        _this.base.power = 60;
        _this.base.xp = 15;
        _this.base.hitbox = new Vector2(16, 16);
        _this.base.flip = params[4] == 1;
        return _this;
    }
    return SlimeAI;
}(BaseEnemyAI));
var FleeingFlyAI = (function (_super) {
    __extends(FleeingFlyAI, _super);
    function FleeingFlyAI(base, rendComp, params, shootCB) {
        var _this = _super.call(this, base, rendComp) || this;
        _this.moveComp = new WaveMovement(base, params[0], params[1], -params[2], params[3]);
        _this.shootComp = undefined;
        _this.base.setInitialHealth(15);
        _this.base.power = 50;
        _this.base.xp = 20;
        _this.base.hitbox = new Vector2(16, 16);
        _this.base.flip = true;
        return _this;
    }
    return FleeingFlyAI;
}(BaseEnemyAI));
var CloudAI = (function (_super) {
    __extends(CloudAI, _super);
    function CloudAI(base, rendComp, params, shootCB) {
        var _this = _super.call(this, base, rendComp) || this;
        var SHOOT_PERIOD = 120.0;
        _this.moveComp = new UpDownMovement(base, -params[0], params[1], params[2]);
        _this.shootComp = new PeriodicShot(base, SHOOT_PERIOD, Math.random(), 3.0, -Math.PI / 6.0, Math.PI / 6.0, 3, function () {
            _this.animateShooting();
        }, shootCB);
        _this.base.setInitialHealth(25);
        _this.base.power = 60;
        _this.base.xp = 30;
        _this.base.hitbox = new Vector2(16, 16);
        _this.base.flip = false;
        return _this;
    }
    return CloudAI;
}(BaseEnemyAI));
var BeeAI = (function (_super) {
    __extends(BeeAI, _super);
    function BeeAI(base, rendComp, params, shootCB) {
        var _this = _super.call(this, base, rendComp) || this;
        _this.moveComp = new CircleMovement(base, params[0], params[1], -params[2], params[3]);
        _this.shootComp = undefined;
        _this.base.setInitialHealth(10);
        _this.base.power = 50;
        _this.base.xp = 15;
        _this.base.hitbox = new Vector2(16, 16);
        return _this;
    }
    return BeeAI;
}(BaseEnemyAI));
var KamikazeAI = (function (_super) {
    __extends(KamikazeAI, _super);
    function KamikazeAI(base, rendComp, params, shootCB) {
        var _this = _super.call(this, base, rendComp) || this;
        _this.moveComp = new DirectMovement(base, params[0], -params[1], -params[2]);
        _this.shootComp = undefined;
        _this.base.setInitialHealth(5);
        _this.base.power = 80;
        _this.base.xp = 10;
        _this.base.hitbox = new Vector2(20, 16);
        _this.base.killCB = function () {
            var COUNT = 8;
            var BULLET_SPEED = 3;
            var angle;
            var pos = _this.base.pos.clone();
            for (var i = 0; i < COUNT; ++i) {
                angle = Math.PI * 2 / COUNT * i;
                shootCB(pos, new Vector2(Math.cos(angle) * BULLET_SPEED, Math.sin(angle) * BULLET_SPEED), 30);
            }
        };
        return _this;
    }
    return KamikazeAI;
}(BaseEnemyAI));
var FontColor;
(function (FontColor) {
    FontColor[FontColor["White"] = 0] = "White";
    FontColor[FontColor["Red"] = 1] = "Red";
    FontColor[FontColor["Yellow"] = 2] = "Yellow";
})(FontColor || (FontColor = {}));
;
var FlyingText = (function () {
    function FlyingText() {
        var _this = this;
        this.doesExist = function () { return _this.exist; };
        this.exist = false;
    }
    FlyingText.prototype.spawn = function (output, pos, speed, stopTime, waitTime, color) {
        if (color === void 0) { color = FontColor.White; }
        this.pos = pos;
        this.speed = speed;
        this.stopTime = stopTime;
        this.output = output;
        this.waitTime = waitTime;
        this.color = color;
        this.exist = true;
    };
    FlyingText.prototype.update = function (ev) {
        if (!this.exist)
            return;
        if (this.stopTime > 0) {
            this.stopTime -= ev.step;
            this.pos.y -= this.speed * ev.step;
        }
        else {
            if ((this.waitTime -= ev.step) <= 0) {
                this.exist = false;
            }
        }
    };
    FlyingText.prototype.draw = function (c) {
        var STR = [
            "", "Red", "Yellow"
        ];
        if (!this.exist)
            return;
        c.drawText(c.getBitmap("font" + STR[this.color]), this.output, this.pos.x | 0, (this.pos.y | 0) - 8, -1, 0, true);
    };
    FlyingText.prototype.kill = function () {
        this.exist = false;
    };
    return FlyingText;
}());
var GameScene = (function () {
    function GameScene() {
        var _this = this;
        this.MUSIC_VOLUME = 0.70;
        this.pauseMenu = new Menu([
            new MenuButton("RESUME", function (ev) {
                _this.paused = false;
                _this.canvasCopied = false;
                ev.audio.resumeMusic();
                return true;
            }),
            new MenuButton("SELF-DESTRUCT", function (ev) {
                _this.confirm.activate(1);
                return true;
            })
        ]);
        this.gameoverMenu = new Menu([
            new MenuButton("RETRY", function (ev) {
                ev.tr.activate(true, 2.0, TransitionType.Fade, 4, function (ev) {
                    _this.gameoverActivated = false;
                    _this.canvasCopied = false;
                    _this.objm.reset(_this.lstate, _this.stage, _this.hud);
                    _this.objm.update(_this.lstate, _this.stage, _this.hud, ev);
                    ev.audio.stopMusic();
                    ev.audio.fadeInMusic(ev.assets.getSound("theme"), _this.MUSIC_VOLUME, 1000);
                });
                return true;
            }),
            new MenuButton("UPGRADE SKILLS", function (ev) {
                _this.skills.activate();
                return true;
            })
        ]);
        this.confirm = new ConfirmBox("Are you sure?", function (ev) {
            ev.audio.resumeMusic();
            ev.audio.stopMusic();
            _this.objm.killPlayer();
            _this.paused = false;
            _this.canvasCopied = false;
            return true;
        });
    }
    GameScene.prototype.activate = function (param, ev) {
        this.stage = new Stage();
        this.lstate = new LocalState();
        this.hud = new HUDRenderer(this.lstate);
        this.skills = new SkillMenu(this.lstate);
        this.objm = new ObjectManager(this.lstate);
        this.paused = false;
        this.gameoverActivated = false;
        this.canvasCopied = false;
        ev.audio.fadeInMusic(ev.assets.getSound("theme"), this.MUSIC_VOLUME, 1000);
    };
    GameScene.prototype.update = function (ev) {
        if (ev.tr.isActive())
            return;
        var BACKGROUND_SPEED = 1.0 / 1.40;
        if (this.objm.isGameOver()) {
            if (!this.gameoverActivated) {
                ev.gamepad.forceStickReturnToOrigin();
                this.gameoverMenu.setCursorPos(0);
                this.gameoverActivated = true;
            }
            else {
                if (!this.skills.isActive())
                    this.gameoverMenu.update(ev);
                else
                    this.skills.update(ev);
            }
            return;
        }
        if (this.paused) {
            if (this.confirm.isActive())
                this.confirm.update(ev);
            else
                this.pauseMenu.update(ev);
            return;
        }
        else if (ev.gamepad.getButtonState("start") == State.Pressed) {
            this.paused = true;
            ev.audio.playSample(ev.assets.getSound("pause"), 0.50);
            ev.gamepad.forceStickReturnToOrigin();
            this.pauseMenu.setCursorPos(0);
            this.canvasCopied = false;
            ev.audio.pauseMusic();
            return;
        }
        this.stage.update(BACKGROUND_SPEED, ev);
        this.objm.update(this.lstate, this.stage, this.hud, ev);
        if (this.objm.missionClear()) {
            this.hud.enableEndMessage(function (ev) {
                ev.tr.activate(true, 1.0, TransitionType.Fade, 4, function (ev) {
                    ev.changeScene(new EndingScene());
                });
                return true;
            });
        }
        this.hud.update(ev);
        this.lstate.update(ev);
    };
    GameScene.prototype.drawPauseMenu = function (c, title, menu) {
        var TITLE_Y = 64;
        var BOX_X = 64;
        var BOX_Y = 88;
        var BOX_W = 128;
        var BOX_H = 28;
        c.drawText(c.getBitmap("fontBig"), title, c.width / 2, TITLE_Y, -4, 0, true);
        drawBoxWithBorders(c, BOX_X, BOX_Y, BOX_W, BOX_H, [[255, 255, 255], [0, 0, 0], [72, 145, 255]]);
        menu.draw(c, BOX_X + 4, BOX_Y + 4, 0, 12);
    };
    GameScene.prototype.drawSkillMenu = function (c) {
        c.drawBitmap(c.getCanvasBuffer(), 0, 0);
        c.setColor(0, 0, 0, 0.67);
        c.fillRect(0, 0, 256, 192);
        this.skills.draw(c);
    };
    GameScene.prototype.draw = function (c) {
        c.moveTo();
        if (this.objm.isGameOver() ||
            this.paused) {
            if (!this.canvasCopied) {
                c.copyToBuffer();
                this.canvasCopied = true;
            }
            c.drawBitmap(c.getCanvasBuffer(), 0, 0);
            c.setColor(0, 0, 0, 0.67);
            c.fillRect(0, 0, c.width, c.height);
        }
        if (this.objm.isGameOver()) {
            if (this.skills.isActive())
                this.drawSkillMenu(c);
            else
                this.drawPauseMenu(c, "YOU DIED.", this.gameoverMenu);
            return;
        }
        else if (this.paused) {
            if (this.confirm.isActive()) {
                c.setColor(0, 0, 0, 0.67);
                c.fillRect(0, 0, c.width, c.height);
                this.confirm.draw(c);
            }
            else
                this.drawPauseMenu(c, "GAME PAUSED", this.pauseMenu);
            return;
        }
        this.stage.draw(c);
        this.objm.draw(c);
        this.hud.draw(c);
    };
    GameScene.prototype.deactivate = function () {
    };
    return GameScene;
}());
var HUDRenderer = (function () {
    function HUDRenderer(state) {
        var _this = this;
        this.START_TIME = 150;
        this.END_APPEAR = 30.0;
        this.END_WAIT = 120;
        this.getStartTime = function () { return _this.startTimer; };
        this.healthBar = 1.0;
        this.expBar = 0;
        this.powerBar = 0.0;
        this.bonusFlicker = 0;
        this.bossAlertTimer = 0.0;
        this.startTimer = this.START_TIME;
        this.showEndMessage = false;
        this.endTimer = 0.0;
        this.lstate = state;
    }
    HUDRenderer.prototype.drawBar = function (c, sx, sy, sw, sh, dx, dy, fill, iconOff, text) {
        var bmp = c.getBitmap("hud");
        if (iconOff != undefined) {
            c.drawBitmapRegion(bmp, sx - sh, sy, sh, sh, dx, dy);
            iconOff += sh;
        }
        else {
            iconOff = 0;
        }
        var x = dx + iconOff;
        c.drawBitmapRegion(bmp, sx, 0, sw, sh, x, dy);
        var w = ((sw - 4) * fill) | 0;
        if (w == sw - 5)
            w = sw - 4;
        c.drawBitmapRegion(bmp, sx + 2, sy, w, sh, x + 2, dy);
        if (text != undefined) {
            c.drawText(c.getBitmap("font"), text, x + 32, dy + 4, -1, 0, true);
        }
    };
    HUDRenderer.prototype.drawPowerBar = function (c, dy, fill) {
        var WIDTH = 30;
        var HEIGHT = 8;
        var left = c.width / 2 - 48 + 2;
        var x = left + 2;
        var y = dy;
        var bmp = c.getBitmap("hud");
        c.drawBitmapRegion(bmp, 16, 48, 96, HEIGHT, left, y);
        var full = Math.floor(fill);
        for (var i = 0; i < full; ++i) {
            c.drawBitmapRegion(bmp, 16 + 2, this.bonusFlicker < 8 ? 56 : 64, WIDTH, HEIGHT, x, y);
            x += 31;
        }
        var w;
        if (full < 3) {
            w = ((WIDTH - 4 + full) * (fill % 1.0)) | 0;
            c.drawBitmapRegion(bmp, 16 + 2, 56, w, HEIGHT, x, y);
        }
        c.drawBitmapRegion(bmp, 0, 48, 16, 16, left - 17, y - 6);
    };
    HUDRenderer.prototype.update = function (ev) {
        var DELTA_SPEED = 0.01;
        var FLICKER_MAX = 16;
        this.healthBar = updateSpeedAxis(this.healthBar, this.lstate.getHealth() / this.lstate.getMaxHealth(), DELTA_SPEED * ev.step);
        this.expBar = updateSpeedAxis(this.expBar, this.lstate.getXpPercentage(), DELTA_SPEED * ev.step);
        this.powerBar = updateSpeedAxis(this.powerBar, this.lstate.getPower(), 3 * DELTA_SPEED * ev.step);
        this.bonusFlicker = (this.bonusFlicker + ev.step) % FLICKER_MAX;
        if (this.bossAlertTimer > 0)
            this.bossAlertTimer -= ev.step;
        if (this.startTimer > 0)
            this.startTimer -= ev.step;
        if (this.endTimer > 0) {
            this.endTimer = Math.max(0, this.endTimer - ev.step);
            if (this.endTimer <= 0 && this.endCB != undefined) {
                this.endCB(ev);
            }
        }
    };
    HUDRenderer.prototype.drawBonuses = function (c, top, left) {
        var H_OFF = 24;
        var V_OFF = 12;
        var t;
        var sx, sy, dx, dy;
        var j = 0;
        for (var i = 0; i < 4; ++i) {
            t = this.lstate.getBonusTime(i);
            if (t > 0) {
                if (t < 120 && Math.floor(this.bonusFlicker / 4) % 2 == 0) {
                    ++j;
                    continue;
                }
                sx = 80 + (i % 2) * 24;
                sy = 16 + Math.floor(i / 2) * 12;
                dx = left + (j % 2) * H_OFF;
                dy = top + Math.floor(j / 2) * V_OFF;
                c.drawBitmapRegion(c.getBitmap("hud"), sx, sy, 24, 12, dx, dy);
                ++j;
            }
        }
    };
    HUDRenderer.prototype.drawStart = function (c) {
        var DISAPPEAR_TIME = 30;
        var BIG_Y = 56;
        var BIG_OFF = 16;
        var MOVE = 192;
        var x = 0;
        if (this.startTimer < DISAPPEAR_TIME) {
            x = (MOVE * (1.0 - this.startTimer / DISAPPEAR_TIME)) | 0;
        }
        else if (this.startTimer >= this.START_TIME - DISAPPEAR_TIME) {
            x = (MOVE * ((this.startTimer - (this.START_TIME - DISAPPEAR_TIME))
                / DISAPPEAR_TIME)) | 0;
        }
        c.drawText(c.getBitmap("fontBig"), "MISSION 1", c.width / 2 + x, BIG_Y, -4, 0, true);
        c.drawText(c.getBitmap("font"), "Green Plains", c.width / 2 - x, BIG_Y + BIG_OFF, -1, 0, true);
    };
    HUDRenderer.prototype.drawEnd = function (c) {
        var TEXT_Y = 64;
        var x = c.width / 2;
        if (this.endTimer > this.END_WAIT) {
            x = -c.width / 2 + c.width *
                (1.0 - (this.endTimer - this.END_WAIT) / this.END_APPEAR);
            x |= 0;
        }
        c.drawText(c.getBitmap("fontBig"), "MISSION CLEAR", x, TEXT_Y, -4, 0, true);
    };
    HUDRenderer.prototype.draw = function (c) {
        var BOSS_ALERT_Y = 72;
        c.moveTo();
        var currentHealth = Math.round(this.lstate.getMaxHealth() * this.healthBar);
        this.drawBar(c, 16, 16, 64, 16, 4, 4, this.healthBar, 1, String(currentHealth) +
            "/" +
            String(this.lstate.getMaxHealth()));
        this.drawBar(c, 16, 32, 64, 16, 136, 4, this.expBar, 1, String("LEVEL ") + String(this.lstate.getLevel()));
        var mul = this.lstate.getMultiplier() + 10;
        var mulStr = "\2" + String((mul / 10) | 0) + "." +
            String(mul - 10 * ((mul / 10) | 0));
        c.drawText(c.getBitmap("font"), mulStr, 236, 5, -1, 0, true);
        this.drawBar(c, 80, 6, 32, 6, 220, 13, this.lstate.getMulTimer());
        this.drawPowerBar(c, c.height - 11, this.powerBar);
        this.drawBonuses(c, 1, 86);
        if (this.bossAlertTimer > 0 &&
            Math.floor(this.bossAlertTimer / 15) % 2 == 0) {
            c.drawText(c.getBitmap("fontBig"), "BOSS ALERT!", c.width / 2, BOSS_ALERT_Y, -6, 0, true);
        }
        if (this.startTimer > 0) {
            this.drawStart(c);
        }
        if (this.showEndMessage) {
            this.drawEnd(c);
        }
    };
    HUDRenderer.prototype.reset = function () {
        this.healthBar = 1.0;
        this.powerBar = 0.0;
        this.startTimer = this.START_TIME;
        this.bonusFlicker = 0;
    };
    HUDRenderer.prototype.setBossAlert = function (time) {
        this.bossAlertTimer = time;
    };
    HUDRenderer.prototype.enableEndMessage = function (endCB) {
        if (this.showEndMessage)
            return;
        this.showEndMessage = true;
        this.endTimer = this.END_APPEAR + this.END_WAIT;
        this.endCB = endCB;
    };
    return HUDRenderer;
}());
var ObjectManager = (function () {
    function ObjectManager(lstate) {
        var _this = this;
        this.player = new Player(48, -16, lstate);
        this.player.setBulletCallback(function (pos, speed, power) {
            _this.spawnBullet(0, pos, speed, true, power);
        });
        this.bullets = new Array();
        this.enemyGen = new EnemyGenerator(function (pos, speed, power, id) {
            if (id === void 0) { id = 1; }
            _this.spawnBullet(id, pos, speed, false, power);
        });
        this.pickups = new Array();
        this.flyingText = new Array();
        this.finished = false;
    }
    ObjectManager.prototype.spawnFlyingText = function (msg, x, y, color, wait) {
        if (color === void 0) { color = FontColor.White; }
        if (wait === void 0) { wait = 60; }
        var text;
        for (var _i = 0, _a = this.flyingText; _i < _a.length; _i++) {
            var t = _a[_i];
            if (!t.doesExist()) {
                text = t;
                break;
            }
        }
        if (text == null) {
            text = new FlyingText();
            this.flyingText.push(text);
        }
        text.spawn(msg, new Vector2(x, y), 2, 10, wait, color);
    };
    ObjectManager.prototype.spawnBullet = function (row, pos, speed, friendly, power) {
        if (power === void 0) { power = 1; }
        var bullet;
        bullet = null;
        for (var _i = 0, _a = this.bullets; _i < _a.length; _i++) {
            var b = _a[_i];
            if (!b.doesExist()) {
                bullet = b;
                break;
            }
        }
        if (bullet == null) {
            bullet = new Bullet();
            this.bullets.push(bullet);
        }
        bullet.spawn(row, pos, speed, friendly, power);
    };
    ObjectManager.prototype.update = function (lstate, stage, hud, ev) {
        var BOSS_ALERT_TIME = 120;
        var MESSAGES = [
            "DAMAGE", "DEFENSE",
            "SPEED", "BULLET"
        ];
        var oldLevel = lstate.getLevel();
        var blade = this.player.getBlade();
        var oldDeathState = this.player.isDying();
        if (!this.finished &&
            lstate.isFull()) {
            this.finished = true;
            this.enemyGen.startBossBattle(stage);
            stage.toggleSkyShift(true);
            hud.setBossAlert(BOSS_ALERT_TIME);
            ev.audio.stopMusic();
            ev.audio.playSample(ev.assets.getSound("alert"), 0.70);
            ev.audio.fadeInMusic(ev.assets.getSound("boss"), 0.70, 1000);
        }
        for (var _i = 0, _a = this.bullets; _i < _a.length; _i++) {
            var b = _a[_i];
            b.update(ev);
        }
        var id;
        var pos;
        for (var _b = 0, _c = this.pickups; _b < _c.length; _b++) {
            var p_1 = _c[_b];
            p_1.update(ev);
            id = p_1.getSpriteRow();
            if (!this.player.isDisappearing() &&
                p_1.entityCollision(this.player, true, false, ev) > 0) {
                if (id < 4) {
                    pos = this.player.getPos();
                    this.spawnFlyingText(MESSAGES[id] + " BONUS!", pos.x, pos.y - 16, FontColor.Yellow);
                }
            }
        }
        if (hud.getStartTime() <= 0) {
            this.enemyGen.update(this.bullets, this.flyingText, this.pickups, this.player, lstate, ev);
        }
        this.player.update(ev);
        var s;
        for (var _d = 0, _e = this.bullets; _d < _e.length; _d++) {
            var b = _e[_d];
            if (b.isFriendly() || b.isDying() || !b.doesExist())
                continue;
            if (blade != null) {
                s = b.getSpeed();
                if (b.entityCollision(blade, true, false) > 0) {
                    this.spawnBullet(b.getRow() - 1, b.getPos(), new Vector2(-s.x, -s.y), true, b.getPower() * lstate.getDeflectPower());
                    continue;
                }
            }
            if (this.player.entityCollision(b, true, false, ev) > 0) {
                lstate.resetMultiplier();
            }
        }
        if (!oldDeathState &&
            this.player.isDying()) {
            ev.audio.stopMusic();
        }
        if (this.player.doesExist() == false) {
            return;
        }
        var p;
        if (oldLevel != lstate.getLevel()) {
            p = this.player.getPos();
            this.spawnFlyingText("LEVEL UP!", p.x, p.y - 12);
            ev.audio.playSample(ev.assets.getSound("levelUp"), 0.60);
        }
        for (var _f = 0, _g = this.flyingText; _f < _g.length; _f++) {
            var t = _g[_f];
            t.update(ev);
        }
    };
    ObjectManager.prototype.draw = function (c) {
        c.setColor(255, 0, 0);
        this.player.drawShadow(c);
        this.enemyGen.drawShadows(c);
        for (var _i = 0, _a = this.pickups; _i < _a.length; _i++) {
            var p = _a[_i];
            p.drawShadow(c);
        }
        this.player.drawBackLayer(c);
        this.enemyGen.draw(c);
        this.player.draw(c);
        for (var _b = 0, _c = this.bullets; _b < _c.length; _b++) {
            var b = _c[_b];
            b.draw(c, c.getBitmap("bullet"));
        }
        for (var _d = 0, _e = this.pickups; _d < _e.length; _d++) {
            var p = _e[_d];
            p.draw(c, c.getBitmap("pickup"));
        }
        for (var _f = 0, _g = this.flyingText; _f < _g.length; _f++) {
            var t = _g[_f];
            t.draw(c);
        }
    };
    ObjectManager.prototype.reset = function (lstate, stage, hud) {
        this.player.reset();
        for (var _i = 0, _a = this.bullets; _i < _a.length; _i++) {
            var b = _a[_i];
            b.kill(true);
        }
        for (var _b = 0, _c = this.flyingText; _b < _c.length; _b++) {
            var f = _c[_b];
            f.kill();
        }
        for (var _d = 0, _e = this.pickups; _d < _e.length; _d++) {
            var p = _e[_d];
            p.kill(true);
        }
        hud.reset();
        lstate.reset();
        stage.toggleSkyShift(false);
        this.finished = false;
        this.enemyGen.reset();
    };
    ObjectManager.prototype.killPlayer = function () {
        this.player.kill(false);
    };
    ObjectManager.prototype.isGameOver = function () {
        return !this.player.doesExist();
    };
    ObjectManager.prototype.missionClear = function () {
        return this.enemyGen.bossDead();
    };
    return ObjectManager;
}());
var PickUpAI = (function (_super) {
    __extends(PickUpAI, _super);
    function PickUpAI(base) {
        var _this = _super.call(this, base) || this;
        _this.getId = function () { return _this.id; };
        _this.base.acc.x = 0.05;
        _this.base.acc.y = 0.05;
        _this.id = 0;
        return _this;
    }
    PickUpAI.prototype.reset = function (speed, target, acc) {
        this.base.speed = speed.clone();
        this.base.speed.x = -1.0 + this.base.speed.x;
        this.base.target.x = -1.0;
    };
    PickUpAI.prototype.update = function (ev) {
        var BOTTOM = 192 - 16 - 6;
        var GRAVITY = 4.0;
        var JUMP_MUL = 0.95;
        this.base.target.y = GRAVITY;
        if (this.base.pos.y > BOTTOM) {
            this.base.pos.y = BOTTOM;
            if (this.base.speed.y > 0) {
                this.base.speed.y *= -JUMP_MUL;
                if (this.id < 4)
                    this.id = (this.id + 1) % 4;
            }
        }
        if (this.base.pos.x < -8) {
            this.base.exist = false;
        }
    };
    PickUpAI.prototype.setId = function (id) {
        this.id = id;
    };
    return PickUpAI;
}(AIComponent));
var PickUpRenderer = (function (_super) {
    __extends(PickUpRenderer, _super);
    function PickUpRenderer(base) {
        var _this = _super.call(this, base, 16, 16) || this;
        _this.getRow = function () { return _this.spr.getRow(); };
        return _this;
    }
    PickUpRenderer.prototype.reset = function (row, speed, length) {
        if (row === void 0) { row = 0; }
        if (speed === void 0) { speed = 0; }
        if (length === void 0) { length = 4; }
        this.length = length;
        this.spr.setFrame(row, 0);
        this.animSpeed = speed;
    };
    PickUpRenderer.prototype.animate = function (ev) {
        this.spr.animate(this.spr.getRow(), 0, this.length - 1, this.animSpeed, ev.step);
    };
    PickUpRenderer.prototype.changeRow = function (row) {
        this.spr.setRow(row);
    };
    return PickUpRenderer;
}(RenderComponent));
var PickUp = (function (_super) {
    __extends(PickUp, _super);
    function PickUp(lstate) {
        var _this = _super.call(this) || this;
        _this.renderRef = new PickUpRenderer(_this.base);
        _this.renderComp = _this.renderRef;
        _this.aiRef = new PickUpAI(_this.base);
        _this.ai = _this.aiRef;
        _this.base.exist = false;
        _this.base.hitbox = new Vector2(16, 16);
        _this.lstate = lstate;
        return _this;
    }
    PickUp.prototype.spawn = function (pos, speed, id) {
        var SPIN_SPEED = 6;
        this.base.exist = true;
        this.base.dying = false;
        this.base.pos = pos.clone();
        this.ai.reset(speed);
        this.aiRef.setId(id);
        this.renderRef.reset(id, SPIN_SPEED, id == 4 ? 8 : 4);
    };
    PickUp.prototype.refresh = function () {
        if (this.base.dying || !this.base.exist)
            return;
        this.renderRef.changeRow(this.aiRef.getId());
    };
    PickUp.prototype.hostileCollision = function (e, kill, ev) {
        if (kill === void 0) { kill = true; }
        var SOUNDS = ["dmgUp", "defUp", "speedUp", "bulletsUp", "healthUp"];
        var BONUS_TIME = 5;
        this.kill();
        if (this.aiRef.getId() == 4) {
            e.addHealth(e.getMaxHealth() / 2);
        }
        else {
            this.lstate.increaseBonusTimer(BONUS_TIME * 60, this.aiRef.getId());
        }
        ev.audio.playSample(ev.assets.getSound(SOUNDS[this.aiRef.getId()]), 0.50);
    };
    return PickUp;
}(Entity));
var Blade = (function (_super) {
    __extends(Blade, _super);
    function Blade(pl, lstate) {
        var _this = _super.call(this, 0, 0) || this;
        _this.getAttackIndex = function () { return _this.attackIndex; };
        _this.base.exist = true;
        _this.follow = pl;
        _this.lstate = lstate;
        _this.base.hitbox = new Vector2(32, 24);
        _this.attackIndex = 0;
        _this.base.speed.x = 4.0;
        return _this;
    }
    Blade.prototype.refresh = function (ev) {
        var p = this.follow.getPos();
        this.base.power = this.lstate.getSwordPower();
        ;
        this.base.pos.x = p.x + 16;
        this.base.pos.y = p.y + this.follow.getWaveDelta() + 8;
    };
    Blade.prototype.increaseAttackIndex = function () {
        ++this.attackIndex;
    };
    return Blade;
}(Entity));
var PlayerAI = (function (_super) {
    __extends(PlayerAI, _super);
    function PlayerAI(base, renderComp, blade, lstate) {
        var _this = _super.call(this, base) || this;
        _this.START_Y = 192 / 2;
        _this.renderComp = renderComp;
        _this.dustTimer = 0.0;
        _this.disappear = 3;
        _this.appearing = true;
        _this.blade = blade;
        _this.lstate = lstate;
        _this.regenTimer = 0;
        _this.extraBulletTimer = 0;
        _this.extraBulletDir = false;
        return _this;
    }
    PlayerAI.prototype.restrict = function () {
        var WIDTH = 24;
        var HEIGHT = 24;
        var GROUND_HEIGHT = 20;
        var TOP_OFF = 20;
        if (this.base.speed.x < 0 &&
            this.base.pos.x - WIDTH / 2 < 0) {
            this.base.speed.x = 0;
            this.base.pos.x = WIDTH / 2;
        }
        else if (this.base.speed.x > 0 &&
            this.base.pos.x + WIDTH / 2 >= 256) {
            this.base.speed.x = 0;
            this.base.pos.x = 256 - WIDTH / 2;
        }
        if (this.base.speed.y < 0 &&
            this.base.pos.y - HEIGHT / 2 < TOP_OFF) {
            this.base.speed.y = 0;
            this.base.pos.y = TOP_OFF + HEIGHT / 2;
        }
        else if (this.base.speed.y > 0 &&
            this.base.pos.y + HEIGHT / 2 >= 192 - GROUND_HEIGHT) {
            this.base.speed.y = 0;
            this.base.pos.y = 192 - GROUND_HEIGHT
                - HEIGHT / 2;
        }
    };
    PlayerAI.prototype.reset = function () {
        this.appearing = true;
        this.extraBulletTimer = 0;
        this.extraBulletDir = false;
    };
    PlayerAI.prototype.shootBullets = function () {
        var SHOOT_ANGLE = Math.PI / 6.0;
        var min = 0;
        var max = 0;
        var wait = this.lstate.getBulletWait();
        if (wait >= 0) {
            if ((++this.extraBulletTimer) >= wait) {
                this.extraBulletTimer -= wait;
                if (this.extraBulletDir) {
                    max = 1;
                }
                else {
                    min = -1;
                }
                this.extraBulletDir = !this.extraBulletDir;
            }
        }
        if (this.lstate.getBulletBonus() > 0) {
            if (min == 0 && max == 0) {
                if (this.extraBulletDir) {
                    max = 1;
                }
                else {
                    min = -1;
                }
                this.extraBulletDir = !this.extraBulletDir;
            }
            else if (min == -1)
                max = 1;
            else if (min == 0)
                min = -1;
        }
        var angle;
        for (var i = min; i <= max; ++i) {
            angle = i * SHOOT_ANGLE;
            this.bulletCB(new Vector2(this.base.pos.x + 20, this.base.pos.y + this.renderComp.getWaveDelta() - 2), new Vector2(this.lstate.getBulletSpeed() * Math.cos(angle) +
                this.base.speed.x / 4, this.lstate.getBulletSpeed() * Math.sin(angle) +
                this.base.speed.y / 4), this.lstate.getBulletPower());
        }
    };
    PlayerAI.prototype.updateInitialAppearing = function (ev) {
        var SPEED = 1.5;
        this.base.target.y = SPEED;
        this.base.speed.y = SPEED;
        this.base.target.x = 0;
        this.base.speed.x = 0;
        if (this.base.pos.y > this.START_Y) {
            this.base.target.y = 0;
            this.appearing = false;
            this.renderComp.forceReappear();
        }
    };
    PlayerAI.prototype.control = function (ev) {
        var BASE_SPEED = 2;
        var REGEN_COUNT = 1;
        var stick = ev.gamepad.getStick();
        var s = this.lstate.getMoveSpeed();
        this.base.acc.x = 0.25 * s;
        this.base.acc.y = 0.25 * s;
        this.base.target.x = stick.x * BASE_SPEED * s;
        this.base.target.y = stick.y * BASE_SPEED * s;
        if (this.disappear)
            return;
        var fire1 = ev.gamepad.getButtonState("fire1");
        var oldState = this.renderComp.getShootType();
        if (ev.gamepad.getButtonState("fire3") == State.Pressed) {
            if (!this.renderComp.isSwordActive()) {
                this.blade.increaseAttackIndex();
                this.renderComp.animateShooting(1);
                if (!oldState && this.renderComp.getShootType())
                    ev.audio.playSample(ev.assets.getSound("blade"), 0.30);
            }
        }
        else if (!this.renderComp.isShooting() &&
            (fire1 == State.Down || fire1 == State.Pressed)) {
            if (this.renderComp.animateShooting() &&
                this.bulletCB != undefined) {
                this.shootBullets();
                ev.audio.playSample(ev.assets.getSound("shoot"), 0.30);
            }
        }
        if (ev.gamepad.getButtonState("fire2") == State.Pressed) {
            this.renderComp.startDisappearing();
            this.disappear = 1;
            ev.audio.playSample(ev.assets.getSound("evade"), 0.50);
        }
        if (this.base.health > 0 &&
            this.base.health < this.base.maxHealth &&
            this.lstate.getRegenSpeed() > 0) {
            if ((++this.regenTimer) >= this.lstate.getRegenSpeed()) {
                this.regenTimer -= this.lstate.getRegenSpeed();
                this.base.health += REGEN_COUNT;
                this.lstate.updateHealth(this.base.health);
            }
        }
    };
    PlayerAI.prototype.updateDust = function (ev) {
        var DUST_TIME_BASE = 12.0;
        var DUST_TIME_VARY = 2.0;
        if (this.disappear != 0)
            return;
        var time = DUST_TIME_BASE -
            DUST_TIME_VARY * this.base.speed.len();
        if ((this.dustTimer += ev.step) >= time) {
            this.renderComp.spawnDust(this.base.pos.x - 4, this.base.pos.y + 8);
            this.dustTimer -= time;
        }
    };
    PlayerAI.prototype.setBulletCallback = function (cb) {
        this.bulletCB = cb;
    };
    PlayerAI.prototype.update = function (ev) {
        this.disappear = this.renderComp.getDisappearPhase();
        if (this.appearing) {
            1;
            this.updateInitialAppearing(ev);
            this.renderComp.setBeamTime((this.base.pos.y - this.base.startPos.y) / (this.START_Y - this.base.startPos.y));
        }
        else {
            this.control(ev);
            this.updateDust(ev);
            this.restrict();
        }
        this.renderComp.shadowSize.x = 24;
        var f = this.renderComp.getBodyFrame();
        if (this.disappear > 0) {
            this.renderComp.shadowSize.x -= f * 3;
        }
        this.renderComp.shadowSize.y =
            this.renderComp.shadowSize.x / 4;
    };
    return PlayerAI;
}(AIComponent));
var PlayerRenderComponent = (function (_super) {
    __extends(PlayerRenderComponent, _super);
    function PlayerRenderComponent(base, lstate) {
        var _this = _super.call(this, base, 32, 32) || this;
        _this.isShooting = function () { return _this.shooting; };
        _this.getShootType = function () { return _this.shootMode; };
        _this.getBodyFrame = function () { return _this.spr.getFrame(); };
        _this.getDisappearPhase = function () { return _this.disappear; };
        _this.getWaveDelta = function () { return _this.waveDelta; };
        _this.isDisappering = function () { return _this.disappear != 0; };
        _this.sprHead = new Sprite(32, 16);
        _this.sprLegs = new Sprite(32, 16);
        _this.sprPropeller = new Sprite(32, 16);
        _this.sprArm = new Sprite(32, 16);
        _this.sprOrb = new Sprite(16, 16);
        _this.sprDie = new Sprite(24, 24);
        _this.spr.setFrame(2, 4);
        _this.shooting = false;
        _this.shootWait = 0.0;
        _this.wave = 0.0;
        _this.waveDelta = 0.0;
        _this.deathTimer = 0.0;
        _this.beamTimer = 0.0;
        _this.deathPlayed = false;
        _this.base.power = 1;
        _this.dust = new Array();
        _this.lstate = lstate;
        return _this;
    }
    PlayerRenderComponent.prototype.animateDeath = function (ev) {
        var DEATH_TIME_MAX = 192;
        var DEATH_SPEED = 2;
        var ORB_ANIM_SPEED = 4;
        var BUFF_SPEED = 4;
        if (!this.deathPlayed) {
            ev.audio.playSample(ev.assets.getSound("die"), 0.40);
            this.deathPlayed = true;
        }
        this.sprOrb.animate(0, 8, 10, ORB_ANIM_SPEED, ev.step);
        if (this.sprDie.getFrame() < 6) {
            this.sprDie.animate(0, 0, 6, BUFF_SPEED, ev.step);
        }
        return (this.deathTimer += DEATH_SPEED * ev.step)
            >= DEATH_TIME_MAX;
    };
    PlayerRenderComponent.prototype.animateDisappear = function (ev) {
        var ANIM_SPEED = 4;
        if (this.disappear == 1) {
            this.spr.animate(2, 0, 5, ANIM_SPEED, ev.step);
            if (this.spr.getFrame() == 5) {
                this.disappear = 2;
            }
        }
        else if (this.disappear == 2) {
            this.spr.animate(2, 5, -1, ANIM_SPEED, ev.step);
            if (this.spr.getFrame() == -1) {
                this.spr.setFrame(0, 0);
                this.disappear = 0;
            }
        }
        else if (this.disappear == 3) {
            this.spr.animate(2, 4, 5, ANIM_SPEED, ev.step);
        }
    };
    PlayerRenderComponent.prototype.animateArms = function (ev) {
        var SHOOT_SPEED_BASE = [4, 4];
        var SHOOT_WAIT_TIME_BASE = 10;
        var index = clamp(this.shootMode, 0, 1);
        var row = 3 + this.shootMode * 3;
        var end = [6, 6][index];
        var start = [1, 0][index];
        var timeReduce = SHOOT_WAIT_TIME_BASE - this.lstate.getReloadSpeed();
        var shootWait = Math.max(0, timeReduce) | 0;
        var shotSpeed = SHOOT_SPEED_BASE[index];
        if (index == 0) {
            shotSpeed -= Math.max(0, -timeReduce) / 4;
        }
        if (this.shooting && this.shootWait <= 0.0) {
            this.sprArm.animate(row, start, end + 1, shotSpeed, ev.step);
            if (this.sprArm.getFrame() == end + 1) {
                if (this.shootMode == 0)
                    this.sprArm.setFrame(3, 1);
                else
                    this.sprArm.setFrame(3, 0);
                this.shootMode = 0;
                this.shooting = false;
                if (this.shootMode == 0)
                    this.shootWait = shootWait;
            }
        }
        else {
            this.sprArm.setFrame(3, (this.shooting && this.shootMode == 0) ? 1 : 0);
        }
        if (this.shootWait > 0.0) {
            this.shootWait -= ev.step;
            if (this.shootWait <= 0.0) {
                this.shooting = false;
                this.shootWait = 0.0;
            }
        }
    };
    PlayerRenderComponent.prototype.reset = function (row, speed, thirdParam) {
        this.sprHead = new Sprite(32, 16);
        this.sprLegs = new Sprite(32, 16);
        this.sprPropeller = new Sprite(32, 16);
        this.sprArm = new Sprite(32, 16);
        this.sprOrb = new Sprite(16, 16);
        this.sprDie = new Sprite(24, 24);
        this.flickerTime = 0.0;
        this.shooting = false;
        this.shootWait = 0.0;
        this.wave = 0.0;
        this.waveDelta = 0.0;
        this.deathTimer = 0.0;
        this.deathPlayed = false;
        for (var _i = 0, _a = this.dust; _i < _a.length; _i++) {
            var d = _a[_i];
            d.kill(true);
        }
        this.spr.setFrame(2, 4);
        this.disappear = 3;
    };
    PlayerRenderComponent.prototype.animate = function (ev) {
        var EPS = 0.5;
        var PROPELLER_SPEED_BASE = 5;
        var PROPELLER_VARY = 1.0;
        var WAVE_SPEED = 0.075;
        var WAVE_AMPLITUDE = 3;
        this.wave = (this.wave + WAVE_SPEED * ev.step) % (Math.PI * 2);
        this.waveDelta = (Math.sin(this.wave) * WAVE_AMPLITUDE);
        for (var _i = 0, _a = this.dust; _i < _a.length; _i++) {
            var d = _a[_i];
            d.update(ev);
        }
        if (this.disappear != 0) {
            this.animateDisappear(ev);
            if (this.disappear < 3)
                return;
        }
        else {
            this.spr.setFrame(0, 0);
        }
        this.sprHead.setFrame(0, 1);
        if (this.base.speed.y < -EPS) {
            this.sprHead.setFrame(0, 2);
        }
        else if (this.base.speed.y > EPS) {
            this.sprHead.setFrame(0, 3);
        }
        var angle = Math.atan2(this.base.speed.y, this.base.speed.x);
        var len = this.base.speed.len();
        if (len > EPS) {
            if (angle <= -Math.PI / 4 || angle > Math.PI - Math.PI / 4) {
                this.sprLegs.setFrame(1, 3);
            }
            else {
                this.sprLegs.setFrame(1, 2);
            }
        }
        else {
            this.sprLegs.setFrame(1, 1);
        }
        var propSpeed;
        if (this.disappear != 0) {
            propSpeed = (PROPELLER_SPEED_BASE -
                PROPELLER_VARY * this.base.speed.len()) | 0;
            this.sprPropeller.animate(2, 0, 3, propSpeed, ev.step);
        }
        this.animateArms(ev);
    };
    PlayerRenderComponent.prototype.drawBase = function (c, jump1, jump2) {
        if (jump1 === void 0) { jump1 = 0; }
        if (jump2 === void 0) { jump2 = 0; }
        var x = Math.round(this.base.pos.x - 16);
        var y = Math.round(this.base.pos.y - 16);
        y += this.waveDelta | 0;
        jump1 = jump1 | 0;
        jump2 = jump2 | 0;
        var bmp = c.getBitmap("player");
        if (this.disappear == 0) {
            c.drawSpriteFrame(this.sprPropeller, bmp, this.sprPropeller.getFrame(), this.sprPropeller.getRow() + jump1, x - 6, y - 3, this.flip);
        }
        else {
            y -= 4;
        }
        c.drawSpriteFrame(this.spr, bmp, this.spr.getFrame(), this.spr.getRow() + jump2, x, y, this.flip);
        if (this.disappear > 0) {
            return;
        }
        c.drawSpriteFrame(this.sprArm, bmp, this.sprArm.getFrame(), this.sprArm.getRow() + jump1, x + 12, y + 9, this.flip);
        c.drawSpriteFrame(this.sprHead, bmp, this.sprHead.getFrame(), this.sprHead.getRow() + jump1, x, y + 2, this.flip);
        c.drawSpriteFrame(this.sprLegs, bmp, this.sprLegs.getFrame(), this.sprLegs.getRow() + jump1, x, y + 16, this.flip);
    };
    PlayerRenderComponent.prototype.drawDying = function (c) {
        var COUNT = 8;
        var angle = 0;
        var x = Math.round(this.base.pos.x);
        var y = Math.round(this.base.pos.y);
        if (this.sprDie.getFrame() < 6) {
            c.drawSprite(this.sprDie, c.getBitmap("enemies"), x - 12, y - 12);
        }
        for (var i = 0; i < COUNT; ++i) {
            angle = Math.PI * 2 / COUNT * i;
            c.drawSprite(this.sprOrb, c.getBitmap("player"), x + ((Math.cos(angle) * this.deathTimer) | 0) - 8, y + ((Math.sin(angle) * this.deathTimer) | 0) - 8);
        }
    };
    PlayerRenderComponent.prototype.drawAppearanceBackground = function (c) {
        var BORDER_COLORS = [
            [0, 145, 255],
            [109, 218, 255],
            [218, 255, 255],
        ];
        var EPS = 0.2;
        var BASE_WIDTH = 32;
        var t = this.beamTimer;
        if (t <= 0.0)
            return;
        var w = BASE_WIDTH;
        if (t < EPS) {
            w *= t / EPS;
        }
        else if (t > 1.0 - EPS) {
            w *= 1.0 - (t - (1.0 - EPS)) / EPS;
        }
        w |= 0;
        var x = Math.round(this.base.pos.x);
        c.setColor(255);
        c.fillRect(x - w / 2, 0, w, 192 - 16);
        for (var i = 0; i < BORDER_COLORS.length; ++i) {
            if (w < i * 2)
                break;
            c.setColor(BORDER_COLORS[i][0], BORDER_COLORS[i][1], BORDER_COLORS[i][2]);
            c.fillRect(x - w / 2 + i, 0, 1, 192 - 16);
            c.fillRect(x + w / 2 - 1 - i, 0, 1, 192 - 16);
        }
    };
    PlayerRenderComponent.prototype.draw = function (c, bmp) {
        if (this.base.dying) {
            this.drawDying(c);
            return;
        }
        if (this.disappear == 3) {
            this.drawAppearanceBackground(c);
        }
        this.drawBase(c, 8, 4);
        this.drawBase(c);
    };
    PlayerRenderComponent.prototype.drawBefore = function (c) {
        if (this.base.dying)
            return;
        var bmp = c.getBitmap("dust");
        for (var _i = 0, _a = this.dust; _i < _a.length; _i++) {
            var d = _a[_i];
            d.draw(c, bmp);
        }
    };
    PlayerRenderComponent.prototype.spawnDust = function (x, y) {
        var DUST_ANIM_SPEED = 7;
        var dust;
        for (var _i = 0, _a = this.dust; _i < _a.length; _i++) {
            var d = _a[_i];
            if (!d.doesExist()) {
                dust = d;
                break;
            }
        }
        if (dust == null) {
            dust = new Dust();
            this.dust.push(dust);
        }
        dust.spawn(0, DUST_ANIM_SPEED, new Vector2(x, y), new Vector2(-1.0, 1.0), new Vector2(-1.0, 0.0), new Vector2(0.1, 0.05));
    };
    PlayerRenderComponent.prototype.animateShooting = function (mode) {
        if (mode == 1) {
            this.shootWait = 0;
        }
        this.shooting = true;
        this.shootMode = mode == undefined ? 0 : mode;
        return this.shootWait <= 0 || this.shootMode != 0;
    };
    PlayerRenderComponent.prototype.startDisappearing = function () {
        if (this.disappear != 0)
            return;
        this.disappear = 1;
        this.spr.setFrame(2, 0);
        this.sprPropeller.setFrame(2, 0);
        this.shooting = false;
        this.shootWait = 0;
        this.sprArm.setFrame(3, 0);
    };
    PlayerRenderComponent.prototype.forceReappear = function () {
        this.disappear = 2;
        this.spr.setFrame(2, 5);
        this.sprPropeller.setFrame(2, 0);
    };
    PlayerRenderComponent.prototype.isSwordActive = function () {
        var BLADE_LAST_ACTIVE_FRAME = 4;
        return this.shooting &&
            this.shootMode == 1 &&
            this.sprArm.getFrame() >= 1 &&
            this.sprArm.getFrame() <= BLADE_LAST_ACTIVE_FRAME;
    };
    PlayerRenderComponent.prototype.setBeamTime = function (time) {
        this.beamTimer = Math.min(1.0, time);
    };
    return PlayerRenderComponent;
}(RenderComponent));
var Player = (function (_super) {
    __extends(Player, _super);
    function Player(x, y, lstate) {
        var _this = _super.call(this, x, y) || this;
        _this.getWaveDelta = function () { return _this.rendRef.getWaveDelta(); };
        _this.isDisappearing = function () { return _this.rendRef.isDisappering(); };
        _this.blade = new Blade(_this, lstate);
        _this.rendRef = new PlayerRenderComponent(_this.base, lstate);
        _this.renderComp = _this.rendRef;
        _this.renderComp.reset();
        _this.ai =
            (_this.aiRef = new PlayerAI(_this.base, _this.rendRef, _this.blade, lstate));
        _this.base.exist = true;
        _this.base.hitbox = new Vector2(12, 12);
        _this.lstate = lstate;
        _this.base.maxHealth = lstate.getMaxHealth();
        _this.base.health = _this.base.maxHealth;
        return _this;
    }
    Player.prototype.reset = function () {
        this.base.dying = false;
        this.base.exist = true;
        this.base.pos = this.base.startPos.clone();
        this.aiRef.reset();
        this.base.maxHealth = this.lstate.getMaxHealth();
        this.base.health = this.base.maxHealth;
        this.renderComp.reset();
    };
    Player.prototype.setBulletCallback = function (cb) {
        this.aiRef.setBulletCallback(cb);
    };
    Player.prototype.hostileCollision = function (e, kill, ev) {
        if (kill === void 0) { kill = true; }
        if (this.renderComp.flickerTime > 0 ||
            this.rendRef.isDisappering())
            return;
        this.flicker((60 * this.lstate.getFlickerTime()) | 0);
        this.reduceHealth(e.getPower() / this.lstate.getDamageReduction());
        if (kill)
            e.kill();
        if (ev != undefined &&
            this.base.health > 0) {
            ev.audio.playSample(ev.assets.getSound("hurt"), 0.50);
        }
    };
    Player.prototype.refresh = function (ev) {
        this.lstate.updateHealth(this.base.health);
        this.base.maxHealth = this.lstate.getMaxHealth();
        if (this.doesExist() && !this.isDying())
            this.blade.refresh(ev);
    };
    Player.prototype.getBlade = function () {
        if (this.rendRef.isSwordActive())
            return this.blade;
        return null;
    };
    return Player;
}(Entity));
var SkillMenu = (function () {
    function SkillMenu(lstate) {
        var _this = this;
        this.SKILL_NAMES = [
            "BULLET POWER",
            "AGILITY",
            "DEXTERITY",
            "SWORDMANSHIP",
            "HEALTH",
            "EXPERIENCE BONUS",
            "REGENERATION",
            "EXTRA BULLET"
        ];
        this.SKILL_DESCRIPTIONS = [
            "Increases the bullet power.",
            "Increases the fire rate\nand the speed of bullets.",
            "Increases the movement\nspeed and invincibility\ntime.",
            "Increases the sword power\nand the power of deflected\nbullets.",
            "Increases the maximum\nhealth.",
            "Increases the amount of\nexperience gained.",
            "Improves the automatic\nhealth regeneration.",
            "An additional bullet spawns\nmore often."
        ];
        this.isActive = function () { return _this.active; };
        this.lstate = lstate;
        this.active = false;
        var buttons = new Array();
        var _loop_1 = function (i) {
            buttons.push(new MenuButton(this_1.SKILL_NAMES[i], function (ev) {
                if (lstate.getSkillPoints() <= 0 ||
                    lstate.getSkillLevel(i) >= 5) {
                    return false;
                }
                else {
                    _this.confirm.activate(1);
                }
                return true;
            }));
        };
        var this_1 = this;
        for (var i = 0; i < 8; ++i) {
            _loop_1(i);
        }
        buttons.push(new MenuButton("BACK", function (ev) {
            _this.active = false;
            return false;
        }));
        this.skillMenu = new Menu(buttons);
        this.confirm = new ConfirmBox("Upgrade this skill?", function (ev) {
            _this.increaseSkill(_this.skillMenu.getCursorPos());
            return true;
        });
    }
    SkillMenu.prototype.increaseSkill = function (index) {
        if (this.lstate.getSkillPoints() <= 0)
            return;
        this.lstate.increaseSkillLevel(index);
    };
    SkillMenu.prototype.update = function (ev) {
        if (!this.active)
            return;
        if (this.confirm.isActive()) {
            this.confirm.update(ev);
            return;
        }
        this.skillMenu.update(ev);
    };
    SkillMenu.prototype.draw = function (c) {
        var SKILL_POINT_Y = 8;
        var TITLE_BOX_Y = SKILL_POINT_Y - 1;
        var TITLE_BOX_HEIGHT = 17;
        var BOX_X = 16;
        var BOX_Y = 32;
        var BOX_W = 256 - BOX_X * 2;
        var BOX_H = 116;
        var SKILL_OFF = 2;
        var SKILL_BEGIN_X = BOX_X + BOX_W - (SKILL_OFF + 8) * 5;
        var Y_OFF = 12;
        var DESCP_Y = BOX_Y + BOX_H + 7;
        var DESCP_H = 192 - 4 - DESCP_Y;
        if (!this.active)
            return;
        drawBoxWithBorders(c, BOX_X, TITLE_BOX_Y, BOX_W, TITLE_BOX_HEIGHT, [[255, 255, 255], [0, 0, 0], [72, 145, 255]]);
        c.drawText(c.getBitmap("fontBig"), "SKILL POINTS: " + String(this.lstate.getSkillPoints()), c.width / 2, SKILL_POINT_Y, -4, 0, true);
        drawBoxWithBorders(c, BOX_X, BOX_Y, BOX_W, BOX_H, [[255, 255, 255], [0, 0, 0], [72, 145, 255]]);
        this.skillMenu.draw(c, BOX_X + 4, BOX_Y + 4, 0, Y_OFF);
        var sx = 0;
        var sy = 8;
        var font = c.getBitmap("font");
        for (var i = 0; i < 8; ++i) {
            for (var j = 0; j < 5; ++j) {
                sx = this.lstate.getSkillLevel(i) > j ? 8 : 0;
                c.drawBitmapRegion(font, sx, sy, 8, 8, SKILL_BEGIN_X + j * (8 + SKILL_OFF), BOX_Y + 4 + i * Y_OFF);
            }
        }
        if (this.skillMenu.getCursorPos() < 8) {
            drawBoxWithBorders(c, BOX_X, DESCP_Y, BOX_W, DESCP_H, [[255, 255, 255], [0, 0, 0], [72, 145, 255]]);
            c.drawText(font, this.SKILL_DESCRIPTIONS[this.skillMenu.getCursorPos()], BOX_X + 4, DESCP_Y + 2, 0, 2);
        }
        if (this.confirm.isActive()) {
            c.setColor(0, 0, 0, 0.67);
            c.fillRect(0, 0, c.width, c.height);
            this.confirm.draw(c);
        }
    };
    SkillMenu.prototype.activate = function () {
        if (this.active)
            return;
        this.skillMenu.setCursorPos(this.SKILL_NAMES.length);
        this.active = true;
    };
    return SkillMenu;
}());
var Stage = (function () {
    function Stage() {
        this.LAYER_COUNT = 6;
        this.SHIFT_TIME = 60;
        this.timers = new Array(this.LAYER_COUNT);
        for (var i = 0; i < this.timers.length; ++i) {
            this.timers[i] = 0;
        }
        this.bmpFloor = null;
        this.skyTimer = 0;
        this.skyshift = false;
    }
    Stage.prototype.drawLayer = function (c, bmp, timer, left, top) {
        var loop = ((c.width / bmp.width) | 0) + 1;
        left -= (timer % bmp.width);
        for (var i = 0; i < loop; ++i) {
            c.drawBitmap(bmp, Math.round(left) + i * bmp.width, top);
        }
    };
    Stage.prototype.update = function (globalSpeed, ev) {
        var TIMER_SPEEDS = [
            1.0, 0.5, 0.25, 0.2, 0.125, 0.1
        ];
        if (this.skyshift &&
            this.skyTimer > 0) {
            this.skyTimer -= ev.step;
        }
        for (var i = 0; i < this.timers.length; ++i) {
            this.timers[i] += globalSpeed * TIMER_SPEEDS[i] * ev.step;
            this.timers[i] %= 256;
        }
    };
    Stage.prototype.draw = function (c) {
        var LAYERS_BITMAPS = [
            "forest", "mountainsFront", "cloudsFront",
            "mountainsBack", "cloudsBack"
        ];
        var LAYERS_TOP = [
            96, 40, 16, 40, 16
        ];
        var SUN_X = 208;
        var SUN_Y = 48;
        var FLOOR_VANISH_Y = 129;
        var FLOOR_OFF = 16;
        var FLOOR_DRIFT = 3;
        var b;
        if (this.bmpFloor == null) {
            b = c.getBitmap("floor");
            this.bmpFloor = createFilledBitmap(b, 256 + b.width, 32);
        }
        var t;
        if (!this.skyshift || this.skyTimer > 0) {
            c.drawBitmapRegion(c.getBitmap("sky"), 0, 0, 256, 144, 0, 0);
        }
        if (this.skyshift) {
            t = 1.0 - Math.floor(this.skyTimer / this.SHIFT_TIME * 4) / 4;
            c.setAlpha(Math.min(1, t));
            c.drawBitmapRegion(c.getBitmap("sky"), 0, 144, 256, 144, 0, 0);
            c.setAlpha();
        }
        b = c.getBitmap("sun");
        c.drawBitmap(b, SUN_X - b.width / 2, SUN_Y - b.height / 2);
        for (var i = this.LAYER_COUNT - 1; i >= 1; --i) {
            this.drawLayer(c, c.getBitmap(LAYERS_BITMAPS[i - 1]), this.timers[i - 1], 0, LAYERS_TOP[i - 1]);
        }
        c.draw3DFloor(this.bmpFloor, 192 - 32, 32, this.timers[0] % c.getBitmap("floor").width, FLOOR_DRIFT, c.width, FLOOR_VANISH_Y, FLOOR_OFF);
    };
    Stage.prototype.toggleSkyShift = function (state) {
        this.skyshift = state;
        if (!state)
            return;
        this.skyshift = true;
        this.skyTimer = this.SHIFT_TIME;
    };
    return Stage;
}());
var Skill;
(function (Skill) {
    Skill[Skill["Accuracy"] = 0] = "Accuracy";
    Skill[Skill["Agility"] = 1] = "Agility";
    Skill[Skill["Dexterity"] = 2] = "Dexterity";
    Skill[Skill["Strength"] = 3] = "Strength";
    Skill[Skill["Vitality"] = 4] = "Vitality";
    Skill[Skill["Growth"] = 5] = "Growth";
    Skill[Skill["Regeneration"] = 6] = "Regeneration";
    Skill[Skill["Diversity"] = 7] = "Diversity";
})(Skill || (Skill = {}));
var LocalState = (function () {
    function LocalState() {
        var _this = this;
        this.getHealth = function () { return _this.health; };
        this.getLevel = function () { return _this.level; };
        this.getExp = function () { return _this.xp; };
        this.getMultiplier = function () { return _this.multiplier; };
        this.getMulTimer = function () { return _this.mulTimer; };
        this.getXpRequired = function () { return _this.xpReq; };
        this.getXpPercentage = function () { return (_this.xp / _this.xpReq); };
        this.getPower = function () { return _this.power; };
        this.getMaxHealth = function () { return _this.maxHealth; };
        this.getBulletPower = function () {
            return _this.bulletPower * (_this.bonusTimers[0] > 0 ? 2 : 1);
        };
        this.getReloadSpeed = function () {
            return (_this.reloadSpeed * (_this.bonusTimers[2] > 0 ? 1.5 : 1)) | 0;
        };
        this.getBulletSpeed = function () { return _this.bulletSpeed; };
        this.getSwordSpeed = function () { return _this.swordSpeed; };
        this.getSwordPower = function () {
            return _this.swordPower * (_this.bonusTimers[0] > 0 ? 2 : 1);
        };
        this.getMoveSpeed = function () {
            return _this.moveSpeed * (_this.bonusTimers[2] > 0 ? 1.5 : 1);
        };
        this.getRegenSpeed = function () { return _this.regenSpeed; };
        this.getFlickerTime = function () { return _this.flickerTime; };
        this.getBulletWait = function () { return _this.bulletWait; };
        this.getDeflectPower = function () { return _this.deflectPower; };
        this.getBulletBonus = function () {
            return (_this.bonusTimers[3] > 0 ? 1 : 0);
        };
        this.getDamageReduction = function () {
            return (_this.bonusTimers[1] > 0 ? 2 : 1);
        };
        this.getBonusTime = function (index) { return _this.bonusTimers[index]; };
        this.getSkillLevel = function (index) {
            return _this.skillLevels[clamp(index, 0, _this.skillLevels.length)];
        };
        this.getSkillPoints = function () { return _this.skillPoints; };
        this.isFull = function () { return _this.full; };
        var INITIAL_HEALTH = 100;
        this.maxHealth = INITIAL_HEALTH;
        this.health = this.maxHealth;
        this.xp = 0;
        this.xpReq = 0;
        this.level = 1;
        this.multiplier = 0;
        this.mulTimer = 0;
        this.power = 0;
        this.skillPoints = this.level - 1;
        this.bonusTimers = new Array(4);
        for (var i = 0; i < this.bonusTimers.length; ++i) {
            this.bonusTimers[i] = 0.0;
        }
        this.skillLevels = new Array(8);
        for (var i = 0; i < this.skillLevels.length; ++i) {
            this.skillLevels[i] = 0;
        }
        this.recomputeStats();
    }
    LocalState.prototype.computeExpRequired = function (level) {
        return 800 * Math.sqrt(level * level * level);
    };
    LocalState.prototype.recomputeStats = function () {
        var x = this.level - 1;
        this.bulletPower = 5 + x + this.skillLevels[Skill.Accuracy] * 2;
        this.bulletSpeed = 3 + x / 10.0 + this.skillLevels[Skill.Agility] / 10.0;
        this.reloadSpeed = x + this.skillLevels[Skill.Agility] * 2;
        this.swordPower = 8 +
            2 * x + this.skillLevels[Skill.Strength] * 4;
        this.moveSpeed = 1 + x / 40.0 + this.skillLevels[Skill.Dexterity] / 20.0;
        this.maxHealth = 100 + 10 * x + this.skillLevels[Skill.Vitality] * 20;
        this.flickerTime = 1.0 + this.skillLevels[Skill.Dexterity] / 5.0;
        this.deflectPower = 0.5 + 0.1 * this.skillLevels[Skill.Strength];
        var l = this.skillLevels[Skill.Diversity];
        this.bulletWait = l == 0 ? -1 : (6 - this.skillLevels[Skill.Diversity]);
        l = this.skillLevels[Skill.Regeneration];
        this.regenSpeed = l == 0 ? 0 : (30 - l * 5);
        this.xpReq = this.computeExpRequired(this.level);
    };
    LocalState.prototype.increaseBonusTimer = function (time, index) {
        this.bonusTimers[index] += time;
    };
    LocalState.prototype.update = function (ev) {
        var MUL_REDUCE_SPEED = 0.005;
        if (this.mulTimer > 0.0) {
            this.mulTimer -= MUL_REDUCE_SPEED * ev.step;
            if (this.mulTimer <= 0.0) {
                this.mulTimer = 0.0;
                this.multiplier = 0;
            }
        }
        for (var i = 0; i < this.bonusTimers.length; ++i) {
            if (this.bonusTimers[i] > 0) {
                this.bonusTimers[i] =
                    Math.max(0, this.bonusTimers[i] - ev.step);
            }
        }
    };
    LocalState.prototype.updateHealth = function (amount) {
        this.health = clamp(amount, 0, this.maxHealth);
    };
    LocalState.prototype.addExperience = function (amount, increaseStar) {
        if (increaseStar === void 0) { increaseStar = true; }
        var STAR_AMOUNT = [3200, 9600, 19200];
        var inc = amount * (10 + this.multiplier);
        this.xp += inc * (1 + this.skillLevels[Skill.Growth] * 0.40);
        if (this.xp >= this.xpReq) {
            this.xp -= this.xpReq;
            ++this.level;
            ++this.skillPoints;
            this.recomputeStats();
        }
        if (increaseStar) {
            this.power += inc / STAR_AMOUNT[Math.floor(this.power)];
            if (this.power >= 3.0) {
                this.power = 3.0;
                this.full = true;
            }
        }
    };
    LocalState.prototype.increaseMultiplier = function () {
        ++this.multiplier;
        this.mulTimer = 1.0;
    };
    LocalState.prototype.increaseSkillLevel = function (index) {
        if (index < 0 || index >= this.skillLevels.length ||
            this.skillLevels[index] >= 5)
            return;
        ++this.skillLevels[index];
        --this.skillPoints;
        this.recomputeStats();
    };
    LocalState.prototype.resetMultiplier = function () {
        this.multiplier = 0;
        this.mulTimer = 0;
    };
    LocalState.prototype.reset = function () {
        this.resetMultiplier();
        for (var i = 0; i < this.bonusTimers.length; ++i) {
            this.bonusTimers[i] = 0.0;
        }
        this.power = 0;
        this.full = false;
    };
    LocalState.prototype.setPower = function (x) {
        this.power = clamp(x, 0, 3.0);
    };
    LocalState.prototype.reduceSkillPoint = function () {
        if (this.skillPoints > 0)
            --this.skillPoints;
    };
    return LocalState;
}());
var AudioIntroScene = (function () {
    function AudioIntroScene() {
    }
    AudioIntroScene.prototype.activate = function (param, ev) {
        ev.audio.toggle(false);
        this.confirm = new ConfirmBox("Enable audio?", function (ev) {
            ev.audio.toggle(true);
            ev.changeScene(new CreatedByScene());
            return true;
        });
        this.confirm.activate(0);
    };
    AudioIntroScene.prototype.update = function (ev) {
        this.confirm.update(ev);
    };
    AudioIntroScene.prototype.draw = function (c) {
        c.clear(0);
        this.confirm.draw(c);
    };
    AudioIntroScene.prototype.deactivate = function () {
    };
    return AudioIntroScene;
}());
var CreatedByScene = (function () {
    function CreatedByScene() {
        this.WAIT_TIME = 90;
    }
    CreatedByScene.prototype.activate = function (param, ev) {
        ev.tr.activate(false, 2.0, TransitionType.Fade, 4);
        this.waitTime = this.WAIT_TIME;
        this.phase = 0;
    };
    CreatedByScene.prototype.update = function (ev) {
        var _this = this;
        if (ev.tr.isActive())
            return;
        if (ev.gamepad.getButtonState("start") == State.Pressed ||
            ev.gamepad.getButtonState("fire1") == State.Pressed) {
            this.waitTime = 0.0;
        }
        if ((this.waitTime -= ev.step) <= 0.0) {
            this.waitTime += this.WAIT_TIME;
            ev.tr.activate(true, 2.0, TransitionType.Fade, 4, function (ev) {
                if (++_this.phase == 2) {
                    ev.tr.changeTransitionType(TransitionType.CircleOutside);
                    ev.changeScene(new TitleScreenScene());
                }
            });
        }
    };
    CreatedByScene.prototype.draw = function (c) {
        c.clear(0);
        var bmp = c.getBitmap("creator");
        c.drawBitmapRegion(bmp, 0, this.phase * (bmp.height / 2), bmp.width, bmp.height / 2, c.width / 2 - bmp.width / 2, c.height / 2 - bmp.height / 4);
    };
    CreatedByScene.prototype.deactivate = function () {
    };
    return CreatedByScene;
}());
var TitleScreenScene = (function () {
    function TitleScreenScene() {
        this.CLOUD_WIDTH = 256;
    }
    TitleScreenScene.prototype.activate = function (param, ev) {
        this.wave = 0.0;
        this.cloudPos = 0.0;
        this.flickerTimer = 0.0;
        ev.audio.fadeInMusic(ev.assets.getSound("title"), 0.50, 1000);
    };
    TitleScreenScene.prototype.update = function (ev) {
        var WAVE_SPEED = 0.05;
        var CLOUD_SPEED = 1;
        var FLICKER_TIME = 60;
        var FLICKER_BONUS = 30;
        if (this.flickerTimer <= 0.0)
            this.wave = (this.wave += WAVE_SPEED * ev.step) % (Math.PI * 2);
        this.cloudPos += CLOUD_SPEED * ev.step;
        this.cloudPos %= this.CLOUD_WIDTH * 2;
        if (ev.tr.isActive())
            return;
        if (this.flickerTimer > 0) {
            this.flickerTimer -= ev.step;
            if (this.flickerTimer <= FLICKER_BONUS &&
                !ev.tr.isActive()) {
                ev.tr.activate(true, 2.0, TransitionType.CircleOutside, 4, function (ev) {
                    ev.tr.changeTransitionType();
                    ev.changeScene(new GameScene());
                });
                return;
            }
        }
        else if (ev.gamepad.getButtonState("start") == State.Pressed ||
            ev.gamepad.getButtonState("fire1") == State.Pressed) {
            ev.audio.stopMusic();
            ev.audio.playSample(ev.assets.getSound("start"), 0.40);
            this.flickerTimer = FLICKER_TIME + FLICKER_BONUS;
        }
    };
    TitleScreenScene.prototype.draw = function (c) {
        var LOGO_AMPL = 4;
        var LOGO_Y = 24;
        var PRESS_ENTER_Y_OFF = 48;
        var PERIOD = Math.PI * 2 / 11;
        var FONT_OFF = 12;
        var FONT_AMPL = 6;
        var CLOUD_BOTTOM_OFF = 64;
        var CLOUD_OFF = 16;
        c.clear(189, 109, 255);
        var bmp = c.getBitmap("logo");
        c.drawBitmapRegion(c.getBitmap("sky"), 0, 288, 256, 144, 0, 0);
        var bmpClouds = c.getBitmap("cloudsTitle");
        for (var i = 1; i >= 0; --i) {
            for (var j = 0; j < 2; ++j) {
                c.drawBitmapRegion(bmpClouds, 0, 72 * i, 256, 72, -((this.cloudPos / (i + 1)) % 256) + 256 * j, c.height - CLOUD_BOTTOM_OFF - CLOUD_OFF * i);
            }
        }
        var y = (Math.sin(this.wave) * LOGO_AMPL) | 0;
        c.drawBitmapRegion(bmp, 0, 0, 256, 96, 0, LOGO_Y + y);
        var fontBig = c.getBitmap("fontBig");
        var x = c.width / 2 - 11 * FONT_OFF / 2;
        var str = "PRESS ENTER";
        if (this.flickerTimer <= 0.0 ||
            Math.floor(this.flickerTimer / 4) % 2 == 0) {
            for (var i = 0; i < str.length; ++i) {
                c.drawText(fontBig, String.fromCharCode(str.charCodeAt(i)), x + i * FONT_OFF, c.height - PRESS_ENTER_Y_OFF +
                    ((Math.sin(this.wave + PERIOD * i) * FONT_AMPL) | 0), -4, 0, true);
            }
        }
        c.drawText(c.getBitmap("fontYellow"), "©2020 Jani Nykänen", c.width / 2, c.height - 10, 0, 0, true);
        c.drawText(c.getBitmap("font"), "Demo v.0.90", 1, 1, -1, 0, false);
    };
    TitleScreenScene.prototype.deactivate = function () {
    };
    return TitleScreenScene;
}());
var ConfirmBox = (function () {
    function ConfirmBox(title, cb) {
        var _this = this;
        this.isActive = function () { return _this.active; };
        this.active = false;
        this.title = title;
        this.yesNoMenu = new Menu([
            new MenuButton("YES", function (ev) {
                cb(ev);
                _this.active = false;
                return true;
            }),
            new MenuButton("NO", function (ev) {
                _this.active = false;
                return false;
            })
        ]);
    }
    ConfirmBox.prototype.update = function (ev) {
        if (!this.active)
            return;
        this.yesNoMenu.update(ev);
    };
    ConfirmBox.prototype.draw = function (c, color) {
        if (color === void 0) { color = [[255, 255, 255], [0, 0, 0], [72, 145, 255]]; }
        if (!this.active)
            return;
        var w = this.title.length * 8 + 8;
        var h = 3 * 12 + 8;
        var x = c.width / 2 - w / 2;
        var y = c.height / 2 - h / 2;
        drawBoxWithBorders(c, x, y, w, h, color);
        c.drawText(c.getBitmap("font"), this.title, x + 4, y + 4, 0, 0);
        this.yesNoMenu.draw(c, x + 4, y + 20);
    };
    ConfirmBox.prototype.activate = function (def) {
        if (def === void 0) { def = 0; }
        if (this.active)
            return;
        this.active = true;
        this.yesNoMenu.setCursorPos(negMod(def, 2));
    };
    return ConfirmBox;
}());
var MenuButton = (function () {
    function MenuButton(text, cb) {
        this.text = text;
        this.cb = cb;
    }
    return MenuButton;
}());
var Menu = (function () {
    function Menu(buttons) {
        var _this = this;
        this.MOVE_TIME = 10;
        this.getCursorPos = function () { return _this.cursorPos; };
        this.buttons = new Array(buttons.length);
        for (var i = 0; i < buttons.length; ++i) {
            this.buttons[i] = new MenuButton(buttons[i].text, buttons[i].cb);
        }
        this.cursorPos = 0;
        this.cursorTimer = 0;
        this.targetPos = 0;
        this.moving = false;
        this.cursorWave = 0.0;
    }
    Menu.prototype.update = function (ev) {
        var EPS = 0.1;
        var WAVE_SPEED = Math.PI * 2 / 60.0;
        if (this.moving) {
            if ((this.cursorTimer -= ev.step) <= 0) {
                this.cursorTimer = 0;
                this.moving = false;
                this.cursorPos = this.targetPos;
            }
            return;
        }
        var s = ev.gamepad.getStick().y;
        var res;
        if (Math.abs(s) > EPS) {
            this.targetPos =
                negMod(this.cursorPos + (s > 0.0 ? 1 : -1), this.buttons.length);
            this.moving = true;
            this.cursorTimer = this.MOVE_TIME;
            ev.audio.playSample(ev.assets.getSound("next"), 0.60);
        }
        else {
            if (this.buttons[this.cursorPos].cb != undefined && (ev.gamepad.getButtonState("start") == State.Pressed ||
                ev.gamepad.getButtonState("fire1") == State.Pressed)) {
                res = this.buttons[this.cursorPos].cb(ev);
                if (res) {
                    ev.audio.playSample(ev.assets.getSound("accept"), 0.60);
                }
                else {
                    ev.audio.playSample(ev.assets.getSound("deny"), 0.60);
                }
            }
        }
        this.cursorWave = (this.cursorWave + WAVE_SPEED * ev.step) % (Math.PI * 2);
    };
    Menu.prototype.draw = function (c, x, y, xoff, yoff) {
        if (xoff === void 0) { xoff = 0; }
        if (yoff === void 0) { yoff = 12; }
        var CURSOR_OFF = 10;
        var CURSOR_AMPLITUDE = 2.0;
        var b;
        for (var i = 0; i < this.buttons.length; ++i) {
            b = this.buttons[i];
            c.drawText(c.getBitmap(this.cursorPos == i ? "fontYellow" : "font"), b.text, x + CURSOR_OFF, y + i * yoff, xoff, 0, false);
        }
        var ypos = y + this.cursorPos * yoff;
        var t;
        if (this.moving) {
            t = this.cursorTimer / this.MOVE_TIME;
            ypos = ypos * t + (y + this.targetPos * yoff) * (1 - t);
        }
        c.drawBitmapRegion(c.getBitmap("fontYellow"), 0, 32, 8, 8, x + Math.round(Math.sin(this.cursorWave) * CURSOR_AMPLITUDE), ypos);
    };
    Menu.prototype.setCursorPos = function (p) {
        this.cursorPos = negMod(p, this.buttons.length);
        this.targetPos = this.cursorPos;
        this.cursorTimer = 0.0;
        this.moving = false;
    };
    return Menu;
}());
//# sourceMappingURL=out.js.map