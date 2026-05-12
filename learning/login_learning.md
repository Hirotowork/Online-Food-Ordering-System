# canteen 登录功能学习资料

## 1. 这份文档是干什么的

这份文档专门解释 `canteen` 项目里的登录功能，面向完全零基础的学习者。

你当前重点看的文件是：

- `springboot/src/main/java/com/example/controller/WebController.java`
- `springboot/src/main/java/com/example/service/UserService.java`
- `springboot/src/main/java/com/example/common/TokenUtils.java`
- `springboot/src/main/java/com/example/common/AuthInterceptor.java`
- `springboot/src/main/java/com/example/common/WebMvcConfig.java`
- `wechat-miniprogram/pages/login/index.js`
- `wechat-miniprogram/utils/request.js`
- `wechat-miniprogram/utils/auth.js`

但是为了把登录真正讲明白，我还会顺带解释几个被这些文件依赖的类：

- `wechat-miniprogram/utils/api.js`
- `wechat-miniprogram/config/index.js`
- `springboot/src/main/java/com/example/entity/Account.java`
- `springboot/src/main/java/com/example/entity/User.java`
- `springboot/src/main/java/com/example/common/AuthContext.java`
- `springboot/src/main/java/com/example/common/Result.java`

## 2. 先用一句人话说清楚“登录”到底在做什么

登录的本质是：

1. 用户把账号和密码发给后端。
2. 后端去数据库里检查这个账号和密码对不对。
3. 如果对，就生成一个 `token`。
4. 小程序把这个 `token` 保存起来。
5. 以后访问“需要登录才能访问”的接口时，小程序把这个 `token` 一起带给后端。
6. 后端验证 `token` 没问题，就知道“你是谁”，然后允许你访问。

所以，登录功能其实不是只有一个“登录按钮”。
它是一整套链路：

- 登录页收集输入
- 发请求
- 后端校验
- 返回用户信息和 token
- 小程序保存登录状态
- 后续请求自动带 token
- 后端拦截器验证 token

## 3. 先建立一个整体地图

这 8 个文件分别负责什么：

### 小程序前端部分

- `pages/login/index.js`
  - 登录页本身
  - 负责收集用户名和密码
  - 点击按钮后调用接口
  - 登录成功后保存会话并跳转页面

- `utils/request.js`
  - 对 `wx.request` 做一层封装
  - 负责统一发请求
  - 如果本地已经有 token，就自动把 token 放进请求头
  - 统一处理成功、失败、登录失效

- `utils/auth.js`
  - 专门管理“登录状态”
  - 包括保存 token、读取 token、判断是否已登录、清空登录状态

### Java 后端部分

- `WebController.java`
  - 提供登录接口 `/auth/login`
  - 接收前端传来的用户名、密码、角色
  - 调用业务层去校验用户
  - 登录成功后生成 token 并返回

- `UserService.java`
  - 处理普通用户登录和注册的业务逻辑
  - 去数据库查用户
  - 比较密码

- `TokenUtils.java`
  - 负责创建 token
  - 负责解析 token
  - 负责判断 token 是否有效、是否过期

- `AuthInterceptor.java`
  - 是一个“请求拦截器”
  - 在真正进入控制器之前先检查 token
  - 通过 token 解析出当前用户 id 和角色

- `WebMvcConfig.java`
  - 配置哪些接口需要走拦截器
  - 也就是配置哪些接口需要先登录

## 4. 先补最基础的语法，不然后面会看不懂

这一部分很重要。你如果一点语法都不会，先把这一章看明白。

---

## 5. Java 基础语法速读

### 5.1 `class` 是什么

Java 里的类写法大概长这样：

```java
public class UserService {
}
```

意思是：定义了一个名字叫 `UserService` 的类。

你可以把“类”先粗略理解成“一个功能集合”或者“一个模板”。

### 5.2 `public`、`private` 是什么

- `public`
  - 公开的
  - 别的类可以访问

- `private`
  - 私有的
  - 只能在当前类内部使用

例如：

```java
public Result authLogin(@RequestBody Account account)
```

表示这是一个公开方法，别的地方可以调用它。

再例如：

```java
private Result doLogin(Account account)
```

表示这是一个私有方法，只给 `WebController` 自己内部使用。

### 5.3 方法是什么

方法就是“类里的一个功能”。

例如：

```java
public Account login(Account account)
```

可以拆成几部分理解：

- `public`
  - 访问修饰符，表示公开
- `Account`
  - 返回值类型，表示这个方法最后会返回一个 `Account` 类型的数据
- `login`
  - 方法名
- `(Account account)`
  - 参数列表，表示调用这个方法时，需要传入一个 `Account` 对象

### 5.4 对象是什么

例如：

```java
Account account
```

左边 `Account` 是类型，右边 `account` 是变量名。

你可以先把对象理解成“一个装着多个字段的数据包”。

在这个项目里，`Account` 里装着：

- `id`
- `username`
- `password`
- `name`
- `avatar`
- `role`
- `token`

### 5.5 `if` 是什么

```java
if (dbUser == null) {
    throw new CustomException("账号不存在");
}
```

意思是：

- 如果 `dbUser == null` 成立
- 就执行大括号里的代码

其中 `null` 表示“什么都没有”。

### 5.6 `throw` 是什么

```java
throw new CustomException("账号不存在");
```

意思是：主动抛出一个异常，告诉程序“这里出错了，不要继续正常往下走了”。

你可以把异常先理解成“程序报错的一种正式方式”。

### 5.7 `return` 是什么

```java
return Result.success(account);
```

意思是：把结果返回出去，然后当前方法结束。

### 5.8 `static` 是什么

例如 `TokenUtils` 里的：

```java
public static String createToken(Account account)
```

`static` 表示这个方法属于“类本身”，不用先 `new` 一个对象出来就可以直接调用。

