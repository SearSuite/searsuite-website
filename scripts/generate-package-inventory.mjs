import fs from 'node:fs';
import path from 'node:path';

const base = path.resolve(import.meta.dirname, '../..');
const repositories = [
  ['searsuite', 'Core', '平台无关的编辑器核心与插件'],
  ['searsuite-browser', 'Browser', '浏览器适配与 Web 控件'],
  ['searsuite-components', 'Components', '网站组件库'],
  ['searsuite-website', 'Website', '官网与文档站'],
];

const purposes = {
  'sear-assembly-commands': '执行 Sheet / Doc 类型化命令，并组织待提交的事务。',
  'sear-assembly-config': '管理编辑器实例内的配置默认值、存储和类型化读取。',
  'sear-assembly-core': '为 Sheet / Doc 运行时暂存并提交事务。',
  'sear-assembly-doc': '组装文档节点、排版、行内样式和命令插件。',
  'sear-assembly-plugin': '定义插件生命周期、状态贡献、服务与扩展注册接口。',
  'sear-assembly-setup': '组装可供宿主使用的 Sheet / Doc 编辑器及其适配器。',
  'sear-assembly-workbook': '把可视化工作表会话连接到工作簿业务运行时。',
  'sear-assembly-sheet-kernel': '独立组装工作表状态、事务、命令、查询和订阅。',
  'sear-assembly-workbook-kernel': '独立组装工作簿状态、公式、协作和工作表业务会话。',
  'sear-domain-cell': '组织单元格提交、显示、渲染和剪贴板扩展目录。',
  'sear-domain-cell-types': '定义文本、数字、公式和富文本等内置单元格类型。',
  'sear-domain-collaboration': '提供版本确认、追赶和变更重基算法。',
  'sear-domain-commands': '定义类型化命令及编辑器内命令总线契约。',
  'sear-domain-doc': '定义富文档节点、选区、样式及排版契约。',
  'sear-domain-doc-schema': '定义独立文档与单元格内富文本共用的 JSON 格式。',
  'sear-domain-editor': '定义查询、观察、服务读取和生命周期契约。',
  'sear-domain-format': '定义可移植的单元格格式值与格式契约。',
  'sear-domain-formula-engine': '定义公式值、求值接口、注册表和引用契约。',
  'sear-domain-formula-engine-ts': '用 TypeScript 实现公式解析、求值、依赖图和内置函数。',
  'sear-domain-matrix': '提供稀疏矩阵、行列操作、尺寸与序列化。',
  'sear-domain-ot': '提供矩阵、矩形和富文档的 OT 变换基础。',
  'sear-domain-state': '定义状态所有权、字段投影与数据注册表。',
  'sear-domain-transaction': '定义编辑器事务、操作及其所有权契约。',
  'sear-domain-workbook': '定义工作簿、工作表标识、结构及文档状态。',
  'sear-foundation-common': '提供跨包共用的基础值与契约。',
  'sear-foundation-di': '提供编辑器作用域的依赖注入、所有权和借用实例管理。',
  'sear-foundation-error': '定义带稳定错误码和诊断信息的公开错误类型。',
  'sear-foundation-keymap': '定义可移植的按键、组合键及快捷键绑定。',
  'sear-foundation-platform': '定义可注入的计时、事件、视图几何与宿主诊断接口。',
  'sear-foundation-range': '提供 Sheet / Doc 范围基础类型和归一化。',
  'sear-foundation-rect': '提供不可变矩形几何和相交计算。',
  'sear-foundation-storage': '定义键值存储接口及内存实现。',
  'sear-foundation-subscription': '管理订阅所有权与逆序释放。',
  'sear-foundation-theme': '预留主题契约；当前没有公开 API。',
  'sear-foundation-user-interaction': '定义宿主输入与编辑行为共用的交互状态。',
  'sear-foundation-utils': '提供通用算法、比较与类型守卫。',
  'sear-plugin-alignment': '管理单元格对齐状态、命令、显示投影与持久化。',
  'sear-plugin-cell-border': '管理边框状态、命令、渲染、历史与协作。',
  'sear-plugin-cell-editor': '协调单元格编辑会话、文本输入与嵌入式编辑器。',
  'sear-plugin-cell-fill': '管理填充色的稀疏状态、命令、显示与导出。',
  'sear-plugin-cell-format': '管理数字格式、命令、显示文本和持久化。',
  'sear-plugin-cell-highlight': '管理条件高亮规则、命令与渲染。',
  'sear-plugin-cell-merge': '管理合并区域、结构变换、命令与持久化。',
  'sear-plugin-checkbox': '提供复选框单元格类型和类型化命令。',
  'sear-plugin-clear-style': '通过格式状态所有者的贡献清除样式。',
  'sear-plugin-clipboard': '处理工作表复制、粘贴与剪贴板序列化。',
  'sear-plugin-collab': '把已提交事务连接到宿主协作传输。',
  'sear-plugin-data-validation': '管理数据验证规则、命令、查询和求值。',
  'sear-plugin-dropdown': '提供与验证规则配合的下拉单元格交互。',
  'sear-plugin-duplicate': '管理重复值高亮与重复行操作。',
  'sear-plugin-export': '定义带版本的导出封装、编解码注册和持久化边界。',
  'sear-plugin-filter': '管理区域筛选及行可见性状态。',
  'sear-plugin-find-replace': '提供稀疏工作表查找与替换。',
  'sear-plugin-fixed-row': '管理固定行状态、结构变换与显示。',
  'sear-plugin-format-painter': '通过格式状态所有者的贡献复制格式。',
  'sear-plugin-formula': '管理公式源、求值、依赖关系和结果投影。',
  'sear-plugin-formula-engineering': '提供与 Excel 兼容的工程类公式函数。',
  'sear-plugin-freeze': '管理工作表冻结边界和命令。',
  'sear-plugin-history': '根据提交记录实现 Sheet / Doc 撤销和重做。',
  'sear-plugin-i18n': '注册编辑器内语言环境及中英公式名称。',
  'sear-plugin-resize': '管理行列尺寸、拖拽调整与持久化。',
  'sear-plugin-selection': '管理选区、导航、观察、高亮和命令。',
  'sear-plugin-sheet-demo': '提供可选的工作表状态插件完整示例。',
  'sear-assembly-sheet-doc': '把 Doc 运行时接入单元格富文本编辑。',
  'sear-plugin-sort': '提供区域排序和稳定稀疏行重排。',
  'sear-render': '汇总公开的渲染上下文、节点、策略和注册接口。',
  'sear-render-context': '定义平台无关的绘制上下文契约。',
  'sear-render-coord': '转换文档、视口、屏幕和宿主视图坐标。',
  'sear-render-cursor': '定义光标策略和宿主适配接口。',
  'sear-render-engine': '调度帧、脏区域与工作表渲染。',
  'sear-render-event-engine': '处理命中测试与渲染节点事件传播。',
  'sear-render-input': '定义键盘、指针、文本输入及输入法路由。',
  'sear-render-metrics': '定义文本塑形与字形测量契约。',
  'sear-render-node': '提供保留式场景节点、富文本注册表和空间索引。',
  'sear-render-registry': '连接单元格类型、工作表状态和实例内渲染器。',
  'sear-render-scroll': '提供逻辑滚动、轴锁定及边界反馈算法。',
  'sear-render-strategy': '提供全量、脏区域、保留式和增量渲染策略。',
  'sear-sheet-editor-contract': '定义工作表内嵌富文本编辑器接口及测试替身。',
  'sear-browser-adapters': '实现浏览器平台、绘制、输入、剪贴板和传输适配器。',
  'sear-plugin-web-doc-toolbar': '提供文档编辑器的 Web 工具栏。',
  'sear-plugin-web-sheet-tabbar': '提供 Web 工作表标签和结构控制。',
  'sear-plugin-web-toolbar': '提供由命令和观察驱动的 Web 工作表工具栏。',
  'sear-assembly-headless': '在没有可视宿主的环境中组装工作表编辑器。',
  'sear-node-adapters': '提供 Node 平台计时和 Web 服务适配器。',
  'searsuite-components': '提供官网与文档站复用的 React 组件、图标和样式。',
  'searsuite-website': '构建官网、指南和由源码生成的 API 参考。',
};

