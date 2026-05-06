package com.example.common;

public class AuthContext {
    private static final ThreadLocal<Integer> CURRENT_USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_ROLE = new ThreadLocal<>();

    private AuthContext() {
    }

    public static void setCurrentUser(Integer userId, String role) {
        CURRENT_USER_ID.set(userId);
        CURRENT_ROLE.set(role);
    }

    public static Integer getCurrentUserId() {
        return CURRENT_USER_ID.get();
    }

    public static String getCurrentRole() {
        return CURRENT_ROLE.get();
    }

    public static void clear() {
        CURRENT_USER_ID.remove();
        CURRENT_ROLE.remove();
    }
}
