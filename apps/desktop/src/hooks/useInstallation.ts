import { useCallback, useEffect, useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import type { EnvironmentInfo } from "@/types/environment.types";

import {
  InstallState,
  type InstallProgressEvent,
} from "@/types/installation.types";

export function useInstallation(
  environment: EnvironmentInfo | null,
  enabled: boolean,
) {
  const [installState, setInstallState] = useState<InstallState>(
    InstallState.IDLE,
  );

  const [installMessage, setInstallMessage] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);

  const handleInstall = useCallback(async () => {
    if (!environment) {
      return;
    }

    try {
      setShowModal(true);

      setInstallState(InstallState.DOWNLOADING);

      setInstallMessage(null);

      await invoke<string>("download_and_install_driver", {
        arch: environment.architecture,
      });

      setInstallState(InstallState.SUCCESS);
    } catch (error) {
      console.error("[Driver Installation]", error);

      let userMessage = "Falha na instalação.";

      const err = error instanceof Error ? error.message : String(error);

      if (
        err.includes("cancelada") ||
        err.includes("CANCELADO") ||
        err.includes("permissão")
      ) {
        userMessage = "Instalação cancelada pelo usuário.";
      } else if (err.includes("não encontrado")) {
        userMessage = "Driver não encontrado.";
      }

      setInstallMessage(userMessage);

      setInstallState(InstallState.ERROR);
    }
  }, [environment]);

  useEffect(() => {
    const unlistenPromise = listen<InstallProgressEvent>(
      "install-progress",
      (event) => {
        const { step, message } = event.payload;

        setInstallMessage(message);

        switch (step) {
          case "downloading":
            setInstallState(InstallState.DOWNLOADING);
            break;

          case "verifying":
            setInstallState(InstallState.VERIFYING);
            break;

          case "installing":
            setInstallState(InstallState.INSTALLING);
            break;

          case "completed":
            setInstallState(InstallState.SUCCESS);
            break;

          case "error":
            setInstallState(InstallState.ERROR);
            break;
        }
      },
    );

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    if (enabled && environment && installState === InstallState.IDLE) {
      handleInstall();
    }
  }, [enabled, environment, installState, handleInstall]);

  const retryInstallation = useCallback(() => {
    handleInstall();
  }, [handleInstall]);

  const closeModal = useCallback(() => {
    if (
      installState === InstallState.SUCCESS ||
      installState === InstallState.ERROR
    ) {
      setShowModal(false);
    }
  }, [installState]);

  const reset = useCallback(() => {
    setInstallState(InstallState.IDLE);

    setInstallMessage(null);

    setShowModal(false);
  }, []);

  return {
    installState,
    installMessage,
    showModal,
    retryInstallation,
    closeModal,
    reset,
  };
}
