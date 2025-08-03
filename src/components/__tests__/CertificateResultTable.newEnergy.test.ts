import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CertificateResultTable from "../CertificateResultTable.vue";

describe("CertificateResultTable - New Energy Display", () => {
  const mockNewEnergyData = [
    {
      companyId: "AA06",
      companyName: "肇庆小鹏",
      vehicleBrand: "小鹏牌",
      vehicleModel: "AABBCCDDEEFF-06",
      vehicleName: "纯电动轿车",
      vehicleCategory: "QX",
      sixCategory: "乘用车",
      fuelType: "电",
      newEnergyType: "纯电动",
      productionAddress: "肇庆市高新区",
      productionProvince: "广东",
      productionCity: "肇庆",
      certificateCount: 40,
      uploadYear: 2022,
      uploadMonth: 12,
      ranking: 1,
    },
    {
      companyId: "AA10",
      companyName: "重庆铃耀",
      vehicleBrand: "铃耀牌",
      vehicleModel: "AABBCCDDEEFF-10",
      vehicleName: "插电式混合动力多用途乘用车",
      vehicleCategory: "QX",
      sixCategory: "乘用车",
      fuelType: "混合动力",
      newEnergyType: "插电式混合动力",
      productionAddress: "重庆市渝北区",
      productionProvince: "重庆",
      productionCity: "重庆",
      certificateCount: 20,
      uploadYear: 2022,
      uploadMonth: 1,
      ranking: 2,
    },
  ];

  it("should display new energy category column when new energy condition exists", () => {
    const searchConditions = [
      {
        newEnergyCategories: ["纯电动"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockNewEnergyData,
        loading: false,
        searchConditions,
      },
    });

    // 检查是否有新能源类别列
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).toContain("新能源类别");
  });

  it("should display new energy category column when multiple categories are selected", () => {
    const searchConditions = [
      {
        newEnergyCategories: ["纯电动", "插电式混合动力", "燃料电池"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockNewEnergyData,
        loading: false,
        searchConditions,
      },
    });

    // 检查是否有新能源类别列
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).toContain("新能源类别");
  });

  it("should not display new energy category column when no new energy condition exists", () => {
    const searchConditions = [
      {
        companyName: "肇庆小鹏",
        fuelTypes: ["电"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockNewEnergyData,
        loading: false,
        searchConditions,
      },
    });

    // 检查不应该有新能源类别列
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).not.toContain("新能源类别");
  });

  it("should display correct new energy type data in table cells", () => {
    const searchConditions = [
      {
        newEnergyCategories: ["纯电动", "插电式混合动力"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockNewEnergyData,
        loading: false,
        searchConditions,
      },
    });

    // 检查表格数据是否正确显示新能源类别
    const tableCells = wrapper.findAll("td");
    const cellTexts = tableCells.map((cell) => cell.text());

    // 应该包含新能源类别的数据
    expect(cellTexts).toContain("纯电动");
    expect(cellTexts).toContain("插电式混合动力");
  });

  it("should use correct field key for new energy type", () => {
    const searchConditions = [
      {
        newEnergyCategories: ["纯电动"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockNewEnergyData,
        loading: false,
        searchConditions,
      },
    });

    // 检查动态列配置是否使用了正确的字段名
    const component = wrapper.vm as any;
    const columns = component.dynamicColumns;

    const newEnergyColumn = columns.find(
      (col: any) => col.label === "新能源类别"
    );
    expect(newEnergyColumn).toBeDefined();
    expect(newEnergyColumn.key).toBe("newEnergyType");
  });

  it("should display new energy column with other condition columns", () => {
    const searchConditions = [
      {
        newEnergyCategories: ["纯电动"],
        sixCategories: ["乘用车"],
        productionProvinces: ["广东省"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockNewEnergyData,
        loading: false,
        searchConditions,
      },
    });

    // 检查应该同时显示多个条件相关的列
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).toContain("新能源类别");
    expect(headers).toContain("六大类");
    expect(headers).toContain("生产省份");
  });
});
