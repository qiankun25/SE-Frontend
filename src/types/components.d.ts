declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "../datas/companiesData.js" {
  import type { Company } from "./company";
  export const companiesData: Company[];
}
