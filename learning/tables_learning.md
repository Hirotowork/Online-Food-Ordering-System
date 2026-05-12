# canteen 占桌功能学习资料

## 1. 这份文档是做什么的

这份文档专门解释 `canteen` 项目里的“占桌功能”。

你指定要看的文件是：

- `wechat-miniprogram/pages/table/index.js`
- `wechat-miniprogram/utils/api.js`
- `wechat-miniprogram/utils/request.js`
- `springboot/src/main/java/com/example/controller/TablesController.java`
- `springboot/src/main/java/com/example/service/TablesService.java`
- `springboot/src/main/java/com/example/mapper/TablesMapper.java`
- `springboot/src/main/resources/mapper/TablesMapper.xml`

为了把这条链真正讲明白，我还会顺带解释几个直接依赖的文件：

- `wechat-miniprogram/utils/auth.js`
- `wechat-miniprogram/config/index.js`
- `springboot/src/main/java/com/example/entity/Tables.java`
- `springboot/src/main/java/com/example/common/AuthContext.java`
- `springboot/src/main/java/com/example/common/Result.java`
- `springboot/src/main/java/com/example/common/WebMvcConfig.java`

这份资料面向完全零基础学习者，所以我会把语法、调用关系、数据流和业务规则都写清楚。

## 2. 先用一句人话说清楚“占桌功能”在做什么

占桌功能的本质是：

1. 用户先登录。
2. 小程序读取当前用户信息。
3. 小程序请求后端，拿到“当前用户已经占了哪张桌”和“所有餐桌列表”。
4. 用户点击一张空闲餐桌。
5. 小程序把餐桌 id 发给后端。
6. 后端检查两件事：
   - 这个用户是不是已经占了别的桌
   - 这张桌是不是已经被别人占了
7. 如果都没问题，就把这张桌标记为“已占用”，并把 `user_id` 写成当前用户 id。
8. 小程序重新刷新页面，然后跳到点餐页。

所以，“占桌”其实不是一个单独按钮，而是一整条链路：

- 登录态检查
- 页面加载
- 请求当前餐桌
- 请求全部餐桌
- 点击占桌
- 后端校验
- 数据库更新
- 页面刷新和跳转

## 3. 先建立一张总地图

### 前端部分

- `pages/table/index.js`
  - 餐桌页本身
  - 负责加载餐桌数据
  - 负责处理用户点击占桌

- `utils/request.js`
  - 小程序统一请求工具
  - 负责发请求、自动带 token、处理错误

- `utils/api.js`
  - 请求策略层
  - 负责新旧接口的切换和 fallback

- `utils/auth.js`
  - 登录态工具
  - 负责判断用户是否已经登录

### 后端部分

- `TablesController.java`
  - 提供餐桌相关接口
  - 接收前端请求，调用业务层

- `TablesService.java`
  - 真正的占桌业务逻辑
  - 检查用户是否已占桌、餐桌是否空闲

- `TablesMapper.java`
  - Mapper 接口
  - 定义数据库操作方法

- `TablesMapper.xml`
  - MyBatis XML
  - 写具体 SQL

### 关联基础部分

- `Tables.java`
  - 餐桌实体类

- `AuthContext.java`
  - 保存当前请求对应的用户 id

- `WebMvcConfig.java`
  - 配置哪些接口需要先登录

- `Result.java`
  - 统一接口返回格式

## 4. 先讲最基本的语法，不然后面看不懂

---

## 5. JavaScript 基础语法

占桌页前端是微信小程序 JavaScript，所以先看 JavaScript。

### 5.1 `const` 是什么

```javascript
const auth = require('../../utils/auth')
```

意思是：

- 定义一个变量 `auth`
- 这个变量引用了另一个文件导出的内容

你可以先把 `const` 理解成“定义一个名字，指向某个值”。

### 5.2 `require()` 是什么

```javascript
const { requestWithFallback } = require('../../utils/api')
```

意思是：

- 从 `../../utils/api` 这个文件里把功能引进来

这里用了“解构赋值”。

它等价于从导出的对象里取出：

- `requestWithFallback`

### 5.3 `Page({...})` 是什么

微信小程序页面通常这样写：

```javascript
Page({
  data: {},
  onShow() {},
  reserveTable() {}
})
```

你可以把它理解成：

- 注册一个页面对象

里面包含：

- 页面数据
- 页面生命周期函数
- 页面自己的方法

### 5.4 `data` 是什么

`data` 就是页面状态。

例如：

```javascript
data: {
  user: null,
  loading: true,
  currentTable: null,
  tables: []
}
```

表示这个页面记着这些值：

- 当前用户
- 是否正在加载
- 当前用户占的桌
- 餐桌列表

### 5.5 `this` 是什么

在页面方法里，`this` 通常指向“当前页面对象本身”。

例如：

```javascript
this.setData({ loading: true })
```

意思是：

- 修改当前页面的 `data`

### 5.6 `this.setData()` 是什么

在微信小程序中，页面数据不能随便直接改，通常要用：

```javascript
this.setData({
  loading: true
})
```

它的作用是：

- 修改页面数据
- 通知界面更新

### 5.7 `if (...) { ... }`

这是条件判断。

例如：

```javascript
if (!user) {
  return
}
```

意思是：

- 如果 `user` 不存在
- 就直接结束函数

### 5.8 `return` 是什么

`return` 表示“结束当前函数”，如果后面有值，还表示“把这个值返回出去”。

例如：

```javascript
return null
```

表示返回 `null`。

### 5.9 `async` 和 `await`

例如：

```javascript
async loadPageData() {
  const res = await requestWithFallback(...)
}
```

你先这样理解就够了：

- `async`
  - 这个函数里有异步操作
- `await`
  - 先等这个异步操作做完，再继续往下执行

在前端，占桌相关的异步操作主要是网络请求。

### 5.10 `try/finally`

例如：

```javascript
try {
  ...
} finally {
  this.setData({ loading: false })
}
```

意思是：

- `try` 里放主要逻辑
- `finally` 里的代码不管成功还是失败都会执行

所以这里的作用就是：

