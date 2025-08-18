import type RequestHook from "#module/RequestHook";
import respond from "#response/respond";
import type ResponseLike from "#response/ResponseLike";
import type RouteFunction from "#route/RouteFunction";
import type ServeApp from "#ServeApp";

type GuardError = {
  response: Exclude<ResponseLike, void>;
  type: symbol;
};

const sError = Symbol("guard_error");

export default function(app: ServeApp, guards: RouteFunction[]): RequestHook {
  return async (request, next) => {
    // handle guards
    try {
      for (const guard of guards) {
        const response = await guard(request);
        // @ts-expect-error guard
        if (response !== true) {
          throw {
            response,
            type: sError,
          } as GuardError;
        }
      }

      return next(request);
    } catch (error) {
      const _error = error as GuardError;
      if (_error.type === error) {
        return respond(_error.response)(app, {}, request) as Response;
      }
      // rethrow if not guard error
      throw error;
    }
  };
}
