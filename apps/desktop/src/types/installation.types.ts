export enum InstallState {
  IDLE = "idle",
  DOWNLOADING = "downloading",
  VERIFYING = "verifying",
  INSTALLING = "installing",
  SUCCESS = "success",
  ERROR = "error",
}

export interface InstallProgressEvent {
  step: "downloading" | "verifying" | "installing" | "completed" | "error";

  message: string;
}
