# Online Food Ordering System

基于 `Spring Boot + Vue 3 + 微信小程序` 的在线餐饮点餐系统，适用于食堂/餐厅场景，覆盖管理员后台、用户点餐端、餐桌管理、订单结算与图片上传等核心流程。

## 项目简介

本项目包含 3 个主要子系统：

- `springboot`：后端服务，提供登录鉴权、用户管理、菜品管理、餐桌管理、订单管理、文件上传下载等接口
- `vue`：后台管理端，供管理员进行用户、菜品、餐桌、订单等数据管理
- `wechat-miniprogram`：微信小程序用户端，供普通用户完成注册登录、选座、点餐、查看订单、个人资料管理

## 技术栈

### 后端

- Java 21
- Spring Boot 3.2.0
- MyBatis
- PageHelper
- MySQL
- Hutool

### 前端管理端

- Vue 3
- Vite
- Vue Router
- Element Plus
- Axios
- Sass

### 小程序端

- 微信小程序原生开发

## 项目结构

```text
Online Food Ordering System/
├─ springboot/                 # Spring Boot 后端
│  ├─ src/main/java/com/example
│  │  ├─ common/               # 鉴权、拦截器、统一返回等
│  │  ├─ controller/           # 接口控制器
│  │  ├─ entity/               # 实体类
│  │  ├─ mapper/               # Mapper 接口
│  │  └─ service/              # 业务逻辑
│  └─ src/main/resources/
│     ├─ application.yml       # 后端配置
│     └─ mapper/               # MyBatis XML
├─ vue/                        # Vue 管理端
│  ├─ src/router/              # 路由配置
│  ├─ src/views/               # 页面组件
│  ├─ src/utils/               # 请求封装
│  └─ public/                  # 静态资源
├─ wechat-miniprogram/         # 微信小程序端
│  ├─ pages/                   # 页面
│  ├─ utils/                   # 请求、接口、鉴权工具
│  ├─ config/                  # 域名与运行配置
│  └─ assets/                  # 图标与占位图
├─ photo/                      # 上传图片与业务图片资源
└─ 论文撰写过程/               # 论文资料与过程文档
```

## 核心功能

### 管理端功能

- 管理员登录
- 管理员信息维护
- 用户信息管理
- 餐桌信息管理
- 菜品信息管理
- 订单管理与收入统计

### 用户端功能

- 用户注册与登录
- 个人资料查看与修改
- 选座 / 取消选座
- 浏览菜品并下单
- 查看个人订单
- 订单结算

### 系统能力

- 基于角色的登录鉴权
- Token 身份校验
- 分页查询
- 图片上传与下载
- 管理端与小程序端共用后端接口

## 主要接口模块

后端控制器位于 `springboot/src/main/java/com/example/controller`：

- `WebController`：登录、注册、基础认证入口
- `AdminController`：管理员管理
- `UserController`：用户管理、当前用户资料维护
- `TablesController`：餐桌管理、当前用户选座
- `FoodsController`：菜品管理
- `OrdersController`：订单创建、查询、结算、收入统计
- `FileController`：文件上传与图片访问

## 运行环境

- JDK 21
- Maven 3.9+
- Node.js 18+
- npm 9+
- MySQL 8.x
- 微信开发者工具

## 配置说明

### 1. 后端配置

后端配置文件：`springboot/src/main/resources/application.yml`

当前默认配置要点：

- 服务端口：`9090`
- 数据库：`canteen`
- 数据库用户名：`root`
- 数据库密码：`123456`

默认数据库连接：

```yaml
jdbc:mysql://localhost:3306/canteen?useUnicode=true&characterEncoding=utf-8&allowMultiQueries=true&useSSL=false&serverTimezone=GMT%2b8&allowPublicKeyRetrieval=true
```

建议根据本机环境修改数据库账号密码。

### 2. Vue 管理端配置

环境变量文件：

- `vue/.env.development`
- `vue/.env.production`

当前配置：

```env
VITE_BASE_URL='http://localhost:9090'
```

生产配置示例中使用了：

```env
VITE_BASE_URL='http://localhost:9091'
```

部署时请按实际后端地址调整。

### 3. 微信小程序配置

主要配置文件：

- `wechat-miniprogram/config/index.js`
- `wechat-miniprogram/project.config.json`
- `wechat-miniprogram/project.private.config.json`

当前开发配置中：

- `baseUrl`: `http://127.0.0.1:9090`
- `assetBaseUrl`: `http://127.0.0.1:9090`
- `apiMode`: `modern`

注意：

- 真机调试或发布时，必须替换为已在微信后台配置的 `HTTPS` 域名
- `project.private.config.json` 为本地私有配置，不建议提交到仓库

## 启动步骤

### 一、启动后端

```bash
cd springboot
mvn spring-boot:run
```

或先打包再运行：

```bash
cd springboot
mvn clean package
java -jar target/springboot-0.0.1-SNAPSHOT.jar
```

启动成功后默认访问：

```text
http://localhost:9090
```

### 二、启动 Vue 管理端

```bash
cd vue
npm install
npm run dev
```

开发完成后构建：

```bash
cd vue
npm run build
```

### 三、启动微信小程序

1. 使用微信开发者工具打开 `wechat-miniprogram` 目录
2. 检查 `config/index.js` 中的后端地址
3. 配置合法域名或在开发环境关闭域名校验
4. 编译并预览

## 数据与资源说明

- 系统上传和业务图片统一存放在根目录 `photo/`
- 后端 `FileController` 提供 `/files/upload` 与 `/files/download/{fileName}` 接口
- 运行后端时，建议从项目根目录或 `springboot` 目录启动，以便正确解析 `photo` 资源目录

## 管理端路由说明

Vue 管理端主要页面包括：

- `/login`：管理员登录
- `/tables`：餐桌管理
- `/foods`：菜品管理
- `/user`：用户管理
- `/admin`：管理员管理
- `/person`：个人信息
- `/orderManager`：订单管理

当前路由守卫要求本地缓存中存在 `role === 'ADMIN'` 的登录信息，否则会跳转到登录页。

## 小程序页面说明

当前小程序页面包括：

- `pages/login/index`：登录页
- `pages/table/index`：选座页
- `pages/menu/index`：点餐页
- `pages/orders/index`：订单页
- `pages/profile/index`：个人中心

## 开发建议

- 首次运行前先准备 `canteen` 数据库及对应表结构
- 将敏感配置从源码中迁移到本地环境配置或部署环境变量
- 不要提交 `node_modules`、`dist`、`target`、日志文件和微信私有配置
- 如果需要部署上线，建议为后端增加生产环境配置文件

## 当前仓库建议忽略的内容

建议忽略以下内容：

- `vue/node_modules`
- `vue/dist`
- `springboot/target`
- 日志文件
- IDE 配置目录
- 微信开发者工具私有配置
- 本地环境变量文件

这些规则已写入新的 `.gitignore`。

## 后续可扩展方向

- 增加数据库初始化 SQL 文档
- 增加接口文档或 Swagger
- 增加单元测试与集成测试
- 增加 Docker 部署方案
- 增加 CI/CD 配置

## 许可证

如需开源发布，可在此补充 `MIT`、`Apache-2.0` 或其他许可证信息。
