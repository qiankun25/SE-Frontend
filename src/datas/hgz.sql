/*
 Navicat Premium Data Transfer

 Source Server         : mysql - 10.3.3.51 - 合格证宽表
 Source Server Type    : MySQL
 Source Server Version : 50738
 Source Host           : 10.3.3.51:3306
 Source Schema         : gg_hgz

 Target Server Type    : MySQL
 Target Server Version : 50738
 File Encoding         : 65001

 Date: 13/06/2025 14:50:24
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for hgz
-- ----------------------------
DROP TABLE IF EXISTS `hgz`;
CREATE TABLE `hgz`  (
  `QYDM` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '合格证企业代码',
  `CLZT` varchar(5) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '车辆类别',
  `CLZZQYMC` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '车辆制造企业名称',
  `CLXH` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '车辆型号',
  `CLLX` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '车辆类型',
  `CLPP` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '车辆品牌',
  `CLMC` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '车辆名称',
  `RLZL` varchar(150) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '燃料种类',
  `PL` varchar(150) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '排量',
  `C` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '长',
  `ZZL` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '总质量',
  `ZBZL` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '整备质量',
  `ZJ` varchar(150) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '轴距',
  `UPD` datetime NULL DEFAULT NULL COMMENT '上传时间',
  `SL` int(5) NULL DEFAULT NULL COMMENT '数量',
  `SCDZ` varchar(600) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '生产地址',
  `LSPZXLH` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '配置序列号',
  `CONFIG_SEQUENCE_NUM` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '配置序列号',
  `POINTS_CONF_ID` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '双积分ID',
  `CPH` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '产品号',
  `SF` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '省份',
  `CS` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '城市',
  `QX` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '区县',
  `G50` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '六大类',
  `XNYBJ` varchar(5) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '新能源标记',
  `XNYLB` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '新能源类别',
  `QYID` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '公告企业ID',
  `GXSJ` datetime NULL DEFAULT NULL COMMENT '更新时间',
  `JT` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '集团',
  `UPY` varchar(4) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `UPM` varchar(7) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `FDJXH` varchar(360) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '发动机型号',
  `GL` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '功率',
  `YH` varchar(150) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '油耗',
  INDEX `hgz_CLLX_index`(`CLLX`) USING BTREE,
  INDEX `hgz_CLXH_index`(`CLXH`) USING BTREE,
  INDEX `hgz_CLZT_index`(`CLZT`) USING BTREE,
  INDEX `hgz_CS_index`(`CS`) USING BTREE,
  INDEX `hgz_G50_index`(`G50`) USING BTREE,
  INDEX `hgz_JT_index`(`JT`) USING BTREE,
  INDEX `hgz_QYDM_index`(`QYDM`) USING BTREE,
  INDEX `hgz_QYID_index`(`QYID`) USING BTREE,
  INDEX `hgz_SCDZ_index`(`SCDZ`) USING BTREE,
  INDEX `hgz_SF_index`(`SF`) USING BTREE,
  INDEX `hgz_UPD_index`(`UPD`) USING BTREE,
  INDEX `hgz_UPM_index`(`UPM`) USING BTREE,
  INDEX `hgz_UPY_index`(`UPY`) USING BTREE,
  INDEX `hgz_XNYBJ_index`(`XNYBJ`) USING BTREE,
  INDEX `hgz_XNYLB_index`(`XNYLB`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
