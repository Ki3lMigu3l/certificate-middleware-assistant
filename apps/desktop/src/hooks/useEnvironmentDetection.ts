import { useCallback, useRef, useState } from "react";

import { getSystemInfo } from "@/services/environment.service";
import { DetectionState, EnvironmentInfo } from "@/types/environment.types";

const STEP_DELAY = 900;

export enum DetectionStep {
  OS = "os",
  VERSION = "version",
  ARCHITECTURE = "architecture",
  TOKEN = "token",
  COMPLETE = "complete",
}

export const DetectionStepLabels: Record<DetectionStep, string> = {
  [DetectionStep.OS]: "Detecting Operating System...",
  [DetectionStep.VERSION]: "Detecting Version...",
  [DetectionStep.ARCHITECTURE]: "Detecting Architecture...",
  [DetectionStep.TOKEN]: "Detecting USB Tokens...",
  [DetectionStep.COMPLETE]: "Analysis Complete",
};

export function useEnvironmentDetection() {
  const [state, setState] = useState<DetectionState>("idle");

  const [currentStep, setCurrentStep] = useState<DetectionStep>(
    DetectionStep.OS,
  );

  const [environment, setEnvironment] = useState<EnvironmentInfo | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isRunningRef = useRef(false);

  const updateStep = async (step: DetectionStep, delayMs = STEP_DELAY) => {
    setCurrentStep(step);
    await delay(delayMs);
  };

  const runDetection = useCallback(async () => {
    if (isRunningRef.current) {
      return;
    }

    isRunningRef.current = true;

    try {
      setState("detecting");
      setErrorMessage(null);
      setEnvironment(null);

      await updateStep(DetectionStep.OS);
      await updateStep(DetectionStep.VERSION);
      await updateStep(DetectionStep.ARCHITECTURE);

      const systemInfo = await getSystemInfo();

      await updateStep(DetectionStep.TOKEN);

      const environmentData: EnvironmentInfo = {
        os: `${systemInfo.os} ${systemInfo.osVersion}`,
        architecture: systemInfo.architecture,

        /**
         * Futuramente será substituído pela
         * detecção real dos Tokens.
         */
        token: "Not Detected",
      };

      setEnvironment(environmentData);

      await updateStep(DetectionStep.COMPLETE, 300);

      setState("completed");
    } catch (error) {
      console.error("[Environment Detection]", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to detect environment.";

      setErrorMessage(message);
      setState("error");
    } finally {
      isRunningRef.current = false;
    }
  }, []);

  return {
    state,
    currentStep,
    currentStepLabel: DetectionStepLabels[currentStep],
    environment,
    errorMessage,
    runDetection,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
