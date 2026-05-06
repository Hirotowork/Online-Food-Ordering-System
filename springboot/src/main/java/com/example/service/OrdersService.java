package com.example.service;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import com.example.common.AuthContext;
import com.example.common.RoleEnum;
import com.example.entity.Orders;
import com.example.entity.User;
import com.example.exception.CustomException;
import com.example.mapper.OrdersMapper;
import com.example.mapper.UserMapper;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
public class OrdersService {

    @Resource
    OrdersMapper ordersMapper;

    @Resource
    UserMapper userMapper;

    public void add(Orders orders) {
        this.prepareOrderForInsert(orders);
        String orderNo = IdUtil.fastSimpleUUID();
        orders.setOrderNo(orderNo);
        orders.setTime(DateUtil.now());
        ordersMapper.insert(orders);
    }

    public Orders addForCurrentUser(Orders orders, Integer currentUserId) {
        if (currentUserId == null) {
            throw new CustomException("请先登录");
        }
        orders.setUserId(currentUserId);
        this.add(orders);
        return orders;
    }

    public void deleteById(Integer id) {
        ordersMapper.deleteById(id);
    }

    public void deleteBatch(List<Integer> ids) {
        for (Integer id : ids) {
            this.deleteById(id);
        }
    }

    public void updateById(Orders orders) {
        Orders dbOrder = this.selectById(orders.getId());
        if (dbOrder == null) {
            throw new CustomException("订单不存在");
        }

        if ("已完成".equals(orders.getStatus()) && !"已完成".equals(dbOrder.getStatus())) {
            this.deductUserBalance(dbOrder);
        }
        ordersMapper.updateById(orders);
    }

    public Orders selectById(Integer id) {
        return ordersMapper.selectById(id);
    }

    public List<Orders> selectAll(String userName, Integer userId) {
        return ordersMapper.selectAll(userName, userId);
    }

    public BigDecimal selectTotalIncome(String userName, Integer userId) {
        BigDecimal totalIncome = ordersMapper.selectTotalByStatus(userName, userId, "已完成");
        return totalIncome == null ? BigDecimal.ZERO : totalIncome;
    }

    public List<Orders> selectMyOrders(Integer currentUserId) {
        if (currentUserId == null) {
            throw new CustomException("请先登录");
        }
        return this.selectAll(null, currentUserId);
    }

    public Orders settleOrder(Integer orderId, Integer currentUserId) {
        if (currentUserId == null) {
            throw new CustomException("请先登录");
        }

        Orders dbOrder = this.selectById(orderId);
        if (dbOrder == null) {
            throw new CustomException("订单不存在");
        }
        if (!Objects.equals(dbOrder.getUserId(), currentUserId)) {
            throw new CustomException("无权结算该订单");
        }
        if ("已完成".equals(dbOrder.getStatus())) {
            return dbOrder;
        }
        if (!"待结算".equals(dbOrder.getStatus())) {
            throw new CustomException("当前订单状态不允许结算");
        }

        this.deductUserBalance(dbOrder);
        Orders updateOrder = new Orders();
        updateOrder.setId(orderId);
        updateOrder.setStatus("已完成");
        ordersMapper.updateById(updateOrder);
        dbOrder.setStatus("已完成");
        return dbOrder;
    }

    public PageInfo<Orders> selectPage(String userName, Integer userId, Integer pageNum, Integer pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<Orders> list = this.selectAll(userName, userId);
        return PageInfo.of(list);
    }

    private void prepareOrderForInsert(Orders orders) {
        if (orders.getUserId() == null) {
            throw new CustomException("用户信息不能为空");
        }

        if (StrUtil.isBlank(orders.getStatus())) {
            orders.setStatus("待结算");
        }

        if (StrUtil.isNotBlank(orders.getUserRole())) {
            return;
        }

        String currentRole = AuthContext.getCurrentRole();
        if (StrUtil.isNotBlank(currentRole)) {
            orders.setUserRole(currentRole);
            return;
        }

        User user = userMapper.selectById(orders.getUserId());
        if (user == null) {
            throw new CustomException("用户不存在");
        }
        orders.setUserRole(StrUtil.blankToDefault(user.getRole(), RoleEnum.USER.name()));
    }

    private void deductUserBalance(Orders orders) {
        User user = userMapper.selectById(orders.getUserId());
        if (user == null) {
            throw new CustomException("用户不存在");
        }

        BigDecimal total = orders.getTotal();
        BigDecimal account = user.getAccount().subtract(total);
        if (account.doubleValue() < 0) {
            throw new CustomException("账户余额不足");
        }
        user.setAccount(account);
        userMapper.updateById(user);
    }
}
