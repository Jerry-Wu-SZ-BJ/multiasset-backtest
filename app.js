"use strict";
const pools = {
  "carri2": {
    "groups": [
      [
        "境内权益",
        [
          [
            "中证500"
          ],
          [
            "中证1000"
          ],
          [
            "红利风格股票"
          ]
        ]
      ],
      [
        "国债现货",
        [
          [
            "5年国债现货"
          ],
          [
            "10年国债现货"
          ]
        ]
      ],
      [
        "贵金属",
        [
          [
            "黄金期货"
          ]
        ]
      ],
      [
        "其他商品",
        [
          [
            "螺纹钢期货"
          ],
          [
            "沪铜期货"
          ],
          [
            "豆粕期货"
          ],
          [
            "原油期货"
          ]
        ]
      ]
    ]
  },
  "cvoya": {
    "groups": [
      [
        "境内权益",
        [
          [
            "沪深300"
          ],
          [
            "中证500"
          ]
        ]
      ],
      [
        "海外权益",
        [
          [
            "标普500"
          ],
          [
            "纳斯达克100"
          ]
        ]
      ],
      [
        "国债",
        [
          [
            "5年国债"
          ],
          [
            "10年国债"
          ],
          [
            "30年国债"
          ]
        ]
      ],
      [
        "贵金属",
        [
          [
            "黄金"
          ]
        ]
      ],
      [
        "其他商品",
        [
          [
            "沪铜"
          ],
          [
            "豆粕"
          ],
          [
            "原油"
          ]
        ]
      ]
    ]
  },
  "moderate": {
    "groups": [
      [
        "权益",
        [
          [
            "沪深300指数"
          ],
          [
            "中证500指数"
          ]
        ]
      ],
      [
        "债券",
        [
          [
            "中证国债指数"
          ],
          [
            "中证信用债1–3年隐含评级AA以上指数"
          ],
          [
            "中证中票短融0–1年高等级指数"
          ]
        ]
      ]
    ]
  }
};
const choices = {
  "signal": {
    "momentum": [
      "追随近期强势",
      "用过去涨跌判断趋势"
    ],
    "sharpe": [
      "挑涨得更稳的资产",
      "同时看超额收益和波动"
    ],
    "reversal": [
      "寻找同类中的超跌",
      "判断相对落后能否反弹"
    ],
    "ema": [
      "比较快慢均线",
      "观察短期价格位置"
    ],
    "none": [
      "跳过信号",
      "合格资产直接进入配权"
    ]
  },
  "screen": {
    "all": [
      "保留全部",
      "让合格资产都参与配权"
    ],
    "positive": [
      "只保留正分",
      "要求满足绝对分数门槛"
    ],
    "top": [
      "只选相对领先",
      "在全池按分数选前 K"
    ],
    "positiveTop": [
      "先过门槛，再选领先",
      "正分资产中最多选 K 条"
    ]
  },
  "risk": {
    "sample": [
      "按同一段历史估计",
      "波动和相关使用相同窗口"
    ],
    "split": [
      "短期波动，长期相关",
      "风险快更新，联动用长样本"
    ],
    "conservative": [
      "多种波动估计取高值",
      "让每条腿的估计更谨慎"
    ],
    "shrink": [
      "降低对样本相关的依赖",
      "向对角协方差收缩"
    ]
  },
  "weight": {
    "equal": [
      "每条腿分同样的本金",
      "等资金"
    ],
    "inverse": [
      "波动越大，本金越少",
      "逆波动率"
    ],
    "erc": [
      "让每条腿承担相近风险",
      "等风险贡献（ERC）"
    ],
    "minvar": [
      "让整个篮子的波动最小",
      "最小方差"
    ],
    "score": [
      "得分高且波动小，多分资金",
      "正得分除以波动率"
    ],
    "rank": [
      "给排名靠前者更多风险预算",
      "名次风险预算"
    ]
  },
  "exposure": {
    "keep": [
      "照基础比例持有",
      "保留基础仓位"
    ],
    "gate": [
      "正分保留，零分或负分退出",
      "二元门控"
    ],
    "partial": [
      "跑赢现金的窗口越多，仓位越大",
      "按投票比例调整"
    ],
    "floor": [
      "信号弱时也保留底仓",
      "趋势与底仓混合"
    ]
  },
  "funds": {
    "cash": [
      "留在现金里",
      "组合总风险投入下降"
    ],
    "reinvest": [
      "分给剩余资产",
      "把风险腿重新配满"
    ]
  },
  "scale": {
    "fixed": [
      "按原计划投入",
      "固定 1 倍"
    ],
    "reduce": [
      "风险太高就缩仓",
      "只减仓的目标波动"
    ],
    "target": [
      "高风险减仓，低风险可加仓",
      "双向目标波动"
    ]
  },
  "overlay": {
    "none": [
      "按计划持有",
      "关闭额外覆盖"
    ],
    "guard": [
      "风险超标就减仓，等下月再恢复",
      "预测风险护栏"
    ],
    "stop": [
      "从月内高点跌深了就退出",
      "移动止损"
    ],
    "profit": [
      "单腿赚到足够多就落袋",
      "逐腿贡献止盈"
    ],
    "circuit": [
      "组合回撤太深先减仓，修复后再恢复",
      "组合熔断与双阈值恢复"
    ]
  }
};
function makeComparisonChart() {
  const panels = [
    {canvas:byId("nav-curve"), field:"nav"},
    {canvas:byId("dd-curve"), field:"dd"}
  ];
  for (const panel of panels) panel.ctx = panel.canvas.getContext("2d");
  const track = byId("zoom-track"), range = byId("zoom-window");
  const dateLabel = byId("zoom-date"), resetButton = byId("zoom-reset");
  const tooltip = byId("chart-tip");
  const theme = getComputedStyle(document.documentElement);
  const muted = theme.getPropertyValue("--muted").trim(), line = theme.getPropertyValue("--line").trim();
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(x, hi));
  let rows = [], series = [], left = 0, right = 0, active = null, drag = null, pointerPanel = panels[0];

  function setSeries(next) {
    const dates = [...new Set(next.flatMap(item => item.result.rows.map(r => r.date)))].sort();
    const sameDates = rows.length === dates.length && dates.every((date,i) => rows[i].date === date);
    rows = dates.map(date => ({date}));
    series = next.map(item => {
      const lookup = new Map(item.result.rows.map(r => [r.date,r]));
      return {name:item.name, color:item.color, id:item.id, points:dates.map(date => lookup.get(date))};
    });
    if (!sameDates) {
      left = 0;
      right = rows.length - 1;
    }
    active = null;
    drawTicks();
    render();
  }

  function drawTicks() {
    track.querySelectorAll(".zoom-tick").forEach(tick => tick.remove());
    if (rows.length < 2) return;
    const firstYear = +rows[0].date.slice(0,4), lastYear = +rows.at(-1).date.slice(0,4);
    const stride = Math.max(1, Math.ceil((lastYear - firstYear + 1) / Math.max(2, Math.floor(track.clientWidth / 60))));
    for (let year = firstYear; year <= lastYear; year += stride) {
      const i = rows.findIndex(row => row.date >= String(year));
      const tick = document.createElement("div");
      tick.className = "zoom-tick";
      tick.style.left = (100 * i / (rows.length - 1)) + "%";
      const label = document.createElement("span");
      label.textContent = year;
      tick.append(label);
      track.prepend(tick);
    }
  }
  function drawPanel(panel) {
    const {canvas, ctx, field} = panel;
    const {width, height} = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = devicePixelRatio || 1;
    const pixelW = Math.round(width * ratio), pixelH = Math.round(height * ratio);
    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW;
      canvas.height = pixelH;
    }
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    const isDD = field === "dd";
    const x0 = width < 390 ? 46 : 50, x1 = width - 24;
    const y0 = 12, y1 = height - (isDD ? 25 : 8);
    let low = isDD ? -0.01 : Infinity, high = isDD ? 0 : -Infinity;
    for (const item of series) {
      for (let i = left; i <= right; i++) {
        const value = item.points[i]?.[field];
        if (value === undefined) continue;
        low = Math.min(low,value);
        high = Math.max(high,value);
      }
    }
    if (!isDD) {
      const pad = Math.max(0.002, (high - low) * 0.045);
      low -= pad;
      high += pad;
    }
    const xAt = i => x0 + (x1 - x0) * (i - left) / (right - left);
    const yAt = y => y1 - (y1 - y0) * (y - low) / (high - low);
    panel.plot = {x0,x1,xAt,width};
    ctx.font = "11px Inter, Microsoft YaHei, sans-serif";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    const yTicks = isDD ? 3 : 4;
    for (let i = 0; i <= yTicks; i++) {
      const value = high - (high - low) * i / yTicks, y = yAt(value);
      ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y);
      ctx.strokeStyle = line; ctx.stroke();
      ctx.textAlign = "right"; ctx.fillStyle = muted;
      ctx.fillText(isDD ? (value * 100).toFixed(1) + "%" : value.toFixed(3), x0 - 5,y);
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(x0,y0,x1 - x0,y1 - y0); ctx.clip();
    if (isDD && series.length === 1 && series[0].points.slice(left,right + 1).every(Boolean)) {
      ctx.beginPath();
      ctx.moveTo(x0,y0);
      for (let i = left; i <= right; i++) ctx.lineTo(xAt(i), yAt(series[0].points[i].dd));
      ctx.lineTo(x1,y0); ctx.closePath();
      ctx.fillStyle = series[0].color + "18"; ctx.fill();
    }
    for (const item of series) {
      ctx.beginPath();
      let started = false;
      for (let i = left; i <= right; i++) {
        const point = item.points[i];
        if (!point) { started = false; continue; }
        if (started) ctx.lineTo(xAt(i),yAt(point[field]));
        else ctx.moveTo(xAt(i),yAt(point[field]));
        started = true;
      }
      ctx.strokeStyle = item.color;
      ctx.lineWidth = isDD ? 1.25 : 1.85;
      ctx.setLineDash(item.id === 1 ? [] : item.id % 2 === 0 ? [6,3] : [2,2]);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (active !== null) {
      const x = xAt(active);
      ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.strokeStyle = "#7d939f"; ctx.lineWidth = 1; ctx.stroke();
      for (const item of series) {
        const point = item.points[active];
        if (!point) continue;
        ctx.beginPath(); ctx.arc(x,yAt(point[field]),2.7,0,Math.PI*2); ctx.fillStyle = item.color; ctx.fill();
      }
    }
    ctx.restore();
    if (isDD) {
      const n = Math.max(2, Math.min(8,Math.floor((x1 - x0) / 84),right - left + 1));
      ctx.fillStyle = muted;
      ctx.textAlign = "center";
      for (let j = 0; j < n; j++) {
        const i = left + Math.round((right - left) * j / (n - 1));
        const date = width < 460 && right - left > 70 ? rows[i].date.slice(0,7) : rows[i].date;
        const x = xAt(i), half = ctx.measureText(date).width / 2;
        ctx.fillText(date,clamp(x,half,width - half),y1 + 13);
      }
    }
  }

  function render() {
    if (rows.length < 2) return;
    for (const panel of panels) drawPanel(panel);
    tooltip.hidden = active === null;
    if (active !== null && pointerPanel.plot) {
      tooltip.replaceChildren(make("strong",rows[active].date + " · 净值 / 回撤"));
      for (const item of series) {
        const point = item.points[active], entry = make("div","","tip-row");
        const title = make("span",item.name,"tip-name");
        title.title = item.name;
        entry.append(marker(item.color),title,make("span",point ? point.nav.toFixed(4) : "—","tip-number"),
          make("span",point ? pct(point.dd) : "—","tip-number"));
        tooltip.append(entry);
      }
      pointerPanel.canvas.parentElement.append(tooltip);
      const {xAt,width} = pointerPanel.plot;
      const px = xAt(active);
      tooltip.style.left = clamp(px < width / 2 ? px + 9 : px - tooltip.offsetWidth - 9,0,Math.max(0,width - tooltip.offsetWidth)) + "px";
      tooltip.style.top = "7px";
    }
    range.style.left = 100 * left / (rows.length - 1) + "%";
    range.style.width = 100 * (right - left) / (rows.length - 1) + "%";
    dateLabel.textContent = "图表窗口 " + rows[left].date + " 至 " + rows[right].date;
    resetButton.disabled = left === 0 && right === rows.length - 1;
  }

  for (const panel of panels) {
    const {canvas} = panel;
    const pointer = event => {
      if (!panel.plot || rows.length < 2) return;
      pointerPanel = panel;
      const {x0,x1} = panel.plot, x = event.clientX - canvas.getBoundingClientRect().left;
      active = Math.round(left + (right - left) * clamp((x - x0) / (x1 - x0),0,1));
      render();
    };
    canvas.addEventListener("pointermove",pointer);
    canvas.addEventListener("pointerdown",pointer);
    for (const event of ["pointerleave","blur"]) canvas.addEventListener(event,() => { active = null; render(); });
    canvas.addEventListener("keydown", event => {
      if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key) || rows.length < 2) return;
      event.preventDefault();
      pointerPanel = panel;
      active = event.key === "Home" ? left : event.key === "End" ? right
        : clamp((active ?? left) + (event.key === "ArrowLeft" ? -1 : 1),left,right);
      render();
    });
  }

  track.addEventListener("pointerdown", event => {
    if (rows.length < 2) return;
    const edge = event.target.closest("[data-edge]")?.dataset.edge;
    const position = (event.clientX - track.getBoundingClientRect().left) / track.clientWidth;
    const i = Math.round(position * (rows.length - 1));
    const mode = edge || (event.target.closest("#zoom-window") ? "pan" : Math.abs(i - left) < Math.abs(i - right) ? "left" : "right");
    drag = {mode, x:event.clientX, left, right};
    track.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  track.addEventListener("pointermove", event => {
    if (!drag) return;
    const n = rows.length - 1;
    const delta = Math.round((event.clientX - drag.x) / track.clientWidth * n);
    if (drag.mode === "pan") {
      left = clamp(drag.left + delta,0,n - (drag.right - drag.left));
      right = left + drag.right - drag.left;
    } else if (drag.mode === "left") left = clamp(drag.left + delta,0,right - 1);
    else right = clamp(drag.right + delta,left + 1,n);
    active = null;
    render();
  });
  for (const type of ["lostpointercapture","pointercancel","pointerup"]) track.addEventListener(type, () => { drag = null; });
  track.addEventListener("keydown", event => {
    const edge = event.target.dataset.edge;
    if (!edge || !["ArrowLeft","ArrowRight"].includes(event.key) || rows.length < 2) return;
    event.preventDefault();
    const delta = (event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 20 : 1);
    if (edge === "left") left = clamp(left + delta,0,right - 1);
    else right = clamp(right + delta,left + 1,rows.length - 1);
    active = null;
    render();
  });
  resetButton.addEventListener("click", () => { left = 0; right = rows.length - 1; active = null; render(); });
  new ResizeObserver(() => { drawTicks(); render(); }).observe(panels[0].canvas);
  return {setSeries};
}




const byId = id => document.getElementById(id);
function make(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function marker(color) {
  const dot = make("span","","color-mark");
  dot.style.backgroundColor = color;
  dot.setAttribute("aria-hidden","true");
  return dot;
}
const pct = value => (100 * value).toFixed(2) + "%";
const coverage = Object.freeze({"start":"2018-02-01","end":"2026-09-10","fee":5});
const assetNames = pool => pools[pool].groups.flatMap(([,members]) => members.map(([name]) => name));
const allIndexes = pool => assetNames(pool).map((_,i) => i);
const layerNames = {pool:"A 资产池", signal:"B 信号", risk:"C 风险建模", weight:"D 资本配置", scale:"E 交易执行"};
const primary = Object.keys(layerNames);
const labels = {
  pool:{carri2:"招商 CARRI2", cvoya:"兴业 CVOYA", moderate:"931786 债股优选稳健"},
  risk:{sample:"60 日样本协方差", split:"短波动、长相关", conservative:"保守波动估计", shrink:"样本协方差收缩"}
};
const optionsFor = key => labels[key] ?? Object.fromEntries(Object.entries(choices[key]).map(([value,info]) =>
  [value, ["weight","scale","exposure","overlay"].includes(key) ? info[1] : info[0]]));
const windows = {20:"20 日", 60:"60 日", 120:"120 日", multi:"20／60／120 日"};
const defaults = Object.freeze({
  pool:"carri2", signal:"momentum", windows:"multi", blend:"mean", screen:"positiveTop", topk:3,
  risk:"split", weight:"erc", exposure:"keep", funds:"cash", scale:"reduce", overlay:"none",
  target:3, cap:200, borrow:3
});
const strategies = [];
const pending = new Set();
const colors = ["#102c45","#0a7c78","#ad742a","#526b9b","#944d75","#58824d","#985340","#437b9b","#827245"];
const chart = makeComparisonChart();
let nextId = 1, timer = 0;

function hasWindow(config) { return !["none","ema"].includes(config.signal); }
function voteEligible(config) { return config.signal === "momentum" && config.windows === "multi"; }
function usesTop(config) { return ["top","positiveTop"].includes(config.screen); }
function allowed(config, key, value) {
  if (key === "screen" && config.signal === "none") return value === "all";
  if (key === "weight" && config.signal === "none") return !["score","rank"].includes(value);
  if (key === "exposure") {
    if (config.signal === "none") return value === "keep";
    if (["partial","floor"].includes(value)) return voteEligible(config) && config.blend === "votes";
  }
  return true;
}
function normalize(config) {
  config.blend = "mean";
  config.screen = config.signal === "none" ? "all" : "positiveTop";
  config.windows = hasWindow(config) && config.windows === "60" ? "60" : "multi";
  config.topk = config.signal !== "none" && config.topk === 5 ? 5 : 3;
  if (!voteEligible(config)) config.blend = "mean";
  for (const [key, fallback] of Object.entries({screen:"all", weight:"equal", exposure:"keep"})) {
    if (!allowed(config,key,config[key])) config[key] = fallback;
  }
  config.topk = Math.min(config.topk,Math.max(1,config.active.length));
  return config;
}
function tails(c) {
  const horizon = c.signal === "ema" ? "20／60 EMA" : hasWindow(c) ? windows[c.windows] : "";
  const filter = {all:"全保留", positive:"正分", top:"前 " + c.topk, positiveTop:"正分前 " + c.topk};
  return {
    pool:c.active.length + " / " + assetNames(c.pool).length + " 条",
    signal:[horizon,filter[c.screen], c.blend === "votes" ? "投票" : ""].filter(Boolean).join(" · "),
    risk:choices.risk[c.risk][1],
    weight:optionsFor("exposure")[c.exposure] + (c.exposure !== "keep" ? " · " + optionsFor("funds")[c.funds] : ""),
    scale:[c.scale === "fixed" ? "" : c.target + "%", c.scale === "target" ? "上限 " + c.cap + "%" : "",
      c.overlay === "none" ? "无额外覆盖" : choices.overlay[c.overlay][1]].filter(Boolean).join(" · ")
  };
}
function layerValue(c, key) {
  const values = {
    pool:[c.pool,...c.active],
    signal:[c.signal, ...(hasWindow(c) ? [c.windows,c.blend] : []), c.screen, ...(usesTop(c) ? [c.topk] : [])],
    risk:[c.risk],
    weight:[c.weight,c.exposure,...(c.exposure === "keep" ? [] : [c.funds])],
    scale:[c.scale,c.overlay,...(c.scale === "fixed" ? [] : [c.target]), ...(c.scale === "target" ? [c.cap,c.borrow] : [])]
  };
  return JSON.stringify(values[key]);
}
function makeOptions(input, options) {
  for (const [value,label] of Object.entries(options)) input.append(new Option(label,value));
  return input;
}
function rowButton(label, action) {
  const button = make("button",label,"button");
  button.type = "button";
  button.addEventListener("click",action);
  return button;
}

function newStrategy(name, config, result = null) {
  const id = nextId++;
  const color = colors[(id - 1) % colors.length];
  const row = {id,name,color,config:normalize(structuredClone(config)),visible:true,result,runs:0,revision:0,error:"",busy:false,cells:{}};
  const tr = make("tr");
  tr.dataset.row = id;
  row.node = tr;
  const compare = make("td","","compare-cell"), toggle = make("input");
  toggle.type = "checkbox";
  toggle.checked = true;
  toggle.addEventListener("change", () => { row.visible = toggle.checked; renderComparison(); });
  compare.append(toggle);
  row.toggle = toggle;
  const nameCell = make("td"), title = make("div","","name-field"), nameInput = make("input");
  nameInput.type = "text";
  nameInput.maxLength = 48;
  nameInput.value = name;
  nameInput.addEventListener("change", () => {
    row.name = nameInput.value.trim() || (id === 1 ? "基准方案" : "方案 " + id);
    nameInput.value = row.name;
    syncRow(row);
    renderComparison();
  });
  title.append(marker(color),nameInput);
  row.nameInput = nameInput;
  row.status = make("p","","row-note");
  nameCell.append(title,row.status);
  tr.append(compare,nameCell);
  for (const key of primary) {
    const td = make("td");
    td.dataset.layer = key;
    const select = makeOptions(make("select","","primary-select"),optionsFor(key));
    select.dataset.key = key;
    select.addEventListener("change", () => {
      const next = {...row.config,[key]:select.value};
      if (key === "pool") next.active = allIndexes(next.pool);
      updateConfig(row,next);
    });
    const tail = make("div","","cell-tail"), hint = make("span","","hint");
    const edit = make("button","明细","link-button");
    edit.type = "button";
    edit.dataset.detail = key;
    edit.addEventListener("click",() => openDetails(row,key));
    tail.append(hint,edit);
    td.append(select,tail);
    tr.append(td);
    row.cells[key] = {td,select,hint,edit};
  }
  const actionsCell = make("td"), actions = make("div","","row-actions");
  const duplicate = rowButton("复制",() => duplicateRow(row));
  duplicate.title = "复制整行配置";
  const retry = rowButton("重试",() => queue([row]));
  row.retry = retry;
  actions.append(duplicate,rowButton("配置",() => openConfig(row)),retry);
  if (id !== 1) actions.append(rowButton("删除",() => {
    pending.delete(row);
    row.revision++;
    strategies.splice(strategies.indexOf(row),1);
    tr.remove();
    renderComparison();
  }));
  actionsCell.append(actions);
  tr.append(actionsCell);
  strategies.push(row);
  byId("strategy-rows").append(tr);
  syncRow(row);
  return row;
}

function syncRow(row) {
  row.node.dataset.runs = row.runs;
  row.toggle.setAttribute("aria-label","对比 " + row.name);
  row.nameInput.setAttribute("aria-label","方案 " + row.id + " 名称");
  const notes = tails(row.config);
  for (const [key, cell] of Object.entries(row.cells)) {
    cell.select.value = row.config[key];
    for (const option of cell.select.options) option.disabled = !allowed(row.config,key,option.value);
    cell.select.setAttribute("aria-label",row.name + " " + layerNames[key]);
    cell.hint.textContent = notes[key];
    cell.hint.title = notes[key];
    cell.edit.setAttribute("aria-label",row.name + " " + layerNames[key] + "明细");
    cell.td.dataset.changed = row !== strategies[0] && layerValue(row.config,key) !== layerValue(strategies[0].config,key);
  }
  row.status.dataset.state = row.error ? "error" : "";
  const status = row.error || (row.busy ? "加载中…" : row.result ? "结果已加载" : "待加载");
  row.status.textContent = (row.id === 1 ? "基准 · " : "") + status;
  row.retry.hidden = !row.error;
}
function updateConfig(row, next) {
  const normalized = normalize(next);
  if (primary.every(key => layerValue(row.config,key) === layerValue(normalized,key))) {
    row.config = normalized;
    syncRow(row);
    return;
  }
  row.config = normalized;
  queue([row]);
  if (row === strategies[0]) strategies.slice(1).forEach(syncRow);
}
function duplicateRow(source) {
  const stem = source.name.slice(0,35) + " 副本";
  let name = stem;
  for (let k = 2; strategies.some(row => row.name === name); k++) name = stem + " " + k;
  const row = newStrategy(name,source.config,source.result);
  if (!row.result) queue([row]);
  else renderComparison();
}

function queue(rows) {
  for (const row of rows) {
    row.revision++;
    pending.add(row);
    row.busy = true;
    row.error = "";
    row.result = null;
    syncRow(row);
  }
  clearTimeout(timer);
  timer = setTimeout(flush,100);
  renderComparison();
}
function flush() {
  const batch = [...pending];
  pending.clear();
  for (const row of batch) void runRow(row);
}

function signalResultKey({signal,windows,topk,risk}) {
  return [signal,hasWindow({signal}) ? windows : "fixed",signal === "none" ? 0 : topk,risk].join("-");
}

function drawdownCurve(nav) {
  let peak = 1;
  return nav.map(value => {
    peak = Math.max(peak,value);
    return value / peak - 1;
  });
}

function decodeNavPack(arrayBuffer) {
  if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength < 4) {
    throw new Error("结果包头部不完整。");
  }
  const bytes = new Uint8Array(arrayBuffer);
  const metadataLength = new DataView(arrayBuffer).getUint32(0,true);
  const dataStart = 4 + metadataLength;
  if (!metadataLength || dataStart > bytes.length) throw new Error("结果包元数据长度无效。");
  const {dates,results} = JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes.subarray(4,dataStart)));
  if (!Array.isArray(dates) || !dates.length || !results || typeof results !== "object" || Array.isArray(results)) {
    throw new Error("结果包缺少交易日历或配置索引。");
  }
  const pointCount = dates.length;
  const planeLength = (bytes.length - dataStart) / 8;
  const curveCount = planeLength / pointCount;
  if (!Number.isSafeInteger(curveCount) || curveCount < 1) throw new Error("结果包净值数据长度无效。");

  function readNav(curve) {
    if (!Number.isSafeInteger(curve) || curve < 0 || curve >= curveCount) {
      throw new Error("结果包净值索引超出范围。");
    }
    const nav = new Array(pointCount);
    const value = new DataView(new ArrayBuffer(8));
    const curveStart = dataStart + curve * pointCount;
    for (let date = 0; date < pointCount; date++) {
      for (let byte = 0; byte < 8; byte++) value.setUint8(byte,bytes[curveStart + date + byte * planeLength]);
      nav[date] = value.getFloat64(0,true);
    }
    return nav;
  }

  return {dates,results,readNav};
}

