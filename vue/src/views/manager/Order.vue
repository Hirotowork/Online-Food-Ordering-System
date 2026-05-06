<template>
  <div>
    <div class="card" style="margin-bottom: 10px;">
      <div>当前页面仅展示餐品信息。</div>
    </div>

    <el-row :gutter="10">
      <el-col :span="6" v-for="item in data.foodsList" :key="item.id">
        <div class="card">
          <img :src="item.img" alt="" style="width: 100%; height: 280px">
          <div style="margin: 5px; color: #000; font-size: 18px; display: flex; align-items: center">
            <div style="flex: 1">{{ item.name }}</div>
            <div style="color: red; font-weight: bold">￥{{ item.price }}</div>
          </div>
          <div style="margin: 5px; color: #666">
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
</template>

<script setup>
import { reactive } from "vue";
import request from "@/utils/request";

const data = reactive({
  foodsList: []
})

const loadFoods = () => {
  request.get('/foods/selectAll').then(res => {
    data.foodsList = res.data || []
  })
}

loadFoods()
</script>

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
