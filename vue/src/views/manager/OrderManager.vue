<template>
  <div>
    <div class="card" style="margin-bottom: 10px;">
      <el-input prefix-icon="Search" style="width: 300px; margin-right: 10px" placeholder="请输入用户名称查询" v-model="data.userName"></el-input>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button type="info" style="margin: 0 10px" @click="reset">重置</el-button>
    </div>

    <div class="card" style="margin-bottom: 10px">
      <el-table :data="data.tableData">
        <el-table-column prop="id" label="序号" width="70"/>
        <el-table-column prop="orderNo" label="订单编号"/>
        <el-table-column prop="content" label="菜单内容"/>
        <el-table-column prop="total" label="订单总价">
          <template #default="scope">
            <strong style="color:red;">￥{{ scope.row.total }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="用户名称"/>
        <el-table-column prop="status" label="订单状态">
          <template #default="scope">
            <el-tag type="primary" v-if="scope.row.status === '待出餐'">{{ scope.row.status }}</el-tag>
            <el-tag type="warning" v-if="scope.row.status === '待结算'">{{ scope.row.status }}</el-tag>
            <el-tag type="success" v-if="scope.row.status === '已完成'">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" >
          <template #default="scope">
            <el-button v-if="data.user.role === 'USER' && scope.row.status === '待结算'" type="primary" @click="done(scope.row)">结算</el-button>
            <el-button v-if="data.user.role === 'ADMIN' && scope.row.status === '待出餐'" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button v-if="data.user.role === 'ADMIN'" type="danger" @click="del(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card" v-if="data.total">
      <el-pagination background layout="prev, pager, next" @current-change="load" :page-size="data.pageSize" v-model:current-page="data.pageNum" :total="data.total"/>
    </div>

    <el-dialog v-model="data.formVisible" title="信息" width="30%" destroy-on-close>
      <el-form :model="data.form" label-width="100px" style="padding-right: 50px">
        <el-form-item label="订单状态">
          <el-select style="width: 100%" v-model="data.form.status">
            <el-option value="待出餐"></el-option>
            <el-option value="待结算"></el-option>
<!--            <el-option value="已完成"></el-option>-->
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
      <span class="dialog-footer">
        <el-button @click="data.formVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import {reactive} from "vue"
import request from "@/utils/request";
import {ElMessage, ElMessageBox} from "element-plus";

const data = reactive({
  user: JSON.parse(localStorage.getItem('canteen-user') || '{}'),
  tableData: [],
  total: 0,
  pageNum: 1,  // 当前的页码
  pageSize: 5,  // 每页的个数
  formVisible: false,
  form: {},
  userName: '',
})

const done = (row) => {
  let form = JSON.parse(JSON.stringify(row))
  form.status = '已完成'
  request.put('/orders/update', form).then(res => {
    if (res.code === '200') {  //成功
      ElMessage.success('操作成功')
      load()  // 重新加载表格数据
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const load = () => {
  request.get('/orders/selectPage', {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      userName: data.userName,
      userId: data.user.role === 'USER' ? data.user.id : null
    }
  }).then(res => {
    data.tableData = res.data?.list || []
    data.total = res.data.total
  })
}

load()

const reset = () => {
  data.userName = null
  load()
}

// 保存数据
const save = () => {
  request.request({
    method: data.form.id ? 'PUT' : 'POST',
    url: data.form.id ? '/orders/update' : '/orders/add',
    data: data.form
  }).then(res => {
    if (res.code === '200') {  //成功
      ElMessage.success('操作成功')
      data.formVisible = false // 关闭弹窗
      load()  // 重新加载表格数据
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const handleEdit = (row) => {
  data.form = JSON.parse(JSON.stringify(row))
  data.formVisible = true
}

const del = (id) => {
  ElMessageBox.confirm('删除后数据无法恢复，您确认删除吗？', '确认删除', { type: 'warning' }).then(res => {
    request.delete('/orders/delete/' + id).then(res => {
      if (res.code === '200') {  //成功
        ElMessage.success('操作成功')
        load()  // 重新加载表格数据
      } else {
        ElMessage.error(res.msg)
      }
    })
  }).catch(err => {
    console.log(err)
  })
}

</script>