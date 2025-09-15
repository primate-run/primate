import type RequestHook from "#module/RequestHook";
import type ResponseLike from "#response/ResponseLike";
import type RouteHandler from "#route/Handler";

const sError = Symbol("guard_error");

export default function(guards: RouteHandler[]): RequestHook {
  return async (request, next) => {
    try {
      for (const guard of guards) {
        const response = await guard(request);
        if (response !== null) throw { response, type: sError };
      }

      return next(request);
    } catch (error) {
      const guard_error = error as { response: ResponseLike; type: symbol };
      if (guard_error.type === sError) {
        return { request, response: guard_error.response };
      }
      // rethrow if not guard error
      throw error;
    }
  };
}
