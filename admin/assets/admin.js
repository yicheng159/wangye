/* =============================================================
 * 学生会 CMS · admin.js
 * 精简版：仅保留 11 个模块渲染函数，挂到全局 window.ADMIN_RENDERS
 * 所有公共工具、存储、Shell、启动流程在 admin-common.js 的 window.ADMIN 中
 * ============================================================= */
(function () {
    'use strict';

    var A = window.ADMIN;
    if (!A) { throw new Error('请先引入 admin-common.js（window.ADMIN 不存在）'); }

    /* 简便别名 */
    var $       = A.$;
    var escHtml = A.escHtml;
    var escAttr = A.escAttr;
    var toast   = A.toast;
    var TABS    = A.TABS;

    function cms() { return A.currentCMS; } // 每次调用都获取最新引用（reset 之后会变）

    /* ---------- 辅助：构建相关推荐候选列表 ---------- */
    function buildNewsCandidates(d, excludeIdx) {
        return (d.news && d.news.items || []).filter(function (x, k) { return k !== excludeIdx; }).map(function (x) {
            return { id: x.id, title: x.title, tag: x.category, subTitle: (x.date || '') + ' · ' + (x.source || '') };
        });
    }
    function buildShowcaseCandidates(d, excludeIdx) {
        return (d.showcase && d.showcase.items || []).filter(function (x, k) { return k !== excludeIdx; }).map(function (x) {
            return { id: x.id, title: x.title, tag: x.tag, subTitle: (x.date || '') + ' · ' + (x.location || '') };
        });
    }
    function buildDeptCandidates(d, excludeIdx) {
        return (d.structure && d.structure.depts || []).filter(function (x, k) { return k !== excludeIdx; }).map(function (x) {
            return { id: x.id, title: x.name, tag: '部门', subTitle: (x.chair || '') + ' · ' + (x.size || '') };
        });
    }
    function buildAllCandidates(d, excludeNewsIdx, excludeScIdx, excludeDeptIdx) {
        return [].concat(
            buildNewsCandidates(d, excludeNewsIdx),
            buildShowcaseCandidates(d, excludeScIdx),
            buildDeptCandidates(d, excludeDeptIdx)
        );
    }
    // 部门详情页相关推荐：新闻 + 风采 + 其他部门
    function buildRelatedCandidatesForDept(d) {
        return buildAllCandidates(d, -1, -1, -1);
    }

    /* =======================================================
     * renderDashboard
     * ===================================================== */
    function renderDashboard(box) {
        var d = cms();
        var overview = document.createElement('div');
        overview.className = 'dash-stats';
        var counts = [
            { cls: 's1', label: '轮播幻灯片', num: d.slides.length, trend: '首页 Banner' },
            { cls: 's2', label: '部门数量',   num: d.structure.depts.length, trend: '组织架构' },
            { cls: 's3', label: '新闻活动',   num: d.news.items.length, trend: '其中推荐 ' + d.news.items.filter(function(n){return n.featured;}).length + ' 篇' },
            { cls: 's4', label: '风采展示',   num: d.showcase.items.length, trend: '展示图片 / 活动卡' }
        ];
        counts.forEach(function (s) {
            var el = document.createElement('div');
            el.className = 'dash-stat ' + s.cls;
            el.innerHTML = '<div class="label">' + escHtml(s.label) + '</div>'
                + '<div class="num">' + escHtml(String(s.num)) + '</div>'
                + '<div class="trend">' + escHtml(s.trend) + '</div>';
            overview.appendChild(el);
        });
        box.appendChild(overview);

        var grid = document.createElement('div');
        grid.className = 'dash-grid';
        box.appendChild(grid);

        // 左：快速操作 → 链接改为独立 HTML 页面
        var leftCard = document.createElement('div');
        leftCard.className = 'admin-card';
        leftCard.innerHTML = '<div class="admin-card-head"><div><h3>快速操作</h3><div class="desc">跳转到常用管理模块，一键编辑对应内容。</div></div></div>';
        var qa = document.createElement('div');
        qa.className = 'quick-actions';
        var quicks = [
            { id:'slides',    label:'轮播图' },
            { id:'news',      label:'新闻活动' },
            { id:'structure', label:'部门架构' },
            { id:'showcase',  label:'风采展示' },
            { id:'stats',     label:'数据统计' },
            { id:'about',     label:'关于我们' },
            { id:'contact',   label:'联系我们' },
            { id:'site',      label:'站点设置' }
        ].map(function (q) { return { id:q.id, label:q.label, icon: TABS[q.id].icon }; });
        quicks.forEach(function (q) {
            var a = document.createElement('a');
            a.href = TABS[q.id].href;
            a.className = 'quick-btn';
            a.innerHTML = q.icon + '<span>' + escHtml(q.label) + '</span>';
            qa.appendChild(a);
        });
        leftCard.appendChild(qa);
        grid.appendChild(leftCard);

        // 右：最近操作日志
        var rightCard = document.createElement('div');
        rightCard.className = 'admin-card';
        rightCard.innerHTML = '<div class="admin-card-head"><div><h3>最近操作记录</h3><div class="desc">登录、保存、重置等操作将在此处留痕（本地记录）。</div></div></div>';
        var logs = [];
        try { logs = JSON.parse(localStorage.getItem(A.CONSTANTS.LOG_KEY) || '[]'); } catch(e) {}
        var table = document.createElement('table');
        table.className = 'admin-table';
        table.innerHTML = '<thead><tr><th style="width:72px;">类型</th><th>内容</th><th style="width:160px;">时间</th></tr></thead>';
        var tb = document.createElement('tbody');
        if (!logs.length) {
            tb.innerHTML = '<tr><td colspan="3" style="color:#868c98;text-align:center;padding:24px;">暂无记录</td></tr>';
        } else {
            logs.slice(0, 12).forEach(function (l) {
                var tr = document.createElement('tr');
                var typeCls = l.type === 'SAVE' ? 'success' : (l.type === 'RESET' ? 'danger' : (l.type === 'LOGIN' ? 'accent' : 'primary'));
                tr.innerHTML = '<td><span class="badge ' + typeCls + '">' + escHtml(l.type || '-') + '</span></td>'
                    + '<td>' + escHtml(l.msg || '') + '</td>'
                    + '<td style="color:#868c98;">' + new Date(l.at).toLocaleString('zh-CN') + '</td>';
                tb.appendChild(tr);
            });
        }
        table.appendChild(tb);
        rightCard.appendChild(table);
        grid.appendChild(rightCard);
    }

    /* =======================================================
     * renderSlides
     * ===================================================== */
    function renderSlides(box) {
        var d = cms();
        A.renderReorderList(box, {
            items: d.slides,
            cardName: '幻灯片',
            addLabel: '新增幻灯片',
            minItems: 1,
            maxItems: 8,
            addEmpty: function () {
                return {
                    title: '新幻灯片标题', accent: '副标题强调',
                    subtitle: '请在此处填入一句话描述',
                    bg: 'assets/hero-banner.jpg',
                    overlayFrom: 'rgba(11,61,145,0.55)', overlayTo: 'rgba(46,125,50,0.35)'
                };
            },
            renderCard: function (s, i) {
                return '<div class="title">' + escHtml(s.title || '')
                    + (s.accent ? ' <span style="color:#D4A853;">· ' + escHtml(s.accent) + '</span>' : '')
                    + '</div>'
                    + '<div class="meta"><span class="badge accent">第 ' + (i + 1) + ' 屏</span>　' + escHtml(s.subtitle || '') + '</div>'
                    + '<div style="margin-top:10px;display:flex;gap:12px;align-items:flex-start;">'
                    +   '<div class="slide-thumb" style="max-width:260px;aspect-ratio:16/9;">'
                    +     '<div class="thumb-bg" style="background-image:url(\'' + escHtml(s.bg || '') + '\');"></div>'
                    +     '<div class="thumb-overlay" style="background:linear-gradient(135deg,' + (s.overlayFrom || '') + ',' + (s.overlayTo || '') + ');">'
                    +       '<div class="t-title">' + escHtml(s.title || '') + '</div>'
                    +       (s.accent ? '<div class="t-title t-accent" style="font-size:16px;">' + escHtml(s.accent) + '</div>' : '')
                    +       (s.subtitle ? '<div class="t-sub">' + escHtml(s.subtitle) + '</div>' : '')
                    +     '</div>'
                    +   '</div>'
                    +   '<div style="flex:1;font-size:12.5px;color:#5a606d;">'
                    +     '<div>背景图：<code style="background:#f1f3f7;padding:2px 6px;border-radius:4px;">' + escHtml(s.bg || '') + '</code></div>'
                    +   '</div>'
                    + '</div>';
            },
            renderForm: function (s, i) {
                return ''
                    + '<div class="form-row">'
                    +   '<div class="form-group col-8" style="grid-column: span 8;"><label>主标题</label><input type="text" data-bind="slides.' + i + '.title" placeholder="如：四川化工职业技术学院"></div>'
                    +   '<div class="form-group col-4" style="grid-column: span 4;"><label>强调副标题（金色）</label><input type="text" data-bind="slides.' + i + '.accent"></div>'
                    + '</div>'
                    + '<div class="form-group"><label>描述文案</label><input type="text" data-bind="slides.' + i + '.subtitle"></div>'
                    + '<div class="form-group">'
                    +   '<label>背景图</label>'
                    +   '<div class="img-field">'
                    +     '<input type="text" data-bind="slides.' + i + '.bg" placeholder="图片 URL 或相对路径">'
                    +     '<div class="img-thumb-sm" id="slideThumb_' + i + '" style="background-image:url(\'' + escHtml(s.bg || '') + '\');"></div>'
                    +     '<button type="button" class="btn btn-outline btn-sm" data-imgbtn="slides.' + i + '.bg">选择图片</button>'
                    +   '</div>'
                    +   '<div class="form-hint">建议尺寸 1920 × 1080（16:9）；上传图片会自动压缩。</div>'
                    + '</div>'
                    + '<div class="form-row">'
                    +   '<div class="form-group col-6" style="grid-column: span 6;"><label>遮罩起始色</label><div class="color-row"><input type="color" data-color-i="' + i + '" data-color-k="overlayFrom" value="' + escHtml(A.rgbaToHex(s.overlayFrom) || '#0B3D91') + '"><input type="text" data-bind="slides.' + i + '.overlayFrom" placeholder="rgba(11,61,145,0.55)"></div></div>'
                    +   '<div class="form-group col-6" style="grid-column: span 6;"><label>遮罩结束色</label><div class="color-row"><input type="color" data-color-i="' + i + '" data-color-k="overlayTo" value="' + escHtml(A.rgbaToHex(s.overlayTo) || '#2E7D32') + '"><input type="text" data-bind="slides.' + i + '.overlayTo" placeholder="rgba(46,125,50,0.35)"></div></div>'
                    + '</div>';
            },
            onAfterEdit: function (formEl, item, idx) {
                A.bindFormToObj(formEl, d);
                var imgBtn = formEl.querySelector('[data-imgbtn]');
                if (imgBtn) {
                    var p = imgBtn.getAttribute('data-imgbtn');
                    A.makeImgBtn(imgBtn, d, p, function (src) {
                        var t = formEl.querySelector('#slideThumb_' + idx);
                        if (t) t.style.backgroundImage = 'url("' + src + '")';
                    });
                }
                formEl.querySelectorAll('input[type=color][data-color-k]').forEach(function (c) {
                    var k = c.getAttribute('data-color-k');
                    c.addEventListener('input', function () {
                        var old = item[k] || '';
                        var m = old.match(/rgba?\([^)]*,([\d.]+)\s*\)$/);
                        var al = m ? parseFloat(m[1]) : 0.5;
                        item[k] = A.hexToRgba(c.value, al);
                        var tx = formEl.querySelector('[data-bind="slides.' + idx + '.' + k + '"]');
                        if (tx) tx.value = item[k];
                    });
                });
            }
        });
    }

    /* =======================================================
     * renderStats
     * ===================================================== */
    function renderStats(box) {
        var d = cms();
        A.renderReorderList(box, {
            items: d.stats,
            cardName: '统计项',
            addLabel: '新增统计项',
            minItems: 1,
            maxItems: 10,
            addEmpty: function () {
                return { value: 100, suffix: '+', label: '新统计', icon: '🎯', color: '#2E7D32' };
            },
            renderCard: function (s) {
                return '<div class="title" style="display:flex;align-items:center;gap:10px;">'
                    + '<span style="width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;background:' + escHtml(s.color || '#eee') + ';color:#fff;font-size:18px;">' + escHtml(s.icon || '📊') + '</span>'
                    + '<span>' + escHtml(s.label || '') + '</span></div>'
                    + '<div class="meta">展示值：<strong style="color:#0B3D91;">' + escHtml(String(s.value || 0)) + '</strong> ' + escHtml(s.suffix || '') + '　主题色：' + escHtml(s.color || '') + '</div>';
            },
            renderForm: function (s, i) {
                return '<div class="form-row">'
                    +   '<div class="form-group col-3" style="grid-column: span 3;"><label>数值（整数）</label><input type="number" data-bind="stats.' + i + '.value" min="0"></div>'
                    +   '<div class="form-group col-3" style="grid-column: span 3;"><label>数值后缀</label><input type="text" data-bind="stats.' + i + '.suffix" placeholder="如：+  %  人  个"></div>'
                    +   '<div class="form-group col-3" style="grid-column: span 3;"><label>图标（Emoji 或符号）</label><input type="text" data-bind="stats.' + i + '.icon" placeholder="如：🏆"></div>'
                    +   '<div class="form-group col-3" style="grid-column: span 3;"><label>主题色</label><div class="color-row"><input type="color" data-color-target="stats.' + i + '.color" value="' + escHtml(s.color || '#2E7D32') + '"><input type="text" data-bind="stats.' + i + '.color" placeholder="#2E7D32"></div></div>'
                    + '</div>'
                    + '<div class="form-group"><label>显示文字（标签）</label><input type="text" data-bind="stats.' + i + '.label" placeholder="如：成员人数"></div>';
            },
            onAfterEdit: function (formEl) {
                A.bindFormToObj(formEl, d);
                formEl.querySelectorAll('input[type=color][data-color-target]').forEach(function (c) {
                    c.addEventListener('input', function () {
                        var p = c.getAttribute('data-color-target');
                        A.setPath(d, p, c.value);
                        var textField = formEl.querySelector('[data-bind="' + p + '"]');
                        if (textField) textField.value = c.value;
                    });
                });
            }
        });
    }

    /* =======================================================
     * renderAbout
     * ===================================================== */
    function renderAbout(box) {
        var d = cms();
        var card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = '<div class="admin-card-head"><div><h3>关于我们 · 基础信息</h3><div class="desc">展示于首页「关于我们」板块的标题、简述与多段介绍。</div></div></div>';
        var body = document.createElement('div');
        body.innerHTML = ''
            + '<div class="form-group"><label>板块主标题</label><input type="text" data-bind="about.heading"></div>'
            + '<div class="form-group"><label>板块副标题 / 英文标语</label><input type="text" data-bind="about.subheading"></div>'
            + '<div class="form-group"><label>引导简述</label><textarea rows="2" data-bind="about.lead"></textarea></div>'
            + '<div class="form-group"><label>使命（Mission）</label><textarea rows="3" data-bind="about.mission"></textarea></div>'
            + '<div class="form-group"><label>愿景（Vision）</label><textarea rows="3" data-bind="about.vision"></textarea></div>'
            + '<div class="form-group"><label>核心价值观（多个短语，用中文顿号或英文逗号分隔）</label><input type="text" data-bind="about.values"></div>';
        card.appendChild(body);
        box.appendChild(card);
        A.bindFormToObj(card, d);

        var parasCard = document.createElement('div');
        parasCard.className = 'admin-card';
        parasCard.innerHTML = '<div class="admin-card-head"><div><h3>组织介绍（多段正文）</h3><div class="desc">首页在核心使命/愿景之后展示的正文段落。</div></div></div>';
        box.appendChild(parasCard);

        A.renderReorderList(parasCard, {
            items: d.about.paragraphs,
            cardName: '段落',
            addLabel: '新增段落',
            minItems: 0,
            maxItems: 10,
            addEmpty: function () { return '请在此输入新段落的正文内容…'; },
            renderCard: function (p) {
                return '<div class="title">' + escHtml(String(p || '').slice(0, 80)) + (String(p || '').length > 80 ? '…' : '') + '</div>'
                     + '<div class="meta">段落内容共 ' + String(p || '').length + ' 字</div>';
            },
            renderForm: function (p, i) {
                return '<div class="form-group"><label>段落内容</label><textarea rows="4" data-bind="about.paragraphs.' + i + '"></textarea></div>';
            },
            onAfterEdit: function (formEl) { A.bindFormToObj(formEl, d); }
        });
    }

    /* =======================================================
     * renderStructure
     * ===================================================== */
    function renderStructure(box) {
        var d = cms();
        var ICON_CHOICES = ['📋','📢','🧩','📚','🎨','🏆','💡','🌱','📱','🤝','📝','🧑‍🏫'];
        // 标题
        var headCard = document.createElement('div');
        headCard.className = 'admin-card';
        headCard.innerHTML = '<div class="admin-card-head"><div><h3>组织架构 · 标题</h3><div class="desc">部门列表上方的板块标题与说明文案。</div></div></div>';
        var b = document.createElement('div');
        b.innerHTML = '<div class="form-row">'
            + '<div class="form-group col-8" style="grid-column:span 8;"><label>主标题</label><input type="text" data-bind="structure.heading"></div>'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>副标题 / 英文标语</label><input type="text" data-bind="structure.subheading"></div>'
            + '</div>';
        headCard.appendChild(b);
        box.appendChild(headCard);
        A.bindFormToObj(headCard, d);

        // 届次横幅
        var termCard = document.createElement('div');
        termCard.className = 'admin-card';
        termCard.innerHTML = '<div class="admin-card-head"><div><h3>届次横幅</h3><div class="desc">组织架构板块顶部显示"第十二届 / 学年 / 口号 / 人数统计"，请按实际任职届次填写。「主席团 / 部门数量 / 总人数」可留空，将根据部门自动汇总。</div></div></div>';
        var tb = document.createElement('div');
        tb.innerHTML = '<div class="form-row">'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>届次（如：第十二届）</label><input type="text" data-bind="structure.term.congressNo" placeholder="第十二届"></div>'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>学年（如：2025—2026 学年）</label><input type="text" data-bind="structure.term.academicYear" placeholder="2025—2026 学年"></div>'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>本届口号</label><input type="text" data-bind="structure.term.slogan" placeholder="服务同学 · 引领成长 · 追求卓越 · 共创未来"></div>'
            + '</div>'
            + '<div class="form-row">'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>主席团人数（留空=自动）</label><input type="text" data-bind="structure.term.presidiumCount" placeholder="例：5 人"></div>'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>部门数量（留空=自动）</label><input type="text" data-bind="structure.term.deptCount" placeholder="例：9 个"></div>'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>总人数（留空=自动）</label><input type="text" data-bind="structure.term.totalSize" placeholder="例：106 人"></div>'
            + '</div>';
        termCard.appendChild(tb);
        box.appendChild(termCard);
        A.bindFormToObj(termCard, d);

        // 主席团
        var presCard = document.createElement('div');
        presCard.className = 'admin-card';
        presCard.innerHTML = '<div class="admin-card-head"><div><h3>主席团成员</h3><div class="desc">每位成员将在首页显示为独立卡片（头像首字 / 职务 / 姓名 / 班级）。</div></div></div>';
        box.appendChild(presCard);
        A.renderReorderList(presCard, {
            items: d.structure.term.presidium,
            cardName: '主席团成员',
            addLabel: '新增主席团成员',
            minItems: 0,
            maxItems: 12,
            addEmpty: function () { return { title: '主席团成员', name: '新成员', className: '', photo: '' }; },
            renderCard: function (p) {
                var pic = '';
                if (p.photo) pic = '<img src="' + escHtml(p.photo) + '" style="width:42px;height:42px;border-radius:50%;object-fit:cover;margin-right:10px;vertical-align:middle;">';
                else pic = '<span style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#0B3D91,#D4A853);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;margin-right:10px;vertical-align:middle;">' + escHtml((p.name || '?').slice(0, 1)) + '</span>';
                return '<div class="title">' + pic + escHtml(p.title || '') + ' · ' + escHtml(p.name || '') + '</div>'
                    + '<div class="meta">' + escHtml(p.className || '—') + (p.photo ? '　|　📷 已上传头像' : '') + '</div>';
            },
            renderForm: function (p, i) {
                return '<div class="form-row">'
                    + '<div class="form-group col-4" style="grid-column:span 4;"><label>职务</label><input type="text" data-bind="structure.term.presidium.' + i + '.title" placeholder="学生会主席 / 执行主席 / 主席团成员"></div>'
                    + '<div class="form-group col-4" style="grid-column:span 4;"><label>姓名</label><input type="text" data-bind="structure.term.presidium.' + i + '.name"></div>'
                    + '<div class="form-group col-4" style="grid-column:span 4;"><label>班级</label><input type="text" data-bind="structure.term.presidium.' + i + '.className" placeholder="例：制药 2401 班"></div>'
                    + '</div>'
                    + '<div class="form-group"><label>头像照片 URL（可选，留空则显示姓名首字）</label><input type="text" data-bind="structure.term.presidium.' + i + '.photo" placeholder="assets/xxx.jpg 或 https://..."></div>';
            },
            onAfterEdit: function (formEl) { A.bindFormToObj(formEl, d); }
        });

        // 部门列表
        var listCard = document.createElement('div');
        listCard.className = 'admin-card';
        listCard.innerHTML = '<div class="admin-card-head"><div><h3>部门列表</h3><div class="desc">每个部门展示在独立卡片中，包含名称、图标、职责、部长、副部长、人数与联系电话。</div></div></div>';
        box.appendChild(listCard);
        A.renderReorderList(listCard, {
            items: d.structure.depts,
            cardName: '部门',
            addLabel: '新增部门',
            minItems: 1,
            maxItems: 20,
            addEmpty: function () {
                return { name: '新部门', icon: '📋', desc: '职责简介…', chair: '待定', vice: '', size: '', phone: '暂无', image: '', fullDesc: '',
                    id: '', body: [], gallery: [], relatedIds: [] };
            },
            renderCard: function (dep) {
                return '<div class="title" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
                    + '<span style="width:36px;height:36px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;background:#e9f0ff;color:#0B3D91;font-size:18px;">' + escHtml(dep.icon || '📋') + '</span>'
                    + escHtml(dep.name || '')
                    + '<span style="font-size:12px;color:#5a606d;background:#f1f3f7;padding:2px 10px;border-radius:999px;">' + escHtml(dep.size || '人数未填') + '</span>'
                    + (dep.image ? '<span style="font-size:12px;color:#2E7D32;background:#e8f5e9;padding:2px 10px;border-radius:999px;">🖼 有图</span>' : '')
                    + (dep.fullDesc ? '<span style="font-size:12px;color:#0B3D91;background:#e9f0ff;padding:2px 10px;border-radius:999px;">📄 有详情</span>' : '')
                    + '</div>'
                    + '<div class="meta">职责：' + escHtml(String(dep.desc || '').slice(0, 80))
                    + '　|　部长：' + escHtml(dep.chair || '-')
                    + (dep.vice ? ' / 副部长：' + escHtml(dep.vice) : '')
                    + '　|　联系：' + escHtml(dep.phone || '-') + '</div>';
            },
            renderForm: function (dep, i) {
                var iconsBar = ICON_CHOICES.map(function (ic) {
                    return '<label class="btn btn-sm btn-outline" style="width:36px;height:32px;padding:0;">' + ic
                         + '<input type="radio" name="icon_' + i + '" value="' + ic + '" style="display:none;"' + (dep.icon === ic ? ' checked' : '') + '></label>';
                }).join('');
                return '<div class="form-row">'
                    + '<div class="form-group col-6" style="grid-column: span 6;"><label>部门名称</label><input type="text" data-bind="structure.depts.' + i + '.name"></div>'
                    + '<div class="form-group col-6" style="grid-column: span 6;"><label>自定义图标（可任意字符/Emoji）</label><input type="text" data-bind="structure.depts.' + i + '.icon"></div>'
                    + '</div>'
                    + '<div class="form-group"><label>图标快速选择</label><div style="display:flex;flex-wrap:wrap;gap:6px;" data-icons-row="' + i + '">' + iconsBar + '</div></div>'
                    + '<div class="form-group"><label>部门职责 / 简介（首页卡片短文案）</label><textarea rows="3" data-bind="structure.depts.' + i + '.desc"></textarea></div>'
                    + '<div class="form-row">'
                    + '<div class="form-group col-5" style="grid-column: span 5;"><label>部 长</label><input type="text" data-bind="structure.depts.' + i + '.chair"></div>'
                    + '<div class="form-group col-5" style="grid-column: span 5;"><label>副部长（多人用顿号分开）</label><input type="text" data-bind="structure.depts.' + i + '.vice" placeholder="例：张三、李四"></div>'
                    + '<div class="form-group col-2" style="grid-column: span 2;"><label>人数</label><input type="text" data-bind="structure.depts.' + i + '.size" placeholder="例：10 人"></div>'
                    + '</div>'
                    + '<div class="form-group"><label>联系电话 / 邮箱</label><input type="text" data-bind="structure.depts.' + i + '.phone"></div>'
                    + '<div style="height:14px;"></div>'
                    + '<div class="admin-card-head" style="padding:0;margin-bottom:10px;"><div><h3 style="font-size:14px;">🪟 弹窗详情（点击部门卡时弹出）</h3><div class="form-hint">图片为空时展示纯色主题头图；介绍为空时展示简介。</div></div></div>'
                    + '<div class="form-group"><label>详情头图 URL（assets/xxx.jpg 或外链）</label>'
                    + '<div style="display:flex;gap:10px;align-items:flex-start;">'
                    + '<input type="text" data-bind="structure.depts.' + i + '.image" placeholder="例：assets/dept-office.jpg" style="flex:1;">'
                    + '<div style="width:110px;height:60px;border-radius:10px;overflow:hidden;border:1px solid #e2e6ee;background:linear-gradient(120deg,#0B3D91,#2E7D32);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;">'
                    + (dep.image ? '<img src="' + escAttr(dep.image) + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">' : (dep.icon || '🖼'))
                    + '</div>'
                    + '</div></div>'
                    + '<div class="form-group"><label>部门详细介绍（弹窗展示，支持换行，建议 80~300 字）</label>'
                    + '<textarea rows="7" data-bind="structure.depts.' + i + '.fullDesc" placeholder="建议详细说明部门使命、核心工作、品牌活动、团队文化…"></textarea>'
                    + '<div class="form-hint">当前字数：<span id="fdLen_' + i + '">0</span> 字</div>'
                    + '</div>'
                    + '<div style=\'height:10px;\'></div><details open class=\'detail-adv\'><summary>  <span class=\'dot\'></span>详情页增强 · 正文 / 图集 / 相关推荐</summary><div style=\'padding:10px 0 4px;\'>  <div class=\'form-hint\' style=\'margin:0 0 10px;\'>    这里的内容会在「详情页」展示，首页卡片 / 部门弹窗不会显示。留空则系统自动生成（基于标题、简介等兜底文案）。  </div>  <div class=\'form-group\'>    <label>正文块（点下方按钮快速添加 H2/H3/段落/引用/列表/图片）</label>    <div data-body-editor=\'' + i + '\'></div>  </div>  <div class=\'form-group\'>    <label>部门图集（留空时详情页默认展示部门头图 image）</label>    <div data-gallery-editor=\'' + i + '\'></div>  </div>  <div class=\'form-group\'>    <label>相关推荐（勾选其他新闻/风采等条目，留空由系统自动取 5 条）</label>    <div data-related-editor=\'' + i + '\'></div>  </div></div></details>';
            },
            onAfterEdit: function (formEl, dep, idx) {
                A.bindFormToObj(formEl, d);
                var row = formEl.querySelector('[data-icons-row="' + idx + '"]');
                if (row) {
                    row.querySelectorAll('input[type=radio]').forEach(function (r) {
                        r.addEventListener('change', function () {
                            if (r.checked) {
                                dep.icon = r.value;
                                var txt = formEl.querySelector('[data-bind="structure.depts.' + idx + '.icon"]');
                                if (txt) txt.value = dep.icon;
                                toast('已切换图标：' + dep.icon, 'success', 800);
                            }
                        });
                    });
                }
                var fd = formEl.querySelector('[data-bind="structure.depts.' + idx + '.fullDesc"]');
                var lenEl = document.getElementById('fdLen_' + idx);
                function updLen() { if (lenEl) lenEl.textContent = String((fd && fd.value || '').length); }
                if (fd) { updLen(); fd.addEventListener('input', updLen); }

                // —— 可视化编辑器：正文块 / 图集 / 相关推荐 ——
                var allCandidates = buildRelatedCandidatesForDept(d);
                var bodyBox = formEl.querySelector('[data-body-editor="' + idx + '"]');
                if (bodyBox) A.makeBodyEditor(bodyBox, dep);
                var galBox = formEl.querySelector('[data-gallery-editor="' + idx + '"]');
                if (galBox) A.makeGalleryEditor(galBox, dep);
                var relBox = formEl.querySelector('[data-related-editor="' + idx + '"]');
                if (relBox) A.makeRelatedEditor(relBox, dep, null, allCandidates, '全部新闻 + 风采 + 部门');
            }
        });
    }

    /* =======================================================
     * renderNews
     * ===================================================== */
    function renderNews(box) {
        var d = cms();
        var headCard = document.createElement('div');
        headCard.className = 'admin-card';
        headCard.innerHTML = '<div class="admin-card-head"><div><h3>新闻活动 · 板块标题 & 分页设置</h3></div></div>';
        var bb = document.createElement('div');
        var cats = (d.news.categories || ['全部','新闻','活动','通知']).slice();
        bb.innerHTML = '<div class="form-row">'
            + '<div class="form-group col-8" style="grid-column:span 8;"><label>主标题</label><input type="text" data-bind="news.heading"></div>'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>副标题 / 英文标语</label><input type="text" data-bind="news.subheading"></div>'
            + '</div>'
            + '<div class="form-row">'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>默认分类</label>'
            + '<select data-bind="news.defaultCategory">'
            + cats.map(function (c) { return '<option value="' + escHtml(c) + '">' + escHtml(c) + '</option>'; }).join('')
            + '</select><div class="form-hint">首页首次进入新闻板块时默认展示的 tab。</div></div>'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>默认显示条数 <small style="color:#737b8a;">（含推荐大图）</small></label>'
            + '<input type="number" min="1" max="999" step="1" data-bind="news.pageSize">'
            + '<div class="form-hint">超出的内容会折叠，需要点击「加载更多」才展开；推荐大图也会占用这条数额度。</div></div>'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>每次点击展开条数</label>'
            + '<input type="number" min="1" max="999" step="1" data-bind="news.loadStep">'
            + '<div class="form-hint">填写与默认显示条数相同即可一次展开全部；若 5 则逐批 5 条展开。</div></div>'
            + '</div>'
            + '<div class="form-row">'
            + '<div class="form-group col-6" style="grid-column:span 6;"><label>「加载更多」按钮文案</label>'
            + '<input type="text" data-bind="news.loadMoreLabel" placeholder="例如：加载更多内容">'
            + '</div>'
            + '<div class="form-group col-6" style="grid-column:span 6;"><label>「收起内容」按钮文案</label>'
            + '<input type="text" data-bind="news.collapseLabel" placeholder="例如：收起更多内容">'
            + '<div class="form-hint">全部展开后按钮会切换到此文案，点击即可回到默认显示条数。</div></div>'
            + '</div>';
        headCard.appendChild(bb);
        box.appendChild(headCard);
        A.bindFormToObj(headCard, d);

        var listCard = document.createElement('div');
        listCard.className = 'admin-card';
        listCard.innerHTML = '<div class="admin-card-head"><div><h3>新闻 / 活动列表</h3><div class="desc">置顶（推荐）的内容会优先显示并带有金标，且支持 tab 分类筛选。</div></div></div>';
        box.appendChild(listCard);

        A.renderReorderList(listCard, {
            items: d.news.items,
            cardName: '新闻/活动',
            addLabel: '新增内容',
            minItems: 0,
            maxItems: 80,
            addEmpty: function () {
                return {
                    category: (cats[1] || '新闻'),
                    title: '请输入标题',
                    date: new Date().toISOString().slice(0, 10),
                    summary: '一句话摘要…',
                    cover: 'assets/carousel-slide-2.jpg',
                    featured: false,
                    link: '',
                    id: '',
                    author: '学生会秘书处',
                    source: '药环学院公众号',
                    body: [],
                    gallery: [],
                    relatedIds: []
                };
            },
            renderCard: function (n, i) {
                var cardCls = n.featured ? ' news-card-featured' : '';
                return '<div class="' + cardCls + '">'
                    + '<div class="title" style="display:flex;align-items:center;gap:8px;">'
                    +   '<div class="img-thumb-sm" style="background-image:url(\'' + escHtml(n.cover || '') + '\');"></div>'
                    +   '<div style="flex:1;">' + escHtml(n.title || '')
                    +     (n.featured ? '<span class="featured-badge">推荐</span>' : '')
                    +     '<span class="badge primary" style="margin-left:8px;">' + escHtml(n.category || '') + '</span>'
                    +     '<span class="badge accent" style="margin-left:6px;">#' + (i + 1) + '</span>'
                    +   '</div>'
                    + '</div>'
                    + '<div class="meta" style="margin-top:4px;">📅 ' + escHtml(n.date || '-') + '　' + escHtml(String(n.summary || '').slice(0, 100)) + '</div>'
                    + '</div>';
            },
            renderForm: function (n, i) {
                return '<div class="form-row">'
                    + '<div class="form-group col-8" style="grid-column: span 8;"><label>标题</label><input type="text" data-bind="news.items.' + i + '.title"></div>'
                    + '<div class="form-group col-4" style="grid-column: span 4;"><label>分类</label>'
                    + '<select data-bind="news.items.' + i + '.category">'
                    + cats.map(function (c) { return c === '全部' ? '' : ('<option value="' + escHtml(c) + '"' + (n.category === c ? ' selected' : '') + '>' + escHtml(c) + '</option>'); }).join('')
                    + '</select></div>'
                    + '</div>'
                    + '<div class="form-row">'
                    + '<div class="form-group col-4" style="grid-column: span 4;"><label>发布日期</label><input type="date" data-bind="news.items.' + i + '.date"></div>'
                    + '<div class="form-group col-4" style="grid-column: span 4;"><label>置顶推荐</label>'
                    +   '<div style="height:38px;display:flex;align-items:center;gap:8px;border:1px solid var(--color-gray-200);border-radius:6px;padding:0 12px;background:#fff;">'
                    +     '<input type="checkbox" data-bind="news.items.' + i + '.featured" id="news_feat_' + i + '" style="width:auto;height:auto;">'
                    +     '<label for="news_feat_' + i + '" style="margin:0;">设置为首页推荐（金标）</label>'
                    +   '</div>'
                    + '</div>'
                    + '<div class="form-group col-4" style="grid-column: span 4;"><label>跳转链接（可选）</label><input type="text" data-bind="news.items.' + i + '.link" placeholder="留空显示详情弹窗"></div>'
                    + '</div>'
                    + '<div class="form-group"><label>摘要</label><textarea rows="2" data-bind="news.items.' + i + '.summary"></textarea></div>'
                    + '<div class="form-group">'
                    +   '<label>封面图</label>'
                    +   '<div class="img-field">'
                    +     '<input type="text" data-bind="news.items.' + i + '.cover" placeholder="图片 URL 或相对路径">'
                    +     '<div class="img-thumb-sm" id="newsThumb_' + i + '" style="background-image:url(\'' + escHtml(n.cover || '') + '\');"></div>'
                    +     '<button type="button" class="btn btn-outline btn-sm" data-imgbtn="news.items.' + i + '.cover">选择图片</button>'
                    +   '</div>'
                    + '</div>'
                    + '<div class="form-row" style="margin-top:6px;">'
                    + '<div class="form-group col-6" style="grid-column: span 4;"><label>作者 / 部门</label><input type="text" data-bind="news.items.' + i + '.author" placeholder="例：学习部 郑雅文"></div>'
                    + '<div class="form-group col-6" style="grid-column: span 4;"><label>发布来源</label><input type="text" data-bind="news.items.' + i + '.source" placeholder="例：药环学院公众号"></div>'
                    + '<div class="form-group col-6" style="grid-column: span 4;"><label>详情页固定 id（不改可不填）</label><input type="text" data-bind="news.items.' + i + '.id" placeholder="例：n-4，留空自动生成"></div>'
                    + '</div>'
                    + '<div style=\'height:10px;\'></div><details open class=\'detail-adv\'><summary>  <span class=\'dot\'></span>详情页增强 · 正文 / 图集 / 相关推荐</summary><div style=\'padding:10px 0 4px;\'>  <div class=\'form-hint\' style=\'margin:0 0 10px;\'>    这里的内容会在「详情页」展示，首页卡片不会显示。留空则系统自动生成（基于标题、分类、简介等兜底文案）。  </div>  <div class=\'form-group\'>    <label>正文块（点下方按钮快速添加 H2/H3/段落/引用/列表/图片）</label>    <div data-news-body=\'' + i + '\'></div>  </div>  <div class=\'form-group\'>    <label>新闻图集（展示在详情页封面图下方，留空不展示额外图集）</label>    <div data-news-gallery=\'' + i + '\'></div>  </div>  <div class=\'form-group\'>    <label>相关推荐（勾选其他新闻条目；留空系统自动按推荐/时间取 5 条）</label>    <div data-news-related=\'' + i + '\'></div>  </div></div></details>';
            },
            onAfterEdit: function (formEl, n, idx) {
                A.bindFormToObj(formEl, d);
                var b = formEl.querySelector('[data-imgbtn]');
                if (b) {
                    A.makeImgBtn(b, d, b.getAttribute('data-imgbtn'), function (src) {
                        var t = formEl.querySelector('#newsThumb_' + idx);
                        if (t) t.style.backgroundImage = 'url("' + src + '")';
                    });
                }

                // —— 可视化编辑器：正文块 / 图集 / 相关推荐 ——
                var newsCandidates = (d.news && d.news.items || []).filter(function (x, k) { return k !== idx; }).map(function (x) {
                    return { id: x.id, title: x.title, tag: x.category, subTitle: (x.date || '') + ' · ' + (x.source || '') };
                });
                var newsBox = formEl.querySelector('[data-news-body="' + idx + '"]');
                if (newsBox) A.makeBodyEditor(newsBox, n);
                var newsGal = formEl.querySelector('[data-news-gallery="' + idx + '"]');
                if (newsGal) A.makeGalleryEditor(newsGal, n);
                var newsRel = formEl.querySelector('[data-news-related="' + idx + '"]');
                if (newsRel) A.makeRelatedEditor(newsRel, n, null, newsCandidates, '其他新闻');
            }
        });
    }

    /* =======================================================
     * renderShowcase
     * ===================================================== */
    function renderShowcase(box) {
        var d = cms();
        var headCard = document.createElement('div');
        headCard.className = 'admin-card';
        headCard.innerHTML = '<div class="admin-card-head"><div><h3>风采展示 · 板块标题</h3></div></div>';
        var bb = document.createElement('div');
        bb.innerHTML = '<div class="form-row">'
            + '<div class="form-group col-8" style="grid-column:span 8;"><label>主标题</label><input type="text" data-bind="showcase.heading"></div>'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>副标题 / 英文标语</label><input type="text" data-bind="showcase.subheading"></div>'
            + '</div>';
        headCard.appendChild(bb);
        box.appendChild(headCard);
        A.bindFormToObj(headCard, d);

        var listCard = document.createElement('div');
        listCard.className = 'admin-card';
        listCard.innerHTML = '<div class="admin-card-head"><div><h3>风采条目</h3><div class="desc">展示精彩瞬间、活动照片或作品。推荐上传 4:3 或 16:9 横图。</div></div></div>';
        box.appendChild(listCard);

        A.renderReorderList(listCard, {
            items: d.showcase.items,
            cardName: '风采条目',
            addLabel: '新增风采条目',
            minItems: 0,
            maxItems: 60,
            addEmpty: function () {
                return { title: '新活动', desc: '一句话描述…', image: 'assets/carousel-slide-3.jpg', tag: '活动', url: '',
                    id: '', date: new Date().toISOString().slice(0,10),
                    location: '四川化工职业技术学院', photographer: '药环学院 · 新媒体中心',
                    body: [], gallery: [], relatedIds: [] };
            },
            renderCard: function (s) {
                return '<div class="title" style="display:flex;align-items:center;gap:10px;">'
                    + '<div class="img-thumb-sm" style="background-image:url(\'' + escHtml(s.image || '') + '\');"></div>'
                    + '<div style="flex:1;">' + escHtml(s.title || '')
                    +   (s.tag ? '<span class="badge accent" style="margin-left:8px;">' + escHtml(s.tag) + '</span>' : '')
                    +   (s.url ? '<span class="badge primary" style="margin-left:6px;">带链接</span>' : '')
                    + '</div></div>'
                    + '<div class="meta">' + escHtml(s.desc || '') + '</div>';
            },
            renderForm: function (s, i) {
                return '<div class="form-row">'
                    + '<div class="form-group col-8" style="grid-column: span 8;"><label>标题</label><input type="text" data-bind="showcase.items.' + i + '.title"></div>'
                    + '<div class="form-group col-4" style="grid-column: span 4;"><label>分类标签</label><input type="text" data-bind="showcase.items.' + i + '.tag" placeholder="如：招新 / 运动会 / 志愿活动"></div>'
                    + '</div>'
                    + '<div class="form-group"><label>描述</label><textarea rows="2" data-bind="showcase.items.' + i + '.desc"></textarea></div>'
                    + '<div class="form-group"><label>图片</label>'
                    +   '<div class="img-field">'
                    +     '<input type="text" data-bind="showcase.items.' + i + '.image">'
                    +     '<div class="img-thumb-sm" id="scThumb_' + i + '" style="background-image:url(\'' + escHtml(s.image || '') + '\');"></div>'
                    +     '<button type="button" class="btn btn-outline btn-sm" data-imgbtn="showcase.items.' + i + '.image">选择图片</button>'
                    +   '</div>'
                    + '</div>'
                    + '<div class="form-group"><label>外链（可选）</label><input type="text" data-bind="showcase.items.' + i + '.url" placeholder="https://…，填写后点击卡片可跳转"></div>'
                    + '<div class="form-row">'
                    + '<div class="form-group col-6" style="grid-column: span 3;"><label>拍摄 / 发生日期</label><input type="date" data-bind="showcase.items.' + i + '.date"></div>'
                    + '<div class="form-group col-6" style="grid-column: span 3;"><label>地点</label><input type="text" data-bind="showcase.items.' + i + '.location" placeholder="如：四川化工职业技术学院体育馆"></div>'
                    + '<div class="form-group col-6" style="grid-column: span 6;"><label>拍摄 / 来源</label><input type="text" data-bind="showcase.items.' + i + '.photographer" placeholder="如：药环学院 · 新媒体中心"></div>'
                    + '</div>'
                    + '<div style=\'height:10px;\'></div><details open class=\'detail-adv\'><summary>  <span class=\'dot\'></span>详情页增强 · 正文 / 图集 / 相关推荐</summary><div style=\'padding:10px 0 4px;\'>  <div class=\'form-hint\' style=\'margin:0 0 10px;\'>    这里的内容会在「详情页」展示，首页卡片不会显示。留空则系统自动生成（基于标题、简介等兜底文案）。  </div>  <div class=\'form-group\'>    <label>正文块（点下方按钮快速添加 H2/H3/段落/引用/列表/图片）</label>    <div data-sc-body=\'' + i + '\'></div>  </div>  <div class=\'form-group\'>    <label>风采图集（留空时详情页默认展示主图 image）</label>    <div data-sc-gallery=\'' + i + '\'></div>  </div>  <div class=\'form-group\'>    <label>相关推荐（勾选其他风采条目，留空由系统自动取 5 条）</label>    <div data-sc-related=\'' + i + '\'></div>  </div></div></details>';
            },
            onAfterEdit: function (formEl, s, idx) {
                A.bindFormToObj(formEl, d);
                var b = formEl.querySelector('[data-imgbtn]');
                if (b) {
                    A.makeImgBtn(b, d, b.getAttribute('data-imgbtn'), function (src) {
                        var t = formEl.querySelector('#scThumb_' + idx);
                        if (t) t.style.backgroundImage = 'url("' + src + '")';
                    });
                }

                // —— 可视化编辑器：正文块 / 图集 / 相关推荐 ——
                var scCandidates = (d.showcase && d.showcase.items || []).filter(function (x, k) { return k !== idx; }).map(function (x) {
                    return { id: x.id, title: x.title, tag: x.tag, subTitle: (x.date || '') + ' · ' + (x.location || '') };
                });
                var scBox = formEl.querySelector('[data-sc-body="' + idx + '"]');
                if (scBox) A.makeBodyEditor(scBox, s);
                var scGal = formEl.querySelector('[data-sc-gallery="' + idx + '"]');
                if (scGal) A.makeGalleryEditor(scGal, s);
                var scRel = formEl.querySelector('[data-sc-related="' + idx + '"]');
                if (scRel) A.makeRelatedEditor(scRel, s, null, scCandidates, '其他风采');
            }
        });
    }

    /* =======================================================
     * renderShortcuts
     * ===================================================== */
    function renderShortcuts(box) {
        var d = cms();
        // 防御性归一化：确保 shortcuts 为对象格式 {heading, subheading, items}
        if (Array.isArray(d.shortcuts)) { d.shortcuts = { heading: '快捷入口', subheading: 'Quick Links', items: d.shortcuts }; }
        else if (!d.shortcuts || typeof d.shortcuts !== 'object') { d.shortcuts = { heading: '快捷入口', subheading: 'Quick Links', items: [] }; }
        if (!Array.isArray(d.shortcuts.items)) d.shortcuts.items = [];
        var ICON_CHOICES = ['🏫','📚','📖','🎓','💬','📢','🔗','🏆','📝','🌐','📧','🖥️','🔬','⚙️','📌','🎯'];
        var headCard = document.createElement('div');
        headCard.className = 'admin-card';
        headCard.innerHTML = '<div class="admin-card-head"><div><h3>快捷方式 · 板块标题</h3><div class="desc">展示于首页「快捷入口」区域的标题与说明文案。</div></div></div>';
        var hb = document.createElement('div');
        hb.innerHTML = '<div class="form-row">'
            + '<div class="form-group col-8" style="grid-column:span 8;"><label>主标题</label><input type="text" data-bind="shortcuts.heading"></div>'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>副标题 / 英文标语</label><input type="text" data-bind="shortcuts.subheading"></div>'
            + '</div>';
        headCard.appendChild(hb);
        box.appendChild(headCard);
        A.bindFormToObj(headCard, d);

        var listCard = document.createElement('div');
        listCard.className = 'admin-card';
        listCard.innerHTML = '<div class="admin-card-head"><div><h3>快捷链接列表</h3><div class="desc">每个条目包含图标（Emoji）、标题、描述与跳转 URL，新窗口打开。</div></div></div>';
        box.appendChild(listCard);

        A.renderReorderList(listCard, {
            items: d.shortcuts.items,
            cardName: '快捷链接',
            addLabel: '新增快捷链接',
            minItems: 0,
            maxItems: 20,
            addEmpty: function () { return { icon: '🔗', title: '新链接', url: 'https://', desc: '链接描述…' }; },
            renderCard: function (s) {
                return '<div class="title" style="display:flex;align-items:center;gap:10px;">'
                    + '<span style="width:36px;height:36px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;background:#e9f0ff;color:#0B3D91;font-size:18px;">' + escHtml(s.icon || '🔗') + '</span>'
                    + escHtml(s.title || '') + '</div>'
                    + '<div class="meta">URL：<code style="background:#f1f3f7;padding:2px 6px;border-radius:4px;">' + escHtml(s.url || '') + '</code>' + (s.desc ? '　|　' + escHtml(s.desc) : '') + '</div>';
            },
            renderForm: function (s, i) {
                var iconsBar = ICON_CHOICES.map(function (ic) {
                    return '<label class="btn btn-sm btn-outline" style="width:36px;height:32px;padding:0;">' + ic
                         + '<input type="radio" name="sc_icon_' + i + '" value="' + ic + '" style="display:none;"' + (s.icon === ic ? ' checked' : '') + '></label>';
                }).join('');
                return '<div class="form-row">'
                    + '<div class="form-group col-3" style="grid-column: span 3;"><label>图标（Emoji 或符号）</label><input type="text" data-bind="shortcuts.items.' + i + '.icon"></div>'
                    + '<div class="form-group col-5" style="grid-column: span 5;"><label>链接标题</label><input type="text" data-bind="shortcuts.items.' + i + '.title"></div>'
                    + '<div class="form-group col-4" style="grid-column: span 4;"><label>跳转 URL</label><input type="text" data-bind="shortcuts.items.' + i + '.url" placeholder="https://"></div>'
                    + '</div>'
                    + '<div class="form-group"><label>图标快速选择</label><div style="display:flex;flex-wrap:wrap;gap:6px;" data-sc-icons-row="' + i + '">' + iconsBar + '</div></div>'
                    + '<div class="form-group"><label>描述（可选）</label><input type="text" data-bind="shortcuts.items.' + i + '.desc" placeholder="一句话描述"></div>';
            },
            onAfterEdit: function (formEl, s, idx) {
                A.bindFormToObj(formEl, d);
                var row = formEl.querySelector('[data-sc-icons-row="' + idx + '"]');
                if (row) {
                    row.querySelectorAll('input[type=radio]').forEach(function (r) {
                        r.addEventListener('change', function () {
                            if (r.checked) {
                                s.icon = r.value;
                                var inp = formEl.querySelector('[data-bind="shortcuts.items.' + idx + '.icon"]');
                                if (inp) inp.value = r.value;
                            }
                        });
                    });
                }
            }
        });
    }

    /* =======================================================
     * renderContact
     * ===================================================== */
    function renderContact(box) {
        var d = cms();
        var INFO_ICONS = ['📍','📞','✉️','⏰','💬','🌐'];
        var headCard = document.createElement('div');
        headCard.className = 'admin-card';
        headCard.innerHTML = '<div class="admin-card-head"><div><h3>联系我们 · 板块标题 & 地图位置</h3></div></div>';
        var bb = document.createElement('div');
        bb.innerHTML = '<div class="form-row">'
            + '<div class="form-group col-8" style="grid-column:span 8;"><label>主标题</label><input type="text" data-bind="contact.heading"></div>'
            + '<div class="form-group col-4" style="grid-column:span 4;"><label>副标题 / 英文标语</label><input type="text" data-bind="contact.subheading"></div>'
            + '</div>'
            + '<div class="form-row">'
            + '<div class="form-group col-12" style="grid-column:span 12;"><label>板块描述文案</label><textarea rows="3" data-bind="contact.desc" placeholder="显示在主标题下方的简短介绍，例如：欢迎通过以下方式联系我们…"></textarea></div>'
            + '</div>'
            + '<div class="form-row">'
            + '<div class="form-group col-6" style="grid-column:span 6;"><label>地图 iframe 嵌入 URL</label><input type="text" data-bind="contact.mapUrl" placeholder="高德/百度地图 iframe 嵌入的 src URL"></div>'
            + '<div class="form-group col-3" style="grid-column:span 3;"><label>纬度（备用 图片中心）</label><input type="text" data-bind="contact.lat" placeholder="数字或空"></div>'
            + '<div class="form-group col-3" style="grid-column:span 3;"><label>经度（备用）</label><input type="text" data-bind="contact.lng" placeholder="数字或空"></div>'
            + '</div>';
        headCard.appendChild(bb);
        box.appendChild(headCard);
        A.bindFormToObj(headCard, d);

        var infosCard = document.createElement('div');
        infosCard.className = 'admin-card';
        infosCard.innerHTML = '<div class="admin-card-head"><div><h3>联系信息项</h3><div class="desc">左侧展示：地址、电话、邮箱、办公时间……图标建议使用 emoji。</div></div></div>';
        box.appendChild(infosCard);

        A.renderReorderList(infosCard, {
            items: d.contact.infos,
            cardName: '联系信息',
            addLabel: '新增信息',
            minItems: 0,
            maxItems: 12,
            addEmpty: function () { return { icon: '📍', label: '新的信息项', value: '请填写内容…' }; },
            renderCard: function (c) {
                return '<div class="title"><span style="margin-right:10px;font-size:16px;">' + escHtml(c.icon || '📍') + '</span>' + escHtml(c.label || '') + '</div>'
                    + '<div class="meta">' + escHtml(c.value || '') + '</div>';
            },
            renderForm: function (c, i) {
                var iconsBar = INFO_ICONS.map(function (ic) {
                    return '<label class="btn btn-sm btn-outline" style="width:36px;height:32px;padding:0;">' + ic
                         + '<input type="radio" name="cicon_' + i + '" value="' + ic + '" style="display:none;"' + (c.icon === ic ? ' checked' : '') + '></label>';
                }).join('');
                return '<div class="form-row">'
                    + '<div class="form-group col-4" style="grid-column: span 4;"><label>标签</label><input type="text" data-bind="contact.infos.' + i + '.label" placeholder="如：地址"></div>'
                    + '<div class="form-group col-8" style="grid-column: span 8;"><label>值</label><input type="text" data-bind="contact.infos.' + i + '.value" placeholder="如：四川省泸州市…"></div>'
                    + '</div>'
                    + '<div class="form-row">'
                    + '<div class="form-group col-4" style="grid-column: span 4;"><label>自定义图标</label><input type="text" data-bind="contact.infos.' + i + '.icon"></div>'
                    + '<div class="form-group col-8" style="grid-column: span 8;"><label>快速选择</label><div style="display:flex;flex-wrap:wrap;gap:6px;" data-c-icons-row="' + i + '">' + iconsBar + '</div></div>'
                    + '</div>';
            },
            onAfterEdit: function (formEl, c, idx) {
                A.bindFormToObj(formEl, d);
                var row = formEl.querySelector('[data-c-icons-row="' + idx + '"]');
                if (row) {
                    row.querySelectorAll('input[type=radio]').forEach(function (r) {
                        r.addEventListener('change', function () {
                            if (r.checked) {
                                c.icon = r.value;
                                var txt = formEl.querySelector('[data-bind="contact.infos.' + idx + '.icon"]');
                                if (txt) txt.value = c.icon;
                            }
                        });
                    });
                }
            }
        });

        /* ---------- 在线留言列表 ---------- */
        var sbCard = document.createElement('div');
        sbCard.className = 'admin-card';
        sbCard.innerHTML = '<div class="admin-card-head"><div><h3>在线留言主题下拉选项</h3><div class="desc">首页「联系我们」表单中的「咨询主题」select 下拉项。顺序即显示顺序。</div></div></div>';
        var sbBox = document.createElement('div');
        if (!Array.isArray(d.contact.formSubjects)) d.contact.formSubjects = [];
        A.renderReorderList(sbBox, {
            items: d.contact.formSubjects,
            cardName: '主题',
            addLabel: '新增主题',
            minItems: 0,
            maxItems: 20,
            addEmpty: function () { return '新主题'; },
            renderCard: function (s) { return '<div class="title">' + escHtml(s || '') + '</div>'; },
            renderForm: function (s, i) {
                return '<div class="form-row"><div class="form-group col-12" style="grid-column:span 12;"><label>主题文字</label><input type="text" data-bind="contact.formSubjects.' + i + '" placeholder="如：招新咨询"></div></div>';
            },
            onAfterEdit: function (formEl) { A.bindFormToObj(formEl, d); }
        });
        sbCard.appendChild(sbBox);
        box.appendChild(sbCard);

        /* ---------- 在线留言列表 ---------- */
        var msgCard = document.createElement('div');
        msgCard.className = 'admin-card';
        box.appendChild(msgCard);

        function saveLocalMessagesCache() {
            try {
                var raw = localStorage.getItem('gxc_admin_cms_v1');
                var cms = raw ? JSON.parse(raw) : {};
                if (!cms.contact) cms.contact = {};
                cms.contact.messages = d.contact.messages || [];
                localStorage.setItem('gxc_admin_cms_v1', JSON.stringify(cms));
            } catch(e) {}
        }

        function renderMessages() {
            var list = Array.isArray(d.contact.messages) ? d.contact.messages.slice() : [];
            var total = list.length;
            var unread = list.filter(function (m) { return !m.read; }).length;
            var toolbarHtml = '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px;">'
                + '<div style="display:flex;align-items:center;gap:12px;">'
                + '<h3 style="margin:0;">在线留言</h3>'
                + '<span class="chip chip-info">共 ' + total + ' 条</span>'
                + (unread > 0 ? '<span class="chip chip-danger">未读 ' + unread + ' 条</span>' : '')
                + '</div>'
                + '<div style="display:flex;gap:8px;">'
                + (unread > 0 ? '<button type="button" class="btn btn-sm btn-outline" data-action="mark-all-read">全部标记已读</button>' : '')
                + (total > 0 ? '<button type="button" class="btn btn-sm btn-outline-danger" data-action="clear-all">清空全部留言</button>' : '')
                + '<button type="button" class="btn btn-sm btn-outline" data-action="refresh-msgs" title="从云端刷新列表">↻ 刷新</button>'
                + '</div>'
                + '</div>';
            var descHtml = '<div class="desc" style="margin-bottom:14px;">前端首页「在线留言」表单提交的数据均会实时出现在这里。数据优先从云端同步，离线时使用本地缓存。</div>';
            var headHtml = '<div class="admin-card-head"><div>' + toolbarHtml + descHtml + '</div></div>';

            var bodyHtml = '';
            if (!list.length) {
                bodyHtml = '<div style="padding:40px 20px;text-align:center;color:#98a2b3;border:1px dashed #e4e7ec;border-radius:10px;">'
                    + '<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.5;margin-bottom:10px;">'
                    + '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
                    + '<div>暂无留言，当用户在首页提交在线表单后会自动出现在这里</div></div>';
            } else {
                bodyHtml = list.map(function (m, idx) {
                    var subjectColors = {
                        '招新咨询': { bg: '#eef2ff', fg: '#4338ca' },
                        '活动合作': { bg: '#ecfdf5', fg: '#047857' },
                        '意见建议': { bg: '#fffbeb', fg: '#b45309' },
                        '权益诉求': { bg: '#fef2f2', fg: '#b91c1c' },
                        '其他':     { bg: '#f1f5f9', fg: '#334155' }
                    };
                    var sc = subjectColors[m.subject] || subjectColors['其他'];
                    var t = m.createdAt ? new Date(m.createdAt) : null;
                    var timeStr = t && !isNaN(t.getTime())
                        ? (t.getFullYear() + '-' + String(t.getMonth()+1).padStart(2,'0') + '-' + String(t.getDate()).padStart(2,'0') + ' ' + String(t.getHours()).padStart(2,'0') + ':' + String(t.getMinutes()).padStart(2,'0'))
                        : (m.createdAt || '未知时间');
                    var contentHtml = String(m.message || '').replace(/[<>&]/g, function (c) { return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c]; }).replace(/\n/g, '<br>');
                    return '<div class="admin-sub-card" data-msg-idx="' + idx + '" style="' + (m.read ? '' : 'border-left:3px solid #0B3D91;') + '">'
                        + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px;">'
                        + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
                        + (m.read ? '' : '<span style="display:inline-block;width:8px;height:8px;background:#e53935;border-radius:50%;flex-shrink:0;" title="未读"></span>')
                        + '<strong style="font-size:15px;">' + escHtml(m.name || '匿名用户') + '</strong>'
                        + '<span style="color:#98a2b3;font-size:12px;">' + escHtml(m.phone || '无联系方式') + '</span>'
                        + '<span class="badge" style="background:' + sc.bg + ';color:' + sc.fg + ';">' + escHtml(m.subject || '其他') + '</span>'
                        + '</div>'
                        + '<span style="color:#98a2b3;font-size:12px;flex-shrink:0;">' + timeStr + '</span>'
                        + '</div>'
                        + '<div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:8px;padding:12px 14px;line-height:1.7;font-size:13.5px;color:#344054;margin-bottom:10px;">' + contentHtml + '</div>'
                        + '<div style="display:flex;justify-content:flex-end;gap:8px;">'
                        + (m.read
                            ? '<button type="button" class="btn btn-xs btn-outline" data-msg-action="unread" data-msg-id="' + escHtml(m.id) + '">标记为未读</button>'
                            : '<button type="button" class="btn btn-xs btn-outline" data-msg-action="read" data-msg-id="' + escHtml(m.id) + '">标记已读</button>')
                        + '<button type="button" class="btn btn-xs btn-outline-danger" data-msg-action="delete" data-msg-id="' + escHtml(m.id) + '">删除</button>'
                        + '</div>'
                        + '</div>';
                }).join('');
            }
            msgCard.innerHTML = headHtml + bodyHtml;
            // 按钮绑定
            var refreshBtn = msgCard.querySelector('[data-action="refresh-msgs"]');
            if (refreshBtn) refreshBtn.addEventListener('click', loadCloudMessages);
            var btn1 = msgCard.querySelector('[data-action="mark-all-read"]');
            if (btn1) btn1.addEventListener('click', function () {
                if (window.SB && typeof window.SB.updateMessage === 'function') {
                    var todos = list.filter(function (mm) { return !mm.read; }).map(function (mm) {
                        return window.SB.updateMessage(mm.id, { read: true });
                    });
                    Promise.all(todos).then(function () {
                        if (d.contact.messages) d.contact.messages.forEach(function (mm) { mm.read = true; });
                        saveLocalMessagesCache(); renderMessages();
                        A.toast('已同步云端：全部标记已读 ✓', 'success', 1500);
                    }).catch(function () {
                        // 兜底：本地修改（下次刷新会再次尝试同步）
                        if (d.contact.messages) d.contact.messages.forEach(function (mm) { mm.read = true; });
                        saveLocalMessagesCache(); renderMessages();
                        A.toast('本地已标记；云端同步失败（未建表或网络）', 'warn', 2600);
                    });
                } else {
                    if (d.contact.messages) d.contact.messages.forEach(function (mm) { mm.read = true; });
                    saveLocalMessagesCache(); renderMessages();
                }
            });
            var btn2 = msgCard.querySelector('[data-action="clear-all"]');
            if (btn2) btn2.addEventListener('click', function () {
                if (!confirm('确定要清空全部 ' + total + ' 条留言吗？此操作不可恢复。')) return;
                if (window.SB && typeof window.SB.deleteMessage === 'function') {
                    var ids = list.map(function (mm) { return mm.id; });
                    Promise.all(ids.map(function (id) { return window.SB.deleteMessage(id); })).then(function () {
                        d.contact.messages = []; saveLocalMessagesCache(); renderMessages();
                        A.toast('已同步云端：全部清空 ✓', 'success', 1500);
                    }).catch(function () {
                        d.contact.messages = []; saveLocalMessagesCache(); renderMessages();
                        A.toast('本地已清空；云端同步失败', 'warn', 2600);
                    });
                } else {
                    d.contact.messages = []; saveLocalMessagesCache(); renderMessages();
                }
            });
            msgCard.querySelectorAll('[data-msg-action]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var id = btn.getAttribute('data-msg-id');
                    var act = btn.getAttribute('data-msg-action');
                    var idx = -1;
                    for (var k = 0; k < (d.contact.messages ? d.contact.messages.length : 0); k++) {
                        if (d.contact.messages[k].id === id) { idx = k; break; }
                    }
                    if (idx < 0) return;
                    if (act === 'read' || act === 'unread') {
                        var val = (act === 'read');
                        if (window.SB && typeof window.SB.updateMessage === 'function') {
                            window.SB.updateMessage(id, { read: val }).then(function () {
                                d.contact.messages[idx].read = val;
                                saveLocalMessagesCache(); renderMessages();
                            }).catch(function () {
                                d.contact.messages[idx].read = val;
                                saveLocalMessagesCache(); renderMessages();
                                A.toast('本地已更新；云端同步失败', 'warn', 2500);
                            });
                        } else {
                            d.contact.messages[idx].read = val;
                            saveLocalMessagesCache(); renderMessages();
                        }
                    } else if (act === 'delete') {
                        if (!confirm('确定删除这条留言吗？')) return;
                        if (window.SB && typeof window.SB.deleteMessage === 'function') {
                            window.SB.deleteMessage(id).then(function () {
                                d.contact.messages.splice(idx, 1);
                                saveLocalMessagesCache(); renderMessages();
                            }).catch(function () {
                                d.contact.messages.splice(idx, 1);
                                saveLocalMessagesCache(); renderMessages();
                                A.toast('本地已删除；云端同步失败', 'warn', 2500);
                            });
                        } else {
                            d.contact.messages.splice(idx, 1);
                            saveLocalMessagesCache(); renderMessages();
                        }
                    }
                });
            });
        }

        function loadCloudMessages() {
            if (!window.SB || typeof window.SB.listMessages !== 'function') {
                renderMessages(); return;
            }
            // 先显示本地缓存（快速）
            renderMessages();
            // 再异步拉云端，拿到后合并（按id去重），时间倒序
            window.SB.listMessages().then(function (arr) {
                if (!Array.isArray(arr) || !arr.length) { return; }
                var byId = {};
                var localList = d.contact.messages || [];
                localList.forEach(function (m) { byId[m.id] = m; });
                arr.forEach(function (m) { byId[m.id] = m; });
                var merged = Object.keys(byId).map(function (k) { return byId[k]; });
                merged.sort(function (a, b) {
                    var ta = (a.createdAt && new Date(a.createdAt).getTime()) || 0;
                    var tb = (b.createdAt && new Date(b.createdAt).getTime()) || 0;
                    return tb - ta;
                });
                d.contact.messages = merged;
                saveLocalMessagesCache();
                renderMessages();
            }).catch(function (e) {
                console.warn('[contact] 拉取云端留言失败，继续用本地：', e && e.message);
            });
        }
        loadCloudMessages();

        // 监听：如果首页刚提交了新留言（离线模式下），实时刷新
        window.addEventListener('storage', function (e) {
            if (e.key === 'gxc_admin_cms_v1') { try { var raw = JSON.parse(e.newValue); d.contact.messages = raw.contact && raw.contact.messages || []; renderMessages(); } catch (err) {} }
        });
        // 如果云端数据发生变化（admin其他页面操作触发cms:update-sb），尝试刷新
        window.addEventListener('cms:update-sb', loadCloudMessages);
    }

    /* =======================================================
     * renderSite
     * ===================================================== */
    function renderSite(box) {
        var d = cms();
        var c1 = document.createElement('div');
        c1.className = 'admin-card';
        c1.innerHTML = '<div class="admin-card-head"><div><h3>站点基础信息</h3><div class="desc">浏览器标签标题、导航栏左上角 LOGO 区域显示。</div></div></div>';
        var b1 = document.createElement('div');
        b1.innerHTML = '<div class="form-group"><label>浏览器标题（title）</label><input type="text" data-bind="site.title"></div>'
            + '<div class="form-group" id="logoUploadGroup"></div>'
            + '<div class="form-row">'
            + '<div class="form-group col-6" style="grid-column: span 6;"><label>Logo 第一行</label><input type="text" data-bind="site.logoTitle"></div>'
            + '<div class="form-group col-6" style="grid-column: span 6;"><label>Logo 第二行</label><input type="text" data-bind="site.logoSubtitle"></div>'
            + '</div>'
            + '<div class="form-row">'
            + '<div class="form-group col-6" style="grid-column: span 6;"><label>Hero CTA 主按钮文字</label><input type="text" data-bind="site.ctaPrimary"></div>'
            + '<div class="form-group col-6" style="grid-column: span 6;"><label>Hero CTA 主按钮锚链接</label><input type="text" data-bind="site.ctaPrimaryHref" placeholder="#about"></div>'
            + '</div>'
            + '<div class="form-row">'
            + '<div class="form-group col-6" style="grid-column: span 6;"><label>Hero CTA 次按钮文字</label><input type="text" data-bind="site.ctaSecondary"></div>'
            + '<div class="form-group col-6" style="grid-column: span 6;"><label>Hero CTA 次按钮链接</label><input type="text" data-bind="site.ctaSecondaryHref"></div>'
            + '</div>';
        c1.appendChild(b1);
        box.appendChild(c1);
        A.bindFormToObj(c1, d);

        // Logo 上传控件
        (function mountLogoUploader() {
            var root = document.getElementById('logoUploadGroup');
            if (!root) return;
            var isEmpty = !(d.site.logoUrl && d.site.logoUrl.length > 10);
            var label = document.createElement('label');
            label.style.cssText = 'font-weight:600;color:#344054;font-size:13px;margin-bottom:10px;display:block;';
            label.innerHTML = '自定义 Logo 图标（<b>可选</b>，推荐正方形 120×120 px，PNG/SVG/JPG，留空用默认盾牌图标）';
            root.appendChild(label);

            var preview = document.createElement('div');
            preview.id = 'logoPreview';
            preview.style.cssText = 'display:flex;align-items:center;gap:16px;padding:14px;border:1px dashed #d0d5dd;border-radius:10px;background:#fafbff;margin-bottom:10px;';
            var thumb = document.createElement('div');
            thumb.style.cssText = 'width:64px;height:64px;border-radius:12px;background:#e9f0f8;display:flex;align-items:center;justify-content:center;font-size:30px;color:#0B3D91;overflow:hidden;flex:0 0 64px;';
            if (isEmpty) {
                thumb.innerHTML = '🛡️';
            } else {
                thumb.innerHTML = '<img src="' + escAttr(d.site.logoUrl) + '" style="width:100%;height:100%;object-fit:contain;">';
            }
            preview.appendChild(thumb);

            var right = document.createElement('div');
            right.style.cssText = 'flex:1;';
            var hint = document.createElement('div');
            hint.style.cssText = 'color:#667085;font-size:13px;margin-bottom:8px;';
            hint.textContent = isEmpty ? '当前：默认盾牌 SVG 图标' : '当前：自定义图片（点击右侧替换/清除）';
            right.appendChild(hint);

            var fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.cssText = 'display:none;';
            fileInput.addEventListener('change', function (ev) {
                var f = ev.target.files && ev.target.files[0];
                if (!f) return;
                if (f.size > 2 * 1024 * 1024) {
                    if (window.A) A.toast('图片大小不能超过 2MB', 'error', 3000);
                    return;
                }
                var reader = new FileReader();
                reader.onload = function (e) {
                    var b64 = String(e.target.result || '');
                    if (b64.length > 2 * 1024 * 1024) {
                        if (window.A) A.toast('转码后过大，请换更小的图片', 'error', 3000);
                        return;
                    }
                    d.site.logoUrl = b64;
                    // 刷新预览
                    thumb.innerHTML = '<img src="' + escAttr(b64) + '" style="width:100%;height:100%;object-fit:contain;">';
                    hint.textContent = '已上传：' + f.name + '（保存后生效）';
                    if (window.A) A.toast('Logo 已载入，记得点「保存全部」', 'info', 2500);
                };
                reader.readAsDataURL(f);
            });
            right.appendChild(fileInput);

            var btnRow = document.createElement('div');
            btnRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';
            var pickBtn = document.createElement('button');
            pickBtn.type = 'button';
            pickBtn.className = 'btn btn-primary';
            pickBtn.textContent = '选择图片…';
            pickBtn.style.cssText = 'padding:7px 14px;border-radius:7px;background:#0B3D91;color:#fff;border:0;cursor:pointer;font-weight:500;';
            pickBtn.addEventListener('click', function () { fileInput.click(); });
            btnRow.appendChild(pickBtn);

            var clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'btn';
            clearBtn.textContent = isEmpty ? '预览默认' : '清除，还原默认图标';
            clearBtn.style.cssText = 'padding:7px 14px;border-radius:7px;background:#fff;color:#344054;border:1px solid #d0d5dd;cursor:pointer;font-weight:500;';
            clearBtn.addEventListener('click', function () {
                d.site.logoUrl = '';
                thumb.innerHTML = '🛡️';
                hint.textContent = '当前：默认盾牌 SVG 图标';
                clearBtn.textContent = '预览默认';
                if (window.A) A.toast('已清除自定义 Logo（记得点保存）', 'info', 2500);
            });
            btnRow.appendChild(clearBtn);
            right.appendChild(btnRow);
            preview.appendChild(right);
            root.appendChild(preview);

            // Logo Alt 输入框
            var altGroup = document.createElement('div');
            altGroup.innerHTML = '<label style="font-weight:600;color:#344054;font-size:13px;margin-bottom:6px;display:block;">Logo 替代文字（无障碍 alt 属性）</label>'
                + '<input type="text" data-bind="site.logoAlt" placeholder="如：四川化工职业技术学院药环学院学生会Logo" style="width:100%;padding:10px 12px;border:1px solid #d0d5dd;border-radius:8px;font-size:14px;box-sizing:border-box;">';
            root.appendChild(altGroup);
            A.bindFormToObj(altGroup, d);
        })();

        var c2 = document.createElement('div');
        c2.className = 'admin-card';
        c2.innerHTML = '<div class="admin-card-head"><div><h3>导航栏菜单</h3><div class="desc">顶部导航（PC / 移动端）显示的菜单项，建议 6~8 项。</div></div></div>';
        box.appendChild(c2);
        A.renderReorderList(c2, {
            items: d.site.nav,
            cardName: '导航项',
            addLabel: '新增导航',
            minItems: 3,
            maxItems: 10,
            addEmpty: function () { return { label: '新菜单', href: '#section' }; },
            renderCard: function (n) {
                return '<div class="title">' + escHtml(n.label || '') + '</div>'
                    + '<div class="meta">链接：<code style="background:#f1f3f7;padding:2px 6px;border-radius:4px;">' + escHtml(n.href || '') + '</code></div>';
            },
            renderForm: function (n, i) {
                return '<div class="form-row">'
                    + '<div class="form-group col-6" style="grid-column: span 6;"><label>文字</label><input type="text" data-bind="site.nav.' + i + '.label"></div>'
                    + '<div class="form-group col-6" style="grid-column: span 6;"><label>链接（href）</label><input type="text" data-bind="site.nav.' + i + '.href" placeholder="#about 或 https://..."></div>'
                    + '</div>';
            },
            onAfterEdit: function (formEl) { A.bindFormToObj(formEl, d); }
        });

        var c3 = document.createElement('div');
        c3.className = 'admin-card';
        c3.innerHTML = '<div class="admin-card-head"><div><h3>页脚 · 品牌信息</h3><div class="desc">对应首页底部蓝色区域最左侧的 Logo、标语、地址栏。</div></div></div>';
        var b3 = document.createElement('div');
        b3.innerHTML = '<div class="form-row">'
            + '<div class="form-group col-6" style="grid-column: span 6;"><label>品牌名称（页脚标题）</label><input type="text" data-bind="site.footerBrand" placeholder="药品与环境工程学院学生会"></div>'
            + '<div class="form-group col-6" style="grid-column: span 6;"><label>标语 / Slogan（副标题下一行）</label><input type="text" data-bind="site.footerSlogan" placeholder="服务同学 · 引领成长 · 追求卓越 · 共创未来"></div>'
            + '</div>'
            + '<div class="form-group"><label>地址（红框位置，可换行用回车键）</label><textarea rows="2" data-bind="site.footerAddress" placeholder="四川省泸州市江阳区瓦窑坝62号&#10;四川化工职业技术学院"></textarea></div>'
            + '<div class="form-row">'
            + '<div class="form-group col-8" style="grid-column: span 8;"><label>版权声明（底部灰栏第一行）</label><input type="text" data-bind="site.footerCopyright"></div>'
            + '<div class="form-group col-4" style="grid-column: span 4;"><label>版权下一行（英文/备案号）</label><input type="text" data-bind="site.footerTech"></div>'
            + '</div>';
        c3.appendChild(b3);
        box.appendChild(c3);
        A.bindFormToObj(c3, d);

        var c4 = document.createElement('div');
        c4.className = 'admin-card';
        c4.innerHTML = '<div class="admin-card-head"><div><h3>社交媒体（可选）</h3><div class="desc">填写后会在页脚以图标按钮展示。</div></div></div>';
        var b4 = document.createElement('div');
        b4.innerHTML = '<div class="form-row">'
            + '<div class="form-group col-6" style="grid-column: span 6;"><label>微信公众号文章/二维码链接</label><input type="text" data-bind="site.social.wechat"></div>'
            + '<div class="form-group col-6" style="grid-column: span 6;"><label>QQ 群 / 链接</label><input type="text" data-bind="site.social.qq"></div>'
            + '<div class="form-group col-6" style="grid-column: span 6;"><label>微博链接</label><input type="text" data-bind="site.social.weibo"></div>'
            + '<div class="form-group col-6" style="grid-column: span 6;"><label>Bilibili / 抖音 / 其它</label><input type="text" data-bind="site.social.bilibili"></div>'
            + '</div>';
        c4.appendChild(b4);
        box.appendChild(c4);
        A.bindFormToObj(c4, d);

        // 页脚常用链接
        var c5 = document.createElement('div');
        c5.className = 'admin-card';
        c5.innerHTML = '<div class="admin-card-head"><div><h3>页脚 · 常用链接</h3><div class="desc">页脚第二列显示的常用系统链接集合，支持自定义排序与增删。</div></div></div>';
        var c5Label = document.createElement('div');
        c5Label.style.cssText = 'padding:0 24px 12px;';
        c5Label.innerHTML = '<label style="font-weight:600;color:#344054;font-size:13px;margin-bottom:6px;display:block;">列标题文字（HTML 中 <i>常用链接</i> 那四个字）</label>'
            + '<input type="text" data-bind="site.footerLinksLabel" placeholder="如：常用链接" style="width:100%;padding:10px 12px;border:1px solid #d0d5dd;border-radius:8px;font-size:14px;box-sizing:border-box;">';
        c5.appendChild(c5Label);
        box.appendChild(c5);
        A.bindFormToObj(c5Label, d);
        A.renderReorderList(c5, {
            items: d.site.footerLinks,
            cardName: '常用链接',
            addLabel: '新增常用链接',
            minItems: 0,
            maxItems: 15,
            addEmpty: function () { return { label: '新链接', href: 'https://' }; },
            renderCard: function (n) {
                return '<div class="title">' + escHtml(n.label || '') + '</div>'
                    + '<div class="meta">URL：<code style="background:#f1f3f7;padding:2px 6px;border-radius:4px;">' + escHtml(n.href || '') + '</code></div>';
            },
            renderForm: function (n, i) {
                return '<div class="form-row">'
                    + '<div class="form-group col-6" style="grid-column: span 6;"><label>链接文字</label><input type="text" data-bind="site.footerLinks.' + i + '.label"></div>'
                    + '<div class="form-group col-6" style="grid-column: span 6;"><label>跳转 URL（支持 https:// / # / mailto: / tel:）</label><input type="text" data-bind="site.footerLinks.' + i + '.href"></div>'
                    + '</div>';
            },
            onAfterEdit: function (formEl) { A.bindFormToObj(formEl, d); }
        });

        // 页脚加入我们
        var c6 = document.createElement('div');
        c6.className = 'admin-card';
        c6.innerHTML = '<div class="admin-card-head"><div><h3>页脚 · 加入我们</h3><div class="desc">页脚第三列显示的招新 / 报名 / 反馈入口，一般放站内锚点。</div></div></div>';
        var c6Label = document.createElement('div');
        c6Label.style.cssText = 'padding:0 24px 12px;';
        c6Label.innerHTML = '<label style="font-weight:600;color:#344054;font-size:13px;margin-bottom:6px;display:block;">列标题文字（HTML 中 <i>加入我们</i> 那四个字）</label>'
            + '<input type="text" data-bind="site.footerCtaLabel" placeholder="如：加入我们" style="width:100%;padding:10px 12px;border:1px solid #d0d5dd;border-radius:8px;font-size:14px;box-sizing:border-box;">';
        c6.appendChild(c6Label);
        box.appendChild(c6);
        A.bindFormToObj(c6Label, d);
        A.renderReorderList(c6, {
            items: d.site.footerCta,
            cardName: '报名入口',
            addLabel: '新增入口',
            minItems: 0,
            maxItems: 10,
            addEmpty: function () { return { label: '新入口', href: '#contact' }; },
            renderCard: function (n) {
                return '<div class="title">' + escHtml(n.label || '') + '</div>'
                    + '<div class="meta">跳转：<code style="background:#f1f3f7;padding:2px 6px;border-radius:4px;">' + escHtml(n.href || '') + '</code></div>';
            },
            renderForm: function (n, i) {
                return '<div class="form-row">'
                    + '<div class="form-group col-6" style="grid-column: span 6;"><label>入口文字</label><input type="text" data-bind="site.footerCta.' + i + '.label"></div>'
                    + '<div class="form-group col-6" style="grid-column: span 6;"><label>跳转 URL（常用站内锚点如 #contact / #structure）</label><input type="text" data-bind="site.footerCta.' + i + '.href"></div>'
                    + '</div>';
            },
            onAfterEdit: function (formEl) { A.bindFormToObj(formEl, d); }
        });
    }

    /* =======================================================
     * renderAccount
     * ===================================================== */
    function renderAccount(box) {
        var user = A.getStoredUser();
        var token = null;
        try { token = JSON.parse(A.getToken() || 'null'); } catch(e) {}

        var c1 = document.createElement('div');
        c1.className = 'admin-card';
        c1.innerHTML = '<div class="admin-card-head"><div><h3>修改登录密码</h3><div class="desc">密码以加盐 SHA-1 形式存储在浏览器 localStorage 中，请勿使用重要通用密码。</div></div></div>';
        var body = document.createElement('form');
        body.autocomplete = 'off';
        body.innerHTML = ''
            + '<div class="form-group"><label>当前账号</label><input type="text" value="' + escHtml(user.username) + '" disabled></div>'
            + '<div class="form-group"><label>原密码</label><input type="password" id="pwdOld" autocomplete="off"></div>'
            + '<div class="form-row">'
            +   '<div class="form-group col-6" style="grid-column: span 6;"><label>新密码（≥6 位）</label><input type="password" id="pwdNew" autocomplete="new-password"></div>'
            +   '<div class="form-group col-6" style="grid-column: span 6;"><label>再次输入新密码</label><input type="password" id="pwdNew2" autocomplete="new-password"></div>'
            + '</div>'
            + '<div style="display:flex;gap:10px;">'
            +   '<button type="submit" class="btn btn-primary">保存新密码</button>'
            +   '<button type="reset" class="btn btn-outline">清空</button>'
            + '</div>';
        body.addEventListener('submit', function (e) {
            e.preventDefault();
            var oldP = $('pwdOld').value, newP = $('pwdNew').value, newP2 = $('pwdNew2').value;
            if (A.hashPassword(oldP) !== user.passwordHash) { toast('原密码错误', 'error'); return; }
            if (!newP || newP.length < 6) { toast('新密码至少 6 位', 'warn'); return; }
            if (newP !== newP2) { toast('两次输入的新密码不一致', 'warn'); return; }
            var newHash = A.hashPassword(newP);
            var btn = body.querySelector('button[type="submit"]');
            var originalText = btn ? btn.textContent : '';
            if (btn) { btn.disabled = true; btn.textContent = '正在同步到云端…'; }

            // 先写本地，再同步云端；云端失败也保留本地（离线可用）
            user.passwordHash = newHash;
            localStorage.setItem(A.CONSTANTS.USER_KEY, JSON.stringify(user));

            function done(ok, errMsg) {
                A.pushLog('SAVE', ok ? '修改了管理员密码（已同步云端）' : '修改了管理员密码（云端同步失败，仅本地生效）');
                if (btn) { btn.disabled = false; btn.textContent = originalText; }
                body.reset();
                if (ok) {
                    toast('密码修改成功（已同步云端，其他设备需用新密码登录）', 'success', 3000);
                } else {
                    toast('密码已在本设备修改，但云端同步失败：' + (errMsg || '网络错误') + '。其他设备仍可用旧密码登录，请稍后重试。', 'warn', 5000);
                }
            }

            if (window.SB && typeof window.SB.upsertUser === 'function') {
                window.SB.upsertUser({
                    username: user.username,
                    password: newHash,   // 已经哈希过的值
                    pwChanged: true,     // 告诉 upsertUser 这就是新密码哈希，直接写入
                    role: user.role || 'admin'
                }).then(function (r) {
                    done(!!(r && r.ok), r && r.error ? (r.error.message || String(r.error)) : null);
                }).catch(function (err) {
                    done(false, err && err.message ? err.message : String(err));
                });
            } else {
                done(true);  // 无 Supabase，纯本地模式
            }
        });
        c1.appendChild(body);
        box.appendChild(c1);

        var c2 = document.createElement('div');
        c2.className = 'admin-card';
        c2.innerHTML = '<div class="admin-card-head"><div><h3>登录会话</h3></div></div>';
        var info = document.createElement('div');
        info.style.lineHeight = '2';
        if (token) {
            info.innerHTML = ''
                + '<div>当前登录账号：<strong style="color:#0B3D91;">' + escHtml(token.username) + '</strong></div>'
                + '<div>登录时间：' + new Date(token.loginAt).toLocaleString('zh-CN') + '</div>';
        }
        c2.appendChild(info);
        box.appendChild(c2);

        var c3 = document.createElement('div');
        c3.className = 'admin-card';
        c3.innerHTML = '<div class="admin-card-head"><div><h3>操作日志（最近 50 条）</h3><div class="desc">登录、修改、保存、重置等操作的本地记录。</div></div></div>';
        var logs = [];
        try { logs = JSON.parse(localStorage.getItem(A.CONSTANTS.LOG_KEY) || '[]'); } catch(e) {}
        var t = document.createElement('table');
        t.className = 'admin-table';
        t.innerHTML = '<thead><tr><th style="width:80px;">类型</th><th>详情</th><th style="width:170px;">时间</th></tr></thead>';
        var tb = document.createElement('tbody');
        if (!logs.length) tb.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#868c98;padding:24px;">暂无记录</td></tr>';
        else logs.slice(0, 50).forEach(function (l) {
            var tr = document.createElement('tr');
            var cls = l.type === 'SAVE' ? 'success' : l.type === 'RESET' ? 'danger' : l.type === 'LOGIN' ? 'accent' : l.type === 'LOGOUT' ? 'warning' : 'primary';
            tr.innerHTML = '<td><span class="badge ' + cls + '">' + escHtml(l.type || '-') + '</span></td>'
                + '<td>' + escHtml(l.msg || '') + '</td>'
                + '<td style="color:#868c98;">' + new Date(l.at).toLocaleString('zh-CN') + '</td>';
            tb.appendChild(tr);
        });
        t.appendChild(tb);
        c3.appendChild(t);
        box.appendChild(c3);
    }

    /* =======================================================
     * 挂载到全局
     * ===================================================== */
    window.ADMIN_RENDERS = {
        dashboard: renderDashboard,
        slides:    renderSlides,
        stats:     renderStats,
        about:     renderAbout,
        structure: renderStructure,
        news:      renderNews,
        showcase:  renderShowcase,
        shortcuts: renderShortcuts,
        contact:   renderContact,
        site:      renderSite,
        account:   renderAccount
    };
})();