const poolRequests = new Map();

function loadPool(pool) {
  if (!poolRequests.has(pool)) {
    const request = Promise.resolve("./results-926f0c5dd5712644-" + pool + ".bin.gz").then(url => fetch(url,{
      credentials:"omit",signal:AbortSignal.timeout(60000)
    })).then(response => {
      if (!response.ok || !response.body) throw new Error("无法下载资产池结果。");
      const body = response.body.pipeThrough(new DecompressionStream("gzip"));
      return new Response(body).arrayBuffer().then(decodeNavPack);
    }).catch(error => {
      poolRequests.delete(pool);
      throw error;
    });
    poolRequests.set(pool,request);
  }
  return poolRequests.get(pool);
}

async function runRow(row) {
  const revision = row.revision;
  const {pool,weight,scale} = row.config;
  try {
    const {dates,results,readNav} = await loadPool(pool);
    if (row.revision !== revision) return;
    const data = results[signalResultKey(row.config)]?.[weight]?.[scale];
    if (!data) {
      throw new Error("该组合的结果文件不完整，请重试。");
    }
    const nav = readNav(data.curve);
    const drawdown = drawdownCurve(nav);
    row.result = {
      rows:dates.map((date,i) => ({date,nav:nav[i],dd:drawdown[i]})),
      cagr:data.metrics.annualReturn,vol:data.metrics.annualVolatility,
      mdd:data.metrics.maxDrawdown,turnover:data.metrics.annualTurnover
    };
    row.runs++;
  } catch {
    if (row.revision === revision) row.error = "暂时无法读取预计算结果，请重试。";
  } finally {
    if (row.revision === revision) {
      row.busy = false;
      syncRow(row);
      renderComparison();
    }
  }
}