所以你才能这样写：

```java
TokenUtils.createToken(account)
```

### 5.9 `Map<String, Object>` 是什么

这是一个“键值对容器”。

```java
Map<String, Object> payload = new HashMap<>();
```

意思是定义了一个 `Map`，里面：

- 键是 `String`
- 值是 `Object`

你可以把它理解成：

```text
{
  "id": 1,
  "role": "USER",
  "exp": 1711111111111
}
```

这种结构。

### 5.10 `record` 是什么

`TokenUtils` 里有：

```java
public record TokenPayload(Integer userId, String role) {
}
```

这是 Java 的一种简洁写法，用来表示“只装数据的小对象”。

它相当于一个很简化的类，专门装：

- `userId`
- `role`

---

## 6. JavaScript 基础语法速读

### 6.1 `const` 是什么

```javascript
const auth = require('../../utils/auth')
```

`const` 表示定义一个常量引用。

这里可以理解成：

- 创建了一个名字叫 `auth` 的变量
- 它引用了 `../../utils/auth` 这个模块导出的内容

### 6.2 `require()` 是什么

```javascript
const auth = require('../../utils/auth')
```

意思是：把别的文件里的功能引入当前文件。

### 6.3 `module.exports` 是什么

在 `auth.js` 结尾：

```javascript
module.exports = {
  getToken,
  getUser,
  saveSession,
  clearSession,
  isLoggedIn,
  requireLogin
}
```

意思是：把这些函数“导出去”，给别的文件使用。

### 6.4 对象字面量是什么

```javascript
{
  username: username.trim(),
  password,
  role: 'USER'
}
```

这是一个 JavaScript 对象。

里面是“键: 值”。

这段等价于：

```javascript
{
  username: username.trim(),
  password: password,
  role: 'USER'
}
```

因为 `password` 变量名和字段名一样，所以可以简写。

### 6.5 `Page({...})` 是什么

微信小程序页面通常这样写：

```javascript
Page({
  data: {},
  onShow() {},
  submitLogin() {}
})
```

你可以把它理解成：注册一个页面对象。

里面：

- `data`
  - 页面上的数据
- `onShow`
  - 页面显示时自动执行
- `submitLogin`
  - 自己定义的登录函数

### 6.6 `this.setData()` 是什么

```javascript
this.setData({
  loading: true
})
```

表示修改页面数据。

在小程序里，页面显示的数据不能直接随便改，通常要通过 `setData` 通知视图更新。

### 6.7 `async` 和 `await` 是什么

```javascript
async submitLogin() {
  const res = await requestWithFallback(...)
}
```

先不要把它想得太复杂。

你可以先理解成：

- `async`
  - 表示这个函数里会有“异步操作”
- `await`
  - 表示“等这个异步操作完成，再继续往下执行”

这里的异步操作就是网络请求。

### 6.8 `try/finally` 是什么

```javascript
try {
  // 可能成功，也可能失败的代码
} finally {
  // 不管成功还是失败，都会执行
}
```

在登录页里：

```javascript
try {
  ...
} finally {
  this.setData({ loading: false })
}
```

意思是：

- 请求开始前把 `loading` 设为 `true`
- 不管请求成功还是失败，最后都把 `loading` 设回 `false`

### 6.9 `return` 在 JavaScript 里也表示返回

```javascript
return
```

表示当前函数到这里结束，不再继续执行后面的代码。

### 6.10 `Promise` 是什么

`request.js` 里有：

```javascript
return new Promise((resolve, reject) => {
})
```

你可以把 `Promise` 理解成“未来会有结果的盒子”。

这个结果有两种：

- 成功：调用 `resolve(...)`
- 失败：调用 `reject(...)`

所以：

- `await request(...)`
  - 就是在等待这个盒子的最终结果

---

## 7. 先看数据长什么样

### 7.1 `Account.java`

`Account` 是一个基础账号对象，主要字段有：

- `id`
- `username`
- `password`
- `name`
- `avatar`
- `role`
- `token`

登录时，前端传给后端的就是一个类似 `Account` 的数据。

例如：

```json
{
  "username": "zhangsan",
  "password": "123456",
  "role": "USER"
}
```

### 7.2 `User.java`

`User` 继承了 `Account`，并且扩展了用户特有字段：

- `sex`
- `phone`
- `account`

注册普通用户时，后端使用的就是 `User`。

---

## 8. 登录功能完整流程图

下面是当前项目里“小程序用户登录”的真实链路：

1. 用户在 `wechat-miniprogram/pages/login/index.js` 输入账号和密码。
2. 点击登录按钮，执行 `submitLogin()`。
3. `submitLogin()` 调用 `requestWithFallback()` 发起请求。
4. `requestWithFallback()` 再调用 `utils/request.js` 里的 `request()`。
5. `request()` 用 `wx.request()` 向后端发 HTTP 请求。
6. 后端 `WebController` 的 `/auth/login` 接口接收到请求。
7. `WebController` 调用 `doLogin(account)`。
8. `doLogin(account)` 根据 `role` 判断应该走管理员登录还是用户登录。
9. 用户登录会调用 `UserService.login(account)`。
10. `UserService.login(account)` 去数据库按用户名查询用户。
11. 查到后比较密码是否一致。
12. 如果一致，返回数据库中的用户对象。
13. `WebController` 把密码清空，然后调用 `TokenUtils.createToken(account)` 生成 token。
14. 后端把“用户信息 + token”一起包装成 `Result.success(account)` 返回给小程序。
15. 小程序收到结果后，调用 `auth.saveSession(...)` 保存 token 和用户信息到本地缓存。
16. 之后访问需要登录的接口时，`utils/request.js` 会自动把 token 放进请求头。
17. 后端的 `AuthInterceptor` 会先拦截这些请求并验证 token。
18. token 合法，就把当前用户 id 和 role 放进 `AuthContext`，后续接口就知道“当前登录的人是谁”。