function manifest(relative) {
  return JSON.parse(fs.readFileSync(path.join(base, relative, 'package.json'), 'utf8'));
}

function environment(repo, relative) {
  if (relative.endsWith('sear-assembly-headless') || relative.endsWith('sear-node-adapters')) return 'Node';
  if (repo === 'searsuite') return '平台无关';
  return '浏览器';
}

const packages = [];
for (const [repo] of repositories) {
  const listed = repo === 'searsuite' || repo === 'searsuite-browser'
    ? fs.readdirSync(path.join(base, repo, 'packages'), { withFileTypes: true })
        .filter(entry => entry.isDirectory() && fs.existsSync(path.join(base, repo, 'packages', entry.name, 'package.json')))
        .map(entry => `${repo}/packages/${entry.name}`).sort()
    : [repo];
  for (const relative of listed) {
    const meta = manifest(relative);
    if (meta.private && repo !== 'searsuite-website') continue;
    const leaf = path.basename(relative);
    packages.push({
      id: relative,
      repo,
      name: meta.name || leaf,
      purpose: purposes[leaf] || meta.description || '职责待核对',
      environment: environment(repo, relative),
      kind: relative === repo ? '仓库根包' : '子包',
      private: !!meta.private,
      dependencies: meta.dependencies || {},
      devDependencies: meta.devDependencies || {},
      peerDependencies: meta.peerDependencies || {},
    });
  }
}