- 请求开始时设 `loading: true`
- 请求结束时一定会恢复成 `loading: false`

### 5.11 `event.currentTarget.dataset.index`

这是小程序事件对象里的常见写法。

```javascript
const index = event.currentTarget.dataset.index
```

意思是：

- 从当前被点击的元素上，读取它绑定的 `data-index`

`dataset` 可以理解成“页面元素上自定义挂的参数集合”。

### 5.12 `Object.assign()`

例如：

```javascript
Object.assign({}, item, {
  userId: this.data.user.id
})
```

意思是：

1. 先创建一个空对象 `{}`
2. 把 `item` 的内容复制进去
3. 再把 `userId` 这个字段加进去，或者覆盖旧值

### 5.13 `filter()` 和 `length`

例如：

```javascript
const availableCount = tables.filter(item => item.free === '是').length
```

这句的意思是：

1. 从 `tables` 数组里筛选出满足条件的餐桌
2. 条件是 `item.free === '是'`
3. 再取筛选结果的数量

也就是：

- 统计当前空闲餐桌数量

这里我用了 `'是'` 来解释，是依据项目文档和业务含义做的判断。终端里看到的源文件中文有乱码，但代码逻辑明显是在用两个中文字符串表示“空闲/占用”。

### 5.14 `Promise`

`utils/request.js` 里有：

```javascript
return new Promise((resolve, reject) => {
})
```

你可以把 `Promise` 理解成：

- 一个“未来会给你结果”的盒子

结果只有两种：

- 成功：`resolve(...)`
- 失败：`reject(...)`

所以页面里才能这样写：

```javascript
await requestWithFallback(...)
```

---

## 6. Java 基础语法

后端是 Java，所以你也要先理解最基本的 Java 结构。

### 6.1 `class` 是什么

例如：

```java
public class TablesService {
}
```

意思是定义了一个类，名字叫 `TablesService`。

你可以把类先理解成：

- 一组相关功能的容器

### 6.2 方法是什么

例如：

```java
public Tables reserveCurrentTable(Integer tableId, Integer currentUserId)
```

可以拆成：

- `public`
  - 公开方法
- `Tables`
  - 返回值类型
- `reserveCurrentTable`
  - 方法名
- `(Integer tableId, Integer currentUserId)`
  - 参数

### 6.3 `@RestController`

```java
@RestController
public class TablesController {
}
```

你先这样理解：

- 这是一个控制器类
- 它可以处理前端发来的 HTTP 请求

### 6.4 `@RequestMapping("/tables")`

表示这个类里的接口，路径前面都统一加上 `/tables`。

所以：

```java
@PostMapping("/current")
```

完整路径其实就是：

```text
/tables/current
```

### 6.5 `@GetMapping`、`@PostMapping`、`@PutMapping`、`@DeleteMapping`

这些注解表示接口类型：

- `@GetMapping`
  - GET 请求
- `@PostMapping`
  - POST 请求
- `@PutMapping`
  - PUT 请求
- `@DeleteMapping`
  - DELETE 请求

### 6.6 `@RequestBody`

例如：

```java
public Result reserveCurrent(@RequestBody Tables tables)
```

意思是：

- 把前端传来的 JSON 请求体
- 自动转换成一个 `Tables` 对象

### 6.7 `@PathVariable`

例如：

```java
public Result selectById(@PathVariable Integer id)
```

如果请求路径是：

```text
/tables/selectById/5
```

那么：

- `id` 就会接收到 `5`

### 6.8 `if` 和 `throw`

例如：

```java
if (currentUserId == null) {
    throw new CustomException("请先登录");
}
```

意思是：

- 如果当前用户 id 为空
- 就抛出异常
- 不让程序继续正常往下走

### 6.9 `null`

`null` 表示“没有值”。

例如：

- 没查到餐桌
- 没查到用户
- 当前没有占桌

都可能用 `null` 表示。

### 6.10 `Objects.equals(a, b)`

例如：

```java
Objects.equals(currentTable.getUserId(), tables.getUserId())
```

作用是：

- 安全比较两个值是否相等

它比直接写 `a.equals(b)` 更稳，因为其中一个值可能是 `null`。

### 6.11 `new`

例如：

```java
Tables tables = new Tables();
```

意思是：

- 创建一个新的 `Tables` 对象

### 6.12 `this`

在 Java 里：

```java
this.addOrder(tables);
```

表示：

- 调用当前这个对象自己的 `addOrder` 方法

---

## 7. MyBatis 和 XML 基础语法

`TablesMapper.java` 和 `TablesMapper.xml` 是数据库访问层，很多初学者会在这里卡住。

### 7.1 Mapper 是什么

Mapper 可以先理解成：

- 专门负责和数据库打交道的一层

Service 不直接写 SQL，而是调用 Mapper。

### 7.2 `#{id}` 是什么

在 MyBatis 里：

```xml
where id = #{id}
```

意思是：

- 把 Java 里传进来的 `id` 参数安全地放到 SQL 里

### 7.3 `<insert>`、`<update>`、`<delete>`、`<select>`

这些 XML 标签分别对应 SQL 类型：

- `<insert>`
  - 插入
- `<update>`
  - 更新
- `<delete>`
  - 删除
- `<select>`
  - 查询

### 7.4 `<if test="...">`

例如：

```xml
<if test="no != null">no = #{no},</if>
```

意思是：

- 只有当 `no` 不为空时，才拼接这段 SQL

### 7.5 `<set>`

例如：

```xml
<set>
    <if test="no != null">no = #{no},</if>
    ...
    user_id = #{userId}
</set>
```

你可以把 `<set>` 理解成：

- 专门帮助拼接 `update` 语句里的 `set` 部分

它会帮你处理逗号这些细节。

### 7.6 注解 SQL

`TablesMapper.java` 里也有这种写法：

```java
@Select("select * from tables where id = #{id}")
Tables selectById(Integer id);
```

意思是：

- 直接在 Java 接口上写 SQL

所以这个项目的 Mapper 同时用了两种方式：

- Java 注解写 SQL
- XML 写 SQL

---

