# Lec 1 Foundation 内容设计

## 课程定位

本节课时长 2.5h，面向有一点 C 语言基础、但对 C/C++ 工程、工具链、嵌入式开发流程还不熟悉的学生。

这节课不以语法复习为主，而是帮助学生建立一张嵌入式 C 开发地图：

> 一份 C 代码如何从源码，经过编辑器、语言服务器、编译器、构建配置、链接、烧录，最终变成 MCU 上运行的固件。

课程中的 example 以一个简单的 LED 模块为主线，但不在开头先完整展示 mini project。每讲到一个工具链或工程概念，就引入一小段代码或一次 Git 操作，让学生在真实开发节奏里理解这些概念。

## 学完后学生应该能做到

- 说清楚编辑器、语言服务器、编译器、构建系统、调试器分别负责什么。
- 理解桌面端 C/C++ 程序从 `.c` 到可执行文件的大致流程。
- 理解嵌入式固件和桌面程序在启动方式、目标平台、链接配置、烧录方式上的区别。
- 看懂一个基础 C 工程里的 `src/`、`include/`、`.h`、`.c`、`.o`、`.a`、`.elf`、`.bin` 的含义。
- 能判断常见构建错误大概属于头文件搜索问题、编译问题还是链接问题。
- 分清 Cortex-M、STM32、MCU、开发板、CMSIS、LL、HAL、CubeMX、EIDE、Arm GCC 的层级关系。
- 能使用 Git 完成基本版本管理，并把工程推送到 GitHub。
- 理解嵌入式 C 中常见的 OOP 风格：`struct` 保存状态，函数操作对象，`.h` 暴露接口，`.c` 隐藏实现。

## 整体流程

建议采用“普通 C 工程 -> 工具链机制 -> Git 管理 -> 嵌入式迁移”的顺序。

1. 先从学生熟悉的 C 程序开始，讲清楚桌面端 C 程序如何被编译、链接和运行。
2. 再解释编辑器、clangd、编译器、构建系统之间的关系，解决学生常见的“VS Code 报错”和“编译器报错”混淆。
3. 然后进入 C 工程构建配置：头文件搜索、宏定义、多个 `.c` 文件、对象文件、静态库、链接错误。
4. 在工程逐渐变复杂的过程中穿插 Git 操作，让 Git 变成开发流程的一部分，而不是最后单独背命令。
5. 接着说明嵌入式程序和桌面程序的差异：目标平台不同、没有普通 OS loader、需要 startup code、linker script、烧录器。
6. 用 5-10 分钟快速梳理芯片和软件栈分层。
7. 最后把前面的 LED example 迁移到嵌入式语境，讲 CubeMX、EIDE、Arm GCC 的职责，以及 C OOP 风格如何用于驱动封装。

## 时间安排

|        时间 | 小节                     | 目标                                          |
| ----------: | ------------------------ | --------------------------------------------- |
|    0-10 min | 开场：这节课解决什么问题 | 建立“源码到固件”的主线                        |
|   10-30 min | Git 基础模型             | 建立版本管理习惯                              |
|   30-50 min | 桌面端 C/C++ 工具链      | 理解编译、链接、运行                          |
|   50-70 min | 编译器、语言服务器、IDE  | 分清 gcc/clangd/VS Code/EIDE 的职责           |
|   70-90 min | C 构建配置机制           | 头文件搜索、宏定义、对象文件、静态库、链接    |
|  90-100 min | 休息 / buffer            | 处理环境问题                                  |
| 100-115 min | GitHub 工作流            | remote、push、pull、`.gitignore`、作业提交    |
| 115-130 min | 嵌入式基本原理           | MCU、Flash/RAM、外设、寄存器、时钟树          |
| 130-138 min | 芯片架构分层             | Cortex-M、STM32、开发板、CMSIS、LL、HAL       |
| 138-148 min | 嵌入式工具链与工程流     | arm-none-eabi-gcc、Arm Compiler、CubeMX、EIDE |
| 148-150 min | 总结和课后任务           | 明确后续要会用的最小闭环                      |

## 1. 开场：这节课解决什么问题

### 讲解目标

