"use strict";

/***
 * 向玩家展示icon
 * 并提供显示/关闭的api
 * 
 * */

window.nianshouAct = {
    opsUrl: 'https://ops-api.beeplaying.com',
    reqActStatus: '/ops/api/monster/activity-icon/',
    // gameType
    oriPath: 'https://wap.beeplaying.com/publicComponent/nianshou/',
    webUrl: 'https://wap.beeplaying.com/nianshou/',
    resList: ['icon.png', 'tipbg.png', 'tiparrow.png', 'light.png', 'banboo.png', 'NianShouIcon.prefab', 'boomNode.prefab'],
    firstLoad: 1,
    loadedCnt: 0,
    // 资源加载数量
    loadedResFinish: 0,
    // 资源加载完成
    _loadError: 0,
    res: {},
    //用于存储资源
    TIPDIR: {
        LEFT: -1,
        MIDDLE: 0,
        RIGHT: 1
    },
    preTotal: 0,
    loading: 0,
    // 资源加载中
    loaded: 0,
    // 资源已加载完成
    lockingReq: 0,
    //锁定
    iconNode: null,
    // icon节点
    tipNode: null,
    // tip节点
    iconInfo: {},
    // conInfo信息
    _initNetData: function _initNetData() {
        if (!this.accessToken) {
            this.accessToken = cc.sys.localStorage.getItem('ACCESS_TOKEN');
        }

        if (!this.channelID) {
            this.channelID = cc.sys.localStorage.getItem('APP_CHANNEL');
        }

        if (!this.accessToken) {
            this.accessToken = '';
        }

        if (!this.channelID) {
            this.channelID = '100039';
        }
    },
    _initActData: function _initActData(data) {
        var curNum = data.totalNum || 0;
        var preFCN = this.iconInfo.totalNum || 0;
        this.iconInfo.nextStageDiff = typeof data.nextStageDiff == 'number' ? data.nextStageDiff : 0;
        this.iconInfo.show = data.show || false;
        this.iconInfo.unreceivedNum = data.unreceivedNum || 0;
        this.iconInfo.totalNum = curNum;
        this.preTotal = preFCN;
    },
    _saveLocalData: function _saveLocalData(keyStr, value) {
        var info = JSON.parse(cc.sys.localStorage.getItem('user_Info'));
        var userId = 0;

        if (info) {
            userId = Number(info.userId);
        }

        cc.sys.localStorage.setItem(keyStr + userId, value);
    },
    // outside call
    refreshStatus: function refreshStatus() {
        var that = this;

        this._updateStatus(function (data) {
            that._initActData(data);

            that.lockingReq = 0;

            that._updateUI();

            if (that.preTotal < that.iconInfo.totalNum) {
                that._runBoomBanAni(true);
            }
        }, function () {
            cc.error('请求年兽 icon 状态失败');
            that.lockingReq = 0;
        });
    },
    _updateUI: function _updateUI() {
        if (this.iconInfo.show) {
            if (this.iconNode && cc.isValid(this.iconNode)) {
                if (!this.iconNode.active) this.iconNode.active = true;

                if (this.iconInfo.unreceivedNum > 0) {
                    this._updateTip('有新的奖励可领取!');

                    this._tipScaleAction(true);

                    this._runIconNodeShakeAni();
                } else if (this.iconInfo.totalNum == 1 && this.preTotal == 0) {
                    this._updateTip('获得爆竹,快来驱赶年兽,击落宝物!');

                    this._tipScaleAction(true);
                } else if (this.iconInfo.nextStageDiff > 0) {
                    var numStr = this.iconInfo.nextStageDiff > 10001 ? (this.iconInfo.nextStageDiff / 10000).toFixed(1) + 'W' : this.iconInfo.nextStageDiff;

                    this._updateTip('距离下个鸿运奖励,仅差' + numStr + '支持');

                    this._tipScaleAction(true);
                } else if (this.iconInfo.totalNum > 1 && this.preTotal < this.iconInfo.totalNum) {
                    this._updateTip('恭喜获得新爆竹.');

                    this._tipScaleAction(true);
                } else if (this.firstLoad) {
                    this.firstLoad = 0;

                    this._updateTip('打年兽,得大奖!');

                    this._tipScaleAction(true);
                } else {
                    this._tipScaleAction(false);

                    this.resetIconChildNode();
                }
            } else {
                this.show(this.iconInfo);
            }
        } else {
            if (this.iconNode && cc.isValid(this.iconNode)) {
                this.iconNode.active = false;

                this._closeWebView();
            }
        }
    },
    resetIconChildNode: function resetIconChildNode() {
        if (this.iconChildNode && cc.isValid(this.iconChildNode)) {
            this.iconChildNode.stopAllActions();
            this.iconChildNode.rotation = 0;
        }
    },

    getGameType: function getGameType() {
        if (window.location) {
            var urlStr = location.href;
            var locationOrigin = location.origin + '/';
            var filterOrigin = urlStr.replace(locationOrigin, '');
            var gameName = filterOrigin.split('/')[0].toLowerCase();
            var gameType = 2; // 游行类型
            switch (gameName) {
                case 'billiards':
                    // 桌球
                    gameType = 2;
                    break;
                case 'crush':
                    // 糖果
                    gameType = 12;
                    break;
                case 'gofish':
                    // 钓鱼
                    gameType = 20;
                    break;
                case 'kingdom2':
                    // 三国
                    gameType = 13;
                    break;
                case 'landlord':
                    // 斗地主
                    gameType = 15;
                    break;
                case 'legion':
                    // 军团
                    gameType = 4;
                    break;
                case 'square':
                    // 赏金猎人
                    gameType = 18;
                    break;
                case 'marbles':
                    // 弹珠
                    gameType = 21;
                    break;
                case 'fish':
                    // 欢乐捕鱼 
                    gameType = 10;
                    break;
                case 'bird':
                    // 疯狂的小鸟
                    gameType = 26;
                    break;
                case 'crush3':
                    // 福满多
                    gameType = 27;
                    break;
                default:
                    gameType = 2; // 给开发使用默认值
                    break;
            }
            return gameType;
        } else {
            return 2;
        }
    },


    _updateStatus: function _updateStatus(okCbk, ngCbk) {
        if (this.lockingReq) {
            cc.error('年兽请求被锁');
            return;
        }

        this.lockingReq = 1;

        this._initNetData();

        if (this.iconInfo && typeof this.iconInfo.gameType == 'number') {
            this.request(this.opsUrl + this.reqActStatus + this.iconInfo.gameType, okCbk, ngCbk);
        } else {
            var gameType = this.getGameType();
            this.request(this.opsUrl + this.reqActStatus + gameType, okCbk, ngCbk);
        }
    },

    /**
     * @param {
     * parentNode, pos, height, dir, gameType
     * } args
     */
    show: function show(args) {
        if (this.loading || this.loaded) {
            cc.error('年兽 正在加载资源或者已加载完成');
            return;
        }

        if (!cc.isValid(args.parentNode) || typeof args.gameType != 'number') {
            cc.error('年兽的icon 父节点无效 或者 游戏id没有传入');
            return;
        }

        var that = this;
        this.iconInfo = {
            parentNode: args.parentNode,
            pos: args.pos || null,
            height: args.height || null,
            dir: args.dir || 0,
            // 默认居中
            gameType: args.gameType,
            firecrackerNum: 0,
            remark: '',
            show: false,
            status: 0
        };

        this._updateStatus(function (data) {
            that._initActData(data);

            that.preTotal = that.iconInfo.totalNum;

            if (that.iconInfo.show) {
                that.loading = 1;

                that._loadResByList();
            } else {
                that.loading = 0;
            }

            that.lockingReq = 0;
        }, function () {
            cc.error('请求年兽 icon 状态失败');
            that.loading = 0;
            that.lockingReq = 0;
        });
    },
    _loadResByList: function _loadResByList() {
        var len = this.resList.length;
        var that = this;
        var name = '';
        var fileName = '';

        for (var i = 0; i < len; i++) {
            name = this.resList[i];

            if (this._loadError) {
                cc.error('年兽 资源已下载失败');
                return;
            }

            if (!that.res[name]) {
                cc.loader.load(this.oriPath + name, function (err, res) {
                    if (err) {
                        that._loadResError();

                        cc.error('\u5E74\u517D '.concat(name, ' \u8D44\u6E90\u4E0B\u8F7D\u5931\u8D25'));
                        return;
                    }

                    if (res.url) {
                        fileName = res.url.split('/');
                        fileName = fileName[fileName.length - 1];
                        that.res[fileName] = res;
                    } else {
                        that.res[res.data.name] = res;
                    }

                    that.loadedCnt++;

                    if (that.loadedCnt == len) {
                        that._loadResFinish();
                    }
                });
            } else {
                if (that.loadedCnt == len) {
                    that._loadResFinish();

                    break;
                }
            }
        }
    },
    _loadResError: function _loadResError() {
        this._loadError = 1;
        this.loading = 0;
        this.loaded = 0;
        cc.error('res load error');
    },
    _loadResFinish: function _loadResFinish() {
        this._createBtnNode();

        this._initWebView();

        this._updateUI();

        this._createBoomBanNode();

        this.loading = 0;
        this.loaded = 1;
        this.loadedResFinish = 1;
    },
    _createBtnNode: function _createBtnNode() {
        if (this.iconNode) {
            cc.error('已经创建年兽icon');
            return;
        }

        this.iconNode = cc.instantiate(this.res['NianShouIcon']);

        if (!this.iconNode) {
            cc.error('年兽 icon node 已经存在');
            return;
        }

        this._initUI();

        this.iconInfo.parentNode.addChild(this.iconNode);

        if (this.iconInfo.pos) {
            this.iconNode.position = this.iconInfo.pos;
        }

        if (typeof this.iconInfo.height == 'number' && this.iconInfo.height != this.iconNode.height) {
            if (this.iconInfo.height > 0) {
                this.iconNode.scale = Math.max(this.iconInfo.height / this.iconNode.height, 0.1);
            }
        }

        this.tipNode = this.iconNode.getChildByName('TipLayout');
        this.iconChildNode = this.iconNode.getChildByName('icon');
        var that = this;
        var iconNodeJS = this.iconNode.addComponent(cc.Class({
            extends: cc.Component,
            properties: {},
            start: function start() {}
        }));

        iconNodeJS.onDestroy = function () {
            that.loaded = 0;
            that._loadError = 0;
            that.loading = 0;
            that.iconNode = null;
            that.boomBanNode = null;
            that.webViewNode = null;

            that._destroyNianshou();
        };
    },
    _createBoomBanNode: function _createBoomBanNode() {
        if (this.boomBanNode) {
            cc.error('年兽 已经创建 boomBanNode');
            return;
        }

        var boomBanNode = cc.instantiate(this.res['boomNode']);

        if (!boomBanNode) {
            cc.error('年兽 boomBanNode 创建失败');
            return;
        }

        var CanvasNode = cc.find('Canvas');

        if (CanvasNode) {
            boomBanNode.active = false;
            cc.find('Canvas').addChild(boomBanNode, 1000, 'boomban');
            boomBanNode.getChildByName('light').getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.res['light.png']);
            boomBanNode.getChildByName('banboo').getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.res['banboo.png']);
            this.boomBanNode = boomBanNode;
        }
    },
    _runBoomBanAni: function _runBoomBanAni(flag) {
        var CanvasNode = cc.find('Canvas');

        if (!this.boomBanNode || !this.iconNode || !CanvasNode) {
            cc.error('年兽 节点尚未创建 不能播放爆竹动画');
            return;
        }

        var lightNode = this.boomBanNode.getChildByName('light');
        var runTime = 0.6;

        if (flag) {
            lightNode.runAction(cc.repeatForever(cc.rotateBy(0.2, 18)));
            this.boomBanNode.x = 0;
            this.boomBanNode.y = 0;
            this.boomBanNode.active = true;
            this.boomBanNode.scale = 1.5;
            var that = this;
            var wPos = this.iconNode.convertToWorldSpaceAR(cc.v2(0, 0));
            var dPos = CanvasNode.convertToNodeSpaceAR(wPos);
            var mPos = cc.v2(dPos.x * 0.5, dPos.y * 0.5);
            var bezier = [cc.v2(0, 0), mPos, dPos];
            var act1 = cc.spawn(cc.bezierTo(runTime, bezier), cc.scaleTo(runTime, 0.1));
            var callF = cc.callFunc(function () {
                that.boomBanNode.active = false;
            });
            this.boomBanNode.runAction(cc.sequence(cc.delayTime(0.3), act1, callF));
        } else {
            this.boomBanNode.active = false;
        }
    },

    /**
     * 以remark 为准，如果为空，判断当前是进入游戏，还是 待领取的数量发生变化
     * @param {
     * } str 
     */
    _updateTip: function _updateTip(str) {
        var lblNode = this.tipNode.getChildByName('tipbg').getChildByName('lbl');
        lblNode.getComponent(cc.Label).string = str;
    },
    _tipScaleAction: function _tipScaleAction(flag) {
        this.tipNode.stopAllActions();

        if (flag) {
            var that = this;
            this.tipNode.scaleX = 0.1;
            this.tipNode.active = true;
            this.tipNode.runAction(cc.sequence(cc.delayTime(0.2), cc.callFunc(function () {
                var lblNode = that.tipNode.getChildByName('tipbg').getChildByName('lbl');
                lblNode.parent.width = lblNode.width + 64;

                if (that.iconInfo.dir != 0) {
                    lblNode.parent.x = -that.iconInfo.dir * 0.5 * (lblNode.width - 71);
                }
            }), cc.scaleTo(0.1, 1.2, 1), cc.scaleTo(0.1, 1, 1), cc.delayTime(5), cc.callFunc(function () {
                that._tipScaleAction(false);
            })));
        } else {
            this.tipNode.active = false;
            this.tipNode.scaleX = 0.1;
        }
    },
    _initUI: function _initUI() {
        var tipLayout = this.iconNode.getChildByName('TipLayout');
        var tipBgSF = new cc.SpriteFrame(this.res['tipbg.png']);
        tipBgSF.insetTop = 10;
        tipBgSF.insetBottom = 21;
        tipBgSF.insetLeft = 32;
        tipBgSF.insetRight = 32;
        this.iconNode.getChildByName('icon').getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.res['icon.png']);
        tipLayout.getChildByName('tipbg').getComponent(cc.Sprite).spriteFrame = tipBgSF;
        tipLayout.getChildByName('tiparrow').getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.res['tiparrow.png']);
    },
    _loadWebViewFinish: function _loadWebViewFinish() {
        this.iconNode.once('click', this._openWebView, this);
    },
    _loadWebViewError: function _loadWebViewError() {
        this.iconNode.off('click', this._openWebView, this);
        cc.error('load nianshou  game error');
    },
    _initWebView: function _initWebView() {
        if (cc.isValid(this.webViewNode)) {
            cc.error('年兽 webViewNode 已创建');
            return;
        }

        if (typeof _ccsg != 'undefined') {
            _ccsg.WebView._polyfill.enableDiv = true;
        } else {
            cc.WebView.Impl._polyfill.enableDiv = true;
        }

        var node = new cc.Node('webViewNode');
        var winH = cc.director.getWinSize().height;
        var winW = cc.director.getWinSize().width;
        cc.director.getScene().getChildByName('Canvas').addChild(node);
        node.width = winW;
        node.height = winH;
        node.x = 10000;
        node.y = 0;
        node.addComponent(cc.BlockInputEvents);
        var webview = node.addComponent(cc.WebView);
        webview.url = this.webUrl + '?token=' + this.accessToken + '&channel=' + this.channelID + '&time=' + String(new Date().getTime());
        node.on('loaded', this._loadWebViewFinish, this);
        node.on('error', this._loadWebViewError, this);
        var div;
        var iframe;

        if (webview._sgNode) {
            div = webview._sgNode._renderCmd._div;
            iframe = webview._sgNode._renderCmd._iframe;
        } else {
            div = webview._impl._div;
            iframe = webview._impl._iframe;
        }

        div.style['overflow'] = "hidden";
        iframe && (iframe.allowTransparency = 'true');
        var style = div.style;
        style['background'] = "rgba(0,0,0,0.7)";
        style['position'] = "fixed";
        style['zIndex'] = "10";
        this.webViewNode = node;
    },
    _openWebView: function _openWebView() {
        if (cc.isValid(this.webViewNode)) {
            this.webViewNode.getComponent(cc.WebView).evaluateJS('notifyRefreshUI()');

            this._tipScaleAction(false);

            this.resetIconChildNode();
            var that = this;
            this.webViewNode.stopAllActions();
            this.webViewNode.runAction(cc.sequence(cc.moveTo(0.2, cc.v2(0, 0)), cc.callFunc(function () {
                that.webViewNode.x = 0;
                that.webViewNode.y = 0;
            })));
        } else {
            this._initWebView();
        }
    },
    _closeWebView: function _closeWebView() {
        var that = this;

        if (cc.isValid(this.webViewNode)) {
            this.webViewNode.stopAllActions();

            if (this.webViewNode.x != 10000) {
                this.webViewNode.runAction(cc.sequence(cc.moveTo(0.2, cc.v2(10000, 0)), cc.callFunc(function () {
                    that.iconNode.once('click', that._openWebView, that);
                    that.webViewNode.x = 10000;
                    that.webViewNode.y = 0;
                })));
            }

            this.refreshStatus();
        }
    },
    _destroyNianshou: function _destroyNianshou() {
        if (cc.isValid(this.webViewNode)) {
            this.webViewNode.destroy();
        }

        if (cc.isValid(this.iconNode)) {
            this.iconNode.destroy();
        }

        if (cc.isValid(this.boomBanNode)) {
            this.boomBanNode.destroy();
        }

        this.iconNode = null;
        this.webViewNode = null;
        this.boomBanNode = null;
    },
    _runIconNodeShakeAni: function _runIconNodeShakeAni() {
        this.resetIconChildNode();
        var shake = cc.sequence(cc.rotateTo(0.05, -6), cc.delayTime(0.12), cc.rotateTo(0.1, 6), cc.delayTime(0.15), cc.rotateTo(0.05, -6), cc.delayTime(0.12), cc.rotateTo(0.1, 0), cc.delayTime(1));
        var action = cc.repeatForever(shake);
        this.iconChildNode.runAction(action);
    },
    request: function request(url, cbk, errCbk) {
        var _this = this;

        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", this.accessToken);
        xhr.setRequestHeader("App-Version", '1.0.0.1');
        xhr.setRequestHeader("Repeated-Submission", String(new Date().getTime()));
        xhr.setRequestHeader("App-Channel", this.channelID);
        xhr.timeout = 15 * 1000; // 15秒超时

        xhr.ontimeout = function () {
            cc.error && cc.error("连接超时");
        };

        xhr.onerror = function () {
            cc.error && cc.error("未连接到网络，请检查您的网络设置");
        };

        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return _this;

            if (xhr.status >= 200 && xhr.status <= 207) {
                if (xhr.responseText) {
                    var result = JSON.parse(xhr.responseText);

                    if (result.code === 200) {
                        cbk && cbk(result.data);
                    } else {
                        errCbk && errCbk();
                    }
                } else {
                    errCbk && errCbk();
                }
            } else {
                errCbk && errCbk();
            }
        };

        if (!this.params) xhr.send();else xhr.send(JSON.stringify(this.params));
        return this;
    }
};

window.closeNianshou = function () {
    nianshouAct._closeWebView();
};

window.getPlantInfo = function () {
    return {
        accessToken: nianshouAct.accessToken,
        channelID: nianshouAct.channelID
    };
};

window.goToGame = function (gameUrl) {
    // clearUI
    nianshouAct._destroyNianshou();

    if (gameUrl.indexOf('http') != 0) {
        window.location.href = '//' + document.domain + gameUrl + '?token=' + nianshouAct.accessToken + '&channel=' + nianshouAct.channelID;
    } else {
        window.location.href = gameUrl + '?token=' + nianshouAct.accessToken + '&channel=' + nianshouAct.channelID;
    }
};
/***
 * jyzChange
 * jdqChange
 * hfqChange
 */

window.refreshUserData2Nianshou = function (args) {};
