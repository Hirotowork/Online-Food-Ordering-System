# canteen 下单功能学习资料

## 1. 这份文档是做什么的

这份文档专门解释 `canteen` 项目里的“下单功能”。

你指定要看的文件是：

- `wechat-miniprogram/pages/menu/index.js`
- `springboot/src/main/java/com/example/controller/OrdersController.java`
- `springboot/src/main/java/com/example/service/OrdersService.java`
- `springboot/src/main/java/com/example/entity/Orders.java`
- `springboot/src/main/java/com/example/mapper/OrdersMapper.java`
- `springboot/src/main/resources/mapper/OrdersMapper.xml`

为了把这条链讲完整，我还会顺带解释几个直接依赖的文件：

- `wechat-miniprogram/utils/request.js`
- `wechat-miniprogram/utils/api.js`
- `wechat-miniprogram/utils/auth.js`
- `springboot/src/main/java/com/example/common/AuthContext.java`
- `springboot/src/main/java/com/example/common/Result.java`
- `springboot/src/main/java/com/example/common/WebMvcConfig.java`
- `springboot/src/main/java/com/example/common/RoleEnum.java`
- `springboot/src/main/java/com/example/entity/User.java`
- `springboot/src/main/java/com/example/mapper/UserMapper.java`

这份资料面向完全零基础学习者，所以我会把语法、数据结构、调用顺序和业务规则都尽量说清楚。

## 2. 先用一句人话说清楚“下单功能”在做什么

下单功能的本质是：

1. 用户先登录。
2. 用户先占一张桌。
3. 小程序加载菜品列表。
4. 用户调整数量，把菜加入购物车。
5. 小程序根据购物车拼出一段订单内容和总价。
6. 小程序把订单数据发给后端。
7. 后端补全当前用户 id、角色、订单号、下单时间等信息。
8. 后端把订单写入数据库。
9. 小程序清空购物车并跳转到“我的订单”页面。

所以，下单不是只有一个“提交订单”按钮，它是一整条链路：

- 登录检查
- 餐桌检查
- 菜品列表加载
- 购物车增减
- 订单数据组装
- 后端创建订单
- 数据库存储
- 跳转订单页

## 3. 先建立一张总地图

### 前端部分

- `pages/menu/index.js`
  - 点餐页本身
  - 负责展示菜品、管理购物车、提交订单

- `utils/request.js`
  - 小程序统一请求工具
  - 负责发请求、自动带 token、统一处理错误

- `utils/api.js`
  - 请求策略层
  - 负责在新旧接口之间切换

- `utils/auth.js`
  - 登录态工具
  - 负责判断当前用户是否已登录

### 后端部分

- `OrdersController.java`
  - 订单控制器
  - 接收前端请求，调用订单业务逻辑

- `OrdersService.java`
  - 订单业务逻辑核心
  - 负责创建订单、查询我的订单、结算订单、扣余额

- `Orders.java`
  - 订单实体类
  - 定义订单对象里有哪些字段

- `OrdersMapper.java`
  - 订单 Mapper 接口
  - 定义数据库操作方法

- `OrdersMapper.xml`
  - MyBatis XML
  - 写具体 SQL

### 支撑部分

- `AuthContext.java`
  - 保存当前请求对应的用户身份

- `WebMvcConfig.java`
  - 配置哪些订单接口必须先登录

- `UserMapper.java` 和 `User.java`
  - 结算时要查用户余额，所以也会用到

## 4. 先讲必需语法

---

## 5. JavaScript 基础语法

前端点餐页是微信小程序 JavaScript，所以先看 JavaScript。

### 5.1 `const` 是什么

```javascript
const auth = require('../../utils/auth')
```

意思是：

- 定义一个变量 `auth`
- 它引用了另一个文件导出的内容

### 5.2 `require()` 是什么

```javascript
const { request } = require('../../utils/request')
```

意思是：

- 从别的文件里把功能引入当前文件

这里用了“解构赋值”，表示只取出导出的某个字段。

### 5.3 `Page({...})` 是什么

微信小程序页面通常这样写：

```javascript
Page({
  data: {},
  onShow() {},
  submitOrder() {}
})
```

可以先把它理解成：

- 注册一个页面对象

里面包含：

- 页面数据
- 页面生命周期函数
- 页面自己的方法

### 5.4 `data` 是什么

例如：

```javascript
data: {
  foods: [],
  cartItems: [],
  cartTotal: 0
}
```

表示页面里保存了这些数据：

- 菜品列表
- 购物车项
- 总价

### 5.5 `this` 是什么

在页面方法里，`this` 一般指“当前页面对象”。

例如：

```javascript
this.setData({ loading: true })
```

表示修改当前页面的数据。

### 5.6 `this.setData()` 是什么

小程序页面数据通常要通过：

```javascript
this.setData({
  cartVisible: true
})
```

来修改。

作用是：

- 更新页面状态
- 通知界面重新渲染

### 5.7 `async` 和 `await`

例如：

```javascript
async submitOrder() {
  await requestWithFallback(...)
}
```

你先这样理解：

- `async`
  - 表示这个函数里有异步操作
- `await`
  - 先等异步操作完成，再继续往下执行

这里的异步操作主要就是网络请求。

### 5.8 `Promise.all([...])`

例如：

```javascript
const [tableRes, foodsRes] = await Promise.all([
  requestWithFallback(...),
  request(...)
])
```

意思是：

- 同时发两个请求
- 等它们都完成后再继续

这比一个接一个发更快。

### 5.9 `map()` 是什么

例如：

```javascript
const foods = (foodsRes.data || []).map(item => ...)
```

