# 在线订餐系统技术文档

## 1. 项目概述

本项目是一个面向食堂/餐饮场景的在线订餐系统，采用前后端分离架构实现，支持普通用户点餐与管理员后台管理两类使用方式。

系统的核心目标包括：

- 提供用户注册、登录、个人资料维护与余额管理能力
- 提供餐桌占用、菜品浏览、下单、结算的完整点餐流程
- 提供管理员对餐桌、菜品、订单、管理员、用户的后台维护能力

当前代码仓库由两个主要子项目组成：

- `springboot`：后端服务，提供 REST API、业务处理、数据访问、文件上传
- `vue`：前端页面，提供用户点餐界面与管理后台界面

## 2. 技术栈

### 后端

- Java 21
- Spring Boot 3.2.0
- MyBatis Spring Boot Starter 3.0.3
- PageHelper 1.4.6
- MySQL
- Hutool 5.8.18

### 前端

- Vue 3.5
- Vite 6
- Vue Router 4
- Element Plus 2
- Axios
- Sass

## 3. 目录结构

```text
canteen/
├─ springboot/                  后端工程
│  ├─ src/main/java/com/example
│  │  ├─ common/                通用返回体、角色枚举、跨域配置
│  │  ├─ controller/            REST 接口层
│  │  ├─ entity/                实体模型
│  │  ├─ exception/             自定义异常与全局异常处理
│  │  ├─ mapper/                MyBatis Mapper 接口
│  │  └─ service/               业务服务层
│  └─ src/main/resources
│     ├─ application.yml        Spring Boot 配置
│     └─ mapper/                MyBatis XML SQL 映射
├─ vue/                         前端工程
│  ├─ src/views/                页面组件
│  ├─ src/router/               路由配置
│  ├─ src/utils/request.js      Axios 请求封装
│  └─ .env.*                    前端环境变量
└─ photo/                       上传图片与静态资源目录
```

## 4. 系统角色与功能边界

### 4.1 普通用户 `USER`

- 注册账号
- 登录系统
- 查看空闲餐桌并占用餐桌
- 浏览菜品并加入已点列表
- 提交订单
- 查看自己的订单
- 在订单状态为“待结算”时完成结算
- 修改个人资料、头像、手机号、性别
- 账户余额充值

### 4.2 管理员 `ADMIN`

- 登录系统
- 管理餐桌信息
- 管理菜品信息
- 管理普通用户信息
- 管理管理员信息
- 查看全部订单
- 将订单状态从“待出餐”推进到“待结算”
- 删除订单

前端通过页面菜单控制角色可见范围，后端登录接口通过 `role` 字段决定调用管理员或用户登录逻辑。

## 5. 系统架构设计

## 5.1 总体架构

系统采用典型三层后端结构加单页前端：

1. 表现层
   - Vue 页面负责表单输入、数据展示、状态交互
   - Spring Boot Controller 暴露 HTTP API
2. 业务层
   - Service 负责登录校验、注册规则、订单生成、余额扣减、餐桌占用等业务逻辑
3. 数据访问层
   - Mapper 接口 + MyBatis XML 负责 SQL 执行与对象映射

## 5.2 前后端交互方式

- 前端统一使用 `axios` 发起请求
- 请求基础地址来自 `VITE_BASE_URL`
- 后端统一返回 `Result` 对象，结构为：

```json
{
  "code": "200",
  "msg": "请求成功",
  "data": {}
}
```

## 5.3 跨域与静态文件

- 后端通过 `CorsFilter` 放开全部来源、请求头和请求方法
- 文件上传接口统一挂在 `/files`
- 上传文件实际写入仓库根目录下的 `photo/` 目录
- 图片访问通过 `http://localhost:9090/files/download/{fileName}` 返回

## 6. 核心后端模块说明

### 6.1 通用模块

- `Result`：统一封装成功/失败响应
- `RoleEnum`：定义 `ADMIN` 和 `USER`
- `CorsConfig`：全局跨域配置
- `GlobalExceptionHandler`：统一捕获异常并转成标准返回体

### 6.2 认证入口 `WebController`

提供三个入口：

- `GET /`：健康检查/默认接口
- `POST /login`：按 `role` 分发到管理员或用户登录逻辑
- `POST /register`：仅允许普通用户注册

### 6.3 管理类业务控制器

- `AdminController`：管理员 CRUD
- `UserController`：用户 CRUD
- `TablesController`：餐桌 CRUD、占桌、退桌
- `FoodsController`：菜品 CRUD
- `OrdersController`：订单 CRUD、分页查询、状态更新
- `FileController`：文件上传与下载

## 7. 数据模型

根据实体类和 MyBatis XML，可抽象出以下核心业务表。

### 7.1 `admin`

字段含义：

