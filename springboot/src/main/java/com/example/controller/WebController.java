package com.example.controller;

import cn.hutool.core.util.StrUtil;
import com.example.common.Result;
import com.example.common.RoleEnum;
import com.example.common.TokenUtils;
import com.example.entity.Account;
import com.example.entity.Admin;
import com.example.entity.User;
import com.example.service.AdminService;
import com.example.service.UserService;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WebController {

    @Resource
    AdminService adminService;

    @Resource
    UserService userService;

    /**
     * 默认请求接口
     */
    @GetMapping("/")
    public Result hello() {
        return Result.success();
    }

    @PostMapping("/login")
    public Result login(@RequestBody Account account) {
        if (StrUtil.isBlank(account.getRole())) {
            account.setRole(RoleEnum.ADMIN.name());
        }
        return doLogin(account);
    }

    @PostMapping("/auth/login")
    public Result authLogin(@RequestBody Account account) {
        return doLogin(account);
    }

    @PostMapping("/auth/register")
    public Result authRegister(@RequestBody User user) {
        return doRegister(user);
    }

    @PostMapping("/register")
    public Result register(@RequestBody User user) {
        return Result.error("请使用微信小程序注册用户账号");
    }

    private Result doLogin(Account account) {
        if (RoleEnum.ADMIN.name().equals(account.getRole())) {
            account = adminService.login(account);
        } else if (RoleEnum.USER.name().equals(account.getRole())) {
            account = userService.login(account);
        } else {
            return Result.error("您的参数输入错误");
        }
        account.setPassword(null);
        account.setToken(TokenUtils.createToken(account));
        return Result.success(account);
    }

    private Result doRegister(User user) {
        if (RoleEnum.USER.name().equals(user.getRole())) {
            userService.register(user);
        } else {
            return Result.error("您的参数输入错误");
        }
        return Result.success();
    }
}