`map()` 的作用是：

- 把数组里的每个元素都加工一下
- 生成一个新的数组

### 5.10 `find()` 是什么

例如：

```javascript
const existing = cartItems.find(item => item.id === food.id)
```

意思是：

- 在数组里查找第一个满足条件的元素

这里是在查：

- 购物车里是否已经有这道菜

### 5.11 `filter()` 是什么

例如：

```javascript
const nextItems = cartItems.filter(cartItem => cartItem.num > 0)
```

意思是：

- 只保留数量大于 0 的购物车项

### 5.12 `reduce()` 是什么

例如：

```javascript
const cartTotal = normalized.reduce((sum, item) => sum + item.subtotal, 0)
```

可以先理解成：

- 从头到尾累加数组里的值

这里它用来计算：

- 购物车总金额

### 5.13 模板字符串

例如：

```javascript
`${item.name}x${item.num}`
```

这表示把变量拼进字符串里。

如果：

- `item.name = 红烧肉`
- `item.num = 2`

那么结果就是：

```text
红烧肉x2
```

### 5.14 `Object.assign()`

例如：

```javascript
Object.assign({}, item, {
  subtotal: price * num
})
```

意思是：

1. 先创建一个空对象
2. 把 `item` 的内容拷贝进去
3. 再额外加上或覆盖某些字段

### 5.15 `Number(...)` 和 `toFixed(2)`

例如：

```javascript
Number(food.price || 0)
cartTotal.toFixed(2)
```

含义分别是：

- `Number(...)`
  - 转成数字
- `toFixed(2)`
  - 保留两位小数，并返回字符串

### 5.16 `return`

例如：

```javascript
if (!this.data.currentTable) {
  return
}
```

意思是：

- 当前函数到这里直接结束

### 5.17 `try/finally`

例如：

```javascript
try {
  ...
} finally {
  this.setData({ submitLoading: false })
}
```

意思是：

- 无论提交订单成功还是失败
- 最后都要关闭提交中的 loading 状态

---

## 6. Java 基础语法

后端是 Java，所以你也要理解最基本的 Java 结构。

### 6.1 类 `class`

例如：

```java
public class OrdersService {
}
```

表示定义了一个类，名字是 `OrdersService`。

### 6.2 方法

例如：

```java
public Orders addForCurrentUser(Orders orders, Integer currentUserId)
```

可以拆成：

- `public`
  - 公开方法
- `Orders`
  - 返回值类型
- `addForCurrentUser`
  - 方法名
- `(Orders orders, Integer currentUserId)`
  - 参数列表

### 6.3 `@RestController`

表示这是一个控制器类，可以处理前端发来的 HTTP 请求。

### 6.4 `@RequestMapping("/orders")`

表示这个类里的接口，统一都属于 `/orders` 路径下。

例如：

```java
@PostMapping
```

完整路径其实是：

```text
/orders
```

### 6.5 `@RequestBody`

例如：

```java
public Result create(@RequestBody Orders orders)
```

意思是：

- 把前端发来的 JSON 请求体
- 自动转成一个 `Orders` 对象

### 6.6 `@PathVariable`

例如：

```java
public Result settle(@PathVariable Integer id)
```

如果请求路径是：

```text
/orders/5/settle
```

那么：

- `id` 就会接收到 `5`

### 6.7 `if (...) { ... }`

表示条件判断。

### 6.8 `throw new CustomException(...)`

表示主动抛出业务异常，让请求失败并返回错误信息。

### 6.9 `null`

表示“没有值”。

例如：

- 没登录
- 没查到订单
- 没传餐桌

都可能用 `null` 表示。

### 6.10 `private`

例如：

```java
private void prepareOrderForInsert(Orders orders)
```

表示这个方法只在当前类内部使用。

### 6.11 `new`

例如：

```java
Orders updateOrder = new Orders();
```

表示创建一个新的订单对象。

### 6.12 `Objects.equals(a, b)`

作用是：

- 安全比较两个值是否相等

它比直接 `a.equals(b)` 更稳，因为其中一个值可能是 `null`。

---

## 7. MyBatis 基础语法

### 7.1 Mapper 是什么

Mapper 可以先理解成：

- Service 和数据库之间的一层桥梁

Service 不直接写 SQL，而是调用 Mapper。

### 7.2 `#{...}` 是什么

例如：

```xml
where id = #{id}
```

意思是：

- 把 Java 传进来的参数安全地放进 SQL

### 7.3 `<insert>`、`<update>`、`<select>`、`<delete>`

分别对应：

- 插入
- 更新
- 查询
- 删除

### 7.4 `<if test="...">`

表示只有在条件成立时，才拼接这段 SQL。

### 7.5 `<set>`

用于拼接 `update` 语句里的 `set` 部分。

---

## 8. 先认识订单数据长什么样

## 9. `Orders.java`

这个类定义了一个订单对象里有哪些字段。

主要字段有：

- `id`
  - 订单主键 id

- `content`
  - 订单内容
  - 当前项目里是一个字符串，不是独立明细表

- `total`
  - 订单总金额

- `userId`
  - 下单用户 id

- `userRole`
  - 下单用户角色

- `time`
  - 下单时间

- `status`
  - 订单状态

- `orderNo`
  - 订单号

- `userName`
  - 用户名字，主要用于显示

### 9.1 当前项目里订单内容是什么样

前端会把购物车拼成类似这种字符串：

```text
红烧肉x2, 米饭x1, 可乐x1
```

然后保存到 `content` 字段。

这意味着当前项目并没有真正的“订单明细表”，而是把菜和数量直接压成一段文本。

### 9.2 订单状态有哪些