function renderComparison() {
  const selected = strategies.filter(row => row.visible);
  const complete = selected.filter(row => row.result);
  const busy = strategies.filter(row => row.busy).length;
  const errors = selected.filter(row => row.error).length;
  const note = byId("run-status");
  note.textContent = busy ? busy + " 行正在加载" :
    complete.length + " 套已选方案" + (errors ? " · " + errors + " 行待重试" : "");
  byId("comparison-body").hidden = complete.length === 0;
  const empty = byId("empty-state");
  empty.hidden = complete.length > 0;
  empty.textContent = !selected.length ? "勾选策略行左侧的「对比」以显示曲线。" :
    busy ? "正在加载所选方案的净值与回撤…" : "请重试加载所选方案。";
  byId("legend").replaceChildren(...complete.map(row => {
    const item = make("span","","legend-item");
    item.dataset.series = row.id;
    item.title = row.name;
    item.append(marker(row.color),make("span",row.name));
    return item;
  }));
  byId("metrics-rows").replaceChildren(...complete.map(row => {
    const tr = make("tr"), r = row.result, name = make("td");
    tr.dataset.series = row.id;
    name.append(marker(row.color),document.createTextNode(row.name));
    const dd = make("td",pct(r.mdd));
    dd.dataset.gate = r.mdd >= -0.10 ? "pass" : "fail";
    dd.title = r.mdd >= -0.10 ? "回撤幅度 ≤ 10%" : "回撤幅度 > 10%";
    tr.append(name,make("td",pct(r.cagr)),make("td",pct(r.vol)),dd,make("td",pct(r.turnover)));
    return tr;
  }));
  if (complete.length) chart.setSeries(complete);
}

