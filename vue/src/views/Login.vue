<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">订餐后台系统</div>
      <div class="login-tip">网页端仅供管理员登录，用户请使用微信小程序订餐。</div>

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
          <el-button size="large" type="primary" class="full-width" @click="login">
            管理员登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-actions">
        <span>还没有管理员账号？</span>
        <el-button link type="primary" @click="openRegister">立即注册</el-button>
      </div>
    </div>

    <el-dialog v-model="data.registerVisible" title="管理员注册" width="420px" destroy-on-close>
      <el-form ref="registerFormRef" :model="data.registerForm" :rules="data.registerRules" label-width="0">
        <el-form-item prop="username">
          <el-input
            v-model="data.registerForm.username"
            :prefix-icon="User"
            size="large"
            placeholder="请输入管理员账号"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="data.registerForm.password"
            :prefix-icon="Lock"
            size="large"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="data.registerForm.confirmPassword"
            :prefix-icon="Lock"
            size="large"
            placeholder="请确认密码"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span>
          <el-button @click="data.registerVisible = false">取消</el-button>
          <el-button type="primary" @click="register">注册</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Lock, User } from "@element-plus/icons-vue";
import router from "@/router";
import request from "@/utils/request";

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请确认密码'))
    return
  }
  if (value !== data.registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

const createRegisterForm = () => ({
  username: '',
  password: '',
  confirmPassword: '',
  role: 'ADMIN'
})

const data = reactive({
  form: {
    username: '',
    password: '',
    role: 'ADMIN'
  },
  registerVisible: false,
  registerForm: createRegisterForm(),
  rules: {
    username: [
      { required: true, message: '请输入管理员账号', trigger: 'blur' },
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
    ],
  },
  registerRules: {
    username: [
      { required: true, message: '请输入管理员账号', trigger: 'blur' },
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
    ],
    confirmPassword: [
      { validator: validateConfirmPassword, trigger: 'blur' },
    ],
  }
})

const formRef = ref()
const registerFormRef = ref()

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

const openRegister = () => {
  data.registerForm = createRegisterForm()
  data.registerVisible = true
}

const register = () => {
  registerFormRef.value.validate((valid => {
    if (!valid) {
      return
    }

    request.post('/admin/add', {
      username: data.registerForm.username,
      password: data.registerForm.password,
      role: 'ADMIN'
    }).then(res => {
      if (res.code === '200') {
        ElMessage.success('注册成功，请登录')
        data.form.username = data.registerForm.username
        data.form.password = ''
        data.registerVisible = false
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

.full-width {
  width: 100%;
}

.login-actions {
  margin-top: 8px;
  text-align: right;
  font-size: 13px;
  color: #666;
}
</style>
