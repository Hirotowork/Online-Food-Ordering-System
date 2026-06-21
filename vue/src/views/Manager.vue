<template>
  <div>
    <div style="height: 60px; background-color: #fff; display: flex; align-items: center; border-bottom: 1px solid #ddd">
      <div style="flex: 1">
        <div style="padding-left: 20px; display: flex; align-items: center">
          <img src="@/assets/imgs/logo.png" alt="" style="width: 40px">
          <div style="font-weight: bold; font-size: 24px; margin-left: 5px; color: #F9B44C">订餐后台系统</div>
        </div>
      </div>
      <div style="width: fit-content; padding-right: 10px; display: flex; align-items: center;">
        <img :src="data.user?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" alt="" style="width: 40px; height: 40px; border-radius: 50%">
        <span style="margin-left: 5px">{{ data.user?.name }}</span>
      </div>
    </div>

    <div style="display: flex">
      <div style="width: 200px; border-right: 1px solid #ddd; min-height: calc(100vh - 60px)">
        <el-menu
          router
          style="border: none"
          :default-active="$route.path"
          :default-openeds="['2', '3']"
        >
          <el-menu-item index="/orderManager">
            <el-icon><HomeFilled /></el-icon>
            <span>订单管理</span>
          </el-menu-item>

          <el-sub-menu index="2" v-if="data.user.role === 'ADMIN'">
            <template #title>
              <el-icon><User /></el-icon>
              <span>信息管理</span>
            </template>
            <el-menu-item index="/tables">
              <el-icon><Dish /></el-icon>
              <span>餐桌管理</span>
            </el-menu-item>
            <el-menu-item index="/foods">
              <el-icon><Bowl /></el-icon>
              <span>菜品管理</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="3" v-if="data.user.role === 'ADMIN'">
            <template #title>
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/admin">
              <el-icon><UserFilled /></el-icon>
              <span>管理员信息</span>
            </el-menu-item>
            <el-menu-item index="/user">
              <el-icon><UserFilled /></el-icon>
              <span>顾客信息</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item index="/person">
            <el-icon><Money /></el-icon>
            <span>用户充值</span>
          </el-menu-item>

          <el-menu-item index="login" @click="logout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出系统</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div style="flex: 1; width: 0; background-color: #f8f8ff; padding: 10px">
        <router-view @updateUser="updateUser" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { useRoute } from "vue-router";
import { User, UserFilled } from "@element-plus/icons-vue";

const $route = useRoute()

const data = reactive({
  user: JSON.parse(localStorage.getItem('canteen-user') || '{}')
})

const logout = () => {
  localStorage.removeItem('canteen-user')
}

const updateUser = () => {
  data.user = JSON.parse(localStorage.getItem('canteen-user') || '{}')
}
</script>

<style scoped>
.el-menu-item.is-active {
  background-color: #e0e4ff !important;
}

.el-menu-item:hover {
  background-color: #e9eeff !important;
  color: #1450aa;
}

:deep(th) {
  color: #333;
}
</style>
