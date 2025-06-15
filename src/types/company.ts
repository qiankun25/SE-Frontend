// 企业相关类型定义

export interface Subsidiary {
  company_id: number;
  company_name: string;
}

export interface ProductionAddress {
  address: string;
  center: [number, number] | null;
  capacity: number;
}

export interface CertificateData {
  time: string;
  count: number;
}

export interface Vehicle {
  vehicle_brand: string;
  vehicle_category: string;
  new_energy: string | null;
  certificate_count: CertificateData[] | CertificateData[][];
}

export interface Company {
  company_id: number;
  company_name: string;
  social_credit_code: string;
  company_type: string;
  national_standard_industry: string;
  registered_address: string;
  center: [number, number];
  subsidiaries: Subsidiary[];
  parent_company: any | null;
  production_addresses: ProductionAddress[];
  vehicles: Vehicle[];
}

// 字段选择类型
export interface FieldOption {
  key: string;
  label: string;
  selected: boolean;
}
