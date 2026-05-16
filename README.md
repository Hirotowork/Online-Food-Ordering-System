# Online-Food-Ordering-System

一个面向食堂场景的订餐管理系统，采用前后端分离架构，包含：

- `Spring Boot` 后端服务
- `Vue 3` Web 管理端
- `微信小程序` 用户端

当前版本已经覆盖食堂订餐的核心业务链路：登录注册、选座、点餐、下单、出餐、结算、余额管理、图片上传与后台维护。

## 项目定位

这个项目主要面向食堂或校园点餐场景：

- 管理员通过 Web 后台维护菜品、餐桌、用户、订单和收入
- 普通用户通过微信小程序完成选座、点餐、查看订单和修改个人资料
- 两端共用同一套后端接口和数据库

系统角色分为两类：

- `ADMIN`：管理员
- `USER`：普通用户

## 功能概览

### 管理端

- 管理员登录与信息维护
- 用户列表查询、资料维护、余额调整
- 餐桌新增、修改、删除、分页查询
- 菜品新增、修改、删除、图片维护
- 订单分页查询、状态更新、删除
- 已完成订单收入统计

### 小程序端

- 用户注册、登录、退出登录
- 查看餐桌列表、占桌、退桌、查看当前餐桌
- 浏览菜品、购物车加减、提交订单
- 查看个人订单、对待结算订单执行结算
- 查看和修改个人资料、上传头像、查看余额

## 技术栈

### 后端

- `Java 21`
- `Spring Boot 3.2.0`
- `MyBatis`
- `PageHelper`
- `MySQL`
- `Hutool JWT`
- `Maven`

### Web 管理端

- `Vue 3.5`
- `Vite 6`
- `Vue Router 4`
- `Element Plus 2`
- `Axios`
- `Sass`

### 微信小程序端

- 微信小程序原生框架
- `wx.request`
- 本地 `Storage`
- 自定义请求封装与登录态管理

## 项目结构

```text
canteen/
├─ springboot/              Spring Boot 后端
│  ├─ src/main/java/com/example
│  │  ├─ common/            通用返回、JWT、拦截器、上下文
│  │  ├─ controller/        控制器层
│  │  ├─ entity/            实体类
│  │  ├─ exception/         异常处理
│  │  ├─ mapper/            Mapper 接口
│  │  └─ service/           业务逻辑层
│  └─ src/main/resources
│     ├─ application.yml    后端配置
│     └─ mapper/            MyBatis XML
├─ vue/                     Vue 3 管理端
│  ├─ src/router/           路由配置
│  ├─ src/utils/            请求封装
│  └─ src/views/            页面组件
├─ wechat-miniprogram/      微信小程序端
│  ├─ pages/                页面目录
│  ├─ utils/                请求、鉴权、URL 处理
│  └─ config/               环境配置
├─ learning/                功能学习文档
├─ photo/                   上传图片目录
├─ AGENTS.md                项目技术文档
└─ README.md
```

## 核心业务流程

### 1. 登录与鉴权

- 用户通过小程序调用 `/auth/login` 或 `/auth/register`
- 后端校验账号密码后签发 `JWT token`
- 小程序将 `token` 和用户信息保存到本地
- 后续请求自动携带 `Authorization: Bearer <token>`
- 后端通过 `AuthInterceptor` 和 `AuthContext` 识别当前登录用户

### 2. 占桌

- 小程序先查询 `/tables/current` 和 `/tables/selectAll`
- 用户选择一张空闲餐桌
- 后端校验“一个用户同一时间只能占一张桌”“一张桌同一时间只能被一个用户占用”
- 校验通过后写入餐桌占用信息

### 3. 下单

- 用户在小程序点餐页浏览菜品并维护购物车
- 提交时小程序将订单内容和总价发给 `/orders`
- 后端补全当前用户 ID、角色、订单号和下单时间
- 订单创建后进入 `待出餐` 状态

### 4. 出餐与结算

- 管理员在后台将订单状态从 `待出餐` 改为 `待结算`
- 用户在小程序订单页对 `待结算` 订单执行结算
- 后端校验订单归属和状态后扣减用户余额
- 结算成功后订单状态更新为 `已完成`
- `已完成` 订单会被计入总收入

