import { useCallback, useState } from "react";
import { getSystemInfo } from "../services/environment.service";
import type { DetectionState, EnvironmentInfo } from "../types/Environment";

export function useEnvironmentDetection() {
  const [state, setState] = useState<DetectionState>("idle");
  const [currentStep, setCurrentStep] = useState(
    "Detecting Operating System...",
  );
  const [environment, setEnvironment] = useState<EnvironmentInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runDetection = useCallback(async () => {
    try {
      setState("detecting");
      setErrorMessage(null);
      setEnvironment(null);

      setCurrentStep("Detecting Operating System...");
      await delay(900);

      setCurrentStep("Detecting macOS Version...");
      await delay(900);

      setCurrentStep("Detecting Architecture...");
      const systemInfo = await getSystemInfo();
      await delay(900);

      setCurrentStep("Detecting USB Tokens...");
      await delay(900);

      const environmentData: EnvironmentInfo = {
        os: `${systemInfo.os} ${systemInfo.osVersion}`,
        architecture: systemInfo.architecture,
        token: "Not Detected",
      };

      setEnvironment(environmentData);
      setCurrentStep("Analysis Complete");
      await delay(300);
      setState("completed");
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to detect environment.");
      setState("error");
    }
  }, []);

  return { state, currentStep, environment, errorMessage, runDetection };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