让学生知道这节课不是普通 C 语法课，而是嵌入式 C 开发的 foundation。

### 具体内容

- C 语言基础和 C 工程开发不是一回事。
- 写出正确语法只是第一步，真正工程里还要处理：
  - 多文件组织
  - 头文件搜索
  - 宏定义
  - 编译和链接
  - 静态库
  - 目标平台
  - 烧录和调试
  - 版本管理
- 本节课主线：
  - 桌面端 C 程序如何构建
  - 嵌入式固件和桌面程序有什么不同
  - Git 如何贯穿整个开发过程

### 可用 example

先只展示一个极小的 C 程序，不展示完整 mini project：

```c
#include <stdio.h>

int main(void) {
  printf("Hello, embedded C foundation!\n");
  return 0;
}
```

用它引出问题：

- 谁把这段代码变成可执行程序？
- VS Code 的绿色波浪线和编译器错误是一回事吗？
- 如果目标不是电脑，而是 STM32，流程哪里会变？

## 2. Git 基础模型

### 讲解目标

让学生先建立基本版本管理习惯。后面每增加一个 example，都用 Git 保存一次有意义的状态。

### 具体内容

- Git 是本地版本管理工具，GitHub 是远程代码托管平台。
- working tree、staging area、commit、repository 的关系。
- commit 是一个可解释的工程快照，不是随手保存。
- 一个好的 commit 应该围绕一个明确意图。
- `git status` 是最常用、最应该先看的命令。

### 命令 example

```bash
git init
git status
git add README.md .gitignore
git commit -m "Initialize foundation project"
git log --oneline
```

### 讲解重点

- `git add` 不是上传，是把变更加入暂存区。
- `git commit` 是保存到本地仓库。
- `git log --oneline` 可以查看历史。
- 不要用 `update`、`fix` 这种没有信息量的 commit message。

### 可穿插的问题

- 为什么先提交 README 和 `.gitignore`？
- 哪些文件应该进 Git，哪些不应该？
- 如果编译生成了 `build/app`，要不要提交？

## 3. 桌面端 C/C++ 工具链

### 讲解目标

让学生理解 C/C++ 不是“解释执行”的语言，源码需要经过工具链变成机器码。

### 具体内容

- 桌面端 C 程序的基本流程：
  - source code
  - preprocess
  - compile
  - assemble
  - link
  - executable
  - OS loader
- 常见桌面端工具链：
  - Linux: GCC, Clang, Make, CMake, GDB
  - Windows: MSVC, MinGW-w64, LLVM/Clang
  - macOS: Apple Clang, Xcode Command Line Tools
- 和其他语言对比：
  - Python 依赖解释器运行 `.py`
  - Java 编译成 bytecode，由 JVM 运行
  - JavaScript 通常由浏览器或 Node.js 运行
  - C/C++ 通常提前编译成本机机器码

### 代码 example

```c
#include <stdio.h>

int main(void) {
  printf("LED ON\n");
  printf("LED OFF\n");
  return 0;
}
```

### 命令 example

```bash
mkdir -p src build
gcc src/main.c -o build/app
./build/app
```

### Git 操作

```bash
git status
git add src/main.c
git commit -m "Add first desktop C program"
```

### 讲解重点

- 编译器实际生成的是目标平台可以运行的机器码。
- `build/app` 是构建产物，不应该提交。
- 源码和构建产物要区分。

## 4. 编译器、语言服务器、IDE

### 讲解目标

解决学生常见混淆：VS Code、clangd、gcc、EIDE、CubeMX、调试器不是同一个东西。

### 具体内容

- Editor / IDE:
  - 显示和编辑代码
  - 提供 UI
  - 调用外部工具
- Language Server:
  - 典型例子：clangd
  - 负责补全、跳转、诊断、语义索引
  - 不负责生成最终程序
- Compiler:
  - 典型例子：gcc、clang、arm-none-eabi-gcc、armclang
  - 负责把源码编译成目标文件
- Build System:
  - Make、CMake、EIDE project
  - 负责组织编译参数、文件列表、链接参数
- Debugger:
  - gdb、cortex-debug、ST-Link、J-Link
  - 负责断点、单步、变量查看