- `id`：主键
- `username`：管理员账号
- `password`：密码
- `name`：姓名/昵称
- `avatar`：头像 URL
- `role`：角色，固定为 `ADMIN`

### 7.2 `user`

字段含义：

- `id`：主键
- `username`：用户账号
- `password`：密码
- `name`：用户名称
- `avatar`：头像 URL
- `role`：角色，固定为 `USER`
- `sex`：性别
- `phone`：手机号
- `account`：余额

### 7.3 `tables`

字段含义：

- `id`：主键
- `no`：餐桌编号
- `unit`：餐桌规格/说明，如几人位
- `free`：是否空闲，当前实现使用中文字符串表示
- `user_id`：当前占用该餐桌的用户 ID，可为空

业务上，`tables` 与 `user` 是单向关联：

- 一个餐桌最多被一个用户占用
- 一个用户同一时刻最多占用一个餐桌

### 7.4 `foods`

字段含义：

- `id`：主键
- `name`：菜品名称
- `descr`：菜品描述
- `price`：单价
- `img`：菜品图片 URL

### 7.5 `orders`

字段含义：

- `id`：主键
- `content`：订单内容，当前以字符串方式保存
- `total`：订单总金额
- `user_id`：下单用户 ID
- `time`：下单时间字符串
- `status`：订单状态
- `order_no`：订单号，使用 UUID 生成

当前订单状态在代码中的实际流转为：

- `待出餐`
- `待结算`
- `已完成`

## 8. 关键业务流程

### 8.1 注册与登录

1. 用户在注册页提交账号、密码、确认密码
2. 前端调用 `POST /register`
3. 后端校验用户名唯一性，默认将 `role` 设为 `USER`
4. 登录时前端提交 `username`、`password`、`role`
5. 后端根据 `role` 调用 `AdminService` 或 `UserService`
6. 登录成功后，前端将用户对象缓存到 `localStorage` 的 `canteen-user`

### 8.2 选桌与占桌

1. 用户进入首页，前端调用 `/tables/selectAll` 拉取餐桌列表
2. 页面仅对空闲餐桌显示“开始点餐”
3. 用户点击后调用 `/tables/addOrder`
4. 后端会先检查该用户是否已经占用其他餐桌
5. 若未占用，则将目标餐桌标记为非空闲并写入 `userId`

### 8.3 点餐与下单

1. 用户在“我的点餐”页读取当前占用的餐桌信息
2. 同页拉取全部菜品列表
3. 前端本地维护已点菜品列表 `orderList`
4. 用户提交订单时，前端将菜品明细拼接成字符串 `content`
5. 后端在 `OrdersService.add` 中生成 `orderNo` 和当前时间
6. 新订单初始状态为 `待出餐`

当前实现中，订单明细未拆成单独订单项表，而是以文本形式直接保存。

### 8.4 出餐与结算

1. 管理员在订单管理页查看全部订单
2. 当订单状态为 `待出餐` 时，管理员可编辑为 `待结算`
3. 普通用户在自己的订单列表中，当状态为 `待结算` 时可点击结算
4. 结算会调用 `/orders/update`，将状态改为 `已完成`
5. 后端在 `OrdersService.updateById` 中扣减用户余额
6. 若余额不足，则抛出业务异常并阻止完成

### 8.5 个人资料与充值

1. 用户或管理员可在“个人资料”页面修改名称、头像等信息
2. 普通用户额外支持修改性别、手机号并查看余额
3. 充值逻辑由前端直接累加余额后调用 `/user/update`
4. 后端按更新接口写回数据库

## 9. 前端页面结构

### 9.1 路由结构

前端采用一个主布局页 `Manager.vue` 作为后台容器，子路由包括：

- `/home`：首页/选桌页
- `/order`：我的点餐
- `/orderManager`：订单管理
- `/person`：个人资料
- `/admin`：管理员管理
- `/user`：用户管理
- `/tables`：餐桌管理
- `/foods`：菜品管理
- `/login`：登录页
- `/register`：注册页

### 9.2 页面职责

- `Login.vue`：登录入口，支持管理员/用户角色切换
- `Register.vue`：普通用户注册
- `Home.vue`：餐桌浏览与占桌
- `Order.vue`：点餐、购物清单展示、提交订单、退桌
- `OrderManager.vue`：订单列表、状态推进、结算、删除
- `Person.vue`：个人资料修改、头像上传、充值
- `Admin.vue` / `User.vue` / `Tables.vue` / `Foods.vue`：基础数据维护

## 10. 接口分组

以下是按模块划分的主要接口。

### 10.1 公共接口

- `GET /`
- `POST /login`
- `POST /register`

### 10.2 管理员接口

- `POST /admin/add`
- `DELETE /admin/delete/{id}`
- `DELETE /admin/delete/batch`
- `PUT /admin/update`
- `GET /admin/selectById/{id}`
- `GET /admin/selectAll`
- `GET /admin/selectPage`

