package com.example.common;

import cn.hutool.core.convert.Convert;
import cn.hutool.core.util.StrUtil;
import cn.hutool.jwt.JWT;
import cn.hutool.jwt.JWTUtil;
import com.example.entity.Account;
import com.example.exception.CustomException;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class TokenUtils {
    private static final byte[] TOKEN_KEY = "canteen-miniapp-jwt-secret".getBytes(StandardCharsets.UTF_8);
    private static final long EXPIRE_MILLIS = 7L * 24 * 60 * 60 * 1000;

    private TokenUtils() {
    }

    public static String createToken(Account account) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", account.getId());
        payload.put("role", account.getRole());
        payload.put("exp", System.currentTimeMillis() + EXPIRE_MILLIS);
        return JWTUtil.createToken(payload, TOKEN_KEY);
    }

    public static TokenPayload parseToken(String token) {
        if (StrUtil.isBlank(token)) {
            throw new CustomException("请先登录");
        }

        JWT jwt = JWTUtil.parseToken(token).setKey(TOKEN_KEY);
        if (!jwt.verify() || !jwt.validate(0)) {
            throw new CustomException("登录已失效，请重新登录");
        }

        Integer userId = Convert.toInt(jwt.getPayload("id"));
        String role = Convert.toStr(jwt.getPayload("role"));
        if (userId == null || StrUtil.isBlank(role)) {
            throw new CustomException("登录信息无效，请重新登录");
        }
        return new TokenPayload(userId, role);
    }

    public record TokenPayload(Integer userId, String role) {
    }
}
