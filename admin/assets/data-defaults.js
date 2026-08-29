/* =============================================================
 * CMS_DEFAULTS 数据集
 * 管理后台与前端页面共享这份默认内容（兜底值）。
 * 存储 key：localStorage['gxc_admin_cms_v1']
 * ============================================================= */
(function () {
    var DEFAULTS = {
        /* ---------- 站点基础 ---------- */
        site: {
            title: '四川化工职业技术学院 · 药品与环境工程学院学生会',
            logoUrl: '',
            logoAlt: '药品与环境工程学院学生会Logo',
            logoTitle: '药品与环境工程学院',
            logoSubtitle: '学生会 · Student Union',
            ctaPrimary: '了解我们',
            ctaPrimaryHref: '#about',
            ctaSecondary: '加入我们',
            ctaSecondaryHref: '#contact',
            footerTitle: '药品与环境工程学院学生会',
            footerSubtitle: '服务同学 · 引领成长 · 追求卓越 · 共创未来',
            footerBrand: '药品与环境工程学院学生会',
            footerSlogan: '服务同学 · 引领成长 · 追求卓越 · 共创未来',
            footerAddress: '四川省泸州市江阳区瓦窑坝62号 · 四川化工职业技术学院',
            copyright: '© 2026 四川化工职业技术学院 · 药品与环境工程学院学生会 版权所有',
            icp: 'Student Union of School of Pharmaceutical and Environmental Engineering',
            footerTech: 'Student Union of School of Pharmaceutical and Environmental Engineering',
            social: { wechat: '', qq: '', weibo: '', bilibili: '' },
            nav: [
                { label: '首页',     href: '#home' },
                { label: '关于我们', href: '#about' },
                { label: '组织架构', href: '#structure' },
                { label: '新闻活动', href: '#news' },
                { label: '风采展示', href: '#showcase' },
                { label: '快捷方式', href: '#shortcuts' },
                { label: '联系我们', href: '#contact' }
            ],
            /* 页脚第 2 列：常用链接 */
            footerLinksLabel: '常用链接',
            footerLinks: [
                { label: '四川化工职业技术学院', href: 'https://www.scchem.edu.cn' },
                { label: '药品与环境工程学院',     href: '#' },
                { label: '教务管理系统',           href: 'https://jw.scchem.edu.cn' },
                { label: '学工系统',               href: '#' },
                { label: '图书资源',               href: 'https://lib.scchem.edu.cn' },
                { label: '校园邮箱',               href: '#' }
            ],
            /* 页脚第 3 列：加入我们 */
            footerCtaLabel: '加入我们',
            footerCta: [
                { label: '学生会招新', href: '#contact' },
                { label: '干部选拔',   href: '#structure' },
                { label: '志愿者招募', href: '#shortcuts' },
                { label: '提案反馈',   href: '#contact' }
            ]
        },

        /* ---------- 首页轮播 ---------- */
        slides: [
            {
                title: '四川化工职业技术学院',
                accent: '药品与环境工程学院学生会',
                subtitle: '服务同学 · 引领成长 · 追求卓越 · 共创未来',
                bg: 'assets/hero-banner.jpg',
                overlayFrom: 'rgba(11,61,145,0.55)',
                overlayTo:   'rgba(46,125,50,0.35)'
            },
            {
                title: '书山有路',
                accent: '学海无涯 笃行致远',
                subtitle: '书香校园 · 勤学善思 · 以知践行 · 以行求知',
                bg: 'assets/carousel-slide-2.jpg',
                overlayFrom: 'rgba(11,61,145,0.50)',
                overlayTo:   'rgba(46,125,50,0.30)'
            },
            {
                title: '青春正好',
                accent: '相约化院 梦想起航',
                subtitle: '逐梦路上 · 与你同行 · 不负韶华 · 绽放光彩',
                bg: 'assets/carousel-slide-3.jpg',
                overlayFrom: 'rgba(11,61,145,0.45)',
                overlayTo:   'rgba(212,168,83,0.35)'
            }
        ],

        /* ---------- 数据统计条 ---------- */
        stats: [
            { value: 1286, suffix: '+',  label: '覆盖学生人数', icon: '👥', color: '#0B3D91' },
            { value: 9,    suffix: '个',  label: '职能部门',     icon: '🏛️', color: '#2E7D32' },
            { value: 86,   suffix: '+',  label: '年度活动',     icon: '🎉', color: '#D4A853' },
            { value: 5,    suffix: '年', label: '连续获奖',     icon: '🏆', color: '#1976d2' }
        ],

        /* ---------- 关于我们 ---------- */
        about: {
            heading: '服务全院同学 · 搭建成长平台',
            subheading: 'About Us · 关于学生会',
            lead: '药品与环境工程学院学生会是在学院党委领导、团委指导下的学生自治组织，始终以"服务同学、引领成长"为宗旨，搭建师生沟通的桥梁，打造展现自我的舞台。',
            paragraphs: [
                '我们秉承"厚德、博学、笃行、创新"的理念，围绕思想引领、学风建设、校园文化、社会实践和权益服务等核心工作，精心组织主题讲座、学科竞赛、文体活动、志愿帮扶与毕业季系列活动，助力每一位药环学子在充实的课余生活中全面成长。',
                '学生会下设主席团与九大职能部门，分工明确、紧密协作。我们坚持"从同学中来，到同学中去"的工作路线，倾听同学心声，反映合理诉求，推动学院与学生的双向沟通，让每一项活动都真正贴近同学需求。',
                '青春逢盛世，奋斗正当时。我们热诚欢迎每一位有志青年加入学生会，在这里点燃热情、施展才华、收获友谊，用汗水与智慧书写属于自己的大学华章，为学院的发展贡献青春力量。'
            ],
            mission: '全心服务全院同学，搭建成长成才平台，推动优良学风与文明校园建设。',
            vision:  '成为有温度、有担当、有活力的学生组织，成为师生信赖的桥梁与纽带。',
            values: '爱国担当 · 服务奉献 · 团结协作 · 追求卓越 · 求真创新'
        },

        /* ---------- 组织架构 ---------- */
        structure: {
            heading: '九大部门 · 同心同行',
            subheading: 'Organization · 组织架构',
            /* ---------- 届次信息（展示在板块顶部，横幅样式） ---------- */
            term: {
                congressNo: '第十二届',         // 届数：如「第十二届」
                academicYear: '2025—2026 学年',  // 学年
                slogan: '服务同学 · 引领成长 · 追求卓越 · 共创未来', // 本届口号
                // 主席团成员：每个成员包含职务 / 姓名 / 班级 / 照片（可选）
                presidium: [
                    { title: '学生会主席',     name: '李明轩', className: '制药 2401 班', photo: '' },
                    { title: '执行主席',       name: '王思琪', className: '环境工程 2402 班', photo: '' },
                    { title: '执行主席',       name: '张艺涵', className: '应用化工 2403 班', photo: '' },
                    { title: '主席团成员',     name: '陈雅婷', className: '药品质量 2401 班', photo: '' },
                    { title: '主席团成员',     name: '刘家豪', className: '安全工程 2402 班', photo: '' }
                ]
            },
            /* ---------- 部门列表（每位部长 + 副部长 + 人数 + 主要职责 + 详情弹窗图片/介绍） ---------- */
            depts: [
                { name: '办公室',       icon: '📋', chair: '赵雨桐',   vice: '吴俊杰、钱思佳',       size: '8 人',  desc: '负责学生会制度建设、物资管理、会议组织、文档归档与各部门综合协调。', phone: '138-0000-0001', image: '', fullDesc: '作为学生会的"神经中枢"，办公室承担着上传下达、综合协调的核心职能。主要工作包括：建立健全学生会各项规章制度并监督执行；统一管理学生会物资与财务账目；负责主席团例会、全体干部大会及各类专项会议的筹备、记录与督办；起草、印发、归档学生会各类文件和通知；协调各部门之间的工作衔接，配合其他部门开展大型活动的后勤保障；负责学生会干部档案建立、聘书制作与年度考核评优工作。' },
                { name: '学习部',       icon: '📚', chair: '周欣怡',   vice: '孙浩然、郑雅文',       size: '10 人', desc: '围绕学风建设开展讲座、学科竞赛、学习经验分享和晨读打卡等系列活动。', phone: '138-0000-0002', image: 'assets/carousel-slide-2.jpg', fullDesc: '学习部以"笃学尚行、砥志研思"为宗旨，致力于营造浓厚的学术氛围。常态化开展"药环学子大讲堂"专业讲座、高数/英语晨读打卡计划、学习经验分享会、期末复习答疑课；牵头组织"挑战杯"、"互联网+"、化工设计大赛、环保创新大赛等学科竞赛的院级选拔与集训；协助教务处开展期中期末学风督导、考风考纪宣传；搭建学霸答疑社群，为全院同学提供学业帮扶与资源共享。' },
                { name: '宣传部',       icon: '📢', chair: '黄子墨',   vice: '冯梓涵、褚沐阳',       size: '12 人', desc: '负责活动宣传报道、新媒体运营、视觉设计、短视频制作与对外品牌塑造。', phone: '138-0000-0003', image: '', fullDesc: '宣传部是学生会的"喉舌与窗口"，承担学院活动全流程视觉与传播工作。业务覆盖：海报、易拉宝、背景板、邀请函、工作证等平面设计；活动现场摄影摄像与后期修图整理；官方公众号推文撰写、排版与推送；抖音、视频号、B站等平台短视频策划、拍摄与剪辑；打造学生会视觉识别体系（VIS），推动药环学院品牌形象提升；定期组织干部进行 PS / AE / PR / Canva / 秀米 等技能培训。' },
                { name: '文体部',       icon: '🎨', chair: '陈雅婷',   vice: '卫思源、蒋雨彤',       size: '15 人', desc: '组织文艺晚会、校园歌手大赛、运动会、篮球赛等文体活动，丰富校园文化。', phone: '138-0000-0004', image: '', fullDesc: '文体部是药环学子青春风采的"造梦舞台"。文艺方向：统筹迎新晚会、毕业晚会、校园歌手大赛、才艺展演、新春游园会等大型文艺活动的策划、编排与执行；负责节目招募、彩排调度、舞美灯光、舞台监督等全流程工作。体育方向：承办学院"青春杯"篮足排三大球赛、趣味运动会、秋季田径运动会院级选拔赛、乒羽联赛等；组织院队日常训练、赛前动员与校际友谊赛。' },
                { name: '外联部',       icon: '🤝', chair: '刘家豪',   vice: '沈若曦、韩思成',       size: '9 人',  desc: '对接外部资源，争取社会赞助，开展校际交流，搭建校企合作桥梁。',       phone: '138-0000-0005', image: '', fullDesc: '外联部是学生会的"资源枢纽"与"外交名片"。核心工作：为学生会各项活动争取社会企业的资金与物资赞助，策划合作方案、撰写赞助提案、签署合作协议并做好权益落实；与兄弟学院、兄弟高校学生会建立常态化交流机制，互访学习、联办活动；积极对接企业开放日、行业论坛、就业宣讲等资源，搭建校企合作桥梁；负责重要来宾的接待礼仪工作。' },
                { name: '权益部',       icon: '💡', chair: '赵雨桐',   vice: '杨雨泽、秦语桐',       size: '7 人',  desc: '反映学生诉求，维护合法权益，开展权益提案调研与维权知识科普。',       phone: '138-0000-0006', image: '', fullDesc: '权益部以"全心权益、为你发声"为己任，是同学与学院之间的连心桥。定期开展提案征集活动，围绕宿舍管理、食堂餐饮、教学设施、校园交通、文体场馆等主题进行问卷调研与实地走访，形成《权益调研报告》提交相关部门并跟踪答复；设置 24 小时权益意见箱与线上反馈渠道；开展"3·15 消费者权益日"、校园反诈、防艾、防网贷等维权知识科普宣传；组织"师生面对面"座谈会，推动问题落实整改。' },
                { name: '纪检部',       icon: '🧩', chair: '孙浩然',   vice: '许子轩、何嘉怡',       size: '11 人', desc: '负责日常纪律检查、活动考勤、文明礼仪督导与学生会内部考核。',         phone: '138-0000-0007', image: '', fullDesc: '纪检部是学生会制度执行与作风建设的"纪律部队"。日常工作：晚自习、晨读考勤抽查；大型活动嘉宾签到、观众席位秩序维护；升旗仪式、团日活动等集体场合的仪容仪表与文明礼仪督导；制定《学生会干部考核细则》，对各部门例会出勤率、任务完成率、活动表现、新闻发稿量等进行月度量化考核；负责年终"优秀部门"、"优秀学生干部"评选的计票与审核；开展"文明修身月"主题教育活动。' },
                { name: '志愿服务部',   icon: '🌱', chair: '周欣怡',   vice: '吕梦琪、施博文',       size: '20 人', desc: '组织志愿服务活动，开展社区帮扶、环保行动、公益宣讲，传递正能量。',   phone: '138-0000-0008', image: 'assets/carousel-slide-3.jpg', fullDesc: '志愿服务部秉承"奉献、友爱、互助、进步"的志愿精神，打造药环学院"青·绿"志愿品牌。固定项目包括：瓦窑坝社区"敬老爱老"结对帮扶、周边小学"七彩课堂"支教、河道水质监测与环保清洁行动、校园垃圾分类督导、爱心衣物与图书捐赠、"光盘行动"宣传、大型赛事志愿保障等；负责志愿者注册、信用时长记录、优秀志愿者评选；与"志愿四川"平台对接，推动志愿活动规范化、项目化、品牌化。' },
                { name: '新媒体中心',   icon: '📱', chair: '黄子墨',   vice: '张雨欣、孔维一',       size: '14 人', desc: '运营公众号、视频号、抖音号，打造全媒体矩阵，传播药环好声音。',       phone: '138-0000-0009', image: '', fullDesc: '新媒体中心是药环学院"融媒体矩阵"的运营中枢。团队下设微信公众号组、短视频组、直播组、数据运营组四大小组。主要产出：日常推文（活动预告、新闻报道、人物专访、干货分享、节气节日文创等）；短视频（校园街访、VLOG、创意短剧、知识科普、官方宣传片、校园延时摄影）；线上直播（迎新晚会、歌手大赛、毕业季、开放日等）；定期发布《新媒体运营月报》，通过粉丝画像、阅读数据指导内容优化；培训公众号排版、剪映、Pr、飞书文档协作等核心技能。' }
            ]
        },

        /* ---------- 新闻活动 ---------- */
        news: {
            heading: '关注药环动态 · 掌握最新资讯',
            subheading: 'News & Activities · 新闻活动',
            categories: ['全部', '新闻', '活动', '通知'],
            defaultCategory: '全部',
            pageSize: 10,          // 前端首页默认显示总条数（含推荐大图 featured），超出部分点击「查看更多」展开
            loadStep: 10,          // 每次点击「查看更多」额外展开的条数
            loadMoreLabel: '加载更多内容',
            collapseLabel: '收起更多内容',
            items: [
                {
                    category: '新闻',
                    title: '学院学生会顺利完成2026届换届选举大会',
                    date: '2026-03-15',
                    summary: '经民主推荐、资格审查、现场答辩与投票表决，新一届学生会主席团及各部门负责人正式产生，标志着学生会工作进入新的阶段。',
                    cover: 'assets/carousel-slide-2.jpg',
                    featured: true,
                    link: ''
                },
                {
                    category: '活动',
                    title: '「书香化院」读书分享月活动圆满落幕',
                    date: '2026-04-08',
                    summary: '为期四周的读书分享系列活动累计参与 600 余人次，共评选出 20 名"阅读之星"，掀起全院阅读热潮。',
                    cover: 'assets/carousel-slide-3.jpg',
                    featured: true,
                    link: ''
                },
                {
                    category: '通知',
                    title: '关于开展"五四"青年节主题团日活动的通知',
                    date: '2026-04-20',
                    summary: '为纪念五四运动 107 周年，学院决定开展系列主题团日活动，各支部请于 4 月 30 日前完成活动方案上报。',
                    cover: 'assets/hero-banner.jpg',
                    featured: false,
                    link: ''
                },
                {
                    category: '活动',
                    title: '药环学院第十二届"青春杯"篮球赛火热开赛',
                    date: '2026-05-06',
                    summary: '本届篮球赛共有 16 支班级队伍参赛，历时三周，通过小组赛、淘汰赛层层角逐，争夺总冠军奖杯。',
                    cover: 'assets/carousel-slide-3.jpg',
                    featured: false,
                    link: ''
                },
                {
                    category: '新闻',
                    title: '学生会开展"走进社区·环保同行"志愿服务活动',
                    date: '2026-05-18',
                    summary: '志愿服务部组织 50 余名志愿者走进瓦窑坝社区，开展垃圾分类知识科普、河道清洁、敬老慰问等系列志愿活动。',
                    cover: 'assets/carousel-slide-2.jpg',
                    featured: false,
                    link: ''
                },
                {
                    category: '通知',
                    title: '关于2025-2026学年第二学期"期末学风督导周"的通知',
                    date: '2026-06-01',
                    summary: '期末考试临近，纪检部、学习部将联合开展学风督导专项行动，严查考勤、严查作弊、强化晚自修秩序。',
                    cover: 'assets/hero-banner.jpg',
                    featured: false,
                    link: ''
                },
                {
                    category: '新闻',
                    title: '药环学院2026届毕业生招聘会圆满举办',
                    date: '2026-06-10',
                    summary: '学院联合近 60 家药企与环保企业在体育馆举办双选会，毕业生到场近 800 人，现场达成意向 232 份。',
                    cover: 'assets/carousel-slide-2.jpg',
                    featured: false,
                    link: ''
                },
                {
                    category: '活动',
                    title: '学院第十七届社团文化艺术节隆重开幕',
                    date: '2026-06-20',
                    summary: '40 余家学生社团携手呈现文艺汇演、手工市集、科技展示等板块，现场观众突破 3000 人次。',
                    cover: 'assets/carousel-slide-3.jpg',
                    featured: false,
                    link: ''
                },
                {
                    category: '通知',
                    title: '关于"暑期三下乡"社会实践立项结果公示的通知',
                    date: '2026-07-02',
                    summary: '经院团委评审，共立项 12 支重点队、30 支普通队，公示期为 7 月 2 日—7 月 6 日，请各队按计划开展。',
                    cover: 'assets/hero-banner.jpg',
                    featured: false,
                    link: ''
                },
                {
                    category: '新闻',
                    title: '环保科普志愿行：走进瓦窑坝小学开展"水的前世今生"公开课',
                    date: '2026-07-12',
                    summary: '环境工程专业同学与志愿服务部联合为小学 3 年级 120 名学生带来趣味水实验课，获校方感谢信。',
                    cover: 'assets/carousel-slide-2.jpg',
                    featured: false,
                    link: ''
                },
                {
                    category: '活动',
                    title: '「献礼二十大·青春著华章」主题演讲比赛圆满结束',
                    date: '2026-07-20',
                    summary: '来自全院 15 个专业的 28 位选手站上决赛舞台，最终制药 2401 班王同学摘取一等奖。',
                    cover: 'assets/carousel-slide-3.jpg',
                    featured: false,
                    link: ''
                },
                {
                    category: '通知',
                    title: '关于开展 2026 级新生迎新志愿者招募的通知',
                    date: '2026-08-01',
                    summary: '学院拟招募志愿者 180 名，承担站点接站、报到引导、宿舍答疑等工作，8 月 15 日截止报名。',
                    cover: 'assets/hero-banner.jpg',
                    featured: false,
                    link: ''
                },
                {
                    category: '新闻',
                    title: '药环学院教师代表出席全国高职制药类专业研讨会',
                    date: '2026-08-09',
                    summary: '学院 4 名专业带头人赴浙江参加年会，作"以赛促教：技能大赛课程化的实践路径"主题分享。',
                    cover: 'assets/carousel-slide-2.jpg',
                    featured: false,
                    link: ''
                },
                {
                    category: '活动',
                    title: '「逐梦青春」2026 级新生迎新晚会节目征集启动',
                    date: '2026-08-15',
                    summary: '晚会面向全体 2026 级新生与各班级、社团征集歌曲、舞蹈、小品、器乐等节目，初选将于 9 月 3 日举行。',
                    cover: 'assets/carousel-slide-3.jpg',
                    featured: false,
                    link: ''
                }
            ]
        },

        /* ---------- 风采展示 ---------- */
        showcase: {
            heading: '精彩瞬间 · 青春风采',
            subheading: 'Showcase · 风采展示',
            items: [
                { title: '2026 迎新晚会', desc: '璀璨舞台，青春绽放，新一届学子在化院相遇。', image: 'assets/carousel-slide-2.jpg', tag: '文艺活动', url: '' },
                { title: '运动会开幕式',   desc: '各部门方阵整齐亮相，药环学子展现飒爽英姿。',   image: 'assets/hero-banner.jpg',         tag: '体育运动', url: '' },
                { title: '志愿服务日',     desc: '走进社区、走进小学，把温暖与知识带给更多人。',   image: 'assets/carousel-slide-3.jpg', tag: '志愿服务', url: '' },
                { title: '辩论赛决赛',     desc: '唇枪舌战，思维碰撞，一场酣畅淋漓的对决。',       image: 'assets/carousel-slide-2.jpg', tag: '学术比赛', url: '' },
                { title: '毕业季主题活动', desc: '四年同窗，依依惜别，愿你前程似锦、未来可期。',   image: 'assets/carousel-slide-3.jpg', tag: '毕业季',   url: '' },
                { title: '干部素质拓展',   desc: '熔炼团队，挑战自我，凝聚更强的学生骨干力量。',   image: 'assets/hero-banner.jpg',         tag: '内训活动', url: '' }
            ]
        },

        /* ---------- 联系我们 ---------- */
        contact: {
            heading: '期待与你相遇',
            subheading: 'Contact Us · 联系我们',
            desc: '如果你对学生会有任何建议、咨询或合作意向，欢迎通过以下方式与我们联系，也可以直接填写留言表单，我们将在 1-3 个工作日内回复。',
            mapUrl: '',
            lat: '28.872105',
            lng: '105.441873',
            infos: [
                { icon: '📍', label: '办公地址', value: '四川省泸州市江阳区瓦窑坝62号 · 四川化工职业技术学院 药环学院' },
                { icon: '📞', label: '联系电话', value: '0830-000-0000' },
                { icon: '✉️', label: '邮箱',     value: 'yhxsh_scchem@163.com' },
                { icon: '⏰', label: '接待时间', value: '周一至周五 18:00 - 21:00 / 周末 09:00 - 17:00' }
            ],
            formSubjects: ['招新咨询', '活动合作', '意见建议', '权益诉求', '其他'],
            messages: []
        },

        /* ---------- 快捷方式 ---------- */
        shortcuts: {
            heading: '快捷入口',
            subheading: 'Quick Links · 快捷方式',
            items: [
                { icon: '🏫', title: '学校官网', url: 'https://www.scchem.edu.cn', desc: '四川化工职业技术学院官方网站' },
                { icon: '📚', title: '教务系统', url: 'https://jw.scchem.edu.cn', desc: '教务管理系统登录入口' },
                { icon: '📖', title: '图书馆', url: 'https://lib.scchem.edu.cn', desc: '图书馆书目检索与电子资源' },
                { icon: '🎓', title: '就业信息网', url: 'https://job.scchem.edu.cn', desc: '毕业生就业信息与招聘服务' },
                { icon: '💬', title: '青年大学习', url: 'https://www.youth.cn', desc: '共青团青年大学习平台' },
                { icon: '📢', title: '志愿四川', url: 'https://www.zhiyuansichuan.com', desc: '四川省志愿服务平台' }
            ]
        },

        /* (保留：兼容旧 data-cms 硬编码字段) */
        hero: {
            'title-main': '四川化工职业技术学院',
            'title-accent': '药品与环境工程学院学生会',
            'subtitle': '服务同学 · 引领成长 · 追求卓越 · 共创未来'
        }
    };

    if (typeof window !== 'undefined') window.CMS_DEFAULTS = DEFAULTS;
    if (typeof module !== 'undefined' && module.exports) module.exports = DEFAULTS;
})();