const detailRules = {
  signal:{
    momentum:["用窗口内的累计收益打分。近期涨幅越大，得分越高。","累计收益 = ∏(1 + 日收益) − 1"],
    sharpe:["用相对现金的日超额收益衡量风险调整后的强弱。","得分 = √252 × 日超额收益均值 ÷ 日超额收益样本标准差"],
    reversal:["比较同类资产在同一回看窗口内的表现，落后越多，得分越高。","得分 = 同组资产的平均累计收益 − 本资产累计收益"],
    ema:["用短、长指数移动平均线的相对位置判断强弱。","得分 = 20 日 EMA ÷ 60 日 EMA − 1"],
    none:["合格资产直接进入配权。"]
  },
  screen:{
    all:["保留波动率有效且得分有限的资产。"],
    positive:["只保留得分严格大于 0 的资产。"],
    top:["按得分从高到低，最多取前 K 条。"],
    positiveTop:["先剔除零分和负分资产，再从剩余资产中取前 K 条。","示例：得分为 3、1、−2，且 K = 3 时，只入选前两条。"]
  },
  risk:{
    sample:["用最近 60 个交易日收益计算样本协方差。"],
    split:["用最近 20 个交易日估计各资产波动率，用最近 252 个交易日估计两两相关系数。","协方差 = 短期波动率ᵢ × 短期波动率ⱼ × 长期相关系数ᵢⱼ"],
    conservative:["比较 EWMA 方差（λ = 0.94）与 20／60／120 日样本方差的均值，取较大值后开方作为波动率。","相关系数使用最近 126 个交易日估计。"],
    shrink:["用 60 日样本协方差估计风险，保留对角线方差，将非对角线协方差乘以 0.9。"]
  },
  weight:{
    equal:["入选资产等资金配置，每条资产的基础权重为 1 ÷ 入选资产数。"],
    inverse:["基础权重与波动率的倒数成正比，归一化后权重合计为 100%。"],
    erc:["使用估计协方差求解等风险贡献权重，使入选资产各自承担相近的组合风险。"],
    minvar:["用估计协方差最小化组合方差 wᵀΣw，入选资产权重非负且合计为 100%。"],
    score:["先计算 max(得分, 0) ÷ 波动率，再归一化为基础权重。"],
    rank:["得分越高，名次对应的风险预算越大。并列得分使用平均名次，再按预算求解权重。"]
  },
  scale:{
    fixed:["按基础权重执行，总仓位受上限约束。"],
    reduce:["预测组合波动超过目标时按比例减仓，缩放倍数最多为 1，并受总仓位上限约束。"],
    target:["按目标波动 ÷ 预测组合波动缩放基础权重，可减仓或加仓，并受总仓位上限约束。"]
  }
};

