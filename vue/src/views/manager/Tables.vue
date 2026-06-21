<template>
  <div>
    <div class="card" style="margin-bottom: 10px;">
      <div style="margin-bottom: 12px; font-weight: bold;">全局餐桌信息</div>
      <div class="tables-overview">
        <div
          v-for="item in data.allTables"
          :key="item.id"
          class="table-card"
        >
          <div><img src="@/assets/imgs/餐饮.png" alt="" style="width: 88px"></div>
          <div class="table-no">{{ item.no }}</div>
          <div class="table-unit">{{ item.unit }}</div>
          <div class="table-status">
            <span style="color: #04c46d" v-if="item.free === '是'">空闲</span>
            <span style="color: #b20130" v-else>占用</span>
          </div>
          <div class="table-user" v-if="item.userName">占用顾客：{{ item.userName }}</div>
          <div class="table-user" v-else>当前无人占用</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 10px">
      <div style="margin-bottom: 10px">
        <el-button type="primary" @click="handleAdd">新增</el-button>
      </div>
      <el-table :data="data.tableData">
        <el-table-column prop="no" label="餐桌号" />
        <el-table-column prop="unit" label="规格" />
        <el-table-column prop="free" label="是否空闲" />
        <el-table-column prop="userName" label="占用顾客" />
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

    <el-dialog v-model="data.formVisible" title="餐桌信息" width="40%" destroy-on-close>
      <el-form :model="data.form" label-width="100px" style="padding-right: 50px">
        <el-form-item label="餐桌号">
          <el-input v-model="data.form.no" autocomplete="off" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="data.form.unit" autocomplete="off" />
        </el-form-item>
        <el-form-item label="是否空闲">
          <el-radio-group v-model="data.form.free">
            <el-radio label="是">是</el-radio>
            <el-radio label="否">否</el-radio>
          </el-radio-group>
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
  allTables: [],
  tableData: [],
  total: 0,
  pageNum: 1,
  pageSize: 5,
  formVisible: false,
  form: {},
})

const loadOverview = () => {
  request.get('/tables/selectAll').then(res => {
    data.allTables = res.data || []
  })
}

const load = () => {
  request.get('/tables/selectPage', {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize
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

const handleAdd = () => {
  data.form = {}
  data.formVisible = true
}

const save = () => {
  request.request({
    method: data.form.id ? 'PUT' : 'POST',
    url: data.form.id ? '/tables/update' : '/tables/add',
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
    request.delete('/tables/delete/' + id).then(res => {
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
</script>

<style scoped>
.tables-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.table-card {
  width: 160px;
  padding: 16px 12px;
  text-align: center;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  background: #fafcff;
}

.table-no {
  margin-top: 8px;
  font-size: 16px;
  font-weight: bold;
}

.table-unit {
  margin: 8px 0;
  color: #666;
  font-size: 13px;
}

.table-status {
  margin-bottom: 8px;
}

.table-user {
  color: #666;
  font-size: 12px;
  line-height: 1.5;
}
</style>