---

## 9. 逐个文件精讲

## 10. `wechat-miniprogram/pages/login/index.js`

这个文件是登录页的核心。

### 10.1 引入了什么

```javascript
const auth = require('../../utils/auth')
const { requestWithFallback } = require('../../utils/api')
const { normalizeAssetUrl } = require('../../utils/url')
```

意思分别是：

- `auth`
  - 管理登录状态
- `requestWithFallback`
  - 发请求，如果需要还可以自动切换备用接口
- `normalizeAssetUrl`
  - 处理头像图片地址

### 10.2 `data` 是页面状态

```javascript
data: {
  loading: false,
  mode: 'login',
  form: {
    username: '',
    password: '',
    confirmPassword: '',
    name: ''
  }
}
```

这一段表示页面维护了这些数据：

- `loading`
  - 是否正在请求中
- `mode`
  - 当前是登录模式还是注册模式
- `form`
  - 表单内容

### 10.3 `onShow()`：页面显示时检查是否已登录

```javascript
onShow() {
  if (auth.isLoggedIn()) {
    wx.switchTab({
      url: '/pages/table/index'
    })
  }
}
```

意思是：

- 只要这个登录页显示出来，就先检查本地是否已经有登录状态
- 如果已经登录，就不该继续停留在登录页
- 直接跳到餐桌页

这里的 `auth.isLoggedIn()` 来自 `auth.js`。

### 10.4 输入框函数为什么这么写

例如：

```javascript
onUsernameInput(event) {
  this.setData({
    'form.username': event.detail.value
  })
}
```

意思是：

- 输入框内容变化时，会触发这个函数
- `event.detail.value` 就是用户刚输入的内容
- 用 `this.setData()` 把页面里的 `form.username` 更新掉

`onPasswordInput`、`onConfirmPasswordInput`、`onNameInput` 都是同样原理。

### 10.5 `submitLogin()` 是真正的登录动作

这是登录的第一核心函数。

#### 第一步：从页面数据里取出账号密码

```javascript
const { username, password } = this.data.form
```

这是对象解构赋值。
等价于：

```javascript
const username = this.data.form.username
const password = this.data.form.password
```

#### 第二步：前端先做最基本校验

```javascript
if (!username.trim()) {
  ...
  return
}
```

这里的 `username.trim()` 表示：

- 去掉字符串前后的空格

`!username.trim()` 表示：

- 如果去掉空格后为空字符串，就认为没输入

然后用 `wx.showToast()` 给出提示，并 `return` 结束函数。

这一步只是前端体验优化，不是最终安全校验。
真正的安全校验仍然必须靠后端。

#### 第三步：设置 loading

```javascript
this.setData({ loading: true })
```

表示页面进入“请求中”状态。

#### 第四步：组织请求参数

```javascript
const payload = {
  username: username.trim(),
  password,
  role: 'USER'
}
```

这表示告诉后端：

- 登录账号是谁
- 密码是什么
- 角色是普通用户 `USER`

这里很关键。
因为后端会根据 `role` 决定走管理员登录还是用户登录。

#### 第五步：调用登录接口

```javascript
const res = await requestWithFallback(
  {
    url: '/auth/login',
    method: 'POST',
    data: payload
  },
  {
    url: '/login',
    method: 'POST',
    data: payload
  }
)
```

这段的意思是：

- 优先请求 `/auth/login`
- 如果需要，再退回到 `/login`

当前配置 `apiMode: 'modern'`，所以现在实际优先用的是新接口 `/auth/login`。

#### 第六步：处理后端返回的用户数据

```javascript
const user = Object.assign({}, res.data || {}, {
  avatar: normalizeAssetUrl(res.data && res.data.avatar)
})
delete user.password
```

拆开理解：

`Object.assign({}, res.data || {}, {...})`

意思是：

- 先创建一个空对象 `{}`
- 把 `res.data` 的内容拷贝进去
- 再把 `avatar` 字段覆盖成处理后的图片地址

`res.data || {}`

意思是：

- 如果 `res.data` 有值，就用它
- 如果没有，就退回空对象

`res.data && res.data.avatar`

意思是：

- 先判断 `res.data` 是否存在
- 存在才继续取 `res.data.avatar`

`delete user.password`

意思是：

- 把 `user` 对象里的 `password` 字段删掉

虽然理论上后端已经把密码设为 `null`，但前端这里仍然又做了一次保护。

#### 第七步：保存登录状态

```javascript
auth.saveSession({
  token: res.data && res.data.token ? res.data.token : '',
  user
})
```

意思是把两样东西保存到本地：

- `token`
- `user`

保存后，后面的页面和请求就可以使用这些信息。

#### 第八步：提示并跳转

```javascript
wx.showToast({
  title: '登录成功',
  icon: 'success'
})
```

然后：

```javascript
setTimeout(() => {
  wx.switchTab({
    url: '/pages/table/index'
  })
}, 200)
```

表示 200 毫秒后跳到餐桌页。

#### 第九步：不管成功失败都关闭 loading

```javascript
finally {
  this.setData({ loading: false })
}
```

### 10.6 `submitRegister()` 做了什么

注册函数和登录函数非常像，只是多了：

- 确认密码校验
- 调用 `/auth/register`

请求体里会带：

```javascript
{
  username: username.trim(),
  password,
  name: name.trim(),
  role: 'USER'
}
```

然后注册成功后：

- 提示“注册成功”
- 切回登录模式
- 清空密码和确认密码

---

## 11. `wechat-miniprogram/utils/auth.js`

这个文件只做一件事：管理登录状态。

### 11.1 `getToken()`