/* ======= 详情页字段自动补齐（向后兼容：若用户手动编辑了默认数组也可生效） ======= */
(function () {
    if (typeof window === 'undefined' || !window.CMS_DEFAULTS) return;
    var D = window.CMS_DEFAULTS;
    function deptSlug(name, i) {
        if (!name) return 'd' + i;
        var map = { '办公室':'office','学习部':'study','宣传部':'publicity','文体部':'arts','外联部':'liaison','权益部':'rights','纪检部':'discipline','志愿服务部':'volunteer','新媒体中心':'newmedia' };
        return map[name] || ('d' + i);
    }
    if (D.structure && Array.isArray(D.structure.depts)) {
        D.structure.depts.forEach(function (d, i) {
            if (!d.id) d.id = deptSlug(d.name, i);
            if (!d.gallery) d.gallery = [];
            if (!d.body)    d.body    = [];
            if (!d.relatedIds) d.relatedIds = [];
            if (!d.gallery.length && d.image) d.gallery = [{src:d.image, caption: d.name + '风采'}];
        });
    }
    if (D.news && Array.isArray(D.news.items)) {
        var defMeta = [
            {author:'学生会秘书处', source:'药环学院公众号'},
            {author:'学习部 郑雅文',  source:'药环学院公众号'},
            {author:'主席团',        source:'院团委'},
            {author:'文体部 卫思源',  source:'药环学院公众号'},
            {author:'志愿服务部 吕梦琪', source:'志愿四川共建'},
            {author:'纪检部 何嘉怡',  source:'院团委'},
            {author:'外联部 韩思成',  source:'就业指导中心'},
            {author:'文体部 蒋雨彤',  source:'药环学院公众号'},
            {author:'社会实践中心',  source:'院团委'},
            {author:'志愿服务部 施博文', source:'药环学院公众号'},
            {author:'宣传部 褚沐阳',  source:'药环学院公众号'},
            {author:'志愿服务部',     source:'院团委'},
            {author:'新闻中心',       source:'药环学院公众号'},
            {author:'文体部',         source:'药环学院公众号'}
        ];
        D.news.items.forEach(function (n, i) {
            var meta = defMeta[i] || defMeta[0];
            if (!n.id)       n.id       = 'n-' + i;
            if (!n.author)   n.author   = meta.author;
            if (!n.source)   n.source   = meta.source;
            if (!n.body)     n.body     = [];
            if (!n.gallery)  n.gallery  = [];
            if (!n.relatedIds) n.relatedIds = [];
            if (!n.gallery.length && n.cover) n.gallery = [{src:n.cover, caption: n.title + ' 配图'}];
        });
    }
    if (D.showcase && Array.isArray(D.showcase.items)) {
        D.showcase.items.forEach(function (s, i) {
            if (!s.id)         s.id         = 's-' + i;
            if (!s.date)       s.date       = '2026-0' + ((i%9)+1) + '-' + ((i*3+5)%27+1);
            if (!s.location)   s.location   = '四川化工职业技术学院';
            if (!s.body)       s.body       = [];
            if (!s.gallery)    s.gallery    = [];
            if (!s.relatedIds) s.relatedIds = [];
            if (!s.photographer) s.photographer = '药环学院 · 新媒体中心';
            if (!s.gallery.length && s.image) s.gallery = [{src:s.image, caption: s.title + '精彩瞬间'}];
        });
    }
})();
