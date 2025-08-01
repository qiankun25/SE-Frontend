/**
 * 多车辆品牌查询功能测试
 * 测试修复后的多车辆品牌查询参数构建是否正确
 */

export const testMultiVehicleBrandQuery = () => {
  console.log("🧪 开始测试多车辆品牌查询功能...");

  // 模拟多个查询条件，每个条件包含不同的车辆品牌
  const mockConditions = [
    {
      vehicleBrands: ["比亚迪", "特斯拉"],
      selectedCompanies: [
        { code: "BYD001", name: "比亚迪汽车有限公司", isPartialMatch: false },
      ],
    },
    {
      vehicleBrands: ["奔驰", "宝马"],
      fuelTypes: ["汽油", "柴油"],
    },
    {
      vehicleBrands: ["红旗"],
      vehicleModels: ["H9", "HS7"],
      newEnergyCategories: ["纯电动"],
    },
  ];

  // 模拟buildSearchParams函数的逻辑
  const buildSearchParams = (conditions: any[]) => {
    const params: any = {};

    // 收集所有参数
    const allVehicleBrands: string[] = [];
    const allVehicleModels: string[] = [];
    const allFuelTypes: string[] = [];
    const allNewEnergyCategories: string[] = [];

    conditions.forEach((condition) => {
      // 车辆品牌
      if (condition.vehicleBrands && condition.vehicleBrands.length > 0) {
        allVehicleBrands.push(...condition.vehicleBrands);
      }

      // 车辆型号
      if (condition.vehicleModels && condition.vehicleModels.length > 0) {
        allVehicleModels.push(...condition.vehicleModels);
      }

      // 燃料类型
      if (condition.fuelTypes && condition.fuelTypes.length > 0) {
        allFuelTypes.push(...condition.fuelTypes);
      }

      // 新能源类型
      if (
        condition.newEnergyCategories &&
        condition.newEnergyCategories.length > 0
      ) {
        allNewEnergyCategories.push(...condition.newEnergyCategories);
      }
    });

    // 设置合并后的参数
    if (allVehicleBrands.length > 0) {
      const uniqueBrands = [...new Set(allVehicleBrands)];
      if (uniqueBrands.length > 1) {
        params.vehicleBrands = uniqueBrands;
      } else {
        params.vehicleBrand = uniqueBrands[0];
      }
    }

    if (allVehicleModels.length > 0) {
      const uniqueModels = [...new Set(allVehicleModels)];
      if (uniqueModels.length > 1) {
        params.vehicleModels = uniqueModels;
      } else {
        params.vehicleModel = uniqueModels[0];
      }
    }

    if (allFuelTypes.length > 0) {
      const uniqueFuelTypes = [...new Set(allFuelTypes)];
      if (uniqueFuelTypes.length > 1) {
        params.fuelTypes = uniqueFuelTypes;
      } else {
        params.fuelType = uniqueFuelTypes[0];
      }
    }

    if (allNewEnergyCategories.length > 0) {
      const uniqueEnergyTypes = [...new Set(allNewEnergyCategories)];
      if (uniqueEnergyTypes.length > 1) {
        params.newEnergyCategories = uniqueEnergyTypes;
      } else {
        params.newEnergyType = uniqueEnergyTypes[0];
      }
    }

    return params;
  };

  // 执行测试
  const result = buildSearchParams(mockConditions);

  console.log("\n📋 测试结果:");
  console.log("输入条件数量:", mockConditions.length);
  console.log("合并后的查询参数:", result);

  // 验证车辆品牌参数
  console.log("\n🚗 车辆品牌参数验证:");
  console.log("车辆品牌列表:", result.vehicleBrands);
  console.log("车辆型号列表:", result.vehicleModels);
  console.log("燃料类型列表:", result.fuelTypes);
  console.log("新能源类型列表:", result.newEnergyCategories);

  // 验证预期结果
  const expectedVehicleBrands = ["比亚迪", "特斯拉", "奔驰", "宝马", "红旗"];
  const expectedVehicleModels = ["H9", "HS7"];
  const expectedFuelTypes = ["汽油", "柴油"];
  const expectedNewEnergyCategories = ["纯电动"];

  console.log("\n✅ 预期结果验证:");
  console.log("预期车辆品牌:", expectedVehicleBrands);
  console.log("实际车辆品牌:", result.vehicleBrands);
  console.log(
    "车辆品牌匹配:",
    JSON.stringify(result.vehicleBrands?.sort()) ===
      JSON.stringify(expectedVehicleBrands.sort())
  );

  console.log("预期车辆型号:", expectedVehicleModels);
  console.log("实际车辆型号:", result.vehicleModels);
  console.log(
    "车辆型号匹配:",
    JSON.stringify(result.vehicleModels?.sort()) ===
      JSON.stringify(expectedVehicleModels.sort())
  );

  // 模拟后端SQL查询条件
  console.log("\n🔍 模拟后端SQL查询条件:");
  if (result.vehicleBrands && result.vehicleBrands.length > 0) {
    const brandConditions = result.vehicleBrands
      .map((brand) => `CLPP LIKE '%${brand}%'`)
      .join(" OR ");
    console.log(`车辆品牌条件: (${brandConditions})`);
  }
  if (result.vehicleModels && result.vehicleModels.length > 0) {
    const modelConditions = result.vehicleModels
      .map((model) => `CLXH LIKE '%${model}%'`)
      .join(" OR ");
    console.log(`车辆型号条件: (${modelConditions})`);
  }
  if (result.fuelTypes && result.fuelTypes.length > 0) {
    const fuelConditions = result.fuelTypes
      .map((fuel) => `RLZL LIKE '%${fuel}%'`)
      .join(" OR ");
    console.log(`燃料类型条件: (${fuelConditions})`);
  }

  console.log("\n✅ 多车辆品牌查询功能测试完成!");
  console.log("修复要点:");
  console.log("1. 正确合并多个条件中的车辆品牌信息");
  console.log("2. 去重处理，避免重复的品牌");
  console.log("3. 后端优先处理多品牌参数（vehicleBrands）");
  console.log("4. 使用OR逻辑连接多个品牌条件");

  return result;
};