## 8. 先认识餐桌数据长什么样

### 8.1 `Tables.java`

餐桌实体类有这些主要字段：

- `id`
  - 餐桌主键 id

- `no`
  - 餐桌编号

- `unit`
  - 餐桌规格

- `free`
  - 是否空闲

- `userId`
  - 当前占用这张桌的用户 id

- `userName`
  - 当前占用用户的名字，主要用于显示

### 8.2 `free` 字段是什么意思

这个字段是整个占桌逻辑的关键。

从项目文档和代码意图来看，它使用中文字符串表示状态：

- `是`
  - 空闲
- `否`
  - 已占用

终端输出里中文有乱码，但从业务逻辑可以确定代码就是在做这个判断。

### 8.3 餐桌记录可以先想象成这样

```json
{
  "id": 3,
  "no": "A03",
  "unit": "4人桌",
  "free": "是",
  "userId": null,
  "userName": null
}
```

如果被用户 8 占了，可能变成：

```json
{
  "id": 3,
  "no": "A03",
  "unit": "4人桌",
  "free": "否",
  "userId": 8,
  "userName": "张三"
}
```

---

## 9. 占桌功能完整流程图

当前项目里，小程序用户占桌的大致流程是：

1. 进入 `pages/table/index.js` 页面。
2. `onShow()` 先调用 `auth.requireLogin()` 检查是否已登录。
3. 已登录后，执行 `loadPageData()`。
4. `loadPageData()` 请求两个接口：
   - `/tables/current`
   - `/tables/selectAll`
5. 页面展示“当前已占餐桌”和“全部餐桌列表”。
6. 用户点击某一张桌，触发 `reserveTable(event)`。
7. 前端向后端发送：
   - `POST /tables/current`
   - 请求体只带餐桌 id
8. 后端 `TablesController.reserveCurrent()` 接收请求。
9. `TablesController` 从 `AuthContext` 取出当前登录用户 id。
10. `TablesController` 调用 `TablesService.reserveCurrentTable(tableId, currentUserId)`。
11. `TablesService` 组装出一个 `Tables` 对象并调用 `addOrder(tables)`。
12. `addOrder(tables)` 检查业务规则：
   - 当前用户是否已经占了别的桌
   - 目标餐桌是否存在
   - 目标餐桌是否已被别人占用
13. 检查通过后，把这张桌更新成：
   - `free = '否'`
   - `user_id = 当前用户 id`
14. 后端返回成功结果。
15. 小程序弹出“占桌成功”。
16. 小程序重新调用 `loadPageData()` 刷新页面。
17. 小程序跳转到 `/pages/menu/index` 点餐页。

---

## 10. 前端文件逐个精讲

## 11. `wechat-miniprogram/pages/table/index.js`

这是餐桌页本身，也是占桌功能的前端入口。

### 11.1 开头引入了什么

```javascript
const auth = require('../../utils/auth')
const { requestWithFallback } = require('../../utils/api')
```

意思是：

- `auth`
  - 用来检查登录状态
- `requestWithFallback`
  - 用来发请求

### 11.2 页面 `data` 里放了什么

```javascript
data: {
  user: null,
  loading: true,
  reserveLoadingId: null,
  currentTable: null,
  tables: [],
  availableCount: 0
}
```

逐个解释：

- `user`
  - 当前登录用户

- `loading`
  - 页面整体是否在加载

- `reserveLoadingId`
  - 当前正在占桌的餐桌 id
  - 用来控制按钮 loading 或禁用状态

- `currentTable`
  - 当前用户已经占的那张桌

- `tables`
  - 所有餐桌列表

- `availableCount`
  - 空闲餐桌数量

### 11.3 `onShow()`：页面显示时执行

```javascript
onShow() {
  const user = auth.requireLogin()
  if (!user) {
    return
  }

  this.setData({ user })
  this.loadPageData()
}
```

这段很关键。

#### 第一步：先检查是否已登录

```javascript
const user = auth.requireLogin()
```

`auth.requireLogin()` 的意思是：

- 如果没登录，就跳回登录页
- 如果已登录，就把本地保存的用户对象返回出来

#### 第二步：如果没拿到用户，直接结束

```javascript
if (!user) {
  return
}
```

#### 第三步：把用户放到页面数据里

```javascript
this.setData({ user })
```

#### 第四步：开始加载页面所需数据

```javascript
this.loadPageData()
```

### 11.4 `onPullDownRefresh()`：下拉刷新

```javascript
onPullDownRefresh() {
  this.loadPageData().finally(() => {
    wx.stopPullDownRefresh()
  })
}
```

意思是：

- 用户下拉页面时，重新加载餐桌数据
- 不管成功失败，最后都关闭下拉刷新动画

### 11.5 `loadPageData()`：加载页面数据

这是占桌页的核心加载函数。

```javascript
async loadPageData() {
  this.setData({ loading: true })

  try {
    ...
  } finally {
    this.setData({ loading: false })
  }
}
```

作用是：

- 开始前打开 loading
- 结束后关闭 loading

#### 第一部分：请求当前用户已占的桌

```javascript
const currentTableRes = await requestWithFallback(
  {
    url: '/tables/current'
  },
  {
    url: `/tables/selectByUserId/${this.data.user.id}`
  }
)
```

意思是：

- 优先请求新接口 `/tables/current`
- 如果需要，再退回旧接口 `/tables/selectByUserId/{userId}`

这两个接口的作用都是：

- 查“当前这个用户占了哪张桌”

区别在于：

- 新接口从 token 里识别当前用户
- 旧接口直接把用户 id 写在 URL 里

当前配置 `apiMode: 'modern'`，所以主要使用新接口。

#### 第二部分：请求全部餐桌列表

```javascript
const tableListRes = await requestWithFallback(
  {
    url: '/tables/selectAll'
  },
  {
    url: '/tables/selectAll'
  }
)
```

这里主接口和备用接口实际上是一样的。

作用就是：

- 读取所有餐桌

#### 第三部分：整理后端返回数据

```javascript
const tables = tableListRes.data || []
const currentTable = currentTableRes.data || null
const availableCount = tables.filter(item => item.free === '是').length
```

