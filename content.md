# Lec 1 Foundation 内容设计

## 课程定位

本节课面向有一点 C 语言基础、但还不熟悉 C/C++ 工程、工具链、Git、嵌入式开发流程的学生。

这节课不以 C 语法复习为主，而是建立一张工程地图：

> 一份 C 代码如何从源码，经过编辑器、语言服务器、编译器、构建配置、链接、烧录，最终变成 MCU 上运行的固件。

课程用三个 example project 递进展开。每个 project 都只承担一类核心目标，避免把所有概念塞进同一个例子里。

```text
Project 1: desktop-c-build
  用桌面端 C 程序讲清 C 构建规则。
  正常构建一条 gcc 命令完成，另提供可选命令观察中间产物。

Project 2: baremetal-arm-build
  把类似代码迁移到 arm-none-eabi-gcc，讲交叉编译、startup、linker script。
  当前 demo 只做到 EIDE 迁移前：一条 arm-none-eabi-gcc 命令生成 ELF，再用 objcopy 生成 bin/hex。

Project 3: stm32-cubemx-eide
  使用 STM32CubeMX 生成较完整 STM32 工程，再改为 EIDE 项目。
  观察真实嵌入式工程中的 CMSIS、HAL、startup、linker script、用户代码区域。
```

Git 不单独放在最后讲，而是穿插在三个项目的关键节点里：初始化、完成一个可运行版本、拆分模块、迁移工具链、生成 CubeMX 工程、修复构建配置、推送到 GitHub。

## 学完后学生应该能做到

- 分清编辑器、语言服务器、编译器、构建系统、调试器分别负责什么。
- 理解桌面端 C/C++ 程序从 `.c` 到可执行文件的大致流程。
- 理解嵌入式固件和桌面程序在目标平台、启动方式、链接配置、烧录方式上的区别。
- 看懂基础 C 工程里的 `src/`、`include/`、`.h`、`.c`、`.o`、`.a`、`.elf`、`.bin`、`.hex`。
- 能判断常见构建错误大概属于头文件搜索问题、编译问题还是链接问题。
- 理解 clangd 这类语言服务器为什么需要 include path、宏定义、compile commands。
- 分清 Cortex-M、STM32、MCU、开发板、CMSIS、LL、HAL、CubeMX、EIDE、Arm GCC 的层级关系。
- 知道 `gcc`、`clang`、`arm-none-eabi-gcc`、Arm Compiler 5/6、IAR EWARM 的定位差异。
- 能用 Git 完成基本版本管理，并把工程推送到 GitHub。
- 理解嵌入式 C 中常见的 OOP 风格：`struct` 保存状态，函数操作对象，`.h` 暴露接口，`.c` 隐藏实现。

## 整体流程

课程整体按“从电脑上的 C 程序，到交叉编译固件，再到真实 STM32 工程”的顺序展开。

1. 先用 Project 1 在桌面端构建一个简单 C 工程。学生能直接运行程序，反馈快，适合讲一条 `gcc` 命令背后的预处理、编译、汇编、链接、头文件搜索和链接错误。
2. 在 Project 1 中间穿插 Git、GitHub、clangd、IDE 和构建系统的概念。此时学生已经有一个不断变化的工程，版本管理和语言服务器配置有真实上下文。
3. 用 Project 2 把同类代码迁移到 `arm-none-eabi-gcc`。重点讲目标平台变化后为什么不能直接运行、为什么需要 startup code、linker script、`.elf`、`.bin`。
4. Project 2 先停在 EIDE 迁移前的手动命令阶段。后续迁移到 EIDE 时，再通过“手动命令 -> EIDE 配置”的对应关系理解自动构建系统。
5. 用 Project 3 引入 CubeMX。先生成一个真实 STM32 GPIO 工程，再观察 CMSIS、HAL、startup、linker script 和 `USER CODE` 区域，最后改成 EIDE 项目。
6. 课程末尾回到工程习惯：Git commit 规范、`.gitignore`、GitHub 提交方式，以及后续嵌入式驱动代码为什么常写成 C OOP 风格。

## 建议时间安排

不强行压到 2.5h。建议按 3.5h 左右设计，实际讲课时可以根据现场环境问题伸缩。

