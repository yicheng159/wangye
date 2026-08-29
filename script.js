/* ============================================
   四川化工职业技术学院 · 药品与环境工程学院学生会
   交互脚本
   ============================================ */

(function () {
    'use strict';

    /* ---------- 导航栏滚动效果 ---------- */
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    function handleScroll() {
        const scrollY = window.scrollY;

        // 导航栏背景变化
        if (scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // 回到顶部按钮显示
        if (scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }

        // 导航高亮当前区块
        let currentSection = '';
        const navHeight = navbar.offsetHeight + 20;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - navHeight;
            const sectionBottom = sectionTop + section.offsetHeight;
            if (scrollY >= sectionTop && scrollY < sectionBottom) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    /* ---------- 移动端菜单切换 ---------- */
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // 点击菜单项关闭移动端菜单
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // 点击页面其他区域关闭移动端菜单
    document.addEventListener('click', (e) => {
        if (
            navMenu.classList.contains('active') &&
            !navMenu.contains(e.target) &&
            !navToggle.contains(e.target)
        ) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    /* ---------- 回到顶部 ---------- */
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    /* ---------- 数字动画（统计数据） ---------- */
    let statsAnimated = false;

    function animateNumbers() {
        const statsSection = document.querySelector('.stats-bar');
        if (!statsSection) return;

        const currentNumbers = statsSection.querySelectorAll('.stat-number');
        if (!currentNumbers.length) return;

        const rect = statsSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // 已进入视口 或 被 CMS 热更新强制调用（statsAnimated=false 后）→ 执行
        if (rect.top < windowHeight * 0.85 && rect.bottom > 0) {
            statsAnimated = true;
            currentNumbers.forEach(el => {
                const target = parseInt(el.getAttribute('data-target'), 10) || 0;
                const suffix = el.getAttribute('data-suffix') != null ? el.getAttribute('data-suffix') : (target >= 1000 ? '+' : '');
                const duration = 1800;
                const startTime = performance.now();

                function update(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const current = Math.floor(eased * target);
                    el.textContent = current + suffix;
                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        el.textContent = target + suffix;
                    }
                }

                requestAnimationFrame(update);
            });
        }
    }

    window.addEventListener('scroll', animateNumbers, { passive: true });
    window.addEventListener('load', animateNumbers);
    // CMS 热更新：重建 stats 后重置动画状态并立即重新播放
    window.addEventListener('cms:applied', () => {
        statsAnimated = false;
        animateNumbers();
    });

    /* ---------- 新闻分类筛选 + 分页折叠/展开（事件委托 + 支持 CMS 热重建） ---------- */
    var NEWS_PAGINATION = {
        pageSize: 10,
        loadStep: 10,
        loadMoreLabel: '加载更多内容',
        collapseLabel: '收起更多内容',
        expandedNormalLimit: null,   // 非 featured 卡手动展开到的条数上限，null = 未手动展开
    };
    function getNewsPaginationCfg() {
        var grid = document.getElementById('newsGrid');
        if (!grid) return NEWS_PAGINATION;
        function readInt(attr, dft) {
            var v = parseInt(grid.getAttribute(attr), 10);
            return v > 0 ? v : dft;
        }
        NEWS_PAGINATION.pageSize = readInt('data-page-size', 10);
        NEWS_PAGINATION.loadStep = readInt('data-load-step', 10);
        NEWS_PAGINATION.loadMoreLabel = grid.getAttribute('data-label-load-more') || NEWS_PAGINATION.loadMoreLabel;
        NEWS_PAGINATION.collapseLabel = grid.getAttribute('data-label-collapse') || NEWS_PAGINATION.collapseLabel;
        return NEWS_PAGINATION;
    }
    function refreshNewsPagination(animateUncollapse) {
        var cfg = getNewsPaginationCfg();
        var grid = document.getElementById('newsGrid');
        var tabsRoot = document.getElementById('newsTabs');
        if (!grid) return;
        var activeTab = tabsRoot && tabsRoot.querySelector('.tab-btn.active')
            ? tabsRoot.querySelector('.tab-btn.active').getAttribute('data-tab') : 'all';
        // 先按当前 activeTab 跑一遍分类筛选（不动画、不重算分页），确保分页计数和真实显示一致
        applyNewsFilter(activeTab, tabsRoot, { skipAnimate: true, skipPagination: true });

        var allCards = Array.prototype.slice.call(grid.querySelectorAll('.news-card'));
        var showableCards = [], featuredList = [], normalList = [];
        var showableFeatured = 0, showableNormal = 0;
        allCards.forEach(function (c) {
            if (c.classList.contains('hidden')) return;
            var isFeat = c.classList.contains('featured');
            showableCards.push(c);
            if (isFeat) { showableFeatured += 1; featuredList.push(c); }
            else { showableNormal += 1; normalList.push(c); }
        });

        // cfg.pageSize 是"总条数上限（含 featured）"，换算为普通卡显示上限
        var totalSize = cfg.pageSize;
        var normalLimitBase = Math.max(0, totalSize - showableFeatured);
        var normalLimit;
        if (cfg.expandedNormalLimit === null) normalLimit = normalLimitBase;
        else normalLimit = normalLimitBase + cfg.expandedNormalLimit;
        if (normalLimit >= showableNormal) normalLimit = showableNormal;
        if (normalLimit < 0) normalLimit = 0;
        var normalShown = 0;
        normalList.forEach(function (c, idx) {
            var shouldShow = idx < normalLimit;
            if (shouldShow) {
                if (c.classList.contains('news-collapsed')) {
                    c.classList.remove('news-collapsed');
                    if (animateUncollapse !== false) {
                        c.classList.remove('news-collapsed-anim');
                        void c.offsetWidth;
                        c.classList.add('news-collapsed-anim');
                        setTimeout(function (card) { card.classList.remove('news-collapsed-anim'); }, 440, c);
                    }
                }
                normalShown += 1;
            } else {
                c.classList.add('news-collapsed');
            }
        });
        featuredList.forEach(function (c) { c.classList.remove('news-collapsed'); });

        var total = showableCards.length;
        var shown = showableFeatured + normalShown;
        var showingEl = document.getElementById('newsShowingCount');
        var totalEl = document.getElementById('newsTotalCount');
        if (showingEl) showingEl.textContent = String(shown);
        if (totalEl) totalEl.textContent = String(total);

        var btn = document.getElementById('newsLoadMoreBtn');
        if (!btn) return;
        var badge = document.getElementById('newsLoadMoreBadge');
        var remaining = Math.max(0, showableNormal - normalLimit);
        var isFullyExpanded = normalLimit >= showableNormal;
        // 重置按钮文本（保留 badge span 元素）
        if (badge && badge.parentNode !== btn) badge = null;
        while (btn.firstChild && btn.firstChild !== badge) btn.removeChild(btn.firstChild);
        if (isFullyExpanded) {
            btn.classList.add('is-collapse');
            btn.disabled = showableNormal <= cfg.pageSize;
            var txt = document.createTextNode(cfg.collapseLabel + ' ');
            btn.insertBefore(txt, badge || null);
            if (badge) badge.textContent = showableNormal <= cfg.pageSize ? '全部显示' : '已展开全部';
        } else {
            btn.classList.remove('is-collapse');
            btn.disabled = false;
            var txt2 = document.createTextNode(cfg.loadMoreLabel + ' ');
            btn.insertBefore(txt2, badge || null);
            if (badge) {
                var stepShow = Math.min(cfg.loadStep, remaining);
                badge.textContent = '还有 ' + remaining + ' 条' + (stepShow !== remaining ? '（每次 ' + stepShow + '）' : '');
            }
        }
    }

    function applyNewsFilter(tabVal, tabsRoot, opts) {
        opts = opts || {};
        var root = tabsRoot || document.getElementById('newsTabs');
        var grid = document.getElementById('newsGrid');
        if (!root || !grid) return;
        var btns = root.querySelectorAll('.tab-btn');
        btns.forEach(function (b) {
            var isActive = (b.getAttribute('data-tab') === tabVal);
            b.classList.toggle('active', isActive);
            if (isActive) try { b.focus({ preventScroll: true }); } catch (e) {}
        });
        var cards = grid.querySelectorAll('.news-card');
        var firstVisible = null;
        var synonymMap = {
            '新闻': ['新闻', '学术讲座', '学术'],
            '学术讲座': ['学术讲座', '学术', '新闻'],
            '活动': ['活动', '文体活动', '文体', '志愿服务', '志愿'],
            '文体活动': ['文体活动', '文体', '活动'],
            '志愿服务': ['志愿服务', '志愿', '活动'],
            '通知': ['通知', '通知公告', '公告'],
            '通知公告': ['通知公告', '通知', '公告']
        };
        cards.forEach(function (card) {
            var category = card.getAttribute('data-category') || '';
            var matches = false;
            if (tabVal === 'all') matches = true;
            else if (category === tabVal) matches = true;
            else if (synonymMap[tabVal]) matches = synonymMap[tabVal].indexOf(category) !== -1;
            if (matches) {
                card.classList.remove('hidden');
                if (opts.skipAnimate !== true) {
                    card.style.visibility = '';
                    card.style.pointerEvents = '';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(12px)';
                    void card.offsetWidth;
                    requestAnimationFrame(function () {
                        card.style.transition = 'opacity 0.32s ease, transform 0.32s ease, box-shadow 0.25s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    });
                }
                if (!firstVisible) firstVisible = card;
            } else {
                card.classList.add('hidden');
                card.style.opacity = '0 !important';
                card.style.transform = 'none';
                card.style.transition = 'none';
                card.style.visibility = 'hidden';
                card.style.pointerEvents = 'none';
            }
        });
        var empty = grid.querySelector('.news-empty-tip');
        if (empty) empty.remove();
        if (!firstVisible) {
            var tip = document.createElement('div');
            tip.className = 'news-empty-tip';
            tip.style.cssText = 'grid-column:1/-1;text-align:center;padding:56px 24px 60px;color:#6a7281;border-radius:16px;background:linear-gradient(180deg,#fbfcff 0%,#f5f7fc 100%);border:1px dashed #d7dce7;font-size:1rem;';
            tip.innerHTML = '📭 该分类暂无内容 · <span style="color:var(--color-primary);font-weight:600;cursor:pointer;">点击切回「全部」</span>';
            tip.querySelector('span').addEventListener('click', function () { applyNewsFilter('all', root); });
            grid.appendChild(tip);
        }
        if (opts.skipPagination !== true) {
            NEWS_PAGINATION.expandedNormalLimit = null;
            refreshNewsPagination();
        }
    }

    function initNewsTabs() {
        var tabsRoot = document.getElementById('newsTabs');
        if (!tabsRoot || tabsRoot.__newsTabsDelegated) return;
        tabsRoot.__newsTabsDelegated = true;
        tabsRoot.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest && e.target.closest('.tab-btn');
            if (!btn) return;
            applyNewsFilter(btn.getAttribute('data-tab') || 'all', tabsRoot);
        });
    }
    function initNewsPaginationBtn() {
        var btn = document.getElementById('newsLoadMoreBtn');
        if (!btn || btn.__paginationBound) return;
        btn.__paginationBound = true;
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            try {
                var cfg = getNewsPaginationCfg();
                var grid = document.getElementById('newsGrid');
                if (!grid) return;
                // 统计当前 tab 下可显示的 featured / normal 数量
                var showableFeatured = 0, showableNormal = 0;
                grid.querySelectorAll('.news-card').forEach(function (c) {
                    if (c.classList.contains('hidden')) return;
                    if (c.classList.contains('featured')) showableFeatured += 1;
                    else showableNormal += 1;
                });
                // normalLimitBase = 普通卡基线（pageSize 总数含 featured → 普通卡上限）
                var normalLimitBase = Math.max(0, cfg.pageSize - showableFeatured);
                if (btn.classList.contains('is-collapse')) {
                    // 收起：回到基线
                    NEWS_PAGINATION.expandedNormalLimit = null;
                } else {
                    // 展开：当前「普通卡显示上限 = base + expandedNormalLimit」，在这个基础上 +loadStep
                    var baseNormalLimit;
                    if (cfg.expandedNormalLimit === null) baseNormalLimit = normalLimitBase;
                    else baseNormalLimit = Math.min(normalLimitBase + cfg.expandedNormalLimit, showableNormal);
                    var nextLimit = Math.min(baseNormalLimit + cfg.loadStep, showableNormal);
                    // expandedNormalLimit 存储的是「超过基线多少张」，便于跨 tab/重建时语义一致
                    NEWS_PAGINATION.expandedNormalLimit = Math.max(0, nextLimit - normalLimitBase);
                }
                refreshNewsPagination(true);
            } catch (err) {
                btn.setAttribute('data-pagination-error', String(err && err.message || err));
                try { console.error('[news-pagination] click handler error:', err); } catch (_) {}
            }
        });
    }

    // 将关键函数暴露到 window 便于调试（只在开发阶段无害）
    try {
        window.__news = {
            NEWS_PAGINATION: NEWS_PAGINATION,
            getNewsPaginationCfg: getNewsPaginationCfg,
            refreshNewsPagination: refreshNewsPagination,
            applyNewsFilter: applyNewsFilter,
        };
    } catch (_e) {}

    initNewsTabs();
    initNewsPaginationBtn();
    (function firstRun() {
        getNewsPaginationCfg();
        var grid = document.getElementById('newsGrid');
        var tabsRoot = document.getElementById('newsTabs');
        var activeBtn = tabsRoot && tabsRoot.querySelector('.tab-btn.active');
        var initialTab = activeBtn ? activeBtn.getAttribute('data-tab') : 'all';
        if (grid && grid.querySelector('.news-card')) {
            applyNewsFilter(initialTab || 'all', tabsRoot);
        } else {
            refreshNewsPagination();
        }
    })();
    window.addEventListener('cms:applied', function () {
        getNewsPaginationCfg();
        var tabsRoot = document.getElementById('newsTabs');
        if (tabsRoot && !tabsRoot.__newsTabsDelegated) initNewsTabs();
        initNewsPaginationBtn();
        var activeBtn = tabsRoot && tabsRoot.querySelector('.tab-btn.active');
        applyNewsFilter(activeBtn ? (activeBtn.getAttribute('data-tab') || 'all') : 'all', tabsRoot);
    });

    /* ---------- 滚动进入动画（Intersection Observer） ---------- */
    let globalIO = null;
    function initScrollAnim() {
        const animatedElements = document.querySelectorAll(
            '.about-content, .dept-card, .news-card, .showcase-item, .contact-info, .contact-form'
        );
        if (!('IntersectionObserver' in window)) {
            // 不支持则直接显示
            animatedElements.forEach(el => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
            return;
        }
        if (!globalIO) {
            globalIO = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        globalIO.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
        }
        animatedElements.forEach(el => {
            if (el.dataset.ioObserved === '1') return;
            el.dataset.ioObserved = '1';
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
            globalIO.observe(el);
        });
    }
    initScrollAnim();
    applyStaggerDelays();

    // CMS 热更新后：重新挂接新闻 tab + 观察动画元素 + 错位延迟
    window.addEventListener('cms:applied', () => {
        initNewsTabs();
        initScrollAnim();
        applyStaggerDelays();
    });

    // 部门卡片/风采展示的错位延迟
    function applyStaggerDelays() {
        document.querySelectorAll('#deptsGrid .dept-card').forEach((el, i) => {
            el.style.transitionDelay = (i * 60) + 'ms';
        });
        document.querySelectorAll('#showcaseGrid .showcase-item').forEach((el, i) => {
            el.style.transitionDelay = (i * 80) + 'ms';
        });
    }

    /* ---------- 联系表单提交 ---------- */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            // 简单验证
            if (!data.name || !data.phone || !data.message) {
                showToast('请填写必填项！', 'error');
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>提交中...</span>';
            submitBtn.style.opacity = '0.7';

            // 1) 优先保存到 Supabase 云端 contact_messages 表
            var msgPayload = {
                id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                name: data.name || '',
                phone: data.phone || '',
                subject: data.subject || '其他',
                message: data.message || '',
                createdAt: new Date().toISOString(),
                read: false
            };
            var saveToLocalFallback = function (warn) {
                try {
                    var CMS_KEY = 'gxc_admin_cms_v1';
                    var raw = localStorage.getItem(CMS_KEY);
                    var cms = raw ? JSON.parse(raw) : null;
                    if (!cms) cms = {};
                    if (!cms.contact) cms.contact = {};
                    if (!Array.isArray(cms.contact.messages)) cms.contact.messages = [];
                    cms.contact.messages.unshift(msgPayload);
                    localStorage.setItem(CMS_KEY, JSON.stringify(cms));
                    try { window.dispatchEvent(new CustomEvent('cms:saved', {detail:{path:'contact.messages'}})); } catch (e) {}
                    showToast((warn ? warn + ' ' : '') + '留言已保存到本地缓存，我们会尽快联系你。', warn ? 'warn' : 'success');
                    contactForm.reset();
                } catch (err) {
                    showToast('保存失败：' + (err && err.message || err), 'error');
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                submitBtn.style.opacity = '1';
            };
            if (window.SB && typeof window.SB.insertMessage === 'function') {
                window.SB.insertMessage(msgPayload).then(function (r) {
                    if (r && r.ok) {
                        showToast('留言提交成功！我们会尽快与你联系。', 'success');
                        contactForm.reset();
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                        submitBtn.style.opacity = '1';
                    } else {
                        saveToLocalFallback((r && r.reason) || '云端提交未成功，');
                    }
                }).catch(function () {
                    saveToLocalFallback('网络暂不可用，');
                });
            } else {
                setTimeout(function () { saveToLocalFallback(); }, 500);
            }
        });
    }

    /* ---------- Toast 消息提示 ---------- */
    function showToast(message, type = 'info') {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;

        const colors = {
            success: { bg: '#2E7D32', icon: '✓' },
            error:   { bg: '#e53935', icon: '✕' },
            info:    { bg: '#0B3D91', icon: 'ℹ' }
        };
        const c = colors[type] || colors.info;

        toast.style.cssText = `
            position: fixed;
            top: 90px;
            left: 50%;
            transform: translateX(-50%) translateY(-20px);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 24px;
            background: ${c.bg};
            color: white;
            border-radius: 12px;
            font-size: 0.92rem;
            font-weight: 500;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            opacity: 0;
            transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
            max-width: 90vw;
            pointer-events: none;
        `;
        toast.innerHTML = `
            <span style="display:inline-flex;align-items:center;justify-content:center;
                width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,0.2);
                font-size:0.8rem;font-weight:700;">${c.icon}</span>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => toast.remove(), 350);
        }, 3500);
    }

    /* ---------- 平滑锚点滚动（兼容处理） ---------- */
    function initAnchorScroll(scope) {
        var ctx = scope || document;
        var nodes = ctx.querySelectorAll('a[href^="#"]');
        // 兼容 NodeList / 动态集合
        var list = Array.prototype.slice.call(nodes);
        list.forEach(function (anchor) {
            if (anchor.__anchorScrollBound) return;
            anchor.__anchorScrollBound = true;
            anchor.addEventListener('click', function (e) {
                var targetId = anchor.getAttribute('href');
                // 无效锚 = # 本身：默认行为会跳页面顶部 → 一律阻止
                if (!targetId || targetId === '#' || targetId.length <= 1) {
                    // 如果该 a 有显式的 data-stop-modal / data-no-scroll 或其他 click 逻辑也能正常跑（因为只是阻止默认跳转）
                    e.preventDefault();
                    return;
                }
                var targetEl;
                try { targetEl = document.querySelector(targetId); } catch (err) { targetEl = null; }
                if (targetEl) {
                    e.preventDefault();
                    // 兼容可能不存在的 navbar
                    var navHeight = (typeof navbar !== 'undefined' && navbar && navbar.offsetHeight) ? navbar.offsetHeight : 0;
                    var targetY = targetEl.getBoundingClientRect().top + window.scrollY - navHeight + 1;
                    window.scrollTo({
                        top: targetY,
                        behavior: 'smooth'
                    });
                    // 同步 hash（但不跳动）
                    try {
                        if (history.replaceState) {
                            history.replaceState(null, '', targetId);
                        } else {
                            location.hash = targetId;
                        }
                    } catch (err) {}
                } else {
                    // 找不到目标时，也阻止跳页面顶部（绝大多数 href=#something 是占位）
                    e.preventDefault();
                }
            });
        });
    }
    initAnchorScroll(document);
    // CMS 热更新 / 重建内容：重新绑定新加入的 a[href^="#"]
    window.addEventListener('cms:applied', function () { initAnchorScroll(document); });

    /* ---------- 新闻区「查看更多活动」：锚点 #news-tabs-anchor → 平滑滚动到分类筛选 tabs 下方 ---------- */
    (function bindNewsMoreBtn() {
        function bind() {
            var btn = document.querySelector('.news-more .btn');
            if (!btn || btn.__newsMoreBound) return;
            btn.__newsMoreBound = true;
            btn.setAttribute('role', 'button');
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var target = document.getElementById('news-tabs-anchor') || document.getElementById('newsTabs') || document.getElementById('news');
                if (!target) return;
                var navHeight = (typeof navbar !== 'undefined' && navbar && navbar.offsetHeight) ? navbar.offsetHeight : 0;
                var rect = target.getBoundingClientRect();
                var targetY = Math.max(0, Math.round(rect.top + window.scrollY - navHeight + 2));
                window.scrollTo({ top: targetY, behavior: 'smooth' });
            });
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bind, { once: true });
        } else {
            bind();
        }
        window.addEventListener('cms:applied', bind);
    })();

    /* ---------- 图片加载错误处理 ---------- */
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function () {
            // 使用渐变色作为占位背景
            this.style.visibility = 'hidden';
            const parent = this.parentElement;
            if (parent) {
                parent.style.background = 'linear-gradient(135deg, #0B3D91 0%, #2E7D32 100%)';
            }
        });
    });

    /* ============================================
       Hero 轮播图逻辑（三张 · 自动播放 · 手动切换 · 键盘支持 · 触摸滑动）
       实现：
       - .carousel-item 用 active 控制 opacity+visibility（通过 class 切换）
       - UI层（文案、按钮、dots）不随 slide 重复，避免叠加
       - 每次切换：重置 Ken Burns 动画 → 换文案 → 重启自动播放计时
       ============================================ */
    (function initCarousel() {
        let slides = document.querySelectorAll('.carousel-item');
        let dots = document.querySelectorAll('.carousel-dot');
        const btnPrev = document.getElementById('carouselPrev');
        const btnNext = document.getElementById('carouselNext');
        const heroContent = document.getElementById('heroContent');
        const dotsBox = document.getElementById('carouselDots');
        if (!slides.length) return;

        // 从 CMS 实时读取轮播文案（支持热更新）
        function getSlidesContent() {
            if (typeof window.getCMSContent === 'function') {
                try {
                    var sc = window.getCMSContent().slides.map(function (s) {
                        return {
                            title:    (s.title || '') + '<br><span class="hero-title-accent">' + (s.accent || '') + '</span>',
                            subtitle: s.subtitle || ''
                        };
                    });
                    if (sc && sc.length) return sc;
                } catch (err) {}
            }
            return [
                { title: '四川化工职业技术学院<br><span class="hero-title-accent">药品与环境工程学院学生会</span>', subtitle: '服务同学 · 引领成长 · 追求卓越 · 共创未来' },
                { title: '书山有路<br><span class="hero-title-accent">学海无涯 笃行致远</span>', subtitle: '书香校园 · 勤学善思 · 以知践行 · 以行求知' },
                { title: '青春正好<br><span class="hero-title-accent">相约化院 梦想起航</span>', subtitle: '逐梦路上 · 与你同行 · 不负韶华 · 绽放光彩' }
            ];
        }
        let slidesContent = getSlidesContent();

        const AUTO_INTERVAL = 5500; // 每张停留 5.5s

        let current = 0;
        let autoTimer = null;
        // 记录当前张已播放时长（用于鼠标悬停/失焦后的剩余时间恢复）
        let slideStart = 0;

        const titleEl = document.getElementById('heroTitle');
        const subtitleEl = document.getElementById('heroSubtitle');

        /* ---------- 核心：切换到第 index 张 ---------- */
        function goTo(index, manual = false) {
            // 每次切换都重新查询 DOM（CMS bridge 可能重建了 .carousel-item / .carousel-dot）
            slides = document.querySelectorAll('.carousel-item');
            dots = document.querySelectorAll('.carousel-dot');
            const total = slides.length;
            if (!total) return;
            if (index === current && !manual) return;
            index = (index + total) % total;
            current = index;

            // 1. slides 切换 — 移除非 active，给新的加上
            slides.forEach((s, i) => {
                s.classList.toggle('active', i === current);
                // 强制重绘 Ken Burns 动画（移除再重加）
                if (i === current) {
                    const bg = s.querySelector('.carousel-bg');
                    if (bg) {
                        bg.style.animation = 'none';
                        void bg.offsetWidth;
                        bg.style.animation = '';
                    }
                }
            });

            // 2. dots 高亮
            dots.forEach((d, i) => {
                d.classList.toggle('active', i === current);
            });

            // 3. 文案切换 + 淡入动画（避免重复添加 class 无效：先移除 → reflow → 添加）
            if (heroContent && slidesContent[current]) {
                const data = slidesContent[current];
                heroContent.classList.remove('animate-switch');
                requestAnimationFrame(() => {
                    if (titleEl) titleEl.innerHTML = data.title;
                    if (subtitleEl) subtitleEl.textContent = data.subtitle;
                    void heroContent.offsetWidth;
                    heroContent.classList.add('animate-switch');
                });
            }

            // 4. 重启自动播放计时（手动切换也重置）
            startAuto();
        }

        function next(manual = false) { goTo(current + 1, manual); }
        function prev(manual = false) { goTo(current - 1, manual); }

        /* ---------- 自动播放 ---------- */
        function startAuto() {
            stopAuto();
            slideStart = performance.now();
            autoTimer = setTimeout(() => next(false), AUTO_INTERVAL);
        }

        function stopAuto() {
            if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
        }

        /* ---------- 事件绑定 ---------- */
        // 左右按钮
        btnPrev && btnPrev.addEventListener('click', () => prev(true));
        btnNext && btnNext.addEventListener('click', () => next(true));

        // dots 点击（事件委托：CMS bridge 重建 dots 后仍然有效）
        dotsBox && dotsBox.addEventListener('click', function (e) {
            var dot = e.target.closest('.carousel-dot');
            if (!dot) return;
            var idx = parseInt(dot.getAttribute('data-slide'), 10);
            if (!isNaN(idx)) goTo(idx, true);
        });

        // 鼠标悬停：暂停；鼠标离开：按剩余时间恢复
        const hero = document.getElementById('home');
        hero && hero.addEventListener('mouseenter', () => { stopAuto(); });
        hero && hero.addEventListener('mouseleave', () => {
            const remain = Math.max(800, AUTO_INTERVAL - (performance.now() - slideStart));
            slideStart = performance.now() - (AUTO_INTERVAL - remain);
            autoTimer = setTimeout(() => next(false), remain);
        });

        // 键盘 ← → 支持
        document.addEventListener('keydown', (e) => {
            if (window.scrollY > 400) return;
            if (e.key === 'ArrowRight') next(true);
            else if (e.key === 'ArrowLeft') prev(true);
        });

        // 触摸滑动（移动端）
        let touchStartX = 0;
        let touchEndX = 0;
        hero && hero.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAuto();
        }, { passive: true });
        hero && hero.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const delta = touchEndX - touchStartX;
            if (Math.abs(delta) > 50) {
                delta < 0 ? next(true) : prev(true);
            } else {
                startAuto();
            }
        }, { passive: true });

        /* ---------- 启动 ---------- */
        if (heroContent) {
            setTimeout(() => {
                heroContent.classList.add('animate-switch');
            }, 150);
        }
        startAuto();

        // 页面失焦 → 暂停；回焦 → 恢复；避免后台累积多个定时
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAuto();
            } else {
                slideStart = performance.now();
                startAuto();
            }
        });

        // CMS 热更新：后台保存后刷新轮播文案 + 重新渲染当前张
        window.addEventListener('cms:applied', function () {
            slidesContent = getSlidesContent();
            // 重新渲染当前张（使用最新数据和 DOM）
            current = 0;
            goTo(0, true);
        });
    })();

})();