逐个解释：

- `tableListRes.data || []`
  - 如果后端返回了餐桌数组，就用它
  - 如果没返回，就退回空数组

- `currentTableRes.data || null`
  - 如果当前桌存在，就用它
  - 如果没有，就设成 `null`

- `tables.filter(...).length`
  - 统计空闲桌数量

#### 第四部分：把结果放进页面

```javascript
this.setData({
  currentTable,
  tables,
  availableCount
})
```

### 11.6 `reserveTable(event)`：点击占桌

这是占桌的核心动作函数。

#### 第一步：根据点击位置取出当前餐桌

```javascript
const index = event.currentTarget.dataset.index
const item = this.data.tables[index]
```

意思是：

- 先拿到被点击项在列表中的下标
- 再从 `tables` 数组里取出对应餐桌对象

#### 第二步：如果取不到，直接结束

```javascript
if (!item) {
  return
}
```

#### 第三步：记录当前正在操作的餐桌 id

```javascript
this.setData({
  reserveLoadingId: item.id
})
```

这样页面就能知道：

- 哪张桌正在提交占桌请求

#### 第四步：发占桌请求

```javascript
await requestWithFallback(
  {
    url: '/tables/current',
    method: 'POST',
    data: {
      id: item.id
    }
  },
  {
    url: '/tables/addOrder',
    method: 'PUT',
    data: Object.assign({}, item, {
      userId: this.data.user.id
    })
  }
)
```

这是整个占桌页最重要的一段。

##### 新接口

```javascript
{
  url: '/tables/current',
  method: 'POST',
  data: {
    id: item.id
  }
}
```

意思是：

- 请求后端占当前餐桌接口
- 只传一个 `id`
- 用户是谁，不由前端传，而是后端从 token 里识别

##### 旧接口

```javascript
{
  url: '/tables/addOrder',
  method: 'PUT',
  data: Object.assign({}, item, {
    userId: this.data.user.id
  })
}
```

意思是：

- 兼容旧逻辑时，前端把完整餐桌对象和 `userId` 一起发过去

所以你能看到新旧接口设计差异：

- 新接口更安全
  - 用户身份来自 token
- 旧接口更依赖前端传值

#### 第五步：成功后提示

```javascript
wx.showToast({
  title: '占桌成功',
  icon: 'success'
})
```

#### 第六步：刷新数据并跳转点餐页

```javascript
await this.loadPageData()
wx.switchTab({
  url: '/pages/menu/index'
})
```

这表示：

1. 先重新加载当前餐桌信息
2. 再跳转到点餐页

#### 第七步：无论成功失败，清除按钮 loading 状态

```javascript
finally {
  this.setData({
    reserveLoadingId: null
  })
}
```

### 11.7 `goMenu()`

```javascript
goMenu() {
  wx.switchTab({
    url: '/pages/menu/index'
  })
}
```

它和占桌本身关系不大，只是提供一个手动跳转到点餐页的功能。

---

## 12. `wechat-miniprogram/utils/auth.js`

虽然你没把它列进重点文件，但占桌页第一步就用到了它，所以必须讲。

### 12.1 `requireLogin()`

```javascript
function requireLogin() {
  const user = getUser()
  const token = getToken()
  const hasSession = config.apiMode === 'legacy' ? !!user : (!!user && !!token)
  if (!hasSession) {
    clearSession()
    wx.reLaunch({
      url: '/pages/login/index'
    })
    return null
  }
  return user
}
```

意思是：

- 先读取本地用户和 token
- 判断是否已经有完整登录状态
- 如果没有，就清空缓存并跳到登录页
- 如果有，就返回用户对象

所以占桌页为什么知道“当前是谁”？

前端第一步其实是从本地缓存里取用户。

---

## 13. `wechat-miniprogram/utils/request.js`

这个文件是小程序统一请求封装。

### 13.1 为什么占桌页不直接写 `wx.request()`

因为如果每个页面自己写请求，会重复处理很多事情：

- 拼接服务器地址
- 写请求头
- 带 token
- 处理错误提示
- 处理登录失效

所以项目把这些公共逻辑统一封装进 `request.js`。

### 13.2 `request(options)` 参数拆解

```javascript
const {
  url,
  method = 'GET',
  data,
  header = {},
  showError = true
} = options
```

意思是从调用方传进来的 `options` 对象里取出这些字段，并给默认值。

### 13.3 请求地址怎么拼出来

```javascript
url: `${config.baseUrl}${url}`,
```

如果：

- `config.baseUrl` 是 `http://127.0.0.1:9090`
- `url` 是 `/tables/current`

那么最终发出去的地址就是：

```text
http://127.0.0.1:9090/tables/current
```

### 13.4 占桌接口为什么能识别当前用户

关键在这里：

```javascript
header: Object.assign(
  {
    'Content-Type': 'application/json'
  },
  auth.getToken()
    ? {
        Authorization: `Bearer ${auth.getToken()}`
      }
    : {},
  header
)
```

意思是：

1. 默认请求头里先带上：

```javascript
{
  'Content-Type': 'application/json'
}
```

2. 如果本地有 token，再自动加上：

```javascript
{
  Authorization: `Bearer xxxxx`
}
```

所以占桌页在调 `/tables/current` 时，虽然只传了餐桌 id，但后端仍然知道是谁在占桌。

因为用户身份藏在 token 里，而且这里会自动放进请求头。

### 13.5 `success(res)` 做了什么

它先判断 HTTP 是否成功：

```javascript
if (res.statusCode < 200 || res.statusCode >= 300) {
  ...
  reject(res)
  return
}
```

然后再判断后端统一返回体里的业务状态码：

```javascript
if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'code')) {
  if (payload.code === '200') {
    resolve(payload)
    return
  }
  ...
}
```

这里的意思是：

- HTTP 成功，不等于业务成功
- 真正的业务是否成功，要看后端返回的 `code`

当前项目里：

- `code === '200'`
  - 业务成功
- 其他值
  - 业务失败

### 13.6 登录失效时会发生什么

