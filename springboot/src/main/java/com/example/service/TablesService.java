package com.example.service;

import com.example.entity.Tables;
import com.example.exception.CustomException;
import com.example.mapper.TablesMapper;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

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
        Tables currentTable = tablesMapper.selectById(tables.getId());
        if (currentTable == null) {
            throw new CustomException("餐桌不存在");
        }
        if (!"是".equals(currentTable.getFree()) && !Objects.equals(currentTable.getUserId(), tables.getUserId())) {
            throw new CustomException("该餐桌已被占用");
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

    public Tables selectCurrentTable(Integer currentUserId) {
        if (currentUserId == null) {
            throw new CustomException("请先登录");
        }
        return tablesMapper.selectByUserId(currentUserId);
    }

    public Tables reserveCurrentTable(Integer tableId, Integer currentUserId) {
        if (currentUserId == null) {
            throw new CustomException("请先登录");
        }
        if (tableId == null) {
            throw new CustomException("请选择餐桌");
        }
        Tables tables = new Tables();
        tables.setId(tableId);
        tables.setUserId(currentUserId);
        this.addOrder(tables);
        return this.selectById(tableId);
    }

    public void removeCurrentTable(Integer currentUserId) {
        if (currentUserId == null) {
            throw new CustomException("请先登录");
        }
        Tables tables = tablesMapper.selectByUserId(currentUserId);
        if (tables == null) {
            return;
        }
        tablesMapper.removeOrder(tables.getId());
    }
}
