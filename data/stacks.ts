import { Stack } from '@/types/drone';

export const stacks: Record<string, Stack> = {
  "iFlight SucceX-E F7 45A": {
    type: "F7 Stack",
    fcProcessor: "STM32F722RET6",
    escCurrentRating: "45A",
    mountingSize: "30.5x30.5mm",
    gyro: "BMI270",
    osd: "Integrated",
    bluetooth: "No",
    voltageInput: "2-6S LiPo"
  },
  "T-Motor F7 HD 60A": {
    type: "F7 Stack",
    fcProcessor: "STM32F722RET6",
    escCurrentRating: "60A",
    mountingSize: "30.5x30.5mm",
    gyro: "ICM42688-P",
    osd: "Integrated",
    bluetooth: "Yes",
    voltageInput: "2-6S LiPo"
  },
  "DJI O3 Air Unit": {
    type: "AIO Stack",
    fcProcessor: "F7",
    escCurrentRating: "50A",
    mountingSize: "30.5x30.5mm",
    gyro: "BMI270",
    osd: "DJI",
    bluetooth: "Yes",
    voltageInput: "2-6S LiPo"
  }
  // Add more stacks as needed...
};
