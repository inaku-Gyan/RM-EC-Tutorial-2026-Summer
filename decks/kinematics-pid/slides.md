---
theme: dracula
addons:
  - slidev-addon-counter
title: "Kinematics and PID Control"
info: |
  RoboMaster Summer Camp 2026 - Kinematics and PID Control:
  chassis motion commands, mecanum wheel inverse kinematics,
  wheel speed targets, discrete PID control, tuning, and common
  robot control pitfalls.
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

# Kinematics and PID Control

运动学解算与闭环控制

RM Summer Camp 2026

---

# 课程大纲

| 章节 | 主线                       |
| ---- | -------------------------- |
| 1    | 控制链路总览               |
| 2    | 麦轮运动学解算             |
| 3    | 从轮速到电机目标           |
| 4    | PID 控制基础               |
| 5    | 离散 PID 与工程实现        |
| 6    | 调参与常见问题             |
| 7    | 整车控制中的边界与检查清单 |

目标：理解从“期望底盘运动”到“电机闭环跟踪”的完整链路。

---
layout: section
---

# <Counter :level="1" /> - Control Chain

从指令到反馈的完整路径

---

# 整体链路

```mermaid
flowchart LR
  Input[遥控器 / 上位机] --> Cmd[chassis command<br/>vx, vy, wz]
  Cmd --> Kin[运动学解算]
  Kin --> Target[wheel target rpm]
  Target --> Pid[PID controller]
  Pid --> Can[motor current<br/>CAN command]
  Can --> Motor[电机 + 底盘]
  Motor --> Encoder[encoder feedback rpm]
  Encoder --> Pid
```

主线：运动学负责“目标分配”，PID 负责“让电机跟上目标”。

---

# 开环与闭环

| 控制方式 | 做法                 | 问题或收益                           |
| -------- | -------------------- | ------------------------------------ |
| 开环     | 直接给固定电流或 PWM | 简单，但负载变化时速度不可控         |
| 闭环     | 比较目标值和反馈值   | 能根据误差自动修正输出               |
| 反馈     | 编码器测得实际速度   | 让控制器知道“现在到底转得有多快”     |
| 误差     | `target - feedback`  | PID 的输入，也是调试时最重要的量之一 |

如果没有反馈，程序只是在“希望电机听话”。

---
layout: section
---

# <Counter :level="1" /> - Kinematics

运动学解算

---

# <Counter :level="2" /> 什么是运动学

运动学只研究“几何运动关系”，暂时不关心：

- 电机力矩够不够
- 轮胎是否打滑
- 地面摩擦力够不够
- PID 参数怎么调

在底盘控制里，它回答的是：

| 问题       | 典型含义                       |
| ---------- | ------------------------------ |
| 底盘怎么动 | `vx`, `vy`, `wz`               |
| 轮子怎么转 | 四个轮子的线速度、角速度或 rpm |

运动学是“目标分配”，不是“让电机真的做到”。

---

# 正运动学与逆运动学

| 名称                        | 输入                | 输出                |
| --------------------------- | ------------------- | ------------------- |
| 正运动学 Forward Kinematics | 每个轮子的实际速度  | 底盘实际 `vx/vy/wz` |
| 逆运动学 Inverse Kinematics | 期望底盘 `vx/vy/wz` | 每个轮子的目标速度  |

---

# 举个简单例子：差速底盘

差速底盘只有左右两侧轮速：

$$
v = \frac{v_R + v_L}{2}
$$

$$
\omega = \frac{v_R - v_L}{W}
$$

- 正运动学：已知 $v_L$、$v_R$，求底盘前进速度 $v$ 和角速度 $\omega$
- 逆运动学：已知 $v$、$\omega$，反过来求 $v_L$、$v_R$

---

# 坐标系约定

| 符号       | 含义             | 正方向示例           |
| ---------- | ---------------- | -------------------- |
| $v_x$      | 底盘前后线速度   | 正值向前             |
| $v_y$      | 底盘左右线速度   | 正值向左             |
| $\omega_z$ | 底盘绕中心角速度 | 正值逆时针（右手系） |

约定不统一时，公式本身很难救回来。

同一套约定要贯穿：遥控器输入、运动学矩阵、轮子编号、电机反馈方向。

---

# 轮子编号约定

```text
         x+ forward
              ^
              |
       FL     |     FR
        \     |     /
         \    |    /
y+ left <-----+-----> y- right
         /    |    \
        /     |     \
       BL     |     BR
```