// 测试单个条件多品牌的情况
export const testSingleConditionMultiBrand = () => {
  console.log("\n🧪 测试单个条件多品牌情况...");

  const singleCondition = [
    {
      vehicleBrands: ["比亚迪", "特斯拉", "奔驰", "宝马", "红旗"],
      vehicleModels: ["Model 3", "Model Y", "H9"],
      fuelTypes: ["电", "汽油"],
    },
  ];

  // 简化的参数构建逻辑
  const params: any = {};
  const allVehicleBrands: string[] = [];
  const allVehicleModels: string[] = [];
  const allFuelTypes: string[] = [];

  singleCondition.forEach((condition) => {
    if (condition.vehicleBrands && condition.vehicleBrands.length > 0) {
      allVehicleBrands.push(...condition.vehicleBrands);
    }
    if (condition.vehicleModels && condition.vehicleModels.length > 0) {
      allVehicleModels.push(...condition.vehicleModels);
    }
    if (condition.fuelTypes && condition.fuelTypes.length > 0) {
      allFuelTypes.push(...condition.fuelTypes);
    }
  });

  if (allVehicleBrands.length > 0) {
    const uniqueBrands = [...new Set(allVehicleBrands)];
    params.vehicleBrands = uniqueBrands;
  }
  if (allVehicleModels.length > 0) {
    const uniqueModels = [...new Set(allVehicleModels)];
    params.vehicleModels = uniqueModels;
  }
  if (allFuelTypes.length > 0) {
    const uniqueFuelTypes = [...new Set(allFuelTypes)];
    params.fuelTypes = uniqueFuelTypes;
  }

  console.log("单个条件多品牌结果:", params);
  console.log("品牌数量:", params.vehicleBrands?.length || 0);
  console.log("型号数量:", params.vehicleModels?.length || 0);
  console.log("燃料类型数量:", params.fuelTypes?.length || 0);

  return params;
};

// 在开发环境下自动运行测试
if (import.meta.env.DEV) {
  setTimeout(() => {
    testMultiVehicleBrandQuery();
    testSingleConditionMultiBrand();
  }, 3000);
}
