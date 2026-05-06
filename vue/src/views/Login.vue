<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">点餐后台管理系统</div>
      <div class="login-tip">网页端仅供管理员登录，用户请使用微信小程序点餐。</div>
      <el-form ref="formRef" :model="data.form" :rules="data.rules">
        <el-form-item prop="username">
          <el-input
            v-model="data.form.username"
            :prefix-icon="User"
            size="large"
            placeholder="请输入管理员账号"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="data.form.password"
            :prefix-icon="Lock"
            size="large"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button size="large" type="primary" style="width: 100%" @click="login">
            管理员登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Lock, User } from "@element-plus/icons-vue";
import router from "@/router";
import request from "@/utils/request";

const data = reactive({
  form: {
    username: '',
    password: '',
    role: 'ADMIN'
  },
  rules: {
    username: [
      { required: true, message: '请输入管理员账号', trigger: 'blur' },
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
    ],
  }
})

const formRef = ref()

const login = () => {
  formRef.value.validate((valid => {
    if (!valid) {
      return
    }

    request.post('/login', data.form).then(res => {
      if (res.code === '200') {
        localStorage.setItem('canteen-user', JSON.stringify(res.data))
        ElMessage.success('登录成功')
        router.push('/')
      } else {
        ElMessage.error(res.msg)
      }
    })
  })).catch(error => {
    console.error(error)
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: url("@/assets/imgs/bg.jpg");
  background-size: cover;
}

.login-box {
  width: 380px;
  padding: 50px 30px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, .1);
  background-color: rgba(255, 255, 255, .9);
}

.login-title {
  margin-bottom: 12px;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #1450aa;
}

.login-tip {
  margin-bottom: 24px;
  line-height: 1.6;
  font-size: 13px;
  color: #666;
}
</style>
