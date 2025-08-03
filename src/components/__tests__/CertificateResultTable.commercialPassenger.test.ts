import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CertificateResultTable from "../CertificateResultTable.vue";

describe("CertificateResultTable - Commercial/Passenger Display", () => {
  const mockCommercialData = [
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
      certificateCount: 60,
      ranking: 1,
    },
    {
      companyId: "AA04",
      companyName: "新东轻工",
      vehicleBrand: "新东牌",
      vehicleModel: "AABBCCDDEEFF-04",
      vehicleName: "半挂车",
      vehicleCategory: "QX",
      sixCategory: "挂车",
      fuelType: null,
      newEnergyType: null,
      certificateCount: 150,
      ranking: 2,
    },
  ];

  const mockPassengerData = [
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
      certificateCount: 1000,
      ranking: 1,
    },
    {
      companyId: "AA09",
      companyName: "肇庆小鹏",
      vehicleBrand: "小鹏牌",
      vehicleModel: "AABBCCDDEEFF-09",
      vehicleName: "纯电动轿车",
      vehicleCategory: "QX",
      sixCategory: "乘用车",
      fuelType: "电",
      newEnergyType: "纯电动",
      certificateCount: 400,
      ranking: 2,
    },
  ];

  it("should display six category column when commercial vehicle is selected", () => {
    const searchConditions = [
      {
        commercialOrPassenger: "商用车",
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockCommercialData,
        loading: false,
        searchConditions,
      },
    });

    // 检查是否有六大类列
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).toContain("六大类");
  });

  it("should display six category column when passenger vehicle is selected", () => {
    const searchConditions = [
      {
        commercialOrPassenger: "乘用车",
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockPassengerData,
        loading: false,
        searchConditions,
      },
    });

    // 检查是否有六大类列
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).toContain("六大类");
  });

  it("should display correct six category data for commercial vehicles", () => {
    const searchConditions = [
      {
        commercialOrPassenger: "商用车",
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockCommercialData,
        loading: false,
        searchConditions,
      },
    });

    // 检查表格数据是否正确显示商用车的六大类
    const tableCells = wrapper.findAll("td");
    const cellTexts = tableCells.map((cell) => cell.text());

    // 应该包含商用车相关的六大类
    expect(cellTexts).toContain("货车");
    expect(cellTexts).toContain("挂车");

    // 不应该包含乘用车
    expect(cellTexts).not.toContain("乘用车");
  });

  it("should display correct six category data for passenger vehicles", () => {
    const searchConditions = [
      {
        commercialOrPassenger: "乘用车",
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockPassengerData,
        loading: false,
        searchConditions,
      },
    });

    // 检查表格数据是否正确显示乘用车的六大类
    const tableCells = wrapper.findAll("td");
    const cellTexts = tableCells.map((cell) => cell.text());

    // 应该只包含乘用车
    expect(cellTexts).toContain("乘用车");

    // 不应该包含商用车相关类别
    expect(cellTexts).not.toContain("货车");
    expect(cellTexts).not.toContain("挂车");
    expect(cellTexts).not.toContain("专用车");
  });

  it("should not display six category column when no category condition exists", () => {
    const searchConditions = [
      {
        companyName: "北汽福田汽车",
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockCommercialData,
        loading: false,
        searchConditions,
      },
    });

    // 检查不应该有六大类列
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).not.toContain("六大类");
  });

  it("should display six category column when both specific categories and commercial/passenger are selected", () => {
    const searchConditions = [
      {
        sixCategories: ["货车"],
        commercialOrPassenger: "商用车",
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockCommercialData,
        loading: false,
        searchConditions,
      },
    });

    // 检查应该有六大类列（因为有两种条件都满足）
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).toContain("六大类");
  });
});