- _FL_: Front Left
- _FR_: Front Right
- _BL_ or _RL_: Back Left or Rear Left
- _BR_ or _RR_: Back Right or Rear Right

---

# 常见数学方法

| 方法            | 用在什么地方                         |
| --------------- | ------------------------------------ |
| 坐标变换        | 世界坐标速度转到底盘坐标速度         |
| 刚体速度分解    | 底盘平移速度 + 绕中心旋转速度        |
| 向量投影        | 把轮子接触点速度投影到轮子可驱动方向 |
| 矩阵 / Jacobian | 把多个轮子的关系写成统一线性方程     |
| 伪逆 / 最小二乘 | 轮子数量和自由度不完全匹配时求近似解 |

麦轮逆运动学主要用前三个思想，最后写成矩阵。

---

# <Counter :level="2" /> 麦轮推导思路

把底盘看成刚体。

每个轮子接触点的速度都由两部分组成：

$$
\vec{v_i} =
\begin{bmatrix}
v_x \\\\
v_y
\end{bmatrix}
+
\omega_z
\begin{bmatrix}
-y_i \\\\
x_i
\end{bmatrix}
$$

- 第一项：底盘整体平移
- 第二项：绕底盘中心旋转带来的切向速度

接下来把 $\vec{v_i}$ 投影到第 $i$ 个麦轮的可驱动方向。

---

# 轮子速度来自投影

设第 $i$ 个轮子的可驱动方向单位向量为 $\vec{t_i}$。

轮子外缘线速度可以写成：

$$
v_i = \vec{t_i}^{T} \vec{v_i}
$$

代入刚体速度后：

$$
v_i =
\vec{t_i}^{T}
\begin{bmatrix}
v_x \\\\
v_y
\end{bmatrix}
+
\omega_z
\vec{t_i}^{T}
\begin{bmatrix}
-y_i \\\\
x_i
\end{bmatrix}
$$

这就是麦轮矩阵每一行的来源。

---

# 麦轮逆运动学矩阵

常见简化模型中：

- 轮子在矩形底盘四角对称分布
- 底盘中心到轮子的 $x$/$y$ 距离为 $L_x$、$L_y$
- 旋转项系数：$k = L_x + L_y$
- 四个麦轮安装方向：与地面接触的四个辊子围成 O 形

给定底盘速度：

$$
\begin{bmatrix}
v_{\text{FL}} \\\\
v_{\text{FR}} \\\\
v_{\text{BL}} \\\\
v_{\text{BR}}
\end{bmatrix}
=
\begin{bmatrix}
1 & -1 & -k \\\\
1 &  1 &  k \\\\
1 &  1 & -k \\\\
1 & -1 &  k
\end{bmatrix}
\begin{bmatrix}
v_x \\\\
v_y \\\\
\omega_z
\end{bmatrix}
$$

这里的 $v_{\text{FL}}$ 等表示轮子外缘的目标线速度。

---

# 矩阵每一列的直觉

| 输入       | 对四个轮子的影响           | 直觉                 |
| ---------- | -------------------------- | -------------------- |
| $v_x$      | 四个轮子同向               | 一起往前或往后       |
| $v_y$      | 左右/前后轮出现不同符号    | 利用麦轮斜向滚子平移 |
| $\omega_z$ | 对角轮同向，另一对角反向   | 产生绕中心的转动     |
| $k$        | 底盘越大，旋转需要轮速越大 | 外圈半径越大         |

实车第一次验证时，先分别测前进、横移、旋转，再测试复合运动。

---

# 逆运动学与正运动学的矩阵关系

把逆运动学写成：

$$
\vec{v}_{\text{wheel}} = J \vec{v}_{\text{chassis}}
$$

其中 $J$ 是底盘的运动学矩阵。

正运动学就是反过来估计底盘速度：

$$
\vec{v}_{\text{chassis}} = J^{+}\vec{v}_{\text{wheel}}
$$

$J^{+}$ 表示伪逆。对称四麦轮底盘通常可以推成简洁公式；更一般的轮式底盘常用矩阵方法统一处理。

---

# 轮速限幅的概念

运动学可能算出超过电机能力的轮速。

如果只把某一个轮子截断，四个轮子的比例会被破坏，底盘运动方向也会变。

更合理的做法是按比例缩放：

$$
s = \frac{v_{\text{max}}}{\max(|v_i|)}
$$