function openDetails(row, key) {
  if (key === "signal") return openSignalEditor(row);
  const config = row.config;
  const fields = [[layerNames[key],optionsFor(key)[config[key]]]];
  const sections = [];
  const notes = lines => {
    const box = make("div","","detail-notes");
    for (const line of lines) box.append(make("p",line));
    sections.push(box);
  };
  if (key === "pool") {
    fields.push(["纳入资产",config.active.length + " / " + assetNames(config.pool).length + " 条"]);
    const groups = make("div","","assets");
    const active = new Set(config.active);
    let index = 0;
    for (const [name,members] of pools[config.pool].groups) {
      const assets = make("div","","assets-items");
      for (const [asset] of members) if (active.has(index++)) assets.append(make("span",asset,"asset"));
      if (assets.childElementCount) groups.append(make("h4",name),assets);
    }
    sections.push(groups);
  }
  if (key === "risk") notes(detailRules.risk[config.risk]);
  if (key === "weight") {
    fields.push(["信号到仓位",optionsFor("exposure")[config.exposure]]);
    notes(detailRules.weight[config.weight]);
  }
  if (key === "scale") {
    if (config.scale !== "fixed") fields.push(["目标波动（年化）",config.target + "%"]);
    fields.push(
      ["总仓位上限",(config.scale === "target" ? config.cap : 100) + "%"],
      ["融资年利率",config.scale === "target" ? config.borrow + "%" : "不使用融资"],
      ["月内风险动作",optionsFor("overlay")[config.overlay]],
      ["调仓频率","月度"],
      ["单边成本",coverage ? coverage.fee + " bp" : "等待结果版本加载"]
    );
    notes(detailRules.scale[config.scale]);
    notes(["评价期首个交易日建仓，此后每月首个交易日调仓。信号和风险估计使用该资产池上一估值日的数据。"]);
  }

  let dialog = byId("detail-dialog");
  if (!dialog) {
    dialog = make("dialog");
    dialog.id = "detail-dialog";
    dialog.setAttribute("aria-labelledby","detail-title");
    document.body.append(dialog);
  }
  const title = make("h3",row.name + " · " + layerNames[key]);
  title.id = "detail-title";
  const grid = make("dl","","editor-grid");
  for (const [label,value] of fields) {
    const field = make("div","","editor-field");
    field.append(make("dt",label),make("dd",value,"detail-value"));
    grid.append(field);
  }
  const actions = make("div","","actions editor-actions");
  const close = rowButton("关闭",() => dialog.close());
  close.autofocus = true;
  actions.append(close);
  dialog.replaceChildren(title,grid,...sections,actions);
  dialog.showModal();
}

