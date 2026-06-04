import { motion } from "framer-motion";

import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useEnvironmentDetection } from "@/hooks/useEnvironmentDetection";

import { EnvironmentStatusCard } from "@/components/home/EnvironmentStatusCard";
import { InstallationModal } from "@/components/home/InstallationModal";

import { useInstallation } from "../hooks/useInstallation";

export function HomePage() {
  const { state, currentStepLabel, environment, runDetection } =
    useEnvironmentDetection();

  const isWindows = environment?.os.toLowerCase().includes("windows") ?? false;

  const isMac = environment?.os.toLowerCase().includes("mac") ?? false;

  const installation = useInstallation(
    environment,
    state === "completed" && (isWindows || isMac),
  );

  const pageTitle = environment
    ? isWindows
      ? "Windows Certificate Middleware Assistant"
      : "macOS Certificate Middleware Assistant"
    : "Certificate Middleware Assistant";

  const pageDescription = environment
    ? isWindows
      ? "Assistente para instalação e diagnóstico de certificados digitais no Windows."
      : "Assistente para instalação e diagnóstico de certificados digitais no macOS."
    : "Assistente para instalação e diagnóstico de certificados digitais.";

  return (
    <div className="relative min-h-screen">
      <motion.main
        className="flex min-h-screen items-center justify-center px-6"
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
      >
        <div className="w-full max-w-2xl">
          <header className="text-center">
            <h1 className="text-4xl font-semibold">{pageTitle}</h1>

            <p className="mt-4 text-muted-foreground">{pageDescription}</p>
          </header>

          {state === "idle" && (
            <div className="mt-10 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={runDetection}
                className="mt-2 cursor-pointer rounded-lg border px-4 py-2 bg-black/2 backdrop-blur-md"
              >
                Detectar Sistema
              </motion.button>
            </div>
          )}

          {state === "detecting" && (
            <div className="mt-10 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin" />

              <p className="text-sm text-muted-foreground">
                {currentStepLabel}
              </p>
            </div>
          )}

          {state === "completed" && environment && (
            <div className="mt-6">
              <EnvironmentStatusCard
                environment={environment}
                isMac={isMac}
                onRetry={() => {
                  installation.reset();

                  runDetection();
                }}
              />
            </div>
          )}

          {state === "error" && (
            <div className="mt-10 flex flex-col items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />

              <p className="text-sm text-muted-foreground">
                Falha ao detectar o ambiente.
              </p>

              <Button variant="outline" onClick={runDetection}>
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
        <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Developed with React, Tauri and Rust by{" "}
              <span className="font-medium text-foreground">
                Ezequiel Nascimento
              </span>
            </p>

            <a
              href="https://github.com/ezequielnascimento-ofc/certificate-middleware-assistant"
              target="_blank"
              rel="noopener noreferrer"
              className="
                text-xs
                text-muted-foreground
                transition-colors
                hover:text-foreground
                hover:underline
              "
            >
              Open Source Project • MIT License
            </a>
          </div>
        </footer>
      </motion.main>

      <InstallationModal
        isOpen={installation.showModal}
        state={installation.installState}
        message={installation.installMessage}
        platform={isWindows ? "windows" : "macos"}
        onClose={installation.closeModal}
        onRetry={installation.retryInstallation}
      />
    </div>
  );
}
