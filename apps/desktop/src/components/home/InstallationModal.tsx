import { AnimatePresence, motion } from "framer-motion";

import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { InstallState } from "@/types/installation.types";

interface Props {
  isOpen: boolean;

  state: InstallState;

  message: string | null;

  platform: "windows" | "macos";

  onClose: () => void;

  onRetry: () => void;
}

export function InstallationModal({
  isOpen,
  state,
  message,
  platform,
  onClose,
  onRetry,
}: Props) {
  const isMac = platform === "macos";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`
            fixed inset-0 z-50
            flex items-center justify-center
            cursor-pointer
            ${isMac ? "modal-backdrop" : "bg-black/50 backdrop-blur-sm"}
          `}
          onClick={onClose}
        >
          <motion.div
            initial={{
              scale: 0.95,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            exit={{
              scale: 0.95,
              opacity: 0,
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className={`
              relative w-full max-w-md
              rounded-xl p-6 shadow-xl
              ${isMac ? "bg-white" : "bg-background"}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {(state === InstallState.SUCCESS ||
              state === InstallState.ERROR) && (
              <button
                onClick={onClose}
                className="
                  absolute right-4 top-4
                  rounded-full p-1
                  hover:bg-muted
                  cursor-pointer
                "
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <ModalContent state={state} message={message} onRetry={onRetry} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ContentProps {
  state: InstallState;

  message: string | null;

  onRetry: () => void;
}

function ModalContent({ state, message, onRetry }: ContentProps) {
  if (state === InstallState.DOWNLOADING) {
    return (
      <LoadingState
        title="Baixando driver."
        description={message ?? "Transferindo ficheiro."}
      />
    );
  }

  if (state === InstallState.VERIFYING) {
    return (
      <LoadingState
        title="Verificando integridade."
        description={message ?? ""}
      />
    );
  }

  if (state === InstallState.INSTALLING) {
    return (
      <LoadingState
        title="Instalando driver."
        description="Permissão de administrador será solicitada."
      />
    );
  }

  if (state === InstallState.SUCCESS) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-500" />

        <div>
          <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">
            {message ?? "Driver instalado com sucesso!"}
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Reinicie o computador se necessário.
          </p>
        </div>
      </div>
    );
  }

  if (state === InstallState.ERROR) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500" />

        <div>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">
            Falha na instalação
          </h3>

          <p className="text-sm text-muted-foreground">
            {message ?? "Erro desconhecido."}
          </p>
        </div>

        <Button onClick={onRetry} variant="outline" className="cursor-pointer">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return null;
}

interface LoadingStateProps {
  title: string;

  description: string;
}

function LoadingState({ title, description }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin" />

      <div>
        <h3 className="text-xl font-semibold">{title}</h3>

        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