function openSignalEditor(row) {
  const config = row.config;
  let dialog = byId("detail-dialog");
  if (!dialog) {
    dialog = make("dialog");
    dialog.id = "detail-dialog";
    dialog.setAttribute("aria-labelledby","detail-title");
    document.body.append(dialog);
  }

  const title = make("h3",row.name + " · " + layerNames.signal);
  title.id = "detail-title";
  const form = make("form");
  const grid = make("div","","editor-grid");
  const field = (label, value) => {
    const wrapper = make("div","","editor-field");
    wrapper.append(make("span",label),make("span",value,"detail-value"));
    grid.append(wrapper);
    return wrapper;
  };
  const selectField = (label, options, selected) => {
    const wrapper = make("label","","editor-field");
    const select = make("select","","detail-value");
    for (const [value,text] of options) select.append(new Option(text,value));
    select.value = selected;
    wrapper.append(make("span",label),select);
    grid.append(wrapper);
    return select;
  };

  field(layerNames.signal,optionsFor("signal")[config.signal]);
  let windowSelect, topkSelect;
  if (hasWindow(config)) {
    windowSelect = selectField("回看窗口",[
      ["multi",windows.multi + "等权合成"],["60",windows["60"]]
    ],config.windows);
    const blend = field("多窗口合成","得分等权平均");
    blend.hidden = windowSelect.value !== "multi";
    windowSelect.addEventListener("change",() => { blend.hidden = windowSelect.value !== "multi"; });
  } else if (config.signal === "ema") {
    field("均线窗口","20／60 日 EMA");
  }
  field("筛选",optionsFor("screen")[config.screen]);
  if (config.signal !== "none") topkSelect = selectField("最多入选",[["3","3 条"],["5","5 条"]],String(config.topk));

  form.append(grid);
  for (const lines of [detailRules.signal[config.signal],detailRules.screen[config.screen]]) {
    const box = make("div","","detail-notes");
    for (const line of lines) box.append(make("p",line));
    form.append(box);
  }
  const actions = make("div","","actions editor-actions");
  const editable = Boolean(windowSelect || topkSelect);
  const close = rowButton(editable ? "取消" : "关闭",() => dialog.close());
  actions.append(close);
  if (editable) {
    const apply = make("button","应用","button primary");
    apply.type = "submit";
    actions.append(apply);
    form.addEventListener("submit",event => {
      event.preventDefault();
      updateConfig(row,{
        ...row.config,
        windows:windowSelect?.value ?? config.windows,
        topk:Number(topkSelect.value)
      });
      dialog.close();
    });
  }
  (windowSelect ?? topkSelect ?? close).autofocus = true;
  form.append(actions);
  dialog.replaceChildren(title,form);
  dialog.showModal();
}