结合项目文档和代码逻辑，当前状态主要有三种：

- `待出餐`
- `待结算`
- `已完成`

终端里源码中文有乱码，但业务流程非常清楚：

- 用户下单后先是 `待出餐`
- 管理员处理后变成 `待结算`
- 用户结算后变成 `已完成`

---

## 10. 下单功能整体流程图

当前项目里，“从点餐到成功创建订单”的流程大致是：

1. 用户进入 `pages/menu/index.js`。
2. `onShow()` 先检查是否已登录。
3. 页面并行请求：
   - 当前用户占的桌
   - 菜品列表
4. 用户调整每道菜的 `draftCount`。
5. 用户点击“加入购物车”。
6. 前端把菜加入 `cartItems`，并重新计算数量和总价。
7. 用户点击“提交订单”。
8. 前端把购物车拼成：
   - `content`
   - `total`
   - `status`
9. 前端调用 `POST /orders`。
10. 后端 `OrdersController.create()` 接收请求。
11. `OrdersController` 从 `AuthContext` 里拿当前登录用户 id。
12. `OrdersService.addForCurrentUser()` 把当前用户 id 填进订单。
13. `OrdersService.add()` 补全：
   - `userRole`
   - `orderNo`
   - `time`
14. `OrdersMapper.insert()` 把订单写入数据库。
15. 前端清空购物车并跳到订单页。

---

## 11. 前端文件逐个精讲

## 12. `wechat-miniprogram/pages/menu/index.js`

这是点餐页本身，也是下单功能的前端入口。

### 12.1 开头引入了什么

```javascript
const auth = require('../../utils/auth')
const { request } = require('../../utils/request')
const { requestWithFallback } = require('../../utils/api')
const { normalizeAssetUrl } = require('../../utils/url')
```

作用分别是：

- `auth`
  - 检查登录状态

- `request`
  - 发普通请求

- `requestWithFallback`
  - 发带新旧接口兼容逻辑的请求

- `normalizeAssetUrl`
  - 处理菜品图片地址

### 12.2 `data` 里有哪些页面状态

```javascript
data: {
  user: null,
  loading: true,
  submitLoading: false,
  cartVisible: false,
  currentTable: null,
  foods: [],
  cartItems: [],
  cartCount: 0,
  cartTotal: 0,
  cartTotalText: '0.00'
}
```

逐个解释：

- `user`
  - 当前登录用户

- `loading`
  - 页面初始化加载状态

- `submitLoading`
  - 提交订单时的加载状态

- `cartVisible`
  - 购物车弹层是否可见

- `currentTable`
  - 当前用户占用的餐桌

- `foods`
  - 菜品列表

- `cartItems`
  - 购物车里的菜

- `cartCount`
  - 购物车总数量

- `cartTotal`
  - 购物车总金额，数字

- `cartTotalText`
  - 购物车总金额，文本格式，保留两位小数

### 12.3 `onShow()`：页面显示时先检查登录

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

这段逻辑是：

1. 先检查本地有没有登录状态
2. 如果没有，跳回登录页
3. 如果有，把用户信息放到页面数据里
4. 然后开始加载餐桌和菜品数据

### 12.4 `loadPageData()`：加载点餐页需要的数据

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

它的作用是：

- 打开加载状态
- 加载页面数据
- 最后关闭加载状态

#### 第一部分：并行请求当前餐桌和菜品列表

```javascript
const [tableRes, foodsRes] = await Promise.all([
  requestWithFallback(
    {
      url: '/tables/current'
    },
    {
      url: `/tables/selectByUserId/${this.data.user.id}`
    }
  ),
  request({
    url: '/foods/selectAll'
  })
])
```

这里一次发了两个请求：

1. 当前用户现在占的是哪张桌
2. 所有菜品列表

为什么要查 `currentTable`？

因为没有占桌就不允许下单。

#### 第二部分：把菜品加工成前端更好用的结构

```javascript
const foods = (foodsRes.data || []).map(item =>
  Object.assign({}, item, {
    img: normalizeAssetUrl(item.img),
    draftCount: item.draftCount || 1
  })
)
```

这里做了两件事：

1. 处理图片地址
2. 给每道菜补一个 `draftCount`

`draftCount` 的意思是：

- 当前用户在页面上准备加多少份这道菜

注意：

- 它不是购物车里的最终数量
- 它只是一个临时输入状态

#### 第三部分：把数据写回页面

```javascript
this.setData({
  currentTable,
  foods
})
this.syncCartState(this.data.cartItems)
```

这里除了更新页面，还顺手重新同步了一次购物车状态。

### 12.5 `increaseDraftCount()` 和 `decreaseDraftCount()`

这两个函数负责调整“某道菜准备加入几份”。

例如：

```javascript
this.setData({
  [`foods[${index}].draftCount`]: (current.draftCount || 1) + 1
})
```

意思是：

- 找到 `foods` 数组里第 `index` 个菜
- 修改它的 `draftCount`

写法：

```javascript
[`foods[${index}].draftCount`]
```

是小程序里动态修改数组中某一项字段的常见方式。

### 12.6 `addToCart(event)`：加入购物车

这是点餐页的重要函数。

#### 第一步：先检查是否已占桌

```javascript
if (!this.data.currentTable) {
  wx.showToast({
    title: '请先选择餐桌',
    icon: 'none'
  })
  return
}
```

这条业务规则很关键：

- 没有餐桌，不能点餐下单

#### 第二步：找出当前点击的菜

```javascript
const index = event.currentTarget.dataset.index
const food = this.data.foods[index]
```

#### 第三步：拿到准备加入的数量

