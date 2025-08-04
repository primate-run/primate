type ValidationError<T> =
  T extends object
  ? {
    [K in keyof T]?: {
      message: string;
      messages: string[];
    };
  }
  : {
    message: string;
    messages: string[];
  };

export type { ValidationError as default };