```javascript
function getToken() {
  return wx.getStorageSync(config.storageKeys.token) || ''
}
```

意思是：

- 从本地缓存里读取 token
- 读不到就返回空字符串

`wx.getStorageSync(...)` 是微信小程序提供的同步读取本地存储的 API。

### 11.2 `getUser()`

```javascript
function getUser() {
  return wx.getStorageSync(config.storageKeys.user) || null
}
```

意思是：

- 从本地缓存里读取用户信息
- 读不到就返回 `null`

### 11.3 `saveSession(payload)`

这是保存会话的核心函数。

```javascript
const hasToken = payload && Object.prototype.hasOwnProperty.call(payload, 'token')
let token = hasToken ? payload.token : getToken()
const user = payload && payload.user ? payload.user : null
```

一步一步解释：

`payload && ...`

意思是：

- 先确认 `payload` 存在
- 存在才继续往后判断

`Object.prototype.hasOwnProperty.call(payload, 'token')`

意思是：

- 严格判断 `payload` 自己身上是否真的有 `token` 这个属性

为什么不直接写 `payload.token`？

因为这里想区分两种情况：

1. 根本没传 `token` 这个字段
2. 传了 `token` 字段，但值可能是空字符串

接着：

```javascript
if (typeof token === 'string') {
  wx.setStorageSync(config.storageKeys.token, token)
}
if (user) {
  wx.setStorageSync(config.storageKeys.user, user)
}
```

意思是：

- 如果 `token` 是字符串，就写入本地缓存
- 如果 `user` 存在，就把用户信息写入本地缓存

### 11.4 `clearSession()`

```javascript
function clearSession() {
  wx.removeStorageSync(config.storageKeys.token)
  wx.removeStorageSync(config.storageKeys.user)
}
```

意思是清除本地登录状态。

一般在下面几种场景调用：

- 主动退出登录
- token 失效
- 未登录强制跳转登录页前

### 11.5 `isLoggedIn()`

```javascript
function isLoggedIn() {
  const user = getUser()
  const token = getToken()
  ...
  return !!user && !!token
}
```

这里的 `!!` 是 JavaScript 常见写法，用来把一个值强制转换成布尔值。

例如：

- `!!'abc'` 是 `true`
- `!!''` 是 `false`
- `!!null` 是 `false`

所以：

```javascript
return !!user && !!token
```

意思就是：

- 只有本地既有 `user` 又有 `token`
- 才算已登录

### 11.6 `requireLogin()`

这个函数的作用是：

- 如果没登录，就清空状态并跳回登录页
- 如果已登录，就返回当前用户信息

它适合在“必须登录才能进入的页面”里使用。

---

## 12. `wechat-miniprogram/utils/request.js`

这个文件是“统一请求工具”。

以后小程序请求后端，大多数都应该通过这里发。

### 12.1 为什么要封装请求

如果每个页面都自己写 `wx.request()`，会出现几个问题：

- 每个页面都要重复拼接 `baseUrl`
- 每个页面都要重复写 token
- 每个页面都要重复处理报错
- 每个页面都要重复处理“登录失效”

封装后，这些公共逻辑都集中到一个地方。

### 12.2 `request(options)` 的参数拆解

```javascript
const {
  url,
  method = 'GET',
  data,
  header = {},
  showError = true
} = options
```

这是对象解构 + 默认值。

意思是从 `options` 里取出这些字段：

- `url`
- `method`，默认值是 `'GET'`
- `data`
- `header`，默认值是空对象
- `showError`，默认值是 `true`

### 12.3 为什么返回 `new Promise(...)`

因为 `wx.request()` 本身是回调风格，而页面代码想用 `await`。

所以这里把回调风格包装成 `Promise` 风格。

这样外面就能写：

```javascript
const res = await request(...)
```

### 12.4 自动拼接完整请求地址

```javascript
url: `${config.baseUrl}${url}`,
```

这是模板字符串。

例如：

- `config.baseUrl` 是 `http://127.0.0.1:9090`
- `url` 是 `/auth/login`

拼起来就是：

```text
http://127.0.0.1:9090/auth/login
```

### 12.5 自动带上 token

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

这段是整个登录体系里非常关键的一段。

意思是：

1. 先准备一个默认请求头

```javascript
{
  'Content-Type': 'application/json'
}
```

2. 如果本地存在 token，再额外加上：

```javascript
{
  Authorization: `Bearer ${token}`
}
```

3. 再把调用方自己传入的 `header` 合并进来

这样，后续请求就能自动带 token。

### 12.6 `success(res)`：HTTP 成功不代表业务成功

这里要理解一个重要概念：

- HTTP 成功
  - 表示网络层面请求到了服务器
- 业务成功
  - 表示服务器处理结果是成功的

代码先看 HTTP 状态码：

```javascript
if (res.statusCode < 200 || res.statusCode >= 300) {
  ...
  reject(res)
  return
}
```

意思是如果不是 2xx，就当成失败。

然后再看后端返回体里的 `code`：

```javascript
if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'code')) {
  if (payload.code === '200') {
    resolve(payload)
    return
  }
  ...
}
```

后端统一返回 `Result`：

```json
{
  "code": "200",
  "msg": "请求成功",
  "data": {...}
}
```

所以这里的规则是：

- `payload.code === '200'`
  - 业务成功，调用 `resolve(payload)`
- 否则
  - 业务失败，调用 `reject(payload)`

### 12.7 自动处理登录失效

```javascript
if (payload.msg && /登录|失效/.test(payload.msg)) {
  auth.clearSession()
  wx.reLaunch({
    url: '/pages/login/index'
  })
}
```

这段意思是：

- 如果后端返回的错误消息里出现“登录”或“失效”
- 就认为登录状态已经无效
- 清掉本地登录信息
- 强制回到登录页

### 12.8 `fail(error)`：网络失败