```javascript
const draftCount = Math.max(1, Number(food.draftCount || 1))
```

意思是：

- 数量至少为 1
- 并且确保转成数字

#### 第四步：复制购物车数组

```javascript
const cartItems = [...this.data.cartItems]
```

`...` 是展开运算符。

这里表示：

- 复制一个新的数组出来

#### 第五步：查购物车里有没有这道菜

```javascript
const existing = cartItems.find(item => item.id === food.id)
```

如果已经有，就累加数量：

```javascript
existing.num += draftCount
```

如果没有，就新增一项：

```javascript
cartItems.push({
  id: food.id,
  name: food.name,
  price: Number(food.price || 0),
  img: food.img,
  num: draftCount
})
```

#### 第六步：把菜品卡片上的临时数量重置回 1

```javascript
this.setData({
  [`foods[${index}].draftCount`]: 1
})
```

#### 第七步：同步购物车统计数据

```javascript
this.syncCartState(cartItems)
```

#### 第八步：提示加入成功

```javascript
wx.showToast({
  title: '已加入购物车',
  icon: 'success'
})
```

### 12.7 `increaseCartCount()` 和 `decreaseCartCount()`

这两个函数是购物车里的加减按钮。

逻辑分别是：

- `increaseCartCount()`
  - 对某个购物车项 `num += 1`

- `decreaseCartCount()`
  - 对某个购物车项 `num -= 1`
  - 如果减到 0，就把这项从购物车删掉

### 12.8 `syncCartState(cartItems)`：购物车状态总整理

这是前端购物车逻辑的核心函数。

```javascript
const normalized = cartItems.map(item => {
  const price = Number(item.price || 0)
  const num = Number(item.num || 0)
  return Object.assign({}, item, {
    price,
    num,
    subtotal: price * num,
    subtotalText: (price * num).toFixed(2)
  })
})
```

这段是在做“标准化”：

- 确保 `price` 是数字
- 确保 `num` 是数字
- 计算每项小计 `subtotal`
- 生成小计文本 `subtotalText`

然后再算整车总数量和总金额：

```javascript
const cartCount = normalized.reduce((sum, item) => sum + item.num, 0)
const cartTotal = normalized.reduce((sum, item) => sum + item.subtotal, 0)
```

最后统一写回页面：

```javascript
this.setData({
  cartItems: normalized,
  cartCount,
  cartTotal,
  cartTotalText: cartTotal.toFixed(2),
  cartVisible: cartCount > 0 ? this.data.cartVisible : false
})
```

这里还有一个细节：

- 如果购物车空了，就自动关闭购物车弹层

### 12.9 `submitOrder()`：真正的下单动作

这是整个前端下单最核心的函数。

#### 第一步：检查是否已占桌

```javascript
if (!this.data.currentTable) {
  ...
  return
}
```

#### 第二步：检查购物车是否为空

```javascript
if (this.data.cartItems.length === 0) {
  ...
  return
}
```

#### 第三步：打开提交中的 loading

```javascript
this.setData({
  submitLoading: true
})
```

#### 第四步：把购物车拼成订单内容字符串

```javascript
const content = this.data.cartItems
  .map(item => `${item.name}x${item.num}`)
  .join(', ')
```

如果购物车里有：

- 红烧肉 2 份
- 米饭 1 份

那么 `content` 会变成：

```text
红烧肉x2, 米饭x1
```

#### 第五步：组装提交给后端的订单对象

```javascript
const payload = {
  content,
  total: Number(this.data.cartTotal.toFixed(2)),
  status: '待出餐'
}
```

也就是说前端在下单时主要提交 3 个核心字段：

- `content`
- `total`
- `status`

注意：

- 前端这里没有传 `userId`
- 因为新版接口由后端根据 token 识别当前用户

#### 第六步：调用下单接口

```javascript
await requestWithFallback(
  {
    url: '/orders',
    method: 'POST',
    data: payload
  },
  {
    url: '/orders/add',
    method: 'POST',
    data: Object.assign({}, payload, {
      userId: this.data.user.id
    })
  }
)
```

这里有两套接口：

##### 新接口

```javascript
POST /orders
```

特点是：

- 不需要前端传 `userId`
- 后端自己从登录身份里拿

##### 旧接口

```javascript
POST /orders/add
```

特点是：

- 前端直接把 `userId` 也传给后端

当前配置是 `modern`，所以主要用新接口。

#### 第七步：下单成功后的前端处理

```javascript
this.syncCartState([])
this.closeCart()
```

意思是：

- 清空购物车
- 关闭购物车面板

接着提示成功：

```javascript
wx.showToast({
  title: '下单成功',
  icon: 'success'
})
```

最后跳转到订单页：

```javascript
setTimeout(() => {
  wx.switchTab({
    url: '/pages/orders/index'
  })
}, 220)
```

#### 第八步：不管成功失败都关闭 `submitLoading`

```javascript
finally {
  this.setData({
    submitLoading: false
  })
}
```

---

## 13. `wechat-miniprogram/utils/request.js`

这个文件虽然不是你本次重点点名的文件，但下单成功依赖它很深。

### 13.1 为什么菜单页不直接写 `wx.request()`

因为所有页面都会重复做这些事情：

- 拼接服务器地址
- 带 token
- 判断请求是否成功
- 处理登录失效

所以项目把这些公共逻辑都收口到 `request.js`。

### 13.2 自动带 token

关键代码是：

```javascript
auth.getToken()
  ? {
      Authorization: `Bearer ${auth.getToken()}`
    }
  : {}
```

意思是：

- 如果本地有 token
- 就自动把它放进请求头