$$
v_i' = s v_i
$$

这样每个轮子的目标都变小，但整体运动方向尽量保持不变。

---

# 其他底盘

| 底盘类型 | 解算思路                       | 本节不展开的部分           |
| -------- | ------------------------------ | -------------------------- |
| 差速底盘 | 左右轮速度决定前进和转向       | 无法直接横移               |
| 全向轮   | 根据轮子安装角建立速度投影     | 安装角不同，矩阵不同       |
| 舵轮     | 每个轮子同时有转向角和驱动速度 | 需要处理舵角优化和奇异情况 |

所有底盘都在解决同一个问题：把底盘运动目标变成执行器目标。

---
layout: section
---

# <Counter :level="1" /> - Wheel Targets

从轮子线速度到电机可理解的目标

---

# <Counter :level="2" /> 单位转换

运动学矩阵通常先得到轮子外缘线速度 `v_wheel`。

电机控制常用的目标可能是电机轴 rpm 或编码器 rpm。

$$
\omega_{wheel} = \frac{v_{wheel}}{r}
$$

$$
rpm_{wheel} = \omega_{wheel} \times \frac{60}{2\pi}
$$

如果编码器测的是电机轴：

$$
rpm_{motor} = rpm_{wheel} \times gear\_ratio
$$

---

# 从底盘速度到电机目标

```mermaid
flowchart LR
  C[底盘速度目标<br/>vx, vy, wz] --> K[麦轮逆运动学矩阵]
  K --> W[轮子外缘线速度<br/>m/s]
  W --> R[轮子角速度<br/>rad/s]
  R --> M[电机轴 rpm]
  M --> P[速度 PID 目标]
```

关键不是背代码，而是知道每一层量纲是什么。

同一个数值如果单位错了，控制效果会完全不同。

---

# 单位和符号检查

| 量             | 常见单位   | 检查重点                  |
| -------------- | ---------- | ------------------------- |
| 底盘线速度     | `m/s`      | 不要和 `mm/s` 混用        |
| 底盘角速度     | `rad/s`    | 不要把 `deg/s` 当 `rad/s` |
| 轮子外缘线速度 | `m/s`      | 来自运动学矩阵            |
| 轮子角速度     | `rad/s`    | 除以轮半径                |
| 电机轴速度     | `rpm`      | 注意减速比                |
| 编码器反馈     | `rpm/tick` | 搞清楚是电机轴还是轮轴    |

运动学讲的是几何关系；单位和符号是工程落地时最容易出错的部分。

---
layout: section
---

# <Counter :level="1" /> - PID Control

用一个电机速度环例子理解 P / I / D

---

# <Counter :level="2" /> 例子：让电机稳定在 1000 rpm

```mermaid
flowchart LR
  R[目标速度<br/>1000 rpm] --> E[误差<br/>e = r - y]
  Y[编码器反馈<br/>实际 rpm] --> E
  E --> C[速度环控制器]
  C --> U[输出<br/>电流 / 电压指令]
  U --> M[电机 + 负载]
  M --> Y
```

先约定一个简化模型：

- 目标速度：$r = 1000\ \text{rpm}$
- 电机需要持续约 $5\ \text{V}$ 的等效输出，才能克服摩擦和负载
- 编码器反馈速度记为 $y$
- 控制器看到的误差是 $e = r - y$

---

# 误差：速度环真正看到的量

```mermaid
flowchart LR
  R[目标速度 r] --> E[误差 e = r - y]
  Y[反馈速度 y] --> E
  E --> U[控制输出 u]
```

PID 不直接知道“电机为什么慢了”。

它先只看一件事：目标值和反馈值差了多少。

$$
e(t) = r(t) - y(t)
$$

- $r(t)$：reference，目标值
- $y(t)$：measurement，反馈值
- $e(t)$：error，误差

---

# <Counter :level="2" /> Proportional：正比于误差的输出

P 项的思想很直接：

- 实际速度低于目标，输出变大
- 离目标越远，推得越用力
- 离目标越近，输出自然变小

例如：

$$
K_{\mathrm{p}} = 0.1\ \text{V}/\text{rpm}
$$

当实际速度只有 $950\ \text{rpm}$：

$$
e = 1000 - 950 = 50\ \text{rpm}
$$

$$
u_{\mathrm{P}} = 0.1 \times 50 = 5\ \text{V}
$$

---

# P 项公式