| 时间 | 小节 | 项目 | 目标 |
| ---: | --- | --- | --- |
| 0-10 min | 开场：源码到固件的地图 | - | 建立课程主线 |
| 10-25 min | Git 基础模型 | Project 1 | 先建立保存工程状态的习惯 |
| 25-65 min | 桌面端 C 构建 | Project 1 | 一步构建、预处理、编译、汇编、链接 |
| 65-90 min | 多文件 C 工程和构建配置 | Project 1 | include path、多模块、link errors |
| 90-110 min | 编译器、语言服务器、IDE、构建系统 | Project 1 | 分清 gcc/clangd/VS Code/Make/EIDE |
| 110-125 min | GitHub 工作流 | Project 1 | remote、push、pull、`.gitignore` |
| 125-135 min | 休息 / buffer | - | 处理环境问题 |
| 135-170 min | 迁移到 `arm-none-eabi-gcc` | Project 2 | 交叉编译、target flags、`.elf`、`.bin`、`.hex` |
| 170-195 min | startup、linker script、嵌入式启动流程 | Project 2 | Flash/RAM、Reset_Handler、vector table |
| 195-215 min | 从 Project 2 引出 EIDE | Project 2 | 说明后续 EIDE 配置对应手动命令 |
| 215-245 min | CubeMX 生成 STM32 工程 | Project 3 | 时钟树、GPIO、HAL、CMSIS、代码生成 |
| 245-270 min | CubeMX 工程改成 EIDE 项目 | Project 3 | 真实工程结构、编译、烧录、调试入口 |
| 270-285 min | C OOP 范式和后续代码组织 | All | 驱动封装思路 |
| 285-300 min | 总结和课后任务 | All | GitHub 提交要求和复盘 |

如果必须压缩到 2.5h，可以把 Project 2 和 Project 3 改成教师演示为主；如果时间充裕，则三个项目都可以让学生跟做。

## Project 1: desktop-c-build

### 项目目标

用桌面端 C 程序讲清楚基本 C 构建流程和规则。这个项目不使用 Makefile、CMake 或 EIDE，只手动执行 `gcc` 命令。

课堂主流程使用“一步构建”：

```bash
gcc -Iinclude src/main.c src/led.c src/counter.c -o build/desktop-demo
```

这条命令内部会完成预处理、编译、汇编和链接。课堂上先建立“能跑起来”的最小闭环，再把内部阶段拆开解释。

### 推荐项目结构

```text
desktop-c-build/
  README.md
  .gitignore
  include/
    counter.h
    led.h
  src/
    counter.c
    main.c
    led.c
  build/
```

`build/` 是构建产物目录，只在本地生成，不提交 Git。实际项目位于 `../demo-projects/desktop-c-build`。

### 1.1 初始化项目并引入 Git

先不写复杂代码，只建立最小工程目录和 Git 仓库。

```bash
mkdir desktop-c-build
cd desktop-c-build
mkdir src include build
git init
git status
```

创建 `README.md` 和 `.gitignore`。

```gitignore
build/
*.o
*.a
*.elf
*.bin
*.hex
*.map
*.exe
*.out
.DS_Store
```

第一次 commit：

```bash
git add README.md .gitignore
git commit -m "Initialize desktop C build example"
git log --oneline
```

讲解点：

- Git 是本地版本管理工具，GitHub 是远程托管平台。
- `working tree -> staging area -> commit -> repository`。
- `git add` 不是上传，`git commit` 也不是上传。
- commit 是一个有意义的工程快照。
- `.gitignore` 应该尽早写，因为构建产物很快就会出现。
- 这个 demo 会生成 `build/desktop-demo`，可选生成 `build/main.i`、`build/main.s`、`build/main.o` 等中间文件，它们都不应该提交。

### 1.2 两个业务模块：led 和 counter

实际 demo 包含两个模块。`led` 负责模拟 LED 状态，`counter` 负责维护计数值。

```c
// include/led.h
#ifndef LED_H
#define LED_H

void led_on(void);
void led_off(void);
void led_toggle(void);
int led_get_state(void);

#endif
```

```c
// include/counter.h
#ifndef COUNTER_H
#define COUNTER_H

void counter_init(int value);
int counter_increment(void);
int counter_get(void);

#endif
```

讲解点：

- 每个模块有自己的 `.h` 和 `.c`。
- `.h` 暴露接口，`.c` 放实现。
- 多模块能更自然地制造和解释链接错误：忘记某个 `.c` 文件，链接器就找不到对应函数实现。

### 1.3 一步构建和运行

创建构建目录：

```bash
mkdir -p build
```

编译并链接整个程序：

```bash
gcc -Iinclude src/main.c src/led.c src/counter.c -o build/desktop-demo
```

运行程序：

```bash
./build/desktop-demo
```

预期输出类似：

```text
LED ON
counter = 1
LED OFF
counter = 2
LED OFF
final led state = 0
final counter = 2
```

讲解点：

