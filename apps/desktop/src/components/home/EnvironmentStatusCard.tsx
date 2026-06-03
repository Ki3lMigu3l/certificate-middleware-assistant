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
          ? "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
          : ""
      }
    >
      <CardHeader>
        <CardTitle>Status do Ambiente</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <StatusRow label="Sistema Operacional" value={environment.os} />

        <StatusRow label="Arquitetura" value={environment.architecture} />

        <StatusRow label="Token" value={environment.token} warning />

        {environment.token === "Not Detected" ? (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }}>
            <Button className="w-full cursor-pointer" onClick={onRetry}>
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
        <p className="font-medium">{label}</p>

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