如果连服务器都没请求到，比如：

- 后端没启动
- 地址写错
- 网络断了

就会进入 `fail(error)`。

---

## 13. `wechat-miniprogram/utils/api.js`

这个文件是“请求策略层”。

### 13.1 `requestWithFallback()` 是什么

它的作用是：

- 先尝试主接口
- 如果主接口不适合，再切换备用接口

### 13.2 为什么登录要有 fallback

因为这个项目同时保留了：

- 新接口 `/auth/login`
- 旧接口 `/login`

这通常是为了兼容旧版本调用方式。

### 13.3 当前项目实际会走哪个接口

`wechat-miniprogram/config/index.js` 里配置的是：

```javascript
apiMode: 'modern'
```

这表示：

- 直接走新接口
- 不优先走旧接口

所以当前登录页主要使用的是 `/auth/login`。

---

## 14. `springboot/src/main/java/com/example/controller/WebController.java`

这是登录入口控制器。

控制器可以先粗略理解成：

- 专门接收前端请求
- 调用业务逻辑
- 再把结果返回给前端

### 14.1 `@RestController` 是什么

```java
@RestController
public class WebController {
}
```

表示这是一个 REST 风格控制器。

你现在先这样理解就够了：

- 这个类里的方法可以接收 HTTP 请求
- 方法返回的数据会直接变成接口响应内容

### 14.2 `@Resource` 是什么

```java
@Resource
AdminService adminService;

@Resource
UserService userService;
```

表示把别的服务注入进来，供当前类使用。

你先把它理解成：

- `WebController` 需要调用 `AdminService`
- 也需要调用 `UserService`
- Spring 会自动把对象准备好

### 14.3 `@PostMapping("/auth/login")`

```java
@PostMapping("/auth/login")
public Result authLogin(@RequestBody Account account) {
    return doLogin(account);
}
```

可以拆成这样理解：

- `@PostMapping("/auth/login")`
  - 表示这个方法处理 `POST /auth/login`
- `@RequestBody Account account`
  - 表示把前端发来的 JSON 请求体，自动转换成一个 `Account` 对象
- `return doLogin(account);`
  - 表示真正的登录逻辑交给 `doLogin`

### 14.4 为什么还有 `/login`

```java
@PostMapping("/login")
public Result login(@RequestBody Account account) {
    if (StrUtil.isBlank(account.getRole())) {
        account.setRole(RoleEnum.ADMIN.name());
    }
    return doLogin(account);
}
```

旧接口 `/login` 的特点是：

- 如果没传 `role`
- 默认按管理员登录处理

而小程序登录时会明确传：

```json
{
  "role": "USER"
}
```

所以小程序不会误走管理员登录。

### 14.5 `doLogin(Account account)` 是整个后端登录核心

```java
private Result doLogin(Account account) {
    if (RoleEnum.ADMIN.name().equals(account.getRole())) {
        account = adminService.login(account);
    } else if (RoleEnum.USER.name().equals(account.getRole())) {
        account = userService.login(account);
    } else {
        return Result.error("您的参数输入错误");
    }
    account.setPassword(null);
    account.setToken(TokenUtils.createToken(account));
    return Result.success(account);
}
```

逐句解释：

#### `RoleEnum.ADMIN.name().equals(account.getRole())`

意思是：

- 如果前端传来的角色是 `ADMIN`
- 就走管理员登录逻辑

#### `account = userService.login(account);`

意思是：

- 如果角色是 `USER`
- 调用 `UserService.login(account)`

这里返回的是数据库中查到的完整用户对象。

#### `account.setPassword(null);`

意思是：

- 登录成功后，不把密码返回给前端

这是一个基本安全处理。

#### `account.setToken(TokenUtils.createToken(account));`

意思是：

- 使用当前登录成功的账号信息生成 token
- 再把 token 放进返回对象里

#### `return Result.success(account);`

意思是：

- 返回一个统一格式的成功响应

最终前端收到的响应大致像这样：

```json
{
  "code": "200",
  "msg": "请求成功",
  "data": {
    "id": 1,
    "username": "zhangsan",
    "password": null,
    "name": "张三",
    "role": "USER",
    "token": "xxxxxxxx"
  }
}
```

### 14.6 `authRegister()` 和 `doRegister()`

注册接口是：

```java
@PostMapping("/auth/register")
public Result authRegister(@RequestBody User user) {
    return doRegister(user);
}
```

然后：

```java
private Result doRegister(User user) {
    if (RoleEnum.USER.name().equals(user.getRole())) {
        userService.register(user);
    } else {
        return Result.error("您的参数输入错误");
    }
    return Result.success();
}
```

意思是：

- 这里只允许注册普通用户
- 如果角色不是 `USER`，就报错

---

## 15. `springboot/src/main/java/com/example/service/UserService.java`

这是普通用户的业务逻辑层。

### 15.1 `@Service` 是什么

```java
@Service
public class UserService {
}
```

表示这是一个业务服务类。

你可以把它理解成：

- 控制器负责“接请求、回响应”
- Service 负责“认真做业务逻辑”

### 15.2 `login(Account account)` 做了什么

```java
public Account login(Account account) {
    String username = account.getUsername();
    User dbUser = userMapper.selectByUsername(username);
    if (dbUser == null) {
        throw new CustomException("账号不存在");
    }
    if (!dbUser.getPassword().equals(account.getPassword())) {
        throw new CustomException("账号或者密码错误");
    }
    return dbUser;
}
```

这个方法非常关键。

#### 第一步：取出前端传来的用户名

```java
String username = account.getUsername();
```

#### 第二步：按用户名查数据库

```java
User dbUser = userMapper.selectByUsername(username);
```

意思是去数据库里找这个用户名对应的用户。

如果数据库没有，就会得到 `null`。