### 10.3 用户接口

- `POST /user/add`
- `DELETE /user/delete/{id}`
- `DELETE /user/delete/batch`
- `PUT /user/update`
- `GET /user/selectById/{id}`
- `GET /user/selectAll`
- `GET /user/selectPage`

### 10.4 餐桌接口

- `POST /tables/add`
- `DELETE /tables/delete/{id}`
- `DELETE /tables/delete/batch`
- `PUT /tables/update`
- `PUT /tables/addOrder`
- `PUT /tables/removeOrder`
- `GET /tables/selectById/{id}`
- `GET /tables/selectByUserId/{userId}`
- `GET /tables/selectAll`
- `GET /tables/selectPage`

### 10.5 菜品接口

- `POST /foods/add`
- `DELETE /foods/delete/{id}`
- `DELETE /foods/delete/batch`
- `PUT /foods/update`
- `GET /foods/selectById/{id}`
- `GET /foods/selectAll`
- `GET /foods/selectPage`

### 10.6 订单接口

- `POST /orders/add`
- `DELETE /orders/delete/{id}`
- `DELETE /orders/delete/batch`
- `PUT /orders/update`
- `GET /orders/selectById/{id}`
- `GET /orders/selectAll`
- `GET /orders/selectPage`

### 10.7 文件接口

- `POST /files/upload`
- `GET /files/download/{fileName}`

## 11. 数据访问与分页机制

- 所有实体的查询主要通过 MyBatis XML 编写 SQL
- 分页统一由 `PageHelper.startPage(pageNum, pageSize)` 实现
- 列表接口返回 `PageInfo`，前端使用 `list` 与 `total` 字段渲染分页组件
- 模糊查询场景主要包括管理员、用户、餐桌、菜品、订单查询

## 12. 部署与运行说明

### 12.1 后端运行

后端默认配置：

- 端口：`9090`
- 数据库：`canteen`
- 数据库地址：`jdbc:mysql://localhost:3306/canteen`
- 用户名：`root`
- 密码：`123456`

启动方式：

```bash
cd springboot
mvn spring-boot:run
```

### 12.2 前端运行

开发环境变量：

- `vue/.env.development` 中 `VITE_BASE_URL='http://localhost:9090'`

启动方式：

```bash
cd vue
npm install
npm run dev
```

### 12.3 文件目录

- 上传文件写入仓库根目录 `photo/`
- 后端会尝试从 `photo/` 及其常见子目录解析文件

## 13. 当前实现特点与已知局限

从当前代码实现看，系统已经覆盖了完整的订餐主链路，但仍偏向课程设计/小型演示项目，主要体现在以下几点：

- 认证与鉴权较轻量。后端没有看到 token、session、拦截器或权限注解，角色控制主要依赖登录入参与前端菜单显示。
- 密码为明文存储与比对，没有加密、加盐或安全认证机制。
- 订单明细直接存为字符串，没有独立的订单项表，不利于统计、追单、改单和审计。
- 余额扣减发生在订单更新为“已完成”时，若接口被重复调用，存在重复扣款风险。
- 充值逻辑由前端先计算新余额再提交，后端没有独立充值接口与流水记录。
- 文件上传接口未体现文件类型、大小、恶意内容的进一步校验，访问地址也直接写死为 `localhost:9090`。
- 前端生产环境配置文件 `vue/.env.production` 中的 `VITE_BASE_URL='http://:9090'` 当前不可直接用于正式部署。
- 全局跨域配置允许任意来源访问，适合开发阶段，不适合直接用于生产环境。

## 14. 后续优化建议

如果要把该系统继续演进为更稳定的生产化项目，建议优先处理以下方向：

1. 增加登录态管理，使用 JWT 或 Session，并在后端加权限校验。
2. 对密码做哈希存储，并完善用户认证安全策略。
3. 拆分订单主表与订单明细表，保留每道菜的数量、单价和快照信息。
4. 将余额充值、扣款做成独立资金流水，保证幂等性与可审计性。
5. 规范订单状态机，避免非法状态跳转与重复结算。
6. 完善图片上传策略，改为对象存储或独立静态资源服务。
7. 增加单元测试、接口测试和基础异常日志。
8. 调整生产环境配置，补充 README、SQL 初始化脚本与部署文档。

## 15. 总结

该项目已经实现了在线订餐系统的基本闭环：

- 用户可以注册、登录、选桌、点餐、下单、结算
- 管理员可以维护菜品、餐桌、用户与订单状态
- 前后端职责划分清晰，代码结构适合教学、课程设计和二次开发入门

从工程成熟度上看，当前版本更适合作为原型系统或教学项目基础，在补齐认证、数据建模、资金安全与部署规范后，才能进一步向生产环境演进。