$$
u_{\mathrm{P}}(t) = K_{\mathrm{p}} e(t)
$$

其中：

- $u_{\mathrm{P}}(t)$：P 项输出
- $K_{\mathrm{p}}$：比例系数
- $e(t)$：当前误差

P 项的好处是响应快，坏处也很清楚：

$$
e(t) = 0 \quad \Rightarrow \quad u_{\mathrm{P}}(t) = 0
$$

但电机要维持速度，往往需要持续输出转矩。

所以纯 P 速度环如果没有前馈，常常必须“保留一点误差”，才能维持非零输出。

---
layout: two-cols-header
---

# 纯 P 速度环：静差

::left::

如果负载需要 $5\ \text{V}$ 才能维持速度，而 $K_{\mathrm{p}}=0.1\ \text{V}/\text{rpm}$：

$$
5 = 0.1 e
$$

$$
e = 50\ \text{rpm}
$$

最终就可能稳定在：

$$
y = 1000 - 50 = 950\ \text{rpm}
$$

这就是稳态误差，也常叫静差。

::right::

```mermaid
xychart-beta
  title "P only: oscillates, then keeps static error"
  x-axis "time" [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
  y-axis "speed / rpm" 0 --> 1200
  line "target" [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
  line "feedback" [0, 260, 520, 760, 960, 1100, 1160, 1140, 1060, 950, 850, 790, 780, 815, 880, 960, 1030, 1075, 1090, 1070, 1030, 1010, 990, 975, 965, 958, 954, 952, 951, 950, 950]
```

---
layout: two-cols
---

# <Counter :level="2" /> Integral：把过去没补上的误差记下来

```mermaid
flowchart LR
  E[长期存在的误差] --> B[积分累积<br/>误差面积]
  B --> U[保留下来的补偿输出]
```

- 只要 $50\ \text{rpm}$ 的误差还在，它就继续累加
- 积分输出从 $1\ \text{V}$、$2\ \text{V}$、$3\ \text{V}$ 逐渐长到约 $5\ \text{V}$
- 最后可以做到 $e \approx 0$，但仍然有非零输出维持电机转速

::right::

一个理想的稳定状态是：

| 量       | 结果                  |
| -------- | --------------------- |
| 目标速度 | $1000\ \text{rpm}$    |
| 实际速度 | $1000\ \text{rpm}$    |
| 当前误差 | $0\ \text{rpm}$       |
| P 项输出 | $0\ \text{V}$         |
| I 项输出 | $\approx 5\ \text{V}$ |
| 总输出   | $\approx 5\ \text{V}$ |

---

# I 项公式

$$
u_{\mathrm{I}}(t) =
K_{\mathrm{i}}
\int_{0}^{t} e(\tau)\,\mathrm{d}\tau
$$

其中：

- $u_{\mathrm{I}}(t)$：I 项输出
- $K_{\mathrm{i}}$：积分系数
- $\int_{0}^{t} e(\tau)\,\mathrm{d}\tau$：从过去到现在的误差面积

即使当前误差已经为零，历史积分也不一定为零：

$$
e(t) = 0
\quad \nRightarrow \quad
\int_{0}^{t} e(\tau)\,\mathrm{d}\tau = 0
$$

这就是积分项能消除静差的原因。

---
layout: two-cols-header
---

# 加上 I：静差被慢慢消除

::left::

积分项解决的是“长期差一点”的问题。

它会在误差持续存在时积累补偿，直到电机能在 $e \approx 0$ 时仍然保持必要输出。

但它也会带来新的风险：如果积分累得太多，系统可能冲过目标。

::right::

```mermaid
xychart-beta
  title "PI: oscillates, then reaches target"
  x-axis "time" [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
  y-axis "speed / rpm" 0 --> 1200
  line "target" [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
  line "feedback" [0, 280, 560, 800, 980, 1105, 1150, 1125, 1055, 970, 900, 865, 870, 905, 955, 1010, 1055, 1080, 1075, 1045, 1010, 995, 990, 992, 996, 999, 1001, 1001, 1000, 1000, 1000]
```

---
layout: two-cols-header
---

# 积分不是唯一办法：前馈也很常见

::left::

如果我们已经知道维持 $1000\ \text{rpm}$ 大约需要 $5\ \text{V}$，可以先直接给一个基础输出：

$$
u(t) = u_{\mathrm{ff}}(t) + K_{\mathrm{p}} e(t)
$$