```javascript
if (payload.msg && /登录|失效/.test(payload.msg)) {
  auth.clearSession()
  wx.reLaunch({
    url: '/pages/login/index'
  })
}
```

意思是：

- 如果后端提示“请先登录”或“登录已失效”
- 前端就自动清空登录态
- 然后跳回登录页

这和占桌功能直接相关，因为 `/tables/current` 是受保护接口。

### 13.7 `fail(error)` 是什么时候触发

如果根本没连上后端，比如：

- 后端没启动
- 地址错了
- 网络有问题

就会进 `fail(error)`。

---

## 14. `wechat-miniprogram/utils/api.js`

这是“请求策略层”。

### 14.1 `requestWithFallback()` 在做什么

它的作用是：

- 优先请求一个主接口
- 如果主接口不合适，再尝试备用接口

### 14.2 为什么占桌功能需要 fallback

因为这个项目保留了两套接口风格：

- 新接口
  - 例如 `/tables/current`
- 旧接口
  - 例如 `/tables/addOrder`
  - 例如 `/tables/selectByUserId/{userId}`

这通常是为了兼容旧版本代码。

### 14.3 `apiMode` 会影响什么

`config/index.js` 里当前配置是：

```javascript
apiMode: 'modern'
```

这表示：

- 直接优先使用新接口

如果是：

- `legacy`
  - 直接走旧接口
- `auto`
  - 先试新接口，必要时再回退旧接口

### 14.4 `isNotFoundError(error)` 是什么

它用来判断：

- 主接口失败是不是因为“找不到接口”

如果是 404，才适合考虑 fallback。

---

## 15. 后端文件逐个精讲

## 16. `springboot/src/main/java/com/example/controller/TablesController.java`

这是餐桌控制器。

控制器的职责可以概括成三步：

1. 接收请求
2. 调用业务层
3. 返回统一结果

### 16.1 类头部的意义

```java
@RestController
@RequestMapping("/tables")
public class TablesController {
```

意思是：

- 这是一个 REST 控制器
- 这个类里的所有接口都属于 `/tables` 路径下面

### 16.2 `@Resource TablesService tablesService;`

表示把 `TablesService` 注入进来，供控制器调用。

你可以理解成：

- 控制器自己不做复杂业务
- 它把事情交给 Service

### 16.3 `@GetMapping("/current")`

```java
@GetMapping("/current")
public Result current() {
    Tables tables = tablesService.selectCurrentTable(AuthContext.getCurrentUserId());
    return Result.success(tables);
}
```

这个接口的作用是：

- 查询“当前登录用户现在占的是哪张桌”

关键点在：

```java
AuthContext.getCurrentUserId()
```

意思是：

- 当前用户 id 不是前端手动传过来的
- 而是后端从 token 解析后放进 `AuthContext` 的

### 16.4 `@PostMapping("/current")`

```java
@PostMapping("/current")
public Result reserveCurrent(@RequestBody Tables tables) {
    Tables latestTable = tablesService.reserveCurrentTable(tables.getId(), AuthContext.getCurrentUserId());
    return Result.success(latestTable);
}
```

这就是新版本占桌接口。

前端只需要传：

```json
{
  "id": 3
}
```

后端会：

1. 从请求体中取 `tables.getId()`
2. 从 `AuthContext` 中取当前登录用户 id
3. 调用业务层占桌
4. 返回最新餐桌信息

### 16.5 `@DeleteMapping("/current")`

```java
@DeleteMapping("/current")
public Result removeCurrent() {
    tablesService.removeCurrentTable(AuthContext.getCurrentUserId());
    return Result.success();
}
```

它是“退桌”接口，不是占桌，但和占桌是同一组逻辑。

### 16.6 `@PutMapping("/addOrder")`

```java
@PutMapping("/addOrder")
public Result addOrder(@RequestBody Tables tables) {
    tablesService.addOrder(tables);
    return Result.success();
}
```

这是旧版占桌接口。

它的特点是：

- 前端直接把 `Tables` 对象发过来
- 其中包含 `userId`

也就是说旧版接口更依赖前端。

### 16.7 `@GetMapping("/selectByUserId/{userId}")`

```java
@GetMapping("/selectByUserId/{userId}")
public Result selectByUserId(@PathVariable Integer userId) {
    Tables tables = tablesService.selectByUserId(userId);
    return Result.success(tables);
}
```

这也是旧版接口风格。

它直接通过 URL 传用户 id。

### 16.8 `@GetMapping("/selectAll")`

```java
@GetMapping("/selectAll")
public Result selectAll(String name) {
    List<Tables> list = tablesService.selectAll(name);
    return Result.success(list);
}
```

作用是：

- 查询全部餐桌列表

---

## 17. `springboot/src/main/java/com/example/service/TablesService.java`

这里是占桌功能真正的核心。

### 17.1 `updateById(Tables tables)`

```java
public void updateById(Tables tables) {
    if ("是".equals(tables.getFree())) {
        tables.setUserId(null);
    }
    tablesMapper.updateById(tables);
}
```

我这里用 `'是'` 解释，是依据项目设计文档和业务含义做的判断。

它的意思是：

- 如果某张桌被改成“空闲”
- 那就顺手把 `userId` 清空

因为：

- 空闲桌不应该还挂着占用用户

### 17.2 `addOrder(Tables tables)`：旧版占桌核心逻辑

虽然名字叫 `addOrder`，但这里实际做的是“占桌”。

这个命名从工程角度看并不好，因为它容易让人误以为和订单有关。

代码逻辑是：

```java
public void addOrder(Tables tables) {
    Tables dbTables = tablesMapper.selectByUserId(tables.getUserId());
    if (dbTables != null && !dbTables.getId().equals(tables.getId())) {
        throw new CustomException("您已经预定了其他餐桌");
    }
    Tables currentTable = tablesMapper.selectById(tables.getId());
    if (currentTable == null) {
        throw new CustomException("餐桌不存在");
    }
    if (!"是".equals(currentTable.getFree()) && !Objects.equals(currentTable.getUserId(), tables.getUserId())) {
        throw new CustomException("该餐桌已被占用");
    }
    tables.setFree("否");
    this.updateById(tables);
}
```