#### 第三步：如果查不到用户，抛异常

```java
if (dbUser == null) {
    throw new CustomException("账号不存在");
}
```

#### 第四步：如果密码不一样，也抛异常

```java
if (!dbUser.getPassword().equals(account.getPassword())) {
    throw new CustomException("账号或者密码错误");
}
```

这里是明文比较。
意思是数据库里存什么密码，就直接和用户输入的密码逐字比较。

这也是当前项目一个明显的工程缺点：

- 没有加密存储密码

#### 第五步：登录成功，返回数据库用户对象

```java
return dbUser;
```

注意，这里本身还没有生成 token。
token 是回到 `WebController.doLogin()` 里才生成的。

### 15.3 `register(User user)` 做了什么

这个方法是注册逻辑。

```java
User dbUser = userMapper.selectByUsername(user.getUsername());
if (dbUser != null) {
    throw new CustomException("账号已存在");
}
```

先检查用户名是否重复。

然后：

```java
if (ObjectUtil.isEmpty(user.getPassword())) {
    throw new CustomException("密码不能为空");
}
```

检查密码不能为空。

再然后：

```java
if (ObjectUtil.isEmpty(user.getName())) {
    user.setName(user.getUsername());
}
```

如果没填昵称，就默认把用户名当昵称。

最后：

```java
user.setRole(RoleEnum.USER.name());
userMapper.insert(user);
```

意思是：

- 强制把角色设成 `USER`
- 插入数据库

### 15.4 为什么登录功能里还会用到 `selectCurrentUser()`

登录成功后，后面的“我的资料”功能会依赖当前登录用户。

```java
public User selectCurrentUser(Integer currentUserId) {
    if (currentUserId == null) {
        throw new CustomException("请先登录");
    }
    User user = userMapper.selectById(currentUserId);
    if (user == null) {
        throw new CustomException("用户不存在");
    }
    user.setPassword(null);
    return user;
}
```

这里说明一件事：

- 登录不是目的
- 登录是为了让后续接口知道“当前用户是谁”

---

## 16. `springboot/src/main/java/com/example/common/TokenUtils.java`

这个类专门处理 token。

### 16.1 token 是什么

你可以先把 token 理解成：

- 服务器发给客户端的一张“临时通行证”

后面客户端每次带着它来，服务器就知道：

- 你之前登录过
- 你是谁
- 你的身份是什么

### 16.2 密钥 `TOKEN_KEY`

```java
private static final byte[] TOKEN_KEY = "canteen-miniapp-jwt-secret".getBytes(StandardCharsets.UTF_8);
```

这是生成和验证 token 时使用的密钥。

`private static final`

分别表示：

- `private`
  - 只在当前类里使用
- `static`
  - 属于类本身
- `final`
  - 不能再改

### 16.3 过期时间 `EXPIRE_MILLIS`

```java
private static final long EXPIRE_MILLIS = 7L * 24 * 60 * 60 * 1000;
```

这是 7 天的毫秒数。

拆开算：

- `24` 小时
- `60` 分钟
- `60` 秒
- `1000` 毫秒

`7L` 里的 `L` 表示这是 `long` 类型。

### 16.4 `createToken(Account account)`

```java
public static String createToken(Account account) {
    Map<String, Object> payload = new HashMap<>();
    payload.put("id", account.getId());
    payload.put("role", account.getRole());
    payload.put("exp", System.currentTimeMillis() + EXPIRE_MILLIS);
    return JWTUtil.createToken(payload, TOKEN_KEY);
}
```

这个方法做了三件事：

1. 创建 token 里的载荷 `payload`
2. 往里面放入用户信息
3. 调用 JWT 工具生成 token 字符串

#### payload 里放了什么

- `id`
  - 当前用户 id
- `role`
  - 当前用户角色
- `exp`
  - 过期时间

也就是说，这个 token 至少记住了：

- 你是谁
- 你是什么角色
- 什么时候过期

### 16.5 `parseToken(String token)`

```java
public static TokenPayload parseToken(String token) {
    if (StrUtil.isBlank(token)) {
        throw new CustomException("请先登录");
    }

    JWT jwt = JWTUtil.parseToken(token).setKey(TOKEN_KEY);
    if (!jwt.verify() || !jwt.validate(0)) {
        throw new CustomException("登录已失效，请重新登录");
    }

    Integer userId = Convert.toInt(jwt.getPayload("id"));
    String role = Convert.toStr(jwt.getPayload("role"));
    if (userId == null || StrUtil.isBlank(role)) {
        throw new CustomException("登录信息无效，请重新登录");
    }
    return new TokenPayload(userId, role);
}
```

这个方法是验证 token 的核心。

#### 第一步：token 不能为空

如果前端根本没传 token，就直接报“请先登录”。

#### 第二步：解析 token 并设置密钥

```java
JWT jwt = JWTUtil.parseToken(token).setKey(TOKEN_KEY);
```

意思是：

- 把 token 字符串解析成 JWT 对象
- 告诉它验证时使用哪个密钥

#### 第三步：验证 token 是否合法、是否过期

```java
if (!jwt.verify() || !jwt.validate(0)) {
    throw new CustomException("登录已失效，请重新登录");
}
```

这里分两层：

- `jwt.verify()`
  - 验证签名是否正确
- `jwt.validate(0)`
  - 验证是否过期

如果任意一项不通过，都视为 token 失效。

#### 第四步：从 token 中取出用户 id 和角色

```java
Integer userId = Convert.toInt(jwt.getPayload("id"));
String role = Convert.toStr(jwt.getPayload("role"));
```

#### 第五步：再检查字段是否完整

如果 `userId` 或 `role` 取不到，也认为 token 无效。

#### 第六步：返回一个 `TokenPayload`

```java
return new TokenPayload(userId, role);
```

