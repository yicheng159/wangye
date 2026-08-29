/* =============================================================
 * detail.js  —  详情页渲染
 * 数据来源：cms-bridge.js 里的 getCMSContent()  +  __CMS_HELPERS
 * ============================================================= */
(function () {
    'use strict';

    function qs(p, c) { return (c || document).querySelector(p); }
    function qsa(p, c) { return Array.prototype.slice.call((c || document).querySelectorAll(p)); }

    // ---------- 读 URL：?type=news|showcase|dept&id=xxx ----------
    function getQuery() {
        var s = location.search || '';
        var out = { type: '', id: '' };
        if (!s) return out;
        s.replace(/(?:[?&])([^=&]+)=([^&]*)/g, function (_, k, v) {
            try { out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) {}
            return '';
        });
        return out;
    }

    // ---------- 正文渲染：如果 body 有段落就按类型渲染，否则根据 item 属性派生长文 ----------
    function renderBody(item, type) {
        // 1. body 是数组： [{type:'p',text:''}, {type:'h2',text:''}, {type:'img',src:'',caption:''}, {type:'quote',text:''}, {type:'list',items:[]}]
        if (Array.isArray(item.body) && item.body.length) {
            return renderRichBody(item.body);
        }
        // 2. fallback：派生一段「自动生成」的详情正文
        if (type === 'news')     return renderFallbackNewsBody(item);
        if (type === 'showcase') return renderFallbackShowcaseBody(item);
        if (type === 'dept')     return renderFallbackDeptBody(item);
        return '';
    }

    // ---------- 线性 SVG 小图标（去 emoji） ----------
    function ic(name) {
        // viewBox 16x16，统一 stroke-width 1.4，和 .mi CSS 一致
        var paths = {
            date:    '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><rect x="2.4" y="3.2" width="11.2" height="10.4" rx="1.4" ry="1.4"/><path d="M2.4 5.6 h11.2"/><path d="M5.2 1.6 v3.2"/><path d="M10.8 1.6 v3.2"/></svg>',
            pen:     '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><path d="M11.4 2.1 13.9 4.6 6.2 12.3 2.5 13.4 3.6 9.7z"/></svg>',
            source:  '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.4 4.0 h11.2"/><path d="M2.4 8.0 h11.2"/><path d="M2.4 12.0 h7.2"/><path d="M11.6 10.2 14.2 12.0 11.6 13.8z"/></svg>',
            tag:     '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.6 2.4 1.6 9.2 9.2 14.0 14.4 8.4 11.8 5.8 7.6 1.6z"/><circle cx="5.0" cy="6.2" r="1.0"/></svg>',
            loc:     '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><path d="M8.0 1.6 C5.2 1.6 3.0 3.8 3.0 6.6 3.0 9.7 8.0 14.4 8.0 14.4 S13.0 9.7 13.0 6.6 C13.0 3.8 10.8 1.6 8.0 1.6 z"/><circle cx="8.0" cy="6.6" r="2.0"/></svg>',
            cam:     '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.0 4.4 H4.6 L6.0 2.8 H10.0 L11.4 4.4 H14.0 C14.9 4.4 15.6 5.1 15.6 6.0 L15.6 12.4 C15.6 13.3 14.9 14.0 14.0 14.0 H2.0 C1.1 14.0 0.4 13.3 0.4 12.4 L0.4 6.0 C0.4 5.1 1.1 4.4 2.0 4.4 z"/><circle cx="8.0" cy="9.2" r="2.6"/></svg>',
            ppl:     '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><circle cx="5.6" cy="5.0" r="2.4"/><circle cx="11.6" cy="5.8" r="1.8"/><path d="M1.2 14.0 C1.2 11.4 3.2 9.8 5.6 9.8 S10.0 11.4 10.0 14.0"/><path d="M9.6 14.0 C9.4 12.4 10.4 11.2 12.0 11.0 C13.4 10.8 14.6 11.7 14.8 13.1"/></svg>',
            lead:    '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8.0" cy="4.6" r="2.4"/><path d="M2.0 14.0 C2.0 10.6 4.7 8.6 8.0 8.6 S14.0 10.6 14.0 14.0"/></svg>',
            phone:   '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.0 2.2 C3.0 1.5 3.5 1.0 4.2 1.0 H6.0 C6.4 1.0 6.8 1.2 7.0 1.5 L8.4 4.0 C8.5 4.3 8.5 4.6 8.3 4.9 L6.9 6.4 C7.8 8.5 9.4 10.1 11.4 11.0 L12.9 9.6 C13.2 9.4 13.5 9.4 13.8 9.6 L16.2 11.0 C16.5 11.2 16.7 11.6 16.7 12.0 V13.8 C16.7 14.5 16.2 15.0 15.5 15.0 C8.1 15.0 2.0 8.9 2.0 1.5"/></svg>',
            folder:  '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.6 4.0 C1.6 3.3 2.2 2.8 2.9 2.8 H6.3 L7.7 4.2 H13.1 C13.8 4.2 14.4 4.7 14.4 5.4 V11.8 C14.4 12.5 13.8 13.0 13.1 13.0 H2.9 C2.2 13.0 1.6 12.5 1.6 11.8 z"/></svg>',
            fire:    '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><path d="M8.0 1.4 C8.0 4.4 10.0 5.6 10.0 7.4 10.0 9.2 8.8 10.6 7.2 10.6 5.6 10.6 4.2 9.2 4.2 7.4 C4.2 5.4 6.4 4.2 6.4 2.0 5.2 3.0 4.2 4.6 4.0 6.6 3.8 8.8 5.2 10.8 7.2 10.8 9.2 10.8 10.8 9.0 10.4 6.8 10.0 4.6 9.0 2.8 8.0 1.4 z"/></svg>',
            letter:  '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.6" y="3.0" width="12.8" height="10.0" rx="1.4" ry="1.4"/><path d="M2.4 4.0 8.0 8.6 13.6 4.0"/></svg>',
            copy:    '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.2" y="3.2" width="8.4" height="8.4" rx="1.4" ry="1.4"/><path d="M5.2 3.2 V2.2 H13.4 C14.1 2.2 14.6 2.7 14.6 3.4 V10.8 H13.6"/></svg>',
            check:   '<svg class="mi" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.4 8.4 6.2 12.0 13.6 3.6"/></svg>'
        };
        return paths[name] || '';
    }

    function renderRichBody(body) {
        var H = window.__CMS_HELPERS || {};
        var esc = H.esc || function (s) { return String(s||''); };
        var html = '';
        body.forEach(function (b) {
            if (!b || !b.type) return;
            switch (b.type) {
                case 'p':     html += '<p>' + String(b.text || b.content || '').split(/\n+/).join('<br>') + '</p>'; break;
                case 'h2':    html += '<h2>' + esc(b.text) + '</h2>'; break;
                case 'h3':    html += '<h3>' + esc(b.text) + '</h3>'; break;
                case 'quote': html += '<blockquote>' + String(b.text || b.content || '').split(/\n+/).join('<br>') + '</blockquote>'; break;
                case 'list':
                    var items = Array.isArray(b.items) ? b.items : [];
                    html += '<ul>' + items.map(function (li) { return '<li>' + (typeof li === 'string' ? esc(li) : esc(li.text || li.label)) + '</li>'; }).join('') + '</ul>';
                    break;
                case 'img':
                    var cap = b.caption || '';
                    html += '<img class="content-img" src="' + esc(b.src || b.url || '') + '" alt="' + esc(cap || b.alt || '') + '"' + (cap ? ' data-caption="'+esc(cap)+'"' : '') + ' onclick="window.__LB && window.__LB.open(event)" tabindex="0">';
                    if (cap) html += '<p class="fig-cap">' + ic('cam') + ' ' + esc(cap) + '</p>';
                    break;
                case 'divider': html += '<hr style="border:0;border-top:1px dashed rgba(21,26,46,.12);margin:26px 0;">'; break;
                default: html += '<p>' + esc(b.text || b.content || '') + '</p>';
            }
        });
        return html;
    }

    function renderFallbackNewsBody(n) {
        var H = window.__CMS_HELPERS || {};
        var esc = H.esc || function (s) { return String(s||''); };
        var sum = n.summary || '活动顺利结束，取得了丰硕的成果。';
        var cat = n.category || '新闻';
        return ''
            + '<h2>活动背景</h2>'
            + '<p>近日，药品与环境工程学院学生会' + esc(cat) + '「' + esc(n.title) + '」在学院的高度重视与师生的共同努力下顺利开展。为了更好地服务全院同学，营造积极向上的校园文化氛围，学生会坚持"立德树人"的根本任务，围绕思想引领、学风建设、校园文化、权益服务与社会实践等核心工作，精心策划并组织实施本次' + esc(cat) + '。</p>'
            + '<blockquote>以' + esc(cat) + '为载体，把青春奋斗融入药环学院发展蓝图，让每一位同学都能在参与中成长、在奉献中收获。</blockquote>'
            + '<h2>主要内容</h2>'
            + '<p>' + esc(sum) + '</p>'
            + '<ul>'
            +   '<li>围绕主题的策划与筹备：学生会各部门分工协作，对方案进行多轮研讨，确保活动流程顺畅、后勤保障到位。</li>'
            +   '<li>现场执行与师生互动：活动现场设置了丰富的互动环节，同学们积极参与，现场气氛热烈。</li>'
            +   '<li>媒体传播与总结宣传：宣传部与新媒体中心全程跟踪报道，推文与短视频在官方平台同步上线。</li>'
            +   '<li>权益反馈与持续改进：活动结束后通过问卷收集同学建议，形成《' + esc(cat) + '总结报告》指导后续工作。</li>'
            + '</ul>'
            + '<h2>活动意义</h2>'
            + '<p>本次' + esc(cat) + '的成功举办，不仅为药环学子提供了展现自我、锻炼能力的平台，也进一步增强了学院师生的凝聚力。学生会将继续以"服务同学、引领成长"为宗旨，推出更多高质量的活动与举措，推动优良学风和文明校园建设走深走实。</p>';
    }

    function renderFallbackShowcaseBody(s) {
        var H = window.__CMS_HELPERS || {};
        var esc = H.esc || function (s) { return String(s||''); }
        return ''
            + '<h2>现场回顾</h2>'
            + '<p>' + esc(s.desc || '精彩瞬间，定格青春。') + '本次活动以"青春、成长、担当、奉献"为主旋律，充分展现了药环学子蓬勃向上的精神风貌与团结协作的团队意识。</p>'
            + '<blockquote>镜头记录青春，光影传递温度。</blockquote>'
            + '<h2>精彩看点</h2>'
            + '<ul>'
            +   '<li>创意十足的节目编排与视觉呈现，彰显青年一代的审美张力与文化自信。</li>'
            +   '<li>现场观众深度互动，欢呼声、掌声将氛围推向一个又一个高潮。</li>'
            +   '<li>工作人员严谨有序的执行能力，保障活动安全、流畅地完成。</li>'
            +   '<li>活动结束后合影留念，每一张笑脸都值得被珍藏与回味。</li>'
            + '</ul>'
            + '<h2>写在最后</h2>'
            + '<p>每一个精彩瞬间的背后，都是无数次的打磨与排练。感谢台前幕后所有同学的付出，也期待未来有更多药环学子站上属于自己的舞台，绽放属于自己的光芒。</p>';
    }

    function renderFallbackDeptBody(d) {
        var H = window.__CMS_HELPERS || {};
        var esc = H.esc || function (s) { return String(s||''); }
        var fullDesc = (d.fullDesc && String(d.fullDesc).trim()) ? d.fullDesc : (d.desc || '暂无详细介绍。');
        return ''
            + '<h2>部门概述</h2>'
            + String(fullDesc).split(/\n+/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('')
            + '<h2>核心职责</h2>'
            + '<ul>'
            +   '<li>制度建设：制定部门工作计划与考核标准，确保日常工作有序推进。</li>'
            +   '<li>活动落地：围绕学院中心工作，独立或协同其他部门完成活动筹备与执行。</li>'
            +   '<li>团队培养：定期开展部门内部培训、团建、经验分享，提升干部综合能力。</li>'
            +   '<li>反馈改进：建立问题收集与复盘机制，持续优化工作方法与服务质量。</li>'
            + '</ul>'
            + '<h2>加入我们</h2>'
            + '<p>如果你对 <b>' + esc(d.name || '') + '</b> 的工作充满兴趣，希望在大学生活中锻炼自己、结交志同道合的伙伴，欢迎通过下方联系方式与我们取得联系。我们相信，每一位新成员的加入，都将为部门注入全新的活力与创意。</p>';
    }

    // ---------- 图集 lightbox（全局） ----------
    function initLightbox() {
        var lb = qs('#lightbox');
        if (!lb) return;
        var img = qs('#lbImg');
        var cap = qs('#lbCap');
        var cnt = qs('#lbCount');
        var currentSet = []; // [{src,caption}]
        var idx = 0;
        function show(i) {
            if (!currentSet.length) return;
            if (i < 0) i = currentSet.length - 1;
            if (i >= currentSet.length) i = 0;
            idx = i;
            var it = currentSet[i] || {};
            img.src = it.src || '';
            img.alt = it.caption || '';
            cap.textContent = it.caption || '';
            cnt.textContent = (i + 1) + ' / ' + currentSet.length;
        }
        function open(set, startIdx) {
            if (!set || !set.length) return;
            currentSet = set;
            idx = startIdx || 0;
            lb.classList.add('is-open');
            lb.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            show(idx);
        }
        function close() {
            lb.classList.remove('is-open');
            lb.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            img.removeAttribute('src');
        }
        function next() { show(idx + 1); }
        function prev() { show(idx - 1); }

        lb.addEventListener('click', function (e) {
            if (e.target === lb) return close();
            var cls = e.target && e.target.getAttribute && e.target.getAttribute('data-lb-close');
            var act = e.target && e.target.getAttribute && e.target.getAttribute('data-lb-act');
            if (cls !== null) return close();
            if (act === 'next') return next();
            if (act === 'prev') return prev();
        });
        document.addEventListener('keydown', function (e) {
            if (!lb.classList.contains('is-open')) return;
            if (e.key === 'Escape')     return close();
            if (e.key === 'ArrowRight') return next();
            if (e.key === 'ArrowLeft')  return prev();
        });
        window.__LB = {
            open: function (ev) {
                // 支持被 <img onclick="window.__LB.open(event)"> 调用
                var src = ev && ev.target && ev.target.src;
                var cap = ev && ev.target && ev.target.getAttribute('data-caption');
                // 尝试在兄弟图里找同 gallery
                var imgs = ev && ev.target ? qsa('img.content-img, .g-grid img, .detail-cover img') : [];
                var set = [];
                var start = 0;
                imgs.forEach(function (i, k) {
                    if (i.src === src) start = k;
                    set.push({ src: i.src, caption: i.getAttribute('data-caption') || i.alt || '' });
                });
                if (!set.length && src) set.push({ src: src, caption: cap || '' });
                open(set, start);
            },
            openSet: open
        };
    }

    // ---------- 把可点击的图片绑定 lightbox ----------
    function bindGalleryToLB() {
        // 图集 & 封面 & 正文图 → 合成一个全局图片集
        var imgs = qsa('.detail-cover img, .detail-body img.content-img, .g-grid img');
        var set = [];
        imgs.forEach(function (img) {
            var cap = img.getAttribute('data-caption') || img.alt || '';
            set.push({ src: img.src, caption: cap });
        });
        imgs.forEach(function (img, idx) {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', function () {
                window.__LB && window.__LB.openSet(set, idx);
            });
        });
    }

    // ---------- 工具：按 relatedIds 优先 + 同类型补足 构建推荐列表 ----------
    function prioritizeRelated(sameTypeList, relatedIds, excludeId, max) {
        max = max || 5;
        if (!Array.isArray(sameTypeList) || !sameTypeList.length) return [];
        var idMap = {};
        sameTypeList.forEach(function (x) { if (x && x.id) idMap[x.id] = x; });
        var picked = [];
        var pickedIds = {};
        if (Array.isArray(relatedIds) && relatedIds.length) {
            relatedIds.forEach(function (id) {
                if (picked.length >= max) return;
                if (!id || pickedIds[id]) return;
                if (excludeId != null && id === excludeId) return;
                if (idMap[id]) { picked.push(idMap[id]); pickedIds[id] = true; }
            });
        }
        if (picked.length >= max) return picked;
        sameTypeList.forEach(function (x) {
            if (picked.length >= max) return;
            if (!x || !x.id) return;
            if (pickedIds[x.id]) return;
            if (excludeId != null && x.id === excludeId) return;
            picked.push(x);
            pickedIds[x.id] = true;
        });
        return picked;
    }

    // ---------- 通用：生成 side 的相关推荐 / 部门列表 ----------
    function renderRelatedSide(items, curId, type) {
        if (!Array.isArray(items) || !items.length) return '';
        var H = window.__CMS_HELPERS;
        var esc = H && H.esc ? H.esc : function (s) { return String(s||''); };
        var detailUrl = H && H.detailUrl ? H.detailUrl : function (t, i) { return 'detail.html?type='+t+'&id='+i; };
        var others = items.filter(function (x) { return x.id !== curId; }).slice(0, 5);
        if (!others.length) return '';
        var html = '<div class="side-card"><h4 class="side-title">相关推荐</h4><div class="rel-list">';
        others.forEach(function (it) {
            var cov;
            if (type === 'news')     cov = it.cover   || 'assets/carousel-slide-2.jpg';
            if (type === 'showcase') cov = it.image   || 'assets/carousel-slide-3.jpg';
            if (type === 'dept')     cov = (Array.isArray(it.gallery) && it.gallery[0] && it.gallery[0].src) || it.image || 'assets/hero-banner.jpg';
            var date = it.date || '';
            if (type === 'dept') date = '部门人数 ' + (it.size || '—');
            html += '<a class="rel-item" href="' + esc(detailUrl(type, it.id)) + '">'
                +      '<img src="' + esc(cov) + '" alt="'+esc(it.title||it.name||'')+'">'
                +      '<div><div class="t">' + esc(it.title || it.name || '') + '</div>'
                +        '<div class="m">' + esc(date) + '</div></div>'
                +   '</a>';
        });
        html += '</div></div>';
        return html;
    }

    function renderDeptListSide(depts, currentId) {
        var H = window.__CMS_HELPERS;
        var esc = H && H.esc ? H.esc : function (s) { return String(s||''); };
        var detailUrl = H && H.detailUrl ? H.detailUrl : function (t, i) { return 'detail.html?type='+t+'&id='+i; };
        if (!Array.isArray(depts) || !depts.length) return '';
        var html = '<div class="side-card"><h4 class="side-title">全部部门</h4><div class="dept-list">';
        depts.forEach(function (d) {
            // icon：去 emoji，只用短文字（部门中文名首字或部门名的前 2 字符）
            var iconText = '';
            var iname = String(d.name || '');
            if (iname && /部$/.test(iname)) { iconText = iname.slice(0, 1); }
            else if (iname.length >= 2) { iconText = iname.slice(0, 1); }
            html += '<a href="' + esc(detailUrl('dept', d.id)) + '"' + (d.id === currentId ? ' class="active"' : '') + '>'
                +      '<span class="ic">' + esc(iconText || '部') + '</span><span>' + esc(iname) + '</span>'
                +   '</a>';
        });
        html += '</div></div>';
        return html;
    }

    // ---------- 主入口 ----------
    function render() {
        initLightbox();

        var H = window.__CMS_HELPERS;
        var cms = (typeof window.getCMSContent === 'function') ? window.getCMSContent() : (window.CMS_DEFAULTS || {});
        var esc = H && H.esc ? H.esc : function (s) { return String(s||''); };
        var detailUrl = H && H.detailUrl ? H.detailUrl : function (t, i) { return 'detail.html?type='+t+'&id='+i; };
        var brand = H && H.brand ? H.brand(cms) : { siteTitle: '药品与环境工程学院学生会', logoTitle: '药品与环境工程学院', logoSubtitle: '学生会 · Student Union' };

        // 顶栏 & 页脚品牌文字覆盖
        qsa('[data-brand="logoTitle"]').forEach(function (e) { e.textContent = brand.logoTitle; });
        qsa('[data-brand="logoSubtitle"]').forEach(function (e) { e.textContent = brand.logoSubtitle; });
        qsa('[data-brand="siteTitle"]').forEach(function (e) { e.textContent = brand.siteTitle; });

        var q = getQuery();
        var type = (q.type || '').toLowerCase();
        var id = q.id || '';
        var typeLabelMap = { news: '新闻活动', showcase: '风采展示', dept: '组织架构' };
        var typeAnchorMap = { news: '#news', showcase: '#showcase', dept: '#structure' };

        var found;
        if (type === 'news')     found = H && H.findNewsById    ? H.findNewsById(cms, id)     : null;
        if (type === 'showcase') found = H && H.findShowcaseById? H.findShowcaseById(cms, id) : null;
        if (type === 'dept')     found = H && H.findDeptById    ? H.findDeptById(cms, id)     : null;

        var bcType = qs('#bcType');
        var bcItem = qs('#bcItem');
        var content = qs('#detailContent');
        var nf = qs('#notFound');

        // 统一设置 bcType：可点击回到首页对应板块（即使 404 也能作为有效的导航入口）
        var typeLabel = typeLabelMap[type] || '内容详情';
        var typeHref = 'index.html' + (typeAnchorMap[type] || '#news');
        if (bcType) {
            bcType.textContent = typeLabel;
            if (bcType.tagName === 'A') bcType.setAttribute('href', typeHref);
        }

        if (!found || !found.item) {
            // 404
            if (bcItem) {
                bcItem.textContent = '未找到内容';
                if (bcItem.tagName === 'A') bcItem.setAttribute('href', '#');
            }
            if (nf) nf.classList.remove('hidden'), nf.setAttribute('aria-hidden', 'false');
            if (content) content.classList.add('hidden');
            document.title = (typeLabelMap[type] ? (typeLabelMap[type] + ' · ') : '') + '内容未找到 · ' + brand.siteTitle;
            qs('#nfTitle').textContent = typeLabelMap[type] ? ('抱歉，该' + typeLabelMap[type].replace(/s$|动$|示$|构$/, '') + '未找到') : '抱歉，内容不存在';
            qs('#nfDesc').textContent = '您访问的编号 ' + esc(id || '(空)') + ' 未命中。请返回首页继续浏览其他内容。';
            return;
        }

        var item = found.item;
        var list = found.list;
        var idx  = found.index;
        var prev = list[idx - 1];
        var next = list[idx + 1];

        var headTitle = item.title || item.name || '详情';
        if (bcItem) {
            bcItem.textContent = headTitle;
            if (bcItem.tagName === 'A') bcItem.setAttribute('href', location.pathname + location.search + location.hash);
        }
        document.title = headTitle + ' · ' + brand.siteTitle;

        content.classList.remove('detail-loading');
        var inner = '';

        // 1. hero（两列：左文本 — 右封面；无封面时只保留文本列）
        inner += '<section class="detail-hero"><div class="detail-hero-inner">';
        inner += '<div class="hero-text">';
        var typeTextMap = { news: '新闻活动', showcase: '风采展示', dept: '组织架构' };
        inner += '<div class="detail-type type-' + esc(type) + '">' + esc(typeTextMap[type] || '详情') + '</div>';
        inner += '<h1 class="detail-title">' + esc(headTitle) + '</h1>';

        // meta 行（按类型，全部 SVG 线性图标）
        inner += '<div class="detail-meta">';
        if (type === 'news') {
            inner += '<span>' + ic('date')   + esc(item.date || '-') + '</span>';
            inner += '<span>' + ic('pen')    + esc(item.author || '学生会秘书处') + '</span>';
            inner += '<span>' + ic('source') + esc(item.source || '药环学院公众号') + '</span>';
            inner += '<span>' + ic('tag')    + esc(item.category || '新闻') + '</span>';
        } else if (type === 'showcase') {
            inner += '<span>' + ic('date') + esc(item.date || '-') + '</span>';
            inner += '<span>' + ic('loc')  + esc(item.location || '-') + '</span>';
            inner += '<span>' + ic('cam')  + esc(item.photographer || '-') + '</span>';
            if (item.tag) inner += '<span>' + ic('tag') + esc(item.tag) + '</span>';
        } else if (type === 'dept') {
            inner += '<span>' + ic('ppl')   + '部门人数：' + esc(item.size || '—') + '</span>';
            inner += '<span>' + ic('lead')  + '部长：'    + esc(item.chair || '—') + '</span>';
            if (item.vice)  inner += '<span>' + ic('lead')  + '副部长：'  + esc(item.vice) + '</span>';
            if (item.phone) inner += '<span>' + ic('phone') + esc(item.phone) + '</span>';
        }
        inner += '</div></div>'; // hero-text

        // 2. 封面图（部门用 gallery[0] / image；showcase 用 image；news 用 cover）
        var cover = '';
        if (type === 'news')     cover = item.cover   || '';
        if (type === 'showcase') cover = item.image   || '';
        if (type === 'dept')     cover = (Array.isArray(item.gallery) && item.gallery[0] && item.gallery[0].src) || item.image || '';
        if (cover) {
            var cap = (type === 'showcase' ? (item.desc || headTitle) : headTitle);
            inner += '<div class="detail-cover"><img src="' + esc(cover) + '" alt="' + esc(headTitle) + '" data-caption="' + esc(cap) + '"></div>';
        }
        inner += '</div></section>'; // detail-hero-inner / detail-hero

        // 3. grid = 正文 + 侧栏
        inner += '<div class="detail-grid">';
        inner += '<div class="detail-body">';
        inner += renderBody(item, type);

        // 图集区（非封面图）
        var rest = (Array.isArray(item.gallery) ? item.gallery : []).filter(function (g) {
            return g && g.src && g.src !== cover;
        });
        if (rest.length) {
            inner += '<div class="detail-gallery"><h3>' + ic('folder') + '图集（' + rest.length + '）</h3>';
            inner += '<div class="g-grid">';
            rest.forEach(function (g) {
                inner += '<img src="' + esc(g.src) + '" alt="' + esc(g.caption || headTitle) + '" data-caption="' + esc(g.caption || headTitle) + '">';
            });
            inner += '</div></div>';
        }

        // 标签
        if (type === 'news') {
            inner += '<div class="detail-tags">';
            ['学生会', item.category || '', '药环学院', item.author ? (item.author.split(/[·\s]+/)[0]) : ''].forEach(function (t) {
                t = (t || '').trim(); if (!t) return;
                inner += '<span class="tag-chip alt"># ' + esc(t) + '</span>';
            });
            if (item.featured) inner += '<span class="tag-chip">' + ic('fire') + ' 推荐</span>';
            inner += '</div>';
        } else if (type === 'showcase') {
            inner += '<div class="detail-tags">';
            ['药环风采', item.tag || '', '青春校园'].forEach(function (t) { if (t) inner += '<span class="tag-chip alt"># ' + esc(t) + '</span>'; });
            inner += '</div>';
        } else if (type === 'dept') {
            inner += '<div class="detail-tags">';
            ['学生会九大部门', item.name || ''].forEach(function (t) { if (t) inner += '<span class="tag-chip alt"># ' + esc(t) + '</span>'; });
            inner += '</div>';
        }

        // 上下篇（非部门才需要；部门用侧栏部门列表）
        if (type !== 'dept') {
            inner += '<div class="pager">';
            inner += prev ? ('<a class="prev" href="' + esc(detailUrl(type, prev.id)) + '"><span class="arr">‹</span><span class="meta"><span class="label">上一篇 · ' + ({news:'新闻',showcase:'风采'}[type]) + '</span><span class="title">' + esc(prev.title || prev.name || '—') + '</span></span></a>')
                          : '<a class="prev empty"><span class="arr">‹</span><span class="meta"><span class="label">上一篇</span><span class="title">已经是第一篇啦</span></span></a>';
            inner += next ? ('<a class="next" href="' + esc(detailUrl(type, next.id)) + '"><span class="arr">›</span><span class="meta"><span class="label">下一篇 · ' + ({news:'新闻',showcase:'风采'}[type]) + '</span><span class="title">' + esc(next.title || next.name || '—') + '</span></span></a>')
                          : '<a class="next empty"><span class="arr">›</span><span class="meta"><span class="label">下一篇</span><span class="title">已经是最后一篇啦</span></span></a>';
            inner += '</div>';
        }
        inner += '</div>'; // body

        // 4. 侧栏
        inner += '<aside class="detail-side">';
        if (type === 'dept') {
            var deptHeadIcon = '';
            var diname = String(item.name || '');
            deptHeadIcon = diname.slice(0, 1) || '部';
            inner += '<div class="side-card"><h4 class="side-title">部门成员</h4><div class="dept-ppl">'
                +   '<div class="dept-ppl-row"><span class="l">部门</span><span class="r">' + esc(deptHeadIcon) + ' · ' + esc(diname) + '</span></div>'
                +   '<div class="dept-ppl-row"><span class="l">部长</span><span class="r">' + esc(item.chair || '—') + '</span></div>'
                +   '<div class="dept-ppl-row"><span class="l">副部长</span><span class="r">' + esc(item.vice || '—') + '</span></div>'
                +   '<div class="dept-ppl-row"><span class="l">人数</span><span class="r">' + esc(item.size || '—') + '</span></div>'
                +   '<div class="dept-ppl-row"><span class="l">联系电话</span><span class="r">' + (item.phone ? ('<a href="tel:' + esc(String(item.phone).replace(/[^0-9+]/g,'')) + '">' + esc(item.phone) + '</a>') : '—') + '</span></div>'
                + '</div>'
                + '<div class="dept-cta-row">'
                +   '<a class="btn btn-primary" href="index.html#contact">' + ic('letter') + '投递加入意向</a>'
                +   '<a class="btn btn-ghost" href="index.html#structure">← 回到架构页</a>'
                + '</div></div>';
            inner += renderDeptListSide(cms.structure && cms.structure.depts, item.id);
            // 部门详情页的新闻推荐：优先用勾选的 relatedIds（仅属于新闻类的id生效）
            inner += renderRelatedSide(
                prioritizeRelated(cms.news && cms.news.items, item.relatedIds, null, 5),
                null, 'news'
            );
        } else {
            // 同类型推荐：1) 勾选的 relatedIds 优先  2) 不够再从同类型补足
            inner += renderRelatedSide(
                prioritizeRelated(list, item.relatedIds, item.id, 5),
                null, type
            );
            if (type === 'news') inner += renderDeptListSide(cms.structure && cms.structure.depts, null);
            if (type === 'showcase') inner += renderRelatedSide(
                prioritizeRelated(cms.news && cms.news.items, item.relatedIds, null, 5),
                null, 'news'
            );
            inner += '<div class="side-card"><h4 class="side-title">分享给朋友</h4>'
                + '<p class="share-desc">复制页面链接即可分享给同学；刷新或直接打开都可访问同一内容。</p>'
                + '<div class="share-url" id="shareUrl">'
                + esc(location.href) + '</div>'
                + '<div class="dept-cta-row"><button class="btn btn-gold" id="copyLinkBtn">' + ic('copy') + '复制链接</button>'
                + '<a class="btn btn-ghost" href="index.html#news">返回首页</a></div></div>';
        }
        inner += '</aside></div>';

        content.innerHTML = inner;
        if (nf) nf.classList.add('hidden');

        // 图点击 → lightbox
        bindGalleryToLB();

        // 复制链接按钮
        var copyBtn = qs('#copyLinkBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                var url = location.href;
                var done = function () {
                        var original = copyBtn.innerHTML;
                        copyBtn.innerHTML = ic('check') + '已复制';
                        setTimeout(function () { copyBtn.innerHTML = original; }, 1500);
                    };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(done, function () {
                        var ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select();
                        try { document.execCommand('copy'); done(); } catch(e){}
                        document.body.removeChild(ta);
                    });
                }
            });
        }
    }

    if (document.readyState !== 'loading') render();
    else document.addEventListener('DOMContentLoaded', render, { once: true });
})();