所以菜单页在提交新接口 `/orders` 时，后端虽然没从请求体里收到 `userId`，但仍然可以知道当前是谁在下单。

### 13.3 为什么请求成功还要判断 `payload.code`

因为这个项目的后端统一返回：

```json
{
  "code": "200",
  "msg": "请求成功",
  "data": ...
}
```

所以前端要再判断一次：

- `payload.code === '200'`
  - 才算业务成功

### 13.4 登录失效时会怎样

如果后端返回的错误消息里出现“登录”或“失效”，这里会：

1. 清空本地登录态
2. 强制跳回登录页

这对 `/orders` 和 `/orders/my` 都成立，因为它们是受保护接口。

---

## 14. `wechat-miniprogram/utils/api.js`

这个文件负责新旧接口兼容。

### 14.1 `requestWithFallback()` 在做什么

它的逻辑是：

1. 优先尝试主接口
2. 如果主接口不适合，再退回备用接口

### 14.2 为什么下单功能也有新旧两套接口

因为这个项目保留了：

- 新接口 `/orders`
- 旧接口 `/orders/add`

新接口的设计更合理：

- 用户身份来自 token

旧接口更依赖前端：

- 前端直接传 `userId`

---

## 15. 后端文件逐个精讲

## 16. `springboot/src/main/java/com/example/controller/OrdersController.java`

这是订单控制器。

控制器的职责可以概括成三步：

1. 接收请求
2. 调用 Service
3. 返回统一结果

### 16.1 类头部

```java
@RestController
@RequestMapping("/orders")
public class OrdersController {
```

意思是：

- 这是一个订单控制器
- 这个类里的接口路径都以 `/orders` 开头

### 16.2 `@PostMapping("/add")`

```java
@PostMapping("/add")
public Result add(@RequestBody Orders orders) {
    ordersService.add(orders);
    return Result.success();
}
```

这是旧版下单接口。

特点是：

- 直接把前端传来的订单对象交给 Service

### 16.3 `@PostMapping`

```java
@PostMapping
public Result create(@RequestBody Orders orders) {
    Orders latestOrder = ordersService.addForCurrentUser(orders, AuthContext.getCurrentUserId());
    return Result.success(latestOrder);
}
```

这就是新版下单接口。

作用是：

1. 接收前端传来的订单数据
2. 从 `AuthContext` 取当前登录用户 id
3. 调用 `ordersService.addForCurrentUser(...)`
4. 返回刚创建好的订单对象

这也是为什么前端调新接口时不需要手动传 `userId`。

### 16.4 `@GetMapping("/my")`

```java
@GetMapping("/my")
public Result myOrders() {
    List<Orders> list = ordersService.selectMyOrders(AuthContext.getCurrentUserId());
    return Result.success(list);
}
```

它不是创建订单，但和下单后的“查看我的订单”直接相关。

### 16.5 `@PostMapping("/{id}/settle")`

```java
@PostMapping("/{id}/settle")
public Result settle(@PathVariable Integer id) {
    Orders orders = ordersService.settleOrder(id, AuthContext.getCurrentUserId());
    return Result.success(orders);
}
```

这个接口是结算订单。

虽然你这次重点是下单，但这个方法也属于订单功能的后半段，所以后面会顺带讲。

---

## 17. `springboot/src/main/java/com/example/service/OrdersService.java`

这里是订单业务逻辑的核心。

## 18. `add(Orders orders)`：基础新增订单

```java
public void add(Orders orders) {
    this.prepareOrderForInsert(orders);
    String orderNo = IdUtil.fastSimpleUUID();
    orders.setOrderNo(orderNo);
    orders.setTime(DateUtil.now());
    ordersMapper.insert(orders);
}
```

逐句解释：

### 18.1 `prepareOrderForInsert(orders)`

这是一个内部预处理方法，作用是：

- 检查订单数据是否完整
- 补齐用户角色等信息

### 18.2 `IdUtil.fastSimpleUUID()`

作用是生成一个订单号。

你可以先把它理解成：

- 生成一个几乎不会重复的字符串

当前项目把这个字符串直接当作 `orderNo`。

### 18.3 `DateUtil.now()`

作用是：

- 生成当前时间字符串

然后把它放进订单的 `time` 字段。

### 18.4 `ordersMapper.insert(orders)`

这一步才是真正把订单写入数据库。

## 19. `addForCurrentUser(Orders orders, Integer currentUserId)`：新版下单核心

```java
public Orders addForCurrentUser(Orders orders, Integer currentUserId) {
    if (currentUserId == null) {
        throw new CustomException("请先登录");
    }
    orders.setUserId(currentUserId);
    this.add(orders);
    return orders;
}
```

这是新版下单接口对应的真正业务方法。

逐步解释：

### 19.1 检查是否已登录

如果 `currentUserId == null`，直接报错。

### 19.2 把当前用户 id 填进订单

```java
orders.setUserId(currentUserId);
```

这一步很关键。

它说明：

- 下单用户是谁，不靠前端自己传
- 而是由后端根据登录态补上

### 19.3 调用通用新增逻辑

```java
this.add(orders);
```

也就是说：

- 新版下单和旧版下单最终还是复用同一套新增订单逻辑

### 19.4 返回刚创建的订单对象

```java
return orders;
```

---

## 20. `prepareOrderForInsert(Orders orders)`：订单插入前预处理

这个方法很值得你认真看，因为它把很多看起来“自动出现”的字段补齐了。

