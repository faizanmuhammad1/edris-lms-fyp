export type ApiResponse<T = undefined> = {
  status: "success" | "error";
  message: string;
  data?: T;
};
