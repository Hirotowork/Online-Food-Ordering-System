package com.example.service;

import com.example.entity.Tables;
import com.example.exception.CustomException;
import com.example.mapper.TablesMapper;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TablesService {

    @Resource
    TablesMapper tablesMapper;


    public void add(Tables tables) {
        tablesMapper.insert(tables);
    }

    public void deleteById(Integer id) {
        tablesMapper.deleteById(id);
    }

    public void deleteBatch(List<Integer> ids) {
        for (Integer id : ids) {
            this.deleteById(id);
        }
    }

    public void updateById(Tables tables) {
        if ("是".equals(tables.getFree())) {
            tables.setUserId(null);  // 清除占用的顾客信息
        }
        tablesMapper.updateById(tables);
    }

    public Tables selectById(Integer id) {
        return tablesMapper.selectById(id);
    }

    public List<Tables> selectAll(String name) {
        return tablesMapper.selectAll(name);
    }

    public PageInfo<Tables> selectPage(String name, Integer pageNum, Integer pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<Tables> list = this.selectAll(name);
        return PageInfo.of(list);
    }

    public void addOrder(Tables tables) {
        // 先查询当前的用户有没有占用餐桌
        Tables dbTables = tablesMapper.selectByUserId(tables.getUserId());
        if (dbTables != null && !dbTables.getId().equals(tables.getId())) {
            throw new CustomException("您已经预定了其他餐桌");
        }
        tables.setFree("否");
        this.updateById(tables);
    }

    public Tables selectByUserId(Integer userId) {
        return tablesMapper.selectByUserId(userId);
    }

    public void removeOrder(Tables tables) {
        tablesMapper.removeOrder(tables.getId());
    }
}
