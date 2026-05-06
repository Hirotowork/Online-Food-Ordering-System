<template>
  <div>
    <div class="card" style="margin-bottom: 10px;">
      <el-input
        v-model="data.name"
        prefix-icon="Search"
        style="width: 300px; margin-right: 10px"
        placeholder="请输入顾客名称查询"
      />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button type="info" style="margin: 0 10px" @click="reset">重置</el-button>
    </div>

    <div class="card" style="margin-bottom: 10px">
      <el-table :data="data.tableData" style="width: 100%">
        <el-table-column prop="username" label="账号" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="avatar" label="头像">
          <template #default="scope">
            <img
              v-if="scope.row.avatar"
              :src="scope.row.avatar"
              alt=""
              style="width: 50px; height: 50px; border-radius: 50%"
            >
          </template>
        </el-table-column>
        <el-table-column prop="sex" label="性别" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="account" label="账户余额">
          <template #default="scope">
            <span>￥{{ formatMoney(scope.row.account) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="scope">
            <el-button type="primary" @click="handleCharge(scope.row)">充值</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card" v-if="data.total">
      <el-pagination
        v-model:current-page="data.pageNum"
        background
        layout="prev, pager, next"
        :page-size="data.pageSize"
        :total="data.total"
        @current-change="load"
      />
    </div>

    <el-dialog v-model="data.formVisible" title="用户充值" width="30%" destroy-on-close>
      <el-form :model="data.form" label-width="100px" style="padding-right: 50px">
        <el-form-item label="顾客名称">
          <el-input :model-value="data.form.name || ''" disabled />
        </el-form-item>
        <el-form-item label="当前余额">
          <el-input :model-value="'￥' + formatMoney(data.form.account)" disabled />
        </el-form-item>
        <el-form-item label="充值金额">
          <el-input-number v-model="data.chargeMoney" :min="0" :precision="2" style="width: 200px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="data.formVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCharge">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import request from "@/utils/request";
import { ElMessage } from "element-plus";

const data = reactive({
  tableData: [],
  total: 0,
  pageNum: 1,
  pageSize: 5,
  formVisible: false,
  form: {},
  name: '',
  chargeMoney: 0,
})

const formatMoney = (value) => {
  return Number(value || 0).toFixed(2)
}

const load = () => {
  request.get('/user/selectPage', {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      name: data.name
    }
  }).then(res => {
    data.tableData = res.data?.list || []
    data.total = res.data?.total || 0
  })
}

load()

const reset = () => {
  data.name = ''
  data.pageNum = 1
  load()
}

const handleCharge = (row) => {
  data.form = JSON.parse(JSON.stringify(row))
  data.chargeMoney = 0
  data.formVisible = true
}

const saveCharge = () => {
  if (data.chargeMoney <= 0) {
    ElMessage.warning('充值金额必须大于 0')
    return
  }

  const payload = JSON.parse(JSON.stringify(data.form))
  payload.account = Number(payload.account || 0) + Number(data.chargeMoney)

  request.put('/user/update', payload).then(res => {
    if (res.code === '200') {
      ElMessage.success('充值成功')
      data.formVisible = false
      load()
    } else {
      ElMessage.error(res.msg)
    }
  })
}
</script>
