declare module 'axios' {
  export interface AxiosResponse<T = unknown> {
    data: T;
  }

  export interface AxiosInstance {
    post<T = unknown>(url: string, data?: unknown, config?: unknown): Promise<AxiosResponse<T>>;
    get<T = unknown>(url: string, config?: unknown): Promise<AxiosResponse<T>>;
  }

  export interface AxiosStatic {
    create(config?: unknown): AxiosInstance;
  }

  const axios: AxiosStatic;
  export default axios;
}