## 后端接口风格

后端统一返回 `Result` 对象：

```json
{
  "code": "200",
  "msg": "请求成功",
  "data": {}
}
```

主要接口分组如下：

- 认证接口：`/login`、`/auth/login`、`/auth/register`
- 用户接口：`/user/*`、`/user/me`
- 餐桌接口：`/tables/*`、`/tables/current`
- 菜品接口：`/foods/*`
- 订单接口：`/orders/*`、`/orders/my`、`/orders/{id}/settle`
- 文件接口：`/files/upload`、`/files/download/{fileName}`

## 快速启动

### 环境要求

- `JDK 21`
- `Maven`
- `MySQL`
- `Node.js`
- 微信开发者工具

### 1. 启动后端

默认配置位于 [springboot/src/main/resources/application.yml](springboot/src/main/resources/application.yml)。

默认参数：

- 端口：`9090`
- 数据库：`canteen`
- JDBC：`jdbc:mysql://localhost:3306/canteen`
- 用户名：`root`
- 密码：`123456`

启动命令：

```bash
cd springboot
mvn spring-boot:run
```

### 2. 启动 Web 管理端

开发环境基础地址配置文件：

- [vue/.env.development](vue/.env.development)

启动命令：

```bash
cd vue
npm install
npm run dev
```

### 3. 启动微信小程序

- 使用微信开发者工具打开 `wechat-miniprogram`
- 按需修改 [wechat-miniprogram/config/index.js](wechat-miniprogram/config/index.js) 中的后端地址
- 当前默认后端地址为 `http://127.0.0.1:9090`
- 真机联调或上线时需要替换为微信后台允许的 HTTPS 域名

## 代码阅读入口

如果你是为了学习这个项目，可以先从这些文档入手：

- [AGENTS.md](AGENTS.md)：项目整体技术文档，覆盖架构、模块、接口、部署和局限
- [learning/login_learning.md](learning/login_learning.md)：登录、JWT、拦截器、登录态保存
- [learning/tables_learning.md](learning/tables_learning.md)：占桌流程与前后端调用链
- [learning/orders_learning.md](learning/orders_learning.md)：点餐下单、订单创建、订单状态流转
- [learning/money_learning.md](learning/money_learning.md)：管理端结算、收入统计、余额相关页面

推荐阅读顺序：

1. 先读 `AGENTS.md`，建立系统总览
2. 再读 `learning/login_learning.md`，理解登录态和 token
3. 然后读 `learning/tables_learning.md` 和 `learning/orders_learning.md`
4. 最后读 `learning/money_learning.md`，串起结算和收入统计

## 当前实现特点

- 已形成“后端 + Web 管理端 + 微信小程序端”的完整业务闭环
- 用户侧已接入基于 `JWT` 的登录鉴权
- 支持当前餐桌绑定、订单结算、收入统计
- 支持头像上传与图片资源访问
- 保留了部分旧接口，同时补充了更适合小程序的新接口

## 当前局限

- 管理端鉴权仍偏轻量，尚未形成完整后台 token 权限体系
- 用户和管理员密码仍为明文存储与明文校验
- 订单内容目前以字符串形式保存，未拆分订单明细表
- 充值和扣款缺少独立资金流水与更严格的幂等校验
- 文件上传缺少更严格的类型、大小和安全校验
- 仓库当前未提供初始化 SQL、自动化测试和完整生产部署文档

## 后续优化方向

1. 完善管理员端登录态与接口权限控制
2. 引入密码加密存储和更安全的认证策略
3. 将订单拆分为订单主表和订单明细表
4. 增加充值、扣款流水表和幂等校验
5. 规范订单状态机，避免非法状态跳转
6. 增加单元测试、接口测试和异常日志
7. 补充数据库初始化脚本与部署说明

## 适用场景

这个项目比较适合作为：

- Java Web 课程设计
- 毕业设计原型
- 前后端分离项目练习
- 微信小程序与 Spring Boot 联调练习

如果你需要，我也可以继续把这个 README 再补两类内容：

1. 仓库截图展示区
2. 更详细的接口示例和数据库表说明