- `gcc` 在这里生成的是当前电脑可运行的程序。
- `-Iinclude` 告诉编译器去哪里找项目头文件。
- `src/main.c`、`src/led.c`、`src/counter.c` 都要参与构建。
- `build/desktop-demo` 是构建产物，不提交 Git。
- C/C++ 通常提前编译成本机机器码，这和 Python、Java、JavaScript 的运行模型不同。

语言对比：

| 语言 | 常见运行方式 |
| --- | --- |
| Python | 解释器运行 `.py` |
| Java | `javac` 编译到 bytecode，由 JVM 运行 |
| JavaScript | 浏览器或 Node.js 执行，常带 JIT |
| C/C++ | 编译、链接成本机可执行文件 |

Git 操作：

```bash
git status
git add include/led.h include/counter.h src/main.c src/led.c src/counter.c
git commit -m "Add LED and counter desktop demo"
```

### 1.4 可选：观察预处理、编译、汇编、链接

正常构建只需要前面的一步命令。下面这些命令用于课堂展示中间阶段，不是日常构建必须步骤。

预处理：

```bash
gcc -Iinclude -E src/main.c -o build/main.i
```

生成汇编：

```bash
gcc -Iinclude -S src/main.c -o build/main.s
```

只编译不链接：

```bash
gcc -Iinclude -c src/main.c -o build/main.o
```

讲解点：

- 预处理处理 `#include`、`#define`、条件编译。
- 编译把 C 代码变成汇编或中间表示再生成汇编。
- 汇编阶段生成 `.o`。
- `.o` 不是可执行程序。
- 一步构建命令内部也会经历这些阶段，只是没有把中间文件保留下来。

推荐图示：

```text
main.c / led.c / counter.c
  -> preprocess
  -> compile
  -> assemble
  -> link
  -> desktop-demo
```

### 1.5 多文件工程、头文件搜索和链接

用实际构建命令解释多文件工程：

```bash
gcc -Iinclude src/main.c src/led.c src/counter.c -o build/desktop-demo
```

讲解点：

- 每个 `.c` 文件通常是一个 translation unit。
- `.h` 主要放声明、类型定义、宏和接口。
- `.c` 放实现。
- `#include "led.h"` 只让编译器看见声明，不会自动把 `src/led.c` 加入构建。
- `-Iinclude` 是头文件搜索路径。
- `src/led.c` 和 `src/counter.c` 必须出现在构建命令中，否则链接阶段找不到实现。

Git 操作：

```bash
git diff
git add include/led.h include/counter.h src/led.c src/counter.c src/main.c
git commit -m "Split LED and counter into modules"
```

### 1.6 故意制造常见构建错误

不加 `-Iinclude`：

```bash
gcc src/main.c src/led.c src/counter.c -o build/desktop-demo
```

预期问题：

```text
fatal error: led.h: No such file or directory
```

忘记加入 `src/counter.c`：

```bash
gcc -Iinclude src/main.c src/led.c -o build/desktop-demo
```

预期问题：

```text
undefined reference to `counter_init`
```

错误地在头文件里定义全局变量：

```c
// bad example in led.h
int led_state = 0;
```

可能导致：

```text
multiple definition of `led_state`
```

讲解点：

- `No such file or directory` 常常是 include path 问题。
- `undefined reference` 常常是链接阶段缺少实现。
- `multiple definition` 常常是把定义放进头文件。
- 编译错误和链接错误要分开判断。

### 1.7 静态库

实际 demo 没有静态库，但可以用 `led.c` 和 `counter.c` 顺手演示“库就是一组 object files 的打包”。

```bash
gcc -Iinclude -c src/led.c -o build/led.o
gcc -Iinclude -c src/counter.c -o build/counter.o
ar rcs build/libdriver.a build/led.o build/counter.o
gcc -Iinclude -c src/main.c -o build/main.o
gcc build/main.o -Lbuild -ldriver -o build/app
```

讲解点：

- `.a` 是静态库，里面是一组 `.o`。
- `-Lbuild` 指定库搜索路径。
- `-ldriver` 表示链接 `libdriver.a`。
- 许多 SDK、HAL、第三方库都可以理解成“源码或库 + 头文件 + 构建参数”的组合。

### 1.8 编译器、语言服务器、IDE、构建系统

这一节插在 Project 1 后半段最自然，因为此时学生已经遇到了 include path 和链接问题。

推荐图示：

```text
VS Code / IDE
  ├── clangd: completion / diagnostics / jump to definition
  ├── build system: source files / include paths / defines / linker flags
  ├── compiler: gcc / clang / arm-none-eabi-gcc
  └── debugger: gdb / ST-Link / J-Link
```

讲解点：

