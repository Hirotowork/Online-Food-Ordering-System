<template>
  <div>
    <div class="card" style="margin-bottom: 10px;">
      <el-input
        v-model="data.userName"
        prefix-icon="Search"
        style="width: 300px; margin-right: 10px"
        placeholder="请输入用户名称查询"
      />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button type="info" style="margin: 0 10px" @click="reset">重置</el-button>
    </div>

    <div class="card" style="margin-bottom: 10px">
      <el-table :data="data.tableData">
        <el-table-column prop="orderNo" label="订单编号" />
        <el-table-column prop="content" label="菜单内容" />
        <el-table-column prop="total" label="订单总价">
          <template #default="scope">
            <strong style="color: red">￥{{ formatMoney(scope.row.total) }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="用户名称" />
        <el-table-column prop="status" label="订单状态">
          <template #default="scope">
            <el-tag v-if="scope.row.status === '待出餐'" type="primary">{{ scope.row.status }}</el-tag>
            <el-tag v-else-if="scope.row.status === '待结算'" type="warning">{{ scope.row.status }}</el-tag>
            <el-tag v-else-if="scope.row.status === '已完成'" type="success">{{ scope.row.status }}</el-tag>
            <el-tag v-else>{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button
              v-if="data.user.role === 'USER' && scope.row.status === '待结算'"
              type="primary"
              @click="done(scope.row)"
            >
              结算
            </el-button>
            <el-button
              v-if="data.user.role === 'ADMIN' && scope.row.status === '待出餐'"
              type="primary"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button v-if="data.user.role === 'ADMIN'" type="danger" @click="del(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="data.total" class="card summary-card">
      <el-pagination
        v-model:current-page="data.pageNum"
        background
        layout="prev, pager, next"
        :page-size="data.pageSize"
        :total="data.total"
        @current-change="load"
      />
      <div class="income-box">
        总收入：<span class="income-value">￥{{ formatMoney(data.totalIncome) }}</span>
      </div>
    </div>

    <el-dialog v-model="data.formVisible" title="订单信息" width="30%" destroy-on-close>
      <el-form :model="data.form" label-width="100px" style="padding-right: 50px">
        <el-form-item label="订单状态">
          <el-select v-model="data.form.status" style="width: 100%">
            <el-option value="待出餐" label="待出餐" />
            <el-option value="待结算" label="待结算" />
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
import { reactive } from "vue";
import request from "@/utils/request";
import { ElMessage, ElMessageBox } from "element-plus";

const data = reactive({
  user: JSON.parse(localStorage.getItem('canteen-user') || '{}'),
  tableData: [],
  total: 0,
  totalIncome: 0,
  pageNum: 1,
  pageSize: 10,
  formVisible: false,
  form: {},
  userName: '',
})

const formatMoney = (value) => {
  return Number(value || 0).toFixed(2)
}

const getQueryParams = () => {
  return {
    userName: data.userName,
    userId: data.user.role === 'USER' ? data.user.id : null
  }
}

const load = () => {
  const queryParams = getQueryParams()

  Promise.all([
    request.get('/orders/selectPage', {
      params: {
        pageNum: data.pageNum,
        pageSize: data.pageSize,
        ...queryParams
      }
    }),
    request.get('/orders/selectAll', {
      params: queryParams
    })
  ]).then(([pageRes, allRes]) => {
    data.tableData = pageRes.data?.list || []
    data.total = pageRes.data?.total || 0

    const completedOrders = (allRes.data || []).filter(item => item.status === '已完成')
    data.totalIncome = completedOrders.reduce((sum, item) => sum + Number(item.total || 0), 0)
  })
}

const done = (row) => {
  const form = JSON.parse(JSON.stringify(row))
  form.status = '已完成'
  request.put('/orders/update', form).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      load()
    } else {
      ElMessage.error(res.msg)
    }
  })
}

load()

const reset = () => {
  data.userName = ''
  data.pageNum = 1
  load()
}

const save = () => {
  request.request({
    method: data.form.id ? 'PUT' : 'POST',
    url: data.form.id ? '/orders/update' : '/orders/add',
    data: data.form
  }).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      data.formVisible = false
      load()
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
  ElMessageBox.confirm('删除后数据无法恢复，您确认删除吗？', '确认删除', { type: 'warning' }).then(() => {
    request.delete('/orders/delete/' + id).then(res => {
      if (res.code === '200') {
        ElMessage.success('操作成功')
        load()
      } else {
        ElMessage.error(res.msg)
      }
    })
  }).catch(err => {
    console.log(err)
  })
}
</script>

<style scoped>
.summary-card {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
}

.income-box {
  margin-left: auto;
  min-width: 180px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #fff6f8;
  border: 1px solid #f3c6d0;
  box-shadow: 0 4px 12px rgba(208, 48, 80, 0.08);
  text-align: right;
  font-size: 16px;
  color: #333;
}

.income-value {
  color: #d03050;
  font-size: 22px;
  font-weight: bold;
}
</style>