逐步拆开讲。

#### 第一步：检查当前用户是否已经占了别的桌

```java
Tables dbTables = tablesMapper.selectByUserId(tables.getUserId());
if (dbTables != null && !dbTables.getId().equals(tables.getId())) {
    throw new CustomException("您已经预定了其他餐桌");
}
```

意思是：

1. 先查这个用户当前有没有已占桌
2. 如果有，并且不是这次点击的同一张桌
3. 就报错

这条规则非常重要：

- 一个用户同一时间只能占一张桌

#### 第二步：检查目标餐桌是否存在

```java
Tables currentTable = tablesMapper.selectById(tables.getId());
if (currentTable == null) {
    throw new CustomException("餐桌不存在");
}
```

如果数据库里根本没有这张桌，就不能占。

#### 第三步：检查目标餐桌是否已被别人占用

```java
if (!"是".equals(currentTable.getFree()) && !Objects.equals(currentTable.getUserId(), tables.getUserId())) {
    throw new CustomException("该餐桌已被占用");
}
```

这句比较难，是占桌逻辑里最值得你慢慢消化的一句。

可以拆成两部分：

第一部分：

```java
!"是".equals(currentTable.getFree())
```

意思是：

- 当前餐桌不是空闲状态

第二部分：

```java
!Objects.equals(currentTable.getUserId(), tables.getUserId())
```

意思是：

- 当前占桌的人不是这次请求的这个用户

两部分同时成立，才报错。

翻译成人话就是：

- 如果这张桌已经不是空闲了
- 而且占用它的人也不是你
- 那你不能占

#### 第四步：把桌状态改成已占用

```java
tables.setFree("否");
```

也就是：

- 空闲 -> 占用

#### 第五步：真正更新数据库

```java
this.updateById(tables);
```

### 17.3 `selectByUserId(Integer userId)`

```java
public Tables selectByUserId(Integer userId) {
    return tablesMapper.selectByUserId(userId);
}
```

作用很直接：

- 根据用户 id 查询该用户当前占用的餐桌

### 17.4 `selectCurrentTable(Integer currentUserId)`

```java
public Tables selectCurrentTable(Integer currentUserId) {
    if (currentUserId == null) {
        throw new CustomException("请先登录");
    }
    return tablesMapper.selectByUserId(currentUserId);
}
```

新接口为什么不需要前端自己传用户 id？

原因就是这里：

- 后端已经知道当前用户 id
- 直接拿它去查即可

### 17.5 `reserveCurrentTable(Integer tableId, Integer currentUserId)`

这就是新版占桌接口真正调用的业务方法。

```java
public Tables reserveCurrentTable(Integer tableId, Integer currentUserId) {
    if (currentUserId == null) {
        throw new CustomException("请先登录");
    }
    if (tableId == null) {
        throw new CustomException("请选择餐桌");
    }
    Tables tables = new Tables();
    tables.setId(tableId);
    tables.setUserId(currentUserId);
    this.addOrder(tables);
    return this.selectById(tableId);
}
```

逐句解释：

#### 检查是否已登录

```java
if (currentUserId == null) {
    throw new CustomException("请先登录");
}
```

#### 检查是否传了餐桌 id

```java
if (tableId == null) {
    throw new CustomException("请选择餐桌");
}
```

#### 组装一个最小 `Tables` 对象

```java
Tables tables = new Tables();
tables.setId(tableId);
tables.setUserId(currentUserId);
```

因为新版接口前端只传了 `id`，所以后端自己组装出占桌所需的最小数据：

- 餐桌 id
- 当前用户 id

#### 复用旧逻辑 `addOrder`

```java
this.addOrder(tables);
```

这一点很重要。

新版接口并没有重写一套完全独立的占桌规则，而是复用了旧版逻辑。

也就是说：

- 新旧接口虽然入口不同
- 最终业务规则是同一套

#### 返回最新餐桌数据

```java
return this.selectById(tableId);
```

### 17.6 `removeCurrentTable(Integer currentUserId)`

```java
public void removeCurrentTable(Integer currentUserId) {
    if (currentUserId == null) {
        throw new CustomException("请先登录");
    }
    Tables tables = tablesMapper.selectByUserId(currentUserId);
    if (tables == null) {
        return;
    }
    tablesMapper.removeOrder(tables.getId());
}
```

它是退桌逻辑。

这里你顺带能看懂一条反向规则：

- 如果当前用户没有占桌，退桌就直接返回

---

## 18. `springboot/src/main/java/com/example/mapper/TablesMapper.java`

这是 Mapper 接口层。

### 18.1 它定义了哪些方法

```java
void insert(Tables tables);
void deleteById(Integer id);
void updateById(Tables tables);
Tables selectById(Integer id);
List<Tables> selectAll(String name);
Tables selectByUserId(Integer userId);
void removeOrder(Integer id);
```

这些方法本身只是“声明功能”，具体 SQL 在：

- 注解里
- XML 里

### 18.2 `selectById(Integer id)`

```java
@Select("select * from tables where id = #{id}")
Tables selectById(Integer id);
```

意思是：

- 查某一张具体餐桌

### 18.3 `selectByUserId(Integer userId)`

```java
@Select("select * from tables where user_id = #{userId}")
Tables selectByUserId(Integer userId);
```

作用是：

- 查某个用户当前占的是哪张桌

这条 SQL 对占桌功能非常关键，因为它支撑了“一个用户只能占一张桌”的判断。

### 18.4 `removeOrder(Integer id)`

```java
@Update("update tables set user_id = null, free = '是' where id = #{id}")
void removeOrder(Integer id);
```

虽然名字叫 `removeOrder`，但业务上其实是：

- 把某张桌恢复为空闲

也就是：

- `user_id = null`
- `free = '是'`

---

## 19. `springboot/src/main/resources/mapper/TablesMapper.xml`

这是 XML 版 SQL。

### 19.1 `insert`

```xml
<insert id="insert">
    insert into tables (no, unit, free, user_id)
    values (#{no}, #{unit}, #{free}, #{userId})
</insert>
```