- 编辑器负责编辑和展示。
- 语言服务器负责补全、跳转、语义诊断。
- 编译器负责把源码变成目标文件。
- 构建系统负责组织文件列表和参数。
- 调试器负责断点、单步、变量查看。
- clangd 不负责生成最终程序。
- clangd 报错但工程能编译，常见原因是 clangd 不知道正确 include path、宏定义或目标平台。
- 工程能编译但编辑器红线很多，通常是语言服务器配置没有同步构建配置。

可以引入 `compile_commands.json`：

```text
compile_commands.json
  记录每个源文件实际使用的编译命令。
  clangd 通过它理解 include path、macros、language standard、target。
```

### 1.9 GitHub 工作流

Project 1 完成后推到 GitHub，建立后续作业提交习惯。

```bash
git remote add origin <repo-url>
git branch -M main
git push -u origin main
git status
```

讲解点：

- Git 是本地工具，GitHub 是远程平台。
- `origin` 只是远程仓库的常用名字。
- `main` 是分支名。
- 本地没有 commit 的修改不会被 push。
- `.gitignore` 只影响尚未被 Git 跟踪的新文件。
- 提交作业时应提交源码、配置和文档，不提交 `build/`、`.o`、`.a`、`.elf`、`.bin` 等产物。

建议学生在 Project 1 至少留下这些 commit：

```text
Initialize desktop C build example
Add LED and counter desktop demo
Split LED and counter into modules
Document manual build commands
```

## Project 2: baremetal-arm-build

### 项目目标

把 Project 1 的简单模块化 C 工程迁移到 `arm-none-eabi-gcc`，展示桌面端程序和嵌入式固件的区别。

当前实际 demo 只做到 EIDE 迁移前：不用 CMSIS、不用 HAL、不用 EIDE、不用 Make/CMake，只用一条 `arm-none-eabi-gcc` 命令生成 `.elf`，再用 `objcopy` 从 `.elf` 转换出 `.bin` 和 `.hex`。

### 推荐项目结构

```text
baremetal-arm-build/
  README.md
  .gitignore
  include/
    counter.h
    led.h
  src/
    main.c
    led.c
    counter.c
    startup.c
  linker/
    stm32f407ighx_min.ld
  build/
```

实际项目位于 `../demo-projects/baremetal-arm-build`。

目标平台：

- MCU 系列：STM32F407
- 芯片假设：STM32F407IGHx
- CPU：Arm Cortex-M4
- Flash：`0x08000000` 起始，1024 KB
- RAM：`0x20000000` 起始，128 KB
- CCMRAM：`0x10000000` 起始，64 KB

### 2.1 从桌面端目标迁移到 ARM 目标和裸机风格

接口仍然保留 `led` 和 `counter` 两个模块，但实现不再使用 `printf`。裸机端没有普通桌面 libc 输出环境，demo 中用 `volatile` 状态变量模拟模块状态。

```c
// include/led.h
#ifndef LED_H
#define LED_H

void led_on(void);
void led_off(void);
void led_toggle(void);
unsigned int led_get_state(void);

#endif
```

```c
// include/counter.h
#ifndef COUNTER_H
#define COUNTER_H

void counter_init(unsigned int value);
unsigned int counter_increment(void);
unsigned int counter_get(void);

#endif
```

```c
// src/main.c
#include "counter.h"
#include "led.h"

int main(void) {
  counter_init(0);
  led_off();

  while (1) {
    led_toggle();
    counter_increment();
  }
}
```

嵌入式程序通常不会 `return 0`，而是在主循环里持续运行。

### 2.2 一步构建 ELF

创建构建目录：

```bash
mkdir -p build
```

编译并链接固件：

```bash
arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -nostdlib -Iinclude -T linker/stm32f407ighx_min.ld src/startup.c src/main.c src/led.c src/counter.c -o build/firmware.elf
```

讲解点：

- `gcc` 生成给当前电脑运行的程序。
- `arm-none-eabi-gcc` 运行在电脑上，但生成给 ARM Cortex-M 运行的代码。
- `-mcpu=cortex-m4` 指定目标 CPU。
- `-mthumb` 指定 Thumb 指令集。
- `-nostdlib` 表示不自动链接桌面端标准启动文件和标准库。
- `-T linker/stm32f407ighx_min.ld` 指定 linker script。
- 生成的 `firmware.elf` 不能在电脑上用 `./firmware.elf` 运行。

生成烧录文件：

```bash
arm-none-eabi-objcopy -O binary build/firmware.elf build/firmware.bin
arm-none-eabi-objcopy -O ihex build/firmware.elf build/firmware.hex
arm-none-eabi-size build/firmware.elf
```

讲解点：