```java
private void prepareOrderForInsert(Orders orders) {
    if (orders.getUserId() == null) {
        throw new CustomException("用户信息不能为空");
    }

    if (StrUtil.isBlank(orders.getStatus())) {
        orders.setStatus("待结算");
    }

    if (StrUtil.isNotBlank(orders.getUserRole())) {
        return;
    }

    String currentRole = AuthContext.getCurrentRole();
    if (StrUtil.isNotBlank(currentRole)) {
        orders.setUserRole(currentRole);
        return;
    }

    User user = userMapper.selectById(orders.getUserId());
    if (user == null) {
        throw new CustomException("用户不存在");
    }
    orders.setUserRole(StrUtil.blankToDefault(user.getRole(), RoleEnum.USER.name()));
}
```

### 20.1 为什么先检查 `userId`

因为订单必须属于某个用户。

没有 `userId`，就不知道是谁下的单。

### 20.2 为什么会有默认状态

```java
if (StrUtil.isBlank(orders.getStatus())) {
    orders.setStatus("待结算");
}
```

意思是：

- 如果前端没传状态
- 就给一个默认状态

但当前点餐页前端实际上会明确传：

- `待出餐`

所以对于用户从小程序正常下单这条链来说，最终状态一般还是前端传来的 `待出餐`。

### 20.3 为什么还要补 `userRole`

订单除了要知道：

- 是谁下的单

还要知道：

- 这个用户是什么角色

所以这里会尝试补全 `userRole`。

补全顺序是：

1. 如果订单里本来就有 `userRole`，直接用
2. 否则尝试从 `AuthContext` 里读当前角色
3. 再不行就去数据库查用户角色

### 20.4 `RoleEnum.USER.name()`

表示取枚举 `USER` 的名字，也就是字符串：

```text
USER
```

---

## 21. `selectMyOrders(Integer currentUserId)`

```java
public List<Orders> selectMyOrders(Integer currentUserId) {
    if (currentUserId == null) {
        throw new CustomException("请先登录");
    }
    return this.selectAll(null, currentUserId);
}
```

它的作用是：

- 查询当前登录用户自己的订单

下单成功后跳转订单页，通常就会依赖这种能力。

---

## 22. `settleOrder(Integer orderId, Integer currentUserId)`：订单结算

虽然你这次重点是下单，但这个方法属于订单功能链路的后半段，也值得你一起理解。

```java
public Orders settleOrder(Integer orderId, Integer currentUserId) {
    if (currentUserId == null) {
        throw new CustomException("请先登录");
    }

    Orders dbOrder = this.selectById(orderId);
    if (dbOrder == null) {
        throw new CustomException("订单不存在");
    }
    if (!Objects.equals(dbOrder.getUserId(), currentUserId)) {
        throw new CustomException("无权结算该订单");
    }
    if ("已完成".equals(dbOrder.getStatus())) {
        return dbOrder;
    }
    if (!"待结算".equals(dbOrder.getStatus())) {
        throw new CustomException("当前订单状态不允许结算");
    }

    this.deductUserBalance(dbOrder);
    Orders updateOrder = new Orders();
    updateOrder.setId(orderId);
    updateOrder.setStatus("已完成");
    ordersMapper.updateById(updateOrder);
    dbOrder.setStatus("已完成");
    return dbOrder;
}
```

这里的规则是：

1. 必须先登录
2. 订单必须存在
3. 只能结算自己的订单
4. 如果已经是 `已完成`，直接返回
5. 只有 `待结算` 状态的订单才能结算
6. 结算时会先扣余额
7. 再把订单状态改成 `已完成`

这能帮助你理解：订单创建不是订单生命周期的终点。

---

## 23. `deductUserBalance(Orders orders)`：扣余额

```java
private void deductUserBalance(Orders orders) {
    User user = userMapper.selectById(orders.getUserId());
    if (user == null) {
        throw new CustomException("用户不存在");
    }

    BigDecimal total = orders.getTotal();
    BigDecimal account = user.getAccount().subtract(total);
    if (account.doubleValue() < 0) {
        throw new CustomException("账户余额不足");
    }
    user.setAccount(account);
    userMapper.updateById(user);
}
```

它做的事情是：

1. 先查用户
2. 读取订单总金额
3. 用用户余额减去订单金额
4. 如果余额小于 0，就报错
5. 否则更新用户余额

注意：

- 下单时不会扣钱
- 当前项目是在结算时扣钱

---

## 24. `springboot/src/main/java/com/example/mapper/OrdersMapper.java`

这是订单 Mapper 接口。

它定义了这些数据库操作：

```java
void insert(Orders orders);
void deleteById(Integer id);
void updateById(Orders orders);
Orders selectById(Integer id);
List<Orders> selectAll(String userName, Integer userId);
BigDecimal selectTotalByStatus(String userName, Integer userId, String status);
```

### 24.1 `selectById(Integer id)`

```java
@Select("select * from orders where id = #{id}")
Orders selectById(Integer id);
```

作用是：

- 根据订单 id 查单个订单

### 24.2 `selectAll(String userName, Integer userId)`

作用是：

- 查订单列表
- 可按用户名和用户 id 条件筛选

### 24.3 `selectTotalByStatus(...)`

作用是：

- 统计某种状态下的订单总金额

当前项目里它主要用来统计：

- `已完成` 订单的总收入

---

## 25. `springboot/src/main/resources/mapper/OrdersMapper.xml`

这里写了订单相关的具体 SQL。

## 26. `insert`

```xml
<insert id="insert">
    insert into orders (content, total, user_id, user_role, time, status, order_no)
    values (#{content}, #{total}, #{userId}, #{userRole}, #{time}, #{status}, #{orderNo})
</insert>
```

这条 SQL 就是真正把订单存进数据库的语句。

