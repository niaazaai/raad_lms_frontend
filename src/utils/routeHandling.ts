import { show, create, protectedRoutePrefix, search } from "@/routes/base";

/** Base path for protected (dashboard) area */
export const getProtectedRoute = (route?: string) =>
  route ? `/${protectedRoutePrefix}/${route}` : `/${protectedRoutePrefix}`;

/** Path for create sub-route: `${route}/create` */
export const getCreateRoute = (route: string) => `${route}/${create}`;

/** Path for search sub-route: `${route}/search` */
export const getSearchRoute = (route: string) => `${route}/${search}`;

/** Path pattern for show/detail: `${route}/show/:id` */
export const getShowRoute = (route: string, idParamName = "id") =>
  `${route}/${show}/:${idParamName}`;

/** Concrete show URL: `${route}/show/${id}` */
export const makeShowRoute = (route: string, id: number | string) => `${route}/${show}/${id}`;