其中：

- $u_{\mathrm{ff}}(t)$：feedforward，前馈输出
- $K_{\mathrm{p}} e(t)$：只负责修正误差

::right::

```mermaid
flowchart LR
  R[target rpm] --> FF[feedforward<br/>about 5 V]
  R --> E[error]
  Y[feedback rpm] --> E
  E --> P[P correction]
  FF --> S[sum]
  P --> S
  S --> M[motor]
  M --> Y
```

前馈依赖模型或标定；积分依赖反馈自动补偿。工程里两者经常一起用。

---
layout: two-cols
---

# 速度环里常见的是 PI

原因：

- P：决定速度环响应有多快
- I：消除摩擦、负载造成的稳态误差
- D：会放大编码器量化误差和速度估计噪声，速度环里通常不用或只给很小

很多电机控制系统会分成多层。

::right::

```mermaid
flowchart TB
  P0[位置环<br/>常见 P] --> V[速度环<br/>常见 PI]
  V --> I[电流环<br/>常见 PI]
  I --> PWM[PWM / CAN current command]
```

---
layout: two-cols-header
---

# <Counter :level="2" /> Derivative：看到变化趋势就提前刹车

::left::

PI 如果调得比较激进，可能会先冲过目标。

D 项看的不是“差多少”，而是“误差变化有多快”：

- 接近目标太快，就提前减小输出
- 冲过目标后误差反向变化，也会提供阻尼
- 它可以抑制超调，但对噪声敏感

::right::

```mermaid
xychart-beta
  title "Before D: large decaying oscillations"
  x-axis "time" [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
  y-axis "speed / rpm" 0 --> 1300
  line "target" [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
  line "feedback" [0, 360, 720, 1030, 1220, 1270, 1190, 1000, 780, 660, 700, 860, 1060, 1180, 1160, 1040, 900, 820, 850, 940, 1040, 1100, 1085, 1025, 965, 930, 945, 980, 1010, 1005, 1000]
```

---

# D 项公式

$$
u_{\mathrm{D}}(t) =
K_{\mathrm{d}}
\frac{\mathrm{d}e(t)}{\mathrm{d}t}
$$

其中：

- $u_{\mathrm{D}}(t)$：D 项输出
- $K_{\mathrm{d}}$：微分系数
- $\frac{\mathrm{d}e(t)}{\mathrm{d}t}$：误差随时间变化的速度

两个 $\mathrm{d}$ 都是微分算子，使用直体；$e$ 和 $t$ 是变量，使用斜体。

---
layout: two-cols-header
---

# 加上 D：用趋势抑制超调

::left::

但在真实速度环中，D 项不一定值得加：

- 编码器速度反馈可能有量化跳变
- 速度估计本身常带噪声
- 微分会放大高频噪声，让输出抖动

因此入门实现速度环时，常从 PI 开始。

::right::

```mermaid
xychart-beta
  title "With D: more damping, less overshoot"
  x-axis "time" [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
  y-axis "speed / rpm" 0 --> 1200
  line "target" [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
  line "with D" [0, 250, 500, 720, 880, 980, 1030, 1045, 1035, 1015, 995, 985, 985, 990, 996, 1001, 1004, 1004, 1002, 1001, 1000, 999, 999, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
```

---

# <Counter :level="2" /> 连续 PID

$$
u(t) =
K_{\mathrm{p}} e(t)
+
K_{\mathrm{i}} \int_{0}^{t} e(\tau)\,\mathrm{d}\tau
+
K_{\mathrm{d}} \frac{\mathrm{d}e(t)}{\mathrm{d}t}
$$

| 项  | 看什么       | 直觉               | 主要风险     |
| --- | ------------ | ------------------ | ------------ |
| P   | 当前误差     | 现在差多少就推多少 | 太大容易震荡 |
| I   | 历史误差面积 | 长期不到目标就补偿 | 容易积分饱和 |
| D   | 误差变化趋势 | 变化太快就阻尼     | 对噪声敏感   |

---

# <Counter :level="2" /> 从连续到离散

MCU 里没有真正连续运行的 PID。

控制任务通常每隔固定周期运行一次：

```text
1 ms / 2 ms / 5 ms / 10 ms
```

设采样周期为 $T_{\mathrm{s}}$，第 $k$ 次计算时：

$$
e[k] = r[k] - y[k]
$$

---

# 离散 P / I / D

