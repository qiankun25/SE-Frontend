import { config } from "@vue/test-utils";

// Mock Element Plus components for testing with proper templates
config.global.stubs = {
  "el-button": {
    template:
      '<button class="el-button" @click="$emit(\'click\')"><slot /></button>',
    emits: ["click"],
  },
  "el-tooltip": {
    template: '<div class="el-tooltip"><slot /></div>',
  },
  "el-icon": {
    template: '<i class="el-icon"><slot /></i>',
  },
  "el-alert": {
    template: '<div class="el-alert"><slot /></div>',
  },
  "el-tag": {
    template: '<span class="el-tag"><slot /></span>',
  },
};

// Mock Element Plus icons
config.global.stubs["QuestionFilled"] = {
  template: '<i class="question-filled-icon"></i>',
};
config.global.stubs["Check"] = {
  template: '<i class="check-icon"></i>',
};
config.global.stubs["TrendCharts"] = {
  template: '<i class="trend-charts-icon"></i>',
};