作用是：

- 新增餐桌

和占桌直接关系不大，但它说明了表里主要存的就是这些字段。

### 19.2 `updateById`

```xml
<update id="updateById">
    update tables
    <set>
        <if test="no != null">no = #{no},</if>
        <if test="unit != null">unit = #{unit},</if>
        <if test="free != null">free = #{free},</if>
        user_id = #{userId}
    </set>
    where id = #{id}
</update>
```

这是占桌功能里最核心的一条更新 SQL。

它的意思是：

- 更新指定 id 的餐桌
- 如果传了 `no`，就更新 `no`
- 如果传了 `unit`，就更新 `unit`
- 如果传了 `free`，就更新 `free`
- 无论如何都更新 `user_id`

所以占桌时，当 Service 传入：

- `id = 3`
- `userId = 8`
- `free = '否'`

最终数据库就会把第 3 张桌更新成：

- `user_id = 8`
- `free = '否'`

### 19.3 `selectAll`

```xml
<select id="selectAll" resultType="com.example.entity.Tables">
    select tables.*, user.name as userName from tables
    left join user
    on tables.user_id = user.id
    <where>
        <if test="no != null">
            tables.no like concat('%', #{no}, '%')
        </if>
    </where>
    order by id desc
</select>
```

这条 SQL 做了三件事：

1. 查询所有餐桌
2. 通过 `left join user` 把占桌用户的名字一起查出来
3. 按 id 倒序排列

### 19.4 `left join` 是什么

`left join` 可以先粗略理解成：

- 以 `tables` 表为主
- 尝试把 `user` 表里对应用户的信息拼过来

这样餐桌列表里就能显示：

- 当前是谁占了这张桌

### 19.5 为什么前端能拿到 `userName`

关键就在这里：

```sql
user.name as userName
```

意思是：

- 把 `user.name` 查询出来
- 结果字段名改叫 `userName`

它正好对应 `Tables.java` 里的：

```java
private String userName;
```

---

## 20. `springboot/src/main/java/com/example/common/AuthContext.java`

占桌新接口为什么不用前端传 `userId`？

原因和 `AuthContext` 有关。

### 20.1 它做什么

`AuthContext` 用 `ThreadLocal` 保存当前请求对应的用户信息。

你现在先理解成：

- 后端在处理这一次请求时，有一个临时位置专门记住“当前用户是谁”

### 20.2 占桌接口怎么用它

控制器里写的是：

```java
AuthContext.getCurrentUserId()
```

也就是说：

- 当前用户 id 是从后端认证上下文里读出来的
- 不是让前端自己随便传

这就是新版占桌接口比旧版更合理的地方。

---

## 21. `springboot/src/main/java/com/example/common/WebMvcConfig.java`

这个类决定哪些接口需要登录。

### 21.1 关键配置

```java
registry.addInterceptor(authInterceptor)
        .addPathPatterns(
                "/user/me",
                "/tables/current",
                "/orders",
                "/orders/my",
                "/orders/*/settle"
        );
```

意思是：

- `/tables/current`
  - 会走登录拦截器

所以：

- `GET /tables/current`
- `POST /tables/current`
- `DELETE /tables/current`

这几个接口都要求先登录。

### 21.2 为什么 `/tables/selectAll` 没有被拦截

因为它不在这个列表里。

这意味着：

- 当前设计里，查看全部餐桌列表不一定强制登录
- 但查询“当前我占的哪张桌”和“我要以当前用户身份占桌”必须登录

---

## 22. `springboot/src/main/java/com/example/common/Result.java`

后端统一返回这种结构：

```json
{
  "code": "200",
  "msg": "请求成功",
  "data": ...
}
```

所以前端请求工具里才会判断：

```javascript
if (payload.code === '200') {
  resolve(payload)
}
```

这就是为什么 `loadPageData()` 能从：

```javascript
tableListRes.data
```

里拿到真正的餐桌列表。

---

## 23. 用一次真实点击把整条占桌链路串起来

假设当前用户已经登录，用户 id 是 `8`。

假设他点击了餐桌：

```json
{
  "id": 3,
  "no": "A03",
  "unit": "4人桌",
  "free": "是"
}
```

### 23.1 页面打开时

`onShow()` 会执行：

1. `auth.requireLogin()`
2. 把本地用户放入 `data.user`
3. 调用 `loadPageData()`

### 23.2 `loadPageData()` 请求当前餐桌

前端发：

```http
GET /tables/current
Authorization: Bearer xxxxx
```

后端根据 token 知道当前用户 id 是 `8`，然后查这个用户是否已经占桌。

### 23.3 `loadPageData()` 请求全部餐桌

前端再发：

```http
GET /tables/selectAll
```

后端返回全部餐桌列表。

### 23.4 用户点击餐桌

`reserveTable(event)` 执行，取出当前被点击的餐桌对象。

### 23.5 前端发送占桌请求

当前是新接口模式，所以主要发送：

```http
POST /tables/current
Authorization: Bearer xxxxx
Content-Type: application/json

{
  "id": 3
}
```

注意：

- 用户 id 没有放在请求体里
- 因为它已经藏在 token 对应的登录身份里了

### 23.6 控制器接收请求

`TablesController.reserveCurrent()` 接收到请求后，会做两件事：

1. 从请求体里拿到 `tables.getId()`
2. 从 `AuthContext` 里拿到当前用户 id

然后调用：

```java
tablesService.reserveCurrentTable(3, 8)
```

### 23.7 Service 组装最小数据

`reserveCurrentTable(3, 8)` 会新建一个 `Tables` 对象：

```java
Tables tables = new Tables();
tables.setId(3);
tables.setUserId(8);
```

### 23.8 Service 复用占桌规则

接着执行：

```java
this.addOrder(tables);
```

然后依次检查：

1. 用户 8 是否已经占了别的桌
2. 餐桌 3 是否存在
3. 餐桌 3 是否已被别人占用

### 23.9 数据库更新

检查都通过后：

1. `tables.setFree("否")`
2. `tablesMapper.updateById(tables)`