$$
u_{\mathrm{P}}[k] =
K_{\mathrm{p}} e[k]
$$

$$
u_{\mathrm{I}}[k] =
u_{\mathrm{I}}[k-1] +
K_{\mathrm{i}} e[k] T_{\mathrm{s}}
$$

$$
u_{\mathrm{D}}[k] =
K_{\mathrm{d}}
\frac{e[k] - e[k-1]}{T_{\mathrm{s}}}
$$

积分从“面积”变成每次累加一小块。

微分从“瞬时斜率”变成相邻两次误差的差分。

---

# 位置式离散 PID 输出

$$
\begin{aligned}
u[k] &=
u_{\mathrm{P}}[k] +
u_{\mathrm{I}}[k] +
u_{\mathrm{D}}[k] \\
&= K_{\mathrm{p}} e[k]
+ \left(u_{\mathrm{I}}[k-1] + K_{\mathrm{i}} e[k] T_{\mathrm{s}}\right)
+ K_{\mathrm{d}} \frac{e[k] - e[k-1]}{T_{\mathrm{s}}}
\end{aligned}
$$

工程实现时还会额外处理：

- 输出限幅：不能超过电调或协议允许范围
- 积分限幅：避免积分一直累到不可恢复
- 死区：目标附近的小误差可以不处理
- 周期稳定：$T_{\mathrm{s}}$ 抖动会直接影响 I 和 D

---
layout: section
---

# <Counter :level="1" /> - PID Usage

以 Arm CMSIS-DSP `arm_pid_f32` 为例

---

# <Counter :level="2" /> CMSIS-DSP 提供了什么

Arm CMSIS-DSP 的 floating-point PID 主要用这几个对象和函数：

| 名称                   | 作用                          |
| ---------------------- | ----------------------------- |
| `arm_pid_instance_f32` | 保存 PID 参数、派生系数和状态 |
| `Kp`, `Ki`, `Kd`       | 用户设置的 PID 参数           |
| `arm_pid_init_f32()`   | 根据参数初始化实例            |
| `arm_pid_f32()`        | 每次处理一个输入样本          |
| `arm_pid_reset_f32()`  | 清空历史状态                  |

---
layout: two-cols-header
---

# 初始化 PID 实例

::left::

使用顺序：

- 先确定速度环周期 `SPEED_LOOP_TS_SEC`
- 连续参数先换算成 CMSIS-DSP 使用的离散参数
- 再调用 `arm_pid_init_f32`

`resetStateFlag = 1` 表示初始化时清空历史状态

`arm_pid_f32` 不接收 `dt`，所以周期影响必须在初始化参数里体现。

$$
\begin{aligned}
u[k] = u[k-1]
&+ K_{\mathrm{p}} (e[k] - e[k-1]) \\
&+ K_{\mathrm{i}} e[k] T_{\mathrm{s}} \\
&+ K_{\mathrm{d}} \frac{e[k] - e[k-1]}{T_{\mathrm{s}}}
\end{aligned}
$$

::right::

```c
#include "arm_math.h"

#define SPEED_LOOP_TS_SEC 0.001f  // 1 ms

static arm_pid_instance_f32 speed_pid;

void speed_pid_init(void) {
    const float32_t kp_cont = 8.0f;
    const float32_t ki_cont = 200.0f;
    const float32_t kd_cont = 0.0f;

    speed_pid.Kp = kp_cont;
    speed_pid.Ki = ki_cont * SPEED_LOOP_TS_SEC;
    speed_pid.Kd = kd_cont / SPEED_LOOP_TS_SEC;

    arm_pid_init_f32(&speed_pid, 1);  // 1: reset state
}
```

---

# 周期调用

CMSIS-DSP 的 `arm_pid_f32` 每次处理一个输入样本。

在速度环里，这个输入通常就是误差：

```c
void speed_loop_update(float32_t target_rpm, float32_t feedback_rpm) {
    float32_t error = target_rpm - feedback_rpm;
    float32_t current = arm_pid_f32(&speed_pid, error);

    current = clamp_current(current);
    motor_set_current(current);
}
```

调用方仍然只需要关心：目标值、反馈值、输出限幅和执行器。

---

# CMSIS-DSP 的离散形式

`arm_pid_f32` 内部使用的形式可以写成：

$$
y[n] =
y[n-1] +
A_0 x[n] +
A_1 x[n-1] +
A_2 x[n-2]
$$

其中：

