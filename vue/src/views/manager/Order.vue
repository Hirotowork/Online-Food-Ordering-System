<template>
  <div>
    <div class="card" style="margin-bottom: 5px">
      <div v-if="data.table.no">
        <div style="display: flex; align-items: center">
          <div style="flex: 1">
            <span style="margin-right: 10px">餐桌号：{{ data.table.no }}  开始点餐</span>
            <el-button type="primary" plain @click="showOrderList">已点餐品({{ data.total }})</el-button>
          </div>
          <el-button type="primary" @click="removeOrder">退桌</el-button>
        </div>
      </div>
      <div style="color:#666;" v-else>
        您还未选餐桌，请先 <a href="/home">选择餐桌</a> 再点餐
      </div>
    </div>

    <!-- 展示餐品-->
    <el-row :gutter="10">
      <el-col :span="6" v-for="item in data.foodsList" :key="item.id">
        <div class="card">
          <img :src="item.img" alt="" style="width: 100%; height: 280px">
          <div style="margin: 5px; color: #000; font-size: 18px; display: flex; align-items: center">
            <div style="flex: 1">{{ item.name }}</div>
            <div style="color: red; font-weight: bold">￥{{ item.price }}</div>
          </div>
          <div style="margin: 5px; color: #666">
            <el-tooltip :content="item.descr" placement="bottom" effect="customized" v-if="item.descr.length >= 20">
              <div class="line1">{{ item.descr }}</div>
            </el-tooltip>
            <div v-else>{{ item.descr }}</div>
          </div>
          <div style="margin: 10px 0; text-align: right">
            <el-input-number :min="1" v-model="item.num" style="margin-right: 5px"></el-input-number>
            <el-button type="primary" @click="addOrder(item)">点餐</el-button>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="data.dialogShow" title="已点餐品" width="800">
      <el-table :data="data.orderList">
        <el-table-column label="餐品图片">
          <template #default="scope">
            <el-image style="width: 50px; height: 50px" :src="scope.row.img" :preview-src-list="[scope.row.img]" preview-teleported></el-image>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="餐品名称" />
        <el-table-column prop="price" label="餐品价格" />
        <el-table-column prop="num" label="餐品数量" />
      </el-table>
      <div style="text-align: right; color: red; font-weight: bold; font-size: 20px; margin-top: 10px">总价：￥{{ data.orderTotal }}</div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="data.dialogShow = false">关闭</el-button>
          <el-button type="primary" @click="save">下单</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import {reactive} from "vue";
import request from "@/utils/request";
import {ElMessage} from "element-plus";

const data = reactive({
  table: {},
  user: JSON.parse(localStorage.getItem('canteen-user') || '{}'),
  foodsList: [],
  dialogShow: false,
  orderList: [],
  total: 0,
  orderTotal: 0
})

const loadTable = () => {
  request.get('/tables/selectByUserId/' + data.user.id).then(res => {
    data.table = res.data || {}
  })
}
loadTable()

const removeOrder = () => {
  request.put('/tables/removeOrder', data.table).then(res => {
    if (res.code === '200') {
      ElMessage.success('退桌成功')
      loadTable()
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const loadFoods = () => {
  request.get('/foods/selectAll').then(res => {
    data.foodsList = res.data || []
    data.foodsList.forEach(item => item.num = 1)
  })
}
loadFoods()

const showOrderList = () => {
  data.dialogShow = true
}

// 点餐的逻辑
const addOrder = (foods) => {
  let f = data.orderList.find(item => item.id === foods.id)  // 找到菜单里面跟当前点餐同样的餐品
  if (f) {  //  存在通用的餐品的情况  就更新餐品的数量
    f.num += foods.num
  } else {  // 不存在  就新增进去
    let foods1 = JSON.parse(JSON.stringify(foods))
    data.orderList.push(foods1)
  }
  // 表示对 num字段进行累计求和
  data.total = data.orderList.map(item => item.num).reduce((acc, cur) => acc + cur, 0)
  //  orderTotal表示购物车的所有餐品的总价
  data.orderTotal = 0
  data.orderList.forEach(item => {
    // 循环累加  单价*数量
    data.orderTotal += item.price * item.num
  })
  data.orderTotal.toFixed()
  ElMessage.success('点餐成功')
}

// 下单逻辑
const save = () => {
  if (data.orderList.length === 0) {
    ElMessage.warning('请选择餐品')
    return
  }
  let content = ''
  data.orderList.forEach(item => {
    content += item.name + 'x' + item.num + '，'
  })
  content = content.substring(0 , content.length - 1)  //  理论上来说 最后会多出一个逗号，所以我们去掉最后一个逗号即可 菜单的内容： 腊肠炒芹菜x1, 糖醋排骨x2
  let orderData = {  content:  content, total: data.orderTotal, userId: data.user.id, status: '待出餐'}
  request.post('/orders/add', orderData).then(res => {
    if (res.code === '200') {  // 下单成功
      ElMessage.success('下单成功，请在我的订单里查看订单状态')
      data.dialogShow = false
    } else {
      ElMessage.error(res.msg)
    }
  })
}
</script>

<style>
.el-popper.is-customized {
  /* Set padding to ensure the height is 32px */
  padding: 6px 12px;
  background: linear-gradient(90deg, rgb(159, 229, 151), rgb(204, 229, 129));
}

.el-popper.is-customized .el-popper__arrow::before {
  background: linear-gradient(45deg, #b2e68d, #bce689);
  right: 0;
}
</style>