从这条 SQL 你能清楚看出：

下单时数据库保存的字段有：

- `content`
- `total`
- `user_id`
- `user_role`
- `time`
- `status`
- `order_no`

## 27. `updateById`

```xml
<update id="updateById">
    update orders
    <set>
        <if test="content != null">content = #{content},</if>
        <if test="total != null">total = #{total},</if>
        <if test="userId != null">user_id = #{userId},</if>
        <if test="userRole != null">user_role = #{userRole},</if>
        <if test="time != null">time = #{time},</if>
        <if test="status != null">status = #{status},</if>
        <if test="orderNo != null">order_no = #{orderNo},</if>
    </set>
    where id = #{id}
</update>
```

这条 SQL 的意思是：

- 更新订单时，只修改那些不为 `null` 的字段

所以在结算时，只传：

- `id`
- `status`

就可以只把订单状态改掉。

## 28. `selectAll`

```xml
<select id="selectAll" resultType="com.example.entity.Orders">
    select orders.*, user.name userName from orders
    left join user on orders.user_id = user.id
    <where>
        <if test="userName != null">
            and user.name like concat('%', #{userName}, '%')
        </if>
        <if test="userId != null">
            and orders.user_id = #{userId}
        </if>
    </where>
    order by orders.id desc
</select>
```

这条 SQL 做了三件事：

1. 查询订单表
2. 关联用户表，拿到 `userName`
3. 支持按用户名或用户 id 筛选

### 28.1 `left join user`

可以先粗略理解成：

- 以 `orders` 表为主
- 把对应用户的名字一起拼进来

### 28.2 `order by orders.id desc`

表示：

- 按订单 id 倒序排列
- 新订单排前面

## 29. `selectTotalByStatus`

```xml
<select id="selectTotalByStatus" resultType="java.math.BigDecimal">
    select coalesce(sum(orders.total), 0) from orders
    left join user on orders.user_id = user.id
    <where>
        and orders.status = #{status}
        <if test="userName != null">
            and user.name like concat('%', #{userName}, '%')
        </if>
        <if test="userId != null">
            and orders.user_id = #{userId}
        </if>
    </where>
</select>
```

作用是：

- 按状态统计订单总金额

`coalesce(sum(...), 0)` 的意思是：

- 如果没有结果，不返回 `null`
- 而是返回 `0`

---

## 30. 认证上下文为什么和下单有关

## 31. `AuthContext.java`

新版下单接口：

```java
POST /orders
```

前端没有传 `userId`，但后端还是知道是谁在下单。

原因就是：

- 登录后，请求里会自动带 token
- 拦截器会解析 token
- 再把当前用户 id 和角色放到 `AuthContext`

然后控制器里就可以这样取：

```java
AuthContext.getCurrentUserId()
AuthContext.getCurrentRole()
```

### 31.1 `AuthContext` 里保存了什么

- 当前用户 id
- 当前用户角色

所以它直接影响：

- 下单属于谁
- 订单角色是什么

---

## 32. `WebMvcConfig.java`

这里决定哪些订单接口必须先登录。

关键配置是：

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

这意味着以下接口要求登录：

- `POST /orders`
- `GET /orders/my`
- `POST /orders/{id}/settle`

所以新版下单、查看我的订单、结算订单都要求有合法 token。

而旧接口：

- `POST /orders/add`

没有在这里被拦截，说明它仍然保留着较旧的调用方式。

---

## 33. 用一次真实下单把整条链路串起来

假设当前用户已经登录，用户 id 是 `8`，并且已经占了桌。

假设购物车里有：

- 红烧肉 2 份，单价 18
- 米饭 1 份，单价 2

### 33.1 前端购物车中的数据

购物车项大概会是：

```json
[
  {
    "id": 1,
    "name": "红烧肉",
    "price": 18,
    "num": 2
  },
  {
    "id": 2,
    "name": "米饭",
    "price": 2,
    "num": 1
  }
]
```

### 33.2 `submitOrder()` 拼出订单内容

```javascript
const content = this.data.cartItems
  .map(item => `${item.name}x${item.num}`)
  .join(', ')
```

结果会是：

```text
红烧肉x2, 米饭x1
```

### 33.3 前端组装请求体

```javascript
const payload = {
  content: '红烧肉x2, 米饭x1',
  total: 38,
  status: '待出餐'
}
```

### 33.4 前端发送新接口请求

```http
POST /orders
Authorization: Bearer xxxxx
Content-Type: application/json

{
  "content": "红烧肉x2, 米饭x1",
  "total": 38,
  "status": "待出餐"
}
```

### 33.5 控制器接收

`OrdersController.create()` 收到后：

1. 把请求体转成 `Orders` 对象
2. 从 `AuthContext` 里取到当前用户 id `8`
3. 调用：

```java
ordersService.addForCurrentUser(orders, 8)
```

### 33.6 Service 补全用户 id

```java
orders.setUserId(8);
```

### 33.7 Service 继续补全订单信息

`add(orders)` 会继续补：

- `userRole`
- `orderNo`
- `time`

例如：

- `userRole = USER`
- `orderNo = 一串 UUID`
- `time = 当前时间`

### 33.8 数据库插入

最终执行的 SQL 类似：

```sql
insert into orders (content, total, user_id, user_role, time, status, order_no)
values ('红烧肉x2, 米饭x1', 38, 8, 'USER', '2026-05-11 12:30:00', '待出餐', 'xxxxxx')
```

### 33.9 前端成功后的处理

前端收到成功结果后会：

1. 清空购物车
2. 关闭购物车弹层
3. 提示“下单成功”
4. 跳转到订单页

