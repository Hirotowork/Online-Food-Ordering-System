<template>
  <div>
    <div class="card" style="line-height: 30px; margin-bottom: 10px">
      <div>当前页面仅展示餐桌使用状态。</div>
    </div>

    <div class="card">
      <div style="display: flex; flex-wrap: wrap">
        <div
          v-for="item in data.tables"
          :key="item.id"
          style="text-align: center; margin-right: 20px; margin-bottom: 20px"
        >
          <div><img src="@/assets/imgs/餐饮.png" alt="" style="width: 100px"></div>
          <div>{{ item.no }}</div>
          <div style="font-size: 12px; margin: 10px 0">{{ item.unit }}可用桌</div>
          <div style="margin: 10px 0">
            <span style="color: #04c46d" v-if="item.free === '是'">空闲</span>
            <span style="color: #b20130" v-else>占用</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import request from "@/utils/request";

const data = reactive({
  tables: []
})

const loadTables = () => {
  request.get('/tables/selectAll').then(res => {
    data.tables = res.data || []
  })
}

loadTables()
</script>
