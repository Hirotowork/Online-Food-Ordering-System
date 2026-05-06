<template>
  <div>
    <div class="card" style="margin-bottom: 10px;">
      <div style="margin-bottom: 12px; font-weight: bold;">全局餐品信息</div>
      <el-row :gutter="10">
        <el-col :span="6" v-for="item in data.allFoods" :key="item.id">
          <div class="card food-card">
            <img :src="item.img" alt="" style="width: 100%; height: 220px; object-fit: cover">
            <div style="margin: 8px 0; color: #000; font-size: 18px; display: flex; align-items: center">
              <div style="flex: 1">{{ item.name }}</div>
              <div style="color: red; font-weight: bold">￥{{ item.price }}</div>
            </div>
            <div style="color: #666">
              <el-tooltip
                v-if="item.descr && item.descr.length >= 20"
                :content="item.descr"
                placement="bottom"
                effect="customized"
              >
                <div class="line1">{{ item.descr }}</div>
              </el-tooltip>
              <div v-else>{{ item.descr }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="card" style="margin-bottom: 10px;">
      <el-input
        v-model="data.name"
        prefix-icon="Search"
        style="width: 300px; margin-right: 10px"
        placeholder="请输入餐品名称查询"
      />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button type="info" style="margin: 0 10px" @click="reset">重置</el-button>
    </div>

    <div class="card" style="margin-bottom: 10px">
      <div style="margin-bottom: 10px">
        <el-button type="primary" @click="handleAdd">新增</el-button>
      </div>
      <el-table :data="data.tableData">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="descr" label="简介" />
        <el-table-column prop="price" label="价格" />
        <el-table-column label="图片">
          <template #default="scope">
            <el-image
              v-if="scope.row.img"
              style="width: 100px; height: 100px; display: block"
              :src="scope.row.img"
              :preview-src-list="[scope.row.img]"
              preview-teleported
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" @click="del(scope.row.id)">删除</el-button>
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

    <el-dialog v-model="data.formVisible" title="餐品信息" width="40%" destroy-on-close>
      <el-form :model="data.form" label-width="100px" style="padding-right: 50px">
        <el-form-item label="名称">
          <el-input v-model="data.form.name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="data.form.descr" type="textarea" autocomplete="off" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input v-model="data.form.price" autocomplete="off" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload action="http://localhost:9090/files/upload" :on-success="handleFileUpload">
            <el-button type="primary">点击上传</el-button>
          </el-upload>
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
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/utils/request";

const data = reactive({
  allFoods: [],
  tableData: [],
  total: 0,
  pageNum: 1,
  pageSize: 5,
  formVisible: false,
  form: {},
  name: '',
})

const loadOverview = () => {
  request.get('/foods/selectAll').then(res => {
    data.allFoods = res.data || []
  })
}

const load = () => {
  request.get('/foods/selectPage', {
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

const refresh = () => {
  loadOverview()
  load()
}

refresh()

const reset = () => {
  data.name = ''
  data.pageNum = 1
  load()
}

const handleAdd = () => {
  data.form = {}
  data.formVisible = true
}

const save = () => {
  request.request({
    method: data.form.id ? 'PUT' : 'POST',
    url: data.form.id ? '/foods/update' : '/foods/add',
    data: data.form
  }).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      data.formVisible = false
      refresh()
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
    request.delete('/foods/delete/' + id).then(res => {
      if (res.code === '200') {
        ElMessage.success('操作成功')
        refresh()
      } else {
        ElMessage.error(res.msg)
      }
    })
  }).catch(err => {
    console.log(err)
  })
}

const handleFileUpload = (file) => {
  data.form.img = file.data
}
</script>

<style scoped>
.food-card {
  margin-bottom: 10px;
}
</style>

<style>
.el-popper.is-customized {
  padding: 6px 12px;
  background: linear-gradient(90deg, rgb(159, 229, 151), rgb(204, 229, 129));
}

.el-popper.is-customized .el-popper__arrow::before {
  background: linear-gradient(45deg, #b2e68d, #bce689);
  right: 0;
}
</style>