- `.elf` 适合调试，包含段信息和符号信息。
- `.bin` 是原始二进制内容。
- `.hex` 带地址信息，常用于烧录工具。
- `objcopy` 是从 `.elf` 转换烧录文件的后处理步骤，不能由普通链接命令直接替代。

Git 操作：

```bash
git init
git add README.md .gitignore include/led.h include/counter.h src/main.c src/led.c src/counter.c
git commit -m "Initialize bare-metal ARM example"
```

也可以从 Project 1 新建分支迁移：

```bash
git switch -c baremetal-arm
```

### 2.3 嵌入式基本原理穿插

在学生看到 `arm-none-eabi-gcc` 之后，再讲嵌入式和桌面端区别最自然。

桌面端：

```text
app executable
  -> OS loader
  -> process starts
  -> main
  -> return to OS
```

嵌入式：

```text
firmware in Flash
  -> Reset_Handler
  -> initialize data / bss
  -> SystemInit
  -> main
  -> while (1)
```

讲解点：

- MCU 上通常没有普通操作系统帮你加载程序。
- 固件被烧录到 Flash。
- 上电或复位后，从向量表里的 reset handler 开始执行。
- startup code 初始化 `.data` 和 `.bss`。
- SRAM 存放运行时数据。
- 外设通过寄存器控制。
- 时钟树决定 CPU、总线和外设频率。

### 2.4 startup code 和 vector table

实际 demo 用 C 写了最小 startup，不引入完整厂商启动文件。

```c
// src/startup.c
typedef unsigned int uint32_t;

extern uint32_t _estack;
extern uint32_t _sidata;
extern uint32_t _sdata;
extern uint32_t _edata;
extern uint32_t _sbss;
extern uint32_t _ebss;

int main(void);
void Reset_Handler(void);
void Default_Handler(void);

__attribute__((section(".isr_vector"), used))
void (*const vector_table[])(void) = {
  (void (*)(void))(&_estack),
  Reset_Handler,
};
```

`Reset_Handler` 的实际工作：

```c
void Reset_Handler(void) {
  // copy .data from Flash to RAM
  // clear .bss in RAM
  main();

  while (1) {
  }
}
```

讲解点：

- 向量表告诉 CPU 初始栈顶和 reset handler 地址。
- 真实 STM32 startup 文件比这个复杂，会处理 `.data`、`.bss`、完整中断向量。
- `main` 不是 MCU 真正执行的第一段用户相关代码。
- startup 文件通常由芯片厂商、CubeMX 或模板工程提供。
- demo 中只列出 Cortex-M 核心异常入口，外部中断表没有展开，因为目标是“最小可编译、可链接”。

### 2.5 linker script 和内存布局

实际 demo 的 linker script 文件是 `linker/stm32f407ighx_min.ld`，使用 STM32F407IGHx 的基础内存布局。

```ld
ENTRY(Reset_Handler)

MEMORY
{
  FLASH  (rx)  : ORIGIN = 0x08000000, LENGTH = 1024K
  RAM    (xrw) : ORIGIN = 0x20000000, LENGTH = 128K
  CCMRAM (xrw) : ORIGIN = 0x10000000, LENGTH = 64K
}

_estack = ORIGIN(RAM) + LENGTH(RAM);

SECTIONS
{
  .isr_vector : {
    KEEP(*(.isr_vector))
  } > FLASH

  .text : {
    *(.text*)
    *(.rodata*)
  } > FLASH

  _sidata = LOADADDR(.data);

  .data : {
    _sdata = .;
    *(.data*)
    _edata = .;
  } > RAM AT > FLASH

  .bss : {
    _sbss = .;
    *(.bss*)
    *(COMMON)
    _ebss = .;
  } > RAM
}
```

讲解点：

- linker script 决定代码和数据放到 Flash/RAM 的位置。
- `_estack` 给 vector table 提供初始栈顶。
- `_sidata`、`_sdata`、`_edata` 用于 startup 拷贝 `.data`。
- `_sbss`、`_ebss` 用于 startup 清零 `.bss`。
- demo 的 linker script 是教学最小版，不是完整 CubeMX 生成脚本。

Git 操作：

```bash
git add src/startup.c linker/stm32f407ighx_min.ld
git commit -m "Add minimal startup code and linker script"

git add README.md
git commit -m "Document manual ARM build commands"
```

### 2.6 可选：拆开观察 `.c -> .o -> .elf`

正常构建只需要一步命令。下面这些命令用于课堂展示中间过程：

```bash
arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -Iinclude -c src/startup.c -o build/startup.o
arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -Iinclude -c src/main.c -o build/main.o
arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -Iinclude -c src/led.c -o build/led.o
arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -Iinclude -c src/counter.c -o build/counter.o

arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -nostdlib -T linker/stm32f407ighx_min.ld build/startup.o build/main.o build/led.o build/counter.o -o build/firmware.elf
```