---

## 34. 下单功能里的几条核心业务规则

### 34.1 没占桌不能下单

对应前端代码：

```javascript
if (!this.data.currentTable) {
  ...
  return
}
```

### 34.2 购物车为空不能下单

对应前端代码：

```javascript
if (this.data.cartItems.length === 0) {
  ...
  return
}
```

### 34.3 新版下单用户身份来自 token，不来自前端表单

对应后端代码：

```java
ordersService.addForCurrentUser(orders, AuthContext.getCurrentUserId())
```

### 34.4 创建订单时会自动生成订单号和时间

对应后端代码：

```java
String orderNo = IdUtil.fastSimpleUUID();
orders.setTime(DateUtil.now());
```

### 34.5 结算时才扣余额，不是下单时扣

对应后端代码：

```java
this.deductUserBalance(dbOrder);
```

---

## 35. 常见报错分别在哪一层发生

### 35.1 没登录就进菜单页

发生位置：

- 前端 `auth.requireLogin()`

表现：

- 跳回登录页

### 35.2 没占桌就加购物车或下单

发生位置：

- 前端 `addToCart()` 或 `submitOrder()`

表现：

- 弹提示“请先选择餐桌”

### 35.3 购物车为空就点提交订单

发生位置：

- 前端 `submitOrder()`

表现：

- 弹提示“请先选择菜品”

### 35.4 token 失效

发生位置：

- 后端认证拦截
- 前端 `request.js` 做后续处理

表现：

- 清空会话
- 跳回登录页

### 35.5 订单不存在

发生位置：

- 后端 `settleOrder()` 或 `updateById()`

表现：

- 抛“订单不存在”

### 35.6 结算别人的订单

发生位置：

- 后端 `settleOrder()`

表现：

- 抛“无权结算该订单”

### 35.7 余额不足

发生位置：

- 后端 `deductUserBalance()`

表现：

- 抛“账户余额不足”

---

## 36. 几个最容易混淆的点

### 36.1 为什么前端传的是 `content` 字符串，而不是菜品数组

因为当前项目的数据模型比较简单。

它没有单独设计“订单明细表”，所以直接把购物车内容压成一段文本存进 `content`。

### 36.2 为什么新版下单前端不用传 `userId`

因为后端通过 token 已经知道当前登录用户是谁。

### 36.3 为什么还保留 `/orders/add`

因为这是旧版接口，为了兼容旧逻辑还保留着。

### 36.4 为什么 `prepareOrderForInsert()` 还会设置默认状态，但前端又主动传了状态

因为这个方法是通用兜底逻辑。

它的意思是：

- 如果调用方没传状态，就给个默认值

但当前小程序下单时，前端已经明确传了 `待出餐`。

### 36.5 为什么下单不扣钱，结算才扣

因为这个项目把“创建订单”和“支付完成”设计成了两个阶段。

订单先经历：

- `待出餐`
- `待结算`
- `已完成`

---

## 37. 从学习顺序上，你应该怎么读这些代码

推荐顺序如下：

1. 先读 `pages/menu/index.js`
   目标：搞清楚购物车和提交订单发生了什么

2. 再读 `utils/request.js`
   目标：搞清楚请求是怎么发出去的，token 是怎么自动带上的

3. 再读 `utils/api.js`
   目标：搞清楚新旧下单接口为什么并存

4. 再读 `OrdersController.java`
   目标：搞清楚后端如何接收下单请求

5. 再读 `OrdersService.java`
   目标：搞清楚订单创建、结算、扣余额的业务规则

6. 再读 `Orders.java`
   目标：搞清楚订单对象有哪些字段

7. 再读 `OrdersMapper.java`
   目标：搞清楚 Service 调用了哪些数据库方法

8. 最后读 `OrdersMapper.xml`
   目标：把真正执行的 SQL 和前面的业务逻辑对上

---

## 38. 你学完后至少应该能回答这几个问题

1. 点餐页打开时会先加载哪两类数据？
2. `draftCount` 和购物车里的 `num` 有什么区别？
3. 购物车总价是谁算的？
4. 前端提交订单时真正发给后端的字段有哪些？
5. 为什么新版下单前端不传 `userId`，后端也知道是谁？
6. 后端在哪个方法里自动生成了订单号和时间？
7. 订单 `content` 为什么是一段字符串？
8. 当前项目里下单和结算分别发生在什么阶段？
9. 扣余额是在创建订单时发生，还是在结算时发生？
10. 数据库里真正插入订单的是哪条 SQL？

如果这 10 个问题你都能自己说清楚，说明你已经真正理解了这套下单主链路。

---

## 39. 最后给零基础学习者的实用建议

你现在不要试图一次记住所有语法。更有效的做法是：

1. 先抓主流程

```text
进入菜单页
-> 检查登录
-> 加载当前餐桌和菜品
-> 调整 draftCount
-> 加入购物车
-> syncCartState 计算总价
-> submitOrder
-> POST /orders
-> OrdersController.create
-> OrdersService.addForCurrentUser
-> OrdersService.add
-> OrdersMapper.insert
-> 数据库存单
-> 清空购物车并跳订单页
```

2. 再逐个啃小语法

这一轮只重点盯这些就够了：

- JavaScript：`map`、`find`、`reduce`、`Object.assign`、`async/await`
- Java：`@RequestBody`、`if`、`throw`、`new`
- MyBatis：`#{}`、`<if>`、`<insert>`、`<update>`

3. 最后自己用中文复述一遍

如果你能不用代码，只用中文把“从购物车到数据库插入订单”讲顺，说明你已经开始真正看懂这套下单代码了。