### 推荐图示

```text
VS Code / EIDE
  ├── clangd: completion / diagnostics / jump to definition
  ├── build system: source files / include paths / defines / linker flags
  ├── compiler: gcc / clang / arm-none-eabi-gcc
  └── debugger: gdb / ST-Link / J-Link
```

### 讲解重点

- 语言服务器不等于编译器。
- clangd 报错但项目能编译，通常是 clangd 不知道正确构建参数。
- 项目能编译但 clangd 找不到头文件，常见原因是缺少 `compile_commands.json` 或 include path 配置不一致。
- IDE 本身通常不是工具链，只是组织和调用工具链。

### 可用 example

故意让 `main.c` include 一个头文件：

```c
#include "led.h"
```

然后不配置 include path，让学生看到编辑器和编译器可能分别报错。

## 5. C 构建配置机制

### 讲解目标

这是本节课最核心的工程基础。让学生知道 C 工程为什么需要构建配置，而不是把所有 `.c` 文件放一起就结束。

### 具体内容

- translation unit:
  - 每个 `.c` 文件通常单独编译。
- header file:
  - 头文件主要放声明、类型定义、宏、接口。
  - 头文件不会自动把 `.c` 实现链接进来。
- include search path:
  - `-Iinclude`
  - 解决 `#include "led.h"` 去哪里找的问题。
- macro define:
  - `-DDEBUG`
  - 常用于条件编译、芯片型号、功能开关。
- object file:
  - `.o`
  - 每个 `.c` 编译后的中间产物。
- static library:
  - `.a` / `.lib`
  - 多个 `.o` 打包后的库。
- linker:
  - 把多个 `.o` 和 library 组合成最终程序。
- linker search path:
  - `-Lbuild`
- link library:
  - `-ldriver`

### 代码 example：拆分 LED 模块

```c
// include/led.h
#pragma once

void led_on(void);
void led_off(void);
```

```c
// src/led.c
#include <stdio.h>
#include "led.h"

void led_on(void) {
  printf("LED ON\n");
}

void led_off(void) {
  printf("LED OFF\n");
}
```

```c
// src/main.c
#include "led.h"

int main(void) {
  led_on();
  led_off();
  return 0;
}
```

### 命令 example

```bash
gcc -Iinclude src/main.c src/led.c -o build/app
./build/app
```

### 故意制造错误

不加 include path：

```bash
gcc src/main.c src/led.c -o build/app
```

可能出现：

```text
fatal error: led.h: No such file or directory
```

只编译 `main.c`：

```bash
gcc -Iinclude src/main.c -o build/app
```

可能出现：

```text
undefined reference to `led_on`
```

### 静态库 example

```bash
gcc -Iinclude -c src/led.c -o build/led.o
ar rcs build/libdriver.a build/led.o
gcc -Iinclude src/main.c -Lbuild -ldriver -o build/app
```

### Git 操作

```bash
git diff
git add include/led.h src/led.c src/main.c
git commit -m "Extract LED module"
```

如果加入简单 Makefile：

```bash
git add Makefile
git commit -m "Add build rules for LED module"
```

### 讲解重点

- `#include` 解决“编译器看不看得到声明”。
- 链接解决“函数实现在哪里”。
- `No such file or directory` 常常是 include path 问题。
- `undefined reference` 常常是链接阶段缺少实现。
- `multiple definition` 常常是把变量或函数定义放进头文件。
- 构建配置本身也是工程的一部分，应该提交。

## 6. GitHub 工作流

### 讲解目标

让学生知道如何把本地 Git 仓库同步到 GitHub，并建立后续作业提交方式。

### 具体内容

- GitHub 是远程仓库托管平台，不等于 Git。
- remote 是本地仓库记录的远程地址。
- `origin` 只是默认远程名。
- branch 是一条开发线。
- `push` 是把本地 commit 推到远程。
- `pull` 是从远程拉取并合并更新。

### 命令 example

```bash
git remote add origin <repo-url>
git branch -M main
git push -u origin main
git pull
```

### `.gitignore` example

```gitignore
build/
*.o
*.elf
*.bin
*.hex
*.exe
.DS_Store
```