$$
A_0 =
K_{\mathrm{p},\text{CMSIS}} +
K_{\mathrm{i},\text{CMSIS}} +
K_{\mathrm{d},\text{CMSIS}}
$$

$$
A_1 =
-K_{\mathrm{p},\text{CMSIS}} -
2K_{\mathrm{d},\text{CMSIS}},
\qquad
A_2 = K_{\mathrm{d},\text{CMSIS}}
$$

这里的 $K_{\mathrm{p},\text{CMSIS}}$、$K_{\mathrm{i},\text{CMSIS}}$、$K_{\mathrm{d},\text{CMSIS}}$ 已经吸收了控制周期。

---

# 一个电机一个实例

四个底盘电机通常各自有一个 `arm_pid_instance_f32`。

```mermaid
flowchart LR
  W[四个轮速目标] --> P1[FL speed PID]
  W --> P2[FR speed PID]
  W --> P3[BL speed PID]
  W --> P4[BR speed PID]
  P1 --> C[CAN current command]
  P2 --> C
  P3 --> C
  P4 --> C
```

---

# 使用时关注的状态

| 时机     | 应该做什么                               |
| -------- | ---------------------------------------- |
| 初始化   | 设置 `Kp/Ki/Kd`，调用 `arm_pid_init_f32` |
| 周期任务 | 固定周期调用一次 `arm_pid_f32`           |
| 模式切换 | 必要时调用 `arm_pid_reset_f32`           |
| 电机离线 | 停止输出，清空或冻结 PID 状态            |
| 参数调整 | 改参数后重新初始化派生系数               |

PID 的“状态”比函数名更重要。CMSIS-DSP 把历史状态放在实例结构体里。

---

# 控制周期 $T_{\mathrm{s}}$

PID 参数和控制周期绑定。

同一组参数在不同周期下，表现可能完全不同：

| 周期变化                  | 影响                         |
| ------------------------- | ---------------------------- |
| $T_{\mathrm{s}}$ 变大     | 积分每次增加更多，微分更粗糙 |
| $T_{\mathrm{s}}$ 抖动     | 输出不稳定，难以调参         |
| 忘记使用 $T_{\mathrm{s}}$ | 换周期后参数意义改变         |
| 任务偶发卡顿              | 电机输出可能出现尖峰         |

速度环任务应该使用稳定周期。

---
layout: section
---

# <Counter :level="1" /> - Tuning

调参流程与常见问题

---

# 推荐调参顺序：P -> I -> D

| 步骤 | 操作                                            | 观察重点                |
| ---- | ----------------------------------------------- | ----------------------- |
| 1    | 先令 $K_{\mathrm{i}} = 0$，$K_{\mathrm{d}} = 0$ | 只看 P 的响应和震荡边界 |
| 2    | 增大 $K_{\mathrm{p}}$                           | 响应够快但不过度震荡    |
| 3    | 加小 $K_{\mathrm{i}}$                           | 消除稳态误差            |
| 4    | 必要时加很小的 $K_{\mathrm{d}}$                 | 抑制超调或快速变化      |
| 5    | 做阶跃测试                                      | 观察目标切换时的响应    |

先让系统可控，再追求更快。

---
layout: two-cols-header
---

# 典型响应

::left::

调参时不要只看“最后有没有到目标”。

还要看上升速度、超调、震荡和恢复时间。

::right::

```mermaid
xychart-beta
  title "speed step response"
  x-axis "time" [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
  y-axis "rpm" 0 --> 1200
  line "target" [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
  line "good" [0, 180, 350, 500, 630, 740, 830, 900, 950, 980, 995, 1002, 1005, 1004, 1002, 1001, 1000, 999, 999, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
  line "overshoot" [0, 320, 650, 930, 1130, 1200, 1150, 1030, 910, 850, 875, 950, 1030, 1080, 1060, 1015, 970, 950, 965, 990, 1010, 1018, 1010, 1000, 995, 996, 999, 1001, 1000, 1000, 1000]
```

---

# 常见现象