function openText(title, value) {
  const dialog = byId("text-dialog"), field = dialog.querySelector("textarea");
  byId("text-title").textContent = title;
  byId("copy-status").textContent = "";
  field.value = value;
  dialog.showModal();
  field.focus();
  field.select();
}
byId("copy-text").addEventListener("click",async () => {
  const field = byId("text-dialog").querySelector("textarea");
  try {
    await navigator.clipboard.writeText(field.value);
    byId("copy-status").textContent = "已复制。";
  } catch {
    field.focus();
    field.select();
    byId("copy-status").textContent = "已选中内容，可直接复制。";
  }
});
function openConfig(row) {
  const c = row.config, notes = tails(c);
  const lines = primary.map(key => layerNames[key] + " · " + optionsFor(key)[c[key]] + " · " + notes[key]);
  const names = assetNames(c.pool);
  const settings = coverage ? coverage.start + " 至 " + coverage.end + " · 单边成本 " + coverage.fee + " bp" : "结果版本待加载";
  openText(row.name + " · 策略配置",[row.name,settings,...lines,"纳入资产 " + c.active.map(i => names[i]).join("、"),
    ...(c.scale === "target" ? ["融资年利率 " + c.borrow + "%"] : [])].filter(Boolean).join("\n"));
}
byId("copy-baseline").addEventListener("click",() => duplicateRow(strategies[0]));
function openSupport() {
  if (location.hash === "#support") {
    byId("support").open = true;
    byId("support").scrollIntoView({block:"start"});
  }
}
window.addEventListener("hashchange",openSupport);
byId("coverage").textContent = coverage.start + " 至 " + coverage.end;
const firstConfig = {...defaults,active:allIndexes(defaults.pool)};
newStrategy("基准方案",firstConfig);
newStrategy("配权对照",{...firstConfig,weight:"equal"});
queue(strategies);
openSupport();



