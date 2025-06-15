export interface SearchCondition {
  company_name?: string;
  national_standard_industry?: string;
  new_energy?: string;
  vehicle_category?: string;
  vehicle_type?: string;
  timeRange?: [Date, Date];
}

export interface SearchForm {
  company_name: string;
  national_standard_industry: string;
  new_energy: string;
  vehicle_category: string;
  vehicle_type: string;
  timeRange?: [string, string];
}
