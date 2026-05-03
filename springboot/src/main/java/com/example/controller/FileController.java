package com.example.controller;

import cn.hutool.core.io.FileUtil;
import com.example.common.Result;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

@RestController
@RequestMapping("/files")
public class FileController {

    private static final File PROJECT_ROOT = resolveProjectRoot();
    private static final File PHOTO_DIR = new File(PROJECT_ROOT, "photo");
    private static final File AVATAR_DIR = new File(PHOTO_DIR, "人物头像");
    private static final File FOOD_DIR = new File(PHOTO_DIR, "菜品图片");

    /**
     * 文件上传
     */
    @PostMapping("/upload")
    public Result upload(MultipartFile file) throws IOException {
        if (!FileUtil.exist(PHOTO_DIR)) {
            FileUtil.mkdir(PHOTO_DIR);
        }
        String originalFilename = file.getOriginalFilename();
        File localFile = new File(PHOTO_DIR, originalFilename);
        if (FileUtil.exist(localFile)) {
            originalFilename = FileUtil.mainName(originalFilename) + "_" + System.currentTimeMillis()
                    + "." + FileUtil.extName(originalFilename);
            localFile = new File(PHOTO_DIR, originalFilename);
        }
        file.transferTo(localFile);
        String url = "http://localhost:9090/files/download/" + originalFilename;
        return Result.success(url);
    }

    /**
     * 文件下载
     */
    @GetMapping("/download/{fileName}")
    public void download(@PathVariable String fileName, HttpServletResponse response) throws IOException {
        File file = resolveFile(fileName);
        if (file == null || !file.exists()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        response.setHeader("Content-Disposition", "inline;filename=" + URLEncoder.encode(file.getName(), StandardCharsets.UTF_8));
        String contentType = Files.probeContentType(file.toPath());
        if (contentType != null) {
            response.setContentType(contentType);
        }

        byte[] bytes = FileUtil.readBytes(file);
        ServletOutputStream os = response.getOutputStream();
        os.write(bytes);
        os.flush();
        os.close();
    }

    private static File resolveFile(String fileName) {
        File exactInRoot = new File(PHOTO_DIR, fileName);
        if (exactInRoot.exists()) {
            return exactInRoot;
        }

        File exactInAvatar = new File(AVATAR_DIR, fileName);
        if (exactInAvatar.exists()) {
            return exactInAvatar;
        }

        File exactInFood = new File(FOOD_DIR, fileName);
        if (exactInFood.exists()) {
            return exactInFood;
        }

        String extName = FileUtil.extName(fileName);
        String mainName = FileUtil.mainName(fileName);
        String normalizedMainName = mainName.replaceFirst("_[0-9]{10,}$", "");
        String normalizedFileName = normalizedMainName + (extName.isEmpty() ? "" : "." + extName);

        File avatarFile = new File(AVATAR_DIR, normalizedFileName);
        if (avatarFile.exists()) {
            return avatarFile;
        }

        File foodFile = new File(FOOD_DIR, normalizedFileName);
        if (foodFile.exists()) {
            return foodFile;
        }

        File rootFile = new File(PHOTO_DIR, normalizedFileName);
        if (rootFile.exists()) {
            return rootFile;
        }

        return null;
    }

    private static File resolveProjectRoot() {
        File current = new File(System.getProperty("user.dir")).getAbsoluteFile();
        if (new File(current, "photo").exists()) {
            return current;
        }

        File parent = current.getParentFile();
        if (parent != null && new File(parent, "photo").exists()) {
            return parent;
        }

        return current;
    }
}