const byName = new Map();
for (const item of packages) {
  if (!byName.has(item.name)) byName.set(item.name, []);
  byName.get(item.name).push(item);
}
for (const item of packages) {
  item.incoming = [];
  item.outgoing = [];
  item.scope = item.name.startsWith('@') ? item.name.split('/')[0] : '无 npm scope';
}
for (const source of packages) {
  for (const [field, label] of [['dependencies', '生产'], ['devDependencies', '开发'], ['peerDependencies', 'Peer']]) {
    for (const targetName of Object.keys(source[field])) {
      const targets = byName.get(targetName);
      if (!targets) continue;
      source.outgoing.push({ name: targetName, type: label });
      for (const target of targets) target.incoming.push({ id: source.id, name: source.name, repo: source.repo, type: label });
    }
  }
}

const totals = {
  repositories: repositories.length,
  children: packages.filter(item => item.kind === '子包').length,
  roots: packages.filter(item => item.kind === '仓库根包').length,
  packages: packages.length,
};
const data = JSON.stringify({ repositories, packages, totals }).replaceAll('<', '\\u003c');
const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SearSuite · 仓库包清单</title>
<style>
:root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;color:#202b2d;background:#f6f8f7;line-height:1.55}
*{box-sizing:border-box}body{margin:0}button,input{font:inherit}button{cursor:pointer}a{color:inherit}
.top{position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid #dce5e1}.top-inner{max-width:1540px;margin:auto;padding:17px 32px;display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.mark{width:34px;height:34px;display:grid;place-items:center;background:#146d67;color:#fff;font-size:21px;font-weight:750;border-radius:5px;flex:none}.title{min-width:220px}.title h1{font-size:20px;line-height:1.2;margin:0}.title p{font-size:12px;color:#667672;margin:4px 0 0}.search{margin-left:auto;min-width:250px;width:min(420px,100%);height:39px;border:1px solid #cbd8d2;border-radius:5px;background:#fafcfb;padding:0 12px;color:#20302d;outline:none}.search:focus{border-color:#16867c;box-shadow:0 0 0 3px #d7eeea}
.shell{max-width:1540px;margin:auto;padding:30px 32px 80px;display:grid;grid-template-columns:225px minmax(0,1fr);gap:32px}.side{position:sticky;top:104px;align-self:start;max-height:calc(100vh - 120px);overflow:auto}.side-label{font-size:11px;font-weight:700;color:#82918c;margin:0 0 10px 10px}.nav{display:grid;gap:2px}.nav button{border:0;border-left:3px solid transparent;background:transparent;color:#4c5d58;display:flex;align-items:center;justify-content:space-between;text-align:left;padding:10px 10px 10px 12px;min-height:40px}.nav button:hover{background:#e9efec}.nav button.active{border-left-color:#138b7f;background:#e1f0eb;color:#135f57;font-weight:700}.nav small{font-size:11px;color:#6e8079;font-variant-numeric:tabular-nums}.side-note{margin:24px 10px;font-size:12px;color:#73827c}
main{min-width:0}.intro{padding:0 0 26px}.eyebrow{color:#168178;font-size:11px;font-weight:750;letter-spacing:.08em;text-transform:uppercase}.intro h2{font-size:29px;line-height:1.2;margin:7px 0 9px;letter-spacing:0}.intro p{font-size:14px;color:#566762;max-width:890px;margin:0}.stats{display:flex;gap:28px;flex-wrap:wrap;margin-top:22px}.stat strong{font-size:22px;display:block;line-height:1.1;font-variant-numeric:tabular-nums}.stat span{font-size:11px;color:#6c7d77}.toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:4px 0 13px}.toolbar h3{font-size:16px;margin:0 14px 0 0}.toggle{display:flex;border:1px solid #d6e0db;border-radius:5px;overflow:hidden;background:#fff}.toggle button{border:0;background:#fff;color:#4b5c56;padding:7px 12px;font-size:12px}.toggle button+button{border-left:1px solid #d6e0db}.toggle button[aria-pressed=true]{background:#e1eee9;color:#126960;font-weight:700}.count{margin-left:auto;color:#6d7d77;font-size:12px}
.table-wrap{background:#fff;border:1px solid #dce5e0;border-radius:6px;overflow:hidden}.table{width:100%;border-collapse:collapse;table-layout:fixed}.table th{background:#f0f4f2;color:#53645e;text-align:left;font-size:11px;font-weight:700;padding:11px 15px;border-bottom:1px solid #dce5e0}.table th:nth-child(1){width:28%}.table th:nth-child(2){width:34%}.table th:nth-child(3){width:14%}.table th:nth-child(4){width:24%}.table td{vertical-align:top;padding:15px;border-bottom:1px solid #e6ece9;font-size:12px}.table tr:last-child td{border-bottom:0}.table tr:hover td{background:#fcfefd}.pkg{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;font-weight:700;overflow-wrap:anywhere;color:#174f4a}.path{display:block;color:#87958f;font-size:10px;margin-top:5px;overflow-wrap:anywhere}.purpose{font-size:13px;color:#34443e}.badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:3px;background:#edf2f0;color:#48635a;margin:0 4px 4px 0}.badge.web{background:#e4f1ed;color:#0c6c63}.badge.node{background:#edf0f8;color:#405b80}.badge.test{background:#f8f1e5;color:#856b33}.ref{color:#566761}.ref summary{cursor:pointer;color:#176a62;font-weight:650}.ref summary:hover{text-decoration:underline}.ref-list{margin:8px 0 0;padding-left:16px;line-height:1.7}.ref-list li{overflow-wrap:anywhere}.muted{color:#91a09a}.empty{padding:34px;color:#6c7b75;text-align:center}.footnote{font-size:11px;color:#71817a;margin:16px 0;line-height:1.7}
@media(max-width:900px){.shell{display:block;padding:22px 16px}.side{position:static;max-height:none;margin:0 0 25px}.nav{display:flex;overflow:auto}.nav button{white-space:nowrap;flex:none;gap:9px}.top-inner{padding:14px 16px}.search{margin-left:0;flex:1}.table{min-width:760px}.table-wrap{overflow:auto}.table th{position:static}}
@media(max-width:600px){.title{min-width:0}.title h1{font-size:17px}.search{min-width:100%;order:3}.intro h2{font-size:24px}.stats{gap:18px}.table{min-width:700px}}
</style>
</head>
<body>
<header class="top"><div class="top-inner"><div class="mark" aria-hidden="true">S</div><div class="title"><h1>仓库包清单</h1><p>SearSuite 公开仓库</p></div><input id="search" class="search" type="search" placeholder="搜索包名、职责或引用仓库" aria-label="搜索包"></div></header>
<div class="shell"><aside class="side"><p class="side-label">REPOSITORIES</p><nav id="nav" class="nav" aria-label="仓库筛选"></nav><p class="side-note">引用数据来自这 ${repositories.length} 个仓库的 package.json，展示直接依赖声明。实际运行时调用、间接依赖和外部消费者不计入。</p></aside><main><section class="intro"><span class="eyebrow">Package inventory</span><h2>仓库、职责与引用范围</h2><p>清单包含 Core 和 Browser 的公开子包、Components 组件库，以及仅用于站点部署的 Website 根项目。</p><div id="stats" class="stats"></div></section><section><div class="toolbar"><h3 id="section-title">全部包</h3><div class="toggle" role="group" aria-label="包类型"><button data-kind="all" aria-pressed="true">全部</button><button data-kind="子包" aria-pressed="false">子包</button><button data-kind="仓库根包" aria-pressed="false">根包</button></div><span id="count" class="count"></span></div><div class="table-wrap"><table class="table"><thead><tr><th>包名 / 路径</th><th>作用</th><th>运行范围</th><th>直接引用</th></tr></thead><tbody id="rows"></tbody></table><div id="empty" class="empty" hidden>没有匹配的包</div></div><p class="footnote">“直接引用”只统计当前清单内其他包对该包的 dependencies、devDependencies 和 peerDependencies。0 条表示清单中没有依赖声明，不等于该包未被使用。包名相同时请以路径区分。</p></section></main></div>
<script>const DATA=${data};
const state={repo:'all',kind:'all',query:''};
const byId=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
  const nav=[['all','全部仓库','',DATA.packages.length],...DATA.repositories.map(([id,label,description])=>[id,label,description,DATA.packages.filter(p=>p.repo===id).length])];
  byId('nav').innerHTML=nav.map(([id,label,description,count])=>'<button type="button" data-repo="'+esc(id)+'" class="'+(state.repo===id?'active':'')+'" title="'+esc(description)+'"><span>'+esc(label)+'</span><small>'+count+'</small></button>').join('');
  byId('stats').innerHTML=[['仓库',DATA.totals.repositories],['子包',DATA.totals.children],['根包入口',DATA.totals.roots],['清单条目',DATA.totals.packages]].map(([label,value])=>'<div class="stat"><strong>'+value+'</strong><span>'+label+'</span></div>').join('');
  const filtered=DATA.packages.filter(p=>(state.repo==='all'||p.repo===state.repo)&&(state.kind==='all'||p.kind===state.kind)&&(!state.query||[p.name,p.purpose,p.id,p.repo,...p.incoming.map(x=>x.repo+' '+x.name)].join(' ').toLowerCase().includes(state.query)));
  byId('section-title').textContent=state.repo==='all'?'全部包':DATA.repositories.find(r=>r[0]===state.repo)[1];
  byId('count').textContent='显示 '+filtered.length+' / '+DATA.packages.length;
  byId('rows').innerHTML=filtered.map(p=>{
    const groups=Object.entries(Object.groupBy(p.incoming,x=>x.repo)).sort((a,b)=>a[0].localeCompare(b[0]));
    const refs=p.incoming.length?'<details class="ref"><summary>'+p.incoming.length+' 个包 · '+groups.length+' 个仓库</summary><ul class="ref-list">'+groups.flatMap(([repo,items])=>items.map(x=>'<li><strong>'+esc(repo)+'</strong> / '+esc(x.name)+' <span class="muted">('+esc(x.type)+')</span></li>')).join('')+'</ul></details>':'<span class="muted">清单中无直接引用</span>';
    const badge=p.environment==='浏览器'?'web':p.environment==='Node'?'node':p.environment==='测试环境'?'test':'';
    return '<tr><td><span class="pkg">'+esc(p.name)+'</span><span class="path">'+esc(p.id)+'</span></td><td><div class="purpose">'+esc(p.purpose)+'</div></td><td><span class="badge '+badge+'">'+esc(p.environment)+'</span><span class="badge">'+esc(p.kind)+'</span><span class="badge">'+esc(p.scope)+'</span></td><td>'+refs+'</td></tr>';
  }).join('');
  byId('empty').hidden=filtered.length>0;
  byId('rows').closest('table').hidden=filtered.length===0;
  document.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===state.kind)));
}
byId('nav').addEventListener('click',e=>{const button=e.target.closest('[data-repo]');if(button){state.repo=button.dataset.repo;render()}});
document.querySelector('.toggle').addEventListener('click',e=>{const button=e.target.closest('[data-kind]');if(button){state.kind=button.dataset.kind;render()}});
byId('search').addEventListener('input',e=>{state.query=e.target.value.trim().toLowerCase();render()});
render();
</script>
</body></html>`;

const output = path.join(base, 'searsuite-website/package-inventory.html');
fs.writeFileSync(output, html);
console.log(`Generated ${output}: ${totals.repositories} repositories, ${totals.children} child packages, ${totals.roots} root entries.`);