这就把 token 中的核心身份信息整理出来了。

---

## 17. `springboot/src/main/java/com/example/common/AuthInterceptor.java`

这个类是“登录校验门卫”。

### 17.1 什么是拦截器

拦截器的意思是：

- 请求还没真正进入控制器前
- 先被它检查一遍

如果检查不通过，就不让你继续往后走。

### 17.2 `preHandle(...)`

```java
public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
```

你现在只要记住：

- 这是每次请求到来时，会先执行的方法

### 17.3 为什么先放过 `OPTIONS`

```java
if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
    return true;
}
```

这是为了处理跨域预检请求。

零基础阶段你先只记住结论：

- `OPTIONS` 不是业务请求本身
- 通常应该直接放行

### 17.4 从请求头中取 token

```java
String authorization = request.getHeader("Authorization");
String token = authorization;
if (authorization != null && authorization.startsWith("Bearer ")) {
    token = authorization.substring(7);
}
if ((token == null || token.isBlank()) && request.getHeader("token") != null) {
    token = request.getHeader("token");
}
```

这段非常重要。

它的意思是：

1. 先尝试读取 `Authorization` 请求头
2. 如果格式是：

```text
Bearer xxxxxxx
```

就把前面的 `Bearer ` 去掉，只保留真正的 token
3. 如果上面没拿到，再尝试读取旧格式请求头 `token`

这说明这个项目兼容两种 token 传法：

- `Authorization: Bearer xxx`
- `token: xxx`

而小程序当前使用的是第一种。

### 17.5 调用 `TokenUtils.parseToken(token)`

```java
TokenUtils.TokenPayload payload = TokenUtils.parseToken(token);
```

如果 token 有问题，这里就会直接抛异常。

如果没问题，就会拿到：

- `userId`
- `role`

### 17.6 把当前登录用户放入 `AuthContext`

```java
AuthContext.setCurrentUser(payload.userId(), payload.role());
```

意思是：

- 把这次请求对应的当前用户信息保存起来

这样后面的控制器或服务层就可以通过 `AuthContext` 取到当前登录用户。

### 17.7 `afterCompletion(...)`

```java
public void afterCompletion(...) {
    AuthContext.clear();
}
```

意思是：

- 这次请求结束后，把当前线程里的用户信息清掉

为什么要清？

因为服务器会处理很多请求。
如果不清理，可能把上一次请求的用户信息错误地留到下一次请求里。

---

## 18. `springboot/src/main/java/com/example/common/AuthContext.java`

虽然你没有点名这个文件，但它和登录态识别直接相关。

### 18.1 它是做什么的

它用 `ThreadLocal` 保存当前请求对应的用户信息。

```java
private static final ThreadLocal<Integer> CURRENT_USER_ID = new ThreadLocal<>();
private static final ThreadLocal<String> CURRENT_ROLE = new ThreadLocal<>();
```

你现在先把 `ThreadLocal` 理解成：

- 给“当前这次请求”单独存一份数据的地方

### 18.2 为什么登录后别的接口能知道“当前用户是谁”

原因就是：

1. 拦截器解析 token
2. 拿到 `userId` 和 `role`
3. 存进 `AuthContext`
4. 后续代码通过 `AuthContext.getCurrentUserId()` 读取

---

## 19. `springboot/src/main/java/com/example/common/WebMvcConfig.java`

这个类决定“哪些接口需要登录校验”。

### 19.1 核心代码

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

- 对这些路径启用 `authInterceptor`

也就是这些接口访问前，都会先检查 token。

### 19.2 为什么登录接口本身没有被拦截

因为登录接口如果也要求先登录，就会变成死循环。

逻辑上必须是：

- 先允许你访问登录接口
- 登录成功拿到 token
- 之后再用 token 访问受保护接口

---

## 20. `springboot/src/main/java/com/example/common/Result.java`

后端接口统一返回这个格式：

```json
{
  "code": "200",
  "msg": "请求成功",
  "data": {}
}
```

### 20.1 为什么前端要判断 `payload.code === '200'`

因为这个项目不是直接把“业务成功与否”放在 HTTP 状态码里，而是额外放在 `Result.code` 里。

所以前端 `request.js` 里要这样写：

```javascript
if (payload.code === '200') {
  resolve(payload)
}
```

---

## 21. 用一次真实登录把全部代码串起来

假设用户输入：

- 用户名：`zhangsan`
- 密码：`123456`

### 21.1 前端发出的请求

小程序登录页最终会向后端发送：

```http
POST /auth/login
Content-Type: application/json

{
  "username": "zhangsan",
  "password": "123456",
  "role": "USER"
}
```

### 21.2 后端控制器接收

`WebController.authLogin(@RequestBody Account account)` 接收到请求。

Spring 会自动把 JSON 转成：

```java
Account account
```

其中：

- `account.getUsername()` 是 `zhangsan`
- `account.getPassword()` 是 `123456`
- `account.getRole()` 是 `USER`

### 21.3 后端业务层校验

`WebController.doLogin(account)` 发现角色是 `USER`，于是调用：

```java
userService.login(account)
```

接着：

1. 去数据库查 `zhangsan`
2. 如果没查到，报“账号不存在”
3. 如果查到了但密码不一致，报“账号或者密码错误”
4. 如果都没问题，返回数据库用户对象

### 21.4 后端生成 token

登录成功后：

```java
account.setPassword(null);
account.setToken(TokenUtils.createToken(account));
```

于是响应里会带一个 token。

### 21.5 前端保存登录状态

小程序拿到响应后：

```javascript
auth.saveSession({
  token: res.data.token,
  user
})
```

于是 token 和 user 都被保存到本地缓存。

### 21.6 后续访问“我的订单”

当小程序再去请求 `/orders/my` 时，`utils/request.js` 会自动加上：