讲解点：

- 一步构建命令内部也会编译每个 `.c` 文件并链接，只是没有把 `.o` 保留下来。
- 如果缺少 `src/counter.c` 或 `build/counter.o`，链接阶段会找不到 counter 函数。
- 如果 include path 不对，编译阶段会找不到 `counter.h` 或 `led.h`。

### 2.7 不同嵌入式工具链穿插

在 Project 2 已经使用 `arm-none-eabi-gcc` 后，再比较其他工具链。

| 工具链 | 常见场景 |
| --- | --- |
| `arm-none-eabi-gcc` | 开源、跨平台，EIDE/CMake/Make 常用 |
| Arm Compiler 5 | 老 Keil MDK 项目常见，命令通常是 `armcc` |
| Arm Compiler 6 | 新 Keil MDK，基于 LLVM/Clang，命令通常是 `armclang` |
| IAR EWARM | 商业工具链，工业项目常见 |
| LLVM/Clang bare-metal | 可用于裸机开发，但配置门槛更高 |

讲解点：

- 编译器必须匹配目标 CPU 和 ABI。
- 不同工具链的选项、启动文件、库、链接脚本格式可能不同。
- 同一个芯片可以被不同工具链支持，但工程配置不能直接混用。
- Keil、IAR、EIDE、CMake 不是同一层概念，有些是 IDE，有些是构建系统，有些是编译器工具链。

### 2.8 从 Project 2 引出后续 EIDE 迁移

当前 `../demo-projects/baremetal-arm-build` 不包含 EIDE 配置。后续要迁移 EIDE 时，可以用这个项目的一步命令作为对照。

| 手动命令或参数 | EIDE 中对应配置 |
| --- | --- |
| `src/main.c`, `src/led.c`, `src/counter.c`, `src/startup.c` | source files |
| `-Iinclude` | include directories |
| `-DDEBUG` | preprocessor definitions |
| `-mcpu=cortex-m4` | target CPU / compiler options |
| `-mthumb` | compiler options |
| `-T linker/stm32f407ighx_min.ld` | linker script |
| `build/firmware.elf` | output executable |
| `objcopy -O binary` | post-build output |

讲解点：

- EIDE 不是编译器。
- EIDE 保存工程配置，并调用 `arm-none-eabi-gcc`、linker、objcopy、烧录工具。
- 自动构建系统不是魔法，本质上是在组织刚才手动输入过的命令。
- 出构建错误时，要能从 EIDE 输出里看出真实执行的编译/链接命令。

Git 操作：

```bash
git status
git add .
git commit -m "Add EIDE project configuration for ARM build"
```

需要提醒学生：这条 commit 是后续迁移 EIDE 时才做的，不属于当前 `baremetal-arm-build` demo 的初始内容。如果 EIDE 生成了本地缓存或构建目录，要加入 `.gitignore`，不要把构建产物一起提交。

## Project 3: stm32-cubemx-eide

### 项目目标

使用 STM32CubeMX 生成一个较完整的嵌入式项目，再改成 EIDE 项目。这个项目让学生看到真实 STM32 工程结构，而不只是教学用最小 bare-metal 模板。

建议功能很简单：配置一个 GPIO 输出，让板载 LED 闪烁。

### 推荐流程

```text
CubeMX:
  选芯片/开发板
  -> 配 RCC 和时钟树
  -> 配 GPIO
  -> 选择 HAL/LL 和工程选项
  -> 生成工程

Inspect:
  看 Core、Drivers、startup、linker script、用户代码区域

EIDE:
  导入或迁移工程
  -> 配 Arm GCC
  -> 编译
  -> 生成 .elf/.bin
  -> 烧录/调试
```

### 3.1 CubeMX 选芯片或开发板

讲解点：

- 如果课程使用固定开发板，优先选择 board selector。
- 如果使用自定义板，选择具体 MCU 型号。
- CubeMX 是配置和代码生成工具，不是编译器。
- CubeMX 生成的代码依赖芯片型号、封装、时钟源、外设配置。

芯片架构分层在这里快速讲，控制在 5-10 分钟：

```text
开发板
  └── MCU: STM32F4 / STM32G4 / STM32H7
        ├── CPU Core: Arm Cortex-M3/M4/M7/M33
        ├── Peripherals: GPIO / UART / SPI / I2C / TIM / ADC / CAN
        └── Memory: Flash / SRAM
```

讲解重点：

