import { motion } from "framer-motion";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { EnvironmentInfo } from "@/types/environment.types";

interface Props {
  environment: EnvironmentInfo;

  onRetry: () => void;

  isMac: boolean;
}

export function EnvironmentStatusCard({ environment, onRetry, isMac }: Props) {
  return (
    <Card
      className={
        isMac
          ? "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
          : ""
      }
    >
      <CardHeader>
        <CardTitle>Status do Ambiente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={isMac ? "mb-2" : ""}>
          <StatusRow label="Sistema Operacional" value={environment.os} />
        </div>

        <div className={isMac ? "mb-2" : ""}>
          <StatusRow label="Arquitetura" value={environment.architecture} />
        </div>

        <StatusRow label="Token" value={environment.token} warning />

        {environment.token === "Not Detected" ? (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.99 }}>
            <Button
              className={
                isMac
                  ? "w-full cursor-pointer bg-black text-white mt-3 transition-all duration-200 hover:scale-[1.02] hover:bg-zinc-800"
                  : "w-full cursor-pointer "
              }
              onClick={onRetry}
            >
              Retry Token Detection
            </Button>
          </motion.div>
        ) : (
          <Button variant="outline" className="w-full">
            Token Detectado
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface StatusRowProps {
  label: string;
  value: string;
  warning?: boolean;
}

function StatusRow({ label, value, warning }: StatusRowProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="font-semibold">{label}</p>

        <p className="text-sm text-muted-foreground">{value}</p>
      </div>

      {warning ? (
        <AlertTriangle className="h-5 w-5 text-amber-500" />
      ) : (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      )}
    </div>
  );
}