| 现象             | 可能原因                                        | 优先检查                          |
| ---------------- | ----------------------------------------------- | --------------------------------- |
| 电机无力         | $K_{\mathrm{p}}$ 太小、输出限幅太低、反馈单位错 | 当前输出是否已经打满              |
| 稳态误差明显     | 没有 I 项、摩擦或负载偏大                       | 小幅增加 $K_{\mathrm{i}}$         |
| 来回震荡         | $K_{\mathrm{p}}$ 太大、周期抖动、反馈噪声大     | 降低 $K_{\mathrm{p}}$，确认周期   |
| 超调很大         | I 项过强、没有积分限幅                          | 降低 $K_{\mathrm{i}}$，加积分限幅 |
| 一启动就冲反方向 | 电机方向或反馈方向反了                          | 单电机正方向测试                  |
| 目标变化时很猛   | 目标阶跃太大、没有斜坡限制                      | 给目标值加变化率限制              |

---
layout: two-cols-header
---

# 目标斜坡

::left::

遥控器目标可能瞬间从 0 跳到最大速度。

对电机速度环来说，这就是一个很大的阶跃输入。

斜坡限制能降低启动冲击，也能让调参更可控。

::right::

```mermaid
xychart-beta
  title "target ramp vs step target feedback"
  x-axis "time" [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
  y-axis "rpm" 0 --> 1200
  line "step target" [0, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
  line "step feedback" [0, 260, 560, 835, 1040, 1160, 1185, 1115, 1005, 910, 875, 905, 970, 1035, 1065, 1045, 1005, 975, 970, 985, 1005, 1015, 1010, 1000, 995, 997, 1000, 1001, 1000, 1000, 1000]
  line "ramped target" [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
  line "ramped feedback" [0, 20, 55, 100, 145, 195, 250, 310, 370, 435, 505, 570, 630, 690, 750, 810, 870, 930, 985, 1020, 1028, 1015, 1003, 996, 995, 998, 1000, 1001, 1000, 1000, 1000]
```

---
layout: section
---

# <Counter :level="1" /> - System Boundaries

整车控制中的边界

---

# <Counter :level="2" /> 外环和内环

```mermaid
flowchart LR
  Pos[位置 / 角度外环] --> SpeedTarget[速度目标]
  SpeedTarget --> Kinematics[运动学解算]
  Kinematics --> WheelTarget[轮速目标]
  WheelTarget --> SpeedPid[电机速度内环]
  SpeedPid --> Current[电流输出]
  Current --> Robot[机器人]
  Robot --> Feedback[反馈]
  Feedback --> Pos
  Feedback --> SpeedPid
```

常见结构：外环生成速度目标，内环负责电机速度跟踪。

不要让一个 PID 同时承担所有事情。

---

# 运动学和 PID 的边界

| 模块       | 输入                       | 输出           | 不负责什么       |
| ---------- | -------------------------- | -------------- | ---------------- |
| 运动学解算 | `vx`, `vy`, `wz`           | 四轮目标速度   | 电机是否真的跟上 |
| PID        | 单电机目标速度和反馈速度   | 单电机控制输出 | 底盘几何关系     |
| 模式管理   | 遥控器、裁判系统、保护状态 | 当前可执行目标 | 具体电机误差计算 |

边界清楚，问题定位会快很多。

---

# Debug 顺序

推荐从低层往高层查：

1. 单电机给电流，方向是否正确
2. 单电机读编码器，方向和单位是否正确
3. 单电机速度 PID，能否跟踪目标 rpm
4. 四个电机分别给相同目标，是否一致
5. 运动学分别测试前进、横移、旋转
6. 再测试复合运动和上层控制

不要一开始就直接开整车复杂模式。

---

# 本节主线回顾

```mermaid
flowchart LR
  A[期望底盘运动<br/>vx, vy, wz] --> B[运动学解算]
  B --> C[四个轮速目标]
  C --> D[单位转换与限幅]
  D --> E[单电机速度 PID]
  E --> F[电流 / CAN 输出]
  F --> G[编码器反馈]
  G --> E
```

运动学让目标合理分配，PID 让执行器闭环跟踪。

---

## 检查清单

| 类别   | 检查项                         |
| ------ | ------------------------------ |
| 坐标系 | `vx/vy/wz` 正方向是否固定      |
| 轮序   | `FL/FR/BL/BR` 是否和实车一致   |
| 单位   | `m/s`、`rad/s`、`rpm` 是否统一 |
| 限幅   | 轮速目标和电流输出是否限幅     |
| 反馈   | 编码器方向是否和目标方向一致   |
| 周期   | PID 任务周期是否稳定           |
| 积分   | 是否有积分限幅或抗饱和策略     |
| 安全   | 离线、急停、异常输出是否处理   |

---
layout: end
---

# Q&A
