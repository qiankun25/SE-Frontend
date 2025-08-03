import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CertificateResultTable from "../CertificateResultTable.vue";

describe("CertificateResultTable - Location Display", () => {
  const mockData = [
    {
      companyId: "AA03",
      companyName: "北汽福田汽车",
      vehicleBrand: "福田牌",
      vehicleModel: "AABBCCDDEEFF-03",
      vehicleName: "载货汽车底盘",
      vehicleCategory: "DP",
      fuelType: "汽油",
      newEnergyType: null,
      productionAddress: "山东省诸城市",
      productionProvince: "山东",
      productionCity: "潍坊",
      certificateCount: 54,
      uploadYear: 2022,
      uploadMonth: 2,
      ranking: 1,
    },
    {
      companyId: "AA04",
      companyName: "中国重汽",
      vehicleBrand: "重汽牌",
      vehicleModel: "AABBCCDDEEFF-04",
      vehicleName: "载货汽车",
      vehicleCategory: "QX",
      fuelType: "柴油",
      newEnergyType: null,
      productionAddress: "山东省章丘市",
      productionProvince: "山东",
      productionCity: "济南",
      certificateCount: 45,
      uploadYear: 2022,
      uploadMonth: 3,
      ranking: 2,
    },
  ];

  it("should display province column when province condition exists", () => {
    const searchConditions = [
      {
        productionProvinces: ["山东省"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockData,
        loading: false,
        searchConditions,
      },
    });

    // 检查是否有省份列
    const provinceColumn = wrapper
      .find("th")
      .filter((th) => th.text().includes("生产省份"));
    expect(provinceColumn.exists()).toBe(true);
  });

  it("should display city column when city condition exists", () => {
    const searchConditions = [
      {
        productionCities: ["潍坊", "济南"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockData,
        loading: false,
        searchConditions,
      },
    });

    // 检查是否有城市列
    const cityColumn = wrapper
      .find("th")
      .filter((th) => th.text().includes("生产城市"));
    expect(cityColumn.exists()).toBe(true);
  });

  it("should display address column when address condition exists", () => {
    const searchConditions = [
      {
        productionAddresses: ["山东省诸城市"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockData,
        loading: false,
        searchConditions,
      },
    });

    // 检查是否有生产地址列
    const addressColumn = wrapper
      .find("th")
      .filter((th) => th.text().includes("生产地址"));
    expect(addressColumn.exists()).toBe(true);
  });

  it("should display all location columns when all conditions exist", () => {
    const searchConditions = [
      {
        productionProvinces: ["山东省"],
        productionCities: ["潍坊"],
        productionAddresses: ["山东省诸城市"],
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockData,
        loading: false,
        searchConditions,
      },
    });

    // 检查是否有所有位置相关列
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).toContain("生产省份");
    expect(headers).toContain("生产城市");
    expect(headers).toContain("生产地址");
  });

  it("should not display location columns when no location conditions exist", () => {
    const searchConditions = [
      {
        companyName: "北汽福田汽车",
      },
    ];

    const wrapper = mount(CertificateResultTable, {
      props: {
        data: mockData,
        loading: false,
        searchConditions,
      },
    });

    // 检查不应该有位置相关列
    const headers = wrapper.findAll("th").map((th) => th.text());
    expect(headers).not.toContain("生产省份");
    expect(headers).not.toContain("生产城市");
    expect(headers).not.toContain("生产地址");
  });
});
