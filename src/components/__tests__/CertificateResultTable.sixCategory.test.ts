import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CertificateResultTable from "../CertificateResultTable.vue";

describe("CertificateResultTable - Six Category Display", () => {
  const mockData = [
    {
      companyId: "AA03",
      companyName: "北汽福田汽车",
      vehicleBrand: "福田牌",
      vehicleModel: "AABBCCDDEEFF-03",
      vehicleName: "载货汽车底盘",
      vehicleCategory: "DP",
      sixCategory: "货车",
      fuelType: "汽油",
      newEnergyType: null,
      productionAddress: "山东省诸城市",
      productionProvince: "山东",
      productionCity: "潍坊",
      certificateCount: 60,
      uploadYear: 2022,
      uploadMonth: 2,
      ranking: 1,
    },
    {
      companyId: "AA08",
      companyName: "广汽丰田",
      vehicleBrand: "丰田牌/TOYOTA",
      vehicleModel: "AABBCCDDEEFF-08",
      vehicleName: "轿车",
      vehicleCategory: "QX",
      sixCategory: "乘用车",
      fuelType: "汽油",
      newEnergyType: null,
      productionAddress: "广州市南沙区",
      productionProvince: "广东",
      productionCity: "广州",
      certificateCount: 1000,
      uploadYear: 2022,
      uploadMonth: 9,
      ranking: 2,
    },
  ];

  it("should display six category column when six category condition exists", () => {
    const searchConditions = [
      {
        sixCategories: ["货车"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockData,
        loading: false,
        searchConditions,
      },
    });

    // 检查是否有六大类列
    const sixCategoryColumn = wrapper
      .find("th")
      .filter((th) => th.text().includes("六大类"));
    expect(sixCategoryColumn.exists()).toBe(true);
  });

  it("should display six category column when multiple categories are selected", () => {
    const searchConditions = [
      {
        sixCategories: ["货车", "乘用车", "专用车"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockData,
        loading: false,
        searchConditions,
      },
    });

    // 检查是否有六大类列
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).toContain("六大类");
  });

  it("should not display six category column when no six category condition exists", () => {
    const searchConditions = [
      {
        companyName: "北汽福田汽车",
        fuelTypes: ["汽油"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockData,
        loading: false,
        searchConditions,
      },
    });

    // 检查不应该有六大类列
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).not.toContain("六大类");
  });

  it("should display six category data correctly in table cells", () => {
    const searchConditions = [
      {
        sixCategories: ["货车", "乘用车"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockData,
        loading: false,
        searchConditions,
      },
    });

    // 检查表格数据是否正确显示
    const tableCells = wrapper.findAll("td");
    const cellTexts = tableCells.map((cell) => cell.text());

    // 应该包含六大类的数据
    expect(cellTexts).toContain("货车");
    expect(cellTexts).toContain("乘用车");
  });

  it("should display six category column with other condition columns", () => {
    const searchConditions = [
      {
        sixCategories: ["货车"],
        productionProvinces: ["山东省"],
        fuelTypes: ["汽油"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockData,
        loading: false,
        searchConditions,
      },
    });

    // 检查应该同时显示多个条件相关的列
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).toContain("六大类");
    expect(headers).toContain("生产省份");
    expect(headers).toContain("燃料种类");
  });
});