- Arm Cortex-M 是 CPU core，不是完整芯片。
- STM32 是 ST 的 MCU 产品线。
- MCU 包含 CPU core、Flash、SRAM、外设。
- 开发板是把 MCU、电源、调试器、接口等做在一起。

### 3.2 配置 GPIO 和时钟树

讲解点：

- 外设不是库函数，而是 MCU 内部硬件模块。
- GPIO、UART、TIM、ADC、CAN 都是外设。
- 外设使用前通常要开时钟、配引脚、配模式、再读写或启动。
- 时钟树决定 core clock、bus clock、peripheral clock。
- CubeMX 帮助生成时钟初始化和外设初始化代码。

建议只配置一个 LED GPIO：

```text
Pin mode: GPIO_Output
Label: LED_STATUS
Initial level: Low
```

不要在第一节课引入复杂外设，避免主线被寄存器细节打断。

### 3.3 生成工程并观察目录结构

典型结构：

```text
Core/
  Inc/
    main.h
    stm32xxxx_it.h
  Src/
    main.c
    stm32xxxx_it.c
    stm32xxxx_hal_msp.c
Drivers/
  CMSIS/
  STM32xxxx_HAL_Driver/
startup_stm32xxxx.s
STM32xxxx_FLASH.ld
```

讲解点：

- `Core/Src/main.c` 是用户主逻辑和初始化入口。
- `Core/Inc` 是用户头文件。
- `Drivers/CMSIS` 提供 Arm core 和芯片基础定义。
- `Drivers/STM32xxxx_HAL_Driver` 是 ST HAL 驱动源码。
- `startup_stm32xxxx.s` 是真实启动文件。
- `STM32xxxx_FLASH.ld` 是真实 linker script。
- HAL 比 LL 抽象更高，LL 更接近寄存器。
- CMSIS 是 Arm 定义的通用底层接口规范。

软件层图：

```text
User Code
  -> HAL / LL
  -> CMSIS
  -> Startup code
  -> Linker script
  -> Toolchain
```

### 3.4 USER CODE 区域和 Git diff

在 `main.c` 中添加 LED blink。

```c
/* USER CODE BEGIN WHILE */
while (1)
{
  HAL_GPIO_TogglePin(LED_STATUS_GPIO_Port, LED_STATUS_Pin);
  HAL_Delay(500);
}
/* USER CODE END WHILE */
```

讲解点：

- 用户代码写在 `USER CODE BEGIN/END` 区域，避免 CubeMX 重新生成时被覆盖。
- CubeMX 生成代码不是不能改，但要知道哪些区域安全。
- 重新生成代码后要看 `git diff`，确认 CubeMX 改了什么。

Git 操作：

```bash
git init
git add .
git commit -m "Generate STM32 GPIO project with CubeMX"

git diff
git add Core/Src/main.c
git commit -m "Blink LED in main loop"
```

讲解点：

- 第一次生成工程可以作为一个 commit。
- 手写用户逻辑单独 commit。
- CubeMX 重新生成后必须检查 diff。

### 3.5 改成 EIDE 项目

将 CubeMX 工程迁移或导入 EIDE。

需要确认的配置：

- source files:
  - `Core/Src/*.c`
  - `Drivers/.../*.c`
  - startup assembly file
- include directories:
  - `Core/Inc`
  - `Drivers/CMSIS/...`
  - `Drivers/STM32xxxx_HAL_Driver/Inc`
- preprocessor definitions:
  - 芯片型号宏，例如 `STM32F407xx`
  - `USE_HAL_DRIVER`
- linker script:
  - `STM32xxxx_FLASH.ld`
- compiler:
  - `arm-none-eabi-gcc`
- output:
  - `.elf`
  - `.bin` 或 `.hex`

讲解点：

- CubeMX 负责生成初始化代码。
- EIDE 负责管理工程并调用工具链。
- Arm GCC 负责编译和链接。
- ST-Link/J-Link/DAPLink 负责烧录和调试。
- 如果 EIDE 找不到 HAL 头文件，通常是 include path 配置问题。
- 如果链接失败，通常要检查 source files、startup file、linker script、库和宏定义。

Git 操作：

```bash
git status
git add .
git commit -m "Add EIDE configuration for CubeMX project"
```

### 3.6 烧录和调试入口

如果现场有板子，可以演示烧录。没有板子也可以只演示构建产物。

讲解点：

- `.elf` 用于调试，包含符号信息。
- `.bin` / `.hex` 用于烧录。
- 调试器连接的是芯片调试接口，不是普通串口。
- 常见调试器：ST-Link、J-Link、DAPLink。
- 烧录失败时先检查芯片型号、调试器、接线、供电、复位、驱动。

