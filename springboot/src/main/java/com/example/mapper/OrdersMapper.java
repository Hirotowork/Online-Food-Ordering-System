package com.example.mapper;

import com.example.entity.Orders;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

public interface OrdersMapper {

    void insert(Orders orders);

    void deleteById(Integer id);

    void updateById(Orders orders);

    @Select("select * from orders where id = #{id}")
    Orders selectById(Integer id);

    List<Orders> selectAll(@Param("userName") String userName, @Param("userId") Integer userId);

}