### 讲解重点

- GitHub 上没有出现代码，通常是还没有 `push`。
- 本地有修改但没有 commit，push 不会上去。
- `.gitignore` 只影响未被 Git 跟踪的新文件。
- 不要提交构建产物和本地临时文件。
- 某些 `.vscode` 配置可以提交，但要看团队约定。

### 作业流建议

```text
clone starter repo
  -> edit code
  -> git status
  -> git add
  -> git commit
  -> git push
  -> submit GitHub link
```

如果后续需要协作，可以再引入 branch 和 pull request；本节课不展开 rebase、submodule、CI。

## 7. 嵌入式基本原理

### 讲解目标

让学生理解嵌入式程序和桌面程序的根本差异，为后面的 STM32 工程做准备。

### 具体内容

- 桌面程序通常由操作系统加载和运行。
- MCU 上通常没有完整操作系统帮你加载程序。
- 固件被烧录到 Flash。
- 上电或复位后，从 reset handler 开始执行。
- startup code 会初始化 `.data`、`.bss`，然后进入 `main`。
- SRAM 用于运行时数据。
- 外设通过寄存器配置和控制。
- 时钟树决定 CPU、总线和外设的运行频率。

### 推荐图示

```text
Power on / Reset
  -> Reset_Handler
  -> initialize data / bss
  -> SystemInit
  -> main
  -> while (1)
```

### 讲解重点

- 嵌入式程序通常不会自然退出。
- `main` 不是芯片真正执行的第一行代码。
- 外设不是普通函数，而是 MCU 内部硬件模块。
- HAL 函数背后最终是在配置寄存器。
- 外设常见初始化顺序：
  - 开时钟
  - 配引脚
  - 配模式和参数
  - 启动外设
  - 读写数据或处理中断

## 8. 芯片架构分层

### 讲解目标

本节只讲 5-10 分钟，帮助学生分清常见名词，不深入硬件架构细节。

### 具体内容

硬件层：

```text
开发板
  └── MCU: STM32F4 / STM32G4 / STM32H7
        ├── CPU Core: Arm Cortex-M3/M4/M7/M33
        ├── Peripherals: GPIO / UART / SPI / I2C / TIM / ADC / CAN
        └── Memory: Flash / SRAM
```

软件层：

```text
User Code
  -> HAL / LL
  -> CMSIS
  -> Startup code
  -> Linker script
  -> Toolchain
```

### 讲解重点

- Arm Cortex-M 是 CPU core，不是完整芯片。
- STM32 是 ST 的 MCU 产品线。
- MCU 包含 CPU core、Flash、SRAM、外设等。
- 开发板不是芯片，是把 MCU、电源、调试、接口等做在一起的板子。
- CMSIS 是 Arm 定义的通用底层接口规范。
- HAL 和 LL 是 ST 提供的软件库：
  - HAL 抽象层更高，使用更方便。
  - LL 更接近寄存器，控制更细。
- CubeMX 是配置和代码生成工具。
- EIDE 是 VS Code 中的嵌入式工程管理插件。
- Arm GCC / Arm Compiler 才是实际编译工具链。

## 9. 嵌入式工具链与工程流

### 讲解目标

把前面桌面端 C 工具链迁移到嵌入式语境，让学生知道为什么需要交叉编译器、linker script 和烧录工具。

### 具体内容

桌面端：

```text
gcc main.c -o app
./app
```

嵌入式：

```text
arm-none-eabi-gcc
  -> .o files
  -> .elf
  -> .bin / .hex
  -> flash to MCU
  -> reset and run
```

常见嵌入式工具链：

| 工具链                | 说明                                                |
| --------------------- | --------------------------------------------------- |
| `arm-none-eabi-gcc`   | 开源、跨平台，EIDE/CMake/Make 常用                  |
| Arm Compiler 5        | 老 Keil MDK 项目常见，命令通常是 `armcc`            |
| Arm Compiler 6        | 新 Keil MDK，基于 LLVM/Clang，命令通常是 `armclang` |
| IAR EWARM             | 商业工具链，工业项目常见                            |
| LLVM/Clang bare-metal | 可用但配置更复杂                                    |

