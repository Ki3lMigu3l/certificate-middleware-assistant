import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnvironmentDetection } from "@/hooks/useEnvironmentDetection";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut", staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

export function HomePage() {
  const { state, currentStep, environment, runDetection } =
    useEnvironmentDetection();

  const [installState, setInstallState] = useState<
    "idle" | "downloading" | "verifying" | "installing" | "success" | "error"
  >("idle");
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [installErrorMessage, setInstallErrorMessage] = useState<string | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);

  const isWindows = environment?.os?.toLowerCase().includes("windows") ?? false;
  const isMac = environment?.os?.toLowerCase().includes("mac") ?? false;
  const isOsDetected = environment !== null;

  const pageTitle = isOsDetected
    ? isWindows
      ? "Windows Certificate Middleware Assistant"
      : "macOS Certificate Middleware Assistant"
    : "Certificate Middleware Assistant";

  const pageDescription = isOsDetected
    ? isWindows
      ? "Assistente para instalação e diagnóstico de certificados digitais no Windows."
      : "Assistente para instalação e diagnóstico de certificados digitais no macOS."
    : "Assistente para instalação e diagnóstico de certificados digitais.";

  useEffect(() => {
    const unlisten = listen("install-progress", (event: any) => {
      const { step, message } = event.payload;
      setInstallMessage(message);
      if (step === "downloading") setInstallState("downloading");
      else if (step === "verifying") setInstallState("verifying");
      else if (step === "installing") setInstallState("installing");
      else if (step === "completed") setInstallState("success");
      else if (step === "error") setInstallState("error");
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    if (
      state === "completed" &&
      environment &&
      installState === "idle" &&
      isWindows
    ) {
      setShowModal(true);
      setInstallState("downloading");
      invoke<string>("download_and_install_driver", {
        arch: environment.architecture,
      })
        .then(() => setInstallState("success"))
        .catch((err) => {
          console.error("Erro na instalação:", err);
          let userMessage =
            "Falha na instalação. Tente novamente ou reinicie o computador.";
          const errStr = String(err);
          if (
            errStr.includes("cancelada") ||
            errStr.includes("CANCELADO") ||
            errStr.includes("permissão")
          ) {
            userMessage =
              "Instalação cancelada pelo usuário (permissão de administrador não concedida).";
          } else if (errStr.includes("não encontrado")) {
            userMessage =
              "Arquivo do driver não encontrado. Verifique a instalação do aplicativo.";
          } else if (errStr.includes("código")) {
            userMessage = errStr;
          }
          setInstallMessage(userMessage);
          setInstallState("error");
        });
    }
  }, [state, environment, installState, isWindows]);

  const retryInstallation = () => {
    if (!environment) return;
    setInstallState("downloading");
    setInstallMessage(null);
    invoke<string>("download_and_install_driver", {
      arch: environment.architecture,
    })
      .then(() => setInstallState("success"))
      .catch((err) => {
        console.error("Erro na instalação:", err);
        setInstallMessage(String(err));
        setInstallState("error");
      });
  };

  const closeModal = () => {
    if (installState === "success" || installState === "error") {
      setShowModal(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <motion.main
        className="flex min-h-screen items-center justify-center px-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="w-full max-w-2xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h1
              className="text-4xl font-bold"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {pageTitle}
            </motion.h1>
            <motion.p
              className="mt-4 text-muted-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            >
              {pageDescription}
            </motion.p>
          </motion.div>

          {/* Estado ocioso: botão para iniciar a detecção */}
          {state === "idle" && (
            <motion.div
              className="mt-10 flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="mt-2 cursor-pointer rounded-lg border px-4 py-2"
                onClick={runDetection}
              >
                Detect System
              </motion.button>
            </motion.div>
          )}

          {state === "detecting" && (
            <motion.div
              className="mt-10 flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground">{currentStep}</p>
            </motion.div>
          )}

          {state === "completed" && environment && (
            <motion.div
              className="mt-5"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <CardHeader>
                  <motion.div variants={itemVariants}>
                    <CardTitle>Status do Ambiente</CardTitle>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <motion.div
                    variants={itemVariants}
                    className="flex items-start justify-between"
                  >
                    <div>
                      <p className="font-medium">Sistema Operacional</p>
                      <p className="text-sm text-muted-foreground">
                        {environment.os}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="flex items-start justify-between"
                  >
                    <div>
                      <p className="font-medium">Arquitetura</p>
                      <p className="text-sm text-muted-foreground">
                        {environment.architecture}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="flex items-start justify-between"
                  >
                    <div>
                      <p className="font-medium">Token</p>
                      <p className="text-sm text-muted-foreground">
                        {environment.token}
                      </p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </motion.div>

                  {/* Botão de redetecção (apenas para compatibilidade) */}
                  <motion.div variants={itemVariants}>
                    {environment.token === "Not Detected" ? (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Button
                          className="w-full cursor-pointer"
                          onClick={() => {
                            setInstallState("idle");
                            runDetection();
                          }}
                        >
                          Retry Token Detection
                        </Button>
                      </motion.div>
                    ) : (
                      <Button variant="outline" className="w-full">
                        Token Detectado
                      </Button>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {state === "error" && (
            <motion.div
              className="mt-5 flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-muted-foreground">
                Falha ao detectar o ambiente.
              </p>
              <Button onClick={runDetection} variant="outline">
                Tentar novamente
              </Button>
            </motion.div>
          )}
        </div>
      </motion.main>

      {/* Modal de instalação para Windows (blur) */}
      <AnimatePresence>
        {showModal && isWindows && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs cursor-pointer"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md rounded-xl bg-background p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {(installState === "success" || installState === "error") && (
                <button
                  onClick={closeModal}
                  className="absolute right-4 top-4 rounded-full p-1 hover:bg-muted cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              {/* Downloading */}
              {installState === "downloading" && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <div>
                    <h3 className="text-xl font-semibold">
                      Baixando driver...
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {installMessage ||
                        "A transferir ficheiro do repositório."}
                    </p>
                  </div>
                </div>
              )}

              {/* Verifying */}
              {installState === "verifying" && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <div>
                    <h3 className="text-xl font-semibold">
                      Verificando integridade...
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {installMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Installing */}
              {installState === "installing" && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <div>
                    <h3 className="text-xl font-semibold">
                      Instalando driver...
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aguarde enquanto o instalador é executado. A permissão de
                      administrador será solicitada.
                    </p>
                  </div>
                </div>
              )}

              {/* Success */}
              {installState === "success" && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">
                      {installMessage || "Driver instalado com sucesso!"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Token instalado com sucesso. Se necessário, reinicie o
                      computador.
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {installState === "error" && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">
                      Falha na instalação
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {installMessage || "Ocorreu um erro desconhecido."}
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button
                      onClick={retryInstallation}
                      variant="outline"
                      className="cursor-pointer"
                    >
                      Tentar novamente
                    </Button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-1">
          <a
            href="https://github.com/Ki3lMigu3l/macos-certificate-middleware-assistant"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground hover:underline"
          >
            Developed by Ezequiel Nascimento
          </a>
          <span>Open Source</span>
        </div>
      </footer>
    </div>
  );
}