## C 语言 OOP 范式穿插

这部分可以放在 Project 1 拆分模块之后初次出现，在 Project 3 结束后再回收一次。

### 讲解目标

让学生理解嵌入式 C 项目为什么常用 `struct + functions` 的模块化写法，为后续 LED、motor、IMU、PID、通信协议模块做准备。

### 桌面端版本

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

### 嵌入式版本

```c
typedef struct {
  GPIO_TypeDef *port;
  uint16_t pin;
} Led;

void Led_Init(Led *self, GPIO_TypeDef *port, uint16_t pin);
void Led_On(Led *self);
void Led_Off(Led *self);
void Led_Toggle(Led *self);
```

讲解点：

- `struct` 保存对象状态。
- 函数第一个参数传对象指针，模拟 `this` / `self`。
- `.h` 暴露接口，`.c` 隐藏实现。
- 同一套接口可以先在桌面端用 `printf` 模拟，之后在 STM32 上换成 `HAL_GPIO_WritePin`。
- 这不是为了把 C 写成 C++，而是为了让驱动代码可复用、可测试、可维护。

Git 操作：

```bash
git add include/led.h src/led.c src/main.c
git commit -m "Refactor LED module with object-style API"
```

## Git 贯穿策略

三个项目都应要求学生留下清晰 commit history。Git 不是一个独立知识点，而是每完成一个工程状态就保存一次。

### 推荐 commit 节奏

Project 1:

```text
Initialize desktop C build example
Add LED and counter desktop demo
Split LED and counter into modules
Document manual build commands
```

Project 2:

```text
Initialize bare-metal ARM example
Add minimal startup code and linker script
Add LED and counter modules
Document manual ARM build commands
```

Project 2 后续迁移到 EIDE 时，可以再增加：

```text
Add EIDE project configuration for ARM build
```

Project 3:

```text
Generate STM32 GPIO project with CubeMX
Blink LED in main loop
Add EIDE configuration for CubeMX project
Document flash and debug steps
```

### 每次 commit 前的固定动作

```bash
git status
git diff
git add <files>
git status
git commit -m "<clear message>"
```

讲解点：

- 先 `status`，再 `diff`。
- 不要盲目 `git add .`，除非已经确认没有构建产物和临时文件。
- commit message 描述意图，不描述“我今天改了点东西”。
- 代码能编译通过后再提交更好。

### GitHub 提交流程

```bash
git remote add origin <repo-url>
git branch -M main
git push -u origin main
```

后续更新：

```bash
git status
git add <files>
git commit -m "Complete project exercise"
git push
```

讲解点：

- 本地修改必须 commit 后才可能 push。
- `push` 是把 commit 推送到远程。
- `pull` 是从远程拉取更新。
- 如果多人协作，再引入 branch 和 pull request。本节只讲最小闭环。

## 最终总结

三条主线要在最后合并起来。

### 工具链主线

```text
C source
  -> preprocessor
  -> compiler
  -> assembler
  -> object files
  -> linker
  -> executable or firmware
```

### 嵌入式差异

```text
desktop executable:
  OS loader -> main -> return to OS

embedded firmware:
  reset -> startup -> main -> while (1)
```

嵌入式额外需要：

- target CPU flags
- startup code
- linker script
- Flash/RAM memory layout
- `.elf` / `.bin` / `.hex`
- flashing and debugging tools
- vendor libraries such as CMSIS/HAL/LL

### 工程工具分工

```text
CubeMX: generate STM32 initialization code
EIDE: manage project and invoke tools
Arm GCC: compile and link firmware
clangd: code intelligence
Git: track project history
GitHub: host and submit project
ST-Link/J-Link: flash and debug target
```

## 课后任务建议

提交三个项目或一个包含三个子目录的仓库：

```text
lec1-foundation-exercises/
  desktop-c-build/
  baremetal-arm-build/
  stm32-cubemx-eide/
```

要求：

- `desktop-c-build` 能用手动命令编译运行。
- `baremetal-arm-build` 能用 `arm-none-eabi-gcc` 生成 `.elf` 和 `.bin`。
- `stm32-cubemx-eide` 包含 CubeMX 生成工程和 EIDE 配置。
- 每个项目有 README，写清楚构建方式。
- `.gitignore` 正确忽略构建产物。
- 至少 8 个有意义的 commit。
- push 到 GitHub 并提交仓库链接。

评价重点：

- 工程结构是否清楚。
- 构建命令是否可复现。
- include path、宏定义、链接脚本等配置是否合理。
- 是否能解释常见构建错误属于哪个阶段。
- Git history 是否清晰。
- CubeMX 生成代码和用户代码是否分区明确。
