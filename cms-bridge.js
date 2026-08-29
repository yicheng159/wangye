/* =============================================================
 * cms-bridge.js  —  前端与 CMS 数据桥接
 * 读取 localStorage['gxc_admin_cms_v1']，兜底 CMS_DEFAULTS
 * 驱动：
 *   1) data-cms="path" 属性覆盖文本/图片/链接
 *   2) 数据驱动的容器重建（轮播、统计、导航、部门、新闻、风采、联系方式、社交、表单主题）
 *   3) 热更新：storage / 'cms:update' 事件触发即时重渲染，并派发 cms:applied 通知其他脚本（如新闻tab、滚动动画）
 * ============================================================= */
(function () {
    'use strict';
    var CMS_KEY = 'gxc_admin_cms_v1';

    function clone(o) { try { return JSON.parse(JSON.stringify(o)); } catch(e) { return o; } }
    function deepMerge(dst, src) {
        if (Array.isArray(src)) return clone(src);
        if (src === null || typeof src !== 'object') return src;
        if (dst === null || typeof dst !== 'object') return clone(src);
        var out = clone(dst);
        for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = deepMerge(out[k], src[k]);
        return out;
    }
    function getPath(obj, p) {
        var parts = p.split('.');
        var o = obj;
        for (var i = 0; i < parts.length; i++) {
            if (o == null) return undefined;
            o = o[parts[i]];
        }
        return o;
    }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function $(sel, ctx) { return (ctx || document).querySelector(sel); }
    function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
    // 详情页 URL 生成（首页/后台 都可以直接访问根下的 detail.html）
    function detailUrl(type, id) {
        return 'detail.html?type=' + encodeURIComponent(type || '') + '&id=' + encodeURIComponent(id || '');
    }

    /* ===================== 读数据 ===================== */
    function recalc() {
        var def = window.CMS_DEFAULTS ? clone(window.CMS_DEFAULTS) : {};
        var data = def;
        try {
            var raw = localStorage.getItem(CMS_KEY);
            if (raw) {
                try { data = deepMerge(def, JSON.parse(raw)); } catch(e) { data = def; }
            }
        } catch(e) { data = def; }

        /* ---------------- 向后兼容：补上旧版 CMS 缺失的数组 / 对象字段 ---------------- */
        function deptSlug(name, i) {
            if (!name) return 'd' + i;
            var map = { '办公室':'office','学习部':'study','宣传部':'publicity','文体部':'arts','外联部':'liaison','权益部':'rights','纪检部':'discipline','志愿服务部':'volunteer','新媒体中心':'newmedia' };
            return map[name] || ('d' + i);
        }
        function ensureFields(list, enrich) {
            if (!Array.isArray(list)) return list;
            list.forEach(function (it, i) { enrich(it || {}, i); });
            return list;
        }
        // 1. 导航栏：按默认项顺序合并（保留用户自定义项，但补全新增项）
        var defNav = (def.site && Array.isArray(def.site.nav)) ? def.site.nav : [];
        if (!data.site) data.site = {};
        if (!Array.isArray(data.site.nav)) {
            data.site.nav = clone(defNav);
        } else {
            // 对每个默认 nav 项，如果用户 nav 里没有同 href 的，按默认位置插入
            var existingHrefs = {};
            data.site.nav.forEach(function (it) { if (it && it.href) existingHrefs[it.href] = true; });
            for (var i = defNav.length - 1; i >= 0; i--) {
                var defIt = defNav[i];
                if (!defIt || !defIt.href) continue;
                if (!existingHrefs[defIt.href]) {
                    var insertAt = i;
                    if (insertAt > data.site.nav.length) insertAt = data.site.nav.length;
                    data.site.nav.splice(insertAt, 0, clone(defIt));
                }
            }
        }

        // 2. 快捷方式模块：旧版 CMS 中完全没有 shortcuts 结构
        if (def.shortcuts) {
            if (!data.shortcuts) {
                data.shortcuts = clone(def.shortcuts);
            } else if (Array.isArray(data.shortcuts)) {
                // 旧格式为数组，转换为对象格式
                var oldItems = data.shortcuts;
                data.shortcuts = clone(def.shortcuts);
                data.shortcuts.items = oldItems;
            } else {
                if (!data.shortcuts.heading) data.shortcuts.heading = def.shortcuts.heading;
                if (!data.shortcuts.subheading) data.shortcuts.subheading = def.shortcuts.subheading;
                if (!Array.isArray(data.shortcuts.items) || !data.shortcuts.items.length) {
                    data.shortcuts.items = clone(def.shortcuts.items);
                }
            }
        }

        // 3. 页脚：常用链接 + 加入我们（2 个列表 + 标签）
        if (!data.site) data.site = {};
        var dsite = def.site || {};
        if (!data.site.footerLinksLabel && dsite.footerLinksLabel) data.site.footerLinksLabel = dsite.footerLinksLabel;
        if (!data.site.footerCtaLabel && dsite.footerCtaLabel)     data.site.footerCtaLabel = dsite.footerCtaLabel;
        if (!Array.isArray(data.site.footerLinks) || !data.site.footerLinks.length) {
            if (dsite.footerLinks) data.site.footerLinks = clone(dsite.footerLinks);
        }
        if (!Array.isArray(data.site.footerCta) || !data.site.footerCta.length) {
            if (dsite.footerCta) data.site.footerCta = clone(dsite.footerCta);
        }

        // 4. 组织架构：届次横幅 + 主席团 + 部门增强字段（旧 CMS 只含 structure.depts.name/desc/chair/phone）
        var dStruct = def.structure || {};
        if (!data.structure) {
            data.structure = clone(dStruct);
        } else {
            if (!data.structure.heading) data.structure.heading = dStruct.heading;
            if (!data.structure.subheading) data.structure.subheading = dStruct.subheading;
            if (!data.structure.term) {
                data.structure.term = clone(dStruct.term);
            } else {
                var t = data.structure.term;
                var dt = dStruct.term || {};
                if (!t.congressNo) t.congressNo = dt.congressNo;
                if (!t.academicYear) t.academicYear = dt.academicYear;
                if (!t.slogan) t.slogan = dt.slogan;
                // 派生统计字段（presidiumCount/deptCount/totalSize）不在这里兜底，
                // 由 applyStructure 在渲染时基于实际列表派生；
                // 但如果用户在后台显式设置了（localStorage 里有），会在 deepMerge 时保留。
                if (!Array.isArray(t.presidium) || !t.presidium.length) {
                    if (dt.presidium) t.presidium = clone(dt.presidium);
                }
            }
            // 对每个部门，如果缺 vice/size/icon/id/fullDesc/gallery，则按 defaults 同索引或同 name 兜底
            if (Array.isArray(dStruct.depts) && dStruct.depts.length && !Array.isArray(data.structure.depts)) {
                data.structure.depts = clone(dStruct.depts);
            } else if (Array.isArray(data.structure.depts)) {
                data.structure.depts.forEach(function (d, i) {
                    var dd = (dStruct.depts && dStruct.depts[i]) ? dStruct.depts[i] : {};
                    if (!d.vice && dd.vice) d.vice = dd.vice;
                    if (!d.size && dd.size) d.size = dd.size;
                    if (!d.icon && dd.icon) d.icon = dd.icon;
                    if (!d.desc && dd.desc) d.desc = dd.desc;
                    if (!d.name && dd.name) d.name = dd.name;
                    if (!d.chair && dd.chair) d.chair = dd.chair;
                    if (!d.phone && dd.phone) d.phone = dd.phone;
                    if (!d.fullDesc && dd.fullDesc) d.fullDesc = dd.fullDesc;
                    if (!d.image  && dd.image)  d.image  = dd.image;
                    if (!d.id) d.id = (dd.id ? dd.id : deptSlug(d.name || '', i));
                    if (!Array.isArray(d.body)) d.body = Array.isArray(dd.body) ? clone(dd.body) : [];
                    if (!Array.isArray(d.gallery)) {
                        d.gallery = Array.isArray(dd.gallery) ? clone(dd.gallery) : [];
                        if (!d.gallery.length && (d.image || dd.image)) d.gallery = [{src: d.image || dd.image, caption: (d.name || '') + '风采'}];
                    }
                    if (!Array.isArray(d.relatedIds)) d.relatedIds = Array.isArray(dd.relatedIds) ? clone(dd.relatedIds) : [];
                });
            }
        }

        // 5. 新闻活动：补 id / author / source / body / gallery / relatedIds；id 优先保留用户存储
        if (data.news) {
            if (!Array.isArray(data.news.items)) data.news.items = clone(def.news && def.news.items || []);
            ensureFields(data.news.items, function (n, i) {
                if (!n.id) n.id = 'n-' + i;
                if (!n.author) n.author = '学生会秘书处';
                if (!n.source) n.source = '药环学院公众号';
                if (!Array.isArray(n.body)) n.body = [];
                if (!Array.isArray(n.gallery)) {
                    n.gallery = [];
                    if (n.cover) n.gallery = [{src: n.cover, caption: (n.title || '') + ' 配图'}];
                }
                if (!Array.isArray(n.relatedIds)) n.relatedIds = [];
            });
        } else if (def.news) {
            data.news = clone(def.news);
        }

        // 6. 风采展示：补 id / date / location / body / gallery / relatedIds / photographer
        if (data.showcase) {
            if (!Array.isArray(data.showcase.items)) data.showcase.items = clone(def.showcase && def.showcase.items || []);
            ensureFields(data.showcase.items, function (s, i) {
                if (!s.id) s.id = 's-' + i;
                if (!s.date) s.date = '2026-0' + ((i % 9) + 1) + '-' + ((i * 3 + 5) % 27 + 1);
                if (!s.location) s.location = '四川化工职业技术学院';
                if (!s.photographer) s.photographer = '药环学院 · 新媒体中心';
                if (!Array.isArray(s.body)) s.body = [];
                if (!Array.isArray(s.gallery)) {
                    s.gallery = [];
                    if (s.image) s.gallery = [{src: s.image, caption: (s.title || '') + '精彩瞬间'}];
                }
                if (!Array.isArray(s.relatedIds)) s.relatedIds = [];
            });
        } else if (def.showcase) {
            data.showcase = clone(def.showcase);
        }

        // 补齐 contact.messages（在线留言）
        if (!data.contact) data.contact = clone(def.contact || {});
        if (!Array.isArray(data.contact.messages)) data.contact.messages = [];
        // 补齐 contact.infos（联系信息数组）：云端可能有旧格式 info 字符串
        if (!Array.isArray(data.contact.infos)) {
            if (data.contact.info && typeof data.contact.info === 'string') {
                data.contact.infos = [{ icon: '📍', label: '联系信息', value: data.contact.info }];
            } else if (def.contact && Array.isArray(def.contact.infos)) {
                data.contact.infos = clone(def.contact.infos);
            } else {
                data.contact.infos = [];
            }
        }

        return data;
    }
    window.getCMSContent = recalc;

    /* ===================== 通用字段覆盖 ===================== */
    function applySimpleFields(cms) {
        var fields = document.querySelectorAll('[data-cms]');
        fields.forEach(function (el) {
            var p = el.getAttribute('data-cms');
            // 1. 精确键名匹配
            var v = getPath(cms, p);
            // 2. 为旧 HTML 里的特殊键做别名映射
            if (v === undefined) {
                if (p === 'about.paragraph1') v = (cms.about && cms.about.paragraphs && cms.about.paragraphs[0]) || '';
                else if (p === 'about.paragraph2') v = (cms.about && cms.about.paragraphs && cms.about.paragraphs[1]) || '';
                else if (p === 'about.image') v = 'assets/about-section.jpg';
                else if (p === 'contact.address') v = (cms.contact && cms.contact.infos && cms.contact.infos[0] && cms.contact.infos[0].value) || '';
                else if (p === 'contact.phone')   v = (cms.contact && cms.contact.infos && cms.contact.infos[1] && cms.contact.infos[1].value) || '';
                else if (p === 'contact.email')   v = (cms.contact && cms.contact.infos && cms.contact.infos[2] && cms.contact.infos[2].value) || '';
                else if (p === 'contact.hours')   v = (cms.contact && cms.contact.infos && cms.contact.infos[3] && cms.contact.infos[3].value) || '';
            }
            if (v === undefined || v === null) v = '';
            v = String(v);

            if (el.tagName === 'TITLE') {
                try { document.title = v; } catch(e) {}
                return;
            }
            var tag = (el.tagName || '').toLowerCase();
            if (tag === 'img') {
                if (v) el.setAttribute('src', v);
                return;
            }
            if (tag === 'meta') {
                if (v) el.setAttribute('content', v);
                return;
            }
            if (tag === 'input' || tag === 'textarea') {
                el.setAttribute('value', v);
                return;
            }
            if (/\.(href|src)$/.test(p)) {
                el.setAttribute(/src$/.test(p) ? 'src' : 'href', v);
                return;
            }
            // 普通文本节点：含换行的用 <br> 替代；避免覆盖已有子结构但保留 data-cms 元素内容
            if (el.querySelector && el.querySelector('[data-cms]')) {
                // 存在嵌套 data-cms → 仅替换最顶层纯文本（对 hero.title-main 不适用，手动处理）
                el.childNodes.forEach(function (n) {
                    if (n.nodeType === 3) { n.nodeValue = v; /* text-only，first one */ }
                });
            } else {
                el.innerHTML = v.replace(/\n/g, '<br>');
            }
        });

        // Hero 两个 CTA 按钮（它们无 data-cms，但在 hero-actions 里）
        var heroActions = document.querySelectorAll('.hero-actions .btn');
        if (heroActions.length >= 2 && cms.site) {
            if (cms.site.ctaPrimary) heroActions[0].textContent = cms.site.ctaPrimary;
            if (cms.site.ctaPrimaryHref) heroActions[0].setAttribute('href', cms.site.ctaPrimaryHref);
            if (cms.site.ctaSecondary) heroActions[1].textContent = cms.site.ctaSecondary;
            if (cms.site.ctaSecondaryHref) heroActions[1].setAttribute('href', cms.site.ctaSecondaryHref);
        }
    }

    /* ===================== 列表重建 ===================== */

    /* 0. Logo 图标渲染：site.logoUrl 非空 → 替换容器内 .logo-icon / .nav-brand-mark 为 <img> */
    function applyLogoIcons(cms) {
        var logoUrl = (cms.site && cms.site.logoUrl) ? String(cms.site.logoUrl).trim() : '';
        var logoAlt = (cms.site && cms.site.logoAlt) ? String(cms.site.logoAlt) : 'Logo';
        var containers = document.querySelectorAll('[data-cms-container="site.logo"]');
        if (!containers.length) return;

        // 未上传 → 还原默认图标（通过恢复 CSS class 的默认 content）
        containers.forEach(function (wrap) {
            var target = wrap.querySelector('.logo-icon, .nav-brand-mark');
            if (!target) return;
            if (logoUrl) {
                // 替换成图片
                var parent = target.parentNode;
                var next = target.nextSibling;
                var img = document.createElement('img');
                img.className = target.className ? (target.className + ' logo-img') : 'logo-img';
                img.setAttribute('src', logoUrl);
                img.setAttribute('alt', logoAlt);
                img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
                parent.removeChild(target);
                if (next) parent.insertBefore(img, next);
                else parent.appendChild(img);
            } else {
                // logoUrl 为空时确保 DOM 中只有 svg / 默认 mark
                if (target.tagName === 'IMG') {
                    // 替换回默认 SVG mark（最小兜底）
                    var defSvg = '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4L8 10V22C8 28.63 12.87 34.47 20 36C27.13 34.47 32 28.63 32 22V10L20 4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 20L18.5 23.5L26 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                    target.insertAdjacentHTML('afterend', defSvg);
                    target.parentNode.removeChild(target);
                }
            }
        });
    }

    /* 1. 轮播图：重建 .carousel-item 子节点 和 dots */
    function applySlides(cms) {
        var carousel = document.getElementById('heroCarousel');
        var dotsBox  = document.getElementById('carouselDots');
        var slides = cms.slides || [];
        if (!carousel || !slides.length) return;

        // 清空
        carousel.innerHTML = '';
        slides.forEach(function (s, i) {
            var item = document.createElement('div');
            item.className = 'carousel-item' + (i === 0 ? ' active' : '');
            item.setAttribute('data-index', i);
            var bg = document.createElement('div');
            bg.className = 'carousel-bg carousel-bg-' + ((i % 3) + 1);
            if (s.bg) bg.style.backgroundImage = 'url("' + s.bg + '")';
            bg.style.backgroundSize = 'cover';
            bg.style.backgroundPosition = 'center';
            var ov = document.createElement('div');
            ov.className = 'carousel-overlay carousel-overlay-' + ((i % 3) + 1);
            ov.style.background = 'linear-gradient(135deg,' + (s.overlayFrom || 'rgba(11,61,145,0.55)') + ',' + (s.overlayTo || 'rgba(46,125,50,0.35)') + ')';
            item.appendChild(bg);
            item.appendChild(ov);
            carousel.appendChild(item);
        });

        // 重建 dots
        if (dotsBox) {
            dotsBox.innerHTML = '';
            slides.forEach(function (_, i) {
                var b = document.createElement('button');
                b.className = 'carousel-dot' + (i === 0 ? ' active' : '');
                b.setAttribute('data-slide', i);
                b.setAttribute('aria-label', '第' + (i + 1) + '张');
                dotsBox.appendChild(b);
            });
        }

        // 同步 #heroTitle / #heroTitleAccent / #heroSubtitle 为第一屏内容（供初始显示）
        var s0 = slides[0] || {};
        var heroTitle = document.getElementById('heroTitle');
        var heroAccent = document.getElementById('heroTitleAccent');
        var heroSub = document.getElementById('heroSubtitle');
        if (heroTitle) {
            // title 结构是 纯文本<br><span class="hero-title-accent">...</span>
            heroTitle.innerHTML = esc(s0.title || '') + '<br><span class="hero-title-accent">' + esc(s0.accent || '') + '</span>';
        }
        if (heroAccent && !heroTitle) heroAccent.textContent = s0.accent || '';
        if (heroSub) heroSub.textContent = s0.subtitle || '';
    }

    /* 2. 导航 */
    function applyNav(cms) {
        var ul = document.getElementById('navMenu');
        var items = cms.site && cms.site.nav ? cms.site.nav : [];
        if (!ul || !items.length) return;
        ul.innerHTML = '';
        items.forEach(function (it, idx) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = it.href || '#';
            a.className = 'nav-link' + (idx === 0 ? ' active' : '');
            a.textContent = it.label || '';
            li.appendChild(a);
            ul.appendChild(li);
        });
        // 如果 script.js 有挂 navActive，cms:applied 后会自动重新绑定
        var footerLinks = document.querySelectorAll('.footer-links ul');
        // 更新页脚第一列"快速导航"
        if (footerLinks && footerLinks[0]) {
            footerLinks[0].innerHTML = items.map(function (it) {
                return '<li><a href="' + esc(it.href || '#') + '">' + esc(it.label || '') + '</a></li>';
            }).join('');
        }
        // 页脚第二列"常用链接"
        if (footerLinks && footerLinks[1] && cms.site && Array.isArray(cms.site.footerLinks)) {
            footerLinks[1].innerHTML = cms.site.footerLinks.map(function (it) {
                return '<li><a href="' + esc(it.href || '#') + '">' + esc(it.label || '') + '</a></li>';
            }).join('') || '<li style="opacity:.5;">（暂无）</li>';
        }
        // 页脚第三列"加入我们"
        if (footerLinks && footerLinks[2] && cms.site && Array.isArray(cms.site.footerCta)) {
            footerLinks[2].innerHTML = cms.site.footerCta.map(function (it) {
                return '<li><a href="' + esc(it.href || '#') + '">' + esc(it.label || '') + '</a></li>';
            }).join('') || '<li style="opacity:.5;">（暂无）</li>';
        }
    }

    /* 3. 数据统计 */
    function applyStats(cms) {
        var grid = document.getElementById('statsGrid');
        var stats = cms.stats || [];
        if (!grid || !stats.length) return;
        grid.innerHTML = '';
        stats.forEach(function (s) {
            var el = document.createElement('div');
            el.className = 'stat-item';
            var iconHtml = '';
            if (s.icon) {
                iconHtml = '<div class="stat-icon" style="color:' + esc(s.color || '#0B3D91') + ';margin-bottom:8px;font-size:20px;line-height:1;">' + esc(s.icon) + '</div>';
            }
            el.innerHTML = iconHtml
                + '<div class="stat-number" data-target="' + esc(String(s.value || 0)) + '" data-suffix="' + esc(s.suffix || '') + '">0</div>'
                + '<div class="stat-label">' + esc(s.label || '') + '</div>';
            grid.appendChild(el);
        });
    }

    /* 4. 关于我们 价值观 chips */
    function applyAboutValues(cms) {
        var box = document.getElementById('aboutValues');
        if (!box) return;
        var vals = (cms.about && cms.about.values ? String(cms.about.values) : '')
            .split(/[·、,，;；\/\n]+/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (!vals.length) { box.innerHTML = ''; return; }
        var defaultSVGs = [
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17"/><path d="M2 12L12 17L22 12"/></svg>',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6V12L16 14"/></svg>',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21V19C17 17.9 16.6 16.9 15.8 16.2 15.1 15.4 14.1 15 13 15H5C3.9 15 2.9 15.4 2.2 16.2 1.4 16.9 1 17.9 1 19V21"/><circle cx="9" cy="7" r="4"/></svg>',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20l9-14H3z"/></svg>'
        ];
        var subLabels = { '爱国担当': '胸怀家国，与时代同行', '服务奉献': '以同学需求为导向', '团结协作': '凝聚集体智慧与力量',
                          '追求卓越': '精益求精不断超越', '求真创新': '守正创新开拓进取' };
        box.innerHTML = vals.map(function (v, i) {
            var svg = defaultSVGs[i % defaultSVGs.length];
            var sub = subLabels[v] || (i % 2 ? '落地有声，行动有力' : '价值理念，始终坚守');
            return '<div class="value-item">'
                + '<div class="value-icon">' + svg + '</div>'
                + '<div><h4>' + esc(v) + '</h4><p>' + esc(sub) + '</p></div>'
                + '</div>';
        }).join('');
    }

    /* 5. 主席团 chips（向后兼容：旧页面如有此容器则保留，新结构由 applyStructure 负责） */
    function applyPresidiumChips(cms) {
        var box = document.getElementById('presidiumChips');
        if (!box) return;
        var chips = (cms.structure && cms.structure.presidium && Array.isArray(cms.structure.presidium.chips)) ? cms.structure.presidium.chips : [];
        if (!chips.length) {
            var t = cms.structure && cms.structure.term;
            if (t && Array.isArray(t.presidium) && t.presidium.length) {
                chips = t.presidium.map(function (p) {
                    return (p.title || '主席团成员') + ' · ' + (p.name || '');
                }).slice(0, 12);
            }
        }
        if (!chips.length) { box.innerHTML = ''; return; }
        box.innerHTML = chips.map(function (c) {
            return '<div class="member-chip">' + esc(c) + '</div>';
        }).join('');
        // 同步主席团描述段落
        var descEl = document.querySelector('[data-cms="structure.presidium.desc"]');
        if (descEl && cms.structure && cms.structure.presidium && cms.structure.presidium.desc) {
            descEl.textContent = cms.structure.presidium.desc;
        }
    }

    /* 6. 组织架构：派生统计 + 渲染届次横幅 / 主席团 / 部门卡 */
    function applyStructure(cms) {
        var s = cms.structure || {};
        var depts = Array.isArray(s.depts) ? s.depts : [];
        var term = s.term || {};
        var pres = Array.isArray(term.presidium) ? term.presidium : [];

        // ---------- 派生统计（term 对象上的三个字段，无论是否显式配置都写回，保证 SimpleFields/data-cms 取到值） ----------
        function totalSize() {
            var sum = 0;
            depts.forEach(function (d) {
                var m = String(d.size || '').match(/(\d+)/);
                sum += m ? parseInt(m[1], 10) || 0 : 0;
            });
            return sum;
        }
        var pCount = pres.length ? (pres.length + ' 人') : '—';
        var dCount = depts.length ? (depts.length + ' 个') : '—';
        var tSize = totalSize();
        var totalWithPres = tSize ? (tSize + pres.length) + ' 人' : '—';
        term.presidiumCount = (term.presidiumCount !== undefined && String(term.presidiumCount).trim() !== '') ? String(term.presidiumCount) : pCount;
        term.deptCount      = (term.deptCount      !== undefined && String(term.deptCount).trim() !== '')      ? String(term.deptCount)      : dCount;
        term.totalSize      = (term.totalSize      !== undefined && String(term.totalSize).trim() !== '')      ? String(term.totalSize)      : totalWithPres;

        // ---------- 主席团成员网格 ----------
        var pGrid = document.getElementById('presidiumGrid');
        if (pGrid) {
            if (!pres.length) {
                pGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,0.6);padding:20px;">（暂无主席团成员，请在后台"组织架构"中添加）</div>';
            } else {
                pGrid.innerHTML = pres.map(function (p) {
                    var name = p.name || '主席团成员';
                    var firstChar = name.slice(0, 1);
                    var photoHtml = '';
                    if (p.photo) {
                        photoHtml = '<img src="' + esc(p.photo) + '" alt="' + esc(name) + '" onerror="this.remove();">';
                    }
                    return '<div class="presidium-item">'
                        + '<div class="presidium-avatar">' + (photoHtml || esc(firstChar)) + '</div>'
                        + '<div class="presidium-title">' + esc(p.title || '主席团成员') + '</div>'
                        + '<h4>' + esc(name) + '</h4>'
                        + '<div class="presidium-class">' + esc(p.className || '') + '</div>'
                        + '</div>';
                }).join('');
            }
        }

        // ---------- 部门网格（增强：部员数标签 + 副部长 + 部长 + 联系电话 + 点击弹详情） ----------
        var grid = document.getElementById('deptsGrid');
        if (!grid) return;
        if (!depts.length) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#868c98;">暂无部门内容</div>'; return; }
        var palette = ['#1e88e5','#e53935','#43a047','#fb8c00','#8e24aa','#00acc1','#f4511e','#6d4c41','#3949ab','#00838f'];
        grid.innerHTML = depts.map(function (d, i) {
            var c = palette[i % palette.length];
            var iconHtml = d.icon ? esc(d.icon) : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
            return '<div class="dept-card" style="--dept-color:' + esc(c) + ';" role="button" tabindex="0" aria-label="查看' + esc(d.name || '部门') + '详情" data-dept-index="' + i + '">'
                + '<div class="dept-top">'
                +   '<div class="dept-icon" style="--dept-color:' + esc(c) + ';">' + iconHtml + '</div>'
                +   '<div class="dept-meta">'
                +     '<h4>' + esc(d.name || '部门') + '</h4>'
                +     (d.size ? '<span class="dept-size-badge" style="--dept-color:' + esc(c) + ';">👥 ' + esc(d.size) + '</span>' : '')
                +   '</div>'
                + '</div>'
                + '<div class="dept-desc">' + esc(d.desc || '') + '</div>'
                + '<div class="dept-people">'
                +   '<div class="dept-people-row"><span class="dept-people-label">部 长</span><span class="dept-people-value">' + esc(d.chair || '—') + '</span></div>'
                +   (d.vice ? '<div class="dept-people-row"><span class="dept-people-label">副部长</span><span class="dept-people-value">' + esc(d.vice) + '</span></div>' : '')
                +   (d.phone ? '<div class="dept-people-row"><span class="dept-people-label">联系电话</span><a class="dept-phone" href="tel:' + esc(String(d.phone).replace(/[^0-9+]/g, '')) + '" data-stop-modal>' + esc(d.phone) + '</a></div>' : '')
                + '</div>'
                + '<div class="dept-action" aria-hidden="true">'
                +   '<a class="dept-detail-link" href="' + esc(detailUrl('dept', d.id || deptSlug(d.name || '', i))) + '" data-stop-modal title="打开部门详情页">查看详情页 <span class="arr">→</span></a>'
                +   '<span class="dept-preview-hint">点击卡片查看预览</span>'
                + '</div>'
                + '</div>';
        }).join('');

        // 部门卡点击 → 弹详情（使用事件委托，重建列表也不用重新绑定）
        if (!window.__deptModalBound) {
            window.__deptModalBound = true;
            document.addEventListener('click', function (e) {
                var card = e.target && e.target.closest && e.target.closest('.dept-card');
                if (!card) return;
                // 点到电话 a 标签，不拦截（让 tel: 正常拨号）
                if (e.target && e.target.closest && e.target.closest('[data-stop-modal]')) return;
                var idx = parseInt(card.getAttribute('data-dept-index') || '0', 10);
                openDeptModal(idx);
            });
            document.addEventListener('keydown', function (e) {
                if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('dept-card')) {
                    e.preventDefault();
                    var idx = parseInt(e.target.getAttribute('data-dept-index') || '0', 10);
                    openDeptModal(idx);
                }
            });
            // 关闭按钮 / 点击遮罩 / ESC
            document.addEventListener('click', function (e) {
                if (e.target && e.target.closest && e.target.closest('[data-modal-close]')) closeDeptModal();
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') closeDeptModal();
            });
        }

        function openDeptModal(idx) {
            var dept = (depts[idx] || {});
            var c = palette[idx % palette.length];
            var modal = document.getElementById('deptModal');
            if (!modal) return;
            var img = document.getElementById('deptModalImg');
            var hero = document.getElementById('deptModalHero');
            if (img && hero) {
                if (dept.image) {
                    img.src = dept.image;
                    img.style.display = '';
                    img.onerror = function () { img.style.display = 'none'; };
                    img.onload = function () { img.style.display = ''; };
                    hero.style.background = '';
                } else {
                    img.removeAttribute('src');
                    img.style.display = 'none';
                    hero.style.background = 'linear-gradient(135deg, ' + c + ' 0%, #0B3D91 55%, #2E7D32 100%)';
                }
            }
            var iconEl = document.getElementById('deptModalIcon');
            if (iconEl) { iconEl.textContent = dept.icon || '🏢'; iconEl.style.background = c; }
            setText('deptModalBadge', '职能部门');
            setText('deptModalName', dept.name || '部门');
            setText('deptModalSize', '👥 ' + (dept.size || '—'));
            setText('deptModalChair', '部长：' + (dept.chair || '—'));
            // 介绍：优先 fullDesc，否则 desc，兜底友好文案
            var descEl = document.getElementById('deptModalDesc');
            if (descEl) {
                var txt = (dept.fullDesc && String(dept.fullDesc).trim()) ? dept.fullDesc : (dept.desc || '暂无详细介绍，敬请期待。你也可以在管理后台「组织架构 → 部门列表」中为该部门编写详细介绍。');
                descEl.innerHTML = String(txt).split(/\n+/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
            }
            setText('sideChair', dept.chair || '—');
            setText('sideSize', dept.size || '—');
            var viceRow = document.getElementById('sideViceRow');
            if (viceRow) viceRow.style.display = dept.vice ? '' : 'none';
            setText('sideVice', dept.vice || '—');
            var phoneA = document.getElementById('sidePhone');
            if (phoneA) {
                var p = dept.phone || '暂无';
                phoneA.textContent = p;
                phoneA.href = /^[0-9+\-]+$/.test(String(p).replace(/\s/g,'')) ? ('tel:' + String(p).replace(/[^0-9+]/g, '')) : '#';
            }
            // CTA 跳联系我们 + 打开完整详情页
            var joinBtn = document.getElementById('deptModalJoinBtn');
            if (joinBtn) {
                joinBtn.onclick = function () {
                    closeDeptModal();
                    setTimeout(function () {
                        var cs = document.getElementById('contact');
                        if (cs) cs.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 200);
                };
            }
            var fullBtn = document.getElementById('deptModalFullBtn');
            if (fullBtn) {
                var fullUrl = detailUrl('dept', dept.id || deptSlug(dept.name || '', idx));
                fullBtn.setAttribute('href', fullUrl);
                fullBtn.onclick = function () { closeDeptModal(); };
            }
            // 打开动画
            modal.setAttribute('aria-hidden', 'false');
            modal.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            var box = modal.querySelector('.dept-modal-box');
            if (box) try { box.focus(); } catch (e) {}
        }
        function setText(id, v) {
            var el = document.getElementById(id); if (el) el.textContent = v == null ? '' : v;
        }
        function closeDeptModal() {
            var modal = document.getElementById('deptModal');
            if (!modal) return;
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
        // 暴露给调试 / 后续扩展
        window.__openDeptModal = openDeptModal;
        window.__closeDeptModal = closeDeptModal;
    }

    /* 7. 新闻 tabs + cards */
    function applyNews(cms) {
        var news = cms.news || {};
        var cats = Array.isArray(news.categories) && news.categories.length ? news.categories : ['全部','新闻','活动','通知'];
        var def = news.defaultCategory || cats[0];
        // 分页设置：做最小化防呆兜底（NaN/<=0一律走默认10）
        var pageSize = parseInt(news.pageSize, 10);
        if (!(pageSize > 0)) pageSize = 10;
        var loadStep = parseInt(news.loadStep, 10);
        if (!(loadStep > 0)) loadStep = 10;
        var loadMoreLabel = String(news.loadMoreLabel || '加载更多内容');
        var collapseLabel = String(news.collapseLabel || '收起更多内容');
        var tabs = document.getElementById('newsTabs');
        if (tabs) {
            tabs.innerHTML = cats.map(function (c) {
                var tabVal = (c === '全部') ? 'all' : c;
                return '<button class="tab-btn' + (c === def ? ' active' : '') + '" data-tab="' + esc(tabVal) + '">' + esc(c) + '</button>';
            }).join('');
        }
        var grid = document.getElementById('newsGrid');
        if (!grid) return;
        // 把分页配置挂到 grid 上，供前端分页脚本读取（CMS 热更新也会覆盖）
        grid.setAttribute('data-page-size', String(pageSize));
        grid.setAttribute('data-load-step', String(loadStep));
        grid.setAttribute('data-label-load-more', esc(loadMoreLabel));
        grid.setAttribute('data-label-collapse', esc(collapseLabel));

        var items = Array.isArray(news.items) ? news.items : [];
        if (!items.length) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#868c98;">暂无新闻内容</div>'; return; }

        // 分类 → tag color class 映射：tag-academic / cultural / volunteer / notice 这些旧 CSS 类名；若未命中则生成中性
        function tagClass(cat) {
            var map = { '学术讲座':'tag-academic', '新闻':'tag-academic',
                        '文体活动':'tag-cultural', '活动':'tag-cultural',
                        '志愿服务':'tag-volunteer', '志愿':'tag-volunteer',
                        '通知公告':'tag-notice', '通知':'tag-notice' };
            return map[cat] || 'tag-academic';
        }

        // 先统计一次 items 中 featured 的数量，再把 pageSize（总数含 featured）换算成"普通卡上限"
        var featuredTotal = 0;
        items.forEach(function (n) { if (n && n.featured) featuredTotal += 1; });
        var normalPageSize = Math.max(0, pageSize - featuredTotal);

        var html = '';
        var normalIndex = 0;   // 非 featured 的普通卡单独计数
        items.forEach(function (n, i) {
            var catVal = n.category || '新闻';
            var featured = !!n.featured;
            // 决定此卡是否默认被分页折叠（隐藏）
            var collapsed;
            if (featured) {
                collapsed = false;   // 推荐大图优先显示
            } else {
                collapsed = normalIndex >= normalPageSize;
                normalIndex += 1;
            }
            // 第一个 featured 的条目用大图 featured layout
            var useLarge = featured && i === 0;
            var classes = 'news-card';
            if (featured) classes += ' featured';
            if (collapsed) classes += ' news-collapsed';
            var art = '<article class="' + classes + '" data-category="' + esc(catVal) + '">';
            if (useLarge) {
                art += '<div class="news-image"><img src="' + esc(n.cover || 'assets/news-placeholder.jpg') + '" alt="' + esc(n.title) + '">'
                    + '<span class="news-tag ' + tagClass(catVal) + '">' + esc(catVal) + '</span>'
                    + '</div>'
                    + '<div class="news-body">'
                    +   '<div class="news-meta"><span>' + esc(n.date || '-') + '</span>' + (featured ? '<span>· 🔥 推荐</span>' : '') + '</div>'
                    +   '<h3>' + esc(n.title || '') + '</h3>'
                    +   '<p>' + esc(n.summary || '') + '</p>'
                    +   (n.link ? '<a href="' + esc(n.link) + '" class="news-link" target="_blank" rel="noopener">阅读全文 →</a>'
                              : '<a href="' + esc(detailUrl('news', n.id || ('n-' + i))) + '" class="news-link">阅读全文 →</a>')
                    + '</div>';
            } else {
                art += '<div class="news-image-sm" style="background:url(\'' + esc(n.cover || 'assets/news-placeholder.jpg') + '\') center/cover no-repeat;">'
                    + '<span class="news-tag ' + tagClass(catVal) + '">' + esc(catVal) + '</span>'
                    + '</div>'
                    + '<div class="news-body-sm">'
                    +   '<div class="news-meta"><span>' + esc(n.date || '-') + '</span>' + (featured ? '<span>· 🔥 推荐</span>' : '') + '</div>'
                    +   '<h4>' + esc(n.title || '') + '</h4>'
                    +   '<p>' + esc(n.summary || '') + '</p>'
                    +   (n.link ? '<a href="' + esc(n.link) + '" class="news-link" target="_blank" rel="noopener">详情 →</a>'
                              : '<a href="' + esc(detailUrl('news', n.id || ('n-' + i))) + '" class="news-link">详情 →</a>')
                    + '</div>';
            }
            art += '</article>';
            html += art;
        });
        grid.innerHTML = html;
    }

    /* 8. 风采展示 */
    function applyShowcase(cms) {
        var grid = document.getElementById('showcaseGrid');
        if (!grid) return;
        var items = cms.showcase && Array.isArray(cms.showcase.items) ? cms.showcase.items : [];
        if (!items.length) { grid.innerHTML = ''; return; }
        // 循环给第 1、5、9... 个加大 (tall)，4、8、12 加宽 (wide)，和 CSS Masonry 呼应
        var tallSet = [0, 4, 8], wideSet = [3, 7, 11];
        grid.innerHTML = items.map(function (it, i) {
            var cls = 'showcase-item' + (tallSet.indexOf(i % 12) !== -1 ? ' showcase-tall' : '')
                                        + (wideSet.indexOf(i % 12) !== -1 ? ' showcase-wide' : '');
            var url = it.url || detailUrl('showcase', it.id || ('s-' + i));
            // 外链保持 _blank，内链 detail.html 保持同窗口可分享
            var target = (it.url && /^https?:/i.test(it.url)) ? 'target="_blank" rel="noopener"' : '';
            var wrap = '<a href="' + esc(url) + '" ' + target + ' style="text-decoration:none;color:inherit;display:block;">';
            var wrapEnd = '</a>';
            return wrap + '<div class="' + cls + '">'
                + '<img src="' + esc(it.image || 'assets/carousel-slide-3.jpg') + '" alt="' + esc(it.title || '') + '">'
                + '<div class="showcase-overlay">'
                +   (it.tag ? '<span class="badge accent" style="position:absolute;top:14px;left:14px;">' + esc(it.tag) + '</span>' : '')
                +   '<h4>' + esc(it.title || '') + '</h4>'
                +   '<p>' + esc(it.desc || '') + '</p>'
                + '</div></div>' + wrapEnd;
        }).join('');
    }

    /* 9. 联系信息（contact list + socials + subject select） */
    function applyContact(cms) {
        var list = document.getElementById('contactList');
        var infos = cms.contact && Array.isArray(cms.contact.infos) ? cms.contact.infos : [];
        if (list) {
            if (!infos.length) { list.innerHTML = ''; }
            else {
                list.innerHTML = infos.map(function (it) {
                    return '<div class="contact-item">'
                        + '<div class="contact-icon">'
                        +   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
                        +   (it.icon ? '<span style="position:absolute;">' + esc(it.icon) + '</span>' : '')
                        + '</div>'
                        + '<div><h5>' + esc(it.label || '') + '</h5><p>' + String(it.value || '').replace(/\n/g, '<br>') + '</p></div>'
                        + '</div>';
                }).join('');
                // 上面为了简单，SVG 只是占位；如果提供了 icon Emoji，用它覆盖显示
                list.querySelectorAll('.contact-icon').forEach(function (ic) {
                    var span = ic.querySelector('span');
                    if (span) {
                        ic.innerHTML = '';
                        var emoji = document.createElement('div');
                        emoji.style.cssText = 'font-size:22px;display:flex;align-items:center;justify-content:center;';
                        emoji.textContent = span.textContent;
                        ic.appendChild(emoji);
                    }
                });
            }
        }

        // 社交
        var socialsEl = document.getElementById('socialLinks');
        if (socialsEl && cms.site && cms.site.social) {
            var s = cms.site.social;
            var links = socialsEl.querySelectorAll('a[data-social]');
            links.forEach(function (a) {
                var key = a.getAttribute('data-social');
                // data-social in HTML: wechat / qq / weibo / douyin. CMS has bilibili not douyin.
                var mapKey = key === 'douyin' ? 'bilibili' : key;
                var url = s[mapKey] || '';
                if (url) { a.setAttribute('href', url); a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
                else { a.setAttribute('href', 'javascript:void(0);'); a.onclick = function () { alert('暂未配置该链接，请在后台"站点设置 → 社交媒体"中添加。'); }; }
            });
        }

        // 留言主题 <select>
        var subSel = document.getElementById('subject');
        if (subSel && cms.contact && Array.isArray(cms.contact.formSubjects)) {
            subSel.innerHTML = cms.contact.formSubjects.map(function (subj, i) {
                return '<option value="' + esc(subj) + '"' + (i === 0 ? ' selected' : '') + '>' + esc(subj) + '</option>';
            }).join('');
        }

        // 如果有地图 iframe URL，替换现有静态地图（如果存在 .contact-iframe 容器则注入）
        if (cms.contact && cms.contact.mapUrl) {
            var iframeId = 'contactMapIframe';
            var iframe = document.getElementById(iframeId);
            var contactGrid = document.querySelector('.contact-grid');
            if (!iframe && contactGrid) {
                var wrap = document.createElement('div');
                wrap.style.cssText = 'margin-top:20px;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(16,24,40,0.08);';
                wrap.className = 'contact-map';
                iframe = document.createElement('iframe');
                iframe.id = iframeId;
                iframe.setAttribute('loading', 'lazy');
                iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
                iframe.style.cssText = 'width:100%;height:280px;border:0;display:block;';
                wrap.appendChild(iframe);
                contactGrid.parentNode.insertBefore(wrap, contactGrid.nextSibling);
            }
            if (iframe) iframe.setAttribute('src', cms.contact.mapUrl);
        }

        // 板块标题
        var h = document.querySelector('[data-cms="contact.heading"]');
        if (h && cms.contact && cms.contact.heading) h.textContent = cms.contact.heading;
        var d = document.querySelector('[data-cms="contact.desc"]');
        if (d && cms.contact && cms.contact.desc) d.textContent = cms.contact.desc;
    }

    /* 9. 快捷方式 */
    function applyShortcuts(cms) {
        var grid = document.getElementById('shortcutsGrid');
        if (!grid) return;
        var items = cms.shortcuts && Array.isArray(cms.shortcuts.items) ? cms.shortcuts.items : [];
        if (!items.length) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#868c98;">暂无快捷链接，请在后台「快捷方式」中添加。</div>'; return; }
        grid.innerHTML = items.map(function (it) {
            // 兜底：url 为空/无效时，检查 title 是否像 URL（用户可能把 URL 填到了标题里）
            var href = it.url || '';
            if (!/^(https?:|\/|#|mailto:|tel:)/i.test(href)) {
                if (/^https?:\/\//i.test(it.title || '')) {
                    href = it.title;
                    // 如果 title 是 URL，用 desc 作为主标题（若有），否则显示域名
                } else {
                    href = '#';
                }
            }
            var safeHref = /^(https?:|\/|#|mailto:|tel:)/i.test(href) ? href : '#';
            // 如果 title 是 URL 且有 desc，用 desc 作为卡片标题
            var displayTitle = it.title || '';
            if (/^https?:\/\//i.test(displayTitle) && it.desc) displayTitle = it.desc;
            return '<a class="shortcut-card" href="' + esc(safeHref) + '" target="_blank" rel="noopener">'
                + '<div class="shortcut-icon">' + esc(it.icon || '🔗') + '</div>'
                + '<div class="shortcut-info"><h4>' + esc(displayTitle) + '</h4>'
                + (it.desc && displayTitle !== it.desc ? '<p>' + esc(it.desc) + '</p>' : '') + '</div>'
                + '<div class="shortcut-arrow"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>'
                + '</a>';
        }).join('');
    }

    /* ===================== 入口 applyCMS ===================== */
    function applyCMS() {
        var cms = recalc();
        applyLogoIcons(cms);
        applySimpleFields(cms);
        applyStructure(cms);
        applySlides(cms);
        applyNav(cms);
        if (Array.isArray(cms.stats)) applyStats(cms);
        applyAboutValues(cms);
        applyPresidiumChips(cms);
        applyNews(cms);
        applyShowcase(cms);
        applyShortcuts(cms);
        applyContact(cms);
        // 在 SimpleFields 之后再把三个统计写到 DOM（因为 SimpleFields 会按当时的 undefined 清空 b 内容）
        var banner = document.getElementById('termBanner');
        if (banner && cms.structure && cms.structure.term) {
            var t = cms.structure.term;
            var pcEl = banner.querySelector('[data-cms="structure.term.presidiumCount"]');
            var dcEl = banner.querySelector('[data-cms="structure.term.deptCount"]');
            var tsEl = banner.querySelector('[data-cms="structure.term.totalSize"]');
            if (pcEl) pcEl.textContent = String(t.presidiumCount || '—');
            if (dcEl) dcEl.textContent = String(t.deptCount || '—');
            if (tsEl) tsEl.textContent = String(t.totalSize || '—');
        }
        try {
            var ev;
            if (typeof CustomEvent === 'function') ev = new CustomEvent('cms:applied', { detail: { cms: cms } });
            else { ev = document.createEvent('CustomEvent'); ev.initCustomEvent('cms:applied', true, false, { cms: cms }); }
            window.dispatchEvent(ev);
        } catch(e) {}
    }
    window.applyCMS = applyCMS;

    /* ===================== 导出通用工具（给 detail.html / admin 等页面复用） ===================== */
    window.__CMS_HELPERS = {
        esc: esc,
        detailUrl: detailUrl,
        clone: clone,
        deepMerge: deepMerge,
        getPath: getPath,
        CMS_KEY: CMS_KEY,
        // 按 id 查找三类数据
        findNewsById: function (cms, id) {
            var items = (cms && cms.news && cms.news.items) || [];
            for (var i = 0; i < items.length; i++) if (items[i] && items[i].id === id) return { item: items[i], index: i, list: items };
            return null;
        },
        findShowcaseById: function (cms, id) {
            var items = (cms && cms.showcase && cms.showcase.items) || [];
            for (var i = 0; i < items.length; i++) if (items[i] && items[i].id === id) return { item: items[i], index: i, list: items };
            return null;
        },
        findDeptById: function (cms, id) {
            var items = (cms && cms.structure && cms.structure.depts) || [];
            for (var i = 0; i < items.length; i++) {
                var d = items[i];
                if (d && (d.id === id)) return { item: d, index: i, list: items };
                // 向后兼容：没 id 时，也按 slug(name) 命中
                if (d && !d.id && d.name) {
                    var map = { '办公室':'office','学习部':'study','宣传部':'publicity','文体部':'arts','外联部':'liaison','权益部':'rights','纪检部':'discipline','志愿服务部':'volunteer','新媒体中心':'newmedia' };
                    if ((map[d.name] || '') === id) return { item: d, index: i, list: items };
                }
            }
            return null;
        },
        // 取 site 品牌信息（给 detail.html 面包屑 / title 用）
        brand: function (cms) {
            var s = cms && cms.site ? cms.site : {};
            return {
                siteTitle: s.title || '药品与环境工程学院学生会',
                logoTitle: s.logoTitle || '药品与环境工程学院',
                logoSubtitle: s.logoSubtitle || '学生会 · Student Union'
            };
        }
    };

    /* ===================== 热更新监听 ===================== */
    window.addEventListener('storage', function (e) {
        if (e.key === CMS_KEY) {
            applyCMS();
        }
    });
    window.addEventListener('cms:update', function () {
        applyCMS();
    });
    // 管理后台异步推送云端更新时触发
    window.addEventListener('cms:update-sb', function () {
        try { applyCMS(); } catch(e) {}
    });

    /* ===================== DOMReady 自动应用（仅当 CMS 数据有保存值时立即覆盖）===================== */
    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn, { once: true });
    }
    ready(function () {
        // 1) 立即用本地数据应用（快速渲染，避免白屏等待网络）
        applyCMS();
        // 2) 异步尝试从 Supabase 云端拉最新数据。成功则：
        //    - 把云端的 CMS 字段写入 localStorage（messages 不在 contact，保持 local 的）
        //    - 重新 applyCMS 刷新 UI
        try {
            if (window.SB && typeof window.SB.loadCMS === 'function') {
                window.SB.loadCMS().then(function (sb) {
                    if (!sb) return;
                    // 读 localStorage 当前值，再 merge 云端进来
                    var cur = {};
                    try { cur = JSON.parse(localStorage.getItem(CMS_KEY) || 'null'); } catch(e) {}
                    if (!cur) cur = recalc();
                    var keys = ['site','slides','stats','about','structure','news','showcase','shortcuts','contact'];
                    var changed = false;
                    keys.forEach(function (k) {
                        if (sb[k] === null || sb[k] === undefined) return;
                        if (k === 'contact') {
                            var orig = cur.contact || {};
                            var merged = { messages: Array.isArray(orig.messages) ? orig.messages : [] };
                            // 全量合并云端 contact 字段（heading/desc/subheading/mapUrl/lat/lng/infos/formSubjects）
                            if (sb[k] && typeof sb[k] === 'object') {
                                var src = sb[k];
                                ['heading','desc','subheading','mapUrl','lat','lng','formSubjects'].forEach(function(f) {
                                    if (src[f] !== undefined) merged[f] = src[f];
                                });
                                // infos：优先用云端新格式数组；若只有旧格式 info 字符串则兜底转成 infos
                                if (Array.isArray(src.infos)) merged.infos = clone(src.infos);
                                else if (src.info && !merged.infos) {
                                    merged.infos = [{ icon: '📍', label: '联系信息', value: src.info }];
                                }
                            }
                            if (JSON.stringify(merged) !== JSON.stringify(orig)) {
                                cur.contact = merged; changed = true;
                            }
                            return;
                        }
                        if (JSON.stringify(sb[k]) !== JSON.stringify(cur[k])) {
                            cur[k] = sb[k]; changed = true;
                        }
                    });
                    if (changed) {
                        localStorage.setItem(CMS_KEY, JSON.stringify(cur));
                        applyCMS();
                    }
                }).catch(function (e) { console.warn('[CMS桥] 云端同步失败，继续用本地数据：', e && e.message); });
            }
        } catch(e) {}
    });
})();