### 讲解重点

- `arm-none-eabi-gcc` 是交叉编译器，运行在电脑上，生成 ARM Cortex-M 目标代码。
- `none` 表示不面向 Linux/Windows 这类完整操作系统 ABI。
- `eabi` 是嵌入式 ABI。
- `.elf` 包含调试信息和段信息，适合调试。
- `.bin` / `.hex` 常用于烧录。
- 嵌入式链接需要 linker script 决定代码和数据放到 Flash/RAM 的位置。
- 烧录和调试需要 ST-Link、J-Link、DAPLink 等工具。

### CubeMX + EIDE + Arm GCC 职责分工

```text
CubeMX:
  - 选芯片/开发板
  - 配时钟
  - 配外设
  - 生成初始化代码

EIDE:
  - 管理 VS Code 工程
  - 管理源码、include path、宏定义、链接参数
  - 调用编译、烧录、调试工具

Arm GCC:
  - 编译和链接固件

ST-Link / J-Link:
  - 烧录和调试
```

### 可用 example

把桌面端 LED 函数映射到嵌入式语境：

```c
void led_on(void) {
  HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);
}

void led_off(void) {
  HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);
}
```

讲清楚这里不需要学生现在掌握 HAL 细节，只需要知道同一个 `led_on()` 接口，底层实现可以从 `printf` 换成 GPIO 操作。

## 10. C 语言 OOP 范式

### 讲解目标

让学生理解嵌入式 C 项目为什么常用 `struct + functions` 的模块化写法，为后续驱动、控制器、通信协议代码做准备。

### 具体内容

- C 没有 C++/Java 那种 class，但可以写出面向对象风格。
- `struct` 保存对象状态。
- 函数第一个参数传对象指针，模拟 `this` / `self`。
- `.h` 暴露接口。
- `.c` 隐藏实现。
- 这种风格适合 LED、motor、IMU、PID、protocol parser 等模块。

### 代码 example

```c
typedef struct {
  const char *name;
  int state;
} Led;

void Led_Init(Led *self, const char *name);
void Led_On(Led *self);
void Led_Off(Led *self);
void Led_Toggle(Led *self);
```

使用：

```c
Led status_led;

int main(void) {
  Led_Init(&status_led, "status");
  Led_On(&status_led);

  while (1) {
    Led_Toggle(&status_led);
  }
}
```

### 讲解重点

- `Led *self` 表示函数操作的是哪一个 LED 对象。
- 多个 LED 可以共享同一组函数，但拥有不同状态。
- 后续可以把 `int state` 换成 `GPIO_TypeDef *port` 和 `uint16_t pin`。
- 这不是为了炫技，而是为了让驱动代码更容易复用和测试。

### Git 操作

```bash
git add include/led.h src/led.c src/main.c
git commit -m "Refactor LED module with object-style API"
```

## 11. 总结和课后任务

### 课堂总结

本节课学生应记住一条主线：

```text
C source
  -> compiler and build config
  -> object files and libraries
  -> linker
  -> desktop executable or embedded firmware
  -> Git tracks the project evolution
```

嵌入式版本多出来的关键内容：

```text
target MCU
  -> startup code
  -> linker script
  -> Flash / RAM layout
  -> peripheral registers
  -> flashing and debugging tools
```

### 课后任务建议

完成一个基础 C 工程并提交到 GitHub：

1. 创建 `src/main.c`、`src/led.c`、`include/led.h`。
2. `main.c` 调用 `led_on()`、`led_off()` 或 `Led_On()`、`Led_Off()`。
3. 使用命令行或 Makefile 成功编译运行。
4. 添加 `.gitignore`，忽略构建产物。
5. 至少提交 3 次 commit：
   - 初始化工程
   - 添加第一个可运行程序
   - 拆分 LED 模块或改成 object-style API
6. push 到 GitHub 并提交仓库链接。

### 评价重点

- 工程结构是否清楚。
- 头文件和源文件职责是否合理。
- 构建命令或 Makefile 是否能复现。
- `.gitignore` 是否正确忽略构建产物。
- commit history 是否有清晰意图。