于是 SQL 会把数据库里这张桌更新成：

- `free = '否'`
- `user_id = 8`

### 23.10 后端返回结果

控制器把成功结果包装成：

```json
{
  "code": "200",
  "msg": "请求成功",
  "data": {
    "id": 3,
    "no": "A03",
    "unit": "4人桌",
    "free": "否",
    "userId": 8
  }
}
```

### 23.11 前端处理成功结果

占桌页接着会：

1. 弹出“占桌成功”
2. 重新执行 `loadPageData()`
3. 跳转到点餐页

---

## 24. 占桌功能里的三条核心业务规则

你把这三条记住，占桌代码就不会迷路。

### 24.1 一个用户同一时间只能占一张桌

对应代码：

```java
Tables dbTables = tablesMapper.selectByUserId(tables.getUserId());
if (dbTables != null && !dbTables.getId().equals(tables.getId())) {
    throw new CustomException("您已经预定了其他餐桌");
}
```

### 24.2 一张桌同一时间只能被一个用户占用

对应代码：

```java
if (!"是".equals(currentTable.getFree()) && !Objects.equals(currentTable.getUserId(), tables.getUserId())) {
    throw new CustomException("该餐桌已被占用");
}
```

### 24.3 退桌后必须清空用户占用信息

对应代码：

```java
@Update("update tables set user_id = null, free = '是' where id = #{id}")
void removeOrder(Integer id);
```

---

## 25. 常见报错分别在哪一层发生

### 25.1 没登录就进餐桌页

发生位置：

- 前端 `auth.requireLogin()`

表现：

- 清空本地状态
- 跳回登录页

### 25.2 后端没启动

发生位置：

- 前端 `request.js` 的 `fail(error)`

表现：

- 提示网络连接失败

### 25.3 没传餐桌 id

发生位置：

- 后端 `TablesService.reserveCurrentTable()`

表现：

- 抛“请选择餐桌”

### 25.4 餐桌不存在

发生位置：

- 后端 `TablesService.addOrder()`

表现：

- 抛“餐桌不存在”

### 25.5 已经占了别的桌

发生位置：

- 后端 `TablesService.addOrder()`

表现：

- 抛“您已经预定了其他餐桌”

### 25.6 这张桌已经被别人占了

发生位置：

- 后端 `TablesService.addOrder()`

表现：

- 抛“该餐桌已被占用”

### 25.7 token 失效

发生位置：

- 后端拦截器和 token 校验逻辑
- 前端 `request.js` 做后续处理

表现：

- 清空登录态
- 跳回登录页

---

## 26. 占桌功能里几个最容易混淆的点

### 26.1 为什么新版占桌前端只传 `id`

因为当前用户身份不再由前端传，而是由 token 决定。

### 26.2 为什么 `TablesService.reserveCurrentTable()` 还会去调 `addOrder()`

因为项目在复用旧版已经写好的占桌规则。

新版只是换了入口，不是换了业务规则。

### 26.3 为什么方法叫 `addOrder()`，但做的不是下单

这是历史命名遗留问题。

它现在实际上做的是：

- 占桌

不是：

- 新增订单

### 26.4 为什么有的新接口路径是 `/current`

因为这些接口的设计思路是：

- 不让前端显式传用户 id
- 后端直接围绕“当前登录用户”处理业务

### 26.5 为什么 `selectAll` 不一定要求登录，但 `current` 要求登录

因为：

- 看所有餐桌列表是公共数据
- 查“当前我的餐桌”必须知道“我是谁”

---

## 27. 从学习顺序上，你应该怎么读这些代码

推荐这样读：

1. 先读 `pages/table/index.js`
   目标：搞清楚用户点击占桌按钮以后发生了什么

2. 再读 `utils/request.js`
   目标：搞清楚请求是怎么发出去的，token 是怎么自动带上的

3. 再读 `utils/api.js`
   目标：搞清楚为什么会有新旧两套接口

4. 再读 `TablesController.java`
   目标：搞清楚占桌接口是怎么接收参数的

5. 再读 `TablesService.java`
   目标：搞清楚真正的占桌业务规则

6. 再读 `TablesMapper.java`
   目标：搞清楚 Service 调用数据库时走的是哪些方法

7. 最后读 `TablesMapper.xml`
   目标：把占桌时真正执行的 SQL 对上

---

## 28. 你学完后至少应该能回答这几个问题

1. 餐桌页打开时，先执行哪个函数？
2. 页面是怎么知道当前用户有没有登录的？
3. 占桌前为什么要先请求 `/tables/current`？
4. 点击餐桌后，前端把什么数据发给后端？
5. 为什么前端只传餐桌 id，后端也知道是谁在占桌？
6. 占桌业务规则主要写在哪个类里？
7. “一个用户只能占一张桌”这条规则对应哪段代码？
8. “一张桌不能被别人重复占”这条规则对应哪段代码？
9. 数据库里真正把 `free` 和 `user_id` 改掉的是哪条 SQL？
10. 为什么项目里会同时存在 `/tables/current` 和 `/tables/addOrder`？

如果这 10 个问题你都能自己说清楚，说明你已经真正理解了这套占桌主链路。

---

## 29. 最后给零基础学习者的实用建议

你现在不要试图一次背下所有语法。更有效的做法是：

1. 先抓主流程

```text
进入餐桌页
-> 检查登录
-> 加载当前餐桌
-> 加载全部餐桌
-> 点击一张桌
-> POST /tables/current
-> TablesController.reserveCurrent
-> TablesService.reserveCurrentTable
-> addOrder
-> TablesMapper.updateById
-> 数据库更新 free 和 user_id
-> 前端刷新并跳转点餐页
```

2. 再逐个消化小语法

这一次只重点盯住这些就够了：

- JavaScript：`async`、`await`、`setData`、`Object.assign`
- Java：`@RequestBody`、`if`、`throw`、`new`
- MyBatis：`#{}`、`<if>`、`<set>`

3. 最后自己用中文写一遍

哪怕完全不用代码，只写中文流程，只要你能把这条链讲顺，就说明你开始真正看懂了。