```http
Authorization: Bearer xxxxxxx
```

### 21.7 后端拦截器验证 token

因为 `/orders/my` 被 `WebMvcConfig` 配置成需要拦截，所以：

1. `AuthInterceptor.preHandle()` 先执行
2. 取出请求头中的 token
3. 调用 `TokenUtils.parseToken(token)`
4. 解析出 `userId` 和 `role`
5. 放入 `AuthContext`

这时候后端就知道：

- 当前是谁在请求

---

## 22. 常见报错分别在哪一层发生

### 22.1 用户名没填

发生位置：

- 前端 `pages/login/index.js`

表现：

- 不发请求
- 直接弹 toast 提示

### 22.2 后端没启动

发生位置：

- 前端 `utils/request.js` 的 `fail(error)`

表现：

- 提示“网络连接失败”

### 22.3 用户不存在

发生位置：

- 后端 `UserService.login()`

表现：

- 抛 `CustomException`
- 前端收到业务失败消息并弹提示

### 22.4 密码错误

发生位置：

- 后端 `UserService.login()`

表现：

- 抛 `CustomException("账号或者密码错误")`

### 22.5 token 过期或伪造

发生位置：

- 后端 `TokenUtils.parseToken()`

表现：

- 返回“登录已失效，请重新登录”
- 前端 `request.js` 识别到后会清空本地会话并跳转登录页

---

## 23. 这个登录实现里你必须知道的几个关键点

### 23.1 登录成功不是只返回“成功”两个字

它还返回了：

- 用户信息
- token

否则前端没法保存登录状态。

### 23.2 token 不是在 `UserService` 里生成的

很多初学者容易混淆。

当前项目里：

- `UserService`
  - 负责“账号密码对不对”
- `WebController`
  - 负责“登录成功后生成 token 并返回”

### 23.3 后续请求为什么不用再输入密码

因为后续靠的是 token，不是每次都重新传账号密码。

### 23.4 为什么 `request.js` 很重要

因为“自动带 token”这一件事，就是它完成的。

如果没有这层封装，你每个页面都得手动写请求头。

### 23.5 为什么 `WebMvcConfig` 很重要

因为不是所有接口都要登录。

它决定了：

- 哪些接口是公开的
- 哪些接口必须先登录

---

## 24. 从学习顺序上，你应该怎么读这些代码

推荐顺序如下：

1. 先读 `wechat-miniprogram/pages/login/index.js`
   目标：知道“用户点击登录按钮之后发生了什么”

2. 再读 `wechat-miniprogram/utils/auth.js`
   目标：知道“登录成功后数据保存到哪里”

3. 再读 `wechat-miniprogram/utils/request.js`
   目标：知道“后续请求怎么自动带 token”

4. 再读 `WebController.java`
   目标：知道“后端登录接口如何接收请求并返回 token”

5. 再读 `UserService.java`
   目标：知道“账号密码是怎么校验的”

6. 再读 `TokenUtils.java`
   目标：知道“token 是怎么生成和验证的”

7. 再读 `AuthInterceptor.java`
   目标：知道“后端怎么识别当前用户”

8. 最后读 `WebMvcConfig.java`
   目标：知道“哪些接口会强制登录”

---

## 25. 给零基础学习者的术语对照表

- 登录接口
  - 专门接收账号密码的后端地址

- 请求体
  - 发给后端的数据正文，当前项目里通常是 JSON

- 响应
  - 后端返回给前端的数据

- 控制器 Controller
  - 接收请求，调用业务逻辑，返回结果

- 服务层 Service
  - 写核心业务逻辑

- token
  - 登录成功后的身份凭证

- 拦截器 Interceptor
  - 请求进入控制器之前的检查器

- 本地缓存 Storage
  - 保存在小程序本地的数据

- 业务成功
  - 服务器逻辑处理成功

- HTTP 成功
  - 网络请求从协议层面成功到达服务器

---

## 26. 当前登录实现的局限

作为学习时的补充，你也要知道这套代码还不算生产级。

### 26.1 密码是明文比较

当前代码：

```java
dbUser.getPassword().equals(account.getPassword())
```

这表示数据库密码没有做哈希加密。

### 26.2 管理端和用户端登录接口还带有兼容旧逻辑的痕迹

例如：

- `/login`
- `/auth/login`

两个接口都在

### 26.3 管理端鉴权没有像小程序这样完整闭环

当前受拦截器保护的路径主要是小程序新接口。

---

## 27. 你学完这份文档后，至少应该能回答这几个问题

1. 登录按钮点下去后，前端调用的是哪个函数？
2. 小程序把账号密码发到哪个接口？
3. 后端在哪个类里校验用户名和密码？
4. token 是在哪个类里生成的？
5. token 保存到了哪里？
6. 后续请求是谁负责自动携带 token 的？
7. 后端是谁负责校验 token 的？
8. 哪些接口需要先登录，在哪里配置？

如果这 8 个问题你都能答出来，说明你已经真正理解了这个项目的登录主链路。

---

## 28. 最后给你一个非常实用的学习建议

你不要试图一次把所有语法都背下来。
更有效的方法是：

1. 先抓主流程
   也就是“登录页 -> 请求工具 -> 控制器 -> Service -> Token -> 拦截器”

2. 再回头一个个啃语法
   比如这次只盯住 `if`、`return`、`async/await`

3. 最后自己手写一遍流程图
   用中文都可以

比如你可以自己写成这样：

```text
用户输入账号密码
-> submitLogin
-> requestWithFallback
-> request
-> /auth/login
-> WebController.doLogin
-> UserService.login
-> TokenUtils.createToken
-> 返回 token
-> auth.saveSession
-> 后续请求自动带 token
-> AuthInterceptor 校验 token
```

当你能用自己的话把这条链讲出来，才算真的学会。
