/*!
 * Supabase 客户端初始化（通过 CDN 懒加载 @supabase/supabase-js）
 * 说明：ANON_KEY + URL 会在部署时注入；如果未注入，window.SB 会以"离线模式"运行，
 *       所有读写仅走 localStorage，保证后台仍然可用。
 */
(function () {
  // ═══════════════════════════════════════════════════════════
  // 部署配置 · 四川化工职业技术学院药环学院学生会项目
  // ═══════════════════════════════════════════════════════════
  var SUPABASE_URL      = 'https://wutrdznstypknwwihdjm.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_G5uPKrXlkj_PLcQLnIN5kw_M8DfMFDN';

  var CONFIGURED = !!(SUPABASE_URL && !SUPABASE_URL.includes('REPLACE_ME')
                   && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('REPLACE_ME'));

  var sbClient = null;
  var readyPromise = null;

  function loadCdnScript(callback) {
    if (window.supabase) { callback(window.supabase); return; }
    var s = document.createElement('script');
    s.src   = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/dist/umd/supabase.min.js';
    s.async = false;
    s.onload = function () { callback(window.supabase); };
    s.onerror = function () {
      console.warn('[SB] Supabase CDN 加载失败，进入离线模式（仅 localStorage）');
      callback(null);
    };
    (document.head || document.documentElement).appendChild(s);
  }

  function init() {
    if (readyPromise) return readyPromise;
    readyPromise = new Promise(function (resolve) {
      if (!CONFIGURED) {
        console.info('[SB] 未配置 URL/ANON_KEY，运行在 离线模式（仅 localStorage）。部署后填入真实 key 即可启用云端同步。');
        sbClient = null; resolve(null); return;
      }
      loadCdnScript(function (sbMod) {
        if (!sbMod) { sbClient = null; resolve(null); return; }
        try {
          sbClient = sbMod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { persistSession: false, autoRefreshToken: false }
          });
          resolve(sbClient);
        } catch (e) {
          console.error('[SB] 初始化失败：', e);
          sbClient = null; resolve(null);
        }
      });
    });
    return readyPromise;
  }

  /* =========================================================
   *  工具：把 PostgreSQL snake_case 行对象 转 camelCase
   * ========================================================= */
  function toCamel(o) {
    if (o === null || o === undefined) return o;
    if (Array.isArray(o)) return o.map(toCamel);
    if (typeof o !== 'object') return o;
    var r = {};
    for (var k in o) {
      if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
      var nk = k.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); });
      r[nk] = toCamel(o[k]);
    }
    return r;
  }

  /* =========================================================
   *  API：cms_store — 走 schema.sql 里的 cms_get / cms_put(jsonb) RPC
   * ========================================================= */
  /**
   * 带超时的 Promise 包装
   */
  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('请求超时（' + ms + 'ms）')); }, ms);
      promise.then(
        function (v) { clearTimeout(timer); resolve(v); },
        function (e) { clearTimeout(timer); reject(e); }
      );
    });
  }

  /**
   * 读取整站 CMS
   * @returns {Promise<{site,slides,stats,about,structure,news,showcase,shortcuts,contact,updatedAt,id}|null>}
   */
  async function loadCMS() {
    try {
      var client = await init(); if (!client) return null;
      var { data, error } = await withTimeout(
        client.rpc('cms_get', {}),
        10000  // 10 秒超时
      );
      if (error) {
        // ERR_ABORTED / Failed to fetch → 网络问题，降级为 warn
        var msg = (error && error.message) || String(error || '');
        if (msg.indexOf('ABORTED') >= 0 || msg.indexOf('Failed to fetch') >= 0 || msg.indexOf('ERR_') >= 0) {
          console.warn('[SB] 云端数据读取中断（网络问题），使用本地缓存数据', msg.substring(0, 80));
        } else {
          console.warn('[SB] loadCMS 出错：', msg.substring(0, 80));
        }
        return null;
      }
      if (!data) return null;
    // cms_get 返回 jsonb：{id,site,slides,stats,about,structure,news,showcase,shortcuts,contact,updated_at}
    var row = typeof data === 'string' ? JSON.parse(data) : data;
    // 归一化 shortcuts：旧格式为数组，新格式为 {heading, subheading, items}
    var sc = row.shortcuts;
    if (Array.isArray(sc)) { sc = { heading: '快捷入口', subheading: 'Quick Links', items: sc }; }
    else if (!sc || typeof sc !== 'object') { sc = { heading: '快捷入口', subheading: 'Quick Links', items: [] }; }
    else if (!sc.items) { sc.items = []; }

    // 归一化 contact：确保有 infos 数组（旧格式只有 info 单字符串时自动转换）
    var ct = row.contact || {};
    if (ct.info && !ct.infos) {
      ct.infos = [{ icon: '📍', label: '联系信息', value: ct.info }];
    }
    if (!Array.isArray(ct.infos)) ct.infos = [];
    if (!ct.heading) ct.heading = '';
    if (!ct.subheading) ct.subheading = '';
    return {
      id:        row.id,
      site:      row.site      || {},
      slides:    row.slides    || [],
      stats:     row.stats     || [],
      about:     row.about     || {},
      structure: row.structure || {},
      news:      row.news      || {},
      showcase:  row.showcase  || {},
      shortcuts: sc,
      contact:   ct,
      updatedAt: row.updated_at || row.updatedAt || null
    };
    } catch (e) {
      console.warn('[SB] loadCMS 异常（使用本地数据）：', (e && e.message) || e);
      return null;
    }
  }

  /**
   * 保存整站 CMS（通过 RPC cms_put(jsonb) 原子写入单行）
   */
  async function saveCMS(d) {
    d = d || {};
    try {
      var client = await init(); if (!client) return { ok: false, offline: true };
      // contact_messages 表独立存储，cms_store.contact 只保留 { info }
      // 归一化 shortcuts：确保始终为对象格式
      var sc2 = d.shortcuts;
      if (Array.isArray(sc2)) { sc2 = { heading: '快捷入口', subheading: 'Quick Links', items: sc2 }; }
      else if (!sc2 || typeof sc2 !== 'object') { sc2 = { heading: '快捷入口', subheading: 'Quick Links', items: [] }; }
      else if (!sc2.items) { sc2.items = Array.isArray(sc2.items) ? sc2.items : []; }
      var payload = {
        site:      d.site      || {},
        slides:    d.slides    || [],
        stats:     d.stats     || [],
        about:     d.about     || {},
        structure: d.structure || {},
        news:      d.news      || {},
        showcase:  d.showcase  || {},
        shortcuts: sc2,
        // 保存 contact 完整结构（heading/subheading/infos/map 等），
        // 但留言(messages) 存独立表，不写入 cms_store
        contact:   d.contact ? (function (c) {
          var out = {};
          if (c.heading !== undefined) out.heading = c.heading;
          if (c.subheading !== undefined) out.subheading = c.subheading;
          if (c.desc !== undefined) out.desc = c.desc;
          if (c.mapUrl !== undefined) out.mapUrl = c.mapUrl;
          if (c.lat !== undefined) out.lat = c.lat;
          if (c.lng !== undefined) out.lng = c.lng;
          if (c.infos !== undefined) out.infos = c.infos;
          if (c.formSubjects !== undefined) out.formSubjects = c.formSubjects;
          // 兼容旧格式：如果只有 contact.info（单字符串），也保留
          if (c.info !== undefined && !c.infos) {
            // 旧格式转成新格式 infos
            out.infos = [{ icon: '📍', label: '联系信息', value: c.info }];
          }
          return out;
        })(d.contact) : {}
      };
      var { data, error } = await withTimeout(
        client.rpc('cms_put', { args: payload }),
        15000  // 15 秒超时
      );
      if (error) {
        console.warn('[SB] saveCMS 失败：', (error.message || '').substring(0, 120));
        return { ok: false, error: error };
      }
      return { ok: true, updatedAt: data && (data.updated_at || data.updatedAt) || null };
    } catch (e) {
      console.warn('[SB] saveCMS 异常：', (e && e.message) || e);
      return { ok: false, error: e };
    }
  }

  /* =========================================================
   *  API：contact_messages — 走 message_get_list / message_upsert / message_delete
   * ========================================================= */
  /**
   * 列出全部留言（按 createdAt 倒序，字段：id/name/phone/subject/message/read/createdAt）
   */
  async function listMessages() {
    var client = await init(); if (!client) return null;
    var { data, error } = await client.rpc('message_get_list', {});
    if (error) { console.error('[SB] listMessages：', error); return null; }
    var arr = (typeof data === 'string') ? JSON.parse(data) : (data || []);
    if (!Array.isArray(arr)) arr = [];
    return arr.map(function (m) { return toCamel(m); });
  }

  /**
   * 插入新留言（C3 script.js 直接用 msgPayload = {id,name,phone,subject,message,read,createdAt}）
   */
  async function insertMessage(msg) {
    msg = msg || {};
    var client = await init(); if (!client) return { ok: false, offline: true };
    var mid = msg.id || ('msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
    var { data, error } = await client.rpc('message_upsert', {
      mid:       mid,
      mname:     msg.name    || '匿名用户',
      mphone:    msg.phone   || msg.contact || '',
      msubject:  msg.subject || '其他',
      mmessage:  msg.message || msg.content || '',
      mread:     !!msg.read
    });
    if (error) { console.error('[SB] insertMessage：', error); return { ok: false, error: error }; }
    return { ok: true, id: mid, mode: (data && (data.mode || data && data.mode)) || 'insert' };
  }

  /**
   * 修改留言（C4 admin.js 用：SB.updateMessage(id, {read:true/false})）
   */
  async function updateMessage(id, patch) {
    if (!id) return { ok: false, error: 'missing id' };
    patch = patch || {};
    var client = await init(); if (!client) return { ok: false, offline: true };
    var params = { mid: id };
    if ('read' in patch) params.mread = !!patch.read;
    if ('name' in patch) params.mname = patch.name;
    if ('phone' in patch) params.mphone = patch.phone;
    if ('subject' in patch) params.msubject = patch.subject;
    if ('message' in patch) params.mmessage = patch.message;
    var { error } = await client.rpc('message_upsert', params);
    if (error) { console.error('[SB] updateMessage：', error); return { ok: false, error: error }; }
    return { ok: true };
  }

  /**
   * 删除单条留言
   */
  async function deleteMessage(id) {
    if (!id) return { ok: false };
    var client = await init(); if (!client) return { ok: false, offline: true };
    var { error } = await client.rpc('message_delete', { mid: id });
    if (error) { console.error('[SB] deleteMessage：', error); return { ok: false, error: error }; }
    return { ok: true };
  }

  /* --- 兼容旧接口名（admin-common.js 早期/其他脚本没改全的情况） --- */
  function markMessage(id, read) { return updateMessage(id, { read: !!read }); }
  async function markAllRead() {
    var list = await listMessages();
    if (!list) return { ok: false };
    var ok = 0;
    for (var i = 0; i < list.length; i++) {
      if (!list[i].read) { var r = await markMessage(list[i].id, true); if (r && r.ok) ok++; }
    }
    return { ok: true, updated: ok };
  }
  async function deleteAllMessages() {
    var list = await listMessages();
    if (!list) return { ok: false };
    var ok = 0;
    for (var i = 0; i < list.length; i++) {
      var r = await deleteMessage(list[i].id); if (r && r.ok) ok++;
    }
    return { ok: true, deleted: ok };
  }

  /* =========================================================
   *  API：admin_users — 走 user_get_hash / user_login_touch / user_list / user_upsert RPC
   * ========================================================= */
  async function listUsers() {
    var client = await init(); if (!client) return null;
    var { data, error } = await client.rpc('user_list', {});
    if (error) { console.error('[SB] listUsers：', error); return null; }
    var arr = (typeof data === 'string') ? JSON.parse(data) : (data || []);
    if (!Array.isArray(arr)) arr = [];
    return arr.map(toCamel);
  }

  /**
   * 通过用户名取密码哈希+角色+上次登录（登录校验用）
   */
  async function getUserHash(username) {
    var client = await init(); if (!client) return null;
    var { data, error } = await client.rpc('user_get_hash', { uname: String(username || '') });
    if (error) { console.error('[SB] getUserHash：', error); return null; }
    var u = (typeof data === 'string') ? JSON.parse(data) : data;
    if (!u || !u.username) return null;
    return {
      username: u.username,
      password: u.password || '',   // 密码哈希（sha1 加盐）
      role:     u.role || 'editor',
      lastLogin: u.lastLogin || u.last_login || null
    };
  }

  /**
   * 登录成功后 touch 一下 last_login
   */
  async function loginTouch(username) {
    var client = await init(); if (!client) return { ok: false };
    var { error } = await client.rpc('user_login_touch', { uname: String(username || '') });
    if (error) { console.error('[SB] loginTouch：', error); return { ok: false, error: error }; }
    return { ok: true };
  }

  /**
   * 新建/修改账号（密码哈希，非明文）
   */
  async function upsertUser(user /* {username,password,role,pwChanged} */) {
    user = user || {};
    if (!user.username) return { ok: false, error: 'username missing' };
    var client = await init(); if (!client) return { ok: false, offline: true };
    var urole = user.role || 'editor';
    var pwdhash = (user.pwChanged || !user.password) ? (user.password || '') : null;
    var { error } = await client.rpc('user_upsert', {
      uname:   user.username,
      pwdhash: pwdhash,
      urole:   urole
    });
    if (error) { console.error('[SB] upsertUser：', error); return { ok: false, error: error }; }
    return { ok: true };
  }

  /* =========================================================
   *  API：admin_logs — 走 log_append / log_list RPC
   * ========================================================= */
  async function appendLog(entry /* {username, action, detail} */) {
    entry = entry || {};
    var client = await init(); if (!client) return { ok: false, offline: true };
    try {
      var { error } = await client.rpc('log_append', {
        uname: entry.username || 'system',
        act:   entry.action   || '',
        dtail: entry.detail   || ''
      });
      if (error) {
        // 日志写入失败不影响核心功能，只在调试时提示
        if (window.__SB_DEBUG__) console.warn('[SB] appendLog：', error);
        return { ok: false, error: error };
      }
    } catch (e) {
      if (window.__SB_DEBUG__) console.warn('[SB] appendLog 异常：', e && e.message);
      return { ok: false, error: e };
    }
    return { ok: true };
  }
  async function listLogs(limit) {
    limit = limit || 200;
    var client = await init(); if (!client) return null;
    var { data, error } = await client.rpc('log_list', { l: Math.max(1, Math.min(limit | 0, 2000)) });
    if (error) { console.error('[SB] listLogs：', error); return null; }
    var arr = (typeof data === 'string') ? JSON.parse(data) : (data || []);
    if (!Array.isArray(arr)) arr = [];
    return arr.map(toCamel);
  }

  /* =========================================================
   *  挂载到 window.SB
   * ========================================================= */
  window.SB = {
    configured: CONFIGURED,
    client: function () { return sbClient; },
    ready: init,
    /* CMS */
    loadCMS: loadCMS,
    saveCMS: saveCMS,
    /* Messages（主要接口：C3/C4 对齐） */
    listMessages:    listMessages,
    insertMessage:   insertMessage,
    updateMessage:   updateMessage,   // 推荐：SB.updateMessage(id, {read:true})
    deleteMessage:   deleteMessage,
    /* Messages（兼容别名，避免老代码未改全） */
    markMessage:     markMessage,
    markAllRead:     markAllRead,
    deleteAllMessages: deleteAllMessages,
    /* Admin users */
    listUsers:    listUsers,
    getUserHash:  getUserHash,
    loginTouch:   loginTouch,
    upsertUser:   upsertUser,
    /* Logs */
    appendLog: appendLog,
    listLogs:  listLogs
  };

  // 立刻开始 CDN 懒加载（首次用到时就已经 ready）
  init().then(function () {
    try { window.dispatchEvent(new CustomEvent('sb:ready')); } catch(e) {}
  });
})();
