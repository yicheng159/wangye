/* =============================================================
 * 学生会 CMS · admin-common.js
 * 公共基础：工具函数 / 存储鉴权 / Toast / 图片弹窗 / Shell 壳渲染 / 启动流程
 * 暴露到全局：window.ADMIN
 *   - ADMIN.currentCMS        当前内存数据副本
 *   - ADMIN.loadCMS() / ADMIN.saveCMS() / ADMIN.resetCMS()
 *   - ADMIN.toast() / ADMIN.$() / ADMIN.escHtml() / ADMIN.escAttr()
 *   - ADMIN.openImgPicker() / ADMIN.makeImgBtn()
 *   - ADMIN.bindFormToObj() / ADMIN.renderReorderList()
 *   - ADMIN.TABS             模块元数据（title/sub/icon/href）
 *   - ADMIN.boot(pageKey)    启动当前页面（用于各模块独立页）
 * ============================================================= */
(function () {
    'use strict';

    /* ---------- 常量 ---------- */
    var CMS_KEY   = 'gxc_admin_cms_v1';
    var USER_KEY  = 'gxc_admin_user_v1';
    var TOKEN_KEY = 'gxc_admin_token_v1';
    var LOG_KEY   = 'gxc_admin_logs_v1';
    var HASH_SALT = 'susu_cms_salt::';
    var DEFAULT_PASS = 'admin123';

    /* ---------- 模块元信息 ---------- */
    var TABS = {
        dashboard: {
            title: '仪表盘',
            sub: '查看站点内容概览与快速操作',
            href: 'dashboard.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>'
        },
        slides: {
            title: '轮播图管理',
            sub: '编辑首页 Hero 横幅轮播的标题、描述与背景图',
            href: 'slides.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="22" height="18" rx="3"/><line x1="1" y1="9" x2="23" y2="9"/></svg>'
        },
        stats: {
            title: '数据统计',
            sub: '配置「学生会概况」数字统计条',
            href: 'stats.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
        },
        about: {
            title: '关于我们',
            sub: '组织介绍、使命愿景与核心价值观',
            href: 'about.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
        },
        structure: {
            title: '组织架构',
            sub: '管理部门列表及负责人信息',
            href: 'structure.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="10" y1="17" x2="6" y2="19"/><line x1="14" y1="17" x2="18" y2="19"/></svg>'
        },
        news: {
            title: '新闻活动',
            sub: '发布最新通知、新闻和特色活动',
            href: 'news.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="13" y2="14"/></svg>'
        },
        showcase: {
            title: '风采展示',
            sub: '展示学生会精彩活动与成员风采照片',
            href: 'showcase.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
        },
        shortcuts: {
            title: '快捷方式',
            sub: '管理首页快捷入口链接（图标、标题、URL）',
            href: 'shortcuts.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
        },
        contact: {
            title: '联系我们',
            sub: '联系方式与地址信息',
            href: 'contact.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
        },
        site: {
            title: '站点设置',
            sub: '站点名称、导航栏、页脚与版权信息',
            href: 'site.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M1 12h22"/><path d="M12 1a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
        },
        account: {
            title: '账号设置',
            sub: '修改管理员密码与登录操作记录',
            href: 'account.html',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
        }
    };

    /* =======================================================
     * 工具函数
     * ===================================================== */
    function sha1(msg) {
        function rotate(n, s) { return (n << s) | (n >>> (32 - s)); }
        function toHex(n) {
            var s = '', v;
            for (var i = 7; i >= 0; i--) { v = (n >> (i * 4)) & 0xf; s += v.toString(16); }
            return s;
        }
        var blockstart, i, j, W = new Array(80);
        var H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE, H3 = 0x10325476, H4 = 0xC3D2E1F0;
        var A, B, C, D, E, temp;
        try { msg = unescape(encodeURIComponent(msg)); } catch(e) {}
        var msgLen = msg.length;
        var wordArray = [];
        for (i = 0; i < msgLen - 3; i += 4) {
            j = msg.charCodeAt(i) << 24 | msg.charCodeAt(i+1) << 16 | msg.charCodeAt(i+2) << 8 | msg.charCodeAt(i+3);
            wordArray.push(j);
        }
        switch (msgLen % 4) {
            case 0: i = 0x80000000; break;
            case 1: i = msg.charCodeAt(msgLen-1) << 24 | 0x00800000; break;
            case 2: i = msg.charCodeAt(msgLen-2) << 24 | msg.charCodeAt(msgLen-1) << 16 | 0x00008000; break;
            case 3: i = msg.charCodeAt(msgLen-3) << 24 | msg.charCodeAt(msgLen-2) << 16 | msg.charCodeAt(msgLen-1) << 8 | 0x00000080; break;
        }
        wordArray.push(i);
        while ((wordArray.length % 16) !== 14) wordArray.push(0);
        wordArray.push(msgLen >>> 29);
        wordArray.push((msgLen << 3) & 0x0ffffffff);
        for (blockstart = 0; blockstart < wordArray.length; blockstart += 16) {
            for (i = 0; i < 16; i++) W[i] = wordArray[blockstart + i];
            for (i = 16; i <= 79; i++) W[i] = rotate(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
            A = H0; B = H1; C = H2; D = H3; E = H4;
            for (i = 0; i <= 19; i++) { temp = (rotate(A,5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff; E = D; D = C; C = rotate(B,30); B = A; A = temp; }
            for (i = 20; i <= 39; i++) { temp = (rotate(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff; E = D; D = C; C = rotate(B,30); B = A; A = temp; }
            for (i = 40; i <= 59; i++) { temp = (rotate(A,5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff; E = D; D = C; C = rotate(B,30); B = A; A = temp; }
            for (i = 60; i <= 79; i++) { temp = (rotate(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff; E = D; D = C; C = rotate(B,30); B = A; A = temp; }
            H0 = (H0 + A) & 0x0ffffffff; H1 = (H1 + B) & 0x0ffffffff; H2 = (H2 + C) & 0x0ffffffff; H3 = (H3 + D) & 0x0ffffffff; H4 = (H4 + E) & 0x0ffffffff;
        }
        return (toHex(H0) + toHex(H1) + toHex(H2) + toHex(H3) + toHex(H4)).toLowerCase();
    }
    function hashPassword(p) { return sha1(HASH_SALT + String(p || '')); }
    function clone(o) { try { return JSON.parse(JSON.stringify(o)); } catch(e) { return o; } }
    function deepMerge(dst, src) {
        if (Array.isArray(src)) return clone(src);
        if (src === null || typeof src !== 'object') return src;
        if (dst === null || typeof dst !== 'object') return clone(src);
        var out = clone(dst);
        for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = deepMerge(out[k], src[k]);
        return out;
    }
    function $(id) { return document.getElementById(id); }
    function escHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function escAttr(s) { return escHtml(s).replace(/\n/g, ' '); }
    function prettySize(n) {
        if (n < 1024) return n + ' B';
        if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
        return (n / 1024 / 1024).toFixed(2) + ' MB';
    }
    function rgbaToHex(rgba) {
        if (!rgba) return null;
        if (/^#([0-9a-f]{3,8})$/i.test(rgba)) return rgba.length === 4 ? '#' + rgba[1]+rgba[1]+rgba[2]+rgba[2]+rgba[3]+rgba[3] : rgba.slice(0,7);
        var m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(rgba);
        if (!m) return null;
        return '#' + [1,2,3].map(function (i) {
            var n = Math.max(0, Math.min(255, parseInt(m[i], 10)));
            return n.toString(16).padStart(2, '0');
        }).join('');
    }
    function hexToRgba(hex, a) {
        hex = (hex || '#000').replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
        if (hex.length < 6) hex = hex.padEnd(6, '0');
        var r = parseInt(hex.slice(0, 2), 16),
            g = parseInt(hex.slice(2, 4), 16),
            b = parseInt(hex.slice(4, 6), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + (a == null ? 0.5 : a) + ')';
    }

    /* =======================================================
     * Toast
     * ===================================================== */
    function ensureToastWrap() {
        var wrap = $('toastWrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'toastWrap';
            wrap.className = 'toast-wrap';
            document.body.appendChild(wrap);
        }
        return wrap;
    }
    function toast(msg, type, dur) {
        type = type || 'info';
        dur  = dur  || 2200;
        var wrap = ensureToastWrap();
        var t = document.createElement('div');
        t.className = 'toast ' + type;
        var icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
        t.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span><span>' + escHtml(msg) + '</span>';
        wrap.appendChild(t);
        setTimeout(function () {
            t.classList.add('leaving');
            setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 220);
        }, dur);
    }

    /* =======================================================
     * 存储与数据
     * ===================================================== */
    var currentCMS = null;
    function getStoredCMS() {
        try {
            var raw = localStorage.getItem(CMS_KEY);
            if (!raw) return clone(window.CMS_DEFAULTS || {});
            var data = JSON.parse(raw);
            return deepMerge(window.CMS_DEFAULTS || {}, data);
        } catch (e) {
            console.warn('读取 CMS 数据失败，回退默认值：', e);
            return clone(window.CMS_DEFAULTS || {});
        }
    }
    function loadCMS() {
        currentCMS = getStoredCMS();
        // 异步：若 Supabase 可用，用云端覆盖本地（云端更权威）
        try {
            if (window.SB && typeof window.SB.loadCMS === 'function') {
                window.SB.loadCMS().then(function (sb) {
                    if (!sb) return;
                    var needUpdate = false;
                    var keys = ['site','slides','stats','about','structure','news','showcase','shortcuts','contact'];
                    keys.forEach(function (k) {
                        if (sb[k] === null || sb[k] === undefined) return;
                        // 云端空数组/空对象不覆盖本地已有数据（避免首次同步把默认数据清掉）
                        var isEmpty = false;
                        if (Array.isArray(sb[k]) && sb[k].length === 0) isEmpty = true;
                        else if (typeof sb[k] === 'object' && !Array.isArray(sb[k]) && Object.keys(sb[k]).length === 0) isEmpty = true;
                        if (isEmpty && !!(currentCMS[k] && (Array.isArray(currentCMS[k]) ? currentCMS[k].length > 0 : Object.keys(currentCMS[k]).length > 0))) return;
                        // cms_store.contact 存完整结构（heading/infos/map 等），messages 在 contact_messages 表
                        if (k === 'contact') {
                            var orig = currentCMS.contact || {};
                            var merged = {};
                            // 保留本地 messages（留言独立存储）
                            merged.messages = Array.isArray(orig.messages) ? orig.messages : [];
                            // 从云端合并所有 contact 字段
                            if (sb[k] && typeof sb[k] === 'object') {
                                var src = sb[k];
                                ['heading','subheading','desc','mapUrl','lat','lng','infos','formSubjects'].forEach(function(f) {
                                    if (src[f] !== undefined) merged[f] = src[f];
                                });
                                // 兼容旧格式：只有 info 字符串时转成 infos
                                if (src.info && !src.infos) {
                                    merged.infos = [{ icon: '📍', label: '联系信息', value: src.info }];
                                }
                            }
                            // 如果云端没返回任何字段，保留本地非 messages 字段
                            if (Object.keys(merged).length <= 1) {
                                ['heading','subheading','desc','mapUrl','lat','lng','infos','formSubjects'].forEach(function(f) {
                                    if (orig[f] !== undefined) merged[f] = orig[f];
                                });
                            }
                            if (JSON.stringify(merged) !== JSON.stringify(orig)) {
                                currentCMS.contact = merged; needUpdate = true;
                            }
                            return;
                        }
                        // 归一化 shortcuts：旧格式为数组，新格式为 {heading, subheading, items}
                        if (k === 'shortcuts') {
                            var scData = sb[k];
                            if (Array.isArray(scData)) { scData = { heading: '快捷入口', subheading: 'Quick Links', items: scData }; }
                            else if (!scData || typeof scData !== 'object') { scData = { heading: '快捷入口', subheading: 'Quick Links', items: [] }; }
                            else if (!scData.items) { scData.items = []; }
                            sb[k] = scData;
                            // 重新计算空值判断
                            isEmpty = (Array.isArray(scData.items) && scData.items.length === 0 && !scData.heading);
                        }
                        if (JSON.stringify(sb[k]) !== JSON.stringify(currentCMS[k])) {
                            currentCMS[k] = sb[k]; needUpdate = true;
                        }
                    });
                    if (needUpdate) {
                        setStoredCMS(currentCMS);
                        try { window.dispatchEvent(new CustomEvent('cms:update-sb', { detail: { updatedAt: sb.updated_at } })); } catch(e) {}
                    }
                }).catch(function (e) { console.warn('[SB] loadCMS 云端同步失败（仅用本地数据）：', e && e.message); });
            }
        } catch(e) {}
        return currentCMS;
    }
    function setStoredCMS(data) {
        localStorage.setItem(CMS_KEY, JSON.stringify(data));
        try { window.dispatchEvent && window.dispatchEvent(new CustomEvent('cms:update')); } catch(e) {}
        refreshQuota();
    }
    function saveCMS(broadcastChanged) {
        if (!currentCMS) throw new Error('currentCMS 未初始化');
        // 基础校验：若数据为空，自动用默认值补齐（首次保存/意外清空时兜底）
        var D = window.CMS_DEFAULTS || {};
        var fixed = false;
        if (!currentCMS.slides || !currentCMS.slides.length) { currentCMS.slides = clone(D.slides || []); fixed = true; }
        if (!currentCMS.stats || !currentCMS.stats.length) { currentCMS.stats = clone(D.stats || []); fixed = true; }
        if (!currentCMS.structure || !currentCMS.structure.depts || !currentCMS.structure.depts.length) { currentCMS.structure = clone(D.structure || {}); fixed = true; }
        // 归一化 shortcuts：确保为对象格式 {heading, subheading, items}
        if (Array.isArray(currentCMS.shortcuts)) { currentCMS.shortcuts = clone(D.shortcuts || { heading: '快捷入口', subheading: 'Quick Links', items: currentCMS.shortcuts }); fixed = true; }
        else if (!currentCMS.shortcuts || typeof currentCMS.shortcuts !== 'object' || !currentCMS.shortcuts.items) { currentCMS.shortcuts = clone(D.shortcuts || { heading: '快捷入口', subheading: 'Quick Links', items: [] }); fixed = true; }
        // 归一化 contact：确保有 infos 数组
        if (!currentCMS.contact || typeof currentCMS.contact !== 'object') { currentCMS.contact = {}; fixed = true; }
        if (!Array.isArray(currentCMS.contact.infos)) {
            if (currentCMS.contact.info && !currentCMS.contact.infos) {
                currentCMS.contact.infos = [{ icon: '📍', label: '联系信息', value: currentCMS.contact.info }];
            } else {
                currentCMS.contact.infos = clone(D.contact && D.contact.infos ? D.contact.infos : []);
            }
            fixed = true;
        }
        if (fixed) toast('数据已自动补齐默认项', 'info', 2000);
        setStoredCMS(currentCMS);
        if (broadcastChanged !== false) {
            try { window.dispatchEvent(new CustomEvent('cms:changed', { detail: JSON.parse(JSON.stringify(currentCMS)) })); } catch(e) {}
        }
        // 异步同步云端（Supabase 失败不影响本地保存，toast 提示即可）
        try {
            if (window.SB && typeof window.SB.saveCMS === 'function') {
                window.SB.saveCMS(currentCMS).then(function (r) {
                    if (r && r.ok) { toast('已同步到云端数据库 ✓', 'success', 1400); }
                    else if (r && !r.ok && r.offline !== true) {
                        toast('本地保存成功，云端同步失败（网络或未建表？）', 'warn', 2800);
                    }
                }).catch(function () {
                    toast('本地保存成功，云端同步失败（离线模式继续运行）', 'warn', 2800);
                });
            }
        } catch(e) {}
        return true;
    }
    function resetToDefault() {
        localStorage.removeItem(CMS_KEY);
    }
    function resetCMS() {
        resetToDefault();
        loadCMS();
        setStoredCMS(currentCMS);
        try { window.dispatchEvent(new CustomEvent('cms:changed', { detail: JSON.parse(JSON.stringify(currentCMS)) })); } catch(e) {}
    }
    function getStoredUser() {
        try {
            var raw = localStorage.getItem(USER_KEY);
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        var def = { username: 'admin', passwordHash: hashPassword(DEFAULT_PASS), createdAt: Date.now(), role: 'admin' };
        localStorage.setItem(USER_KEY, JSON.stringify(def));
        // 异步：尝试从 Supabase admin_users 拉取用户（覆盖或并集）
        try {
            if (window.SB && typeof window.SB.getUserHash === 'function') {
                window.SB.getUserHash(def.username).then(function (u) {
                    if (u && u.password) {
                        var merged = {
                            username: u.username || def.username,
                            passwordHash: u.password,
                            role: u.role || 'admin',
                            createdAt: def.createdAt
                        };
                        localStorage.setItem(USER_KEY, JSON.stringify(merged));
                    }
                }).catch(function () {});
            }
        } catch(e) {}
        return def;
    }
    function getToken() { return sessionStorage.getItem(TOKEN_KEY); }
    function setLoginSession(username) {
        var token = sha1(HASH_SALT + 'session::' + username + '::' + Date.now());
        sessionStorage.setItem(TOKEN_KEY, JSON.stringify({
            username: username, token: token, loginAt: Date.now()
        }));
        pushLog('LOGIN', username + ' 登录系统');
        // 异步：Supabase 记录登录时间
        try {
            if (window.SB && typeof window.SB.loginTouch === 'function') {
                window.SB.loginTouch(username).catch(function () {});
            }
        } catch(e) {}
    }
    function clearLoginSession() {
        try {
            var t = getToken();
            if (t) { try { pushLog('LOGOUT', JSON.parse(t).username + ' 退出登录'); } catch(e) {} }
        } catch(e) {}
        sessionStorage.removeItem(TOKEN_KEY);
    }
    function pushLog(type, msg) {
        var entry = { type: type, msg: msg, at: Date.now() };
        try {
            var list = [];
            try { list = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch(e) {}
            list.unshift(entry);
            if (list.length > 200) list = list.slice(0, 200);
            localStorage.setItem(LOG_KEY, JSON.stringify(list));
        } catch(e) {}
        // 异步：把日志同步到 Supabase admin_logs
        try {
            if (window.SB && typeof window.SB.appendLog === 'function') {
                var username = 'system';
                try { var t = getToken(); if (t) username = JSON.parse(t).username || username; } catch(e) {}
                window.SB.appendLog({ username: username, action: type, detail: msg }).catch(function () {});
            }
        } catch(e) {}
    }
    function refreshQuota() {
        var span = $('quotaText');
        if (!span) return;
        var used = 0;
        try {
            used = (localStorage.getItem(CMS_KEY) || '').length * 2
                + (localStorage.getItem(USER_KEY) || '').length * 2
                + (localStorage.getItem(LOG_KEY) || '').length * 2;
        } catch(e) {}
        try {
            if (navigator.storage && navigator.storage.estimate && typeof navigator.storage.estimate === 'function') {
                navigator.storage.estimate().then(function (est) {
                    if (est && est.usage && est.quota) {
                        span.textContent = prettySize(est.usage) + ' / ' + prettySize(est.quota)
                            + ' (' + ((est.usage / est.quota) * 100).toFixed(1) + '%)';
                    } else { span.textContent = prettySize(used); }
                }).catch(function() { span.textContent = prettySize(used); });
                return;
            }
        } catch(e) {}
        span.textContent = prettySize(used);
    }

    /* =======================================================
     * 图片压缩 + 选择弹窗
     * ===================================================== */
    var imgPickerCtx = null;
    function openImgPicker(cb) {
        ensureImgModal();
        imgPickerCtx = { cb: cb, currentValue: null };
        $('imgModalTitle').textContent = '选择图片';
        $('imgUrlInput').value = '';
        $('imgFileInput').value = '';
        setImgPreview(null);
        $('imgModalOk').disabled = true;
        $('imgModal').style.display = 'flex';
    }
    function closeImgPicker() {
        var m = $('imgModal');
        if (m) m.style.display = 'none';
        imgPickerCtx = null;
    }
    function setImgPreview(src) {
        var area = $('imgPreviewArea');
        if (!src) { if (area) area.innerHTML = '<div class="img-empty">预览区域</div>'; return; }
        if (imgPickerCtx) imgPickerCtx.currentValue = src;
        var ok = $('imgModalOk');
        if (ok) ok.disabled = false;
        if (area) area.innerHTML = '<img src="' + escHtml(src) + '" alt="preview">';
    }
    function compressImage(file, maxW, quality, cb) {
        maxW = maxW || 1920;
        quality = quality || 0.82;
        try {
            var reader = new FileReader();
            reader.onload = function () {
                var img = new Image();
                img.onload = function () {
                    var w = img.naturalWidth, h = img.naturalHeight;
                    var ratio = 1;
                    if (w > maxW) ratio = maxW / w;
                    var tw = Math.round(w * ratio), th = Math.round(h * ratio);
                    var canvas = document.createElement('canvas');
                    canvas.width = tw; canvas.height = th;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, tw, th);
                    var mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                    try {
                        var out = canvas.toDataURL(mime, quality);
                        cb(null, out, { orig: file.size, newW: tw, newH: th });
                    } catch (e) { cb(e); }
                };
                img.onerror = function (e) { cb(e); };
                img.src = reader.result;
            };
            reader.onerror = function (e) { cb(e); };
            reader.readAsDataURL(file);
        } catch (e) { cb(e); }
    }
    function ensureImgModal() {
        if ($('imgModal')) return;
        var html = ''
            + '<div class="modal" id="imgModal" style="display:none;">'
            +   '<div class="modal-mask"></div>'
            +   '<div class="modal-card">'
            +     '<div class="modal-head">'
            +       '<h3 id="imgModalTitle">选择图片</h3>'
            +       '<button class="modal-close" id="imgModalClose">×</button>'
            +     '</div>'
            +     '<div class="modal-body">'
            +       '<div class="img-picker-actions">'
            +         '<label class="btn btn-outline">📁 从本地选择<input type="file" id="imgFileInput" accept="image/*" style="display:none;"></label>'
            +         '<span style="margin: 0 12px; color:#888;">或</span>'
            +         '<input type="text" id="imgUrlInput" class="form-control" placeholder="粘贴图片 URL (如 assets/hero-banner.jpg 或 https://...)" style="flex:1;">'
            +         '<button class="btn btn-primary" id="imgUrlBtn">使用 URL</button>'
            +       '</div>'
            +       '<div class="img-preview-area" id="imgPreviewArea"><div class="img-empty">预览区域</div></div>'
            +       '<p class="img-tip">💡 建议图片 ≤ 1920 宽，系统将自动压缩至 quality 0.82 以节省本地存储。</p>'
            +     '</div>'
            +     '<div class="modal-foot">'
            +       '<button class="btn btn-outline" id="imgModalCancel">取消</button>'
            +       '<button class="btn btn-primary" id="imgModalOk" disabled>确认使用</button>'
            +     '</div>'
            +   '</div>'
            + '</div>';
        document.body.insertAdjacentHTML('beforeend', html);
        bindImgPickerEvents();
    }
    function bindImgPickerEvents() {
        var fileIn = $('imgFileInput');
        if (fileIn && !fileIn.__bound) {
            fileIn.__bound = true;
            fileIn.addEventListener('change', function () {
                if (!fileIn.files || !fileIn.files[0]) return;
                var f = fileIn.files[0];
                if (!/^image\//i.test(f.type)) { toast('请选择图片文件', 'warn'); return; }
                compressImage(f, 1920, 0.82, function (err, dataUrl, info) {
                    if (err) { toast('图片压缩失败', 'error'); console.error(err); return; }
                    setImgPreview(dataUrl);
                    toast('图片已压缩为 ' + info.newW + ' 宽（原始 ' + prettySize(info.orig) + ' → ' + prettySize(Math.round(dataUrl.length * 0.75)) + '）', 'success');
                });
            });
        }
        var urlBtn = $('imgUrlBtn');
        if (urlBtn && !urlBtn.__bound) {
            urlBtn.__bound = true;
            urlBtn.addEventListener('click', function () {
                var v = $('imgUrlInput').value.trim();
                if (!v) { toast('请填入图片 URL', 'warn'); return; }
                setImgPreview(v);
            });
        }
        var okBtn = $('imgModalOk');
        if (okBtn && !okBtn.__bound) {
            okBtn.__bound = true;
            okBtn.addEventListener('click', function () {
                if (!imgPickerCtx || !imgPickerCtx.currentValue) return;
                imgPickerCtx.cb(imgPickerCtx.currentValue);
                closeImgPicker();
            });
        }
        var cBtn = $('imgModalClose');
        if (cBtn && !cBtn.__bound) { cBtn.__bound = true; cBtn.addEventListener('click', closeImgPicker); }
        var xBtn = $('imgModalCancel');
        if (xBtn && !xBtn.__bound) { xBtn.__bound = true; xBtn.addEventListener('click', closeImgPicker); }
    }

    /* =======================================================
     * 通用列表 & 表单绑定
     * ===================================================== */
    function getPath(obj, p) {
        var parts = p.split('.');
        var o = obj;
        for (var i = 0; i < parts.length; i++) { if (o == null) return undefined; o = o[parts[i]]; }
        return o;
    }
    function setPath(obj, p, v) {
        var parts = p.split('.');
        var o = obj;
        for (var i = 0; i < parts.length - 1; i++) {
            if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {};
            o = o[parts[i]];
        }
        o[parts[parts.length - 1]] = v;
    }
    function bindFormToObj(formEl, root) {
        formEl.querySelectorAll('[data-bind]').forEach(function (el) {
            var p = el.getAttribute('data-bind');
            var val = getPath(root, p);
            if (el.type === 'checkbox') el.checked = !!val;
            else if (el.tagName === 'SELECT' && el.multiple) {}
            else el.value = (val == null ? '' : val);
            var fire = function () {
                var v;
                if (el.type === 'checkbox') v = el.checked;
                else if (el.type === 'number') { v = el.value === '' ? '' : Number(el.value); if (isNaN(v)) v = el.value; }
                else v = el.value;
                setPath(root, p, v);
            };
            el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', fire);
            if (el.tagName === 'SELECT') el.addEventListener('change', fire);
        });
    }
    function makeImgBtn(btnEl, root, path, refreshPreview) {
        btnEl.addEventListener('click', function () {
            openImgPicker(function (src) {
                setPath(root, path, src);
                toast('图片已更新', 'success', 900);
                if (typeof refreshPreview === 'function') refreshPreview(src);
            });
        });
    }
    function renderReorderList(container, opts) {
        // 防御性：确保 items 是数组
        if (!opts.items || !Array.isArray(opts.items)) opts.items = [];
        var box = document.createElement('div');
        function reRender() {
            box.innerHTML = '';
            var bar = document.createElement('div');
            bar.className = 'list-edit-toolbar';
            bar.innerHTML = '<div class="list-count">共 <strong style="color:#0B3D91;">' + opts.items.length + '</strong> ' + escHtml(opts.cardName) + '</div>';
            var addBtn = document.createElement('button');
            addBtn.className = 'btn btn-primary btn-sm';
            addBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> ' + (opts.addLabel || '新增');
            if (opts.maxItems && opts.items.length >= opts.maxItems) {
                addBtn.disabled = true;
                addBtn.title = '已达上限（' + opts.maxItems + '）';
            }
            addBtn.onclick = function () {
                if (opts.maxItems && opts.items.length >= opts.maxItems) return;
                var it = opts.addEmpty();
                opts.items.push(it);
                toast('已新增' + (opts.cardName || '项'), 'success', 1000);
                reRender();
            };
            bar.appendChild(addBtn);
            box.appendChild(bar);

            var list = document.createElement('div');
            list.className = 'list-items';
            if (!opts.items.length) {
                list.innerHTML = '<div class="list-item-card" style="justify-content:center;padding:28px;color:#868c98;">（暂无数据，点击右上角"新增"添加）</div>';
            } else {
                opts.items.forEach(function (item, idx) {
                    var card = document.createElement('div');
                    card.className = 'list-item-card';
                    var ord = document.createElement('div');
                    ord.className = 'list-item-order';
                    ord.textContent = idx + 1;
                    card.appendChild(ord);
                    var mid = document.createElement('div');
                    mid.className = 'list-item-body';
                    mid.innerHTML = opts.renderCard(item, idx);
                    var toggleWrap = document.createElement('div');
                    toggleWrap.style.marginTop = '10px';
                    toggleWrap.style.display = 'none';
                    toggleWrap.className = 'edit-form-wrap';
                    var form = document.createElement('div');
                    form.style.paddingTop = '14px';
                    form.style.borderTop = '1px dashed #e3e6ed';
                    form.style.marginTop = '10px';
                    form.innerHTML = opts.renderForm(item, idx, {});
                    toggleWrap.appendChild(form);
                    mid.appendChild(toggleWrap);
                    card.appendChild(mid);
                    var actions = document.createElement('div');
                    actions.className = 'list-item-actions';
                    var upBtn = document.createElement('button');
                    upBtn.className = 'btn btn-outline btn-sm move-btn';
                    upBtn.title = '上移';
                    upBtn.innerHTML = '▲';
                    upBtn.disabled = idx === 0;
                    upBtn.onclick = function () {
                        if (idx === 0) return;
                        var t = opts.items[idx - 1];
                        opts.items[idx - 1] = opts.items[idx];
                        opts.items[idx] = t;
                        reRender();
                    };
                    var dnBtn = document.createElement('button');
                    dnBtn.className = 'btn btn-outline btn-sm move-btn';
                    dnBtn.title = '下移';
                    dnBtn.innerHTML = '▼';
                    dnBtn.disabled = idx === opts.items.length - 1;
                    dnBtn.onclick = function () {
                        if (idx === opts.items.length - 1) return;
                        var t = opts.items[idx + 1];
                        opts.items[idx + 1] = opts.items[idx];
                        opts.items[idx] = t;
                        reRender();
                    };
                    var editBtn = document.createElement('button');
                    editBtn.className = 'btn btn-sm btn-outline';
                    editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> 编辑';
                    editBtn.onclick = function () {
                        toggleWrap.style.display = toggleWrap.style.display === 'none' ? 'block' : 'none';
                        if (toggleWrap.style.display === 'block') {
                            if (typeof opts.onAfterEdit === 'function') opts.onAfterEdit(form, item, idx);
                        }
                    };
                    var delBtn = document.createElement('button');
                    delBtn.className = 'btn btn-sm btn-danger';
                    delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg> 删除';
                    if (opts.minItems != null && opts.items.length <= opts.minItems) {
                        delBtn.disabled = true;
                        delBtn.title = '至少保留 ' + opts.minItems + ' 项';
                    }
                    delBtn.onclick = function () {
                        if (opts.minItems != null && opts.items.length <= opts.minItems) return;
                        if (!confirm('确认删除该' + (opts.cardName || '项') + '？此操作可在点击"保存全部"前通过"重置为默认"撤销站点级改动。')) return;
                        opts.items.splice(idx, 1);
                        reRender();
                    };
                    actions.appendChild(upBtn);
                    actions.appendChild(dnBtn);
                    actions.appendChild(editBtn);
                    actions.appendChild(delBtn);
                    card.appendChild(actions);
                    list.appendChild(card);
                    if (typeof opts.onAfterEdit === 'function') opts.onAfterEdit(form, item, idx);
                });
            }
            box.appendChild(list);
        }
        reRender();
        container.appendChild(box);
    }

    /* =======================================================
     * 登录页逻辑
     * ===================================================== */
    function isLoginPage() { return /login\.html(\?|#|$)/i.test(location.pathname); }
    function bootLoginPage() {
        var form = $('loginForm');
        if (!form) return;
        var error = $('loginError');
        function showError(msg) { error.textContent = msg; error.style.display = 'block'; }
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            error.style.display = 'none';
            var u = $('username').value.trim();
            var p = $('password').value;
            if (!u || !p) { showError('请输入账号与密码'); return; }
            var pwdHashed = hashPassword(p);
            var btn = form.querySelector('button[type="submit"]');
            var originalText = btn ? btn.textContent : '';
            if (btn) { btn.disabled = true; btn.textContent = '云端校验中…'; }

            function fail(msg) {
                showError(msg);
                if (btn) { btn.disabled = false; btn.textContent = originalText; }
            }

            // 纯云端认证：必须连 Supabase，不降级本地
            if (!window.SB || typeof window.SB.getUserHash !== 'function') {
                fail('系统未初始化（缺少云端服务配置），请联系管理员');
                return;
            }
            window.SB.getUserHash(u).then(function (sbUser) {
                if (!sbUser || !sbUser.password) {
                    fail('账号不存在或密码错误');
                    return;
                }
                if (sbUser.password !== pwdHashed) {
                    fail('密码错误');
                    return;
                }
                // 登录成功：只存 session token（不存密码哈希）
                setLoginSession(u);
                if (window.SB && typeof window.SB.loginTouch === 'function') {
                    window.SB.loginTouch(u);
                }
                toast('登录成功，正在进入后台…', 'success', 1400);
                setTimeout(function () { location.href = 'dashboard.html'; }, 700);
            }).catch(function (err) {
                fail('无法连接云端服务，请检查网络后重试');
            });
        });
    }

    /* =======================================================
     * 鉴权守卫
     * ===================================================== */
    function ensureAuth(redirectTo) {
        if (isLoginPage()) return true;
        var token = getToken();
        if (!token) {
            toast('请先登录', 'warn');
            setTimeout(function () { location.href = redirectTo || 'login.html'; }, 300);
            return false;
        }
        try { JSON.parse(token); } catch(e) {
            clearLoginSession();
            setTimeout(function () { location.href = redirectTo || 'login.html'; }, 200);
            return false;
        }
        return true;
    }

    /* =======================================================
     * Shell 壳渲染（侧栏 + 顶栏 + Toast + 图片弹窗）
     * ===================================================== */
    function renderShell(activeTab) {
        // 侧栏导航
        var navEntries = [
            'dashboard','slides','stats','about','structure',
            'news','showcase','shortcuts','contact','site'
        ].map(function (k) {
            var t = TABS[k];
            var cls = 'nav-item' + (k === activeTab ? ' active' : '');
            return '<a href="' + escAttr(t.href) + '" data-tab="' + k + '" class="' + cls + '">'
                + t.icon + '<span>' + escHtml(t.title) + '</span></a>';
        }).join('');
        var acc = TABS.account;
        var accCls = 'nav-item' + (activeTab === 'account' ? ' active' : '');

        var shellHtml = ''
            + '<div class="admin-shell">'
            +   '<aside class="admin-sidebar" id="sidebar">'
            +     '<div class="admin-brand">'
            +       '<div class="brand-icon"><svg viewBox="0 0 40 40" fill="none"><path d="M20 4L8 10V22C8 28.63 12.87 34.47 20 36C27.13 34.47 32 28.63 32 22V10L20 4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 20L18.5 23.5L26 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
            +       '<div class="brand-text"><h2>药环学院</h2><p>学生会 · CMS</p></div>'
            +     '</div>'
            +     '<nav class="admin-nav" id="adminNav">'
            +       navEntries
            +       '<div class="nav-divider"></div>'
            +       '<a href="' + escAttr(acc.href) + '" data-tab="account" class="' + accCls + '">' + acc.icon + '<span>' + escHtml(acc.title) + '</span></a>'
            +       '<a href="#" id="logoutBtn" class="nav-item nav-item-danger">'
            +         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
            +         '<span>退出登录</span></a>'
            +     '</nav>'
            +     '<div class="sidebar-quota" id="sidebarQuota">存储：<span id="quotaText">—</span></div>'
            +   '</aside>'
            +   '<div class="admin-main">'
            +     '<header class="admin-topbar">'
            +       '<button class="sidebar-toggle" id="sidebarToggle" aria-label="切换侧栏">'
            +         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>'
            +       '</button>'
            +       '<div>'
            +         '<h1 class="topbar-title" id="topbarTitle">' + escHtml(TABS[activeTab].title) + '</h1>'
            +         '<p class="topbar-sub" id="topbarSub">' + escHtml(TABS[activeTab].sub) + '</p>'
            +       '</div>'
            +       '<div class="topbar-actions">'
            +         '<a href="../index.html" target="_blank" class="btn btn-outline">'
            +           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
            +           '预览站点</a>'
            +         '<button class="btn btn-outline-dark" id="btnResetAll">'
            +           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>'
            +           '重置为默认</button>'
            +         '<button class="btn btn-primary" id="btnSaveAll">'
            +           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>'
            +           '保存全部</button>'
            +       '</div>'
            +     '</header>'
            +     '<main class="admin-content" id="tabContent"><!-- 模块内容由 ADMIN.boot(pageKey) 调用 admin.js 中的渲染函数 --></main>'
            +   '</div>'
            + '</div>';
        document.body.insertAdjacentHTML('afterbegin', shellHtml);
        ensureToastWrap();
        ensureImgModal();
    }

    /* =======================================================
     * 保存 / 重置 按钮处理
     * ===================================================== */
    function onSaveAll(renderCurrent) {
        try {
            saveCMS(true);
            if (typeof renderCurrent === 'function') {
                try {
                    var box = $('tabContent');
                    if (box) { box.innerHTML = ''; renderCurrent(box); }
                } catch (e) { console.error('刷新当前视图失败', e); }            }
            refreshQuota();
            pushLog('SAVE', '保存全部内容（轮播 / 统计 / 部门 / 新闻 / 风采 / …等模块）');
            toast('✅ 已保存！新标签页打开的首页会自动刷新，点击"预览站点"可查看最新效果。', 'success', 2800);
        } catch (e) {
            console.error(e);
            toast('保存失败：' + (e.message || e), 'error');
        }
    }
    function onResetAll(renderCurrent) {
        if (!confirm('⚠️ 确认要将【全部 8 个模块】重置为系统默认内容吗？\n此操作将丢失所有未保存/已保存的自定义内容，且无法撤销。')) return;
        resetCMS();
        if (typeof renderCurrent === 'function') {
            try {
                var box = $('tabContent');
                if (box) { box.innerHTML = ''; renderCurrent(box); }
            } catch (e) { console.error('刷新当前视图失败', e); }
        }
        refreshQuota();
        pushLog('RESET', '将 CMS 内容重置为默认值');
        toast('已重置为默认值（并已同步到存储）', 'success', 1800);
    }

    /* =======================================================
     * 启动入口
     * ===================================================== */
    function ready(cb) {
        if (document.readyState !== 'loading') cb();
        else document.addEventListener('DOMContentLoaded', cb, { once: true });
    }

    /**
     * 启动一个模块页面
     * @param {string} pageKey 如 'dashboard' / 'slides' ...
     */
    function bootPage(pageKey) {
        if (!ensureAuth()) return;
        if (!TABS[pageKey]) {
            document.body.innerHTML = '<div style="padding:40px;font-family:sans-serif;">未知页面：' + escHtml(pageKey) + '，<a href="dashboard.html">返回仪表盘</a></div>';
            return;
        }
        loadCMS();
        renderShell(pageKey);

        // 顶栏按钮
        var renders = (window.ADMIN_RENDERS && window.ADMIN_RENDERS[pageKey])
            ? window.ADMIN_RENDERS
            : { __none: true };
        var renderFn = (renders.__none) ? null : renders[pageKey];

        function renderCurrent(box) {
            if (typeof renderFn === 'function') renderFn(box);
            else box.innerHTML = '<div class="admin-card"><h3>模块未加载</h3><p style="margin-top:10px;color:#868c98;">请确认 admin.js 已正确引入并公开了 ADMIN_RENDERS.' + pageKey + '。</p></div>';
        }
        var tabBox = $('tabContent');
        renderCurrent(tabBox);

        $('btnSaveAll').addEventListener('click', function () { onSaveAll(renderCurrent); });
        $('btnResetAll').addEventListener('click', function () { onResetAll(renderCurrent); });

        // 退出登录
        var logoutBtn = $('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (!confirm('确认退出登录？')) return;
                clearLoginSession();
                setTimeout(function () { location.href = 'login.html'; }, 200);
            });
        }

        // 侧栏切换（移动端）
        $('sidebarToggle').addEventListener('click', function () {
            $('sidebar').classList.toggle('open');
        });

        bindImgPickerEvents();
        refreshQuota();

        // 其他标签页保存了 → 刷新当前页
        window.addEventListener('storage', function (e) {
            if (e.key === CMS_KEY) {
                loadCMS();
                try {
                    var box = $('tabContent');
                    if (box) { box.innerHTML = ''; renderCurrent(box); }
                } catch (e2) { console.error(e2); }
                toast('检测到其他标签页的保存，已同步最新数据', 'info', 1800);
            }
        });
    }

    /* =======================================================
     * 暴露全局 ADMIN 对象
     * ===================================================== */
    window.ADMIN = {
        TABS: TABS,
        CONSTANTS: { CMS_KEY: CMS_KEY, USER_KEY: USER_KEY, TOKEN_KEY: TOKEN_KEY, LOG_KEY: LOG_KEY },
        // 数据
        get currentCMS() { return currentCMS; },
        loadCMS: loadCMS,
        saveCMS: saveCMS,
        resetCMS: resetCMS,
        getStoredUser: getStoredUser,
        getToken: getToken,
        setLoginSession: setLoginSession,
        clearLoginSession: clearLoginSession,
        pushLog: pushLog,
        refreshQuota: refreshQuota,
        // 工具
        $: $,
        escHtml: escHtml,
        escAttr: escAttr,
        sha1: sha1,
        hashPassword: hashPassword,
        clone: clone,
        deepMerge: deepMerge,
        prettySize: prettySize,
        rgbaToHex: rgbaToHex,
        hexToRgba: hexToRgba,
        // UI
        toast: toast,
        openImgPicker: openImgPicker,
        closeImgPicker: closeImgPicker,
        compressImage: compressImage,
        makeImgBtn: makeImgBtn,
        // 表单 & 列表
        bindFormToObj: bindFormToObj,
        renderReorderList: renderReorderList,
        getPath: getPath,
        setPath: setPath,
        // 启动
        ensureAuth: ensureAuth,
        boot: bootPage,
        bootLoginPage: bootLoginPage,
        isLoginPage: isLoginPage,
        ready: ready,
        // 可视化编辑器（详情页增强）
        makeBodyEditor: makeBodyEditor,
        makeGalleryEditor: makeGalleryEditor,
        makeRelatedEditor: makeRelatedEditor
    };

    // 闭包内 A 别名（编辑器需要调用 A.openImgPicker 等）
    var A = window.ADMIN;

    /* =======================================================
     * 可视化编辑器：详情页增强（正文块 / 图集 / 相关推荐）
     * 让用户完全不用手写 JSON。
     * ===================================================== */

    // ---- 公共：注入一次编辑器所需 CSS ----
    var _advCssInjected = false;
    function injectAdvCss() {
        if (_advCssInjected) return;
        _advCssInjected = true;
        var css = ''
            + '.adv-editor{border:1px solid #e3e6ee;border-radius:10px;overflow:hidden;background:#fafbff;}'
            + '.adv-editor-toolbar{display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px;background:#fff;border-bottom:1px solid #eef0f6;}'
            + '.adv-editor-toolbar button{font-size:12px;padding:6px 10px;border-radius:8px;border:1px solid #dfe3ee;background:#fff;cursor:pointer;transition:.15s;color:#384052;}'
            + '.adv-editor-toolbar button:hover{border-color:#0B3D91;color:#0B3D91;background:#eef3ff;}'
            + '.adv-editor-toolbar .sp{flex:1;}'
            + '.adv-editor-body{padding:10px 12px 14px;min-height:60px;}'
            + '.adv-block{background:#fff;border:1px solid #e6e9f1;border-radius:10px;margin-bottom:10px;padding:10px 12px;position:relative;}'
            + '.adv-block:last-child{margin-bottom:0;}'
            + '.adv-block-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;}'
            + '.adv-block-tag{font-size:11px;padding:2px 8px;border-radius:999px;background:#eef3ff;color:#0B3D91;}'
            + '.adv-block-actions{margin-left:auto;display:flex;gap:4px;}'
            + '.adv-block-actions button{font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #e3e6ee;background:#fff;cursor:pointer;}'
            + '.adv-block-actions button:hover{border-color:#d9434f;color:#d9434f;}'
            + '.adv-block textarea,.adv-block input[type=text]{width:100%;font-size:13px;padding:8px 10px;border:1px solid #dfe3ee;border-radius:8px;box-sizing:border-box;background:#fafbff;resize:vertical;}'
            + '.adv-block textarea:focus,.adv-block input[type=text]:focus{border-color:#0B3D91;background:#fff;outline:none;}'
            + '.adv-block .row2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;}'
            + '.adv-block .mini{font-size:11px;color:#8590a6;margin-top:4px;}'
            + '.adv-empty-tip{color:#949db3;font-size:12px;text-align:center;padding:14px 6px;}'
            + '.adv-gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:12px;}'
            + '.adv-gallery-item{background:#fff;border:1px solid #e6e9f1;border-radius:10px;padding:8px;position:relative;}'
            + '.adv-gallery-thumb{aspect-ratio:4/3;border-radius:8px;background:#eef0f6 center/cover no-repeat;margin-bottom:6px;display:flex;align-items:center;justify-content:center;color:#888;font-size:12px;cursor:pointer;}'
            + '.adv-gallery-actions{display:flex;gap:4px;margin-top:6px;}'
            + '.adv-gallery-actions button{flex:1;font-size:11px;padding:4px 6px;border-radius:6px;border:1px solid #e3e6ee;background:#fff;cursor:pointer;}'
            + '.adv-gallery-actions button:hover{border-color:#d9434f;color:#d9434f;}'
            + '.adv-gallery-actions .b-up:hover,.adv-gallery-actions .b-down:hover,.adv-gallery-actions .b-url:hover{border-color:#0B3D91;color:#0B3D91;}'
            + '.adv-related-wrap{padding:10px 12px 14px;}'
            + '.adv-related-pick{display:flex;flex-wrap:wrap;gap:6px 12px;max-height:200px;overflow:auto;padding:8px;border:1px solid #e6e9f1;border-radius:10px;background:#fff;}'
            + '.adv-related-pick label{display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:3px 8px;border-radius:6px;cursor:pointer;white-space:nowrap;}'
            + '.adv-related-pick label:hover{background:#eef3ff;}'
            + '.adv-related-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;min-height:24px;}'
            + '.adv-related-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 4px 3px 10px;border-radius:999px;background:#eef3ff;color:#0B3D91;font-size:12px;}'
            + '.adv-related-tag button{background:none;border:none;color:#0B3D91;cursor:pointer;font-size:14px;padding:0 6px;line-height:1;}'
            + '.adv-related-tag button:hover{color:#d9434f;}'
            + '.adv-switch-row{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#6b7487;margin:8px 0 4px;}'
            + '.adv-switch-row a{color:#0B3D91;cursor:pointer;text-decoration:underline;}'
            + '.adv-json-raw{display:none;width:100%;min-height:120px;box-sizing:border-box;font-family:ui-monospace,Consolas,monospace;font-size:12px;padding:8px;border:1px solid #e3e6ee;border-radius:8px;margin-top:6px;}'
            + '.adv-json-raw.on{display:block;}';
        var s = document.createElement('style');
        s.textContent = css;
        document.head.appendChild(s);
    }

    // 通用：把可能是 JSON 字符串或数组的值 → 规范化数组
    function _arr(v, fallback) {
        if (v == null || v === '') return fallback || [];
        if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { return fallback || []; } }
        return Array.isArray(v) ? v : (fallback || []);
    }

    // ---- 正文块可视化编辑器 ----
    // target: 容器元素；refObj: {body:[...]}；onChange(blocks) 回调
    var BODY_BLOCK_TYPES = [
        { type: 'h2', label: '二级标题 H2' },
        { type: 'h3', label: '三级标题 H3' },
        { type: 'p',  label: '正文段落' },
        { type: 'quote', label: '引用块' },
        { type: 'list', label: '无序列表' },
        { type: 'img', label: '图片' },
        { type: 'divider', label: '分隔线' }
    ];
    function makeBodyEditor(target, refObj, onChange) {
        injectAdvCss();
        if (!refObj) refObj = { body: [] };
        var blocks = _arr(refObj.body);
        // 规范化：确保引用/标题等都是对象
        blocks = blocks.map(function (b) { return typeof b === 'string' ? { type: 'p', text: b } : (b || {}); });

        function emit() { refObj.body = blocks; if (onChange) try { onChange(blocks); } catch (e) {} }
        function render() {
            target.innerHTML = '';
            var wrap = document.createElement('div');
            wrap.className = 'adv-editor';

            var tb = document.createElement('div');
            tb.className = 'adv-editor-toolbar';
            BODY_BLOCK_TYPES.forEach(function (bt) {
                var b = document.createElement('button');
                b.type = 'button';
                b.textContent = '+ ' + bt.label;
                b.addEventListener('click', function () {
                    blocks.push(newBlock(bt.type));
                    emit(); render();
                });
                tb.appendChild(b);
            });
            if (blocks.length) {
                var clr = document.createElement('button');
                clr.textContent = '清空所有块';
                clr.style.borderColor = '#f3cdd1'; clr.style.color = '#d9434f';
                clr.addEventListener('click', function () { if (confirm('确认清空所有正文块？')) { blocks = []; emit(); render(); } });
                tb.appendChild(clr);
            }
            wrap.appendChild(tb);

            var body = document.createElement('div');
            body.className = 'adv-editor-body';
            if (!blocks.length) {
                var tip = document.createElement('div');
                tip.className = 'adv-empty-tip';
                tip.textContent = '暂无正文块，点上方按钮快速添加。留空则系统会自动生成兜底文案。';
                body.appendChild(tip);
            }
            blocks.forEach(function (blk, i) {
                body.appendChild(renderBlock(blk, i));
            });
            wrap.appendChild(body);

            // 原始 JSON 切换
            var sw = document.createElement('div');
            sw.className = 'adv-switch-row';
            sw.innerHTML = '<span>需要直接手写 JSON？</span><a data-raw>展开原始 JSON</a>';
            var raw = document.createElement('textarea');
            raw.className = 'adv-json-raw';
            raw.spellcheck = false;
            raw.placeholder = '例：[{"type":"h2","text":"标题"}]';
            raw.value = JSON.stringify(blocks, null, 2);
            raw.addEventListener('change', function () {
                try {
                    var arr = JSON.parse(raw.value || '[]');
                    if (!Array.isArray(arr)) throw new Error('必须是数组');
                    blocks = arr;
                    emit(); render();
                } catch (e) { alert('JSON 格式有误：' + e.message); }
            });
            sw.querySelector('[data-raw]').addEventListener('click', function (e) {
                e.preventDefault();
                var on = raw.classList.toggle('on');
                e.currentTarget.textContent = on ? '收起原始 JSON' : '展开原始 JSON';
                if (on) raw.value = JSON.stringify(blocks, null, 2);
            });
            wrap.appendChild(sw);
            wrap.appendChild(raw);

            target.appendChild(wrap);
        }

        function newBlock(type) {
            switch (type) {
                case 'h2': case 'h3': return { type: type, text: '' };
                case 'p':  return { type: 'p', text: '' };
                case 'quote': return { type: 'quote', text: '' };
                case 'list': return { type: 'list', items: ['条目 1', '条目 2'] };
                case 'img':  return { type: 'img', src: '', caption: '' };
                case 'divider': return { type: 'divider' };
                default: return { type: 'p', text: '' };
            }
        }

        function renderBlock(blk, i) {
            var el = document.createElement('div');
            el.className = 'adv-block';
            var head = document.createElement('div');
            head.className = 'adv-block-head';
            var tag = document.createElement('span');
            tag.className = 'adv-block-tag';
            tag.textContent = (BODY_BLOCK_TYPES.find(function (x) { return x.type === blk.type; }) || {}).label || blk.type;
            head.appendChild(tag);
            var act = document.createElement('div');
            act.className = 'adv-block-actions';
            if (i > 0) act.appendChild(actBtn('↑上移', function () { var t = blocks[i - 1]; blocks[i - 1] = blocks[i]; blocks[i] = t; emit(); render(); }));
            if (i < blocks.length - 1) act.appendChild(actBtn('下移↓', function () { var t = blocks[i + 1]; blocks[i + 1] = blocks[i]; blocks[i] = t; emit(); render(); }));
            act.appendChild(actBtn('删除', function () { blocks.splice(i, 1); emit(); render(); }, true));
            head.appendChild(act);
            el.appendChild(head);

            var t = blk.type;
            if (t === 'h2' || t === 'h3' || t === 'p' || t === 'quote') {
                var rows = t === 'p' ? 3 : (t === 'quote' ? 4 : 1);
                var ph = { h2: '输入二级标题…', h3: '输入三级标题…', p: '输入正文段落…', quote: '输入引用内容…' }[t] || '';
                var ta = document.createElement('textarea');
                ta.rows = rows; ta.placeholder = ph; ta.value = blk.text || '';
                ta.addEventListener('input', function () { blk.text = ta.value; emit(); });
                el.appendChild(ta);
            } else if (t === 'list') {
                var mini = document.createElement('div');
                mini.className = 'mini';
                mini.textContent = '每行一个条目，按 Enter 可新增。';
                el.appendChild(mini);
                var items = Array.isArray(blk.items) ? blk.items.slice() : [];
                if (!items.length) items = [''];
                items.forEach(function (it, k) {
                    var inp = document.createElement('input');
                    inp.type = 'text'; inp.value = it || '';
                    inp.placeholder = '条目 ' + (k + 1);
                    inp.addEventListener('input', function () { items[k] = inp.value; blk.items = items.filter(function (x) { return x !== ''; }); emit(); });
                    el.appendChild(inp);
                });
                var add = document.createElement('button');
                add.type = 'button'; add.textContent = '+ 新增条目';
                add.style.marginTop = '6px'; add.style.fontSize = '12px';
                add.style.padding = '4px 10px'; add.style.borderRadius = '8px';
                add.style.border = '1px dashed #c8cee0'; add.style.background = '#fff'; add.style.cursor = 'pointer';
                add.addEventListener('click', function () { blk.items = (blk.items || []).concat(['']); emit(); render(); });
                el.appendChild(add);
            } else if (t === 'img') {
                var thumb = document.createElement('div');
                thumb.className = 'adv-gallery-thumb';
                thumb.textContent = '点击选择/更换图片';
                if (blk.src) { thumb.style.backgroundImage = 'url("' + blk.src + '")'; thumb.textContent = ''; }
                thumb.addEventListener('click', function () {
                    A.openImgPicker(function (src) {
                        if (!src) return;
                        blk.src = src; emit(); render();
                    });
                });
                el.appendChild(thumb);
                var cap = document.createElement('input');
                cap.type = 'text'; cap.placeholder = '图片说明（可选，展示在图片下方）';
                cap.value = blk.caption || '';
                cap.style.marginTop = '6px';
                cap.addEventListener('input', function () { blk.caption = cap.value; emit(); });
                el.appendChild(cap);
            } else if (t === 'divider') {
                var dv = document.createElement('div');
                dv.style.height = '1px'; dv.style.background = 'linear-gradient(to right, transparent, #c8cee0, transparent)';
                dv.style.margin = '18px 4px';
                el.appendChild(dv);
                var hint = document.createElement('div');
                hint.className = 'mini'; hint.textContent = '一条水平分隔线，用于分隔章节。';
                el.appendChild(hint);
            }
            return el;
        }
        function actBtn(label, cb, danger) {
            var b = document.createElement('button');
            b.type = 'button'; b.textContent = label;
            if (danger) { b.style.color = '#d9434f'; }
            b.addEventListener('click', cb);
            return b;
        }
        render();
        return {
            getValue: function () { return blocks.slice(); },
            setValue: function (v) { blocks = _arr(v); emit(); render(); }
        };
    }

    // ---- 图集可视化编辑器 ----
    function makeGalleryEditor(target, refObj, onChange) {
        injectAdvCss();
        if (!refObj) refObj = { gallery: [] };
        var items = _arr(refObj.gallery).map(function (x) {
            if (typeof x === 'string') return { src: x, caption: '' };
            return x || { src: '', caption: '' };
        });
        function emit() { refObj.gallery = items; if (onChange) try { onChange(items); } catch (e) {} }
        function render() {
            target.innerHTML = '';
            var wrap = document.createElement('div');
            wrap.className = 'adv-editor';

            var tb = document.createElement('div');
            tb.className = 'adv-editor-toolbar';
            var add = document.createElement('button');
            add.type = 'button'; add.textContent = '+ 上传 / 选择图片';
            add.addEventListener('click', function () {
                A.openImgPicker(function (src) {
                    if (!src) return;
                    items.push({ src: src, caption: '' });
                    emit(); render();
                });
            });
            tb.appendChild(add);
            var addUrl = document.createElement('button');
            addUrl.type = 'button'; addUrl.textContent = '+ 通过 URL 添加';
            addUrl.addEventListener('click', function () {
                var u = prompt('请输入图片 URL（例如 assets/xx.jpg 或 https://…）');
                if (u && u.trim()) { items.push({ src: u.trim(), caption: '' }); emit(); render(); }
            });
            tb.appendChild(addUrl);
            if (items.length) {
                var clr = document.createElement('button');
                clr.textContent = '清空图集';
                clr.style.borderColor = '#f3cdd1'; clr.style.color = '#d9434f';
                clr.addEventListener('click', function () { if (confirm('确认清空整个图集？')) { items = []; emit(); render(); } });
                tb.appendChild(clr);
            }
            var count = document.createElement('span');
            count.style.cssText = 'margin-left:auto;font-size:12px;color:#8590a6;align-self:center;';
            count.textContent = '共 ' + items.length + ' 张';
            tb.appendChild(count);
            wrap.appendChild(tb);

            var grid = document.createElement('div');
            grid.className = 'adv-gallery-grid';
            if (!items.length) {
                var tip = document.createElement('div');
                tip.className = 'adv-empty-tip';
                tip.style.gridColumn = '1 / -1';
                tip.textContent = '暂无图片。上方点击「+ 上传 / 选择图片」快速添加。留空则详情页使用默认封面。';
                grid.appendChild(tip);
            }
            items.forEach(function (it, i) {
                var cell = document.createElement('div');
                cell.className = 'adv-gallery-item';
                var th = document.createElement('div');
                th.className = 'adv-gallery-thumb';
                if (it.src) { th.style.backgroundImage = 'url("' + it.src + '")'; th.textContent = ''; }
                else { th.textContent = '点击换图'; }
                th.title = '点击更换图片';
                th.addEventListener('click', function () {
                    A.openImgPicker(function (src) { if (src) { it.src = src; emit(); render(); } });
                });
                cell.appendChild(th);

                var cap = document.createElement('input');
                cap.type = 'text'; cap.placeholder = '图片说明（可选）';
                cap.value = it.caption || '';
                cap.style.cssText = 'width:100%;padding:5px 8px;border:1px solid #dfe3ee;border-radius:6px;box-sizing:border-box;font-size:12px;';
                cap.addEventListener('input', function () { it.caption = cap.value; emit(); });
                cell.appendChild(cap);

                var act = document.createElement('div');
                act.className = 'adv-gallery-actions';
                if (i > 0) { var bu = document.createElement('button'); bu.className = 'b-up'; bu.textContent = '↑ 前移'; bu.addEventListener('click', function () { var t = items[i - 1]; items[i - 1] = items[i]; items[i] = t; emit(); render(); }); act.appendChild(bu); }
                if (i < items.length - 1) { var bd = document.createElement('button'); bd.className = 'b-down'; bd.textContent = '后移 ↓'; bd.addEventListener('click', function () { var t = items[i + 1]; items[i + 1] = items[i]; items[i] = t; emit(); render(); }); act.appendChild(bd); }
                var bu2 = document.createElement('button'); bu2.className = 'b-url'; bu2.textContent = '改URL';
                bu2.addEventListener('click', function () { var u = prompt('设置图片 URL', it.src || ''); if (u != null) { it.src = u.trim(); emit(); render(); } });
                act.appendChild(bu2);
                var del = document.createElement('button'); del.textContent = '删除'; del.addEventListener('click', function () { items.splice(i, 1); emit(); render(); });
                act.appendChild(del);
                cell.appendChild(act);

                grid.appendChild(cell);
            });
            wrap.appendChild(grid);

            var sw = document.createElement('div');
            sw.className = 'adv-switch-row';
            sw.style.padding = '0 12px 10px';
            sw.innerHTML = '<span>需要直接手写 JSON？</span><a data-raw>展开原始 JSON</a>';
            var raw = document.createElement('textarea');
            raw.className = 'adv-json-raw'; raw.style.cssText += 'margin:0 12px 10px;width:calc(100% - 24px);';
            raw.spellcheck = false; raw.placeholder = '例：[{"src":"assets/a.jpg","caption":"现场"}]';
            raw.value = JSON.stringify(items, null, 2);
            raw.addEventListener('change', function () {
                try {
                    var arr = JSON.parse(raw.value || '[]');
                    if (!Array.isArray(arr)) throw new Error('必须是数组');
                    items = arr.map(function (x) { return typeof x === 'string' ? { src: x, caption: '' } : (x || {}); });
                    emit(); render();
                } catch (e) { alert('JSON 格式有误：' + e.message); }
            });
            sw.querySelector('[data-raw]').addEventListener('click', function (e) {
                e.preventDefault();
                var on = raw.classList.toggle('on');
                e.currentTarget.textContent = on ? '收起原始 JSON' : '展开原始 JSON';
                if (on) raw.value = JSON.stringify(items, null, 2);
            });
            wrap.appendChild(sw);
            wrap.appendChild(raw);

            target.appendChild(wrap);
        }
        render();
        return {
            getValue: function () { return items.slice(); },
            setValue: function (v) { items = _arr(v).map(function (x) { return typeof x === 'string' ? { src: x, caption: '' } : (x || {}); }); emit(); render(); }
        };
    }

    // ---- 相关推荐选择器 ----
    function makeRelatedEditor(target, refObj, onChange, candidates, typeLabel) {
        injectAdvCss();
        if (!refObj) refObj = { relatedIds: [] };
        var ids = _arr(refObj.relatedIds).map(function (x) { return String(x); }).filter(Boolean);
        if (!Array.isArray(candidates)) candidates = [];
        function emit() { refObj.relatedIds = ids; if (onChange) try { onChange(ids); } catch (e) {} }
        function render() {
            target.innerHTML = '';
            var wrap = document.createElement('div');
            wrap.className = 'adv-editor';

            var tb = document.createElement('div');
            tb.className = 'adv-editor-toolbar';
            var lbl = document.createElement('span');
            lbl.style.cssText = 'font-size:12px;color:#6b7487;align-self:center;';
            lbl.textContent = '已选 ' + ids.length + ' 项 ' + (typeLabel ? ('· 候选：' + typeLabel) : '');
            tb.appendChild(lbl);
            var clr = document.createElement('button');
            clr.type = 'button'; clr.textContent = '清空选择';
            clr.style.marginLeft = 'auto';
            if (!ids.length) { clr.disabled = true; clr.style.opacity = '0.5'; clr.style.cursor = 'not-allowed'; }
            clr.addEventListener('click', function () { if (ids.length && confirm('确认清空相关推荐？')) { ids = []; emit(); render(); } });
            tb.appendChild(clr);
            wrap.appendChild(tb);

            var body = document.createElement('div');
            body.className = 'adv-related-wrap';

            var tip = document.createElement('div');
            tip.className = 'mini'; tip.style.marginBottom = '6px';
            tip.textContent = '勾选下方条目前的复选框即可加入「相关推荐」。系统会按你勾选的顺序在详情页右侧展示。';
            body.appendChild(tip);

            var pick = document.createElement('div');
            pick.className = 'adv-related-pick';
            if (!candidates.length) {
                var no = document.createElement('div');
                no.className = 'adv-empty-tip'; no.style.width = '100%';
                no.textContent = '当前还没有可推荐的条目，请先在列表中新增条目（新闻 / 风采 / 部门）。';
                pick.appendChild(no);
            }
            candidates.forEach(function (c) {
                var id = String(c.id || ''); if (!id) return;
                var lab = document.createElement('label');
                lab.title = c.subTitle || '';
                var cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = ids.indexOf(id) >= 0;
                cb.addEventListener('change', function () {
                    if (cb.checked) { if (ids.indexOf(id) < 0) ids.push(id); }
                    else { ids = ids.filter(function (x) { return x !== id; }); }
                    emit(); render();
                });
                lab.appendChild(cb);
                var txt = document.createElement('span');
                txt.textContent = (c.title || '未命名') + (c.tag ? '  ·' + c.tag : '') + (c.subTitle ? '  [' + c.subTitle + ']' : '');
                txt.style.maxWidth = '280px'; txt.style.overflow = 'hidden';
                txt.style.textOverflow = 'ellipsis'; txt.style.whiteSpace = 'nowrap';
                txt.style.display = 'inline-block';
                lab.appendChild(txt);
                pick.appendChild(lab);
            });
            body.appendChild(pick);

            if (ids.length) {
                var orderTip = document.createElement('div');
                orderTip.className = 'mini'; orderTip.style.marginTop = '10px';
                orderTip.textContent = '当前展示顺序（点击 × 可移除）：';
                body.appendChild(orderTip);
                var list = document.createElement('div');
                list.className = 'adv-related-list';
                ids.forEach(function (id, k) {
                    var c = candidates.find(function (x) { return String(x.id) === id; });
                    var tag = document.createElement('span');
                    tag.className = 'adv-related-tag';
                    var t = document.createElement('span');
                    t.textContent = (k + 1) + '. ' + (c ? (c.title || id) : id);
                    tag.appendChild(t);
                    if (k > 0) {
                        var up = document.createElement('button'); up.textContent = '↑'; up.title = '前移';
                        up.addEventListener('click', function (e) { e.stopPropagation(); var tmp = ids[k - 1]; ids[k - 1] = ids[k]; ids[k] = tmp; emit(); render(); });
                        tag.appendChild(up);
                    }
                    if (k < ids.length - 1) {
                        var dn = document.createElement('button'); dn.textContent = '↓'; dn.title = '后移';
                        dn.addEventListener('click', function (e) { e.stopPropagation(); var tmp = ids[k + 1]; ids[k + 1] = ids[k]; ids[k] = tmp; emit(); render(); });
                        tag.appendChild(dn);
                    }
                    var rm = document.createElement('button'); rm.textContent = '×'; rm.title = '移除';
                    rm.addEventListener('click', function () { ids.splice(k, 1); emit(); render(); });
                    tag.appendChild(rm);
                    list.appendChild(tag);
                });
                body.appendChild(list);
            }

            wrap.appendChild(body);

            var sw = document.createElement('div');
            sw.className = 'adv-switch-row';
            sw.style.padding = '0 12px 10px';
            sw.innerHTML = '<span>需要直接手写 JSON？</span><a data-raw>展开原始 JSON</a>';
            var raw = document.createElement('textarea');
            raw.className = 'adv-json-raw'; raw.style.cssText += 'margin:0 12px 10px;width:calc(100% - 24px);min-height:80px;';
            raw.spellcheck = false; raw.placeholder = '例：["n-4", "n-7"]';
            raw.value = JSON.stringify(ids, null, 2);
            raw.addEventListener('change', function () {
                try {
                    var arr = JSON.parse(raw.value || '[]');
                    if (!Array.isArray(arr)) throw new Error('必须是字符串数组');
                    ids = arr.map(function (x) { return String(x); }).filter(Boolean);
                    emit(); render();
                } catch (e) { alert('JSON 格式有误：' + e.message); }
            });
            sw.querySelector('[data-raw]').addEventListener('click', function (e) {
                e.preventDefault();
                var on = raw.classList.toggle('on');
                e.currentTarget.textContent = on ? '收起原始 JSON' : '展开原始 JSON';
                if (on) raw.value = JSON.stringify(ids, null, 2);
            });
            wrap.appendChild(sw);
            wrap.appendChild(raw);

            target.appendChild(wrap);
        }
        render();
        return {
            getValue: function () { return ids.slice(); },
            setValue: function (v) { ids = _arr(v).map(function (x) { return String(x); }).filter(Boolean); emit(); render(); }
        };
    }

    /* login.html 的自动启动 */
    ready(function () {
        if (isLoginPage()) { bootLoginPage(); refreshQuota(); }
    });
})();
